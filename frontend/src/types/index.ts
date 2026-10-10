export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: 'tourist' | 'responder' | 'administrator';
  is_active: boolean;
  created_at: string;
}

export interface HazardEvidenceItem {
  hazard_id?: string;
  hazard_type: string;
  proximity_meters: number;
  severity: string;
  verification_status: string;
  source: string;
  source_timestamp: string;
  description?: string;
  penalty_score: number;
}

export interface VulnerableSegmentItem {
  name: string;
  segment_type: string;
  elevation_m: number;
  risk_description: string;
  risk_description_ta?: string;
}

export interface ForecastRiskTrend {
  trend_1h: string;
  trend_6h: string;
  projected_max_rain_mm: number;
  summary_en: string;
  summary_ta: string;
}

export interface CandidateRoute {
  route_index: number;
  name: string;
  summary: string;
  distance_meters: number;
  duration_seconds: number;
  coordinates: [number, number][]; // [lng, lat]
  risk_score: number;
  risk_category: 'LOW' | 'ELEVATED' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  is_recommended: boolean;
  has_critical_closure: boolean;
  contributing_hazards: HazardEvidenceItem[];
  vulnerable_segments?: VulnerableSegmentItem[];
  forecast_trend?: ForecastRiskTrend;
  data_confidence?: string;
  uncertainty_note?: string;
  explanation_en: string;
  explanation_ta: string;
}

export interface RouteAssessmentResponse {
  assessment_id?: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  candidate_routes: CandidateRoute[];
  recommended_route_index: number;
  engine_version: string;
  evaluated_at: string;
  weather_summary?: {
    temperature_c: number;
    precipitation_mm: number;
    wind_speed_kmh: number;
    condition: string;
    condition_ta: string;
  };
  official_alerts_active: number;
  data_provenance?: Record<string, string>;
  known_data_gaps: string[];
  disclaimer_en: string;
  disclaimer_ta: string;
}

export interface HazardReport {
  id: string;
  reporter_id?: string;
  hazard_type: string;
  latitude: number;
  longitude: number;
  severity: string;
  description?: string;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'RESOLVED';
  upvotes: number;
  is_simulated: boolean;
  source: string;
  source_timestamp: string;
  created_at: string;
}

export interface Shelter {
  id: string;
  name: string;
  name_ta?: string;
  address: string;
  district: string;
  latitude: number;
  longitude: number;
  capacity: number;
  current_occupancy: number;
  occupancy_percentage: number;
  contact_phone?: string;
  status: 'OPEN' | 'FULL' | 'CLOSED';
  has_medical: boolean;
  has_food: boolean;
  has_power_backup: boolean;
  is_official: boolean;
}

export interface IncidentEvent {
  id: string;
  incident_id: string;
  actor_id: string;
  from_status?: string;
  to_status: string;
  note?: string;
  is_internal: boolean;
  created_at: string;
}

export interface IncidentAssignment {
  id: string;
  incident_id: string;
  responder_id: string;
  responder_name?: string;
  status: string;
  assigned_at: string;
}

export interface IncidentPublicUpdate {
  id: string;
  incident_id: string;
  update_text: string;
  broadcast_time: string;
}

export interface Incident {
  id: string;
  reference_code: string;
  user_id: string;
  latitude: number;
  longitude: number;
  address?: string;
  severity: string;
  status: 'SUBMITTED' | 'ACKNOWLEDGED' | 'ASSISTANCE_EN_ROUTE' | 'RESOLVED' | 'CANCELLED' | 'UNABLE_TO_RESPOND';
  contact_phone?: string;
  description?: string;
  person_count: number;
  is_simulated: boolean;
  created_at: string;
  updated_at: string;
  events: IncidentEvent[];
  assignments: IncidentAssignment[];
  public_updates: IncidentPublicUpdate[];
}

export interface OfficialAlert {
  id: string;
  headline: string;
  headline_ta?: string;
  description: string;
  description_ta?: string;
  severity: string;
  urgency: string;
  area_desc: string;
  effective: string;
  expires: string;
  sender_name: string;
  source: string;
  instruction?: string;
  instruction_ta?: string;
  is_live: boolean;
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  current: {
    temperature_c: number;
    relative_humidity: number;
    precipitation_mm: number;
    wind_speed_kmh: number;
    wind_direction_deg: number;
    weather_code: number;
    condition_description: string;
    condition_ta: string;
    is_cyclone_risk: boolean;
    is_flood_risk: boolean;
    data_source: string;
    fetched_at: string;
    is_cached: boolean;
  };
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  scenario_type: string;
  is_active: boolean;
}
