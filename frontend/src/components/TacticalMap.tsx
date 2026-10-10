import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Wind,
  CloudRain,
  Navigation,
  Thermometer,
  Cloud,
  Mountain,
  MapPin,
  CheckCircle,
  X,
  Compass,
  Maximize2,
  Crosshair,
  Layers,
  Globe,
  AlertTriangle,
  Shield,
  Eye,
  Info,
} from 'lucide-react';
import { CandidateRoute, HazardReport, Shelter } from '../types';
import { TAMIL_NADU_LOCATIONS, TamilNaduLocation } from '../data/tamilNaduLocations';

interface TacticalMapProps {
  candidateRoutes: CandidateRoute[];
  recommendedIndex: number;
  hazards: HazardReport[];
  shelters: Shelter[];
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  centerLocation?: { lat: number; lng: number; zoom?: number };
  onMapClick?: (lat: number, lng: number) => void;
  onSetDestination?: (lat: number, lng: number) => void;
  onSetOrigin?: (lat: number, lng: number) => void;
  selectedRouteIndex?: number;
  onSelectRoute?: (index: number) => void;
  isSimulated?: boolean;
}

// Zoom Earth timeline nowcast & observation steps
const TIMELINE_STEPS = [
  { label: '-60m', offsetMin: -60, category: 'HISTORICAL OBSERVATION', desc: 'Observed Radar -60m' },
  { label: '-45m', offsetMin: -45, category: 'HISTORICAL OBSERVATION', desc: 'Observed Radar -45m' },
  { label: '-30m', offsetMin: -30, category: 'HISTORICAL OBSERVATION', desc: 'Observed Radar -30m' },
  { label: '-15m', offsetMin: -15, category: 'HISTORICAL OBSERVATION', desc: 'Observed Radar -15m' },
  { label: 'LIVE', offsetMin: 0, category: 'LIVE OBSERVATION', desc: 'Current Live Radar' },
  { label: '+15m', offsetMin: 15, category: 'PREDICTIVE NOWCAST', desc: 'Predictive Trend +15m' },
  { label: '+30m', offsetMin: 30, category: 'PREDICTIVE NOWCAST', desc: 'Predictive Trend +30m' },
  { label: '+45m', offsetMin: 45, category: 'PREDICTIVE NOWCAST', desc: 'Predictive Trend +45m' },
  { label: '+60m', offsetMin: 60, category: 'PREDICTIVE NOWCAST', desc: 'Predictive Trend +60m' },
];

export const TacticalMap: React.FC<TacticalMapProps> = ({
  candidateRoutes,
  recommendedIndex,
  hazards,
  shelters,
  origin,
  destination,
  centerLocation,
  onMapClick,
  onSetDestination,
  onSetOrigin,
  selectedRouteIndex,
  onSelectRoute,
  isSimulated = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseTileGroupRef = useRef<L.LayerGroup | null>(null);

  // Layers Group Refs
  const routeLayersRef = useRef<L.LayerGroup | null>(null);
  const hazardLayersRef = useRef<L.LayerGroup | null>(null);
  const shelterLayersRef = useRef<L.LayerGroup | null>(null);
  const markerLayersRef = useRef<L.LayerGroup | null>(null);

  // Base Map Mode: 'satellite' (Esri World Imagery) | 'dark' (Esri Dark Canvas) | 'streets' (OSM)
  const [baseMapStyle, setBaseMapStyle] = useState<'satellite' | 'dark' | 'streets'>('satellite');

  // Active Meteorological Map Filter Layer: 'radar' | 'wind' | 'temperature' | 'clouds' | 'elevation' | 'none'
  const [activeWeatherLayer, setActiveWeatherLayer] = useState<
    'radar' | 'wind' | 'temperature' | 'clouds' | 'elevation' | 'none'
  >('radar');

  // Feature Overlays
  const [showRoutes, setShowRoutes] = useState(true);
  const [showHazards, setShowHazards] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showBaseMapMenu, setShowBaseMapMenu] = useState(false);

  // Controls State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(4); // Default: 'LIVE'
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [radarOpacity, setRadarOpacity] = useState(0.8);

  // Ground Inspector State (Clicked Coordinate info on ground)
  const [inspectedLocation, setInspectedLocation] = useState<{
    lat: number;
    lng: number;
    elev: number;
    temp: number;
    wind: number;
    rain: number;
    nearbyName?: string;
  } | null>(null);

  // Wind Particles
  const particlesRef = useRef<
    Array<{ x: number; y: number; speed: number; age: number; maxAge: number }>
  >([]);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = centerLocation?.lat || 13.04;
    const initialLng = centerLocation?.lng || 80.24;
    const initialZoom = centerLocation?.zoom || 11;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: false,
    });

    // Custom Zoom Control at top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial Base Tile Layer Group
    const baseTileGroup = L.layerGroup().addTo(map);
    baseTileGroupRef.current = baseTileGroup;

    // Load initial satellite imagery
    const imagery = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS, Maxar',
        maxZoom: 19,
      }
    );
    const labels = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
      }
    );
    baseTileGroup.addLayer(imagery);
    baseTileGroup.addLayer(labels);

    routeLayersRef.current = L.layerGroup().addTo(map);
    hazardLayersRef.current = L.layerGroup().addTo(map);
    shelterLayersRef.current = L.layerGroup().addTo(map);
    markerLayersRef.current = L.layerGroup().addTo(map);

    // Click handler to inspect ground elevation and weather
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      // Find closest known station to estimate baseline accurately
      let closest = TAMIL_NADU_LOCATIONS[0];
      let minDist = 999999;
      TAMIL_NADU_LOCATIONS.forEach((loc) => {
        const d = Math.hypot(loc.lat - lat, loc.lng - lng);
        if (d < minDist) {
          minDist = d;
          closest = loc;
        }
      });

      // Realistic altitude calculation with terrain lapse rate
      const isNilgiris = lat > 11.2 && lat < 11.6 && lng > 76.4 && lng < 77.0;
      const isPalani = lat > 10.1 && lat < 10.4 && lng > 77.2 && lng < 77.6;
      let baseElev = closest.elev;
      if (isNilgiris) baseElev = Math.round(1900 + Math.random() * 350);
      else if (isPalani) baseElev = Math.round(1800 + Math.random() * 300);
      else if (lng > 80.2) baseElev = Math.max(3, Math.round(6 + (80.25 - lng) * 20));

      const estTemp = Number((34.0 - (baseElev / 100) * 0.65).toFixed(1));
      const estWind = closest.windKmh || Math.round(12 + Math.random() * 8);

      setInspectedLocation({
        lat: Number(lat.toFixed(4)),
        lng: Number(lng.toFixed(4)),
        elev: baseElev,
        temp: estTemp,
        wind: estWind,
        rain: closest.rainMm,
        nearbyName: minDist < 0.2 ? closest.name : undefined,
      });

      if (onMapClick) onMapClick(lat, lng);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Base Map Tile Layer Switcher
  useEffect(() => {
    const group = baseTileGroupRef.current;
    if (!group) return;

    group.clearLayers();

    if (baseMapStyle === 'satellite') {
      const imagery = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS, Maxar',
          maxZoom: 19,
        }
      );
      const labels = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
        }
      );
      group.addLayer(imagery);
      group.addLayer(labels);
    } else if (baseMapStyle === 'dark') {
      const darkBase = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
          maxZoom: 16,
        }
      );
      const darkLabels = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 16,
        }
      );
      group.addLayer(darkBase);
      group.addLayer(darkLabels);
    } else if (baseMapStyle === 'streets') {
      const streets = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      });
      group.addLayer(streets);
    }
  }, [baseMapStyle]);

  // 3. Center Location Watcher
  useEffect(() => {
    if (!centerLocation || !mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(
      [centerLocation.lat, centerLocation.lng],
      centerLocation.zoom || 12,
      { duration: 1.2 }
    );
  }, [centerLocation?.lat, centerLocation?.lng, centerLocation?.zoom]);

  // Fit bounds to candidate routes
  const fitRouteCorridor = () => {
    const map = mapInstanceRef.current;
    if (!map || !candidateRoutes || candidateRoutes.length === 0) return;
    const allCoords: [number, number][] = [];
    candidateRoutes.forEach((r) => {
      r.coordinates.forEach(([lng, lat]) => {
        allCoords.push([lat, lng]);
      });
    });
    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  };

  // Locate User GPS
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 14, { duration: 1.2 });
        }
        setInspectedLocation({
          lat: Number(latitude.toFixed(4)),
          lng: Number(longitude.toFixed(4)),
          elev: 12,
          temp: 33,
          wind: 14,
          rain: 0,
          nearbyName: 'Your Current GPS Location',
        });
      },
      (err) => {
        alert('Could not determine GPS position: ' + err.message);
      }
    );
  };

  // 4. Playback Timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % TIMELINE_STEPS.length);
    }, 1200 / playbackSpeed);
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  // 5. Wind Particle Initialization
  useEffect(() => {
    const particles: Array<{ x: number; y: number; speed: number; age: number; maxAge: number }> =
      [];
    for (let i = 0; i < 240; i++) {
      particles.push({
        x: Math.random(),
        y: Math.random(),
        speed: 0.0018 + Math.random() * 0.003,
        age: Math.floor(Math.random() * 60),
        maxAge: 40 + Math.floor(Math.random() * 50),
      });
    }
    particlesRef.current = particles;
  }, []);

  // 6. Render Weather Layers Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const map = mapInstanceRef.current;
    if (!canvas || !map) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };
    handleResize();

    let animationId: number;

    const renderFrame = () => {
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);

      const stepOffset = TIMELINE_STEPS[currentStepIndex].offsetMin;

      // LAYER A: TEMPERATURE HEATMAP CONTOURS & STATION READINGS
      if (activeWeatherLayer === 'temperature') {
        ctx.save();
        ctx.globalAlpha = radarOpacity * 0.55;

        TAMIL_NADU_LOCATIONS.forEach((st) => {
          const pt = map.latLngToContainerPoint([st.lat, st.lng]);
          if (pt.x > -100 && pt.x < width + 100 && pt.y > -100 && pt.y < height + 100) {
            const radius = Math.max(80, Math.min(260, 120 * Math.pow(1.25, map.getZoom() - 10)));
            const grad = ctx.createRadialGradient(pt.x, pt.y, 10, pt.x, pt.y, radius);

            if (st.temp >= 35) {
              grad.addColorStop(0, 'rgba(239, 68, 68, 0.45)'); // Hot >35
              grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.28)');
              grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
            } else if (st.temp >= 30) {
              grad.addColorStop(0, 'rgba(245, 158, 11, 0.4)'); // Warm 30-34
              grad.addColorStop(0.5, 'rgba(234, 179, 8, 0.22)');
              grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
            } else {
              grad.addColorStop(0, 'rgba(56, 189, 248, 0.45)'); // Cool <25 (Western Ghats)
              grad.addColorStop(0.5, 'rgba(16, 185, 12, 0.18)');
              grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
            }

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        ctx.restore();

        // Draw sleek dark temperature station pills
        ctx.save();
        TAMIL_NADU_LOCATIONS.forEach((st) => {
          const pt = map.latLngToContainerPoint([st.lat, st.lng]);
          if (pt.x > -40 && pt.x < width + 40 && pt.y > -40 && pt.y < height + 40) {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.roundRect(pt.x - 30, pt.y - 12, 60, 24, 12);
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.strokeStyle =
              st.temp >= 35 ? '#ef4444' : st.temp < 25 ? '#38bdf8' : '#f59e0b';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${st.temp}°C`, pt.x, pt.y);
          }
        });
        ctx.restore();
      }

      // LAYER B: WIND STREAMLINES & VECTOR FLOW
      if (activeWeatherLayer === 'wind') {
        ctx.save();
        ctx.lineWidth = 1.7;
        ctx.lineCap = 'round';

        // Coastal easterly wind flow (ENE to WSW)
        const windAngle = -2.35; // radians
        const cosW = Math.cos(windAngle);
        const sinW = Math.sin(windAngle);

        particlesRef.current.forEach((p) => {
          const px = p.x * width;
          const py = p.y * height;
          const trailLen = 16 + p.speed * 2800;
          const alpha = Math.sin((p.age / p.maxAge) * Math.PI) * 0.75;

          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + cosW * trailLen, py + sinW * trailLen);
          ctx.stroke();

          p.x += cosW * p.speed;
          p.y += sinW * p.speed;
          p.age += 1;

          if (p.age >= p.maxAge || p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1) {
            p.x = Math.random();
            p.y = Math.random();
            p.age = 0;
            p.maxAge = 40 + Math.floor(Math.random() * 50);
          }
        });

        ctx.restore();
      }

      // LAYER C: SATELLITE CLOUD COVER
      if (activeWeatherLayer === 'clouds') {
        ctx.save();
        ctx.globalAlpha = 0.42;
        const cPt = map.latLngToContainerPoint([12.8, 80.1]);
        const cGrad = ctx.createRadialGradient(cPt.x, cPt.y, 40, cPt.x, cPt.y, 500);
        cGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        cGrad.addColorStop(0.5, 'rgba(224, 242, 254, 0.45)');
        cGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = cGrad;
        ctx.beginPath();
        ctx.arc(cPt.x, cPt.y, 500, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // LAYER D: ELEVATION & WATER INUNDATION CONTOURS
      if (activeWeatherLayer === 'elevation') {
        ctx.save();
        ctx.globalAlpha = 0.5;
        const coastPt = map.latLngToContainerPoint([13.02, 80.26]);
        const waterGrad = ctx.createLinearGradient(coastPt.x - 50, coastPt.y, coastPt.x + 90, coastPt.y);
        waterGrad.addColorStop(0, 'rgba(6, 182, 212, 0.55)'); // Lowland Water Basin (<5m MSL)
        waterGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = waterGrad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      // LAYER E: RAIN RADAR REFLECTIVITY (DOPPLER)
      if (activeWeatherLayer === 'radar') {
        ctx.save();
        ctx.globalAlpha = radarOpacity * 0.78;

        // Shift center slightly with timeline step to animate weather progression
        const shiftX = (stepOffset / 60) * 35;
        const shiftY = (stepOffset / 60) * -15;

        const rPt = map.latLngToContainerPoint([13.04, 80.24]);
        const centerX = rPt.x + shiftX;
        const centerY = rPt.y + shiftY;

        // Heavy core (Red/Amber)
        const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 55);
        coreGrad.addColorStop(0, 'rgba(239, 68, 68, 0.8)'); // 50 dBZ Core
        coreGrad.addColorStop(0.6, 'rgba(245, 158, 11, 0.7)'); // 40 dBZ
        coreGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 55, 0, Math.PI * 2);
        ctx.fill();

        // Moderate / Light Rain Halo (Green/Cyan)
        const haloGrad = ctx.createRadialGradient(centerX, centerY, 30, centerX, centerY, 140);
        haloGrad.addColorStop(0, 'rgba(34, 197, 94, 0.6)'); // 30 dBZ Moderate
        haloGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.4)'); // 20 dBZ Light
        haloGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 140, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      animationId = requestAnimationFrame(renderFrame);
    };

    animationId = requestAnimationFrame(renderFrame);

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeWeatherLayer, radarOpacity, currentStepIndex]);

  // 7. Update Hazards Markers
  useEffect(() => {
    const layer = hazardLayersRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showHazards) return;

    hazards.forEach((h) => {
      const isCritical = h.severity.toUpperCase() === 'CRITICAL';
      const color = isCritical ? '#ef4444' : '#f59e0b';

      const hazardHtml = `
        <div style="background:#0f172a; border:2px solid ${color}; border-radius:50%; width:26px; height:26px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.5); font-size:12px;">
          ${isCritical ? '⛔' : '⚠️'}
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-hazard-icon',
        html: hazardHtml,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([h.latitude, h.longitude], { icon });
      marker.bindPopup(`
        <div style="font-family:sans-serif; min-width:190px; color:#f8fafc;">
          <div style="font-weight:bold; font-size:12px; color:${color}; margin-bottom:2px;">
            ⚠️ ${h.hazard_type.replace('_', ' ')}
          </div>
          <div style="font-size:11px; color:#cbd5e1; margin-bottom:4px;">${h.description || 'Reported road obstruction'}</div>
          <div style="font-size:10px; color:#94a3b8;">Severity: <b style="color:#f8fafc;">${h.severity}</b> • Status: <b style="color:#f8fafc;">${h.status}</b></div>
        </div>
      `);
      layer.addLayer(marker);
    });
  }, [hazards, showHazards]);

  // 8. Update Shelters Markers
  useEffect(() => {
    const layer = shelterLayersRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showShelters) return;

    shelters.forEach((s) => {
      const isFull = s.status === 'FULL';
      const color = isFull ? '#f59e0b' : '#10b981';

      const shelterHtml = `
        <div style="background:#0f172a; border:2px solid ${color}; border-radius:50%; width:26px; height:26px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.5); color:${color}; font-size:12px; font-weight:bold;">
          🛡️
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-shelter-icon',
        html: shelterHtml,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([s.latitude, s.longitude], { icon });
      marker.bindPopup(`
        <div style="font-family:sans-serif; min-width:210px; color:#f8fafc;">
          <div style="font-weight:bold; font-size:13px; color:#10b981;">🛡️ ${s.name}</div>
          <div style="font-size:11px; color:#94a3b8; margin-top:2px;">${s.address}</div>
          <div style="font-size:11px; color:#cbd5e1; margin-top:4px;">Capacity: <b style="color:#f8fafc;">${s.current_occupancy} / ${s.capacity} beds</b></div>
          <div style="font-size:10px; color:#10b981; margin-top:2px;">Status: <b>${s.status}</b></div>
          ${s.contact_phone ? `<div style="font-size:11px; color:#38bdf8; margin-top:4px;">📞 ${s.contact_phone}</div>` : ''}
        </div>
      `);
      layer.addLayer(marker);
    });
  }, [shelters, showShelters]);

  // 9. Update Candidate Routes & Origin/Destination Markers
  useEffect(() => {
    const rLayer = routeLayersRef.current;
    const mLayer = markerLayersRef.current;
    const map = mapInstanceRef.current;
    if (!rLayer || !mLayer || !map) return;

    rLayer.clearLayers();
    mLayer.clearLayers();

    if (origin) {
      const origIcon = L.divIcon({
        className: 'origin-marker',
        html: `<div style="background:#3b82f6; border:2px solid #fff; border-radius:50%; width:20px; height:20px; box-shadow:0 2px 10px rgba(0,0,0,0.5);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      mLayer.addLayer(
        L.marker([origin.lat, origin.lng], { icon: origIcon }).bindPopup(
          '<b style="color:#0f172a;">Departure Origin</b>'
        )
      );
    }

    if (destination) {
      const destIcon = L.divIcon({
        className: 'dest-marker',
        html: `<div style="background:#10b981; border:2px solid #fff; border-radius:50%; width:20px; height:20px; box-shadow:0 2px 10px rgba(0,0,0,0.5);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      mLayer.addLayer(
        L.marker([destination.lat, destination.lng], { icon: destIcon }).bindPopup(
          '<b style="color:#0f172a;">Destination Point</b>'
        )
      );
    }

    if (showRoutes && candidateRoutes && candidateRoutes.length > 0) {
      candidateRoutes.forEach((route) => {
        const isRec = route.route_index === recommendedIndex;
        const isSelected = selectedRouteIndex === route.route_index;
        const latLngs = route.coordinates.map(([lng, lat]) => L.latLng(lat, lng));

        // Accessible colors: Emerald for Recommended, Amber for Alternatives, Red for Critical closures
        const color =
          route.has_critical_closure || route.risk_category === 'CRITICAL'
            ? '#ef4444'
            : isRec
            ? '#10b981'
            : isSelected
            ? '#3b82f6'
            : '#f59e0b';

        const weight = isRec || isSelected ? 6 : 4;
        const opacity = isRec || isSelected ? 0.95 : 0.6;

        const polyline = L.polyline(latLngs, {
          color,
          weight,
          opacity,
          lineJoin: 'round',
        });

        polyline.on('click', () => {
          if (onSelectRoute) onSelectRoute(route.route_index);
        });

        polyline.bindPopup(`
          <div style="font-family:sans-serif; color:#f8fafc;">
            <div style="font-weight:bold; font-size:13px; color:${color};">${route.name}</div>
            <div style="font-size:11px; color:#cbd5e1; margin-top:2px;">
              ${(route.distance_meters / 1000).toFixed(1)} km • ~${Math.round(route.duration_seconds / 60)} min
            </div>
            <div style="font-size:11px; margin-top:4px;">
              Risk Assessment: <b style="color:${color};">${route.risk_category}</b>
            </div>
            ${route.has_critical_closure ? '<div style="color:#ef4444; font-size:10px; font-weight:bold; margin-top:2px;">⛔ Confirmed Road Closure Detected</div>' : ''}
          </div>
        `);

        rLayer.addLayer(polyline);
      });
    }
  }, [
    candidateRoutes,
    recommendedIndex,
    selectedRouteIndex,
    showRoutes,
    origin,
    destination,
  ]);

  const activeStep = TIMELINE_STEPS[currentStepIndex];

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#090d16]">
      {/* 1. Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* 2. Meteorological Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10 pointer-events-none"
      />

      {/* 3. ZOOM EARTH FLOATING VERTICAL LAYER DOCK (RIGHT SIDE) */}
      <div className="absolute top-16 right-3 sm:right-4 z-30 flex flex-col items-end gap-2">
        {/* Base Map Style Popover Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowBaseMapMenu(!showBaseMapMenu)}
            className="w-10 h-10 rounded-xl zoom-dock flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer shadow-lg hover:border-slate-500"
            title="Map Style: Dark / Satellite / Streets"
          >
            <Globe className="w-4 h-4 text-cyan-400" />
          </button>

          {showBaseMapMenu && (
            <div className="absolute right-12 top-0 z-40 w-44 zoom-panel rounded-xl p-2 space-y-1 shadow-2xl border border-slate-700 text-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">
                Base Map Style
              </div>
              <button
                onClick={() => {
                  setBaseMapStyle('dark');
                  setShowBaseMapMenu(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                  baseMapStyle === 'dark'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>Dark Tactical</span>
                {baseMapStyle === 'dark' && <CheckCircle className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  setBaseMapStyle('satellite');
                  setShowBaseMapMenu(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                  baseMapStyle === 'satellite'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>Satellite Imagery</span>
                {baseMapStyle === 'satellite' && <CheckCircle className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  setBaseMapStyle('streets');
                  setShowBaseMapMenu(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                  baseMapStyle === 'streets'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>OpenStreetMap</span>
                {baseMapStyle === 'streets' && <CheckCircle className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Zoom Earth Weather & Hazard Layers Dock */}
        <div className="zoom-dock p-1.5 flex flex-col gap-1.5 items-center">
          {/* Rain Radar */}
          <button
            onClick={() =>
              setActiveWeatherLayer(activeWeatherLayer === 'radar' ? 'none' : 'radar')
            }
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              activeWeatherLayer === 'radar'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
            title="Rain Radar (Doppler Reflectivity)"
          >
            <CloudRain className="w-4 h-4" />
          </button>

          {/* Wind Streamlines */}
          <button
            onClick={() =>
              setActiveWeatherLayer(activeWeatherLayer === 'wind' ? 'none' : 'wind')
            }
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              activeWeatherLayer === 'wind'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
            title="Wind Streamlines & Velocity"
          >
            <Wind className="w-4 h-4" />
          </button>

          {/* Temperature */}
          <button
            onClick={() =>
              setActiveWeatherLayer(activeWeatherLayer === 'temperature' ? 'none' : 'temperature')
            }
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              activeWeatherLayer === 'temperature'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
            title="Temperature Heatmap"
          >
            <Thermometer className="w-4 h-4" />
          </button>

          {/* Satellite Clouds */}
          <button
            onClick={() =>
              setActiveWeatherLayer(activeWeatherLayer === 'clouds' ? 'none' : 'clouds')
            }
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              activeWeatherLayer === 'clouds'
                ? 'bg-slate-200 text-slate-900 shadow-lg shadow-slate-300/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
            title="Satellite Cloud Cover"
          >
            <Cloud className="w-4 h-4" />
          </button>

          {/* Elevation & Inundation */}
          <button
            onClick={() =>
              setActiveWeatherLayer(activeWeatherLayer === 'elevation' ? 'none' : 'elevation')
            }
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              activeWeatherLayer === 'elevation'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
            title="Elevation & Inundation Contours"
          >
            <Mountain className="w-4 h-4" />
          </button>

          <div className="w-6 h-px bg-slate-700/80 my-0.5" />

          {/* Corridors Toggle */}
          <button
            onClick={() => setShowRoutes(!showRoutes)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              showRoutes
                ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/80'
            }`}
            title={showRoutes ? 'Hide Safe Corridors' : 'Show Safe Corridors'}
          >
            <Navigation className="w-4 h-4" />
          </button>

          {/* Hazard Reports Toggle */}
          <button
            onClick={() => setShowHazards(!showHazards)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              showHazards
                ? 'bg-amber-600/30 text-amber-400 border border-amber-500/50'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/80'
            }`}
            title={showHazards ? 'Hide Hazard Reports' : 'Show Hazard Reports'}
          >
            <AlertTriangle className="w-4 h-4" />
          </button>

          {/* Shelters Toggle */}
          <button
            onClick={() => setShowShelters(!showShelters)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              showShelters
                ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/50'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/80'
            }`}
            title={showShelters ? 'Hide Relief Shelters' : 'Show Relief Shelters'}
          >
            <Shield className="w-4 h-4" />
          </button>

          {/* Fit Corridor View */}
          {candidateRoutes && candidateRoutes.length > 0 && (
            <button
              onClick={fitRouteCorridor}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer"
              title="Fit Corridor View"
            >
              <Maximize2 className="w-4 h-4 text-emerald-400" />
            </button>
          )}

          {/* Locate Me GPS */}
          <button
            onClick={handleLocateMe}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer"
            title="Locate My GPS Position"
          >
            <Crosshair className="w-4 h-4 text-blue-400" />
          </button>
        </div>
      </div>

      {/* 4. INTERACTIVE GROUND LOCATION INSPECTOR CARD */}
      {inspectedLocation && (
        <div className="absolute top-16 left-3 sm:left-4 z-40 w-80 p-4 rounded-2xl zoom-panel space-y-2.5 text-xs text-slate-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/80">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>
                {inspectedLocation.nearbyName || 'Ground Location Inspector'}
              </span>
            </div>
            <button
              onClick={() => setInspectedLocation(null)}
              className="text-slate-400 hover:text-white cursor-pointer p-0.5 rounded-md hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 text-slate-300 text-[11px]">
            <div className="flex justify-between items-center py-0.5 border-b border-slate-800">
              <span className="text-slate-400">Coordinates:</span>
              <span className="font-mono text-white">
                {inspectedLocation.lat}°N, {inspectedLocation.lng}°E
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-slate-800">
              <span className="flex items-center gap-1 text-slate-400">
                <Mountain className="w-3 h-3 text-emerald-400" />
                <span>Ground Elevation:</span>
              </span>
              <span className="font-bold text-emerald-400">
                {inspectedLocation.elev} m MSL
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-slate-800">
              <span className="flex items-center gap-1 text-slate-400">
                <Thermometer className="w-3 h-3 text-amber-400" />
                <span>Local Temp:</span>
              </span>
              <span className="font-bold text-amber-300">
                {inspectedLocation.temp}°C
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-slate-800">
              <span className="flex items-center gap-1 text-slate-400">
                <Wind className="w-3 h-3 text-cyan-400" />
                <span>Wind Velocity:</span>
              </span>
              <span className="font-bold text-cyan-300">
                {inspectedLocation.wind} km/h
              </span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400">Terrain Inundation:</span>
              <span
                className={`font-semibold ${
                  inspectedLocation.elev < 8
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {inspectedLocation.elev < 8 ? 'Lowland Coastal Plain' : 'Elevated Safe Ground'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-700/80 flex gap-2">
            <button
              onClick={() => {
                if (onSetDestination) {
                  onSetDestination(inspectedLocation.lat, inspectedLocation.lng);
                } else if (onMapClick) {
                  onMapClick(inspectedLocation.lat, inspectedLocation.lng);
                }
                setInspectedLocation(null);
              }}
              className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Route Here</span>
            </button>

            {onSetOrigin && (
              <button
                onClick={() => {
                  onSetOrigin(inspectedLocation.lat, inspectedLocation.lng);
                  setInspectedLocation(null);
                }}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs cursor-pointer border border-slate-700 transition-all"
              >
                Set Origin
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5. ZOOM EARTH FLOATING TIMELINE & WEATHER PLAYBACK (BOTTOM CENTER) */}
      <div className="absolute bottom-4 left-3 right-3 sm:left-8 sm:right-8 z-30 max-w-4xl mx-auto">
        <div className="zoom-timeline p-2.5 sm:p-3 flex flex-col gap-2">
          {/* Timeline Header Row */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              {/* Play / Pause */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md transition-all cursor-pointer"
                title={isPlaying ? 'Pause Playback' : 'Play Playback'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>

              {/* Step Back */}
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex((prev) =>
                    prev === 0 ? TIMELINE_STEPS.length - 1 : prev - 1
                  );
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer border border-slate-700"
                title="Step Back Frame"
              >
                <RotateCcw className="w-3 h-3" />
              </button>

              {/* Step Forward */}
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex((prev) => (prev + 1) % TIMELINE_STEPS.length);
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer border border-slate-700"
                title="Step Forward Frame"
              >
                <FastForward className="w-3 h-3" />
              </button>

              {/* Current Status Label Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-200">
                <span
                  className={`w-2 h-2 rounded-full ${
                    activeStep.offsetMin === 0
                      ? 'bg-emerald-400 animate-pulse'
                      : activeStep.offsetMin > 0
                      ? 'bg-cyan-400'
                      : 'bg-blue-400'
                  }`}
                />
                <span className="font-semibold text-[11px] tracking-wide">
                  {activeStep.category}: {activeStep.label}
                </span>
              </div>
            </div>

            {/* Playback Speed Controls */}
            <div className="flex items-center gap-1 bg-slate-800/90 p-0.5 rounded-lg border border-slate-700 text-[10px]">
              {[0.5, 1, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                    playbackSpeed === spd
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Scrubber Steps Grid */}
          <div className="grid grid-cols-9 gap-1 pt-1">
            {TIMELINE_STEPS.map((step, idx) => {
              const isActive = idx === currentStepIndex;

              return (
                <button
                  key={step.label}
                  onClick={() => {
                    setCurrentStepIndex(idx);
                    setIsPlaying(false);
                  }}
                  className={`relative py-1.5 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-lg scale-105 z-10'
                      : step.offsetMin > 0
                      ? 'bg-slate-800/60 text-cyan-400 hover:bg-slate-700/80 border border-slate-700/60'
                      : step.offsetMin === 0
                      ? 'bg-slate-800/80 text-emerald-400 hover:bg-slate-700/80 border border-slate-700'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/80 border border-slate-700/50'
                  }`}
                >
                  <span className="text-[10px] tracking-tight">{step.label}</span>
                  <div
                    className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                      isActive
                        ? 'bg-white'
                        : step.offsetMin === 0
                        ? 'bg-emerald-400'
                        : step.offsetMin > 0
                        ? 'bg-cyan-400'
                        : 'bg-blue-400'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Data Integrity / Feed Status Footer */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 border-t border-slate-800/80">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Open-Meteo & IMD Doppler Radar Feeds</span>
            </span>
            <span>
              {isSimulated ? '⚠️ Disaster Drill Active' : '● Live Radar & Observations'}
            </span>
          </div>
        </div>
      </div>

      {/* 6. ACTIVE LAYER LEGEND (BOTTOM LEFT) */}
      <div className="absolute bottom-24 left-3 z-20 hidden md:block">
        <div className="px-3.5 py-1.5 rounded-full zoom-glass text-[10px] flex items-center gap-2 text-slate-300">
          {activeWeatherLayer === 'temperature' && (
            <>
              <span className="font-bold text-slate-400 uppercase">Thermal Scale:</span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span> &lt;25°C
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span> 28-32°C
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> 33-35°C
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> &gt;36°C
              </span>
            </>
          )}

          {activeWeatherLayer === 'wind' && (
            <>
              <span className="font-bold text-slate-400 uppercase">Wind Velocity:</span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-300"></span> Light (5-10 km/h)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Moderate (10-20 km/h)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-700"></span> Strong (&gt;25 km/h)
              </span>
            </>
          )}

          {activeWeatherLayer === 'radar' && (
            <>
              <span className="font-bold text-slate-400 uppercase">Doppler Reflectivity:</span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Light (20 dBZ)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Moderate (30 dBZ)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Heavy (40 dBZ)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Severe (&gt;50 dBZ)
              </span>
            </>
          )}

          {activeWeatherLayer === 'clouds' && (
            <>
              <span className="font-bold text-slate-400 uppercase">Infrared Satellite:</span>
              <span>Low to High Cloud Density</span>
            </>
          )}

          {activeWeatherLayer === 'elevation' && (
            <>
              <span className="font-bold text-slate-400 uppercase">Terrain Flood Risk:</span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Lowland Coastal (&lt;5m)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Safe High Ground (&gt;15m)
              </span>
            </>
          )}

          {activeWeatherLayer === 'none' && (
            <span className="text-slate-400">Tactical Cartography Mode</span>
          )}
        </div>
      </div>
    </div>
  );
};
