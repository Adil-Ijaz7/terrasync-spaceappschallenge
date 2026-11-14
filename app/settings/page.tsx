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
    <div className="w-full h-full p-4 sm:p-6 lg:p-8 overflow-y-auto font-sans space-y-6 text-slate-900 bg-[#f4f7f6]">
      {/* Header */}
      <div className="border-b border-slate-200/90 pb-5">
        <div className="flex items-center gap-2 text-amber-600 text-xs font-semibold uppercase tracking-wider mb-1">
          <Settings className="w-3.5 h-3.5" />
          <span>System &amp; Gateway Configuration</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          ML Predictive Architecture &amp; Automated Gateways
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          TerraSync utilizes Machine Learning time-series regression to forecast microclimate risks and dispatches automated HTML email alerts to Pakistani farmers.
        </p>
      </div>

      {/* Architecture Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ML Engine Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Time-Series Regression Engine</h3>
              <p className="text-[11px] text-slate-500">Ordinary Least Squares (OLS) Predictive Forensics</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
            <p>
              TerraSync uses rolling 7-day multi-temporal NASA POWER satellite telemetry to calculate empirical moisture depletion rates (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">dM/dt</code>) and thermal gradients (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">dT/dt</code>).
            </p>
            <p>
              When root-zone moisture (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">GWETPROF</code>) trajectory forecasts a Permanent Wilting Point breach in $\le 3.0$ days, an autonomous email advisory is compiled and dispatched.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">PWP Threshold (Rice):</span>
            <span className="font-mono font-bold text-slate-900">13.5% soil moisture</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">PWP Threshold (Wheat):</span>
            <span className="font-mono font-bold text-slate-900">10.0% soil moisture</span>
          </div>
        </div>

        {/* Email Gateway Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Autonomous Email Dispatch Gateway</h3>
              <p className="text-[11px] text-slate-500">Institutional Nodemailer SMTP + Zero-Config Simulation</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
            <p>
              Replaces fragile SMS/chat limits with rich, structured HTML email advisories delivered directly to registered smallholder farmers and agriculture extension officers in Dadu District.
            </p>
            <p>
              Features dynamic multi-day microclimate projections, actionable advice in Native Sindhi (سنڌي), Native Urdu (اردو), and English synthesis.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Supported Transports:</span>
            <span className="font-mono font-bold text-emerald-600">Gmail SMTP / Custom SMTP</span>
          </div>
        </div>
      </div>

      {/* SQL Schema Section */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-sm">PostgreSQL / Supabase Schema</h3>
          </div>
          <button
            onClick={() => copyToClipboard(sqlSchema)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all shadow-2xs"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy Schema'}</span>
          </button>
        </div>

        <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
          {sqlSchema}
        </pre>
      </div>
    </div>
  );
}
