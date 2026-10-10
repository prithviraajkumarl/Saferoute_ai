import React, { useState, useEffect } from 'react';
import { TacticalMap } from '../components/TacticalMap';
import { api } from '../services/api';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { TAMIL_NADU_LOCATIONS, TamilNaduLocation } from '../data/tamilNaduLocations';
import { WeatherData } from '../types';
import {
  Satellite,
  Radar,
  CloudRain,
  Wind,
  Thermometer,
  Droplets,
  Gauge,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Search,
  Sliders,
  Info,
  Maximize2,
  MapPin,
  RefreshCw,
  Sun,
  ShieldAlert,
} from 'lucide-react';

export const WeatherPage: React.FC = () => {
  const { language } = useI18n();
  const { theme } = useTheme();

  // Active Weather Map Layer matching Zoom Earth reference
  type WeatherLayerType = 'satellite' | 'radar' | 'precipitation' | 'wind' | 'temperature' | 'humidity' | 'pressure';
  const [activeLayer, setActiveLayer] = useState<WeatherLayerType>('temperature');
  const [tempMode, setTempMode] = useState<'actual' | 'feels_like'>('actual');

  // Location & Telemetry
  const [selectedStation, setSelectedStation] = useState<TamilNaduLocation>(TAMIL_NADU_LOCATIONS[0]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Timeline Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(2); // '17:02 LIVE'
  const [selectedModel, setSelectedModel] = useState<'ICON' | 'GFS'>('ICON');

  const TIMELINE_STEPS = [
    { label: '15:00 (-2h)', offsetMin: -120 },
    { label: '16:00 (-1h)', offsetMin: -60 },
    { label: '17:02 LIVE', offsetMin: 0 },
    { label: '18:00 (+1h)', offsetMin: 60 },
    { label: '19:00 (+2h)', offsetMin: 120 },
    { label: '21:00 (+4h)', offsetMin: 240 },
    { label: '23:00 (+6h)', offsetMin: 360 },
  ];

  // Fetch real Open-Meteo weather
  const fetchLiveWeather = async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const data = await api.getWeather(lat, lng);
      setWeatherData(data);
    } catch (e) {
      console.error('Failed to fetch weather:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveWeather(selectedStation.lat, selectedStation.lng);
  }, [selectedStation]);

  // Timeline auto-advance animation when playing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % TIMELINE_STEPS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Map layer translation: map our layer to TacticalMap prop
  const getTacticalMapLayer = () => {
    if (activeLayer === 'radar') return 'radar';
    if (activeLayer === 'wind') return 'wind';
    if (activeLayer === 'temperature') return 'temperature';
    if (activeLayer === 'precipitation') return 'radar'; // Renders precipitation rain contours
    if (activeLayer === 'satellite') return 'none'; // Shows Esri World Imagery satellite cleanly
    return 'none';
  };

  return (
    <div className="relative w-full h-[calc(100vh-53px)] overflow-hidden select-none bg-[#090d16]">
      {/* 1. Underlying Tactical Base Map */}
      <div className="absolute inset-0 w-full h-full z-0">
        <TacticalMap
          candidateRoutes={[]}
          recommendedIndex={0}
          hazards={[]}
          shelters={[]}
          centerLocation={{ lat: selectedStation.lat, lng: selectedStation.lng, zoom: 11 }}
        />
      </div>

      {/* 2. Floating Zoom Earth Weather Controls Sidebar (Left) */}
      <div className="absolute top-4 left-4 z-20 w-60 md:w-64">
        <div className={`rounded-2xl p-3 space-y-4 shadow-2xl transition-all ${
          theme === 'dark' ? 'zoom-panel text-slate-100' : 'light-panel text-slate-900'
        }`}>
          {/* Header Title */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                ZE
              </div>
              <span className="font-bold text-xs uppercase tracking-wider">
                Weather Intelligence
              </span>
            </div>
            <button
              onClick={() => fetchLiveWeather(selectedStation.lat, selectedStation.lng)}
              className="p-1 rounded-md hover:bg-slate-700/40 text-slate-400 hover:text-white transition"
              title="Refresh Live Feed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Section: LIVE MAPS */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5">
              Live Maps
            </div>
            <button
              onClick={() => setActiveLayer('satellite')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeLayer === 'satellite'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'hover:bg-slate-800/50 text-slate-300'
              }`}
            >
              <Satellite className="w-4 h-4" />
              <span>Satellite</span>
            </button>
            <button
              onClick={() => setActiveLayer('radar')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeLayer === 'radar'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'hover:bg-slate-800/50 text-slate-300'
              }`}
            >
              <Radar className="w-4 h-4" />
              <span>Radar</span>
            </button>
          </div>

          {/* Section: FORECAST MAPS */}
          <div className="space-y-1 pt-1 border-t border-slate-700/40">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5">
              Forecast Maps
            </div>

            <button
              onClick={() => setActiveLayer('precipitation')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeLayer === 'precipitation'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'hover:bg-slate-800/50 text-slate-300'
              }`}
            >
              <CloudRain className="w-4 h-4 text-cyan-400" />
              <span>Precipitation</span>
            </button>

            <button
              onClick={() => setActiveLayer('wind')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeLayer === 'wind'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'hover:bg-slate-800/50 text-slate-300'
              }`}
            >
              <Wind className="w-4 h-4 text-sky-400" />
              <span>Wind</span>
            </button>

            {/* Temperature with Sub-Options (Actual vs Feels Like) */}
            <div>
              <button
                onClick={() => setActiveLayer('temperature')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeLayer === 'temperature'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'hover:bg-slate-800/50 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Thermometer className="w-4 h-4 text-amber-400" />
                  <span>Temperature</span>
                </div>
              </button>

              {activeLayer === 'temperature' && (
                <div className="pl-6 pt-1.5 space-y-1 text-xs">
                  <button
                    onClick={() => setTempMode('actual')}
                    className={`flex items-center gap-2 w-full py-1 text-[11px] cursor-pointer ${
                      tempMode === 'actual' ? 'font-bold text-blue-400' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{tempMode === 'actual' ? '✓ ' : '  '}Actual</span>
                  </button>
                  <button
                    onClick={() => setTempMode('feels_like')}
                    className={`flex items-center gap-2 w-full py-1 text-[11px] cursor-pointer ${
                      tempMode === 'feels_like' ? 'font-bold text-blue-400' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{tempMode === 'feels_like' ? '✓ ' : '  '}Feels Like</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveLayer('humidity')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeLayer === 'humidity'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'hover:bg-slate-800/50 text-slate-300'
              }`}
            >
              <Droplets className="w-4 h-4 text-indigo-400" />
              <span>Humidity</span>
            </button>

            <button
              onClick={() => setActiveLayer('pressure')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeLayer === 'pressure'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'hover:bg-slate-800/50 text-slate-300'
              }`}
            >
              <Gauge className="w-4 h-4 text-teal-400" />
              <span>Pressure</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Top Floating Station Telemetry Pill */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <div className={`px-4 py-2 rounded-2xl flex items-center gap-3 shadow-xl ${
          theme === 'dark' ? 'zoom-glass text-slate-100' : 'light-glass text-slate-900'
        }`}>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-500" />
            <select
              value={selectedStation.name}
              onChange={(e) => {
                const found = TAMIL_NADU_LOCATIONS.find((l) => l.name === e.target.value);
                if (found) setSelectedStation(found);
              }}
              className="bg-transparent font-bold text-xs outline-none cursor-pointer"
            >
              {TAMIL_NADU_LOCATIONS.map((loc) => (
                <option key={loc.name} value={loc.name} className="text-slate-900 bg-white">
                  {loc.name} ({loc.district})
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-[1px] bg-slate-700/60" />

          <div className="flex items-center gap-3 text-xs font-mono">
            <div>
              <span className="font-bold text-amber-400">{weatherData?.current.temperature_c ?? selectedStation.temp}°C</span>
            </div>
            <div>
              <span className="text-cyan-400">{weatherData?.current.precipitation_mm ?? selectedStation.rainMm} mm/h</span>
            </div>
            <div>
              <span className="text-sky-400">{weatherData?.current.wind_speed_kmh ?? selectedStation.windKmh} km/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom-Left Color Scale Legend (Matching Zoom Earth Reference) */}
      <div className="absolute bottom-6 left-6 z-20">
        <div className={`p-2.5 rounded-xl shadow-xl flex flex-col gap-1 text-[10px] font-mono ${
          theme === 'dark' ? 'zoom-glass text-slate-200' : 'light-glass text-slate-800'
        }`}>
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase">
            <span>
              {activeLayer === 'temperature'
                ? 'Temperature (°C)'
                : activeLayer === 'precipitation' || activeLayer === 'radar'
                ? 'Rain Rate (mm/h)'
                : activeLayer === 'wind'
                ? 'Wind Speed (km/h)'
                : activeLayer === 'humidity'
                ? 'Relative Humidity (%)'
                : 'Sea-Level Pressure (hPa)'}
            </span>
          </div>

          {activeLayer === 'temperature' ? (
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-indigo-400">-30</span>
              <div className="h-2.5 w-44 rounded-md bg-gradient-to-r from-purple-800 via-blue-500 via-cyan-400 via-emerald-400 via-yellow-400 via-orange-500 to-rose-600" />
              <span className="text-rose-500">+50</span>
            </div>
          ) : activeLayer === 'wind' ? (
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-slate-400">0</span>
              <div className="h-2.5 w-44 rounded-md bg-gradient-to-r from-sky-300 via-blue-500 via-indigo-600 to-purple-600" />
              <span className="text-purple-400">120</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-slate-400">0</span>
              <div className="h-2.5 w-44 rounded-md bg-gradient-to-r from-emerald-400 via-yellow-400 via-orange-500 to-rose-600" />
              <span className="text-rose-400">100</span>
            </div>
          )}
        </div>
      </div>

      {/* 5. Bottom Center Timeline Player & Model Scrubber (Matching Zoom Earth Reference) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        <div className={`px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-4 ${
          theme === 'dark' ? 'zoom-timeline text-slate-100' : 'light-panel text-slate-900'
        }`}>
          {/* Play / Pause Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white shadow-md transition cursor-pointer"
            title={isPlaying ? 'Pause Timeline' : 'Play Timeline'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          {/* Step Backwards */}
          <button
            onClick={() => setCurrentStepIndex((prev) => (prev > 0 ? prev - 1 : TIMELINE_STEPS.length - 1))}
            className="p-1 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition"
            title="Step Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Time Display */}
          <div className="text-center font-mono min-w-[120px]">
            <div className="text-xs font-bold text-blue-400">
              {TIMELINE_STEPS[currentStepIndex].label}
            </div>
            <div className="text-[9px] text-slate-400">
              Open-Meteo Doppler
            </div>
          </div>

          {/* Step Forward */}
          <button
            onClick={() => setCurrentStepIndex((prev) => (prev + 1) % TIMELINE_STEPS.length)}
            className="p-1 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition"
            title="Step Forward"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Weather Model Selector (ICON 13km vs GFS 22km) */}
          <div className="border-l border-slate-700/60 pl-3 flex items-center gap-1.5 text-xs font-mono">
            <button
              onClick={() => setSelectedModel('ICON')}
              className={`px-2 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer ${
                selectedModel === 'ICON' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ICON 13km
            </button>
            <button
              onClick={() => setSelectedModel('GFS')}
              className={`px-2 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer ${
                selectedModel === 'GFS' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              GFS 22km
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
