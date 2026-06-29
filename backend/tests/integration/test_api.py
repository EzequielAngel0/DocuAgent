"""Tests de API que NO requieren Postgres/Qdrant (no se entra al lifespan)."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "app_name" in data
    assert "version" in data


def test_health_liveness():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_endpoint_protegido_sin_token_devuelve_401():
    # get_current_user rechaza antes de tocar la base de datos.
    response = client.get("/api/v1/admin/history")
    assert response.status_code == 401


def test_openapi_disponible():
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    assert response.json()["info"]["title"]


def test_cabeceras_de_seguridad():
    response = client.get("/")
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert "Content-Security-Policy" in response.headers
    assert response.headers["Referrer-Policy"] == "no-referrer"
