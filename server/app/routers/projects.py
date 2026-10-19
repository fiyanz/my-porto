from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.schemas.project import ProjectResponse, ProjectCreate, ProjectUpdate
from app.services import project_service
from app.services.github import sync_github_repositories
from app.core.deps import get_current_active_superuser
from app.models.user import User

router = APIRouter()

@router.post("/sync-github")
async def sync_projects_from_github(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser)
):
    try:
        return await sync_github_repositories(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[ProjectResponse])
def read_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return project_service.get_projects(db, skip=skip, limit=limit)

@router.get("/{slug}", response_model=ProjectResponse)
def read_project(slug: str, db: Session = Depends(get_db)):
    return project_service.get_project(db, slug=slug)

@router.post("/", response_model=ProjectResponse)
async def create_project(project_in: ProjectCreate, db: Session = Depends(get_db)):
    return await project_service.create_project(db, project_in)

@router.put("/{slug}", response_model=ProjectResponse)
async def update_project(slug: str, project_in: ProjectUpdate, db: Session = Depends(get_db)):
    return await project_service.update_project(db, slug=slug, project_in=project_in)

@router.delete("/{slug}")
def delete_project(slug: str, db: Session = Depends(get_db)):
    return project_service.delete_project(db, slug=slug)
