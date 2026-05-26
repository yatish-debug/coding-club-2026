from sqlalchemy.orm import Session
import models, schemas, auth
import datetime
import html
import re
from typing import Optional

def sanitize_text(value: str) -> str:
    if not isinstance(value, str):
        return value
    # Strip HTML tags to mitigate XSS
    clean = re.sub(r'<[^>]*>', '', value)
    return html.escape(clean)

def log_event(db: Session, action: str, username: Optional[str] = None, ip_address: Optional[str] = None, details: Optional[str] = None):
    try:
        db_log = models.AuditLog(
            action=action,
            username=username,
            ip_address=ip_address,
            details=details
        )
        db.add(db_log)
        db.commit()
    except Exception as e:
        print(f"Failed to record audit log: {e}")

def get_audit_logs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

# --- USER CRUD ---
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        username=sanitize_text(user.username),
        email=sanitize_text(user.email),
        full_name=sanitize_text(user.full_name),
        role=user.role,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user: schemas.UserUpdate):
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    update_data = user.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = auth.get_password_hash(update_data.pop("password"))
    for key, value in update_data.items():
        if isinstance(value, str):
            value = sanitize_text(value)
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    if not db_user:
        return False
    db.delete(db_user)
    db.commit()
    return True

# --- EVENT CRUD ---
def get_event(db: Session, event_id: int):
    return db.query(models.Event).filter(models.Event.id == event_id).first()

def get_events(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Event).order_by(models.Event.date.desc()).offset(skip).limit(limit).all()

def create_event(db: Session, event: schemas.EventCreate):
    event_dict = event.model_dump()
    for key, value in event_dict.items():
        if isinstance(value, str):
            event_dict[key] = sanitize_text(value)
    db_event = models.Event(**event_dict)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def update_event(db: Session, event_id: int, event: schemas.EventUpdate):
    db_event = get_event(db, event_id)
    if not db_event:
        return None
    for key, value in event.model_dump(exclude_unset=True).items():
        if isinstance(value, str):
            value = sanitize_text(value)
        setattr(db_event, key, value)
    db.commit()
    db.refresh(db_event)
    return db_event

def delete_event(db: Session, event_id: int):
    db_event = get_event(db, event_id)
    if not db_event:
        return False
    db.delete(db_event)
    db.commit()
    return True

# --- PROJECT CRUD ---
def get_project(db: Session, project_id: int):
    return db.query(models.Project).filter(models.Project.id == project_id).first()

def get_projects(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Project).offset(skip).limit(limit).all()

def create_project(db: Session, project: schemas.ProjectCreate):
    proj_dict = project.model_dump()
    for key, value in proj_dict.items():
        if isinstance(value, str):
            proj_dict[key] = sanitize_text(value)
    db_project = models.Project(**proj_dict)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

def update_project(db: Session, project_id: int, project: schemas.ProjectUpdate):
    db_project = get_project(db, project_id)
    if not db_project:
        return None
    for key, value in project.model_dump(exclude_unset=True).items():
        if isinstance(value, str):
            value = sanitize_text(value)
        setattr(db_project, key, value)
    db.commit()
    db.refresh(db_project)
    return db_project

def delete_project(db: Session, project_id: int):
    db_project = get_project(db, project_id)
    if not db_project:
        return False
    db.delete(db_project)
    db.commit()
    return True

# --- COMMITTEE CRUD ---
def get_committee_member(db: Session, member_id: int):
    return db.query(models.Committee).filter(models.Committee.id == member_id).first()

def get_committee(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Committee).offset(skip).limit(limit).all()

def create_committee_member(db: Session, member: schemas.CommitteeCreate):
    member_dict = member.model_dump()
    for key, value in member_dict.items():
        if isinstance(value, str):
            member_dict[key] = sanitize_text(value)
    db_member = models.Committee(**member_dict)
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member

def update_committee_member(db: Session, member_id: int, member: schemas.CommitteeUpdate):
    db_member = get_committee_member(db, member_id)
    if not db_member:
        return None
    for key, value in member.model_dump(exclude_unset=True).items():
        if isinstance(value, str):
            value = sanitize_text(value)
        setattr(db_member, key, value)
    db.commit()
    db.refresh(db_member)
    return db_member

def delete_committee_member(db: Session, member_id: int):
    db_member = get_committee_member(db, member_id)
    if not db_member:
        return False
    db.delete(db_member)
    db.commit()
    return True

# --- RESOURCE CRUD ---
def get_resource(db: Session, resource_id: int):
    return db.query(models.Resource).filter(models.Resource.id == resource_id).first()

def get_resources(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Resource).offset(skip).limit(limit).all()

def create_resource(db: Session, resource: schemas.ResourceCreate):
    res_dict = resource.model_dump()
    for key, value in res_dict.items():
        if isinstance(value, str) and key != "content":
            res_dict[key] = sanitize_text(value)
    db_resource = models.Resource(**res_dict)
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    return db_resource

def update_resource(db: Session, resource_id: int, resource: schemas.ResourceUpdate):
    db_resource = get_resource(db, resource_id)
    if not db_resource:
        return None
    for key, value in resource.model_dump(exclude_unset=True).items():
        if isinstance(value, str) and key != "content":
            value = sanitize_text(value)
        setattr(db_resource, key, value)
    db.commit()
    db.refresh(db_resource)
    return db_resource

def track_resource_download(db: Session, resource_id: int):
    db_resource = get_resource(db, resource_id)
    if not db_resource:
        return None
    db_resource.download_count = (db_resource.download_count or 0) + 1
    db.commit()
    db.refresh(db_resource)
    return db_resource

def delete_resource(db: Session, resource_id: int):
    db_resource = get_resource(db, resource_id)
    if not db_resource:
        return False
    db.delete(db_resource)
    db.commit()
    return True

# --- ANNOUNCEMENT CRUD ---
def get_announcement(db: Session, announcement_id: int):
    return db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()

def get_announcements(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Announcement).order_by(
        models.Announcement.is_pinned.desc(),
        models.Announcement.date_created.desc()
    ).offset(skip).limit(limit).all()

def create_announcement(db: Session, announcement: schemas.AnnouncementCreate):
    ann_dict = announcement.model_dump()
    for key, value in ann_dict.items():
        if isinstance(value, str):
            ann_dict[key] = sanitize_text(value)
    db_announcement = models.Announcement(**ann_dict)
    db.add(db_announcement)
    db.commit()
    db.refresh(db_announcement)
    return db_announcement

def update_announcement(db: Session, announcement_id: int, announcement: schemas.AnnouncementUpdate):
    db_announcement = get_announcement(db, announcement_id)
    if not db_announcement:
        return None
    for key, value in announcement.model_dump(exclude_unset=True).items():
        if isinstance(value, str):
            value = sanitize_text(value)
        setattr(db_announcement, key, value)
    db.commit()
    db.refresh(db_announcement)
    return db_announcement

def delete_announcement(db: Session, announcement_id: int):
    db_announcement = get_announcement(db, announcement_id)
    if not db_announcement:
        return False
    db.delete(db_announcement)
    db.commit()
    return True

# --- EVENT REGISTRATION (RSVP) CRUD ---
def create_event_registration(db: Session, user_id: int, event_id: int):
    existing = db.query(models.EventRegistration).filter(
        models.EventRegistration.user_id == user_id,
        models.EventRegistration.event_id == event_id
    ).first()
    if existing:
        # Attach event to the in-memory object so Pydantic serializes nested structures cleanly
        existing.event = db.query(models.Event).filter(models.Event.id == event_id).first()
        return existing
        
    db_reg = models.EventRegistration(user_id=user_id, event_id=event_id)
    db.add(db_reg)
    db.commit()
    db.refresh(db_reg)
    
    # Attach event metadata
    db_reg.event = db.query(models.Event).filter(models.Event.id == event_id).first()
    return db_reg

def get_user_registrations(db: Session, user_id: int):
    registrations = db.query(models.EventRegistration).filter(
        models.EventRegistration.user_id == user_id
    ).all()
    for reg in registrations:
        reg.event = db.query(models.Event).filter(models.Event.id == reg.event_id).first()
    return registrations

def delete_event_registration(db: Session, user_id: int, event_id: int):
    db_reg = db.query(models.EventRegistration).filter(
        models.EventRegistration.user_id == user_id,
        models.EventRegistration.event_id == event_id
    ).first()
    if not db_reg:
        return False
    db.delete(db_reg)
    db.commit()
    return True


# --- LEADERBOARD & GAMIFICATION CRUD ---
def get_users_by_points(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).filter(models.User.role == "student").order_by(models.User.points.desc()).offset(skip).limit(limit).all()

def get_user_badges(db: Session, user_id: int):
    return db.query(models.Badge).filter(models.Badge.user_id == user_id).all()

def get_user_achievements(db: Session, user_id: int):
    return db.query(models.Achievement).filter(models.Achievement.user_id == user_id).all()

def get_user_rank(db: Session, user_id: int) -> int:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return 0
    higher_points_count = db.query(models.User).filter(
        models.User.role == "student",
        models.User.points > user.points
    ).count()
    return higher_points_count + 1


# --- GUEST APPROVALS CRUD ---
def create_approval_request(db: Session, request_data: schemas.ApprovalRequestCreate):
    db_request = models.ApprovalRequest(
        full_name=sanitize_text(request_data.full_name),
        college_name=sanitize_text(request_data.college_name),
        branch=sanitize_text(request_data.branch),
        academic_year=sanitize_text(request_data.academic_year),
        username=sanitize_text(request_data.username),
        password_hash=auth.get_password_hash(request_data.password),
        status="pending"
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

def get_approval_request_by_username(db: Session, username: str):
    return db.query(models.ApprovalRequest).filter(models.ApprovalRequest.username == username).first()

def get_approval_requests(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.ApprovalRequest).order_by(models.ApprovalRequest.created_at.desc()).offset(skip).limit(limit).all()

def resolve_approval_request(db: Session, request_id: int, status: str):
    db_request = db.query(models.ApprovalRequest).filter(models.ApprovalRequest.id == request_id).first()
    if not db_request:
        return None
    db_request.status = status
    db.commit()
    db.refresh(db_request)
    return db_request


# --- CONTESTS CRUD ---
def get_contests(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Contest).order_by(models.Contest.start_time.desc()).offset(skip).limit(limit).all()

def get_contest(db: Session, contest_id: int):
    return db.query(models.Contest).filter(models.Contest.id == contest_id).first()

def create_contest(db: Session, contest: schemas.ContestCreate):
    contest_dict = contest.model_dump()
    for key, value in contest_dict.items():
        if isinstance(value, str):
            contest_dict[key] = sanitize_text(value)
    db_contest = models.Contest(**contest_dict)
    db.add(db_contest)
    db.commit()
    db.refresh(db_contest)
    return db_contest

def update_contest(db: Session, contest_id: int, contest: schemas.ContestCreate):
    db_contest = get_contest(db, contest_id)
    if not db_contest:
        return None
    for key, value in contest.model_dump(exclude_unset=True).items():
        if isinstance(value, str):
            value = sanitize_text(value)
        setattr(db_contest, key, value)
    db.commit()
    db.refresh(db_contest)
    return db_contest

def delete_contest(db: Session, contest_id: int):
    db_contest = get_contest(db, contest_id)
    if not db_contest:
        return False
    db.delete(db_contest)
    db.commit()
    return True

def get_contest_questions(db: Session, contest_id: int):
    return db.query(models.ContestQuestion).filter(models.ContestQuestion.contest_id == contest_id).all()

def create_contest_question(db: Session, contest_id: int, question: schemas.ContestQuestionCreate):
    q_dict = question.model_dump()
    for key, value in q_dict.items():
        if isinstance(value, str):
            q_dict[key] = sanitize_text(value)
    q_dict["contest_id"] = contest_id
    db_question = models.ContestQuestion(**q_dict)
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question

def delete_contest_question(db: Session, question_id: int):
    db_question = db.query(models.ContestQuestion).filter(models.ContestQuestion.id == question_id).first()
    if not db_question:
        return False
    db.delete(db_question)
    db.commit()
    return True


# --- POINT CLAIMS CRUD ---
def create_point_claim(db: Session, user_id: int, claim: schemas.PointClaimCreate):
    claim_dict = claim.model_dump()
    for key, value in claim_dict.items():
        if isinstance(value, str):
            claim_dict[key] = sanitize_text(value)
    claim_dict["user_id"] = user_id
    claim_dict["status"] = "pending"
    db_claim = models.PointClaim(**claim_dict)
    db.add(db_claim)
    db.commit()
    db.refresh(db_claim)
    return db_claim

def get_user_claims(db: Session, user_id: int):
    return db.query(models.PointClaim).filter(models.PointClaim.user_id == user_id).order_by(models.PointClaim.created_at.desc()).all()

def get_all_claims(db: Session, skip: int = 0, limit: int = 100):
    claims = db.query(models.PointClaim).order_by(models.PointClaim.created_at.desc()).offset(skip).limit(limit).all()
    for claim in claims:
        user = db.query(models.User).filter(models.User.id == claim.user_id).first()
        claim.user_username = user.username if user else "Unknown"
    return claims

def resolve_point_claim(db: Session, claim_id: int, resolution: schemas.PointClaimResolve):
    db_claim = db.query(models.PointClaim).filter(models.PointClaim.id == claim_id).first()
    if not db_claim:
        return None
    db_claim.status = resolution.status
    if resolution.admin_notes:
        db_claim.admin_notes = sanitize_text(resolution.admin_notes)
    
    if resolution.status == "approved":
        user = db.query(models.User).filter(models.User.id == db_claim.user_id).first()
        if user:
            points_to_award = resolution.points_awarded if resolution.points_awarded is not None else db_claim.points_claimed
            user.points += points_to_award
            # Log in leaderboard points history
            log_entry = models.LeaderboardPoint(
                user_id=user.id,
                points=points_to_award,
                reason=f"Claim Approved: {db_claim.proof_description[:50]}"
            )
            db.add(log_entry)
    db.commit()
    db.refresh(db_claim)
    
    user = db.query(models.User).filter(models.User.id == db_claim.user_id).first()
    db_claim.user_username = user.username if user else "Unknown"
    return db_claim

