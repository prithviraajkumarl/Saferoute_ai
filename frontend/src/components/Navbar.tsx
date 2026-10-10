import React, { useState, useEffect } from 'react';
import { Shield, Radio, Globe, AlertTriangle, UserCheck, Flame, Compass, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openSos: () => void;
  openProtocols: () => void;
  openSimulation: () => void;
  isSimulated: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openSos,
  openProtocols,
  openSimulation,
  isSimulated,
}) => {
  const { user, role, switchPersona } = useAuth();
  const { language, toggleLanguage, t } = useI18n();
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 py-2.5 shadow-xs font-sans text-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-lg text-slate-900">
                SafeRoute <span className="text-blue-600">India</span>
              </span>
              <span className="text-[10px] tracking-wide px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-semibold">
                Tamil Nadu
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              {t('app_subtitle')}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('routes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'routes'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            {t('nav_routes')}
          </button>

          <button
            onClick={() => setActiveTab('shelters')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'shelters'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            {t('nav_shelters')}
          </button>

          {role !== 'tourist' && (
            <button
              onClick={() => setActiveTab('triage')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'triage'
                  ? 'bg-white text-amber-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              {t('nav_triage')}
            </button>
          )}

          <button
            onClick={openProtocols}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            title="Emergency Safety Protocols"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t('nav_protocols')}</span>
          </button>
        </nav>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          {/* Clock */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] text-slate-700 font-medium">
            <Radio className="w-3 h-3 text-blue-600" />
            <span>{timeStr}</span>
          </div>

          {/* Drill simulation flag */}
          <button
            onClick={openSimulation}
            className={`px-2.5 py-1 rounded-full border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              isSimulated
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Flame className="w-3 h-3" />
            <span className="hidden sm:inline">Drill Mode</span>
          </button>

          {/* Persona quick switch */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-all cursor-pointer">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span className="capitalize">{role}</span>
            </button>
            <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 hidden group-hover:block z-50">
              <div className="text-[10px] text-slate-400 uppercase px-2 py-1 font-semibold">Switch Role</div>
              <button
                onClick={() => switchPersona('tourist')}
                className={`w-full text-left px-2 py-1 text-xs rounded-lg ${role === 'tourist' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                Tourist Mode
              </button>
              <button
                onClick={() => switchPersona('responder')}
                className={`w-full text-left px-2 py-1 text-xs rounded-lg ${role === 'responder' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                Responder Triage
              </button>
              <button
                onClick={() => switchPersona('administrator')}
                className={`w-full text-left px-2 py-1 text-xs rounded-lg ${role === 'administrator' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                Admin Command
              </button>
            </div>
          </div>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-all cursor-pointer"
            title="Toggle Tamil / English"
          >
            <Globe className="w-3 h-3 text-blue-600" />
            <span>{t('lang_toggle')}</span>
          </button>

          {/* Emergency SOS Quick Button */}
          <button
            onClick={openSos}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>SOS</span>
          </button>
        </div>
      </div>
    </header>
  );
};
