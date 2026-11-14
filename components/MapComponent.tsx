'use client';

import React, { useEffect, useState } from 'react';
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
  mapStyle?: 'satellite' | 'dark';
}

// Tactical Military Crosshair Marker (matches sci-fi HUD)
const createTacticalCrosshairIcon = () =>
  L.divIcon({
    className: 'tactical-crosshair-pin',
    html: `
      <div class="relative flex items-center justify-center w-12 h-12 -ml-3 -mt-3 pointer-events-none">
        <!-- Outer sonar ring -->
        <div class="absolute w-12 h-12 rounded-full border border-cyan-400/40 animate-ping"></div>
        <!-- Inner radar circle -->
        <div class="absolute w-8 h-8 rounded-full border border-cyan-400/70 shadow-[0_0_12px_#06b6d4]"></div>
        <!-- Tactical crosshairs -->
        <div class="absolute w-10 h-[1px] bg-cyan-400 shadow-[0_0_6px_#06b6d4]"></div>
        <div class="absolute h-10 w-[1px] bg-cyan-400 shadow-[0_0_6px_#06b6d4]"></div>
        <!-- Center core dot -->
        <div class="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#ffffff]"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

// Minimalist Farm Outpost Marker
const createFarmOutpostIcon = () =>
  L.divIcon({
    className: 'farm-outpost-pin',
    html: `
      <div class="relative flex items-center justify-center w-5 h-5 cursor-pointer group">
        <div class="w-2.5 h-2.5 rounded-full bg-purple-500 border border-purple-200 shadow-[0_0_8px_#a855f7] transition-transform group-hover:scale-150"></div>
        <div class="absolute -top-4 left-3 px-1.5 py-0.5 rounded bg-slate-950/80 border border-purple-500/40 text-[9px] font-mono text-purple-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          OUTPOST
        </div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
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
    map.flyTo([lat, lng], map.getZoom(), { duration: 1.0 });
  }, [lat, lng, map]);
  return null;
}

export default function MapComponent({
  selectedLat,
  selectedLng,
  onSelectCoordinates,
  farms,
  onSelectFarm,
  mapStyle = 'satellite',
}: MapProps) {
  // Esri Satellite vs CartoDB Dark Matter
  const satelliteUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  const darkUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  return (
    <div className="absolute inset-0 w-full h-full bg-[#030712] overflow-hidden">
      <MapContainer
        center={[selectedLat, selectedLng]}
        zoom={6}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full"
        style={{ minHeight: '100vh', background: '#030712' }}
      >
        <TileLayer
          attribution='&copy; NASA / Esri / USGS'
          url={mapStyle === 'satellite' ? satelliteUrl : darkUrl}
          maxZoom={18}
        />

        <MapRecenter lat={selectedLat} lng={selectedLng} />
        <MapEventsHandler onSelectCoordinates={onSelectCoordinates} />

        {/* Tactical Crosshair at Target Coordinate */}
        <Marker position={[selectedLat, selectedLng]} icon={createTacticalCrosshairIcon()} />

        {/* Registered Agricultural Outposts in Dadu */}
        {farms.map((farm) => (
          <Marker
            key={farm.id}
            position={[farm.latitude, farm.longitude]}
            icon={createFarmOutpostIcon()}
            eventHandlers={{
              click: () => {
                onSelectCoordinates(farm.latitude, farm.longitude);
                if (onSelectFarm) onSelectFarm(farm);
              },
            }}
          >
            <Popup className="custom-leaflet-popup">
              <div className="p-2 text-xs text-slate-200 font-mono space-y-1">
                <div className="text-purple-400 font-bold">{farm.farmer_name}</div>
                <div className="text-slate-400">{farm.region}</div>
                <div className="text-cyan-300 font-semibold">{farm.phone_number}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
