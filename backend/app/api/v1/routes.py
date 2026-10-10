import json
from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.repositories.hazard_repo import HazardRepository
from app.db.repositories.assessment_repo import AssessmentRepository
from app.db.models.assessment import RouteAssessment, RouteAssessmentEvidence
from app.schemas.route import RouteAssessmentRequest, RouteAssessmentOut, RiskPolicyOut
from app.integrations.routing.osrm_router import OsrmRouterClient
from app.integrations.weather.open_meteo import OpenMeteoClient
from app.integrations.official_alerts.ndma_sachet import NdmaSachetClient
from app.integrations.geocoding.nominatim import NominatimClient
from app.services.risk.engine import RouteRiskEngine
from app.core.config import settings

router = APIRouter(prefix="/routes", tags=["Routing & Risk Assessment"])

osrm_client = OsrmRouterClient()
weather_client = OpenMeteoClient()
alerts_client = NdmaSachetClient()
nominatim_client = NominatimClient()
risk_engine = RouteRiskEngine()


@router.get("/policy", response_model=RiskPolicyOut)
def get_risk_assessment_policy():
    """
    Returns the versioned, deterministic risk assessment policy parameters,
    including base severity weights, multipliers, normalization brackets, and buffer radiuses.
    """
    return risk_engine.get_risk_policy()


@router.post("/assess", response_model=RouteAssessmentOut)
async def assess_route_risk(
    req: RouteAssessmentRequest,
    db: Session = Depends(get_db),
):
    """
    Evaluates multiple candidate routes using spatial corridor buffering, active hazard proximity,
    NDMA alerts, Open-Meteo rainfall, and elevation vulnerability.
    Returns full heuristic risk explanation in English and Tamil.
    """
    hazard_repo = HazardRepository(db)
    assessment_repo = AssessmentRepository(db)

    # 1. Fetch Candidate Routes (OSRM or Resilient Corridor Generator)
    candidate_routes_data = await osrm_client.get_candidate_routes(
        req.origin_lat, req.origin_lng, req.destination_lat, req.destination_lng, req.travel_mode
    )

    # 2. Fetch Active Hazards (respecting simulation flag)
    hazards, _ = hazard_repo.list_hazards(
        is_simulated=req.is_simulated,
        lat=req.origin_lat,
        lng=req.origin_lng,
        radius_km=40.0,
        limit=200,
    )

    # 3. Fetch Weather & Alerts Context
    weather_data = await weather_client.get_forecast(req.origin_lat, req.origin_lng)
    rain_mm = weather_data.current.precipitation_mm
    wind_kmh = weather_data.current.wind_speed_kmh

    hourly_dicts = [
        {
            "precipitation_mm": item.precipitation_mm,
            "temperature_c": item.temperature_c,
            "wind_speed_kmh": item.wind_speed_kmh,
        }
        for item in weather_data.hourly
    ]

    official_alerts = await alerts_client.get_active_alerts(req.origin_lat, req.origin_lng)
    active_alerts_count = len(official_alerts)

    # 4. Run Deterministic Risk Engine
    candidates, recommended_index = risk_engine.evaluate_routes(
        candidate_routes_data=candidate_routes_data,
        hazards=hazards,
        active_alerts_count=active_alerts_count,
        weather_rain_mm=rain_mm,
        weather_wind_kmh=wind_kmh,
        hourly_forecast=hourly_dicts,
    )

    recommended_candidate = next((c for c in candidates if c.route_index == recommended_index), candidates[0])

    # 5. Persist Route Assessment Snapshot
    assessment_model = RouteAssessment(
        origin_lat=req.origin_lat,
        origin_lng=req.origin_lng,
        destination_lat=req.destination_lat,
        destination_lng=req.destination_lng,
        overall_score=recommended_candidate.risk_score,
        risk_category=recommended_candidate.risk_category,
        engine_version=risk_engine.version,
        distance_meters=recommended_candidate.distance_meters,
        duration_seconds=recommended_candidate.duration_seconds,
        geometry_json=json.dumps(recommended_candidate.coordinates),
        summary_en=recommended_candidate.explanation_en,
        summary_ta=recommended_candidate.explanation_ta,
        is_simulated=req.is_simulated,
    )

    evidences = []
    for h in recommended_candidate.contributing_hazards:
        evidences.append(
            RouteAssessmentEvidence(
                hazard_type=h.hazard_type,
                proximity_meters=h.proximity_meters,
                severity=h.severity,
                verification_status=h.verification_status,
                source=h.source,
                source_timestamp=h.source_timestamp,
                factor_weight=h.penalty_score,
            )
        )

    saved_assessment = assessment_repo.create(assessment_model, evidences)

    data_provenance = {
        "routing_source": "OSRM Open Source Routing Machine / Topological Corridor Engine",
        "weather_source": "Open-Meteo Global Forecasting Model",
        "alerts_source": "NDMA / Tamil Nadu SDMA Sachet CAP Feed",
        "elevation_model": "NASA SRTM Digital Elevation / Regional Coastal Profiler",
        "hazard_records": "Verified Field Reports & Community Incident Telemetry",
        "risk_engine": f"SafeRoute Deterministic Engine v{risk_engine.version}",
    }

    return RouteAssessmentOut(
        assessment_id=saved_assessment.id,
        origin={"lat": req.origin_lat, "lng": req.origin_lng},
        destination={"lat": req.destination_lat, "lng": req.destination_lng},
        candidate_routes=candidates,
        recommended_route_index=recommended_index,
        engine_version=risk_engine.version,
        evaluated_at=datetime.now(timezone.utc),
        weather_summary={
            "temperature_c": weather_data.current.temperature_c,
            "precipitation_mm": rain_mm,
            "wind_speed_kmh": wind_kmh,
            "condition": weather_data.current.condition_description,
            "condition_ta": weather_data.current.condition_ta,
        },
        official_alerts_active=active_alerts_count,
        data_provenance=data_provenance,
        known_data_gaps=[
            "Unmonitored minor interior ward subways",
            "Private residential compound inundation",
            "Unreported localized powerline sagging",
        ],
        disclaimer_en="SafeRoute AI calculations are heuristic safety estimates and do not substitute for official state emergency evacuation orders.",
        disclaimer_ta="SafeRoute AI கணிப்புகள் வழிகாட்டுதல் மதிப்பீடுகள் மட்டுமே. தமிழ்நாடு அரசின் அதிகாரப்பூர்வ பேரிடர் மீட்பு உத்தரவுகளை பின்பற்றவும்.",
    )


@router.get("/geocode")
async def geocode_query(query: str = Query(..., min_length=2)):
    """Geocode search query using Nominatim with Tamil Nadu landmark fallback."""
    return await nominatim_client.geocode(query)
