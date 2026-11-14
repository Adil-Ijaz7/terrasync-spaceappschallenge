'use client';

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Plus, 
  Search, 
  Mail, 
  Database,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
  Sprout,
  Users
} from 'lucide-react';
import { FarmRecord } from '@/lib/supabase';
import Link from 'next/link';

export default function FarmsPage() {
  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    farmer_name: '',
    email: '',
    latitude: '26.7341',
    longitude: '67.7795',
    region: 'Dadu Central',
    crop_type: 'Rice (Basmati)',
  });

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadFarms = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/farms');
      const data = await res.json();
      if (data.farms) setFarms(data.farms);
    } catch (e) {
      console.warn('Failed to load farms:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFarms();
  }, []);

  const handleAddFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotification(null);

    try {
      const res = await fetch('/api/farms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_name: formData.farmer_name,
          email: formData.email,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          region: formData.region,
          crop_type: formData.crop_type,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotification({ message: `Farm for ${formData.farmer_name} registered successfully!`, type: 'success' });
        setShowAddForm(false);
        setFormData({
          farmer_name: '',
          email: '',
          latitude: '26.7341',
          longitude: '67.7795',
          region: 'Dadu Central',
          crop_type: 'Rice (Basmati)',
        });
        loadFarms();
      } else {
        setNotification({ message: data.error || 'Failed to register farm', type: 'error' });
      }
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredFarms = farms.filter(
    (f) =>
      f.farmer_name.toLowerCase().includes(search.toLowerCase()) ||
      f.region.toLowerCase().includes(search.toLowerCase()) ||
      (f.email && f.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Agricultural Registry • Dadu District</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Registered Smallholder Farms
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Local farmers across Dadu, Sindh receiving real-time NASA satellite telemetry and ML predictive email advisories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Register Farm</span>
          </button>

          <button
            onClick={loadFarms}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            notification.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Add Farm Form Modal / Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleAddFarm}
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <Sprout className="w-4 h-4 text-emerald-400" />
              <span>Register New Smallholder Farm</span>
            </h3>
            <span className="text-[11px] text-slate-400">GPS &amp; Email Contact Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Farmer Name</label>
              <input
                type="text"
                required
                value={formData.farmer_name}
                onChange={(e) => setFormData({ ...formData, farmer_name: e.target.value })}
                placeholder="e.g. Ghulam Rasool Brohi"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Farmer Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. farmer@sindhfarms.pk"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Crop Type</label>
              <input
                type="text"
                required
                value={formData.crop_type}
                onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
                placeholder="e.g. Rice (IRRI-6 / Basmati)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Region / Tehsil</label>
              <input
                type="text"
                required
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="e.g. Johi Canal, Dadu"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Latitude (°N)</label>
              <input
                type="number"
                step="any"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Longitude (°E)</label>
              <input
                type="number"
                step="any"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Save Farm'}
            </button>
          </div>
        </form>
      )}

      {/* Search & Statistics Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, region, or email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 w-full sm:w-auto justify-between sm:justify-end">
          <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            Total Farms: <strong className="text-white">{farms.length}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            Target District: <strong className="text-sky-400">Dadu, Sindh</strong>
          </span>
        </div>
      </div>

      {/* Farms Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-sky-400" />
          <span className="text-xs">Loading Registered Farms...</span>
        </div>
      ) : filteredFarms.length === 0 ? (
        <div className="py-16 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl p-8">
          <p className="text-sm">No farms match your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFarms.map((farm) => (
            <div
              key={farm.id}
              className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all space-y-4 flex flex-col justify-between group shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base group-hover:text-sky-300 transition-colors">
                      {farm.farmer_name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      <span>{farm.region}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {farm.crop_type}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/70 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>GPS Coordinates:</span>
                    <span className="font-mono text-slate-200">
                      {farm.latitude.toFixed(3)}°N, {farm.longitude.toFixed(3)}°E
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Automated Email:</span>
                    <span className="font-mono text-sky-400 truncate max-w-[190px]" title={farm.email}>
                      {farm.email}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={`/?lat=${farm.latitude}&lng=${farm.longitude}`}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Inspect on Command Map</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
