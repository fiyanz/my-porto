def test_create_skill(client):
    payload = {
        "category": "Backend",
        "name": "Python",
        "level": 90,
        "is_primary": True,
        "display_order": 1,
    }
    response = client.post("/skills/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Python"
    assert data["category"] == "Backend"
    assert "id" in data

def test_batch_create_skills(client):
    payload = [
        {"category": "Frontend", "name": "React", "level": 85},
        {"category": "Frontend", "name": "Next.js", "level": 80},
    ]
    response = client.post("/skills/batch", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert {s["name"] for s in data} == {"React", "Next.js"}

def test_list_skills(client):
    client.post("/skills/", json={"category": "Database", "name": "PostgreSQL", "level": 80})
    response = client.get("/skills/")
    assert response.status_code == 200
    skills = response.json()
    assert isinstance(skills, list)
    assert any(s["name"] == "PostgreSQL" for s in skills)

def test_get_skill_by_id(client):
    create_res = client.post("/skills/", json={"category": "DevOps", "name": "Docker", "level": 75})
    skill_id = create_res.json()["id"]

    response = client.get(f"/skills/{skill_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Docker"

def test_get_skill_not_found(client):
    response = client.get("/skills/999999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Skill not found"

def test_update_skill(client):
    create_res = client.post("/skills/", json={"category": "Cloud", "name": "AWS", "level": 60})
    skill_id = create_res.json()["id"]

    update_res = client.put(f"/skills/{skill_id}", json={"level": 75, "is_primary": True})
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["level"] == 75
    assert updated["is_primary"] is True

def test_update_skill_not_found(client):
    response = client.put("/skills/999999", json={"name": "Ghost"})
    assert response.status_code == 404

def test_delete_skill(client):
    create_res = client.post("/skills/", json={"category": "Tool", "name": "Git", "level": 90})
    skill_id = create_res.json()["id"]

    delete_res = client.delete(f"/skills/{skill_id}")
    assert delete_res.status_code == 200

    # Verify skill is deleted
    get_res = client.get(f"/skills/{skill_id}")
    assert get_res.status_code == 404

def test_delete_skill_not_found(client):
    response = client.delete("/skills/999999")
    assert response.status_code == 404
