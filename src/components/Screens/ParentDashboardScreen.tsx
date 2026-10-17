import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BuddyMascot } from '../Mascot/BuddyMascot';
import { NatureDecorations } from '../../theme/NatureDecorations';
import {
  Clock,
  ArrowRight,
  Eye,
  X,
  Sparkles,
  Pencil,
  Trash2,
  ChevronRight,
  Check,
  Calendar,
  Play,
  LayoutGrid,
} from 'lucide-react';
import type { AgeGroup } from '../../types';
import { MONSTER_PROFILES, SWITCH_OFF_PROFILES } from '../../data/researchCitations';
import type { MonsterTypeId, SwitchOffStyleId } from '../../types/onboarding';
import { soundEngine } from '../../utils/audio';

const formatWidgetDuration = (totalMinutes: number): string => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h} hr ${m} min`;
  if (h > 0) return `${h} hr${h > 1 ? 's' : ''}`;
  return `${m} min`;
};

export const ONBOARDING_AGE_GROUPS = [
  { id: 'under_2' as AgeGroup, label: 'Under 2', badge: 'Infant', range: '< 2 yrs', mins: 10, icon: '🍼', desc: 'Sensory discovery' },
  { id: '2-3' as AgeGroup, label: '2–3 yrs', badge: 'Preschool', range: '2–3 yrs', mins: 15, icon: '🧸', desc: 'Active curiosity' },
  { id: '4-5' as AgeGroup, label: '4–5 yrs', badge: 'Pre-K', range: '4–5 yrs', mins: 20, icon: '🎨', desc: 'Social play' },
  { id: '6-7' as AgeGroup, label: '6–7 yrs', badge: 'Elementary', range: '6–7 yrs', mins: 30, icon: '🎒', desc: 'Early reading' },
  { id: '8-10' as AgeGroup, label: '8–10 yrs', badge: 'Middle Kid', range: '8–10 yrs', mins: 45, icon: '🎮', desc: 'Gaming & hobbies' },
  { id: '11-13' as AgeGroup, label: '11–13 yrs', badge: 'Early Teen', range: '11–13 yrs', mins: 45, icon: '📱', desc: 'Social streaming' },
  { id: '14+' as AgeGroup, label: '14+ yrs', badge: 'High School', range: '14+ yrs', mins: 60, icon: '🎧', desc: 'Digital focus' },
];

export const isAgeMatching = (selectedAge: string | undefined, targetId: string) => {
  if (!selectedAge) return false;
  if (selectedAge === targetId) return true;
  const s = selectedAge.replace(/_/g, '-');
  const t = targetId.replace(/_/g, '-');
  if (s === t) return true;
  if ((targetId === 'under_2' || targetId === 'under-2') && (s === 'under-2' || s === 'under_2' || s === '< 2' || s === '<2')) return true;
  if ((targetId === '14+' || targetId === '14_plus' || targetId === '14-plus') && (s === '14+' || s === '14-plus' || s === '14_plus' || s === '13+')) return true;
  if (targetId === '6-7' && s === '6-8') return true;
  if (targetId === '8-10' && (s === '9-12' || s === '6-10')) return true;
  if (targetId === '2-3' && s === '2-5') return true;
  return false;
};

export const formatAgeGroupDisplay = (age: string | undefined): string => {
  if (!age) return '';
  if (age === 'under_2' || age === 'under-2') return '< 2 yrs';
  if (age === '14+' || age === '14_plus' || age === '14-plus' || age === '13+') return '14+ yrs';
  if (age.endsWith('yrs') || age.endsWith('yr')) return age;
  return `${age.replace('_', '-')} yrs`;
};

export const ParentDashboardScreen: React.FC = () => {
  const {
    activeChild,
    childrenList,
    selectChild,
    updateChild,
    deleteChild,
    navigateTo,
    startSession,
    quickWidgetMinutes,
    isWidgetAddedToHome,
    setIsWidgetAddedToHome,
    widgetTimerOptions,
    isWidgetDefaultPresetActive,
    widgetDefaultPresetMinutes,
  } = useApp();

  // Widget Quick-Select Modal State
  const [showWidgetQuickSelectModal, setShowWidgetQuickSelectModal] = useState<boolean>(false);

  // Edit child modal state
  const [showEditChildModal, setShowEditChildModal] = useState<boolean>(false);
  const [editChildId, setEditChildId] = useState<string>('');
  const [editChildName, setEditChildName] = useState<string>('');
  const [editChildAge, setEditChildAge] = useState<AgeGroup>('2-3');
  const [editChildAvatar, setEditChildAvatar] = useState<string>('A');
  const [editChildLimit, setEditChildLimit] = useState<number>(20);

  const handleSaveEditChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editChildName.trim() || !editChildId) return;
    const targetChild = childrenList.find((c) => c.id === editChildId);
    if (!targetChild) return;
    updateChild({
      ...targetChild,
      name: editChildName.trim(),
      ageGroup: editChildAge,
      avatar: editChildName[0].toUpperCase(),
      dailyLimitMinutes: editChildLimit,
    });
    if (activeChild.id === editChildId) {
      setSelectedMinutes(editChildLimit);
    }
    setShowEditChildModal(false);
  };

  const handleDeleteChild = () => {
    if (childrenList.length <= 1) {
      alert('You need to keep at least one child profile in BabyBoo.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${editChildName}'s profile?`)) {
      deleteChild(editChildId);
      setShowEditChildModal(false);
    }
  };

  // Selected duration & countdown grace
  const [selectedMinutes, setSelectedMinutes] = useState<number>(activeChild?.dailyLimitMinutes || 20);
  const [selectedGraceSeconds, setSelectedGraceSeconds] = useState<number>(activeChild?.defaultGraceSeconds || 60);

  // Ending experience state
  const [selectedEndingType, setSelectedEndingType] = useState<'monster' | 'switchoff'>('monster');
  const [selectedMonsterId, setSelectedMonsterId] = useState<MonsterTypeId>('friendly_ghost');
  const [selectedSwitchOffId, setSelectedSwitchOffId] = useState<SwitchOffStyleId>('low_battery');

  // Modals & Bottom Sheets
  const [showDurationSheet, setShowDurationSheet] = useState<boolean>(false);
  const [showEndingModal, setShowEndingModal] = useState<boolean>(false);
  const [showCustomCountdownModal, setShowCustomCountdownModal] = useState<boolean>(false);
  const [customCountdownInput, setCustomCountdownInput] = useState<number>(selectedGraceSeconds);
  const [previewItem, setPreviewItem] = useState<{ type: 'monster' | 'switchoff'; id: string } | null>(null);

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

  // Time-aware greeting
  const [greeting, setGreeting] = useState<string>('Good evening');
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  useEffect(() => {
    if (activeChild?.dailyLimitMinutes) {
      setSelectedMinutes(activeChild.dailyLimitMinutes);
    }
    if (activeChild?.defaultGraceSeconds) {
      setSelectedGraceSeconds(activeChild.defaultGraceSeconds);
    }
  }, [activeChild?.id]);

  const handleStartTimer = () => {
    startSession({
      childId: activeChild.id,
      durationMinutes: selectedMinutes,
      gracePeriodSeconds: selectedGraceSeconds,
      shutdownStyle: selectedSwitchOffId === 'low_battery' ? 'low_battery' : 'needs_rest',
    });
  };

  const currentMonster = MONSTER_PROFILES.find((m) => m.id === selectedMonsterId) || MONSTER_PROFILES[0];
  const currentSwitchOff = SWITCH_OFF_PROFILES.find((s) => s.id === selectedSwitchOffId) || SWITCH_OFF_PROFILES[0];
  const presets = [10, 15, 20, 30, 45];

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] text-[#1A2436] justify-between relative overflow-hidden font-sans select-none">
      {/* Subtle Organic Nature Background Art */}
      <NatureDecorations variant="full" />

      {/* Main Scrollable View */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-24 relative z-10 space-y-4 scrollbar-none">

        {/* ========================================================================= */}
        {/* 1. HEADER: Greeting and All Children Profiles at Top */}
        {/* ========================================================================= */}
        <header className="pt-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[11px] font-bold text-[#64748B] tracking-wide uppercase flex items-center gap-1.5">
                {greeting}, Parent
                <Sparkles className="w-3 h-3 text-[#F6D878] fill-[#F6D878]" />
              </span>
              <h1 className="text-lg sm:text-xl font-extrabold text-[#1A2436] tracking-tight">
                Child Profiles
              </h1>
            </div>
          </div>

          {/* All Children's Profiles Displayed on Top of Home Page with Dynamic Width */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {childrenList.map((c) => {
              const isSelected = activeChild.id === c.id;
              return (
                <div key={c.id} className="relative shrink-0">
                  <div
                    className={`flex items-center gap-2.5 pl-3 ${isSelected ? 'pr-8' : 'pr-4'} py-2 rounded-2xl transition-all relative ${isSelected
                      ? 'bg-[#EBF4EF] text-[#2D5441] border-2 border-[#5D997C] shadow-xs'
                      : 'bg-white hover:bg-[#FBF9F4] text-[#475569] border border-[#EAE5DE] shadow-xs'
                      }`}
                  >
                    <button
                      type="button"
                      onClick={() => selectChild(c.id)}
                      className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer"
                    >
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-base font-black shadow-xs shrink-0 ${
                        isSelected
                          ? 'bg-[#5D997C] text-white'
                          : 'bg-[#F5F2EB] text-[#475569]'
                      }`}>
                        {c.name[0].toUpperCase()}
                      </div>
                      <div className="whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-extrabold text-[#1A2436] block tracking-tight">
                            {c.name}
                          </span>
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#FFF7ED] border border-[#FED7AA] text-[10px] font-black text-[#C2410C]">
                            <span className="text-[10px] leading-none">🔥</span>
                            <span className="leading-none">{c.streakDays || (c as any).streak || 5}</span>
                          </span>
                        </div>
                        <span className={`text-[10px] font-semibold block mt-0.5 ${isSelected ? 'text-[#2D5441]' : 'text-[#64748B]'}`}>
                          {formatAgeGroupDisplay(c.ageGroup)} • {c.dailyLimitMinutes || 20}m limit
                        </span>
                      </div>
                    </button>

                    {/* Edit button in Top Right Corner */}
                    {isSelected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditChildId(c.id);
                          setEditChildName(c.name);
                          setEditChildAge(c.ageGroup);
                          setEditChildAvatar(c.avatar);
                          setEditChildLimit(c.dailyLimitMinutes || 20);
                          setShowEditChildModal(true);
                        }}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#5D997C] hover:bg-[#51876D] text-white flex items-center justify-center shadow-xs active:scale-90 transition-all z-10 cursor-pointer"
                        title={`Edit ${c.name}'s profile`}
                        aria-label={`Edit ${c.name}'s profile`}
                      >
                        <Pencil className="w-2.5 h-2.5 text-white" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </header>

        {/* Quick Screen Time Home Screen Widget (Appears on parent's phone home screen when added) */}
        {isWidgetAddedToHome && (
          <section className="rounded-[24px] bg-white border border-[#EAE5DE] p-4 shadow-[0_2px_14px_rgba(26,36,54,0.04)] text-[#1A2436]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[#5D997C]">
                <LayoutGrid className="w-3.5 h-3.5 text-[#5D997C]" />
                <span>Home Screen Widget</span>
              </div>
              <button
                type="button"
                onClick={() => setIsWidgetAddedToHome(false)}
                className="text-[#94A3B8] hover:text-[#1A2436] text-xs font-bold p-1 rounded-md hover:bg-[#FAF8F5] cursor-pointer"
                title="Remove widget from home screen"
              >
                ✕
              </button>
            </div>

            <div
              onClick={() => {
                if (isWidgetDefaultPresetActive) {
                  startSession({
                    childId: activeChild.id,
                    durationMinutes: widgetDefaultPresetMinutes,
                    gracePeriodSeconds: activeChild.defaultGraceSeconds || 60,
                    shutdownStyle: 'low_battery',
                  });
                  navigateTo('active_session');
                } else {
                  setShowWidgetQuickSelectModal(true);
                }
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                isWidgetDefaultPresetActive
                  ? 'bg-[#FAF8F5] hover:bg-[#F5F2EB] border-[#5D997C]'
                  : 'bg-[#FAF8F5] hover:bg-[#F5F2EB] border-[#EAE5DE]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black shadow-xs shrink-0 ${
                      isWidgetDefaultPresetActive
                        ? 'bg-[#EBF4EF] text-[#2D5441] border border-[#5D997C]'
                        : 'bg-[#5D997C] text-white'
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-extrabold text-[#1A2436] truncate">
                        {isWidgetDefaultPresetActive
                          ? `★ ${formatWidgetDuration(widgetDefaultPresetMinutes)} Preset`
                          : 'Quick-Select Widget'}
                      </h4>
                      <span
                        className={`text-[8.5px] font-black px-1.5 py-0.2 rounded ${
                          isWidgetDefaultPresetActive
                            ? 'bg-[#FDF5E6] text-[#B37400] border border-[#F6C343]'
                            : 'bg-[#EBF4EF] text-[#2D5441] border border-[#5D997C]'
                        }`}
                      >
                        {isWidgetDefaultPresetActive ? '1-TAP ACTION' : `${widgetTimerOptions.length} OPTIONS`}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                      {isWidgetDefaultPresetActive
                        ? `1-tap starts immediately • Click "Options" for other choices`
                        : `Click to choose from ${widgetTimerOptions.map((o) => `${o}m`).join(' • ')}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {isWidgetDefaultPresetActive ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowWidgetQuickSelectModal(true)}
                        className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-100 border border-[#CBD5E1] text-[10.5px] font-extrabold text-[#475569] shadow-xs cursor-pointer"
                      >
                        ⏱️ Options
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          startSession({
                            childId: activeChild.id,
                            durationMinutes: widgetDefaultPresetMinutes,
                            gracePeriodSeconds: activeChild.defaultGraceSeconds || 60,
                            shutdownStyle: 'low_battery',
                          });
                          navigateTo('active_session');
                        }}
                        className="py-2 px-3.5 rounded-xl bg-[#5D997C] hover:bg-[#51876D] text-white font-bold text-xs shadow-xs cursor-pointer"
                      >
                        Start
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowWidgetQuickSelectModal(true)}
                      className="py-2 px-3.5 rounded-xl bg-[#5D997C] hover:bg-[#51876D] text-white font-bold text-xs shadow-xs cursor-pointer"
                    >
                      ⏱️ Options
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-bar showing configured options */}
              <div className="mt-2.5 pt-2 border-t border-[#EAE5DE] flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[#94A3B8] font-bold">Available:</span>
                  {widgetTimerOptions.map((opt) => (
                    <span
                      key={opt}
                      className={`px-1.5 py-0.5 rounded text-[9.5px] font-black ${
                        isWidgetDefaultPresetActive && opt === widgetDefaultPresetMinutes
                          ? 'bg-[#EBF4EF] text-[#2D5441] border border-[#5D997C]'
                          : 'bg-white text-[#64748B] border border-[#E2E8F0]'
                      }`}
                    >
                      {opt === widgetDefaultPresetMinutes && isWidgetDefaultPresetActive ? `★ ${opt}m` : `${opt}m`}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => navigateTo('schedule_automation')}
                  className="text-[#5D997C] font-extrabold hover:underline"
                >
                  Configure →
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 2. HERO CENTERPIECE: Warm Rounded Card with Interactive Mascot */}
        {/* ========================================================================= */}
        <section className="relative rounded-[28px] bg-white border border-[#EAE5DE] p-5 pt-4 text-center shadow-[0_2px_14px_rgba(26,36,54,0.04)] overflow-hidden group">
          {/* Top Subtle Status Tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF4EF] border border-[#D1E6DA] text-[10.5px] font-bold uppercase tracking-wider text-[#2D5441] mb-2 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5D997C]" />
            <span>Target Session Limit</span>
          </div>

          {/* Central Mascot Pedestal (Mascot component kept strictly untouched) */}
          <div className="relative my-2 flex items-center justify-center">
            <div className="relative w-36 h-36 rounded-full p-1 bg-gradient-to-b from-[#EBF4EF] via-[#FEF9E7] to-[#FAF8F5] border-2 border-[#D1E6DA] shadow-xs flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-[#FAF8F5] flex items-center justify-center overflow-hidden">
                <div className="transform scale-[1.05] transition-transform duration-500 group-hover:scale-110">
                  <BuddyMascot
                    mood="sleepy"
                    size={142}
                    disableHover={false}
                    waveHand={true}
                    lookAround={true}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Huge Digital Clock Timer Readout */}
          <div className="mt-1">
            <h2 className="text-5xl font-extrabold tracking-tight text-[#1A2436] font-mono mb-3">
              {String(selectedMinutes).padStart(2, '0')}:00
            </h2>

            {/* 1. Target Screen Time Limits (Contained inside the box) */}
            <div className="p-1.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DE] mb-2.5">
              <div className="flex items-center gap-1.5">
                {presets.map((mins) => {
                  const isCurrent = selectedMinutes === mins;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setSelectedMinutes(mins)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#5D997C] border-[#5D997C] text-white shadow-xs'
                          : 'bg-white hover:bg-[#F5F2EB] border-[#EAE5DE] text-[#475569]'
                      }`}
                    >
                      {mins}m
                    </button>
                  );
                })}
                {/* Custom Button for Screen Time Limit */}
                <button
                  type="button"
                  onClick={() => setShowDurationSheet(true)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    !presets.includes(selectedMinutes)
                      ? 'bg-[#5D997C] border-[#5D997C] text-white shadow-xs'
                      : 'bg-white hover:bg-[#F5F2EB] border-[#EAE5DE] text-[#5D997C]'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {/* 2. Mascot Countdown Wrap-Up Time */}
            <div className="p-2.5 rounded-2xl bg-[#FEF9E7] border border-[#F9ECC0] mb-3.5">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-[10.5px] font-bold text-[#7A6216] tracking-wide uppercase flex items-center gap-1">
                  <span>Mascot Countdown</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#F6D878]/50 text-[#7A6216] font-bold text-[10px]">
                  {selectedGraceSeconds}s wrap-up
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {[15, 30, 60, 90].map((s) => {
                  const isCurrentGrace = selectedGraceSeconds === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedGraceSeconds(s)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isCurrentGrace
                          ? 'bg-[#F6D878] text-[#1A2436] border-[#E8C55A] font-extrabold shadow-xs'
                          : 'bg-white/80 hover:bg-white border-[#F9ECC0] text-[#7A6216]'
                      }`}
                    >
                      {s}s
                    </button>
                  );
                })}

                {/* Custom Countdown Button */}
                <button
                  type="button"
                  onClick={() => {
                    setCustomCountdownInput(selectedGraceSeconds);
                    setShowCustomCountdownModal(true);
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    ![15, 30, 60, 90].includes(selectedGraceSeconds)
                      ? 'bg-[#F6D878] text-[#1A2436] border-[#E8C55A] font-extrabold shadow-xs'
                      : 'bg-white/80 hover:bg-white border-[#F9ECC0] text-[#7A6216]'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {/* Primary Action CTA — Pill-shaped Muted Sage Green */}
            <button
              type="button"
              onClick={handleStartTimer}
              className="w-full py-4 rounded-full bg-[#5D997C] hover:bg-[#51876D] active:bg-[#46745D] text-white font-extrabold text-base shadow-[0_4px_16px_rgba(93,153,124,0.28)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group/btn cursor-pointer"
            >
              <span>Start Timer</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
            </button>
          </div>
        </section>




        {/* ========================================================================= */}
        {/* 5. POSITIVE REINFORCEMENT STREAK CARD */}
        {/* ========================================================================= */}
        <section className="p-3.5 rounded-[24px] bg-[#FEF9E7] border border-[#F9ECC0] flex items-center gap-3 text-[#1A2436]">
          <div className="w-10 h-10 rounded-2xl bg-[#F6D878]/30 border border-[#F6D878]/50 flex items-center justify-center text-xl shrink-0 shadow-xs">
            🔥
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-[#7A6216]">
                {activeChild.streakDays || 5}-Day Screen Streak!
              </span>
            </div>
            <p className="text-[11px] text-[#7A6216]/80 mt-0.5">
              {activeChild.name} transitioned peacefully in his last {activeChild.streakDays || 5} sessions.
            </p>
          </div>
        </section>

        {/* Quick Assessment Re-test Banner */}
        <div className="p-3.5 rounded-[24px] bg-[#F5F2FF] border border-[#E5DCFC] flex items-center justify-between text-[#1A2436]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#DDD6FE]/40 text-[#5B3F9B] flex items-center justify-center text-xs font-bold border border-[#DDD6FE]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-[#1A2436]">Screen Wellbeing Assessment</p>
              <p className="text-[10px] text-[#64748B]">7-step research-backed pediatric flow</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('onboarding_assessment')}
            className="px-3.5 py-1.5 bg-[#5D997C] hover:bg-[#51876D] text-white text-xs font-bold rounded-full shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            Open →
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: DURATION & COUNTDOWN CUSTOMIZER BOTTOM SHEET */}
      {/* ========================================================================= */}
      {showDurationSheet && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white border border-[#EAE5DE] rounded-t-3xl sm:rounded-3xl p-5 w-full max-w-sm shadow-2xl animate-slide-up sm:animate-scale-up text-[#1A2436] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#5D997C]" />
                <h3 className="text-sm font-extrabold text-[#1A2436]">Adjust Session & Countdown</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDurationSheet(false)}
                className="p-1 text-[#94A3B8] hover:text-[#1A2436] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Main Session Duration with Keyboard Input for Hours and Minutes */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-bold text-[#64748B]">1. Target Screen Time Limit:</span>
                <span className="text-[#5D997C] font-extrabold text-xs">
                  {selectedMinutes} mins {selectedMinutes >= 60 ? `(${Math.floor(selectedMinutes / 60)}h ${selectedMinutes % 60}m)` : ''}
                </span>
              </div>

              {/* Keyboard Numeric Input Boxes for Hours & Minutes */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FAF8F5] border border-[#EAE5DE] mb-3">
                {/* Hours Input */}
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                    Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={Math.floor(selectedMinutes / 60)}
                    onChange={(e) => {
                      const h = Math.max(0, parseInt(e.target.value, 10) || 0);
                      const m = selectedMinutes % 60;
                      setSelectedMinutes(Math.max(1, h * 60 + m));
                    }}
                    className="w-full bg-white border border-[#EAE5DE] rounded-xl py-2 px-3 text-center text-lg font-extrabold text-[#1A2436] focus:outline-none focus:border-[#5D997C] focus:ring-2 focus:ring-[#5D997C]/20"
                    placeholder="0"
                  />
                </div>

                <span className="text-xl font-black text-[#94A3B8] mt-4">:</span>

                {/* Minutes Input */}
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                    Minutes
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={selectedMinutes % 60}
                    onChange={(e) => {
                      const h = Math.floor(selectedMinutes / 60);
                      const m = Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0));
                      setSelectedMinutes(Math.max(1, h * 60 + m));
                    }}
                    className="w-full bg-white border border-[#EAE5DE] rounded-xl py-2 px-3 text-center text-lg font-extrabold text-[#1A2436] focus:outline-none focus:border-[#5D997C] focus:ring-2 focus:ring-[#5D997C]/20"
                    placeholder="20"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {[10, 15, 20, 30, 45, 60, 90, 120].map((mins) => {
                  const isCurrent = selectedMinutes === mins;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setSelectedMinutes(mins)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center cursor-pointer ${
                        isCurrent
                          ? 'bg-[#5D997C] border-[#5D997C] text-white shadow-xs'
                          : 'bg-[#FAF8F5] hover:bg-[#F5F2EB] border-[#EAE5DE] text-[#475569]'
                      }`}
                    >
                      <span className="text-xs font-bold">{mins >= 60 ? `${mins / 60}h` : `${mins}m`}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Mascot Wrap-Up Countdown Time (Grace Period) */}
            <div className="mb-4 p-3.5 rounded-2xl bg-[#FEF9E7] border border-[#F9ECC0]">
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-[#7A6216]">2. Mascot Countdown Time:</span>
                </div>
                <span className="text-[#7A6216] font-extrabold text-xs">{selectedGraceSeconds}s grace</span>
              </div>
              <p className="text-[11px] text-[#7A6216]/80 mb-2.5 leading-tight">
                How long Buddy counts down with cheerful sounds for your child to put the phone down voluntarily.
              </p>

              <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                {[15, 30, 45, 60, 90, 120].map((secs) => {
                  const isCurrent = selectedGraceSeconds === secs;
                  return (
                    <button
                      key={secs}
                      type="button"
                      onClick={() => setSelectedGraceSeconds(secs)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#F6D878] text-[#1A2436] border-[#E8C55A] font-extrabold shadow-xs'
                          : 'bg-white/80 hover:bg-white border-[#F9ECC0] text-[#7A6216]'
                      }`}
                    >
                      {secs}s
                    </button>
                  );
                })}
              </div>

              <input
                type="range"
                min="10"
                max="180"
                step="5"
                value={selectedGraceSeconds}
                onChange={(e) => setSelectedGraceSeconds(Number(e.target.value))}
                className="w-full accent-[#5D997C] cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowDurationSheet(false)}
              className="w-full py-3.5 bg-[#5D997C] hover:bg-[#51876D] text-white text-xs font-extrabold rounded-full shadow-xs active:scale-98 transition-all cursor-pointer"
            >
              Save ({selectedMinutes}m limit • {selectedGraceSeconds}s countdown)
            </button>
          </div>
        </div>
      )}



      {/* ========================================================================= */}
      {/* MODAL 4: CUSTOM COUNTDOWN TIME (KEYBOARD NUMBER INPUT) */}
      {/* ========================================================================= */}
      {showCustomCountdownModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE5DE] text-[#1A2436] rounded-3xl p-6 max-w-xs w-full shadow-2xl animate-scale-up text-center">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-left">
                <div>
                  <h3 className="text-sm font-extrabold text-[#1A2436]">Custom Countdown</h3>
                  <p className="text-[10px] text-[#7A6216]">Type seconds on your keyboard</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomCountdownModal(false)}
                className="p-1 text-[#94A3B8] hover:text-[#1A2436] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#64748B] my-3 text-left leading-relaxed">
              Enter the exact number of seconds Buddy will count down with your child:
            </p>

            {/* Direct Keyboard Input for Seconds */}
            <div className="my-4 relative flex items-center justify-center">
              <input
                type="number"
                min="5"
                max="600"
                autoFocus
                value={customCountdownInput || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setCustomCountdownInput(isNaN(val) ? 0 : val);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customCountdownInput >= 5) {
                    setSelectedGraceSeconds(customCountdownInput);
                    setShowCustomCountdownModal(false);
                    soundEngine.playMascotCountdownTick(customCountdownInput);
                  }
                }}
                placeholder="45"
                className="w-full py-3.5 px-4 rounded-2xl bg-[#FEF9E7] border-2 border-[#F6D878] text-center text-3xl font-black font-mono text-[#7A6216] focus:outline-none focus:ring-4 focus:ring-[#F6D878]/30 placeholder-[#7A6216]/40"
              />
              <span className="absolute right-4 text-xs font-bold text-[#7A6216]/70 pointer-events-none">
                seconds
              </span>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowCustomCountdownModal(false)}
                className="flex-1 py-2.5 bg-[#FAF8F5] hover:bg-[#F5F2EB] text-[#475569] text-xs font-bold rounded-full border border-[#EAE5DE] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!customCountdownInput || customCountdownInput < 5}
                onClick={() => {
                  if (customCountdownInput >= 5) {
                    setSelectedGraceSeconds(customCountdownInput);
                    setShowCustomCountdownModal(false);
                    soundEngine.playMascotCountdownTick(customCountdownInput);
                  }
                }}
                className={`flex-1 py-2.5 text-white text-xs font-bold rounded-full shadow-xs transition-all cursor-pointer ${
                  customCountdownInput >= 5
                    ? 'bg-[#5D997C] hover:bg-[#51876D] active:scale-95'
                    : 'bg-[#5D997C]/40 opacity-50 cursor-not-allowed'
                }`}
              >
                Apply {customCountdownInput ? `${customCountdownInput}s` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: EDIT CHILD PROFILE MODAL */}
      {/* ========================================================================= */}
      {showEditChildModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-[#EAE5DE] text-[#1A2436] rounded-3xl p-5 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE5DE]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#EBF4EF] border border-[#D1E6DA] flex items-center justify-center text-[#5D997C]">
                  <Pencil className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-extrabold text-[#1A2436]">Edit Child Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditChildModal(false)}
                className="p-1 text-[#94A3B8] hover:text-[#1A2436] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditChild} className="mt-4 space-y-4">
              {/* Avatar Display */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#5D997C] flex items-center justify-center text-xl font-black text-white shadow-xs shrink-0">
                  {editChildName ? editChildName[0].toUpperCase() : 'C'}
                </div>
              </div>

              {/* Child Name */}
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] mb-1">Child's Name</label>
                <input
                  type="text"
                  required
                  value={editChildName}
                  onChange={(e) => setEditChildName(e.target.value)}
                  placeholder="e.g. Leo, Sam, Emma"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE5DE] focus:border-[#5D997C] focus:outline-none text-[#1A2436] text-sm font-bold placeholder-[#94A3B8]"
                />
              </div>

              {/* Age Bracket Selector - Matching Onboarding */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-[#64748B]">Age Bracket</label>
                  <span className="text-[10px] font-bold text-[#5D997C]">
                    {ONBOARDING_AGE_GROUPS.find(o => isAgeMatching(editChildAge, o.id))?.badge || ''} • {editChildLimit}m daily recommended
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {ONBOARDING_AGE_GROUPS.map((b) => {
                    const isSelected = isAgeMatching(editChildAge, b.id);
                    const isLast = b.id === '14+';
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setEditChildAge(b.id);
                          setEditChildLimit(b.mins);
                        }}
                        className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-between min-h-[66px] cursor-pointer ${
                          isLast ? 'col-span-2' : 'col-span-1'
                        } ${isSelected
                          ? 'bg-[#EBF4EF] border-2 border-[#5D997C] shadow-xs scale-[1.02]'
                          : 'bg-[#FAF8F5] border-[#EAE5DE] hover:bg-[#F5F2EB]'
                          }`}
                      >
                        <span className="text-base leading-none mb-0.5">{b.icon}</span>
                        <span className={`block text-[10.5px] font-bold leading-tight ${isSelected ? 'text-[#2D5441]' : 'text-[#1A2436]'}`}>
                          {b.label}
                        </span>
                        <span className={`block text-[8.5px] font-bold mt-0.5 ${isSelected ? 'text-[#2D5441]' : 'text-[#64748B]'}`}>
                          {b.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Delete Child Profile Section */}
              <div className="pt-2.5 border-t border-[#EAE5DE] flex items-center justify-between">
                <span className="text-[11px] text-rose-600 font-bold">Remove this profile?</span>
                <button
                  type="button"
                  onClick={handleDeleteChild}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-full transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Delete Profile</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowEditChildModal(false)}
                  className="flex-1 py-2.5 bg-[#FAF8F5] hover:bg-[#F5F2EB] text-[#475569] text-xs font-bold rounded-full border border-[#EAE5DE] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editChildName.trim()}
                  className="flex-1 py-2.5 bg-[#5D997C] hover:bg-[#51876D] text-white text-xs font-bold rounded-full shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: MINI CALENDAR MODAL (Opens when clicking Custom in One-Time dates) */}
      {/* ========================================================================= */}
      {showMiniCalendarModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE5DE] rounded-3xl p-5 w-full max-w-xs shadow-2xl animate-scale-up text-[#1A2436]">
            {/* Header with Navigation */}
            <div className="flex items-center justify-between mb-3">
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
                className="w-8 h-8 rounded-lg bg-[#FAF8F5] hover:bg-[#F5F2EB] border border-[#EAE5DE] flex items-center justify-center text-[#1A2436] font-extrabold text-lg transition-all cursor-pointer"
              >
                ‹
              </button>

              <span className="text-sm font-extrabold text-[#1A2436]">
                {[
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ][calendarMonth]} {calendarYear}
              </span>

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
                className="w-8 h-8 rounded-lg bg-[#FAF8F5] hover:bg-[#F5F2EB] border border-[#EAE5DE] flex items-center justify-center text-[#1A2436] font-extrabold text-lg transition-all cursor-pointer"
              >
                ›
              </button>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2 pb-1 border-b border-[#EAE5DE] text-[10.5px] font-bold text-[#64748B]">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((ch, i) => (
                <div key={i}>{ch}</div>
              ))}
            </div>

            {/* Days Matrix */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({
                length: (() => {
                  const day = new Date(calendarYear, calendarMonth, 1).getDay();
                  return day === 0 ? 6 : day - 1;
                })()
              }).map((_, i) => (
                <div key={`emp-${i}`} className="h-8" />
              ))}

              {Array.from({ length: new Date(calendarYear, calendarMonth + 1, 0).getDate() }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected = calendarDay === dayNum;
                return (
                  <button
                    key={`d-${dayNum}`}
                    type="button"
                    onClick={() => {
                      setCalendarDay(dayNum);
                      const monthStr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][calendarMonth];
                      setCustomSelectedDate(`${monthStr} ${dayNum}, ${calendarYear}`);
                      setOneTimeTargetOption('Custom');
                      setShowMiniCalendarModal(false);
                    }}
                    className={`h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'bg-[#5D997C] text-white shadow-xs font-extrabold'
                        : 'text-[#475569] hover:bg-[#FAF8F5]'
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
              className="w-full mt-4 py-2 bg-[#FAF8F5] hover:bg-[#F5F2EB] text-[#475569] text-xs font-bold rounded-full border border-[#EAE5DE] transition-all cursor-pointer"
            >
              Close Calendar
            </button>
          </div>
        </div>
      )}

      {/* INTERACTIVE WIDGET QUICK-SELECT TIMES MODAL / OVERLAY */}
      {showWidgetQuickSelectModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE5DE] text-[#1A2436] rounded-3xl p-5 max-w-sm w-full shadow-2xl animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE5DE]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EBF4EF] border border-[#D1E6DA] flex items-center justify-center text-[#2D5441]">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#1A2436]">Start Screen Time</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] font-bold text-[#5D997C]">{activeChild.name}</span>
                    <span className="text-[10px] text-[#94A3B8]">•</span>
                    <span className="text-[10.5px] font-extrabold text-amber-600">5 🔥 Day Streak</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWidgetQuickSelectModal(false)}
                className="p-1 rounded-full text-[#94A3B8] hover:text-[#1A2436] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11.5px] text-[#64748B]">
              Tap any time limit to immediately start phone screen time:
            </p>

            {/* Options Grid */}
            <div className="grid grid-cols-2 gap-2">
              {widgetTimerOptions.map((opt) => {
                const isDefault = isWidgetDefaultPresetActive && opt === widgetDefaultPresetMinutes;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setShowWidgetQuickSelectModal(false);
                      startSession({
                        childId: activeChild.id,
                        durationMinutes: opt,
                        gracePeriodSeconds: activeChild.defaultGraceSeconds || 60,
                        shutdownStyle: 'low_battery',
                      });
                      navigateTo('active_session');
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                      isDefault
                        ? 'bg-[#FDF5E6] border-[#F6C343] shadow-xs'
                        : 'bg-[#FAF8F5] border-[#EAE5DE] hover:bg-[#F5F2EB]'
                    }`}
                  >
                    {isDefault && (
                      <span className="inline-block text-[8px] font-black bg-[#F6C343] text-[#452B00] px-1.5 py-0.2 rounded mb-1">
                        ★ DEFAULT PRESET
                      </span>
                    )}
                    <span className="block text-base font-black text-[#1A2436]">
                      {formatWidgetDuration(opt)}
                    </span>
                    <span className="block text-[10px] text-[#718096] mt-0.5">
                      Tap to start
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Link to Configure */}
            <div className="pt-2 border-t border-[#EAE5DE] text-center">
              <button
                type="button"
                onClick={() => {
                  setShowWidgetQuickSelectModal(false);
                  navigateTo('schedule_automation');
                }}
                className="text-xs font-bold text-[#5D997C] hover:underline cursor-pointer"
              >
                ⚙️ Customize Options & Default Preset →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

