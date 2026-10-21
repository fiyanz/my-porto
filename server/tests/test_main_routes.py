from unittest.mock import MagicMock
from app.db.session import get_db
from app.main import app

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "API is running"}

def test_health_check_success(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"

def test_health_check_db_failure(client):
    mock_db = MagicMock()
    mock_db.execute.side_effect = Exception("DB connection timeout")

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.get("/health")
        assert response.status_code == 503
        assert "Database connection check failed" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()
