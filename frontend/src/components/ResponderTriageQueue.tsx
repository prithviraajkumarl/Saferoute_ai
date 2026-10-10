import React, { useState, useEffect } from 'react';
import { Radio, CheckCircle, Clock, AlertTriangle, Shield, UserCheck, MessageSquare, Send } from 'lucide-react';
import { Incident, HazardReport } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

export const ResponderTriageQueue: React.FC = () => {
  const { role } = useAuth();
  const { t } = useI18n();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [hazards, setHazards] = useState<HazardReport[]>([]);
  const [activeTab, setActiveTab] = useState<'incidents' | 'moderation'>('incidents');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [internalNote, setInternalNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const qRes = await api.getResponderQueue();
      const sorted = [...qRes.items].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setIncidents(sorted);

      const hRes = await api.getHazards('PENDING_VERIFICATION');
      setHazards(hRes.items);
    } catch (e) {
      console.error('Error loading responder queue:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('saferoute-sos-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    const timer = setInterval(loadData, 5000);
    return () => {
      window.removeEventListener('saferoute-sos-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(timer);
    };
  }, []);

  const handleTransition = async (incId: string, nextStatus: string) => {
    try {
      const updated = await api.transitionIncident(incId, nextStatus, `Updated by responder via command queue`);
      setIncidents((prev) => prev.map((item) => (item.id === incId ? updated : item)));
      if (selectedIncident?.id === incId) setSelectedIncident(updated);
    } catch (e) {
      alert(`Transition error: ${e}`);
    }
  };

  const handleModerateHazard = async (hId: string, action: string) => {
    try {
      await api.moderateHazard(hId, action, `Moderated by Responder`);
      setHazards((prev) => prev.filter((h) => h.id !== hId));
    } catch (e) {
      alert(`Moderation error: ${e}`);
    }
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* Top Switcher */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-black" />
          <h2 className="text-xs font-bold text-black">
            Operations Queue
          </h2>
        </div>
        <div className="flex gap-1.5 text-xs">
          <button
            onClick={() => setActiveTab('incidents')}
            className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'incidents'
                ? 'bg-black text-white'
                : 'bg-slate-100 text-black hover:bg-slate-200'
            }`}
          >
            SOS ({incidents.length})
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'moderation'
                ? 'bg-black text-white'
                : 'bg-slate-100 text-black hover:bg-slate-200'
            }`}
          >
            Hazards ({hazards.length})
          </button>
        </div>
      </div>

      {activeTab === 'incidents' ? (
        <div className="space-y-2.5">
          {incidents.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-black font-semibold text-xs">
              No active SOS incidents in queue.
            </div>
          ) : (
            incidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;

              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`bg-white p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-black ring-1 ring-black'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-black">{inc.reference_code}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-black font-bold border border-slate-200">
                          {inc.severity}
                        </span>
                        <span className="text-[11px] text-slate-700 font-medium">{inc.person_count} persons</span>
                        <span className="text-[10px] text-slate-600 font-mono">
                          {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-xs text-black mt-1 font-semibold">{inc.address || 'GPS Coordinates Broadcast'}</div>
                    </div>

                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-black border border-slate-200">
                      {inc.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 mb-2.5">{inc.description}</p>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTransition(inc.id, 'ASSISTANCE_EN_ROUTE');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-black hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition"
                    >
                      Dispatch
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTransition(inc.id, 'RESOLVED');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 font-bold text-xs cursor-pointer transition"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {hazards.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-black font-semibold text-xs">
              No pending hazard reports.
            </div>
          ) : (
            hazards.map((h) => (
              <div key={h.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-black">{h.hazard_type.replace('_', ' ')}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-black font-bold border border-slate-200">
                    {h.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-800">{h.description}</p>
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleModerateHazard(h.id, 'APPROVE')}
                    className="px-3 py-1.5 rounded-xl bg-black hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => handleModerateHazard(h.id, 'REJECT')}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 font-bold text-xs cursor-pointer transition"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
