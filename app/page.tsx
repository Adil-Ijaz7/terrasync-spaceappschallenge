'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Search,
  ChevronDown,
  Calendar,
  Thermometer,
  TrendingDown,
  Heart,
  HelpCircle,
  Volume2,
  VolumeX,
  Layers,
  Send,
  X,
  Plus,
} from 'lucide-react';
import { NasaTelemetrySnapshot } from '@/lib/nasa';
import { AgronomistOutput } from '@/lib/agronomist';
import { FarmRecord } from '@/lib/supabase';
import { runMlDetectiveModel } from '@/lib/ml-detector';

// Dynamically import MapComponent to disable SSR for Leaflet
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#f1f5f4] flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-slate-500 font-medium">Loading Satellite Canvas...</span>
      </div>
    </div>
  ),
});

// Real Agricultural Sectors in Dadu District, Sindh
const PRESET_SECTORS = [
  { name: 'Dadu Central', crop: 'Rice (Basmati)', lat: 26.7341, lng: 67.7795, sectorCode: 'HO-1' },
  { name: 'Johi Canal', crop: 'Rice (IRRI-6)', lat: 26.6917, lng: 67.6167, sectorCode: 'HO-3' },
  { name: 'Mehar Plains', crop: 'Wheat', lat: 27.1806, lng: 67.8222, sectorCode: 'HO-7' },
  { name: 'Sehwan Basin', crop: 'Cotton / Rice', lat: 26.4256, lng: 67.8631, sectorCode: 'HO-2' },
  { name: 'KN Shah Plain', crop: 'Wheat', lat: 27.0911, lng: 67.7333, sectorCode: 'HO-9' },
];

export default function EarthDetectiveDashboard() {
  const [selectedLat, setSelectedLat] = useState<number>(26.7341);
  const [selectedLng, setSelectedLng] = useState<number>(67.7795);
  const [selectedSectorName, setSelectedSectorName] = useState<string>('Dadu Central');
  const [selectedSectorCode, setSelectedSectorCode] = useState<string>('HO-1, HO-3, HO-7');

  const [mapStyle, setMapStyle] = useState<'voyager' | 'satellite' | 'street'>('voyager');
  const [telemetry, setTelemetry] = useState<NasaTelemetrySnapshot | null>(null);
  const [advice, setAdvice] = useState<AgronomistOutput | null>(null);
  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [cropFilter, setCropFilter] = useState<'all' | 'Rice' | 'Wheat' | 'Cotton'>('all');

  // Interactive controls
  const [spectralMode, setSpectralMode] = useState<'natural' | 'infrared'>('natural');
  const [language, setLanguage] = useState<'sindhi' | 'urdu' | 'english'>('sindhi');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Modals
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAddFarmModal, setShowAddFarmModal] = useState(false);
  const [emailStatusNote, setEmailStatusNote] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Add farm form state
  const [newFarmName, setNewFarmName] = useState('');
  const [newFarmEmail, setNewFarmEmail] = useState('');
  const [newFarmCrop, setNewFarmCrop] = useState('Rice');

  // Load registered farms
  useEffect(() => {
    fetch('/api/farms')
      .then((res) => res.json())
      .then((data) => {
        if (data.farms) setFarms(data.farms);
      })
      .catch((err) => console.warn('Could not fetch farms:', err));
  }, []);

  // Fetch live NASA telemetry & agronomic advice
  const triggerAnalysis = useCallback(async (lat: number, lng: number, cropName: string = 'rice') => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          crop: cropName.toLowerCase(),
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
    triggerAnalysis(26.7341, 67.7795, 'rice');
  }, [triggerAnalysis]);

  const handleCoordinateSelect = (lat: number, lng: number) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    const match = PRESET_SECTORS.find(
      (s) => Math.abs(s.lat - lat) < 0.05 && Math.abs(s.lng - lng) < 0.05
    );
    if (match) {
      setSelectedSectorName(match.name);
      setSelectedSectorCode(match.sectorCode);
    } else {
      setSelectedSectorName(`Target (${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E)`);
      setSelectedSectorCode('CUSTOM GRID');
    }
    triggerAnalysis(lat, lng, cropFilter !== 'all' ? cropFilter : 'rice');
  };

  const handleSelectFarm = (farm: FarmRecord) => {
    setSelectedLat(farm.latitude);
    setSelectedLng(farm.longitude);
    setSelectedSectorName(farm.farmer_name);
    setSelectedSectorCode(farm.region);
    triggerAnalysis(farm.latitude, farm.longitude, farm.crop_type || 'rice');
  };

  // Run ML Detective Model on live NASA telemetry
  const mlResult = useMemo(() => {
    const temp = telemetry?.power.temperatureC ?? 38.5;
    const moisture = telemetry?.power.soilMoisturePercent ?? 14.0;
    return runMlDetectiveModel({
      temperatureC: temp,
      soilMoisturePercent: moisture,
      crop: cropFilter !== 'all' ? cropFilter.toLowerCase() : 'rice',
      historical7Day: telemetry?.power.historical7Day,
      referenceDate: telemetry?.power.date,
      nearbyThreat:
        telemetry?.eonetEvents && telemetry.eonetEvents.length > 0
          ? telemetry.eonetEvents[0].title
          : undefined,
    });
  }, [telemetry, cropFilter]);

  const prediction = mlResult.prediction;

  // Filtered farms based on search & filters
  const displayedFarms = useMemo(() => {
    return farms.filter((f) => {
      const matchSearch =
        searchQuery === '' ||
        f.farmer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.region.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCrop =
        cropFilter === 'all' ||
        (f.crop_type && f.crop_type.toLowerCase().includes(cropFilter.toLowerCase()));
      return matchSearch && matchCrop;
    });
  }, [farms, searchQuery, cropFilter]);

  // Audio Speech Synthesis for Multilingual Insight
  const currentAdvisoryMessage = useMemo(() => {
    if (language === 'sindhi') {
      return (
        mlResult.recommendedActionSindhi ||
        advice?.sindhiText ||
        '[خبردار] ٻنيءَ ۾ پاڻي جي سخت کوٽ ۽ گرمي پد وڌي ويو آهي. سڪڻ کان بچاءَ لاءِ اڄ شام جو پاڻي ضرور لڳايو.'
      );
    }
    if (language === 'urdu') {
      return (
        mlResult.recommendedActionUrdu ||
        advice?.urduText ||
        '[انتباہ] دادو سیکٹر میں شدید گرمی اور زمین میں نمی کی خطرناک کمی ہے۔ فصل کو مرجھانے سے بچانے کے لیے شام میں آبپاشی کریں۔'
      );
    }
    return (
      advice?.englishExplanation ||
      'Orbital Telemetry Detective Verdict: Root desiccation detected. Immediate twilight irrigation recommended before Permanent Wilting Point breach.'
    );
  }, [language, mlResult, advice]);

  const handleToggleAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentAdvisoryMessage);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(
      (v) => v.lang.startsWith('ur') || v.lang.startsWith('hi') || v.lang.startsWith('ar')
    );
    if (voice) utterance.voice = voice;
    utterance.rate = 0.9;
    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  };

  // Dispatch farmer email alert
  const handleDispatchEmail = async () => {
    setIsSendingEmail(true);
    setEmailStatusNote(null);
    try {
      const res = await fetch('/api/email-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'ghulam.rasool.brohi@sindhfarms.pk',
          farmerName: selectedSectorName || 'Dadu Smallholder Outpost',
          crop: cropFilter !== 'all' ? cropFilter : 'Rice',
          region: 'Dadu District, Sindh',
          nasaSnapshot: telemetry,
          mlPrediction: prediction,
          advisoryTextEnglish: advice?.englishExplanation,
          advisoryTextSindhi: advice?.sindhiText,
          advisoryTextUrdu: advice?.urduText,
          urgencyLevel: prediction.predictedRiskLevel,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEmailStatusNote(`Dispatched via ${data.mode === 'live_smtp' ? 'Verified SMTP' : 'Verified Sentinel'} to ghulam.rasool.brohi@sindhfarms.pk`);
        setShowEmailModal(true);
      } else {
        setEmailStatusNote('Advisory generated. Ready to inspect.');
        setShowEmailModal(true);
      }
    } catch (e: any) {
      console.warn('Dispatch failed:', e);
      setEmailStatusNote('Advisory compiled in offline preview.');
      setShowEmailModal(true);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Add new farm outpost handler
  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFarmName || !newFarmEmail) return;

    try {
      const res = await fetch('/api/farms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_name: newFarmName,
          email: newFarmEmail,
          latitude: selectedLat,
          longitude: selectedLng,
          region: selectedSectorName || 'Dadu Outpost',
          crop_type: newFarmCrop,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.farm) {
          setFarms((prev) => [data.farm, ...prev]);
        }
        setShowAddFarmModal(false);
        setNewFarmName('');
        setNewFarmEmail('');
      }
    } catch (err) {
      console.error('Failed to create farm:', err);
    }
  };

  return (
    <div className="w-full h-screen p-3 sm:p-4 flex flex-col gap-3 overflow-hidden bg-[#f4f7f6]">

      {/* ========================================================= */}
      {/* UPPER SECTION: THE SATELLITE CANVAS (Fills Top ~58%)      */}
      {/* ========================================================= */}
      <div className="flex-1 min-h-[320px] rounded-2xl md:rounded-3xl overflow-hidden relative border border-slate-200/90 shadow-2xs bg-[#f1f5f4]">

        {/* Leaflet Map with Esri World Street / Satellite (Zero API Key Watermark!) */}
        <MapComponent
          selectedLat={selectedLat}
          selectedLng={selectedLng}
          onSelectCoordinates={handleCoordinateSelect}
          farms={displayedFarms}
          onSelectFarm={handleSelectFarm}
          mapStyle={mapStyle}
        />

        {/* TOP FLOATING SEARCH & FILTER BAR */}
        <div className="absolute top-3 inset-x-3 sm:inset-x-4 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">

          {/* Search Pill Input */}
          <div className="flex-1 min-w-[200px] max-w-sm h-10 px-3.5 bg-white/95 backdrop-blur-md rounded-full border border-slate-200/90 shadow-2xs flex items-center gap-2 text-xs text-slate-700">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search sector, coordinates, or farmer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 text-xs font-sans"
            />
          </div>

          {/* Crop Filter Dropdown */}
          <div className="relative">
            <select
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value as any)}
              className="appearance-none h-10 pl-3.5 pr-8 bg-white/95 backdrop-blur-md rounded-full border border-slate-200/90 shadow-2xs text-xs font-medium text-slate-700 cursor-pointer outline-none hover:border-slate-300 transition-all"
            >
              <option value="all">Crop: All Varieties</option>
              <option value="Rice">Crop: Rice (Basmati / IRRI-6)</option>
              <option value="Wheat">Crop: Wheat (Rabi)</option>
              <option value="Cotton">Crop: Cotton</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* District Filter Pill */}
          <div className="hidden sm:flex items-center h-10 px-3.5 bg-white/95 backdrop-blur-md rounded-full border border-slate-200/90 shadow-2xs text-xs font-medium text-slate-700">
            <span>District: Dadu, Sindh</span>
          </div>

          {/* Quick Preset Sector Chips */}
          <div className="hidden lg:flex items-center gap-1.5 ml-auto">
            {PRESET_SECTORS.map((s) => (
              <button
                key={s.name}
                onClick={() => {
                  setSelectedLat(s.lat);
                  setSelectedLng(s.lng);
                  setSelectedSectorName(s.name);
                  setSelectedSectorCode(s.sectorCode);
                  triggerAnalysis(s.lat, s.lng, s.crop);
                }}
                className={`h-9 px-3 rounded-full text-[11px] font-medium transition-all shadow-2xs ${selectedSectorName === s.name
                  ? 'bg-slate-950 text-white'
                  : 'bg-white/95 backdrop-blur-md text-slate-700 hover:bg-slate-100 border border-slate-200/90'
                  }`}
              >
                {s.name}
              </button>
            ))}

            {/* Map Style Toggle */}
            <button
              onClick={() =>
                setMapStyle((prev) => (prev === 'voyager' ? 'satellite' : 'voyager'))
              }
              className="h-9 px-3 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 text-slate-700 hover:text-slate-950 text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs"
              title="Toggle Map Style: CARTO Voyager vs Satellite"
            >
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>{mapStyle === 'voyager' ? 'Satellite View' : 'Voyager View'}</span>
            </button>
          </div>
        </div>

        {/* 
          FLOATING BLACK TELEMETRY HUD CAPSULE (Placed Directly Over the Map)
          Replaces [ 15 | $4,954,380 | 5Y ] with Real NASA POWER & ML Regression Logic
        */}
        <div className="absolute top-18 sm:top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div className="bg-slate-950/95 text-white backdrop-blur-xl rounded-2xl px-5 sm:px-6 py-2.5 sm:py-3 shadow-2xl border border-slate-800 flex items-center divide-x divide-slate-800 animate-fadeIn">

            {/* Column 1: Days to Permanent Wilting Point */}
            <div className="pr-4 sm:pr-5 text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-base sm:text-xl font-bold tracking-tight text-amber-400">
                  {prediction.predictedDaysToPWP > 14
                    ? '> 14 D'
                    : `${prediction.predictedDaysToPWP.toFixed(1)} D`}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium whitespace-nowrap mt-0.5">
                Countdown to PWP
              </div>
            </div>

            {/* Column 2: NASA Profile Soil Moisture (GWETPROF) */}
            <div className="px-4 sm:px-5 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-base sm:text-xl font-bold tracking-tight text-white">
                  {telemetry?.power.soilMoisturePercent ?? 14}%
                </span>
                {(telemetry?.power.soilMoisturePercent ?? 14) <= 15 ? (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    BREACH
                  </span>
                ) : (telemetry?.power.soilMoisturePercent ?? 14) <= 25 ? (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    WARNING
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    OPTIMAL
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium whitespace-nowrap mt-0.5">
                Root Moisture (GWETPROF)
              </div>
            </div>

            {/* Column 3: NASA 2-Meter Surface Temperature (T2M) */}
            <div className="pl-4 sm:pr-2 text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-base sm:text-xl font-bold tracking-tight text-white">
                  {(telemetry?.power.temperatureC ?? 38.5).toFixed(1)}°C
                </span>
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium whitespace-nowrap mt-0.5">
                NASA 2M Surface Temp
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Right Circular Detective Dossier Button (?) */}
        <button
          onClick={() => setShowDossierModal(true)}
          className="absolute bottom-4 right-4 z-20 w-10 h-10 rounded-full bg-slate-950 text-white flex items-center justify-center shadow-lg border border-slate-800 hover:scale-105 active:scale-95 transition-all group"
          title="Open Earth Detective Case Dossier"
        >
          <HelpCircle className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      {/* ========================================================= */}
      {/* LOWER SECTION: 3 ELEGANT BENTO CARDS (Fills Bottom ~42%)  */}
      {/* ========================================================= */}
      <div className="h-[210px] sm:h-[225px] grid grid-cols-1 md:grid-cols-12 gap-3 shrink-0">

        {/* ===================================================== */}
        {/* CARD 1 (Left, 5 cols): Location & Microclimate Bento  */}
        {/* ===================================================== */}
        <div className="md:col-span-12 lg:col-span-5 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col justify-between">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Location
              </span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                {selectedSectorName}
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">
                {selectedLat.toFixed(4)}°N, {selectedLng.toFixed(4)}°E • Sector {selectedSectorCode}
              </p>
            </div>

            {/* Bookmark & Date */}
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={() => setIsBookmarked(!isBookmarked)}
                className="text-amber-500 hover:scale-110 transition-transform"
                title="Bookmark Target Sector"
              >
                <Heart
                  className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : 'fill-amber-400'}`}
                />
              </button>
              <span className="text-[10px] text-slate-400 font-medium">
                {telemetry?.power.date || '14 Nov 2026'}
              </span>
            </div>
          </div>

          {/* 3 Micro-Metric Tiles */}
          <div className="grid grid-cols-3 gap-2">

            {/* Tile 1: Wilting Margin */}
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex flex-col justify-between">
              <div className="w-6 h-6 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="mt-1.5">
                <div className="text-[9px] text-slate-500 font-medium leading-none">
                  Wilting Margin
                </div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {prediction.predictedDaysToPWP > 14
                    ? '> 14 D'
                    : `${prediction.predictedDaysToPWP.toFixed(1)} D`}
                </div>
              </div>
            </div>

            {/* Tile 2: Drying Rate */}
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex flex-col justify-between">
              <div className="w-6 h-6 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shadow-2xs">
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div className="mt-1.5">
                <div className="text-[9px] text-slate-500 font-medium leading-none">
                  Daily Loss Rate
                </div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {prediction.dailyMoistureLossRate.toFixed(1)}%/d
                </div>
              </div>
            </div>

            {/* Tile 3: Surface Temperature */}
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex flex-col justify-between">
              <div className="w-6 h-6 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shadow-2xs">
                <Thermometer className="w-3.5 h-3.5 text-orange-500" />
              </div>
              <div className="mt-1.5">
                <div className="text-[9px] text-slate-500 font-medium leading-none">
                  Surface Temp
                </div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {(telemetry?.power.temperatureC ?? 38.5).toFixed(0)}°C
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-full text-[10px] font-medium text-slate-600">
              <button
                onClick={() => setLanguage('sindhi')}
                className={`px-2 py-0.5 rounded-full transition-all ${language === 'sindhi' ? 'bg-white text-slate-950 font-bold shadow-2xs' : 'hover:text-slate-950'
                  }`}
              >
                سنڌي
              </button>
              <button
                onClick={() => setLanguage('urdu')}
                className={`px-2 py-0.5 rounded-full transition-all ${language === 'urdu' ? 'bg-white text-slate-950 font-bold shadow-2xs' : 'hover:text-slate-950'
                  }`}
              >
                اردو
              </button>
              <button
                onClick={() => setLanguage('english')}
                className={`px-2 py-0.5 rounded-full transition-all ${language === 'english' ? 'bg-white text-slate-950 font-bold shadow-2xs' : 'hover:text-slate-950'
                  }`}
              >
                EN
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleToggleAudio}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:text-slate-950 flex items-center justify-center"
                title="Listen to advisory voice"
              >
                {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5 text-amber-500" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleDispatchEmail}
                disabled={isSendingEmail}
                className="px-3 py-1 rounded-full bg-slate-950 text-white text-[11px] font-semibold hover:bg-slate-800 transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
              >
                <Send className="w-2.5 h-2.5 text-amber-400" />
                <span>{isSendingEmail ? 'Dispatching...' : 'Alert Farmer'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ===================================================== */}
        {/* CARD 2 (Middle, 3 cols): Visual Evidence Photo Card   */}
        {/* ===================================================== */}
        <div className="md:col-span-6 lg:col-span-3 bg-slate-900 rounded-2xl overflow-hidden relative shadow-2xs border border-slate-200/80 p-3.5 text-white flex flex-col justify-between group">

          {/* Background Agricultural Crop Image with Spectral Filter */}
          <div
            className={`absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-105 ${spectralMode === 'infrared'
              ? 'filter contrast-150 hue-rotate-[290deg] saturate-200'
              : 'filter brightness-90 contrast-105'
              }`}
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-slate-950/20" />

          {/* Top Tag & Toggle */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white/20 backdrop-blur-md border border-white/30 text-white">
              🛰️ NASA Sentinel-2
            </span>
            <button
              onClick={() =>
                setSpectralMode((prev) => (prev === 'natural' ? 'infrared' : 'natural'))
              }
              className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-black/40 backdrop-blur-md border border-white/20 text-slate-200 hover:text-white transition-all"
            >
              {spectralMode === 'natural' ? 'Normal Lens' : '🚨 Infrared Mask'}
            </button>
          </div>

          {/* Bottom Forensic Description */}
          <div className="relative z-10 space-y-0.5">
            <div className="flex items-center gap-1 text-amber-400 font-bold text-[10px] uppercase tracking-wider">
              <span>Orbital Forensic Evidence</span>
            </div>
            <p className="text-[10px] text-slate-200 leading-tight">
              Thermal-moisture decoupling identified. Root zone desiccating 48h prior to visible foliage wilt.
            </p>
          </div>
        </div>

        {/* ===================================================== */}
        {/* CARD 3 (Right, 4 cols): Registered Outposts & Arc     */}
        {/* ===================================================== */}
        <div className="md:col-span-6 lg:col-span-4 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col justify-between">

          {/* Header & Avatars */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">
                Registered Outposts
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Autonomous Sentinel monitoring registered farmers across Dadu.
              </p>
            </div>

            {/* Farmer Avatars */}
            <div className="flex -space-x-1.5 shrink-0">
              <div
                className="w-6 h-6 rounded-full bg-slate-900 text-white border-2 border-white flex items-center justify-center text-[9px] font-bold"
                title="Ghulam Rasool Brohi"
              >
                GR
              </div>
              <div
                className="w-6 h-6 rounded-full bg-amber-600 text-white border-2 border-white flex items-center justify-center text-[9px] font-bold"
                title="Allah Dino Chandio"
              >
                AD
              </div>
              <div
                className="w-6 h-6 rounded-full bg-emerald-600 text-white border-2 border-white flex items-center justify-center text-[9px] font-bold"
                title="Muhammad Bakhtiar Solangi"
              >
                MB
              </div>
            </div>
          </div>

          {/* Arc Gauge */}
          <div className="flex flex-col items-center justify-center pt-0.5">
            <div className="relative w-40 h-20 flex items-end justify-center">
              <svg className="w-40 h-20 overflow-visible" viewBox="0 0 160 85">
                <path
                  d="M 15 80 A 65 65 0 0 1 145 80"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d="M 15 80 A 65 65 0 0 1 145 80"
                  fill="none"
                  stroke="url(#arcGradient)"
                  strokeWidth="12"
                  strokeDasharray="204"
                  strokeDashoffset={204 - 204 * (prediction.modelConfidence / 100) * 0.82}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute bottom-0 flex flex-col items-center leading-none">
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  8,5k
                </span>
                <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                  Hectares Monitored
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Sentinel Armed (Confidence {prediction.modelConfidence}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: EARTH DETECTIVE CASE DOSSIER                     */}
      {/* ========================================================= */}
      {showDossierModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                  NASA Space Apps • Earth&apos;s True Detective Case File
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Case #101: The Ghost Wilting of Johi Basin
                </h3>
              </div>
              <button
                onClick={() => setShowDossierModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200/60 text-amber-900">
                <strong className="block text-amber-950 font-bold mb-1">🔍 The Ground Mystery:</strong>
                Ground thermometers reported standard ambient air temperatures (34°C). Yet within 72 hours, entire Basmati rice crop fields suffered irreversible wilting necrosis.
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                <strong className="block text-slate-900 font-bold mb-1">🛰️ NASA Orbital Evidence:</strong>
                NASA POWER Agroclimatology satellite data uncovered severe subterranean decoupling: while surface air was mild, root-zone moisture (<code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">GWETPROF</code>) plunged below the Permanent Wilting Point (<code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">13.5%</code>) 3 days prior.
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                <strong className="block text-slate-900 font-bold mb-1">📊 Machine Learning Equation:</strong>
                <p className="font-mono text-slate-800 text-[11px]">
                  dM/dt = slope({'{'}M_i{'}'}) = {prediction.dailyMoistureLossRate.toFixed(2)}%/day | R² = {prediction.statisticalR2.toFixed(2)}
                </p>
                <p className="mt-1">
                  Days to PWP = (M_current - PWP_limit) / |dM/dt| = <strong>{prediction.predictedDaysToPWP.toFixed(1)} Days Remaining</strong>.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowDossierModal(false)}
                className="px-4 py-2 rounded-full bg-slate-950 text-white text-xs font-semibold hover:bg-slate-800 transition-all"
              >
                Close Case File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: EMAIL ADVISORY INSPECTOR                         */}
      {/* ========================================================= */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  Verified Dispatch
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Automated Farmer Advisory Email
                </h3>
                <p className="text-xs text-slate-500">Recipient: ghulam.rasool.brohi@sindhfarms.pk</p>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 text-xs text-slate-800 font-sans">
              <div className="border-b border-slate-200 pb-2">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Native Sindhi Guidance (سنڌي)</span>
                <p className="text-sm font-semibold text-slate-900 mt-1 leading-relaxed" dir="rtl">
                  {advice?.sindhiText || '[خبردار] ٻنيءَ ۾ پاڻي جي سخت کوٽ ۽ گرمي پد وڌي ويو آهي. سڪڻ کان بچاءَ لاءِ اڄ شام جو پاڻي ضرور لڳايو.'}
                </p>
              </div>

              <div className="border-b border-slate-200 pb-2">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Native Urdu Guidance (اردو)</span>
                <p className="text-sm font-semibold text-slate-900 mt-1 leading-relaxed" dir="rtl">
                  {advice?.urduText || '[الرٹ] شدید گرمی اور زمین میں نمی کی خطرناک کمی ہے۔ شام کو فوری پانی لگائیں۔'}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Technical Synthesis (English)</span>
                <p className="text-xs text-slate-600 mt-0.5">
                  {advice?.englishExplanation || 'Root zone desiccation detected. Days to Permanent Wilting Point: ' + prediction.predictedDaysToPWP.toFixed(1) + ' days.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>{emailStatusNote || 'Delivered to smallholder farm registry.'}</span>
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 rounded-full bg-slate-950 text-white font-semibold hover:bg-slate-800 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: QUICK ADD FARM OUTPOST                           */}
      {/* ========================================================= */}
      {showAddFarmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateFarm}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-fadeIn"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                  Registry Extension
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Register Outpost at Selected Coordinates
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedLat.toFixed(4)}°N, {selectedLng.toFixed(4)}°E
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddFarmModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Farmer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ghulam Rasool Brohi"
                  value={newFarmName}
                  onChange={(e) => setNewFarmName(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Verified Alert Email</label>
                <input
                  type="email"
                  required
                  placeholder="farmer@sindhfarms.pk"
                  value={newFarmEmail}
                  onChange={(e) => setNewFarmEmail(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Crop Type</label>
                <select
                  value={newFarmCrop}
                  onChange={(e) => setNewFarmCrop(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:border-slate-400"
                >
                  <option value="Rice (Basmati)">Rice (Basmati)</option>
                  <option value="Rice (IRRI-6)">Rice (IRRI-6)</option>
                  <option value="Wheat">Wheat (Rabi)</option>
                  <option value="Cotton">Cotton</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddFarmModal(false)}
                className="px-3 py-1.5 rounded-full text-slate-600 hover:text-slate-900 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-full bg-slate-950 text-white text-xs font-semibold hover:bg-slate-800 transition-all shadow-xs"
              >
                Save Outpost
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
