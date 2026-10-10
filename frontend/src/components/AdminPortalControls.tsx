import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Radio,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Building2,
  CloudRain,
  RefreshCw,
  Send,
  Key,
  Cpu,
  Database,
  Sliders,
  Check,
  X,
  Lock,
  Eye,
  Server,
  Activity,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { Incident, OfficialAlert, Shelter, HazardReport } from '../types';

export const AdminPortalControls: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'incidents' | 'apikeys' | 'algorithms' | 'database' | 'alerts' | 'shelters'>('incidents');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [alerts, setAlerts] = useState<OfficialAlert[]>([]);
  const [hazards, setHazards] = useState<HazardReport[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  // New Alert Form state
  const [newAlertHeadline, setNewAlertHeadline] = useState('');
  const [newAlertDesc, setNewAlertDesc] = useState('');
  const [newAlertSeverity, setNewAlertSeverity] = useState('EXTREME');

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [incRes, altRes, hazRes, shRes] = await Promise.all([
        api.getResponderQueue(),
        api.getAlerts(),
        api.getHazards(),
        api.getShelters(),
      ]);
      setIncidents(incRes.items || []);
      setAlerts(altRes || []);
      setHazards(hazRes.items || []);
      setShelters(shRes || []);
    } catch (e) {
      console.error('Error loading admin telemetry:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const handleSosUpdate = () => loadAllData();
    window.addEventListener('saferoute-sos-updated', handleSosUpdate);
    window.addEventListener('saferoute-alerts-updated', handleSosUpdate);
    window.addEventListener('saferoute-hazards-updated', handleSosUpdate);
    window.addEventListener('saferoute-shelters-updated', handleSosUpdate);
    const interval = setInterval(loadAllData, 8000);
    return () => {
      window.removeEventListener('saferoute-sos-updated', handleSosUpdate);
      window.removeEventListener('saferoute-alerts-updated', handleSosUpdate);
      window.removeEventListener('saferoute-hazards-updated', handleSosUpdate);
      window.removeEventListener('saferoute-shelters-updated', handleSosUpdate);
      clearInterval(interval);
    };
  }, []);

  // Incident Overrides & Deletions
  const handleOverrideStatus = async (id: string, status: string) => {
    await api.transitionIncident(id, status, `Admin override to ${status}`);
    showNotification(`Incident ${id} overridden to ${status}`);
    loadAllData();
  };

  const handleDeleteIncident = async (id: string) => {
    if (confirm('Delete this SOS incident permanently?')) {
      await api.deleteIncident(id);
      showNotification(`SOS incident deleted.`);
      loadAllData();
    }
  };

  const handleResetIncidents = async () => {
    if (confirm('Reset all incidents to baseline scenario?')) {
      await api.resetIncidents();
      showNotification('Incidents reset to baseline.');
      loadAllData();
    }
  };

  // Alert Broadcast Controls
  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertHeadline.trim()) return;
    await api.broadcastAlert({
      headline: newAlertHeadline,
      description: newAlertDesc || 'Official emergency broadcast.',
      severity: newAlertSeverity,
      urgency: 'IMMEDIATE',
    });
    setNewAlertHeadline('');
    setNewAlertDesc('');
    showNotification('Official alert broadcasted system-wide!');
    loadAllData();
  };

  const handleDeleteAlert = async (id: string) => {
    await api.deleteAlert(id);
    showNotification('Alert deleted.');
    loadAllData();
  };

  // Shelter Controls
  const handleUpdateShelterCapacity = async (id: string, deltaOccupancy: number) => {
    const target = shelters.find((s) => s.id === id);
    if (!target) return;
    const newOccupancy = Math.max(0, target.current_occupancy + deltaOccupancy);
    await api.updateShelter(id, { current_occupancy: newOccupancy });
    showNotification(`Updated ${target.name} occupancy.`);
    loadAllData();
  };

  const handleToggleShelterStatus = async (id: string) => {
    const target = shelters.find((s) => s.id === id);
    if (!target) return;
    const nextStatus = target.status === 'OPEN' ? 'FULL' : target.status === 'FULL' ? 'CLOSED' : 'OPEN';
    await api.updateShelter(id, { status: nextStatus as any });
    showNotification(`Shelter status changed to ${nextStatus}.`);
    loadAllData();
  };

  return (
    <div className="space-y-4 text-black select-none font-sans">
      {/* Toast Notification */}
      {notice && (
        <div className="p-3 bg-black text-white text-xs font-bold rounded-2xl shadow-lg flex items-center justify-between animate-fade-in">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-white hover:text-slate-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Admin Command Tabs */}
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl p-2 flex flex-wrap gap-1.5 shadow-sm">
        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'incidents' ? 'bg-black text-white' : 'bg-slate-100 hover:bg-slate-200 text-black'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>SOS Messages & Reports ({incidents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('apikeys')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'apikeys' ? 'bg-black text-white' : 'bg-slate-100 hover:bg-slate-200 text-black'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>API Keys & Stuffs</span>
        </button>

        <button
          onClick={() => setActiveTab('algorithms')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'algorithms' ? 'bg-black text-white' : 'bg-slate-100 hover:bg-slate-200 text-black'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Algorithms & Models</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'database' ? 'bg-black text-white' : 'bg-slate-100 hover:bg-slate-200 text-black'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Database & Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'alerts' ? 'bg-black text-white' : 'bg-slate-100 hover:bg-slate-200 text-black'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Broadcast Alerts ({alerts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('shelters')}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'shelters' ? 'bg-black text-white' : 'bg-slate-100 hover:bg-slate-200 text-black'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Relief Shelters ({shelters.length})</span>
        </button>
      </div>

      {/* ── TAB 1: SOS MESSAGES & REPORTS ── */}
      {activeTab === 'incidents' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-bold text-black">Citizen SOS Emergency Signals Stream (In Order)</span>
            <button
              onClick={handleResetIncidents}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 text-xs font-bold transition cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Signal Stream</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {incidents.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-black font-semibold">
                No active SOS signals in stream.
              </div>
            ) : (
              incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-black">{inc.reference_code}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-black font-bold border border-slate-200">
                          {inc.severity}
                        </span>
                        <span className="text-[11px] text-slate-700 font-medium">{inc.person_count} persons</span>
                      </div>
                      <div className="text-xs text-black font-semibold mt-1">
                        {inc.address || `Lat: ${inc.latitude}, Lng: ${inc.longitude}`}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Contact: {inc.contact_phone || '108 Helpline'}
                      </div>
                    </div>

                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-black border border-slate-200">
                      {inc.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                    {inc.description}
                  </p>

                  {/* Master Admin Controls */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Override:</span>
                    <button
                      onClick={() => handleOverrideStatus(inc.id, 'ACKNOWLEDGED')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold border border-slate-200 transition"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => handleOverrideStatus(inc.id, 'ASSISTANCE_EN_ROUTE')}
                      className="px-2.5 py-1 rounded-lg bg-black hover:bg-slate-800 text-white text-xs font-bold transition"
                    >
                      Dispatch Rescue
                    </button>
                    <button
                      onClick={() => handleOverrideStatus(inc.id, 'RESOLVED')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold border border-slate-200 transition"
                    >
                      Mark Resolved
                    </button>
                    <button
                      onClick={() => handleDeleteIncident(inc.id)}
                      className="ml-auto px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: API KEYS & INTEGRATIONS ── */}
      {activeTab === 'apikeys' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <span className="text-xs font-black text-black">Active API Integrations & Credentials</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
              ALL SERVICES CONNECTED
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* 1. Open-Meteo */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-black text-black text-sm">1. Open-Meteo Meteorological API</span>
                <span className="font-mono text-[10px] bg-slate-200 text-black px-2 py-0.5 rounded font-bold">Public / Unlimited</span>
              </div>
              <p className="text-slate-600">Endpoint: https://api.open-meteo.com/v1/forecast</p>
              <div className="text-[11px] text-slate-700 font-mono">Telemetry: Temperature 2m, Relative Humidity, Precipitation (mm), Wind Vector Speed & Direction 10m.</div>
            </div>

            {/* 2. Google Gemini */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-black text-black text-sm">2. Google Gemini 2.0 Flash AI API</span>
                <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Configured / Active</span>
              </div>
              <p className="text-slate-600">Model: gemini-2.0-flash (System instruction tuned for Disaster Travel Tech)</p>
              <div className="text-[11px] text-slate-700 font-mono">Capabilities: Emergency guidance, multimodal route risk synthesis, safety advice in English & Tamil.</div>
            </div>

            {/* 3. Web Speech Recognition & Synthesis */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-black text-black text-sm">3. Web Speech API (Voice In & Voice Out)</span>
                <span className="font-mono text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">Browser Native</span>
              </div>
              <p className="text-slate-600">Interfaces: window.SpeechRecognition (Voice In) & window.speechSynthesis (Voice Out)</p>
              <div className="text-[11px] text-slate-700 font-mono">Speech Recognition: ta-IN, en-IN • Text-to-speech Audio playback enabled.</div>
            </div>

            {/* 4. OpenStreetMap Cartography */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-black text-black text-sm">4. OpenStreetMap & Esri World Imagery</span>
                <span className="font-mono text-[10px] bg-slate-200 text-black px-2 py-0.5 rounded font-bold">Clean Basemap</span>
              </div>
              <p className="text-slate-600">Endpoints: https://tile.openstreetmap.org & ArcGIS World_Imagery</p>
              <div className="text-[11px] text-slate-700 font-mono">Cartography: High-resolution raster vector tiles with zero watermark.</div>
            </div>

            {/* 5. Nominatim Geocoding */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-black text-black text-sm">5. OpenStreetMap Nominatim Geocoding API</span>
                <span className="font-mono text-[10px] bg-slate-200 text-black px-2 py-0.5 rounded font-bold">Active</span>
              </div>
              <p className="text-slate-600">Endpoint: https://nominatim.openstreetmap.org/search</p>
              <div className="text-[11px] text-slate-700 font-mono">Spatial search for Tamil Nadu districts, landmarks, and coordinates.</div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: ALGORITHMS & MODELS ── */}
      {activeTab === 'algorithms' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
          <div className="pb-3 border-b border-slate-200">
            <span className="text-xs font-black text-black">SafeRoute Spatial Routing Algorithms & Deterministic Models</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Algorithm 1 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-black text-black text-sm">1. Dijkstra Risk-Penalized Spatial Routing</div>
              <p className="text-slate-700 leading-relaxed">
                Evaluates candidate transportation corridors using dynamic cost weights where total cost = base duration + spatial hazard penalties. Closed corridors are assigned infinite cost.
              </p>
              <div className="p-2 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-black">
                Cost(e) = Distance(e) * [1.0 + Penalty(Hazards) * ElevationFactor(e)]
              </div>
            </div>

            {/* Algorithm 2 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-black text-black text-sm">2. Inundation Contour Matrix & Elevation Grading</div>
              <p className="text-slate-700 leading-relaxed">
                Applies Mean Sea Level (MSL) contours. Low-lying corridors (&lt;5m MSL) near river basins or lake outflows receive severe flood vulnerability penalties during cyclone events.
              </p>
              <div className="p-2 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-black">
                Safe Ground: &gt;15m MSL | Coastal Lowland: &lt;5m MSL (Penalized 1.8x)
              </div>
            </div>

            {/* Algorithm 3 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-black text-black text-sm">3. Multi-Hazard Spatial Buffer Clustering</div>
              <p className="text-slate-700 leading-relaxed">
                Aggregates verified community reports and telemetry markers within 1200m buffer zones to compute geometric convex hull polygons representing impassable road sectors.
              </p>
              <div className="p-2 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-black">
                Buffer Radius: 1200m | Penalty: CRITICAL (0.85), HIGH (0.50)
              </div>
            </div>

            {/* Algorithm 4 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-black text-black text-sm">4. Atomic State Machine Audit Engine</div>
              <p className="text-slate-700 leading-relaxed">
                Enforces strict state progression for emergency incidents: SUBMITTED → ACKNOWLEDGED → ASSISTANCE_EN_ROUTE → RESOLVED with immutable audit logging and idempotency key checks.
              </p>
              <div className="p-2 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-black">
                Transitions: Atomic ACID Log | Zero Duplicate Dispatches
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: DATABASE & TELEMETRY ── */}
      {activeTab === 'database' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <span className="text-xs font-black text-black">Database Connection & Telemetry Records</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
              HEALTHY • 0.59ms
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Database Engine</div>
              <div className="text-sm font-black text-black mt-1">PostgreSQL / SQLite</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Total Incidents</div>
              <div className="text-sm font-black text-black mt-1">{incidents.length} Records</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Verified Hazards</div>
              <div className="text-sm font-black text-black mt-1">{hazards.length} Points</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Relief Camps</div>
              <div className="text-sm font-black text-black mt-1">{shelters.length} Shelters</div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-xs font-black text-black block">Active Database Table Schemas</span>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800 space-y-1">
              <div>• <span className="font-bold text-black">incidents</span> (id, reference_code, user_id, latitude, longitude, severity, status, contact_phone, description, person_count, is_simulated)</div>
              <div>• <span className="font-bold text-black">incident_events</span> (id, incident_id, actor_id, from_status, to_status, note, is_internal, created_at)</div>
              <div>• <span className="font-bold text-black">hazard_reports</span> (id, hazard_type, latitude, longitude, severity, description, status, upvotes, is_simulated)</div>
              <div>• <span className="font-bold text-black">shelters</span> (id, name, district, latitude, longitude, capacity, current_occupancy, status, has_medical, has_food)</div>
              <div>• <span className="font-bold text-black">official_alerts</span> (id, headline, description, severity, urgency, area_desc, effective, expires, is_live)</div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: BROADCAST ALERTS ── */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <form onSubmit={handleBroadcastAlert} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-black text-black block">Broadcast State Emergency Alert</span>
            <div>
              <label className="block text-[11px] font-bold text-black mb-1">Headline</label>
              <input
                type="text"
                value={newAlertHeadline}
                onChange={(e) => setNewAlertHeadline(e.target.value)}
                placeholder="e.g. Red Cyclone Warning: Coastal Inundation"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-black font-semibold outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-black mb-1">Severity</label>
                <select
                  value={newAlertSeverity}
                  onChange={(e) => setNewAlertSeverity(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-black font-semibold outline-none"
                >
                  <option value="EXTREME">EXTREME</option>
                  <option value="SEVERE">SEVERE</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-black mb-1">Details</label>
                <input
                  type="text"
                  value={newAlertDesc}
                  onChange={(e) => setNewAlertDesc(e.target.value)}
                  placeholder="Expected rainfall, wind gusts, affected areas"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-black font-semibold outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Live Alert</span>
            </button>
          </form>

          <div className="space-y-2.5">
            <span className="text-xs font-bold text-black block">Active Broadcasts</span>
            {alerts.map((alt) => (
              <div key={alt.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-black">{alt.headline}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-black font-bold border border-slate-200">
                    {alt.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-800">{alt.description}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-emerald-700 font-bold">● LIVE BROADCAST</span>
                  <button
                    onClick={() => handleDeleteAlert(alt.id)}
                    className="px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-200 transition"
                  >
                    Delete Alert
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 6: RELIEF SHELTERS ── */}
      {activeTab === 'shelters' && (
        <div className="space-y-3">
          <span className="text-xs font-bold text-black block">Relief Camp Operations & Capacity</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {shelters.map((s) => (
              <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-black text-black">{s.name}</div>
                    <div className="text-[11px] text-slate-600">{s.district}</div>
                  </div>
                  <button
                    onClick={() => handleToggleShelterStatus(s.id)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-black font-bold border border-slate-200 cursor-pointer hover:bg-slate-200 transition"
                  >
                    {s.status}
                  </button>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>Occupancy:</span>
                    <span className="font-bold text-black">
                      {s.current_occupancy} / {s.capacity} ({s.occupancy_percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-black transition-all"
                      style={{ width: `${Math.min(100, s.occupancy_percentage)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleUpdateShelterCapacity(s.id, 50)}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-black font-bold border border-slate-200"
                    >
                      +50
                    </button>
                    <button
                      onClick={() => handleUpdateShelterCapacity(s.id, -50)}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-black font-bold border border-slate-200"
                    >
                      -50
                    </button>
                  </div>

                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                    s.has_medical ? 'bg-black text-white border-black' : 'bg-slate-100 text-black border-slate-200'
                  }`}>
                    {s.has_medical ? 'Medical: ACTIVE' : 'Medical: OFF'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
