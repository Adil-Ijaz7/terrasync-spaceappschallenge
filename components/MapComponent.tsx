'use client';

import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FarmRecord } from '@/lib/supabase';
import { NasaEonetEvent } from '@/lib/nasa';

interface MapProps {
  selectedLat: number;
  selectedLng: number;
  onSelectCoordinates: (lat: number, lng: number) => void;
  farms: FarmRecord[];
  eonetEvents?: NasaEonetEvent[];
  onSelectFarm?: (farm: FarmRecord) => void;
  mapStyle?: 'voyager' | 'carto' | 'google' | 'satellite' | 'street';
  isPickerMode?: boolean;
}

// Glowing Amber Circle Marker (matches the exact aesthetic of the reference design)
const createAmberRadarPinIcon = (isSelected: boolean = false) =>
  L.divIcon({
    className: 'amber-radar-pin',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8 -ml-4 -mt-4 cursor-pointer group">
        <!-- Soft Outer Pulse Ring -->
        <div class="absolute w-8 h-8 rounded-full ${
          isSelected
            ? 'bg-amber-400/35 border-2 border-amber-400 animate-ping'
            : 'bg-amber-400/20 border border-amber-400/40 group-hover:scale-125 transition-transform'
        }"></div>
        <!-- Inner Glow -->
        <div class="absolute w-5 h-5 rounded-full bg-amber-400/30 blur-[2px]"></div>
        <!-- Solid Center Dot -->
        <div class="relative w-3.5 h-3.5 rounded-full ${
          isSelected
            ? 'bg-amber-500 ring-4 ring-amber-300/60 shadow-[0_0_12px_#f59e0b]'
            : 'bg-amber-500 shadow-md shadow-amber-500/40'
        } border-2 border-white transition-all group-hover:scale-125"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

// Target Crosshair / Detective Focus Pin
const createDetectiveTargetIcon = () =>
  L.divIcon({
    className: 'detective-target-pin',
    html: `
      <div class="relative flex items-center justify-center w-10 h-10 -ml-5 -mt-5 pointer-events-none">
        <!-- Sonar radar ring -->
        <div class="absolute w-10 h-10 rounded-full border border-amber-500/50 animate-ping"></div>
        <!-- Radar boundary circle -->
        <div class="absolute w-7 h-7 rounded-full border border-amber-500/80 shadow-[0_0_10px_#f59e0b]"></div>
        <!-- Fine crosshairs -->
        <div class="absolute w-8 h-[1.5px] bg-amber-500"></div>
        <div class="absolute h-8 w-[1.5px] bg-amber-500"></div>
        <!-- Center core dot -->
        <div class="w-2 h-2 rounded-full bg-white border border-amber-600 shadow-[0_0_6px_#ffffff]"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

// Newly Dropped Farm Outpost Marker (for Farm Registration)
const createDroppedFarmPinIcon = () =>
  L.divIcon({
    className: 'dropped-farm-pin',
    html: `
      <div class="relative flex items-center justify-center w-10 h-10 -ml-5 -mt-5 pointer-events-none">
        <div class="absolute w-10 h-10 rounded-full bg-emerald-500/30 border border-emerald-500 animate-ping"></div>
        <div class="w-6 h-6 rounded-full bg-emerald-600 border-2 border-white text-white flex items-center justify-center text-xs shadow-lg font-bold">
          🌾
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

// NASA EONET Active Hazard Pin (Pulsing Crimson Sentinel marker)
const createHazardRadarPinIcon = (cat: string) =>
  L.divIcon({
    className: 'eonet-hazard-pin',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8 -ml-4 -mt-4 cursor-pointer group">
        <div class="absolute w-8 h-8 rounded-full bg-rose-500/35 border-2 border-rose-500 animate-ping"></div>
        <div class="absolute w-5 h-5 rounded-full bg-rose-500/25 blur-[1px]"></div>
        <div class="relative w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] font-bold shadow-md shadow-rose-600/50 border border-white">
          ⚠️
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

function MapEventsHandler({ onSelectCoordinates }: { onSelectCoordinates: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (e?.latlng && typeof e.latlng.lat === 'number' && typeof e.latlng.lng === 'number') {
        onSelectCoordinates(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    try {
      const currentZoom = map.getZoom();
      const targetZoom = currentZoom < 10 ? 11 : currentZoom;
      map.flyTo([lat, lng], targetZoom, { duration: 1.0 });
    } catch (e) {
      // Safe guard against unmount mid-animation
    }
  }, [lat, lng, map]);
  return null;
}

export default function MapComponent({
  selectedLat,
  selectedLng,
  onSelectCoordinates,
  farms = [],
  eonetEvents = [],
  onSelectFarm,
  mapStyle = 'voyager',
  isPickerMode = false,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Safe Leaflet ID cleanup on unmount to prevent "Map container is already initialized" crash across tab navigation
  useEffect(() => {
    return () => {
      if (containerRef.current) {
        const leafletElements = containerRef.current.querySelectorAll('.leaflet-container');
        leafletElements.forEach((el: any) => {
          if (el._leaflet_id) {
            el._leaflet_id = null;
          }
        });
      }
    };
  }, []);

  // Official CARTO API Key
  const cartoKey =
    process.env.NEXT_PUBLIC_CARTO_API_KEY || 'cb1_5911_1_9c76b37cd4d732d8144e0786';

  // 1. CARTO Voyager (Clean, pastel, pristine roads & water matching reference image)
  const cartoVoyagerUrl = `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${cartoKey}`;
  // 2. Google Maps Standard Roads
  const googleMapUrl = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
  // 3. High-Resolution Satellite View (Google Hybrid Satellite)
  const satelliteUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
  // 4. Esri World Street Map (Alternative street view)
  const streetUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';

  const tileUrl =
    mapStyle === 'google'
      ? googleMapUrl
      : mapStyle === 'satellite'
      ? satelliteUrl
      : mapStyle === 'street'
      ? streetUrl
      : cartoVoyagerUrl;

  const attributionText =
    mapStyle === 'google'
      ? '&copy; Google Maps'
      : mapStyle === 'satellite'
      ? '&copy; Google / NASA / Copernicus'
      : '&copy; CARTO &copy; OpenStreetMap';

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#f1f5f4] overflow-hidden">
      <MapContainer
        center={[selectedLat, selectedLng]}
        zoom={11}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full"
        style={{ minHeight: '100%', width: '100%', background: '#f1f5f4' }}
      >
        <TileLayer
          attribution={attributionText}
          url={tileUrl}
          maxZoom={19}
        />

        <MapRecenter lat={selectedLat} lng={selectedLng} />
        <MapEventsHandler onSelectCoordinates={onSelectCoordinates} />

        {/* Selected Coordinate Active Target Marker */}
        <Marker
          position={[selectedLat, selectedLng]}
          icon={isPickerMode ? createDroppedFarmPinIcon() : createDetectiveTargetIcon()}
        />

        {/* Registered Agricultural Outposts in Dadu District */}
        {Array.isArray(farms) &&
          farms.map((farm) => {
            const isSelected =
              Math.abs(farm.latitude - selectedLat) < 0.001 &&
              Math.abs(farm.longitude - selectedLng) < 0.001;

            return (
              <Marker
                key={farm.id}
                position={[farm.latitude, farm.longitude]}
                icon={createAmberRadarPinIcon(isSelected)}
                eventHandlers={{
                  click: () => {
                    onSelectCoordinates(farm.latitude, farm.longitude);
                    if (onSelectFarm) onSelectFarm(farm);
                  },
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-2 text-xs font-sans text-slate-800 space-y-1">
                    <div className="text-amber-600 font-bold flex items-center gap-1">
                      <span>🌾</span> {farm.farmer_name}
                    </div>
                    <div className="text-slate-600 text-[11px]">{farm.region}</div>
                    <div className="text-slate-400 text-[10px] font-mono">
                      {farm.crop_type || 'Rice'} • {farm.latitude.toFixed(4)}°N, {farm.longitude.toFixed(4)}°E
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* NASA EONET Active Natural Hazard Pins */}
        {Array.isArray(eonetEvents) &&
          eonetEvents.map((ev) => {
            if (!ev.coordinates || !Array.isArray(ev.coordinates) || ev.coordinates.length < 2) return null;
            const [evLat, evLng] = ev.coordinates;
            return (
              <Marker
                key={ev.id}
                position={[evLat, evLng]}
                icon={createHazardRadarPinIcon(ev.category)}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-2 text-xs font-sans text-slate-800 space-y-1">
                    <div className="text-rose-600 font-bold flex items-center gap-1 text-[11px]">
                      <span>🛰️ NASA EONET Hazard</span>
                    </div>
                    <div className="font-semibold text-slate-900 leading-snug">{ev.title}</div>
                    <div className="text-slate-500 text-[10px]">
                      Category: {ev.category} {ev.distanceKm !== undefined ? `• ${ev.distanceKm} km from target` : ''}
                    </div>
                    {ev.url && (
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-[10px] text-amber-600 hover:text-amber-700 underline font-medium pt-0.5"
                      >
                        NASA Observatory Bulletin &rarr;
                      </a>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
}
