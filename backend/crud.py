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

# --- CMS SETTINGS CRUD ---
def get_cms_setting(db: Session, key: str):
    return db.query(models.CmsSetting).filter(models.CmsSetting.key == key).first()

def get_cms_settings(db: Session):
    return db.query(models.CmsSetting).all()

def set_cms_setting(db: Session, key: str, value: str, category: str):
    db_setting = get_cms_setting(db, key)
    if db_setting:
        db_setting.value = value
        db_setting.category = category
    else:
        db_setting = models.CmsSetting(key=key, value=value, category=category)
        db.add(db_setting)
    db.commit()
    db.refresh(db_setting)
    return db_setting

# --- CLUB ACHIEVEMENTS CRUD ---
def get_club_achievements(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.ClubAchievement).order_by(models.ClubAchievement.date.desc()).offset(skip).limit(limit).all()

def get_club_achievement(db: Session, achievement_id: int):
    return db.query(models.ClubAchievement).filter(models.ClubAchievement.id == achievement_id).first()

def create_club_achievement(db: Session, ach: schemas.ClubAchievementCreate):
    ach_dict = ach.model_dump()
    for key, value in ach_dict.items():
        if isinstance(value, str):
            ach_dict[key] = sanitize_text(value)
    db_ach = models.ClubAchievement(**ach_dict)
    db.add(db_ach)
    db.commit()
    db.refresh(db_ach)
    return db_ach

def update_club_achievement(db: Session, achievement_id: int, ach: schemas.ClubAchievementUpdate):
    db_ach = get_club_achievement(db, achievement_id)
    if not db_ach:
        return None
    for key, value in ach.model_dump(exclude_unset=True).items():
        if isinstance(value, str):
            value = sanitize_text(value)
        setattr(db_ach, key, value)
    db.commit()
    db.refresh(db_ach)
    return db_ach

def delete_club_achievement(db: Session, achievement_id: int):
    db_ach = get_club_achievement(db, achievement_id)
    if not db_ach:
        return False
    db.delete(db_ach)
    db.commit()
    return True

# --- CODING PROFILES CRUD ---
import json

def is_eligible_committee_role(role: Optional[str]) -> bool:
    if not role:
        return False
    role_clean = role.lower().strip()
    return role_clean in ["admin", "super_admin", "super admin", "coordinator", "core", "core_team", "core team"]

def get_coding_profile(db: Session, profile_id: int):
    return db.query(models.CodingProfile).filter(models.CodingProfile.id == profile_id).first()

def get_coding_profile_by_user(db: Session, user_id: int):
    return db.query(models.CodingProfile).filter(models.CodingProfile.user_id == user_id).first()

def get_coding_profiles(db: Session):
    profiles = db.query(models.CodingProfile).all()
    for p in profiles:
        user = db.query(models.User).filter(models.User.id == p.user_id).first()
        p.user_username = user.username if user else "Unknown"
        p.user_fullname = user.full_name if user else "Unknown"
    return profiles

def create_or_update_coding_profile(db: Session, user_id: int, profile_data: schemas.CodingProfileBase):
    db_prof = get_coding_profile_by_user(db, user_id)
    if not db_prof:
        db_prof = models.CodingProfile(
            user_id=user_id,
            github_username=profile_data.github_username,
            codeforces_username=profile_data.codeforces_username,
            leetcode_username=profile_data.leetcode_username,
            gfg_username=profile_data.gfg_username,
            hackerrank_username=profile_data.hackerrank_username,
            contest_score=profile_data.contest_score or 0,
            contribution_score=profile_data.contribution_score or 0,
            activity_score=profile_data.activity_score or 0,
            overall_score=profile_data.overall_score or 0,
            is_tracking_enabled=profile_data.is_tracking_enabled if profile_data.is_tracking_enabled is not None else True
        )
        db.add(db_prof)
    else:
        db_prof.github_username = profile_data.github_username
        db_prof.codeforces_username = profile_data.codeforces_username
        db_prof.leetcode_username = profile_data.leetcode_username
        db_prof.gfg_username = profile_data.gfg_username
        db_prof.hackerrank_username = profile_data.hackerrank_username
        if profile_data.contest_score is not None:
            db_prof.contest_score = profile_data.contest_score
        if profile_data.contribution_score is not None:
            db_prof.contribution_score = profile_data.contribution_score
        if profile_data.activity_score is not None:
            db_prof.activity_score = profile_data.activity_score
        if profile_data.overall_score is not None:
            db_prof.overall_score = profile_data.overall_score
        if profile_data.is_tracking_enabled is not None:
            db_prof.is_tracking_enabled = profile_data.is_tracking_enabled
    db.commit()
    db.refresh(db_prof)
    return db_prof

def delete_coding_profile(db: Session, profile_id: int):
    p = get_coding_profile(db, profile_id)
    if not p:
        return False
    db.delete(p)
    db.commit()
    return True

def sync_coding_profile_metrics(db: Session, p: models.CodingProfile):
    # Mock data generation based on username length
    github_commits = len(p.github_username or "") * 12 + 10 if p.github_username else 0
    leetcode_solved = len(p.leetcode_username or "") * 8 + 15 if p.leetcode_username else 0
    codeforces_rating = len(p.codeforces_username or "") * 100 + 800 if p.codeforces_username else 0
    gfg_solved = len(p.gfg_username or "") * 14 + 5 if p.gfg_username else 0
    hackerrank_score = len(p.hackerrank_username or "") * 10 + 20 if p.hackerrank_username else 0
    
    problems_solved = leetcode_solved + gfg_solved + (codeforces_rating // 10)
    
    # Calculate different score components
    coding_score = (leetcode_solved * 10) + int(codeforces_rating * 1.5) + (gfg_solved * 8) + hackerrank_score
    contest_score = (codeforces_rating // 2) if p.codeforces_username else 0
    contribution_score = (github_commits * 10) if p.github_username else 0
    activity_score = 50 if (github_commits > 0 or leetcode_solved > 0) else 0
    overall_score = coding_score + contest_score + contribution_score + activity_score
    
    p.github_commits = github_commits
    p.leetcode_solved = leetcode_solved
    p.codeforces_rating = codeforces_rating
    p.gfg_solved = gfg_solved
    p.problems_solved = problems_solved
    
    p.coding_score = coding_score
    p.contest_score = contest_score
    p.contribution_score = contribution_score
    p.activity_score = activity_score
    p.overall_score = overall_score
    p.last_synced = datetime.datetime.utcnow()
    
    db.commit()
    db.refresh(p)
    return p

def get_committee_coding_leaderboard(db: Session, include_alumni: bool = False):
    profiles = db.query(models.CodingProfile).filter(models.CodingProfile.is_tracking_enabled == True).all()
    filtered = []
    for p in profiles:
        user = db.query(models.User).filter(models.User.id == p.user_id).first()
        if not user:
            continue
        role_lower = user.role.lower().strip()
        # Filter active committee members or alumni if enabled
        is_alumni = role_lower == "alumni"
        if is_eligible_committee_role(user.role) or (is_alumni and include_alumni):
            p.user_username = user.username
            p.user_fullname = user.full_name or user.username
            p.user_position = user.position or user.role
            filtered.append(p)
            
    # Sort by overall_score descending
    filtered.sort(key=lambda x: x.overall_score, reverse=True)
    return filtered

def get_leaderboard_snapshots(db: Session):
    return db.query(models.LeaderboardSnapshot).order_by(models.LeaderboardSnapshot.snapshot_date.desc()).all()

def create_leaderboard_snapshot(db: Session, snapshot_type: str, name: str, include_alumni: bool = False):
    leaderboard = get_committee_coding_leaderboard(db, include_alumni=include_alumni)
    entries = []
    for idx, p in enumerate(leaderboard):
        entries.append({
            "rank": idx + 1,
            "user_id": p.user_id,
            "username": p.user_username,
            "full_name": p.user_fullname,
            "position": p.user_position,
            "coding_score": p.coding_score,
            "contest_score": p.contest_score,
            "contribution_score": p.contribution_score,
            "activity_score": p.activity_score,
            "overall_score": p.overall_score,
            "leetcode_solved": p.leetcode_solved,
            "gfg_solved": p.gfg_solved,
            "codeforces_rating": p.codeforces_rating,
            "github_commits": p.github_commits,
            "hackerrank_username": p.hackerrank_username,
            "github_username": p.github_username,
            "leetcode_username": p.leetcode_username,
            "codeforces_username": p.codeforces_username,
            "gfg_username": p.gfg_username
        })
    
    db_snap = models.LeaderboardSnapshot(
        snapshot_type=snapshot_type,
        name=name,
        data=json.dumps(entries),
        snapshot_date=datetime.datetime.utcnow()
    )
    db.add(db_snap)
    db.commit()
    db.refresh(db_snap)
    return db_snap

def reset_leaderboard_scores(db: Session, snapshot_type: str, name: str, include_alumni: bool = False):
    db_snap = create_leaderboard_snapshot(db, snapshot_type, name, include_alumni=include_alumni)
    
    profiles = db.query(models.CodingProfile).all()
    for p in profiles:
        p.coding_score = 0
        p.problems_solved = 0
        p.codeforces_rating = 0
        p.leetcode_solved = 0
        p.gfg_solved = 0
        p.github_commits = 0
        p.contest_score = 0
        p.contribution_score = 0
        p.activity_score = 0
        p.overall_score = 0
        p.last_synced = datetime.datetime.utcnow()
        
    db.commit()
    return db_snap

def restore_leaderboard_snapshot(db: Session, snapshot_id: int):
    db_snap = db.query(models.LeaderboardSnapshot).filter(models.LeaderboardSnapshot.id == snapshot_id).first()
    if not db_snap:
        return None
    
    entries = json.loads(db_snap.data)
    for entry in entries:
        p = db.query(models.CodingProfile).filter(models.CodingProfile.user_id == entry["user_id"]).first()
        if p:
            p.coding_score = entry["coding_score"]
            p.problems_solved = entry.get("problems_solved", entry["coding_score"] // 10)
            p.codeforces_rating = entry["codeforces_rating"]
            p.leetcode_solved = entry["leetcode_solved"]
            p.gfg_solved = entry["gfg_solved"]
            p.github_commits = entry["github_commits"]
            p.contest_score = entry["contest_score"]
            p.contribution_score = entry["contribution_score"]
            p.activity_score = entry["activity_score"]
            p.overall_score = entry["overall_score"]
            p.last_synced = datetime.datetime.utcnow()
            
    db.commit()
    return db_snap


