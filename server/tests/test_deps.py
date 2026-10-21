import pytest
from fastapi import HTTPException
from app.core import deps
from app.core.security import create_access_token, get_password_hash
from app.models.user import User

def test_get_current_user_valid(db):
    user = User(
        email="dep_user@example.com",
        hashed_password=get_password_hash("pass123"),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    retrieved_user = deps.get_current_user(db=db, token=token)
    assert retrieved_user.id == user.id
    assert retrieved_user.email == "dep_user@example.com"

def test_get_current_user_invalid_token(db):
    with pytest.raises(HTTPException) as exc_info:
        deps.get_current_user(db=db, token="invalid.token.string")
    assert exc_info.value.status_code == 401
    assert "Could not validate credentials" in exc_info.value.detail

def test_get_current_user_nonexistent_user(db):
    token = create_access_token("999999")
    with pytest.raises(HTTPException) as exc_info:
        deps.get_current_user(db=db, token=token)
    assert exc_info.value.status_code == 401

def test_get_current_active_superuser_success():
    superuser = User(email="super@example.com", is_superuser=True)
    result = deps.get_current_active_superuser(current_user=superuser)
    assert result == superuser

def test_get_current_active_superuser_forbidden():
    regular_user = User(email="normal@example.com", is_superuser=False)
    with pytest.raises(HTTPException) as exc_info:
        deps.get_current_active_superuser(current_user=regular_user)
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "Not enough privileges"
