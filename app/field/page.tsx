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
  AlertTriangle
} from 'lucide-react';
import { AgronomistOutput } from '@/lib/agronomist';
import { NasaTelemetrySnapshot } from '@/lib/nasa';
import { runMlPredictionModel, MlPredictionResult } from '@/lib/ml-detector';

export default function FieldAgentPwaPage() {
  const [lat, setLat] = useState(26.7341);
  const [lng, setLng] = useState(67.7795);
  const [crop, setCrop] = useState('rice');
  const [farmerEmail, setFarmerEmail] = useState('ghulam.rasool.brohi@sindhfarms.pk');
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
          farmerName: 'Field Outpost Farmer',
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
        setFeedback(`Advisory email delivered to ${farmerEmail}!`);
      } else {
        setFeedback(data.error || 'Failed to dispatch email');
      }
    } catch (e: any) {
      setFeedback('Error sending alert email');
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
    <div className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 space-y-6 font-sans">
      {/* Mobile Card Wrapper */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Smartphone className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Field Agent Mobile PWA</h1>
              <p className="text-xs text-slate-400">On-field NASA satellite diagnostics &amp; ML email alerts</p>
            </div>
          </div>
          <button
            onClick={handleUseCurrentLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-sm"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>GPS</span>
          </button>
        </div>

        {/* Location & Crop Inputs */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Latitude (°N)</label>
            <input
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(parseFloat(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:border-sky-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Longitude (°E)</label>
            <input
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(parseFloat(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:border-sky-500"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-slate-400 mb-1 font-medium">Selected Crop</label>
            <select
              value={crop}
              onChange={(e) => {
                setCrop(e.target.value);
                fetchTelemetry(lat, lng, e.target.value);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:border-sky-500 text-xs"
            >
              <option value="rice">Rice (IRRI-6 / Basmati)</option>
              <option value="wheat">Wheat (Gandum)</option>
              <option value="cotton">Cotton (Kapas)</option>
            </select>
          </div>
        </div>

        {/* Telemetry Snapshot */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
            <span className="text-xs">Querying NASA POWER Daily Grid...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Temperature</span>
                </span>
                <div className="text-xl font-bold text-white mt-1">
                  {telemetry?.power.temperatureC.toFixed(1) ?? '38.5'}°C
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-400" />
                  <span>Soil Moisture</span>
                </span>
                <div className="text-xl font-bold text-white mt-1">
                  {telemetry?.power.soilMoisturePercent ?? 14}%
                </div>
              </div>
            </div>

            {/* ML Predictive Forecast Widget */}
            {mlPrediction && (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-indigo-400 font-bold">
                    <BrainCircuit className="w-4 h-4" />
                    <span>ML Predictive Forecast</span>
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono font-semibold">
                    Wilt in {mlPrediction.predictedDaysToPWP} Days
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  {mlPrediction.forecast3Days.map((fc) => (
                    <div key={fc.dayOffset} className="p-1.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Day +{fc.dayOffset}</div>
                      <div className="text-xs font-bold text-white">{fc.predictedTempC}°C</div>
                      <div className="text-xs text-sky-400 font-mono">{fc.predictedMoisturePercent}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Advisory in Sindhi & Urdu */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sky-400">سنڌي صلاح (Sindhi Advisory)</span>
                <button
                  onClick={playVoice}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                    isPlayingAudio
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500 animate-pulse'
                      : 'bg-slate-800 text-slate-200 border-slate-700'
                  }`}
                >
                  {isPlayingAudio ? <VolumeX className="w-3 h-3 text-emerald-400" /> : <Volume2 className="w-3 h-3 text-sky-400" />}
                  <span>{isPlayingAudio ? 'Stop' : 'Voice'}</span>
                </button>
              </div>
              <p className="text-sm text-slate-100 leading-relaxed font-sans" dir="rtl">
                {advice?.sindhiText || '[خبردار] ٻنيءَ ۾ پاڻي جي کوٽ ۽ سخت گرمي آهي. شام جو پاڻي ضرور لڳايو.'}
              </p>
            </div>

            {/* Automated Email Dispatch Section */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="block text-slate-400 text-xs font-medium">Farmer Email Address</label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={farmerEmail}
                  onChange={(e) => setFarmerEmail(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:border-sky-500"
                />
                <button
                  onClick={handleSendEmailAlert}
                  disabled={isSending}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
                >
                  {isSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                  <span>Email Alert</span>
                </button>
              </div>

              {feedback && (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 mt-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
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
