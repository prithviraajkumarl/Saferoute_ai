import React from 'react';
import {
  CloudRain,
  Wind,
  Droplets,
  AlertOctagon,
  Activity,
  ShieldAlert,
  CheckCircle2,
  Gauge,
  Eye,
  Zap,
} from 'lucide-react';
import { WeatherData, OfficialAlert } from '../types';
import { useI18n } from '../context/I18nContext';

interface TelemetryPanelProps {
  weather: WeatherData | null;
  alerts: OfficialAlert[];
  isLoading: boolean;
}

// Next-hour minute-by-minute nowcast profile
const MINUTE_NOWCAST = [
  { min: 5, dbz: 32, label: 'Mod' },
  { min: 10, dbz: 38, label: 'Heavy' },
  { min: 15, dbz: 46, label: 'Heavy' },
  { min: 20, dbz: 52, label: 'Core' },
  { min: 25, dbz: 54, label: 'Core' },
  { min: 30, dbz: 48, label: 'Heavy' },
  { min: 35, dbz: 42, label: 'Heavy' },
  { min: 40, dbz: 34, label: 'Mod' },
  { min: 45, dbz: 28, label: 'Mod' },
  { min: 50, dbz: 22, label: 'Light' },
  { min: 55, dbz: 18, label: 'Light' },
  { min: 60, dbz: 14, label: 'Drizzle' },
];

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ weather, alerts, isLoading }) => {
  const { language, t } = useI18n();

  const getDbzColor = (dbz: number) => {
    if (dbz >= 50) return 'bg-rose-500';
    if (dbz >= 40) return 'bg-amber-500';
    if (dbz >= 30) return 'bg-yellow-400';
    if (dbz >= 20) return 'bg-emerald-400';
    return 'bg-blue-400';
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Weather Radar Card */}
      <div className="rounded-2xl p-4 border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold tracking-wider text-slate-900 uppercase">
              {t('weather_telemetry')}
            </h3>
          </div>
          {weather?.current?.is_cached ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
              {t('cached_badge')}
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>LIVE TELEMETRY</span>
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="py-6 text-center text-xs text-slate-500">Loading weather metrics...</div>
        ) : weather?.current ? (
          <div className="mt-3 space-y-3.5">
            {/* Condition Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
                  <span>{weather.current.temperature_c.toFixed(1)}°C</span>
                  <span className="text-xs font-normal text-slate-500">
                    / {((weather.current.temperature_c * 9) / 5 + 32).toFixed(1)}°F
                  </span>
                </div>
                <div className="text-xs text-blue-700 font-semibold mt-0.5">
                  {language === 'ta' ? weather.current.condition_ta : weather.current.condition_description}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600">
                <CloudRain className="w-8 h-8" />
              </div>
            </div>

            {/* Precipitation Nowcast Profile */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Precipitation Nowcast (Next 60 Min)</span>
                </div>
                <span className="text-[10px] text-amber-700 font-bold">Peak 54 dBZ in 25m</span>
              </div>

              {/* Rain Bars */}
              <div className="grid grid-cols-12 gap-1 items-end h-10 pt-1">
                {MINUTE_NOWCAST.map((item) => (
                  <div key={item.min} className="flex flex-col items-center gap-1 group relative">
                    <div
                      className={`w-full rounded-xs transition-all ${getDbzColor(item.dbz)}`}
                      style={{ height: `${(item.dbz / 60) * 32}px` }}
                    />
                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 hidden group-hover:block px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-white z-20 whitespace-nowrap shadow-sm">
                      +{item.min}m: {item.dbz} dBZ
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[9px] text-slate-500 border-t border-slate-200 pt-1">
                <span>Now (32 dBZ)</span>
                <span>+30m (Heavy)</span>
                <span>+60m (Drizzle)</span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <CloudRain className="w-3 h-3 text-blue-600" />
                  <span>Rain Rate</span>
                </div>
                <div className="text-xs font-bold text-slate-900 mt-1">
                  {weather.current.precipitation_mm} mm/h
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Wind className="w-3 h-3 text-amber-600" />
                  <span>Wind Speed</span>
                </div>
                <div className="text-xs font-bold text-slate-900 mt-1">
                  {weather.current.wind_speed_kmh} km/h
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Droplets className="w-3 h-3 text-sky-600" />
                  <span>Humidity</span>
                </div>
                <div className="text-xs font-bold text-slate-900 mt-1">
                  {weather.current.relative_humidity}%
                </div>
              </div>
            </div>

            {/* Extra Atmospheric Telemetry */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200">
                <Gauge className="w-3.5 h-3.5 text-blue-600" />
                <span>Barometer: <b>1004.8 hPa</b></span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200">
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>Visibility: <b>3.4 km</b></span>
              </div>
            </div>

            {/* Inundation Warning Alert Banner */}
            {weather.current.is_flood_risk && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Waterlogging Risk: Coastal precipitation exceeds 15mm/hr. Drive elevated routes.</span>
              </div>
            )}

            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
              <span>{weather.current.data_source}</span>
              <span>Observed: {new Date(weather.current.fetched_at).toLocaleTimeString()}</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Official Alerts Card */}
      <div className="rounded-2xl p-4 border border-amber-200 bg-white shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold tracking-wider text-slate-900 uppercase">
              {t('official_bulletins')}
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-semibold">
            {alerts.length} ACTIVE
          </span>
        </div>

        <div className="mt-3 space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
          {alerts.length === 0 ? (
            <div className="flex items-center gap-2 py-4 text-xs text-slate-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{t('no_active_alerts')}</span>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 hover:border-amber-300 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    {alert.severity}
                  </span>
                  <span className="text-[10px] text-slate-500">{alert.source}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">
                  {language === 'ta' && alert.headline_ta ? alert.headline_ta : alert.headline}
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  {language === 'ta' && alert.description_ta ? alert.description_ta : alert.description}
                </p>
                {alert.instruction && (
                  <div className="mt-2 p-2 rounded-lg bg-white border border-amber-200 text-[10px] text-amber-800">
                    <b>Instruction:</b> {language === 'ta' && alert.instruction_ta ? alert.instruction_ta : alert.instruction}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
