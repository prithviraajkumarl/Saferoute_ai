import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Navigation,
  AlertTriangle,
  Radio,
  Building2,
  CloudSun,
  ShieldAlert,
  Activity,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { HazardReport, Shelter, OfficialAlert, WeatherData } from '../types';

interface OverviewPageProps {
  onOpenSos: () => void;
  onOpenReportHazard: () => void;
  onOpenSimulation: () => void;
  isSimulated?: boolean;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onOpenSos,
  onOpenReportHazard,
  onOpenSimulation,
  isSimulated = false,
}) => {
  const navigate = useNavigate();
  const { language } = useI18n();
  const { theme } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [hazards, setHazards] = useState<HazardReport[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [alerts, setAlerts] = useState<OfficialAlert[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [hRes, sList, aList, wData, hData] = await Promise.all([
        api.getHazards(undefined, isSimulated),
        api.getShelters(13.0827, 80.2707),
        api.getAlerts(13.0827, 80.2707),
        api.getWeather(13.0827, 80.2707),
        api.getHealthReadiness(),
      ]);
      setHazards(hRes?.items || []);
      setShelters(sList || []);
      setAlerts(aList || []);
      setWeather(wData || null);
      setSystemHealth(hData || null);
    } catch (e) {
      console.error('Error fetching dashboard overview data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isSimulated]);

  // Derived statistics from real backend datasets
  const verifiedHazardsCount = hazards.filter((h) => h.status === 'VERIFIED').length;
  const criticalHazardsCount = hazards.filter((h) => h.severity === 'CRITICAL' || h.hazard_type.toLowerCase().includes('closure')).length;
  const totalShelterCapacity = shelters.reduce((acc, s) => acc + (s.capacity || 0), 0);
  const totalShelterOccupancy = shelters.reduce((acc, s) => acc + (s.current_occupancy || 0), 0);
  const availableShelterBeds = totalShelterCapacity - totalShelterOccupancy;

  const cardBg = theme === 'dark'
    ? 'bg-slate-900/80 border-slate-800 text-slate-100'
    : 'bg-white/90 border-slate-200 text-slate-800 shadow-sm';

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome & Quick Actions Banner */}
      <div className={`p-6 rounded-3xl border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 border-slate-800 text-white'
          : 'bg-gradient-to-br from-blue-50/80 via-white to-slate-50 border-blue-200/60 text-slate-900 shadow-sm'
      }`}>
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500 border border-blue-500/30">
              TAMIL NADU DISASTER MONITORING CELL
            </span>
            {isSimulated && (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                ACTIVE DRILL SCENARIO
              </span>
            )}
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight">
            SafeRoute Command & Safety Intelligence
          </h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Real-time multi-corridor route risk assessment, Open-Meteo precipitation tracking, and verified citizen hazard telemetry for Chennai and Tamil Nadu coastal districts.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 z-10 shrink-0">
          <button
            onClick={() => navigate('/navigation')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
            <span>Plan Safe Route</span>
          </button>
          <button
            onClick={onOpenReportHazard}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold transition cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Report Hazard</span>
          </button>
          <button
            onClick={onOpenSos}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition cursor-pointer"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Emergency SOS</span>
          </button>
          <button
            onClick={fetchData}
            className={`p-2.5 rounded-2xl border transition cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-600'
            }`}
            title="Refresh telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (Real Verified Values) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Verified Road Hazards */}
        <div className={`p-4 rounded-2xl border transition hover:border-blue-500/40 ${cardBg}`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Active Road Hazards</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black">
            {isLoading ? '...' : hazards.length}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-2">
            <span className="text-amber-500 font-bold">{verifiedHazardsCount} Verified</span>
            <span>•</span>
            <span className="text-rose-500 font-bold">{criticalHazardsCount} Severe</span>
          </div>
        </div>

        {/* Card 2: Relief Shelters Availability */}
        <div className={`p-4 rounded-2xl border transition hover:border-blue-500/40 ${cardBg}`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Relief Shelters</span>
            <Building2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black">
            {isLoading ? '...' : shelters.length}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-2">
            <span className="text-emerald-500 font-bold">{availableShelterBeds} Beds Vacant</span>
            <span>•</span>
            <span>{totalShelterCapacity} Total Cap</span>
          </div>
        </div>

        {/* Card 3: Live Meteorological Reading */}
        <div className={`p-4 rounded-2xl border transition hover:border-blue-500/40 ${cardBg}`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Live Meteorology (Chennai)</span>
            <CloudSun className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black">
            {isLoading || !weather ? '...' : `${weather.current.temperature_c}°C`}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-2">
            <span className="text-blue-400 font-bold">{weather?.current.precipitation_mm ?? 0} mm/h Rain</span>
            <span>•</span>
            <span>{weather?.current.wind_speed_kmh ?? 0} km/h Wind</span>
          </div>
        </div>

        {/* Card 4: Official Alerts & Engine Status */}
        <div className={`p-4 rounded-2xl border transition hover:border-blue-500/40 ${cardBg}`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Official Alerts (CAP)</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black">
            {isLoading ? '...' : alerts.length}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-2">
            <span className="text-emerald-400 font-mono font-bold">Engine v2.4.0</span>
            <span>•</span>
            <span className="font-mono">{systemHealth?.database?.status ?? 'HEALTHY'}</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Active Alerts & Recent Incident Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Verified Hazards Feed */}
        <div className={`lg:col-span-2 p-5 rounded-3xl border space-y-4 ${cardBg}`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-700/40">
            <div>
              <h3 className="font-bold text-sm md:text-base">Recent Field Hazards & Road Blocks</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real community reports and municipal flood telemetry along transport corridors
              </p>
            </div>
            <button
              onClick={() => navigate('/incidents')}
              className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {hazards.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No active hazard reports filed. All monitored routes clear.
            </div>
          ) : (
            <div className="space-y-2.5">
              {hazards.slice(0, 5).map((h) => (
                <div
                  key={h.id}
                  className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 transition ${
                    theme === 'dark'
                      ? 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        h.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : h.severity === 'HIGH'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {h.severity}
                      </span>
                      <span className="font-bold text-xs truncate uppercase tracking-tight">
                        {h.hazard_type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {h.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {h.description}
                    </p>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-0.5">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}</span>
                      <span>•</span>
                      <span>{new Date(h.source_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/navigation')}
                    className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold shrink-0 transition cursor-pointer"
                    title="View corridor on map"
                  >
                    <Navigation className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Live Official Alerts & Quick Relief Centers */}
        <div className="space-y-6">
          {/* Official Alerts Card */}
          <div className={`p-5 rounded-3xl border space-y-3 ${cardBg}`}>
            <div className="flex items-center justify-between border-b pb-2 border-slate-700/40">
              <h3 className="font-bold text-sm">Disaster Bulletins</h3>
              <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30">
                {alerts.length} ACTIVE
              </span>
            </div>

            {alerts.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                No active state disaster bulletins at this time.
              </div>
            ) : (
              <div className="space-y-2.5">
                {alerts.slice(0, 2).map((alt) => (
                  <div
                    key={alt.id}
                    className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs space-y-1"
                  >
                    <div className="font-bold text-rose-300 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>{alt.headline}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {alt.description}
                    </p>
                    <div className="text-[10px] text-slate-400 pt-1 font-mono">
                      Source: {alt.sender_name || 'TNSDMA Sachet'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Relief Center Highlights */}
          <div className={`p-5 rounded-3xl border space-y-3 ${cardBg}`}>
            <div className="flex items-center justify-between border-b pb-2 border-slate-700/40">
              <h3 className="font-bold text-sm">Designated Safe Shelters</h3>
              <button
                onClick={() => navigate('/relief-centers')}
                className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {shelters.slice(0, 3).map((s) => (
                <div
                  key={s.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                    theme === 'dark' ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-bold text-xs truncate">{s.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{s.district}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-emerald-400">
                      {s.capacity - s.current_occupancy} beds
                    </div>
                    <div className="text-[9px] text-slate-400">
                      {s.occupancy_percentage}% full
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
