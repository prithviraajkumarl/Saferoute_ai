import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cloud,
  Sun,
  Moon,
  Wind,
  Navigation,
  Compass,
  MapPin,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Key,
  Check,
  User,
  ArrowRight,
  X,
  Crosshair,
  Loader2,
  Shield,
  Sprout,
  Search,
  Eye,
  Droplets,
  Gauge,
  Send,
  Sliders,
  Sparkles,
  PhoneCall,
} from 'lucide-react';
import { RadarMiniMap } from '../components/RadarMiniMap';
import { EmergencyContactsModal } from '../components/EmergencyContactsModal';
import { TAMIL_NADU_LOCATIONS, TamilNaduLocation } from '../data/tamilNaduLocations';

// Available locations with realistic meteorological baselines
const LOCATIONS = [
  {
    name: 'Mevalurkuppam',
    district: 'Sriperumbudur, Tamil Nadu',
    lat: 13.0189,
    lng: 80.0102,
    temp: 32,
    feelsLike: 38,
    high: 35,
    low: 26,
    condition: 'Partly Cloudy',
    summary: 'Partly cloudy. Low 26°C.',
    humidity: 63,
    windSpeed: 19,
    dewPoint: 24,
    pressure: 1009.5,
    visibility: '12.00 km',
    uvIndex: 'Low (0)',
    aqi: 56,
    aqiStatus: 'Satisfactory',
    sunrise: '5:59 am',
    sunset: '5:53 pm',
    moonrise: '5:28 am',
    moonset: '5:34 pm',
    moonPhase: 'New moon',
  },
  {
    name: 'Chennai',
    district: 'Tamil Nadu',
    lat: 13.0827,
    lng: 80.2707,
    temp: 33,
    feelsLike: 39,
    high: 36,
    low: 27,
    condition: 'Partly Cloudy',
    summary: 'Warm with coastal breeze. Low 27°C.',
    humidity: 68,
    windSpeed: 21,
    dewPoint: 25,
    pressure: 1010.2,
    visibility: '10.00 km',
    uvIndex: 'Low (0)',
    aqi: 64,
    aqiStatus: 'Moderate',
    sunrise: '5:58 am',
    sunset: '5:52 pm',
    moonrise: '5:27 am',
    moonset: '5:33 pm',
    moonPhase: 'New moon',
  },
  {
    name: 'New Delhi',
    district: 'Delhi NCR',
    lat: 28.6139,
    lng: 77.2090,
    temp: 30,
    feelsLike: 35,
    high: 34,
    low: 24,
    condition: 'Haze',
    summary: 'Hazy sunshine. Low 24°C.',
    humidity: 52,
    windSpeed: 14,
    dewPoint: 20,
    pressure: 1012.0,
    visibility: '8.00 km',
    uvIndex: 'Low (0)',
    aqi: 142,
    aqiStatus: 'Unhealthy for sensitive groups',
    sunrise: '6:19 am',
    sunset: '5:56 pm',
    moonrise: '5:48 am',
    moonset: '5:41 pm',
    moonPhase: 'New moon',
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Location selector state
  const [currentLoc, setCurrentLoc] = useState(LOCATIONS[0]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Top Setting Box (API Keys)
  const [showSettingsBox, setShowSettingsBox] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    gemini: localStorage.getItem('saferoute_gemini_key') || '',
    openweather: localStorage.getItem('saferoute_owm_key') || '',
  });
  const [savedKeysNotice, setSavedKeysNotice] = useState(false);

  // Onboarding Navigation Modal State
  const [showNavModal, setShowNavModal] = useState(false);
  const [navStep, setNavStep] = useState<1 | 2 | 3>(1);
  const [userName, setUserName] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [destinationSearch, setDestinationSearch] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<TamilNaduLocation | null>(null);
  const [showContactsModal, setShowContactsModal] = useState<boolean>(false);

  // Hourly forecast horizontal scroll ref
  const hourlyScrollRef = useRef<HTMLDivElement>(null);

  const scrollHourly = (dir: 'left' | 'right') => {
    if (hourlyScrollRef.current) {
      hourlyScrollRef.current.scrollBy({ left: dir === 'left' ? -240 : 240, behavior: 'smooth' });
    }
  };

  // Save API keys
  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('saferoute_gemini_key', apiKeys.gemini);
    localStorage.setItem('saferoute_owm_key', apiKeys.openweather);
    setSavedKeysNotice(true);
    setTimeout(() => setSavedKeysNotice(false), 2200);
  };

  // Request user GPS
  const handleRequestLocation = () => {
    setLocatingUser(true);
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported. Defaulting to current location.');
      setUserLocation({ lat: currentLoc.lat, lng: currentLoc.lng });
      setLocatingUser(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocatingUser(false);
      },
      (err) => {
        setLocationError('Permission denied. Using current region coordinates.');
        setUserLocation({ lat: currentLoc.lat, lng: currentLoc.lng });
        setLocatingUser(false);
      },
      { timeout: 8000 }
    );
  };

  // Complete onboarding wizard & navigate to tactical map
  const handleStartNavigation = () => {
    if (!selectedDestination) return;
    const originCoords = userLocation || { lat: currentLoc.lat, lng: currentLoc.lng };
    sessionStorage.setItem(
      'saferoute_user',
      JSON.stringify({
        name: userName.trim() || 'SafeRoute Traveler',
        origin: originCoords,
        destination: {
          lat: selectedDestination.lat,
          lng: selectedDestination.lng,
          name: selectedDestination.name,
        },
      })
    );
    setShowNavModal(false);
    navigate('/app/navigation');
  };

  // Filtered destination suggestions
  const filteredDestinations = TAMIL_NADU_LOCATIONS.filter(
    (loc) =>
      loc.name.toLowerCase().includes(destinationSearch.toLowerCase()) ||
      (loc.district && loc.district.toLowerCase().includes(destinationSearch.toLowerCase()))
  ).slice(0, 8);

  // Hourly dataset matching the screenshots
  const hourlyData = [
    { time: '5:30 pm', icon: 'sun-cloud', temp: 32, rain: 1, isSunset: false },
    { time: '5:53 pm', icon: 'sunset', temp: 31, rain: 1, isSunset: true },
    { time: '6:30 pm', icon: 'moon-cloud', temp: 31, rain: 1, isSunset: false },
    { time: '7:30 pm', icon: 'moon-cloud', temp: 30, rain: 2, isSunset: false },
    { time: '8:30 pm', icon: 'moon-cloud', temp: 29, rain: 2, isSunset: false },
    { time: '9:30 pm', icon: 'moon-cloud', temp: 29, rain: 2, isSunset: false },
    { time: '10:30 pm', icon: 'moon-cloud', temp: 28, rain: 2, isSunset: false },
    { time: '11:30 pm', icon: 'moon-cloud', temp: 28, rain: 3, isSunset: false },
    { time: '12:30 am', icon: 'moon-cloud', temp: 27, rain: 3, isSunset: false },
    { time: '1:30 am', icon: 'moon-cloud', temp: 27, rain: 2, isSunset: false },
  ];

  return (
    <div
      className="min-h-screen text-slate-800 font-sans antialiased relative selection:bg-blue-300 selection:text-blue-950 overflow-x-hidden"
      style={{
        background: 'linear-gradient(180deg, #07152b 0%, #0a2143 20%, #0e305e 45%, #12417d 70%, #16539c 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* ── TOP SETTING BOX (API Keys Configuration Drawer) ── */}
      {showSettingsBox && (
        <div className="bg-white/95 backdrop-blur-xl border-b border-white/60 shadow-xl py-4 px-6 fixed top-0 left-0 right-0 z-50 animate-slide-down">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    SafeRoute AI — System APIs & Configuration
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Live engines powering meteorological nowcasting, flood routing & emergency triage
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsBox(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* API Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-xs">
              <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-slate-800 text-[11px]">Open-Meteo API</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px]">Live Free</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">Live temperature, UV, dew & hourly data.</p>
              </div>

              <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-slate-800 text-[11px]">CartoDB & OSM</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px]">Active</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">Clean Google Map-style light street tiles.</p>
              </div>

              <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-slate-800 text-[11px]">SafeRoute Engine</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px]">Ready</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">Multi-corridor flood attenuation routing.</p>
              </div>

              <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-bold text-slate-800 text-[11px]">Gemini 2.5 AI</span>
                  <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold text-[9px]">Configured</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">Disaster assistant & emergency triage chatbot.</p>
              </div>
            </div>

            {/* Key Inputs */}
            <form onSubmit={handleSaveKeys} className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="password"
                placeholder="Google Gemini API Key (optional)"
                value={apiKeys.gemini}
                onChange={(e) => setApiKeys({ ...apiKeys, gemini: e.target.value })}
                className="w-full sm:flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="OpenWeatherMap API Key (optional)"
                value={apiKeys.openweather}
                onChange={(e) => setApiKeys({ ...apiKeys, openweather: e.target.value })}
                className="w-full sm:flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {savedKeysNotice ? <Check className="w-3.5 h-3.5" /> : null}
                <span>{savedKeysNotice ? 'Saved!' : 'Save Keys'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── TOP FLOATING BAR (Exact Match to Mobile & Desktop Screenshots) ── */}
      <header className="sticky top-0 z-40 px-4 pt-3 pb-2 flex items-center justify-between max-w-xl mx-auto w-full">
        {/* Location Dropdown Pill: 📍 Mevalurkuppam */}
        <div className="relative">
          <button
            onClick={() => setShowLocationPicker(!showLocationPicker)}
            className="flex items-center gap-1.5 px-4 py-2 bg-black/45 backdrop-blur-md text-white rounded-full text-xs font-semibold shadow-md hover:bg-black/60 transition cursor-pointer border border-white/20"
          >
            <MapPin className="w-3.5 h-3.5 text-white/90" />
            <span>{currentLoc.name}</span>
            <ChevronDown className="w-3 h-3 text-white/80" />
          </button>

          {/* Location picker dropdown */}
          {showLocationPicker && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/80 z-50 py-1.5 overflow-hidden">
              <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Select Location
              </div>
              {LOCATIONS.map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => {
                    setCurrentLoc(loc);
                    setShowLocationPicker(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-blue-50 transition ${
                    currentLoc.name === loc.name ? 'font-bold text-blue-600 bg-blue-50/60' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{loc.name}</div>
                    <div className="text-[10px] text-slate-400">{loc.district}</div>
                  </div>
                  <span className="font-bold text-slate-900">{loc.temp}°</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Action Buttons: API Settings & Prominent Navigate */}
        <div className="flex items-center gap-2">
          {/* API Settings Pill */}
          <button
            onClick={() => setShowSettingsBox(!showSettingsBox)}
            className="p-2 bg-white/30 backdrop-blur-md text-white rounded-full hover:bg-white/40 transition border border-white/30 shadow-xs cursor-pointer"
            title="API Keys and Engines"
          >
            <Key className="w-3.5 h-3.5" />
          </button>

          {/* Navigate CTA Button */}
          <button
            onClick={() => {
              setNavStep(1);
              setShowNavModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-full text-xs font-bold shadow-md transition cursor-pointer border border-white/80"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span>Navigate</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER (Mobile & Tablet Centered View) ── */}
      <main className="max-w-xl mx-auto px-4 pb-20 pt-2 space-y-4">
        {/* ── HERO WEATHER DISPLAY (Exact Match to Image 2 & 3) ── */}
        <section className="text-white pt-2 pb-4">
          {/* Big Temperature: 32° */}
          <div className="text-7xl md:text-8xl font-light tracking-tight leading-none mb-1">
            {currentLoc.temp}°
          </div>

          {/* Condition: Partly Cloudy */}
          <div className="text-xl md:text-2xl font-medium tracking-tight mb-2">
            {currentLoc.condition}
          </div>

          {/* High/Low & Feels Like */}
          <div className="text-xs md:text-sm text-white/90 font-normal">
            ↑ {currentLoc.high}° / ↓ {currentLoc.low}° &nbsp;&nbsp; Feels like {currentLoc.feelsLike}°
          </div>
        </section>

        {/* ── ARTISTIC SCENIC ILLUSTRATION (Traveler on Hill overlooking Water) ── */}
        <div className="relative w-full h-36 rounded-3xl overflow-hidden shadow-sm border border-white/40">
          <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ea3df" />
                <stop offset="70%" stopColor="#7ac2ee" />
                <stop offset="100%" stopColor="#9cd2f2" />
              </linearGradient>
              <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5aa9db" />
                <stop offset="100%" stopColor="#4395cc" />
              </linearGradient>
              <linearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#48995a" />
                <stop offset="50%" stopColor="#3c824c" />
                <stop offset="100%" stopColor="#2b6138" />
              </linearGradient>
            </defs>

            {/* Sky */}
            <rect width="600" height="200" fill="url(#skyGrad)" />

            {/* Clouds */}
            <path d="M 50 40 Q 70 20 90 40 Q 110 30 130 50 Q 80 60 50 40 Z" fill="#ffffff" opacity="0.4" />
            <path d="M 420 30 Q 445 10 470 30 Q 495 20 520 40 Q 460 55 420 30 Z" fill="#ffffff" opacity="0.35" />

            {/* Distant Mountains / Coast */}
            <path d="M 0 115 Q 150 95 300 110 T 600 105 L 600 130 L 0 130 Z" fill="#6baecc" opacity="0.7" />

            {/* Water / Lake */}
            <rect y="125" width="600" height="25" fill="url(#waterGrad)" />

            {/* Rolling Green Meadow / Hill */}
            <path d="M 0 140 Q 200 115 400 130 T 600 135 L 600 200 L 0 200 Z" fill="url(#grassGrad)" />

            {/* Traveler Figure */}
            <g transform="translate(410, 80) scale(0.65)">
              {/* Head & Cap */}
              <circle cx="15" cy="10" r="6" fill="#f87171" />
              <path d="M 9 9 Q 15 5 23 8" stroke="#ffffff" strokeWidth="2" fill="none" />
              {/* Torso (Yellow Shirt) */}
              <path d="M 10 16 L 22 17 L 24 45 L 8 45 Z" fill="#facc15" />
              {/* Shorts (Blue) */}
              <rect x="9" y="45" width="13" height="20" fill="#0284c7" rx="2" />
              {/* Legs */}
              <line x1="12" y1="65" x2="12" y2="82" stroke="#fed7aa" strokeWidth="3" />
              <line x1="19" y1="65" x2="20" y2="82" stroke="#fed7aa" strokeWidth="3" />
            </g>
          </svg>
        </div>

        {/* ── CARD 1: HOURLY FORECAST & CONNECTED TEMPERATURE CURVE (Image 2) ── */}
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/60 shadow-xs text-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs md:text-sm font-semibold tracking-tight text-white/95">
              {currentLoc.summary}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => scrollHourly('left')}
                className="w-6 h-6 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center transition cursor-pointer text-white"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => scrollHourly('right')}
                className="w-6 h-6 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center transition cursor-pointer text-white"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Horizontal Hourly Timeline with Connected Curve */}
          <div
            ref={hourlyScrollRef}
            className="overflow-x-auto scrollbar-none pb-2 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="min-w-[560px]">
              {/* Time Labels Row */}
              <div className="flex items-center justify-between text-[11px] text-white/80 font-medium mb-3">
                {hourlyData.map((h, i) => (
                  <div key={i} className="w-14 text-center">
                    {h.time}
                  </div>
                ))}
              </div>

              {/* Weather Icons Row */}
              <div className="flex items-center justify-between mb-2">
                {hourlyData.map((h, i) => (
                  <div key={i} className="w-14 flex items-center justify-center">
                    {h.isSunset ? (
                      <div className="w-5 h-5 rounded-full bg-rose-400/80 border border-white/60 flex items-center justify-center shadow-xs">
                        <Sun className="w-3 h-3 text-white" />
                      </div>
                    ) : h.icon === 'sun-cloud' ? (
                      <div className="flex items-center justify-center">
                        <Sun className="w-4 h-4 text-amber-300 fill-amber-300" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Moon className="w-4 h-4 text-white/90 fill-white/60" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Temperatures Row */}
              <div className="flex items-center justify-between text-xs font-bold text-white mb-2">
                {hourlyData.map((h, i) => (
                  <div key={i} className="w-14 text-center">
                    {h.isSunset ? <span className="text-[10px] font-semibold text-rose-200">Sunset</span> : `${h.temp}°`}
                  </div>
                ))}
              </div>

              {/* Connected SVG Temperature Trend Line */}
              <div className="w-full h-8 relative my-1">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 560 32">
                  {/* Subtle continuous golden path matching Image 2 */}
                  <path
                    d="M 28 8 L 84 12 L 140 12 L 196 16 L 252 20 L 308 20 L 364 24 L 420 24 L 476 28 L 532 28"
                    fill="none"
                    stroke="rgba(254, 240, 138, 0.7)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {/* Dots on points */}
                  {[
                    [28, 8],
                    [84, 12],
                    [140, 12],
                    [196, 16],
                    [252, 20],
                    [308, 20],
                    [364, 24],
                    [420, 24],
                    [476, 28],
                    [532, 28],
                  ].map(([cx, cy], idx) => (
                    <circle key={idx} cx={cx} cy={cy} r="3" fill="#fef08a" stroke="#ffffff" strokeWidth="1.5" />
                  ))}
                </svg>
              </div>

              {/* Rain Probability Row with Droplets (💧 1%) */}
              <div className="flex items-center justify-between text-[10px] text-white/80 font-medium mt-1">
                {hourlyData.map((h, i) => (
                  <div key={i} className="w-14 flex items-center justify-center gap-0.5">
                    <Droplets className="w-2.5 h-2.5 text-sky-200" />
                    <span>{h.rain}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom link: 48-hour forecast > */}
          <div className="mt-3 pt-3 border-t border-white/20 flex justify-end">
            <button
              onClick={() => navigate('/app/weather')}
              className="text-[11px] font-semibold text-white/90 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>48-hour forecast</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── CARD 2: SUNNY DAY AHEAD BANNER (Image 2) ── */}
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-4 border border-white/60 shadow-xs text-white">
          <div className="flex items-center gap-2 text-xs font-semibold text-white/90 mb-1">
            <Sun className="w-4 h-4 text-amber-200 fill-amber-200" />
            <span>Sunny Day Ahead</span>
          </div>
          <p className="text-xs text-white font-medium mb-3">
            Expect tomorrow to be next sunny day
          </p>
          {/* Pagination dots */}
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </div>
        </div>

        {/* ── CARD 3: MULTI-DAY FORECAST (Image 2) ── */}
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/60 shadow-xs text-white space-y-3">
          {/* Yesterday */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white/90">Yesterday</span>
            <span className="font-bold text-white">36° 27°</span>
          </div>

          {/* Today */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-white/15">
            <span className="font-bold text-white">Today</span>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-white/80 flex items-center gap-0.5">
                <Droplets className="w-2.5 h-2.5 text-sky-200" /> 1%
              </span>
              <div className="flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
                <Moon className="w-3 h-3 text-white/80" />
              </div>
              <span className="font-bold text-white">35° 26°</span>
            </div>
          </div>

          {/* Sun */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-white/15">
            <span className="font-medium text-white/90">Sun</span>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-white/80 flex items-center gap-0.5">
                <Droplets className="w-2.5 h-2.5 text-sky-200" /> 15%
              </span>
              <div className="flex items-center gap-1">
                <Cloud className="w-3.5 h-3.5 text-white/90" />
              </div>
              <span className="font-bold text-white">35° 26°</span>
            </div>
          </div>
        </div>

        {/* ── CARD 4: RUNNING / OUTDOOR ACTIVITIES WIDGET (Image 4) ── */}
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/60 shadow-xs text-white">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-white" />
            <span className="text-sm font-bold text-white">Running</span>
          </div>
          <div className="text-sm font-bold text-rose-200 mb-0.5">Poor</div>
          <p className="text-xs text-white/90 mb-4">
            Poor weather for running right now due to heat and humidity
          </p>

          {/* Hourly Timeline Indicators */}
          <div className="flex items-center justify-around bg-black/15 rounded-2xl p-3 border border-white/15 mb-3">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-white/80 mb-1">5:30 pm</span>
              <div className="w-6 h-6 rounded-full bg-rose-500/80 flex items-center justify-center text-white text-xs">
                ☹
              </div>
              <span className="text-[10px] text-rose-200 font-semibold mt-1">Poor</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[10px] text-white/80 mb-1">6:30 pm</span>
              <div className="w-6 h-6 rounded-full bg-rose-500/80 flex items-center justify-center text-white text-xs">
                ☹
              </div>
              <span className="text-[10px] text-rose-200 font-semibold mt-1">Poor</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[10px] text-white/80 mb-1">7:30 pm</span>
              <div className="w-6 h-6 rounded-full bg-rose-500/80 flex items-center justify-center text-white text-xs">
                ☹
              </div>
              <span className="text-[10px] text-rose-200 font-semibold mt-1">Poor</span>
            </div>
          </div>

          {/* Pagination dots */}
          <div className="flex items-center justify-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </div>
        </div>

        {/* ── CARD 5: RADAR AND MAPS (Image 4) ── */}
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/60 shadow-xs text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-white">Radar and maps</span>
            <span className="text-xs text-white/80 font-medium">
              Current temperature of approx. {currentLoc.temp}°
            </span>
          </div>

          {/* Interactive Radar Map Preview */}
          <div className="my-2">
            <RadarMiniMap
              lat={currentLoc.lat}
              lng={currentLoc.lng}
              cityName={currentLoc.name}
              onOpenFullRadar={() => navigate('/app/navigation')}
            />
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20">
            <span className="text-[11px] text-white/80">
              Combines Google Maps styles + Real-time Weather Doppler Radar
            </span>
            <button
              onClick={() => navigate('/app/navigation')}
              className="px-3 py-1 bg-white text-blue-700 text-xs font-bold rounded-full hover:bg-blue-50 transition shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <span>Explore</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* ── CARD 6: AIR QUALITY INDEX (AQI) (Image 4) ── */}
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/60 shadow-xs text-white">
          <div className="text-xs font-semibold text-white/80 mb-1">AQI</div>
          <div className="text-base font-bold text-white mb-2">
            {currentLoc.aqiStatus}({currentLoc.aqi})
          </div>

          {/* Green Progress Bar matching screenshot */}
          <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-emerald-400 shadow-xs"
              style={{ width: `${Math.min(100, (currentLoc.aqi / 200) * 100)}%` }}
            />
          </div>
        </div>

        {/* ── CARD 7: POLLEN CARD (Image 3) ── */}
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/60 shadow-xs text-white">
          <div className="text-xs font-semibold text-white/80 mb-4">Pollen</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <Sprout className="w-5 h-5 mx-auto text-white/80 mb-1" />
              <div className="text-[11px] text-white/80">Tree</div>
              <div className="text-xs font-bold text-white mt-0.5">None</div>
            </div>
            <div>
              <Sprout className="w-5 h-5 mx-auto text-white/80 mb-1" />
              <div className="text-[11px] text-white/80">Grass</div>
              <div className="text-xs font-bold text-white mt-0.5">None</div>
            </div>
            <div>
              <Sprout className="w-5 h-5 mx-auto text-white/80 mb-1" />
              <div className="text-[11px] text-white/80">Ragweed</div>
              <div className="text-xs font-bold text-white mt-0.5">None</div>
            </div>
          </div>
        </div>

        {/* ── 2x2 GRID OF DETAIL CARDS (Image 3) ── */}
        <div className="grid grid-cols-2 gap-3">
          {/* UV Index */}
          <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-4 border border-white/60 shadow-xs text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-white/80 font-medium mb-1">
                <Sun className="w-3.5 h-3.5 text-amber-200" />
                <span>UV index</span>
              </div>
              <div className="text-[11px] text-white/80 mb-2">Low rest of day</div>
              <div className="text-lg font-bold text-white">Low</div>
            </div>

            {/* Spectrum color bar with circle indicator on 0 */}
            <div className="mt-3">
              <div className="w-full h-2 rounded-full relative overflow-visible" style={{ background: 'linear-gradient(90deg, #22c55e 0%, #eab308 30%, #f97316 60%, #ef4444 80%, #a855f7 100%)' }}>
                <div className="absolute -top-1 left-0 w-4 h-4 rounded-full bg-white border-2 border-emerald-500 shadow-md flex items-center justify-center text-[8px] font-bold text-emerald-700">
                  0
                </div>
              </div>
            </div>
          </div>

          {/* Humidity */}
          <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-4 border border-white/60 shadow-xs text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-white/80 font-medium mb-1">
                <Droplets className="w-3.5 h-3.5 text-sky-200" />
                <span>Humidity</span>
              </div>
              <div className="text-[11px] text-white/80 mb-2">Similar to yesterday</div>
              <div className="text-lg font-bold text-white">{currentLoc.humidity}%</div>
            </div>

            {/* Humidity progress bar */}
            <div className="mt-3">
              <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-300 rounded-full"
                  style={{ width: `${currentLoc.humidity}%` }}
                />
              </div>
            </div>
          </div>

          {/* Wind with Circular Dial (Image 3) */}
          <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-4 border border-white/60 shadow-xs text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-white/80 font-medium mb-1">
                <Wind className="w-3.5 h-3.5 text-white/90" />
                <span>Wind</span>
              </div>
              <div className="text-[11px] text-white/80 mb-1">It's breezy</div>
            </div>

            {/* Circular Compass Dial */}
            <div className="my-2 flex items-center justify-center">
              <div className="relative w-20 h-20 rounded-full border-2 border-white/30 flex items-center justify-center bg-black/10">
                <span className="absolute top-0.5 text-[8px] font-bold text-rose-300">N</span>
                <span className="absolute right-1 text-[8px] font-medium text-white/60">E</span>
                <span className="absolute bottom-0.5 text-[8px] font-medium text-white/60">S</span>
                <span className="absolute left-1 text-[8px] font-medium text-white/60">W</span>

                {/* Arrow & Speed in Center */}
                <div className="text-center">
                  <div className="text-xs font-black text-white">{currentLoc.windSpeed}</div>
                  <div className="text-[9px] text-white/80 leading-none">km/h</div>
                </div>
              </div>
            </div>
          </div>

          {/* Dew Point */}
          <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-4 border border-white/60 shadow-xs text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-white/80 font-medium mb-1">
                <Droplets className="w-3.5 h-3.5 text-sky-200" />
                <span>Dew point</span>
              </div>
              <div className="text-[11px] text-white/80 mb-2">It is very humid</div>
              <div className="text-2xl font-bold text-white">{currentLoc.dewPoint}°</div>
            </div>
          </div>
        </div>

        {/* ── 2x1 GRID: PRESSURE & VISIBILITY (Image 1) ── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Pressure Gauge Arc */}
          <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-4 border border-white/60 shadow-xs text-white flex flex-col justify-between">
            <div>
              <div className="text-xs text-white/80 font-medium mb-0.5">Pressure</div>
              <div className="text-[11px] text-white/80 mb-2">rapidly rising</div>
            </div>

            {/* Arc Meter */}
            <div className="relative w-full h-16 flex items-center justify-center">
              <svg className="w-24 h-16" viewBox="0 0 100 60">
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="6"
                  strokeDasharray="2, 4"
                />
                <path
                  d="M 10 50 A 40 40 0 0 1 65 18"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute bottom-1 text-center">
                <div className="text-xs font-bold text-white">{currentLoc.pressure}</div>
                <div className="text-[9px] text-white/80 leading-tight">mb</div>
              </div>
            </div>
          </div>

          {/* Visibility */}
          <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-4 border border-white/60 shadow-xs text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-white/80 font-medium mb-1">
                <Eye className="w-3.5 h-3.5 text-white/90" />
                <span>Visibility</span>
              </div>
              <div className="text-[11px] text-white/80 mb-2">Unlimited visibility</div>
            </div>
            <div className="text-xl font-bold text-white">{currentLoc.visibility}</div>
          </div>
        </div>

        {/* ── CARD 8: SUNRISE & SUNSET ARC (Image 1) ── */}
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/60 shadow-xs text-white">
          {/* Arc graphic with yellow trajectory and glowing sun */}
          <div className="w-full h-24 relative mb-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 300 80">
              <path
                d="M 20 70 Q 150 5 280 70"
                fill="none"
                stroke="rgba(254, 240, 138, 0.4)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M 20 70 Q 120 20 220 45"
                fill="none"
                stroke="#facc15"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Sun point on curve */}
              <circle cx="220" cy="45" r="7" fill="#fbbf24" stroke="#ffffff" strokeWidth="2.5" />
            </svg>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div>
              <div className="text-[11px] text-white/80">Sunrise</div>
              <div className="font-bold text-white text-sm">{currentLoc.sunrise}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-white/80">Sunset</div>
              <div className="font-bold text-white text-sm">{currentLoc.sunset}</div>
            </div>
          </div>
        </div>

        {/* ── CARD 9: MOON PHASE & MOONRISE / MOONSET (Image 1) ── */}
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-5 border border-white/60 shadow-xs text-white">
          <div className="flex items-center justify-between">
            {/* Moon Illustration */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-slate-800/40 border border-white/30 flex items-center justify-center shadow-inner relative overflow-hidden mb-1.5">
                <div className="w-12 h-12 rounded-full bg-slate-700/30" />
              </div>
              <span className="text-[11px] text-white/90 font-medium">{currentLoc.moonPhase}</span>
            </div>

            {/* Moonrise / Moonset */}
            <div className="text-right space-y-3">
              <div>
                <div className="text-[11px] text-white/80">Moonrise</div>
                <div className="font-bold text-white text-sm">{currentLoc.moonrise}</div>
              </div>
              <div>
                <div className="text-[11px] text-white/80">Moonset</div>
                <div className="font-bold text-white text-sm">{currentLoc.moonset}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD 10: REPORT INCORRECT INFO PILL BUTTON (Image 1) ── */}
        <button
          onClick={() => alert('Feedback submitted. Thank you for keeping community weather accurate!')}
          className="w-full py-3 px-4 bg-white/40 backdrop-blur-xl hover:bg-white/50 text-white font-semibold text-xs rounded-full border border-white/60 shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Send className="w-3.5 h-3.5 text-white/90" />
          <span>Report incorrect info</span>
        </button>

        {/* ── FOOTER (Exact Match to Image 1) ── */}
        <footer className="pt-2 pb-6 flex items-center justify-between text-xs text-white/80">
          {/* The Weather Channel Logo Box */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#004b87] rounded-md flex flex-col items-center justify-center p-0.5 border border-white/30">
              <span className="text-white text-[6px] font-black leading-tight uppercase">The</span>
              <span className="text-white text-[7px] font-black leading-tight uppercase">Weather</span>
            </div>
            <span className="font-bold text-white text-xs">The Weather Channel</span>
          </div>

          <span>Updated 10/10, 5:29 pm</span>
        </footer>
      </main>

      {/* ── FLOATING BOTTOM BAR (Exact Match to Image 1: ≡ with pin and 🔍 search) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/30 backdrop-blur-2xl border-t border-white/40 py-2.5 px-6 flex items-center justify-between max-w-xl mx-auto w-full">
        {/* Left Menu / Locations Icon */}
        <button
          onClick={() => setShowLocationPicker(!showLocationPicker)}
          className="p-2 text-white hover:text-white/80 transition cursor-pointer"
          title="Locations"
        >
          <div className="flex items-center gap-1">
            <span className="font-bold text-lg leading-none">≡</span>
            <MapPin className="w-3.5 h-3.5 text-white" />
          </div>
        </button>

        {/* Center Actions: Navigate & Emergency Contacts */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setNavStep(1);
              setShowNavModal(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-lg transition flex items-center gap-1.5 cursor-pointer border border-white/40"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Navigate</span>
          </button>
          <button
            onClick={() => setShowContactsModal(true)}
            className="px-3.5 py-2 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded-full shadow-lg transition flex items-center gap-1.5 cursor-pointer border border-white/30"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Emergency Contacts</span>
          </button>
        </div>

        {/* Right Search Icon */}
        <button
          onClick={() => {
            setNavStep(3);
            setShowNavModal(true);
          }}
          className="p-2 text-white hover:text-white/80 transition cursor-pointer"
          title="Search destination"
        >
          <Search className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* ── ONBOARDING NAVIGATION FLOW MODAL (NAME → LOCATION → DESTINATION) ── */}
      {showNavModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowNavModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Stepper Progress */}
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    navStep >= step ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>

            {/* Step 1: User's Name */}
            {navStep === 1 && (
              <div>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Welcome to SafeRoute AI</h3>
                <p className="text-xs text-slate-500 mb-5">
                  Enter your name so we can personalize route risk alerts, flood monitoring & SOS safety.
                </p>

                <div className="mb-5">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Morgan"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    autoFocus
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowNavModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setNavStep(2)}
                    disabled={!userName.trim()}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Location Permission */}
            {navStep === 2 && (
              <div>
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Current Location Permission</h3>
                <p className="text-xs text-slate-500 mb-4">
                  We need your starting location to scan for submerged roads and flooded corridors.
                </p>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-800">GPS Origin Detection</span>
                    {userLocation ? (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Ready</span>
                    )}
                  </div>
                  {userLocation ? (
                    <p className="text-xs text-slate-600">
                      Coordinates: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Click below to allow browser geolocation or use {currentLoc.name}.
                    </p>
                  )}
                </div>

                {locationError && (
                  <p className="text-xs text-amber-600 mb-3">{locationError}</p>
                )}

                <div className="mb-5 flex gap-2">
                  <button
                    onClick={handleRequestLocation}
                    disabled={locatingUser}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {locatingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
                    <span>{locatingUser ? 'Acquiring GPS...' : 'Allow GPS Location'}</span>
                  </button>
                  <button
                    onClick={() => setUserLocation({ lat: currentLoc.lat, lng: currentLoc.lng })}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Use {currentLoc.name}
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setNavStep(1)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setNavStep(3)}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Proceed to Destination</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Destination Address */}
            {navStep === 3 && (
              <div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <Navigation className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Destination Address</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Select your destination to evaluate flood risk corridors and safe alternate paths.
                </p>

                <div className="mb-3 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search shelter, landmark, or city..."
                    value={destinationSearch}
                    onChange={(e) => setDestinationSearch(e.target.value)}
                    autoFocus
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                {/* Suggestions List */}
                <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl mb-5 divide-y divide-slate-100">
                  {filteredDestinations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => setSelectedDestination(loc)}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-blue-50/60 transition cursor-pointer ${
                        selectedDestination?.id === loc.id ? 'bg-blue-50 font-bold text-blue-700' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{loc.name}</div>
                        <div className="text-[10px] text-slate-400">{loc.district}</div>
                      </div>
                      {selectedDestination?.id === loc.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setNavStep(2)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleStartNavigation}
                    disabled={!selectedDestination}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Launch Safe Map & Routes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emergency Contacts Modal */}
      <EmergencyContactsModal
        isOpen={showContactsModal}
        onClose={() => setShowContactsModal(false)}
      />
    </div>
  );
};
