'use client';

import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  MapPin, 
  Mail, 
  Volume2, 
  VolumeX,
  Thermometer, 
  Droplets, 
  RefreshCw, 
  CheckCircle,
  Navigation,
  BrainCircuit,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Send,
  Sparkles,
  Compass,
  Radio,
  Layers,
  Clock,
  CloudRain,
  Wind,
  ChevronDown
} from 'lucide-react';
import { AgronomistOutput } from '@/lib/agronomist';
import { NasaTelemetrySnapshot } from '@/lib/nasa';
import { runMlPredictionModel, MlPredictionResult } from '@/lib/ml-detector';
import { FarmRecord } from '@/lib/supabase';

const DADU_PRESETS = [
  { name: 'Dadu Central', lat: 26.7341, lng: 67.7795, note: 'District Headquarters' },
  { name: 'Johi Canal', lat: 26.6912, lng: 67.6144, note: 'Canal Irrigated Belt' },
  { name: 'Mehar Plains', lat: 27.1812, lng: 67.8223, note: 'Rabi Wheat Sector' },
  { name: 'Sehwan Basin', lat: 26.4258, lng: 67.8624, note: 'Indus River Floodplain' },
  { name: 'KN Shah Plain', lat: 26.8920, lng: 67.8910, note: 'Rice Paddy Basin' },
];

export default function FieldAgentPwaPage() {
  const [lat, setLat] = useState(26.7341);
  const [lng, setLng] = useState(67.7795);
  const [crop, setCrop] = useState('rice');
  const [farmerEmail, setFarmerEmail] = useState('adilijaz.gemini@gmail.com');
  const [telemetry, setTelemetry] = useState<NasaTelemetrySnapshot | null>(null);
  const [advice, setAdvice] = useState<AgronomistOutput | null>(null);
  const [mlPrediction, setMlPrediction] = useState<MlPredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState<'sindhi' | 'urdu' | 'english'>('sindhi');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [registeredFarms, setRegisteredFarms] = useState<FarmRecord[]>([]);
  const [selectedOutpostKey, setSelectedOutpostKey] = useState<string>('preset-Dadu Central');

  const fetchTelemetry = async (latitude: number, longitude: number, currentCrop: string) => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude, crop: currentCrop }),
      });
      const data = await res.json();
      if (res.ok) {
        setTelemetry(data.telemetry);
        setAdvice(data.advice);

        // Run ML predictive time-series model on past readings
        const pred = runMlPredictionModel({
          temperatureC: data.telemetry.power.temperatureC,
          soilMoisturePercent: data.telemetry.power.soilMoisturePercent,
          relativeHumidityPercent: data.telemetry.power.relativeHumidityPercent,
          precipitationMm: data.telemetry.power.precipitationMm,
          crop: currentCrop,
          historical7Day: data.telemetry.power.historical7Day,
        });
        setMlPrediction(pred);
      }
    } catch (e) {
      console.warn('Field fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry(lat, lng, crop);

    // Load registered outposts for the dropdown
    fetch('/api/farms', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.farms && Array.isArray(data.farms)) {
          setRegisteredFarms(data.farms);
        }
      })
      .catch((e) => console.warn('Could not load farms in field agent:', e));
  }, []);

  const handleOutpostSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedOutpostKey(val);

    if (val.startsWith('preset-')) {
      const pName = val.replace('preset-', '');
      const preset = DADU_PRESETS.find((p) => p.name === pName);
      if (preset) {
        setLat(preset.lat);
        setLng(preset.lng);
        fetchTelemetry(preset.lat, preset.lng, crop);
      }
    } else if (val.startsWith('farm-')) {
      const fId = val.replace('farm-', '');
      const farm = registeredFarms.find((f) => f.id === fId);
      if (farm) {
        setLat(farm.latitude);
        setLng(farm.longitude);
        if (farm.email) setFarmerEmail(farm.email);
        const cropLower = farm.crop_type?.toLowerCase().includes('wheat')
          ? 'wheat'
          : farm.crop_type?.toLowerCase().includes('cotton')
          ? 'cotton'
          : 'rice';
        setCrop(cropLower);
        fetchTelemetry(farm.latitude, farm.longitude, cropLower);
      }
    }
  };

  const handleUseCurrentLocation = () => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLat = Number(pos.coords.latitude.toFixed(4));
          const newLng = Number(pos.coords.longitude.toFixed(4));
          setLat(newLat);
          setLng(newLng);
          fetchTelemetry(newLat, newLng, crop);
        },
        () => {
          alert('Could not access device GPS, defaulting to Dadu, Sindh coordinates.');
        }
      );
    }
  };

  const handleSelectPreset = (pLat: number, pLng: number) => {
    setLat(pLat);
    setLng(pLng);
    fetchTelemetry(pLat, pLng, crop);
  };

  const handleSendEmailAlert = async () => {
    if (!farmerEmail || !farmerEmail.includes('@')) {
      alert('Please enter a valid farmer email.');
      return;
    }

    setIsSending(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/email-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: farmerEmail,
          farmerName: 'Dadu Smallholder Outpost',
          crop,
          region: `Coordinates (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E), Dadu District`,
          advisoryTextEnglish: advice?.englishExplanation,
          advisoryTextSindhi: advice?.sindhiText,
          advisoryTextUrdu: advice?.urduText,
          nasaSnapshot: telemetry,
          mlPrediction,
          urgencyLevel: mlPrediction?.predictedRiskLevel || 'HIGH',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback(
          data.mode === 'live_smtp'
            ? `Email physically delivered to ${farmerEmail} via live SMTP!`
            : `Advisory processed for ${farmerEmail} (${data.carrierNote || 'Sandbox Mode'}). Configure SMTP_USER in .env.local to route through live Gmail.`
        );
      } else {
        setFeedback(data.error || 'Failed to dispatch email');
      }
    } catch (e: any) {
      setFeedback('Error sending alert email: ' + (e.message || 'Network error'));
    } finally {
      setIsSending(false);
    }
  };

  const playVoice = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }
    window.speechSynthesis.cancel();
    const textToSpeak =
      activeLangTab === 'sindhi'
        ? (advice?.sindhiText || 'ٻنيءَ ۾ پاڻي جي کوٽ ۽ سخت گرمي آهي.')
        : activeLangTab === 'urdu'
        ? (advice?.urduText || 'فصل میں پانی کی کمی اور شدید گرمی ہے۔')
        : (advice?.englishExplanation || 'Root zone desiccation risk detected.');

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => 
      activeLangTab === 'english'
        ? v.lang.startsWith('en')
        : (v.lang.startsWith('ur') || v.lang.startsWith('hi') || v.lang.startsWith('ar'))
    );
    if (voice) utterance.voice = voice;
    utterance.rate = 0.88;

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="w-full h-full p-4 sm:p-6 lg:p-8 overflow-y-auto font-sans bg-[#f4f7f6] text-slate-900 space-y-6">
      
      {/* Top Header Bar spanning full width */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/90 pb-5">
        <div>
          <div className="flex items-center gap-2 text-amber-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Field Agent Terminal • On-Ground Mobile & PWA Console</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Field Diagnostics &amp; Multilingual Advisory Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Direct on-ground NASA satellite telemetry lookup, OLS predictive wilt modeling, and real-time Sindhi/Urdu farmer alert dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleUseCurrentLocation}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-xs"
            title="Get device GPS coordinates"
          >
            <Navigation className="w-3.5 h-3.5 text-amber-400" />
            <span>Device GPS ({lat.toFixed(2)}°, {lng.toFixed(2)}°)</span>
          </button>

          <button
            onClick={() => fetchTelemetry(lat, lng, crop)}
            disabled={isLoading}
            className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-950 hover:border-slate-400 transition-all shadow-xs disabled:opacity-50"
            title="Refresh NASA Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Responsive Full-Width Layout: 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (5 Cols): Coordinates, Crop Selector & NASA Telemetry */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Target Location & Crop Configuration Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Target Outpost Coordinates</h3>
                  <p className="text-[11px] text-slate-500">Select sector or enter manual coordinates</p>
                </div>
              </div>
            </div>

            {/* Target Outpost Selection Dropdown */}
            <div>
              <label className="block text-slate-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>Select Target Outpost / Sector</span>
              </label>
              <div className="relative">
                <select
                  value={selectedOutpostKey}
                  onChange={handleOutpostSelectChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 outline-none focus:border-slate-400 focus:bg-white text-xs font-semibold transition-all appearance-none cursor-pointer pr-8 shadow-2xs"
                >
                  <optgroup label="📍 Dadu District Preset Sectors">
                    {DADU_PRESETS.map((p) => (
                      <option key={p.name} value={`preset-${p.name}`}>
                        {p.name} ({p.lat.toFixed(4)}°N, {p.lng.toFixed(4)}°E) — {p.note}
                      </option>
                    ))}
                  </optgroup>
                  {registeredFarms.length > 0 && (
                    <optgroup label="🌾 Registered Farmer Outposts">
                      {registeredFarms.map((farm) => (
                        <option key={farm.id} value={`farm-${farm.id}`}>
                          {farm.farmer_name} — {farm.region} ({farm.crop_type || 'Rice'})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Quick Sector Presets */}
            <div>
              <label className="block text-slate-600 text-[11px] font-semibold uppercase tracking-wider mb-2">
                Dadu District Sectors
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DADU_PRESETS.map((p) => {
                  const isSelected = Math.abs(lat - p.lat) < 0.01 && Math.abs(lng - p.lng) < 0.01;
                  return (
                    <button
                      key={p.name}
                      onClick={() => handleSelectPreset(p.lat, p.lng)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                        isSelected
                          ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-slate-400'
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Numeric Lat & Lng Inputs */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-600 mb-1 text-xs font-semibold">Latitude (°N)</label>
                <input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs outline-none focus:border-slate-400 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 text-xs font-semibold">Longitude (°E)</label>
                <input
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs outline-none focus:border-slate-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Crop Selector */}
            <div>
              <label className="block text-slate-600 mb-1 text-xs font-semibold">Target Crop Variety</label>
              <select
                value={crop}
                onChange={(e) => {
                  setCrop(e.target.value);
                  fetchTelemetry(lat, lng, e.target.value);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 outline-none focus:border-slate-400 text-xs font-medium focus:bg-white transition-all"
              >
                <option value="rice">Rice (IRRI-6 / Basmati) — High Water Requirement</option>
                <option value="wheat">Wheat (Rabi Season) — Moderate Tolerance</option>
                <option value="cotton">Cotton — High Heat Sensitivity</option>
                <option value="sugarcane">Sugarcane — Extended Growth Cycle</option>
              </select>
            </div>
          </div>

          {/* NASA Live Telemetry Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">NASA POWER Telemetry</h3>
                  <p className="text-[11px] text-slate-500">Direct satellite agroclimatology assimilation</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-full">
                CERES &amp; MERRA-2
              </span>
            </div>

            {isLoading ? (
              <div className="py-10 flex flex-col items-center justify-center text-slate-400 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                <span className="text-xs font-medium">Querying NASA Agroclimatology Feed...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {/* Surface Temperature */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                    <span>Surface Temp (2m)</span>
                  </span>
                  <div className="text-xl font-bold text-slate-900 mt-1.5">
                    {(telemetry?.power.temperatureC ?? 27.2).toFixed(1)}°C
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">Thermal Limit: 38°C</span>
                </div>

                {/* Root Zone Moisture */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-sky-500" />
                    <span>Root Moisture</span>
                  </span>
                  <div className="text-xl font-bold text-slate-900 mt-1.5 flex items-center gap-1.5">
                    <span>{telemetry?.power.soilMoisturePercent ?? 29}%</span>
                    {(telemetry?.power.soilMoisturePercent ?? 29) <= 15 ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                        BREACH
                      </span>
                    ) : (telemetry?.power.soilMoisturePercent ?? 29) <= 25 ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                        WARNING
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        OPTIMAL
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">PWP: 13.5% (Rice)</span>
                </div>

                {/* Relative Humidity (RH2M) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-teal-500" />
                    <span>Relative Humidity</span>
                  </span>
                  <div className="text-xl font-bold text-slate-900 mt-1.5 flex items-center gap-1.5">
                    <span>{telemetry?.power.relativeHumidityPercent ?? 35}%</span>
                    {(telemetry?.power.relativeHumidityPercent ?? 35) <= 25 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                        DRY WIND
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">MERRA-2 Assimilation</span>
                </div>

                {/* Precipitation (PRECTOTCORR) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <CloudRain className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Precipitation</span>
                  </span>
                  <div className="text-xl font-bold text-slate-900 mt-1.5">
                    {(telemetry?.power.precipitationMm ?? 0.0).toFixed(1)} <span className="text-xs font-normal text-slate-500">mm/d</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">GPM / IMERG Estimate</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 Cols): ML Predictions, Multilingual Advisories & Farmer Alert Dispatch */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* ML Time-Series Predictive Forecasting Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">ML Predictive Time-Series Engine</h3>
                  <p className="text-[11px] text-slate-500">Ordinary Least Squares (OLS) desiccation regression</p>
                </div>
              </div>

              {mlPrediction && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-amber-50 text-amber-900 px-3 py-1 rounded-full border border-amber-200/80">
                    PWP Wilt: {mlPrediction.predictedDaysToPWP > 14 ? '> 14 Days' : `${mlPrediction.predictedDaysToPWP.toFixed(1)} Days`}
                  </span>
                </div>
              )}
            </div>

            {/* 3-Day Forecast Cards */}
            {mlPrediction ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  {mlPrediction.forecast3Days.map((fc) => (
                    <div 
                      key={fc.dayOffset} 
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 hover:border-amber-300 transition-all text-center flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 font-semibold mb-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>Day +{fc.dayOffset}</span>
                      </div>
                      <div className="text-lg font-bold text-slate-900">{fc.predictedTempC}°C</div>
                      <div className="text-xs text-amber-600 font-mono font-bold mt-1">
                        {fc.predictedMoisturePercent}% Moisture
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 capitalize">
                        {fc.riskLevel.toLowerCase()} Risk
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200/60 flex items-center justify-between text-xs text-amber-900">
                  <span className="font-semibold flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                    <span>Daily Moisture Loss Rate: <strong>{(mlPrediction.dailyMoistureLossRate * 100).toFixed(1)}%/day</strong></span>
                  </span>
                  <span className="font-mono text-[11px] text-amber-800">
                    Confidence: <strong>{(mlPrediction.statisticalR2 * 100).toFixed(0)}% (R²)</strong>
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">Loading predictive forecast...</div>
            )}
          </div>

          {/* Multilingual Advisory Hub Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Multilingual Farmer Advisory Hub</h3>
                  <p className="text-[11px] text-slate-500">Native Sindhi, Urdu, and English vernacular advisory</p>
                </div>
              </div>

              {/* Voice Readout Button */}
              <button
                onClick={playVoice}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  isPlayingAudio
                    ? 'bg-amber-500 text-white border-amber-600 animate-pulse shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 shadow-2xs'
                }`}
                title="Synthesize audio advisory via Web Speech API"
              >
                {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-500" />}
                <span>{isPlayingAudio ? 'Stop Voice' : 'Play Voice'}</span>
              </button>
            </div>

            {/* Language Selector Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <button
                onClick={() => setActiveLangTab('sindhi')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeLangTab === 'sindhi'
                    ? 'bg-slate-950 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                سنڌي (Sindhi)
              </button>
              <button
                onClick={() => setActiveLangTab('urdu')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeLangTab === 'urdu'
                    ? 'bg-slate-950 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                اردو (Urdu)
              </button>
              <button
                onClick={() => setActiveLangTab('english')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeLangTab === 'english'
                    ? 'bg-slate-950 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                English
              </button>
            </div>

            {/* Advisory Content Display */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 min-h-[90px] flex items-center">
              {activeLangTab === 'sindhi' && (
                <p className="text-base text-slate-900 leading-relaxed font-sans font-medium w-full" dir="rtl">
                  {advice?.sindhiText || '[موسم ٺيڪ آهي] گرمي پد 27°C ۽ نمي 29% آهي. فصل تي جيتن جي نگراني رکو ۽ معمول مطابق پاڻي ڏيو.'}
                </p>
              )}
              {activeLangTab === 'urdu' && (
                <p className="text-base text-slate-900 leading-relaxed font-sans font-medium w-full" dir="rtl">
                  {advice?.urduText || '[معمول کی صورتحال] درجہ حرارت 27°C اور زمین میں نمی 29% ہے۔ معمول کے مطابق آبپاشی جاری رکھیں۔'}
                </p>
              )}
              {activeLangTab === 'english' && (
                <p className="text-sm text-slate-800 leading-relaxed font-sans font-medium w-full">
                  {advice?.englishExplanation || 'NASA Agroclimatology indicates stable microclimate. Root zone moisture remains above critical desiccation thresholds.'}
                </p>
              )}
            </div>
          </div>

          {/* Instant Farmer Email Dispatch Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Instant Farmer Email Dispatch</h3>
                  <p className="text-[11px] text-slate-500">Send tailored HTML satellite advisory to recipient inbox</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <input
                type="email"
                placeholder="farmer@domain.com"
                value={farmerEmail}
                onChange={(e) => setFarmerEmail(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-xs text-slate-900 font-mono outline-none focus:border-slate-400 focus:bg-white transition-all"
              />
              <button
                onClick={handleSendEmailAlert}
                disabled={isSending}
                className="px-5 py-2.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50 shrink-0"
              >
                {isSending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>Dispatch Advisory</span>
              </button>
            </div>

            {feedback && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 leading-relaxed">
                <CheckCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{feedback}</span>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}