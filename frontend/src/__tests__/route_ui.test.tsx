import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '../context/I18nContext';
import { AuthProvider } from '../context/AuthContext';
import { TelemetryPanel } from '../components/TelemetryPanel';
import { ShelterDirectory } from '../components/ShelterDirectory';

const mockWeather = {
  latitude: 13.08,
  longitude: 80.27,
  current: {
    temperature_c: 28.5,
    relative_humidity: 82.0,
    precipitation_mm: 19.4,
    wind_speed_kmh: 44.0,
    wind_direction_deg: 90.0,
    weather_code: 65,
    condition_description: 'Heavy rainfall and inundation',
    condition_ta: 'கனமழை வெள்ள எச்சரிக்கை',
    is_cyclone_risk: false,
    is_flood_risk: true,
    data_source: 'Open-Meteo Doppler',
    fetched_at: new Date().toISOString(),
    is_cached: false,
  },
};

const mockAlerts = [
  {
    id: 'ALT-1',
    headline: 'Orange Inundation Warning',
    headline_ta: 'ஆரஞ்சு வெள்ள எச்சரிக்கை',
    description: 'Heavy precipitation over coastal sectors.',
    description_ta: 'கடலோரப் பகுதியில் கனமழை.',
    severity: 'WARNING',
    urgency: 'IMMEDIATE',
    area_desc: 'Chennai Coastal Zone',
    effective: new Date().toISOString(),
    expires: new Date().toISOString(),
    sender_name: 'TNSDMA',
    source: 'NDMA SACHET',
    is_live: true,
  },
];

const mockShelters = [
  {
    id: 's1',
    name: 'Chennai Trade Centre Hub',
    name_ta: 'சென்னை வர்த்தக மையம்',
    address: 'Nandambakkam, Chennai',
    district: 'Chennai',
    latitude: 13.0116,
    longitude: 80.1788,
    capacity: 1200,
    current_occupancy: 300,
    occupancy_percentage: 25.0,
    status: 'OPEN' as const,
    has_medical: true,
    has_food: true,
    has_power_backup: true,
    is_official: true,
  },
];

describe('Frontend UI Components', () => {
  it('renders weather telemetry radar values and rainfall risk', () => {
    render(
      <I18nProvider>
        <TelemetryPanel weather={mockWeather} alerts={mockAlerts} isLoading={false} />
      </I18nProvider>
    );

    expect(screen.getByText(/28.5°C/i)).toBeDefined();
    expect(screen.getByText(/19.4 mm\/h/i)).toBeDefined();
    expect(screen.getByText(/Waterlogging Risk/i)).toBeDefined();
    expect(screen.getByText(/Orange Inundation Warning/i)).toBeDefined();
  });

  it('renders shelter list with capacity and facilities', () => {
    render(
      <I18nProvider>
        <ShelterDirectory shelters={mockShelters} onSelectShelterDestination={() => {}} />
      </I18nProvider>
    );

    expect(screen.getByText(/Chennai Trade Centre Hub/i)).toBeDefined();
    expect(screen.getByText(/Nandambakkam, Chennai/i)).toBeDefined();
    expect(screen.getByText(/25%/i)).toBeDefined();
  });
});
