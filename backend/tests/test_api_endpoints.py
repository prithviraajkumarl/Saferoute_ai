from fastapi import status


def test_health_endpoints(client):
    res_root = client.get("/api/v1/health")
    assert res_root.status_code == status.HTTP_200_OK

    res_live = client.get("/api/v1/health/liveness")
    assert res_live.status_code == status.HTTP_200_OK
    assert res_live.json()["status"] == "UP"

    res_ready = client.get("/api/v1/health/readiness")
    assert res_ready.status_code == status.HTTP_200_OK
    assert "database" in res_ready.json()


def test_auth_and_profile(client):
    register_payload = {
        "email": "new_tourist@saferoute.ai",
        "password": "SecurePassword2026!",
        "full_name": "Ravi Shankar",
        "role": "tourist",
    }
    res_reg = client.post("/api/v1/auth/register", json=register_payload)
    assert res_reg.status_code == status.HTTP_200_OK
    data = res_reg.json()
    assert "access_token" in data
    assert data["role"] == "tourist"

    # Login
    login_payload = {
        "email": "new_tourist@saferoute.ai",
        "password": "SecurePassword2026!",
    }
    res_login = client.post("/api/v1/auth/login", json=login_payload)
    assert res_login.status_code == status.HTTP_200_OK
    token = res_login.json()["access_token"]

    # Profile
    res_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == status.HTTP_200_OK
    assert res_me.json()["email"] == "new_tourist@saferoute.ai"


def test_weather_and_alerts_endpoints(client):
    res_weather = client.get("/api/v1/weather/forecast?lat=13.08&lng=80.27")
    assert res_weather.status_code == status.HTTP_200_OK
    data = res_weather.json()
    assert "current" in data
    assert "temperature_c" in data["current"]
    assert "condition_ta" in data["current"]

    res_alerts = client.get("/api/v1/alerts/active?lat=13.08&lng=80.27")
    assert res_alerts.status_code == status.HTTP_200_OK
    alerts = res_alerts.json()
    assert isinstance(alerts, list)
    assert len(alerts) > 0


def test_route_assessment_api(client):
    payload = {
        "origin_lat": 13.0827,
        "origin_lng": 80.2707,
        "destination_lat": 12.9249,
        "destination_lng": 80.1240,
        "travel_mode": "driving",
    }
    res = client.post("/api/v1/routes/assess", json=payload)
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert "candidate_routes" in data
    assert len(data["candidate_routes"]) > 0
    assert "engine_version" in data
    assert "disclaimer_ta" in data
    assert "data_provenance" in data


def test_route_policy_endpoint(client):
    res = client.get("/api/v1/routes/policy")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["version"] == "2.4.0"
    assert "severity_weights" in data
    assert "normalization_rules" in data
    assert data["hazard_buffer_meters"] == 1200.0


def test_incident_sos_idempotency(client, test_tourist):
    payload = {
        "latitude": 13.0499,
        "longitude": 80.2824,
        "severity": "CRITICAL",
        "description": "Rising tide near beach road",
        "person_count": 2,
        "idempotency_key": "IDEMP-KEY-TEST-12345",
    }
    # First submission
    res1 = client.post("/api/v1/incidents", json=payload, headers=test_tourist["headers"])
    assert res1.status_code == status.HTTP_200_OK
    inc1 = res1.json()

    # Second submission with same idempotency key
    res2 = client.post("/api/v1/incidents", json=payload, headers=test_tourist["headers"])
    assert res2.status_code == status.HTTP_200_OK
    inc2 = res2.json()

    # Should return identical incident without duplicate record
    assert inc1["id"] == inc2["id"]
    assert inc1["reference_code"] == inc2["reference_code"]


def test_incident_lifecycle_transitions(client, test_tourist, test_responder):
    # 1. Create SOS incident
    sos_payload = {
        "latitude": 12.98,
        "longitude": 80.22,
        "severity": "CRITICAL",
        "description": "Flash waterlogging trapped vehicle",
        "idempotency_key": "IDEMP-LIFECYCLE-999",
    }
    res_create = client.post("/api/v1/incidents", json=sos_payload, headers=test_tourist["headers"])
    assert res_create.status_code == status.HTTP_200_OK
    inc_id = res_create.json()["id"]
    assert res_create.json()["status"] == "SUBMITTED"

    # 2. Responder acknowledges incident
    res_ack = client.post(
        f"/api/v1/responders/incidents/{inc_id}/transition",
        json={"to_status": "ACKNOWLEDGED", "note": "Station 4 acknowledged ticket"},
        headers=test_responder["headers"],
    )
    assert res_ack.status_code == status.HTTP_200_OK
    assert res_ack.json()["status"] == "ACKNOWLEDGED"

    # 3. Transition to ASSISTANCE_EN_ROUTE
    res_route = client.post(
        f"/api/v1/responders/incidents/{inc_id}/transition",
        json={"to_status": "ASSISTANCE_EN_ROUTE", "note": "Rescue unit deployed"},
        headers=test_responder["headers"],
    )
    assert res_route.status_code == status.HTTP_200_OK
    assert res_route.json()["status"] == "ASSISTANCE_EN_ROUTE"

    # 4. Resolve incident
    res_res = client.post(
        f"/api/v1/responders/incidents/{inc_id}/transition",
        json={"to_status": "RESOLVED", "note": "Citizens safely escorted to relief center"},
        headers=test_responder["headers"],
    )
    assert res_res.status_code == status.HTTP_200_OK
    assert res_res.json()["status"] == "RESOLVED"

    # 5. Invalid transition from terminal state -> Expect 400 Bad Request
    res_invalid = client.post(
        f"/api/v1/responders/incidents/{inc_id}/transition",
        json={"to_status": "SUBMITTED", "note": "Invalid reopen"},
        headers=test_responder["headers"],
    )
    assert res_invalid.status_code == status.HTTP_400_BAD_REQUEST


def test_moderation_permissions_enforced(client, test_tourist, test_responder):
    # 1. Report a hazard
    hazard_payload = {
        "hazard_type": "fallen_tree",
        "latitude": 13.05,
        "longitude": 80.25,
        "severity": "MODERATE",
        "description": "Fallen branch blocking lane",
    }
    res_h = client.post("/api/v1/hazards", json=hazard_payload, headers=test_tourist["headers"])
    assert res_h.status_code == status.HTTP_200_OK
    hazard_id = res_h.json()["id"]

    # 2. Tourist attempts moderation -> Expect 403 Forbidden
    res_mod_tourist = client.post(
        f"/api/v1/reports/{hazard_id}/moderate",
        json={"action": "VERIFY", "note": "Tourist verified"},
        headers=test_tourist["headers"],
    )
    assert res_mod_tourist.status_code == status.HTTP_403_FORBIDDEN

    # 3. Responder attempts moderation -> Expect 200 OK
    res_mod_resp = client.post(
        f"/api/v1/reports/{hazard_id}/moderate",
        json={"action": "VERIFY", "note": "Verified by responder unit"},
        headers=test_responder["headers"],
    )
    assert res_mod_resp.status_code == status.HTTP_200_OK
    assert res_mod_resp.json()["status"] == "VERIFIED"
