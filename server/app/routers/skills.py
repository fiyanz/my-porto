from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.skill import Skill
from app.schemas.skill import SkillResponse, SkillCreate, SkillUpdate

router = APIRouter()

@router.get("/", response_model=List[SkillResponse])
def read_skills(skip: int = 0, limit: int = 200, db: Session = Depends(get_db)):
    skills = db.query(Skill).order_by(Skill.category, Skill.display_order).offset(skip).limit(limit).all()
    return skills

@router.get("/{skill_id}", response_model=SkillResponse)
def read_skill(skill_id: int, db: Session = Depends(get_db)):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return skill

@router.post("/", response_model=SkillResponse)
def create_skill(skill_in: SkillCreate, db: Session = Depends(get_db)):
    skill = Skill(**skill_in.model_dump())
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill

@router.post("/batch", response_model=List[SkillResponse])
def create_skills_batch(skills_in: List[SkillCreate], db: Session = Depends(get_db)):
    created = []
    for s_in in skills_in:
        skill = Skill(**s_in.model_dump())
        db.add(skill)
        created.append(skill)
    db.commit()
    for s in created:
        db.refresh(s)
    return created

@router.put("/{skill_id}", response_model=SkillResponse)
def update_skill(skill_id: int, skill_in: SkillUpdate, db: Session = Depends(get_db)):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    update_data = skill_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(skill, field, value)
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill

@router.delete("/{skill_id}")
def delete_skill(skill_id: int, db: Session = Depends(get_db)):
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    db.delete(skill)
    db.commit()
    return {"message": "Skill deleted successfully"}
