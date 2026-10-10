import React, { useState, useMemo } from 'react';
import {
  Navigation,
  ShieldCheck,
  Clock,
  MapPin,
  ChevronRight,
  AlertTriangle,
  Car,
  Compass,
  ArrowRight,
  Mountain,
  Search,
  ShieldAlert,
  Info,
  Droplets,
  Wind,
  Sun,
  CloudRain,
  Eye,
  RotateCcw,
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
  onStart3DNav?: () => void;
  is3DNavigating?: boolean;
}

export const RoutePlanner: React.FC<RoutePlannerProps> = ({
  onAssess,
  assessment,
  isLoading,
  selectedRouteIndex,
  onSelectRoute,
  currentOrigin,
  currentDestination,
  onStart3DNav,
  is3DNavigating = false,
}) => {
  const { language } = useI18n();

  // Selected Location IDs
  const [origId, setOrigId] = useState<string>('mevalurkuppam');
  const [destId, setDestId] = useState<string>('chennai-central');

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
    () => TAMIL_NADU_LOCATIONS.find((l) => l.id === destId) || TAMIL_NADU_LOCATIONS[1],
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
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-5 border border-white/90 shadow-md shadow-slate-200/50 space-y-5 text-slate-900 font-sans">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 shadow-2xs">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-black tracking-tight">
              Route & Weather
            </h3>
          </div>
        </div>
      </div>

      {/* ── 3D ROADWAY NAVIGATION BUTTON (AT THE TOP) ── */}
      <button
        onClick={onStart3DNav}
        className="w-full py-3 px-4 rounded-2xl bg-black hover:bg-slate-800 text-white font-black text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer border border-black"
      >
        <Compass className="w-4 h-4 text-blue-300 animate-spin-slow" />
        <span>Start 3D Navigation</span>
        <ArrowRight className="w-4 h-4 text-white" />
      </button>

      {/* ── GOOGLE MAPS STYLE ORIGIN & DESTINATION SELECTORS ── */}
      <div className="space-y-2.5 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/70">
        {/* From Address (Origin) */}
        <div className="relative">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
            <span className="flex items-center gap-1.5 text-blue-950">
              <span className="w-2 h-2 rounded-full bg-blue-700 inline-block" />
              <span>From</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {selectedOrig.elev}m elevation
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowOrigPicker(!showOrigPicker);
              setShowDestPicker(false);
            }}
            className="w-full text-left px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-700 text-xs font-semibold text-slate-900 flex items-center justify-between transition shadow-2xs cursor-pointer"
          >
            <div>
              <div className="font-bold text-black">{selectedOrig.name}</div>
              <div className="text-[10px] text-slate-500 font-normal">
                {selectedOrig.district}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Autocomplete Popup */}
          {showOrigPicker && (
            <div className="absolute top-16 left-0 right-0 z-40 rounded-2xl bg-white border border-slate-300 shadow-xl p-2 space-y-1 max-h-56 overflow-y-auto">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search starting location..."
                  value={origSearch}
                  onChange={(e) => setOrigSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredOrigs.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      setOrigId(loc.id);
                      setShowOrigPicker(false);
                      setOrigSearch('');
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer ${
                      origId === loc.id
                        ? 'bg-blue-50 text-blue-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{loc.name}</div>
                      <div className="text-[10px] text-slate-500">{loc.district}</div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-700">{loc.temp}°C</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Swap Button (⇅) */}
        <div className="flex justify-center -my-1">
          <button
            type="button"
            onClick={handleSwap}
            className="p-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-300 text-blue-900 transition shadow-2xs cursor-pointer"
            title="Swap Origin and Destination"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* To Address (Destination) */}
        <div className="relative">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
            <span className="flex items-center gap-1.5 text-blue-950">
              <span className="w-2 h-2 rounded-full bg-black inline-block" />
              <span>To</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {selectedDest.elev}m elevation
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowDestPicker(!showDestPicker);
              setShowOrigPicker(false);
            }}
            className="w-full text-left px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-700 text-xs font-semibold text-slate-900 flex items-center justify-between transition shadow-2xs cursor-pointer"
          >
            <div>
              <div className="font-bold text-black">{selectedDest.name}</div>
              <div className="text-[10px] text-slate-500 font-normal">
                {selectedDest.district}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Autocomplete Popup */}
          {showDestPicker && (
            <div className="absolute top-16 left-0 right-0 z-40 rounded-2xl bg-white border border-slate-300 shadow-xl p-2 space-y-1 max-h-56 overflow-y-auto">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search destination location..."
                  value={destSearch}
                  onChange={(e) => setDestSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredDests.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      setDestId(loc.id);
                      setShowDestPicker(false);
                      setDestSearch('');
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer ${
                      destId === loc.id
                        ? 'bg-blue-50 text-blue-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{loc.name}</div>
                      <div className="text-[10px] text-slate-500">{loc.district}</div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-700">{loc.temp}°C</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Button: Get Directions & Roadways */}
        <button
          onClick={handleEvaluate}
          disabled={isLoading}
          className="w-full py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-2 mt-2"
        >
          {isLoading ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Analyzing Route...</span>
            </span>
          ) : (
            <>
              <Car className="w-4 h-4 text-blue-200" />
              <span>Get Directions</span>
            </>
          )}
        </button>
      </div>

      {/* ── WEATHER AT BOTH ORIGIN & DESTINATION ── */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
          Weather
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Origin Weather */}
          <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">
              Origin
            </span>
            <div className="text-sm font-black text-black">{selectedOrig.temp}°C</div>
            <div className="text-[11px] font-semibold text-blue-950">Partly Cloudy</div>
            <div className="text-[10px] text-slate-600 mt-1 flex items-center gap-1">
              <Droplets className="w-3 h-3 text-blue-600" />
              <span>1% Rain • {selectedOrig.windKmh} km/h</span>
            </div>
          </div>

          {/* Destination Weather */}
          <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-200/80">
            <span className="text-[10px] font-bold uppercase text-blue-800 block mb-0.5">
              Destination
            </span>
            <div className="text-sm font-black text-black">{selectedDest.temp}°C</div>
            <div className="text-[11px] font-semibold text-blue-950">Hot & Humid</div>
            <div className="text-[10px] text-slate-600 mt-1 flex items-center gap-1">
              <CloudRain className="w-3 h-3 text-blue-600" />
              <span>25% Rain</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── IN-BETWEEN NATURAL CALAMITIES & INCIDENT HOTSPOTS ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Hazards
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
            3 Active
          </span>
        </div>

        <div className="space-y-1.5 text-xs">
          {/* Rain Blockage Point Alert */}
          <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <CloudRain className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Km 7.8: Underpass Submerged (Rain)</span>
            </div>
            <p className="text-[11px] text-amber-900 leading-tight">
              Waterlogged underpass. Route automatically diverts via Poonamallee bypass.
            </p>
          </div>

          {/* Tree Fall */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-black">Km 4.2: Tree Fall on NH48</span>
              <p className="text-[11px] text-slate-600 leading-tight mt-0.5">
                Shoulder cleared. Single lane open.
              </p>
            </div>
          </div>

          {/* Traffic Congestion */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 flex items-start gap-2">
            <Car className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-black">Km 13.5: Junction Traffic</span>
              <p className="text-[11px] text-slate-600 leading-tight mt-0.5">
                Delay +6 mins near Ring Road exit.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── GOOGLE MAPS STYLE TRAFFIC COLOR BREAKDOWN ── */}
      <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
          Traffic
        </span>
        <div className="flex items-center gap-1.5 h-2 rounded-full overflow-hidden bg-slate-200">
          <div className="h-full bg-emerald-500 rounded-l-full" style={{ width: '75%' }} title="Clear traffic (14.2 km)" />
          <div className="h-full bg-amber-500" style={{ width: '18%' }} title="Moderate delay (3.1 km)" />
          <div className="h-full bg-rose-500 rounded-r-full" style={{ width: '7%' }} title="Heavy congestion (1.1 km)" />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-600 pt-0.5">
          <span className="text-emerald-700 font-bold">14.2 km Clear</span>
          <span className="text-amber-700 font-bold">3.1 km Moderate</span>
          <span className="text-rose-700 font-bold">1.1 km Slow</span>
        </div>
      </div>



      {/* ── CANDIDATE ROADWAY OPTIONS ── */}
      {assessment && currentRoute && (
        <div className="space-y-3 pt-3 border-t border-slate-200/80">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Routes ({assessment.candidate_routes.length})
          </div>

          <div className="space-y-2">
            {assessment.candidate_routes.map((r) => {
              const isSelected = r.route_index === selectedRouteIndex;
              const isRec = r.route_index === assessment.recommended_route_index;

              return (
                <div
                  key={r.route_index}
                  onClick={() => onSelectRoute(r.route_index)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-400 text-blue-950 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isRec ? (
                        <ShieldCheck className="w-4 h-4 text-blue-700" />
                      ) : (
                        <Car className="w-4 h-4 text-slate-500" />
                      )}
                      <span className="font-bold text-xs text-black">
                        {r.name}
                      </span>
                    </div>
                    {isRec && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-900 text-white">
                        RECOMMENDED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs mt-1.5">
                    <span className="font-black text-black">
                      {Math.round(r.duration_seconds / 60)} min
                    </span>
                    <span className="text-slate-500 font-medium">
                      {(r.distance_meters / 1000).toFixed(1)} km
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="font-semibold text-blue-950">
                      {r.risk_category} RISK
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
