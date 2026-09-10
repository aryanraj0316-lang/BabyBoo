import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  X,
  Check,
  Sliders,
} from 'lucide-react';
import { MONSTER_PROFILES, SWITCH_OFF_PROFILES } from '../../data/researchCitations';
import type { MonsterTypeId, SwitchOffStyleId } from '../../types/onboarding';
import { NatureDecorations } from '../../theme/NatureDecorations';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const formatWidgetDuration = (totalMinutes: number): string => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h} hr ${m} min`;
  if (h > 0) return `${h} hr${h > 1 ? 's' : ''}`;
  return `${m} min`;
};

export const ScheduleAutomationScreen: React.FC = () => {
  const {
    activeChild,
    navigateTo,
    quickWidgetMinutes,
    setQuickWidgetMinutes,
    isWidgetAddedToHome,
    setIsWidgetAddedToHome,
  } = useApp();

  // Quick Screen Time Widget State
  const [showQuickWidgetModal, setShowQuickWidgetModal] = useState<boolean>(false);
  const [tempWidgetHours, setTempWidgetHours] = useState<number>(() => Math.floor(quickWidgetMinutes / 60));
  const [tempWidgetMinutes, setTempWidgetMinutes] = useState<number>(() => quickWidgetMinutes % 60);

  const openEditWidgetModal = () => {
    setTempWidgetHours(Math.floor(quickWidgetMinutes / 60));
    setTempWidgetMinutes(quickWidgetMinutes % 60);
    setShowQuickWidgetModal(true);
  };

  // Ending experience state
  const [selectedEndingType, setSelectedEndingType] = useState<'monster' | 'switchoff'>('monster');
  const [selectedMonsterId, setSelectedMonsterId] = useState<MonsterTypeId>('friendly_ghost');
  const [selectedSwitchOffId, setSelectedSwitchOffId] = useState<SwitchOffStyleId>('low_battery');

  // Schedule Automation State
  const [enableScheduleAutomation, setEnableScheduleAutomation] = useState<boolean>(true);
  const [automationRepetitionMode, setAutomationRepetitionMode] = useState<'one_time' | 'recurring_weekly'>('one_time');
  const [oneTimeTargetOption, setOneTimeTargetOption] = useState<'Today' | 'Tomorrow' | 'Over tomorrow' | 'Custom'>('Today');
  const [customSelectedDate, setCustomSelectedDate] = useState<string>('Sep 12, 2026');
  const [automationSelectedDays, setAutomationSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [showMiniCalendarModal, setShowMiniCalendarModal] = useState<boolean>(false);
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
  const [calendarDay, setCalendarDay] = useState<number>(new Date().getDate());
  const [automationTriggerHour, setAutomationTriggerHour] = useState<number>(8);
  const [automationTriggerMinute, setAutomationTriggerMinute] = useState<number>(0);
  const [automationTriggerPeriod, setAutomationTriggerPeriod] = useState<'AM' | 'PM'>('PM');
  const [isCustomAutomationTime, setIsCustomAutomationTime] = useState<boolean>(false);
  const [isAutomationSavedFeedback, setIsAutomationSavedFeedback] = useState<boolean>(false);

  // Ending Picker Modal State
  const [showEndingModal, setShowEndingModal] = useState<boolean>(false);

  const currentMonster = MONSTER_PROFILES.find((m) => m.id === selectedMonsterId) || MONSTER_PROFILES[0];
  const currentSwitchOff = SWITCH_OFF_PROFILES.find((s) => s.id === selectedSwitchOffId) || SWITCH_OFF_PROFILES[0];

  const handleSelectDay = (dayNum: number) => {
    setCalendarDay(dayNum);
    const dateStr = `${MONTH_NAMES[calendarMonth].slice(0, 3)} ${dayNum}, ${calendarYear}`;
    setCustomSelectedDate(dateStr);
    setOneTimeTargetOption('Custom');
    setShowMiniCalendarModal(false);
  };

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const toggleDay = (d: number) => {
    setAutomationSelectedDays((prev) =>
      prev.includes(d) ? prev.filter((day) => day !== d) : [...prev, d]
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] text-[#1A2436] justify-between relative overflow-hidden font-sans select-none">
      <NatureDecorations variant="full" />

      {/* Top Header */}
      <header className="p-4 bg-white/90 backdrop-blur-md border-b border-[#EAE5DE] flex items-center justify-between shrink-0 z-10 shadow-xs">
        <button
          type="button"
          onClick={() => navigateTo('parent_dashboard')}
          className="p-2 -ml-2 rounded-xl text-[#64748B] hover:text-[#1A2436] hover:bg-[#FAF8F5] active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="text-base font-extrabold text-[#1A2436]">Schedule Automation</h2>
          <p className="text-[10.5px] font-bold text-[#5D997C]">
            Automated routines for {activeChild.name}
          </p>
        </div>
        <div className="w-9" />
      </header>

      {/* Main Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 z-10 scrollbar-none">
        {/* Main Automation Card */}
        <section className="rounded-[24px] bg-white border border-[#EAE5DE] p-4 shadow-[0_2px_14px_rgba(26,36,54,0.04)] text-[#1A2436] space-y-4">
          {/* Header Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EBF4EF] border border-[#D1E6DA] flex items-center justify-center text-[#2D5441] shadow-xs">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#1A2436]">Enable Schedule Automation</h4>
                <p className="text-[11px] text-[#64748B] font-medium">
                  {enableScheduleAutomation
                    ? `Automated screen routines active for ${activeChild.name}`
                    : 'Manual timer initiation only'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setEnableScheduleAutomation(!enableScheduleAutomation)}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
                enableScheduleAutomation ? 'bg-[#5D997C] justify-end' : 'bg-[#EAE5DE] justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-xs transform transition-transform" />
            </button>
          </div>

          {/* Expandable Panel */}
          {enableScheduleAutomation && (
            <div className="pt-3 border-t border-[#EAE5DE] space-y-4">
              {/* Repetition Selection Row */}
              <div>
                <label className="text-[10.5px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">
                  Repetition Mode
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#FAF8F5] rounded-2xl border border-[#EAE5DE]">
                  <button
                    type="button"
                    onClick={() => setAutomationRepetitionMode('one_time')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      automationRepetitionMode === 'one_time'
                        ? 'bg-[#5D997C] text-white shadow-xs'
                        : 'text-[#64748B] hover:text-[#1A2436]'
                    }`}
                  >
                    <span>One-Time</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutomationRepetitionMode('recurring_weekly')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      automationRepetitionMode === 'recurring_weekly'
                        ? 'bg-[#5D997C] text-white shadow-xs'
                        : 'text-[#64748B] hover:text-[#1A2436]'
                    }`}
                  >
                    <span>Recurring Weekly</span>
                  </button>
                </div>
              </div>

              {/* 4A. One-Time Session: Target Date + Warning Time + End Screen Style */}
              {automationRepetitionMode === 'one_time' ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[10.5px] font-bold text-[#64748B] uppercase tracking-wider">
                        Target Date for One-Time Session
                      </label>
                      {oneTimeTargetOption === 'Custom' && (
                        <span className="text-[10.5px] font-bold text-[#7A6216] bg-[#FEF9E7] px-2 py-0.5 rounded-full border border-[#F9ECC0]">
                          {customSelectedDate}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['Today', 'Tomorrow', 'Over tomorrow', 'Custom'] as const).map((opt) => {
                        const isSelected = oneTimeTargetOption === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              if (opt === 'Custom') {
                                setShowMiniCalendarModal(true);
                              } else {
                                setOneTimeTargetOption(opt);
                              }
                            }}
                            className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                              isSelected
                                ? 'bg-[#FEF9E7] text-[#7A6216] border-2 border-[#F6D878] shadow-xs'
                                : 'bg-[#FAF8F5] border-[#EAE5DE] text-[#475569] hover:bg-[#F5F2EB]'
                            }`}
                          >
                            {opt === 'Custom' ? (isSelected ? `📅 ${customSelectedDate}` : '📅 Custom') : opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Specific Warning Trigger Time */}
                  <div className="w-full">
                    <div className="flex justify-between items-center flex-wrap gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Clock className="w-3.5 h-3.5 text-[#5D997C] shrink-0" />
                        <label className="text-[10.5px] font-bold text-[#64748B] uppercase tracking-wider truncate">
                          Specific Warning Trigger Time
                        </label>
                      </div>
                      <span className="text-[10.5px] font-bold text-[#2D5441] bg-[#EBF4EF] px-2.5 py-0.5 rounded-full border border-[#D1E6DA] shrink-0">
                        Warning at {automationTriggerHour}:{String(automationTriggerMinute).padStart(2, '0')} {automationTriggerPeriod}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5 mb-2 w-full">
                      {[
                        { label: '6:00 PM', h: 6, m: 0, p: 'PM' as const },
                        { label: '7:00 PM', h: 7, m: 0, p: 'PM' as const },
                        { label: '7:30 PM', h: 7, m: 30, p: 'PM' as const },
                        { label: '8:00 PM', h: 8, m: 0, p: 'PM' as const },
                        { label: '8:30 PM', h: 8, m: 30, p: 'PM' as const },
                        { label: '9:00 PM', h: 9, m: 0, p: 'PM' as const },
                      ].map((preset) => {
                        const isCurrent =
                          !isCustomAutomationTime &&
                          automationTriggerHour === preset.h &&
                          automationTriggerMinute === preset.m &&
                          automationTriggerPeriod === preset.p;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setIsCustomAutomationTime(false);
                              setAutomationTriggerHour(preset.h);
                              setAutomationTriggerMinute(preset.m);
                              setAutomationTriggerPeriod(preset.p);
                            }}
                            className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-[#5D997C] text-white border-[#5D997C] shadow-xs'
                                : 'bg-[#FAF8F5] border-[#EAE5DE] text-[#475569] hover:bg-[#F5F2EB]'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => setIsCustomAutomationTime(true)}
                        className={`py-1.5 rounded-xl text-xs font-bold border transition-all col-span-3 sm:col-span-1 cursor-pointer ${
                          isCustomAutomationTime
                            ? 'bg-[#5D997C] text-white border-[#5D997C] shadow-xs'
                            : 'bg-white border-[#EAE5DE] text-[#5D997C] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        Custom
                      </button>
                    </div>

                    {isCustomAutomationTime && (
                      <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DE] flex items-center gap-2 mb-2 w-full overflow-hidden">
                        <div className="flex-1 min-w-0">
                          <label className="text-[9px] font-bold text-[#64748B] block mb-0.5">Hour (1-12)</label>
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={automationTriggerHour}
                            onChange={(e) =>
                              setAutomationTriggerHour(Math.max(1, Math.min(12, parseInt(e.target.value, 10) || 1)))
                            }
                            className="w-full bg-white border border-[#EAE5DE] rounded-xl py-1 px-2 text-center text-sm font-bold text-[#1A2436] focus:outline-none focus:border-[#5D997C]"
                          />
                        </div>
                        <span className="text-lg font-black text-[#94A3B8] mt-3">:</span>
                        <div className="flex-1 min-w-0">
                          <label className="text-[9px] font-bold text-[#64748B] block mb-0.5">Minute (00-59)</label>
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={automationTriggerMinute}
                            onChange={(e) =>
                              setAutomationTriggerMinute(Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)))
                            }
                            className="w-full bg-white border border-[#EAE5DE] rounded-xl py-1 px-2 text-center text-sm font-bold text-[#1A2436] focus:outline-none focus:border-[#5D997C]"
                          />
                        </div>
                        <div className="flex gap-1 mt-3 shrink-0">
                          {(['AM', 'PM'] as const).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setAutomationTriggerPeriod(p)}
                              className={`py-1 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                automationTriggerPeriod === p
                                  ? 'bg-[#5D997C] text-white border-[#5D997C] shadow-xs'
                                  : 'bg-white border-[#EAE5DE] text-[#64748B]'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsCustomAutomationTime(false)}
                          className="mt-3 py-1.5 px-3 bg-[#5D997C] hover:bg-[#51876D] text-white text-xs font-bold rounded-xl shadow-xs shrink-0 transition-all cursor-pointer"
                        >
                          OK
                        </button>
                      </div>
                    )}
                  </div>

                  {/* End Screen Style Card */}
                  <div className="w-full">
                    <div className="flex justify-between items-center flex-wrap gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Sparkles className="w-3.5 h-3.5 text-[#5B3F9B] shrink-0" />
                        <label className="text-[10.5px] font-bold text-[#64748B] uppercase tracking-wider truncate">
                          End Screen Style for Warning
                        </label>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#F5F2FF] border border-[#E5DCFC] text-[9.5px] font-bold text-[#5B3F9B] shrink-0">
                        {selectedEndingType === 'monster' ? '👾 Monster Mode' : '🔋 Switch-Off Style'}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DE] flex items-center justify-between gap-3 w-full overflow-hidden">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-[#EAE5DE] flex items-center justify-center text-xl shadow-xs shrink-0">
                          {selectedEndingType === 'monster' ? currentMonster.emoji : currentSwitchOff.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-extrabold text-[#1A2436] block leading-tight truncate">
                            {selectedEndingType === 'monster' ? currentMonster.name : currentSwitchOff.title}
                          </span>
                          <span className="text-[10.5px] text-[#64748B] font-medium block mt-0.5 line-clamp-1">
                            {selectedEndingType === 'monster' ? `"${currentMonster.dialogue}"` : currentSwitchOff.description}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowEndingModal(true)}
                        className="flex items-center gap-1 bg-white hover:bg-[#FBF9F4] border border-[#EAE5DE] px-3 py-1.5 rounded-full text-xs font-bold text-[#1A2436] shadow-xs shrink-0 transition-all cursor-pointer"
                      >
                        <span>Change</span>
                        <ChevronRight className="w-3 h-3 text-[#64748B]" />
                      </button>
                    </div>
                  </div>

                  {/* Informative Banner */}
                  <div className="p-3 rounded-2xl bg-[#EBF4EF] border border-[#D1E6DA] flex items-center gap-2 text-xs text-[#2D5441] w-full">
                    <span>
                      Screen will automatically transition with <strong className="font-extrabold">{selectedEndingType === 'monster' ? currentMonster.name : currentSwitchOff.title}</strong> at <strong className="font-extrabold">{automationTriggerHour}:{String(automationTriggerMinute).padStart(2, '0')} {automationTriggerPeriod}</strong> on {oneTimeTargetOption === 'Custom' ? customSelectedDate : oneTimeTargetOption.toLowerCase()}. No manual start needed.
                    </span>
                  </div>

                  {/* Set Schedule Button for One-Time */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAutomationSavedFeedback(true);
                      setTimeout(() => setIsAutomationSavedFeedback(false), 2500);
                    }}
                    className={`w-full py-3.5 px-4 rounded-full text-xs font-extrabold shadow-xs transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                      isAutomationSavedFeedback
                        ? 'bg-[#5D997C] text-white shadow-xs'
                        : 'bg-[#5D997C] hover:bg-[#51876D] text-white'
                    }`}
                  >
                    {isAutomationSavedFeedback && <span>✓</span>}
                    <span>{isAutomationSavedFeedback ? 'Schedule Saved' : 'Set Schedule'}</span>
                  </button>
                </div>
              ) : (
                /* 4B. Recurring Weekly */
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[10.5px] font-bold text-[#64748B] uppercase tracking-wider">
                        Active Days of the Week
                      </label>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setAutomationSelectedDays([1, 2, 3, 4, 5])}
                          className="px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#EAE5DE] text-[9.5px] font-bold text-[#5D997C] hover:bg-[#EBF4EF] cursor-pointer"
                        >
                          Mon-Fri
                        </button>
                        <button
                          type="button"
                          onClick={() => setAutomationSelectedDays([0, 6])}
                          className="px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#EAE5DE] text-[9.5px] font-bold text-[#5D997C] hover:bg-[#EBF4EF] cursor-pointer"
                        >
                          Sat-Sun
                        </button>
                        <button
                          type="button"
                          onClick={() => setAutomationSelectedDays([0, 1, 2, 3, 4, 5, 6])}
                          className="px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#EAE5DE] text-[9.5px] font-bold text-[#5D997C] hover:bg-[#EBF4EF] cursor-pointer"
                        >
                          All
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5">
                      {[
                        { day: 1, label: 'Mon' },
                        { day: 2, label: 'Tue' },
                        { day: 3, label: 'Wed' },
                        { day: 4, label: 'Thu' },
                        { day: 5, label: 'Fri' },
                        { day: 6, label: 'Sat' },
                        { day: 0, label: 'Sun' },
                      ].map((d) => {
                        const isSelected = automationSelectedDays.includes(d.day);
                        return (
                          <button
                            key={d.day}
                            type="button"
                            onClick={() => toggleDay(d.day)}
                            className={`py-2 rounded-xl border text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#EBF4EF] border-2 border-[#5D997C] text-[#2D5441] font-bold shadow-xs'
                                : 'bg-[#FAF8F5] border-[#EAE5DE] text-[#64748B] hover:bg-[#F5F2EB]'
                            }`}
                          >
                            <span className="block text-[11px] font-bold">{d.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Warning Trigger Time */}
                  <div className="w-full">
                    <div className="flex justify-between items-center flex-wrap gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Clock className="w-3.5 h-3.5 text-[#5D997C] shrink-0" />
                        <label className="text-[10.5px] font-bold text-[#64748B] uppercase tracking-wider truncate">
                          Specific Warning Trigger Time
                        </label>
                      </div>
                      <span className="text-[10.5px] font-bold text-[#2D5441] bg-[#EBF4EF] px-2.5 py-0.5 rounded-full border border-[#D1E6DA] shrink-0">
                        Warning at {automationTriggerHour}:{String(automationTriggerMinute).padStart(2, '0')} {automationTriggerPeriod}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5 mb-2 w-full">
                      {[
                        { label: '6:00 PM', h: 6, m: 0, p: 'PM' as const },
                        { label: '7:00 PM', h: 7, m: 0, p: 'PM' as const },
                        { label: '7:30 PM', h: 7, m: 30, p: 'PM' as const },
                        { label: '8:00 PM', h: 8, m: 0, p: 'PM' as const },
                        { label: '8:30 PM', h: 8, m: 30, p: 'PM' as const },
                        { label: '9:00 PM', h: 9, m: 0, p: 'PM' as const },
                      ].map((preset) => {
                        const isCurrent =
                          !isCustomAutomationTime &&
                          automationTriggerHour === preset.h &&
                          automationTriggerMinute === preset.m &&
                          automationTriggerPeriod === preset.p;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setIsCustomAutomationTime(false);
                              setAutomationTriggerHour(preset.h);
                              setAutomationTriggerMinute(preset.m);
                              setAutomationTriggerPeriod(preset.p);
                            }}
                            className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-[#5D997C] text-white border-[#5D997C] shadow-xs'
                                : 'bg-[#FAF8F5] border-[#EAE5DE] text-[#475569] hover:bg-[#F5F2EB]'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => setIsCustomAutomationTime(true)}
                        className={`py-1.5 rounded-xl text-xs font-bold border transition-all col-span-3 sm:col-span-1 cursor-pointer ${
                          isCustomAutomationTime
                            ? 'bg-[#5D997C] text-white border-[#5D997C] shadow-xs'
                            : 'bg-white border-[#EAE5DE] text-[#5D997C] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        Custom
                      </button>
                    </div>

                    {isCustomAutomationTime && (
                      <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DE] flex items-center gap-2 mb-2 w-full overflow-hidden">
                        <div className="flex-1 min-w-0">
                          <label className="text-[9px] font-bold text-[#64748B] block mb-0.5">Hour (1-12)</label>
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={automationTriggerHour}
                            onChange={(e) =>
                              setAutomationTriggerHour(Math.max(1, Math.min(12, parseInt(e.target.value, 10) || 1)))
                            }
                            className="w-full bg-white border border-[#EAE5DE] rounded-xl py-1 px-2 text-center text-sm font-bold text-[#1A2436] focus:outline-none focus:border-[#5D997C]"
                          />
                        </div>
                        <span className="text-lg font-black text-[#94A3B8] mt-3">:</span>
                        <div className="flex-1 min-w-0">
                          <label className="text-[9px] font-bold text-[#64748B] block mb-0.5">Minute (00-59)</label>
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={automationTriggerMinute}
                            onChange={(e) =>
                              setAutomationTriggerMinute(Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)))
                            }
                            className="w-full bg-white border border-[#EAE5DE] rounded-xl py-1 px-2 text-center text-sm font-bold text-[#1A2436] focus:outline-none focus:border-[#5D997C]"
                          />
                        </div>
                        <div className="flex gap-1 mt-3 shrink-0">
                          {(['AM', 'PM'] as const).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setAutomationTriggerPeriod(p)}
                              className={`py-1 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                automationTriggerPeriod === p
                                  ? 'bg-[#5D997C] text-white border-[#5D997C] shadow-xs'
                                  : 'bg-white border-[#EAE5DE] text-[#64748B]'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsCustomAutomationTime(false)}
                          className="mt-3 py-1.5 px-3 bg-[#5D997C] hover:bg-[#51876D] text-white text-xs font-bold rounded-xl shadow-xs shrink-0 transition-all cursor-pointer"
                        >
                          OK
                        </button>
                      </div>
                    )}
                  </div>

                  {/* End Screen Style Card */}
                  <div className="w-full">
                    <div className="flex justify-between items-center flex-wrap gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Sparkles className="w-3.5 h-3.5 text-[#5B3F9B] shrink-0" />
                        <label className="text-[10.5px] font-bold text-[#64748B] uppercase tracking-wider truncate">
                          End Screen Style for Warning
                        </label>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#F5F2FF] border border-[#E5DCFC] text-[9.5px] font-bold text-[#5B3F9B] shrink-0">
                        {selectedEndingType === 'monster' ? '👾 Monster Mode' : '🔋 Switch-Off Style'}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DE] flex items-center justify-between gap-3 w-full overflow-hidden">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-[#EAE5DE] flex items-center justify-center text-xl shadow-xs shrink-0">
                          {selectedEndingType === 'monster' ? currentMonster.emoji : currentSwitchOff.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-extrabold text-[#1A2436] block leading-tight truncate">
                            {selectedEndingType === 'monster' ? currentMonster.name : currentSwitchOff.title}
                          </span>
                          <span className="text-[10.5px] text-[#64748B] font-medium block mt-0.5 line-clamp-1">
                            {selectedEndingType === 'monster' ? `"${currentMonster.dialogue}"` : currentSwitchOff.description}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowEndingModal(true)}
                        className="flex items-center gap-1 bg-white hover:bg-[#FBF9F4] border border-[#EAE5DE] px-3 py-1.5 rounded-full text-xs font-bold text-[#1A2436] shadow-xs shrink-0 transition-all cursor-pointer"
                      >
                        <span>Change</span>
                        <ChevronRight className="w-3 h-3 text-[#64748B]" />
                      </button>
                    </div>
                  </div>

                  {/* Informative Banner */}
                  <div className="p-3 rounded-2xl bg-[#EBF4EF] border border-[#D1E6DA] flex items-center gap-2 text-xs text-[#2D5441] w-full">
                    <span>
                      Screen will automatically transition with <strong className="font-extrabold">{selectedEndingType === 'monster' ? currentMonster.name : currentSwitchOff.title}</strong> at <strong className="font-extrabold">{automationTriggerHour}:{String(automationTriggerMinute).padStart(2, '0')} {automationTriggerPeriod}</strong> on scheduled days. No manual start needed.
                    </span>
                  </div>

                  {/* Set Schedule Button for Recurring */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAutomationSavedFeedback(true);
                      setTimeout(() => setIsAutomationSavedFeedback(false), 2500);
                    }}
                    className={`w-full py-3.5 px-4 rounded-full text-xs font-extrabold shadow-xs transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                      isAutomationSavedFeedback
                        ? 'bg-[#5D997C] text-white shadow-xs'
                        : 'bg-[#5D997C] hover:bg-[#51876D] text-white'
                    }`}
                  >
                    {isAutomationSavedFeedback && <span>✓</span>}
                    <span>{isAutomationSavedFeedback ? 'Schedule Saved' : 'Set Schedule'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* QUICK SCREEN TIME WIDGET SECTION */}
        <section className="rounded-[24px] bg-white border border-[#EAE5DE] p-4 shadow-[0_2px_14px_rgba(26,36,54,0.04)] text-[#1A2436] space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-extrabold text-[#1A2436]">Quick Screen Time Widget</h4>
              <p className="text-[11px] text-[#64748B] font-medium">
                {isWidgetAddedToHome
                  ? `Added to Home Screen • ${formatWidgetDuration(quickWidgetMinutes)} Timer`
                  : 'Not added to Home Screen yet'}
              </p>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              isWidgetAddedToHome
                ? 'bg-[#EBF4EF] text-[#2D5441] border-[#D1E6DA]'
                : 'bg-[#FAF8F5] text-[#64748B] border-[#EAE5DE]'
            }`}>
              {isWidgetAddedToHome ? '✓ Added to Home Screen' : 'Not Added'}
            </div>
          </div>

          {!isWidgetAddedToHome ? (
            <div
              onClick={() => openEditWidgetModal()}
              className="p-4 rounded-2xl border-2 border-dashed border-[#D1E6DA] hover:border-[#5D997C] bg-[#FAF8F5] hover:bg-[#F5F2EB] transition-all cursor-pointer flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-[#5D997C] text-white flex items-center justify-center font-bold text-2xl shadow-xs shrink-0 transition-transform group-hover:scale-105">
                  +
                </div>

                <div className="min-w-0">
                  <span className="text-sm font-extrabold text-[#1A2436] block">
                    Add Screen Time Widget
                  </span>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Tap to configure duration & place widget on Home Screen
                  </p>
                </div>
              </div>

              <div className="py-2 px-3.5 rounded-full font-bold text-xs shrink-0 bg-[#5D997C] hover:bg-[#51876D] text-white shadow-xs">
                + Add
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl border border-[#EAE5DE] bg-[#FAF8F5] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[#EBF4EF] border border-[#D1E6DA] flex items-center justify-center text-[#2D5441] shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-[#1A2436]">
                    {formatWidgetDuration(quickWidgetMinutes)} Timer Widget
                  </div>
                  <div className="text-[10.5px] text-[#64748B] mt-0.5">
                    Ready on Home Screen • 1-tap start
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={openEditWidgetModal}
                  className="py-1.5 px-3 rounded-full bg-[#5D997C] hover:bg-[#51876D] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsWidgetAddedToHome(false)}
                  className="py-1.5 px-2.5 rounded-full bg-white hover:bg-rose-50 text-[#64748B] hover:text-rose-600 text-xs font-bold border border-[#EAE5DE] hover:border-rose-200 transition-all cursor-pointer"
                  title="Remove from Home Screen"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* MINI CALENDAR MODAL */}
      {showMiniCalendarModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE5DE] text-[#1A2436] rounded-3xl p-5 max-w-xs w-full shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => {
                  if (calendarMonth === 0) {
                    setCalendarMonth(11);
                    setCalendarYear((y) => y - 1);
                  } else {
                    setCalendarMonth((m) => m - 1);
                  }
                }}
                className="w-8 h-8 rounded-lg bg-[#FAF8F5] hover:bg-[#F5F2EB] border border-[#EAE5DE] flex items-center justify-center text-[#1A2436] font-bold cursor-pointer"
              >
                ‹
              </button>
              <h3 className="font-extrabold text-sm text-[#1A2436]">
                {MONTH_NAMES[calendarMonth]} {calendarYear}
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (calendarMonth === 11) {
                    setCalendarMonth(0);
                    setCalendarYear((y) => y + 1);
                  } else {
                    setCalendarMonth((m) => m + 1);
                  }
                }}
                className="w-8 h-8 rounded-lg bg-[#FAF8F5] hover:bg-[#F5F2EB] border border-[#EAE5DE] flex items-center justify-center text-[#1A2436] font-bold cursor-pointer"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[#64748B] mb-2 pb-1 border-b border-[#EAE5DE]">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                <span key={index}>{day}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {Array.from({ length: adjustedFirstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected =
                  calendarDay === dayNum &&
                  calendarMonth === new Date().getMonth() &&
                  calendarYear === new Date().getFullYear();
                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => handleSelectDay(dayNum)}
                    className={`h-7 w-7 mx-auto rounded-full flex items-center justify-center font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#5D997C] text-white font-extrabold shadow-xs'
                        : 'hover:bg-[#FAF8F5] text-[#475569]'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowMiniCalendarModal(false)}
              className="mt-4 w-full py-2.5 bg-[#FAF8F5] hover:bg-[#F5F2EB] text-[#475569] rounded-full text-xs font-bold border border-[#EAE5DE] transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ENDING ILLUSION & MONSTER PICKER MODAL */}
      {showEndingModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white border border-[#EAE5DE] text-[#1A2436] rounded-t-3xl sm:rounded-3xl p-5 max-w-sm w-full shadow-2xl animate-scale-up max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE5DE] shrink-0">
              <div>
                <h3 className="text-base font-extrabold text-[#1A2436]">Select Screen End Warning</h3>
                <p className="text-xs text-[#64748B]">Choose what {activeChild.name} sees at warning time</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEndingModal(false)}
                className="p-1 rounded-full text-[#94A3B8] hover:text-[#1A2436] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex p-1 bg-[#FAF8F5] rounded-2xl border border-[#EAE5DE] my-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedEndingType('monster')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  selectedEndingType === 'monster'
                    ? 'bg-[#5D997C] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#1A2436]'
                }`}
              >
                👾 Monster Mode ({MONSTER_PROFILES.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedEndingType('switchoff')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  selectedEndingType === 'switchoff'
                    ? 'bg-[#5D997C] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#1A2436]'
                }`}
              >
                🔋 Switch-Off ({SWITCH_OFF_PROFILES.length})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none">
              {selectedEndingType === 'monster'
                ? MONSTER_PROFILES.map((m) => {
                    const isSelected = selectedMonsterId === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMonsterId(m.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#EBF4EF] border-2 border-[#5D997C] shadow-xs'
                            : 'bg-[#FAF8F5] border-[#EAE5DE] hover:bg-[#F5F2EB]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl shrink-0">{m.emoji}</span>
                          <div className="min-w-0">
                            <span className="text-sm font-extrabold text-[#1A2436] block truncate">{m.name}</span>
                            <span className="text-xs text-[#64748B] italic block truncate">"{m.dialogue}"</span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#5D997C] shrink-0 font-bold" />}
                      </div>
                    );
                  })
                : SWITCH_OFF_PROFILES.map((s) => {
                    const isSelected = selectedSwitchOffId === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelectedSwitchOffId(s.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#EBF4EF] border-2 border-[#5D997C] shadow-xs'
                            : 'bg-[#FAF8F5] border-[#EAE5DE] hover:bg-[#F5F2EB]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl shrink-0">{s.icon}</span>
                          <div className="min-w-0">
                            <span className="text-sm font-extrabold text-[#1A2436] block truncate">{s.title}</span>
                            <span className="text-xs text-[#64748B] block truncate">{s.description}</span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#5D997C] shrink-0 font-bold" />}
                      </div>
                    );
                  })}
            </div>

            <button
              type="button"
              onClick={() => setShowEndingModal(false)}
              className="mt-3 w-full py-3 bg-[#5D997C] hover:bg-[#51876D] text-white rounded-full text-xs font-extrabold transition-all shrink-0 cursor-pointer shadow-xs"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      )}

      {/* QUICK WIDGET DURATION PANEL (HOURS & MINUTES) */}
      {showQuickWidgetModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE5DE] text-[#1A2436] rounded-3xl p-5 max-w-sm w-full shadow-2xl animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE5DE]">
              <div>
                <h3 className="text-sm font-extrabold text-[#1A2436]">
                  {isWidgetAddedToHome ? 'Edit Phone Usage Timer' : 'Set Widget Timer'}
                </h3>
                <p className="text-[11px] text-[#64748B]">Set duration for phone usage in hours and minutes</p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickWidgetModal(false)}
                className="p-1 rounded-full text-[#94A3B8] hover:text-[#1A2436] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">
                Quick Presets
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: '15 min', h: 0, m: 15 },
                  { label: '30 min', h: 0, m: 30 },
                  { label: '45 min', h: 0, m: 45 },
                  { label: '1 hour', h: 1, m: 0 },
                  { label: '1h 30m', h: 1, m: 30 },
                  { label: '2 hours', h: 2, m: 0 },
                ].map((preset) => {
                  const isMatch = tempWidgetHours === preset.h && tempWidgetMinutes === preset.m;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setTempWidgetHours(preset.h);
                        setTempWidgetMinutes(preset.m);
                      }}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isMatch
                          ? 'bg-[#5D997C] text-white border-[#5D997C] shadow-xs'
                          : 'bg-[#FAF8F5] border-[#EAE5DE] text-[#475569] hover:bg-[#F5F2EB]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hours and Minutes Adjuster */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Hours Column */}
              <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EAE5DE]">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-2">Hours</span>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setTempWidgetHours((h) => Math.max(0, h - 1))}
                    className="w-8 h-8 rounded-lg bg-white hover:bg-[#F5F2EB] border border-[#EAE5DE] text-[#1A2436] font-bold flex items-center justify-center text-base cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-base font-extrabold text-[#1A2436]">{tempWidgetHours}h</span>
                  <button
                    type="button"
                    onClick={() => setTempWidgetHours((h) => Math.min(8, h + 1))}
                    className="w-8 h-8 rounded-lg bg-white hover:bg-[#F5F2EB] border border-[#EAE5DE] text-[#1A2436] font-bold flex items-center justify-center text-base cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Minutes Column */}
              <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EAE5DE]">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-2">Minutes</span>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setTempWidgetMinutes((m) => Math.max(0, m - 5))}
                    className="w-8 h-8 rounded-lg bg-white hover:bg-[#F5F2EB] border border-[#EAE5DE] text-[#1A2436] font-bold flex items-center justify-center text-base cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-base font-extrabold text-[#1A2436]">{tempWidgetMinutes}m</span>
                  <button
                    type="button"
                    onClick={() => setTempWidgetMinutes((m) => Math.min(55, m + 5))}
                    className="w-8 h-8 rounded-lg bg-white hover:bg-[#F5F2EB] border border-[#EAE5DE] text-[#1A2436] font-bold flex items-center justify-center text-base cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Total Duration Preview Banner */}
            <div className="p-3 rounded-2xl bg-[#EBF4EF] border border-[#D1E6DA] text-center">
              <span className="text-[11px] text-[#2D5441]">
                Phone usage duration:{' '}
                <strong className="font-extrabold">
                  {tempWidgetHours === 0 && tempWidgetMinutes === 0
                    ? '15 min (minimum)'
                    : `${tempWidgetHours > 0 ? `${tempWidgetHours} hr ` : ''}${tempWidgetMinutes} min`}
                </strong>
                {' '}(Total: {Math.max(5, tempWidgetHours * 60 + tempWidgetMinutes)} minutes)
              </span>
            </div>

            {/* Action button */}
            <button
              type="button"
              onClick={() => {
                const totalMins = Math.max(5, tempWidgetHours * 60 + tempWidgetMinutes);
                setQuickWidgetMinutes(totalMins);
                setIsWidgetAddedToHome(true);
                setShowQuickWidgetModal(false);
                navigateTo('parent_dashboard');
              }}
              className="w-full py-3 bg-[#5D997C] hover:bg-[#51876D] text-white font-extrabold text-xs rounded-full shadow-xs transition-all active:scale-98 cursor-pointer"
            >
              {isWidgetAddedToHome ? 'Save Timer & View on Home Screen' : 'Add Widget to Home Screen'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
