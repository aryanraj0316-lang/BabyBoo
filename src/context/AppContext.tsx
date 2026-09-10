import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import type {
  ChildProfile,
  ComplianceOutcome,
  DeviceFrameType,
  ScreenName,
  SessionConfig,
  SessionLog,
  SessionStatus,
  UserAccount,
} from '../types';
import {
  loadStoredChildren,
  loadStoredLogs,
  loadStoredUser,
  saveStoredChildren,
  saveStoredLogs,
  saveStoredUser,
  isStoredOnboardingCompleted,
  setStoredOnboardingCompleted,
  DEMO_CHILDREN,
} from '../utils/storage';
import { soundEngine } from '../utils/audio';

interface ActiveSessionState {
  config: SessionConfig | null;
  status: SessionStatus;
  totalSeconds: number;
  remainingSeconds: number;
  elapsedSeconds: number;
  graceRemainingSeconds: number;
  outcome: ComplianceOutcome | null;
}

interface AppContextType {
  currentScreen: ScreenName;
  navigateTo: (screen: ScreenName) => void;
  user: UserAccount;
  setUser: React.Dispatch<React.SetStateAction<UserAccount>>;
  childrenList: ChildProfile[];
  activeChild: ChildProfile;
  selectChild: (id: string) => void;
  addChild: (profile: Omit<ChildProfile, 'id' | 'streakDays' | 'totalSessions' | 'voluntaryStops'>) => void;
  updateChild: (profile: ChildProfile) => void;
  deleteChild: (id: string) => void;
  sessionLogs: SessionLog[];
  activeSession: ActiveSessionState;
  simulationSpeed: number;
  setSimulationSpeed: (speed: number) => void;
  deviceFrame: DeviceFrameType;
  setDeviceFrame: (frame: DeviceFrameType) => void;
  startSession: (config: SessionConfig) => void;
  endSessionEarly: () => void;
  childPutPhoneDown: () => void;
  gracePeriodElapsed: () => void;
  finishShutdown: () => void;
  verifyPattern: (pattern: number[]) => boolean;
  updatePattern: (pattern: number[]) => void;
  togglePremium: (premium?: boolean) => void;
  isAudioMuted: boolean;
  toggleAudioMute: () => void;
  quickWidgetMinutes: number;
  setQuickWidgetMinutes: (m: number) => void;
  isWidgetAddedToHome: boolean;
  setIsWidgetAddedToHome: (b: boolean) => void;
  completeOnboarding: (profile?: { name?: string; ageGroup?: any; dailyMinutes?: number; preferredStyle?: any }) => void;
  loadDemoProfiles: () => void;
  resetOnboarding: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>(() => {
    return isStoredOnboardingCompleted() ? 'parent_dashboard' : 'onboarding_assessment';
  });
  const [user, setUser] = useState<UserAccount>(loadStoredUser);
  const [childrenList, setChildrenList] = useState<ChildProfile[]>(() => {
    const loaded = loadStoredChildren();
    if (loaded.length > 0) return loaded;
    return isStoredOnboardingCompleted() ? [] : [];
  });
  const [activeChildId, setActiveChildId] = useState<string>(() => childrenList[0]?.id || 'child_1');
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>(loadStoredLogs);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [deviceFrame, setDeviceFrame] = useState<DeviceFrameType>('iphone');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  // Quick Screen Time Widget State (Reflecting Actual Data)
  const [quickWidgetMinutes, setQuickWidgetMinutes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('babyboo_quick_widget_minutes');
      return saved ? parseInt(saved, 10) : 15;
    } catch {
      return 15;
    }
  });

  const [isWidgetAddedToHome, setIsWidgetAddedToHome] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('babyboo_widget_on_home');
      return saved === 'true'; // Actual data
    } catch {
      return false; // Actual data: not added initially
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('babyboo_quick_widget_minutes', quickWidgetMinutes.toString());
      localStorage.setItem('babyboo_widget_on_home', isWidgetAddedToHome.toString());
    } catch {}
  }, [quickWidgetMinutes, isWidgetAddedToHome]);

  const [activeSession, setActiveSession] = useState<ActiveSessionState>({
    config: null,
    status: 'idle',
    totalSeconds: 0,
    remainingSeconds: 0,
    elapsedSeconds: 0,
    graceRemainingSeconds: 0,
    outcome: null,
  });

  const timerRef = useRef<number | null>(null);
  const hasTriggered80Cue = useRef<boolean>(false);

  // Sync to storage
  useEffect(() => {
    saveStoredUser(user);
  }, [user]);

  useEffect(() => {
    saveStoredChildren(childrenList);
  }, [childrenList]);

  useEffect(() => {
    saveStoredLogs(sessionLogs);
  }, [sessionLogs]);

  const activeChild = childrenList.find((c) => c.id === activeChildId) || childrenList[0] || {
    id: 'child_1',
    name: 'Buddy',
    ageGroup: '2-5',
    avatar: '⭐',
    dailyLimitMinutes: 15,
    defaultGraceSeconds: 60,
    preferredStyle: 'low_battery',
    streakDays: 1,
    totalSessions: 1,
    voluntaryStops: 1,
  };

  const navigateTo = (screen: ScreenName) => {
    setCurrentScreen(screen);
  };

  const selectChild = (id: string) => {
    setActiveChildId(id);
  };

  const addChild = (profile: Omit<ChildProfile, 'id' | 'streakDays' | 'totalSessions' | 'voluntaryStops'>) => {
    const newChild: ChildProfile = {
      ...profile,
      id: `child_${Date.now()}`,
      streakDays: 1,
      totalSessions: 0,
      voluntaryStops: 0,
    };
    const updated = [...childrenList, newChild];
    setChildrenList(updated);
    setActiveChildId(newChild.id);
  };

  const updateChild = (profile: ChildProfile) => {
    setChildrenList((prev) => prev.map((c) => (c.id === profile.id ? profile : c)));
  };

  const deleteChild = (id: string) => {
    const remaining = childrenList.filter((c) => c.id !== id);
    setChildrenList(remaining);
    saveStoredChildren(remaining);
    if (activeChildId === id) {
      setActiveChildId(remaining[0]?.id || 'child_1');
    }
  };

  const completeOnboarding = (profile?: { name?: string; ageGroup?: any; dailyMinutes?: number; preferredStyle?: any }) => {
    const name = profile?.name?.trim() || 'My Child';
    const newChild: ChildProfile = {
      id: `child_${Date.now()}`,
      name,
      ageGroup: profile?.ageGroup || '2-5',
      avatar: name.charAt(0).toUpperCase() || 'C',
      dailyLimitMinutes: profile?.dailyMinutes || 20,
      defaultGraceSeconds: 60,
      preferredStyle: profile?.preferredStyle || 'low_battery',
      streakDays: 1,
      totalSessions: 0,
      voluntaryStops: 0,
    };
    setChildrenList([newChild]);
    setActiveChildId(newChild.id);
    saveStoredChildren([newChild]);
    setStoredOnboardingCompleted(true);
    setCurrentScreen('parent_dashboard');
  };

  const loadDemoProfiles = () => {
    setChildrenList(DEMO_CHILDREN);
    setActiveChildId(DEMO_CHILDREN[0].id);
    saveStoredChildren(DEMO_CHILDREN);
    setStoredOnboardingCompleted(true);
  };

  const resetOnboarding = () => {
    setStoredOnboardingCompleted(false);
    setCurrentScreen('onboarding_assessment');
  };

  const verifyPattern = (pattern: number[]): boolean => {
    if (!user.patternLock || user.patternLock.length === 0) return true;
    if (pattern.length !== user.patternLock.length) return false;
    return pattern.every((val, idx) => val === user.patternLock[idx]);
  };

  const updatePattern = (pattern: number[]) => {
    setUser((prev) => ({ ...prev, patternLock: pattern }));
  };

  const togglePremium = (premium?: boolean) => {
    setUser((prev) => ({ ...prev, isPremium: premium !== undefined ? premium : !prev.isPremium }));
  };

  const toggleAudioMute = () => {
    const next = !isAudioMuted;
    setIsAudioMuted(next);
    soundEngine.setMuted(next);
  };

  // Start Session
  const startSession = (config: SessionConfig) => {
    const totalSecs = config.durationMinutes * 60;
    hasTriggered80Cue.current = false;

    setActiveSession({
      config,
      status: 'running',
      totalSeconds: totalSecs,
      remainingSeconds: totalSecs,
      elapsedSeconds: 0,
      graceRemainingSeconds: config.gracePeriodSeconds,
      outcome: null,
    });

    navigateTo('active_session');
  };

  // Main active session ticker loop
  useEffect(() => {
    if (activeSession.status === 'running' || activeSession.status === 'warning_80') {
      const intervalMs = 1000 / simulationSpeed;
      timerRef.current = window.setInterval(() => {
        setActiveSession((prev) => {
          if (prev.remainingSeconds <= 1) {
            soundEngine.playTimeUpChime();
            navigateTo('time_up_warning');
            return {
              ...prev,
              status: 'time_up_grace',
              remainingSeconds: 0,
              elapsedSeconds: prev.totalSeconds,
            };
          }

          const nextRemaining = prev.remainingSeconds - 1;
          const nextElapsed = prev.elapsedSeconds + 1;
          const progressPercent = (nextElapsed / prev.totalSeconds) * 100;

          let nextStatus: SessionStatus = prev.status;
          if (progressPercent >= 80 && !hasTriggered80Cue.current) {
            hasTriggered80Cue.current = true;
            nextStatus = 'warning_80';
            soundEngine.playSoftAmbientChime();
          }

          return {
            ...prev,
            status: nextStatus,
            remainingSeconds: nextRemaining,
            elapsedSeconds: nextElapsed,
          };
        });
      }, intervalMs);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else if (activeSession.status === 'time_up_grace') {
      const intervalMs = 1000 / simulationSpeed;
      timerRef.current = window.setInterval(() => {
        setActiveSession((prev) => {
          if (prev.graceRemainingSeconds <= 1) {
            soundEngine.playPowerDownHum();
            navigateTo('shutdown_illusion');
            return {
              ...prev,
              status: 'shutdown_active',
              graceRemainingSeconds: 0,
              outcome: 'required_shutdown',
            };
          }

          return {
            ...prev,
            graceRemainingSeconds: prev.graceRemainingSeconds - 1,
          };
        });
      }, intervalMs);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [activeSession.status, simulationSpeed]);

  const childPutPhoneDown = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    soundEngine.playSuccessFanfare();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#38BDF8', '#F59E0B', '#34D399', '#FB7185', '#A78BFA'],
    });

    const newLog: SessionLog = {
      id: `log_${Date.now()}`,
      childId: activeChild.id,
      childName: activeChild.name,
      startedAt: new Date().toISOString(),
      durationMinutes: activeSession.config?.durationMinutes || 15,
      gracePeriodSeconds: activeSession.config?.gracePeriodSeconds || 60,
      shutdownStyle: activeSession.config?.shutdownStyle || 'low_battery',
      outcome: 'voluntary_grace',
      elapsedSeconds: activeSession.elapsedSeconds,
      dateStr: new Date().toISOString().split('T')[0],
    };

    setSessionLogs((prev) => [newLog, ...prev]);

    setChildrenList((prev) =>
      prev.map((c) => {
        if (c.id === activeChild.id) {
          return {
            ...c,
            streakDays: c.streakDays + 1,
            totalSessions: c.totalSessions + 1,
            voluntaryStops: c.voluntaryStops + 1,
          };
        }
        return c;
      })
    );

    setActiveSession((prev) => ({
      ...prev,
      status: 'completed',
      outcome: 'voluntary_grace',
    }));

    navigateTo('post_session_summary');
  };

  const gracePeriodElapsed = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    soundEngine.playPowerDownHum();
    setActiveSession((prev) => ({
      ...prev,
      status: 'shutdown_active',
      graceRemainingSeconds: 0,
      outcome: 'required_shutdown',
    }));
    navigateTo('shutdown_illusion');
  };

  const finishShutdown = () => {
    const newLog: SessionLog = {
      id: `log_${Date.now()}`,
      childId: activeChild.id,
      childName: activeChild.name,
      startedAt: new Date().toISOString(),
      durationMinutes: activeSession.config?.durationMinutes || 15,
      gracePeriodSeconds: activeSession.config?.gracePeriodSeconds || 60,
      shutdownStyle: activeSession.config?.shutdownStyle || 'low_battery',
      outcome: 'required_shutdown',
      elapsedSeconds: activeSession.elapsedSeconds,
      dateStr: new Date().toISOString().split('T')[0],
    };

    setSessionLogs((prev) => [newLog, ...prev]);

    setChildrenList((prev) =>
      prev.map((c) => {
        if (c.id === activeChild.id) {
          return {
            ...c,
            totalSessions: c.totalSessions + 1,
          };
        }
        return c;
      })
    );

    setActiveSession((prev) => ({
      ...prev,
      status: 'completed',
      outcome: 'required_shutdown',
    }));

    navigateTo('post_session_summary');
  };

  const endSessionEarly = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    const newLog: SessionLog = {
      id: `log_${Date.now()}`,
      childId: activeChild.id,
      childName: activeChild.name,
      startedAt: new Date().toISOString(),
      durationMinutes: activeSession.config?.durationMinutes || 15,
      gracePeriodSeconds: activeSession.config?.gracePeriodSeconds || 60,
      shutdownStyle: activeSession.config?.shutdownStyle || 'low_battery',
      outcome: 'ended_by_parent',
      elapsedSeconds: activeSession.elapsedSeconds,
      dateStr: new Date().toISOString().split('T')[0],
    };

    setSessionLogs((prev) => [newLog, ...prev]);
    setActiveSession({
      config: null,
      status: 'idle',
      totalSeconds: 0,
      remainingSeconds: 0,
      elapsedSeconds: 0,
      graceRemainingSeconds: 0,
      outcome: 'ended_by_parent',
    });

    navigateTo('parent_dashboard');
  };

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        navigateTo,
        user,
        setUser,
        childrenList,
        activeChild,
        selectChild,
        addChild,
        updateChild,
        deleteChild,
        sessionLogs,
        activeSession,
        simulationSpeed,
        setSimulationSpeed,
        deviceFrame,
        setDeviceFrame,
        startSession,
        endSessionEarly,
        childPutPhoneDown,
        gracePeriodElapsed,
        finishShutdown,
        verifyPattern,
        updatePattern,
        togglePremium,
        isAudioMuted,
        toggleAudioMute,
        quickWidgetMinutes,
        setQuickWidgetMinutes,
        isWidgetAddedToHome,
        setIsWidgetAddedToHome,
        completeOnboarding,
        loadDemoProfiles,
        resetOnboarding,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
