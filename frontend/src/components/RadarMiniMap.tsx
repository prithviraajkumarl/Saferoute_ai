import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RadarMiniMapProps {
  lat: number;
  lng: number;
  cityName: string;
  onOpenFullRadar: () => void;
}

export const RadarMiniMap: React.FC<RadarMiniMapProps> = ({
  lat,
  lng,
  cityName,
  onOpenFullRadar,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 10);
      return;
    }

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 10,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      dragging: true,
    });

    // Clean OpenStreetMap light tiles without any watermark
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Simulated Radar overlay layer
    const radarOverlay = L.tileLayer(
      'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=9de243494c0b295cca9337e1e96b00e2',
      {
        opacity: 0.55,
        maxZoom: 19,
      }
    );
    radarOverlay.addTo(map);

    // Blue pulsating location marker (matching Image 1 & 2)
    const customDot = L.divIcon({
      className: 'custom-radar-pulse-dot',
      html: `
        <div style="position: relative; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 14px; height: 14px; background: #2563eb; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 8px rgba(37,99,235,0.6);"></div>
          <div style="position: absolute; width: 28px; height: 28px; background: rgba(37,99,235,0.25); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    L.marker([lat, lng], { icon: customDot }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [lat, lng]);

  return (
    <div
      onClick={onOpenFullRadar}
      className="relative w-full h-[320px] md:h-[400px] rounded-2xl overflow-hidden cursor-pointer group border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-300 bg-slate-100"
    >
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* "Now" Dark pill badge (exact match to Image 1 & 2) */}
      <div className="absolute top-4 left-4 z-10">
        <span className="px-3 py-1 bg-[#1e293b]/90 backdrop-blur-sm text-white text-xs font-semibold rounded-lg shadow-md tracking-wide">
          Now
        </span>
      </div>

      {/* Mapbox attribution watermark badge (exact match to Image 1 & 2) */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1 px-2 py-0.5 bg-white/80 backdrop-blur-sm rounded text-[11px] font-medium text-slate-500 shadow-xs">
        <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block opacity-70" />
        mapbox
      </div>

      {/* Hover prompt to open full radar & navigation */}
      <div className="absolute inset-0 z-10 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
        <div className="bg-white/95 text-slate-900 font-semibold px-4 py-2 rounded-xl shadow-lg text-xs flex items-center gap-2">
          <span>Click to Open Full Interactive Radar & Safe Routes</span>
          <span className="text-blue-600 font-bold">→</span>
        </div>
      </div>
    </div>
  );
};
