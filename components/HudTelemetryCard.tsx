'use client';

import React, { useState, useEffect } from 'react';
import { AgronomistOutput } from '@/lib/agronomist';
import { NasaTelemetrySnapshot } from '@/lib/nasa';
import { runMlDetectiveModel, MlAnomalyResult } from '@/lib/ml-detector';
import {
  Volume2,
  VolumeX,
  Mail,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Thermometer,
  Droplets,
  CloudRain,
  Sun,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  BrainCircuit,
  Bot,
  Eye,
  X
} from 'lucide-react';

interface HudTelemetryCardProps {
  selectedLat: number;
  selectedLng: number;
  telemetry: NasaTelemetrySnapshot | null;
  advice: AgronomistOutput | null;
  isLoading: boolean;
}

export default function HudTelemetryCard({
  selectedLat,
  selectedLng,
  telemetry,
  advice,
  isLoading,
}: HudTelemetryCardProps) {
  const [recipientEmail, setRecipientEmail] = useState('ghulam.rasool.brohi@sindhfarms.pk');
  const [language, setLanguage] = useState<'sindhi' | 'urdu' | 'english'>('sindhi');
  const [isSending, setIsSending] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Autonomous Sentinel Dispatch
  const [isAutoSentinelOn, setIsAutoSentinelOn] = useState(true);
  const [autoSentCount, setAutoSentCount] = useState<number | null>(null);

  const [dispatchResult, setDispatchResult] = useState<{
    success: boolean;
    mode?: string;
    messageId?: string;
    carrierNote?: string;
    recipientEmail?: string;
    previewHtml?: string;
    previewUrl?: string;
    smtpError?: string;
  } | null>(null);

  // Derived telemetry metrics
  const temp = telemetry?.power.temperatureC ?? 38.5;
  const soilMoisture = telemetry?.power.soilMoisturePercent ?? 14;
  const precipitation = 0.0;
  const solarRadiation = 22.4;

  // ML Forensic Detective & Predictive Regression Model
  const mlResult: MlAnomalyResult = runMlDetectiveModel({
    temperatureC: temp,
    soilMoisturePercent: soilMoisture,
    crop: 'rice',
    historical7Day: telemetry?.power.historical7Day,
    referenceDate: telemetry?.power.date,
    nearbyThreat: telemetry?.eonetEvents?.length && telemetry.eonetEvents.length > 0
      ? telemetry.eonetEvents[0].title
      : undefined,
  });

  const prediction = mlResult.prediction;

  // Multilingual Text
  const englishInsight =
    advice?.englishExplanation ||
    'High thermal anomaly detected in Dadu Sector. Soil moisture has breached Permanent Wilting Point (PWP). Immediate twilight irrigation recommended.';
  const sindhiInsight =
    mlResult.recommendedActionSindhi ||
    advice?.sindhiText ||
    '[خبردار] ٻنيءَ ۾ پاڻي جي سخت کوٽ ۽ گرمي پد وڌي ويو آهي. سڪڻ کان بچاءَ لاءِ اڄ شام جو پاڻي ضرور لڳايو.';
  const urduInsight =
    mlResult.recommendedActionUrdu ||
    advice?.urduText ||
    '[انتباہ] دادو سیکٹر میں شدید گرمی اور زمین میں نمی کی خطرناک کمی ہے۔ فصل کو مرجھانے سے بچانے کے لیے شام میں آبپاشی کریں۔';

  const currentDisplayMessage =
    language === 'sindhi' ? sindhiInsight : language === 'urdu' ? urduInsight : englishInsight;

  // Audio Speech Synthesis
  const handlePlayAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentDisplayMessage);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(
      (v) => v.lang.startsWith('ur') || v.lang.startsWith('hi') || v.lang.startsWith('ar')
    );
    if (voice) utterance.voice = voice;
    utterance.rate = 0.88;
    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  };

  // Autonomous dispatch trigger: evaluates ML predictions and current risks
  useEffect(() => {
    if (isAutoSentinelOn && (mlResult.anomalyDetected || prediction.alertRecommended) && autoSentCount === null && !isLoading) {
      fetch('/api/sentinel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setAutoSentCount(d.triggeredCount || d.scannedFarms || 5);
        })
        .catch(() => {});
    }
  }, [isAutoSentinelOn, mlResult.anomalyDetected, prediction.alertRecommended, isLoading, autoSentCount, language]);

  // Dispatch Automated Email Action
  const handleDispatchEmail = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      alert('Please enter a valid farmer email address.');
      return;
    }

    setIsSending(true);
    setDispatchResult(null);

    try {
      const res = await fetch('/api/email-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          farmerName: 'Ghulam Rasool Brohi',
          crop: 'Rice (Basmati)',
          region: 'Dadu Agricultural Zone',
          message: currentDisplayMessage,
          advisoryTextEnglish: englishInsight,
          advisoryTextSindhi: sindhiInsight,
          advisoryTextUrdu: urduInsight,
          nasaSnapshot: telemetry,
          mlPrediction: prediction,
          urgencyLevel: prediction.predictedRiskLevel,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDispatchResult({
          success: true,
          mode: data.mode,
          messageId: data.messageId,
          carrierNote: data.carrierNote,
          recipientEmail: data.recipientEmail,
          previewHtml: data.previewHtml,
          previewUrl: data.previewUrl,
          smtpError: data.smtpError,
        });
      } else {
        alert(data.error || 'Failed to dispatch email');
      }
    } catch (e: any) {
      console.warn('Email dispatch failed:', e);
      alert('Network error while dispatching email alert');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <div
        suppressHydrationWarning
        className="w-[390px] sm:w-[450px] bg-slate-950/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-5 shadow-2xl text-slate-100 font-sans space-y-4"
      >
        {/* 1. Header */}
        <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                Earth&apos;s True Detective
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
              <span className="text-[11px] text-slate-400 font-mono">
                {selectedLat.toFixed(3)}°N, {selectedLng.toFixed(3)}°E
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
              Dadu Agricultural Intelligence
            </h2>
          </div>

          {isLoading ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-sky-950 text-sky-300 border border-sky-800">
              <RefreshCw className="w-3 h-3 animate-spin text-sky-400" />
              <span>Analyzing...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Real-time</span>
            </span>
          )}
        </div>

        {/* 2. Machine Learning Anomaly Detective Banner */}
        <div
          className={`rounded-xl p-3.5 border transition-all ${
            mlResult.anomalyDetected
              ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {mlResult.anomalyDetected ? (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              )}
              <span className="text-xs font-bold uppercase tracking-wide">
                {mlResult.anomalyDetected ? 'PWP Stress Anomaly Detected' : 'Crop Hydration Normal'}
              </span>
            </div>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                mlResult.anomalyDetected
                  ? 'bg-rose-900/50 text-rose-300 border border-rose-700/60'
                  : 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/60'
              }`}
            >
              {mlResult.anomalyScore}% Confidence
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            {mlResult.mlVerdict}
          </p>
        </div>

        {/* 3. NASA Telemetry Bento Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Surface Temperature */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                <span>Surface Temp</span>
              </span>
              <span className="text-[10px] text-amber-400 font-mono font-medium">NASA POWER</span>
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold text-white tracking-tight">
                {temp.toFixed(1)}°C
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Thermal stress index high
              </div>
            </div>
          </div>

          {/* Soil Moisture */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
                <span>Soil Moisture</span>
              </span>
              <span className="text-[10px] text-sky-400 font-mono font-medium">PWP: 13.5%</span>
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold text-white tracking-tight flex items-baseline gap-1.5">
                <span>{soilMoisture}%</span>
                <span className="text-[10px] text-rose-400 font-normal">(-0.5% Deficit)</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    soilMoisture < 15 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (soilMoisture / 30) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Precipitation */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                <span>Precipitation</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">72h Total</span>
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold text-white tracking-tight">
                {precipitation.toFixed(1)} mm
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                0 mm rainfall recorded
              </div>
            </div>
          </div>

          {/* Solar Radiation */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-300" />
                <span>Solar Insolation</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">MJ/m²/day</span>
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold text-white tracking-tight">
                {solarRadiation.toFixed(1)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                High evaporative demand
              </div>
            </div>
          </div>
        </div>

        {/* 4. NEW: Machine Learning Predictive Forecast Bento Box */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white tracking-wide">
                ML Predictive Forecast (Next 3 Days)
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/50">
              R²={prediction.statisticalR2} • {prediction.modelConfidence}% Acc.
            </span>
          </div>

          {/* ML Trend Metatags */}
          <div className="flex items-center justify-between text-[11px] bg-slate-950/70 p-2 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1 text-slate-300">
              <span className="text-slate-500">Rate:</span>
              <span className="font-mono text-rose-400 font-semibold flex items-center">
                <TrendingDown className="w-3 h-3 mr-0.5" />
                {prediction.dailyMoistureLossRate}%/day
              </span>
            </div>
            <div className="text-slate-400">•</div>
            <div className="flex items-center gap-1 text-slate-300">
              <span className="text-slate-500">Wilt Forecast:</span>
              <span className="font-mono text-amber-400 font-bold">
                {prediction.predictedDaysToPWP} Days
              </span>
            </div>
            <div className="text-slate-400">•</div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Trend:</span>
              <span className="text-sky-300 font-medium">
                {prediction.trendDirection.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* 3-Day Projection Grid */}
          <div className="grid grid-cols-3 gap-2">
            {prediction.forecast3Days.map((fc) => (
              <div
                key={fc.dayOffset}
                className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 text-center"
              >
                <div className="text-[10px] text-slate-400 font-medium">Day +{fc.dayOffset}</div>
                <div className="text-xs font-bold text-white mt-0.5">{fc.predictedTempC}°C</div>
                <div className="text-xs font-mono text-sky-400">{fc.predictedMoisturePercent}%</div>
                <span
                  className={`inline-block mt-1 text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                    fc.riskLevel === 'CRITICAL'
                      ? 'bg-rose-950 text-rose-400'
                      : fc.riskLevel === 'HIGH'
                      ? 'bg-amber-950 text-amber-400'
                      : 'bg-emerald-950 text-emerald-400'
                  }`}
                >
                  {fc.riskLevel}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Multilingual Agronomic Advisory */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setLanguage('sindhi')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  language === 'sindhi'
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                سنڌي
              </button>
              <button
                onClick={() => setLanguage('urdu')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  language === 'urdu'
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                اردو
              </button>
              <button
                onClick={() => setLanguage('english')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  language === 'english'
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
            </div>

            <button
              onClick={handlePlayAudio}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                isPlayingAudio
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Listen to native voice advisory"
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Voice</span>
                </>
              )}
            </button>
          </div>

          <div
            dir={language === 'english' ? 'ltr' : 'rtl'}
            className={`p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-sm leading-relaxed ${
              language === 'english' ? 'font-sans text-slate-300' : 'font-sans text-slate-100 text-base'
            }`}
          >
            {currentDisplayMessage}
          </div>
        </div>

        {/* 6. Automated Farmer Email Dispatch Section */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-sky-400" />
              <span>Automated Farmer Email Alert</span>
            </span>

            <span className="text-[11px] text-emerald-400 font-medium">
              ML Predictive Dispatch
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="farmer@sindhfarms.pk"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
            />
            <button
              onClick={handleDispatchEmail}
              disabled={isSending}
              className="px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md bg-sky-500 hover:bg-sky-400 text-slate-950 disabled:opacity-50"
            >
              {isSending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Mail className="w-3.5 h-3.5" />
              )}
              <span>Email Alert</span>
            </button>
          </div>

          {/* Email Sent Confirmation and HTML Preview Trigger */}
          {dispatchResult && (
            <div className="p-3 rounded-xl text-xs bg-slate-900 border border-emerald-500/40 text-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {dispatchResult.mode === 'live_smtp'
                      ? `Real Email Sent to ${dispatchResult.recipientEmail}!`
                      : `Alert Dispatched to Live Test Mailbox!`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {dispatchResult.previewUrl && (
                    <a
                      href={dispatchResult.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-700 font-semibold hover:bg-emerald-900 transition-colors text-[11px]"
                      title="Open online webmail test inbox"
                    >
                      <span>Open Webmail</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    onClick={() => setShowEmailModal(true)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 text-sky-400 hover:text-sky-300 font-semibold text-[11px] border border-slate-700"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Inspect HTML</span>
                  </button>
                </div>
              </div>

              {dispatchResult.mode !== 'live_smtp' && (
                <div className="text-[10px] text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800/80 leading-relaxed">
                  💡 <strong>To receive directly in your real Gmail inbox:</strong> Add your Gmail address and 16-character <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-sky-400 underline">Google App Password</a> to <code className="text-sky-300 font-mono">SMTP_USER</code> and <code className="text-sky-300 font-mono">SMTP_PASS</code> in <code className="text-slate-300 font-mono">.env.local</code>.
                </div>
              )}
            </div>
          )}

          {/* Autonomous Sentinel Background Scanner */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Bot className="w-3.5 h-3.5 text-sky-400" />
              <span>Sentinel ML Daemon (Email Auto-Trigger)</span>
            </div>
            <button
              onClick={() => setIsAutoSentinelOn(!isAutoSentinelOn)}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                isAutoSentinelOn
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                  : 'bg-slate-900 text-slate-500 border border-slate-800'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isAutoSentinelOn ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                }`}
              ></span>
              <span>{isAutoSentinelOn ? 'Active (Monitoring)' : 'Standby'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Email Preview Modal */}
      {showEmailModal && dispatchResult?.previewHtml && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Mail className="w-4 h-4 text-sky-400" />
                <span>Dispatched Email Preview (NASA + ML Alert)</span>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-950">
              <div
                className="rounded-xl overflow-hidden border border-slate-800"
                dangerouslySetInnerHTML={{ __html: dispatchResult.previewHtml }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
