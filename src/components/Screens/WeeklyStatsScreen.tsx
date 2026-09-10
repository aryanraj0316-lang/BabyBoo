import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  Flame,
  Calendar,
  TrendingUp,
  BatteryCharging,
  Wind,
  Moon,
  Award,
  CheckCircle,
  Shield,
} from 'lucide-react';
import { NatureDecorations } from '../../theme/NatureDecorations';

export const WeeklyStatsScreen: React.FC = () => {
  const {
    activeChild,
    childrenList,
    selectChild,
    sessionLogs,
    navigateTo,
  } = useApp();

  const [filterOutcome, setFilterOutcome] = useState<'all' | 'voluntary' | 'shutdown'>('all');

  const childLogs = sessionLogs.filter((l) => l.childId === activeChild.id);
  const voluntaryCount = childLogs.filter((l) => l.outcome === 'voluntary_grace').length || activeChild.voluntaryStops;
  const shutdownCount = childLogs.filter((l) => l.outcome === 'required_shutdown').length;
  const totalSessions = childLogs.length || activeChild.totalSessions;
  const complianceRate = totalSessions > 0 ? Math.round((voluntaryCount / totalSessions) * 100) : 100;

  const mockWeeklyDistribution = [
    { day: 'Mon', voluntary: 2, shutdown: 0 },
    { day: 'Tue', voluntary: 1, shutdown: 1 },
    { day: 'Wed', voluntary: 2, shutdown: 0 },
    { day: 'Thu', voluntary: 3, shutdown: 0 },
    { day: 'Fri', voluntary: 1, shutdown: 1 },
    { day: 'Sat', voluntary: 2, shutdown: 0 },
    { day: 'Sun', voluntary: 2, shutdown: 0 },
  ];

  const filteredLogs = childLogs.filter((log) => {
    if (filterOutcome === 'voluntary') return log.outcome === 'voluntary_grace';
    if (filterOutcome === 'shutdown') return log.outcome === 'required_shutdown';
    return true;
  });

  const getStyleIcon = (style: string) => {
    switch (style) {
      case 'low_battery':
        return <BatteryCharging className="w-3.5 h-3.5 text-[#5D997C]" />;
      case 'cooldown':
        return <Wind className="w-3.5 h-3.5 text-[#89B6D8]" />;
      case 'needs_rest':
      default:
        return <Moon className="w-3.5 h-3.5 text-[#C4B5FD]" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] text-[#1A2436] relative overflow-hidden font-sans select-none">
      <NatureDecorations variant="subtle" />

      {/* Top Header */}
      <div className="p-4 bg-white/90 backdrop-blur-md border-b border-[#EAE5DE] shrink-0 z-10 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => navigateTo('parent_dashboard')}
            className="p-2 rounded-xl bg-[#FAF8F5] border border-[#EAE5DE] text-[#64748B] hover:text-[#1A2436] active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Digital Wellbeing Analytics</span>
            <h2 className="text-sm font-extrabold text-[#1A2436]">Compliance Tracker</h2>
          </div>
          <div className="w-8" />
        </div>

        {/* Child Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {childrenList.map((child) => (
            <button
              key={child.id}
              type="button"
              onClick={() => selectChild(child.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all shrink-0 cursor-pointer ${
                child.id === activeChild.id
                  ? 'border-2 border-[#5D997C] bg-[#EBF4EF] text-[#2D5441] shadow-xs'
                  : 'border-[#EAE5DE] bg-white text-[#64748B] hover:bg-[#FAF8F5]'
              }`}
            >
              <span>{child.avatar}</span>
              <span>{child.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 z-10 scrollbar-none">
        {/* Compliance Hero Metric Card */}
        <div className="p-5 rounded-[24px] bg-white border border-[#EAE5DE] shadow-[0_2px_14px_rgba(26,36,54,0.04)] text-[#1A2436]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Weekly Compliance Rate
            </span>
            <div className="flex items-center gap-1 text-[#7A6216] text-xs font-bold bg-[#FEF9E7] border border-[#F9ECC0] px-2.5 py-0.5 rounded-full shadow-xs">
              <Flame className="w-3.5 h-3.5 fill-[#F6D878] text-[#F6D878]" />
              <span>{activeChild.streakDays} Day Streak</span>
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-extrabold text-[#1A2436]">{complianceRate}%</span>
            <span className="text-xs text-[#2D5441] font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Voluntary Compliance</span>
            </span>
          </div>

          <p className="text-xs text-[#64748B] mb-4">
            {voluntaryCount} of {totalSessions} sessions ended peacefully during warning grace countdown.
          </p>

          {/* Progress bar */}
          <div className="w-full bg-[#FAF8F5] border border-[#EAE5DE] h-3 rounded-full overflow-hidden flex p-0.5">
            <div
              className="bg-[#5D997C] h-full rounded-full transition-all duration-700"
              style={{ width: `${complianceRate}%` }}
              title="Voluntary stops"
            />
            <div
              className="bg-[#F6D878] h-full rounded-full transition-all duration-700 ml-0.5"
              style={{ width: `${100 - complianceRate}%` }}
              title="Full rest required"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#64748B] mt-2.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#5D997C]" />
              <span className="font-medium">Voluntary ({voluntaryCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#F6D878]" />
              <span className="font-medium">Device Rested ({shutdownCount})</span>
            </div>
          </div>
        </div>

        {/* 7-Day Visual Bar Chart */}
        <div className="p-4 rounded-[24px] bg-white border border-[#EAE5DE] shadow-[0_2px_14px_rgba(26,36,54,0.04)] text-[#1A2436]">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-[#1A2436] uppercase tracking-wider">
              7-Day Session Breakdown
            </h4>
            <Calendar className="w-4 h-4 text-[#64748B]" />
          </div>

          <div className="flex items-end justify-between h-32 pt-4 px-2">
            {mockWeeklyDistribution.map((item) => {
              const maxVal = 4;
              const volHeight = (item.voluntary / maxVal) * 80;
              const shutHeight = (item.shutdown / maxVal) * 80;

              return (
                <div key={item.day} className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="w-6 flex flex-col-reverse items-center gap-0.5">
                    {item.voluntary > 0 && (
                      <div
                        style={{ height: `${volHeight}px` }}
                        className="w-full bg-[#5D997C] rounded-t-lg transition-all duration-500 shadow-xs"
                      />
                    )}
                    {item.shutdown > 0 && (
                      <div
                        style={{ height: `${shutHeight}px` }}
                        className="w-full bg-[#F6D878] rounded-t-lg transition-all duration-500 shadow-xs"
                      />
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-[#64748B]">{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Earned Milestones & Badges */}
        <div className="p-4 rounded-[24px] bg-white border border-[#EAE5DE] shadow-[0_2px_14px_rgba(26,36,54,0.04)] text-[#1A2436]">
          <h4 className="text-xs font-bold text-[#1A2436] uppercase tracking-wider mb-3">
            Milestone Badges
          </h4>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-2xl bg-[#FEF9E7] border border-[#F9ECC0]">
              <Award className="w-6 h-6 mx-auto mb-1 text-[#7A6216]" />
              <p className="text-xs font-extrabold text-[#7A6216] leading-tight">5-Day Hero</p>
              <p className="text-[9px] text-[#7A6216]/80 mt-0.5">Unlocked</p>
            </div>

            <div className="p-3 rounded-2xl bg-[#EBF4EF] border border-[#D1E6DA]">
              <CheckCircle className="w-6 h-6 mx-auto mb-1 text-[#2D5441]" />
              <p className="text-xs font-extrabold text-[#2D5441] leading-tight">Peaceful Stop</p>
              <p className="text-[9px] text-[#2D5441]/80 mt-0.5">15x Voluntary</p>
            </div>

            <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DE] opacity-75">
              <Shield className="w-6 h-6 mx-auto mb-1 text-[#64748B]" />
              <p className="text-xs font-extrabold text-[#475569] leading-tight">10-Day Master</p>
              <p className="text-[9px] text-[#64748B] mt-0.5">1 day left</p>
            </div>
          </div>
        </div>

        {/* Detailed Session History Log */}
        <div className="p-4 rounded-[24px] bg-white border border-[#EAE5DE] shadow-[0_2px_14px_rgba(26,36,54,0.04)] text-[#1A2436]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-[#1A2436] uppercase tracking-wider">
              Detailed History
            </h4>

            {/* Filter Toggle */}
            <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-full border border-[#EAE5DE] text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setFilterOutcome('all')}
                className={`px-2.5 py-0.5 rounded-full cursor-pointer transition-all ${
                  filterOutcome === 'all' ? 'bg-[#5D997C] text-white shadow-xs font-bold' : 'text-[#64748B]'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterOutcome('voluntary')}
                className={`px-2.5 py-0.5 rounded-full cursor-pointer transition-all ${
                  filterOutcome === 'voluntary' ? 'bg-[#5D997C] text-white shadow-xs font-bold' : 'text-[#64748B]'
                }`}
              >
                Voluntary
              </button>
              <button
                type="button"
                onClick={() => setFilterOutcome('shutdown')}
                className={`px-2.5 py-0.5 rounded-full cursor-pointer transition-all ${
                  filterOutcome === 'shutdown' ? 'bg-[#5D997C] text-white shadow-xs font-bold' : 'text-[#64748B]'
                }`}
              >
                Rested
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DE] flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white border border-[#EAE5DE] flex items-center justify-center shadow-xs">
                    {getStyleIcon(log.shutdownStyle)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1A2436]">
                      {log.durationMinutes} min session
                    </p>
                    <p className="text-[10px] text-[#64748B]">
                      {new Date(log.startedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    log.outcome === 'voluntary_grace'
                      ? 'bg-[#EBF4EF] text-[#2D5441] border-[#D1E6DA]'
                      : log.outcome === 'required_shutdown'
                        ? 'bg-[#FEF9E7] text-[#7A6216] border-[#F9ECC0]'
                        : 'bg-[#FAF8F5] text-[#64748B] border-[#EAE5DE]'
                  }`}
                >
                  {log.outcome === 'voluntary_grace'
                    ? 'Stopped at Warning'
                    : log.outcome === 'required_shutdown'
                      ? 'Device Rested 💤'
                      : 'Ended Early'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
