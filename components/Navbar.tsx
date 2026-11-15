'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Globe2,
  MapPin,
  Bell,
  Smartphone,
  Settings,
  Maximize2,
  Minimize2,
  Rocket,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => { });
      setIsFullscreen(false);
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
    <aside
      suppressHydrationWarning
      className="w-14 sm:w-16 h-screen bg-white border-r border-slate-200/90 flex flex-col items-center justify-between py-4 shrink-0 z-40 select-none shadow-xs"
    >
      {/* Top Brand Glyph (Abstract 3-Orbital Mark matching reference design) */}
      <Link
        href="/"
        className="flex flex-col items-center gap-1 group cursor-pointer"
        title="TerraSync: Earth's True Detective • Space Apps 2026"
      >
        <div className="flex items-center gap-1 group-hover:scale-105 transition-transform">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-950"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-slate-950"></span>
        </div>
        <span className="w-2.5 h-2.5 rounded-full bg-slate-950 group-hover:scale-105 transition-transform"></span>
      </Link>

      {/* Main Navigation Stack */}
      <nav className="flex flex-col items-center gap-2.5">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isActive
                ? 'bg-slate-950 text-white shadow-md shadow-slate-950/25 scale-105'
                : 'text-slate-500 hover:text-slate-950 hover:bg-slate-100/90'
                }`}
              title={item.label}
            >
              <Icon className="w-4 h-4" />
            </Link>
          );
        })}
      </nav>

      {/* Bottom Utility Controls */}
      <div className="flex flex-col items-center gap-2.5">
        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullScreen}
          className="w-9 h-9 rounded-full text-slate-500 hover:text-slate-950 hover:bg-slate-100 flex items-center justify-center transition-all"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fit Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* NASA Space Apps Badge Glyph */}
        <div
          className="w-9 h-9 rounded-full bg-slate-950 text-white flex items-center justify-center font-bold text-xs shadow-xs cursor-default"
          title="NASA Space Apps Challenge 2026 • Earth's True Detective"
        >
          <Rocket className="w-4 h-4 text-amber-400" />
        </div>
      </div>
    </aside>
  );
}
