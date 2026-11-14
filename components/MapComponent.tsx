'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FarmRecord } from '@/lib/supabase';

interface MapProps {
  selectedLat: number;
  selectedLng: number;
  onSelectCoordinates: (lat: number, lng: number) => void;
  farms: FarmRecord[];
  onSelectFarm?: (farm: FarmRecord) => void;
  mapStyle?: 'street' | 'satellite' | 'topo';
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

function MapEventsHandler({ onSelectCoordinates }: { onSelectCoordinates: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelectCoordinates(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    const currentZoom = map.getZoom();
    const targetZoom = currentZoom < 10 ? 11 : currentZoom;
    map.flyTo([lat, lng], targetZoom, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

export default function MapComponent({
  selectedLat,
  selectedLng,
  onSelectCoordinates,
  farms,
  onSelectFarm,
  mapStyle = 'street',
}: MapProps) {
  // Tile URLs (100% Free, Zero API Key Required, Pristine High-Res Tiles)
  // 1. Esri World Street Map (Soft pastel roads, green parks, clean water, identical to reference screenshot aesthetic)
  const streetUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
  // 2. Esri World Imagery (High-Resolution NASA & Satellite Imagery)
  const satelliteUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  // 3. Esri World Topo Map (Topographic and terrain contours)
  const topoUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';

  const tileUrl =
    mapStyle === 'satellite' ? satelliteUrl : mapStyle === 'topo' ? topoUrl : streetUrl;

  return (
    <div className="relative w-full h-full bg-[#f1f5f4] overflow-hidden">
      <MapContainer
        center={[selectedLat, selectedLng]}
        zoom={11}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full"
        style={{ minHeight: '100%', width: '100%', background: '#f1f5f4' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a> &copy; NASA &copy; USGS'
          url={tileUrl}
          maxZoom={18}
        />

        <MapRecenter lat={selectedLat} lng={selectedLng} />
        <MapEventsHandler onSelectCoordinates={onSelectCoordinates} />

        {/* Selected Coordinate Active Target Marker */}
        <Marker position={[selectedLat, selectedLng]} icon={createDetectiveTargetIcon()} />

        {/* Registered Agricultural Outposts in Dadu District */}
        {farms.map((farm) => {
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
      </MapContainer>
    </div>
  );
}
