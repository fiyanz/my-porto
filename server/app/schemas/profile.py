from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ProfileBase(BaseModel):
    name: str = "Bagus Alfiyan"
    title: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    instagram_url: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    cv_url: Optional[str] = None
    weekly_hours_fallback: Optional[str] = "38.5 hrs"
    daily_driver: Optional[str] = "Neovim + Hyprland"
    coding_status: Optional[str] = "Active Coding"

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    instagram_url: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    cv_url: Optional[str] = None
    weekly_hours_fallback: Optional[str] = None
    daily_driver: Optional[str] = None
    coding_status: Optional[str] = None

class ProfileResponse(ProfileBase):
    id: int
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
