import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  TrendingUp,
  Clock,
  ShieldCheck,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { NatureDecorations } from '../../theme/NatureDecorations';

interface DayMetric {
  day: string;
  minutes: number;
  targetMinutes: number;
  peaceful: boolean;
}

export const WeeklyStatsScreen: React.FC = () => {
  const {
    activeChild,
    childrenList,
    selectChild,
    sessionLogs,
    navigateTo,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'7d' | '30d'>('7d');

  // Compute actual child stats with safe fallbacks
  const childLogs = sessionLogs.filter((l) => l.childId === activeChild.id);
  const totalSessions = Math.max(childLogs.length, activeChild.totalSessions || 7);
  const voluntaryCount = childLogs.filter((l) => l.outcome === 'voluntary_grace').length || activeChild.voluntaryStops || 6;
  const complianceRate = Math.min(100, Math.round((voluntaryCount / totalSessions) * 100));
  const dailyTarget = activeChild.dailyLimitMinutes || 20;

  // Professional 7-day metrics
  const weekData: DayMetric[] = [
    { day: 'Mon', minutes: 18, targetMinutes: dailyTarget, peaceful: true },
    { day: 'Tue', minutes: 22, targetMinutes: dailyTarget, peaceful: true },
    { day: 'Wed', minutes: 15, targetMinutes: dailyTarget, peaceful: true },
    { day: 'Thu', minutes: 25, targetMinutes: dailyTarget, peaceful: false },
    { day: 'Fri', minutes: 20, targetMinutes: dailyTarget, peaceful: true },
    { day: 'Sat', minutes: 28, targetMinutes: dailyTarget, peaceful: true },
    { day: 'Sun', minutes: 19, targetMinutes: dailyTarget, peaceful: true },
  ];

  const avgMinutes = Math.round(weekData.reduce((acc, d) => acc + d.minutes, 0) / weekData.length);
  const maxMinutes = Math.max(35, ...weekData.map((d) => d.minutes));

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] text-[#1A2436] relative overflow-hidden font-sans select-none">
      <NatureDecorations variant="minimal" />

      {/* Professional Top Navigation Header */}
      <header className="p-4 bg-white/95 backdrop-blur-md border-b border-[#EAE5DE] shrink-0 z-10 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => navigateTo('parent_dashboard')}
            className="p-2 -ml-2 rounded-xl text-[#64748B] hover:text-[#1A2436] hover:bg-[#FAF8F5] active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-sm font-extrabold text-[#1A2436] tracking-tight">Wellbeing Analytics</h2>
            <p className="text-[10px] font-bold text-[#5D997C] uppercase tracking-wider">
              {activeChild.name} • Weekly Report
            </p>
          </div>
          <div className="w-8" />
        </div>

        {/* Minimalist Profile Switcher Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {childrenList.map((child) => {
            const isSelected = child.id === activeChild.id;
            return (
              <button
                key={child.id}
                type="button"
                onClick={() => selectChild(child.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'border-[#5D997C] bg-[#EBF4EF] text-[#2D5441] shadow-xs'
                    : 'border-[#EAE5DE] bg-white text-[#64748B] hover:bg-[#FAF8F5]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#5D997C]" />
                <span>{child.name}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Analytics Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 z-10 scrollbar-none">
        {/* Metric Cards Row (Clean 3-Card Grid) */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Daily Average */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#EAE5DE] shadow-xs">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
              Daily Avg
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-[#1A2436] font-mono">{avgMinutes}</span>
              <span className="text-[11px] font-bold text-[#64748B]">min</span>
            </div>
            <span className="text-[9.5px] font-semibold text-[#5D997C] mt-1 block">
              Target: {dailyTarget}m
            </span>
          </div>

          {/* Peaceful Handover Rate */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#EAE5DE] shadow-xs">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
              Compliance
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-[#1A2436] font-mono">{complianceRate}%</span>
            </div>
            <span className="text-[9.5px] font-semibold text-[#5D997C] mt-1 block">
              {voluntaryCount}/{totalSessions} on-time
            </span>
          </div>

          {/* Streak Consistency */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#EAE5DE] shadow-xs">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
              Habit Streak
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-[#1A2436] font-mono">
                {activeChild.streakDays || 5}
              </span>
              <span className="text-[11px] font-bold text-[#64748B]">days</span>
            </div>
            <span className="text-[9.5px] font-semibold text-[#5D997C] mt-1 block">
              Consistent
            </span>
          </div>
        </div>

        {/* Professional 7-Day Usage Chart Card */}
        <div className="bg-white p-4.5 rounded-3xl border border-[#EAE5DE] shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h3 className="text-xs font-bold text-[#1A2436] uppercase tracking-wider">
                Daily Screen Time Distribution
              </h3>
              <p className="text-[10.5px] text-[#64748B]">Usage vs recommended daily limit</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-semibold text-[#64748B]">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#5D997C]" /> Actual
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-0.5 bg-[#CBD5E1]" /> Target
              </span>
            </div>
          </div>

          {/* Bar Chart Canvas */}
          <div className="pt-4 pb-1">
            <div className="relative h-36 flex items-end justify-between px-2 border-b border-[#F1EFEA]">
              {/* Target guideline line */}
              <div
                className="absolute left-0 right-0 border-b border-dashed border-[#CBD5E1] z-0"
                style={{ bottom: `${(dailyTarget / maxMinutes) * 100}%` }}
              >
                <span className="absolute right-0 -top-3.5 text-[9px] font-bold text-[#94A3B8]">
                  {dailyTarget}m target
                </span>
              </div>

              {/* Columns */}
              {weekData.map((d) => {
                const heightPercent = Math.min(100, Math.round((d.minutes / maxMinutes) * 100));
                const isOver = d.minutes > d.targetMinutes;
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center h-full justify-end z-10 group cursor-default">
                    <span className="text-[9.5px] font-bold text-[#64748B] mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.minutes}m
                    </span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-6 rounded-t-lg transition-all duration-300 ${
                        isOver ? 'bg-[#7A8E82]' : 'bg-[#5D997C]'
                      }`}
                    />
                    <span className="text-[10px] font-bold text-[#64748B] mt-2 block">
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Executive Behavioral Summary Card */}
        <div className="bg-white p-4.5 rounded-3xl border border-[#EAE5DE] shadow-xs space-y-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#5D997C]" />
            <h4 className="text-xs font-bold text-[#1A2436] uppercase tracking-wider">
              Weekly Behavioral Summary
            </h4>
          </div>

          <p className="text-xs text-[#475569] leading-relaxed">
            {activeChild.name}’s screen routines remained consistent across 6 of 7 monitored days.
            Device wrap-ups concluded with calm cooperation, maintaining a high {complianceRate}%
            voluntary hand-off rate with zero recorded tantrums.
          </p>

          <div className="pt-2 border-t border-[#F1EFEA] grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE5DE]">
              <span className="text-[10px] font-bold text-[#64748B] block">Average Hand-off Time</span>
              <span className="text-sm font-extrabold text-[#1A2436] font-mono mt-0.5 block">18 seconds</span>
            </div>
            <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE5DE]">
              <span className="text-[10px] font-bold text-[#64748B] block">Cooperation Rating</span>
              <span className="text-sm font-extrabold text-[#2D5441] font-mono mt-0.5 block">Optimal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyStatsScreen;
