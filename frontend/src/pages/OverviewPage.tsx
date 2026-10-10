import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Navigation,
  ArrowRight,
  RefreshCw,
  PhoneCall,
  Car,
  CloudSun,
  Shield,
  Wind,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { EmergencyContactsModal } from '../components/EmergencyContactsModal';
import { CycloneSimulatorModal } from '../components/CycloneSimulatorModal';

interface OverviewPageProps {
  onOpenSos?: () => void;
  onOpenReportHazard?: () => void;
  onOpenSimulation?: () => void;
  isSimulated?: boolean;
}

export const OverviewPage: React.FC<OverviewPageProps> = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [lastUpdated, setLastUpdated] = useState<string>('Just now');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showContactsModal, setShowContactsModal] = useState<boolean>(false);
  const [showCycloneModal, setShowCycloneModal] = useState<boolean>(false);

  const currentArea = {
    name: 'Mevalurkuppam',
    district: 'Sriperumbudur, Tamil Nadu',
    coords: '13.0189° N, 80.0102° E',
    status: 'Safe',
    details: 'Clear roads • No flood risk • Normal traffic flow',
  };

  const weatherOverview = {
    today: {
      date: 'Today',
      temp: '32°C',
      feels: '38°C',
      condition: 'Partly Cloudy',
      rain: '1%',
      humidity: '63%',
      wind: '19 km/h',
    },
    tomorrow: {
      date: 'Tomorrow',
      temp: '34°C / 26°C',
      feels: '41°C',
      condition: 'Rain & Heat',
      rain: '70%',
      timing: 'From 4 PM',
    },
  };

  const nearbyIncidents = [
    {
      id: 'inc-1',
      title: 'NH48 Sriperumbudur Highway',
      desc: 'Two-wheeler collision • Single lane slowdown',
      distance: '1.8 km',
      severity: 'Minor Delay',
      source: 'Twitter Traffic Feed',
    },
    {
      id: 'inc-2',
      title: 'Mevalurkuppam Underpass',
      desc: 'Water accumulation • Slow passage',
      distance: '3.2 km',
      severity: 'Caution',
      source: 'Community Report',
    },
    {
      id: 'inc-3',
      title: 'Poonamallee High Road',
      desc: 'Stalled vehicle • Right lane blocked',
      distance: '4.7 km',
      severity: 'Moderate',
      source: 'News API',
    },
    {
      id: 'inc-4',
      title: 'Chembarambakkam Stretch',
      desc: 'Culvert maintenance • Diversion in place',
      distance: '6.1 km',
      severity: 'Diversion',
      source: 'Official Bulletin',
    },
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdated('Just now');
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div className="min-h-full text-slate-900 p-4 md:p-8 max-w-5xl mx-auto space-y-6 font-sans">
      {/* ── TOP HEADER ── */}
      <header className="border-b border-slate-200/80 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-900 inline-block" />
            <h1 className="text-2xl md:text-3xl font-black text-black tracking-tight">
              Overview
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowCycloneModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer shadow-sm"
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Cyclone Simulator</span>
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:border-black text-black text-xs font-bold transition cursor-pointer bg-white/80 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{lastUpdated}</span>
          </button>
          <button
            onClick={() => navigate('/app/navigation')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Navigate</span>
          </button>
        </div>
      </header>

      {/* ── AREA STATUS ── */}
      <section className="bg-white/85 backdrop-blur-xl border border-white/90 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-slate-100 text-black flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <h2 className="text-base font-black text-black">Area Status</h2>
          </div>
          <span className="px-3 py-0.5 rounded-full bg-black text-white text-xs font-bold">
            {currentArea.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div>
            <div className="text-sm font-bold text-black">{currentArea.name}</div>
            <div className="text-xs text-slate-700">{currentArea.district}</div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">{currentArea.coords}</div>
          </div>

          <div className="md:col-span-2 border-t md:border-t-0 md:border-l border-slate-200 md:pl-5 pt-2 md:pt-0">
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Condition</div>
            <div className="text-xs font-semibold text-slate-900">
              {currentArea.details}
            </div>
          </div>
        </div>
      </section>

      {/* ── WEATHER ── */}
      <section className="space-y-3">
        <h2 className="text-base font-black text-black">Weather</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Today */}
          <div className="bg-white/85 backdrop-blur-xl border border-white/90 rounded-3xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black text-black">{weatherOverview.today.date}</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-black text-[11px] font-bold">
                Rain: {weatherOverview.today.rain}
              </span>
            </div>

            <div>
              <div className="text-3xl font-black text-black mb-0.5">
                {weatherOverview.today.temp}
              </div>
              <div className="text-xs font-bold text-slate-800">
                {weatherOverview.today.condition} • Feels {weatherOverview.today.feels}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-900 border-t border-slate-100 pt-2 font-medium">
              <div>
                <span className="text-slate-500 block text-[11px]">Wind</span>
                <span className="font-bold text-black">{weatherOverview.today.wind}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Humidity</span>
                <span className="font-bold text-black">{weatherOverview.today.humidity}</span>
              </div>
            </div>
          </div>

          {/* Tomorrow */}
          <div className="bg-white/85 backdrop-blur-xl border border-white/90 rounded-3xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black text-black">{weatherOverview.tomorrow.date}</span>
              <span className="px-2 py-0.5 rounded-full bg-black text-white text-[11px] font-bold">
                Rain: {weatherOverview.tomorrow.rain}
              </span>
            </div>

            <div>
              <div className="text-3xl font-black text-black mb-0.5">
                {weatherOverview.tomorrow.temp}
              </div>
              <div className="text-xs font-bold text-slate-800">
                {weatherOverview.tomorrow.condition} • Feels {weatherOverview.tomorrow.feels}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-900 border-t border-slate-100 pt-2 font-medium">
              <div>
                <span className="text-slate-500 block text-[11px]">Rain Timing</span>
                <span className="font-bold text-black">{weatherOverview.tomorrow.timing}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Peak Heat</span>
                <span className="font-bold text-black">{weatherOverview.tomorrow.feels}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ROAD INCIDENTS ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-black">Road Incidents</h2>
          <span className="text-xs font-bold text-black bg-slate-100 px-2.5 py-0.5 rounded-full">
            {nearbyIncidents.length} Reports
          </span>
        </div>

        <div className="bg-white/85 backdrop-blur-xl border border-white/90 rounded-3xl divide-y divide-slate-100 overflow-hidden shadow-sm">
          {nearbyIncidents.map((inc) => (
            <div key={inc.id} className="p-3.5 hover:bg-slate-50/70 transition flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-black truncate">{inc.title}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({inc.distance})</span>
                </div>
                <div className="text-xs text-slate-700 mt-0.5">{inc.desc}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-medium">{inc.source}</div>
              </div>

              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-black border border-slate-200 shrink-0">
                {inc.severity}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM ACTIONS: EMERGENCY CONTACTS & NAVIGATE ── */}
      <footer className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
        <button
          onClick={() => setShowContactsModal(true)}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-black hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Emergency Contacts (Police, Fire, Ambulance, Disaster)</span>
        </button>

        <button
          onClick={() => navigate('/app/navigation')}
          className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
        >
          <span>Navigate</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </footer>

      {/* Emergency Contacts Modal */}
      <EmergencyContactsModal
        isOpen={showContactsModal}
        onClose={() => setShowContactsModal(false)}
      />

      {/* AI Cyclone Simulator Modal */}
      <CycloneSimulatorModal
        isOpen={showCycloneModal}
        onClose={() => setShowCycloneModal(false)}
      />
    </div>
  );
};
