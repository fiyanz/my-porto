from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.db.session import get_db
from app.services.telemetry import get_coding_telemetry, invalidate_telemetry_cache
from app.models.profile import Profile
from app.models.user import User
from app.core.deps import get_current_active_superuser

router = APIRouter()

class TelemetryUpdate(BaseModel):
    weekly_hours_fallback: Optional[str] = None
    daily_driver: Optional[str] = None
    coding_status: Optional[str] = None

@router.get("/coding-stats")
async def read_coding_telemetry(db: Session = Depends(get_db)):
    """
    Public telemetry endpoint returning coding hours, active editor/driver,
    top technology stack, and session status (Hybrid WakaTime + DB Fallback).
    """
    return await get_coding_telemetry(db)

@router.put("/admin/update")
async def update_telemetry_settings(
    telemetry_in: TelemetryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    profile = db.query(Profile).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if telemetry_in.weekly_hours_fallback is not None:
        profile.weekly_hours_fallback = telemetry_in.weekly_hours_fallback
    if telemetry_in.daily_driver is not None:
        profile.daily_driver = telemetry_in.daily_driver
    if telemetry_in.coding_status is not None:
        profile.coding_status = telemetry_in.coding_status

    db.add(profile)
    db.commit()
    db.refresh(profile)

    invalidate_telemetry_cache()
    return await get_coding_telemetry(db)
