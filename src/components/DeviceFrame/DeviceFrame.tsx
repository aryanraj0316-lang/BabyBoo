import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { ScreenName } from '../../types';
import {
  Smartphone,
  Tablet,
  Maximize2,
  Volume2,
  VolumeX,
  Gauge,
  Layers,
} from 'lucide-react';

interface DeviceFrameProps {
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ children }) => {
  const {
    currentScreen,
    navigateTo,
    activeChild,
    simulationSpeed,
    isAudioMuted,
    toggleAudioMute,
  } = useApp();

  const [deviceFrame, setDeviceFrame] = useState<'iphone' | 'pixel' | 'fullscreen'>('iphone');

  const screens: { id: ScreenName; label: string }[] = [
    { id: 'parent_dashboard', label: '1. Parent Dashboard' },
    { id: 'session_setup', label: '2. Session Setup' },
    { id: 'active_session', label: '3. Active Child Session' },
    { id: 'time_up_warning', label: '4. Time Up & Grace' },
    { id: 'shutdown_illusion', label: '5. Shutdown Illusion' },
    { id: 'post_session_summary', label: '6. Post Session Debrief' },
    { id: 'weekly_stats', label: '7. Weekly Analytics' },
    { id: 'schedule_automation', label: '8. Schedule Automation' },
    { id: 'add_child', label: '9. Add Child Profile' },
    { id: 'settings', label: '10. Settings' },
    { id: 'auth', label: '11. Auth Screen' },
    { id: 'set_pattern', label: '12. Set Pattern Lock' },
    { id: 'splash', label: '13. Onboarding Assessment' },
  ];

  return (
    <div className="min-h-screen bg-[#F4EFEA] text-[#1A2436] flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 select-none font-sans">
      {/* Top Floating Control Bar for Review & Interactive Testing */}
      <header className="w-full max-w-5xl bg-white/95 backdrop-blur-md rounded-2xl border border-[#EAE5DE] p-3 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Branding & Status */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#5D997C] flex items-center justify-center text-white font-black text-sm shadow-xs">
            BB
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-[#1A2436] tracking-tight flex items-center gap-1.5">
              BabyBoo
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EBF4EF] text-[#2D5A43] border border-[#5D997C]/30">
                Pastel UI
              </span>
            </h1>
            <p className="text-[11px] text-[#718096]">
              Active: <span className="text-[#8E4B10] font-bold">{activeChild?.name || 'Leo'}</span>
            </p>
          </div>
        </div>

        {/* Screen Quick Navigator Dropdown */}
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#5D997C]" />
          <select
            value={currentScreen}
            onChange={(e) => navigateTo(e.target.value as ScreenName)}
            className="bg-[#FAF8F5] border border-[#EAE5DE] rounded-xl text-xs font-bold text-[#1A2436] px-3 py-1.5 focus:ring-2 focus:ring-[#5D997C]/30 focus:border-[#5D997C] focus:outline-none cursor-pointer shadow-2xs"
          >
            {screens.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Global Toolbar: Sound, Speed, Device Shell */}
        <div className="flex items-center gap-2">
          {/* Speed Indicator */}
          <div className="flex items-center gap-1 bg-[#FAF8F5] px-2.5 py-1 rounded-xl border border-[#EAE5DE]">
            <Gauge className="w-3.5 h-3.5 text-[#D97706]" />
            <span className="text-[11px] font-bold text-[#4A5568]">{simulationSpeed}x speed</span>
          </div>

          {/* Audio Mute Toggle */}
          <button
            type="button"
            onClick={toggleAudioMute}
            className={`p-2 rounded-xl border transition-all ${
              !isAudioMuted
                ? 'bg-[#EBF4EF] border-[#5D997C]/40 text-[#2D5A43] hover:bg-[#E0EEE6]'
                : 'bg-[#FAF8F5] border-[#EAE5DE] text-[#718096] hover:text-[#1A2436]'
            }`}
            title={isAudioMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Device Shell Switcher */}
          <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#EAE5DE]">
            <button
              type="button"
              onClick={() => setDeviceFrame('iphone')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                deviceFrame === 'iphone'
                  ? 'bg-[#5D997C] text-white shadow-xs'
                  : 'text-[#718096] hover:text-[#1A2436]'
              }`}
              title="iPhone Shell"
            >
              <Smartphone className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setDeviceFrame('pixel')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                deviceFrame === 'pixel'
                  ? 'bg-[#5D997C] text-white shadow-xs'
                  : 'text-[#718096] hover:text-[#1A2436]'
              }`}
              title="Android Pixel Shell"
            >
              <Tablet className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setDeviceFrame('fullscreen')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                deviceFrame === 'fullscreen'
                  ? 'bg-[#5D997C] text-white shadow-xs'
                  : 'text-[#718096] hover:text-[#1A2436]'
              }`}
              title="Fullscreen View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Presentation Device Viewport */}
      <main className="w-full flex-1 flex items-center justify-center relative">
        {deviceFrame === 'iphone' && (
          <div className="relative w-[385px] h-[780px] bg-black rounded-[52px] p-3.5 shadow-2xl ring-1 ring-black/20 shadow-stone-800/20 flex flex-col justify-between overflow-hidden border-[5px] border-stone-800">
            {/* iPhone Dynamic Island */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-50 flex items-center justify-between px-3">
              <div className="w-3 h-3 rounded-full bg-stone-900 border border-stone-800" />
              <div className="w-2 h-2 rounded-full bg-[#5D997C]/70 animate-pulse" />
            </div>

            {/* Screen Content */}
            <div className="w-full h-full rounded-[40px] overflow-hidden bg-[#FAF8F5] relative flex flex-col">
              {children}
            </div>

            {/* Home Indicator Bar */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-32 h-1 bg-stone-400/80 rounded-full z-50 pointer-events-none" />
          </div>
        )}

        {deviceFrame === 'pixel' && (
          <div className="relative w-[385px] h-[780px] bg-stone-900 rounded-[44px] p-3 shadow-2xl ring-1 ring-black/20 shadow-stone-800/20 flex flex-col justify-between overflow-hidden border-[4px] border-stone-800">
            {/* Pixel Camera Punch Hole */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full z-50 border border-stone-800" />

            {/* Screen Content */}
            <div className="w-full h-full rounded-[36px] overflow-hidden bg-[#FAF8F5] relative flex flex-col">
              {children}
            </div>

            {/* Android Navigation Pill */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-20 h-1 bg-stone-400 rounded-full z-50 pointer-events-none" />
          </div>
        )}

        {deviceFrame === 'fullscreen' && (
          <div className="w-full max-w-md h-[820px] rounded-3xl overflow-hidden bg-[#FAF8F5] shadow-xl relative border border-[#EAE5DE] flex flex-col">
            {children}
          </div>
        )}
      </main>
    </div>
  );
};
