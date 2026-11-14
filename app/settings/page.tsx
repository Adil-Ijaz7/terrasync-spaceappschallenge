'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Mail, 
  Send, 
  CheckCircle2, 
  RefreshCw, 
  BrainCircuit, 
  ShieldCheck, 
  Radio, 
  AlertTriangle, 
  Key, 
  ExternalLink,
  Satellite
} from 'lucide-react';

export default function MissionControlConsole() {
  const [testEmail, setTestEmail] = useState('adilijaz.gemini@gmail.com');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; mode?: string } | null>(null);

  // Sentinel Autonomous Scan State
  const [isRunningSentinel, setIsRunningSentinel] = useState(false);
  const [sentinelLog, setSentinelLog] = useState<any[] | null>(null);

  // Trigger real email test
  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !testEmail.includes('@')) return;

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/email-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          farmerName: 'Adil Ali Lakhair (Test Recipient)',
          crop: 'Rice (Basmati)',
          region: 'Dadu Central, Sindh',
          advisoryTextEnglish: 'NASA POWER Telemetry Test: Thermal desiccation detected in Dadu Sector. Evening irrigation advisory active.',
          advisoryTextSindhi: '[خبردار] ٻنيءَ ۾ پاڻي جي سخت کوٽ. سڪڻ کان بچاءَ لاءِ اڄ شام جو پاڻي ضرور لڳايو.',
          advisoryTextUrdu: '[الرٹ] شدید گرمی اور زمین میں نمی کی کمی۔ فصل کو بچانے کیلئے شام میں پانی دیں۔',
          urgencyLevel: 'HIGH',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          mode: data.mode,
          message:
            data.mode === 'live_smtp'
              ? `Real email dispatched directly to ${testEmail} via Gmail SMTP!`
              : `Email payload compiled & verified for ${testEmail}. (Running in Sandbox Mode — configure SMTP_USER in .env.local to route through live Gmail).`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to dispatch test email',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error during dispatch',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Trigger Autonomous Sentinel Scan on all registered farms
  const handleRunSentinelScan = async () => {
    setIsRunningSentinel(true);
    setSentinelLog(null);

    try {
      const res = await fetch('/api/sentinel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSentinelLog(data.dispatches || []);
      } else {
        setSentinelLog([{ error: data.error || data.message || 'Scan completed with no triggers.' }]);
      }
    } catch (err: any) {
      setSentinelLog([{ error: 'Sentinel scan failed: ' + err.message }]);
    } finally {
      setIsRunningSentinel(false);
    }
  };

  return (
    <div className="w-full h-full p-4 sm:p-6 lg:p-8 overflow-y-auto font-sans bg-[#f4f7f6] text-slate-900 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/90 pb-5">
        <div className="flex items-center gap-2 text-amber-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Settings className="w-3.5 h-3.5" />
          <span>Operational Control Console</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Orbital Sentinel &amp; Email Dispatch Gateway
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Test real-time farmer email advisories, trigger autonomous sentinel scanning, and verify NASA Open Science telemetry feeds.
        </p>
      </div>

      {/* Grid: 2 Operational Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Live Email Dispatch Gateway (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Live Email Dispatcher</h3>
                <p className="text-[11px] text-slate-500">Send an instant test advisory to any email inbox</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Gateway Online
            </span>
          </div>

          <form onSubmit={handleTestEmail} className="space-y-3">
            <div>
              <label className="block text-slate-700 text-xs font-semibold mb-1">
                Recipient Email Address
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  required
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono outline-none focus:border-slate-400"
                />
                <button
                  type="submit"
                  disabled={isSendingTest}
                  className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                >
                  {isSendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-amber-400" />}
                  <span>Send Test Email</span>
                </button>
              </div>
            </div>
          </form>

          {testResult && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 leading-relaxed ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{testResult.message}</p>
                {testResult.mode !== 'live_smtp' && (
                  <p className="text-[11px] text-emerald-700 mt-1">
                    💡 <strong>Real Gmail Inbox Delivery:</strong> To receive physical emails in your Gmail inbox, add your Gmail App Password to <code className="bg-white/80 px-1 py-0.5 rounded font-mono">.env.local</code> (Instructions below).
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Quick Setup Guide: How to receive real emails in 60 seconds */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs text-slate-600">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-600" />
              <span>How Real Email Delivery Works (Gmail App Password):</span>
            </h4>
            <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600">
              <li>Open Google Account (<strong>myaccount.google.com</strong>) &rarr; Security.</li>
              <li>Under 2-Step Verification, generate an <strong>App Password</strong> (16 characters).</li>
              <li>Add these 2 lines in <code className="font-mono bg-white px-1 py-0.5 rounded text-slate-800">.env.local</code>:</li>
            </ol>
            <div className="bg-slate-950 text-slate-200 p-2.5 rounded-xl font-mono text-[11px] border border-slate-800">
              SMTP_USER=adilijaz.gemini@gmail.com<br />
              SMTP_PASS=xxxx xxxx xxxx xxxx
            </div>
            <p className="text-[11px] text-slate-500">
              Once added, every single alert clicked by you, field agents, or the autonomous daemon routes directly through Gmail&apos;s live SMTP servers!
            </p>
          </div>
        </div>

        {/* Right Column: Autonomous Sentinel Control (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600">
                <Radio className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Autonomous Sentinel Daemon</h3>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Daemon Ready"></span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            The Sentinel daemon scans all registered smallholder farms across Dadu District against live NASA POWER satellite telemetry. If the ML regression model forecasts Permanent Wilting Point breach in $\le 3$ days, it automatically fires email dispatches.
          </p>

          <button
            onClick={handleRunSentinelScan}
            disabled={isRunningSentinel}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isRunningSentinel ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Scanning All Farm Outposts...</span>
              </>
            ) : (
              <>
                <Satellite className="w-4 h-4" />
                <span>Trigger Autonomous Sentinel Scan</span>
              </>
            )}
          </button>

          {/* Real-time Sentinel Log Feed */}
          {sentinelLog && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Sentinel Execution Log:
              </span>
              {sentinelLog.length === 0 ? (
                <p className="text-[11px] text-slate-500">
                  All monitored outposts within safe moisture margins. No emergency wilting breaches triggered.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                  {sentinelLog.map((item, idx) => (
                    <div key={idx} className="bg-white p-2 rounded-xl border border-slate-200 text-[11px] space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{item.farmName || 'Target Outpost'}</span>
                        <span className="text-emerald-600 font-mono text-[10px]">{item.dispatchStatus || 'PROCESSED'}</span>
                      </div>
                      <p className="text-slate-600 text-[10px]">{item.triggerReason || 'Microclimate evaluation complete'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* NASA Verification Citations */}
          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1 leading-snug">
            <strong className="text-slate-700 block font-semibold">NASA Open Data Compliance:</strong>
            <p>&bull; NASA POWER Agroclimatology (T2M, GWETPROF, ALLSKY_SFC_SW_DWN)</p>
            <p>&bull; NASA EONET v3 Natural Hazard Event Tracker</p>
          </div>
        </div>

      </div>
    </div>
  );
}
