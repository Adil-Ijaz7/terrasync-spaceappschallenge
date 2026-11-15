'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  Sprout,
  Users,
  ArrowUpRight,
  X,
} from 'lucide-react';
import { FarmRecord } from '@/lib/supabase';
import Link from 'next/link';

// Dynamically import MapComponent to disable SSR for Leaflet
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-56 bg-slate-100 rounded-2xl flex items-center justify-center text-xs text-slate-400 font-medium">
      Loading Location Picker Map...
    </div>
  ),
});

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

  const loadFarms = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/farms', { cache: 'no-store' });
      const data = await res.json();
      if (data.farms && Array.isArray(data.farms)) {
        setFarms(data.farms);
      }
    } catch (e) {
      console.warn('Failed to load farms:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFarms();
  }, [loadFarms]);

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
        setNotification({
          message: `Farm for ${formData.farmer_name} registered successfully! Added to orbital monitoring.`,
          type: 'success',
        });
        setShowAddForm(false);
        setFormData({
          farmer_name: '',
          email: '',
          latitude: '26.7341',
          longitude: '67.7795',
          region: 'Dadu Central',
          crop_type: 'Rice (Basmati)',
        });
        await loadFarms();
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
      (f.email && f.email.toLowerCase().includes(search.toLowerCase())) ||
      (f.crop_type && f.crop_type.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="w-full h-full p-4 sm:p-6 lg:p-8 overflow-y-auto font-sans space-y-6 text-slate-900 bg-[#f4f7f6]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/90 pb-5">
        <div>
          <div className="flex items-center gap-2 text-amber-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Agricultural Registry • Dadu District</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Registered Smallholder Outposts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Farmers receiving NASA satellite telemetry, OLS time-series predictions, and autonomous multilingual alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-xs"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>{showAddForm ? 'Close Form' : 'Register Farm'}</span>
          </button>

          <button
            onClick={loadFarms}
            className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-950 hover:border-slate-400 transition-all shadow-xs"
            title="Refresh Registry"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between shadow-xs ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Add Farm Form with Interactive Map Pin Picker */}
      {showAddForm && (
        <form
          onSubmit={handleAddFarm}
          className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-wide flex items-center gap-2">
                <Sprout className="w-4 h-4 text-emerald-600" />
                <span>Drop Location Pin &amp; Register Farm</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Click anywhere on the map to set GPS coordinates, or enter them manually.
              </p>
            </div>
            <span className="text-[11px] font-mono text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 font-semibold">
              Selected: {formData.latitude}°N, {formData.longitude}°E
            </span>
          </div>

          {/* Interactive Map Pin Picker */}
          <div className="h-64 sm:h-72 rounded-2xl overflow-hidden border border-slate-200 shadow-2xs relative">
            <MapComponent
              selectedLat={parseFloat(formData.latitude) || 26.7341}
              selectedLng={parseFloat(formData.longitude) || 67.7795}
              onSelectCoordinates={(lat, lng) => {
                setFormData((prev) => ({
                  ...prev,
                  latitude: lat.toFixed(4),
                  longitude: lng.toFixed(4),
                }));
              }}
              farms={farms}
              isPickerMode={true}
              mapStyle="voyager"
            />
            <div className="absolute bottom-2 left-2 z-20 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200 text-[11px] text-slate-700 font-medium pointer-events-none shadow-xs flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-amber-600" />
              <span>Click on the map to drop your farm pin</span>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Farmer Name</label>
              <input
                type="text"
                required
                value={formData.farmer_name}
                onChange={(e) => setFormData({ ...formData, farmer_name: e.target.value })}
                placeholder="e.g. Ghulam Rasool Brohi"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Verified Alert Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="farmer@sindhfarms.pk"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-slate-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Crop Variety</label>
              <select
                value={formData.crop_type}
                onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-slate-400"
              >
                <option value="Rice (Basmati)">Rice (Basmati)</option>
                <option value="Rice (IRRI-6)">Rice (IRRI-6)</option>
                <option value="Wheat (Rabi)">Wheat (Rabi)</option>
                <option value="Cotton">Cotton</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Region / Sector</label>
              <input
                type="text"
                required
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="e.g. Johi Canal, Dadu"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Latitude (°N)</label>
              <input
                type="number"
                step="any"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block text-slate-700 mb-1 font-semibold">Longitude (°E)</label>
              <input
                type="number"
                step="any"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-full text-slate-600 hover:text-slate-900 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-full bg-slate-950 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Save & Track Outpost'}
            </button>
          </div>
        </form>
      )}

      {/* Search Bar & Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by farmer name, region, or crop..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-slate-400 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 w-full sm:w-auto justify-between sm:justify-end">
          <span className="px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs">
            Total Monitored: <strong className="text-slate-900">{farms.length}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs">
            Focus: <strong className="text-amber-600">Dadu District, Sindh</strong>
          </span>
        </div>
      </div>

      {/* Farms Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
          <span className="text-xs font-medium">Loading Registered Outposts...</span>
        </div>
      ) : filteredFarms.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-white border border-dashed border-slate-300 rounded-3xl p-8 shadow-2xs">
          <p className="text-sm">No outposts match your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFarms.map((farm) => (
            <div
              key={farm.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-slate-400 transition-all space-y-3.5 flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-600 transition-colors">
                      {farm.farmer_name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      <span>{farm.region}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {farm.crop_type || 'Rice'}
                  </span>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>GPS Coordinates:</span>
                    <span className="font-mono text-slate-800">
                      {farm.latitude.toFixed(4)}°N, {farm.longitude.toFixed(4)}°E
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Alert Email:</span>
                    <span className="font-mono text-slate-700 truncate max-w-[190px]" title={farm.email}>
                      {farm.email}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/"
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  <span>Track on Command Map</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
