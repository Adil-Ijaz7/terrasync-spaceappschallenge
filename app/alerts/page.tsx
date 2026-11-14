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
      const res = await fetch('/api/alerts', { cache: 'no-store' });
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
    <div className="w-full h-full p-4 sm:p-6 lg:p-8 overflow-y-auto font-sans space-y-6 text-slate-900 bg-[#f4f7f6]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/90 pb-5">
        <div>
          <div className="flex items-center gap-2 text-amber-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <Bell className="w-3.5 h-3.5" />
            <span>Advisory Dispatch History</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Agricultural Alert Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete record of automated and predictive satellite climate advisories delivered via email to Pakistani farmers.
          </p>
        </div>

        <button
          onClick={loadAlerts}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-slate-200 hover:border-slate-400 text-slate-700 text-xs font-semibold transition-all shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
          <span>Refresh Dispatches</span>
        </button>
      </div>

      {/* Filter and Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by farmer, email, or advice text..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-slate-400 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs">
            Total Broadcasts: <strong className="text-slate-900">{alerts.length}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1.5 shadow-2xs font-medium">
            <Mail className="w-3.5 h-3.5 text-emerald-600" />
            <span>Delivery: <strong>Automated Email</strong></span>
          </span>
        </div>
      </div>

      {/* Alerts Feed */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
          <span className="text-xs font-medium">Loading Dispatched Alerts...</span>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-white border border-dashed border-slate-300 rounded-3xl p-8 shadow-2xs">
          <p className="text-sm">No dispatches match your search query.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-slate-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 text-sm">
                    {alert.farmer_name || 'Dadu Outpost'}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-mono text-slate-600 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-amber-500" />
                    {alert.recipient_email || 'farmer@sindhfarms.pk'}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {alert.email_status || 'Delivered'}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-sans bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {alert.ai_generated_advice}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {alert.created_at ? new Date(alert.created_at).toLocaleString() : 'Recent'}
                  </span>
                  <span>•</span>
                  <span>NASA POWER &amp; OLS ML Telemetry Snapshot</span>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 shrink-0">
                <button
                  onClick={() => playSpeech(alert.ai_generated_advice, alert.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all shadow-2xs ${
                    playingId === alert.id
                      ? 'bg-amber-500 text-white animate-pulse'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {playingId === alert.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{playingId === alert.id ? 'Stop' : 'Voice Playback'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
