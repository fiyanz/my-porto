from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.db.base import Base

class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, default="Bagus Alfiyan")
    title = Column(String, nullable=False, default="CS Student · ML Engineer · Backend Dev")
    bio = Column(Text, nullable=True)
    avatar_url = Column(String, nullable=True)
    github_url = Column(String, nullable=True, default="https://github.com/Fiyanz")
    linkedin_url = Column(String, nullable=True)
    instagram_url = Column(String, nullable=True)
    email = Column(String, nullable=True, default="bagus@example.com")
    location = Column(String, nullable=True, default="Bandung, Indonesia")
    status = Column(String, nullable=True, default="Available for Internship")
    cv_url = Column(String, nullable=True)
    weekly_hours_fallback = Column(String, nullable=True, default="38.5 hrs")
    daily_driver = Column(String, nullable=True, default="Neovim + Hyprland")
    coding_status = Column(String, nullable=True, default="Active Coding")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
