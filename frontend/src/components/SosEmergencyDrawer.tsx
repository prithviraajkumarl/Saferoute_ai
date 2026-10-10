import React, { useState, useRef, useEffect } from 'react';
import { X, ShieldAlert, Phone, Users, MapPin, CheckCircle, AlertTriangle, Crosshair, Clock } from 'lucide-react';
import { Incident } from '../types';
import { api } from '../services/api';
import { useI18n } from '../context/I18nContext';

interface SosEmergencyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeIncident: Incident | null;
  setActiveIncident: (inc: Incident | null) => void;
  userCoords?: { lat: number; lng: number };
}

export const SosEmergencyDrawer: React.FC<SosEmergencyDrawerProps> = ({
  isOpen,
  onClose,
  activeIncident,
  setActiveIncident,
  userCoords,
}) => {
  const { language, t } = useI18n();
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [personCount, setPersonCount] = useState(1);
  const [phone, setPhone] = useState('+91 98401 12345');
  const [desc, setDesc] = useState('Low-lying water accumulation threatening residential entrance.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Coordinates
  const [targetLat, setTargetLat] = useState<number>(userCoords?.lat || 13.0827);
  const [targetLng, setTargetLng] = useState<number>(userCoords?.lng || 80.2755);

  useEffect(() => {
    if (userCoords) {
      setTargetLat(userCoords.lat);
      setTargetLng(userCoords.lng);
    }
  }, [userCoords?.lat, userCoords?.lng]);

  const holdIntervalRef = useRef<any>(null);

  const startHold = () => {
    setHolding(true);
    setProgress(0);
    const stepTime = 50;
    const totalTime = 2500;
    const increment = (stepTime / totalTime) * 100;

    holdIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(holdIntervalRef.current);
          triggerSosBroadcast();
          return 100;
        }
        return prev + increment;
      });
    }, stepTime);
  };

  const cancelHold = () => {
    if (progress < 100) {
      clearInterval(holdIntervalRef.current);
      setHolding(false);
      setProgress(0);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setTargetLat(Number(pos.coords.latitude.toFixed(4)));
      setTargetLng(Number(pos.coords.longitude.toFixed(4)));
    });
  };

  const triggerSosBroadcast = async () => {
    setIsSubmitting(true);
    try {
      const key = `IDEMP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const inc = await api.submitSos({
        latitude: targetLat,
        longitude: targetLng,
        person_count: personCount,
        contact_phone: phone,
        description: desc,
        severity: 'CRITICAL',
        idempotency_key: key,
      });
      setActiveIncident(inc);
    } catch (e) {
      console.error('SOS Broadcast failure:', e);
    } finally {
      setIsSubmitting(false);
      setHolding(false);
      setProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 text-slate-800 border border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-600 animate-pulse" />
            <h3 className="text-base font-bold text-slate-900">
              Emergency SOS Beacon Registration
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 leading-relaxed">
          <b>Direct Emergency Line:</b> For immediate life-saving rescue, please call State Disaster Helpline <b>1070</b> or Ambulance <b>108</b> directly. SafeRoute AI registers incidents in the mission-control queue for emergency responder review.
        </div>

        {/* Active Incident Tracking */}
        {activeIncident ? (
          <div className="mt-4 space-y-4">
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-left space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Incident Reference</div>
                  <div className="text-lg font-bold text-blue-700">{activeIncident.reference_code}</div>
                </div>
                <div className="px-3 py-1 rounded-full bg-blue-600 text-xs font-bold text-white">
                  {activeIncident.status}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-blue-200/60 text-xs">
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>1. Incident Logged in Mission Control Database</span>
                </div>
                <div className="flex items-center gap-2 text-blue-700 font-medium">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>2. GPS Coordinates ({activeIncident.latitude}°N, {activeIncident.longitude}°E) Queued for Responder Acknowledgement</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/80 border border-blue-200 text-[11px] text-slate-700">
                <b>Truthful Disclosure:</b> Automatic dispatch is not guaranteed without official emergency agency confirmation. Please contact <b>1070</b> or <b>108</b> directly if life is in immediate peril.
              </div>
            </div>

            <button
              onClick={() => setActiveIncident(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Dismiss Active Ticket View
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4 text-xs">
            {/* Coordinates Confirmation */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 block">Incident Coordinates:</span>
                <span className="font-bold text-slate-900 text-xs">
                  {targetLat}°N, {targetLng}°E
                </span>
              </div>
              <button
                type="button"
                onClick={handleLocateMe}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-blue-700 text-xs font-semibold flex items-center gap-1 hover:bg-slate-50 cursor-pointer"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>GPS Locate</span>
              </button>
            </div>

            {/* Input Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Contact Phone
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-transparent focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  People in Need
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                  <Users className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={personCount}
                    onChange={(e) => setPersonCount(Number(e.target.value))}
                    className="w-full bg-transparent focus:outline-none text-xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Emergency Situation
              </label>
              <textarea
                rows={2}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 resize-none"
              />
            </div>

            {/* Hold to Trigger SOS Button */}
            <div className="pt-2 text-center space-y-2">
              <button
                onMouseDown={startHold}
                onMouseUp={cancelHold}
                onMouseLeave={cancelHold}
                onTouchStart={startHold}
                onTouchEnd={cancelHold}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-sm shadow-md transition-all relative overflow-hidden cursor-pointer"
              >
                {/* Progress fill */}
                <div
                  className="absolute inset-0 bg-rose-800/80 transition-all pointer-events-none"
                  style={{ width: `${progress}%` }}
                />
                <span className="relative z-10">
                  {holding ? `HOLD TO CONFIRM (${Math.round(progress)}%)` : 'HOLD 3 SECONDS TO REGISTER SOS'}
                </span>
              </button>
              <p className="text-[11px] text-slate-500">
                Press and hold to prevent accidental triggers. Logs GPS coordinates in mission control queue.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
