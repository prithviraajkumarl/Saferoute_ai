import React, { useEffect, useState } from 'react';
import { BookOpen, X, Phone, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useI18n } from '../context/I18nContext';

interface DisasterProtocolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OFFICIAL_HELPLINES = [
  { service: 'State Emergency Operations Centre (SEOC)', number: '1070', desc: 'Disaster management state level' },
  { service: 'District Disaster Helpline', number: '1077', desc: 'Local district collectorate control' },
  { service: 'Emergency Ambulance / Medical', number: '108', desc: 'Immediate medical rescue dispatch' },
  { service: 'Police Emergency Assistance', number: '100', desc: 'Law enforcement & evacuation support' },
  { service: 'Fire & Flood Rescue Services', number: '101', desc: 'NDRF / SDRF fast boat response' },
  { service: 'Greater Chennai Corporation (GCC)', number: '1913', desc: 'Pumping stations & tree clearance' },
];

export const DisasterProtocolsModal: React.FC<DisasterProtocolsModalProps> = ({ isOpen, onClose }) => {
  const { language, t } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 text-slate-800 border border-slate-200 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Disaster Protocols & Official Emergency Helplines
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Emergency Helplines */}
        <div>
          <h4 className="text-xs uppercase font-bold text-slate-500 mb-2.5 flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-blue-600" />
            <span>Official Government Emergency Helplines (Direct Tap to Call)</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {OFFICIAL_HELPLINES.map((contact, i) => (
              <a
                key={i}
                href={`tel:${contact.number}`}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                    {contact.service}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{contact.desc}</div>
                </div>
                <span className="text-sm font-bold text-blue-600 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                  {contact.number}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Cyclone & Flooding Guidelines */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h4 className="text-xs uppercase font-bold text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Standard Operating Procedures (Do's and Don'ts)</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5 text-emerald-950">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                <span>✓ Recommended Actions</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-emerald-900 leading-relaxed">
                <li>Move to highest reinforced floor or designated cyclone shelter.</li>
                <li>Store 72 hours of drinkable water (3L per person per day).</li>
                <li>Keep power banks fully charged and emergency radio handy.</li>
                <li>Switch off main electrical breakers if floodwater enters the premises.</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1.5 text-rose-950">
              <div className="font-bold flex items-center gap-1.5 text-rose-800">
                <span>✕ Danger / Things to Avoid</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-rose-900 leading-relaxed">
                <li>Do NOT drive through flooded subways or fast-moving currents.</li>
                <li>Do NOT touch fallen electric lines or flooded lamp posts.</li>
                <li>Do NOT spread unverified social media rumors; follow official SEOC alerts.</li>
                <li>Do NOT shelter under large trees or weak tin roofs during high wind.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
