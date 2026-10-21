from app.models.user import User
from app.core.security import get_password_hash

def test_login_success(client, db):
    test_user = User(
        email="auth_user@example.com",
        hashed_password=get_password_hash("validpass123"),
        is_active=True,
    )
    db.add(test_user)
    db.commit()

    login_data = {
        "username": "auth_user@example.com",
        "password": "validpass123",
    }
    response = client.post("/auth/login/access-token", data=login_data)
    assert response.status_code == 200
    tokens = response.json()
    assert "access_token" in tokens
    assert tokens["token_type"] == "bearer"

def test_login_wrong_password(client, db):
    test_user = User(
        email="user_wrong_pw@example.com",
        hashed_password=get_password_hash("correctpass"),
        is_active=True,
    )
    db.add(test_user)
    db.commit()

    login_data = {
        "username": "user_wrong_pw@example.com",
        "password": "incorrectpassword",
    }
    response = client.post("/auth/login/access-token", data=login_data)
    assert response.status_code == 400
    assert response.json()["detail"] == "Incorrect email or password"

def test_login_nonexistent_user(client):
    login_data = {
        "username": "ghost@example.com",
        "password": "any_password",
    }
    response = client.post("/auth/login/access-token", data=login_data)
    assert response.status_code == 400
    assert response.json()["detail"] == "Incorrect email or password"

def test_login_inactive_user(client, db):
    inactive_user = User(
        email="inactive@example.com",
        hashed_password=get_password_hash("password123"),
        is_active=False,
    )
    db.add(inactive_user)
    db.commit()

    login_data = {
        "username": "inactive@example.com",
        "password": "password123",
    }
    response = client.post("/auth/login/access-token", data=login_data)
    assert response.status_code == 400
    assert response.json()["detail"] == "Inactive user"
