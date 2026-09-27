from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.db.session import get_db
from app.routers import auth, projects, blog, contact, github, skills, experiences, admin, files, certificates, learning

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(blog.router, prefix="/blog", tags=["blog"])
app.include_router(contact.router, prefix="/contact", tags=["contact"])
app.include_router(github.router, prefix="/github", tags=["github"])
app.include_router(skills.router, prefix="/skills", tags=["skills"])
app.include_router(experiences.router, prefix="/experiences", tags=["experiences"])
app.include_router(certificates.router, prefix="/certificates", tags=["certificates"])
app.include_router(learning.router, prefix="/learning", tags=["learning"])
app.include_router(admin.router, tags=["admin"])
app.include_router(files.router)

@app.get("/")
def root():
    return {"message": "API is running"}

@app.get("/health", tags=["system"])
def health_check(db: Session = Depends(get_db)):
    """
    Keep-alive and health check endpoint:
    - Calling this endpoint resets Render's 15-minute inactivity timer.
    - Executing SELECT 1 query resets Supabase's 7-day database inactivity pause.
    """
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection check failed: {str(e)}"
        )
