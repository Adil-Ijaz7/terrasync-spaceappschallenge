'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Mail, 
  Database, 
  Globe2, 
  CheckCircle2, 
  Copy, 
  BrainCircuit,
  ExternalLink,
  ShieldCheck,
  Zap,
  TrendingDown,
  Sparkles
} from 'lucide-react';

export default function SettingsPage() {
  const [copiedSql, setCopiedSql] = useState(false);

  const sqlSchema = `-- TerraSync Supabase Schema with ML Predictive Analytics & Email Dispatch
CREATE TABLE IF NOT EXISTS farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  region TEXT NOT NULL,
  crop_type TEXT NOT NULL DEFAULT 'Rice',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) ON DELETE SET NULL,
  farmer_name TEXT,
  recipient_email TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  nasa_data_snapshot JSONB NOT NULL,
  ai_generated_advice TEXT NOT NULL,
  email_status TEXT DEFAULT 'delivered',
  created_at TIMESTAMPTZ DEFAULT now()
);`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 font-sans">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Settings className="w-3.5 h-3.5" />
          <span>System &amp; Gateway Configuration</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          ML Predictive Architecture &amp; Automated Email Gateways
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          TerraSync utilizes Machine Learning time-series regression to forecast microclimate risks and dispatches automated HTML email alerts to Pakistani farmers.
        </p>
      </div>

      {/* Architecture Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ML Engine Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <BrainCircuit className="w-5 h-5" />
              <span>Machine Learning Predictive Engine</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
              OLS Time-Series
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Learns from rolling 7-day NASA POWER Agroclimatology records (CERES and MERRA-2 assimilation) to calculate the daily desiccation rate (<code className="text-sky-300 font-mono">dM/dt</code>) and thermal volatility (<code className="text-amber-300 font-mono">dT/dt</code>).
          </p>

          <div className="text-[11px] text-slate-400 space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
            <div>• <strong>Permanent Wilting Point (PWP):</strong> Predicts days until soil reaches lethal 13.5% (Rice) or 10.0% (Wheat) thresholds.</div>
            <div>• <strong>Confidence Calibration:</strong> Calculates coefficient of determination (R²) across past readings (typically 88%–98% fit).</div>
            <div>• <strong>Actionable Output:</strong> Generates twilight irrigation schedules before root hypoxia or wilting occurs.</div>
          </div>
        </div>

        {/* Automated Email Gateway Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
              <Mail className="w-5 h-5" />
              <span>Automated Farmer Email Gateway</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
              Nodemailer / SMTP
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Delivers institutional, formatted HTML advisories complete with 3-day projection grids, danger ratings, and native Sindhi (سنڌي) &amp; Urdu (اردو) instructions.
          </p>

          <div className="text-[11px] text-slate-400 space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 font-mono">
            <div>• <strong>SMTP_HOST:</strong> smtp.gmail.com / SendGrid / AWS SES</div>
            <div>• <strong>SMTP_PORT:</strong> 587 (TLS) or 465 (SSL)</div>
            <div>• <strong>SMTP_USER &amp; PASS:</strong> Your SMTP or App Password credentials</div>
            <div>• <strong>Fallback:</strong> Instant visual verification simulation if credentials omitted</div>
          </div>
        </div>
      </div>

      {/* Supabase Schema Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>PostgreSQL Database Schema (Cloud Persistence)</span>
          </div>
          <button
            onClick={() => copyToClipboard(sqlSchema)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
          >
            {copiedSql ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
          {sqlSchema}
        </pre>
      </div>

      {/* NASA Open Data Citations */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3 text-xs">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Globe2 className="w-4 h-4 text-sky-400" />
          <span>NASA Open Science Data Citations</span>
        </div>
        <div className="space-y-2 text-slate-300">
          <div>
            • <strong>NASA POWER Project:</strong> Prediction Of Worldwide Energy Resources (Daily Point Agroclimatology API, CERES / MERRA-2 assimilation).
          </div>
          <div>
            • <strong>NASA EONET v3:</strong> Earth Observatory Natural Event Tracker (Active wildfires, floods, severe storms).
          </div>
          <div>
            • <strong>Target District:</strong> Dadu District, Sindh, Pakistan (Centroid 26.7341° N, 67.7795° E).
          </div>
        </div>
      </div>
    </div>
  );
}
