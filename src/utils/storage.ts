import type { ChildProfile, SessionLog, UserAccount } from '../types';

const STORAGE_KEYS = {
  CHILDREN: 'babyboo_children',
  ACTIVE_CHILD_ID: 'babyboo_active_child_id',
  USER_ACCOUNT: 'babyboo_user_account',
  SESSION_LOGS: 'babyboo_session_logs',
};

export const INITIAL_CHILDREN: ChildProfile[] = [
  {
    id: 'child_1',
    name: 'Leo',
    ageGroup: '2-5',
    avatar: 'L',
    dailyLimitMinutes: 20,
    defaultGraceSeconds: 60,
    preferredStyle: 'low_battery',
    streakDays: 5,
    totalSessions: 18,
    voluntaryStops: 15,
  },
  {
    id: 'child_2',
    name: 'Maya',
    ageGroup: '6-10',
    avatar: 'M',
    dailyLimitMinutes: 30,
    defaultGraceSeconds: 60,
    preferredStyle: 'needs_rest',
    streakDays: 9,
    totalSessions: 24,
    voluntaryStops: 22,
  },
];

export const INITIAL_USER: UserAccount = {
  id: 'parent_user_1',
  email: 'sarah.parent@example.com',
  isParentVerified: true,
  patternLock: [0, 3, 6, 7, 8],
  backupPin: '1234',
  isPremium: false,
};

export const INITIAL_LOGS: SessionLog[] = [
  {
    id: 'log_1',
    childId: 'child_1',
    childName: 'Leo',
    startedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    durationMinutes: 15,
    gracePeriodSeconds: 60,
    shutdownStyle: 'low_battery',
    outcome: 'voluntary_grace',
    elapsedSeconds: 960,
    dateStr: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
  },
  {
    id: 'log_2',
    childId: 'child_1',
    childName: 'Leo',
    startedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    durationMinutes: 20,
    gracePeriodSeconds: 60,
    shutdownStyle: 'low_battery',
    outcome: 'voluntary_grace',
    elapsedSeconds: 1250,
    dateStr: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
  },
  {
    id: 'log_3',
    childId: 'child_1',
    childName: 'Leo',
    startedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    durationMinutes: 15,
    gracePeriodSeconds: 60,
    shutdownStyle: 'cooldown',
    outcome: 'required_shutdown',
    elapsedSeconds: 990,
    dateStr: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
  },
  {
    id: 'log_4',
    childId: 'child_2',
    childName: 'Maya',
    startedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    durationMinutes: 25,
    gracePeriodSeconds: 60,
    shutdownStyle: 'needs_rest',
    outcome: 'voluntary_grace',
    elapsedSeconds: 1540,
    dateStr: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
  },
];

export const DEMO_CHILDREN: ChildProfile[] = INITIAL_CHILDREN;

const ONBOARDING_COMPLETED_KEY = 'babyboo_onboarding_completed';

export const isStoredOnboardingCompleted = (): boolean => {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
    }
  } catch {}
  return false;
};

export const setStoredOnboardingCompleted = (completed: boolean) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, completed ? 'true' : 'false');
    }
  } catch {}
};

export const loadStoredChildren = (): ChildProfile[] => {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEYS.CHILDREN);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
    return [];
  } catch {
    return [];
  }
};

export const saveStoredChildren = (children: ChildProfile[]) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(children));
    }
  } catch (e) {
    console.error('Failed to save children', e);
  }
};

export const loadStoredUser = (): UserAccount => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_ACCOUNT);
    return raw ? JSON.parse(raw) : INITIAL_USER;
  } catch {
    return INITIAL_USER;
  }
};

export const saveStoredUser = (user: UserAccount) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_ACCOUNT, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save user', e);
  }
};

export const loadStoredLogs = (): SessionLog[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION_LOGS);
    return raw ? JSON.parse(raw) : INITIAL_LOGS;
  } catch {
    return INITIAL_LOGS;
  }
};

export const saveStoredLogs = (logs: SessionLog[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save logs', e);
  }
};
