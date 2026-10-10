import React from 'react';
import { Shield, Phone, MapPin, Zap, Utensils, HeartPulse, Navigation, CheckCircle2 } from 'lucide-react';
import { Shelter } from '../types';
import { useI18n } from '../context/I18nContext';

interface ShelterDirectoryProps {
  shelters: Shelter[];
  onSelectShelterDestination: (lat: number, lng: number) => void;
}

export const ShelterDirectory: React.FC<ShelterDirectoryProps> = ({
  shelters,
  onSelectShelterDestination,
}) => {
  const { language, t } = useI18n();

  return (
    <div className="space-y-4 text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {t('shelters_title')}
            </h2>
            <p className="text-[11px] text-slate-500">
              Government relief shelters, flood relief camps, and medical stations
            </p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
          {shelters.length} Active Camps
        </span>
      </div>

      {/* Shelters Grid */}
      <div className="grid grid-cols-1 gap-3">
        {shelters.map((s) => {
          const occPct = s.occupancy_percentage || Math.round((s.current_occupancy / Math.max(1, s.capacity)) * 100);
          const isNearFull = occPct > 80;

          return (
            <div
              key={s.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all space-y-3 shadow-2xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{s.name}</h3>
                  {s.name_ta && (
                    <div className="text-xs text-blue-600 mt-0.5">{s.name_ta}</div>
                  )}
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{s.address}</span>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    s.status === 'FULL'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {s.status}
                </span>
              </div>

              {/* Occupancy Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span>Capacity: {s.current_occupancy} / {s.capacity} beds occupied</span>
                  <span className={isNearFull ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>{occPct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                  <div
                    className={`h-full transition-all duration-500 ${isNearFull ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, occPct)}%` }}
                  />
                </div>
              </div>

              {/* Facility Tags */}
              <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                {s.has_medical && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                    <HeartPulse className="w-3 h-3 text-rose-500" />
                    <span>Medical Post</span>
                  </span>
                )}
                {s.has_food && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                    <Utensils className="w-3 h-3 text-amber-500" />
                    <span>Food & Water</span>
                  </span>
                )}
                {s.has_power_backup && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                    <Zap className="w-3 h-3 text-blue-500" />
                    <span>Generator Backup</span>
                  </span>
                )}
              </div>

              {/* Contact & Navigate Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                {s.contact_phone ? (
                  <a
                    href={`tel:${s.contact_phone}`}
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{s.contact_phone}</span>
                  </a>
                ) : (
                  <span className="text-slate-400">Helpline: 1070</span>
                )}

                <button
                  onClick={() => onSelectShelterDestination(s.latitude, s.longitude)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Navigate Here</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
