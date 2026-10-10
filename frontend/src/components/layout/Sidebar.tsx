import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Navigation,
  CloudSun,
  AlertTriangle,
  Radio,
  Building2,
  Server,
  ChevronLeft,
  ChevronRight,
  Shield,
  PhoneCall,
  Sparkles,
  X,
} from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { useTheme } from '../../context/ThemeContext';
import { EmergencyContactsModal } from '../EmergencyContactsModal';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  isSimulated?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  isSimulated = false,
}) => {
  const { language } = useI18n();
  const { theme } = useTheme();

  const [showContactsModal, setShowContactsModal] = useState(false);

  const navItems = [
    {
      to: '/app/dashboard',
      icon: LayoutDashboard,
      labelEn: 'Overview',
      labelTa: 'பொதுப் பார்வை',
      descEn: 'Status & weather',
      descTa: 'பகுதி நிலை',
      badge: null,
    },
    {
      to: '/app/navigation',
      icon: Navigation,
      labelEn: 'Navigate',
      labelTa: 'வழிசெலுத்தல்',
      descEn: '3D road navigation',
      descTa: 'சாலை வழிகாட்டல்',
      badge: '3D',
    },
    {
      to: '/app/relief-centers',
      icon: Building2,
      labelEn: 'Relief Centers',
      labelTa: 'நிவாரண முகாம்கள்',
      descEn: 'Shelters & camps',
      descTa: 'முகாம்கள்',
      badge: null,
    },
    {
      to: '/app/response',
      icon: Radio,
      labelEn: 'Emergency SOS',
      labelTa: 'அவசர உதவி',
      descEn: 'Alerts & response',
      descTa: 'அவசர உதவி',
      badge: 'SOS',
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className={`p-4 border-b flex items-center justify-between ${
        theme === 'dark' ? 'border-slate-800' : 'border-slate-200/80'
      }`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className={`font-black text-sm tracking-tight ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  SafeRoute<span className="text-blue-500 font-extrabold">.AI</span>
                </span>
                {isSimulated && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                    DRILL
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const label = language === 'ta' ? item.labelTa : item.labelEn;
          const desc = language === 'ta' ? item.descTa : item.descEn;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) => `
                group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150
                ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm shadow-blue-500/10'
                      : 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs font-bold'
                    : theme === 'dark'
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                }
              `}
              title={isCollapsed ? label : undefined}
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                    isActive
                      ? theme === 'dark'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-blue-600 text-white'
                      : theme === 'dark'
                      ? 'bg-slate-800/80 text-slate-400 group-hover:text-slate-200'
                      : 'bg-slate-100 text-slate-500 group-hover:text-slate-800'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate font-semibold text-xs">{label}</span>
                        {item.badge && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                            item.badge === 'LIVE'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : item.badge === 'SOS'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Emergency Hotline Quick Access */}
      {!isCollapsed && (
        <div className={`p-3 m-3 rounded-xl border text-[11px] space-y-2 ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-800 text-slate-200'
            : 'bg-slate-50 border-slate-200 text-black'
        }`}>
          <div className="flex items-center justify-between font-bold text-xs">
            <span className="flex items-center gap-1.5 text-black">
              <PhoneCall className="w-3.5 h-3.5 text-black" />
              <span>Emergency Hotlines</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center font-mono">
            <a
              href="tel:108"
              className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-black font-bold text-xs transition"
            >
              108 Medical
            </a>
            <a
              href="tel:1070"
              className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-black font-bold text-xs transition"
            >
              1070 Disaster
            </a>
          </div>
        </div>
      )}

      {/* Emergency Contacts Button & Footer Toggle */}
      <div className={`p-3 border-t space-y-2 ${
        theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-200/80 text-slate-500'
      }`}>
        <button
          onClick={() => setShowContactsModal(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 text-xs font-bold transition cursor-pointer"
        >
          <PhoneCall className="w-3.5 h-3.5 text-blue-900" />
          {!isCollapsed && <span>Emergency Contacts</span>}
        </button>

        <div className="flex items-center justify-end">
          <button
            onClick={onToggleCollapse}
            className={`hidden md:flex p-1.5 rounded-lg transition ${
              theme === 'dark' ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600'
            }`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <EmergencyContactsModal
        isOpen={showContactsModal}
        onClose={() => setShowContactsModal(false)}
      />
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block shrink-0 transition-all duration-200 z-30 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          theme === 'dark'
            ? 'bg-[#0b101d] border-r border-slate-800 text-slate-100'
            : 'glass-sidebar text-slate-800'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <aside
            className={`relative w-72 max-w-[85vw] h-full shadow-2xl z-50 ${
              theme === 'dark'
                ? 'bg-[#0b101d] border-r border-slate-800 text-slate-100'
                : 'bg-white text-slate-800'
            }`}
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
