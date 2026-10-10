import math
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple, Optional
from shapely.geometry import LineString, Point
from app.core.config import settings
from app.db.models.hazard import HazardReport
from app.schemas.route import (
    CandidateRoute,
    HazardEvidenceItem,
    VulnerableSegmentItem,
    ForecastRiskTrend,
    RiskPolicyOut,
)


class RouteRiskEngine:
    """
    Deterministic Heuristic Route-Risk Engine (Version 2.4.0).
    Evaluates candidate routes against:
    - Spatial hazard proximity, severity, verification, and freshness decay.
    - Low-lying terrain and coastal elevation vulnerability.
    - 1–6 hour predictive weather forecast trends.
    - Missing data uncertainty and critical road closure restrictions.
    """
    def __init__(self, version: str = "2.4.0"):
        self.version = version

        # Documented Base Severity Weights (Points)
        self.SEVERITY_WEIGHTS = {
            "CRITICAL": 45.0,
            "SEVERE": 30.0,
            "HIGH": 30.0,
            "MODERATE": 15.0,
            "MEDIUM": 15.0,
            "ADVISORY": 7.0,
            "LOW": 7.0,
        }

        # Verification Status Multipliers
        self.VERIFICATION_MULTIPLIERS = {
            "VERIFIED": 1.0,
            "PENDING_VERIFICATION": 0.65,
            "REJECTED": 0.0,
            "RESOLVED": 0.1,  # Residual caution
        }

        # Hazard Type Specific Multipliers
        self.TYPE_MULTIPLIERS = {
            "road_closure": 2.5,
            "road_damage": 2.2,
            "flooding": 1.8,
            "flood": 1.8,
            "subway_inundation": 2.0,
            "tidal_surge": 1.7,
            "fallen_tree": 1.2,
            "tree_fallen": 1.2,
            "powerline": 1.5,
            "waterlogging": 1.4,
        }

    def get_risk_policy(self) -> RiskPolicyOut:
        """Returns documented, versioned policy parameters for complete explainability."""
        return RiskPolicyOut(
            version=self.version,
            policy_name="SafeRoute Deterministic Corridor Risk Policy (v2.4)",
            severity_weights=self.SEVERITY_WEIGHTS,
            verification_multipliers=self.VERIFICATION_MULTIPLIERS,
            type_multipliers=self.TYPE_MULTIPLIERS,
            hazard_buffer_meters=float(settings.HAZARD_BUFFER_METERS),
            normalization_rules={
                "LOW": "Score < 25.0 — Safe nominal corridor; no verified closures or severe hazard traps within 1.2km buffer.",
                "ELEVATED": "Score 25.0 to 54.9 — Moderate caution; localized hazard proximity or minor rainfall exposure.",
                "HIGH": "Score 55.0 to 74.9 — High danger; substantial waterlogging, fallen trees, or heavy rainfall intersecting corridor buffer.",
                "CRITICAL": "Score >= 75.0 or confirmed official road closure — Passage blocked or severe life-safety risk.",
            },
            stale_hazard_threshold_hours=float(settings.STALE_HAZARD_HOURS),
            disclaimer=(
                "Scores represent deterministic heuristic safety evaluations based on spatial buffering, "
                "terrain elevation, verified reports, and weather forecasts. They are not calibrated probabilities."
            ),
        )

    def evaluate_routes(
        self,
        candidate_routes_data: List[Dict[str, Any]],
        hazards: List[HazardReport],
        active_alerts_count: int = 0,
        weather_rain_mm: float = 0.0,
        weather_wind_kmh: float = 0.0,
        hourly_forecast: Optional[List[Dict[str, Any]]] = None,
    ) -> Tuple[List[CandidateRoute], int]:
        evaluated_candidates: List[CandidateRoute] = []
        now = datetime.now(timezone.utc)

        # 1. Pre-process hazard points and freshness decay
        hazard_entities = []
        stale_hazard_count = 0
        for h in hazards:
            if h.status == "REJECTED":
                continue
            age_hours = 0.0
            if h.source_timestamp:
                delta = now - (
                    h.source_timestamp
                    if h.source_timestamp.tzinfo
                    else h.source_timestamp.replace(tzinfo=timezone.utc)
                )
                age_hours = max(0.0, delta.total_seconds() / 3600.0)

            if age_hours > float(settings.STALE_HAZARD_HOURS):
                stale_hazard_count += 1

            freshness_factor = max(0.3, 1.0 - (age_hours / float(settings.STALE_HAZARD_HOURS)))

            hazard_entities.append({
                "model": h,
                "point": Point(h.longitude, h.latitude),
                "freshness_factor": freshness_factor,
                "age_hours": age_hours,
            })

        # 2. Evaluate 1–6 Hour Predictive Forecast Trend from hourly weather
        forecast_trend = self._compute_forecast_trend(hourly_forecast, weather_rain_mm)

        for item in candidate_routes_data:
            idx = item.get("index", 0)
            coords = item.get("coordinates", [])
            dist = float(item.get("distance_meters", 0.0))
            dur = float(item.get("duration_seconds", 0.0))
            name = item.get("name", f"Route {idx + 1}")
            summary = item.get("summary", "")

            if not coords or len(coords) < 2:
                # Degenerate route
                evaluated_candidates.append(
                    CandidateRoute(
                        route_index=idx,
                        name=name,
                        summary=summary,
                        distance_meters=dist,
                        duration_seconds=dur,
                        coordinates=coords,
                        risk_score=99.0,
                        risk_category="CRITICAL",
                        is_recommended=False,
                        has_critical_closure=True,
                        contributing_hazards=[],
                        vulnerable_segments=[],
                        forecast_trend=forecast_trend,
                        data_confidence="LOW_DATA_UNCERTAINTY",
                        uncertainty_note="Invalid or unroutable geometry coordinates provided.",
                        explanation_en="Invalid route geometry detected.",
                        explanation_ta="தவறான பாதை வடிவம் கண்டறியப்பட்டது.",
                    )
                )
                continue

            # Convert to Shapely LineString: coordinates are [lng, lat]
            line = LineString(coords)

            contributing_hazards: List[HazardEvidenceItem] = []
            cumulative_hazard_penalty = 0.0
            has_critical_closure = False

            # Evaluate proximity to each active hazard
            for he in hazard_entities:
                h = he["model"]
                pt = he["point"]
                # Approximate distance in meters: 1 deg lat ~ 111,000 meters
                deg_dist = line.distance(pt)
                dist_meters = deg_dist * 111000.0

                if dist_meters <= settings.HAZARD_BUFFER_METERS:
                    proximity_factor = max(
                        0.0,
                        (settings.HAZARD_BUFFER_METERS - dist_meters) / settings.HAZARD_BUFFER_METERS,
                    )

                    base_pen = self.SEVERITY_WEIGHTS.get(h.severity.upper(), 15.0)
                    ver_mult = self.VERIFICATION_MULTIPLIERS.get(h.status.upper(), 0.65)
                    type_mult = self.TYPE_MULTIPLIERS.get(h.hazard_type.lower(), 1.0)
                    freshness = he["freshness_factor"]

                    penalty = round(base_pen * ver_mult * type_mult * proximity_factor * freshness, 1)

                    # Road closure critical check
                    if (
                        h.hazard_type.lower() in ["road_closure", "road_damage"]
                        and dist_meters < 350.0
                        and h.status == "VERIFIED"
                    ):
                        has_critical_closure = True
                        penalty += 50.0

                    cumulative_hazard_penalty += penalty

                    contributing_hazards.append(
                        HazardEvidenceItem(
                            hazard_id=h.id,
                            hazard_type=h.hazard_type,
                            proximity_meters=round(dist_meters, 1),
                            severity=h.severity,
                            verification_status=h.status,
                            source=h.source,
                            source_timestamp=h.source_timestamp,
                            description=h.description,
                            penalty_score=penalty,
                        )
                    )

            # 3. Analyze Vulnerable Road Segments along geometry (Elevation & Low-lying Basin)
            vulnerable_segments = self._analyze_vulnerable_segments(coords)
            elevation_penalty = sum(
                8.0 if seg.segment_type == "COASTAL_LOWLAND" else 5.0 for seg in vulnerable_segments
            )

            # 4. Weather & Alert penalties
            weather_penalty = 0.0
            if weather_rain_mm > 15.0:
                weather_penalty += min(20.0, (weather_rain_mm - 15.0) * 0.8)
            if weather_wind_kmh > 40.0:
                weather_penalty += min(15.0, (weather_wind_kmh - 40.0) * 0.5)

            # Forecast trend factor (if rainfall is projected to rise within 3-6 hours)
            if forecast_trend and forecast_trend.trend_6h == "RISING":
                weather_penalty += 6.0

            alert_penalty = min(20.0, active_alerts_count * 6.0)

            # Total composite heuristic score capped between 5.0 and 100.0
            raw_score = 5.0 + cumulative_hazard_penalty + elevation_penalty + weather_penalty + alert_penalty
            if has_critical_closure:
                raw_score = max(85.0, raw_score)

            final_risk_score = min(100.0, round(raw_score, 1))

            # Categorize: LOW, ELEVATED, HIGH, CRITICAL
            if final_risk_score < 25.0:
                category = "LOW"
            elif final_risk_score < 55.0:
                category = "ELEVATED"
            elif final_risk_score < 75.0:
                category = "HIGH"
            else:
                category = "CRITICAL"

            # Data confidence & uncertainty indicators
            data_confidence = "HIGH"
            uncertainty_notes = []
            if len(hazards) == 0:
                data_confidence = "MODERATE"
                uncertainty_notes.append("No active hazard reports filed in area; missing reports do not imply zero risk.")
            if stale_hazard_count > 0:
                uncertainty_notes.append(f"{stale_hazard_count} nearby hazard report(s) exceed {settings.STALE_HAZARD_HOURS}h freshness window.")
            if len(vulnerable_segments) > 0 and weather_rain_mm > 10.0:
                uncertainty_notes.append("Low-lying terrain may experience unmonitored flash runoff during rainfall peaks.")

            uncertainty_str = " • ".join(uncertainty_notes) if uncertainty_notes else None

            # Generate natural language explainability
            explanation_en, explanation_ta = self._generate_explanation(
                category=category,
                score=final_risk_score,
                hazards=contributing_hazards,
                vulnerable_segments=vulnerable_segments,
                has_closure=has_critical_closure,
                rain_mm=weather_rain_mm,
                forecast_trend=forecast_trend,
            )

            evaluated_candidates.append(
                CandidateRoute(
                    route_index=idx,
                    name=name,
                    summary=summary,
                    distance_meters=dist,
                    duration_seconds=dur,
                    coordinates=coords,
                    risk_score=final_risk_score,
                    risk_category=category,
                    is_recommended=False,
                    has_critical_closure=has_critical_closure,
                    contributing_hazards=contributing_hazards,
                    vulnerable_segments=vulnerable_segments,
                    forecast_trend=forecast_trend,
                    data_confidence=data_confidence,
                    uncertainty_note=uncertainty_str,
                    explanation_en=explanation_en,
                    explanation_ta=explanation_ta,
                )
            )

        # 5. Route Selection Logic: Strict critical restriction exclusion
        valid_candidates = [c for c in evaluated_candidates if not c.has_critical_closure]
        if not valid_candidates:
            # All routes compromised: Pick lowest risk, but warn explicitly
            valid_candidates = evaluated_candidates

        safest = min(valid_candidates, key=lambda c: (c.risk_score, c.duration_seconds))
        recommended_index = safest.route_index

        for c in evaluated_candidates:
            if c.route_index == recommended_index:
                c.is_recommended = True

        return evaluated_candidates, recommended_index

    def _analyze_vulnerable_segments(self, coords: List[List[float]]) -> List[VulnerableSegmentItem]:
        """Identifies vulnerable low-lying coastal and basin road segments along route coordinates."""
        segments: List[VulnerableSegmentItem] = []
        seen_types = set()

        for pt in coords:
            lng, lat = pt[0], pt[1]

            # 1. Coastal Lowland Zone (Marina / ECR / Santhome / Ennore) - lng > 80.26 and lat 12.8 to 13.2
            if lng > 80.26 and 12.80 <= lat <= 13.20:
                if "COASTAL_LOWLAND" not in seen_types:
                    seen_types.add("COASTAL_LOWLAND")
                    segments.append(
                        VulnerableSegmentItem(
                            name="Coastal Lowland Corridor (ECR / Beach Link)",
                            segment_type="COASTAL_LOWLAND",
                            elevation_m=4.5,
                            risk_description="Low-elevation coastal corridor (<5m MSL) subject to high-tide sea water surge and drainage outflow backflow.",
                            risk_description_ta="கடலோர தாழ்வான பாதை (<5மீ MSL) கடல் அலை சீற்றம் மற்றும் நீர் வடியும் தாமதத்திற்கு வாய்ப்புள்ளது.",
                        )
                    )

            # 2. Urban Basin / Subway Bottleneck (Velachery / Madipakkam / Vyasarpadi)
            if (12.96 <= lat <= 12.99 and 80.20 <= lng <= 80.23) or (13.10 <= lat <= 13.13 and 80.24 <= lng <= 80.27):
                if "SUBWAY_BASIN" not in seen_types:
                    seen_types.add("SUBWAY_BASIN")
                    segments.append(
                        VulnerableSegmentItem(
                            name="Urban Drainage Basin / Subway Link",
                            segment_type="SUBWAY_BASIN",
                            elevation_m=6.0,
                            risk_description="Natural topographical depression zone adjoining major railway subways and arterial stormwater channels.",
                            risk_description_ta="இயற்கை வடிகால் தாழ்வுப்பகுதி மற்றும் சுரங்கப்பாதை நீர் தேக்க அபாயம்.",
                        )
                    )

            # 3. Mountain Slopes (Nilgiris / Western Ghats: lat 11.2-11.6, lng < 77.0)
            if 11.2 <= lat <= 11.6 and lng < 77.0:
                if "HILL_RUNOFF" not in seen_types:
                    seen_types.add("HILL_RUNOFF")
                    segments.append(
                        VulnerableSegmentItem(
                            name="Western Ghats Mountain Section",
                            segment_type="HILL_RUNOFF",
                            elevation_m=1850.0,
                            risk_description="Steep gradient hairpin curves with heightened surface runoff and potential rockfall vulnerability.",
                            risk_description_ta="மலைப்பாதை கொண்டை ஊசி வளைவு பகுதி, மண் சரிவு எச்சரிக்கை.",
                        )
                    )

        return segments

    def _compute_forecast_trend(
        self,
        hourly_forecast: Optional[List[Dict[str, Any]]],
        current_rain_mm: float,
    ) -> ForecastRiskTrend:
        """Estimates changing risk trend over next 1–6 hours using hourly meteorological data."""
        if not hourly_forecast or len(hourly_forecast) < 2:
            return ForecastRiskTrend(
                trend_1h="STABLE",
                trend_6h="STABLE",
                projected_max_rain_mm=current_rain_mm,
                summary_en="Forecast indicates stable atmospheric conditions over the next 6 hours.",
                summary_ta="அடுத்த 6 மணி நேரத்திற்கு வானிலை சீராக இருக்கும் என கணிக்கப்பட்டுள்ளது.",
            )

        precips = [float(h.get("precipitation_mm", 0.0)) for h in hourly_forecast[:6]]
        max_rain = max(precips) if precips else current_rain_mm
        rain_1h = precips[0] if len(precips) > 0 else current_rain_mm

        trend_1h = "RISING" if rain_1h > current_rain_mm + 3.0 else "RECEDING" if rain_1h < current_rain_mm - 3.0 else "STABLE"
        trend_6h = "RISING" if max_rain > current_rain_mm + 5.0 else "RECEDING" if max_rain < current_rain_mm - 5.0 else "STABLE"

        if trend_6h == "RISING":
            en = f"Rainfall expected to increase to {max_rain} mm/h within 3–6 hours; route risk may elevate."
            ta = f"அடுத்த 3-6 மணி நேரத்தில் மழை {max_rain} மிமீ/மணி வரை அதிகரிக்கும்; அபாய நிலை உயரும் வாய்ப்புள்ளது."
        elif trend_6h == "RECEDING":
            en = f"Rainfall receding from peak levels over next 6 hours; road conditions expected to gradually stabilize."
            ta = f"அடுத்த 6 மணி நேரத்தில் மழைப்பொழிவு குறையும் என எதிர்பார்க்கப்படுகிறது; சாலை நிலைமை சீராகும்."
        else:
            en = f"Atmospheric precipitation stable (max ~{max_rain} mm/h) over next 6-hour forecast window."
            ta = f"அடுத்த 6 மணி நேரத்திற்கு மழைப்பொழிவு ஒரே அளவில் நீடிக்கும் (அதிகபட்சம் ~{max_rain} மிமீ/மணி)."

        return ForecastRiskTrend(
            trend_1h=trend_1h,
            trend_6h=trend_6h,
            projected_max_rain_mm=max_rain,
            summary_en=en,
            summary_ta=ta,
        )

    def _generate_explanation(
        self,
        category: str,
        score: float,
        hazards: List[HazardEvidenceItem],
        vulnerable_segments: List[VulnerableSegmentItem],
        has_closure: bool,
        rain_mm: float,
        forecast_trend: Optional[ForecastRiskTrend],
    ) -> Tuple[str, str]:
        if has_closure:
            en = (
                f"CRITICAL RESTRICTION: Verified road closure detected directly on corridor buffer. "
                f"Strictly prohibited as a safe primary route."
            )
            ta = f"கடுமையான தடை: பாதையில் சாலை அடைப்பு உறுதி செய்யப்பட்டுள்ளது. இந்த வழியில் செல்லக்கூடாது."
            return en, ta

        hazard_count = len(hazards)
        seg_names = ", ".join([s.name for s in vulnerable_segments]) if vulnerable_segments else "None noted"

        trend_txt = f" Trend: {forecast_trend.summary_en}" if forecast_trend else ""
        trend_txt_ta = f" போக்கு: {forecast_trend.summary_ta}" if forecast_trend else ""

        if category == "LOW":
            en = (
                f"Safe Corridor (Risk Index: {score}/100). No severe blockages or flood traps detected. "
                f"Elevation is stable.{trend_txt}"
            )
            ta = f"பாதுகாப்பான பாதை (அபாய குறியீடு: {score}/100). தீவிர இடர்பாடுகள் எதுவும் இல்லை.{trend_txt_ta}"
        elif category == "ELEVATED":
            en = (
                f"Elevated Caution (Risk Index: {score}/100). {hazard_count} localized hazard(s) nearby. "
                f"Rain accumulation {rain_mm} mm/h. Low-lying segments: {seg_names}.{trend_txt}"
            )
            ta = f"மிதமான எச்சரிக்கை (அபாய குறியீடு: {score}/100). அருகில் {hazard_count} இடர்பாடுகள் உள்ளன. மழை {rain_mm} மிமீ/மணி.{trend_txt_ta}"
        elif category == "HIGH":
            en = (
                f"High Risk (Risk Index: {score}/100). Substantial waterlogging or fallen debris intersecting route buffer. "
                f"Vulnerable segments: {seg_names}.{trend_txt}"
            )
            ta = f"அதிக ஆபத்து (அபாய குறியீடு: {score}/100). பாதையை ஒட்டி வெள்ள நீர் அல்லது தடைகள் உள்ளன.{trend_txt_ta}"
        else:
            en = (
                f"EXTREME DANGER (Risk Index: {score}/100). Multiple verified severe hazards detected along corridor. "
                f"Travel highly discouraged."
            )
            ta = f"மிகக் கடுமையான அபாயம் (அபாய குறியீடு: {score}/100). பல தீவிர இடர்பாடுகள் உறுதி செய்யப்பட்டுள்ளன. பயணம் தவிர்க்கவும்."

        return en, ta
