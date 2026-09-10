import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  Lock,
  Crown,
  ShieldCheck,
  Volume2,
  VolumeX,
  Smartphone,
  Trash2,
  Plus,
  Check,
} from 'lucide-react';
import { formatAgeGroupDisplay } from './ParentDashboardScreen';
import { NatureDecorations } from '../../theme/NatureDecorations';

export const SettingsScreen: React.FC = () => {
  const {
    user,
    childrenList,
    deleteChild,
    navigateTo,
    togglePremium,
    isAudioMuted,
    toggleAudioMute,
    loadDemoProfiles,
    resetOnboarding,
  } = useApp();

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] text-[#1A2436] relative overflow-hidden font-sans select-none">
      <NatureDecorations variant="subtle" />

      {/* Top Header */}
      <div className="p-4 bg-white/90 backdrop-blur-md border-b border-[#EAE5DE] flex items-center justify-between shrink-0 z-10 shadow-xs">
        <button
          type="button"
          onClick={() => navigateTo('parent_dashboard')}
          className="p-2 rounded-xl bg-[#FAF8F5] border border-[#EAE5DE] text-[#64748B] hover:text-[#1A2436] active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-extrabold text-[#1A2436]">Parent Settings</h2>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 z-10 scrollbar-none">
        {/* Premium Upgrade Banner */}
        <div
          onClick={() => setShowSubscriptionModal(true)}
          className={`p-4 rounded-[24px] cursor-pointer transition-all border ${
            user.isPremium
              ? 'bg-[#FEF9E7] border-[#F9ECC0] text-[#1A2436] shadow-xs'
              : 'bg-white border-[#EAE5DE] text-[#1A2436] shadow-[0_2px_14px_rgba(26,36,54,0.04)]'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7A6216]">
              <Crown className="w-4 h-4 text-[#F6D878] fill-[#F6D878]" />
              <span>{user.isPremium ? 'BabyBoo Premium Active' : 'Upgrade to Premium'}</span>
            </div>
            <span className="text-[10px] font-bold bg-[#FEF9E7] text-[#7A6216] border border-[#F9ECC0] px-2.5 py-0.5 rounded-full">
              {user.isPremium ? 'PRO' : '$4.99/mo'}
            </span>
          </div>
          <p className="text-xs text-[#64748B] mb-2 leading-relaxed">
            {user.isPremium
              ? 'All 3 shutdown styles, unlimited child profiles, and full weekly compliance analytics unlocked.'
              : 'Unlock all shutdown styles, multi-child tracking, and advanced compliance reports.'}
          </p>
          <p className="text-[11px] font-bold text-[#5D997C] hover:underline">
            {user.isPremium ? 'Manage Subscription' : 'View Premium Plans →'}
          </p>
        </div>

        {/* Account & Testing: Sign Out / Retake Onboarding / Demo Profiles */}
        <div className="p-4 rounded-[24px] bg-white border border-[#EAE5DE] shadow-[0_2px_14px_rgba(26,36,54,0.04)] text-[#1A2436] space-y-3">
          <h4 className="text-xs font-bold text-[#1A2436] uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#5D997C]" />
            <span>Account & Onboarding</span>
          </h4>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DE]">
            <div>
              <p className="text-xs font-bold text-[#1A2436]">Screen Wellbeing Assessment</p>
              <p className="text-[10px] text-[#64748B]">Restart the 7-step developmental flow</p>
            </div>
            <button
              type="button"
              onClick={() => resetOnboarding()}
              className="px-3.5 py-1.5 bg-[#5D997C] hover:bg-[#51876D] text-xs font-bold text-white rounded-full shadow-xs transition-all cursor-pointer"
            >
              Start Flow →
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DE]">
            <div>
              <p className="text-xs font-bold text-[#1A2436]">Load Sample Profiles</p>
              <p className="text-[10px] text-[#64748B]">Populate demo profiles for Leo & Maya</p>
            </div>
            <button
              type="button"
              onClick={() => {
                loadDemoProfiles();
                alert('Demo profiles loaded: Leo and Maya');
              }}
              className="px-3.5 py-1.5 bg-white hover:bg-[#FAF8F5] text-xs font-bold text-[#1A2436] border border-[#EAE5DE] rounded-full shadow-xs transition-all cursor-pointer"
            >
              Load Demo
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DE]">
            <div>
              <p className="text-xs font-bold text-rose-700">Sign Out</p>
              <p className="text-[10px] text-[#64748B]">Log out and return to Splash</p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('splash')}
              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-700 rounded-full transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Manage Child Profiles */}
        <div className="p-4 rounded-[24px] bg-white border border-[#EAE5DE] shadow-[0_2px_14px_rgba(26,36,54,0.04)] text-[#1A2436] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#1A2436] uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-[#5D997C]" />
              <span>Manage Child Profiles</span>
            </h4>
            <button
              type="button"
              onClick={() => navigateTo('add_child')}
              className="text-xs font-bold text-[#5D997C] flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          <div className="space-y-2">
            {childrenList.map((child) => (
              <div
                key={child.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DE]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#5D997C] text-white flex items-center justify-center text-sm font-black shadow-xs">
                    {child.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1A2436]">{child.name}</p>
                    <p className="text-[10px] text-[#64748B]">
                      {formatAgeGroupDisplay(child.ageGroup)} • {child.dailyLimitMinutes} min limit
                    </p>
                  </div>
                </div>

                {childrenList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => deleteChild(child.id)}
                    className="p-2 text-[#94A3B8] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete child profile"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* App Audio & Micro-interactions */}
        <div className="p-4 rounded-[24px] bg-white border border-[#EAE5DE] shadow-[0_2px_14px_rgba(26,36,54,0.04)] text-[#1A2436]">
          <h4 className="text-xs font-bold text-[#1A2436] uppercase tracking-wider mb-3">
            Sound & Audio
          </h4>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DE]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white border border-[#EAE5DE] text-[#5D997C] shadow-xs">
                {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-xs font-bold text-[#1A2436]">Procedural Sound FX</p>
                <p className="text-[10px] text-[#64748B]">Gentle marimba chimes & transition prompts</p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleAudioMute}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                !isAudioMuted
                  ? 'bg-[#5D997C] text-white shadow-xs'
                  : 'bg-white border border-[#EAE5DE] text-[#64748B]'
              }`}
            >
              {!isAudioMuted ? 'Enabled' : 'Muted'}
            </button>
          </div>
        </div>

        {/* COPPA Privacy & Data Guarantee */}
        <div className="p-4 rounded-[24px] bg-[#EBF4EF] border border-[#D1E6DA] text-[#2D5441]">
          <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-[#2D5441]">
            <ShieldCheck className="w-4 h-4 text-[#5D997C]" />
            <span>COPPA & Child Privacy Architecture</span>
          </div>
          <p className="text-xs text-[#2D5441]/90 leading-relaxed">
            BabyBoo never collects children's biometric data, camera input, or microphone recordings. All settings, limits, and progress logs reside securely under the verified parent's ownership.
          </p>
        </div>
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-scale-up text-[#1A2436] border border-[#EAE5DE]">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FEF9E7] text-[#7A6216] border border-[#F9ECC0] flex items-center justify-center mx-auto mb-2 shadow-xs">
                <Crown className="w-6 h-6 fill-[#F6D878] text-[#7A6216]" />
              </div>
              <h3 className="text-lg font-extrabold text-[#1A2436]">BabyBoo Premium</h3>
              <p className="text-xs text-[#64748B]">Gentle Screen-Time Management Subscription</p>
            </div>

            <div className="space-y-2 mb-6">
              {[
                'All 3 authentic shutdown illusion styles',
                'Unlimited child profiles',
                'Detailed weekly wellbeing analytics',
                'Multi-device parent sync',
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-medium text-[#475569]">
                  <Check className="w-4 h-4 text-[#5D997C] shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                togglePremium(!user.isPremium);
                setShowSubscriptionModal(false);
              }}
              className="w-full py-3.5 bg-[#5D997C] hover:bg-[#51876D] text-white rounded-full font-bold text-xs shadow-xs mb-2 transition-all cursor-pointer"
            >
              {user.isPremium ? 'Switch to Free Tier' : 'Upgrade to Premium ($4.99/mo)'}
            </button>

            <button
              type="button"
              onClick={() => setShowSubscriptionModal(false)}
              className="w-full py-2 text-center text-xs font-bold text-[#64748B] hover:text-[#1A2436] cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
