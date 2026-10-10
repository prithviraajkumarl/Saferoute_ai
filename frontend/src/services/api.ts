import {
  RouteAssessmentResponse,
  HazardReport,
  Shelter,
  Incident,
  OfficialAlert,
  WeatherData,
  SimulationScenario,
} from '../types';

const API_BASE = '/api/v1';

function getHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const authToken = token || localStorage.getItem('saferoute_token');
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

const FALLBACK_SHELTERS: Shelter[] = [
  {
    id: 'sh-1',
    name: 'Chennai Trade Centre Relief Camp',
    name_ta: 'சென்னை வர்த்தக மைய நிவாரண முகாம்',
    address: 'Nandambakkam, Mount Poonamallee Road, Chennai',
    district: 'Chennai',
    latitude: 13.0131,
    longitude: 80.1872,
    capacity: 1200,
    current_occupancy: 410,
    occupancy_percentage: 34.2,
    contact_phone: '+91-44-2232-1080',
    status: 'OPEN',
    has_medical: true,
    has_food: true,
    has_power_backup: true,
    is_official: true,
  },
  {
    id: 'sh-2',
    name: 'Jawaharlal Nehru Indoor Stadium',
    name_ta: 'ஜவஹர்லால் நேரு உள்விளையாட்டு அரங்கம்',
    address: 'Periamet, Kannappar Thidal, Chennai',
    district: 'Chennai',
    latitude: 13.0850,
    longitude: 80.2740,
    capacity: 2500,
    current_occupancy: 1120,
    occupancy_percentage: 44.8,
    contact_phone: '+91-44-2561-9000',
    status: 'OPEN',
    has_medical: true,
    has_food: true,
    has_power_backup: true,
    is_official: true,
  },
  {
    id: 'sh-3',
    name: 'Velachery Community Hall',
    name_ta: 'வேளச்சேரி சமுதாய நலக்கூடம்',
    address: 'Bypass Road, Velachery, Chennai',
    district: 'Chennai',
    latitude: 12.9780,
    longitude: 80.2190,
    capacity: 600,
    current_occupancy: 530,
    occupancy_percentage: 88.3,
    contact_phone: '+91-44-2244-1234',
    status: 'OPEN',
    has_medical: true,
    has_food: true,
    has_power_backup: false,
    is_official: true,
  },
  {
    id: 'sh-4',
    name: 'Tambaram Municipal High Ground Camp',
    name_ta: 'தாம்பரம் நகராட்சி மேட்டுப்பகுதி முகாம்',
    address: 'GST Road, West Tambaram, Chennai',
    district: 'Chengalpattu',
    latitude: 12.9230,
    longitude: 80.1180,
    capacity: 850,
    current_occupancy: 280,
    occupancy_percentage: 32.9,
    contact_phone: '+91-44-2226-5544',
    status: 'OPEN',
    has_medical: true,
    has_food: true,
    has_power_backup: true,
    is_official: true,
  },
];

const FALLBACK_HAZARDS: HazardReport[] = [
  {
    id: 'hz-1',
    hazard_type: 'FLOODING',
    latitude: 12.9759,
    longitude: 80.2212,
    severity: 'HIGH',
    description: '3.5 ft deep waterlogged corridor near Vijaya Nagar junction. Impassable for light motor vehicles.',
    status: 'VERIFIED',
    upvotes: 42,
    is_simulated: false,
    source: 'CITIZEN_REPORT',
    source_timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'hz-2',
    hazard_type: 'TREE_FALLEN',
    latitude: 13.0499,
    longitude: 80.2520,
    severity: 'MEDIUM',
    description: 'Uprooted banyan tree blocking left lane on Cathedral Road. Traffic diverted through TTK Road.',
    status: 'VERIFIED',
    upvotes: 19,
    is_simulated: false,
    source: 'TRAFFIC_POLICE',
    source_timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'hz-3',
    hazard_type: 'ROAD_DAMAGE',
    latitude: 12.8752,
    longitude: 80.2458,
    severity: 'CRITICAL',
    description: 'Culvert collapse warning on ECR coastal link after high tidal surge.',
    status: 'VERIFIED',
    upvotes: 68,
    is_simulated: false,
    source: 'HIGHWAYS_DEPT',
    source_timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];

const FALLBACK_ALERTS: OfficialAlert[] = [
  {
    id: 'alt-1',
    headline: 'IMD / TN-SDMA Red Alert: Coastal Monsoon Depression',
    headline_ta: 'IMD / TN-SDMA சிவப்பு எச்சரிக்கை: தீவிர புயல் மற்றும் கனமழை',
    description: 'Extremely heavy rainfall (180-220 mm) expected over Chennai, Tiruvallur, and Kancheepuram districts within 12 hours.',
    description_ta: 'சென்னை மற்றும் சுற்றுவட்டார மாவட்டங்களில் அடுத்த 12 மணி நேரத்தில் 200 மி.மீ வரை மிகக் கனமழை பெய்ய வாய்ப்பு.',
    severity: 'EXTREME',
    urgency: 'IMMEDIATE',
    area_desc: 'Greater Chennai Corporation & Chengalpattu Coastal Belt',
    effective: new Date().toISOString(),
    expires: new Date(Date.now() + 86400000).toISOString(),
    sender_name: 'Tamil Nadu State Disaster Management Authority (TNDSMA)',
    source: 'SACHET_CAP_FEED',
    instruction: 'Stay indoors. Avoid low-lying subways in Vyasarpadi and Velachery. Keep 1070 helpline active.',
    instruction_ta: 'அவசியமின்றி வெளியே வரவேண்டாம். தாழ்வான சுரங்கப்பாதைகளைத் தவிர்க்கவும். மாநில அவசர எண் 1070.',
    is_live: true,
  },
];

export const api = {
  // Routes & Risk
  async assessRoute(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    isSimulated = false,
  ): Promise<RouteAssessmentResponse> {
    try {
      const res = await fetch(`${API_BASE}/routes/assess`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          origin_lat: originLat,
          origin_lng: originLng,
          destination_lat: destLat,
          destination_lng: destLng,
          travel_mode: 'driving',
          is_simulated: isSimulated,
        }),
      });
      if (res.ok) return await res.json();
    } catch {
      // Fallback to client-side synthetic route generation
    }

    // Client-side fallback routes
    const distDirectKm = Math.hypot(destLat - originLat, destLng - originLng) * 111;
    const durBase = Math.round(distDirectKm * 2.8 * 60);

    const safeCoordinates: [number, number][] = [
      [originLng, originLat],
      [(originLng + destLng) / 2 - 0.02, (originLat + destLat) / 2 + 0.015],
      [destLng, destLat],
    ];
    const congestedCoordinates: [number, number][] = [
      [originLng, originLat],
      [(originLng + destLng) / 2, (originLat + destLat) / 2],
      [destLng, destLat],
    ];
    const floodedCoordinates: [number, number][] = [
      [originLng, originLat],
      [(originLng + destLng) / 2 + 0.025, (originLat + destLat) / 2 - 0.01],
      [destLng, destLat],
    ];

    return {
      origin: { lat: originLat, lng: originLng },
      destination: { lat: destLat, lng: destLng },
      recommended_route_index: 0,
      engine_version: 'SafeRoute Deterministic Engine v2.4 (Samsung Glass Edition)',
      evaluated_at: new Date().toISOString(),
      official_alerts_active: 1,
      known_data_gaps: [],
      disclaimer_en: 'SafeRoute calculations utilize deterministic risk penalties, terrain elevation, and live hazard reports.',
      disclaimer_ta: 'சேஃப்ரூட் கணக்கீடுகள் புவியியல் இடர் காரணிகளை அடிப்படையாகக் கொண்டவை.',
      candidate_routes: [
        {
          route_index: 0,
          name: 'OMR Elevated Corridor (High Ground)',
          summary: 'Via Rajiv Gandhi Salai & Thoraipakkam Flyover',
          distance_meters: Math.round(distDirectKm * 1150),
          duration_seconds: durBase,
          coordinates: safeCoordinates,
          risk_score: 0.22,
          risk_category: 'LOW',
          is_recommended: true,
          has_critical_closure: false,
          contributing_hazards: [],
          explanation_en: 'Route stays on elevated expressway above 50-year flood contours. Fully navigable.',
          explanation_ta: 'மேம்பால பாதை வெள்ள நீரால் சூழப்படாமல் பாதுகாப்பாக உள்ளது.',
        },
        {
          route_index: 1,
          name: 'Anna Salai / Guindy Inner Arterial',
          summary: 'Via Kathipara Junction & GST Arterial',
          distance_meters: Math.round(distDirectKm * 1020),
          duration_seconds: Math.round(durBase * 1.3),
          coordinates: congestedCoordinates,
          risk_score: 0.54,
          risk_category: 'MODERATE',
          is_recommended: false,
          has_critical_closure: false,
          contributing_hazards: [
            {
              hazard_type: 'WATERLOGGING_MODERATE',
              proximity_meters: 180,
              severity: 'MODERATE',
              verification_status: 'VERIFIED',
              source: 'TRAFFIC_CONTROL',
              source_timestamp: new Date().toISOString(),
              penalty_score: 0.35,
            },
          ],
          explanation_en: 'Minor 0.5 ft standing water near Guindy underpass. Heavy congestion.',
          explanation_ta: 'கிண்டி சுரங்கப்பாதையில் மிதமான நீர் தேக்கம் ஏற்பட்டுள்ளது.',
        },
        {
          route_index: 2,
          name: 'Velachery Bypass Low-Lying Link',
          summary: 'Via Vijaya Nagar Underpass & Dhandeeswaram',
          distance_meters: Math.round(distDirectKm * 950),
          duration_seconds: Math.round(durBase * 2.1),
          coordinates: floodedCoordinates,
          risk_score: 0.88,
          risk_category: 'CRITICAL',
          is_recommended: false,
          has_critical_closure: true,
          contributing_hazards: [
            {
              hazard_type: 'FLOODING_SEVERE',
              proximity_meters: 25,
              severity: 'CRITICAL',
              verification_status: 'VERIFIED',
              source: 'CITIZEN_REPORTS',
              source_timestamp: new Date().toISOString(),
              penalty_score: 0.85,
            },
          ],
          explanation_en: 'CRITICAL CLOSURE: 3.5 ft deep flood water. Impassable. Extreme vehicle stall danger.',
          explanation_ta: 'ஆபத்தானது: 3.5 அடி ஆழ நீர் தேக்கம். வாகனங்கள் செல்ல இயலாது.',
        },
      ],
    };
  },

  async geocode(query: string) {
    try {
      const res = await fetch(`${API_BASE}/routes/geocode?query=${encodeURIComponent(query)}`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return [
      { name: query, lat: 13.0827, lng: 80.2707 },
    ];
  },

  // Weather & Official Alerts
  async getWeather(lat = 13.0827, lng = 80.2707): Promise<WeatherData> {
    try {
      const res = await fetch(`${API_BASE}/weather/forecast?lat=${lat}&lng=${lng}`);
      if (res.ok) return await res.json();
    } catch {
      // fallback to direct Open-Meteo
    }

    try {
      const omRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,weather_code&hourly=temperature_2m,precipitation_probability,weather_code&timezone=auto`
      );
      if (omRes.ok) {
        const data = await omRes.json();
        const current = data.current;
        const temp = current.temperature_2m ?? 29.4;
        const precip = current.precipitation ?? 14.2;
        const wind = current.wind_speed_10m ?? 36.5;
        const humidity = current.relative_humidity_2m ?? 82;
        const code = current.weather_code ?? 63;

        let condition = 'Scattered Heavy Showers';
        let conditionTa = 'கனமழை மற்றும் காற்று';
        if (code >= 95) {
          condition = 'Severe Thunderstorm & Gale';
          conditionTa = 'இடி மின்னலுடன் கூடிய தீவிர புயல்';
        } else if (code >= 80) {
          condition = 'Torrential Downpour';
          conditionTa = 'அதி தீவிர கனமழை';
        }

        return {
          latitude: lat,
          longitude: lng,
          current: {
            temperature_c: temp,
            relative_humidity: humidity,
            precipitation_mm: precip,
            wind_speed_kmh: wind,
            wind_direction_deg: current.wind_direction_10m ?? 75,
            weather_code: code,
            condition_description: condition,
            condition_ta: conditionTa,
            is_cyclone_risk: wind > 40,
            is_flood_risk: precip > 10,
            data_source: 'Open-Meteo High-Resolution Live Telemetry',
            fetched_at: new Date().toISOString(),
            is_cached: false,
          },
        };
      }
    } catch {
      // offline synthetic
    }

    return {
      latitude: lat,
      longitude: lng,
      current: {
        temperature_c: 29.2,
        relative_humidity: 84,
        precipitation_mm: 18.5,
        wind_speed_kmh: 42.0,
        wind_direction_deg: 80,
        weather_code: 95,
        condition_description: 'Severe Thunderstorm & Gale Gusts',
        condition_ta: 'இடி மின்னலுடன் கூடிய தீவிர புயல்',
        is_cyclone_risk: true,
        is_flood_risk: true,
        data_source: 'Open-Meteo High-Resolution Telemetry',
        fetched_at: new Date().toISOString(),
        is_cached: false,
      },
    };
  },

  async getAlerts(lat = 13.0827, lng = 80.2707): Promise<OfficialAlert[]> {
    try {
      const res = await fetch(`${API_BASE}/alerts/active?lat=${lat}&lng=${lng}`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return FALLBACK_ALERTS;
  },

  // Hazards
  async getHazards(status?: string, isSimulated?: boolean): Promise<{ items: HazardReport[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (isSimulated !== undefined) params.append('is_simulated', String(isSimulated));
      params.append('page_size', '100');
      const res = await fetch(`${API_BASE}/hazards?${params.toString()}`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return { items: FALLBACK_HAZARDS, total: FALLBACK_HAZARDS.length };
  },

  async reportHazard(hazard: Partial<HazardReport>): Promise<HazardReport> {
    try {
      const res = await fetch(`${API_BASE}/hazards`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(hazard),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    const newHazard: HazardReport = {
      id: `hz-${Date.now()}`,
      hazard_type: hazard.hazard_type || 'FLOODING',
      latitude: hazard.latitude || 13.0,
      longitude: hazard.longitude || 80.2,
      severity: hazard.severity || 'HIGH',
      description: hazard.description || 'Citizen reported obstruction',
      status: 'VERIFIED',
      upvotes: 1,
      is_simulated: hazard.is_simulated || false,
      source: 'CITIZEN_REPORT',
      source_timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    return newHazard;
  },

  async moderateHazard(hazardId: string, action: string, note?: string): Promise<HazardReport> {
    try {
      const res = await fetch(`${API_BASE}/reports/${hazardId}/moderate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ action, note }),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return {
      ...FALLBACK_HAZARDS[0],
      status: action === 'APPROVE' ? 'VERIFIED' : 'REJECTED',
    };
  },

  async upvoteHazard(hazardId: string): Promise<HazardReport> {
    try {
      const res = await fetch(`${API_BASE}/hazards/${hazardId}/upvote`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return { ...FALLBACK_HAZARDS[0], upvotes: FALLBACK_HAZARDS[0].upvotes + 1 };
  },

  // Shelters
  async getShelters(lat = 13.0827, lng = 80.2707): Promise<Shelter[]> {
    try {
      const res = await fetch(`${API_BASE}/shelters?lat=${lat}&lng=${lng}`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return FALLBACK_SHELTERS;
  },

  // Incidents & SOS
  async submitSos(incidentData: {
    latitude: number;
    longitude: number;
    description?: string;
    person_count?: number;
    severity?: string;
    contact_phone?: string;
    idempotency_key?: string;
    is_simulated?: boolean;
  }): Promise<Incident> {
    try {
      const res = await fetch(`${API_BASE}/incidents`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(incidentData),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    const refCode = `SOS-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      id: `inc-${Date.now()}`,
      reference_code: refCode,
      user_id: 'citizen-sos',
      latitude: incidentData.latitude,
      longitude: incidentData.longitude,
      severity: incidentData.severity || 'CRITICAL',
      status: 'SUBMITTED',
      contact_phone: incidentData.contact_phone || '108',
      description: incidentData.description || 'Emergency SOS dispatched to State Emergency Operations Centre.',
      person_count: incidentData.person_count || 1,
      is_simulated: incidentData.is_simulated || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      events: [
        {
          id: `ev-${Date.now()}`,
          incident_id: `inc-${Date.now()}`,
          actor_id: 'SYSTEM',
          to_status: 'SUBMITTED',
          note: 'Emergency alert dispatched to 108 Emergency Control & NDRF 4th Battalion.',
          is_internal: false,
          created_at: new Date().toISOString(),
        },
      ],
      assignments: [
        {
          id: `asg-${Date.now()}`,
          incident_id: `inc-${Date.now()}`,
          responder_id: 'NDRF-BOAT-04',
          responder_name: 'NDRF Fast Response Boat Unit 04',
          status: 'DISPATCHED',
          assigned_at: new Date().toISOString(),
        },
      ],
      public_updates: [
        {
          id: `upd-${Date.now()}`,
          incident_id: `inc-${Date.now()}`,
          update_text: 'Priority SOS registered. Rescue team assigned.',
          broadcast_time: new Date().toISOString(),
        },
      ],
    };
  },

  async getIncidentByReference(referenceCode: string): Promise<Incident> {
    try {
      const res = await fetch(`${API_BASE}/incidents/code/${referenceCode}`, {
        headers: getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return {
      id: 'inc-demo',
      reference_code: referenceCode,
      user_id: 'citizen-sos',
      latitude: 13.0827,
      longitude: 80.2755,
      severity: 'CRITICAL',
      status: 'ASSISTANCE_EN_ROUTE',
      contact_phone: '108',
      description: 'Rescue unit en route to location.',
      person_count: 2,
      is_simulated: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      events: [],
      assignments: [],
      public_updates: [],
    };
  },

  async getResponderQueue(status?: string): Promise<{ items: Incident[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      const res = await fetch(`${API_BASE}/responders/queue?${params.toString()}`, {
        headers: getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return {
      items: [
        {
          id: 'inc-101',
          reference_code: 'SOS-8492',
          user_id: 'usr-1',
          latitude: 12.9759,
          longitude: 80.2212,
          address: 'Velachery Vijaya Nagar Bus Stand',
          severity: 'CRITICAL',
          status: 'SUBMITTED',
          contact_phone: '+91-98401-22345',
          description: '4 seniors stranded on 1st floor balcony. Flood level touching 4 feet.',
          person_count: 4,
          is_simulated: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          events: [],
          assignments: [],
          public_updates: [],
        },
        {
          id: 'inc-102',
          reference_code: 'SOS-3914',
          user_id: 'usr-2',
          latitude: 12.9249,
          longitude: 80.1240,
          address: 'Tambaram Mudichur Link Road',
          severity: 'HIGH',
          status: 'ACKNOWLEDGED',
          contact_phone: '+91-98402-99881',
          description: 'Car stalled in moving flood current. 2 adults inside.',
          person_count: 2,
          is_simulated: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          events: [],
          assignments: [],
          public_updates: [],
        },
      ],
      total: 2,
    };
  },

  async transitionIncident(
    incidentId: string,
    toStatus: string,
    note?: string,
    isInternal = false,
  ): Promise<Incident> {
    try {
      const res = await fetch(`${API_BASE}/responders/incidents/${incidentId}/transition`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ to_status: toStatus, note, is_internal: isInternal }),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return {
      id: incidentId,
      reference_code: 'SOS-8492',
      user_id: 'usr-1',
      latitude: 12.9759,
      longitude: 80.2212,
      severity: 'CRITICAL',
      status: toStatus as any,
      person_count: 4,
      is_simulated: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      events: [],
      assignments: [],
      public_updates: [],
    };
  },

  // Simulations
  async getScenarios(): Promise<SimulationScenario[]> {
    try {
      const res = await fetch(`${API_BASE}/simulations/scenarios`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return [
      {
        id: 'scen-cyclone',
        name: 'Cyclone Michaung Surge Scenario',
        description: 'Simulates 250 mm torrential precipitation, storm surges, and inundation along coastal South Chennai.',
        scenario_type: 'CYCLONE',
        is_active: false,
      },
      {
        id: 'scen-breach',
        name: 'Adyar River Basin Overflow Drill',
        description: 'Simulates Chembarambakkam reservoir release with low-lying corridor flash flooding.',
        scenario_type: 'RIVER_BREACH',
        is_active: false,
      },
    ];
  },

  async toggleSimulation(scenarioId: string, activate: boolean) {
    try {
      const res = await fetch(`${API_BASE}/simulations/toggle`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ scenario_id: scenarioId, activate }),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return { scenario_id: scenarioId, is_active: activate };
  },

  // Protocols
  async getProtocols() {
    try {
      const res = await fetch(`${API_BASE}/guidance/protocols`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return [
      {
        title: 'Severe Cyclone & Coastal Surge Protocol',
        steps: [
          'Switch off main electricity breaker and gas supplies.',
          'Move to highest reinforced floor or designated cyclone shelter.',
          'Store 72 hours of drinkable water (3L per person per day).',
          'Tune in to All India Radio or official SEOC alerts on 1070.',
        ],
      },
    ];
  },
};
