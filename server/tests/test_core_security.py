from datetime import timedelta
import jwt
from app.core import security
from app.core.config import settings

def test_password_hash_and_verify():
    password = "secret_password_123"
    hashed = security.get_password_hash(password)

    assert hashed != password
    assert security.verify_password(password, hashed) is True
    assert security.verify_password("wrong_password", hashed) is False

def test_password_hash_salting():
    password = "same_password"
    hash1 = security.get_password_hash(password)
    hash2 = security.get_password_hash(password)

    # bcrypt generates different salts per call
    assert hash1 != hash2
    assert security.verify_password(password, hash1) is True
    assert security.verify_password(password, hash2) is True

def test_create_access_token():
    user_id = "42"
    token = security.create_access_token(subject=user_id)

    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
    assert payload["sub"] == user_id
    assert "exp" in payload

def test_create_access_token_custom_delta():
    user_id = "99"
    delta = timedelta(hours=2)
    token = security.create_access_token(subject=user_id, expires_delta=delta)

    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
    assert payload["sub"] == user_id
