from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.models.certificate import Certificate
from app.schemas.certificate import CertificateCreate, CertificateUpdate, CertificateResponse
from app.core.deps import get_current_user
from app.services.google_drive import (
    get_google_drive_certificates,
    get_drive_settings,
    save_drive_settings,
    extract_folder_id,
    invalidate_drive_cache,
    fetch_drive_thumbnail
)

router = APIRouter()

class DriveSettingsUpdate(BaseModel):
    folder_url: str
    api_key: Optional[str] = None

@router.get("/drive-thumbnail/{file_id}")
async def get_drive_thumbnail(file_id: str):
    """
    Proxies Google Drive thumbnail to bypass third-party referer blocking
    and CORS issues, returning binary image with long-term cache headers.
    """
    content, media_type = await fetch_drive_thumbnail(file_id)
    return Response(
        content=content,
        media_type=media_type,
        headers={
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
            "Content-Disposition": "inline"
        }
    )

@router.get("/drive-certs")
async def read_drive_certificates(refresh: bool = False):
    """
    Returns certificate items automatically discovered from the configured
    Google Drive folder link.
    """
    return await get_google_drive_certificates(force_refresh=refresh)

@router.get("/drive-settings")
def read_drive_settings(current_user: dict = Depends(get_current_user)):
    settings_data = get_drive_settings()
    folder_url = settings_data.get("folder_url", "")
    folder_id = extract_folder_id(folder_url) if folder_url else None
    return {
        "folder_url": folder_url,
        "folder_id": folder_id,
        "has_api_key": bool(settings_data.get("api_key"))
    }

@router.post("/drive-settings")
async def update_drive_settings(
    settings_in: DriveSettingsUpdate,
    current_user: dict = Depends(get_current_user)
):
    saved = save_drive_settings(settings_in.folder_url, settings_in.api_key)
    certs = await get_google_drive_certificates(force_refresh=True)
    return {
        "success": True,
        "settings": saved,
        "count": len(certs),
        "certs": certs
    }

@router.post("/drive-sync")
async def sync_drive_certificates(current_user: dict = Depends(get_current_user)):
    certs = await get_google_drive_certificates(force_refresh=True)
    return {
        "success": True,
        "count": len(certs),
        "certs": certs
    }

@router.get("/", response_model=List[CertificateResponse])
def get_certificates(db: Session = Depends(get_db)):
    """Get all certificates, ordered by display_order then id."""
    certs = db.query(Certificate).order_by(Certificate.display_order, desc(Certificate.id)).all()
    return certs

@router.post("/", response_model=CertificateResponse, status_code=status.HTTP_201_CREATED)
def create_certificate(
    cert_in: CertificateCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    cert = Certificate(**cert_in.model_dump())
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert

@router.put("/{cert_id}", response_model=CertificateResponse)
def update_certificate(
    cert_id: int, 
    cert_in: CertificateUpdate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    cert = db.query(Certificate).filter(Certificate.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    update_data = cert_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(cert, key, value)
        
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert

@router.delete("/{cert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_certificate(
    cert_id: int, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    cert = db.query(Certificate).filter(Certificate.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    db.delete(cert)
    db.commit()
    return None
