export type SessionStateStatus = 'IDLE' | 'ACTIVE' | 'GRACE' | 'BLACKOUT';

export interface NativeSessionConfig {
  durationMinutes: number;
  gracePeriodSeconds: number;
  childId?: string;
  childName?: string;
}

export interface NativeSessionState {
  status: SessionStateStatus;
  endAt: number; // absolute epoch millis (0 if IDLE)
  graceEndAt: number; // absolute epoch millis (0 if not in grace)
  childId?: string;
  childName?: string;
}

export interface NativePermissionStatus {
  overlayGranted: boolean;
  notificationsGranted: boolean;
  exactAlarmsGranted: boolean;
  batteryOptimizationIgnored: boolean;
}

export type PermissionSettingType = 'overlay' | 'notifications' | 'exact_alarm' | 'battery';

export interface HandoverNative {
  helloWorld(): Promise<string>;
  startSession(config: NativeSessionConfig): Promise<NativeSessionState>;
  cancelSession(): Promise<NativeSessionState>;
  getState(): Promise<NativeSessionState>;
  setPin(pin: string): Promise<boolean>;
  verifyPin(pin: string): Promise<boolean>;
  getPermissionStatus(): Promise<NativePermissionStatus>;
  openPermissionSettings(permissionType: PermissionSettingType): Promise<void>;
  addStateChangeListener(listener: (state: NativeSessionState) => void): { remove: () => void };
}
