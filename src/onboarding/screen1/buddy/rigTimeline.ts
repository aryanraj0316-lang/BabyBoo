/**
 * Buddy's acting: expression presets, scripts, life layers and the windowed spring
 * re-simulation that turns a script into rig parameters at any exact time.
 *
 * Determinism: rigAt(script, t) re-simulates every spring over a short window before t
 * at a fixed step, starting at rest on the targets at the window start. The same t
 * always gives the same pose (the render harness and the phone match, the debug
 * scrubber can jump anywhere), and random life events (blinks, saccades, ear twitches)
 * come from a seeded generator keyed to the loop.
 */
import { REST, RIG_KEYS, ikArm, type RigKey, type RigParams } from './rig';
import { LIFE as L } from './lifeLook';

// ---------------------------------------------------------------------------
// Presets (each matched to its reference; see design/ONBOARDING_SCREEN1_FINAL.md 2.6)
// ---------------------------------------------------------------------------

type Partial_ = Partial<RigParams>;

/** Every preset sets all face weights, so expressions blend cleanly. */
const FACE_RESET: Partial_ = {
  eyeRound: 0, eyeHappy: 0, eyeSleepy: 0, eyeSqueeze: 0,
  mouthSmile: 0, mouthO: 0, mouthWavy: 0, mouthYawn: 0, mouthClosed: 0,
};

function arms(l?: [number, number], r?: [number, number], openL = 0, openR = 0): Partial_ {
  const out: Partial_ = { pawOpenL: openL, pawOpenR: openR };
  if (l) {
    const k = ikArm('armL', l);
    out.shoulderL = k.shoulder;
    out.elbowL = k.elbow;
  }
  if (r) {
    const k = ikArm('armR', r);
    out.shoulderR = k.shoulder;
    out.elbowR = k.elbow;
  }
  return out;
}

export const PRESETS = {
  happy: { ...FACE_RESET, eyeRound: 1, mouthSmile: 1, mouthOpen: 0.9, blush: 1.1 },
  delighted: { ...FACE_RESET, eyeRound: 1, eyeOpen: 1.05, mouthSmile: 1, mouthOpen: 1.15, blush: 1.25, earPerkL: 0.4, earPerkR: 0.4 },
  giggle: { ...FACE_RESET, eyeHappy: 1, mouthSmile: 1, mouthOpen: 0.85, blush: 1.4, headTilt: 0.09 },
  watching: { ...FACE_RESET, eyeRound: 1, mouthSmile: 1, mouthOpen: 0.55, headTurn: -0.5, gazeX: -0.6, gazeY: 0.1 },
  worried: {
    ...FACE_RESET, eyeRound: 1, eyeOpen: 1.1, mouthWavy: 1, mouthOpen: 0.6, bodyLean: -0.035, earAngleL: -0.22, earAngleR: -0.22,
    blush: 0.8, gazeX: -0.5, ...arms([-0.05, 0.53], [0.05, 0.53]),
  },
  scared: { ...FACE_RESET, eyeRound: 1, eyeOpen: 1.25, mouthWavy: 1, mouthOpen: 1, earAngleL: -0.38, earAngleR: -0.38, headTilt: -0.05, blush: 0.7 },
  startled: { ...FACE_RESET, eyeRound: 1, eyeOpen: 1.3, mouthO: 1, mouthOpen: 0.9, earPerkL: 1, earPerkR: 1, earAngleL: 0.1, earAngleR: 0.1 },
  yawn: {
    ...FACE_RESET, eyeSqueeze: 1, mouthYawn: 1, mouthOpen: 1.1, headTilt: -0.08, squash: -0.3, blush: 0.9,
    ...arms([-0.05, 0.2], undefined, 0.2, 0),
  },
  sleepy: { ...FACE_RESET, eyeSleepy: 1, mouthClosed: 1, earAngleL: -0.35, earAngleR: -0.35, earPerkL: -0.6, earPerkR: -0.6, headTilt: 0.12, squash: 0.25 },
  asleep: {
    ...FACE_RESET, eyeSleepy: 1, mouthClosed: 0.8, mouthWidth: 0.7, earAngleL: -0.5, earAngleR: -0.5, earPerkL: -1, earPerkR: -1,
    headTilt: 0.16, headNod: 0.5, squash: 0.35,
  },
  pointing: { ...FACE_RESET, eyeRound: 1, mouthSmile: 1, mouthOpen: 0.8, headTurn: -0.45, gazeX: -0.9, ...arms([-0.68, 0.32], undefined, 0.6, 0) },
  celebrate: {
    ...FACE_RESET, eyeRound: 1, mouthSmile: 1, mouthOpen: 1.15, blush: 1.3, earPerkL: 0.6, earPerkR: 0.6,
    ...arms([-0.66, 0.02], [0.66, 0.02], 1, 1),
  },
  wave: { ...FACE_RESET, eyeRound: 1, mouthSmile: 1, mouthOpen: 1, blush: 1.15, headTilt: 0.1, headTurn: 0.12, ...arms([-0.6, 0.02], undefined, 1, 0) },
} satisfies Record<string, Partial_>;

export type PresetName = keyof typeof PRESETS;
export const PRESET_NAMES = Object.keys(PRESETS) as PresetName[];

/** Presets whose arm waves (an oscillation layer on the elbow, with a slight body rock). */
const WAVING: Partial<Record<PresetName, true>> = { wave: true };

export function presetParams(name: PresetName): RigParams {
  return { ...REST, ...(PRESETS[name] as Partial_) };
}

// ---------------------------------------------------------------------------
// Scripts
// ---------------------------------------------------------------------------

export interface ScriptEvent { t: number; preset: PresetName; set?: Partial_ }
export interface Script { events: ScriptEvent[]; hops: number[]; loop: number; seed: number }

/** The Buddy Lab recording: every preset, gaze moves, a full head turn, a wave and a hop. */
export const LAB_SCRIPT: Script = {
  seed: 7,
  loop: 49,
  hops: [28.6, 45.2],
  events: [
    { t: 0, preset: 'happy' },
    { t: 2.5, preset: 'delighted' },
    { t: 5, preset: 'giggle' },
    { t: 7.5, preset: 'watching' },
    { t: 10, preset: 'worried' },
    { t: 12.5, preset: 'scared' },
    { t: 15, preset: 'startled' },
    { t: 17.5, preset: 'yawn' },
    { t: 20, preset: 'sleepy' },
    { t: 22.5, preset: 'asleep' },
    { t: 25.5, preset: 'pointing' },
    { t: 28, preset: 'celebrate' },
    { t: 31, preset: 'wave' },
    // Gaze tour.
    { t: 34.5, preset: 'happy', set: { gazeX: -1 } },
    { t: 35.3, preset: 'happy', set: { gazeX: 1 } },
    { t: 36.1, preset: 'happy', set: { gazeY: -1 } },
    { t: 36.9, preset: 'happy', set: { gazeY: 1 } },
    { t: 37.7, preset: 'happy' },
    // Head turn -1 -> +1.
    { t: 38.5, preset: 'happy', set: { headTurn: -1, gazeX: -0.5 } },
    { t: 39.5, preset: 'happy', set: { headTurn: -0.5, gazeX: -0.3 } },
    { t: 40.5, preset: 'happy', set: { headTurn: 0 } },
    { t: 41.5, preset: 'happy', set: { headTurn: 0.5, gazeX: 0.3 } },
    { t: 42.5, preset: 'happy', set: { headTurn: 1, gazeX: 0.5 } },
    { t: 43.5, preset: 'happy' },
  ],
};

/** The preset label shown at time t (Buddy Lab caption). */
export function labelAt(script: Script, t: number): string {
  let e = script.events[0];
  for (const ev of script.events) if (ev.t <= t) e = ev;
  return e.set ? `${e.preset} + ${Object.keys(e.set).join(', ')}` : e.preset;
}

// ---------------------------------------------------------------------------
// Deterministic randomness
// ---------------------------------------------------------------------------

function rand(seed: number, i: number): number {
  'worklet';
  let x = (seed * 374761393 + i * 668265263) | 0;
  x = (x ^ (x >>> 13)) * 1274126177;
  x ^= x >>> 16;
  return ((x >>> 0) % 100000) / 100000;
}

// ---------------------------------------------------------------------------
// Targets (what each spring is heading for at time t)
// ---------------------------------------------------------------------------

const EXTRA = ['wave', 'sleepiness'] as const;
type Channel = RigKey | (typeof EXTRA)[number];
const CHANNELS: Channel[] = [...RIG_KEYS, ...EXTRA];
const N = CHANNELS.length;
const IDX: Record<string, number> = {};
CHANNELS.forEach((c, i) => (IDX[c] = i));

/** Springs per channel group: eye moves are fast, ears are jelly, the rest soft. */
const OMEGA: number[] = CHANNELS.map((c) => (c === 'gazeX' || c === 'gazeY' || c === 'saccadeX' || c === 'saccadeY' ? L.eyeSpring.omega
  : c.startsWith('ear') ? L.earSpring.omega : L.softSpring.omega));
const ZETA: number[] = CHANNELS.map((c) => (c === 'gazeX' || c === 'gazeY' || c === 'saccadeX' || c === 'saccadeY' ? L.eyeSpring.zeta
  : c.startsWith('ear') ? L.earSpring.zeta : L.softSpring.zeta));

const PRESET_VALUES: Record<string, number[]> = {};
for (const name of PRESET_NAMES) {
  const p = presetParams(name);
  PRESET_VALUES[name] = CHANNELS.map((c) => (c === 'wave' ? (WAVING[name] ? 1 : 0)
    : c === 'sleepiness' ? (name === 'asleep' ? 1 : name === 'sleepy' ? 0.5 : 0) : (p as unknown as Record<string, number>)[c]));
}

/** Script events flattened for the worklet: [time, presetIndex, overrides as [channel, value]...]. */
function compile(script: Script) {
  return script.events.map((e) => ({
    t: e.t,
    base: PRESET_VALUES[e.preset],
    set: Object.entries(e.set ?? {}).map(([k, v]) => [IDX[k], v as number] as [number, number]),
  }));
}

function targetsInto(out: number[], events: ReturnType<typeof compile>, t: number, seed: number, loopIdx: number) {
  'worklet';
  let e = events[0];
  for (let i = 0; i < events.length; i++) if (events[i].t <= t) e = events[i];
  for (let i = 0; i < N; i++) out[i] = e.base[i];
  for (let i = 0; i < e.set.length; i++) out[e.set[i][0]] = e.set[i][1];
  // Micro-saccades: a new small eye offset every 0.6-1.5 s (only meaningful when looking).
  let st = 0;
  let k = 0;
  while (k < 200) {
    const next = st + L.saccade.min + (L.saccade.max - L.saccade.min) * rand(seed + loopIdx * 31, k * 2);
    if (next > t) break;
    st = next;
    k++;
  }
  out[IDX.saccadeX] = (rand(seed + loopIdx * 31, k * 2 + 1) * 2 - 1) * L.saccade.amount;
  out[IDX.saccadeY] = (rand(seed + loopIdx * 47, k * 2 + 1) * 2 - 1) * L.saccade.amount * 0.6;
}

// ---------------------------------------------------------------------------
// Analytic layers (no springs: exact functions of time)
// ---------------------------------------------------------------------------

/** A hop: anticipation dip, take-off stretch, a parabola, a landing squash that settles. */
export function hopAt(t: number, h0: number, height: number): { rootY: number; squash: number } {
  'worklet';
  const H = L.hop;
  const u = t - h0;
  if (u < 0) return { rootY: 0, squash: 0 };
  if (u < H.anticipation) {
    const a = u / H.anticipation;
    return { rootY: H.dip * Math.sin((a * Math.PI) / 2), squash: H.dipSquash * Math.sin((a * Math.PI) / 2) };
  }
  const ua = u - H.anticipation;
  if (ua < H.air) {
    const a = ua / H.air;
    const lift = 4 * a * (1 - a);
    // Stretch at take-off and just before landing, neutral at the top.
    const stretch = H.stretch * (a < 0.5 ? 1 - a * 2 : (a - 0.5) * 2) * 0.8;
    return { rootY: -height * lift + H.dip * (1 - a) * (1 - a), squash: -stretch };
  }
  const ul = ua - H.air;
  // Landing: squash (scaleY 0.88 / scaleX 1.10 at squash 1), settling with a soft bounce.
  const s = Math.exp(-ul / H.landDecay) * Math.cos(ul * H.landFreq);
  return { rootY: 0, squash: H.landSquash * s };
}

function blinkAt(t: number, seed: number, loopIdx: number): number {
  'worklet';
  const B = L.blink;
  let bt = B.first;
  for (let k = 0; k < 64; k++) {
    const twice = rand(seed + loopIdx * 13, k * 3 + 2) < B.doubleChance;
    for (let r = 0; r < (twice ? 2 : 1); r++) {
      const start = bt + r * B.doubleGap;
      const u = t - start;
      if (u >= 0 && u < B.close + B.open) {
        return u < B.close ? Math.sin((u / B.close) * (Math.PI / 2)) : Math.cos(((u - B.close) / B.open) * (Math.PI / 2));
      }
    }
    bt += B.min + (B.max - B.min) * rand(seed + loopIdx * 13, k * 3);
    if (bt > t + 1) break;
  }
  return 0;
}

function earTwitchAt(t: number, seed: number, loopIdx: number): [number, number] {
  'worklet';
  const E = L.earTwitch;
  let et = E.first;
  for (let k = 0; k < 32; k++) {
    const u = t - et;
    if (u >= 0 && u < E.length) {
      const v = E.amount * Math.sin((u / E.length) * Math.PI) * Math.cos((u / E.length) * Math.PI * 2);
      return rand(seed + loopIdx * 7, k * 2 + 1) < 0.5 ? [v, 0] : [0, v];
    }
    et += E.min + (E.max - E.min) * rand(seed + loopIdx * 7, k * 2);
    if (et > t + 1) break;
  }
  return [0, 0];
}

// ---------------------------------------------------------------------------
// rigAt: the pose at an exact time
// ---------------------------------------------------------------------------

export interface CompiledScript { events: ReturnType<typeof compile>; hops: number[]; loop: number; seed: number }

export function compileScript(script: Script): CompiledScript {
  return { events: compile(script), hops: script.hops, loop: script.loop, seed: script.seed };
}

export function rigAt(cs: CompiledScript, time: number): RigParams {
  'worklet';
  const loopIdx = Math.floor(time / cs.loop);
  const t = time - loopIdx * cs.loop;
  const dt = L.step;
  const steps = Math.round(L.window / dt);
  const x = new Array<number>(N);
  const v = new Array<number>(N).fill(0);
  const target = new Array<number>(N);
  // Start at rest on the targets at the window start (clamped to the loop start: the loop
  // wraps through the script's first event, which matches the last one at the seam).
  const t0 = Math.max(0, t - L.window);
  targetsInto(x, cs.events, t0, cs.seed, loopIdx);
  // Secondary motion: ear jiggle and head lag follow the root's vertical acceleration.
  let jig = 0;
  let jigV = 0;
  let lag = 0;
  let lagV = 0;
  const rootAt = (tt: number) => {
    let y = 0;
    for (let i = 0; i < cs.hops.length; i++) y += hopAt(tt, cs.hops[i], L.hop.height).rootY;
    return y;
  };
  const n = t0 === 0 ? Math.round(t / dt) : steps;
  let tt = t - n * dt;
  for (let s = 0; s < n; s++) {
    tt += dt;
    targetsInto(target, cs.events, tt, cs.seed, loopIdx);
    for (let i = 0; i < N; i++) {
      const w = OMEGA[i];
      const a = w * w * (target[i] - x[i]) - 2 * ZETA[i] * w * v[i];
      v[i] += a * dt;
      x[i] += v[i] * dt;
    }
    const acc = (rootAt(tt + dt) - 2 * rootAt(tt) + rootAt(tt - dt)) / (dt * dt);
    const J = L.jiggle;
    const ja = -J.omega * J.omega * jig - 2 * J.zeta * J.omega * jigV + J.gain * acc;
    jigV += ja * dt;
    jig += jigV * dt;
    const la = -J.omega * J.omega * lag - 2 * J.zeta * J.omega * lagV + J.headGain * acc;
    lagV += la * dt;
    lag += lagV * dt;
  }

  const out = {} as Record<string, number>;
  for (let i = 0; i < RIG_KEYS.length; i++) out[RIG_KEYS[i]] = x[i];
  const p = out as unknown as RigParams;

  // Hops (root and squash), breathing, sway, waving, blinks, ear twitches, jiggle.
  for (let i = 0; i < cs.hops.length; i++) {
    const h = hopAt(t, cs.hops[i], L.hop.height);
    p.rootY += h.rootY;
    p.squash += h.squash;
  }
  const sleep = x[IDX.sleepiness];
  const osc = (T: number) => 0.5 - 0.5 * Math.cos((2 * Math.PI * time) / T);
  p.breath = (1 - sleep) * osc(L.breath.period) + sleep * L.breath.sleepDepth * osc(L.breath.sleepPeriod);
  p.bodyLean += L.sway.amount * Math.sin((2 * Math.PI * time) / L.sway.period + L.sway.phase);
  const wave = x[IDX.wave];
  p.elbowL += wave * L.wave.elbow * Math.sin(2 * Math.PI * L.wave.rate * time);
  p.bodyLean += wave * L.wave.rock * Math.sin(2 * Math.PI * L.wave.rate * time);
  const closed = Math.min(1, p.eyeHappy + p.eyeSleepy + p.eyeSqueeze);
  p.blink = blinkAt(t, cs.seed, loopIdx) * (1 - closed);
  const tw = earTwitchAt(t, cs.seed, loopIdx);
  p.earAngleL += tw[0] + jig;
  p.earAngleR += tw[1] + jig;
  p.headLag += lag;
  return p;
}
