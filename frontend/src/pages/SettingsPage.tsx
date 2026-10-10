import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Key,
  Save,
  Check,
  AlertTriangle,
  Shield,
  ExternalLink,
  ArrowLeft,
  Eye,
  EyeOff,
  Info,
  Globe,
  Cloud,
  Map,
  Sparkles,
} from 'lucide-react';

interface ApiKeyConfig {
  key: string;
  label: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  helpUrl: string;
  placeholder: string;
  required: boolean;
}

const API_KEYS: ApiKeyConfig[] = [
  {
    key: 'OPENWEATHERMAP_API_KEY',
    label: 'OpenWeatherMap API Key',
    description: 'Powers temperature, radar, precipitation, and wind map layers. Free tier available.',
    icon: Cloud,
    helpUrl: 'https://openweathermap.org/appid',
    placeholder: 'e.g. a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
    required: true,
  },
  {
    key: 'GEMINI_API_KEY',
    label: 'Google Gemini API Key',
    description: 'Powers the AI chatbot for disaster safety guidance and multilingual support.',
    icon: Sparkles,
    helpUrl: 'https://aistudio.google.com/app/apikey',
    placeholder: 'e.g. AIzaSy...',
    required: false,
  },
  {
    key: 'GOOGLE_MAPS_API_KEY',
    label: 'Google Maps API Key (Optional)',
    description: 'Enhanced map tiles and geocoding. App works with OpenStreetMap if not provided.',
    icon: Map,
    helpUrl: 'https://console.cloud.google.com/apis/credentials',
    placeholder: 'e.g. AIzaSy...',
    required: false,
  },
];

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [values, setValues] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const loaded: Record<string, string> = {};
    API_KEYS.forEach((ak) => {
      loaded[ak.key] = localStorage.getItem(`saferoute_${ak.key}`) || '';
    });
    setValues(loaded);
  }, []);

  const handleSave = () => {
    API_KEYS.forEach((ak) => {
      const val = values[ak.key]?.trim() || '';
      if (val) {
        localStorage.setItem(`saferoute_${ak.key}`, val);
      } else {
        localStorage.removeItem(`saferoute_${ak.key}`);
      }
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleVisibility = (key: string) => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      className="min-h-screen p-6 relative"
      style={{
        background: 'linear-gradient(160deg, #dbeafe 0%, #bfdbfe 20%, #bae6fd 40%, #e0f2fe 60%, #d1fae5 85%, #ecfdf5 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute rounded-full" style={{
          width: 400, height: 400, top: '10%', right: '-5%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)',
          animation: 'float 10s ease-in-out infinite',
        }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto pt-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="btn-glass text-xs mb-6 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', boxShadow: '0 8px 32px rgba(14,165,233,0.3)' }}
          >
            <Settings className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-black text-2xl text-slate-900">API Configuration</h1>
          <p className="text-slate-500 text-sm mt-1">
            Configure your API keys to enable weather layers and AI features.
          </p>
        </div>

        {/* Info Banner */}
        <div
          className="rounded-2xl p-4 mb-6 flex items-start gap-3"
          style={{
            background: 'rgba(14,165,233,0.06)',
            border: '1px solid rgba(14,165,233,0.15)',
          }}
        >
          <Info className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
          <div className="text-sm text-sky-800">
            <strong>Keys are stored locally</strong> in your browser's localStorage. They are never
            sent to any server. Get free API keys from the links provided below each field.
          </div>
        </div>

        {/* API Key Cards */}
        <div className="space-y-4">
          {API_KEYS.map((ak) => {
            const Icon = ak.icon;
            const isVisible = visible[ak.key] || false;
            const hasValue = (values[ak.key] || '').trim().length > 0;

            return (
              <div
                key={ak.key}
                className="rounded-2xl p-5"
                style={{
                  background: 'rgba(255,255,255,0.78)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  border: hasValue ? '1.5px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.7)',
                  boxShadow: '0 4px 24px rgba(14,165,233,0.06)',
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: hasValue ? 'rgba(16,185,129,0.1)' : 'rgba(14,165,233,0.08)',
                    }}
                  >
                    <Icon className={`w-4.5 h-4.5 ${hasValue ? 'text-emerald-500' : 'text-sky-500'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">{ak.label}</span>
                      {ak.required && (
                        <span className="badge-warning text-[10px]">Required</span>
                      )}
                      {hasValue && (
                        <span className="badge-success text-[10px]">Configured</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{ak.description}</p>
                  </div>
                </div>

                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type={isVisible ? 'text' : 'password'}
                    value={values[ak.key] || ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, [ak.key]: e.target.value }))}
                    placeholder={ak.placeholder}
                    className="glass-input pl-9 pr-10 text-xs font-mono"
                  />
                  <button
                    onClick={() => toggleVisibility(ak.key)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={isVisible ? 'Hide key' : 'Show key'}
                  >
                    {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <a
                  href={ak.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 mt-2 font-medium"
                >
                  Get API key
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            );
          })}
        </div>

        {/* Save Button */}
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleSave}
            className="btn-primary py-3.5 px-8 rounded-2xl flex items-center gap-2"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved Successfully!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Configuration
              </>
            )}
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn-glass py-3 px-6 rounded-2xl"
          >
            Cancel
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-10 pb-8">
          <div
            className="rounded-2xl p-5"
            style={{
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.6)',
            }}
          >
            <h3 className="font-bold text-sm text-slate-700 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-500" />
              APIs Used in This Application
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
              {[
                { name: 'OpenWeatherMap', use: 'Weather data, temperature, radar tiles' },
                { name: 'Open-Meteo', use: 'Forecast data, flood risk assessment (no key needed)' },
                { name: 'OpenStreetMap', use: 'Base map tiles (free, no key needed)' },
                { name: 'Google Gemini', use: 'AI chatbot for disaster guidance' },
                { name: 'Leaflet.js', use: 'Interactive map rendering (client-side)' },
                { name: 'FastAPI Backend', use: 'Route risk engine, hazard DB, SOS' },
              ].map((api) => (
                <div
                  key={api.name}
                  className="p-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(203,213,225,0.3)' }}
                >
                  <div className="font-semibold text-slate-800">{api.name}</div>
                  <div className="text-slate-500 text-[11px]">{api.use}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
