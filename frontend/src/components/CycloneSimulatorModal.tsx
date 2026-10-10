import React from 'react';
import { AlertTriangle, Wind, CloudRain, ShieldCheck, X, Navigation, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CycloneSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CycloneSimulatorModal: React.FC<CycloneSimulatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in font-sans select-none text-black">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center">
              <Wind className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                AI PREDICTIVE NOTIFICATION
              </span>
              <h2 className="text-base font-black text-black mt-1">
                Cyclone Surge Warning
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-black transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-black text-red-900 text-sm">
              <AlertTriangle className="w-4 h-4 text-red-700" />
              <span>Possibility of Cyclone in Nearby Distance</span>
            </div>
            <p className="text-xs text-red-950 font-semibold leading-relaxed">
              AI weather prediction models detect severe low-pressure depression intensifying into a cyclone within 42 km offshore. Expect torrential rainfall (185 mm) and 75–85 km/h gale gusts within 4 hours.
            </p>
          </div>

          {/* Telemetry Metrics */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Distance</div>
              <div className="text-sm font-black text-black mt-0.5">42 km Offshore</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Rainfall</div>
              <div className="text-sm font-black text-black mt-0.5">185 mm</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Wind Gusts</div>
              <div className="text-sm font-black text-black mt-0.5">82 km/h</div>
            </div>
          </div>

          {/* Advisory Checklist */}
          <div className="space-y-2 text-xs">
            <div className="font-bold text-black">Recommended Actions:</div>
            <div className="space-y-1.5 text-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-black shrink-0" />
                <span>Move away from low-lying coastal subways and underpasses.</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-black shrink-0" />
                <span>Evacuation corridors to Velachery & Tambaram camps active.</span>
              </div>
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-black shrink-0" />
                <span>Emergency hotlines 108 (Medical) & 1070 (Disaster) on standby.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-200 text-black text-xs font-bold cursor-pointer transition"
          >
            Dismiss
          </button>

          <button
            onClick={() => {
              onClose();
              navigate('/app/navigation');
            }}
            className="px-5 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-black flex items-center gap-2 cursor-pointer transition shadow-md"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>View Safe Evacuation Route</span>
          </button>
        </div>
      </div>
    </div>
  );
};
