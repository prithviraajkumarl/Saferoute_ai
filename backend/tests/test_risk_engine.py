import pytest
from datetime import datetime, timezone, timedelta
from app.services.risk.engine import RouteRiskEngine
from app.db.models.hazard import HazardReport


def test_risk_engine_no_hazards():
    engine = RouteRiskEngine()
    candidates = [
        {
            "index": 0,
            "name": "Route A",
            "distance_meters": 5000.0,
            "duration_seconds": 600.0,
            "coordinates": [[80.20, 13.00], [80.21, 13.01], [80.22, 13.02]],
        }
    ]
    results, rec_idx = engine.evaluate_routes(candidates, hazards=[])
    assert len(results) == 1
    assert results[0].risk_score < 25.0
    assert results[0].risk_category == "LOW"
    assert results[0].is_recommended is True
    assert results[0].has_critical_closure is False
    assert len(results[0].contributing_hazards) == 0
    # Missing data warning test: absence of reports should not be claimed as absolute zero uncertainty
    assert results[0].data_confidence == "MODERATE"
    assert "missing reports do not imply zero risk" in results[0].uncertainty_note


def test_risk_engine_verified_hazard_proximity():
    engine = RouteRiskEngine()
    candidates = [
        {
            "index": 0,
            "name": "Route A",
            "distance_meters": 5000.0,
            "duration_seconds": 600.0,
            "coordinates": [[80.20, 13.00], [80.21, 13.01], [80.22, 13.02]],
        }
    ]
    hazard = HazardReport(
        id="h-01",
        hazard_type="flood",
        latitude=13.01,
        longitude=80.21,  # Directly on the route line
        severity="SEVERE",
        status="VERIFIED",
        source="COMMUNITY",
        source_timestamp=datetime.now(timezone.utc),
    )
    results, rec_idx = engine.evaluate_routes(candidates, hazards=[hazard])
    assert len(results) == 1
    assert len(results[0].contributing_hazards) == 1
    assert results[0].risk_score > 20.0
    assert "flood" in results[0].contributing_hazards[0].hazard_type


def test_risk_engine_road_closure_critical_restriction():
    engine = RouteRiskEngine()
    candidates = [
        {
            "index": 0,
            "name": "Direct Highway (Blocked)",
            "distance_meters": 4000.0,
            "duration_seconds": 500.0,
            "coordinates": [[80.20, 13.00], [80.21, 13.01], [80.22, 13.02]],
        },
        {
            "index": 1,
            "name": "Elevated Bypass (Clear)",
            "distance_meters": 6000.0,
            "duration_seconds": 700.0,
            "coordinates": [[80.20, 13.00], [80.19, 13.01], [80.22, 13.02]],
        },
    ]
    closure = HazardReport(
        id="h-closure",
        hazard_type="road_closure",
        latitude=13.01,
        longitude=80.21,  # Blocks Route 0
        severity="CRITICAL",
        status="VERIFIED",
        source="NDMA_OFFICIAL",
        source_timestamp=datetime.now(timezone.utc),
    )
    results, rec_idx = engine.evaluate_routes(candidates, hazards=[closure])
    assert len(results) == 2
    # Route 0 should be flagged as critical closure
    assert results[0].has_critical_closure is True
    # The bypass (Route 1) should be chosen as recommended, even if slightly longer
    assert rec_idx == 1
    assert results[1].is_recommended is True


def test_risk_engine_stale_hazard_freshness_decay():
    engine = RouteRiskEngine()
    candidates = [
        {
            "index": 0,
            "name": "Route A",
            "distance_meters": 5000.0,
            "duration_seconds": 600.0,
            "coordinates": [[80.20, 13.00], [80.21, 13.01], [80.22, 13.02]],
        }
    ]
    fresh_hazard = HazardReport(
        id="h-fresh",
        hazard_type="fallen_tree",
        latitude=13.01,
        longitude=80.21,
        severity="MODERATE",
        status="VERIFIED",
        source="COMMUNITY",
        source_timestamp=datetime.now(timezone.utc),
    )
    stale_hazard = HazardReport(
        id="h-stale",
        hazard_type="fallen_tree",
        latitude=13.01,
        longitude=80.21,
        severity="MODERATE",
        status="VERIFIED",
        source="COMMUNITY",
        source_timestamp=datetime.now(timezone.utc) - timedelta(hours=36),
    )

    results_fresh, _ = engine.evaluate_routes(candidates, hazards=[fresh_hazard])
    results_stale, _ = engine.evaluate_routes(candidates, hazards=[stale_hazard])

    assert results_fresh[0].risk_score > results_stale[0].risk_score


def test_risk_engine_policy_inspection():
    engine = RouteRiskEngine()
    policy = engine.get_risk_policy()
    assert policy.version == "2.4.0"
    assert "CRITICAL" in policy.severity_weights
    assert policy.severity_weights["CRITICAL"] == 45.0
    assert "LOW" in policy.normalization_rules
    assert "CRITICAL" in policy.normalization_rules
    assert policy.hazard_buffer_meters == 1200.0


def test_risk_engine_vulnerable_coastal_and_basin_segments():
    engine = RouteRiskEngine()
    # Route along Marina/ECR coastal zone (lng > 80.26)
    coastal_candidates = [
        {
            "index": 0,
            "name": "Marina Coastal Route",
            "distance_meters": 4500.0,
            "duration_seconds": 550.0,
            "coordinates": [[80.28, 13.04], [80.27, 13.01]],
        }
    ]
    results, _ = engine.evaluate_routes(coastal_candidates, hazards=[])
    assert len(results[0].vulnerable_segments) >= 1
    assert results[0].vulnerable_segments[0].segment_type == "COASTAL_LOWLAND"
    assert results[0].vulnerable_segments[0].elevation_m < 5.0


def test_risk_engine_1_to_6h_forecast_trend():
    engine = RouteRiskEngine()
    candidates = [
        {
            "index": 0,
            "name": "Route A",
            "distance_meters": 5000.0,
            "duration_seconds": 600.0,
            "coordinates": [[80.20, 13.00], [80.21, 13.01]],
        }
    ]
    # Forecast with rising precipitation
    rising_forecast = [
        {"precipitation_mm": 5.0},
        {"precipitation_mm": 12.0},
        {"precipitation_mm": 24.0},
        {"precipitation_mm": 35.0},
        {"precipitation_mm": 30.0},
        {"precipitation_mm": 25.0},
    ]
    results, _ = engine.evaluate_routes(candidates, hazards=[], weather_rain_mm=2.0, hourly_forecast=rising_forecast)
    assert results[0].forecast_trend is not None
    assert results[0].forecast_trend.trend_6h == "RISING"
    assert results[0].forecast_trend.projected_max_rain_mm == 35.0


def test_risk_engine_heavy_rainfall_exposure():
    engine = RouteRiskEngine()
    candidates = [
        {
            "index": 0,
            "name": "Route Inland",
            "distance_meters": 5000.0,
            "duration_seconds": 600.0,
            "coordinates": [[80.20, 13.00], [80.21, 13.01]],
        }
    ]
    # Heavy rainfall 35 mm/h without any road closures
    results, _ = engine.evaluate_routes(candidates, hazards=[], weather_rain_mm=35.0)
    assert results[0].risk_score > 20.0
    assert results[0].risk_category in ["ELEVATED", "HIGH"]
    assert "35" in results[0].explanation_en


def test_risk_engine_conflicting_field_reports():
    engine = RouteRiskEngine()
    candidates = [
        {
            "index": 0,
            "name": "Arterial Corridor",
            "distance_meters": 5000.0,
            "duration_seconds": 600.0,
            "coordinates": [[80.20, 13.00], [80.21, 13.01]],
        }
    ]
    # Report 1: Resolved flood
    h1 = HazardReport(
        id="h-res",
        hazard_type="flooding",
        latitude=13.005,
        longitude=80.205,
        severity="SEVERE",
        status="RESOLVED",
        source="CITIZEN",
        source_timestamp=datetime.now(timezone.utc),
    )
    # Report 2: Verified active flood at same location
    h2 = HazardReport(
        id="h-act",
        hazard_type="flooding",
        latitude=13.006,
        longitude=80.206,
        severity="CRITICAL",
        status="VERIFIED",
        source="OFFICIAL",
        source_timestamp=datetime.now(timezone.utc),
    )
    results, _ = engine.evaluate_routes(candidates, hazards=[h1, h2])
    assert results[0].data_confidence == "MODERATE"
    assert "Conflicting field reports" in results[0].uncertainty_note


def test_risk_engine_degenerate_geometry_handling():
    engine = RouteRiskEngine()
    candidates = [
        {
            "index": 0,
            "name": "Malformed Corridor",
            "distance_meters": 0.0,
            "duration_seconds": 0.0,
            "coordinates": [],
        }
    ]
    results, rec_idx = engine.evaluate_routes(candidates, hazards=[])
    assert len(results) == 1
    assert results[0].risk_category == "CRITICAL"
    assert results[0].has_critical_closure is True
    assert results[0].data_confidence == "LOW_DATA_UNCERTAINTY"


def test_risk_engine_missing_weather_safety_defaults():
    engine = RouteRiskEngine()
    candidates = [
        {
            "index": 0,
            "name": "Route Baseline",
            "distance_meters": 5000.0,
            "duration_seconds": 600.0,
            "coordinates": [[80.20, 13.00], [80.21, 13.01]],
        }
    ]
    # None values passed for weather parameters should gracefully degrade
    results, _ = engine.evaluate_routes(candidates, hazards=[], weather_rain_mm=None, weather_wind_kmh=None)
    assert len(results) == 1
    assert results[0].risk_score < 25.0


def test_risk_engine_all_routes_closed_rejection():
    engine = RouteRiskEngine()
    candidates = [
        {
            "index": 0,
            "name": "Arterial Highway",
            "distance_meters": 4000.0,
            "duration_seconds": 500.0,
            "coordinates": [[80.20, 13.00], [80.21, 13.01], [80.22, 13.02]],
        },
        {
            "index": 1,
            "name": "Secondary Link",
            "distance_meters": 5000.0,
            "duration_seconds": 600.0,
            "coordinates": [[80.20, 13.00], [80.19, 13.01], [80.22, 13.02]],
        },
    ]
    # Two separate confirmed road closures blocking both routes
    c1 = HazardReport(
        id="c-01",
        hazard_type="road_closure",
        latitude=13.01,
        longitude=80.21,  # Blocks Route 0
        severity="CRITICAL",
        status="VERIFIED",
        source="POLICE_CONTROL_ROOM",
        source_timestamp=datetime.now(timezone.utc),
    )
    c2 = HazardReport(
        id="c-02",
        hazard_type="road_closure",
        latitude=13.01,
        longitude=80.19,  # Blocks Route 1
        severity="CRITICAL",
        status="VERIFIED",
        source="STATE_DISASTER_MGMT",
        source_timestamp=datetime.now(timezone.utc),
    )
    results, rec_idx = engine.evaluate_routes(candidates, hazards=[c1, c2])
    assert len(results) == 2
    # Strict safety rule: NO route should be recommended when all are compromised
    assert rec_idx == -1
    for r in results:
        assert r.is_recommended is False
        assert r.has_critical_closure is True
        assert r.risk_category == "CRITICAL"
        assert r.rejection_reason_en is not None
        assert "Route rejected" in r.rejection_reason_en


def test_risk_engine_near_closure_not_intersecting():
    engine = RouteRiskEngine()
    candidates = [
        {
            "index": 0,
            "name": "Main Artery",
            "distance_meters": 5000.0,
            "duration_seconds": 600.0,
            "coordinates": [[80.20, 13.00], [80.21, 13.01], [80.22, 13.02]],
        }
    ]
    # Hazard is ~660 meters away (0.006 deg * 111,000m ~ 666m)
    # Inside 1200m buffer, but well outside the 350m physical road corridor threshold
    near_closure = HazardReport(
        id="c-near",
        hazard_type="road_closure",
        latitude=13.016,  # 0.006 deg away from line point (80.21, 13.01)
        longitude=80.21,
        severity="CRITICAL",
        status="VERIFIED",
        source="CITIZEN",
        source_timestamp=datetime.now(timezone.utc),
    )
    results, rec_idx = engine.evaluate_routes(candidates, hazards=[near_closure])
    assert len(results) == 1
    # Proximity penalty is recorded, but corridor is NOT critically closed
    assert results[0].has_critical_closure is False
    assert results[0].is_recommended is True
    assert rec_idx == 0


def test_risk_engine_unverified_closure_metadata():
    engine = RouteRiskEngine()
    candidates = [
        {
            "index": 0,
            "name": "Downtown Link",
            "distance_meters": 5000.0,
            "duration_seconds": 600.0,
            "coordinates": [[80.20, 13.00], [80.21, 13.01], [80.22, 13.02]],
        }
    ]
    # Unverified citizen report on the route line
    unverified_closure = HazardReport(
        id="c-unverified",
        hazard_type="road_closure",
        latitude=13.01,
        longitude=80.21,
        severity="HIGH",
        status="PENDING",  # Not verified!
        source="CITIZEN_APP",
        source_timestamp=datetime.now(timezone.utc),
    )
    results, rec_idx = engine.evaluate_routes(candidates, hazards=[unverified_closure])
    assert len(results) == 1
    # Without VERIFIED status, it does not trigger a hard critical closure
    assert results[0].has_critical_closure is False
    assert results[0].is_recommended is True


@pytest.mark.asyncio
async def test_osrm_provider_offline_fallback():
    from app.integrations.routing.osrm_router import OsrmRouterClient
    # Point client to a non-existent port to guarantee connection refusal
    client = OsrmRouterClient(base_url="http://127.0.0.1:59999")
    corridors = await client.get_candidate_routes(
        origin_lat=13.0827,
        origin_lng=80.2707,
        dest_lat=13.0067,
        dest_lng=80.2206,
    )
    assert len(corridors) == 3
    assert corridors[0]["name"].startswith("Route A")
    assert corridors[0]["source"] == "SafeRoute Topological Engine (Resilient)"
    assert len(corridors[0]["coordinates"]) > 10
    assert corridors[0]["distance_meters"] > 0


