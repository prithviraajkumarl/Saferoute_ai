import React, { useState, useEffect } from 'react';
import { TacticalMap } from '../components/TacticalMap';
import { RoutePlanner } from '../components/RoutePlanner';
import { api } from '../services/api';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import {
  CandidateRoute,
  RouteAssessmentResponse,
  HazardReport,
  Shelter,
} from '../types';
import { TAMIL_NADU_LOCATIONS, TamilNaduLocation } from '../data/tamilNaduLocations';
import {
  Navigation,
  Layers,
  MapPin,
  ChevronRight,
  ShieldAlert,
  Sliders,
  Crosshair,
  Maximize2,
  RefreshCw,
} from 'lucide-react';

interface NavigationPageProps {
  isSimulated?: boolean;
}

export const NavigationPage: React.FC<NavigationPageProps> = ({ isSimulated = false }) => {
  const { language } = useI18n();
  const { theme } = useTheme();

  // Navigation Coordinates (Default: Chennai Central to Tambaram)
  const [origin, setOrigin] = useState<{ lat: number; lng: number }>({
    lat: TAMIL_NADU_LOCATIONS[0].lat,
    lng: TAMIL_NADU_LOCATIONS[0].lng,
  });
  const [destination, setDestination] = useState<{ lat: number; lng: number }>({
    lat: TAMIL_NADU_LOCATIONS[1].lat,
    lng: TAMIL_NADU_LOCATIONS[1].lng,
  });

  const [assessment, setAssessment] = useState<RouteAssessmentResponse | null>(null);
  const [candidateRoutes, setCandidateRoutes] = useState<CandidateRoute[]>([]);
  const [recommendedIndex, setRecommendedIndex] = useState<number>(0);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [isAssessing, setIsAssessing] = useState(false);

  // Hazards & Shelters data
  const [hazards, setHazards] = useState<HazardReport[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);

  // Centering & Layout
  const [centerLocation, setCenterLocation] = useState<{ lat: number; lng: number; zoom?: number }>({
    lat: TAMIL_NADU_LOCATIONS[0].lat,
    lng: TAMIL_NADU_LOCATIONS[0].lng,
    zoom: 12,
  });
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    const loadData = async () => {
      try {
        const [hRes, sList] = await Promise.all([
          api.getHazards(undefined, isSimulated),
          api.getShelters(origin.lat, origin.lng),
        ]);
        setHazards(hRes?.items || []);
        setShelters(sList || []);
      } catch (e) {
        console.error('Failed to load map overlays:', e);
      }
    };
    loadData();
  }, [isSimulated]);

  // Execute Route Risk Assessment
  const handleAssessRoute = async (oLat: number, oLng: number, dLat: number, dLng: number) => {
    setIsAssessing(true);
    setOrigin({ lat: oLat, lng: oLng });
    setDestination({ lat: dLat, lng: dLng });

    try {
      const res = await api.assessRoute(oLat, oLng, dLat, dLng, isSimulated);
      setAssessment(res);
      setCandidateRoutes(res.candidate_routes);
      setRecommendedIndex(res.recommended_route_index);
      setSelectedRouteIndex(res.recommended_route_index >= 0 ? res.recommended_route_index : 0);

      // Fit map to midway point
      setCenterLocation({
        lat: (oLat + dLat) / 2,
        lng: (oLng + dLng) / 2,
        zoom: 12,
      });
    } catch (e) {
      console.error('Route evaluation error:', e);
    } finally {
      setIsAssessing(false);
    }
  };

  // Run initial route assessment automatically on load
  useEffect(() => {
    handleAssessRoute(origin.lat, origin.lng, destination.lat, destination.lng);
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-53px)] overflow-hidden flex flex-col md:flex-row select-none">
      {/* Left Route Planning Workspace Panel */}
      <div
        className={`z-20 transition-all duration-300 shrink-0 h-full overflow-hidden flex flex-col ${
          isPanelCollapsed ? 'w-0 md:w-12' : 'w-full md:w-[420px] lg:w-[460px]'
        } ${
          theme === 'dark'
            ? 'bg-[#0d1424] border-r border-slate-800 text-slate-100 shadow-2xl'
            : 'bg-white/95 backdrop-blur-md border-r border-slate-200 text-slate-800 shadow-lg'
        }`}
      >
        {isPanelCollapsed ? (
          <div className="h-full flex flex-col items-center justify-between py-4">
            <button
              onClick={() => setIsPanelCollapsed(false)}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md transition cursor-pointer"
              title="Expand Route Planner"
            >
              <Navigation className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className={`p-4 border-b flex items-center justify-between ${
              theme === 'dark' ? 'border-slate-800' : 'border-slate-200/80'
            }`}>
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-500" />
                <div>
                  <h2 className="font-bold text-sm">Safe Route Intelligence</h2>
                  <p className="text-[11px] text-slate-400">
                    Deterministic corridor safety evaluation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPanelCollapsed(true)}
                className={`p-1.5 rounded-lg transition ${
                  theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
                title="Collapse panel to maximize map"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <RoutePlanner
                onAssess={handleAssessRoute}
                assessment={assessment}
                selectedRouteIndex={selectedRouteIndex}
                onSelectRoute={setSelectedRouteIndex}
                isLoading={isAssessing}
                currentOrigin={origin}
                currentDestination={destination}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Map Workspace Area */}
      <div className="relative flex-1 h-full w-full bg-[#080d1a]">
        <TacticalMap
          candidateRoutes={candidateRoutes}
          recommendedIndex={recommendedIndex}
          hazards={hazards}
          shelters={shelters}
          origin={origin}
          destination={destination}
          centerLocation={centerLocation}
          selectedRouteIndex={selectedRouteIndex}
          onSelectRoute={setSelectedRouteIndex}
          onSetOrigin={(lat, lng) => setOrigin({ lat, lng })}
          onSetDestination={(lat, lng) => setDestination({ lat, lng })}
          isSimulated={isSimulated}
        />
      </div>
    </div>
  );
};
