from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
import csv, io, datetime

from database import engine, Base, get_db
import models, schemas, crud, auth, seed

# Initialize database schema
Base.metadata.create_all(bind=engine)

# Seed database on startup
db = next(get_db())
try:
    seed.seed_data(db)
finally:
    db.close()

app = FastAPI(
    title="GFGCOE Coding Club Management API",
    description="Backend API powering events, projects, resources, and committee administration for GFGCOE.",
    version="1.0.0"
)

# Enable CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://coding-club-2026.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health():
    return {"status": "ok"}

# --- AUTHENTICATION ENDPOINTS ---

@app.post("/api/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    input_str = form_data.username.lower().strip()
    
    # Try fetching by username first (supports raw logins like 'admin')
    user = crud.get_user_by_username(db, input_str)
    
    # If not found by username, try fetching by email
    if not user:
        if "@" not in input_str:
            email_input = f"{input_str}@gfgcoe.codingclub.in"
        else:
            email_input = input_str
            
        if not email_input.endswith("@gfgcoe.codingclub.in"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Authentication failed. Only full institutional IDs ending with @gfgcoe.codingclub.in are allowed."
            )
        user = crud.get_user_by_email(db, email_input)
        
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials or unapproved account.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Use email ID as the primary subject claim in the JWT token
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user


# --- PUBLIC RETRIEVAL ENDPOINTS ---

@app.get("/api/events", response_model=List[schemas.EventOut])
def read_events(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_events(db, skip=skip, limit=limit)

@app.get("/api/projects", response_model=List[schemas.ProjectOut])
def read_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_projects(db, skip=skip, limit=limit)

@app.get("/api/committee", response_model=List[schemas.CommitteeOut])
def read_committee(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_committee(db, skip=skip, limit=limit)

# Public announcements noticeboard endpoint
@app.get("/api/announcements", response_model=List[schemas.AnnouncementOut])
def read_announcements(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_announcements(db, skip=skip, limit=limit)

# PROTECTED RESOURCE ENDPOINT: Exclusively for registered active club members!
@app.get("/api/resources", response_model=List[schemas.ResourceOut])
def read_resources(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    return crud.get_resources(db, skip=skip, limit=limit)


# --- MEMBER PORTAL - STUDENT / CORE ACTIONS (Guarded for active users) ---

@app.post("/api/events/{event_id}/register", response_model=schemas.EventRegistrationOut, status_code=status.HTTP_201_CREATED)
def register_member_for_event(
    event_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verify event exists
    event = crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Increment points as participation award (e.g., +30 points!)
    current_user.points += 30
    db.commit()
    
    return crud.create_event_registration(db, current_user.id, event_id)

@app.get("/api/users/me/registrations", response_model=List[schemas.EventRegistrationOut])
def read_my_event_registrations(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    return crud.get_user_registrations(db, current_user.id)

@app.post("/api/users/me/projects", response_model=schemas.ProjectOut, status_code=status.HTTP_201_CREATED)
def upload_student_project(
    project: schemas.ProjectCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    project_dict = project.model_dump()
    project_dict["submitted_by"] = current_user.email
    db_project = models.Project(**project_dict)
    db.add(db_project)
    
    # Increment leaderboard points for engineering a project (+100 points!)
    current_user.points += 100
    db.commit()
    db.refresh(db_project)
    return db_project


# --- ADMIN CRUD - USER ACCOUNTS (Strictly Admin-Only!) ---

@app.get("/api/admin/users", response_model=List[schemas.UserOut])
def read_all_users(
    skip: int = 0, 
    limit: int = 100, 
    current_user: models.User = Depends(auth.get_current_active_admin),
    db: Session = Depends(get_db)
):
    return crud.get_users(db, skip=skip, limit=limit)

@app.post("/api/admin/users", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def create_new_user_account(
    user_data: schemas.UserCreate,
    current_user: models.User = Depends(auth.get_current_active_admin),
    db: Session = Depends(get_db)
):
    if crud.get_user_by_username(db, user_data.username):
        raise HTTPException(status_code=400, detail="Username already registered.")
    if crud.get_user_by_email(db, user_data.email):
        raise HTTPException(status_code=400, detail="Institutional email already registered.")
    return crud.create_user(db, user_data)

@app.put("/api/admin/users/{user_id}", response_model=schemas.UserOut)
def update_user_account(
    user_id: int,
    user_data: schemas.UserUpdate,
    current_user: models.User = Depends(auth.get_current_active_admin),
    db: Session = Depends(get_db)
):
    updated = crud.update_user(db, user_id, user_data)
    if not updated:
        raise HTTPException(status_code=404, detail="User account not found.")
    return updated

@app.delete("/api/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_account(
    user_id: int,
    current_user: models.User = Depends(auth.get_current_active_admin),
    db: Session = Depends(get_db)
):
    deleted = crud.delete_user(db, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User account not found.")
    return


# --- ADMIN/CORE CRUD - ANNOUNCEMENTS ---

@app.post("/api/admin/announcements", response_model=schemas.AnnouncementOut, status_code=status.HTTP_201_CREATED)
def create_new_announcement(
    announcement: schemas.AnnouncementCreate,
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    return crud.create_announcement(db, announcement)

@app.put("/api/admin/announcements/{announcement_id}", response_model=schemas.AnnouncementOut)
def update_existing_announcement(
    announcement_id: int,
    announcement: schemas.AnnouncementUpdate,
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    updated = crud.update_announcement(db, announcement_id, announcement)
    if not updated:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return updated

@app.delete("/api/admin/announcements/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_announcement(
    announcement_id: int,
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    deleted = crud.delete_announcement(db, announcement_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return


# --- ADMIN/CORE CRUD - EVENTS ---

@app.post("/api/admin/events", response_model=schemas.EventOut, status_code=status.HTTP_201_CREATED)
def create_new_event(
    event: schemas.EventCreate,
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    return crud.create_event(db, event)

@app.put("/api/admin/events/{event_id}", response_model=schemas.EventOut)
def update_existing_event(
    event_id: int,
    event: schemas.EventUpdate,
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    updated = crud.update_event(db, event_id, event)
    if not updated:
        raise HTTPException(status_code=404, detail="Event not found")
    return updated

@app.delete("/api/admin/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_event(
    event_id: int,
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    deleted = crud.delete_event(db, event_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Event not found")
    return


# --- ADMIN/CORE CRUD - PROJECTS ---

@app.post("/api/admin/projects", response_model=schemas.ProjectOut, status_code=status.HTTP_201_CREATED)
def create_new_project(
    project: schemas.ProjectCreate,
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    return crud.create_project(db, project)

@app.put("/api/admin/projects/{project_id}", response_model=schemas.ProjectOut)
def update_existing_project(
    project_id: int,
    project: schemas.ProjectUpdate,
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    updated = crud.update_project(db, project_id, project)
    if not updated:
        raise HTTPException(status_code=404, detail="Project not found")
    return updated

@app.delete("/api/admin/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_project(
    project_id: int,
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    deleted = crud.delete_project(db, project_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Project not found")
    return


# --- ADMIN/CORE CRUD - RESOURCES ---

@app.post("/api/admin/resources", response_model=schemas.ResourceOut, status_code=status.HTTP_201_CREATED)
def create_new_resource(
    resource: schemas.ResourceCreate,
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    return crud.create_resource(db, resource)

@app.put("/api/admin/resources/{resource_id}", response_model=schemas.ResourceOut)
def update_existing_resource(
    resource_id: int,
    resource: schemas.ResourceUpdate,
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    updated = crud.update_resource(db, resource_id, resource)
    if not updated:
        raise HTTPException(status_code=404, detail="Resource not found")
    return updated

@app.delete("/api/admin/resources/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_resource(
    resource_id: int,
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    deleted = crud.delete_resource(db, resource_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Resource not found")
    return

@app.post("/api/resources/{id}/download", response_model=schemas.ResourceOut)
def track_resource_download_endpoint(id: int, db: Session = Depends(get_db)):
    updated = crud.track_resource_download(db, id)
    if not updated:
        raise HTTPException(status_code=404, detail="Resource not found")
    return updated


# --- ADMIN-ONLY CRUD - COMMITTEE ---

@app.post("/api/admin/committee", response_model=schemas.CommitteeOut, status_code=status.HTTP_201_CREATED)
def create_new_committee_member(
    member: schemas.CommitteeCreate,
    current_user: models.User = Depends(auth.get_current_active_admin),
    db: Session = Depends(get_db)
):
    return crud.create_committee_member(db, member)

@app.put("/api/admin/committee/{member_id}", response_model=schemas.CommitteeOut)
def update_existing_committee_member(
    member_id: int,
    member: schemas.CommitteeUpdate,
    current_user: models.User = Depends(auth.get_current_active_admin),
    db: Session = Depends(get_db)
):
    updated = crud.update_committee_member(db, member_id, member)
    if not updated:
        raise HTTPException(status_code=404, detail="Committee member not found")
    return updated

@app.delete("/api/admin/committee/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_committee_member(
    member_id: int,
    current_user: models.User = Depends(auth.get_current_active_admin),
    db: Session = Depends(get_db)
):
    deleted = crud.delete_committee_member(db, member_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Committee member not found")
    return


# --- LEADERBOARD & GAMIFICATION ENDPOINTS ---

@app.get("/api/gamification/leaderboard", response_model=List[schemas.LeaderboardEntry])
def get_leaderboard_endpoint(timeframe: str = "all_time", db: Session = Depends(get_db)):
    users = crud.get_users_by_points(db)
    entries = []
    for idx, u in enumerate(users):
        badges = crud.get_user_badges(db, u.id)
        badge_names = [b.badge_name for b in badges]
        entries.append(schemas.LeaderboardEntry(
            rank=idx + 1,
            id=u.id,
            username=u.username,
            full_name=u.full_name,
            points=u.points,
            badges=badge_names,
            streak=0
        ))
    return entries

@app.get("/api/users/me/gamification", response_model=schemas.UserGamificationOut)
def get_user_gamification(current_user: models.User = Depends(auth.get_current_active_user), db: Session = Depends(get_db)):
    rank = crud.get_user_rank(db, current_user.id)
    total_users = db.query(models.User).filter(models.User.role == "student").count()
    rsvp_count = db.query(models.EventRegistration).filter(models.EventRegistration.user_id == current_user.id).count()
    project_count = db.query(models.Project).filter(models.Project.submitted_by == current_user.email).count()
    
    badges_db = crud.get_user_badges(db, current_user.id)
    badges_list = [{"badge_name": b.badge_name, "badge_icon": b.badge_icon} for b in badges_db]
    
    achievements_config = [
        {"id": "first_rsvp", "title": "First Steps", "description": "RSVP to your first club event!", "badge_name": "Explorer", "badge_icon": "🎯", "target": 1, "current": rsvp_count},
        {"id": "five_rsvps", "title": "Event Enthusiast", "description": "RSVP to 5 club events!", "badge_name": "Loyal Member", "badge_icon": "🔥", "target": 5, "current": rsvp_count},
        {"id": "first_project", "title": "Creator", "description": "Submit your first project!", "badge_name": "Builder", "badge_icon": "💻", "target": 1, "current": project_count},
        {"id": "century_points", "title": "Centurion", "description": "Earn 100 leaderboard points!", "badge_name": "Rising Star", "badge_icon": "⭐", "target": 100, "current": current_user.points}
    ]
    
    achievements_out = []
    for ach in achievements_config:
        is_unlocked = ach["current"] >= ach["target"]
        if is_unlocked:
            existing_badge = db.query(models.Badge).filter(
                models.Badge.user_id == current_user.id,
                models.Badge.badge_name == ach["badge_name"]
            ).first()
            if not existing_badge:
                new_badge = models.Badge(
                    user_id=current_user.id,
                    badge_name=ach["badge_name"],
                    badge_icon=ach["badge_icon"]
                )
                db.add(new_badge)
                
                ach_log = models.Achievement(
                    user_id=current_user.id,
                    achievement_id=ach["id"]
                )
                db.add(ach_log)
                db.commit()
                badges_db = crud.get_user_badges(db, current_user.id)
                badges_list = [{"badge_name": b.badge_name, "badge_icon": b.badge_icon} for b in badges_db]
                
        achievements_out.append(schemas.AchievementStatus(
            id=ach["id"],
            title=ach["title"],
            description=ach["description"],
            badge_name=ach["badge_name"],
            badge_icon=ach["badge_icon"],
            is_unlocked=is_unlocked,
            progress_current=ach["current"],
            progress_target=ach["target"]
        ))
        
    return schemas.UserGamificationOut(
        points=current_user.points,
        rank=rank,
        total_users=total_users if total_users > 0 else 1,
        rsvp_count=rsvp_count,
        project_count=project_count,
        achievements=achievements_out,
        badges=badges_list,
        streak=0
    )


# --- GUEST REGISTRATION & APPROVAL WORKFLOW ENDPOINTS ---

@app.post("/api/auth/guest-register", response_model=schemas.ApprovalRequestOut)
def guest_register_endpoint(request_data: schemas.ApprovalRequestCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_username(db, request_data.username):
        raise HTTPException(status_code=400, detail="Username already registered.")
    
    gen_email = f"{request_data.username.lower()}@gfgcoe.codingclub.in"
    if crud.get_user_by_email(db, gen_email):
        raise HTTPException(status_code=400, detail="An account with this institutional email ID already exists.")
        
    existing_req = crud.get_approval_request_by_username(db, request_data.username)
    if existing_req:
        raise HTTPException(status_code=400, detail="A registration request for this username is already pending or completed.")
        
    return crud.create_approval_request(db, request_data)

@app.get("/api/auth/guest-status/{username}", response_model=schemas.ApprovalRequestOut)
def guest_status_endpoint(username: str, db: Session = Depends(get_db)):
    req = crud.get_approval_request_by_username(db, username)
    if not req:
        raise HTTPException(status_code=404, detail="Registration request not found for this username.")
    return req

@app.get("/api/admin/approval-requests", response_model=List[schemas.ApprovalRequestOut])
def list_approval_requests_endpoint(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(auth.get_current_active_admin),
    db: Session = Depends(get_db)
):
    return crud.get_approval_requests(db, skip=skip, limit=limit)

@app.post("/api/admin/approval-requests/{id}/approve", response_model=schemas.ApprovalRequestOut)
def approve_guest_request_endpoint(
    id: int,
    current_user: models.User = Depends(auth.get_current_active_admin),
    db: Session = Depends(get_db)
):
    req = db.query(models.ApprovalRequest).filter(models.ApprovalRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found.")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}.")
        
    email = f"{req.username.lower()}@gfgcoe.codingclub.in"
    if crud.get_user_by_username(db, req.username) or crud.get_user_by_email(db, email):
        req.status = "approved"
        db.commit()
        raise HTTPException(status_code=400, detail="User account or email is already registered.")
        
    new_user = models.User(
        username=req.username,
        email=email,
        full_name=req.full_name,
        role="student",
        hashed_password=req.password_hash,
        is_active=True,
        points=0
    )
    db.add(new_user)
    
    req.status = "approved"
    db.commit()
    db.refresh(req)
    return req

@app.post("/api/admin/approval-requests/{id}/reject", response_model=schemas.ApprovalRequestOut)
def reject_guest_request_endpoint(
    id: int,
    current_user: models.User = Depends(auth.get_current_active_admin),
    db: Session = Depends(get_db)
):
    req = db.query(models.ApprovalRequest).filter(models.ApprovalRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found.")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}.")
        
    req.status = "rejected"
    db.commit()
    db.refresh(req)
    return req


# --- CONTEST ENDPOINTS ---

@app.get("/api/contests", response_model=List[schemas.ContestOut])
def get_contests_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    contests = crud.get_contests(db, skip=skip, limit=limit)
    for c in contests:
        c.questions = crud.get_contest_questions(db, c.id)
    return contests

@app.get("/api/contests/{contest_id}/questions", response_model=List[schemas.ContestQuestionOut])
def get_contest_questions_endpoint(contest_id: int, db: Session = Depends(get_db)):
    contest = crud.get_contest(db, contest_id)
    if not contest:
        raise HTTPException(status_code=404, detail="Contest not found.")
    return crud.get_contest_questions(db, contest_id)

@app.post("/api/admin/contests", response_model=schemas.ContestOut, status_code=status.HTTP_201_CREATED)
def create_contest_endpoint(
    contest: schemas.ContestCreate,
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    return crud.create_contest(db, contest)

@app.put("/api/admin/contests/{id}", response_model=schemas.ContestOut)
def update_contest_endpoint(
    id: int,
    contest: schemas.ContestCreate,
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    updated = crud.update_contest(db, id, contest)
    if not updated:
        raise HTTPException(status_code=404, detail="Contest not found.")
    return updated

@app.delete("/api/admin/contests/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contest_endpoint(
    id: int,
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    deleted = crud.delete_contest(db, id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Contest not found.")
    return

@app.post("/api/admin/contests/{contest_id}/questions", response_model=schemas.ContestQuestionOut, status_code=status.HTTP_201_CREATED)
def create_contest_question_endpoint(
    contest_id: int,
    question: schemas.ContestQuestionCreate,
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    contest = crud.get_contest(db, contest_id)
    if not contest:
        raise HTTPException(status_code=404, detail="Contest not found.")
    return crud.create_contest_question(db, contest_id, question)

@app.delete("/api/admin/contests/questions/{qId}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contest_question_endpoint(
    qId: int,
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    deleted = crud.delete_contest_question(db, qId)
    if not deleted:
        raise HTTPException(status_code=404, detail="Question not found.")
    return


# --- POINT CLAIMS ENDPOINTS ---

@app.post("/api/users/me/claims", response_model=schemas.PointClaimOut, status_code=status.HTTP_201_CREATED)
def submit_point_claim_endpoint(
    claim: schemas.PointClaimCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    return crud.create_point_claim(db, current_user.id, claim)

@app.get("/api/users/me/claims", response_model=List[schemas.PointClaimOut])
def get_my_claims_endpoint(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    return crud.get_user_claims(db, current_user.id)

@app.get("/api/admin/claims", response_model=List[schemas.PointClaimOut])
def get_admin_claims_endpoint(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    return crud.get_all_claims(db, skip=skip, limit=limit)

@app.post("/api/admin/claims/{claim_id}/resolve", response_model=schemas.PointClaimOut)
def resolve_point_claim_endpoint(
    claim_id: int,
    resolution: schemas.PointClaimResolve,
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    claim = db.query(models.PointClaim).filter(models.PointClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Point claim not found.")
    return crud.resolve_point_claim(db, claim_id, resolution)


# --- CMS SETTINGS ENDPOINTS ---
@app.get("/api/cms")
def get_public_cms(db: Session = Depends(get_db)):
    settings = crud.get_cms_settings(db)
    return {s.key: s.value for s in settings}

@app.get("/api/admin/cms", response_model=List[schemas.CmsSettingOut])
def get_cms_settings_endpoint(
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    return crud.get_cms_settings(db)

@app.post("/api/admin/cms", response_model=schemas.CmsSettingOut)
def update_cms_setting_endpoint(
    setting: schemas.CmsSettingCreate,
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    return crud.set_cms_setting(db, setting.key, setting.value, setting.category)

# --- CLUB ACHIEVEMENTS ENDPOINTS ---
@app.get("/api/achievements", response_model=List[schemas.ClubAchievementOut])
def get_club_achievements_endpoint(db: Session = Depends(get_db)):
    return crud.get_club_achievements(db)

@app.post("/api/admin/achievements", response_model=schemas.ClubAchievementOut, status_code=status.HTTP_201_CREATED)
def create_club_achievement_endpoint(
    ach: schemas.ClubAchievementCreate,
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    return crud.create_club_achievement(db, ach)

@app.put("/api/admin/achievements/{id}", response_model=schemas.ClubAchievementOut)
def update_club_achievement_endpoint(
    id: int,
    ach: schemas.ClubAchievementUpdate,
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    updated = crud.update_club_achievement(db, id, ach)
    if not updated:
        raise HTTPException(status_code=404, detail="Club achievement not found.")
    return updated

@app.delete("/api/admin/achievements/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_club_achievement_endpoint(
    id: int,
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    deleted = crud.delete_club_achievement(db, id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Club achievement not found.")
    return

# --- EXECUTIVE TELEMETRY ANALYTICS ENDPOINT ---
@app.get("/api/admin/analytics")
def get_analytics(
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    total_members = db.query(models.User).count()
    student_count = db.query(models.User).filter(models.User.role == "student").count()
    core_count = db.query(models.User).filter(models.User.role == "core").count()
    
    events_count = db.query(models.Event).count()
    total_rsvps = db.query(models.EventRegistration).count()
    
    tech_counts = {}
    projects = db.query(models.Project).all()
    for p in projects:
        if p.tech_stack:
            tags = [t.strip() for t in p.tech_stack.split(",") if t.strip()]
            for tag in tags:
                tech_counts[tag] = tech_counts.get(tag, 0) + 1
    tech_dist = [{"name": k, "value": v} for k, v in tech_counts.items()]
    
    events = db.query(models.Event).all()
    event_parts = []
    for ev in events:
        count = db.query(models.EventRegistration).filter(models.EventRegistration.event_id == ev.id).count()
        event_parts.append({"name": ev.title[:15], "value": count})
        
    status_counts = {}
    for p in projects:
        st = p.status or "Completed"
        status_counts[st] = status_counts.get(st, 0) + 1
    project_trends = [{"name": k, "value": v} for k, v in status_counts.items()]
    
    member_growth = [
        {"name": "Jan", "value": max(5, int(student_count * 0.2))},
        {"name": "Feb", "value": max(15, int(student_count * 0.4))},
        {"name": "Mar", "value": max(28, int(student_count * 0.6))},
        {"name": "Apr", "value": max(45, int(student_count * 0.8))},
        {"name": "May", "value": student_count}
    ]
    
    return {
        "total_members": total_members,
        "student_count": student_count,
        "core_count": core_count,
        "events_count": events_count,
        "total_rsvps": total_rsvps,
        "tech_distribution": tech_dist,
        "event_participation": event_parts,
        "project_trends": project_trends,
        "member_growth": member_growth
    }

# --- CODING PROFILE AGGREGATOR ENDPOINTS ---

def is_user_eligible_committee(user: models.User) -> bool:
    if not user:
        return False
    role_lower = user.role.lower().strip()
    return role_lower in ["admin", "super_admin", "super admin", "coordinator", "core", "core_team", "core team"]

@app.get("/api/coding-profiles", response_model=List[schemas.CodingProfileOut])
def get_coding_profiles_endpoint(db: Session = Depends(get_db)):
    return crud.get_coding_profiles(db)

@app.post("/api/coding-profiles/my", response_model=schemas.CodingProfileOut)
def update_my_coding_profile(
    profile: schemas.CodingProfileBase,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if not is_user_eligible_committee(current_user):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coding profile tracking is exclusively restricted to active committee members."
        )
    return crud.create_or_update_coding_profile(db, current_user.id, profile)

@app.get("/api/committee-leaderboard", response_model=List[schemas.CodingProfileOut])
def get_committee_leaderboard_endpoint(db: Session = Depends(get_db)):
    # Check CMS setting for alumni inclusion
    alumni_setting = crud.get_cms_setting(db, "include_alumni_in_coding_leaderboard")
    include_alumni = False
    if alumni_setting and alumni_setting.value.lower().strip() == "true":
        include_alumni = True
        
    return crud.get_committee_coding_leaderboard(db, include_alumni=include_alumni)

@app.get("/api/admin/committee-leaderboard/stats")
def get_committee_leaderboard_stats(
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    # Check CMS setting for alumni
    alumni_setting = crud.get_cms_setting(db, "include_alumni_in_coding_leaderboard")
    include_alumni = False
    if alumni_setting and alumni_setting.value.lower().strip() == "true":
        include_alumni = True
        
    leaderboard = crud.get_committee_coding_leaderboard(db, include_alumni=include_alumni)
    total_profiles = db.query(models.CodingProfile).count()
    tracked_count = len(leaderboard)
    active_count = len([p for p in leaderboard if p.overall_score > 0])
    
    top_coder_name = "None"
    top_coder_score = 0
    if len(leaderboard) > 0:
        top_coder_name = leaderboard[0].user_fullname
        top_coder_score = leaderboard[0].overall_score
        
    # Get Monthly Champion from latest monthly snapshot or default to Top Coder
    monthly_champion = "None"
    snapshots = db.query(models.LeaderboardSnapshot).filter(models.LeaderboardSnapshot.snapshot_type == "monthly").order_by(models.LeaderboardSnapshot.snapshot_date.desc()).all()
    if len(snapshots) > 0:
        try:
            snap_data = json.loads(snapshots[0].data)
            if len(snap_data) > 0:
                monthly_champion = f"{snap_data[0].get('full_name', 'Unknown')} ({snap_data[0].get('overall_score', 0)} PTS)"
        except Exception:
            pass
    if monthly_champion == "None" and len(leaderboard) > 0:
        monthly_champion = f"{top_coder_name} ({top_coder_score} PTS)"
        
    return {
        "committee_members_tracked": tracked_count,
        "top_coder": f"{top_coder_name} ({top_coder_score} PTS)" if top_coder_score > 0 else "None",
        "total_coding_profiles": total_profiles,
        "active_coding_members": active_count,
        "monthly_coding_champion": monthly_champion
    }

@app.post("/api/admin/leaderboard/recalculate")
def recalculate_standings_endpoint(
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    profiles = db.query(models.CodingProfile).all()
    for p in profiles:
        crud.sync_coding_profile_metrics(db, p)
    return {"status": "success", "synced_count": len(profiles)}

@app.post("/api/admin/leaderboard/reset")
def reset_leaderboard_endpoint(
    reset_data: schemas.LeaderboardReset,
    current_user: models.User = Depends(auth.get_current_active_admin),
    db: Session = Depends(get_db)
):
    alumni_setting = crud.get_cms_setting(db, "include_alumni_in_coding_leaderboard")
    include_alumni = False
    if alumni_setting and alumni_setting.value.lower().strip() == "true":
        include_alumni = True
        
    db_snap = crud.reset_leaderboard_scores(db, reset_data.snapshot_type, reset_data.name, include_alumni=include_alumni)
    return {"status": "success", "snapshot_name": db_snap.name, "snapshot_id": db_snap.id}

@app.get("/api/admin/leaderboard/snapshots", response_model=List[schemas.LeaderboardSnapshotOut])
def get_leaderboard_snapshots_endpoint(
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    return crud.get_leaderboard_snapshots(db)

@app.post("/api/admin/leaderboard/snapshots/{id}/restore")
def restore_leaderboard_snapshot_endpoint(
    id: int,
    current_user: models.User = Depends(auth.get_current_active_admin),
    db: Session = Depends(get_db)
):
    db_snap = crud.restore_leaderboard_snapshot(db, id)
    if not db_snap:
        raise HTTPException(status_code=404, detail="Snapshot not found.")
    return {"status": "success", "restored_name": db_snap.name}

# --- ADMIN CRUD - CODING PROFILES ---

@app.post("/api/admin/coding-profiles", response_model=schemas.CodingProfileOut, status_code=status.HTTP_201_CREATED)
def create_coding_profile_admin(
    profile: schemas.CodingProfileCreate,
    current_user: models.User = Depends(auth.get_current_active_admin),
    db: Session = Depends(get_db)
):
    target_user = crud.get_user(db, profile.user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found.")
        
    if not is_user_eligible_committee(target_user):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coding profile tracking is exclusively restricted to active committee members."
        )
        
    existing = crud.get_coding_profile_by_user(db, profile.user_id)
    if existing:
        raise HTTPException(status_code=400, detail="This user already has a coding profile.")
        
    return crud.create_or_update_coding_profile(db, profile.user_id, profile)

@app.put("/api/admin/coding-profiles/{id}", response_model=schemas.CodingProfileOut)
def update_coding_profile_admin(
    id: int,
    profile: schemas.CodingProfileUpdate,
    current_user: models.User = Depends(auth.get_current_active_admin),
    db: Session = Depends(get_db)
):
    db_prof = crud.get_coding_profile(db, id)
    if not db_prof:
        raise HTTPException(status_code=404, detail="Coding profile not found.")
    return crud.create_or_update_coding_profile(db, db_prof.user_id, profile)

@app.delete("/api/admin/coding-profiles/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_coding_profile_admin(
    id: int,
    current_user: models.User = Depends(auth.get_current_active_admin),
    db: Session = Depends(get_db)
):
    deleted = crud.delete_coding_profile(db, id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Coding profile not found.")
    return

@app.post("/api/admin/coding-profiles/{id}/sync", response_model=schemas.CodingProfileOut)
def sync_single_profile_endpoint(
    id: int,
    current_user: models.User = Depends(auth.get_current_active_admin),
    db: Session = Depends(get_db)
):
    db_prof = crud.get_coding_profile(db, id)
    if not db_prof:
        raise HTTPException(status_code=404, detail="Coding profile not found.")
    return crud.sync_coding_profile_metrics(db, db_prof)

@app.post("/api/admin/coding-profiles/{id}/toggle-tracking")
def toggle_profile_tracking(
    id: int,
    current_user: models.User = Depends(auth.get_current_active_admin),
    db: Session = Depends(get_db)
):
    db_prof = crud.get_coding_profile(db, id)
    if not db_prof:
        raise HTTPException(status_code=404, detail="Coding profile not found.")
    db_prof.is_tracking_enabled = not db_prof.is_tracking_enabled
    db.commit()
    return {"status": "success", "is_tracking_enabled": db_prof.is_tracking_enabled}

@app.post("/api/admin/coding-profiles/sync")
def sync_coding_profiles_endpoint(
    current_user: models.User = Depends(auth.get_current_active_core_or_admin),
    db: Session = Depends(get_db)
):
    profiles = db.query(models.CodingProfile).filter(models.CodingProfile.is_tracking_enabled == True).all()
    synced_count = 0
    for p in profiles:
        target_user = crud.get_user(db, p.user_id)
        if target_user and (is_user_eligible_committee(target_user) or target_user.role.lower().strip() == "alumni"):
            crud.sync_coding_profile_metrics(db, p)
            synced_count += 1
            
    return {"status": "success", "synced_count": synced_count}


# --- MEMBERS CSV BULK IMPORT/EXPORT ENDPOINTS ---
@app.get("/api/admin/users/export")
def export_users_csv(
    current_user: models.User = Depends(auth.get_current_active_admin),
    db: Session = Depends(get_db)
):
    users = db.query(models.User).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "username", "email", "full_name", "role", "is_active", "points", 
        "branch", "academic_year", "position", "bio", "skills", "github", "linkedin"
    ])
    for u in users:
        writer.writerow([
            u.username, u.email, u.full_name or "", u.role, u.is_active, u.points,
            u.branch or "", u.academic_year or "", u.position or "", 
            u.bio or "", u.skills or "", u.github or "", u.linkedin or ""
        ])
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=members_export.csv"}
    )

@app.post("/api/admin/users/import")
async def import_users_csv(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_active_admin),
    db: Session = Depends(get_db)
):
    content = await file.read()
    decoded = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(decoded))
    imported_count = 0
    errors = []
    for row in reader:
        username = row.get("username", "").strip()
        email = row.get("email", "").strip()
        if not username or not email:
            errors.append(f"Row {reader.line_num} missing username or email.")
            continue
        if not email.lower().endswith("@gfgcoe.codingclub.in"):
            errors.append(f"Row {reader.line_num}: email domain must end with @gfgcoe.codingclub.in.")
            continue
        existing = db.query(models.User).filter((models.User.username == username) | (models.User.email == email)).first()
        if existing:
            existing.full_name = row.get("full_name", existing.full_name)
            existing.role = row.get("role", existing.role)
            existing.branch = row.get("branch", existing.branch)
            existing.academic_year = row.get("academic_year", existing.academic_year)
            existing.position = row.get("position", existing.position)
            existing.bio = row.get("bio", existing.bio)
            existing.skills = row.get("skills", existing.skills)
            existing.github = row.get("github", existing.github)
            existing.linkedin = row.get("linkedin", existing.linkedin)
        else:
            new_user = models.User(
                username=username,
                email=email,
                full_name=row.get("full_name", ""),
                role=row.get("role", "student"),
                hashed_password=auth.get_password_hash("Member@123"),
                branch=row.get("branch", ""),
                academic_year=row.get("academic_year", ""),
                position=row.get("position", ""),
                bio=row.get("bio", ""),
                skills=row.get("skills", ""),
                github=row.get("github", ""),
                linkedin=row.get("linkedin", ""),
                is_active=True,
                points=0
            )
            db.add(new_user)
        imported_count += 1
    db.commit()
    return {"status": "success", "imported": imported_count, "errors": errors}

# Health check route
@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "GFGCOE Coding Club Management API"}

