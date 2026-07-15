from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_current_user
from app.api.routes import chokepoints, climate, countries, dashboard, insights, map_layers, ports, risk_center, spillover, trade
from app.main import app
from app.database.session import SessionLocal, engine
from app.models.user import User


client = TestClient(app)

PORT = {
    "port_key": 1,
    "port_code": "EGPSD",
    "port_name": "Port Said",
    "country_key": 1,
    "country": "Egypt",
    "latitude": 31.2653,
    "longitude": 32.3019,
    "capacity_teu": 1000000,
    "port_type": "Container",
    "vessel_count": 120,
    "trade_value_usd": 250000000.0,
    "risk_score": 42.0,
}

COUNTRY = {
    "country_key": 1,
    "iso3": "EGY",
    "country": "Egypt",
    "country_name": "Egypt",
    "region": "Middle East & North Africa",
    "imports_usd": 120000000.0,
    "exports_usd": 90000000.0,
    "dependency": 4,
    "risk_exposure": 35.0,
}


@pytest.fixture
def sqlite_schema():
    if engine.url.get_backend_name() == "sqlite":
        User.__table__.create(bind=engine, checkfirst=True)
        yield
        User.__table__.drop(bind=engine, checkfirst=True)
    else:
        yield


@pytest.fixture(autouse=True)
def reset_client_cookies(sqlite_schema):
    client.cookies.clear()
    yield
    client.cookies.clear()


@pytest.fixture
def warehouse_client(monkeypatch):
    app.dependency_overrides[get_current_user] = lambda: object()
    monkeypatch.setattr(dashboard, "dashboard", lambda db: {
        "kpis": [{"label": "Ports", "value": 1, "change": 0, "weekly_change": 0, "tooltip": "Ports", "sparkline": [1, 1]}],
        "trade_trend": [{"month": "2026-01", "value": 100}],
        "vessel_activity_trend": [{"month": "2026-01", "value": 12}],
        "congestion_trend": [{"month": "2026-01", "value": 20}],
        "risk_trend": [{"month": "2026-01", "value": 30}],
        "risk_heatmap": [{"country": "Egypt", "region": "Middle East & North Africa", "risk": 35}],
        "chokepoint_status": [{"chokepoint_code": "SUEZ", "chokepoint_name": "Suez Canal", "vessel_transits": 200, "risk_score": 50}],
        "trade_distribution": [{"name": "Container", "value": 100}],
        "port_rankings": [PORT],
        "country_rankings": [COUNTRY],
        "disruption_mix": [{"name": "Weather", "value": 2}],
    })
    monkeypatch.setattr(map_layers, "map_layers", lambda db, route_limit=300: {
        "ports": [PORT],
        "countries": [COUNTRY],
        "chokepoints": [{"chokepoint_code": "SUEZ", "chokepoint_name": "Suez Canal", "latitude": 30.0, "longitude": 32.0, "region": "Egypt", "vessel_transits": 200, "risk_score": 50}],
        "trade_flows": [{"route_id": "EGPSD-NLRTM", "origin": "Port Said", "origin_country": "Egypt", "origin_lat": 31.2653, "origin_lon": 32.3019, "destination": "Rotterdam", "destination_country": "Netherlands", "destination_lat": 51.9244, "destination_lon": 4.4777, "value": 1000000, "risk": 20}],
        "disruptions": [],
    })
    monkeypatch.setattr(ports.warehouse, "list_ports", lambda db, search=None, country=None, page=1, size=20: ([PORT], 1))
    monkeypatch.setattr(ports.warehouse, "port_analytics", lambda db: {"throughput": [{"name": "Port Said", "value": 250000000}], "trend": []})
    monkeypatch.setattr(countries.warehouse, "country_rankings", lambda db, limit=237: [COUNTRY])
    monkeypatch.setattr(countries.warehouse, "country_analytics", lambda db: {"countries": [COUNTRY], "trend": [], "dependency": [], "partners": [], "risk_exposure": [], "trade_balance": []})
    monkeypatch.setattr(chokepoints.warehouse, "chokepoint_analytics", lambda db: {"items": [{"chokepoint_code": "SUEZ", "chokepoint_name": "Suez Canal", "risk_score": 50}], "transits": [], "risk": [], "trade_impact": [], "congestion": [], "history": []})
    monkeypatch.setattr(climate, "climate", lambda db: {"scenario_comparison": [], "hazard_heatmap": [], "risk_by_country": [], "trend": []})
    monkeypatch.setattr(trade, "trade_risk", lambda db: {"value_at_risk": [], "downtime": [], "industry_impact": [], "trade_flows": []})
    monkeypatch.setattr(risk_center, "risk_center", lambda db: {"climate": {"risk_by_country": []}, "trade": {"value_at_risk": []}, "disruptions": [], "top_risk_locations": []})
    monkeypatch.setattr(insights, "insights", lambda db: {"narratives": ["Warehouse stable"], "top_trade_corridors": [], "fastest_growing_ports": [], "highest_risk_countries": [], "highest_risk_routes": [], "most_critical_chokepoints": [], "largest_spillover_effects": [], "most_disrupted_regions": []})
    monkeypatch.setattr(spillover, "spillover", lambda db, port, country, industry, scenario: {
        "affected_countries": [{"country": "Egypt", "impact": 1}],
        "trade_losses": [],
        "capacity_risk": [],
        "supply_chain_impact": [],
        "transit_delays": [],
        "sankey": {"nodes": [], "links": []},
        "network": {"nodes": [], "edges": []},
        "propagation": [],
    })
    try:
        yield client
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_health_endpoint() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_proxied_health_endpoint() -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json()["database"] == "connected"


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

    alias_response = warehouse_client.post(
        "/api/spillover",
        json={"port": port["port_code"], "country": country["iso3"], "industry": "", "scenario": "present"},
    )
    assert alias_response.status_code == 200


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
