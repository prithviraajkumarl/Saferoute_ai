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
      setIncidents(qRes.items);

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
    const timer = setInterval(loadData, 10000);
    return () => clearInterval(timer);
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
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-amber-600 animate-pulse" />
          <h2 className="text-sm font-bold text-slate-900">
            Responder Operations Queue
          </h2>
        </div>
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => setActiveTab('incidents')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              activeTab === 'incidents'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Active SOS ({incidents.length})
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              activeTab === 'moderation'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Hazard Queue ({hazards.length})
          </button>
        </div>
      </div>

      {activeTab === 'incidents' ? (
        <div className="space-y-3">
          {incidents.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
              No active SOS emergency incidents in triage queue. All sectors nominal.
            </div>
          ) : (
            incidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;

              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-700">{inc.reference_code}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                          {inc.severity}
                        </span>
                        <span className="text-[11px] text-slate-500">{inc.person_count} persons</span>
                      </div>
                      <div className="text-xs text-slate-800 mt-1 font-semibold">{inc.address || 'GPS Coordinates Broadcast'}</div>
                    </div>

                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      {inc.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mb-3">{inc.description}</p>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTransition(inc.id, 'ASSISTANCE_EN_ROUTE');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer"
                    >
                      Dispatch Team
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTransition(inc.id, 'RESOLVED');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer"
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {hazards.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
              No pending community hazard reports require verification.
            </div>
          ) : (
            hazards.map((h) => (
              <div key={h.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{h.hazard_type.replace('_', ' ')}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold">
                    {h.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{h.description}</p>
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleModerateHazard(h.id, 'APPROVE')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer"
                  >
                    Verify & Broadcast
                  </button>
                  <button
                    onClick={() => handleModerateHazard(h.id, 'REJECT')}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
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
