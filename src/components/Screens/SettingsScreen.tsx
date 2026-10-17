import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  Lock,
  ShieldCheck,
  Volume2,
  VolumeX,
  Smartphone,
  Trash2,
  Plus,
  KeyRound,
  LogOut,
} from 'lucide-react';
import { formatAgeGroupDisplay } from './ParentDashboardScreen';
import { NatureDecorations } from '../../theme/NatureDecorations';

export const SettingsScreen: React.FC = () => {
  const {
    user,
    childrenList,
    deleteChild,
    navigateTo,
    isAudioMuted,
    toggleAudioMute,
  } = useApp();

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] text-[#1A2436] relative overflow-hidden font-sans select-none">
      <NatureDecorations variant="subtle" />

      {/* Top Header */}
      <div className="p-4 bg-white/95 backdrop-blur-md border-b border-[#EAE5DE] flex items-center justify-between shrink-0 z-10">
        <button
          type="button"
          onClick={() => navigateTo('parent_dashboard')}
          className="p-2 rounded-xl bg-[#FAF8F5] border border-[#EAE5DE] text-[#64748B] hover:text-[#1A2436] active:scale-95 transition-all cursor-pointer"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-extrabold text-[#1A2436]">Settings</h2>
          <p className="text-[10px] text-[#64748B] font-medium">Controls & Preferences</p>
        </div>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 z-10 scrollbar-none">
        {/* Parent Account & Security */}
        <div className="p-4 rounded-2xl bg-white border border-[#EAE5DE] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#5D997C]" />
              <span>Parent Account & Security</span>
            </h4>
            <span className="text-[10px] font-bold text-[#5D997C] bg-[#EBF4EF] px-2 py-0.5 rounded-full">
              PIN Protected
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE5DE]">
            <div>
              <p className="text-xs font-bold text-[#1A2436]">{user.email || 'parent@babyboo.app'}</p>
              <p className="text-[10px] text-[#64748B]">Primary Parent Guardian</p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('set_pattern')}
              className="px-2.5 py-1.5 bg-white border border-[#EAE5DE] hover:border-[#5D997C] text-[11px] font-bold text-[#1A2436] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <KeyRound className="w-3 h-3 text-[#5D997C]" />
              <span>Change PIN</span>
            </button>
          </div>
        </div>

        {/* Manage Child Profiles */}
        <div className="p-4 rounded-2xl bg-white border border-[#EAE5DE] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-[#5D997C]" />
              <span>Child Profiles</span>
            </h4>
            <button
              type="button"
              onClick={() => navigateTo('add_child')}
              className="text-xs font-bold text-[#5D997C] flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Child</span>
            </button>
          </div>

          <div className="space-y-2">
            {childrenList.map((child) => (
              <div
                key={child.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE5DE]"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl text-white flex items-center justify-center text-xs font-black shadow-xs"
                    style={{ backgroundColor: (child as any).colorAccent || '#5D997C' }}
                  >
                    {child.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1A2436]">{child.name}</p>
                    <p className="text-[10px] text-[#64748B]">
                      {formatAgeGroupDisplay(child.ageGroup)} • {child.dailyLimitMinutes}m daily limit
                    </p>
                  </div>
                </div>

                {childrenList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => deleteChild(child.id)}
                    className="p-1.5 text-[#94A3B8] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove child profile"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Audio Preferences */}
        <div className="p-4 rounded-2xl bg-white border border-[#EAE5DE] shadow-xs space-y-3">
          <h4 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
            Audio & Sound Effects
          </h4>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE5DE]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white border border-[#EAE5DE] text-[#5D997C] shadow-xs">
                {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-xs font-bold text-[#1A2436]">Procedural Sound FX</p>
                <p className="text-[10px] text-[#64748B]">Gentle marimba chimes & cues</p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleAudioMute}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                !isAudioMuted
                  ? 'bg-[#5D997C] text-white shadow-xs'
                  : 'bg-white border border-[#EAE5DE] text-[#64748B]'
              }`}
            >
              {!isAudioMuted ? 'Enabled' : 'Muted'}
            </button>
          </div>
        </div>

        {/* Privacy & COPPA Guarantee */}
        <div className="p-3.5 rounded-2xl bg-[#EBF4EF]/80 border border-[#D1E6DA] text-[#2D5441]">
          <div className="flex items-center gap-2 mb-1 text-xs font-bold text-[#2D5441]">
            <ShieldCheck className="w-4 h-4 text-[#5D997C] shrink-0" />
            <span>COPPA & Child Privacy Architecture</span>
          </div>
          <p className="text-[11px] text-[#2D5441]/85 leading-relaxed">
            BabyBoo never collects biometric data, camera input, or microphone recordings. All screen time settings and progress logs reside securely on-device.
          </p>
        </div>

        {/* Sign Out Action */}
        <button
          type="button"
          onClick={() => navigateTo('splash')}
          className="w-full py-2.5 bg-white hover:bg-rose-50 border border-[#EAE5DE] hover:border-rose-200 text-xs font-bold text-[#64748B] hover:text-rose-600 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
