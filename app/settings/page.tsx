'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Mail, 
  Send, 
  CheckCircle2, 
  RefreshCw, 
  Radio, 
  Users, 
  Calendar, 
  ShieldCheck, 
  Sparkles,
  MapPin,
  Check,
  AlertCircle
} from 'lucide-react';
import { FarmRecord } from '@/lib/supabase';

const TIME_PRESETS = [
  { label: '06:00 AM (Dawn / Fajr)', value: '06:00', note: 'Pre-sunrise irrigation window' },
  { label: '08:00 AM (Morning)', value: '08:00', note: 'Morning field shift' },
  { label: '05:30 PM (Twilight / Sham)', value: '17:30', note: 'Optimal twilight cooling' },
  { label: '08:00 PM (Night)', value: '20:00', note: 'Night soil moisture update' },
];

export default function AutomatedDispatchSettingsPage() {
  const [dispatchTime, setDispatchTime] = useState('06:00');
  const [isEnabled, setIsEnabled] = useState(true);
  const [language, setLanguage] = useState<'sindhi' | 'urdu' | 'english'>('sindhi');
  const [targetScope, setTargetScope] = useState<'all_registered_outposts' | 'threatened_only'>('all_registered_outposts');
  
  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [isLoadingFarms, setIsLoadingFarms] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  
  const [isRunningBatch, setIsRunningBatch] = useState(false);
  const [batchResults, setBatchResults] = useState<any[] | null>(null);
  const [lastDispatchedTime, setLastDispatchedTime] = useState<string | null>(null);

  // Load schedule configuration and registered farms on mount
  useEffect(() => {
    // 1. Fetch schedule config
    fetch('/api/settings/schedule')
      .then((res) => res.json())
      .then((data) => {
        if (data.schedule) {
          setDispatchTime(data.schedule.dispatchTime || '06:00');
          setIsEnabled(typeof data.schedule.enabled === 'boolean' ? data.schedule.enabled : true);
          setLanguage(data.schedule.language || 'sindhi');
          setTargetScope(data.schedule.targetScope || 'all_registered_outposts');
          if (data.schedule.lastDispatchedAt) {
            setLastDispatchedTime(new Date(data.schedule.lastDispatchedAt).toLocaleString());
          }
        }
      })
      .catch((err) => console.warn('Could not load schedule config:', err));

    // 2. Fetch registered farms
    fetch('/api/farms', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.farms && Array.isArray(data.farms)) {
          setFarms(data.farms);
        }
      })
      .catch((err) => console.warn('Could not load farms:', err))
      .finally(() => setIsLoadingFarms(false));
  }, []);

  // Save updated schedule
  const handleSaveSchedule = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveFeedback(null);

    try {
      const res = await fetch('/api/settings/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: isEnabled,
          dispatchTime,
          language,
          targetScope,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveFeedback(`Schedule armed! All registered outposts will receive daily advisory emails at ${dispatchTime} PKT.`);
      } else {
        setSaveFeedback('Failed to save schedule settings.');
      }
    } catch (err: any) {
      setSaveFeedback('Error saving schedule: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Run instant batch broadcast to all registered outposts
  const handleRunBatchDispatchNow = async () => {
    setIsRunningBatch(true);
    setBatchResults(null);
    setSaveFeedback(null);

    try {
      const res = await fetch('/api/sentinel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forceAll: targetScope === 'all_registered_outposts',
          language,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBatchResults(data.dispatches || []);
        const nowStr = new Date().toLocaleString();
        setLastDispatchedTime(nowStr);

        // Update last dispatched in schedule storage
        fetch('/api/settings/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lastDispatchedAt: new Date().toISOString() }),
        }).catch(() => {});
      } else {
        setBatchResults([{ error: data.error || data.message || 'Batch run completed with no emails triggered.' }]);
      }
    } catch (err: any) {
      setBatchResults([{ error: 'Failed to execute batch broadcast: ' + err.message }]);
    } finally {
      setIsRunningBatch(false);
    }
  };

  return (
    <div className="w-full h-full p-4 sm:p-6 lg:p-8 overflow-y-auto font-sans bg-[#f4f7f6] text-slate-900 space-y-6">
      
      {/* Header */}
      <div className="border-b border-slate-200/90 pb-5">
        <div className="flex items-center gap-2 text-amber-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Clock className="w-3.5 h-3.5" />
          <span>Orbital Sentinel Automation</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Automated Daily Email Dispatch Gateway
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure the autonomous daily broadcast schedule. At this time every day, TerraSync pulls live NASA satellite telemetry and delivers tailored advisory emails to all registered smallholder outposts in Dadu District.
        </p>
      </div>

      {/* Main Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (7 cols): Schedule Configuration Card */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Automated Broadcast Schedule</h3>
                <p className="text-[11px] text-slate-500">Daily autonomous time-series dispatch to registered outposts</p>
              </div>
            </div>

            {/* Active Toggle Status Pill */}
            <button
              onClick={() => setIsEnabled(!isEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isEnabled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
              <span>{isEnabled ? 'Schedule Active' : 'Schedule Paused'}</span>
            </button>
          </div>

          <form onSubmit={handleSaveSchedule} className="space-y-4">
            
            {/* Daily Broadcast Time Picker */}
            <div>
              <label className="block text-slate-700 text-xs font-semibold mb-1.5 flex items-center justify-between">
                <span>Daily Automated Dispatch Time (PKT)</span>
                <span className="text-[11px] font-mono text-slate-400">Asia/Karachi UTC+5</span>
              </label>
              
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  value={dispatchTime}
                  onChange={(e) => setDispatchTime(e.target.value)}
                  className="w-48 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-base font-bold text-slate-900 font-mono outline-none focus:border-slate-400 focus:bg-white transition-all shadow-2xs"
                />
                <span className="text-xs text-slate-500">
                  Emails will automatically dispatch daily at <strong>{dispatchTime}</strong>.
                </span>
              </div>

              {/* Quick Time Presets */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {TIME_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setDispatchTime(preset.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      dispatchTime === preset.value
                        ? 'bg-slate-950 text-white border-slate-950 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-slate-400'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Scope Selection */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                Target Outposts Scope
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <label
                  onClick={() => setTargetScope('all_registered_outposts')}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                    targetScope === 'all_registered_outposts'
                      ? 'bg-amber-50/70 border-amber-300 text-amber-950 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="scope"
                    checked={targetScope === 'all_registered_outposts'}
                    onChange={() => setTargetScope('all_registered_outposts')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-bold block">All Registered Outposts</span>
                    <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                      Send daily satellite report &amp; forecast to every farmer in registry.
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => setTargetScope('threatened_only')}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                    targetScope === 'threatened_only'
                      ? 'bg-amber-50/70 border-amber-300 text-amber-950 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="scope"
                    checked={targetScope === 'threatened_only'}
                    onChange={() => setTargetScope('threatened_only')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-bold block">Threatened Outposts Only</span>
                    <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                      Only send when ML predicts PWP wilt in $\le 3$ days or severe hazard.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Language Selector */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-slate-700 text-xs font-semibold mb-1.5">
                Primary Email Advisory Language
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLanguage('sindhi')}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    language === 'sindhi'
                      ? 'bg-slate-950 text-white border-slate-950 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                  }`}
                >
                  سنڌي (Sindhi)
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('urdu')}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    language === 'urdu'
                      ? 'bg-slate-950 text-white border-slate-950 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                  }`}
                >
                  اردو (Urdu)
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('english')}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    language === 'english'
                      ? 'bg-slate-950 text-white border-slate-950 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Action Row */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {lastDispatchedTime ? `Last broadcast: ${lastDispatchedTime}` : 'Daily broadcast pending configuration'}
              </span>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-xs disabled:opacity-50"
              >
                {isSaving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>Save Schedule Settings</span>
              </button>
            </div>
          </form>

          {saveFeedback && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{saveFeedback}</span>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Instant Batch Dispatch & Registered Outposts */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Instant Batch Broadcast Trigger Card */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Instant Daily Batch Broadcast</h3>
                  <p className="text-[11px] text-slate-500">Test or execute batch dispatch right now</p>
                </div>
              </div>

              <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">
                {farms.length} Outposts
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Triggers the complete automated workflow immediately: pulls live NASA POWER satellite telemetry for all {farms.length} registered smallholder outposts, runs OLS predictive regression, and dispatches personalized emails.
            </p>

            <button
              onClick={handleRunBatchDispatchNow}
              disabled={isRunningBatch}
              className="w-full py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs tracking-wide transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isRunningBatch ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Broadcasting to All Outposts...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>Execute Daily Dispatch Now ({farms.length} Outposts)</span>
                </>
              )}
            </button>

            {/* Real-time Dispatch Results */}
            {batchResults && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Batch Dispatch Audit Receipts:
                </span>
                <div className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar">
                  {batchResults.map((item, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 text-[11px] space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{item.farmName || 'Smallholder Outpost'}</span>
                        <span className="text-emerald-700 font-mono text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {item.dispatchStatus || 'DELIVERED'}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[10px] font-mono truncate">
                        {item.email} • {item.crop}
                      </div>
                      {item.triggerReason && (
                        <div className="text-slate-600 text-[10px] leading-tight">
                          {item.triggerReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Registered Smallholder Outposts Roster */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                <h4 className="font-bold text-slate-900 text-xs">Active Outposts in Daily Broadcast</h4>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Dadu District</span>
            </div>

            {isLoadingFarms ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading registered outposts...</div>
            ) : farms.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No registered outposts yet. Add one in Outposts tab.</div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
                {farms.map((f) => (
                  <div key={f.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{f.farmer_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {f.region} • {f.crop_type || 'Rice'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Armed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
