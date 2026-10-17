import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  Smartphone,
  Plus,
  X,
  Play,
  Check,
  Star,
  Clock,
} from 'lucide-react';
import { NatureDecorations } from '../../theme/NatureDecorations';
import { HandoverNativeEngine } from '../../../modules/handover-native';

const QUICK_ADD_MINUTES = [10, 15, 20, 30, 45, 60];

const formatDuration = (totalMinutes: number): string => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h} hr${h > 1 ? 's' : ''}`;
  return `${m} min`;
};

export const ScheduleAutomationScreen: React.FC = () => {
  const {
    activeChild,
    navigateTo,
    isWidgetAddedToHome,
    setIsWidgetAddedToHome,
    widgetTimerOptions,
    setWidgetTimerOptions,
    isWidgetDefaultPresetActive,
    setIsWidgetDefaultPresetActive,
    widgetDefaultPresetMinutes,
    setWidgetDefaultPresetMinutes,
    startSession,
  } = useApp();

  // Widget builder state
  const [customMinutesInput, setCustomMinutesInput] = useState<string>('');
  const [showQuickSelectModal, setShowQuickSelectModal] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const handleTogglePresetMode = (enabled: boolean) => {
    setIsWidgetDefaultPresetActive(enabled);
    if (enabled && !widgetTimerOptions.includes(widgetDefaultPresetMinutes)) {
      setWidgetDefaultPresetMinutes(widgetTimerOptions[0] || 15);
    }
  };

  const handleSetDefaultPreset = (mins: number) => {
    setWidgetDefaultPresetMinutes(mins);
    if (!isWidgetDefaultPresetActive) {
      setIsWidgetDefaultPresetActive(true);
    }
  };

  const handleDeleteOption = (mins: number) => {
    if (widgetTimerOptions.length <= 1) {
      alert('You must keep at least one time option for the widget.');
      return;
    }
    const next = widgetTimerOptions.filter((opt) => opt !== mins);
    setWidgetTimerOptions(next);
    HandoverNativeEngine.setWidgetOptions(next).catch(() => {});
    if (widgetDefaultPresetMinutes === mins) {
      setWidgetDefaultPresetMinutes(next[0]);
    }
  };

  const handleAddOption = (mins: number) => {
    if (!mins || isNaN(mins) || mins <= 0 || mins > 360) {
      alert('Please enter a duration between 1 and 360 minutes.');
      return;
    }
    if (widgetTimerOptions.includes(mins)) {
      alert(`${formatDuration(mins)} is already in your options list.`);
      return;
    }
    const next = [...widgetTimerOptions, mins].sort((a, b) => a - b);
    setWidgetTimerOptions(next);
    HandoverNativeEngine.setWidgetOptions(next).catch(() => {});
    setCustomMinutesInput('');
  };

  const handleTestWidgetAction = () => {
    if (isWidgetDefaultPresetActive) {
      setActionFeedback(`Started ${formatDuration(widgetDefaultPresetMinutes)} screen time for ${activeChild.name}!`);
      setTimeout(() => {
        setActionFeedback(null);
        startSession({
          childId: activeChild.id,
          durationMinutes: widgetDefaultPresetMinutes,
          gracePeriodSeconds: activeChild.defaultGraceSeconds || 30,
          shutdownStyle: 'low_battery',
        });
        navigateTo('active_session');
      }, 700);
    } else {
      setShowQuickSelectModal(true);
    }
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
          <h2 className="text-base font-extrabold text-[#1A2436]">Widget Quick-Select</h2>
          <p className="text-[10.5px] font-bold text-[#5D997C]">
            Phone widget times for {activeChild.name}
          </p>
        </div>
        <div className="w-9" />
      </header>

      {/* Toast Feedback */}
      {actionFeedback && (
        <div className="fixed top-16 left-4 right-4 z-50 bg-[#2D5441] text-white p-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-bounce text-xs font-bold">
          <Check className="w-4 h-4 text-[#8DE2B5] shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 z-10 scrollbar-none">
        {/* PHONE WIDGET TIMES CARD */}
        <section className="rounded-3xl bg-white border border-[#EAE5DE] p-4 shadow-[0_2px_12px_rgba(26,36,54,0.03)] space-y-3.5">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FEF9E7] border border-[#FDE68A] flex items-center justify-center text-[#92400E]">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#1A2436]">Phone Widget Times</h4>
                <p className="text-[11px] text-[#64748B] font-medium">
                  Options shown when you tap the BabyBoo phone widget
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsWidgetAddedToHome(!isWidgetAddedToHome)}
              className={`px-2.5 py-1 rounded-xl text-[10.5px] font-extrabold border transition-all cursor-pointer ${
                isWidgetAddedToHome
                  ? 'bg-[#EBF4EF] border-[#5D997C] text-[#2D5441]'
                  : 'bg-[#FAF8F5] border-[#EAE5DE] text-[#94A3B8] hover:bg-[#F5F2EB]'
              }`}
            >
              {isWidgetAddedToHome ? '✓ Active on Phone' : '+ Add Widget'}
            </button>
          </div>

          {/* 1-Tap Preset Mode Banner */}
          <div
            className={`p-3 rounded-2xl border transition-colors flex items-center justify-between ${
              isWidgetDefaultPresetActive
                ? 'bg-[#FEF9E7]/60 border-[#F6C343]'
                : 'bg-[#FAF8F5] border-[#EAE5DE]'
            }`}
          >
            <div className="pr-2">
              <h5 className="text-xs font-black text-[#1A2436]">1-Tap Instant Start</h5>
              <p className="text-[10.5px] text-[#64748B] mt-0.5">
                {isWidgetDefaultPresetActive
                  ? `Starts ${formatDuration(widgetDefaultPresetMinutes)} instantly without opening menus`
                  : 'Shows customized options menu on widget tap'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleTogglePresetMode(!isWidgetDefaultPresetActive)}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer shrink-0 ${
                isWidgetDefaultPresetActive ? 'bg-[#5D997C] justify-end' : 'bg-[#CBD5E1] justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
            </button>
          </div>

          {/* Active Configured Options List */}
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#94A3B8]">
              Tap to set default (★) or tap ✕ to delete:
            </span>

            <div className="flex flex-wrap gap-2">
              {widgetTimerOptions.map((opt) => {
                const isDefault = isWidgetDefaultPresetActive && opt === widgetDefaultPresetMinutes;
                return (
                  <div
                    key={opt}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black transition-all ${
                      isDefault
                        ? 'bg-[#FEF9E7] border-[#F6C343] text-[#92400E] shadow-xs'
                        : 'bg-[#FAF8F5] border-[#EAE5DE] text-[#1A2436] hover:bg-[#F5F2EB]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSetDefaultPreset(opt)}
                      className="cursor-pointer flex items-center gap-1"
                    >
                      {isDefault && <Star className="w-3.5 h-3.5 fill-[#F6C343] text-[#F6C343]" />}
                      <span>{formatDuration(opt)}</span>
                      {isDefault && <span className="text-[9.5px] font-bold text-[#B45309]">(Default)</span>}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteOption(opt)}
                      disabled={widgetTimerOptions.length <= 1}
                      className="ml-1 p-0.5 text-[#94A3B8] hover:text-red-500 rounded disabled:opacity-30 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Option Row */}
          <div className="pt-3 border-t border-[#F1EFEA] space-y-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-[#94A3B8]">Quick Add:</span>
              {QUICK_ADD_MINUTES.map((m) => {
                const has = widgetTimerOptions.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => !has && handleAddOption(m)}
                    disabled={has}
                    className={`px-2 py-1 rounded-lg text-[10.5px] font-extrabold transition-all ${
                      has
                        ? 'bg-[#F1EFEA] text-[#CBD5E1] cursor-not-allowed'
                        : 'bg-[#EBF4EF] text-[#2D5441] hover:bg-[#D1E6DA] cursor-pointer'
                    }`}
                  >
                    +{m}m
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                min="1"
                max="360"
                value={customMinutesInput}
                onChange={(e) => setCustomMinutesInput(e.target.value)}
                placeholder="Other minutes (e.g. 25)"
                className="flex-1 bg-[#FAF8F5] border border-[#EAE5DE] rounded-xl px-3 py-2 text-xs font-bold text-[#1A2436] placeholder-[#94A3B8] focus:outline-none focus:border-[#5D997C]"
              />
              <button
                type="button"
                onClick={() => {
                  const num = parseInt(customMinutesInput.trim(), 10);
                  handleAddOption(num);
                }}
                className="px-3.5 py-2 bg-[#5D997C] hover:bg-[#51876D] text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Test Action Button */}
          <button
            type="button"
            onClick={handleTestWidgetAction}
            className="w-full py-2.5 mt-2 bg-[#FAF8F5] hover:bg-[#F5F2EB] border border-[#EAE5DE] text-[#2D5441] rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-[#2D5441] text-[#2D5441]" />
            <span>
              Test Widget Action ({isWidgetDefaultPresetActive ? `1-Tap: ${widgetDefaultPresetMinutes}m` : 'Open Menu'})
            </span>
          </button>
        </section>
      </div>

      {/* QUICK SELECT POPUP MODAL (When tapped or tested in menu mode) */}
      {showQuickSelectModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE5DE] text-[#1A2436] rounded-3xl p-5 max-w-xs w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F1EFEA]">
              <div>
                <h3 className="text-sm font-black text-[#1A2436]">BabyBoo Widget</h3>
                <p className="text-[10.5px] text-[#64748B]">Choose screen time for {activeChild.name}:</p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickSelectModal(false)}
                className="p-1 rounded-full text-[#94A3B8] hover:text-[#1A2436] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {widgetTimerOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setShowQuickSelectModal(false);
                    startSession({
                      childId: activeChild.id,
                      durationMinutes: opt,
                      gracePeriodSeconds: activeChild.defaultGraceSeconds || 30,
                      shutdownStyle: 'low_battery',
                    });
                    navigateTo('active_session');
                  }}
                  className="py-3 px-2 rounded-2xl bg-[#FAF8F5] hover:bg-[#EBF4EF] border border-[#EAE5DE] hover:border-[#5D997C] text-center transition-all cursor-pointer group"
                >
                  <Clock className="w-4 h-4 mx-auto text-[#5D997C] mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-black text-[#1A2436] block">
                    {formatDuration(opt)}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowQuickSelectModal(false)}
              className="w-full py-2 bg-[#FAF8F5] text-[#94A3B8] hover:text-[#475569] text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleAutomationScreen;
