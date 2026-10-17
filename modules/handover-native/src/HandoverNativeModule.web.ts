import type {
  HandoverNative,
  NativeSessionConfig,
  NativeSessionState,
  NativePermissionStatus,
  PermissionSettingType,
} from './HandoverNative.types';

let mockState: NativeSessionState = {
  status: 'IDLE',
  endAt: 0,
  graceEndAt: 0,
};

const listeners = new Set<(state: NativeSessionState) => void>();

export const HandoverNativeEngine: HandoverNative = {
  async helloWorld(): Promise<string> {
    return 'HandoverNative Web Simulator Mock';
  },
  async startSession(config: NativeSessionConfig): Promise<NativeSessionState> {
    const now = Date.now();
    mockState = {
      status: 'ACTIVE',
      endAt: now + config.durationMinutes * 60 * 1000,
      graceEndAt: 0,
      childId: config.childId,
      childName: config.childName,
    };
    listeners.forEach((l) => l(mockState));
    return mockState;
  },
  async cancelSession(): Promise<NativeSessionState> {
    mockState = {
      status: 'IDLE',
      endAt: 0,
      graceEndAt: 0,
    };
    listeners.forEach((l) => l(mockState));
    return mockState;
  },
  async getState(): Promise<NativeSessionState> {
    return mockState;
  },
  async setPin(_pin: string): Promise<boolean> {
    return true;
  },
  async verifyPin(_pin: string): Promise<boolean> {
    return true;
  },
  async getPermissionStatus(): Promise<NativePermissionStatus> {
    return {
      overlayGranted: true,
      notificationsGranted: true,
      exactAlarmsGranted: true,
      batteryOptimizationIgnored: true,
    };
  },
  async openPermissionSettings(_permissionType: PermissionSettingType): Promise<void> {
    // web no-op
  },
  addStateChangeListener(listener: (state: NativeSessionState) => void): { remove: () => void } {
    listeners.add(listener);
    return {
      remove: () => listeners.delete(listener),
    };
  },
};

export default HandoverNativeEngine;
