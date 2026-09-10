export type ShutdownStyle = 'low_battery' | 'cooldown' | 'needs_rest';

export type AgeGroup = 
  | 'under_2' 
  | '2-3' 
  | '4-5' 
  | '6-7'
  | '8-10'
  | '11-13'
  | '14+'
  | 'under-2'
  | '2_3'
  | '4_5'
  | '6_7'
  | '8_10'
  | '11_13'
  | '14_plus'
  | '14-plus'
  | '6-8' 
  | '9-12' 
  | '13+' 
  | '2-5' 
  | '6-10';

export interface ChildProfile {
  id: string;
  name: string;
  ageGroup: AgeGroup;
  avatar: string;
  dailyLimitMinutes: number;
  defaultGraceSeconds: number;
  preferredStyle: ShutdownStyle;
  streakDays: number;
  streak?: number;
  totalSessions: number;
  voluntaryStops: number;
}

export type SessionStatus = 
  | 'idle'
  | 'running'
  | 'warning_80'
  | 'time_up_grace'
  | 'shutdown_active'
  | 'completed';

export type ComplianceOutcome = 
  | 'voluntary_grace' 
  | 'required_shutdown' 
  | 'ended_by_parent';

export interface SessionConfig {
  childId: string;
  durationMinutes: number;
  gracePeriodSeconds: number;
  shutdownStyle: ShutdownStyle;
}

export interface SessionLog {
  id: string;
  childId: string;
  childName: string;
  startedAt: string; // ISO date
  durationMinutes: number;
  gracePeriodSeconds: number;
  shutdownStyle: ShutdownStyle;
  outcome: ComplianceOutcome;
  elapsedSeconds: number;
  dateStr: string; // YYYY-MM-DD
}

export type ScreenName = 
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

export interface UserAccount {
  id: string;
  email: string;
  isParentVerified: boolean;
  patternLock: number[]; // sequence of dot indices 0..8
  backupPin: string;
  isPremium: boolean;
}

export type DeviceFrameType = 'iphone' | 'pixel' | 'fullscreen';
