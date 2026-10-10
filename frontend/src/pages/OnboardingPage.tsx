import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  Navigation,
  ArrowRight,
  ArrowLeft,
  Crosshair,
  Check,
  Shield,
  Loader2,
  Search,
} from 'lucide-react';
import { TAMIL_NADU_LOCATIONS, TamilNaduLocation } from '../data/tamilNaduLocations';

type Step = 'name' | 'location' | 'destination';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('name');
  const [userName, setUserName] = useState('');
  const [locationGranted, setLocationGranted] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [locating, setLocating] = useState(false);
  const [destinationSearch, setDestinationSearch] = useState('');
  const [selectedDest, setSelectedDest] = useState<TamilNaduLocation | null>(null);

  // Get filtered location suggestions
  const filteredLocations = TAMIL_NADU_LOCATIONS.filter((loc) =>
    loc.name.toLowerCase().includes(destinationSearch.toLowerCase()) ||
    (loc.district && loc.district.toLowerCase().includes(destinationSearch.toLowerCase()))
  ).slice(0, 8);

  const requestLocation = () => {
    setLocating(true);
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationGranted(true);
        setLocating(false);
      },
      (err) => {
        setLocationError('Location access denied. You can still select a location manually.');
        setLocating(false);
        // Fall back to Chennai
        setUserCoords({ lat: 13.0827, lng: 80.2707 });
        setLocationGranted(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleNavigate = () => {
    if (!userCoords || !selectedDest) return;
    // Store user info in sessionStorage for the NavigationPage
    sessionStorage.setItem('saferoute_user', JSON.stringify({
      name: userName,
      origin: userCoords,
      destination: { lat: selectedDest.lat, lng: selectedDest.lng, name: selectedDest.name },
    }));
    navigate('/app/navigation');
  };

  const stepIndex = step === 'name' ? 0 : step === 'location' ? 1 : 2;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative"
      style={{
        background: 'linear-gradient(160deg, #dbeafe 0%, #bfdbfe 20%, #bae6fd 40%, #e0f2fe 60%, #d1fae5 85%, #ecfdf5 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute rounded-full"
          style={{
            width: 500, height: 500, top: '-5%', right: '-5%',
            background: 'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)',
            animation: 'float 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 400, height: 400, bottom: '5%', left: '-5%',
            background: 'radial-gradient(circle, rgba(167,243,208,0.2) 0%, transparent 70%)',
            animation: 'float 10s ease-in-out infinite reverse',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', boxShadow: '0 8px 32px rgba(14,165,233,0.3)' }}
          >
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-black text-2xl text-slate-900">SafeRoute<span className="text-sky-500">.AI</span></h1>
          <p className="text-slate-500 text-sm mt-1">Let's plan your safe journey</p>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {['Your Name', 'Location', 'Destination'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  i < stepIndex
                    ? 'step-indicator-done text-white'
                    : i === stepIndex
                    ? 'step-indicator-active text-white'
                    : 'step-indicator-pending text-slate-400'
                }`}
              >
                {i < stepIndex ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < 2 && (
                <div
                  className="w-8 h-0.5 rounded-full transition-all duration-300"
                  style={{ background: i < stepIndex ? '#10b981' : 'rgba(203,213,225,0.5)' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-8 wizard-step"
          style={{
            background: 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.75)',
            boxShadow: '0 24px 80px rgba(14,165,233,0.12), 0 8px 24px rgba(0,0,0,0.06)',
          }}
          key={step}
        >
          {/* ── STEP 1: NAME ── */}
          {step === 'name' && (
            <div>
              <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center mb-5">
                <User className="w-6 h-6 text-sky-500" />
              </div>
              <h2 className="font-bold text-xl text-slate-900 mb-2">What's your name?</h2>
              <p className="text-slate-500 text-sm mb-6">We'll personalize your safety experience.</p>

              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="glass-input mb-6"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && userName.trim() && setStep('location')}
              />

              <button
                onClick={() => setStep('location')}
                disabled={!userName.trim()}
                className="w-full btn-primary py-3.5 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── STEP 2: LOCATION ── */}
          {step === 'location' && (
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-5">
                <Crosshair className="w-6 h-6 text-emerald-500" />
              </div>
              <h2 className="font-bold text-xl text-slate-900 mb-2">
                Hi {userName}! Where are you?
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                Allow GPS access for accurate routing, or we'll default to Chennai.
              </p>

              {!locationGranted ? (
                <button
                  onClick={requestLocation}
                  disabled={locating}
                  className="w-full btn-primary py-3.5 rounded-2xl flex items-center justify-center gap-2 mb-4"
                >
                  {locating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Detecting location...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4" />
                      Allow Location Access
                    </>
                  )}
                </button>
              ) : (
                <div
                  className="rounded-2xl p-4 mb-6 flex items-center gap-3"
                  style={{
                    background: 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(16,185,129,0.2)',
                  }}
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-emerald-700">Location detected</div>
                    <div className="text-xs text-emerald-600/80">
                      {userCoords?.lat.toFixed(4)}°N, {userCoords?.lng.toFixed(4)}°E
                    </div>
                  </div>
                </div>
              )}

              {locationError && (
                <p className="text-amber-600 text-xs mb-4 bg-amber-50 rounded-xl p-3 border border-amber-100">
                  ⚠️ {locationError}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('name')}
                  className="btn-glass py-3 px-4 rounded-2xl flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={() => setStep('destination')}
                  disabled={!locationGranted}
                  className="flex-1 btn-primary py-3.5 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: DESTINATION ── */}
          {step === 'destination' && (
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5">
                <Navigation className="w-6 h-6 text-indigo-500" />
              </div>
              <h2 className="font-bold text-xl text-slate-900 mb-2">
                Where do you want to go?
              </h2>
              <p className="text-slate-500 text-sm mb-5">
                Search for a destination in Tamil Nadu.
              </p>

              <div className="relative mb-4">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={destinationSearch}
                  onChange={(e) => {
                    setDestinationSearch(e.target.value);
                    setSelectedDest(null);
                  }}
                  placeholder="Search landmarks, cities..."
                  className="glass-input pl-10"
                  autoFocus
                />
              </div>

              {/* Selected destination display */}
              {selectedDest && (
                <div
                  className="rounded-2xl p-4 mb-4 flex items-center gap-3"
                  style={{
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)',
                  }}
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-indigo-700">{selectedDest.name}</div>
                    <div className="text-xs text-indigo-600/70">
                      {selectedDest.district} · {selectedDest.lat.toFixed(4)}°N
                    </div>
                  </div>
                </div>
              )}

              {/* Suggestions list */}
              {!selectedDest && destinationSearch.length > 0 && (
                <div
                  className="rounded-2xl overflow-hidden mb-4 max-h-52 overflow-y-auto custom-scrollbar"
                  style={{
                    background: 'rgba(255,255,255,0.8)',
                    border: '1px solid rgba(203,213,225,0.5)',
                  }}
                >
                  {filteredLocations.length === 0 ? (
                    <div className="p-4 text-sm text-slate-400 text-center">No locations found</div>
                  ) : (
                    filteredLocations.map((loc) => (
                      <button
                        key={loc.name}
                        onClick={() => {
                          setSelectedDest(loc);
                          setDestinationSearch(loc.name);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-sky-50/80 transition-colors text-sm border-b last:border-b-0 border-slate-100 cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900 truncate">{loc.name}</div>
                          {loc.district && (
                            <div className="text-xs text-slate-400 truncate">{loc.district}</div>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Quick picks */}
              {!selectedDest && destinationSearch.length === 0 && (
                <div className="mb-5">
                  <p className="text-xs text-slate-400 font-semibold mb-2 uppercase tracking-wider">Popular Destinations</p>
                  <div className="grid grid-cols-2 gap-2">
                    {TAMIL_NADU_LOCATIONS.slice(0, 6).map((loc) => (
                      <button
                        key={loc.name}
                        onClick={() => {
                          setSelectedDest(loc);
                          setDestinationSearch(loc.name);
                        }}
                        className="text-left px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer hover:scale-[1.02]"
                        style={{
                          background: 'rgba(255,255,255,0.7)',
                          border: '1px solid rgba(203,213,225,0.4)',
                        }}
                      >
                        <div className="font-semibold text-slate-700 truncate">{loc.name}</div>
                        {loc.district && (
                          <div className="text-[10px] text-slate-400 truncate">{loc.district}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('location')}
                  className="btn-glass py-3 px-4 rounded-2xl flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={handleNavigate}
                  disabled={!selectedDest}
                  className="flex-1 btn-primary py-3.5 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Navigation className="w-4 h-4" />
                  Get Safe Route
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Your location data is processed locally and never stored on external servers.
        </p>
      </div>
    </div>
  );
};
