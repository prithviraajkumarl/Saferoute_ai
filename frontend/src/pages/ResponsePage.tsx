import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { ResponderTriageQueue } from '../components/ResponderTriageQueue';
import {
  Radio,
  ShieldAlert,
  PhoneCall,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Search,
  Lock,
  ArrowRight,
  ShieldCheck,
  Send,
} from 'lucide-react';

interface ResponsePageProps {
  onOpenSosModal: () => void;
  isSimulated?: boolean;
}

export const ResponsePage: React.FC<ResponsePageProps> = ({
  onOpenSosModal,
  isSimulated = false,
}) => {
  const { role } = useAuth();
  const { language } = useI18n();
  const { theme } = useTheme();

  // Citizen SOS Submission State
  const [personName, setPersonName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [description, setDescription] = useState('');
  const [emergencyType, setEmergencyType] = useState('FLOOD_TRAPPED');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedIncidentId, setSubmittedIncidentId] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Quick GPS capture
  const handleCaptureGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5)),
          });
        },
        (err) => {
          // Graceful fallback to Chennai Central
          setGpsCoords({ lat: 13.0827, lng: 80.2707 });
        }
      );
    } else {
      setGpsCoords({ lat: 13.0827, lng: 80.2707 });
    }
  };

  const handleSubmitSos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setSubmissionError('Please provide a brief description of the emergency.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    const lat = gpsCoords?.lat ?? 13.0827;
    const lng = gpsCoords?.lng ?? 80.2707;
    const idempotencyKey = `sos-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const res = await api.submitSos({
        severity: 'CRITICAL',
        latitude: lat,
        longitude: lng,
        description: `[${emergencyType}] ${description} [Contact: ${personName || 'Anonymous'} - ${contactPhone || 'N/A'}]`,
        contact_phone: contactPhone || undefined,
        is_simulated: isSimulated,
        idempotency_key: idempotencyKey,
      });

      setSubmittedIncidentId(res.id);
      setDescription('');
    } catch (err: any) {
      setSubmissionError(err.message || 'Submission failed. Please use official telephone helpline 108 directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardBg = theme === 'dark'
    ? 'bg-slate-900/80 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-800 shadow-sm';

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header Banner */}
      <div className={`p-6 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border-rose-900/40 text-slate-100'
          : 'bg-gradient-to-br from-rose-50 via-white to-slate-50 border-rose-200 text-slate-900 shadow-sm'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
            <span className="font-mono text-xs font-bold text-rose-500 uppercase tracking-wider">
              Emergency Incident & Dispatch Protocol
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight">
            SOS Triage & Responder Operations Portal
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Incident ticketing, state-machine transitions (REPORTED $\to$ TRIAGED $\to$ DISPATCHED $\to$ RESOLVED), and protected responder notes for civil disaster units.
          </p>
        </div>

        {/* Real Emergency Disclaimer */}
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1.5 shrink-0 max-w-xs">
          <div className="font-bold flex items-center gap-1.5 text-rose-400">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Immediate Life Danger?</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-tight">
            Dial <b>108</b> (Medical/Ambulance) or <b>1070</b> (State Disaster Control) directly.
          </p>
          <div className="flex gap-2 pt-1 font-mono">
            <a
              href="tel:108"
              className="py-1 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
            >
              Call 108
            </a>
            <a
              href="tel:1070"
              className="py-1 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
            >
              Call 1070
            </a>
          </div>
        </div>
      </div>

      {/* Grid: Left Citizen SOS Trigger & Incident Tracking | Right Responder Triage Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Citizen Emergency SOS Trigger */}
        <div className="lg:col-span-5 space-y-6">
          <div className={`p-5 rounded-3xl border space-y-4 ${cardBg}`}>
            <div className="border-b pb-3 border-slate-700/50">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Radio className="w-4 h-4 text-rose-500" />
                <span>Submit Emergency Assistance Ticket</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Generates unique tracked incident ticket in triage queue
              </p>
            </div>

            {submittedIncidentId ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>SOS Ticket Logged Successfully</span>
                </div>
                <div className="font-mono text-sm bg-slate-900/60 p-2 rounded-xl text-center text-white border border-emerald-500/20">
                  Ticket ID: {submittedIncidentId}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Your location and ticket have been routed to the active responder triage board. Responders in your sector have been alerted.
                </p>
                <button
                  onClick={() => setSubmittedIncidentId(null)}
                  className="w-full mt-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
                >
                  Submit Another Ticket
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitSos} className="space-y-3.5 text-xs">
                {submissionError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                    {submissionError}
                  </div>
                )}

                <div>
                  <label className="block font-semibold mb-1 text-slate-300">
                    Emergency Nature
                  </label>
                  <select
                    value={emergencyType}
                    onChange={(e) => setEmergencyType(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                      theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="FLOOD_TRAPPED">Flooding Trapped / High Water Level</option>
                    <option value="MEDICAL_EMERGENCY">Medical Emergency in Inundated Sector</option>
                    <option value="STRUCTURAL_COLLAPSE">Structural Wall / Roof Damage</option>
                    <option value="POWER_HAZARD">Live Submerged Power Line</option>
                    <option value="OTHER_EVACUATION">Evacuation Transport Assistance Required</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-300">Contact Name</label>
                    <input
                      type="text"
                      value={personName}
                      onChange={(e) => setPersonName(e.target.value)}
                      placeholder="e.g. Anand K"
                      className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                        theme === 'dark'
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-300">Phone Number</label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91-98400..."
                      className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                        theme === 'dark'
                          ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-300">Location Coordinates</label>
                    <button
                      type="button"
                      onClick={handleCaptureGPS}
                      className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>{gpsCoords ? 'Refresh GPS' : 'Capture GPS'}</span>
                    </button>
                  </div>
                  <div className={`p-2.5 rounded-xl border font-mono text-xs ${
                    theme === 'dark' ? 'bg-slate-800/60 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    {gpsCoords ? (
                      <span className="text-emerald-400 font-bold">
                        Lat: {gpsCoords.lat}, Lng: {gpsCoords.lng}
                      </span>
                    ) : (
                      <span className="text-slate-400">Click Capture GPS or using default Chennai sector</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-300">
                    Situation Details / Landmark
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Describe situation, water depth, number of people needing assistance, nearest landmark..."
                    className={`w-full p-2.5 rounded-xl border text-xs outline-none resize-none ${
                      theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Transmitting Ticket...' : 'Broadcast Emergency SOS Ticket'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Responder Triage Queue (Embedded) */}
        <div className="lg:col-span-7 space-y-4">
          <div className={`p-5 rounded-3xl border space-y-4 ${cardBg}`}>
            <div className="border-b pb-3 border-slate-700/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span>First Responder Triage & Dispatch Queue</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live state machine: REPORTED $\to$ TRIAGED $\to$ DISPATCHED $\to$ RESOLVED
                </p>
              </div>

              <div className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Active Role: {role}
              </div>
            </div>

            {/* Embedded Responder Triage Queue Component */}
            <div className="min-h-[480px]">
              <ResponderTriageQueue />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
