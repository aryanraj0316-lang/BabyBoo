/**
 * One derived value per frame: timeline time, phone state, fingertip and the
 * director's decision. Every layer reads from it, so nothing waits on the JS
 * thread during playback.
 */
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import type { HeroConfig } from './heroConfig';
import { beatIndexAt, keyTimes, loopIndex, paletteLuma, phoneStateAt, timelineTime, type KeyTimes, type PhoneState } from './heroTimeline';
import { fingerAt, type FingerState, type StrokeSamples } from './gesture';
import { direct, type Blink, type DirectorOutput, type Twitch } from './director';
import type { StageLayout } from './layout';

export interface HeroShared {
  cfg: SharedValue<HeroConfig>;
  layout: SharedValue<StageLayout>;
  samples: SharedValue<StrokeSamples[]>;
  keys: SharedValue<KeyTimes>;
  blinks: SharedValue<Blink[][]>; // 4 loop variants
  twitches: SharedValue<Twitch[][]>;
  touch: SharedValue<{ active: boolean; x: number; y: number; at: number }>;
  giggleAt: SharedValue<number>; // timeline time
  tilt: SharedValue<{ x: number; y: number }>; // -1..1
  reduced: SharedValue<boolean>;
}

export interface HeroFrame {
  master: number;
  t: number;
  beat: number;
  phone: PhoneState;
  finger: FingerState;
  d: DirectorOutput;
  tint: [number, number, number];
}

export function computeFrame(master: number, s: {
  cfg: HeroConfig; layout: StageLayout; samples: StrokeSamples[]; keys: KeyTimes;
  blinks: Blink[][]; twitches: Twitch[][];
  touch: { active: boolean; x: number; y: number; at: number }; giggleAt: number;
}): HeroFrame {
  'worklet';
  const cfg = s.cfg;
  const t = timelineTime(master, cfg);
  const li = loopIndex(master, cfg) % 4;
  const phone = phoneStateAt(t, cfg, master);
  const finger = fingerAt(t, cfg, s.samples, s.keys);
  // touch attracts the gaze; eases in over 150 ms and out over 600 ms
  const since = master - s.touch.at;
  let touchW = 0;
  if (s.touch.active) touchW = Math.min(1, since / 0.15);
  else if (since < 0.6) touchW = 1 - since / 0.6;
  touchW = Math.max(0, touchW);
  const d = direct({
    t, master, cfg, layout: s.layout, phone, finger,
    blinks: s.blinks[li] || [], twitches: s.twitches[li] || [],
    touchW, touchX: s.touch.x, touchY: s.touch.y, giggleAt: s.giggleAt, K: s.keys,
  });
  const pl = paletteLuma(cfg.phone.palette);
  return { master, t, beat: beatIndexAt(t, cfg), phone, finger, d, tint: [pl.r, pl.g, pl.b] };
}

export function useHeroFrame(clock: SharedValue<number>, shared: HeroShared) {
  return useDerivedValue<HeroFrame>(() =>
    computeFrame(clock.value, {
      cfg: shared.cfg.value,
      layout: shared.layout.value,
      samples: shared.samples.value,
      keys: shared.keys.value,
      blinks: shared.blinks.value,
      twitches: shared.twitches.value,
      touch: shared.touch.value,
      giggleAt: shared.giggleAt.value,
    }),
  );
}

export { keyTimes };
