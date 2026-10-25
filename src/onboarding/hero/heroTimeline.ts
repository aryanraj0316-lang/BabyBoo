/**
 * Pure beat, easing and phone-state math for the Screen 1 hero.
 * No React. Every function is a worklet so it can run on the UI thread and
 * equally in Node (tests) or the Vite web companion.
 */
import { BEAT_ORDER, CARTOON_PALETTES, type BeatId, type HeroConfig } from './heroConfig';

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------

export function clamp01(x: number): number {
  'worklet';
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export function lerp(a: number, b: number, t: number): number {
  'worklet';
  return a + (b - a) * t;
}

export function smoothstep(e0: number, e1: number, x: number): number {
  'worklet';
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

/** CSS-style cubic-bezier easing, solved with Newton + bisection. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number, t: number): number {
  'worklet';
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  let u = t;
  for (let i = 0; i < 6; i++) {
    const x = ((ax * u + bx) * u + cx) * u - t;
    const dx = (3 * ax * u + 2 * bx) * u + cx;
    if (Math.abs(x) < 1e-5) break;
    if (Math.abs(dx) < 1e-6) break;
    u -= x / dx;
  }
  if (u < 0 || u > 1) {
    let lo = 0;
    let hi = 1;
    u = t;
    for (let i = 0; i < 20; i++) {
      const x = ((ax * u + bx) * u + cx) * u;
      if (x < t) lo = u;
      else hi = u;
      u = (lo + hi) / 2;
    }
  }
  return ((ay * u + by) * u + cy) * u;
}

/** Entrance easing (0.22, 1, 0.36, 1). */
export function easeEntrance(t: number): number {
  'worklet';
  return cubicBezier(0.22, 1, 0.36, 1, clamp01(t));
}

/** State-change easing (0.4, 0, 0.2, 1). */
export function easeState(t: number): number {
  'worklet';
  return cubicBezier(0.4, 0, 0.2, 1, clamp01(t));
}

export function easeIn(t: number): number {
  'worklet';
  const x = clamp01(t);
  return x * x * x;
}

/**
 * Step response of a damped spring (mass 1), 0 -> 1 with overshoot.
 * Default damping 14, stiffness 160 as specified for mascot motion.
 */
export function springStep(dt: number, damping = 14, stiffness = 160): number {
  'worklet';
  if (dt <= 0) return 0;
  const w0 = Math.sqrt(stiffness);
  const zeta = damping / (2 * w0);
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w0 * dt) * (Math.cos(wd * dt) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * dt));
  }
  return 1 - Math.exp(-w0 * dt) * (1 + w0 * dt);
}

/** A pulse that springs up at t0 and settles back after `hold` seconds. */
export function springPulse(t: number, t0: number, hold: number, damping = 14, stiffness = 160): number {
  'worklet';
  return springStep(t - t0, damping, stiffness) - springStep(t - t0 - hold, damping, stiffness);
}

/** Smooth window: rises over `rise`, holds, falls over `fall`. */
export function windowCurve(t: number, t0: number, t1: number, rise: number, fall: number): number {
  'worklet';
  return smoothstep(t0, t0 + rise, t) * (1 - smoothstep(t1 - fall, t1, t));
}

// ---------------------------------------------------------------------------
// Clock and beats
// ---------------------------------------------------------------------------

export function loopStart(cfg: HeroConfig): number {
  'worklet';
  return cfg.beats.playing.start;
}

export function loopEnd(cfg: HeroConfig): number {
  'worklet';
  return cfg.beats.settle.end;
}

/** Master clock (seconds since start) -> timeline time. The intro plays once. */
export function timelineTime(master: number, cfg: HeroConfig): number {
  'worklet';
  const s = loopStart(cfg);
  const e = loopEnd(cfg);
  if (master < s) return master;
  if (!cfg.loop) return Math.min(master, e);
  return s + ((master - s) % (e - s));
}

/** Which pass through the loop we are on (0 for the intro and first loop). */
export function loopIndex(master: number, cfg: HeroConfig): number {
  'worklet';
  const s = loopStart(cfg);
  if (master < s || !cfg.loop) return 0;
  return Math.floor((master - s) / (loopEnd(cfg) - s));
}

export function beatIndexAt(t: number, cfg: HeroConfig): number {
  'worklet';
  for (let i = BEAT_ORDER.length - 1; i >= 0; i--) {
    if (t >= cfg.beats[BEAT_ORDER[i]].start) return i;
  }
  return 0;
}

export function beatAt(t: number, cfg: HeroConfig): BeatId {
  'worklet';
  return BEAT_ORDER[beatIndexAt(t, cfg)];
}

export function beatProgress(t: number, cfg: HeroConfig, id: BeatId): number {
  'worklet';
  const b = cfg.beats[id];
  return clamp01((t - b.start) / (b.end - b.start));
}

// ---------------------------------------------------------------------------
// Phone state
// ---------------------------------------------------------------------------

function drainShape(u: number, curve: number): number {
  'worklet';
  // Blend of linear and ease-in-out so it stays readable but not robotic.
  const e = u * u * (3 - 2 * u);
  return lerp(u, e, curve);
}

export function batteryAt(t: number, cfg: HeroConfig): number {
  'worklet';
  const B = cfg.beats;
  const bat = cfg.battery;
  if (t < B.drain.start) return bat.start;
  if (t < B.drain.end) {
    const u = (t - B.drain.start) / (B.drain.end - B.drain.start);
    return lerp(bat.start, bat.mid, drainShape(u, bat.drainCurve));
  }
  if (t < B.wake.start) {
    const u = clamp01((t - B.warning.start) / 0.2);
    return lerp(bat.mid, bat.end, u);
  }
  return bat.start;
}

export function batteryCrossTime(cfg: HeroConfig, level: number): number {
  'worklet';
  const B = cfg.beats;
  const bat = cfg.battery;
  if (level >= bat.start) return B.drain.start;
  if (level <= bat.mid) return B.drain.end;
  // invert drainShape by bisection
  const target = (bat.start - level) / (bat.start - bat.mid);
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const m = (lo + hi) / 2;
    if (drainShape(m, bat.drainCurve) < target) lo = m;
    else hi = m;
  }
  return B.drain.start + ((lo + hi) / 2) * (B.drain.end - B.drain.start);
}

// ---------------------------------------------------------------------------
// Key moments (shared with the director and the tests)
// ---------------------------------------------------------------------------

export interface KeyTimes {
  redAt: number; // battery crosses the red threshold
  oneAt: number; // battery reaches the final 1%
  noticeIn: number; // notice starts sliding in
  noticeOut: number; // notice gone
  offStart: number;
  blackAt: number; // fully black
  fingerEnter: number;
  tapAt: number; // finger touches the dead screen
  glyphStart: number;
  s1Start: number;
  s1End: number;
  s2Start: number;
  s2End: number; // swipe ends
  revealStart: number;
  revealEnd: number;
  fingerGone: number;
}

export function keyTimes(cfg: HeroConfig): KeyTimes {
  'worklet';
  const B = cfg.beats;
  const sp = cfg.finger.speed;
  const unlockLen = B.unlock.end - B.unlock.start;
  const s1Start = B.unlock.start + 0.1;
  let s1Dur = 1.05 / sp;
  let lift = 0.32 / sp;
  let s2Dur = 0.5 / sp;
  const avail = unlockLen - 0.35;
  const need = s1Dur + lift + s2Dur;
  if (need > avail) {
    const k = avail / need;
    s1Dur *= k;
    lift *= k;
    s2Dur *= k;
  }
  const tapAt = B.tap.start + 0.6;
  return {
    redAt: batteryCrossTime(cfg, cfg.battery.redBelow),
    oneAt: B.warning.start + 0.2,
    noticeIn: B.warning.start,
    noticeOut: B.dim.end + 0.18,
    offStart: B.off.start,
    blackAt: B.off.start + 0.38,
    fingerEnter: B.tap.start,
    tapAt,
    glyphStart: tapAt,
    s1Start,
    s1End: s1Start + s1Dur,
    s2Start: s1Start + s1Dur + lift,
    s2End: s1Start + s1Dur + lift + s2Dur,
    revealStart: B.wake.start,
    revealEnd: B.wake.start + 0.7,
    fingerGone: B.wake.start + 0.7,
  };
}

/** Cartoon time-scale: 1 normally, eases to 0.4 while dimming, stops while dark. */
function cartoonTimeIntegral(t: number, cfg: HeroConfig): number {
  'worklet';
  const B = cfg.beats;
  const d0 = B.dim.start;
  const d1 = B.dim.end;
  const o1 = B.off.end;
  const w0 = B.wake.start;
  let acc = Math.min(t, d0);
  if (t <= d0) return acc;
  const D = d1 - d0;
  const u = clamp01((t - d0) / D);
  // integral of 1 - 0.6 * smoothstep(u) = u - 0.6 (u^3 - u^4/2)
  acc += D * (u - 0.6 * (u * u * u - (u * u * u * u) / 2));
  if (t <= d1) return acc;
  const O = o1 - d1;
  const v = clamp01((t - d1) / O);
  acc += O * (0.4 * v - 0.2 * v * v); // 0.4 -> 0 linearly
  if (t <= w0) return acc;
  return acc + (t - w0);
}

export function cartoonPeriod(cfg: HeroConfig): number {
  'worklet';
  const total = cartoonTimeIntegral(loopEnd(cfg), cfg) - cartoonTimeIntegral(loopStart(cfg), cfg);
  const n = Math.max(1, Math.round(total / 4.2));
  return total / n;
}

/** Cartoon phase 0..1, seamless across the loop. */
export function cartoonPhase(t: number, cfg: HeroConfig): number {
  'worklet';
  const P = cartoonPeriod(cfg);
  const c = cartoonTimeIntegral(t, cfg) - cartoonTimeIntegral(loopStart(cfg), cfg);
  const ph = (c / P) % 1;
  return ph < 0 ? ph + 1 : ph;
}

/** Ball centre in normalized screen coordinates for a cartoon phase. */
export function ballAt(phase: number): { x: number; y: number; squash: number } {
  'worklet';
  // Two bounces per cycle, travelling left to right and wrapping off-screen.
  const x = -0.12 + phase * 1.24;
  const b = (phase * 2) % 1;
  const h = 4 * b * (1 - b); // parabola 0..1..0
  const ground = 0.705;
  const y = ground - h * 0.22;
  const squash = b < 0.07 || b > 0.93 ? 1 - 0.25 * (1 - Math.min(b, 1 - b) / 0.07) : 1;
  return { x, y, squash };
}

// ---------------------------------------------------------------------------
// Reels feed: generic short-video cards that auto-swipe up. No real apps,
// brands, people or text. Driven by the same content clock as the cartoon,
// so it slows while dimming, stops while dark and loops seamlessly.
// ---------------------------------------------------------------------------

export interface ReelStyle {
  top: string;
  bottom: string;
  blob: string;
  accent: string;
  motion: 0 | 1 | 2 | 3; // bounce, orbit, float, wave
  size: number; // blob radius as a fraction of screen width
}

export const REEL_STYLES: ReelStyle[] = [
  { top: '#FFB4C8', bottom: '#FFE3B0', blob: '#FF6F91', accent: '#FFF4D6', motion: 0, size: 0.11 },
  { top: '#9FD8FF', bottom: '#D9C8FF', blob: '#5B8CFF', accent: '#FFFFFF', motion: 1, size: 0.1 },
  { top: '#B8F0C8', bottom: '#E8FFD8', blob: '#3FBF7F', accent: '#FFFFFF', motion: 2, size: 0.12 },
  { top: '#7FD3E8', bottom: '#2E86C1', blob: '#FFD166', accent: '#E9F9FF', motion: 3, size: 0.09 },
  { top: '#E3C2FF', bottom: '#FFC7E8', blob: '#A45CFF', accent: '#FFE8F5', motion: 1, size: 0.12 },
  { top: '#FFE08A', bottom: '#FFB385', blob: '#FF8A3D', accent: '#FFFFFF', motion: 0, size: 0.1 },
];

const REEL_HOLD = 0.78; // fraction of each reel spent playing before the swipe

export interface ReelState {
  idx: number; // current reel (seamless modulo the loop's reel count)
  next: number;
  swipe: number; // 0..1 transition to the next reel
  local: number; // seconds into the current reel
  localNext: number;
  justSwiped: number; // seconds since the last swipe finished (for reactions)
  swipeStart: number; // seconds until the next swipe starts (negative while swiping)
}

export function contentTime(t: number, cfg: HeroConfig): number {
  'worklet';
  return cartoonTimeIntegral(t, cfg) - cartoonTimeIntegral(loopStart(cfg), cfg);
}

export function reelAt(t: number, cfg: HeroConfig): ReelState {
  'worklet';
  const total = cartoonTimeIntegral(loopEnd(cfg), cfg) - cartoonTimeIntegral(loopStart(cfg), cfg);
  const n = Math.max(1, Math.round(total / 2.1));
  const D = total / n;
  const c = contentTime(t, cfg);
  const raw = Math.floor(c / D);
  const u = c / D - raw;
  const idx = ((raw % n) + n) % n;
  const w = (u - REEL_HOLD) / (1 - REEL_HOLD);
  const s = w <= 0 ? 0 : w >= 1 ? 1 : w < 0.5 ? 4 * w * w * w : 1 - Math.pow(-2 * w + 2, 3) / 2;
  return {
    idx,
    next: (idx + 1) % n,
    swipe: s,
    local: u * D,
    localNext: Math.max(0, (u - REEL_HOLD) * D),
    justSwiped: u * D,
    swipeStart: (REEL_HOLD - u) * D,
  };
}

/** The reel subject's position (normalized screen coords) for a style. */
export function reelSubject(style: ReelStyle, local: number): { x: number; y: number; squash: number } {
  'worklet';
  if (style.motion === 0) {
    const b = Math.abs(Math.sin(local * 3.2));
    return { x: 0.5 + 0.22 * Math.sin(local * 1.4), y: 0.62 - 0.2 * b, squash: b < 0.12 ? 0.8 + 1.6 * b : 1 };
  }
  if (style.motion === 1) return { x: 0.5, y: 0.47 + 0.02 * Math.sin(local * 2.4), squash: 1 + 0.06 * Math.sin(local * 5) };
  if (style.motion === 2) return { x: 0.5 + 0.06 * Math.sin(local * 1.7), y: 0.52 + 0.05 * Math.sin(local * 2.1), squash: 1 };
  return { x: 0.3 + 0.4 * (0.5 + 0.5 * Math.sin(local * 0.9)), y: 0.58 + 0.03 * Math.sin(local * 4.2), squash: 1 };
}

/** Where the viewer's eye goes on the feed right now (normalized). */
export function reelFocus(t: number, cfg: HeroConfig): { x: number; y: number } {
  'worklet';
  const r = reelAt(t, cfg);
  const a = reelSubject(REEL_STYLES[r.idx % REEL_STYLES.length], r.local);
  const b = reelSubject(REEL_STYLES[r.next % REEL_STYLES.length], r.localNext);
  const ya = a.y - r.swipe;
  const yb = b.y + (1 - r.swipe);
  return r.swipe < 0.5 ? { x: a.x, y: ya } : { x: b.x, y: yb };
}

export function reelTint(t: number, cfg: HeroConfig): [number, number, number] {
  'worklet';
  const r = reelAt(t, cfg);
  const h = (s: string, i: number) => {
    'worklet';
    return parseInt(s.slice(1 + i * 2, 3 + i * 2), 16) / 255;
  };
  const A = REEL_STYLES[r.idx % REEL_STYLES.length];
  const Bs = REEL_STYLES[r.next % REEL_STYLES.length];
  const out: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    const ca = (h(A.top, i) + h(A.bottom, i)) / 2;
    const cb = (h(Bs.top, i) + h(Bs.bottom, i)) / 2;
    out[i] = ca + (cb - ca) * r.swipe;
  }
  return out;
}

export interface PhoneState {
  battery: number;
  red: boolean;
  notice: number; // 0 hidden .. 1 fully in
  dim: number; // black overlay 0..dimAmount
  saturation: number; // 1 .. 0.6
  black: number; // 0..1 full power-off black
  reveal: number; // 0..1 radial reveal progress after unlock
  revealX: number; // reveal centre, normalized screen coords
  revealY: number;
  glyph: number; // dead-battery glyph opacity 0..0.35
  ripple: number; // touch ripple progress 0..1 (0 = none)
  ripple2: number;
  phase: number; // cartoon phase
  screenLuma: number; // average light the screen emits 0..1
  intro: number; // phone intro 0..1
}

export function paletteLuma(name: string): { luma: number; r: number; g: number; b: number } {
  'worklet';
  const p = CARTOON_PALETTES[name] || CARTOON_PALETTES.meadow;
  const cols = [p.sky[0], p.sky[1], p.sky[1], p.hillBack, p.hillFront, p.hillFront];
  let r = 0;
  let g = 0;
  let b = 0;
  for (let i = 0; i < cols.length; i++) {
    const h = cols[i];
    r += parseInt(h.slice(1, 3), 16) / 255;
    g += parseInt(h.slice(3, 5), 16) / 255;
    b += parseInt(h.slice(5, 7), 16) / 255;
  }
  r /= cols.length;
  g /= cols.length;
  b /= cols.length;
  return { luma: 0.2126 * r + 0.7152 * g + 0.0722 * b, r, g, b };
}

export function phoneStateAt(t: number, cfg: HeroConfig, masterIn?: number): PhoneState {
  'worklet';
  const master = masterIn ?? t;
  const B = cfg.beats;
  const K = keyTimes(cfg);
  const battery = batteryAt(t, cfg);
  const notice = t < K.noticeIn || t >= K.noticeOut
    ? 0
    : easeEntrance((t - K.noticeIn) / 0.3) * (1 - smoothstep(K.noticeOut - 0.2, K.noticeOut, t));
  let dim = 0;
  let saturation = 1;
  if (t >= B.dim.start && t < B.wake.start) {
    const u = easeState((t - B.dim.start) / (B.dim.end - B.dim.start));
    dim = cfg.phone.dimAmount * u;
    saturation = 1 - 0.4 * u;
  }
  let black = 0;
  if (t >= B.off.start && t < B.wake.start) black = easeIn((t - B.off.start) / 0.38);
  let reveal = 0;
  if (t >= K.revealStart && t < B.wake.end) {
    reveal = easeEntrance((t - K.revealStart) / (K.revealEnd - K.revealStart));
  } else if (t >= B.wake.end) {
    reveal = 1;
  }
  if (t >= K.revealStart) {
    // content returns: no dim, no black outside the reveal circle beyond wake
    dim = t < B.wake.end ? cfg.phone.dimAmount * (1 - reveal) * 0 : 0;
    saturation = 1;
    black = t < B.wake.end ? 1 : 0;
  }
  const strokes = cfg.finger.strokes;
  const last = strokes[strokes.length - 1];
  const end = last[last.length - 1];
  const g = t - K.glyphStart;
  const glyph = g > 0 && g < 1.4 ? 0.35 * Math.sin((g / 1.4) * Math.PI) : 0;
  const r1 = t - K.tapAt;
  const ripple = r1 > 0 && r1 < 0.6 ? r1 / 0.6 : 0;
  const r2 = t - K.s2End;
  const ripple2 = r2 > 0 && r2 < 0.5 ? r2 / 0.5 : 0;
  const phase = cartoonPhase(t, cfg);
  const pl = paletteLuma(cfg.phone.palette);
  let lit = (1 - dim) * (1 - black);
  if (t >= K.revealStart && t < B.wake.end) lit = reveal * reveal;
  const intro = master < B.intro.end ? easeEntrance(master / (B.intro.end * 0.8)) : 1;
  return {
    battery,
    red: battery <= cfg.battery.redBelow,
    notice,
    dim,
    saturation,
    black,
    reveal,
    revealX: end[0],
    revealY: end[1],
    glyph,
    ripple,
    ripple2,
    phase,
    screenLuma: pl.luma * lit * (0.75 + 0.25 * saturation) * intro,
    intro,
  };
}
