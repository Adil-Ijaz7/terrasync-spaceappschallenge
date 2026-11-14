'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Globe2,
  MapPin,
  Bell,
  Smartphone,
  Settings,
  Maximize2,
  Activity,
  Menu,
  X,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [utcTime, setUtcTime] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setUtcTime(
        now.toUTCString().slice(17, 25) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const navLinks = [
    { href: '/', label: 'Command Center', icon: Globe2 },
    { href: '/farms', label: 'Farm Registry', icon: MapPin },
    { href: '/alerts', label: 'Predictions & Alerts', icon: Bell },
    { href: '/field', label: 'Field Mobile PWA', icon: Smartphone },
    { href: '/settings', label: 'ML & Settings', icon: Settings },
  ];

  return (
    <header
      suppressHydrationWarning
      className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 h-14 flex items-center justify-between text-slate-200 select-none transition-all"
    >
      {/* Brand & NASA Space Apps Badge */}
      <div suppressHydrationWarning className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:shadow-sky-500/40 transition-all">
            <Globe2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-bold text-base tracking-tight text-white">Terra<span className="text-sky-400">Sync</span></span>
              <span className="text-[10px] font-medium bg-sky-950 text-sky-400 border border-sky-800/60 px-1.5 py-0.5 rounded-full">
                NASA Space Apps
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block mt-0.5">
              Earth&apos;s True Detective • Dadu Agricultural Resilience
            </p>
          </div>
        </Link>
      </div>

      {/* Desktop Main Navigation Tabs */}
      <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80 text-xs">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-sky-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right Telemetry Status & Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live NASA API Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium text-slate-400">NASA POWER &amp; EONET</span>
          <span className="text-emerald-400 font-semibold">Live</span>
        </div>

        {/* Region Tag */}
        <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/70 border border-slate-800/60 text-[11px] text-slate-400">
          <MapPin className="w-3 h-3 text-sky-400" />
          <span>Dadu, Sindh</span>
        </div>

        {/* UTC Clock */}
        <div
          suppressHydrationWarning
          className="hidden xl:block font-mono text-[11px] text-slate-400 px-2 py-1 rounded bg-slate-900/50 border border-slate-800/50"
        >
          {mounted ? utcTime : '--:--:-- UTC'}
        </div>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullScreen}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Open Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 p-4 space-y-2 lg:hidden shadow-2xl animate-fadeIn">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2">Navigation</div>
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 px-2">
            <span>NASA Data Status</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Connected
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
