'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  CheckCircle2, 
  RefreshCw, 
  Volume2, 
  VolumeX,
  Calendar,
  AlertTriangle,
  Mail,
  BrainCircuit,
  Sparkles
} from 'lucide-react';
import { AlertRecord } from '@/lib/supabase';

export default function AlertsAuditPage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      if (data.alerts) setAlerts(data.alerts);
    } catch (e) {
      console.warn('Failed to load alerts:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const playSpeech = (text: string, id: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (playingId === id) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang.startsWith('ur') || v.lang.startsWith('hi') || v.lang.startsWith('ar'));
    if (voice) utterance.voice = voice;
    utterance.rate = 0.9;

    utterance.onstart = () => setPlayingId(id);
    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);

    window.speechSynthesis.speak(utterance);
  };

  const filteredAlerts = alerts.filter(
    (a) =>
      a.ai_generated_advice.toLowerCase().includes(search.toLowerCase()) ||
      (a.farmer_name && a.farmer_name.toLowerCase().includes(search.toLowerCase())) ||
      (a.recipient_email && a.recipient_email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Bell className="w-3.5 h-3.5" />
            <span>Advisory Dispatch History</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Agricultural Alert Audit Trail
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete record of automated and predictive satellite climate advisories delivered via email to Pakistani farmers.
          </p>
        </div>

        <button
          onClick={loadAlerts}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
          <span>Refresh Dispatches</span>
        </button>
      </div>

      {/* Filter and Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by farmer, email, or advice text..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            Total Broadcasts: <strong className="text-white">{alerts.length}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-sky-950/60 border border-sky-800 text-sky-300 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-sky-400" />
            <span>Delivery: <strong>Automated Email</strong></span>
          </span>
        </div>
      </div>

      {/* Alerts Feed */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
          <span className="text-xs">Loading Dispatched Alerts...</span>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="py-16 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl p-8">
          <p className="text-sm">No dispatches match your search query.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white text-sm">
                    {alert.farmer_name || 'Dadu Outpost'}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs font-mono text-sky-400 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-sky-500" />
                    {alert.recipient_email || 'farmer@sindhfarms.pk'}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {alert.email_status || 'Delivered'}
                  </span>
                  {alert.nasa_data_snapshot?.mlPrediction?.predictedDaysToPWP && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center gap-1">
                      <BrainCircuit className="w-3 h-3" />
                      PWP in {alert.nasa_data_snapshot.mlPrediction.predictedDaysToPWP}d
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-200 leading-relaxed font-sans" dir="auto">
                  {alert.ai_generated_advice}
                </p>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{new Date(alert.created_at).toLocaleString()}</span>
                  </span>
                  <span>•</span>
                  <span>Trigger: ML Predictive Desiccation &amp; Root-zone PWP breach</span>
                </div>
              </div>

              {/* Action Button: Voice Synthesis */}
              <div className="flex items-center gap-2 sm:self-center">
                <button
                  onClick={() => playSpeech(alert.ai_generated_advice, alert.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    playingId === alert.id
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  {playingId === alert.id ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Stop Voice</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>Play Voice</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
