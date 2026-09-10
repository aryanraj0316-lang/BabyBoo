import React from 'react';
import { useApp } from '../../context/AppContext';
import { BuddyMascot } from '../Mascot/BuddyMascot';
import {
  CheckCircle2,
  AlertCircle,
  Flame,
  MessageSquare,
  ArrowRight,
  RotateCcw,
  Clock,
  Battery,
} from 'lucide-react';
import { NatureDecorations } from '../../theme';

export const PostSessionSummaryScreen: React.FC = () => {
  const {
    activeChild,
    activeSession,
    navigateTo,
  } = useApp();

  const isVoluntary = activeSession.outcome === 'voluntary_grace';
  const durationMins = activeSession.config?.durationMinutes || 15;
  const styleUsed = activeSession.config?.shutdownStyle || 'low_battery';

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] text-[#1A2436] p-5 justify-between overflow-y-auto relative">
      <NatureDecorations variant="playful" />

      {/* Top Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-1 bg-white rounded-xl shadow-xs border border-[#EAE5DE]">
              {activeChild.avatar}
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#718096]">Session Complete</p>
              <h2 className="text-sm font-extrabold text-[#1A2436]">{activeChild.name}'s Debrief</h2>
            </div>
          </div>
          <span className="text-xs font-bold text-[#718096] bg-white px-2.5 py-1 rounded-full border border-[#EAE5DE]">
            Parent Eyes Only
          </span>
        </div>

        {/* Outcome Card */}
        <div
          className={`p-5 rounded-[24px] border mb-4 text-center transition-all shadow-xs ${
            isVoluntary
              ? 'bg-[#EBF4EF]/80 border-[#5D997C]/30 text-[#1A2436]'
              : 'bg-[#FEF9E7]/90 border-[#F6D878] text-[#1A2436]'
          }`}
        >
          <div className="my-1">
            <BuddyMascot
              mood={isVoluntary ? 'celebrate' : 'cheerful'}
              size={110}
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black mb-2 mt-2 bg-white shadow-xs border border-[#EAE5DE]">
            {isVoluntary ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#5D997C]" />
                <span className="text-[#2D5A43]">Stopped Voluntarily at Warning</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-[#D97706]" />
                <span className="text-[#8E4B10]">Held Natural Resting Illusion</span>
              </>
            )}
          </div>

          <h3 className="text-lg font-black tracking-tight mb-1">
            {isVoluntary
              ? 'Awesome Self-Discipline!'
              : 'Natural Boundary Held'}
          </h3>

          <p className="text-xs font-medium text-[#4A5568] max-w-[260px] mx-auto leading-relaxed">
            {isVoluntary
              ? `${activeChild.name} put the device down during the friendly grace period. Daily streak protected!`
              : `${activeChild.name} played past the grace period. The device entered ${styleUsed.replace('_', ' ')} rest mode naturally.`}
          </p>

          {isVoluntary && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-[#8E4B10] font-extrabold text-xs bg-[#FEF3C7] border border-[#FDE68A] px-3.5 py-1 rounded-full">
              <Flame className="w-3.5 h-3.5 fill-[#D97706] text-[#D97706]" />
              <span>Streak increased to {activeChild.streakDays} days!</span>
            </div>
          )}
        </div>

        {/* Actionable Conversation Script for Parent */}
        <div className="p-4.5 rounded-[24px] bg-white border border-[#EAE5DE] shadow-xs mb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1A2436] mb-2.5">
            <div className="p-1.5 rounded-xl bg-[#EDE9FE] text-[#6D28D9]">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
            <span>Parent Follow-up Script (Developmental Framing)</span>
          </div>

          <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#EAE5DE] text-xs text-[#4A5568] italic leading-relaxed">
            {isVoluntary
              ? `"Thank you for putting the phone down so nicely when Buddy gave you the wave! You're really good at taking care of your screen time."`
              : `"Our phone ran out of steam and took a little nap today! Next time let's finish our game right when Buddy waves so the phone doesn't get too tired."`}
          </div>

          <p className="text-[10.5px] text-[#718096] mt-2 font-medium">
            This reinforces self-regulation conversationally without fear, tension, or blame.
          </p>
        </div>

        {/* Session Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3.5 rounded-[20px] bg-white border border-[#EAE5DE] shadow-xs flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#EBF4EF] text-[#5D997C]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-[#718096] font-bold uppercase">Duration</p>
              <p className="text-xs font-black text-[#1A2436]">{durationMins} min</p>
            </div>
          </div>

          <div className="p-3.5 rounded-[20px] bg-white border border-[#EAE5DE] shadow-xs flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#FEF3C7] text-[#D97706]">
              <Battery className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-[#718096] font-bold uppercase">Consequence</p>
              <p className="text-xs font-black text-[#1A2436] capitalize">{styleUsed.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA Buttons */}
      <div className="space-y-2.5 pt-4 relative z-10">
        <button
          type="button"
          onClick={() => navigateTo('parent_dashboard')}
          className="w-full py-4 rounded-full bg-[#5D997C] hover:bg-[#4D8569] text-white font-extrabold text-sm shadow-md shadow-[#5D997C]/25 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => navigateTo('session_setup')}
          className="w-full py-3 rounded-full bg-white border border-[#EAE5DE] text-center text-xs font-bold text-[#4A5568] hover:bg-[#F4EFEA] flex items-center justify-center gap-2 transition-all shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#5D997C]" />
          <span>Start Another Session</span>
        </button>
      </div>
    </div>
  );
};
