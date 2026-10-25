import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import mascotImg from '../../../assets/mascot.png';
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
  Battery,
  ChevronDown,
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
    user,
    activeChild,
    childrenList,
    selectChild,
    updateChild,
    deleteChild,
    navigateTo,
    startSession,
    sessionLogs,
    activeSession,
    quickWidgetMinutes,
    isWidgetAddedToHome,
    setIsWidgetAddedToHome,
    widgetTimerOptions,
    isWidgetDefaultPresetActive,
    widgetDefaultPresetMinutes,
  } = useApp();

  const [showChildPickerModal, setShowChildPickerModal] = useState<boolean>(false);
  const [showWidgetHelpModal, setShowWidgetHelpModal] = useState<boolean>(false);

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
  const getLocalDateStr = (d = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = getLocalDateStr(new Date());
  const todayLogs = sessionLogs.filter((l) => l.dateStr === todayStr);
  const isActiveRunning = activeSession.status === 'running' || activeSession.status === 'warning_80' || activeSession.status === 'time_up_grace';
  const todayCount = todayLogs.length + (isActiveRunning ? 1 : 0);
  const completedSeconds = todayLogs.reduce((acc, l) => acc + (l.elapsedSeconds || 0), 0);
  const activeElapsed = isActiveRunning ? activeSession.elapsedSeconds : 0;
  const totalMins = Math.round((completedSeconds + activeElapsed) / 60);

  const formatTodayScreenTime = (mins: number) => {
    if (mins <= 0) return '0 min';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h} hr${h > 1 ? 's' : ''}`;
    return `${m} min`;
  };

  const getTimeGreeting = (name?: string) => {
    const hour = new Date().getHours();
    let g = 'Good morning';
    if (hour >= 12 && hour < 17) g = 'Good afternoon';
    else if (hour >= 17 || hour < 4) g = 'Good evening';
    return name?.trim() ? `${g}, ${name.trim()}` : g;
  };

  const formatEventTime = (isoStringOrTimestamp: string | number) => {
    const date = new Date(isoStringOrTimestamp);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (isToday) return `Today at ${timeStr}`;
    if (isYesterday) return `Yesterday at ${timeStr}`;
    return `${date.getMonth() + 1}/${date.getDate()} at ${timeStr}`;
  };

  const recentLogs = sessionLogs.slice(0, 2);
  const parentName = typeof window !== 'undefined' ? localStorage.getItem('babyboo_parent_name') || '' : '';

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] text-[#1A2436] justify-between relative overflow-hidden font-sans select-none">
      {/* Subtle Organic Nature Background Art */}
      <NatureDecorations variant="full" />

      {/* Main Scrollable View */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-24 relative z-10 space-y-4 scrollbar-none">
        {/* 1. Greeting */}
        <header className="pt-1 mb-2">
          <h1 className="text-2xl font-extrabold text-[#1A2436] tracking-tight">
            {getTimeGreeting(parentName)}
          </h1>
          <p className="text-xs font-medium text-[#64748B] mt-0.5">
            A little peace of mind.
          </p>
        </header>

        {/* 2. Selected Child Profile (Below Greeting, 2 Children Side by Side, No Switch Button) */}
        <div className="mb-3">
          {childrenList.length === 0 ? (
            <div className="bg-[#FAF5FF] border border-[#DDD6FE] rounded-2xl p-3 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#6D28D9]">No Child Profile Added</p>
                <p className="text-[11px] text-[#64748B]">Create a profile to personalize screen time</p>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('add_child')}
                className="px-3 py-1.5 bg-[#6D28D9] text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                + Add Child
              </button>
            </div>
          ) : childrenList.length === 1 ? (
            <div className="bg-[#FAF5FF] border border-[#DDD6FE] rounded-2xl p-3 shadow-xs flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-[#7C6DF8] text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                {activeChild?.avatar || activeChild?.name?.[0]?.toUpperCase() || 'C'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-[#1A2436]">{activeChild.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-[#EDE9FE] text-[#6D28D9]">
                    Selected Profile
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  {formatAgeGroupDisplay(activeChild.ageGroup)} • {activeChild.dailyLimitMinutes}m daily target
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {childrenList.slice(0, 2).map((c) => {
                const isSelected = c.id === activeChild?.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      if (isActiveRunning) {
                        alert('Please finish the active screen-time countdown before switching child profiles.');
                        return;
                      }
                      selectChild(c.id);
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FAF5FF] border-[#DDD6FE] shadow-xs ring-1 ring-[#DDD6FE]'
                        : 'bg-white border-[#EAE5DE] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-full text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0"
                      style={{ backgroundColor: c.name === 'Maya' ? '#F59E0B' : '#7C6DF8' }}
                    >
                      {c.avatar || c.name?.[0]?.toUpperCase() || 'C'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-extrabold truncate ${isSelected ? 'text-[#1A2436]' : 'text-[#475569]'}`}>
                          {c.name}
                        </span>
                        {isSelected && (
                          <span className="px-1 py-0.2 rounded text-[8.5px] font-bold bg-[#EDE9FE] text-[#6D28D9] shrink-0">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#64748B] truncate mt-0.5">
                        {formatAgeGroupDisplay(c.ageGroup)} • {c.dailyLimitMinutes}m
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 3. HERO CENTERPIECE: Warm Rounded Card with Interactive Mascot */}
        {/* ========================================================================= */}
        <section className="relative rounded-[28px] bg-white border border-[#EAE5DE] p-5 pt-4 text-center shadow-[0_2px_14px_rgba(26,36,54,0.04)] overflow-hidden group">

          {/* Central Mascot Pedestal (Mascot component kept strictly untouched) */}
          <div className="relative my-2 flex items-center justify-center">
            <div className="relative w-36 h-36 rounded-full p-1 bg-gradient-to-b from-[#EBF4EF] via-[#FEF9E7] to-[#FAF8F5] border-2 border-[#D1E6DA] shadow-xs flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-[#FAF8F5] flex items-center justify-center overflow-hidden">
                <img
                  src={mascotImg}
                  alt="BabyBoo Mascot"
                  className="w-28 h-auto object-contain select-none pointer-events-none"
                />
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
                {[10, 15, 20, 30, 45].map((mins) => {
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
                    ![10, 15, 20, 30, 45].includes(selectedMinutes)
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
        </section>        {/* ========================================================================= */}
        {/* 4 & 5. SIDE BY SIDE: TODAY'S OVERVIEW & WIDGET STATUS */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Today's Overview */}
          <section className="bg-white rounded-[18px] p-3.5 border border-[#EAE5DE] shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-[#64748B] tracking-wider uppercase block">
                Today's Screen Time
              </span>
              <span className="block text-2xl font-black text-[#1A2436] tracking-tight mt-1">
                {formatTodayScreenTime(totalMins)}
              </span>
            </div>

            <div className="mt-2.5 pt-2 border-t border-[#F1ECE6]">
              <span className="text-xs font-bold text-[#475569] block">
                {todayCount} {todayCount === 1 ? 'session' : 'sessions'}
              </span>
              <span className="text-[9.5px] text-[#94A3B8] block mt-0.5">
                BabyBoo-managed
              </span>
            </div>
          </section>

          {/* Widget Status */}
          <section className="bg-white rounded-[18px] p-3.5 border border-[#EAE5DE] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#5D997C]" />
                <span className="text-[10px] font-extrabold text-[#2D5A43] uppercase tracking-wider">
                  Home Widget
                </span>
              </div>
              <span className="block text-[12.5px] font-extrabold text-[#1A2436]">
                Ready to Use
              </span>
              <p className="text-[10.5px] text-[#64748B] leading-tight mt-1">
                Start timer from phone home screen
              </p>
            </div>

            <div className="mt-2.5 pt-2 border-t border-[#F1ECE6]">
              <button
                type="button"
                onClick={() => setShowWidgetHelpModal(true)}
                className="text-[11px] font-extrabold text-[#5D997C] hover:underline cursor-pointer"
              >
                Widget help →
              </button>
            </div>
          </section>
        </div>

        {/* ========================================================================= */}
        {/* 7. RECENT ACTIVITY (CLEANER DESIGN) */}
        {/* ========================================================================= */}
        <section className="bg-white rounded-[18px] px-3.5 py-3 border border-[#EAE5DE] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold text-[#1A2436] tracking-wide uppercase">
              Recent Activity
            </span>
            <button
              type="button"
              onClick={() => navigateTo('weekly_stats')}
              className="text-[11px] font-extrabold text-[#5D997C] hover:underline cursor-pointer"
            >
              View all →
            </button>
          </div>

          {recentLogs.length === 0 ? (
            <div className="py-2 text-center">
              <p className="text-xs font-medium text-[#94A3B8]">
                No sessions recorded today
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentLogs.map((log) => {
                const outcomeLabel =
                  log.outcome === 'voluntary_grace'
                    ? 'Completed'
                    : log.outcome === 'required_shutdown'
                    ? 'Battery rest'
                    : 'Ended early';

                const dotColor =
                  log.outcome === 'voluntary_grace'
                    ? 'bg-[#5D997C]'
                    : log.outcome === 'required_shutdown'
                    ? 'bg-[#94A3B8]'
                    : 'bg-amber-500';

                const durationMinutesVal = Math.max(1, Math.round((log.elapsedSeconds || 0) / 60));

                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between py-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                      <span className="text-xs font-extrabold text-[#1A2436]">
                        {log.childName}
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        • {durationMinutesVal}m • {outcomeLabel}
                      </span>
                    </div>
                    <span className="text-[10.5px] font-medium text-[#94A3B8]">
                      {formatEventTime(log.startedAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
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

      {/* ========================================================================= */}
      {/* CHILD PROFILE PICKER MODAL */}
      {/* ========================================================================= */}
      {showChildPickerModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE5DE] text-[#1A2436] rounded-3xl p-5 max-w-sm w-full shadow-2xl animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE5DE]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FAF5FF] border border-[#DDD6FE] flex items-center justify-center text-[#6D28D9]">
                  👶
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#1A2436]">Switch Child Profile</h3>
                  <p className="text-[11px] text-[#64748B]">Select who is using the phone today</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChildPickerModal(false)}
                className="p-1 rounded-full text-[#94A3B8] hover:text-[#1A2436] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {childrenList.map((c) => {
                const isSelected = c.id === activeChild.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      selectChild(c.id);
                      setShowChildPickerModal(false);
                    }}
                    className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FAF5FF] border-[#DDD6FE] shadow-xs'
                        : 'bg-[#FAF8F5] border-[#EAE5DE] hover:bg-[#F5F2EB]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#6D28D9] flex items-center justify-center text-white text-sm font-bold">
                        {c.name?.charAt(0).toUpperCase() || 'C'}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-[#1A2436]">{c.name}</span>
                          {isSelected && (
                            <span className="bg-[#DDD6FE] text-[#6D28D9] text-[9.5px] font-bold px-1.5 py-0.5 rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#64748B]">
                          {c.ageGroup ? `${c.ageGroup.replace('_', '-')} yrs` : 'Preschool'} • {c.dailyLimitMinutes || 20}m target
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#6D28D9]" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#EAE5DE] flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowChildPickerModal(false);
                  navigateTo('add_child');
                }}
                className="w-full py-2.5 bg-[#FAF5FF] hover:bg-[#EDE9FE] text-[#6D28D9] text-xs font-bold rounded-xl border border-[#DDD6FE] transition-all cursor-pointer text-center"
              >
                + Add Another Child Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WIDGET HELP MODAL */}
      {/* ========================================================================= */}
      {showWidgetHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE5DE] text-[#1A2436] rounded-3xl p-5 max-w-sm w-full shadow-2xl animate-scale-up space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE5DE]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EBF4EF] border border-[#D1E6DA] flex items-center justify-center text-[#5D997C]">
                  📱
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#1A2436]">BabyBoo Home Widget</h3>
                  <p className="text-[11px] text-[#64748B]">Quick timer on your phone launcher</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWidgetHelpModal(false)}
                className="p-1 rounded-full text-[#94A3B8] hover:text-[#1A2436] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              The BabyBoo widget lets parents launch a toddler screen time countdown directly from the Android home screen without opening the application.
            </p>

            <div className="space-y-2 bg-[#FAF8F5] p-3 rounded-2xl border border-[#EAE5DE]">
              <span className="text-[10.5px] font-extrabold text-[#1A2436] uppercase tracking-wider block">
                How to add the widget:
              </span>
              {[
                'Go to your phone’s home screen launcher.',
                'Long-press any empty space on your home screen.',
                'Tap Widgets and scroll to find BabyBoo.',
                'Touch and hold the BabyBoo widget, then drag it to your screen.'
              ].map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-[#475569]">
                  <span className="w-4 h-4 rounded-full bg-[#5D997C] text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>

            <div className="p-2.5 rounded-xl bg-[#FAF5FF] border border-[#DDD6FE] text-[10.5px] text-[#6D28D9] leading-tight">
              <strong>Note on Verification:</strong> Android launcher security does not expose whether a widget is placed on the home screen to apps. BabyBoo syncs timer preferences via SharedPreferences.
            </div>

            <button
              type="button"
              onClick={() => setShowWidgetHelpModal(false)}
              className="w-full py-2.5 bg-[#5D997C] hover:bg-[#51876D] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

