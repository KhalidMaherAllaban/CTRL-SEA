from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.main import app
from app.database.session import SessionLocal
from app.models.user import User


client = TestClient(app)


@pytest.fixture
def warehouse_client():
    app.dependency_overrides[get_current_user] = lambda: object()
    try:
        yield client
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_health_endpoint() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_warehouse_endpoints_require_authentication() -> None:
    client.cookies.clear()
    assert client.get("/api/dashboard").status_code == 401


def test_warehouse_readonly_endpoints_return_data(warehouse_client: TestClient) -> None:
    for path in ["/api/dashboard", "/api/map", "/api/map/layers", "/api/ports", "/api/ports/analytics", "/api/countries/analytics"]:
        response = warehouse_client.get(path)
        assert response.status_code == 200, path


def test_analytics_endpoints_return_warehouse_shapes(warehouse_client: TestClient) -> None:
    expectations = {
        "/api/chokepoints/analytics": "items",
        "/api/climate-risk": "scenario_comparison",
        "/api/trade-risk": "trade_flows",
        "/api/risk-center": "top_risk_locations",
        "/api/insights": "narratives",
    }
    for path, expected_key in expectations.items():
        response = warehouse_client.get(path)
        assert response.status_code == 200, path
        assert expected_key in response.json(), path


def test_spillover_accepts_warehouse_identifiers(warehouse_client: TestClient) -> None:
    map_response = warehouse_client.get("/api/map/layers")
    assert map_response.status_code == 200
    map_data = map_response.json()
    route = map_data["trade_flows"][0]
    port = next(item for item in map_data["ports"] if item["port_name"] == route["origin"])
    country = next((item for item in map_data["countries"] if item["country"] == route["origin_country"]), map_data["countries"][0])

    response = warehouse_client.post(
        "/api/spillover/simulate",
        json={"port": port["port_code"], "country": country["iso3"], "industry": "", "scenario": "present"},
    )

    assert response.status_code == 200
    assert response.json()["affected_countries"]


def test_auth_register_login_refresh_and_me_cookie_flow() -> None:
    email = f"analyst-{uuid4().hex}@example.com"
    password = "correct-horse-42"

    try:
        register_response = client.post(
            "/api/auth/register",
            json={"full_name": "Test Analyst", "email": email, "password": password},
        )

        assert register_response.status_code == 200
        assert register_response.json()["user"]["role"] == "analyst"
        assert "access_token" not in register_response.json()
        assert "ctrl_sea_access" in register_response.cookies
        assert "ctrl_sea_refresh" in register_response.cookies
        assert "HttpOnly" in register_response.headers.get("set-cookie", "")

        me_response = client.get("/api/auth/me")
        assert me_response.status_code == 200
        assert me_response.json()["email"] == email

        refresh_response = client.post("/api/auth/refresh")
        assert refresh_response.status_code == 200
        assert refresh_response.json()["user"]["email"] == email

        logout_response = client.post("/api/auth/logout")
        assert logout_response.status_code == 200
        assert client.get("/api/auth/me").status_code == 401

        login_response = client.post("/api/auth/login", json={"email": email, "password": password, "remember": False})
        assert login_response.status_code == 200
        assert login_response.json()["user"]["email"] == email
        assert "Max-Age" not in login_response.headers.get("set-cookie", "")

        session_refresh_response = client.post("/api/auth/refresh")
        assert session_refresh_response.status_code == 200
        assert "Max-Age" not in session_refresh_response.headers.get("set-cookie", "")
    finally:
        client.cookies.clear()
        with SessionLocal() as db:
            db.query(User).filter(User.email == email).delete(synchronize_session=False)
            db.commit()


def test_login_uses_generic_errors() -> None:
    missing_user = client.post("/api/auth/login", json={"email": "missing@example.com", "password": "not-right-123"})

    assert missing_user.status_code == 401
    assert missing_user.json()["detail"] == "Invalid email or password"


def test_spillover_rejects_invalid_identifiers(warehouse_client: TestClient) -> None:
    response = warehouse_client.post(
        "/api/spillover/simulate",
        json={"port": "", "country": "not-an-iso3", "industry": "", "scenario": "future"},
    )
    assert response.status_code == 422
