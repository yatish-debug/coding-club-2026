from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

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
    allow_origins=["*"], # In production, restrict this to the frontend URL
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
    email_input = form_data.username.lower().strip()
    
    # Strictly validate institutional domain format
    if not email_input.endswith("@gfgcoe.codingclub.in"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authentication failed. Only full institutional IDs ending with @gfgcoe.codingclub.in are allowed."
        )
        
    user = crud.get_user_by_email(db, email_input)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect institutional email ID or password",
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


# Health check route
@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "GFGCOE Coding Club Management API"}

