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
  PhoneCall,
} from 'lucide-react';
import { EmergencyContactsModal } from '../components/EmergencyContactsModal';

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

  const [activeUser, setActiveUser] = useState<{ name: string; destName?: string } | null>(null);
  const [is3DNavMode, setIs3DNavMode] = useState<boolean>(false);
  const [showContactsModal, setShowContactsModal] = useState<boolean>(false);

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

  // Run initial route assessment automatically on load, reading from sessionStorage if available
  useEffect(() => {
    let oLat = origin.lat;
    let oLng = origin.lng;
    let dLat = destination.lat;
    let dLng = destination.lng;

    const savedUser = sessionStorage.getItem('saferoute_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.origin?.lat && parsed.origin?.lng) {
          oLat = parsed.origin.lat;
          oLng = parsed.origin.lng;
          setOrigin({ lat: oLat, lng: oLng });
        }
        if (parsed.destination?.lat && parsed.destination?.lng) {
          dLat = parsed.destination.lat;
          dLng = parsed.destination.lng;
          setDestination({ lat: dLat, lng: dLng });
        }
        setActiveUser({
          name: parsed.name || 'Traveler',
          destName: parsed.destination?.name || 'Selected Destination',
        });
      } catch (err) {
        console.warn('Failed to parse saferoute_user session:', err);
      }
    }

    handleAssessRoute(oLat, oLng, dLat, dLng);
  }, []);

  const handleStart3DMode = () => {
    setIs3DNavMode(true);
    // Smoothly flyTo origin at close zoom
    setCenterLocation({
      lat: origin.lat,
      lng: origin.lng,
      zoom: 16,
    });
  };

  return (
    <div className="relative w-full h-[calc(100vh-53px)] overflow-hidden flex flex-col md:flex-row select-none">
      {/* Left Route Planning Workspace Panel (Glassy Glassmorphism) */}
      <div
        className={`z-20 transition-all duration-300 shrink-0 h-full overflow-hidden flex flex-col ${
          isPanelCollapsed ? 'w-0 md:w-12' : 'w-full md:w-[430px] lg:w-[480px]'
        } bg-white/85 backdrop-blur-xl border-r border-white/90 text-slate-900 shadow-xl`}
      >
        {isPanelCollapsed ? (
          <div className="h-full flex flex-col items-center justify-between py-4">
            <button
              onClick={() => setIsPanelCollapsed(false)}
              className="p-2.5 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white shadow-md transition cursor-pointer"
              title="Expand Route Planner"
            >
              <Navigation className="w-5 h-5 text-blue-200" />
            </button>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-black text-sm text-black">Navigate</h2>
                  {activeUser && (
                    <span className="text-[10px] text-black font-semibold block">
                      {activeUser.name} → {activeUser.destName}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsPanelCollapsed(true)}
                className="p-1.5 rounded-xl transition hover:bg-slate-100 text-slate-600 cursor-pointer"
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
                onStart3DNav={handleStart3DMode}
                is3DNavigating={is3DNavMode}
              />

              <div className="pt-3 border-t border-slate-200 mt-3">
                <button
                  onClick={() => setShowContactsModal(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Emergency Contacts</span>
                </button>
              </div>
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
          is3DMode={is3DNavMode}
          onToggle3DMode={setIs3DNavMode}
        />
      </div>

      {/* Emergency Contacts Modal */}
      <EmergencyContactsModal
        isOpen={showContactsModal}
        onClose={() => setShowContactsModal(false)}
      />
    </div>
  );
};
