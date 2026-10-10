import React, { useState } from 'react';
import {
  Phone,
  PhoneCall,
  Shield,
  X,
  Copy,
  Check,
  Flame,
  Ambulance,
  Radio,
  Zap,
  Droplets,
  HeartHandshake,
} from 'lucide-react';

interface EmergencyContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EMERGENCY_CONTACTS = [
  {
    category: 'Police',
    name: 'Police',
    number: '112',
    altNumber: '100',
    icon: Shield,
    desc: 'Emergency dispatch',
  },
  {
    category: 'Medical',
    name: 'Ambulance',
    number: '108',
    altNumber: '102',
    icon: Ambulance,
    desc: 'Medical trauma',
  },
  {
    category: 'Fire',
    name: 'Fire Department',
    number: '101',
    icon: Flame,
    desc: 'Fire & rescue',
  },
  {
    category: 'Disaster',
    name: 'State Disaster (SDMA)',
    number: '1070',
    icon: Radio,
    desc: 'State control room',
  },
  {
    category: 'District',
    name: 'District Helpline',
    number: '1077',
    icon: Radio,
    desc: 'District control',
  },
  {
    category: 'Power',
    name: 'Electricity Board',
    number: '9498794987',
    icon: Zap,
    desc: 'Power emergency',
  },
  {
    category: 'Water',
    name: 'Water & Drainage',
    number: '1916',
    icon: Droplets,
    desc: 'Flood & drainage',
  },
  {
    category: 'Women',
    name: 'Women Helpline',
    number: '1091',
    altNumber: '181',
    icon: HeartHandshake,
    desc: 'Safety hotline',
  },
];

export const EmergencyContactsModal: React.FC<EmergencyContactsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden text-black">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-black">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-black tracking-tight">
                Emergency Contacts
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-black transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contacts List */}
        <div className="p-4 overflow-y-auto space-y-2 divide-y divide-slate-100">
          {EMERGENCY_CONTACTS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="pt-2.5 first:pt-0 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-black shrink-0">
                    <Icon className="w-4 h-4 text-black" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-black truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">
                      {item.desc}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="font-black text-sm text-black block">
                      {item.number}
                    </span>
                    {item.altNumber && (
                      <span className="text-[10px] text-slate-600 block">
                        Alt: {item.altNumber}
                      </span>
                    )}
                  </div>

                  <a
                    href={`tel:${item.number}`}
                    className="p-2 rounded-xl bg-black hover:bg-slate-800 text-white transition cursor-pointer"
                    title={`Call ${item.number}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => handleCopy(item.number)}
                    className="p-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-black transition cursor-pointer"
                    title="Copy number"
                  >
                    {copiedNumber === item.number ? (
                      <Check className="w-3.5 h-3.5 text-black" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-black" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
          <span className="text-black font-semibold">
            Toll-Free 24/7 Hotlines
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-black text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
