import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { ShutdownStyle } from '../../types';
import {
  ArrowLeft,
  Play,
  Eye,
  BatteryCharging,
  Wind,
  Moon,
  X,
  Sparkles,
} from 'lucide-react';
import { soundEngine } from '../../utils/audio';
import { NatureDecorations } from '../../theme';

export const SessionSetupScreen: React.FC = () => {
  const { activeChild, startSession, navigateTo } = useApp();
  const [durationMinutes, setDurationMinutes] = useState(activeChild.dailyLimitMinutes || 15);
  const [gracePeriodSeconds, setGracePeriodSeconds] = useState(activeChild.defaultGraceSeconds || 60);
  const [shutdownStyle, setShutdownStyle] = useState<ShutdownStyle>(activeChild.preferredStyle || 'low_battery');
  const [previewStyle, setPreviewStyle] = useState<ShutdownStyle | null>(null);

  const durationPresets = [5, 10, 15, 20, 30, 45];
  const gracePresets = [30, 60, 90, 120];

  const shutdownStylesList = [
    {
      id: 'low_battery' as ShutdownStyle,
      title: '🔋 Low Battery',
      subtitle: 'Depleted power illusion',
      desc: 'Screen displays authentic low-battery indicator (1%), gently dims, and rests for 60 seconds.',
      icon: BatteryCharging,
      badgeColor: 'text-[#B45309] bg-[#FEF3C7] border-[#FDE68A]',
      iconColor: 'text-[#D97706] bg-[#FEF3C7]',
    },
    {
      id: 'cooldown' as ShutdownStyle,
      title: '🌀 Cooldown Nap',
      subtitle: 'Thermal pause break',
      desc: 'Gentle screen ripple and "Device taking a cooling nap" message, allowing a calm break.',
      icon: Wind,
      badgeColor: 'text-[#0284C7] bg-[#E0F2FE] border-[#BAE6FD]',
      iconColor: 'text-[#0284C7] bg-[#E0F2FE]',
    },
    {
      id: 'needs_rest' as ShutdownStyle,
      title: '💤 Needs a Rest',
      subtitle: 'Bedtime rest illusion',
      desc: 'Dreamy twilight sky with soft breathing stars. Framed entirely around the phone resting, never child blame.',
      icon: Moon,
      badgeColor: 'text-[#6D28D9] bg-[#EDE9FE] border-[#DDD6FE]',
      iconColor: 'text-[#6D28D9] bg-[#EDE9FE]',
    },
  ];

  const handleStart = () => {
    startSession({
      childId: activeChild.id,
      durationMinutes,
      gracePeriodSeconds,
      shutdownStyle,
    });
  };

  const handleOpenPreview = (style: ShutdownStyle, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playSoftAmbientChime();
    setPreviewStyle(style);
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] text-[#1A2436] p-5 justify-between overflow-y-auto relative">
      <NatureDecorations variant="gentle" />

      {/* Top App Bar */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => navigateTo('parent_dashboard')}
            className="p-2.5 rounded-2xl bg-white border border-[#EAE5DE] text-[#1A2436] hover:bg-[#F4EFEA] active:scale-95 transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#718096]">Configure Screen Time</span>
            <h2 className="text-sm font-extrabold text-[#1A2436]">
              Session for {activeChild.name} {activeChild.avatar}
            </h2>
          </div>
          <div className="w-9" />
        </div>

        {/* Section 1: Duration Selector */}
        <div className="mb-4 bg-white p-4.5 rounded-[24px] border border-[#EAE5DE] shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <div>
              <label className="text-xs font-bold text-[#1A2436]">Session Duration</label>
              <p className="text-[10.5px] text-[#718096]">Target active time for this play window</p>
            </div>
            <span className="text-xs font-black text-[#5D997C] bg-[#EBF4EF] border border-[#5D997C]/30 px-3 py-1 rounded-full">
              {durationMinutes} minutes
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {durationPresets.map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setDurationMinutes(mins)}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  durationMinutes === mins
                    ? 'bg-[#5D997C] text-white shadow-sm shadow-[#5D997C]/25 scale-[1.02]'
                    : 'bg-[#F4EFEA] border border-[#EAE5DE] text-[#4A5568] hover:bg-[#EAE5DE]'
                }`}
              >
                {mins} min
              </button>
            ))}
          </div>

          <input
            type="range"
            min={1}
            max={60}
            step={1}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="w-full h-2 bg-[#EAE5DE] rounded-lg appearance-none cursor-pointer accent-[#5D997C]"
          />
        </div>

        {/* Section 2: Grace Period */}
        <div className="mb-4 bg-white p-4.5 rounded-[24px] border border-[#EAE5DE] shadow-xs">
          <div className="flex justify-between items-center mb-2.5">
            <div>
              <label className="text-xs font-bold text-[#1A2436]">Gentle Warning Grace Period</label>
              <p className="text-[10.5px] text-[#718096]">Time allowed for child to wrap up naturally</p>
            </div>
            <span className="text-xs font-black text-[#8E4B10] bg-[#FEF3C7] border border-[#FDE68A] px-3 py-1 rounded-full">
              {gracePeriodSeconds}s
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {gracePresets.map((secs) => (
              <button
                key={secs}
                type="button"
                onClick={() => setGracePeriodSeconds(secs)}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  gracePeriodSeconds === secs
                    ? 'bg-[#F6D878] text-[#78350F] shadow-xs font-black scale-[1.02]'
                    : 'bg-[#F4EFEA] border border-[#EAE5DE] text-[#4A5568] hover:bg-[#EAE5DE]'
                }`}
              >
                {secs}s
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Shutdown Style Picker with Live Preview */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <label className="text-xs font-bold text-[#1A2436]">Natural Resting Illusion</label>
            <span className="text-[10px] font-semibold text-[#718096] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#5D997C]" />
              No child blame
            </span>
          </div>

          <div className="space-y-2.5">
            {shutdownStylesList.map((style) => {
              const Icon = style.icon;
              const isSelected = shutdownStyle === style.id;

              return (
                <div
                  key={style.id}
                  onClick={() => setShutdownStyle(style.id)}
                  className={`p-3.5 rounded-[20px] border-2 transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-[#5D997C] bg-[#EBF4EF]/60 shadow-xs'
                      : 'border-[#EAE5DE] bg-white hover:border-[#D1C9BE]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${style.iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-[#1A2436]">{style.title}</p>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-full bg-[#5D997C] text-white text-[9px] font-black">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#718096] mt-0.5 leading-snug">{style.desc}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleOpenPreview(style.id, e)}
                      className="p-1.5 px-2.5 rounded-xl bg-[#F4EFEA] hover:bg-[#EAE5DE] text-[#4A5568] text-[10px] font-bold flex items-center gap-1 shrink-0 ml-2 border border-[#EAE5DE]"
                      title="Preview this illusion"
                    >
                      <Eye className="w-3 h-3 text-[#5D997C]" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Launch Confirmation Card */}
      <div className="pt-2 relative z-10">
        <div className="p-3 bg-white rounded-2xl border border-[#EAE5DE] mb-3 text-center text-xs text-[#718096] shadow-xs">
          Summary: <span className="font-bold text-[#1A2436]">{durationMinutes} min</span> •{' '}
          <span className="font-bold text-[#1A2436]">{gracePeriodSeconds}s grace</span> •{' '}
          <span className="font-bold text-[#1A2436]">{activeChild.name}</span>
        </div>

        <button
          type="button"
          onClick={handleStart}
          className="w-full py-4 rounded-full bg-[#5D997C] hover:bg-[#4D8569] text-white font-extrabold text-sm shadow-md shadow-[#5D997C]/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Start Session for {activeChild.name}</span>
        </button>
      </div>

      {/* Live Preview Modal */}
      {previewStyle && (
        <div className="fixed inset-0 z-50 bg-[#1A2436]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-[28px] p-6 text-[#1A2436] text-center shadow-xl relative border border-[#EAE5DE] animate-scale-up">
            <button
              type="button"
              onClick={() => setPreviewStyle(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-[#F4EFEA] text-[#718096] hover:text-[#1A2436] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {previewStyle === 'low_battery' && (
              <div className="py-4 space-y-3.5">
                <div className="w-16 h-8 mx-auto border-2 border-[#E05252] rounded-lg p-0.5 relative flex items-center">
                  <div className="w-2 h-full bg-[#E05252] rounded-xs animate-pulse" />
                  <div className="absolute -right-2 top-1.5 w-1.5 h-3 bg-[#E05252] rounded-r" />
                </div>
                <h4 className="text-base font-bold text-[#1A2436]">Low Battery Illusion</h4>
                <p className="text-xs text-[#718096]">1% of battery remaining indicator</p>
                <div className="p-3.5 bg-[#FAF8F5] rounded-2xl text-xs text-[#4A5568] text-left border border-[#EAE5DE]">
                  Screen visibly steps down brightness and displays an authentic battery depletion warning before fading to rest for 60s.
                </div>
              </div>
            )}

            {previewStyle === 'cooldown' && (
              <div className="py-4 space-y-3.5">
                <div className="w-14 h-14 mx-auto rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center animate-spin">
                  <Wind className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-[#1A2436]">Device Cooling Down</h4>
                <p className="text-xs text-[#718096]">Taking a brief 60-second rest break</p>
                <div className="p-3.5 bg-[#FAF8F5] rounded-2xl text-xs text-[#4A5568] text-left border border-[#EAE5DE]">
                  🌀 Gentle screen ripple effect and friendly, non-frightening cool-down status.
                </div>
              </div>
            )}

            {previewStyle === 'needs_rest' && (
              <div className="py-4 space-y-3.5">
                <div className="w-14 h-14 mx-auto rounded-full bg-[#EDE9FE] text-[#6D28D9] flex items-center justify-center animate-pulse">
                  <Moon className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-[#1A2436]">Device Power Nap</h4>
                <p className="text-xs text-[#718096]">"Your phone worked hard and needs a nap"</p>
                <div className="p-3.5 bg-[#FAF8F5] rounded-2xl text-xs text-[#4A5568] text-left border border-[#EAE5DE]">
                  Dreamy twilight ambient and soft breathing animation. Completely avoids child frustration or blame.
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setShutdownStyle(previewStyle);
                setPreviewStyle(null);
              }}
              className="w-full py-3.5 bg-[#5D997C] hover:bg-[#4D8569] text-white rounded-full font-bold text-xs shadow-md shadow-[#5D997C]/25 transition-all"
            >
              Select & Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
