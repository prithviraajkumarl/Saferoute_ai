import React, { useState, useEffect } from 'react';
import { Flame, X, Play, Pause, RotateCcw, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SimulationScenario } from '../types';
import { api } from '../services/api';

interface SimulationControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSimulated: boolean;
  setIsSimulated: (active: boolean) => void;
}

export const SimulationControlModal: React.FC<SimulationControlModalProps> = ({
  isOpen,
  onClose,
  isSimulated,
  setIsSimulated,
}) => {
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getScenarios().then(setScenarios).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartDrill = async (scenarioId: string) => {
    try {
      await api.toggleSimulation(scenarioId, true);
      setIsSimulated(true);
      setIsPaused(false);
      setScenarios((prev) =>
        prev.map((s) => (s.id === scenarioId ? { ...s, is_active: true } : s))
      );
    } catch (e) {
      alert(`Simulation error: ${e}`);
    }
  };

  const handlePauseDrill = () => {
    setIsPaused(!isPaused);
  };

  const handleResetDrill = async () => {
    try {
      for (const scen of scenarios) {
        if (scen.is_active) {
          await api.toggleSimulation(scen.id, false);
        }
      }
      setIsSimulated(false);
      setIsPaused(false);
      setScenarios((prev) => prev.map((s) => ({ ...s, is_active: false })));
    } catch (e) {
      console.error('Reset error:', e);
      setIsSimulated(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 text-slate-800 border border-slate-200 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">
              Disaster Drill Simulation Sandbox
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Isolation Notice */}
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Synthetic Training Sandbox Isolation</span>
          </div>
          <p className="text-[11px] text-amber-800">
            Drill scenarios inject synthetic rainfall surges and simulated road closures. Simulated records are completely isolated and will not overwrite real-world municipal or citizen emergency records.
          </p>
        </div>

        {/* Master Drill Controls */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
          <div className="text-xs">
            <div className="font-bold text-slate-900">Drill Status:</div>
            <div className="text-[11px] text-slate-500">
              {isSimulated ? (isPaused ? 'Paused (State Frozen)' : 'Active (Synthetic Telemetry Running)') : 'Standby (Real Telemetry Active)'}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isSimulated && (
              <button
                onClick={handlePauseDrill}
                className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                {isPaused ? <Play className="w-3.5 h-3.5 text-blue-600" /> : <Pause className="w-3.5 h-3.5 text-amber-600" />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
            )}

            <button
              onClick={handleResetDrill}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset & Exit</span>
            </button>
          </div>
        </div>

        {/* Scenarios List */}
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {scenarios.map((scen) => {
            const isActive = scen.is_active || isSimulated;
            return (
              <div
                key={scen.id}
                className={`p-4 rounded-2xl border space-y-2 text-xs transition-all ${
                  isActive
                    ? 'bg-amber-50/70 border-amber-300'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{scen.name}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      isActive
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isActive ? 'DRILL ACTIVE' : 'READY TO INJECT'}
                  </span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">{scen.description}</p>

                <div className="pt-2 flex justify-end">
                  {isActive ? (
                    <button
                      onClick={handleResetDrill}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold cursor-pointer"
                    >
                      Stop Scenario
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartDrill(scen.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Inject Drill Scenario</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
