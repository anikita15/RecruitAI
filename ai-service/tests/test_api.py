import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_analyze_endpoint():
    payload = {
        "resume_text": "Jane Smith\nJava Engineer with Spring Boot.",
        "job_description": "We need a Java developer with Spring Boot and SQL."
    }
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["score"] > 0
    assert "java" in data["matched_skills"]
    assert "smith" in data["candidate_name"].lower()

def test_analyze_empty_request():
    response = client.post("/analyze", json={"resume_text": "", "job_description": ""})
    assert response.status_code == 400

def test_extract_text_unsupported_type():
    # Mocking a file upload with wrong content type
    files = {"file": ("test.txt", b"some text", "text/plain")}
    response = client.post("/extract-text", files=files)
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]
