import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { MONSTER_PROFILES, SWITCH_OFF_PROFILES } from '../data/researchCitations';

export type RepetitionMode = 'one_time' | 'recurring_weekly';
export type OneTimeTargetOption = 'Today' | 'Tomorrow' | 'Over tomorrow' | 'Custom';

export interface ChildProfileAutomationConfig {
  automationEnabled: boolean;
  repetitionMode: RepetitionMode;
  selectedDays: number[]; // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 0=Sun
  oneTimeOption: OneTimeTargetOption;
  customSelectedDate?: string; // formatted e.g. "Sep 15, 2026"
  triggerHour?: number;
  triggerMinute?: number;
  triggerPeriod?: 'AM' | 'PM';
  endingType?: 'monster' | 'switchoff';
  monsterId?: string;
  switchOffId?: string;
  durationMinutes?: number; // legacy optional
}

export interface ChildProfileAutomationSectionProps {
  childName?: string;
  initialConfig?: Partial<ChildProfileAutomationConfig>;
  onChangeConfig?: (config: ChildProfileAutomationConfig) => void;
}

const WEEKDAYS = [
  { day: 1, label: 'Mon', short: 'M' },
  { day: 2, label: 'Tue', short: 'T' },
  { day: 3, label: 'Wed', short: 'W' },
  { day: 4, label: 'Thu', short: 'T' },
  { day: 5, label: 'Fri', short: 'F' },
  { day: 6, label: 'Sat', short: 'S' },
  { day: 0, label: 'Sun', short: 'S' },
];

const WARNING_TIME_PRESETS = [
  { label: '6:00 PM', hour: 6, minute: 0, period: 'PM' as const },
  { label: '7:00 PM', hour: 7, minute: 0, period: 'PM' as const },
  { label: '7:30 PM', hour: 7, minute: 30, period: 'PM' as const },
  { label: '8:00 PM', hour: 8, minute: 0, period: 'PM' as const },
  { label: '8:30 PM', hour: 8, minute: 30, period: 'PM' as const },
  { label: '9:00 PM', hour: 9, minute: 0, period: 'PM' as const },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const ChildProfileAutomationSection: React.FC<ChildProfileAutomationSectionProps> = ({
  childName = 'Child',
  initialConfig,
  onChangeConfig,
}) => {
  // Master Switch
  const [automationEnabled, setAutomationEnabled] = useState<boolean>(
    initialConfig?.automationEnabled ?? true
  );

  // Repetition State
  const [repetitionMode, setRepetitionMode] = useState<RepetitionMode>(
    initialConfig?.repetitionMode ?? 'one_time'
  );

  // One-Time Target Date State
  const [oneTimeOption, setOneTimeOption] = useState<OneTimeTargetOption>(
    initialConfig?.oneTimeOption ?? 'Today'
  );
  const [customSelectedDate, setCustomSelectedDate] = useState<string>(
    initialConfig?.customSelectedDate ?? 'Sep 12, 2026'
  );
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);

  // Recurring Days State
  const [selectedDays, setSelectedDays] = useState<number[]>(
    initialConfig?.selectedDays ?? [1, 2, 3, 4, 5]
  );

  // Specific Warning Trigger Time State (Shared/Configurable)
  const [triggerHour, setTriggerHour] = useState<number>(initialConfig?.triggerHour ?? 8);
  const [triggerMinute, setTriggerMinute] = useState<number>(initialConfig?.triggerMinute ?? 0);
  const [triggerPeriod, setTriggerPeriod] = useState<'AM' | 'PM'>(initialConfig?.triggerPeriod ?? 'PM');
  const [isCustomWarningTime, setIsCustomWarningTime] = useState<boolean>(false);
  const [customHourText, setCustomHourText] = useState<string>(String(initialConfig?.triggerHour ?? 8));
  const [customMinuteText, setCustomMinuteText] = useState<string>(
    String(initialConfig?.triggerMinute ?? 0).padStart(2, '0')
  );

  // End Screen Style State
  const [endingType, setEndingType] = useState<'monster' | 'switchoff'>(
    initialConfig?.endingType ?? 'monster'
  );
  const [selectedMonsterId, setSelectedMonsterId] = useState<string>(
    initialConfig?.monsterId ?? 'friendly_ghost'
  );
  const [selectedSwitchOffId, setSelectedSwitchOffId] = useState<string>(
    initialConfig?.switchOffId ?? 'low_battery'
  );
  const [showStylePickerModal, setShowStylePickerModal] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'monster' | 'switchoff'>('monster');
  const [isSavedFeedback, setIsSavedFeedback] = useState<boolean>(false);

  // Calendar Navigation State
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState<number>(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(today.getMonth());
  const [calendarDay, setCalendarDay] = useState<number>(today.getDate());

  // Notify parent of state changes
  const notifyChange = (updated: Partial<ChildProfileAutomationConfig>) => {
    if (onChangeConfig) {
      onChangeConfig({
        automationEnabled,
        repetitionMode,
        selectedDays,
        oneTimeOption,
        customSelectedDate,
        triggerHour,
        triggerMinute,
        triggerPeriod,
        endingType,
        monsterId: selectedMonsterId,
        switchOffId: selectedSwitchOffId,
        ...updated,
      });
    }
  };

  // Set / OK Handlers
  const handleApplyCustomTime = () => {
    const parsedH = parseInt(customHourText, 10) || 8;
    const parsedM = parseInt(customMinuteText, 10) || 0;
    const validH = Math.max(1, Math.min(12, parsedH));
    const validM = Math.max(0, Math.min(59, parsedM));
    setTriggerHour(validH);
    setTriggerMinute(validM);
    setIsCustomWarningTime(false);
    notifyChange({ triggerHour: validH, triggerMinute: validM, triggerPeriod });
  };

  const handleSetSchedule = () => {
    setIsSavedFeedback(true);
    notifyChange({
      automationEnabled,
      repetitionMode,
      selectedDays,
      oneTimeOption,
      customSelectedDate,
      triggerHour,
      triggerMinute,
      triggerPeriod,
      endingType,
      monsterId: selectedMonsterId,
      switchOffId: selectedSwitchOffId,
    });
    setTimeout(() => setIsSavedFeedback(false), 2500);
  };

  // Toggle Day Selection for Recurring
  const toggleDay = (day: number) => {
    const nextDays = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    setSelectedDays(nextDays);
    notifyChange({ selectedDays: nextDays });
  };

  // Shortcut Day Presets
  const setDaysPreset = (preset: 'weekdays' | 'weekends' | 'all') => {
    let next: number[] = [];
    if (preset === 'weekdays') next = [1, 2, 3, 4, 5];
    else if (preset === 'weekends') next = [6, 0];
    else if (preset === 'all') next = [1, 2, 3, 4, 5, 6, 0];
    setSelectedDays(next);
    notifyChange({ selectedDays: next });
  };

  // Warning Time Handlers
  const handleSelectTimePreset = (h: number, m: number, p: 'AM' | 'PM') => {
    setIsCustomWarningTime(false);
    setTriggerHour(h);
    setTriggerMinute(m);
    setTriggerPeriod(p);
    setCustomHourText(String(h));
    setCustomMinuteText(String(m).padStart(2, '0'));
    notifyChange({ triggerHour: h, triggerMinute: m, triggerPeriod: p });
  };

  const handleCustomHourChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    setCustomHourText(clean);
    const parsed = parseInt(clean, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) {
      setTriggerHour(parsed);
      notifyChange({ triggerHour: parsed });
    }
  };

  const handleCustomMinuteChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    setCustomMinuteText(clean);
    const parsed = parseInt(clean, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 59) {
      setTriggerMinute(parsed);
      notifyChange({ triggerMinute: parsed });
    }
  };

  const handleTogglePeriod = (p: 'AM' | 'PM') => {
    setTriggerPeriod(p);
    notifyChange({ triggerPeriod: p });
  };

  // Calendar Month Navigation
  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // 0=Mon, 6=Sun
  };

  const daysInCurrentMonth = getDaysInMonth(calendarYear, calendarMonth);
  const firstDayIndex = getFirstDayOfMonth(calendarYear, calendarMonth);

  const handleSelectCalendarDay = (day: number) => {
    setCalendarDay(day);
    const monthStr = MONTH_NAMES[calendarMonth].slice(0, 3);
    const formatted = `${monthStr} ${day}, ${calendarYear}`;
    setCustomSelectedDate(formatted);
    setOneTimeOption('Custom');
    setShowCalendarModal(false);
    notifyChange({ oneTimeOption: 'Custom', customSelectedDate: formatted });
  };

  // Active End Screen Style Data
  const currentMonster = MONSTER_PROFILES.find((m) => m.id === selectedMonsterId) || MONSTER_PROFILES[0];
  const currentSwitchOff = SWITCH_OFF_PROFILES.find((s) => s.id === selectedSwitchOffId) || SWITCH_OFF_PROFILES[0];
  const formattedWarningTime = `${triggerHour}:${String(triggerMinute).padStart(2, '0')} ${triggerPeriod}`;

  // Render the Specific Warning Trigger Time Box (Reusable for both One-Time and Recurring tabs)
  const renderWarningTimeSelector = () => (
    <View style={styles.subSection}>
      <View style={styles.subSectionHeaderRow}>
        <View style={styles.subSectionTitleGroup}>
          <Text style={styles.subSectionTitle}>SPECIFIC WARNING TRIGGER TIME</Text>
        </View>
        <View style={styles.activeTimeBadge}>
          <Text style={styles.activeTimeBadgeText}>
            Warning fires at {formattedWarningTime}
          </Text>
        </View>
      </View>

      {/* Structured Warning Time Preset Grid */}
      <View style={styles.presetsGrid}>
        {WARNING_TIME_PRESETS.map((preset) => {
          const isSelected =
            !isCustomWarningTime &&
            triggerHour === preset.hour &&
            triggerMinute === preset.minute &&
            triggerPeriod === preset.period;

          return (
            <TouchableOpacity
              key={preset.label}
              activeOpacity={0.8}
              onPress={() => handleSelectTimePreset(preset.hour, preset.minute, preset.period)}
              style={[
                styles.presetButton,
                isSelected && styles.presetButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.presetButtonText,
                  isSelected && styles.presetButtonTextSelected,
                ]}
              >
                {preset.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Custom Time Button - Clean Full Row Width */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsCustomWarningTime(!isCustomWarningTime)}
          style={[
            styles.customPresetButtonFull,
            isCustomWarningTime && styles.presetButtonSelected,
          ]}
        >
          <Text
            style={[
              styles.presetButtonText,
              isCustomWarningTime && styles.presetButtonTextSelected,
              { color: isCustomWarningTime ? '#FFFFFF' : '#C7D2FE' },
            ]}
          >
            {isCustomWarningTime ? 'Custom Time Active' : 'Set Exact Custom Time'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Custom Time Input Form */}
      {isCustomWarningTime && (
        <View style={styles.keyboardTimeBox}>
          <View style={styles.keyboardTimeHeader}>
            <Text style={styles.keyboardTimeTitle}>Set Exact Warning Time</Text>
            <Text style={styles.keyboardTimeSub}>Screen turns off automatically at this time:</Text>
          </View>

          <View style={styles.hoursMinutesRow}>
            {/* Hour Box */}
            <View style={styles.timeInputColumn}>
              <Text style={styles.timeInputLabel}>Hour (1–12)</Text>
              <TextInput
                style={styles.timeTextInput}
                keyboardType="number-pad"
                value={customHourText}
                onChangeText={handleCustomHourChange}
                placeholder="8"
                placeholderTextColor="#64748B"
                maxLength={2}
              />
            </View>

            <Text style={styles.colonSeparator}>:</Text>

            {/* Minute Box */}
            <View style={styles.timeInputColumn}>
              <Text style={styles.timeInputLabel}>Minute (00–59)</Text>
              <TextInput
                style={styles.timeTextInput}
                keyboardType="number-pad"
                value={customMinuteText}
                onChangeText={handleCustomMinuteChange}
                placeholder="00"
                placeholderTextColor="#64748B"
                maxLength={2}
              />
            </View>

            {/* AM/PM Switcher */}
            <View style={styles.periodSwitcherColumn}>
              <Text style={styles.timeInputLabel}>Period</Text>
              <View style={styles.periodPillRow}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleTogglePeriod('AM')}
                  style={[
                    styles.periodPill,
                    triggerPeriod === 'AM' && styles.periodPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.periodPillText,
                      triggerPeriod === 'AM' && styles.periodPillTextActive,
                    ]}
                  >
                    AM
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleTogglePeriod('PM')}
                  style={[
                    styles.periodPill,
                    triggerPeriod === 'PM' && styles.periodPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.periodPillText,
                      triggerPeriod === 'PM' && styles.periodPillTextActive,
                    ]}
                  >
                    PM
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Action Row: Set / OK Button for Custom Time */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleApplyCustomTime}
            style={styles.setTimeOkBtn}
          >
            <Text style={styles.setTimeOkBtnText}>Set Time (OK)</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Render the End Screen Style Card (Reusable for both One-Time and Recurring tabs)
  const renderEndScreenStyleCard = () => (
    <View style={styles.subSection}>
      <View style={styles.subSectionHeaderRow}>
        <View style={styles.subSectionTitleGroup}>
          <Text style={styles.subSectionTitle}>END SCREEN STYLE FOR WARNING</Text>
        </View>
        <View style={styles.endingBadge}>
          <Text style={styles.endingBadgeText}>
            {endingType === 'monster' ? '👾 Monster Mode' : '🔋 Switch-Off Style'}
          </Text>
        </View>
      </View>

      {/* Grand Interactive End Screen Style Card */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          setModalTab(endingType);
          setShowStylePickerModal(true);
        }}
        style={styles.endStyleCard}
      >
        <View style={styles.endStyleCardInner}>
          <View style={[styles.endStyleIconBox, { backgroundColor: endingType === 'monster' ? 'rgba(129, 140, 248, 0.2)' : 'rgba(245, 158, 11, 0.2)' }]}>
            <Text style={{ fontSize: 24 }}>
              {endingType === 'monster' ? currentMonster.emoji : currentSwitchOff.icon}
            </Text>
          </View>

          <View style={styles.endStyleTextGroup}>
            <View style={styles.endStyleTitleRow}>
              <Text style={styles.endStyleTitle} numberOfLines={1}>
                {endingType === 'monster' ? currentMonster.name : currentSwitchOff.title}
              </Text>
              <View style={styles.endStyleSubBadge}>
                <Text style={styles.endStyleSubBadgeText} numberOfLines={1}>
                  {endingType === 'monster' ? currentMonster.badge : currentSwitchOff.badge}
                </Text>
              </View>
            </View>
            <Text style={styles.endStyleDescription} numberOfLines={2}>
              {endingType === 'monster' ? `"${currentMonster.dialogue}"` : currentSwitchOff.description}
            </Text>
          </View>

          <View style={styles.changeBtn}>
            <Text style={styles.changeBtnText}>Change</Text>
            <Text style={styles.changeBtnArrow}>→</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.outerContainer}>
      {/* ========================================================================= */}
      {/* 1. MASTER TOGGLE HEADER */}
      {/* ========================================================================= */}
      <View style={styles.headerCard}>
        <View style={styles.headerLeftRow}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Enable Schedule Automation</Text>
            <Text style={styles.headerSubtitle}>
              {automationEnabled
                ? `Automated screen routines active for ${childName}`
                : 'Automated scheduling paused (manual timers only)'}
            </Text>
          </View>
        </View>

        <Switch
          value={automationEnabled}
          onValueChange={(val) => {
            setAutomationEnabled(val);
            notifyChange({ automationEnabled: val });
          }}
          trackColor={{ false: '#334155', true: '#4F46E5' }}
          thumbColor={automationEnabled ? '#818CF8' : '#94A3B8'}
        />
      </View>

      {/* ========================================================================= */}
      {/* EXPANDABLE SCHEDULE PANEL (ONE-TIME & RECURRING TABS) */}
      {/* ========================================================================= */}
      {automationEnabled && (
        <View style={styles.expandedContentCard}>
          {/* Repetition Selection Row (Tabs) */}
          <View style={styles.subSection}>
            <Text style={styles.subSectionTitle}>SELECT AUTOMATION SCHEDULE</Text>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  setRepetitionMode('one_time');
                  notifyChange({ repetitionMode: 'one_time' });
                }}
                style={[
                  styles.segmentButton,
                  repetitionMode === 'one_time' && styles.segmentButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    repetitionMode === 'one_time' && styles.segmentButtonTextActive,
                  ]}
                  numberOfLines={1}
                >
                  One-Time Warning
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  setRepetitionMode('recurring_weekly');
                  notifyChange({ repetitionMode: 'recurring_weekly' });
                }}
                style={[
                  styles.segmentButton,
                  repetitionMode === 'recurring_weekly' && styles.segmentButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    repetitionMode === 'recurring_weekly' && styles.segmentButtonTextActive,
                  ]}
                  numberOfLines={1}
                >
                  Recurring Routine
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ========================================================================= */}
          {/* TAB A: ONE-TIME WARNING (ONLY End Screen Style + Warning Time, NO Time Limit) */}
          {/* ========================================================================= */}
          {repetitionMode === 'one_time' && (
            <View style={{ gap: 14, width: '100%' }}>
              {/* Target Date for One-Time */}
              <View style={styles.subSection}>
                <View style={styles.subSectionHeaderRow}>
                  <View style={styles.subSectionTitleGroup}>
                    <Text style={styles.subSectionTitle}>TARGET DATE FOR ONE-TIME SESSION</Text>
                  </View>
                  {oneTimeOption === 'Custom' && (
                    <View style={styles.selectedCalendarDateBadge}>
                      <Text style={styles.selectedCalendarDateText}>{customSelectedDate}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.oneTimeGrid}>
                  {(['Today', 'Tomorrow', 'Over tomorrow', 'Custom'] as OneTimeTargetOption[]).map((opt) => {
                    const isSelected = oneTimeOption === opt;
                    return (
                      <TouchableOpacity
                        key={opt}
                        activeOpacity={0.85}
                        onPress={() => {
                          if (opt === 'Custom') {
                            setShowCalendarModal(true);
                          } else {
                            setOneTimeOption(opt);
                            notifyChange({ oneTimeOption: opt });
                          }
                        }}
                        style={[
                          styles.oneTimePill,
                          isSelected && styles.oneTimePillSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.oneTimePillText,
                            isSelected && styles.oneTimePillTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {opt === 'Custom' ? (isSelected ? `📅 ${customSelectedDate}` : '📅 Custom') : opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Specific Warning Trigger Time */}
              {renderWarningTimeSelector()}

              {/* End Screen Style Picker */}
              {renderEndScreenStyleCard()}

              {/* Informative Guidance Banner */}
              <View style={styles.infoBanner}>
                <Text style={styles.infoBannerText}>
                  Screen will automatically display the <Text style={{ fontWeight: '900', color: '#FCD34D' }}>{endingType === 'monster' ? currentMonster.name : currentSwitchOff.title}</Text> warning at <Text style={{ fontWeight: '900', color: '#FFFFFF' }}>{formattedWarningTime}</Text> on {oneTimeOption === 'Custom' ? customSelectedDate : oneTimeOption.toLowerCase()}. No manual timer start required.
                </Text>
              </View>
            </View>
          )}

          {/* ========================================================================= */}
          {/* TAB B: RECURRING ROUTINE (ONLY End Screen Style + Warning Time, NO Time Limit) */}
          {/* ========================================================================= */}
          {repetitionMode === 'recurring_weekly' && (
            <View style={{ gap: 14, width: '100%' }}>
              {/* Active Days of the Week */}
              <View style={styles.subSection}>
                <View style={styles.subSectionHeaderRow}>
                  <View style={styles.subSectionTitleGroup}>
                    <Text style={styles.subSectionTitle}>ACTIVE DAYS OF THE WEEK</Text>
                  </View>
                  <View style={styles.quickPresetsRow}>
                    <TouchableOpacity
                      onPress={() => setDaysPreset('weekdays')}
                      style={styles.quickPresetChip}
                    >
                      <Text style={styles.quickPresetChipText}>Mon-Fri</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setDaysPreset('weekends')}
                      style={styles.quickPresetChip}
                    >
                      <Text style={styles.quickPresetChipText}>Sat-Sun</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setDaysPreset('all')}
                      style={styles.quickPresetChip}
                    >
                      <Text style={styles.quickPresetChipText}>All</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Weekday Grid */}
                <View style={styles.weekdayGrid}>
                  {WEEKDAYS.map((wd) => {
                    const isSelected = selectedDays.includes(wd.day);
                    return (
                      <TouchableOpacity
                        key={wd.day}
                        activeOpacity={0.8}
                        onPress={() => toggleDay(wd.day)}
                        style={[
                          styles.dayPill,
                          isSelected && styles.dayPillSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayPillShort,
                            isSelected && styles.dayPillShortSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {wd.short}
                        </Text>
                        <Text
                          style={[
                            styles.dayPillLabel,
                            isSelected && styles.dayPillLabelSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {wd.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Summary Indicator */}
                <View style={styles.daySummaryBadge}>
                  <Text style={styles.daySummaryText}>
                    {selectedDays.length === 7
                      ? 'Active every single day'
                      : selectedDays.length === 5 && !selectedDays.includes(0) && !selectedDays.includes(6)
                        ? 'Active on school weekdays (Mon–Fri)'
                        : selectedDays.length === 2 && selectedDays.includes(0) && selectedDays.includes(6)
                          ? 'Active on weekends only (Sat–Sun)'
                          : selectedDays.length > 0
                            ? `Active on ${selectedDays.length} selected days per week`
                            : 'Please select at least one day'}
                  </Text>
                </View>
              </View>

              {/* Specific Warning Trigger Time */}
              {renderWarningTimeSelector()}

              {/* End Screen Style Picker */}
              {renderEndScreenStyleCard()}

              {/* Informative Guidance Banner */}
              <View style={styles.infoBanner}>
                <Text style={styles.infoBannerText}>
                  Screen will automatically display the <Text style={{ fontWeight: '900', color: '#FCD34D' }}>{endingType === 'monster' ? currentMonster.name : currentSwitchOff.title}</Text> warning daily at <Text style={{ fontWeight: '900', color: '#FFFFFF' }}>{formattedWarningTime}</Text> on scheduled days. No manual timer start required.
                </Text>
              </View>
            </View>
          )}

          {/* Master Set/OK Button for the entire Schedule Automation Box */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSetSchedule}
            style={[
              styles.masterSetScheduleBtn,
              isSavedFeedback && styles.masterSetScheduleBtnSaved,
            ]}
          >
            <Text style={styles.masterSetScheduleBtnText}>
              {isSavedFeedback
                ? '✓ Set Schedule'
                : 'Set Schedule'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ========================================================================= */}
      {/* 4. END SCREEN STYLE PICKER MODAL */}
      {/* ========================================================================= */}
      <Modal visible={showStylePickerModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.stylePickerDialog}>
            {/* Header */}
            <View style={styles.pickerHeaderRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.pickerTitle}>Select End Screen Warning</Text>
                <Text style={styles.pickerSubtitle}>
                  Choose what {childName} experiences when warning time arrives:
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowStylePickerModal(false)}
                style={styles.pickerCloseBtn}
              >
                <Text style={styles.pickerCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Sub-Tabs: Monster Mode vs Switch-Off */}
            <View style={styles.modalTabsRow}>
              <TouchableOpacity
                onPress={() => setModalTab('monster')}
                style={[
                  styles.modalTabBtn,
                  modalTab === 'monster' && styles.modalTabBtnActive,
                ]}
              >
                <Text style={styles.modalTabBtnText}>👾 Monster Mode ({MONSTER_PROFILES.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalTab('switchoff')}
                style={[
                  styles.modalTabBtn,
                  modalTab === 'switchoff' && styles.modalTabBtnActive,
                ]}
              >
                <Text style={styles.modalTabBtnText}>🔋 Switch-Off ({SWITCH_OFF_PROFILES.length})</Text>
              </TouchableOpacity>
            </View>

            {/* List of Styles */}
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {modalTab === 'monster' ? (
                <View style={{ gap: 8 }}>
                  {MONSTER_PROFILES.map((m) => {
                    const isSelected = endingType === 'monster' && selectedMonsterId === m.id;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        activeOpacity={0.85}
                        onPress={() => {
                          setEndingType('monster');
                          setSelectedMonsterId(m.id);
                          notifyChange({ endingType: 'monster', monsterId: m.id });
                          setShowStylePickerModal(false);
                        }}
                        style={[
                          styles.styleOptionCard,
                          isSelected && styles.styleOptionCardSelected,
                        ]}
                      >
                        <View style={styles.styleOptionEmojiBox}>
                          <Text style={{ fontSize: 26 }}>{m.emoji}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={styles.styleOptionTitle}>{m.name}</Text>
                            <View style={styles.styleOptionBadge}>
                              <Text style={styles.styleOptionBadgeText}>{m.badge}</Text>
                            </View>
                          </View>
                          <Text style={styles.styleOptionDesc} numberOfLines={2}>
                            {m.description}
                          </Text>
                          <Text style={styles.styleOptionDialogue} numberOfLines={1}>
                            "{m.dialogue}"
                          </Text>
                        </View>
                        {isSelected && (
                          <View style={styles.checkCircle}>
                            <Text style={styles.checkCircleText}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {SWITCH_OFF_PROFILES.map((s) => {
                    const isSelected = endingType === 'switchoff' && selectedSwitchOffId === s.id;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        activeOpacity={0.85}
                        onPress={() => {
                          setEndingType('switchoff');
                          setSelectedSwitchOffId(s.id);
                          notifyChange({ endingType: 'switchoff', switchOffId: s.id });
                          setShowStylePickerModal(false);
                        }}
                        style={[
                          styles.styleOptionCard,
                          isSelected && styles.styleOptionCardSelected,
                        ]}
                      >
                        <View style={styles.styleOptionEmojiBox}>
                          <Text style={{ fontSize: 26 }}>{s.icon}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={styles.styleOptionTitle}>{s.title}</Text>
                            <View style={styles.styleOptionBadge}>
                              <Text style={styles.styleOptionBadgeText}>{s.badge}</Text>
                            </View>
                          </View>
                          <Text style={styles.styleOptionDesc} numberOfLines={2}>
                            {s.description}
                          </Text>
                        </View>
                        {isSelected && (
                          <View style={styles.checkCircle}>
                            <Text style={styles.checkCircleText}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {/* OK / Set Style Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowStylePickerModal(false)}
              style={styles.modalConfirmBtn}
            >
              <Text style={styles.modalConfirmBtnText}>Set End Screen Style (OK)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* 5. MINI CALENDAR MODAL (Opens on "Custom" Date Click) */}
      {/* ========================================================================= */}
      <Modal visible={showCalendarModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.calendarDialog}>
            {/* Calendar Header with Month Navigation */}
            <View style={styles.calendarNavRow}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.calendarArrowBtn}>
                <Text style={styles.calendarArrowText}>‹</Text>
              </TouchableOpacity>

              <Text style={styles.calendarMonthTitle}>
                {MONTH_NAMES[calendarMonth]} {calendarYear}
              </Text>

              <TouchableOpacity onPress={handleNextMonth} style={styles.calendarArrowBtn}>
                <Text style={styles.calendarArrowText}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Weekday Column Headers */}
            <View style={styles.calendarWeekHeader}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((ch, idx) => (
                <Text key={idx} style={styles.calendarWeekDayLabel}>
                  {ch}
                </Text>
              ))}
            </View>

            {/* Calendar Days Matrix */}
            <View style={styles.calendarDaysGrid}>
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.calendarDayCellEmpty} />
              ))}

              {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected =
                  calendarDay === dayNum &&
                  calendarMonth === new Date().getMonth() &&
                  calendarYear === new Date().getFullYear();

                return (
                  <TouchableOpacity
                    key={`day-${dayNum}`}
                    activeOpacity={0.8}
                    onPress={() => handleSelectCalendarDay(dayNum)}
                    style={[
                      styles.calendarDayCell,
                      isSelected && styles.calendarDayCellSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayCellText,
                        isSelected && styles.calendarDayCellTextSelected,
                      ]}
                    >
                      {dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Set / OK Button */}
            <TouchableOpacity
              onPress={() => setShowCalendarModal(false)}
              style={styles.calendarCloseBtn}
            >
              <Text style={styles.calendarCloseBtnText}>Set Date (OK)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    marginVertical: 6,
  },
  // 1. Header Card
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#EAE5DE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1A2436',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    width: '100%',
    overflow: 'hidden',
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  headerIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#EBF4EF',
    borderWidth: 1,
    borderColor: '#CBE1D5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#1A2436',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#718096',
    marginTop: 2,
    fontWeight: '600',
  },
  // Expandable Body Card (Contained Box)
  expandedContentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#EAE5DE',
    marginTop: 10,
    gap: 14,
    shadowColor: '#1A2436',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    width: '100%',
    overflow: 'hidden',
  },
  subSection: {
    gap: 8,
    width: '100%',
  },
  subSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    width: '100%',
  },
  subSectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  subSectionTitle: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#718096',
    letterSpacing: 0.5,
  },
  activeTimeBadge: {
    backgroundColor: '#EBF4EF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBE1D5',
    flexShrink: 0,
  },
  activeTimeBadgeText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#3E6B56',
  },
  endingBadge: {
    backgroundColor: '#F4EFFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2D5FA',
    flexShrink: 0,
  },
  endingBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#6B47B8',
  },
  // Segmented Control Tabs
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: '#EAE5DE',
    width: '100%',
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 11,
  },
  segmentButtonActive: {
    backgroundColor: '#5D997C',
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentIcon: {
    fontSize: 13,
  },
  segmentButtonText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#718096',
    textAlign: 'center',
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  // One-Time Target Date Grid
  oneTimeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    width: '100%',
  },
  oneTimePill: {
    width: '48.8%',
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EAE5DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oneTimePillSelected: {
    backgroundColor: '#FFF8DE',
    borderColor: '#F6D878',
    shadowColor: '#C4971A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  oneTimePillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#718096',
    textAlign: 'center',
  },
  oneTimePillTextSelected: {
    color: '#7C5209',
    fontWeight: '900',
  },
  selectedCalendarDateBadge: {
    backgroundColor: '#FFF8DE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F6D878',
    flexShrink: 0,
  },
  selectedCalendarDateText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#7C5209',
  },
  // Weekday Grid
  quickPresetsRow: {
    flexDirection: 'row',
    gap: 4,
    flexShrink: 0,
  },
  quickPresetChip: {
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EAE5DE',
  },
  quickPresetChipText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#5D997C',
  },
  weekdayGrid: {
    flexDirection: 'row',
    gap: 3,
    width: '100%',
    justifyContent: 'space-between',
  },
  dayPill: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 6,
    paddingHorizontal: 1,
    borderRadius: 10,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EAE5DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillSelected: {
    backgroundColor: '#EBF4EF',
    borderColor: '#5D997C',
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  dayPillShort: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#8C9AA8',
    marginBottom: 1,
  },
  dayPillShortSelected: {
    color: '#3E6B56',
  },
  dayPillLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1A2436',
  },
  dayPillLabelSelected: {
    color: '#284C3C',
    fontWeight: '900',
  },
  daySummaryBadge: {
    backgroundColor: '#EBF4EF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBE1D5',
    alignItems: 'center',
    marginTop: 2,
    width: '100%',
  },
  daySummaryText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#3E6B56',
    textAlign: 'center',
  },
  // Warning Time Presets
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    width: '100%',
  },
  presetButton: {
    width: '31.8%',
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EAE5DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customPresetButtonFull: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EAE5DE',
    marginTop: 2,
  },
  presetButtonSelected: {
    backgroundColor: '#5D997C',
    borderColor: '#4A7F66',
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  presetButtonText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#718096',
  },
  presetButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  keyboardTimeBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EAE5DE',
    marginTop: 4,
    width: '100%',
    overflow: 'hidden',
  },
  keyboardTimeHeader: {
    marginBottom: 8,
  },
  keyboardTimeTitle: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#1A2436',
  },
  keyboardTimeSub: {
    fontSize: 10,
    color: '#718096',
    marginTop: 1,
  },
  hoursMinutesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
  },
  timeInputColumn: {
    flex: 1,
    alignItems: 'center',
  },
  periodSwitcherColumn: {
    flex: 1.25,
    alignItems: 'center',
  },
  timeInputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#718096',
    marginBottom: 4,
    textAlign: 'center',
  },
  timeTextInput: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#5D997C',
    borderRadius: 12,
    color: '#1A2436',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    paddingVertical: 7,
  },
  colonSeparator: {
    fontSize: 20,
    fontWeight: '900',
    color: '#718096',
    marginTop: 14,
  },
  periodPillRow: {
    flexDirection: 'row',
    gap: 4,
    width: '100%',
  },
  periodPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE5DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodPillActive: {
    backgroundColor: '#5D997C',
    borderColor: '#4A7F66',
  },
  periodPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#718096',
  },
  periodPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  // End Screen Style Card
  endStyleCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#EAE5DE',
    padding: 12,
    width: '100%',
    overflow: 'hidden',
  },
  endStyleCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  endStyleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE5DE',
    flexShrink: 0,
  },
  endStyleTextGroup: {
    flex: 1,
    flexShrink: 1,
    overflow: 'hidden',
  },
  endStyleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 2,
  },
  endStyleTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1A2436',
    flexShrink: 1,
  },
  endStyleSubBadge: {
    backgroundColor: '#F4EFFE',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    flexShrink: 0,
  },
  endStyleSubBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6B47B8',
  },
  endStyleDescription: {
    fontSize: 10.5,
    color: '#718096',
    lineHeight: 14,
  },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EAE5DE',
    flexShrink: 0,
  },
  changeBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#5D997C',
  },
  changeBtnArrow: {
    fontSize: 11,
    color: '#5D997C',
    fontWeight: '900',
  },
  // Informative Banner
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#EBF4EF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#CBE1D5',
    gap: 8,
    alignItems: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  infoBannerIcon: {
    fontSize: 16,
    flexShrink: 0,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 10.5,
    color: '#3E6B56',
    lineHeight: 15,
  },
  // End Screen Style Picker Modal
  stylePickerDialog: {
    width: '92%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#EAE5DE',
    shadowColor: '#1A2436',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  pickerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1A2436',
  },
  pickerSubtitle: {
    fontSize: 11,
    color: '#718096',
    marginTop: 2,
  },
  pickerCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EAE5DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerCloseBtnText: {
    color: '#718096',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#EAE5DE',
    width: '100%',
  },
  modalTabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  modalTabBtnActive: {
    backgroundColor: '#5D997C',
  },
  modalTabBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1A2436',
    textAlign: 'center',
  },
  styleOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EAE5DE',
    gap: 10,
    width: '100%',
  },
  styleOptionCardSelected: {
    borderColor: '#5D997C',
    backgroundColor: '#EBF4EF',
  },
  styleOptionEmojiBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE5DE',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  styleOptionTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#1A2436',
    flexShrink: 1,
  },
  styleOptionBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE5DE',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    flexShrink: 0,
  },
  styleOptionBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#5D997C',
  },
  styleOptionDesc: {
    fontSize: 10,
    color: '#718096',
    marginTop: 2,
    lineHeight: 13,
  },
  styleOptionDialogue: {
    fontSize: 9.5,
    color: '#B7791F',
    fontStyle: 'italic',
    marginTop: 1,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#5D997C',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkCircleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  // Calendar Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 36, 54, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  calendarDialog: {
    width: '90%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#EAE5DE',
    shadowColor: '#1A2436',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  calendarNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calendarArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EAE5DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarArrowText: {
    fontSize: 20,
    color: '#1A2436',
    lineHeight: 22,
    fontWeight: 'bold',
  },
  calendarMonthTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1A2436',
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  calendarWeekDayLabel: {
    width: 34,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: '#718096',
  },
  calendarDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'flex-start',
  },
  calendarDayCellEmpty: {
    width: 34,
    height: 34,
  },
  calendarDayCell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EAE5DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayCellSelected: {
    backgroundColor: '#5D997C',
    borderColor: '#4A7F66',
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarDayCellText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A2436',
  },
  calendarDayCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  calendarCloseBtn: {
    marginTop: 14,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EAE5DE',
    paddingVertical: 9,
    borderRadius: 14,
    alignItems: 'center',
  },
  calendarCloseBtnText: {
    color: '#718096',
    fontSize: 11.5,
    fontWeight: '800',
  },
  setTimeOkBtn: {
    marginTop: 10,
    backgroundColor: '#5D997C',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
  },
  setTimeOkBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  masterSetScheduleBtn: {
    backgroundColor: '#5D997C',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    width: '100%',
    marginTop: 4,
  },
  masterSetScheduleBtnSaved: {
    backgroundColor: '#3E6B56',
    shadowColor: '#3E6B56',
  },
  masterSetScheduleBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  modalConfirmBtn: {
    marginTop: 12,
    backgroundColor: '#5D997C',
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  modalConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
