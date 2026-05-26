from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="student") # 'admin', 'core', or 'student'
    is_active = Column(Boolean, default=True)
    
    # Student Member specifics
    points = Column(Integer, default=0) # Leaderboard points
    certificates = Column(String, nullable=True) # Comma-separated certificate lists

class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=False)
    date = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    location = Column(String, nullable=False) # e.g. "Lab 3" or "Zoom/YouTube"
    image_url = Column(String, nullable=True)
    registration_link = Column(String, nullable=True)
    category = Column(String, default="Workshop") # "Workshop", "Hackathon", "Seminar", "Coding Contest"

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=False)
    tech_stack = Column(String, nullable=False) # comma-separated list like "React, Tailwind"
    github_link = Column(String, nullable=True)
    live_link = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    
    # Trace student submissions vs admin-added
    submitted_by = Column(String, nullable=True) # Email of the student

class Committee(Base):
    __tablename__ = "committee"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    role = Column(String, nullable=False) # e.g. "President", "Joint Secretary"
    image_url = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    github_url = Column(String, nullable=True)
    year = Column(String, default="2026") # Active academic year batch

class Resource(Base):
    __tablename__ = "resources"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False) # e.g. "DSA", "Web Dev", "AI/ML"
    link = Column(String, nullable=False) # Link to documentation/GitHub/drive
    tags = Column(String, nullable=True) # comma-separated tags
    content = Column(Text, nullable=True) # rich markdown content for blogs/tutorials
    download_count = Column(Integer, default=0) # download metrics tracking
    type = Column(String, default="resource") #notes, sheet, pdf, blog
    author = Column(String, nullable=True)

class Announcement(Base):
    __tablename__ = "announcements"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    content = Column(Text, nullable=False)
    date_created = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    is_pinned = Column(Boolean, default=False)

# NEW: Event registrations mapping table linking Users and Events
class EventRegistration(Base):
    __tablename__ = "event_registrations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    registered_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

# Audit logs table for recording login and modification actions
class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    ip_address = Column(String, nullable=True)
    username = Column(String, nullable=True)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=True)


# --- NEW: GAMIFICATION, CONTEST, & APPROVAL MODELS ---

class ApprovalRequest(Base):
    __tablename__ = "approval_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    college_name = Column(String, nullable=False)
    branch = Column(String, nullable=False)
    academic_year = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    status = Column(String, default="pending")  # "pending", "approved", "rejected"
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

class Contest(Base):
    __tablename__ = "contests"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    start_time = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    is_active = Column(Boolean, default=True)
    category = Column(String, default="dsa")  # "dsa", "quiz", "comp"
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

class ContestQuestion(Base):
    __tablename__ = "contest_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    contest_id = Column(Integer, ForeignKey("contests.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    positive_points = Column(Integer, default=20)
    negative_points = Column(Integer, default=0)
    bonus_points = Column(Integer, default=0)
    question_type = Column(String, default="coding")  # "coding", "quiz"
    options = Column(String, nullable=True)  # comma-separated options list
    correct_option = Column(String, nullable=True)  # "A", "B", "C", "D"

class PointClaim(Base):
    __tablename__ = "point_claims"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    github_link = Column(String, nullable=True)
    screenshot_url = Column(String, nullable=True)
    proof_description = Column(Text, nullable=False)
    points_claimed = Column(Integer, default=0)
    status = Column(String, default="pending")  # "pending", "approved", "rejected"
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

class LeaderboardPoint(Base):
    __tablename__ = "leaderboard_points"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    points = Column(Integer, default=0)
    reason = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

class Badge(Base):
    __tablename__ = "badges"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    badge_name = Column(String, nullable=False)
    badge_icon = Column(String, nullable=False)
    earned_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)

class Achievement(Base):
    __tablename__ = "achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    achievement_id = Column(String, nullable=False)
    unlocked_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
