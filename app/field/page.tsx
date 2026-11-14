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
  Sparkles
} from 'lucide-react';
import { AgronomistOutput } from '@/lib/agronomist';
import { NasaTelemetrySnapshot } from '@/lib/nasa';
import { runMlPredictionModel, MlPredictionResult } from '@/lib/ml-detector';

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
  const [feedback, setFeedback] = useState<string | null>(null);

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
  }, []);

  const handleUseCurrentLocation = () => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          fetchTelemetry(pos.coords.latitude, pos.coords.longitude, crop);
        },
        () => {
          alert('Could not access GPS, defaulting to Dadu, Sindh coordinates.');
        }
      );
    }
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
          region: 'Dadu, Sindh',
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
            : `Advisory processed for ${farmerEmail} (${data.carrierNote || 'Generated'}). Configure SMTP_USER in .env.local to route through live Gmail.`
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
    const text = advice?.sindhiText || advice?.urduText || 'Dadu crop telemetry active.';
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang.startsWith('ur') || v.lang.startsWith('hi') || v.lang.startsWith('ar'));
    if (voice) utterance.voice = voice;
    utterance.rate = 0.88;

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="w-full h-full p-4 sm:p-6 lg:p-8 overflow-y-auto font-sans bg-[#f4f7f6] text-slate-900 flex flex-col items-center justify-start">
      {/* Mobile Frame Container (Styled in clean modern light aesthetic matching main dashboard) */}
      <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-[32px] p-5 sm:p-6 shadow-sm space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-2xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Field Agent Mobile Console</h1>
              <p className="text-[11px] text-slate-500">On-field NASA satellite diagnostics &amp; ML alerts</p>
            </div>
          </div>
          <button
            onClick={handleUseCurrentLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs"
            title="Get device GPS coordinates"
          >
            <Navigation className="w-3.5 h-3.5 text-amber-400" />
            <span>GPS</span>
          </button>
        </div>

        {/* Location & Crop Controls */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Latitude (°N)</label>
            <input
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(parseFloat(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono outline-none focus:border-slate-400"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Longitude (°E)</label>
            <input
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(parseFloat(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono outline-none focus:border-slate-400"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-slate-600 mb-1 font-semibold">Target Crop Variety</label>
            <select
              value={crop}
              onChange={(e) => {
                setCrop(e.target.value);
                fetchTelemetry(lat, lng, e.target.value);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-slate-400 text-xs font-medium"
            >
              <option value="rice">Rice (IRRI-6 / Basmati)</option>
              <option value="wheat">Wheat (Rabi)</option>
              <option value="cotton">Cotton</option>
            </select>
          </div>
        </div>

        {/* Telemetry Snapshot */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-xs font-medium">Querying NASA POWER Agroclimatology...</span>
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* 2 Micro-Metric Tiles matching main dashboard */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                  <span>NASA Surface Temp</span>
                </span>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {(telemetry?.power.temperatureC ?? 38.5).toFixed(1)}°C
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-500" />
                  <span>Root Moisture</span>
                </span>
                <div className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                  <span>{telemetry?.power.soilMoisturePercent ?? 14}%</span>
                  {(telemetry?.power.soilMoisturePercent ?? 14) <= 15 ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                      BREACH
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      SAFE
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ML Predictive Forecast Box */}
            {mlPrediction && (
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-amber-900 font-bold">
                    <BrainCircuit className="w-4 h-4 text-amber-600" />
                    <span>ML Predictive Time-Series</span>
                  </span>
                  <span className="text-[11px] text-amber-800 font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-amber-200">
                    Wilt in {mlPrediction.predictedDaysToPWP > 14 ? '> 14' : mlPrediction.predictedDaysToPWP.toFixed(1)} Days
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  {mlPrediction.forecast3Days.map((fc) => (
                    <div key={fc.dayOffset} className="p-2 rounded-xl bg-white border border-amber-200/60 shadow-2xs">
                      <div className="text-[10px] text-slate-400 font-medium">Day +{fc.dayOffset}</div>
                      <div className="text-xs font-bold text-slate-900">{fc.predictedTempC}°C</div>
                      <div className="text-xs text-amber-600 font-mono font-semibold">{fc.predictedMoisturePercent}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Native Advisory in Sindhi */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">سنڌي صلاح (Native Sindhi Advisory)</span>
                <button
                  onClick={playVoice}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    isPlayingAudio
                      ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 shadow-2xs'
                  }`}
                >
                  {isPlayingAudio ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3 text-amber-500" />}
                  <span>{isPlayingAudio ? 'Stop' : 'Voice'}</span>
                </button>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed font-sans font-medium" dir="rtl">
                {advice?.sindhiText || '[خبردار] ٻنيءَ ۾ پاڻي جي کوٽ ۽ سخت گرمي آهي. شام جو پاڻي ضرور لڳايو.'}
              </p>
            </div>

            {/* Email Dispatch Action */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-slate-700 text-xs font-semibold">Farmer Alert Email Address</label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={farmerEmail}
                  onChange={(e) => setFarmerEmail(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-3.5 py-2 text-xs text-slate-900 font-mono outline-none focus:border-slate-400"
                />
                <button
                  onClick={handleSendEmailAlert}
                  disabled={isSending}
                  className="px-4 py-2 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                >
                  {isSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-amber-400" />}
                  <span>Email Alert</span>
                </button>
              </div>

              {feedback && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2 mt-2 leading-relaxed">
                  <CheckCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{feedback}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
