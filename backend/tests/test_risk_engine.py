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
