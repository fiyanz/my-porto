from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.profile import Profile
from app.models.project import Project
from app.models.skill import Skill
from app.models.experience import Experience
from app.models.contact import Contact
from app.schemas.profile import ProfileResponse, ProfileUpdate
from app.schemas.user import UserResponse
from app.core.deps import get_current_active_superuser
from app.services.telemetry import invalidate_telemetry_cache

router = APIRouter()

@router.get("/admin/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_active_superuser)):
    return current_user

@router.get("/admin/profile", response_model=ProfileResponse)
def read_profile(db: Session = Depends(get_db)):
    profile = db.query(Profile).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.put("/admin/profile", response_model=ProfileResponse)
def update_profile(
    profile_in: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    profile = db.query(Profile).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    invalidate_telemetry_cache()
    return profile

@router.get("/admin/stats")
def read_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    return {
        "projects_count": db.query(Project).count(),
        "skills_count": db.query(Skill).count(),
        "experiences_count": db.query(Experience).count(),
        "unread_messages_count": db.query(Contact).filter(Contact.is_read == False).count(),
    }
