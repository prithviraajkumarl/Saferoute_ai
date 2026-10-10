import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Navigation,
  Radio,
  Settings,
  Shield,
  ArrowRight,
  Thermometer,
  Wind,
  Droplets,
  CloudRain,
  Sun,
  Cloud,
  CloudLightning,
  MapPin,
  Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TAMIL_NADU_LOCATIONS } from '../data/tamilNaduLocations';

// Subset of cities to display in the weather strip
const WEATHER_CITIES = TAMIL_NADU_LOCATIONS.filter((l) =>
  [
    'chennai-central',
    'marina-beach',
    'velachery',
    'tambaram',
    'coimbatore-city',
    'madurai-meenakshi',
    'ooty-nilgiris',
    'kodaikanal',
    'thanjavur-temple',
    'trichy-city',
    'tirunelveli-city',
    'vellore-fort',
  ].includes(l.id)
).slice(0, 10);

// Pick a weather emoji icon based on rain and temp
function weatherIcon(rainMm: number, temp: number): string {
  if (rainMm > 10) return '⛈️';
  if (rainMm > 3) return '🌧️';
  if (rainMm > 0) return '🌦️';
  if (temp > 36) return '☀️';
  if (temp > 30) return '⛅';
  if (temp < 22) return '🌤️';
  return '☀️';
}

// Humidity estimate from rain
function humidityEstimate(rainMm: number, temp: number): number {
  const base = rainMm > 0 ? 78 + rainMm * 2.5 : 55 + (35 - temp) * 1.2;
  return Math.min(Math.round(base), 98);
}

// UV index estimate from temp
function uvIndex(temp: number, rainMm: number): number {
  if (rainMm > 5) return Math.round(2 + Math.random());
  if (temp > 35) return 9;
  if (temp > 32) return 7;
  if (temp > 28) return 5;
  return 3;
}

// Feels-like temperature
function feelsLike(temp: number, windKmh: number, humidity: number): number {
  // Simple heat-index approximation
  return Math.round(temp + (humidity - 50) * 0.05 - windKmh * 0.1);
}

export const StartPage: React.FC = () => {
  const navigate = useNavigate();
  const { switchPersona } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const handleSelectRole = (role: 'tourist' | 'responder' | 'administrator') => {
    switchPersona(role);
    if (role === 'tourist') {
      navigate('/app/dashboard');
    } else {
      navigate('/app/response');
    }
  };

  const timeStr = currentTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const dateStr = currentTime.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      className="min-h-screen text-black flex flex-col font-sans select-none"
      style={{ background: 'linear-gradient(160deg, #fefce8 0%, #fff7ed 30%, #f1f5f9 70%, #e2e8f0 100%)' }}
    >
      {/* ── TOP BAR ── */}
      <header className="max-w-7xl w-full mx-auto px-4 sm:px-8 pt-5 pb-4 flex items-center justify-between border-b border-orange-200/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center font-black shadow-md">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-black">
              SafeRoute<span className="text-orange-500">.AI</span>
            </span>
          </div>
        </div>

        {/* Time + Team Badges */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="text-sm font-black text-black">{timeStr}</span>
            <span className="text-[10px] text-slate-500 font-medium">{dateStr}</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-black text-white text-xs font-black shadow-sm">
            Team: Wired in
          </span>
          <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-900 border border-orange-300 text-xs font-black shadow-sm">
            Domain: Travel Tech
          </span>
        </div>
      </header>

      {/* ── LIVE WEATHER STRIP ── */}
      <section className="w-full px-4 sm:px-8 pt-5 pb-2 max-w-7xl mx-auto">
        {/* Strip Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs font-black text-black uppercase tracking-widest">
              Live Weather — Tamil Nadu
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Open-Meteo • Updated now
          </span>
        </div>

        {/* Cards: horizontal scroll on mobile, full row on desktop */}
        <div
          className="flex gap-3 overflow-x-auto pb-2 md:overflow-x-visible md:grid md:grid-cols-5 lg:grid-cols-10"
          style={{ scrollbarWidth: 'thin' }}
        >
          {WEATHER_CITIES.map((city, idx) => {
            const hum = humidityEstimate(city.rainMm, city.temp);
            const uv = uvIndex(city.temp, city.rainMm);
            const fl = feelsLike(city.temp, city.windKmh, hum);
            const icon = weatherIcon(city.rainMm, city.temp);
            const isHot = city.temp >= 35;
            const isRaining = city.rainMm > 0;
            const isCool = city.temp < 25;

            // Color palette per condition
            const bg = isRaining
              ? 'from-blue-400 to-cyan-500'
              : isHot
              ? 'from-orange-400 to-amber-500'
              : isCool
              ? 'from-emerald-400 to-teal-500'
              : 'from-amber-300 to-orange-400';

            const border = isRaining
              ? 'border-blue-300'
              : isHot
              ? 'border-orange-300'
              : isCool
              ? 'border-emerald-300'
              : 'border-amber-300';

            return (
              <div
                key={city.id}
                className={`flex-shrink-0 w-[148px] md:w-auto rounded-2xl border ${border} shadow-md overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-xl cursor-pointer`}
                style={{ minWidth: '148px' }}
              >
                {/* Top gradient header */}
                <div className={`bg-gradient-to-br ${bg} p-3 text-white`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-wider opacity-80">
                        {city.district}
                      </div>
                      <div className="text-[11px] font-black leading-tight mt-0.5 line-clamp-2">
                        {city.name.split(' ').slice(0, 2).join(' ')}
                      </div>
                    </div>
                    <span className="text-2xl leading-none mt-0.5">{icon}</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-black leading-none">{city.temp}</span>
                    <span className="text-base font-bold opacity-80">°C</span>
                  </div>
                  <div className="text-[10px] font-semibold opacity-75 mt-0.5">
                    Feels {fl}°C
                  </div>
                </div>

                {/* Metrics block */}
                <div className="bg-white/95 backdrop-blur-sm p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-700">
                    <span className="flex items-center gap-1">
                      <Wind className="w-2.5 h-2.5 text-blue-500" />
                      {city.windKmh} km/h {city.windDir}
                    </span>
                    <span className="flex items-center gap-1">
                      <Droplets className="w-2.5 h-2.5 text-cyan-500" />
                      {hum}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-700">
                    <span className="flex items-center gap-1">
                      <CloudRain className="w-2.5 h-2.5 text-indigo-500" />
                      {city.rainMm > 0 ? `${city.rainMm}mm` : 'No rain'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Sun className="w-2.5 h-2.5 text-amber-500" />
                      UV {uv}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-medium text-slate-500 pt-0.5 border-t border-slate-100">
                    <MapPin className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                    <span>{city.elev}m MSL</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── MAIN: TITLE + ROLE CARDS ── */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-8 flex-1">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-black leading-tight">
            Select Portal Access
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-semibold">
            Choose your role to enter the SafeRoute disaster-aware navigation &amp; emergency telemetry platform.
          </p>
        </div>

        {/* 3 Major Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Tourist Card */}
          <div
            onClick={() => handleSelectRole('tourist')}
            className="group relative bg-white/95 backdrop-blur-xl border-2 border-slate-200 hover:border-orange-400 rounded-3xl p-6 sm:p-7 shadow-lg hover:shadow-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-1"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                  <Navigation className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-orange-100 text-orange-900 border border-orange-200">
                  Public Traveler
                </span>
              </div>

              <div>
                <h2 className="text-xl font-black text-black group-hover:text-orange-600 transition-colors">
                  Tourist
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
                  Explore area condition overview, interactive Doppler weather maps, 3D safe roadway navigation, cyclone simulation, and high-ground relief centers.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-1.5 text-[11px] font-bold text-slate-700">
                <span className="px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200">3D Navigation</span>
                <span className="px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200">Weather Radar</span>
                <span className="px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200">Relief Camps</span>
              </div>
            </div>

            <button
              type="button"
              className="mt-6 w-full py-3 rounded-2xl bg-black group-hover:bg-orange-600 text-white font-black text-xs flex items-center justify-center gap-2 transition shadow-md"
            >
              <span>Launch Tourist Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* 2. First Reporter Card */}
          <div
            onClick={() => handleSelectRole('responder')}
            className="group relative bg-white/95 backdrop-blur-xl border-2 border-slate-200 hover:border-rose-400 rounded-3xl p-6 sm:p-7 shadow-lg hover:shadow-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-1"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                  <Radio className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-200">
                  Field Response
                </span>
              </div>

              <div>
                <h2 className="text-xl font-black text-black group-hover:text-rose-700 transition-colors">
                  First Reporter
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
                  Real-time operational stream displaying all citizen SOS emergency messages sent in chronological order. Dispatch rescue squads and acknowledge emergency requests.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-1.5 text-[11px] font-bold text-slate-700">
                <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200">SOS Signal Stream</span>
                <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200">Dispatch Units</span>
                <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200">Live Triage</span>
              </div>
            </div>

            <button
              type="button"
              className="mt-6 w-full py-3 rounded-2xl bg-black group-hover:bg-rose-600 text-white font-black text-xs flex items-center justify-center gap-2 transition shadow-md"
            >
              <span>Launch First Reporter</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* 3. Admin Card */}
          <div
            onClick={() => handleSelectRole('administrator')}
            className="group relative bg-white/95 backdrop-blur-xl border-2 border-slate-200 hover:border-amber-400 rounded-3xl p-6 sm:p-7 shadow-lg hover:shadow-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-1"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                  <Settings className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  Master Console
                </span>
              </div>

              <div>
                <h2 className="text-xl font-black text-black group-hover:text-amber-800 transition-colors">
                  Admin
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
                  Master governance console: View all API keys used, spatial algorithms, telemetry database, and full SOS incident reports with override and deletion controls.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-1.5 text-[11px] font-bold text-slate-700">
                <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200">API Keys List</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200">Risk Algorithms</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200">Database &amp; Reports</span>
              </div>
            </div>

            <button
              type="button"
              className="mt-6 w-full py-3 rounded-2xl bg-black group-hover:bg-amber-700 text-white font-black text-xs flex items-center justify-center gap-2 transition shadow-md"
            >
              <span>Launch Admin Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-4 border-t border-orange-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-semibold">
        <div className="flex items-center gap-2">
          <span className="font-bold text-black">SafeRoute.AI</span>
          <span>•</span>
          <span>Wired in • Travel Tech</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Open-Meteo API</span>
          <span>•</span>
          <span>Google Gemini AI</span>
          <span>•</span>
          <span>OpenStreetMap</span>
        </div>
      </footer>
    </div>
  );
};
