import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { Shelter } from '../types';
import {
  Building2,
  Search,
  MapPin,
  Phone,
  Navigation,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Zap,
  Coffee,
  HeartPulse,
  Users,
  PhoneCall,
} from 'lucide-react';
import { EmergencyContactsModal } from '../components/EmergencyContactsModal';

export const ReliefCentersPage: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useI18n();
  const { theme } = useTheme();

  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [showContactsModal, setShowContactsModal] = useState(false);

  const fetchShelters = async () => {
    setIsLoading(true);
    try {
      const data = await api.getShelters(13.0827, 80.2707);
      setShelters(data || []);
    } catch (e) {
      console.error('Failed to fetch relief shelters:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShelters();
  }, []);

  // Unique districts in shelter list
  const districts = Array.from(new Set(shelters.map((s) => s.district).filter(Boolean)));

  const filteredShelters = shelters.filter((s) => {
    const matchesQuery =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.name_ta && s.name_ta.includes(searchQuery));
    const matchesDistrict = districtFilter === 'ALL' || s.district === districtFilter;
    return matchesQuery && matchesDistrict;
  });

  const cardBg = 'bg-white/85 backdrop-blur-xl border border-white/90 text-black shadow-sm';

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto select-none font-sans text-black">
      {/* Top Banner */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-black">
            <Building2 className="w-4 h-4 text-black" />
          </div>
          <h1 className="text-2xl font-black text-black tracking-tight">
            Relief Centers
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowContactsModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Emergency Contacts</span>
          </button>
          <button
            onClick={fetchShelters}
            className="p-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-black transition cursor-pointer"
            title="Refresh vacancies"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search and District Filter Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${cardBg}`}>
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by shelter name or location..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none border transition ${
              theme === 'dark'
                ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-400 text-xs font-semibold">District:</span>
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold outline-none cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <option value="ALL">All Districts ({shelters.length})</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Shelters Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredShelters.length === 0 ? (
          <div className={`col-span-full p-12 text-center rounded-3xl border ${cardBg}`}>
            <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <div className="font-bold text-sm text-slate-300">No relief camps found</div>
            <p className="text-xs text-slate-500 mt-1">Try modifying your search or district filter.</p>
          </div>
        ) : (
          filteredShelters.map((shelter) => {
            const vacantBeds = (shelter.capacity || 0) - (shelter.current_occupancy || 0);
            const occupancyPct = shelter.occupancy_percentage ?? 0;

            return (
              <div
                key={shelter.id}
                className={`p-5 rounded-3xl border flex flex-col justify-between gap-4 transition hover:border-emerald-500/40 ${cardBg}`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {shelter.district || 'Tamil Nadu'}
                        </span>
                        {shelter.is_official && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            GOVT OFFICIAL
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-white mt-1.5 leading-snug">
                        {language === 'ta' && shelter.name_ta ? shelter.name_ta : shelter.name}
                      </h3>
                    </div>

                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-xl">
                      {vacantBeds} VACANT
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span>{shelter.address}</span>
                  </p>

                  {/* Occupancy Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>Capacity Occupancy</span>
                      </span>
                      <span className="font-bold font-mono text-slate-300">
                        {shelter.current_occupancy} / {shelter.capacity} ({occupancyPct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          occupancyPct > 80
                            ? 'bg-rose-500'
                            : occupancyPct > 50
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, occupancyPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Amenities Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {shelter.has_medical && (
                      <span className="text-[10px] px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                        <HeartPulse className="w-3 h-3" />
                        <span>Medical Desk</span>
                      </span>
                    )}
                    {shelter.has_food && (
                      <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                        <Coffee className="w-3 h-3" />
                        <span>Food & Water</span>
                      </span>
                    )}
                    {shelter.has_power_backup && (
                      <span className="text-[10px] px-2 py-0.5 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        <span>Generator Power</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Phone and Route Action */}
                <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between gap-2">
                  {shelter.contact_phone ? (
                    <a
                      href={`tel:${shelter.contact_phone}`}
                      className="text-xs font-mono font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition"
                    >
                      <Phone className="w-3.5 h-3.5 text-blue-400" />
                      <span>{shelter.contact_phone}</span>
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-500">Contact: Local SEOC</span>
                  )}

                  <button
                    onClick={() => navigate('/app/navigation')}
                    className="px-3 py-1.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Navigate</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer with Emergency Contacts button */}
      <footer className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          onClick={() => setShowContactsModal(true)}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-black hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Emergency Contacts (Police, Fire, Ambulance, Disaster)</span>
        </button>

        <span className="text-xs font-semibold text-slate-600">
          State Emergency Helplines 112 • 108 • 101 • 1070
        </span>
      </footer>

      <EmergencyContactsModal
        isOpen={showContactsModal}
        onClose={() => setShowContactsModal(false)}
      />
    </div>
  );
};
