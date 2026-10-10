import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  Globe,
  Radio,
  Activity,
  User,
  Sun,
  Moon,
  ShieldCheck,
  AlertOctagon,
  ChevronDown,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

interface HeaderProps {
  onOpenMobile: () => void;
  onOpenSos: () => void;
  onOpenProtocols?: () => void;
  onOpenSimulation?: () => void;
  isSimulated?: boolean;
}

const PAGE_METADATA: Record<string, { titleEn: string; titleTa: string; descEn: string; descTa: string }> = {
  '/app/dashboard': {
    titleEn: 'Area Overview & Status',
    titleTa: 'பகுதி பொதுப் பார்வை & நிலை',
    descEn: 'Current area condition, weather prediction & nearby road incidents',
    descTa: 'தற்போதைய பகுதி நிலை, வானிலை முன்னறிவிப்பு & சாலை சம்பவங்கள்',
  },
  '/app/navigation': {
    titleEn: 'Navigate & Roadway Weather',
    titleTa: 'வழிசெலுத்தல் & வானிலை',
    descEn: '3D road directions, live traffic, weather at origin/destination & hazard points',
    descTa: '3D சாலை வழிகாட்டல், நேரலை போக்குவரத்து & வானிலை',
  },
  '/app/weather': {
    titleEn: 'Weather Intelligence Center',
    titleTa: 'வானிலை நுண்ணறிவு மையம்',
    descEn: 'Doppler precipitation radar, wind vector streamlines & temperature heatmaps',
    descTa: 'டாப்ளர் ரேடார், காற்று திசை & வெப்பநிலை வரைபடங்கள்',
  },
  '/app/incidents': {
    titleEn: 'Hazard & Incident Telemetry',
    titleTa: 'கள இடர்கள் & சம்பவங்கள்',
    descEn: 'Verified community reports, roadway closures & drainage bottlenecks',
    descTa: 'உறுதிப்படுத்தப்பட்ட கள இடர்கள், சாலை அடைப்புகள் & வடிகால் சிக்கல்கள்',
  },
  '/app/response': {
    titleEn: 'SOS & Responder Triage',
    titleTa: 'அவசர SOS & மீட்பு பணி',
    descEn: 'Citizen SOS tracking, responder triage lifecycle & private coordination notes',
    descTa: 'குடிமக்கள் SOS கண்காணிப்பு & மீட்புக் குழுவினர் ஒருங்கிணைப்பு',
  },
  '/app/relief-centers': {
    titleEn: 'Relief Centers & Shelters',
    titleTa: 'நிவாரண முகாம்கள் & புகலிடங்கள்',
    descEn: 'Civil defense cyclone camps, current occupancy & medical amenities',
    descTa: 'அரசு பேரிடர் நிவாரண முகாம்கள் & மருத்துவ வசதிகள்',
  },
};

export const Header: React.FC<HeaderProps> = ({
  onOpenMobile,
  onOpenSos,
  onOpenProtocols,
  onOpenSimulation,
  isSimulated = false,
}) => {
  const location = useLocation();
  const { user, role, switchPersona, logout } = useAuth();
  const { language, toggleLanguage } = useI18n();
  const { theme, toggleTheme } = useTheme();

  const [backendStatus, setBackendStatus] = useState<'READY' | 'DEGRADED' | 'CHECKING'>('CHECKING');
  const [dbLatency, setDbLatency] = useState<number | null>(null);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      try {
        const data = await api.getHealthReadiness();
        if (mounted) {
          if (data && data.status === 'READY') {
            setBackendStatus('READY');
            setDbLatency(data.database?.latency_ms ?? 2.2);
          } else {
            setBackendStatus('DEGRADED');
          }
        }
      } catch {
        if (mounted) setBackendStatus('DEGRADED');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const meta = PAGE_METADATA[location.pathname] || PAGE_METADATA['/app/dashboard'];
  const title = language === 'ta' ? meta.titleTa : meta.titleEn;
  const description = language === 'ta' ? meta.descTa : meta.descEn;

  const roles: { id: 'tourist' | 'responder' | 'administrator'; label: string; badge: string }[] = [
    { id: 'tourist', label: 'Civilian', badge: 'Public' },
    { id: 'responder', label: 'First Reporter', badge: 'Field' },
    { id: 'administrator', label: 'Admin Portal', badge: 'Master' },
  ];

  return (
    <header className={`shrink-0 z-20 border-b transition-colors duration-150 px-4 py-2.5 select-none glass-header ${
      theme === 'dark'
        ? 'bg-[#0d1322]/95 border-slate-800 text-slate-100'
        : 'text-slate-800'
    }`}>
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile hamburger + Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobile}
            className={`md:hidden p-1.5 rounded-lg border transition ${
              theme === 'dark'
                ? 'border-slate-800 bg-slate-900 text-slate-300'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className={`font-bold text-sm md:text-base truncate tracking-tight ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                {title}
              </h1>
              {isSimulated && (
                <span className="hidden sm:inline text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                  DRILL SIMULATION
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Only Language Switcher, Profile Name, and SOS Button */}
        <div className="flex items-center gap-2.5">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition cursor-pointer shadow-2xs"
            title="Toggle Language (English / தமிழ்)"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-mono text-black font-black">{language === 'en' ? 'EN' : 'தமிழ்'}</span>
          </button>

          {/* Profile Name (Non-dropdown as requested) */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-black shadow-2xs">
            <User className="w-3.5 h-3.5 text-black" />
            <span className="text-xs font-bold text-black truncate max-w-[120px] sm:max-w-none">
              {user?.full_name || 'Arun Kumar'}
            </span>
          </div>

          {/* Emergency SOS Quick Button */}
          <button
            onClick={onOpenSos}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black shadow-md shadow-rose-600/25 transition cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>SOS</span>
          </button>
        </div>
      </div>
    </header>
  );
};
