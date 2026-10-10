import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { ResponderTriageQueue } from '../components/ResponderTriageQueue';
import { AdminPortalControls } from '../components/AdminPortalControls';
import { EmergencyContactsModal } from '../components/EmergencyContactsModal';
import { CycloneSimulatorModal } from '../components/CycloneSimulatorModal';
import {
  Radio,
  PhoneCall,
  MapPin,
  CheckCircle2,
  Send,
  Shield,
  Wind,
  User,
  Settings,
  AlertTriangle,
} from 'lucide-react';

interface ResponsePageProps {
  onOpenSosModal: () => void;
  isSimulated?: boolean;
}

export const ResponsePage: React.FC<ResponsePageProps> = ({
  isSimulated = false,
}) => {
  const { role, switchPersona } = useAuth();
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
  const [showContactsModal, setShowContactsModal] = useState<boolean>(false);
  const [showCycloneModal, setShowCycloneModal] = useState<boolean>(false);

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
        () => {
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
      setSubmissionError('Please describe the emergency.');
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
        description: `[${emergencyType}] ${description} [Caller: ${personName || 'Citizen'} • Phone: ${contactPhone || '108'}]`,
        contact_phone: contactPhone || '108',
        is_simulated: isSimulated,
        idempotency_key: idempotencyKey,
      });

      setSubmittedIncidentId(res.id);
      setDescription('');
    } catch (err: any) {
      setSubmissionError(err.message || 'Submission failed. Use official hotline 108 directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto select-none font-sans text-black">
      {/* ── TOP HEADER & ROLE SWITCHER BAR ── */}
      <header className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-black">
            <Radio className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-black tracking-tight">
              {role === 'tourist'
                ? 'Civilian Emergency SOS'
                : role === 'responder'
                ? 'First Reporter Operations Queue'
                : 'Admin Portal Master Control System'}
            </h1>
          </div>
        </div>

        {/* Quick Role Switcher Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white border border-slate-200 shadow-2xs self-start md:self-auto">
          <button
            onClick={() => switchPersona('tourist')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              role === 'tourist'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Civilian</span>
          </button>

          <button
            onClick={() => switchPersona('responder')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              role === 'responder'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>First Reporter</span>
          </button>

          <button
            onClick={() => switchPersona('administrator')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              role === 'administrator'
                ? 'bg-black text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Admin Portal</span>
          </button>
        </div>
      </header>

      {/* ── PORTAL VIEW 1: CIVILIAN ── */}
      {role === 'tourist' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Citizen Request Assistance */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white/85 backdrop-blur-xl border border-white/90 rounded-3xl p-5 shadow-sm space-y-4 text-black">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <h2 className="font-black text-sm text-black">
                  Request Assistance
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCycloneModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  <Wind className="w-3.5 h-3.5" />
                  <span>Cyclone Simulator</span>
                </button>
              </div>

              {submittedIncidentId ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-black text-xs space-y-2.5">
                  <div className="flex items-center gap-2 font-black text-black">
                    <CheckCircle2 className="w-4 h-4 text-black" />
                    <span>SOS Ticket Logged</span>
                  </div>
                  <div className="font-mono text-sm bg-white p-2.5 rounded-xl text-center text-black font-black border border-slate-300">
                    Ticket ID: {submittedIncidentId}
                  </div>
                  <p className="text-xs text-slate-700">
                    Disaster rescue units have received your coordinates. Stay on high ground.
                  </p>
                  <button
                    onClick={() => setSubmittedIncidentId(null)}
                    className="w-full mt-2 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition"
                  >
                    Submit Another Ticket
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitSos} className="space-y-3 text-xs text-black">
                  {submissionError && (
                    <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-300 text-black text-xs font-semibold">
                      {submissionError}
                    </div>
                  )}

                  <div>
                    <label className="block font-bold mb-1 text-black">
                      Emergency Type
                    </label>
                    <select
                      value={emergencyType}
                      onChange={(e) => setEmergencyType(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-black text-xs font-semibold outline-none"
                    >
                      <option value="FLOOD_TRAPPED">Flooding Trapped</option>
                      <option value="MEDICAL_EMERGENCY">Medical Emergency</option>
                      <option value="STRUCTURAL_COLLAPSE">Structural Damage</option>
                      <option value="POWER_HAZARD">Live Power Line</option>
                      <option value="OTHER_EVACUATION">Evacuation Needed</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1 text-black">Name</label>
                      <input
                        type="text"
                        value={personName}
                        onChange={(e) => setPersonName(e.target.value)}
                        placeholder="Your Name"
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-black placeholder-slate-400 text-xs font-semibold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-black">Phone</label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="Phone Number"
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-black placeholder-slate-400 text-xs font-semibold outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-black">Location</label>
                      <button
                        type="button"
                        onClick={handleCaptureGPS}
                        className="text-[11px] font-bold text-black underline flex items-center gap-1 cursor-pointer"
                      >
                        <MapPin className="w-3 h-3 text-black" />
                        <span>{gpsCoords ? 'Refresh GPS' : 'Capture GPS'}</span>
                      </button>
                    </div>
                    <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs text-black font-semibold">
                      {gpsCoords ? (
                        <span>
                          Lat: {gpsCoords.lat}, Lng: {gpsCoords.lng}
                        </span>
                      ) : (
                        <span className="text-slate-600">Click Capture GPS (or default sector)</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-black">
                      Details
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Describe situation, people count, landmark..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-black placeholder-slate-400 text-xs font-semibold outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-2xl bg-black hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Transmitting...' : 'Send SOS Ticket'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Civilian Emergency Hotlines & Simulator Box */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white/85 backdrop-blur-xl border border-white/90 rounded-3xl p-5 shadow-sm space-y-4 text-black">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <h2 className="font-black text-sm text-black">
                  Toll-Free Emergency Hotlines
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href="tel:108"
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition text-center block cursor-pointer"
                >
                  <div className="text-xl font-black text-black">108</div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5">Ambulance & Trauma</div>
                </a>

                <a
                  href="tel:112"
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition text-center block cursor-pointer"
                >
                  <div className="text-xl font-black text-black">112</div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5">Police & Security</div>
                </a>

                <a
                  href="tel:101"
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition text-center block cursor-pointer"
                >
                  <div className="text-xl font-black text-black">101</div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5">Fire & Rescue</div>
                </a>

                <a
                  href="tel:1070"
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition text-center block cursor-pointer"
                >
                  <div className="text-xl font-black text-black">1070</div>
                  <div className="text-xs font-bold text-slate-700 mt-0.5">State Disaster (SDMA)</div>
                </a>
              </div>

              {/* Cyclone Simulator Quick Trigger */}
              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-black flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-black" />
                    <span>AI Cyclone Simulator</span>
                  </span>
                  <button
                    onClick={() => setShowCycloneModal(true)}
                    className="px-3 py-1 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Run Simulation
                  </button>
                </div>
                <p className="text-[11px] text-slate-700">
                  Instantly tests AI-predicted cyclone telemetry, wind gust warnings, and coastal depression alerts.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PORTAL VIEW 2: FIRST REPORTER ── */}
      {role === 'responder' && (
        <div className="space-y-4">
          <div className="bg-white/85 backdrop-blur-xl border border-white/90 rounded-3xl p-5 shadow-sm space-y-4 text-black">
            <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-black" />
                <h2 className="font-black text-sm text-black">
                  First Reporter Operations Queue
                </h2>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-black border border-slate-200">
                Live Data Synchronized
              </span>
            </div>

            <div className="min-h-[460px]">
              <ResponderTriageQueue />
            </div>
          </div>
        </div>
      )}

      {/* ── PORTAL VIEW 3: ADMIN PORTAL ── */}
      {role === 'administrator' && (
        <div className="space-y-4">
          <AdminPortalControls />
        </div>
      )}

      {/* ── BOTTOM ACTIONS: EMERGENCY CONTACTS ── */}
      <footer className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          onClick={() => setShowContactsModal(true)}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-black hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Emergency Contacts (Police, Fire, Ambulance, Disaster)</span>
        </button>

        <span className="text-xs font-semibold text-slate-700">
          State Emergency Helplines 112 • 108 • 101 • 1070
        </span>
      </footer>

      {/* Emergency Contacts Modal */}
      <EmergencyContactsModal
        isOpen={showContactsModal}
        onClose={() => setShowContactsModal(false)}
      />

      {/* Cyclone Simulator AI Notification Modal */}
      <CycloneSimulatorModal
        isOpen={showCycloneModal}
        onClose={() => setShowCycloneModal(false)}
      />
    </div>
  );
};
