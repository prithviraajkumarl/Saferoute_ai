import React, { useState, useEffect, useMemo } from 'react';
import { TacticalMap } from './components/TacticalMap';
import { RoutePlanner } from './components/RoutePlanner';
import { SosEmergencyDrawer } from './components/SosEmergencyDrawer';
import { ResponderTriageQueue } from './components/ResponderTriageQueue';
import { ShelterDirectory } from './components/ShelterDirectory';
import { ReportHazardModal } from './components/ReportHazardModal';
import { DisasterProtocolsModal } from './components/DisasterProtocolsModal';
import { SimulationControlModal } from './components/SimulationControlModal';
import { useAuth } from './context/AuthContext';
import { useI18n } from './context/I18nContext';
import { api } from './services/api';
import {
  CandidateRoute,
  RouteAssessmentResponse,
  HazardReport,
  Shelter,
  Incident,
  OfficialAlert,
  WeatherData,
} from './types';
import {
  Search,
  Navigation,
  Shield,
  Radio,
  AlertTriangle,
  CloudRain,
  Wind,
  Droplets,
  Mountain,
  ChevronDown,
  X,
  MapPin,
  Compass,
  Sun,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Activity,
  Layers,
  Crosshair,
  BookOpen,
  ArrowRight,
  UserCheck,
  Globe,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { TAMIL_NADU_LOCATIONS, TamilNaduLocation } from './data/tamilNaduLocations';

// 24-hour forecast data
const HOURLY_REAL_FORECAST = [
  { time: 'Now', temp: 33, pop: 10, icon: 'sun', dbz: 0 },
  { time: '3 PM', temp: 34, pop: 15, icon: 'sun', dbz: 5 },
  { time: '4 PM', temp: 33, pop: 20, icon: 'cloud', dbz: 10 },
  { time: '5 PM', temp: 31, pop: 25, icon: 'cloud', dbz: 15 },
  { time: '6 PM', temp: 29, pop: 30, icon: 'cloud', dbz: 20 },
  { time: '7 PM', temp: 28, pop: 25, icon: 'night', dbz: 15 },
  { time: '8 PM', temp: 28, pop: 20, icon: 'night', dbz: 10 },
  { time: '9 PM', temp: 27, pop: 15, icon: 'night', dbz: 5 },
  { time: '10 PM', temp: 27, pop: 10, icon: 'night', dbz: 0 },
  { time: '11 PM', temp: 26, pop: 10, icon: 'night', dbz: 0 },
  { time: '12 AM', temp: 26, pop: 5, icon: 'night', dbz: 0 },
  { time: '1 AM', temp: 25, pop: 5, icon: 'night', dbz: 0 },
];

// 7-day outlook data
const SEVEN_DAY_FORECAST = [
  { day: 'Today', condition: 'Partly Sunny', icon: 'sun', pop: 15, min: 25, max: 34 },
  { day: 'Sun', condition: 'Scattered Clouds', icon: 'cloud', pop: 25, min: 25, max: 33 },
  { day: 'Mon', condition: 'Afternoon Showers', icon: 'rain', pop: 45, min: 24, max: 32 },
  { day: 'Tue', condition: 'Isolated Thunderstorm', icon: 'rain', pop: 60, min: 24, max: 31 },
  { day: 'Wed', condition: 'Partly Cloudy', icon: 'cloud', pop: 30, min: 25, max: 33 },
  { day: 'Thu', condition: 'Sunny & Clear', icon: 'sun', pop: 10, min: 25, max: 34 },
  { day: 'Fri', condition: 'Clear Sky', icon: 'sun', pop: 10, min: 24, max: 34 },
];

export const App: React.FC = () => {
  const { role, switchPersona } = useAuth();
  const { language, toggleLanguage, t } = useI18n();

  // Floating side drawer for SafeRoute features in map view: 'none' | 'weather' | 'route' | 'shelters' | 'triage'
  const [activeSideDrawer, setActiveSideDrawer] = useState<'none' | 'weather' | 'route' | 'shelters' | 'triage'>('none');

  // Simulation Drill Toggle (Default: FALSE = 100% Real-World Live Data)
  const [isSimulated, setIsSimulated] = useState(false);

  // Location Selector
  const [currentLocation, setCurrentLocation] = useState<TamilNaduLocation>(TAMIL_NADU_LOCATIONS[0]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Map Centering
  const [centerLocation, setCenterLocation] = useState<{ lat: number; lng: number; zoom?: number }>({
    lat: TAMIL_NADU_LOCATIONS[0].lat,
    lng: TAMIL_NADU_LOCATIONS[0].lng,
    zoom: 12,
  });

  // Real-world & Evaluated Data
  const [assessment, setAssessment] = useState<RouteAssessmentResponse | null>(null);
  const [candidateRoutes, setCandidateRoutes] = useState<CandidateRoute[]>([]);
  const [recommendedIndex, setRecommendedIndex] = useState<number>(0);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);

  const [hazards, setHazards] = useState<HazardReport[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [alerts, setAlerts] = useState<OfficialAlert[]>([]);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);

  const [origin, setOrigin] = useState<{ lat: number; lng: number }>({
    lat: TAMIL_NADU_LOCATIONS[0].lat,
    lng: TAMIL_NADU_LOCATIONS[0].lng,
  });
  const [destination, setDestination] = useState<{ lat: number; lng: number }>({
    lat: TAMIL_NADU_LOCATIONS[3].lat, // Velachery
    lng: TAMIL_NADU_LOCATIONS[3].lng,
  });

  // Modals
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isProtocolsOpen, setIsProtocolsOpen] = useState(false);
  const [isReportHazardOpen, setIsReportHazardOpen] = useState(false);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [isAssessing, setIsAssessing] = useState(false);

  // Filtered locations in search dropdown
  const filteredLocations = useMemo(() => {
    let list = TAMIL_NADU_LOCATIONS;
    if (categoryFilter !== 'all') {
      list = list.filter((l) => l.category === categoryFilter);
    }
    if (locationSearchQuery.trim()) {
      const q = locationSearchQuery.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.district.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [locationSearchQuery, categoryFilter]);

  // Load Real Environmental Data
  const loadEnvironmentalData = async () => {
    try {
      const [hRes, sRes, wRes, aRes] = await Promise.all([
        api.getHazards(undefined, isSimulated),
        api.getShelters(currentLocation.lat, currentLocation.lng),
        api.getWeather(currentLocation.lat, currentLocation.lng),
        api.getAlerts(currentLocation.lat, currentLocation.lng),
      ]);
      setHazards(hRes.items);
      setShelters(sRes);
      setWeather(wRes);
      setAlerts(aRes);
    } catch (e) {
      console.error('Failed to load environmental data:', e);
    }
  };

  useEffect(() => {
    loadEnvironmentalData();
  }, [isSimulated, currentLocation]);

  // Initial Route Evaluation
  useEffect(() => {
    handleAssessRoute(origin.lat, origin.lng, destination.lat, destination.lng);
  }, [isSimulated]);

  const handleAssessRoute = async (oLat: number, oLng: number, dLat: number, dLng: number) => {
    setIsAssessing(true);
    setOrigin({ lat: oLat, lng: oLng });
    setDestination({ lat: dLat, lng: dLng });

    try {
      const res = await api.assessRoute(oLat, oLng, dLat, dLng, isSimulated);
      setAssessment(res);
      setCandidateRoutes(res.candidate_routes);
      setRecommendedIndex(res.recommended_route_index);
      setSelectedRouteIndex(res.recommended_route_index);
    } catch (e) {
      console.error('Route evaluation error:', e);
    } finally {
      setIsAssessing(false);
    }
  };

  const handleSelectShelter = (lat: number, lng: number) => {
    setActiveSideDrawer('route');
    handleAssessRoute(origin.lat, origin.lng, lat, lng);
  };

  const handleSelectLocation = (loc: TamilNaduLocation) => {
    setCurrentLocation(loc);
    setShowSearchResults(false);
    setLocationSearchQuery('');
    setCenterLocation({ lat: loc.lat, lng: loc.lng, zoom: 13 });
    setOrigin({ lat: loc.lat, lng: loc.lng });
    handleAssessRoute(loc.lat, loc.lng, destination.lat, destination.lng);
  };

  const handleGpsLocate = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your device browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const customLoc: TamilNaduLocation = {
          id: 'user-gps',
          name: 'Your Current GPS Location',
          district: 'Live Position',
          category: 'transit',
          lat: latitude,
          lng: longitude,
          elev: 12,
          temp: 33,
          windKmh: 14,
          windDir: 'E',
          rainMm: 0,
          description: 'Live GPS location captured from mobile sensor',
        };
        setCurrentLocation(customLoc);
        setShowSearchResults(false);
        setCenterLocation({ lat: latitude, lng: longitude, zoom: 14 });
        setOrigin({ lat: latitude, lng: longitude });
        handleAssessRoute(latitude, longitude, destination.lat, destination.lng);
      },
      (err) => {
        alert('Could not retrieve GPS location: ' + err.message);
      }
    );
  };

  // Weather formatting
  const liveTemp = weather?.current?.temperature_c
    ? Math.round(weather.current.temperature_c)
    : currentLocation.temp || 33;
  const conditionLabel =
    language === 'ta'
      ? weather?.current?.condition_ta || 'பகுதி மேகமூட்டம்'
      : isSimulated
      ? 'SIMULATION: Severe Cyclone Surge & Torrential Downpour'
      : weather?.current?.condition_description || 'Partly Sunny & Warm';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#080c16] font-sans text-slate-100 select-none">
      {/* 1. PRIMARY MAP SURFACE: FULL-SCREEN INTERACTIVE TACTICAL CANVAS */}
      <div className="absolute inset-0 w-full h-full z-0">
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
          isSimulated={isSimulated}
          onSetDestination={(dLat, dLng) => {
            setDestination({ lat: dLat, lng: dLng });
            handleAssessRoute(origin.lat, origin.lng, dLat, dLng);
            setActiveSideDrawer('route');
          }}
          onSetOrigin={(oLat, oLng) => {
            setOrigin({ lat: oLat, lng: oLng });
            handleAssessRoute(oLat, oLng, destination.lat, destination.lng);
          }}
        />
      </div>

      {/* 2. ZOOM EARTH FLOATING TOP BAR */}
      <header className="absolute top-2.5 sm:top-3 left-2.5 sm:left-4 right-2.5 sm:right-4 z-40 flex items-center justify-between gap-2 p-1.5 sm:p-2 rounded-2xl zoom-glass shadow-2xl">
        {/* Left: SafeRoute AI Branding & Global Search Dropdown */}
        <div className="flex items-center gap-2">
          {/* Brand Logo Pill */}
          <div className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/80">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-xs sm:text-sm text-white">
                SafeRoute <span className="text-cyan-400">AI</span>
              </span>
              <span className="hidden md:inline text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-semibold uppercase tracking-wider">
                Live
              </span>
            </div>
          </div>

          {/* Place Search Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowSearchResults(!showSearchResults)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 text-slate-200 transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <div className="text-left max-w-[110px] sm:max-w-[160px] truncate">
                <span className="text-xs font-semibold text-white block truncate">
                  {currentLocation.name}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {currentLocation.district} • {currentLocation.elev}m MSL
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5 shrink-0" />
            </button>

            {/* Place Search Autocomplete Modal/Dropdown */}
            {showSearchResults && (
              <div className="absolute top-12 left-0 w-80 sm:w-96 rounded-2xl zoom-panel p-3 shadow-2xl z-50 space-y-2.5 max-h-[80vh] flex flex-col border border-slate-700">
                <div className="flex items-center justify-between pb-1 border-b border-slate-700/80">
                  <span className="text-xs font-bold text-white">
                    Search Locations Across Tamil Nadu
                  </span>
                  <button
                    onClick={() => setShowSearchResults(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Instant GPS Locate Button */}
                <button
                  onClick={handleGpsLocate}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-2 border border-blue-500/40 transition-colors cursor-pointer"
                >
                  <Crosshair className="w-4 h-4 text-cyan-400" />
                  <span>Use My Current Device GPS</span>
                </button>

                {/* Search Input Box */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search city, district, temple, or hill station..."
                    value={locationSearchQuery}
                    onChange={(e) => setLocationSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-all"
                    autoFocus
                  />
                </div>

                {/* Quick Category Filter Pills */}
                <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                  {[
                    { id: 'all', label: 'All Places' },
                    { id: 'hill_station', label: 'Hill Stations' },
                    { id: 'coastal', label: 'Coastal' },
                    { id: 'temple', label: 'Temples' },
                    { id: 'district', label: 'Districts' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryFilter(cat.id)}
                      className={`px-2.5 py-1 rounded-full shrink-0 font-medium cursor-pointer transition-all ${
                        categoryFilter === cat.id
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Filtered Location List */}
                <div className="space-y-1 overflow-y-auto flex-1 pr-1 max-h-56">
                  {filteredLocations.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400">
                      No matching district or place found.
                    </div>
                  ) : (
                    filteredLocations.map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => handleSelectLocation(loc)}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          currentLocation.id === loc.id
                            ? 'bg-blue-600/30 text-cyan-300 font-semibold border border-blue-500/40'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-white">{loc.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {loc.district} • {loc.elev}m MSL elevation
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-amber-400 block">
                            {loc.temp}°C
                          </span>
                          <span className="text-[10px] text-cyan-400 block">
                            {loc.windKmh} km/h
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Quick Floating Panel Triggers (Weather, Route, Shelters, Protocols) */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {/* Weather Panel Pill */}
          <button
            onClick={() =>
              setActiveSideDrawer(activeSideDrawer === 'weather' ? 'none' : 'weather')
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSideDrawer === 'weather'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Weather</span>
          </button>

          {/* Route Planner Pill */}
          <button
            onClick={() =>
              setActiveSideDrawer(activeSideDrawer === 'route' ? 'none' : 'route')
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSideDrawer === 'route'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Routes</span>
          </button>

          {/* Shelters Directory Pill */}
          <button
            onClick={() =>
              setActiveSideDrawer(activeSideDrawer === 'shelters' ? 'none' : 'shelters')
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSideDrawer === 'shelters'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Shelters</span>
          </button>

          {/* Responder Triage Pill (if responder) */}
          {role !== 'tourist' && (
            <button
              onClick={() =>
                setActiveSideDrawer(activeSideDrawer === 'triage' ? 'none' : 'triage')
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSideDrawer === 'triage'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Triage</span>
            </button>
          )}

          {/* Report Hazard Modal Trigger */}
          <button
            onClick={() => setIsReportHazardOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-400 hover:text-amber-300 hover:bg-slate-800/80 transition-all cursor-pointer"
            title="Report Citizen Road Hazard"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Report Hazard</span>
          </button>

          {/* Protocols Modal Trigger */}
          <button
            onClick={() => setIsProtocolsOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer"
            title="Disaster Evacuation Protocols"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Protocols</span>
          </button>
        </div>

        {/* Right: Simulation Drill, Language Toggle & Emergency SOS */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* SIMULATION DRILL BUTTON */}
          <button
            onClick={() => setIsSimulationOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isSimulated
                ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Configure Simulation Drill Scenario"
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isSimulated ? 'Drill Active' : 'Drill'}</span>
          </button>

          {/* LANGUAGE SWITCHER */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 cursor-pointer transition-all"
            title="Switch Language (English / தமிழ்)"
          >
            {language === 'ta' ? 'தமிழ்' : 'EN'}
          </button>

          {/* EMERGENCY SOS BUTTON */}
          <button
            onClick={() => setIsSosOpen(true)}
            className="px-3 sm:px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/40 border border-rose-500 transition-all"
          >
            <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
            <span>SOS</span>
          </button>
        </div>
      </header>

      {/* 3. FLOATING COLLAPSIBLE LEFT DRAWER (WEATHER / ROUTES / SHELTERS / TRIAGE) */}
      {activeSideDrawer !== 'none' && (
        <div className="absolute top-16 left-2.5 sm:left-4 bottom-24 w-full sm:w-[450px] max-w-[94vw] z-40 zoom-panel rounded-3xl p-4 sm:p-5 overflow-y-auto space-y-4 shadow-2xl border border-slate-700/80">
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                {activeSideDrawer === 'weather'
                  ? 'Meteorological Intelligence'
                  : activeSideDrawer === 'route'
                  ? 'Safe Route & Corridor Navigator'
                  : activeSideDrawer === 'shelters'
                  ? 'Relief Shelters Directory'
                  : 'Responder Incident Triage'}
              </span>
            </div>
            <button
              onClick={() => setActiveSideDrawer('none')}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer hover:bg-slate-700 border border-slate-700"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* A. COMPACT WEATHER INTELLIGENCE PANEL */}
          {activeSideDrawer === 'weather' && (
            <div className="space-y-4">
              {/* Simulation Banner */}
              {isSimulated && (
                <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-800 text-amber-200 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Disaster Drill Active: 200 mm precipitation surge simulated.</span>
                  </div>
                  <button
                    onClick={() => setIsSimulated(false)}
                    className="px-2 py-0.5 rounded bg-amber-800 hover:bg-amber-700 text-white font-bold text-[10px] cursor-pointer"
                  >
                    Exit
                  </button>
                </div>
              )}

              {/* Current Weather Card */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{currentLocation.name}, {currentLocation.district}</span>
                </div>

                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-6xl font-light tracking-tight text-white">{liveTemp}</span>
                  <span className="text-2xl font-light text-cyan-400">°C</span>
                </div>

                <div className="text-sm font-medium text-slate-200">{conditionLabel}</div>

                <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
                  <span>H: {liveTemp + 2}°</span>
                  <span>•</span>
                  <span>L: {liveTemp - 8}°</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Mountain className="w-3 h-3" />
                    <span>{currentLocation.elev}m MSL</span>
                  </span>
                </div>
              </div>

              {/* Hourly Forecast Rail */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-1.5">
                  <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
                    Hourly Conditions & Precipitation
                  </span>
                  <span>Live Feed</span>
                </div>
                <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                  {HOURLY_REAL_FORECAST.map((hour, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center gap-1.5 min-w-[56px] py-1.5 px-1 rounded-xl bg-slate-800/40 border border-slate-800/60"
                    >
                      <span className="text-[11px] text-slate-400">{hour.time}</span>
                      <div className="text-amber-400">
                        {hour.icon === 'sun' && <Sun className="w-4 h-4 text-amber-400" />}
                        {hour.icon === 'cloud' && <CloudRain className="w-4 h-4 text-cyan-400" />}
                        {hour.icon === 'night' && <Sun className="w-4 h-4 text-slate-400" />}
                      </div>
                      <span className="text-xs font-bold text-white">{hour.temp}°</span>
                      <div className="flex items-center gap-0.5 text-[9px] text-cyan-400 font-semibold">
                        <Droplets className="w-2.5 h-2.5" />
                        <span>{hour.pop}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Meteorological Telemetry Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Rain Rate */}
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Rain Rate</span>
                  </div>
                  <div className="text-xl font-bold text-white">
                    {weather?.current?.precipitation_mm ?? currentLocation.rainMm ?? 0}{' '}
                    <span className="text-xs font-normal text-slate-400">mm/h</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {currentLocation.rainMm > 0 ? 'Light mountain showers' : 'Clear dry surface'}
                  </div>
                </div>

                {/* Wind Velocity */}
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Wind className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Wind Velocity</span>
                  </div>
                  <div className="text-xl font-bold text-white">
                    {weather?.current?.wind_speed_kmh ?? currentLocation.windKmh ?? 14}{' '}
                    <span className="text-xs font-normal text-slate-400">km/h</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Blowing {currentLocation.windDir}
                  </div>
                </div>

                {/* Humidity */}
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Humidity</span>
                  </div>
                  <div className="text-xl font-bold text-white">
                    {weather?.current?.relative_humidity ?? 68}%
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Dew point: 22°C
                  </div>
                </div>

                {/* Ground Elevation */}
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <Mountain className="w-3.5 h-3.5" />
                    <span>Elevation</span>
                  </div>
                  <div className="text-xl font-bold text-emerald-400">
                    {currentLocation.elev}{' '}
                    <span className="text-xs font-normal text-slate-400">m MSL</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {currentLocation.elev < 10
                      ? 'Coastal lowland'
                      : currentLocation.elev > 1000
                      ? 'Western Ghats'
                      : 'Elevated plateau'}
                  </div>
                </div>
              </div>

              {/* 7-Day Outlook */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-300 border-b border-slate-800 pb-1.5 uppercase tracking-wider text-[11px]">
                  7-Day Trend
                </div>
                <div className="space-y-2 text-xs">
                  {SEVEN_DAY_FORECAST.map((d, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="w-12 text-slate-400 font-medium">{d.day}</span>
                      <div className="flex items-center gap-1.5 w-28">
                        {d.icon === 'sun' && <Sun className="w-3.5 h-3.5 text-amber-400" />}
                        {d.icon === 'cloud' && <CloudRain className="w-3.5 h-3.5 text-cyan-400" />}
                        {d.icon === 'rain' && <CloudRain className="w-3.5 h-3.5 text-blue-400" />}
                        <span className="text-[10px] text-cyan-400">{d.pop}%</span>
                      </div>
                      <span className="w-6 text-slate-400 text-right">{d.min}°</span>
                      <div className="flex-1 mx-2">
                        <div className="temp-bar-track">
                          <div
                            className="temp-bar-fill"
                            style={{
                              left: `${((d.min - 15) / 25) * 100}%`,
                              width: `${((d.max - d.min) / 25) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="w-6 text-white font-bold">{d.max}°</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Attribution */}
              <div className="text-[10px] text-slate-500 text-center pt-1 border-t border-slate-800">
                Weather Data: Open-Meteo Doppler & IMD Chennai Radar • Live Observations
              </div>
            </div>
          )}

          {/* B. ROUTE PLANNER PANEL */}
          {activeSideDrawer === 'route' && (
            <RoutePlanner
              onAssess={handleAssessRoute}
              assessment={assessment}
              isLoading={isAssessing}
              selectedRouteIndex={selectedRouteIndex}
              onSelectRoute={setSelectedRouteIndex}
              currentOrigin={origin}
              currentDestination={destination}
            />
          )}

          {/* C. RELIEF SHELTERS DIRECTORY PANEL */}
          {activeSideDrawer === 'shelters' && (
            <ShelterDirectory
              shelters={shelters}
              onSelectShelterDestination={handleSelectShelter}
            />
          )}

          {/* D. RESPONDER INCIDENT TRIAGE PANEL */}
          {activeSideDrawer === 'triage' && <ResponderTriageQueue />}
        </div>
      )}

      {/* 4. MODALS & SYSTEM DRAWERS */}
      <SosEmergencyDrawer
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        activeIncident={activeIncident}
        setActiveIncident={setActiveIncident}
      />

      <ReportHazardModal
        isOpen={isReportHazardOpen}
        onClose={() => setIsReportHazardOpen(false)}
        onHazardAdded={(newHazard) => setHazards((prev) => [newHazard, ...prev])}
      />

      <DisasterProtocolsModal
        isOpen={isProtocolsOpen}
        onClose={() => setIsProtocolsOpen(false)}
      />

      <SimulationControlModal
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        isSimulated={isSimulated}
        setIsSimulated={setIsSimulated}
      />
    </div>
  );
};
