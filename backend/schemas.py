from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None


# User Schemas
class UserBase(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    role: Optional[str] = "student"
    
    # Student specifics
    points: Optional[int] = 0
    certificates: Optional[str] = None

    # Extended Member specifics
    branch: Optional[str] = None
    academic_year: Optional[str] = None
    position: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    profile_photo: Optional[str] = None

    @field_validator('email')
    @classmethod
    def validate_email_domain(cls, v: str) -> str:
        email_lower = v.lower().strip()
        if not email_lower.endswith("@gfgcoe.codingclub.in"):
            raise ValueError("Only institutional email IDs ending with @gfgcoe.codingclub.in are allowed. Generic providers are strictly rejected.")
        return email_lower

    @field_validator('role')
    @classmethod
    def validate_role(cls, v: str) -> str:
        role_lower = v.lower().strip()
        allowed_roles = [
            "admin", "core", "student", 
            "super_admin", "super admin", 
            "coordinator", "core_team", "core team", 
            "member", "alumni"
        ]
        if role_lower not in allowed_roles:
            raise ValueError("Role must be an allowed club role.")
        return role_lower

class UserCreate(UserBase):
    password: str

    @field_validator('password')
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        import re
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit.")
        if not re.search(r"[@$!%*?&_#^()-+=]", v):
            raise ValueError("Password must contain at least one special character (@$!%*?&_#^()-+=).")
        return v

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    
    # Expose student updates
    points: Optional[int] = None
    certificates: Optional[str] = None

    # Extended Member specifics
    branch: Optional[str] = None
    academic_year: Optional[str] = None
    position: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    profile_photo: Optional[str] = None

    @field_validator('password')
    @classmethod
    def validate_password_complexity(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return v
        import re
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one digit.")
        if not re.search(r"[@$!%*?&_#^()-+=]", v):
            raise ValueError("Password must contain at least one special character (@$!%*?&_#^()-+=).")
        return v

    @field_validator('email')
    @classmethod
    def validate_email_domain(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        email_lower = v.lower().strip()
        if not email_lower.endswith("@gfgcoe.codingclub.in"):
            raise ValueError("Only institutional email IDs ending with @gfgcoe.codingclub.in are allowed.")
        return email_lower

    @field_validator('role')
    @classmethod
    def validate_role(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        role_lower = v.lower().strip()
        allowed_roles = [
            "admin", "core", "student", 
            "super_admin", "super admin", 
            "coordinator", "core_team", "core team", 
            "member", "alumni"
        ]
        if role_lower not in allowed_roles:
            raise ValueError("Role must be an allowed club role.")
        return role_lower

class UserOut(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True


# Event Schemas
class EventBase(BaseModel):
    title: str
    description: str
    date: datetime
    location: str
    image_url: Optional[str] = None
    registration_link: Optional[str] = None
    category: Optional[str] = "Workshop"
    status: Optional[str] = "Upcoming"
    attendance_count: Optional[int] = 0

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    location: Optional[str] = None
    image_url: Optional[str] = None
    registration_link: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    attendance_count: Optional[int] = None

class EventOut(EventBase):
    id: int

    class Config:
        from_attributes = True


# Project Schemas
class ProjectBase(BaseModel):
    title: str
    description: str
    tech_stack: str
    github_link: Optional[str] = None
    live_link: Optional[str] = None
    image_url: Optional[str] = None
    submitted_by: Optional[str] = None
    team_members: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    completion_percentage: Optional[int] = 100
    status: Optional[str] = "Completed"

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tech_stack: Optional[str] = None
    github_link: Optional[str] = None
    live_link: Optional[str] = None
    image_url: Optional[str] = None
    submitted_by: Optional[str] = None
    team_members: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    completion_percentage: Optional[int] = None
    status: Optional[str] = None

class ProjectOut(ProjectBase):
    id: int

    class Config:
        from_attributes = True


# Committee Schemas
class CommitteeBase(BaseModel):
    name: str
    role: str
    image_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    year: Optional[str] = "2026"

class CommitteeCreate(CommitteeBase):
    pass

class CommitteeUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    image_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    year: Optional[str] = None

class CommitteeOut(CommitteeBase):
    id: int

    class Config:
        from_attributes = True


# Resource Schemas
class ResourceBase(BaseModel):
    title: str
    description: str
    category: str
    link: str
    tags: Optional[str] = None
    content: Optional[str] = None
    download_count: Optional[int] = 0
    type: Optional[str] = "resource"
    author: Optional[str] = None

class ResourceCreate(ResourceBase):
    pass

class ResourceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    link: Optional[str] = None
    tags: Optional[str] = None
    content: Optional[str] = None
    download_count: Optional[int] = None
    type: Optional[str] = None
    author: Optional[str] = None

class ResourceOut(ResourceBase):
    id: int

    class Config:
        from_attributes = True


# Announcement Schemas
class AnnouncementBase(BaseModel):
    title: str
    content: str
    is_pinned: Optional[bool] = False

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_pinned: Optional[bool] = None

class AnnouncementOut(AnnouncementBase):
    id: int
    date_created: datetime

    class Config:
        from_attributes = True


# NEW: Event Registration Schemas
class EventRegistrationBase(BaseModel):
    event_id: int

class EventRegistrationCreate(EventRegistrationBase):
    pass

class EventRegistrationOut(BaseModel):
    id: int
    user_id: int
    event_id: int
    registered_at: datetime
    event: Optional[EventOut] = None

    class Config:
        from_attributes = True


# Gamification & Leaderboard Schemas
class LeaderboardEntry(BaseModel):
    rank: int
    id: int
    username: str
    full_name: Optional[str] = None
    points: int
    badges: List[str]
    streak: Optional[int] = 0

    class Config:
        from_attributes = True

class AchievementStatus(BaseModel):
    id: str
    title: str
    description: str
    badge_name: str
    badge_icon: str
    is_unlocked: bool
    progress_current: int
    progress_target: int

class UserGamificationOut(BaseModel):
    points: int
    rank: int
    total_users: int
    rsvp_count: int
    project_count: int
    achievements: List[AchievementStatus]
    badges: List[dict]
    streak: Optional[int] = 0


# --- NEW SCHEMAS FOR GAMIFICATION, CONTESTS, AND APPROVALS ---

class ApprovalRequestCreate(BaseModel):
    full_name: str
    college_name: str
    branch: str
    academic_year: str
    username: str
    password: str

class ApprovalRequestOut(BaseModel):
    id: int
    full_name: str
    college_name: str
    branch: str
    academic_year: str
    username: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ContestQuestionCreate(BaseModel):
    title: str
    description: str
    positive_points: Optional[int] = 20
    negative_points: Optional[int] = 0
    bonus_points: Optional[int] = 0
    question_type: Optional[str] = "coding"  # "coding", "quiz"
    options: Optional[str] = None
    correct_option: Optional[str] = None  # "A", "B", "C", "D"

class ContestQuestionOut(BaseModel):
    id: int
    contest_id: int
    title: str
    description: str
    positive_points: int
    negative_points: int
    bonus_points: int
    question_type: str
    options: Optional[str] = None
    correct_option: Optional[str] = None

    class Config:
        from_attributes = True

class ContestCreate(BaseModel):
    title: str
    description: str
    duration_minutes: int
    start_time: datetime
    category: Optional[str] = "dsa"  # "dsa", "quiz", "comp"

class ContestOut(BaseModel):
    id: int
    title: str
    description: str
    duration_minutes: int
    start_time: datetime
    is_active: bool
    category: str
    created_at: datetime
    questions: Optional[List[ContestQuestionOut]] = None

    class Config:
        from_attributes = True

class PointClaimCreate(BaseModel):
    github_link: Optional[str] = None
    screenshot_url: Optional[str] = None
    proof_description: str
    points_claimed: int

class PointClaimOut(BaseModel):
    id: int
    user_id: int
    github_link: Optional[str] = None
    screenshot_url: Optional[str] = None
    proof_description: str
    points_claimed: int
    status: str
    admin_notes: Optional[str] = None
    created_at: datetime
    user_username: Optional[str] = None

    class Config:
        from_attributes = True

class PointClaimResolve(BaseModel):
    status: str  # "approved" or "rejected"
    admin_notes: Optional[str] = None
    points_awarded: Optional[int] = None

# --- NEW TABLES SCHEMAS ---
class CmsSettingBase(BaseModel):
    key: str
    value: str
    category: str

class CmsSettingCreate(CmsSettingBase):
    pass

class CmsSettingOut(CmsSettingBase):
    class Config:
        from_attributes = True

class ClubAchievementBase(BaseModel):
    title: str
    description: str
    category: str
    date: datetime
    achieved_by: str
    link: Optional[str] = None
    image_url: Optional[str] = None

class ClubAchievementCreate(ClubAchievementBase):
    pass

class ClubAchievementUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    date: Optional[datetime] = None
    achieved_by: Optional[str] = None
    link: Optional[str] = None
    image_url: Optional[str] = None

class ClubAchievementOut(ClubAchievementBase):
    id: int

    class Config:
        from_attributes = True

class CodingProfileBase(BaseModel):
    github_username: Optional[str] = None
    codeforces_username: Optional[str] = None
    leetcode_username: Optional[str] = None
    gfg_username: Optional[str] = None
    hackerrank_username: Optional[str] = None
    contest_score: Optional[int] = 0
    contribution_score: Optional[int] = 0
    activity_score: Optional[int] = 0
    overall_score: Optional[int] = 0
    is_tracking_enabled: Optional[bool] = True

class CodingProfileCreate(CodingProfileBase):
    user_id: int

class CodingProfileUpdate(CodingProfileBase):
    pass

class CodingProfileOut(CodingProfileBase):
    id: int
    user_id: int
    coding_score: int
    problems_solved: int
    codeforces_rating: int
    leetcode_solved: int
    gfg_solved: int
    github_commits: int
    contest_score: int
    contribution_score: int
    activity_score: int
    overall_score: int
    is_tracking_enabled: bool
    last_synced: datetime
    user_username: Optional[str] = None
    user_fullname: Optional[str] = None
    user_position: Optional[str] = None

    class Config:
        from_attributes = True

class LeaderboardSnapshotOut(BaseModel):
    id: int
    snapshot_type: str
    snapshot_date: datetime
    name: str
    data: str  # JSON formatted string

    class Config:
        from_attributes = True

class LeaderboardReset(BaseModel):
    snapshot_type: str  # "monthly", "semester", "annual", "archive"
    name: str

