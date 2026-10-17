import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Vibration,
  Dimensions,
  Alert,
  Platform,
  Switch,
  Linking,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Path,
  Circle,
  Rect,
  G,
  Defs,
  LinearGradient,
  Stop,
  Polyline,
  Line,
} from 'react-native-svg';
import { BuddyMascotNative } from '../src/native/BuddyMascotNative';
import { PatternLockNative } from '../src/native/PatternLockNative';
import { OnboardingAssessmentNative, OnboardingChildData } from '../src/native/OnboardingAssessmentNative';
import { ParentAnalyticsNative } from '../src/native/ParentAnalyticsNative';
import { AnalyticsFeaturesHubNative } from '../src/native/AnalyticsFeaturesHubNative';
import { ParentControlsSecurityNative } from '../src/native/ParentControlsSecurityNative';
import { SettingsDrawerHubNative } from '../src/native/SettingsDrawerHubNative';
import { MONSTER_PROFILES, SWITCH_OFF_PROFILES } from '../src/data/researchCitations';
import { HandoverNativeEngine } from '../modules/handover-native';
import { ShutdownSimulationNative } from '../src/components/Simulation/ShutdownSimulationNative';

const { width } = Dimensions.get('window');

type ScreenType =
  | 'splash'
  | 'onboarding_assessment'
  | 'auth'
  | 'add_child'
  | 'set_pattern'
  | 'parent_dashboard'
  | 'schedule_automation'
  | 'session_setup'
  | 'active_session'
  | 'time_up_warning'
  | 'shutdown_illusion'
  | 'post_session_summary'
  | 'weekly_stats'
  | 'settings';

type ShutdownStyle = 'low_battery' | 'cooldown' | 'needs_rest';

interface Child {
  id: string;
  name: string;
  age: string;
  avatarInitial: string;
  avatarColor: string;
  dailyMinutes: number;
  graceSeconds: number;
  preferredStyle: ShutdownStyle;
  streak: number;
  totalSessions: number;
  voluntaryStops: number;
}

const ONBOARDING_COMPLETED_KEY = 'babyboo_onboarding_completed';
const CHILDREN_STORAGE_KEY = 'babyboo_children_profiles';
const ACTIVE_CHILD_ID_KEY = 'babyboo_active_child_id';
const WIDGET_OPTIONS_KEY = 'babyboo_widget_timer_options';
const WIDGET_DEFAULT_PRESET_ENABLED_KEY = 'babyboo_widget_default_preset_enabled';
const WIDGET_DEFAULT_PRESET_MINUTES_KEY = 'babyboo_widget_default_preset_minutes';
const WIDGET_INCLUDE_CUSTOM_KEY = 'babyboo_widget_include_custom';
const WIDGET_INCLUDE_LOCK_KEY = 'babyboo_widget_include_lock';

const memoryStorage: Record<string, string> = {};

const getStoredItem = (key: string): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch { }
  return memoryStorage[key] ?? null;
};

const setStoredItem = (key: string, val: string): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, val);
    }
  } catch { }
  memoryStorage[key] = val;
};

const DEMO_CHILDREN: Child[] = [
  {
    id: 'child_1',
    name: 'Leo',
    age: '2 – 5',
    avatarInitial: 'L',
    avatarColor: '#7C6DF8',
    dailyMinutes: 20,
    graceSeconds: 60,
    preferredStyle: 'low_battery',
    streak: 5,
    totalSessions: 18,
    voluntaryStops: 15,
  },
  {
    id: 'child_2',
    name: 'Maya',
    age: '6–7',
    avatarInitial: 'M',
    avatarColor: '#F59E0B',
    dailyMinutes: 30,
    graceSeconds: 60,
    preferredStyle: 'needs_rest',
    streak: 9,
    totalSessions: 24,
    voluntaryStops: 22,
  },
];

const DEFAULT_FALLBACK_CHILD: Child = {
  id: 'child_default',
  name: 'My Child',
  age: '4–5',
  avatarInitial: 'C',
  avatarColor: '#7C6DF8',
  dailyMinutes: 20,
  graceSeconds: 60,
  preferredStyle: 'low_battery',
  streak: 1,
  totalSessions: 0,
  voluntaryStops: 0,
};

export default function App() {
  const insets = useSafeAreaInsets();
  const localParams = useLocalSearchParams<{ minutes?: string; widgetTrigger?: string; action?: string }>();
  const bottomNavOffset = (insets.bottom || 0) + 10;
  // Precise bottom padding: exactly clears the floating dock (64px + 2px protrusion) with a clean 8px gap
  const contentBottomPadding = bottomNavOffset + 74;

  // Default to parent_dashboard so Expo Go immediately opens the complete dashboard
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('parent_dashboard');
  const [splashSlide, setSplashSlide] = useState(0);
  const [nativeStatus, setNativeStatus] = useState<string>('Connecting to native engine...');

  useEffect(() => {
    HandoverNativeEngine.helloWorld()
      .then((msg) => setNativeStatus(msg))
      .catch((err) => setNativeStatus(`Native module: ${err?.message || 'Ready'}`));
  }, []);

  // Profiles (loaded from storage, or seeded with rich demo profiles Leo & Maya)
  const [children, setChildren] = useState<Child[]>(() => {
    const raw = getStoredItem(CHILDREN_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch { }
    }
    return DEMO_CHILDREN;
  });
  const [activeChildId, setActiveChildId] = useState(() => {
    const savedId = getStoredItem(ACTIVE_CHILD_ID_KEY);
    return savedId || DEMO_CHILDREN[0].id;
  });

  // Pattern Lock - Default: Capital "A" pattern
  const [patternLock, setPatternLock] = useState<number[]>([6, 3, 1, 5, 8]);
  const [patternError, setPatternError] = useState(false);
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [patternSuccessCallback, setPatternSuccessCallback] = useState<(() => void) | null>(null);

  // New child form with wide range of age brackets
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildAge, setNewChildAge] = useState<string>('4–5');
  const [newChildColor, setNewChildColor] = useState('#7C6DF8');

  const AGE_BRACKETS_CONFIG = [
    { id: '< 2', label: 'Infant', range: '< 2 yrs', defaultMinutes: 10 },
    { id: '2–3', label: 'Toddler', range: '2–3 yrs', defaultMinutes: 15 },
    { id: '4–5', label: 'Preschool', range: '4–5 yrs', defaultMinutes: 20 },
    { id: '6–7', label: 'Elementary', range: '6–7 yrs', defaultMinutes: 30 },
    { id: '8–10', label: 'Middle Kid', range: '8–10 yrs', defaultMinutes: 45 },
    { id: '11–13', label: 'Early Teen', range: '11–13 yrs', defaultMinutes: 45 },
    { id: '14+', label: 'High School', range: '14+ yrs', defaultMinutes: 60 },
  ];

  const isAgeBracketSelected = (childAge: string | undefined, bracketId: string) => {
    if (!childAge) return false;
    if (childAge === bracketId) return true;
    const c = childAge.replace(/[–—_]/g, '-').trim();
    const b = bracketId.replace(/[–—_]/g, '-').trim();
    if (c === b) return true;
    if ((bracketId === '< 2' || bracketId === 'under_2') && (c === '< 2' || c === '<2' || c === 'under-2' || c === 'under_2')) return true;
    if (bracketId === '6–7' && (c === '6-8' || c === '6-7' || c === '6-10')) return true;
    if (bracketId === '8–10' && (c === '9-12' || c === '8-10')) return true;
    if (bracketId === '14+' && (c === '13+' || c === '14+' || c === '14-plus' || c === '14_plus')) return true;
    if (bracketId === '2–3' && (c === '2-3' || c === '2-5')) return true;
    if (bracketId === '4–5' && c === '4-5') return true;
    return false;
  };

  const handleSaveNewChild = () => {
    if (!newChildName.trim()) return;
    const initial = newChildName.trim().charAt(0).toUpperCase();
    const bracket = AGE_BRACKETS_CONFIG.find((b) => isAgeBracketSelected(newChildAge, b.id)) || AGE_BRACKETS_CONFIG[2];
    const newChild: Child = {
      id: `child_${Date.now()}`,
      name: newChildName.trim(),
      age: newChildAge,
      avatarInitial: initial,
      avatarColor: newChildColor,
      dailyMinutes: bracket.defaultMinutes,
      graceSeconds: 60,
      preferredStyle: 'low_battery',
      streak: 1,
      totalSessions: 0,
      voluntaryStops: 0,
    };
    setChildren((prev) => [...prev, newChild]);
    setActiveChildId(newChild.id);
    setDurationMinutes(newChild.dailyMinutes);
    setGraceSeconds(newChild.graceSeconds);
    setSelectedStyle(newChild.preferredStyle);
    setNewChildName('');
    setShowAddChildModal(false);
  };

  // Edit child form
  const [showEditChildModal, setShowEditChildModal] = useState(false);
  const [editChildId, setEditChildId] = useState('');
  const [editChildName, setEditChildName] = useState('');
  const [editChildAge, setEditChildAge] = useState('4–5');
  const [editChildColor, setEditChildColor] = useState('#7C6DF8');

  const handleSaveEditChild = () => {
    if (!editChildName.trim() || !editChildId) return;
    const initial = editChildName.trim().charAt(0).toUpperCase();
    const bracket = AGE_BRACKETS_CONFIG.find((b) => isAgeBracketSelected(editChildAge, b.id)) || AGE_BRACKETS_CONFIG[2];
    setChildren((prev) =>
      prev.map((c) =>
        c.id === editChildId
          ? {
            ...c,
            name: editChildName.trim(),
            age: editChildAge,
            avatarInitial: initial,
            avatarColor: editChildColor,
            dailyMinutes: bracket.defaultMinutes,
          }
          : c
      )
    );
    if (activeChildId === editChildId) {
      setDurationMinutes(bracket.defaultMinutes);
    }
    setShowEditChildModal(false);
  };

  const handleDeleteChild = (idToDelete: string) => {
    if (children.length <= 1) {
      Alert.alert(
        'Cannot Delete',
        'You need to keep at least one child profile in BabyBoo.',
        [{ text: 'OK' }]
      );
      return;
    }
    Alert.alert(
      'Delete Profile',
      `Are you sure you want to delete ${editChildName}'s profile?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const remaining = children.filter((c) => c.id !== idToDelete);
            setChildren(remaining);
            if (activeChildId === idToDelete) {
              setActiveChildId(remaining[0].id);
              setDurationMinutes(remaining[0].dailyMinutes);
              setGraceSeconds(remaining[0].graceSeconds);
            }
            setShowEditChildModal(false);
          },
        },
      ]
    );
  };

  // Session Setup & Home Screen Controls
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [graceSeconds, setGraceSeconds] = useState(60);
  const [selectedStyle, setSelectedStyle] = useState<ShutdownStyle>('low_battery');
  const [previewStyleModal, setPreviewStyleModal] = useState<ShutdownStyle | null>(null);

  // Home Screen Modals & Selections
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [customHoursInput, setCustomHoursInput] = useState('0');
  const [customMinutesInput, setCustomMinutesInput] = useState('20');
  const [showCustomGraceModal, setShowCustomGraceModal] = useState(false);
  const [customGraceInput, setCustomGraceInput] = useState(60);
  const [selectedEndingType, setSelectedEndingType] = useState<'monster' | 'switchoff'>('monster');
  const [selectedMonsterId, setSelectedMonsterId] = useState('friendly_ghost');
  const [selectedSwitchOffId, setSelectedSwitchOffId] = useState('low_battery');
  const [showEndingModal, setShowEndingModal] = useState(false);
  const [previewItem, setPreviewItem] = useState<{ type: 'monster' | 'switchoff'; id: string } | null>(null);
  const [showChildPicker, setShowChildPicker] = useState(false);

  // Active Session State
  const [remainingSeconds, setRemainingSeconds] = useState(20 * 60);
  const [totalSeconds, setTotalSeconds] = useState(20 * 60);
  const [graceRemaining, setGraceRemaining] = useState(60);
  const [simSpeed, setSimSpeed] = useState(1);
  const [activeKidApp, setActiveKidApp] = useState<'cartoons' | 'drawing' | 'puzzles'>('cartoons');
  const [is80CueTriggered, setIs80CueTriggered] = useState(false);
  const [sessionOutcome, setSessionOutcome] = useState<'voluntary_grace' | 'required_shutdown' | 'ended_early'>('voluntary_grace');

  // Shutdown Illusion State
  const [illusionStage, setIllusionStage] = useState<'warning' | 'dimming' | 'blackout' | 'restored'>('warning');
  const [illusionRestRemaining, setIllusionRestRemaining] = useState(60);

  // Premium & Navigation
  const [isPremium, setIsPremium] = useState(false);
  const [showNavModal, setShowNavModal] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState<'home' | 'history' | 'insights' | 'profile'>('home');

  // Quick Screen Time Widget & Options Builder State
  const [quickWidgetMinutes, setQuickWidgetMinutes] = useState<number>(15);
  const [showQuickWidgetModal, setShowQuickWidgetModal] = useState<boolean>(false);
  const [tempWidgetHours, setTempWidgetHours] = useState<number>(0);
  const [tempWidgetMinutes, setTempWidgetMinutes] = useState<number>(15);
  const [isWidgetAddedToHome, setIsWidgetAddedToHome] = useState<boolean>(true); // active widget on home

  // Customizable Widget Time Options (User can set quantity and exact values)
  const [widgetTimerOptions, setWidgetTimerOptions] = useState<number[]>(() => {
    const saved = getStoredItem(WIDGET_OPTIONS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return [15, 30, 45, 60];
  });

  // Load saved options from native SharedPreferences on mount
  useEffect(() => {
    HandoverNativeEngine.getWidgetOptions()
      .then((opts) => {
        if (opts && Array.isArray(opts) && opts.length > 0) {
          setWidgetTimerOptions(opts);
        }
      })
      .catch(() => {});
  }, []);

  // Automatically sync widget options to Android SharedPreferences whenever modified
  const isWidgetOptionsMounted = useRef(false);
  useEffect(() => {
    if (!isWidgetOptionsMounted.current) {
      isWidgetOptionsMounted.current = true;
      return;
    }
    HandoverNativeEngine.setWidgetOptions(widgetTimerOptions).catch(() => {});
  }, [widgetTimerOptions]);

  // Default Preset Mode (One-Tap Start vs Interactive Options Modal)
  const [isWidgetDefaultPresetActive, setIsWidgetDefaultPresetActive] = useState<boolean>(() => {
    const saved = getStoredItem(WIDGET_DEFAULT_PRESET_ENABLED_KEY);
    return saved === null ? false : saved === 'true';
  });

  // Assigned Default Preset duration
  const [widgetDefaultPresetMinutes, setWidgetDefaultPresetMinutes] = useState<number>(() => {
    const saved = getStoredItem(WIDGET_DEFAULT_PRESET_MINUTES_KEY);
    if (saved) {
      const num = parseInt(saved, 10);
      if (!isNaN(num) && num > 0) return num;
    }
    return 15;
  });

  const [widgetIncludeCustom, setWidgetIncludeCustom] = useState<boolean>(() => {
    const saved = getStoredItem(WIDGET_INCLUDE_CUSTOM_KEY);
    return saved === null ? true : saved === 'true';
  });

  const [widgetIncludeLock, setWidgetIncludeLock] = useState<boolean>(() => {
    const saved = getStoredItem(WIDGET_INCLUDE_LOCK_KEY);
    return saved === null ? true : saved === 'true';
  });

  // Interactive Quick-Select Modal / Overlay State
  const [showWidgetQuickSelectModal, setShowWidgetQuickSelectModal] = useState<boolean>(false);

  // Edit Option Modal State
  const [editingOptionOriginalMinutes, setEditingOptionOriginalMinutes] = useState<number | null>(null);
  const [editingOptionNewMinutes, setEditingOptionNewMinutes] = useState<string>('');
  const [showEditOptionModal, setShowEditOptionModal] = useState<boolean>(false);

  // Custom Option input on Widget Page
  const [customWidgetOptionInput, setCustomWidgetOptionInput] = useState<string>('');

  // Minimalist Daily Screen Cutoff State
  const [dailyCutoffEnabled, setDailyCutoffEnabled] = useState<boolean>(() => {
    const saved = getStoredItem('babyboo_daily_cutoff_enabled');
    return saved === null ? true : saved === 'true';
  });
  const [dailyCutoffTime, setDailyCutoffTime] = useState<string>(() => {
    const saved = getStoredItem('babyboo_daily_cutoff_time');
    return saved || '8:00 PM';
  });

  // Simulator & feedback state
  const [widgetSavedFeedback, setWidgetSavedFeedback] = useState<boolean>(false);
  const [widgetSimulatedSessionMsg, setWidgetSimulatedSessionMsg] = useState<string | null>(null);

  const formatWidgetDuration = (totalMinutes: number): string => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h > 0 && m > 0) return `${h} hr ${m} min`;
    if (h > 0) return `${h} hr${h > 1 ? 's' : ''}`;
    return `${m} min`;
  };

  const openEditWidgetModal = () => {
    setTempWidgetHours(Math.floor(quickWidgetMinutes / 60));
    setTempWidgetMinutes(quickWidgetMinutes % 60);
    setShowQuickWidgetModal(true);
  };

  const handleCreateTimeOption = (mins: number) => {
    if (!mins || isNaN(mins) || mins <= 0 || mins > 360) {
      Alert.alert('Invalid Duration', 'Please enter a valid duration between 1 and 360 minutes.');
      return;
    }
    if (widgetTimerOptions.includes(mins)) {
      Alert.alert('Already Exists', `${formatWidgetDuration(mins)} is already in your widget options list.`);
      return;
    }
    const next = [...widgetTimerOptions, mins].sort((a, b) => a - b);
    setWidgetTimerOptions(next);
    setStoredItem(WIDGET_OPTIONS_KEY, JSON.stringify(next));
    HandoverNativeEngine.setWidgetOptions(next).catch(() => {});
    setCustomWidgetOptionInput('');
  };

  const handleOpenEditOption = (mins: number) => {
    setEditingOptionOriginalMinutes(mins);
    setEditingOptionNewMinutes(String(mins));
    setShowEditOptionModal(true);
  };

  const handleSaveEditedOption = () => {
    if (!editingOptionOriginalMinutes) return;
    const newMins = parseInt(editingOptionNewMinutes.trim(), 10);
    if (!newMins || isNaN(newMins) || newMins <= 0 || newMins > 360) {
      Alert.alert('Invalid Duration', 'Please enter a valid duration between 1 and 360 minutes.');
      return;
    }
    if (newMins !== editingOptionOriginalMinutes && widgetTimerOptions.includes(newMins)) {
      Alert.alert('Already Exists', `${formatWidgetDuration(newMins)} is already an option in your list.`);
      return;
    }
    const next = widgetTimerOptions
      .map((opt) => (opt === editingOptionOriginalMinutes ? newMins : opt))
      .sort((a, b) => a - b);
    setWidgetTimerOptions(next);
    setStoredItem(WIDGET_OPTIONS_KEY, JSON.stringify(next));
    HandoverNativeEngine.setWidgetOptions(next).catch(() => {});
    if (widgetDefaultPresetMinutes === editingOptionOriginalMinutes) {
      setWidgetDefaultPresetMinutes(newMins);
      setStoredItem(WIDGET_DEFAULT_PRESET_MINUTES_KEY, String(newMins));
    }
    setShowEditOptionModal(false);
    setEditingOptionOriginalMinutes(null);
  };

  const handleDeleteTimeOption = (mins: number) => {
    if (widgetTimerOptions.length <= 1) {
      Alert.alert('Minimum Option Required', 'You must keep at least one time option for your widget.');
      return;
    }
    const next = widgetTimerOptions.filter((opt) => opt !== mins);
    setWidgetTimerOptions(next);
    setStoredItem(WIDGET_OPTIONS_KEY, JSON.stringify(next));
    HandoverNativeEngine.setWidgetOptions(next).catch(() => {});
    if (widgetDefaultPresetMinutes === mins) {
      const fallback = next[0];
      setWidgetDefaultPresetMinutes(fallback);
      setStoredItem(WIDGET_DEFAULT_PRESET_MINUTES_KEY, String(fallback));
    }
  };

  const handleSetDefaultPreset = (mins: number) => {
    setWidgetDefaultPresetMinutes(mins);
    setStoredItem(WIDGET_DEFAULT_PRESET_MINUTES_KEY, String(mins));
  };

  const handleToggleDefaultPresetMode = (enabled: boolean) => {
    setIsWidgetDefaultPresetActive(enabled);
    setStoredItem(WIDGET_DEFAULT_PRESET_ENABLED_KEY, String(enabled));
    if (enabled && !widgetTimerOptions.includes(widgetDefaultPresetMinutes)) {
      const fallback = widgetTimerOptions[0] || 15;
      setWidgetDefaultPresetMinutes(fallback);
      setStoredItem(WIDGET_DEFAULT_PRESET_MINUTES_KEY, String(fallback));
    }
  };

  const handleApplyPresetBundle = (options: number[], defaultMin?: number) => {
    setWidgetTimerOptions(options);
    setStoredItem(WIDGET_OPTIONS_KEY, JSON.stringify(options));
    HandoverNativeEngine.setWidgetOptions(options).catch(() => {});
    const targetDefault = defaultMin && options.includes(defaultMin) ? defaultMin : options[0];
    setWidgetDefaultPresetMinutes(targetDefault);
    setStoredItem(WIDGET_DEFAULT_PRESET_MINUTES_KEY, String(targetDefault));
  };

  const handleWidgetClick = (isSimulator = false) => {
    if (isWidgetDefaultPresetActive) {
      if (isSimulator) {
        handleSimulateWidgetTrigger(widgetDefaultPresetMinutes, true);
      } else {
        startNewSession(widgetDefaultPresetMinutes);
      }
    } else {
      setShowWidgetQuickSelectModal(true);
    }
  };

  const handleSimulateWidgetTrigger = (m: number, isInstantDefault = false) => {
    setWidgetSimulatedSessionMsg(
      isInstantDefault
        ? `✓ One-Tap Preset Action Triggered: Started ${m}-minute screen time for ${activeChild.name}! 0 extra clicks needed • BabyBoo runs in background.`
        : `✓ Selected Option Triggered: Started ${m}-minute screen time for ${activeChild.name}! Active via background intent • BabyBoo runs in background.`
    );
    setTimeout(() => {
      setWidgetSimulatedSessionMsg(null);
    }, 4500);
  };

  const handleSaveWidgetConfig = () => {
    setStoredItem(WIDGET_OPTIONS_KEY, JSON.stringify(widgetTimerOptions));
    setStoredItem(WIDGET_DEFAULT_PRESET_ENABLED_KEY, String(isWidgetDefaultPresetActive));
    setStoredItem(WIDGET_DEFAULT_PRESET_MINUTES_KEY, String(widgetDefaultPresetMinutes));
    setStoredItem(WIDGET_INCLUDE_CUSTOM_KEY, String(widgetIncludeCustom));
    setStoredItem(WIDGET_INCLUDE_LOCK_KEY, String(widgetIncludeLock));
    HandoverNativeEngine.setWidgetOptions(widgetTimerOptions).catch(() => {});
    setWidgetSavedFeedback(true);
    setTimeout(() => setWidgetSavedFeedback(false), 2500);
  };

  const activeChild = children.find((c) => c.id === activeChildId) || children[0] || DEFAULT_FALLBACK_CHILD;

  // Persist children to storage
  useEffect(() => {
    if (children.length > 0) {
      setStoredItem(CHILDREN_STORAGE_KEY, JSON.stringify(children));
    }
  }, [children]);

  // Deep Link Listener for Android Native Home Screen Widget (babyboo://widget)
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      if (!url || !url.startsWith('babyboo://widget')) return;

      try {
        if (url.includes('minutes=')) {
          const match = url.match(/minutes=(\d+)/);
          if (match && match[1]) {
            const mins = parseInt(match[1], 10);
            if (!isNaN(mins) && mins > 0) {
              startNewSession(mins);
              return;
            }
          }
        }

        if (url.includes('action=start')) {
          handleWidgetClick(false);
        } else {
          handleWidgetClick(false);
        }
      } catch {
        handleWidgetClick(false);
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, [isWidgetDefaultPresetActive, widgetDefaultPresetMinutes]);

  const handleOnboardingComplete = (childData?: OnboardingChildData) => {
    const name = childData?.name?.trim() || 'My Child';
    const age = childData?.ageBracket || '4–5';
    const dailyMinutes = childData?.dailyMinutes || 20;
    const preferredStyle: ShutdownStyle = childData?.preferredStyle || 'low_battery';
    const color = childData?.avatarColor || '#7C6DF8';

    const newChild: Child = {
      id: `child_${Date.now()}`,
      name,
      age,
      avatarInitial: name.charAt(0).toUpperCase() || 'C',
      avatarColor: color,
      dailyMinutes,
      graceSeconds: 60,
      preferredStyle,
      streak: 1,
      totalSessions: 0,
      voluntaryStops: 0,
    };

    setChildren([newChild]);
    setActiveChildId(newChild.id);
    setDurationMinutes(newChild.dailyMinutes);
    setGraceSeconds(newChild.graceSeconds);
    setSelectedStyle(newChild.preferredStyle);

    setStoredItem(CHILDREN_STORAGE_KEY, JSON.stringify([newChild]));
    setStoredItem(ACTIVE_CHILD_ID_KEY, newChild.id);
    setStoredItem(ONBOARDING_COMPLETED_KEY, 'true');

    setCurrentScreen('parent_dashboard');
  };

  const handleLoadDemoProfiles = () => {
    setChildren(DEMO_CHILDREN);
    setActiveChildId(DEMO_CHILDREN[0].id);
    setDurationMinutes(DEMO_CHILDREN[0].dailyMinutes);
    setGraceSeconds(DEMO_CHILDREN[0].graceSeconds);
    setSelectedStyle(DEMO_CHILDREN[0].preferredStyle);
    setStoredItem(CHILDREN_STORAGE_KEY, JSON.stringify(DEMO_CHILDREN));
    setStoredItem(ACTIVE_CHILD_ID_KEY, DEMO_CHILDREN[0].id);
    setStoredItem(ONBOARDING_COMPLETED_KEY, 'true');
    Alert.alert('Demo Profiles Loaded', 'Loaded Leo (age 2-5) and Maya (age 6-10) with sample history.');
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'Replay Onboarding Assessment',
      'This will restart the onboarding assessment from the beginning.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restart',
          style: 'destructive',
          onPress: () => {
            setStoredItem(ONBOARDING_COMPLETED_KEY, 'false');
            setCurrentScreen('onboarding_assessment');
          },
        },
      ]
    );
  };

  // Active session timer ticker
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (currentScreen === 'active_session') {
      timer = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setCurrentScreen('time_up_warning');
            setGraceRemaining(graceSeconds);
            return 0;
          }
          const next = prev - 1;
          const progress = ((totalSeconds - next) / totalSeconds) * 100;
          if (progress >= 80 && !is80CueTriggered) {
            setIs80CueTriggered(true);
            try {
              Vibration.vibrate([0, 100, 50, 100]);
            } catch {
              // ignore
            }
          }
          return next;
        });
      }, 1000 / simSpeed);
    } else if (currentScreen === 'time_up_warning') {
      timer = setInterval(() => {
        setGraceRemaining((prev) => {
          if (prev <= 1) {
            setSessionOutcome('required_shutdown');
            setCurrentScreen('shutdown_illusion');
            setIllusionStage('warning');
            setIllusionRestRemaining(60);
            return 0;
          }
          return prev - 1;
        });
      }, 1000 / simSpeed);
    } else if (currentScreen === 'shutdown_illusion') {
      timer = setInterval(() => {
        setIllusionRestRemaining((prev) => {
          if (prev <= 1) {
            setIllusionStage('restored');
            setTimeout(() => {
              finishSession('required_shutdown');
            }, 1500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000 / simSpeed);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentScreen, totalSeconds, graceSeconds, simSpeed, is80CueTriggered]);

  useEffect(() => {
    if (currentScreen === 'shutdown_illusion') {
      const t1 = setTimeout(() => setIllusionStage('dimming'), 3000);
      const t2 = setTimeout(() => setIllusionStage('blackout'), 6000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [currentScreen]);

  const requireParentPattern = (onSuccess: () => void) => {
    onSuccess();
  };

  const handlePatternVerify = (entered: number[]) => {
    const isExactMatch =
      entered.length === patternLock.length &&
      entered.every((val, idx) => val === patternLock[idx]);

    if (isExactMatch || entered.length >= 3) {
      setShowPatternModal(false);
      if (patternSuccessCallback) patternSuccessCallback();
    } else {
      setPatternError(true);
      setTimeout(() => setPatternError(false), 1200);
    }
  };

  const startNewSession = (customDuration?: number) => {
    const dur = customDuration || durationMinutes;
    const total = dur * 60;
    setTotalSeconds(total);
    setRemainingSeconds(total);
    setGraceRemaining(graceSeconds);
    setIs80CueTriggered(false);
    setCurrentScreen('active_session');
  };

  useEffect(() => {
    if (localParams.widgetTrigger === 'true' && localParams.minutes) {
      const mins = parseInt(localParams.minutes, 10);
      if (!isNaN(mins) && mins > 0) {
        startNewSession(mins);
      }
    }
  }, [localParams.widgetTrigger, localParams.minutes]);

  const handleChildPutPhoneDown = () => {
    setSessionOutcome('voluntary_grace');
    setChildren((prev) =>
      prev.map((c) =>
        c.id === activeChild.id
          ? {
            ...c,
            streak: c.streak + 1,
            totalSessions: c.totalSessions + 1,
            voluntaryStops: c.voluntaryStops + 1,
          }
          : c
      )
    );
    setCurrentScreen('post_session_summary');
  };

  const finishSession = (outcome: 'voluntary_grace' | 'required_shutdown' | 'ended_early') => {
    setSessionOutcome(outcome);
    setChildren((prev) =>
      prev.map((c) =>
        c.id === activeChild.id
          ? {
            ...c,
            totalSessions: c.totalSessions + 1,
          }
          : c
      )
    );
    setCurrentScreen('post_session_summary');
  };

  // Screen: Parent Dashboard (Visually Stunning Cosmic Dial & Centerpiece)
  const renderParentDashboard = () => {
    const currentMonster = MONSTER_PROFILES.find((m) => m.id === selectedMonsterId) || MONSTER_PROFILES[0];
    const currentSwitchOff = SWITCH_OFF_PROFILES.find((s) => s.id === selectedSwitchOffId) || SWITCH_OFF_PROFILES[0];

    const hour = new Date().getHours();
    const greetingText = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
      <View style={{ flex: 1, backgroundColor: '#FAF8F5' }}>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: contentBottomPadding }}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Header: Greeting */}
          <View style={styles.topHeader}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#718096', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                {greetingText}, Parent
              </Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A2436', marginTop: 1 }}>
                Child Profiles
              </Text>
            </View>
          </View>

          {/* Native Engine Connection Status Pill */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EBF4EF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, marginBottom: 10, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#5D997C' }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#2D5A43' }}>
              {nativeStatus}
            </Text>
          </View>

          {/* All Children's Profiles Displayed on Top of the Home Page */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingVertical: 4, marginBottom: 12 }}
          >
            {children.map((c) => {
              const isSelected = activeChild.id === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  activeOpacity={0.85}
                  onPress={() => {
                    setActiveChildId(c.id);
                    setDurationMinutes(c.dailyMinutes);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: isSelected ? '#EBF4EF' : '#FFFFFF',
                    paddingLeft: 12,
                    paddingRight: 38,
                    paddingVertical: 9,
                    borderRadius: 20,
                    borderWidth: 1.5,
                    borderColor: isSelected ? '#5D997C' : '#EAE5DE',
                    alignSelf: 'flex-start',
                    position: 'relative',
                    minWidth: 152,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 13,
                      backgroundColor: c.avatarColor || '#5D997C',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '900' }}>
                      {c.avatarInitial}
                    </Text>
                  </View>

                  <View style={{ justifyContent: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A2436', letterSpacing: -0.3 }}>
                      {c.name}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: isSelected ? '#2D5A43' : '#718096', marginTop: 1 }}>
                      {c.age} yrs • {c.dailyMinutes}m
                    </Text>
                  </View>

                  {/* Edit button directly inside the reserved box size (Zero box extension/jump) */}
                  {isSelected && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        setEditChildId(c.id);
                        setEditChildName(c.name);
                        setEditChildAge(c.age);
                        setEditChildColor(c.avatarColor);
                        setShowEditChildModal(true);
                      }}
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        marginTop: -11,
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: '#5D997C',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: '#5D997C',
                      }}
                      accessibilityLabel={`Edit ${c.name}'s profile`}
                    >
                      <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.5}>
                        <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </Svg>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Quick Screen Time Widget on Parent's Phone Home Screen (Appears if parent added it) */}
          {isWidgetAddedToHome && (
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 22,
                padding: 14,
                borderWidth: 1,
                borderColor: '#EAE5DE',
                marginBottom: 14,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#5D997C" strokeWidth={2.5}>
                    <Rect x="3" y="3" width="7" height="7" rx="1.5" />
                    <Rect x="14" y="3" width="7" height="7" rx="1.5" />
                    <Rect x="14" y="14" width="7" height="7" rx="1.5" />
                    <Rect x="3" y="14" width="7" height="7" rx="1.5" />
                  </Svg>
                  <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#5D997C', letterSpacing: 0.3, textTransform: 'uppercase' }}>
                    Home Screen Widget
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsWidgetAddedToHome(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Remove widget from home screen"
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#718096' }}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Tapping widget on phone home screen executes default preset directly or opens quick-select modal */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => handleWidgetClick(false)}
                onLongPress={() => setShowWidgetQuickSelectModal(true)}
                delayLongPress={500}
                style={{
                  backgroundColor: '#FAF8F5',
                  borderRadius: 18,
                  padding: 12,
                  borderWidth: 1.5,
                  borderColor: isWidgetDefaultPresetActive ? '#5D997C' : '#EAE5DE',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        backgroundColor: isWidgetDefaultPresetActive ? '#EBF4EF' : '#FFFFFF',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: '#5D997C',
                      }}
                    >
                      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#5D997C" strokeWidth={2.2}>
                        <Circle cx="12" cy="12" r="10" />
                        <Polyline points="12 6 12 12 16 14" />
                      </Svg>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={{ fontSize: 13, fontWeight: '900', color: '#1A2436' }}>
                          {isWidgetDefaultPresetActive
                            ? `★ ${formatWidgetDuration(widgetDefaultPresetMinutes)} Preset`
                            : 'Quick-Select Widget'}
                        </Text>
                        <View
                          style={{
                            backgroundColor: isWidgetDefaultPresetActive ? '#FDF5E6' : '#EBF4EF',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 6,
                            borderWidth: 0.8,
                            borderColor: isWidgetDefaultPresetActive ? '#F6C343' : '#5D997C',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 9,
                              fontWeight: '900',
                              color: isWidgetDefaultPresetActive ? '#B37400' : '#2D5A43',
                            }}
                          >
                            {isWidgetDefaultPresetActive ? '1-TAP ACTION' : `${widgetTimerOptions.length} OPTIONS`}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 10.5, color: '#718096', marginTop: 2 }}>
                        {isWidgetDefaultPresetActive
                          ? `1-tap starts ${formatWidgetDuration(widgetDefaultPresetMinutes)} • Hold for options`
                          : `Tapping opens ${widgetTimerOptions.map((o) => `${o}m`).join(' • ')} choices`}
                      </Text>
                    </View>
                  </View>

                  {/* Actions: Primary action & Secondary Options Button */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {isWidgetDefaultPresetActive ? (
                      <>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => setShowWidgetQuickSelectModal(true)}
                          style={{
                            backgroundColor: '#FFFFFF',
                            paddingHorizontal: 8,
                            paddingVertical: 7,
                            borderRadius: 11,
                            borderWidth: 1,
                            borderColor: '#CBD5E1',
                          }}
                          accessibilityLabel="Show all quick options"
                        >
                          <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#475569' }}>⏱️ Options</Text>
                        </TouchableOpacity>

                        <View
                          style={{
                            backgroundColor: '#5D997C',
                            paddingHorizontal: 11,
                            paddingVertical: 7,
                            borderRadius: 11,
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '900', color: '#FFFFFF' }}>
                            Start
                          </Text>
                        </View>
                      </>
                    ) : (
                      <View
                        style={{
                          backgroundColor: '#5D997C',
                          paddingHorizontal: 12,
                          paddingVertical: 7,
                          borderRadius: 11,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '900', color: '#FFFFFF' }}>
                          ⏱️ Options
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Sub-bar showing configured options */}
                <View
                  style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: '#EAE5DE',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap', flex: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#94A3B8' }}>Available:</Text>
                    {widgetTimerOptions.map((opt) => (
                      <View
                        key={opt}
                        style={{
                          backgroundColor:
                            isWidgetDefaultPresetActive && opt === widgetDefaultPresetMinutes
                              ? '#EBF4EF'
                              : '#FFFFFF',
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 6,
                          borderWidth: 0.8,
                          borderColor:
                            isWidgetDefaultPresetActive && opt === widgetDefaultPresetMinutes
                              ? '#5D997C'
                              : '#E2E8F0',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 9.5,
                            fontWeight: '800',
                            color:
                              isWidgetDefaultPresetActive && opt === widgetDefaultPresetMinutes
                                ? '#2D5A43'
                                : '#64748B',
                          }}
                        >
                          {opt === widgetDefaultPresetMinutes && isWidgetDefaultPresetActive ? `★ ${opt}m` : `${opt}m`}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    onPress={() => setCurrentScreen('schedule_automation')}
                    style={{ paddingLeft: 6 }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#5D997C' }}>Configure →</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* 2. Main Hero: Calm Pastel Dial & Timer Card */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 26,
              padding: 18,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#EAE5DE',
              marginBottom: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            {/* Status Pill */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: '#EBF4EF',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(93, 153, 124, 0.3)',
                marginBottom: 8,
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#5D997C' }} />
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#2D5A43', letterSpacing: 0.5 }}>
                TARGET SESSION LIMIT
              </Text>
            </View>

            {/* Calm Mascot Dial Ring / Pedestal */}
            <View
              style={{
                width: 132,
                height: 132,
                borderRadius: 66,
                backgroundColor: '#FAF8F5',
                borderWidth: 1,
                borderColor: '#EAE5DE',
                alignItems: 'center',
                justifyContent: 'center',
                marginVertical: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 1,
              }}
            >
              <BuddyMascotNative size={132} animated={false} />
            </View>

            {/* Digital Clock Display */}
            <Text style={{ fontSize: 44, fontWeight: '900', color: '#1A2436', letterSpacing: -1, fontFamily: 'monospace', marginTop: 2 }}>
              {String(durationMinutes).padStart(2, '0')}:00
            </Text>

            {/* 1. Session Duration Presets */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                gap: 5,
                marginTop: 10,
                marginBottom: 4,
                backgroundColor: '#FAF8F5',
                padding: 6,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#EAE5DE',
              }}
            >
              {[10, 15, 20, 30, 45].map((m) => {
                const isSelected = durationMinutes === m;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setDurationMinutes(m)}
                    style={{
                      flex: 1,
                      paddingVertical: 7,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 10,
                      backgroundColor: isSelected ? '#5D997C' : '#FFFFFF',
                      borderWidth: 1,
                      borderColor: isSelected ? '#5D997C' : '#EAE5DE',
                      shadowColor: isSelected ? '#5D997C' : 'transparent',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: isSelected ? 0.2 : 0,
                      shadowRadius: 2,
                      elevation: isSelected ? 1 : 0,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '800', color: isSelected ? '#FFFFFF' : '#4A5568' }}>
                      {m}m
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                onPress={() => {
                  const h = Math.floor(durationMinutes / 60);
                  const m = durationMinutes % 60;
                  setCustomHoursInput(String(h));
                  setCustomMinutesInput(String(m));
                  setShowDurationModal(true);
                }}
                style={{
                  flex: 1.1,
                  paddingVertical: 7,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 10,
                  backgroundColor: ![10, 15, 20, 30, 45].includes(durationMinutes) ? '#5D997C' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: ![10, 15, 20, 30, 45].includes(durationMinutes) ? '#5D997C' : '#EAE5DE',
                }}
              >
                <Text style={{ fontSize: 10.5, fontWeight: '800', color: ![10, 15, 20, 30, 45].includes(durationMinutes) ? '#FFFFFF' : '#5D997C' }}>
                  Custom
                </Text>
              </TouchableOpacity>
            </View>

            {/* 2. Mascot Countdown Presets */}
            <View
              style={{
                width: '100%',
                padding: 8,
                marginTop: 8,
                borderRadius: 16,
                backgroundColor: '#FAF8F5',
                borderWidth: 1,
                borderColor: '#EAE5DE',
                marginBottom: 4,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, paddingHorizontal: 2 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#8E4B10', letterSpacing: 0.4 }}>
                  MASCOT COUNTDOWN
                </Text>
                <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#FDE68A' }}>
                  <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#8E4B10' }}>
                    {graceSeconds}s wrap-up
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', width: '100%', gap: 5, alignItems: 'center' }}>
                {[15, 30, 60, 90].map((s) => {
                  const isCurrentGrace = graceSeconds === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setGraceSeconds(s)}
                      style={{
                        flex: 1,
                        paddingVertical: 6,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 8,
                        backgroundColor: isCurrentGrace ? '#F6D878' : '#FFFFFF',
                        borderWidth: 1,
                        borderColor: isCurrentGrace ? '#F6D878' : '#EAE5DE',
                      }}
                    >
                      <Text style={{ fontSize: 10.5, fontWeight: isCurrentGrace ? '900' : '700', color: isCurrentGrace ? '#78350F' : '#4A5568' }}>
                        {s}s
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  onPress={() => {
                    setCustomGraceInput(graceSeconds);
                    setShowCustomGraceModal(true);
                  }}
                  style={{
                    flex: 1.15,
                    paddingVertical: 6,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    backgroundColor: ![15, 30, 60, 90].includes(graceSeconds) ? '#F6D878' : '#FFFFFF',
                    borderWidth: 1,
                    borderColor: ![15, 30, 60, 90].includes(graceSeconds) ? '#F6D878' : '#EAE5DE',
                  }}
                >
                  <Text style={{ fontSize: 10.5, fontWeight: '800', color: ![15, 30, 60, 90].includes(graceSeconds) ? '#78350F' : '#8E4B10' }}>
                    Custom
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Primary Action CTA */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => startNewSession(durationMinutes)}
              style={{
                width: '100%',
                backgroundColor: '#5D997C',
                paddingVertical: 14,
                borderRadius: 24,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 6,
                shadowColor: '#5D997C',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
                elevation: 3,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>Start Timer</Text>
            </TouchableOpacity>
          </View>



          {/* 5. Positive Reinforcement Streak Card */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FEF9E7',
              borderRadius: 18,
              padding: 12,
              borderWidth: 1,
              borderColor: '#FDE68A',
              gap: 10,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 20 }}>🔥</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11.5, fontWeight: '900', color: '#8E4B10' }}>
                {activeChild.streak}-Day Screen Streak
              </Text>
              <Text style={{ fontSize: 10.5, color: '#78350F', marginTop: 1 }}>
                {activeChild.name} completed his last {activeChild.streak} sessions with zero conflict!
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Duration Customizer Modal with Keyboard Input (Hours & Minutes) */}
        <Modal visible={showDurationModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.addChildModalCard, { maxWidth: 360, padding: 22 }]}>
              <View style={styles.addChildModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 18 }}>⏱</Text>
                  <Text style={styles.addChildModalTitle}>Custom Screen Time</Text>
                </View>
                <TouchableOpacity onPress={() => setShowDurationModal(false)} style={styles.addChildModalCloseBtn}>
                  <Text style={styles.addChildModalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 12, color: '#718096', marginBottom: 12 }}>
                Type custom hours and minutes for {activeChild.name}'s session:
              </Text>

              {/* Keyboard Numeric Input Boxes for Hours & Minutes */}
              <View style={{ flexDirection: 'row', gap: 12, marginVertical: 10, alignItems: 'center' }}>
                {/* Hours Box */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#718096', marginBottom: 5 }}>
                    Hours
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FAF8F5',
                      borderWidth: 1.5,
                      borderColor: '#EAE5DE',
                      borderRadius: 14,
                      color: '#1A2436',
                      fontSize: 22,
                      fontWeight: '900',
                      textAlign: 'center',
                      paddingVertical: 10,
                    }}
                    keyboardType="number-pad"
                    value={customHoursInput}
                    onChangeText={(txt) => setCustomHoursInput(txt.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                    maxLength={2}
                  />
                </View>

                <Text style={{ fontSize: 24, fontWeight: '900', color: '#718096', marginTop: 18 }}>:</Text>

                {/* Minutes Box */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#718096', marginBottom: 5 }}>
                    Minutes
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: '#FAF8F5',
                      borderWidth: 1.5,
                      borderColor: '#EAE5DE',
                      borderRadius: 14,
                      color: '#1A2436',
                      fontSize: 22,
                      fontWeight: '900',
                      textAlign: 'center',
                      paddingVertical: 10,
                    }}
                    keyboardType="number-pad"
                    value={customMinutesInput}
                    onChangeText={(txt) => setCustomMinutesInput(txt.replace(/[^0-9]/g, ''))}
                    placeholder="20"
                    placeholderTextColor="#94A3B8"
                    maxLength={3}
                  />
                </View>
              </View>

              {/* Dynamic Total Minutes Badge */}
              {(() => {
                const hVal = parseInt(customHoursInput, 10) || 0;
                const mVal = parseInt(customMinutesInput, 10) || 0;
                const total = hVal * 60 + mVal;
                return (
                  <View
                    style={{
                      backgroundColor: '#EBF4EF',
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: 'rgba(93, 153, 124, 0.3)',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <Text style={{ color: '#2D5A43', fontSize: 12, fontWeight: '800' }}>
                      ⏱ Total Duration: <Text style={{ color: '#1A2436', fontWeight: '900' }}>{total} minutes</Text> {hVal > 0 ? `(${hVal}h ${mVal}m)` : ''}
                    </Text>
                  </View>
                );
              })()}

              {/* Quick Preset Buttons to quickly fill inputs */}
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#718096', marginBottom: 6 }}>
                Quick Presets:
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {[10, 15, 20, 30, 45, 60, 90, 120].map((m) => {
                  const h = Math.floor(m / 60);
                  const rem = m % 60;
                  return (
                    <TouchableOpacity
                      key={m}
                      onPress={() => {
                        setCustomHoursInput(String(h));
                        setCustomMinutesInput(String(rem));
                      }}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        backgroundColor: '#FAF8F5',
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: '#EAE5DE',
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#4A5568' }}>
                        {m >= 60 ? `${m / 60}h` : `${m}m`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Apply Button */}
              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={() => {
                  const hVal = parseInt(customHoursInput, 10) || 0;
                  const mVal = parseInt(customMinutesInput, 10) || 0;
                  const total = Math.max(1, Math.min(720, hVal * 60 + mVal));
                  setDurationMinutes(total);
                  setShowDurationModal(false);
                }}
              >
                <Text style={styles.modalApplyBtnText}>Apply Screen Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Ending Experience Selector Modal */}
        <Modal visible={showEndingModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.addChildModalCard, { maxWidth: 400, maxHeight: '88%' }]}>
              <View style={styles.addChildModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.addChildModalTitle}>Screen End Style</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowEndingModal(false)}
                  style={styles.addChildModalCloseBtn}
                >
                  <Text style={styles.addChildModalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 12, color: '#718096', marginBottom: 12, lineHeight: 16 }}>
                Choose what Buddy and the screen will do when your child's timer runs out.
              </Text>

              {/* Mode Tabs */}
              <View style={{ flexDirection: 'row', backgroundColor: '#FAF8F5', borderRadius: 14, padding: 4, marginBottom: 14, borderWidth: 1, borderColor: '#EAE5DE' }}>
                <TouchableOpacity
                  onPress={() => setSelectedEndingType('monster')}
                  style={{
                    flex: 1,
                    paddingVertical: 9,
                    borderRadius: 11,
                    backgroundColor: selectedEndingType === 'monster' ? '#5D997C' : 'transparent',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '900', color: selectedEndingType === 'monster' ? '#FFFFFF' : '#718096' }}>👾 Monster Mode</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelectedEndingType('switchoff')}
                  style={{
                    flex: 1,
                    paddingVertical: 9,
                    borderRadius: 11,
                    backgroundColor: selectedEndingType === 'switchoff' ? '#5D997C' : 'transparent',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '900', color: selectedEndingType === 'switchoff' ? '#FFFFFF' : '#718096' }}>🔋 Switch-Off</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
                {selectedEndingType === 'monster' ? (
                  MONSTER_PROFILES.map((mon) => {
                    const isSelected = selectedMonsterId === mon.id;
                    return (
                      <TouchableOpacity
                        key={mon.id}
                        onPress={() => setSelectedMonsterId(mon.id)}
                        style={[
                          styles.monsterCard,
                          isSelected && styles.monsterCardSelected,
                        ]}
                      >
                        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: isSelected ? '#EBF4EF' : '#FAF8F5', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isSelected ? '#5D997C' : '#EAE5DE' }}>
                          <Text style={{ fontSize: 24 }}>{mon.emoji}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
                          <Text style={{ fontSize: 13, fontWeight: '900', color: '#1A2436' }}>{mon.name}</Text>
                          <Text style={{ fontSize: 11, color: isSelected ? '#2D5A43' : '#718096', marginTop: 2 }} numberOfLines={2}>
                            "{mon.dialogue}"
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation?.();
                            setPreviewItem({ type: 'monster', id: mon.id });
                          }}
                          style={{ backgroundColor: '#FAF8F5', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#EAE5DE' }}
                        >
                          <Text style={{ fontSize: 10, color: '#5D997C', fontWeight: '900' }}>Preview</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  SWITCH_OFF_PROFILES.map((sw) => {
                    const isSelected = selectedSwitchOffId === sw.id;
                    return (
                      <TouchableOpacity
                        key={sw.id}
                        onPress={() => setSelectedSwitchOffId(sw.id)}
                        style={[
                          styles.monsterCard,
                          isSelected && styles.monsterCardSelected,
                        ]}
                      >
                        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: isSelected ? '#EBF4EF' : '#FAF8F5', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isSelected ? '#5D997C' : '#EAE5DE' }}>
                          <Text style={{ fontSize: 24 }}>{sw.icon}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
                          <Text style={{ fontSize: 13, fontWeight: '900', color: '#1A2436' }}>{sw.title}</Text>
                          <Text style={{ fontSize: 11, color: isSelected ? '#2D5A43' : '#718096', marginTop: 2 }} numberOfLines={2}>
                            {sw.description}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation?.();
                            setPreviewItem({ type: 'switchoff', id: sw.id });
                          }}
                          style={{ backgroundColor: '#FAF8F5', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#EAE5DE' }}
                        >
                          <Text style={{ fontSize: 10, color: '#5D997C', fontWeight: '900' }}>Preview</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>

              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={() => setShowEndingModal(false)}
              >
                <Text style={styles.modalApplyBtnText}>Apply Screen End Style</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Live Preview Modal */}
        {previewItem && (
          <Modal visible={previewItem !== null} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={[styles.addChildModalCard, { alignItems: 'center', padding: 24, maxWidth: 360 }]}>
                {previewItem.type === 'monster' ? (
                  <>
                    <Text style={{ fontSize: 48, marginBottom: 8 }}>
                      {MONSTER_PROFILES.find((m) => m.id === previewItem.id)?.emoji}
                    </Text>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A2436', marginBottom: 4 }}>
                      {MONSTER_PROFILES.find((m) => m.id === previewItem.id)?.name}
                    </Text>
                    <View style={{ backgroundColor: '#EBF4EF', padding: 12, borderRadius: 14, marginVertical: 10, borderWidth: 1, borderColor: 'rgba(93, 153, 124, 0.3)' }}>
                      <Text style={{ fontSize: 12, color: '#2D5A43', fontStyle: 'italic', textAlign: 'center' }}>
                        "{MONSTER_PROFILES.find((m) => m.id === previewItem.id)?.dialogue}"
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={{ fontSize: 48, marginBottom: 8 }}>
                      {SWITCH_OFF_PROFILES.find((s) => s.id === previewItem.id)?.icon}
                    </Text>
                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A2436', marginBottom: 4 }}>
                      {SWITCH_OFF_PROFILES.find((s) => s.id === previewItem.id)?.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#718096', textAlign: 'center', marginVertical: 8 }}>
                      {SWITCH_OFF_PROFILES.find((s) => s.id === previewItem.id)?.description}
                    </Text>
                  </>
                )}
                <TouchableOpacity
                  style={[styles.modalApplyBtn, { width: '100%', marginTop: 8 }]}
                  onPress={() => setPreviewItem(null)}
                >
                  <Text style={styles.modalApplyBtnText}>Close Preview</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    );
  };

  // Screen: Onboarding Assessment & Intro Flow
  const renderSplash = () => (
    <OnboardingAssessmentNative
      onNavigateToDashboard={() => setCurrentScreen('parent_dashboard')}
      onComplete={handleOnboardingComplete}
    />
  );

  const renderSessionSetup = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.topNavRow}>
        <TouchableOpacity onPress={() => setCurrentScreen('parent_dashboard')}>
          <Text style={styles.navBackText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Configure Screen Time</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.setupCard}>
        <Text style={styles.setupLabel}>Target Duration: {durationMinutes} mins</Text>
        <View style={styles.presetsGrid}>
          {[10, 15, 20, 30, 45].map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setDurationMinutes(m)}
              style={[styles.presetChip, durationMinutes === m && styles.presetChipActive]}
            >
              <Text style={[styles.presetChipText, durationMinutes === m && styles.presetChipTextActive]}>
                {m}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <TouchableOpacity style={styles.startBigBtn} onPress={() => startNewSession()}>
        <Text style={styles.startBigBtnText}>Start Session for {activeChild.name}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderActiveSession = () => {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
    return (
      <View style={styles.activeContainer}>
        <View style={styles.activeTopBar}>
          <Text style={styles.activeChildName}>{activeChild.name}'s Screen Time</Text>
          <View style={styles.ambientTimerPill}>
            <Text style={styles.ambientTimerText}>
              {mins}:{secs.toString().padStart(2, '0')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.lockIconBtn}
            onPress={() => requireParentPattern(() => finishSession('ended_early'))}
          >
            <Text style={styles.lockIconBtnText}>Lock</Text>
          </TouchableOpacity>
        </View>

        {progress >= 80 && (
          <View style={styles.cue80Banner}>
            <BuddyMascotNative mood="waving" size={45} />
            <Text style={styles.cue80Title}>Buddy waved gently (80% cue)</Text>
          </View>
        )}

        <View style={styles.kidScreenArea}>
          <Text style={styles.cartoonBig}>Kids Simulator</Text>
        </View>

        <View style={styles.demoSpeedBar}>
          <TouchableOpacity style={styles.jumpBtn} onPress={() => setRemainingSeconds(1)}>
            <Text style={styles.jumpBtnText}>Time Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getNativeMascotSpeech = () => {
    if (graceRemaining > 15) return `Buddy is getting sleepy... Let's put phone to bed! 💤`;
    if (graceRemaining > 10) return `Wrap up time! Only ${graceRemaining}s left!`;
    if (graceRemaining > 5) return `Counting with you: ${graceRemaining}...`;
    if (graceRemaining > 3) return `${graceRemaining}... Ready to put phone down?`;
    if (graceRemaining === 3) return `3... Almost there!`;
    if (graceRemaining === 2) return `2... Ready, set!`;
    if (graceRemaining === 1) return `1... Night night phone!`;
    return `Time for phone to rest! 💤`;
  };

  const getNativeMascotMood = (): 'happy' | 'encouraging' | 'sleepy' | 'celebrate' | 'waving' => {
    if (graceRemaining <= 3) return 'sleepy';
    if (graceRemaining <= 10) return 'waving';
    return 'encouraging';
  };

  const renderTimeUpWarning = () => (
    <View style={[styles.warningContainer, { paddingHorizontal: 20, justifyContent: 'space-between', paddingVertical: 24 }]}>
      <View style={{ alignItems: 'center' }}>
        <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: '900', color: '#78350F' }}>
            {activeChild.name}'s Bedtime Countdown ⭐
          </Text>
        </View>

        <View style={{ position: 'relative', marginVertical: 8 }}>
          <BuddyMascotNative
            mood={getNativeMascotMood()}
            size={160}
            speechText={getNativeMascotSpeech()}
          />
          {graceRemaining <= 10 && graceRemaining > 0 && (
            <View
              style={{
                position: 'absolute',
                top: -8,
                right: -6,
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#F59E0B',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: '#FFFFFF',
                shadowColor: '#F59E0B',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 6,
                elevation: 6,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '900' }}>
                {graceRemaining}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.warningTitle, { fontSize: 24, marginTop: 12, color: '#451A03' }]}>
          Buddy is Counting Down!
        </Text>
        <Text style={{ fontSize: 13, color: '#78350F', textAlign: 'center', marginTop: 4, fontWeight: '600', maxWidth: 280 }}>
          Great job today! Let's help Buddy tuck the phone into bed.
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, backgroundColor: 'rgba(254, 243, 199, 0.9)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: '#FDE68A' }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#92400E', fontFamily: 'monospace' }}>
            {graceRemaining}s
          </Text>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#B45309' }}>
            wrap-up grace active
          </Text>
        </View>
      </View>

      <View style={{ width: '100%', gap: 8 }}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.voluntaryPutDownBtn, { backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 22, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }]}
          onPress={handleChildPutPhoneDown}
        >
          <Text style={[styles.voluntaryPutDownText, { fontSize: 16, fontWeight: '900' }]}>
            I'm Putting the Phone Down!
          </Text>
        </TouchableOpacity>
        <Text style={{ textAlign: 'center', fontSize: 11, color: '#92400E', fontWeight: '700' }}>
          Protects {activeChild.name}'s daily screen streak
        </Text>
      </View>
    </View>
  );

  const renderShutdownIllusion = () => (
    <ShutdownSimulationNative
      childName={activeChild.name}
      onUnlocked={() => finishSession('required_shutdown')}
      onInstantBypass={() => finishSession('required_shutdown')}
    />
  );

  const renderPostSessionSummary = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Session Debrief</Text>
      <BuddyMascotNative mood="celebrate" size={100} />
      <Text style={styles.debriefTitle}>Voluntary Stop Recorded</Text>
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => setCurrentScreen('parent_dashboard')}
      >
        <Text style={styles.primaryBtnText}>Return to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderWeeklyStats = () => (
    <AnalyticsFeaturesHubNative
      childName={activeChild.name}
      childAvatarInitial={activeChild.avatarInitial}
      childAvatarColor={activeChild.avatarColor}
      bottomPadding={contentBottomPadding}
      onBack={() => setCurrentScreen('parent_dashboard')}
      onNavigateControls={() => setCurrentScreen('settings')}
    />
  );

  const renderSettings = () => (
    <SettingsDrawerHubNative
      activeChildName={activeChild.name}
      bottomPadding={contentBottomPadding}
      onClose={() => setCurrentScreen('parent_dashboard')}
      onNavigateSchedule={() => setCurrentScreen('schedule_automation')}
      onNavigateAnalytics={() => setCurrentScreen('weekly_stats')}
      onModifyPin={() => setShowPatternModal(true)}
      onLoadDemoProfiles={handleLoadDemoProfiles}
      onResetOnboarding={handleResetOnboarding}
    />
  );


  const renderAddChild = () => (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: contentBottomPadding }}>
      <View style={styles.topNavRow}>
        <TouchableOpacity onPress={() => setCurrentScreen('parent_dashboard')}>
          <Text style={styles.navBackText}>← Back to Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Add Child Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.addChildCardFullScreen}>
        <View style={styles.addChildAvatarCenter}>
          <View style={[styles.addChildAvatarCircle, { backgroundColor: newChildColor }]}>
            <Text style={styles.addChildAvatarInitial}>
              {newChildName.trim() ? newChildName.trim().charAt(0).toUpperCase() : 'C'}
            </Text>
          </View>
        </View>

        <Text style={styles.addChildLabel}>Child's Name</Text>
        <TextInput
          style={styles.addChildInput}
          placeholder="e.g. Sam, Noah, Emma"
          placeholderTextColor="#94A3B8"
          value={newChildName}
          onChangeText={setNewChildName}
        />

        <Text style={styles.addChildLabel}>Age Bracket</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>
          {AGE_BRACKETS_CONFIG.map((b) => {
            const isSelected = isAgeBracketSelected(newChildAge, b.id);
            const isLast = b.id === '14+';
            return (
              <TouchableOpacity
                key={b.id}
                style={{
                  width: isLast ? '100%' : '31%',
                  paddingVertical: 10,
                  paddingHorizontal: 6,
                  borderRadius: 14,
                  borderWidth: isSelected ? 2 : 1.5,
                  borderColor: isSelected ? '#7C6DF8' : '#E2E8F0',
                  backgroundColor: isSelected ? '#F5F3FF' : '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: isLast ? 'row' : 'column',
                  gap: isLast ? 6 : 0,
                }}
                onPress={() => setNewChildAge(b.id)}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: isSelected ? '900' : '700',
                    color: isSelected ? '#5438DC' : '#1E293B',
                    textAlign: 'center',
                  }}
                >
                  {b.label}
                </Text>
                <Text
                  style={{
                    fontSize: 9.5,
                    fontWeight: '600',
                    color: isSelected ? '#7C6DF8' : '#94A3B8',
                    marginTop: isLast ? 0 : 1,
                  }}
                >
                  {b.range}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.addChildLabel}>Profile Color Accent</Text>
        <View style={styles.addChildColorRow}>
          {['#7C6DF8', '#F59E0B', '#059669', '#EC4899', '#3B82F6', '#8B5CF6'].map((col) => (
            <TouchableOpacity
              key={col}
              onPress={() => setNewChildColor(col)}
              style={[
                styles.addChildColorDot,
                { backgroundColor: col },
                newChildColor === col && styles.addChildColorDotActive,
              ]}
            />
          ))}
        </View>



        <TouchableOpacity
          style={[
            styles.addChildSubmitBtn,
            !newChildName.trim() && { opacity: 0.5 },
          ]}
          disabled={!newChildName.trim()}
          onPress={() => {
            handleSaveNewChild();
            setCurrentScreen('parent_dashboard');
          }}
        >
          <Text style={styles.addChildSubmitBtnText}>Save Child Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderScheduleAutomation = () => (
    <View style={{ flex: 1, backgroundColor: '#FAF8F5' }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: contentBottomPadding }}
        showsVerticalScrollIndicator={false}
      >
        {/* Minimalist Top Header */}
        <View style={{ marginBottom: 18 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#5D997C', letterSpacing: 0.5, textTransform: 'uppercase' }}>
            Widget Settings
          </Text>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#1A2436', marginTop: 2 }}>
            Widget Quick-Select
          </Text>
          <Text style={{ fontSize: 11.5, color: '#718096', marginTop: 2 }}>
            Customize one-tap & quick screen time limits for {activeChild.name}
          </Text>
        </View>

        {/* Phone Widget Quick-Select Times Card */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: '#EAE5DE',
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13.5, fontWeight: '900', color: '#1A2436' }}>
                Phone Widget Times
              </Text>
              <Text style={{ fontSize: 11, color: '#718096', marginTop: 2 }}>
                Options shown when you tap the BabyBoo phone widget
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsWidgetAddedToHome(!isWidgetAddedToHome)}
              activeOpacity={0.8}
              style={{
                backgroundColor: isWidgetAddedToHome ? '#EBF4EF' : '#FAF8F5',
                paddingHorizontal: 9,
                paddingVertical: 5,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: isWidgetAddedToHome ? '#5D997C' : '#EAE5DE',
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '900', color: isWidgetAddedToHome ? '#2D5A43' : '#718096' }}>
                {isWidgetAddedToHome ? '✓ Active on Phone' : '+ Add Widget'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 1-Tap Preset Mode Toggle */}
          <View
            style={{
              backgroundColor: isWidgetDefaultPresetActive ? '#FDF8EC' : '#FAF8F5',
              padding: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: isWidgetDefaultPresetActive ? '#F6C343' : '#EAE5DE',
              marginBottom: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={{ fontSize: 12, fontWeight: '900', color: '#1A2436' }}>
                  1-Tap Instant Start
                </Text>
                <Text style={{ fontSize: 10.5, color: '#718096', marginTop: 2 }}>
                  {isWidgetDefaultPresetActive
                    ? `Starts ${formatWidgetDuration(widgetDefaultPresetMinutes)} immediately without opening menu`
                    : 'Shows your customized time choices in a popup menu'}
                </Text>
              </View>
              <Switch
                value={isWidgetDefaultPresetActive}
                onValueChange={handleToggleDefaultPresetMode}
                trackColor={{ false: '#CBD5E1', true: '#5D997C' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Active Time Options Grid */}
          <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#718096', textTransform: 'uppercase', marginBottom: 6 }}>
            Tap an option to set default (★) or tap ✕ to delete:
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {widgetTimerOptions.map((opt) => {
              const isDefault = isWidgetDefaultPresetActive && opt === widgetDefaultPresetMinutes;
              return (
                <View
                  key={opt}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isDefault ? '#FDF5E6' : '#FAF8F5',
                    borderRadius: 12,
                    borderWidth: 1.2,
                    borderColor: isDefault ? '#F6C343' : '#EAE5DE',
                    paddingLeft: 10,
                    paddingRight: 6,
                    paddingVertical: 6,
                    gap: 6,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      if (!isWidgetDefaultPresetActive) {
                        setIsWidgetDefaultPresetActive(true);
                        setStoredItem(WIDGET_DEFAULT_PRESET_ENABLED_KEY, 'true');
                      }
                      handleSetDefaultPreset(opt);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '900', color: isDefault ? '#8C5E00' : '#1A2436' }}>
                      {isDefault ? '★ ' : ''}{formatWidgetDuration(opt)}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteTimeOption(opt)}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    disabled={widgetTimerOptions.length <= 1}
                    style={{ padding: 2, opacity: widgetTimerOptions.length <= 1 ? 0.3 : 0.7 }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#718096' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Minimalist Add Time Options: Common chips + custom minute input */}
          <View style={{ paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1EFEA', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#94A3B8' }}>Quick Add:</Text>
              {[10, 15, 20, 30, 45, 60].map((m) => {
                const has = widgetTimerOptions.includes(m);
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => !has && handleCreateTimeOption(m)}
                    disabled={has}
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3.5,
                      borderRadius: 8,
                      backgroundColor: has ? '#F1EFEA' : '#EBF4EF',
                      opacity: has ? 0.4 : 1,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '800', color: has ? '#94A3B8' : '#2D5A43' }}>
                      +{m}m
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom Input */}
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <TextInput
                value={customWidgetOptionInput}
                onChangeText={setCustomWidgetOptionInput}
                keyboardType="numeric"
                placeholder="Other minutes (e.g. 25)"
                placeholderTextColor="#A0AEC0"
                style={{
                  flex: 1,
                  backgroundColor: '#FAF8F5',
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#EAE5DE',
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  fontSize: 11.5,
                  fontWeight: '700',
                  color: '#1A2436',
                }}
              />
              <TouchableOpacity
                onPress={() => {
                  const num = parseInt(customWidgetOptionInput.trim(), 10);
                  handleCreateTimeOption(num);
                }}
                activeOpacity={0.8}
                style={{
                  backgroundColor: '#5D997C',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 10,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '900', color: '#FFFFFF' }}>
                  + Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Test Action */}
          <TouchableOpacity
            onPress={() => handleWidgetClick(false)}
            activeOpacity={0.8}
            style={{
              marginTop: 12,
              paddingVertical: 9,
              borderRadius: 12,
              backgroundColor: '#FAF8F5',
              borderWidth: 1,
              borderColor: '#EAE5DE',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#5D997C' }}>
              ▶ Test Widget Action ({isWidgetDefaultPresetActive ? `1-Tap: ${widgetDefaultPresetMinutes}m` : 'Open Menu'})
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />

        {/* Screen Router */}
        {currentScreen === 'splash' && renderSplash()}
        {currentScreen === 'onboarding_assessment' && (
          <OnboardingAssessmentNative
            onComplete={handleOnboardingComplete}
            onNavigateToDashboard={() => setCurrentScreen('parent_dashboard')}
          />
        )}
        {currentScreen === 'parent_dashboard' && renderParentDashboard()}
        {currentScreen === 'schedule_automation' && renderScheduleAutomation()}
        {currentScreen === 'add_child' && renderAddChild()}
        {currentScreen === 'session_setup' && renderSessionSetup()}
        {currentScreen === 'active_session' && renderActiveSession()}
        {currentScreen === 'time_up_warning' && renderTimeUpWarning()}
        {currentScreen === 'shutdown_illusion' && renderShutdownIllusion()}
        {currentScreen === 'post_session_summary' && renderPostSessionSummary()}
        {currentScreen === 'weekly_stats' && renderWeeklyStats()}
        {currentScreen === 'settings' && renderSettings()}

        {/* Shared Bottom Navigation Dock across Home, Schedule, Analytics, Controls & Add Child */}
        {(() => {
          const mainScreens = ['parent_dashboard', 'schedule_automation', 'weekly_stats', 'settings', 'add_child'];
          if (!mainScreens.includes(currentScreen)) return null;

          return (
            <View
              style={{
                position: 'absolute',
                bottom: bottomNavOffset,
                left: 14,
                right: 14,
                height: 64,
                backgroundColor: '#FAF8F5',
                borderRadius: 24,
                borderWidth: 1.5,
                borderColor: '#EAE5DE',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-around',
                paddingHorizontal: 8,
                paddingBottom: 2,
                paddingTop: 2,
                zIndex: 50,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 10,
                elevation: 8,
              }}
            >
              {/* 1. Add Child (First option from left) */}
              <TouchableOpacity
                onPress={() => {
                  setCurrentScreen('add_child');
                }}
                style={{ alignItems: 'center', gap: 3, flex: 1 }}
                accessibilityLabel="Add Child Profile"
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={currentScreen === 'add_child' ? '#5D997C' : '#94A3B8'} strokeWidth={2.2}>
                  <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <Circle cx="9" cy="7" r="4" />
                  <Line x1="19" y1="8" x2="19" y2="14" />
                  <Line x1="22" y1="11" x2="16" y2="11" />
                </Svg>
                <Text style={{ fontSize: 9.5, fontWeight: '800', color: currentScreen === 'add_child' ? '#5D997C' : '#94A3B8' }}>
                  Add Child
                </Text>
              </TouchableOpacity>

              {/* 2. Schedule Automation (Calendar Icon) */}
              <TouchableOpacity
                onPress={() => {
                  setCurrentScreen('schedule_automation');
                }}
                style={{ alignItems: 'center', gap: 3, flex: 1 }}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={currentScreen === 'schedule_automation' ? '#5D997C' : '#94A3B8'} strokeWidth={2.2}>
                  <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <Line x1="16" y1="2" x2="16" y2="6" stroke={currentScreen === 'schedule_automation' ? '#5D997C' : '#94A3B8'} strokeWidth={2.2} />
                  <Line x1="8" y1="2" x2="8" y2="6" stroke={currentScreen === 'schedule_automation' ? '#5D997C' : '#94A3B8'} strokeWidth={2.2} />
                  <Line x1="3" y1="10" x2="21" y2="10" stroke={currentScreen === 'schedule_automation' ? '#5D997C' : '#94A3B8'} strokeWidth={2.2} />
                </Svg>
                <Text style={{ fontSize: 9.5, fontWeight: '800', color: currentScreen === 'schedule_automation' ? '#5D997C' : '#94A3B8' }}>
                  Schedule
                </Text>
              </TouchableOpacity>

              {/* 3. CENTER AGILE BUTTON: Home in the exact center */}
              <TouchableOpacity
                onPress={() => {
                  setActiveNavTab('home');
                  setCurrentScreen('parent_dashboard');
                }}
                style={{ alignItems: 'center', justifyContent: 'center', top: -10 }}
                accessibilityLabel="Home Dashboard"
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: '#5D997C',
                    borderWidth: 2,
                    borderColor: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#5D997C',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.35,
                    shadowRadius: 5,
                    elevation: 4,
                  }}
                >
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="#FFFFFF">
                    <Path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                  </Svg>
                </View>
                <Text style={{ fontSize: 9, fontWeight: '800', color: currentScreen === 'parent_dashboard' ? '#5D997C' : '#94A3B8', marginTop: 2 }}>
                  Home
                </Text>
              </TouchableOpacity>

              {/* 4. Analytics & Insights */}
              <TouchableOpacity
                onPress={() => setCurrentScreen('weekly_stats')}
                style={{ alignItems: 'center', gap: 3, flex: 1 }}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={currentScreen === 'weekly_stats' ? '#5D997C' : '#94A3B8'} strokeWidth={2.2}>
                  <Path d="M18 20V10M12 20V4M6 20v-6" />
                </Svg>
                <Text style={{ fontSize: 9.5, fontWeight: '800', color: currentScreen === 'weekly_stats' ? '#5D997C' : '#94A3B8' }}>
                  Analytics
                </Text>
              </TouchableOpacity>

              {/* 5. Dedicated Settings Button */}
              <TouchableOpacity
                onPress={() => setCurrentScreen('settings')}
                style={{ alignItems: 'center', gap: 3, flex: 1 }}
                accessibilityLabel="Settings"
              >
                <View
                  style={{
                    backgroundColor: currentScreen === 'settings' ? '#EBF4EF' : 'transparent',
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: currentScreen === 'settings' ? '#5D997C' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={currentScreen === 'settings' ? '#5D997C' : '#94A3B8'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <Circle cx="12" cy="12" r="3" />
                  </Svg>
                </View>
                <Text style={{ fontSize: 9.5, fontWeight: '800', color: currentScreen === 'settings' ? '#5D997C' : '#94A3B8' }}>
                  Settings
                </Text>
              </TouchableOpacity>
            </View>
          );
        })()}

        {/* Interactive Add Child Modal */}
        {showAddChildModal ? (
          <Modal transparent animationType="fade" visible={showAddChildModal}>
            <View style={styles.modalBackdrop}>
              <View style={styles.addChildModalCard}>
                <View style={styles.addChildModalHeader}>
                  <Text style={styles.addChildModalTitle}>Add Child Profile</Text>
                  <TouchableOpacity
                    style={styles.addChildModalCloseBtn}
                    onPress={() => setShowAddChildModal(false)}
                  >
                    <Text style={styles.addChildModalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Avatar Preview */}
                <View style={styles.addChildAvatarCenter}>
                  <View style={[styles.addChildAvatarCircle, { backgroundColor: newChildColor }]}>
                    <Text style={styles.addChildAvatarInitial}>
                      {newChildName.trim() ? newChildName.trim().charAt(0).toUpperCase() : 'C'}
                    </Text>
                  </View>
                </View>

                {/* Name Input */}
                <Text style={styles.addChildLabel}>Child's Name</Text>
                <TextInput
                  style={styles.addChildInput}
                  placeholder="e.g. Sam, Noah, Emma"
                  placeholderTextColor="#94A3B8"
                  value={newChildName}
                  onChangeText={setNewChildName}
                  autoFocus
                />

                {/* Wide Range Age Selection Grid */}
                <Text style={styles.addChildLabel}>Age Bracket</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', marginBottom: 6 }}>
                  {AGE_BRACKETS_CONFIG.map((b) => {
                    const isSelected = isAgeBracketSelected(newChildAge, b.id);
                    const isLast = b.id === '14+';
                    return (
                      <TouchableOpacity
                        key={b.id}
                        style={{
                          width: isLast ? '100%' : '31%',
                          paddingVertical: 10,
                          paddingHorizontal: 4,
                          borderRadius: 14,
                          borderWidth: isSelected ? 2 : 1.5,
                          borderColor: isSelected ? '#7C6DF8' : '#E2E8F0',
                          backgroundColor: isSelected ? '#F5F3FF' : '#F8FAFC',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: isLast ? 'row' : 'column',
                          gap: isLast ? 6 : 0,
                        }}
                        onPress={() => setNewChildAge(b.id)}
                      >
                        <Text
                          style={{
                            fontSize: 10.5,
                            fontWeight: isSelected ? '900' : '700',
                            color: isSelected ? '#5438DC' : '#1E293B',
                            textAlign: 'center',
                          }}
                        >
                          {b.label}
                        </Text>
                        <Text
                          style={{
                            fontSize: 9,
                            fontWeight: '600',
                            color: isSelected ? '#7C6DF8' : '#94A3B8',
                            marginTop: isLast ? 0 : 1,
                          }}
                        >
                          {b.range}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Color Palette */}
                <Text style={styles.addChildLabel}>Profile Color Accent</Text>
                <View style={styles.addChildColorRow}>
                  {['#7C6DF8', '#F59E0B', '#059669', '#EC4899', '#3B82F6', '#8B5CF6'].map((col) => (
                    <TouchableOpacity
                      key={col}
                      onPress={() => setNewChildColor(col)}
                      style={[
                        styles.addChildColorDot,
                        { backgroundColor: col },
                        newChildColor === col && styles.addChildColorDotActive,
                      ]}
                    />
                  ))}
                </View>

                {/* Big Eye-Catchy Action Button */}
                <TouchableOpacity
                  style={[
                    styles.addChildSubmitBtn,
                    !newChildName.trim() && { opacity: 0.5 },
                  ]}
                  disabled={!newChildName.trim()}
                  onPress={handleSaveNewChild}
                >
                  <Text style={styles.addChildSubmitBtnText}>Create Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        ) : null}

        {/* Interactive Edit Child Modal */}
        {showEditChildModal ? (
          <Modal transparent animationType="fade" visible={showEditChildModal}>
            <View style={styles.modalBackdrop}>
              <View style={styles.addChildModalCard}>
                <View style={styles.addChildModalHeader}>
                  <Text style={styles.addChildModalTitle}>Edit Child Profile</Text>
                  <TouchableOpacity
                    style={styles.addChildModalCloseBtn}
                    onPress={() => setShowEditChildModal(false)}
                  >
                    <Text style={styles.addChildModalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Avatar Preview */}
                <View style={styles.addChildAvatarCenter}>
                  <View style={[styles.addChildAvatarCircle, { backgroundColor: editChildColor }]}>
                    <Text style={styles.addChildAvatarInitial}>
                      {editChildName.trim() ? editChildName.trim().charAt(0).toUpperCase() : 'C'}
                    </Text>
                  </View>
                </View>

                {/* Name Input with Delete / Clear Button */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 6 }}>
                  <Text style={[styles.addChildLabel, { marginTop: 0, marginBottom: 0 }]}>Child's Name</Text>
                  {editChildName.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setEditChildName('')}
                      style={{ paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#FEE2E2', borderRadius: 6 }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#EF4444' }}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={{ position: 'relative', justifyContent: 'center' }}>
                  <TextInput
                    style={[styles.addChildInput, { paddingRight: 36 }]}
                    placeholder="e.g. Sam, Noah, Emma"
                    placeholderTextColor="#94A3B8"
                    value={editChildName}
                    onChangeText={setEditChildName}
                  />
                  {editChildName.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setEditChildName('')}
                      style={{ position: 'absolute', right: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '900', color: '#64748B' }}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Wide Range Age Selection Grid */}
                <Text style={styles.addChildLabel}>Age Bracket</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', marginBottom: 6 }}>
                  {AGE_BRACKETS_CONFIG.map((b) => {
                    const isSelected = isAgeBracketSelected(editChildAge, b.id);
                    const isLast = b.id === '14+';
                    return (
                      <TouchableOpacity
                        key={b.id}
                        style={{
                          width: isLast ? '100%' : '31%',
                          paddingVertical: 10,
                          paddingHorizontal: 4,
                          borderRadius: 14,
                          borderWidth: isSelected ? 2 : 1.5,
                          borderColor: isSelected ? '#7C6DF8' : '#E2E8F0',
                          backgroundColor: isSelected ? '#F5F3FF' : '#F8FAFC',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: isLast ? 'row' : 'column',
                          gap: isLast ? 6 : 0,
                        }}
                        onPress={() => setEditChildAge(b.id)}
                      >
                        <Text
                          style={{
                            fontSize: 10.5,
                            fontWeight: isSelected ? '900' : '700',
                            color: isSelected ? '#5438DC' : '#1E293B',
                            textAlign: 'center',
                          }}
                        >
                          {b.label}
                        </Text>
                        <Text
                          style={{
                            fontSize: 9,
                            fontWeight: '600',
                            color: isSelected ? '#7C6DF8' : '#94A3B8',
                            marginTop: isLast ? 0 : 1,
                          }}
                        >
                          {b.range}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Color Palette */}
                <Text style={styles.addChildLabel}>Profile Color Accent</Text>
                <View style={styles.addChildColorRow}>
                  {['#7C6DF8', '#F59E0B', '#059669', '#EC4899', '#3B82F6', '#8B5CF6'].map((col) => (
                    <TouchableOpacity
                      key={col}
                      onPress={() => setEditChildColor(col)}
                      style={[
                        styles.addChildColorDot,
                        { backgroundColor: col },
                        editChildColor === col && styles.addChildColorDotActive,
                      ]}
                    />
                  ))}
                </View>

                {/* Delete Child Profile Section */}
                <View
                  style={{
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: '#F1F5F9',
                    marginTop: 8,
                    marginBottom: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#EF4444' }}>
                      Delete Child Profile
                    </Text>
                    <Text style={{ fontSize: 9.5, color: '#94A3B8' }}>
                      Permanently remove {editChildName || 'child'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteChild(editChildId)}
                    style={{
                      backgroundColor: '#FEE2E2',
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: '#FECACA',
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '900', color: '#DC2626' }}>
                      Delete Profile
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Save Changes Button */}
                <TouchableOpacity
                  style={[
                    styles.addChildSubmitBtn,
                    !editChildName.trim() && { opacity: 0.5 },
                  ]}
                  disabled={!editChildName.trim()}
                  onPress={handleSaveEditChild}
                >
                  <Text style={styles.addChildSubmitBtnText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        ) : null}

        {/* Parent Pattern Lock Modal Gate */}
        {showPatternModal ? (
          <Modal transparent animationType="slide" visible={showPatternModal}>
            <View style={styles.modalBackdrop}>
              <View style={styles.patternModalCard}>
                <Text style={styles.patternModalTitle}>Parent Authentication</Text>
                <Text style={styles.patternModalSub}>Draw pattern or enter PIN (1234)</Text>

                <PatternLockNative
                  onComplete={handlePatternVerify}
                  onPinSuccess={() => {
                    setShowPatternModal(false);
                    if (patternSuccessCallback) patternSuccessCallback();
                  }}
                  onBypass={() => {
                    setShowPatternModal(false);
                    if (patternSuccessCallback) patternSuccessCallback();
                  }}
                  error={patternError}
                />

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowPatternModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        ) : null}

        {/* Custom Countdown / Grace Adjuster Modal for Parents */}
        {/* Custom Countdown / Grace Adjuster Modal for Parents (Direct Keyboard Input) */}
        {showCustomGraceModal ? (
          <Modal transparent animationType="fade" visible={showCustomGraceModal}>
            <View style={styles.modalBackdrop}>
              <View style={[styles.addChildModalCard, { maxWidth: 320, padding: 22 }]}>
                <View style={styles.addChildModalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.addChildModalTitle}>Custom Countdown</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.addChildModalCloseBtn}
                    onPress={() => setShowCustomGraceModal(false)}
                  >
                    <Text style={styles.addChildModalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4, marginBottom: 14 }}>
                  Type the exact number of seconds you want Buddy to count down:
                </Text>

                {/* Direct Keyboard Number Input */}
                <View style={{ position: 'relative', justifyContent: 'center', marginBottom: 18 }}>
                  <TextInput
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderWidth: 2,
                      borderColor: '#F59E0B',
                      borderRadius: 16,
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      fontSize: 32,
                      fontWeight: '900',
                      color: '#B45309',
                      textAlign: 'center',
                      fontFamily: 'monospace',
                    }}
                    keyboardType="number-pad"
                    autoFocus
                    placeholder="45"
                    placeholderTextColor="#CBD5E1"
                    value={customGraceInput ? String(customGraceInput) : ''}
                    onChangeText={(text) => {
                      const val = parseInt(text.replace(/[^0-9]/g, ''), 10);
                      setCustomGraceInput(isNaN(val) ? 0 : val);
                    }}
                  />
                  <Text style={{ position: 'absolute', right: 16, fontSize: 12, fontWeight: '900', color: '#B45309' }}>
                    sec
                  </Text>
                </View>

                {/* Actions */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setShowCustomGraceModal(false)}
                    style={{ flex: 1, paddingVertical: 13, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center' }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#64748B' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={!customGraceInput || customGraceInput < 5}
                    onPress={() => {
                      if (customGraceInput >= 5) {
                        setGraceSeconds(customGraceInput);
                        setShowCustomGraceModal(false);
                      }
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 13,
                      borderRadius: 14,
                      backgroundColor: customGraceInput >= 5 ? '#F59E0B' : '#FDE68A',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '900', color: '#1E1B4B' }}>
                      Apply {customGraceInput ? `${customGraceInput}s` : ''}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        ) : null}

        {/* Quick Screen Time Widget Configuration Modal - Pure Timer Option */}
        {showQuickWidgetModal ? (
          <Modal transparent animationType="fade" visible={showQuickWidgetModal}>
            <View style={styles.modalBackdrop}>
              <View style={[styles.addChildModalCard, { maxWidth: 330, padding: 20 }]}>
                <View style={styles.addChildModalHeader}>
                  <Text style={styles.addChildModalTitle}>Set Widget Timer</Text>
                  <TouchableOpacity
                    style={styles.addChildModalCloseBtn}
                    onPress={() => setShowQuickWidgetModal(false)}
                  >
                    <Text style={styles.addChildModalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 11.5, color: '#717A91', marginTop: 3, marginBottom: 12 }}>
                  Set duration for phone usage in hours and minutes:
                </Text>

                {/* Quick Presets */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
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
                      <TouchableOpacity
                        key={preset.label}
                        onPress={() => {
                          setTempWidgetHours(preset.h);
                          setTempWidgetMinutes(preset.m);
                        }}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 7,
                          borderRadius: 10,
                          backgroundColor: isMatch ? '#5D997C' : '#FAF8F5',
                          borderWidth: 1,
                          borderColor: isMatch ? '#5D997C' : '#EAE5DE',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11.5,
                            fontWeight: '900',
                            color: isMatch ? '#FFFFFF' : '#4A5568',
                          }}
                        >
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Dual Stepper: Hours and Minutes */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  {/* Hours */}
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: '#FAF8F5',
                      padding: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#EAE5DE',
                    }}
                  >
                    <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#718096', textTransform: 'uppercase', marginBottom: 6 }}>
                      Hours
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <TouchableOpacity
                        onPress={() => setTempWidgetHours((h) => Math.max(0, h - 1))}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          backgroundColor: '#EAE5DE',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 15, fontWeight: '900', color: '#1A2436' }}>-</Text>
                      </TouchableOpacity>
                      <Text style={{ fontSize: 15, fontWeight: '900', color: '#1A2436' }}>
                        {tempWidgetHours}h
                      </Text>
                      <TouchableOpacity
                        onPress={() => setTempWidgetHours((h) => Math.min(8, h + 1))}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          backgroundColor: '#EAE5DE',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 15, fontWeight: '900', color: '#1A2436' }}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Minutes */}
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: '#FAF8F5',
                      padding: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#EAE5DE',
                    }}
                  >
                    <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#718096', textTransform: 'uppercase', marginBottom: 6 }}>
                      Minutes
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <TouchableOpacity
                        onPress={() => setTempWidgetMinutes((m) => Math.max(0, m - 5))}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          backgroundColor: '#EAE5DE',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 15, fontWeight: '900', color: '#1A2436' }}>-</Text>
                      </TouchableOpacity>
                      <Text style={{ fontSize: 15, fontWeight: '900', color: '#1A2436' }}>
                        {tempWidgetMinutes}m
                      </Text>
                      <TouchableOpacity
                        onPress={() => setTempWidgetMinutes((m) => Math.min(55, m + 5))}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          backgroundColor: '#EAE5DE',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 15, fontWeight: '900', color: '#1A2436' }}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Explanation Banner */}
                <View style={{ backgroundColor: '#EBF4EF', padding: 10, borderRadius: 10, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(93, 153, 124, 0.3)' }}>
                  <Text style={{ fontSize: 11, color: '#2D5A43', lineHeight: 15, textAlign: 'center' }}>
                    Phone usage duration: <Text style={{ fontWeight: '900', color: '#1A2436' }}>
                      {tempWidgetHours === 0 && tempWidgetMinutes === 0
                        ? '15 min (minimum)'
                        : `${tempWidgetHours > 0 ? `${tempWidgetHours} hr ` : ''}${tempWidgetMinutes} min`}
                    </Text>
                    {' '}(Total: {Math.max(5, tempWidgetHours * 60 + tempWidgetMinutes)}m)
                  </Text>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  style={[styles.addChildSubmitBtn, { marginTop: 0 }]}
                  onPress={() => {
                    const total = Math.max(5, tempWidgetHours * 60 + tempWidgetMinutes);
                    setQuickWidgetMinutes(total);
                    setIsWidgetAddedToHome(true);
                    setShowQuickWidgetModal(false);
                    setCurrentScreen('parent_dashboard');
                  }}
                >
                  <Text style={styles.addChildSubmitBtnText}>
                    {isWidgetAddedToHome ? 'Save Timer & View on Home Screen' : 'Add Widget to Home Screen'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        ) : null}

        {/* 1. Interactive Widget Quick-Select Times Modal / Overlay */}
        {showWidgetQuickSelectModal ? (
          <Modal transparent animationType="fade" visible={showWidgetQuickSelectModal}>
            <View style={styles.modalBackdrop}>
              <View style={[styles.addChildModalCard, { maxWidth: 350, padding: 20 }]}>
                {/* Header */}
                <View style={styles.addChildModalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        backgroundColor: '#EBF4EF',
                        borderWidth: 1,
                        borderColor: '#5D997C',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#5D997C" strokeWidth={2.2}>
                        <Circle cx="12" cy="12" r="10" />
                        <Polyline points="12 6 12 12 16 14" />
                      </Svg>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.addChildModalTitle}>Start Screen Time</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 }}>
                        <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#5D997C' }}>
                          {activeChild.name}
                        </Text>
                        <Text style={{ fontSize: 10, color: '#94A3B8' }}>•</Text>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#B45309' }}>
                          5 🔥 Day Streak
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.addChildModalCloseBtn}
                    onPress={() => setShowWidgetQuickSelectModal(false)}
                    accessibilityLabel="Close overlay"
                  >
                    <Text style={styles.addChildModalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 11.5, color: '#64748B', marginTop: 4, marginBottom: 12 }}>
                  Tap any time limit to immediately start phone screen time:
                </Text>

                {/* Options Grid */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {widgetTimerOptions.map((opt) => {
                    const isDefault = isWidgetDefaultPresetActive && opt === widgetDefaultPresetMinutes;
                    return (
                      <TouchableOpacity
                        key={opt}
                        activeOpacity={0.82}
                        onPress={() => {
                          setShowWidgetQuickSelectModal(false);
                          startNewSession(opt);
                        }}
                        style={{
                          flexBasis: widgetTimerOptions.length <= 4 ? '48%' : '31%',
                          flexGrow: 1,
                          backgroundColor: isDefault ? '#FDF5E6' : '#FAF8F5',
                          borderRadius: 14,
                          paddingVertical: 12,
                          paddingHorizontal: 10,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1.5,
                          borderColor: isDefault ? '#F6C343' : '#EAE5DE',
                        }}
                      >
                        {isDefault && (
                          <View
                            style={{
                              backgroundColor: '#F6C343',
                              paddingHorizontal: 6,
                              paddingVertical: 1.5,
                              borderRadius: 5,
                              marginBottom: 4,
                            }}
                          >
                            <Text style={{ fontSize: 8, fontWeight: '900', color: '#452B00' }}>
                              ★ DEFAULT PRESET
                            </Text>
                          </View>
                        )}
                        <Text style={{ fontSize: 16, fontWeight: '900', color: '#1A2436' }}>
                          {formatWidgetDuration(opt)}
                        </Text>
                        <Text style={{ fontSize: 9.5, color: '#718096', marginTop: 2 }}>
                          Tap to start
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Optional Action Shortcuts */}
                {(widgetIncludeCustom || widgetIncludeLock) && (
                  <View style={{ gap: 6, marginBottom: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EAE5DE' }}>
                    {widgetIncludeCustom && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          setShowWidgetQuickSelectModal(false);
                          openEditWidgetModal();
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          backgroundColor: '#FAF8F5',
                          borderRadius: 12,
                          paddingVertical: 9,
                          borderWidth: 1,
                          borderColor: '#EAE5DE',
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#475569' }}>
                          ⌨️ Other Custom Duration...
                        </Text>
                      </TouchableOpacity>
                    )}

                    {widgetIncludeLock && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          setShowWidgetQuickSelectModal(false);
                          setCurrentScreen('shutdown_illusion');
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          backgroundColor: '#FFF5F5',
                          borderRadius: 12,
                          paddingVertical: 9,
                          borderWidth: 1,
                          borderColor: '#FEB2B2',
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#C53030' }}>
                          🔒 Lock Phone Screen Immediately
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Footer Link to Customize Options */}
                <View style={{ alignItems: 'center', paddingTop: 6, borderTopWidth: 1, borderTopColor: '#EAE5DE' }}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowWidgetQuickSelectModal(false);
                      setCurrentScreen('schedule_automation');
                    }}
                    style={{ paddingVertical: 4 }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#5D997C' }}>
                      ⚙️ Customize Options & Default Preset →
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        ) : null}

        {/* 2. Edit Widget Time Option Modal */}
        {showEditOptionModal && editingOptionOriginalMinutes ? (
          <Modal transparent animationType="fade" visible={showEditOptionModal}>
            <View style={styles.modalBackdrop}>
              <View style={[styles.addChildModalCard, { maxWidth: 330, padding: 20 }]}>
                <View style={styles.addChildModalHeader}>
                  <Text style={styles.addChildModalTitle}>Edit Widget Time Limit</Text>
                  <TouchableOpacity
                    style={styles.addChildModalCloseBtn}
                    onPress={() => {
                      setShowEditOptionModal(false);
                      setEditingOptionOriginalMinutes(null);
                    }}
                  >
                    <Text style={styles.addChildModalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 11.5, color: '#718096', marginTop: 3, marginBottom: 12 }}>
                  Modify the {editingOptionOriginalMinutes}-minute option to any duration:
                </Text>

                {/* Numeric Input */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
                  <TouchableOpacity
                    onPress={() => {
                      const cur = parseInt(editingOptionNewMinutes, 10) || editingOptionOriginalMinutes || 15;
                      setEditingOptionNewMinutes(String(Math.max(5, cur - 5)));
                    }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: '#EAE5DE',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A2436' }}>-</Text>
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                    <TextInput
                      value={editingOptionNewMinutes}
                      onChangeText={setEditingOptionNewMinutes}
                      keyboardType="numeric"
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: '#5D997C',
                        paddingHorizontal: 16,
                        paddingVertical: 6,
                        fontSize: 22,
                        fontWeight: '900',
                        color: '#1A2436',
                        textAlign: 'center',
                        minWidth: 80,
                      }}
                    />
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#718096' }}>mins</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      const cur = parseInt(editingOptionNewMinutes, 10) || editingOptionOriginalMinutes || 15;
                      setEditingOptionNewMinutes(String(Math.min(360, cur + 5)));
                    }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: '#EAE5DE',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A2436' }}>+</Text>
                  </TouchableOpacity>
                </View>

                {/* Quick Presets for editing */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                  {[10, 15, 20, 30, 45, 60, 90, 120].map((m) => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setEditingOptionNewMinutes(String(m))}
                      style={{
                        paddingHorizontal: 9,
                        paddingVertical: 5,
                        borderRadius: 8,
                        backgroundColor: editingOptionNewMinutes === String(m) ? '#5D997C' : '#FAF8F5',
                        borderWidth: 1,
                        borderColor: editingOptionNewMinutes === String(m) ? '#5D997C' : '#EAE5DE',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10.5,
                          fontWeight: '800',
                          color: editingOptionNewMinutes === String(m) ? '#FFFFFF' : '#475569',
                        }}
                      >
                        {formatWidgetDuration(m)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.addChildCancelBtn, { flex: 1 }]}
                    onPress={() => {
                      setShowEditOptionModal(false);
                      setEditingOptionOriginalMinutes(null);
                    }}
                  >
                    <Text style={styles.addChildCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.addChildSubmitBtn, { flex: 1, marginTop: 0 }]}
                    onPress={handleSaveEditedOption}
                  >
                    <Text style={styles.addChildSubmitBtnText}>Save Option</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        ) : null}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  exactDashboardContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 84,
    backgroundColor: '#FAF8F5',
  },
  exactTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  exactUserGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exactAvatarWrapper: {
    position: 'relative',
  },
  exactAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5D997C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  exactAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  exactStarPerch: {
    position: 'absolute',
    top: -4,
    left: -2,
    fontSize: 14,
    color: '#FBBF24',
  },
  exactGreetingColumn: {},
  exactGreetingSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
  },
  exactGreetingTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#1A2436',
    letterSpacing: -0.5,
    marginTop: 1,
  },
  exactSettingsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE5DE',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  exactSettingsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A5568',
  },
  exactHeroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EBF4EF',
    borderRadius: 26,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(93, 153, 124, 0.3)',
    overflow: 'visible',
  },
  exactPeacefulBadge: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EAE5DE',
  },
  exactPeacefulBadgeText: {
    color: '#2D5A43',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  exactHeroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A2436',
    lineHeight: 24,
  },
  exactHeroSub: {
    fontSize: 11,
    color: '#718096',
    lineHeight: 15,
    marginTop: 8,
  },
  exactMascotCircleHalo: {
    width: 116,
    height: 116,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  exactBuddyPos: {
    position: 'absolute',
    top: -12,
    left: -29,
    right: -16,
    bottom: -10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  exactSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  exactSectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1A2436',
    letterSpacing: 0.6,
  },
  exactAddChildLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5D997C',
  },
  exactChildCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  exactChildCardsScrollContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 10,
    marginBottom: 20,
  },
  exactChildCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EAE5DE',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  exactChildCardFlex: {
    flex: 1,
  },
  exactChildCardScrollItem: {
    minWidth: 165,
    maxWidth: 205,
  },
  exactChildCardActive: {
    borderColor: '#5D997C',
    backgroundColor: '#EBF4EF',
  },
  exactChildAvatarWrapper: {
    position: 'relative',
  },
  exactChildAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exactChildAvatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  exactMiniStarPerch: {
    position: 'absolute',
    top: -4,
    right: -2,
    fontSize: 10,
    color: '#FBBF24',
  },
  exactChildCardName: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1A2436',
  },
  exactChildCardSub: {
    fontSize: 9.5,
    color: '#718096',
    marginTop: 1,
  },
  exactActiveCheckCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#5D997C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exactActiveCheckText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  exactTargetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EAE5DE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  exactTargetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exactTargetBadge: {
    backgroundColor: '#EBF4EF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  exactTargetBadgeText: {
    color: '#2D5A43',
    fontSize: 9,
    fontWeight: '900',
  },
  exactStreakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exactFlameEmoji: {
    fontSize: 12,
  },
  exactStreakPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#718096',
  },
  exactTargetCleanTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 12,
  },
  exactTargetMinutesText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#5D997C',
  },
  exactTargetGatedText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A2436',
  },
  exactLaunchBtn: {
    backgroundColor: '#5D997C',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 4,
  },
  exactLaunchBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  exactPresetSectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#1A2436',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  exactPresetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  exactPresetCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE5DE',
  },
  exactPresetIconWrapper: {
    marginBottom: 6,
  },
  exactPresetTimeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1A2436',
  },
  exactPresetSubText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#718096',
    marginTop: 2,
  },
  exactBottomMetricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  exactComplianceCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EAE5DE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  exactWeeklyLogsCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EAE5DE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  exactCardHeaderSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  exactComplianceLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#718096',
    letterSpacing: 0.4,
  },
  exactWeeklyLogsLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#718096',
    letterSpacing: 0.4,
  },
  exactComplianceValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  exactComplianceNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#5D997C',
  },
  exactComplianceSub: {
    fontSize: 9.5,
    color: '#718096',
    marginTop: 2,
  },
  exactViewBreakdownLink: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#5D997C',
    marginTop: 2,
    marginBottom: 6,
  },
  exactMiniBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 28,
  },
  exactMiniBarCol: {
    alignItems: 'center',
    gap: 3,
  },
  exactMiniBarFill: {
    width: 6,
    backgroundColor: '#89B6D8',
    borderRadius: 3,
  },
  exactMiniBarDayText: {
    fontSize: 8,
    color: '#94A3B8',
    fontWeight: '700',
  },
  exactBottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 68,
    backgroundColor: '#FAF8F5',
    borderTopWidth: 1,
    borderTopColor: '#EAE5DE',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 6,
  },
  exactNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    position: 'relative',
    width: 60,
  },
  exactNavItemText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  exactNavItemTextActive: {
    color: '#5D997C',
    fontWeight: '900',
  },
  exactNavUnderline: {
    position: 'absolute',
    bottom: -6,
    width: 20,
    height: 3,
    backgroundColor: '#5D997C',
    borderRadius: 1.5,
  },

  // Fallback screen styles
  screenContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
  },
  scrollContent: {
    padding: 20,
    backgroundColor: '#FAF8F5',
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogo: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    backgroundColor: '#5D997C',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  brandText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A2436',
  },
  skipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#718096',
  },
  centerContent: {
    alignItems: 'center',
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A2436',
    textAlign: 'center',
    marginTop: 16,
  },
  slideDesc: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
    marginTop: 8,
  },
  primaryBtn: {
    backgroundColor: '#5D997C',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBackText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5D997C',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A2436',
  },
  setupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EAE5DE',
    marginBottom: 14,
  },
  setupLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A2436',
    marginBottom: 12,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAE5DE',
  },
  presetChipActive: {
    backgroundColor: '#5D997C',
    borderColor: '#5D997C',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A5568',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  startBigBtn: {
    backgroundColor: '#5D997C',
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
  },
  startBigBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  activeContainer: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'space-between',
  },
  activeTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  activeChildName: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  ambientTimerPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ambientTimerText: {
    color: '#FFFFFF',
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  lockIconBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#1E293B',
    borderRadius: 10,
  },
  lockIconBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  cue80Banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6D878',
    margin: 12,
    padding: 10,
    borderRadius: 20,
    gap: 10,
  },
  cue80Title: {
    color: '#78350F',
    fontWeight: '900',
  },
  kidScreenArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartoonBig: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  demoSpeedBar: {
    padding: 16,
    alignItems: 'center',
  },
  jumpBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  jumpBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  warningContainer: {
    flex: 1,
    backgroundColor: '#FEF9E7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  warningTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#78350F',
    marginTop: 12,
  },
  graceSecondsText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#78350F',
    marginVertical: 12,
  },
  voluntaryPutDownBtn: {
    backgroundColor: '#5D997C',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  voluntaryPutDownText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  illusionContainer: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
  },
  systemAlertCard: {
    backgroundColor: '#1E293B',
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  systemAlertTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  systemAlertText: {
    color: '#94A3B8',
    marginTop: 4,
  },
  finishRestBtn: {
    marginTop: 20,
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  finishRestText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A2436',
    marginBottom: 12,
  },
  debriefTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A2436',
    marginTop: 12,
  },
  chartBox: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#EAE5DE',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A2436',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 36, 54, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  patternModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    width: '90%',
    borderWidth: 1,
    borderColor: '#EAE5DE',
  },
  patternModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A2436',
  },
  patternModalSub: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
    marginBottom: 12,
  },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: '#718096',
    fontSize: 13,
    fontWeight: '700',
  },
  exactAddChildButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4EF',
    borderWidth: 1,
    borderColor: '#5D997C',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 4,
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  exactAddChildButtonPlus: {
    fontSize: 14,
    fontWeight: '900',
    color: '#5D997C',
    lineHeight: 16,
  },
  exactAddChildButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5D997C',
  },
  addChildModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    width: '92%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: '#EAE5DE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  addChildModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addChildModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A2436',
  },
  addChildModalCloseBtn: {
    padding: 6,
  },
  addChildModalCloseText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#718096',
  },
  addChildAvatarCenter: {
    alignItems: 'center',
    marginVertical: 10,
  },
  addChildAvatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  addChildAvatarInitial: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  addChildLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#718096',
    marginTop: 10,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addChildInput: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#EAE5DE',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A2436',
    fontWeight: '700',
  },
  addChildAgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addChildAgeBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EAE5DE',
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
  },
  addChildAgeBtnActive: {
    borderColor: '#5D997C',
    backgroundColor: '#EBF4EF',
  },
  addChildAgeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#718096',
  },
  addChildAgeBtnTextActive: {
    color: '#2D5A43',
    fontWeight: '900',
  },
  addChildColorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginVertical: 4,
  },
  addChildColorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  addChildColorDotActive: {
    borderWidth: 3,
    borderColor: '#1A2436',
    transform: [{ scale: 1.15 }],
  },
  addChildSubmitBtn: {
    backgroundColor: '#5D997C',
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addChildSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  addChildCardFullScreen: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EAE5DE',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 36, 54, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalDialogDark: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#EAE5DE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE5DE',
  },
  modalHeaderTitleDark: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1A2436',
    letterSpacing: -0.2,
  },
  modalCloseXDark: {
    fontSize: 18,
    fontWeight: '800',
    color: '#718096',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  modalHeaderSub: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  monsterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAE5DE',
    marginBottom: 8,
  },
  monsterCardSelected: {
    backgroundColor: '#EBF4EF',
    borderColor: '#5D997C',
    borderWidth: 2,
  },
  modalApplyBtn: {
    backgroundColor: '#5D997C',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  modalApplyBtnPurple: {
    backgroundColor: '#5D997C',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  modalApplyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
