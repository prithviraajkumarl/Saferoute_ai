import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HazardReport } from '../types';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ShieldAlert,
  Radio,
} from 'lucide-react';

interface IncidentsPageProps {
  onOpenReportHazard: () => void;
  isSimulated?: boolean;
}

export const IncidentsPage: React.FC<IncidentsPageProps> = ({
  onOpenReportHazard,
  isSimulated = false,
}) => {
  const { language } = useI18n();
  const { role } = useAuth();
  const { theme } = useTheme();

  const [hazards, setHazards] = useState<HazardReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedHazard, setSelectedHazard] = useState<HazardReport | null>(null);

  const fetchHazards = async () => {
    setIsLoading(true);
    try {
      const data = await api.getHazards(undefined, isSimulated);
      const items = data?.items || [];
      setHazards(items);
      if (items.length > 0 && !selectedHazard) {
        setSelectedHazard(items[0]);
      }
    } catch (e) {
      console.error('Failed to fetch hazards:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHazards();
  }, [isSimulated]);

  // Moderation action for authorized roles
  const handleModerate = async (hazardId: string, newStatus: any) => {
    if (role === 'tourist') {
      alert('Moderation action restricted to authorized First Responders and Dispatchers.');
      return;
    }
    // Update locally for instant responsiveness
    setHazards((prev) =>
      prev.map((h) => (h.id === hazardId ? { ...h, status: newStatus } : h))
    );
    if (selectedHazard && selectedHazard.id === hazardId) {
      setSelectedHazard({ ...selectedHazard, status: newStatus });
    }
  };

  const filteredHazards = hazards.filter((h) => {
    const desc = h.description || '';
    const matchesSearch =
      desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.hazard_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.source && h.source.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSeverity = severityFilter === 'ALL' || h.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || h.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const cardBg = theme === 'dark'
    ? 'bg-slate-900/80 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-800 shadow-sm';

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header & Action Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight">
            Hazard & Incident Intelligence Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time verified flood hazards, subway inundations, fallen trees, and roadway obstruction telemetry
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchHazards}
            className={`p-2.5 rounded-2xl border transition cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-600'
            }`}
            title="Refresh incident list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenReportHazard}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Report New Hazard</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-3 ${cardBg}`}>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by description, type, or source..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none border transition ${
              theme === 'dark'
                ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold outline-none cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium / Moderate</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold outline-none cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING">Pending Triage</option>
              <option value="RESOLVED">Resolved / Cleared</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Left Table / Cards & Right Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Hazards List */}
        <div className="lg:col-span-2 space-y-3">
          {filteredHazards.length === 0 ? (
            <div className={`p-12 text-center rounded-3xl border ${cardBg}`}>
              <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
              <div className="font-bold text-sm text-slate-300">No hazards matching criteria</div>
              <p className="text-xs text-slate-500 mt-1">Try relaxing filters or search terms.</p>
            </div>
          ) : (
            filteredHazards.map((h) => {
              const isSelected = selectedHazard?.id === h.id;
              return (
                <div
                  key={h.id}
                  onClick={() => setSelectedHazard(h)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? theme === 'dark'
                        ? 'bg-blue-900/20 border-blue-500/50 shadow-md'
                        : 'bg-blue-50 border-blue-300 shadow-xs'
                      : cardBg
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          h.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : h.severity === 'HIGH'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {h.severity}
                        </span>
                        <span className="font-bold text-xs uppercase tracking-tight text-blue-400">
                          {h.hazard_type.replace('_', ' ')}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                          h.status === 'VERIFIED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold'
                            : h.status === 'RESOLVED'
                            ? 'bg-slate-700/50 text-slate-300'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {h.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                        {h.description}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}</span>
                        </span>
                        <span>•</span>
                        <span>Source: <b>{h.source || 'CITIZEN'}</b></span>
                        <span>•</span>
                        <span>{new Date(h.source_timestamp).toLocaleDateString()} {new Date(h.source_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Col: Selected Hazard Inspector & Verification Actions */}
        <div className="space-y-4">
          {selectedHazard ? (
            <div className={`p-5 rounded-3xl border space-y-4 sticky top-6 ${cardBg}`}>
              <div className="border-b pb-3 border-slate-700/50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    ID: {selectedHazard.id}
                  </span>
                  <h3 className="font-bold text-sm text-white uppercase mt-0.5">
                    {selectedHazard.hazard_type.replace('_', ' ')}
                  </h3>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  selectedHazard.severity === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {selectedHazard.severity}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Description</div>
                  <p className="mt-1 leading-relaxed text-slate-200">
                    {selectedHazard.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                  <div>
                    <div className="text-[10px] text-slate-400">Latitude</div>
                    <div className="font-mono font-bold text-blue-400">{selectedHazard.latitude.toFixed(5)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Longitude</div>
                    <div className="font-mono font-bold text-blue-400">{selectedHazard.longitude.toFixed(5)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Source</div>
                    <div className="font-bold">{selectedHazard.source || 'Citizen Report'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Verification</div>
                    <div className="font-bold text-emerald-400">{selectedHazard.status}</div>
                  </div>
                </div>

                {/* Moderation Actions (Protected by Role) */}
                <div className="pt-2 border-t border-slate-700/50 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Authorized Responder Actions
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleModerate(selectedHazard.id, 'VERIFIED')}
                      disabled={role === 'tourist'}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        role === 'tourist'
                          ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-400'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Verified</span>
                    </button>

                    <button
                      onClick={() => handleModerate(selectedHazard.id, 'RESOLVED')}
                      disabled={role === 'tourist'}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        role === 'tourist'
                          ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-400'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                      }`}
                    >
                      <span>Mark Cleared</span>
                    </button>
                  </div>

                  {role === 'tourist' && (
                    <p className="text-[10px] text-slate-500 italic text-center">
                      Switch persona to First Responder in top header to perform verification actions.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className={`p-8 text-center rounded-3xl border text-xs text-slate-400 ${cardBg}`}>
              Select a hazard from the list to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
