import React, { useState, useMemo } from 'react';
import {
  Navigation,
  ShieldCheck,
  Clock,
  MapPin,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Car,
  Compass,
  ArrowRight,
  Mountain,
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { RouteAssessmentResponse, CandidateRoute } from '../types';
import { useI18n } from '../context/I18nContext';
import { TAMIL_NADU_LOCATIONS, TamilNaduLocation } from '../data/tamilNaduLocations';

interface RoutePlannerProps {
  onAssess: (origLat: number, origLng: number, destLat: number, destLng: number) => Promise<void>;
  assessment: RouteAssessmentResponse | null;
  isLoading: boolean;
  selectedRouteIndex: number;
  onSelectRoute: (index: number) => void;
  currentOrigin?: { lat: number; lng: number };
  currentDestination?: { lat: number; lng: number };
}

export const RoutePlanner: React.FC<RoutePlannerProps> = ({
  onAssess,
  assessment,
  isLoading,
  selectedRouteIndex,
  onSelectRoute,
  currentOrigin,
  currentDestination,
}) => {
  const { language, t } = useI18n();

  // Selected Location IDs
  const [origId, setOrigId] = useState<string>('chennai-central');
  const [destId, setDestId] = useState<string>('velachery');

  // Search filter terms for dropdowns
  const [origSearch, setOrigSearch] = useState<string>('');
  const [destSearch, setDestSearch] = useState<string>('');
  const [showOrigPicker, setShowOrigPicker] = useState<boolean>(false);
  const [showDestPicker, setShowDestPicker] = useState<boolean>(false);

  const selectedOrig = useMemo(
    () => TAMIL_NADU_LOCATIONS.find((l) => l.id === origId) || TAMIL_NADU_LOCATIONS[0],
    [origId]
  );
  const selectedDest = useMemo(
    () => TAMIL_NADU_LOCATIONS.find((l) => l.id === destId) || TAMIL_NADU_LOCATIONS[3],
    [destId]
  );

  const filteredOrigs = useMemo(() => {
    if (!origSearch.trim()) return TAMIL_NADU_LOCATIONS;
    const q = origSearch.toLowerCase();
    return TAMIL_NADU_LOCATIONS.filter(
      (l) => l.name.toLowerCase().includes(q) || l.district.toLowerCase().includes(q)
    );
  }, [origSearch]);

  const filteredDests = useMemo(() => {
    if (!destSearch.trim()) return TAMIL_NADU_LOCATIONS;
    const q = destSearch.toLowerCase();
    return TAMIL_NADU_LOCATIONS.filter(
      (l) => l.name.toLowerCase().includes(q) || l.district.toLowerCase().includes(q)
    );
  }, [destSearch]);

  const handleEvaluate = () => {
    onAssess(selectedOrig.lat, selectedOrig.lng, selectedDest.lat, selectedDest.lng);
  };

  const handleSwap = () => {
    const temp = origId;
    setOrigId(destId);
    setDestId(temp);
  };

  const currentRoute: CandidateRoute | undefined =
    assessment?.candidate_routes.find((r) => r.route_index === selectedRouteIndex) ||
    assessment?.candidate_routes[0];

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-4 text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Safe Route & Highway Navigator
            </h3>
            <p className="text-[11px] text-slate-500">
              Live weather, terrain elevation & road safety across Tamil Nadu & India
            </p>
          </div>
        </div>
      </div>

      {/* Origin & Destination Selectors */}
      <div className="space-y-3">
        {/* Origin Selector */}
        <div className="relative">
          <label className="text-xs font-semibold text-slate-700 flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Starting Point</span>
            </span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Mountain className="w-3 h-3 text-slate-400" />
              <span>{selectedOrig.elev}m MSL ground</span>
            </span>
          </label>

          <button
            type="button"
            onClick={() => {
              setShowOrigPicker(!showOrigPicker);
              setShowDestPicker(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-xs font-medium text-slate-800 flex items-center justify-between transition-all cursor-pointer"
          >
            <div>
              <div className="font-semibold text-slate-900">{selectedOrig.name}</div>
              <div className="text-[10px] text-slate-500">
                {selectedOrig.district} • {selectedOrig.temp}°C • {selectedOrig.windKmh} km/h wind
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Autocomplete Popup */}
          {showOrigPicker && (
            <div className="absolute top-16 left-0 right-0 z-30 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 space-y-1.5 max-h-60 overflow-y-auto">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter district, temple, or city..."
                  value={origSearch}
                  onChange={(e) => setOrigSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                {filteredOrigs.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      setOrigId(loc.id);
                      setShowOrigPicker(false);
                      setOrigSearch('');
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      origId === loc.id
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-900">{loc.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {loc.district} • {loc.elev}m MSL
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">{loc.temp}°C</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-1">
          <button
            type="button"
            onClick={handleSwap}
            className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-800 transition-all cursor-pointer shadow-2xs"
            title="Swap Origin and Destination"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Destination Selector */}
        <div className="relative">
          <label className="text-xs font-semibold text-slate-700 flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              <span>Destination</span>
            </span>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Mountain className="w-3 h-3 text-slate-400" />
              <span>{selectedDest.elev}m MSL ground</span>
            </span>
          </label>

          <button
            type="button"
            onClick={() => {
              setShowDestPicker(!showDestPicker);
              setShowOrigPicker(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-xs font-medium text-slate-800 flex items-center justify-between transition-all cursor-pointer"
          >
            <div>
              <div className="font-semibold text-slate-900">{selectedDest.name}</div>
              <div className="text-[10px] text-slate-500">
                {selectedDest.district} • {selectedDest.temp}°C • {selectedDest.windKmh} km/h wind
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Autocomplete Popup */}
          {showDestPicker && (
            <div className="absolute top-16 left-0 right-0 z-30 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 space-y-1.5 max-h-60 overflow-y-auto">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter destination..."
                  value={destSearch}
                  onChange={(e) => setDestSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                {filteredDests.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      setDestId(loc.id);
                      setShowDestPicker(false);
                      setDestSearch('');
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      destId === loc.id
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-900">{loc.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {loc.district} • {loc.elev}m MSL
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">{loc.temp}°C</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Calculate Route Button */}
        <button
          onClick={handleEvaluate}
          disabled={isLoading}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Evaluating Weather & Road Risk...</span>
            </div>
          ) : (
            <>
              <Car className="w-4 h-4" />
              <span>Calculate Safe Route Corridors</span>
            </>
          )}
        </button>
      </div>

      {/* Evaluated Route Options */}
      {assessment && currentRoute && (
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Available Route Options ({assessment.candidate_routes.length})</span>
            {currentRoute.data_confidence && (
              <span className="text-[10px] font-medium text-slate-400">
                Confidence: <b>{currentRoute.data_confidence}</b>
              </span>
            )}
          </div>

          {/* Route Options Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {assessment.candidate_routes.map((r) => {
              const isSelected = r.route_index === selectedRouteIndex;
              const isRec = r.route_index === assessment.recommended_route_index;

              return (
                <button
                  key={r.route_index}
                  onClick={() => onSelectRoute(r.route_index)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium shrink-0 transition-all border text-left cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {isRec ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <Car className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>Option {r.route_index + 1}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {(r.distance_meters / 1000).toFixed(1)} km • {Math.round(r.duration_seconds / 60)} min
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Route Summary Card */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              currentRoute.has_critical_closure
                ? 'bg-rose-50/70 border-rose-300'
                : currentRoute.is_recommended
                ? 'bg-blue-50/60 border-blue-200'
                : 'bg-slate-50/60 border-slate-200'
            }`}
          >
            {/* Title & Safety Badge */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{currentRoute.name}</h4>
                  {currentRoute.is_recommended && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-semibold">
                      RECOMMENDED
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600 mt-1">{currentRoute.summary}</div>
              </div>

              {/* Safety Badge */}
              <div
                className={`text-center px-2.5 py-1 rounded-xl border text-xs font-bold ${
                  currentRoute.risk_category === 'LOW'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : currentRoute.risk_category === 'CRITICAL'
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : currentRoute.risk_category === 'HIGH'
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <div>{currentRoute.risk_category} RISK</div>
                <div className="text-[10px] opacity-75">{currentRoute.risk_score}/100</div>
              </div>
            </div>

            {/* Critical Restriction Warning Banner */}
            {currentRoute.has_critical_closure && (
              <div className="my-2.5 p-2.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">CRITICAL RESTRICTION: Road Closure Confirmed</div>
                  <div className="text-[11px] text-rose-800 mt-0.5">
                    Severe obstruction or confirmed physical road blockage detected on corridor. Strictly prevented from being recommended as a safe path.
                  </div>
                </div>
              </div>
            )}

            {/* Travel Distance & ETA */}
            <div className="grid grid-cols-2 gap-2 my-3 py-2.5 border-y border-slate-200/80 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Navigation className="w-4 h-4 text-blue-600" />
                <span className="font-semibold">
                  {(currentRoute.distance_meters / 1000).toFixed(1)} km
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="font-semibold">
                  ~{Math.round(currentRoute.duration_seconds / 60)} minutes
                </span>
              </div>
            </div>

            {/* Road & Weather Advisory */}
            <div className="p-3 rounded-xl bg-white border border-slate-200/90 text-xs text-slate-700 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Road Condition & Safety Summary</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                {language === 'ta' ? currentRoute.explanation_ta : currentRoute.explanation_en}
              </p>
            </div>

            {/* 1–6 Hour Predictive Forecast Trend */}
            {currentRoute.forecast_trend && (
              <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-900 font-bold">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    <span>Predictive Forecast Trend (Next 1–6h)</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      currentRoute.forecast_trend.trend_6h === 'RISING'
                        ? 'bg-amber-100 text-amber-800'
                        : currentRoute.forecast_trend.trend_6h === 'RECEDING'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    6h Trend: {currentRoute.forecast_trend.trend_6h}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {language === 'ta'
                    ? currentRoute.forecast_trend.summary_ta
                    : currentRoute.forecast_trend.summary_en}
                </p>
              </div>
            )}

            {/* Vulnerable Road Segments (Elevation & Coastal Basin) */}
            {currentRoute.vulnerable_segments && currentRoute.vulnerable_segments.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Mountain className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Vulnerable Terrain Segments ({currentRoute.vulnerable_segments.length}):</span>
                </div>
                <div className="space-y-1.5">
                  {currentRoute.vulnerable_segments.map((seg, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-0.5"
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-900">
                        <span>{seg.name}</span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                          {seg.elevation_m}m MSL
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {language === 'ta' && seg.risk_description_ta
                          ? seg.risk_description_ta
                          : seg.risk_description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Real Warnings / Road Obstructions */}
            {currentRoute.contributing_hazards.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-[11px] font-bold text-slate-700">
                  Noted Road Hazards ({currentRoute.contributing_hazards.length}):
                </div>
                <div className="space-y-1.5">
                  {currentRoute.contributing_hazards.map((h, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs flex items-start gap-2 text-slate-700"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-900">
                          {h.hazard_type.replace('_', ' ')}
                        </div>
                        <div className="text-[11px] text-slate-500">{h.description}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Buffer proximity: {h.proximity_meters}m • Status: {h.verification_status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Data & Uncertainty Caution */}
            {currentRoute.uncertainty_note && (
              <div className="mt-3 p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>{currentRoute.uncertainty_note}</span>
              </div>
            )}

            {/* Data Provenance Footer */}
            {assessment.data_provenance && (
              <div className="mt-3 pt-2.5 border-t border-slate-200/80 text-[10px] text-slate-400 space-y-0.5">
                <div className="font-semibold text-slate-500">Data Provenance:</div>
                <div>Routing: {assessment.data_provenance.routing_source}</div>
                <div>Weather: {assessment.data_provenance.weather_source}</div>
                <div>Alerts: {assessment.data_provenance.alerts_source}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
