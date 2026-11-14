'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Layers, MapPin, Sparkles, Navigation } from 'lucide-react';
import { NasaTelemetrySnapshot } from '@/lib/nasa';
import { AgronomistOutput } from '@/lib/agronomist';
import { FarmRecord } from '@/lib/supabase';

// Dynamically import MapComponent to disable SSR for Leaflet
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 w-full h-full bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-slate-400 font-medium">Loading Satellite Observations...</span>
      </div>
    </div>
  ),
});

// Dynamically import HudTelemetryCard to disable SSR and prevent hydration mismatches from browser extensions and client telemetry
const HudTelemetryCard = dynamic(() => import('@/components/HudTelemetryCard'), {
  ssr: false,
  loading: () => (
    <div className="w-[390px] sm:w-[450px] bg-slate-950/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-5 shadow-2xl text-slate-100 font-sans space-y-4 animate-pulse">
      <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
        <div className="space-y-1.5">
          <div className="h-3 bg-slate-800 rounded w-28"></div>
          <div className="h-5 bg-slate-800 rounded w-48"></div>
        </div>
        <div className="h-5 bg-slate-800 rounded w-16"></div>
      </div>
      <div className="h-14 bg-slate-900 border border-slate-800 rounded-xl"></div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="h-20 bg-slate-900 border border-slate-800 rounded-xl"></div>
        <div className="h-20 bg-slate-900 border border-slate-800 rounded-xl"></div>
        <div className="h-20 bg-slate-900 border border-slate-800 rounded-xl"></div>
        <div className="h-20 bg-slate-900 border border-slate-800 rounded-xl"></div>
      </div>
    </div>
  ),
});

// Agricultural Sectors in Dadu District, Sindh
const PRESET_ZONES = [
  { name: 'Dadu Central', crop: 'Rice', lat: 26.7341, lng: 67.7795 },
  { name: 'Johi Canal', crop: 'Rice / Wheat', lat: 26.6917, lng: 67.6167 },
  { name: 'Mehar Plains', crop: 'Wheat', lat: 27.1806, lng: 67.8222 },
  { name: 'Sehwan Basin', crop: 'Cotton', lat: 26.4256, lng: 67.8631 },
  { name: 'KN Shah Plain', crop: 'Wheat', lat: 27.0911, lng: 67.7333 },
];

export default function CommandCenterPage() {
  const [selectedLat, setSelectedLat] = useState<number>(26.7341);
  const [selectedLng, setSelectedLng] = useState<number>(67.7795);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'dark'>('satellite');

  const [telemetry, setTelemetry] = useState<NasaTelemetrySnapshot | null>(null);
  const [advice, setAdvice] = useState<AgronomistOutput | null>(null);
  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load registered farms
  useEffect(() => {
    fetch('/api/farms')
      .then((res) => res.json())
      .then((data) => {
        if (data.farms) setFarms(data.farms);
      })
      .catch((err) => console.warn('Could not fetch farms:', err));
  }, []);

  // Fetch NASA telemetry & agronomic advice
  const triggerAnalysis = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          crop: 'rice',
          farmerName: 'Dadu Agricultural Zone',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTelemetry(data.telemetry);
        setAdvice(data.advice);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    triggerAnalysis(26.7341, 67.7795);
  }, [triggerAnalysis]);

  const handleMapCoordinateSelect = (lat: number, lng: number) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    triggerAnalysis(lat, lng);
  };

  const handleSelectFarm = (farm: FarmRecord) => {
    setSelectedLat(farm.latitude);
    setSelectedLng(farm.longitude);
    triggerAnalysis(farm.latitude, farm.longitude);
  };

  return (
    <div
      suppressHydrationWarning
      className="relative flex-1 w-full h-[calc(100vh-56px)] overflow-hidden bg-slate-950 font-sans"
    >
      {/* 1. Fullscreen Interactive Satellite Map Canvas */}
      <MapComponent
        selectedLat={selectedLat}
        selectedLng={selectedLng}
        onSelectCoordinates={handleMapCoordinateSelect}
        farms={farms}
        onSelectFarm={handleSelectFarm}
        mapStyle={mapStyle}
      />

      {/* 2. Floating Agricultural Intelligence Bento Card (Top Left) */}
      <div className="absolute top-4 left-4 sm:left-6 z-30 max-h-[calc(100vh-80px)] overflow-y-auto no-scrollbar">
        <HudTelemetryCard
          selectedLat={selectedLat}
          selectedLng={selectedLng}
          telemetry={telemetry}
          advice={advice}
          isLoading={isLoading}
        />
      </div>

      {/* 3. Clean Preset Sector Selector (Floating Bottom Center) */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 hidden md:flex items-center gap-1.5 p-1.5 bg-slate-950/85 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium px-2">
          <Navigation className="w-3.5 h-3.5 text-sky-400" />
          <span>Sectors:</span>
        </div>
        {PRESET_ZONES.map((zone) => {
          const isSelected =
            Math.abs(selectedLat - zone.lat) < 0.01 && Math.abs(selectedLng - zone.lng) < 0.01;
          return (
            <button
              key={zone.name}
              onClick={() => {
                setSelectedLat(zone.lat);
                setSelectedLng(zone.lng);
                triggerAnalysis(zone.lat, zone.lng);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
                isSelected
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>{zone.name}</span>
              <span className="text-[10px] opacity-70 ml-1.5">({zone.crop})</span>
            </button>
          );
        })}
      </div>

      {/* 4. Minimalist Map Layer Toggle (Bottom Right) */}
      <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-xs text-slate-300 shadow-xl">
        <button
          onClick={() => setMapStyle(mapStyle === 'satellite' ? 'dark' : 'satellite')}
          className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-medium transition-colors"
        >
          <Layers className="w-4 h-4" />
          <span>{mapStyle === 'satellite' ? 'Satellite View' : 'Dark Canvas'}</span>
        </button>
        <span className="text-slate-700">|</span>
        <span className="text-slate-400 text-[11px]">NASA Open Data</span>
      </div>
    </div>
  );
}
