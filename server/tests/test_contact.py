def test_create_contact(client):
    payload = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "message": "Hello from testing!",
        "purpose": "Collaboration",
    }
    response = client.post("/contact/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Jane Doe"
    assert data["email"] == "jane@example.com"
    assert data["is_read"] is False
    assert "id" in data

def test_list_contacts(client):
    client.post("/contact/", json={
        "name": "Alice",
        "email": "alice@example.com",
        "message": "Test contact 1",
    })
    response = client.get("/contact/")
    assert response.status_code == 200
    contacts = response.json()
    assert isinstance(contacts, list)
    assert any(c["email"] == "alice@example.com" for c in contacts)

def test_mark_contact_read(client):
    create_res = client.post("/contact/", json={
        "name": "Bob",
        "email": "bob@example.com",
        "message": "Mark me read",
    })
    contact_id = create_res.json()["id"]

    response = client.put(f"/contact/{contact_id}")
    assert response.status_code == 200
    assert response.json()["is_read"] is True

def test_mark_contact_read_not_found(client):
    response = client.put("/contact/999999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Contact not found"

def test_delete_contact(client):
    create_res = client.post("/contact/", json={
        "name": "Charlie",
        "email": "charlie@example.com",
        "message": "To be deleted",
    })
    contact_id = create_res.json()["id"]

    delete_res = client.delete(f"/contact/{contact_id}")
    assert delete_res.status_code == 200
    assert delete_res.json() == {"message": "Contact deleted successfully"}

def test_delete_contact_not_found(client):
    response = client.delete("/contact/999999")
    assert response.status_code == 404
