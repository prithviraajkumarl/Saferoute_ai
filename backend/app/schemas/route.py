from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class RouteAssessmentRequest(BaseModel):
    origin_lat: float = Field(..., ge=-90.0, le=90.0)
    origin_lng: float = Field(..., ge=-180.0, le=180.0)
    destination_lat: float = Field(..., ge=-90.0, le=90.0)
    destination_lng: float = Field(..., ge=-180.0, le=180.0)
    travel_mode: str = Field(default="driving", description="driving, walking")
    is_simulated: bool = False


class HazardEvidenceItem(BaseModel):
    hazard_id: Optional[str] = None
    hazard_type: str
    proximity_meters: float
    severity: str
    verification_status: str
    source: str
    source_timestamp: datetime
    description: Optional[str] = None
    penalty_score: float


class VulnerableSegmentItem(BaseModel):
    name: str
    segment_type: str  # COASTAL_LOWLAND, SUBWAY_BASIN, HILL_RUNOFF
    elevation_m: float
    risk_description: str
    risk_description_ta: Optional[str] = None


class ForecastRiskTrend(BaseModel):
    trend_1h: str  # STABLE, RISING, RECEDING
    trend_6h: str  # STABLE, RISING, RECEDING
    projected_max_rain_mm: float
    summary_en: str
    summary_ta: str


class CandidateRoute(BaseModel):
    route_index: int
    name: str
    summary: str
    distance_meters: float
    duration_seconds: float
    coordinates: List[List[float]]  # [[lng, lat], ...]
    risk_score: float  # 0 - 100 heuristic
    risk_category: str  # LOW, ELEVATED, MODERATE, HIGH, CRITICAL
    is_recommended: bool
    has_critical_closure: bool
    rejection_reason_en: Optional[str] = None
    rejection_reason_ta: Optional[str] = None
    contributing_hazards: List[HazardEvidenceItem] = []
    vulnerable_segments: List[VulnerableSegmentItem] = []
    forecast_trend: Optional[ForecastRiskTrend] = None
    data_confidence: str = "HIGH"  # HIGH, MODERATE, LOW_DATA_UNCERTAINTY
    uncertainty_note: Optional[str] = None
    explanation_en: str
    explanation_ta: str


class RiskPolicyOut(BaseModel):
    version: str
    policy_name: str
    severity_weights: Dict[str, float]
    verification_multipliers: Dict[str, float]
    type_multipliers: Dict[str, float]
    hazard_buffer_meters: float
    normalization_rules: Dict[str, str]
    stale_hazard_threshold_hours: float
    disclaimer: str


class RouteAssessmentOut(BaseModel):
    assessment_id: Optional[str] = None
    origin: Dict[str, float]
    destination: Dict[str, float]
    candidate_routes: List[CandidateRoute]
    recommended_route_index: int = Field(default=-1, description="Index of recommended safe route, or -1 if all routes are rejected")
    engine_version: str
    evaluated_at: datetime
    weather_summary: Optional[Dict[str, Any]] = None
    official_alerts_active: int = 0
    data_provenance: Optional[Dict[str, str]] = None
    known_data_gaps: List[str] = []
    disclaimer_en: str
    disclaimer_ta: str
