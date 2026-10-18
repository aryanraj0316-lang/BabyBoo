import { requireOptionalNativeModule } from 'expo';
import type {
  HandoverNative,
  NativeSessionConfig,
  NativeSessionState,
  NativePermissionStatus,
  PermissionSettingType,
} from './HandoverNative.types';

// Returns null only when the native module really isn't there (Expo Go / web).
// Note: don't wrap it in `new EventEmitter(...)` — on Expo SDK 52+ that throws, and the old
// try/catch then threw away the working native module, so every call silently used the JS mock.
let nativeModule: any = null;
try {
  nativeModule = requireOptionalNativeModule('HandoverNative');
} catch {
  nativeModule = null;
}

let mockState: NativeSessionState = {
  status: 'IDLE',
  endAt: 0,
  graceEndAt: 0,
};
let mockPin: string = '1234';
const mockListeners: Set<(state: NativeSessionState) => void> = new Set();

const notifyListeners = (newState: NativeSessionState) => {
  mockState = { ...newState };
  mockListeners.forEach((listener) => {
    try {
      listener(mockState);
    } catch {
      // ignore
    }
  });
};

export const HandoverNativeEngine: HandoverNative = {
  async helloWorld(): Promise<string> {
    if (nativeModule) {
      return nativeModule.helloWorld();
    }
    return 'Expo Go Simulation Mode (Native Engine Active)';
  },
  async startSession(config: NativeSessionConfig): Promise<NativeSessionState> {
    if (nativeModule) {
      return nativeModule.startSession(config);
    }
    const now = Date.now();
    const endAt = now + (config.durationMinutes || 1) * 60 * 1000;
    const graceEndAt = endAt + (config.gracePeriodSeconds || 60) * 1000;
    const nextState: NativeSessionState = {
      status: 'ACTIVE',
      endAt,
      graceEndAt,
      childId: config.childId,
      childName: config.childName,
    };
    notifyListeners(nextState);
    return nextState;
  },
  async cancelSession(): Promise<NativeSessionState> {
    if (nativeModule) {
      return nativeModule.cancelSession();
    }
    const nextState: NativeSessionState = {
      status: 'IDLE',
      endAt: 0,
      graceEndAt: 0,
    };
    notifyListeners(nextState);
    return nextState;
  },
  async getState(): Promise<NativeSessionState> {
    if (nativeModule) {
      return nativeModule.getState();
    }
    return mockState;
  },
  async setPin(pin: string): Promise<boolean> {
    if (nativeModule) {
      return nativeModule.setPin(pin);
    }
    mockPin = pin;
    return true;
  },
  async verifyPin(pin: string): Promise<boolean> {
    if (nativeModule) {
      return nativeModule.verifyPin(pin);
    }
    return pin === mockPin;
  },
  async getPermissionStatus(): Promise<NativePermissionStatus> {
    if (nativeModule) {
      return nativeModule.getPermissionStatus();
    }
    return {
      overlayGranted: true,
      notificationsGranted: true,
      exactAlarmsGranted: true,
      batteryOptimizationIgnored: true,
    };
  },
  async openPermissionSettings(permissionType: PermissionSettingType): Promise<void> {
    if (nativeModule) {
      return nativeModule.openPermissionSettings(permissionType);
    }
    // No-op simulation in Expo Go
  },
  addStateChangeListener(listener: (state: NativeSessionState) => void): { remove: () => void } {
    if (nativeModule && typeof nativeModule.addListener === 'function') {
      // Expo modules are event emitters themselves on SDK 52+
      try {
        const subscription = nativeModule.addListener('onHandoverStateChange', listener);
        return {
          remove: () => subscription?.remove?.(),
        };
      } catch {
        return { remove: () => {} };
      }
    }
    mockListeners.add(listener);
    return {
      remove: () => {
        mockListeners.delete(listener);
      },
    };
  },
  async setWidgetOptions(options: number[]): Promise<boolean> {
    const sanitized = options.map((n) => Math.round(Number(n))).filter((n) => n > 0 && !isNaN(n));
    if (nativeModule) {
      if (nativeModule.setWidgetOptionsCsv) {
        return await nativeModule.setWidgetOptionsCsv(sanitized.join(','));
      }
      if (nativeModule.setWidgetOptions) {
        return await nativeModule.setWidgetOptions(sanitized);
      }
    }
    return true;
  },
  async getWidgetOptions(): Promise<number[]> {
    if (nativeModule && nativeModule.getWidgetOptions) {
      return await nativeModule.getWidgetOptions();
    }
    return [15, 30, 45, 60];
  },
};

export default HandoverNativeEngine;
