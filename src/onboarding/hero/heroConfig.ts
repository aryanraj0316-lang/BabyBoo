/**
 * Hero configuration: types, defaults, presets and a validating clamp.
 * Pure TypeScript (no React / React Native) so the Vite web companion and the
 * unit tests can import it.
 */

export type BeatId =
  | 'intro' | 'playing' | 'drain' | 'warning' | 'dim' | 'off'
  | 'deadHold' | 'tap' | 'unlock' | 'wake' | 'celebrate' | 'settle';

export const BEAT_ORDER: BeatId[] = [
  'intro', 'playing', 'drain', 'warning', 'dim', 'off',
  'deadHold', 'tap', 'unlock', 'wake', 'celebrate', 'settle',
];

export type BlinkStyle = 'squash' | 'eyelid';
export type Stroke = Array<[number, number]>;

export interface HeroConfig {
  version: 1;
  speed: number; // 0.25 to 2
  loop: boolean;
  beats: Record<BeatId, { start: number; end: number }>;
  battery: { start: number; mid: number; end: number; redBelow: number; drainCurve: number };
  mascot: {
    breath: number; // torso scale amplitude (0.015 = 1.5%)
    blinkMin: number; // seconds
    blinkMax: number;
    blinkStyle: BlinkStyle;
    gaze: number; // 0..1.5 multiplier on the 6% eye-width gaze ellipse
    faceParallax: number; // source px of extra feature shift
    tiltParallax: number; // multiplier on the 4 / 8 / 12 px layer parallax
    earLag: number; // degrees of ear lag on body moves
    wave: { amplitudeDeg: number; cycles: number };
    squash: number; // 0..1.5 multiplier on squash and stretch
    cheer: number; // 0..1.5
    sparkles: number; // count 0..12
  };
  lighting: {
    dir: [number, number, number];
    key: number;
    ambient: number;
    specAmount: number;
    specPower: number;
    rim: number;
    spill: number;
    shadowSoftness: number;
    shadowOpacity: number;
  };
  phone: {
    bezel: string;
    radius: number; // fraction of phone width
    sheen: number;
    time: string;
    palette: string;
    dimAmount: number;
    bannerText: string; // empty = use the localized default
  };
  finger: {
    skinTone: string;
    size: number; // multiplier
    speed: number; // multiplier on stroke speed
    jitter: number; // px
    trailColor: string;
    trailLength: number; // seconds the trail takes to fade
    strokes: Stroke[];
  };
  audio: {
    enabled: boolean;
    chirp: boolean;
    powerDown: boolean;
    chime: boolean;
    giggle: boolean;
    haptics: boolean;
  };
  debug: {
    rig: boolean;
    normals: boolean;
    lightVector: boolean;
    gazeTarget: boolean;
    keepClear: boolean;
    hud: boolean;
  };
}

/**
 * A capital A as two natural strokes in normalized screen coordinates
 * (0..1 inside the phone screen). Stroke one: bottom left -> apex (with a
 * small overshoot) -> bottom right. Stroke two: the crossbar, left to right.
 * Slight asymmetry and ~1.5 degrees of baseline tilt so it reads hand-drawn.
 */
export const A_PRESET: Stroke[] = [
  [
    [0.285, 0.725], [0.33, 0.6], [0.38, 0.47], [0.43, 0.36], [0.478, 0.3],
    [0.505, 0.288], [0.53, 0.302], [0.575, 0.38], [0.625, 0.49], [0.672, 0.6],
    [0.712, 0.712],
  ],
  [
    [0.37, 0.548], [0.45, 0.54], [0.53, 0.535], [0.618, 0.53],
  ],
];

export const SKIN_TONES: Record<string, string> = {
  porcelain: '#F6D9C8',
  peach: '#EDC1A3',
  honey: '#D9A177',
  caramel: '#B87D52',
  cocoa: '#8A5A3C',
  ebony: '#5E3B27',
};

export const BEZEL_PRESETS: Record<string, string> = {
  graphite: '#2B2A33',
  silver: '#C9CCD6',
  lavender: '#B9AEE0',
  midnight: '#1C2340',
};

export const CARTOON_PALETTES: Record<string, {
  sky: [string, string]; hillBack: string; hillFront: string; sun: string; cloud: string; ball: string;
}> = {
  meadow: { sky: ['#BFE6FF', '#E8F6FF'], hillBack: '#A8DDB5', hillFront: '#7CCB97', sun: '#FFD66B', cloud: '#FFFFFF', ball: '#FF8FB1' },
  sunset: { sky: ['#FFC9A8', '#FFE9D6'], hillBack: '#E9B8C8', hillFront: '#C99AC9', sun: '#FFB347', cloud: '#FFF4EC', ball: '#7FC8F8' },
  lilac: { sky: ['#D9D2FF', '#F1EEFF'], hillBack: '#BCE3D2', hillFront: '#93CFB3', sun: '#FFE08A', cloud: '#FFFFFF', ball: '#FF9EC7' },
};

export const DEFAULT_CONFIG: HeroConfig = {
  version: 1,
  speed: 1,
  loop: true,
  beats: {
    intro: { start: 0.0, end: 1.0 },
    playing: { start: 1.0, end: 3.6 },
    drain: { start: 3.6, end: 6.0 },
    warning: { start: 6.0, end: 7.4 },
    dim: { start: 7.4, end: 8.6 },
    off: { start: 8.6, end: 9.4 },
    deadHold: { start: 9.4, end: 10.6 },
    tap: { start: 10.6, end: 12.0 },
    unlock: { start: 12.0, end: 14.6 },
    wake: { start: 14.6, end: 15.6 },
    celebrate: { start: 15.6, end: 17.0 },
    settle: { start: 17.0, end: 18.0 },
  },
  battery: { start: 20, mid: 5, end: 1, redBelow: 15, drainCurve: 0.35 },
  mascot: {
    breath: 0.015,
    blinkMin: 3,
    blinkMax: 6,
    blinkStyle: 'eyelid',
    gaze: 1,
    faceParallax: 5,
    tiltParallax: 1,
    earLag: 4,
    wave: { amplitudeDeg: 18, cycles: 3 },
    squash: 1,
    cheer: 1,
    sparkles: 7,
  },
  lighting: {
    dir: [-0.4511, -0.5514, 0.7018],
    key: 1,
    ambient: 0.55,
    specAmount: 0.06,
    specPower: 18,
    rim: 0.08,
    spill: 0.22,
    shadowSoftness: 9,
    shadowOpacity: 0.22,
  },
  phone: {
    bezel: 'graphite',
    radius: 0.11,
    sheen: 0.5,
    time: '4:15',
    palette: 'meadow',
    dimAmount: 0.78,
    bannerText: '',
  },
  finger: {
    skinTone: 'peach',
    size: 1,
    speed: 1,
    jitter: 0.6,
    trailColor: '#B9A3FF',
    trailLength: 0.9,
    strokes: A_PRESET,
  },
  audio: { enabled: false, chirp: true, powerDown: true, chime: true, giggle: true, haptics: true },
  debug: { rig: false, normals: false, lightVector: false, gazeTarget: false, keepClear: false, hud: false },
};

export const PRESETS: Record<'Default' | 'Calm' | 'Reduced', HeroConfig> = {
  Default: DEFAULT_CONFIG,
  Calm: {
    ...DEFAULT_CONFIG,
    speed: 0.85,
    mascot: { ...DEFAULT_CONFIG.mascot, breath: 0.011, gaze: 0.8, squash: 0.6, cheer: 0.6, sparkles: 4, wave: { amplitudeDeg: 12, cycles: 2 } },
    lighting: { ...DEFAULT_CONFIG.lighting, spill: 0.16 },
  },
  Reduced: {
    ...DEFAULT_CONFIG,
    speed: 0.8,
    mascot: { ...DEFAULT_CONFIG.mascot, breath: 0.008, gaze: 0.6, faceParallax: 2, tiltParallax: 0, squash: 0.3, cheer: 0.3, sparkles: 0, wave: { amplitudeDeg: 8, cycles: 1 } },
    lighting: { ...DEFAULT_CONFIG.lighting, spill: 0.1, specAmount: 0.03 },
  },
};

// ---------------------------------------------------------------------------
// Validation: every value is clamped to a safe range; unknown keys dropped.
// ---------------------------------------------------------------------------

const clamp = (v: unknown, lo: number, hi: number, d: number): number => {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : d;
  return Math.min(hi, Math.max(lo, n));
};
const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
const str = (v: unknown, d: string, max = 80) => (typeof v === 'string' ? v.slice(0, max) : d);
const oneOf = <T extends string>(v: unknown, opts: readonly T[], d: T): T =>
  (typeof v === 'string' && (opts as readonly string[]).includes(v) ? (v as T) : d);
const isObj = (v: unknown): v is Record<string, any> => typeof v === 'object' && v !== null && !Array.isArray(v);

function validStrokes(v: unknown, d: Stroke[]): Stroke[] {
  if (!Array.isArray(v)) return d;
  const out: Stroke[] = [];
  for (const s of v.slice(0, 6)) {
    if (!Array.isArray(s)) continue;
    const pts: Stroke = [];
    for (const p of s.slice(0, 64)) {
      if (Array.isArray(p) && p.length === 2) {
        pts.push([clamp(p[0], 0, 1, 0.5), clamp(p[1], 0, 1, 0.5)]);
      }
    }
    if (pts.length >= 2) out.push(pts);
  }
  return out.length ? out : d;
}

export function validateConfig(input: unknown): HeroConfig {
  const d = DEFAULT_CONFIG;
  const c = isObj(input) ? input : {};
  const beats = {} as HeroConfig['beats'];
  let prevEnd = 0;
  for (const id of BEAT_ORDER) {
    const b = isObj(c.beats) && isObj(c.beats[id]) ? c.beats[id] : d.beats[id];
    const start = clamp(b.start, prevEnd, 60, d.beats[id].start);
    const end = clamp(b.end, start + 0.1, 60, Math.max(start + 0.1, d.beats[id].end));
    beats[id] = { start: +start.toFixed(3), end: +end.toFixed(3) };
    prevEnd = end;
  }
  // The intro must start at 0 and beats must be contiguous.
  beats.intro.start = 0;
  for (let i = 1; i < BEAT_ORDER.length; i++) {
    beats[BEAT_ORDER[i]].start = beats[BEAT_ORDER[i - 1]].end;
    if (beats[BEAT_ORDER[i]].end <= beats[BEAT_ORDER[i]].start) {
      beats[BEAT_ORDER[i]].end = +(beats[BEAT_ORDER[i]].start + 0.1).toFixed(3);
    }
  }
  const bat = isObj(c.battery) ? c.battery : {};
  const m = isObj(c.mascot) ? c.mascot : {};
  const l = isObj(c.lighting) ? c.lighting : {};
  const p = isObj(c.phone) ? c.phone : {};
  const f = isObj(c.finger) ? c.finger : {};
  const a = isObj(c.audio) ? c.audio : {};
  const dbg = isObj(c.debug) ? c.debug : {};
  const dirIn = Array.isArray(l.dir) && l.dir.length === 3 ? l.dir : d.lighting.dir;
  let dir: [number, number, number] = [clamp(dirIn[0], -1, 1, -0.45), clamp(dirIn[1], -1, 1, -0.55), clamp(dirIn[2], 0.2, 1, 0.7)];
  const len = Math.hypot(dir[0], dir[1], dir[2]) || 1;
  dir = [dir[0] / len, dir[1] / len, dir[2] / len].map((v) => +v.toFixed(4)) as [number, number, number];
  const blinkMin = clamp(m.blinkMin, 1, 12, d.mascot.blinkMin);
  const batStart = clamp(bat.start, 2, 100, d.battery.start);
  const batMid = clamp(bat.mid, 1, batStart, d.battery.mid);
  return {
    version: 1,
    speed: clamp(c.speed, 0.25, 2, d.speed),
    loop: bool(c.loop, d.loop),
    beats,
    battery: {
      start: batStart,
      mid: batMid,
      end: clamp(bat.end, 0, batMid, d.battery.end),
      redBelow: clamp(bat.redBelow, 1, 50, d.battery.redBelow),
      drainCurve: clamp(bat.drainCurve, 0, 1, d.battery.drainCurve),
    },
    mascot: {
      breath: clamp(m.breath, 0, 0.04, d.mascot.breath),
      blinkMin,
      blinkMax: clamp(m.blinkMax, blinkMin, 15, d.mascot.blinkMax),
      blinkStyle: oneOf(m.blinkStyle, ['squash', 'eyelid'] as const, d.mascot.blinkStyle),
      gaze: clamp(m.gaze, 0, 1.5, d.mascot.gaze),
      faceParallax: clamp(m.faceParallax, 0, 10, d.mascot.faceParallax),
      tiltParallax: clamp(m.tiltParallax, 0, 2, d.mascot.tiltParallax),
      earLag: clamp(m.earLag, 0, 8, d.mascot.earLag),
      wave: {
        amplitudeDeg: clamp(isObj(m.wave) ? m.wave.amplitudeDeg : undefined, 0, 24, d.mascot.wave.amplitudeDeg),
        cycles: Math.round(clamp(isObj(m.wave) ? m.wave.cycles : undefined, 1, 5, d.mascot.wave.cycles)),
      },
      squash: clamp(m.squash, 0, 1.5, d.mascot.squash),
      cheer: clamp(m.cheer, 0, 1.5, d.mascot.cheer),
      sparkles: Math.round(clamp(m.sparkles, 0, 12, d.mascot.sparkles)),
    },
    lighting: {
      dir,
      key: clamp(l.key, 0, 2, d.lighting.key),
      ambient: clamp(l.ambient, 0.2, 1, d.lighting.ambient),
      specAmount: clamp(l.specAmount, 0, 0.3, d.lighting.specAmount),
      specPower: clamp(l.specPower, 2, 64, d.lighting.specPower),
      rim: clamp(l.rim, 0, 0.4, d.lighting.rim),
      spill: clamp(l.spill, 0, 0.6, d.lighting.spill),
      shadowSoftness: clamp(l.shadowSoftness, 1, 30, d.lighting.shadowSoftness),
      shadowOpacity: clamp(l.shadowOpacity, 0, 0.6, d.lighting.shadowOpacity),
    },
    phone: {
      bezel: oneOf(p.bezel, Object.keys(BEZEL_PRESETS), d.phone.bezel),
      radius: clamp(p.radius, 0.04, 0.16, d.phone.radius),
      sheen: clamp(p.sheen, 0, 1, d.phone.sheen),
      time: /^\d{1,2}:\d{2}$/.test(String(p.time)) ? String(p.time) : d.phone.time,
      palette: oneOf(p.palette, Object.keys(CARTOON_PALETTES), d.phone.palette),
      dimAmount: clamp(p.dimAmount, 0.3, 0.95, d.phone.dimAmount),
      bannerText: str(p.bannerText, d.phone.bannerText, 60),
    },
    finger: {
      skinTone: oneOf(f.skinTone, Object.keys(SKIN_TONES), d.finger.skinTone),
      size: clamp(f.size, 0.6, 1.6, d.finger.size),
      speed: clamp(f.speed, 0.5, 2, d.finger.speed),
      jitter: clamp(f.jitter, 0, 2, d.finger.jitter),
      trailColor: /^#[0-9a-fA-F]{6}$/.test(String(f.trailColor)) ? String(f.trailColor) : d.finger.trailColor,
      trailLength: clamp(f.trailLength, 0.2, 2, d.finger.trailLength),
      strokes: validStrokes(f.strokes, d.finger.strokes),
    },
    audio: {
      enabled: bool(a.enabled, d.audio.enabled),
      chirp: bool(a.chirp, d.audio.chirp),
      powerDown: bool(a.powerDown, d.audio.powerDown),
      chime: bool(a.chime, d.audio.chime),
      giggle: bool(a.giggle, d.audio.giggle),
      haptics: bool(a.haptics, d.audio.haptics),
    },
    debug: {
      rig: bool(dbg.rig, false),
      normals: bool(dbg.normals, false),
      lightVector: bool(dbg.lightVector, false),
      gazeTarget: bool(dbg.gazeTarget, false),
      keepClear: bool(dbg.keepClear, false),
      hud: bool(dbg.hud, false),
    },
  };
}

/** Immutable deep set by dotted path, followed by validation. */
export function setConfigValue(cfg: HeroConfig, path: string, value: unknown): HeroConfig {
  const keys = path.split('.');
  const clone: any = JSON.parse(JSON.stringify(cfg));
  let o = clone;
  for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
  o[keys[keys.length - 1]] = value;
  return validateConfig(clone);
}

export function getConfigValue(cfg: HeroConfig, path: string): any {
  return path.split('.').reduce((o: any, k) => (o == null ? o : o[k]), cfg);
}
