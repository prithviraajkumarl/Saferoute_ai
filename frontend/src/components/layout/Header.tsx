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
  '/dashboard': {
    titleEn: 'Command Center Overview',
    titleTa: 'கட்டளை மைய பொதுப் பார்வை',
    descEn: 'Disaster intelligence, live metrics & civil emergency telemetry',
    descTa: 'பேரிடர் நுண்ணறிவு, நேரலை அளவீடுகள் & கள அவசர நிலவரம்',
  },
  '/navigation': {
    titleEn: 'Safe Route Navigation',
    titleTa: 'பாதுகாப்பான வழிசெலுத்தல்',
    descEn: 'Hazard-buffered multi-corridor route risk assessment',
    descTa: 'இடர் காரணிகளை தவிர்த்த பல வழித்தட கணிப்பு',
  },
  '/weather': {
    titleEn: 'Weather Intelligence Center',
    titleTa: 'வானிலை நுண்ணறிவு மையம்',
    descEn: 'Doppler precipitation radar, wind vector streamlines & temperature heatmaps',
    descTa: 'டாப்ளர் ரேடார், காற்று திசை & வெப்பநிலை வரைபடங்கள்',
  },
  '/incidents': {
    titleEn: 'Hazard & Incident Telemetry',
    titleTa: 'கள இடர்கள் & சம்பவங்கள்',
    descEn: 'Verified community reports, roadway closures & drainage bottlenecks',
    descTa: 'உறுதிப்படுத்தப்பட்ட கள இடர்கள், சாலை அடைப்புகள் & வடிகால் சிக்கல்கள்',
  },
  '/response': {
    titleEn: 'SOS & Responder Triage',
    titleTa: 'அவசர SOS & மீட்பு பணி',
    descEn: 'Citizen SOS tracking, responder triage lifecycle & private coordination notes',
    descTa: 'குடிமக்கள் SOS கண்காணிப்பு & மீட்புக் குழுவினர் ஒருங்கிணைப்பு',
  },
  '/relief-centers': {
    titleEn: 'Relief Centers & Shelters',
    titleTa: 'நிவாரண முகாம்கள் & புகலிடங்கள்',
    descEn: 'Civil defense cyclone camps, current occupancy & medical amenities',
    descTa: 'அரசு பேரிடர் நிவாரண முகாம்கள் & மருத்துவ வசதிகள்',
  },
  '/system': {
    titleEn: 'System Health & Risk Policy',
    titleTa: 'கணினி இயக்கம் & இடர் கொள்கை',
    descEn: 'Backend readiness, database latency & deterministic v2.4.0 spatial policy',
    descTa: 'சர்வர் இயக்கம் & v2.4.0 புவியியல் இடர் மதிப்பீட்டுக் கொள்கை',
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

  const meta = PAGE_METADATA[location.pathname] || PAGE_METADATA['/dashboard'];
  const title = language === 'ta' ? meta.titleTa : meta.titleEn;
  const description = language === 'ta' ? meta.descTa : meta.descEn;

  const roles: { id: 'tourist' | 'responder' | 'administrator'; label: string; badge: string }[] = [
    { id: 'tourist', label: 'Civilian / Tourist', badge: 'Public' },
    { id: 'responder', label: 'First Responder', badge: 'Field' },
    { id: 'administrator', label: 'System Admin', badge: 'Root' },
  ];

  return (
    <header className={`shrink-0 z-20 border-b transition-colors duration-150 px-4 py-2.5 select-none ${
      theme === 'dark'
        ? 'bg-[#0d1322]/95 border-slate-800 text-slate-100'
        : 'bg-white/90 backdrop-blur-md border-slate-200 text-slate-800 shadow-2xs'
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
            <p className={`hidden sm:block text-[11px] truncate ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              {description}
            </p>
          </div>
        </div>

        {/* Right: Controls & Badges */}
        <div className="flex items-center gap-2">
          {/* Live System Health Indicator */}
          <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
            backendStatus === 'READY'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              backendStatus === 'READY' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`} />
            <span>{backendStatus === 'READY' ? 'BACKEND READY' : 'RECONNECTING'}</span>
            {dbLatency && <span className="opacity-70 text-[10px]">({dbLatency}ms)</span>}
          </div>

          {/* Theme Switcher (Dark Command Center vs Light Frosted Glass) */}
          <button
            onClick={toggleTheme}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-800/80 border-slate-700 text-amber-400 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className={`flex items-center gap-1 px-2 py-1 rounded-xl border text-xs font-semibold transition cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title="Toggle Language (English / தமிழ்)"
          >
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-mono">{language === 'en' ? 'EN' : 'தமிழ்'}</span>
          </button>

          {/* Role Persona Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                role === 'tourist'
                  ? theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-blue-600/20 border-blue-500/40 text-blue-400'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">
                {role === 'tourist'
                  ? 'Civilian'
                  : role === 'responder'
                  ? 'Responder'
                  : 'Admin'}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showRoleMenu && (
              <div
                className={`absolute right-0 mt-2 w-48 py-1.5 rounded-2xl border shadow-xl z-50 text-xs ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-700 text-slate-200'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/50">
                  Switch Role / Persona
                </div>
                {roles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      switchPersona(r.id);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-blue-600/10 transition cursor-pointer ${
                      role === r.id ? 'font-bold text-blue-500' : ''
                    }`}
                  >
                    <span>{r.label}</span>
                    <span className="text-[10px] opacity-60 font-mono">{r.badge}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Emergency SOS Quick Button */}
          <button
            onClick={onOpenSos}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-md shadow-rose-600/25 transition cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>SOS</span>
          </button>
        </div>
      </div>
    </header>
  );
};
