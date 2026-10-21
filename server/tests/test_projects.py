def test_create_project(client):
    payload = {
        "title": "My Portfolio",
        "slug": "my-portfolio-app",
        "category": "Fullstack",
        "status": "Completed",
        "description": "Portfolio web application",
        "domains": ["Web", "API"],
        "technologies": ["FastAPI", "Next.js"],
    }
    response = client.post("/projects/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "My Portfolio"
    assert data["slug"] == "my-portfolio-app"
    assert "id" in data

def test_get_project_by_slug(client):
    client.post("/projects/", json={
        "title": "Slug Test Project",
        "slug": "slug-test-proj",
        "description": "Testing slug route",
    })

    response = client.get("/projects/slug-test-proj")
    assert response.status_code == 200
    assert response.json()["slug"] == "slug-test-proj"

def test_get_project_not_found(client):
    response = client.get("/projects/non-existent-slug")
    assert response.status_code == 404
    assert response.json()["detail"] == "Project not found"

def test_list_projects(client):
    client.post("/projects/", json={
        "title": "List Project Test",
        "slug": "list-proj-test",
        "description": "List test",
    })
    response = client.get("/projects/")
    assert response.status_code == 200
    projects = response.json()
    assert isinstance(projects, list)
    assert any(p["slug"] == "list-proj-test" for p in projects)

def test_update_project(client):
    client.post("/projects/", json={
        "title": "Original Title",
        "slug": "update-test-proj",
        "description": "Original description",
    })

    update_payload = {
        "title": "Updated Title",
        "slug": "update-test-proj",
        "description": "Updated description",
    }
    response = client.put("/projects/update-test-proj", json=update_payload)
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Title"

def test_delete_project(client):
    client.post("/projects/", json={
        "title": "To Delete",
        "slug": "delete-test-proj",
        "description": "Delete me",
    })

    delete_res = client.delete("/projects/delete-test-proj")
    assert delete_res.status_code == 200

    # Ensure it's deleted
    get_res = client.get("/projects/delete-test-proj")
    assert get_res.status_code == 404
