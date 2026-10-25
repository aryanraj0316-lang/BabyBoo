/**
 * The context director: decides what Buddy does at every moment from the
 * timeline beat, the phone state and touch input. Deterministic for a given
 * (time, loop index, input) so the Studio scrubber and the context tests see
 * exactly what plays.
 *
 * Priority (highest first):
 *  1. timeline beat behaviours,
 *  2. touch reactions (giggle) only in calm beats,
 *  3. idle layer (breathing, blinks, ear twitch), never blinking within
 *     250 ms of a key moment,
 *  4. one body action at a time with >= 300 ms between actions.
 */
import type { HeroConfig } from './heroConfig';
import {
  clamp01, keyTimes, lerp, loopEnd, loopStart, smoothstep, springStep, windowCurve,
  ballAt, type KeyTimes, type PhoneState,
} from './heroTimeline';
import type { FingerState } from './gesture';
import type { StageLayout } from './layout';
import { NEUTRAL_POSE, RIG, apply, stageMatrix, type MascotPose } from './mascot/rig';

// ---------------------------------------------------------------------------
// Deterministic randomness
// ---------------------------------------------------------------------------

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Actions and windows
// ---------------------------------------------------------------------------

export interface ActionWindow { name: string; start: number; end: number }

/** Body actions scheduled by the timeline (in timeline time). */
export function bodyActions(cfg: HeroConfig, K: KeyTimes = keyTimes(cfg), firstPass = true): ActionWindow[] {
  const B = cfg.beats;
  const waveCycle = 0.42;
  const out: ActionWindow[] = [];
  if (firstPass) {
    out.push({ name: 'intro+waveHello', start: 0, end: 0.35 + waveCycle * cfg.mascot.wave.cycles + 0.25 });
  }
  out.push({ name: 'concernedPerk', start: K.noticeIn + 0.15, end: B.dim.start + 0.3 });
  out.push({ name: 'yawn', start: B.deadHold.start + 0.05, end: K.fingerEnter - 0.15 });
  out.push({ name: 'curiousTilt', start: K.fingerEnter + 0.15, end: B.wake.start });
  out.push({ name: 'cheer', start: B.celebrate.start, end: B.celebrate.start + 1.1 });
  out.push({ name: 'waveHello', start: B.settle.start + 0.1, end: B.settle.start + 0.1 + 0.6 });
  return out;
}

/** Key moments a blink must stay 250 ms clear of. */
export function keyMoments(cfg: HeroConfig, K: KeyTimes = keyTimes(cfg)): number[] {
  return [K.noticeIn, K.offStart, K.blackAt, K.tapAt, K.s2End, loopStart(cfg), loopEnd(cfg)];
}

export interface Blink { t: number; down: number; up: number }

/** Lid-scripted windows where random blinks are not allowed. */
function scriptedEyeWindows(cfg: HeroConfig, K: KeyTimes): Array<[number, number]> {
  const B = cfg.beats;
  return [
    [K.blackAt + 0.4 - 0.1, K.blackAt + 0.4 + 0.7], // scripted slow blink
    [B.deadHold.start, K.fingerEnter + 0.45], // yawn + sleepy lids
    [B.celebrate.start - 0.1, B.celebrate.start + 1.3], // happy squint
    [K.s2End - 0.05, K.s2End + 0.45], // widen at swipe end
  ];
}

export function blinkSchedule(cfg: HeroConfig, loopIdx: number): Blink[] {
  const K = keyTimes(cfg);
  const rnd = mulberry32(1013 + loopIdx * 7919);
  const s = loopStart(cfg);
  const e = loopEnd(cfg);
  const excl: Array<[number, number]> = keyMoments(cfg, K).map((k) => [k - 0.25 - 0.26, k + 0.25]);
  for (const w of scriptedEyeWindows(cfg, K)) excl.push([w[0] - 0.26, w[1]]);
  const out: Blink[] = [];
  let t = s + 0.6 + rnd() * (cfg.mascot.blinkMax - cfg.mascot.blinkMin) * 0.5;
  let guard = 0;
  while (t < e - 0.6 && guard++ < 50) {
    const bad = excl.find(([a, b]) => t >= a && t <= b);
    if (bad) {
      t = bad[1] + 0.05;
      continue;
    }
    out.push({ t, down: 0.14, up: 0.12 });
    if (rnd() < 0.25) {
      const t2 = t + 0.34;
      if (!excl.some(([a, b]) => t2 >= a && t2 <= b) && t2 < e - 0.6) out.push({ t: t2, down: 0.12, up: 0.11 });
    }
    t += cfg.mascot.blinkMin + rnd() * (cfg.mascot.blinkMax - cfg.mascot.blinkMin);
  }
  return out;
}

export interface Twitch { t: number; side: 0 | 1; deg: number }

export function twitchSchedule(cfg: HeroConfig, loopIdx: number): Twitch[] {
  const rnd = mulberry32(4441 + loopIdx * 104729);
  const s = loopStart(cfg);
  const e = loopEnd(cfg);
  const out: Twitch[] = [];
  let t = s + 2 + rnd() * 4;
  while (t < e - 0.8) {
    out.push({ t, side: rnd() < 0.5 ? 0 : 1, deg: 6 + rnd() * 2 });
    t += 8 + rnd() * 6;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Director
// ---------------------------------------------------------------------------

export interface DirectorInput {
  t: number; // timeline time
  master: number; // master clock (first pass detection)
  cfg: HeroConfig;
  layout: StageLayout;
  phone: PhoneState;
  finger: FingerState;
  blinks: Blink[];
  twitches: Twitch[];
  touchW: number; // 0..1 how strongly a touch point attracts the gaze
  touchX: number; // canvas coords
  touchY: number;
  giggleAt: number; // timeline time of an accepted giggle (or -1e6)
  K: KeyTimes;
}

export interface DirectorOutput {
  pose: MascotPose;
  intent: string;
  gazeX: number; // canvas coords of the current gaze target
  gazeY: number;
  sparkle: number; // 0..1 sparkle intensity
  sparkleT: number; // seconds since sparkles started
}

const WAVE_CYCLE = 0.42;

function waveCurve(t: number, t0: number, cycles: number, amp: number): number {
  'worklet';
  const dt = t - t0;
  const dur = cycles * WAVE_CYCLE;
  if (dt <= 0 || dt > dur + 0.6) return 0;
  const env = springStep(dt, 16, 220) * (1 - smoothstep(dur - 0.1, dur + 0.45, dt));
  // Swing about a slightly raised base so the paw never covers the eye.
  return env * (-3 + amp * Math.sin((dt / WAVE_CYCLE) * Math.PI * 2));
}

function blinkClosure(t: number, blinks: Blink[]): number {
  'worklet';
  let c = 0;
  for (let i = 0; i < blinks.length; i++) {
    const b = blinks[i];
    const dt = t - b.t;
    if (dt < 0 || dt > b.down + b.up) continue;
    const v = dt < b.down ? smoothstep(0, b.down, dt) : 1 - smoothstep(b.down, b.down + b.up, dt);
    if (v > c) c = v;
  }
  return c;
}

/** Can a giggle start at time t? Only in calm beats, clear of other actions. */
export function giggleAllowed(t: number, cfg: HeroConfig, master: number): boolean {
  'worklet';
  const B = cfg.beats;
  const calm = (t >= B.playing.start && t < B.playing.end - 0.5) || (t >= B.settle.start && t < B.settle.end - 0.5);
  if (!calm) return false;
  // clear of the settle wave (+-300 ms) and the first-pass intro wave
  const ws = B.settle.start + 0.1;
  if (t > ws - 0.8 && t < ws + 0.6 + 0.3) return false;
  if (master < 2.6) return false;
  return true;
}

export function direct(inp: DirectorInput): DirectorOutput {
  'worklet';
  const { t, cfg, layout, phone, finger, K } = inp;
  const B = cfg.beats;
  const mc = cfg.mascot;
  const pose: MascotPose = { ...NEUTRAL_POSE };
  let intent = 'watch';
  const firstPass = inp.master < B.playing.start + 2;
  const sq = mc.squash;

  // --- intro -------------------------------------------------------------
  if (inp.master < B.intro.end + 0.5) {
    const s = springStep(inp.master - 0.02, 12, 170);
    pose.introScale = lerp(0.92, 1, s);
    pose.opacity = smoothstep(0, 0.25, inp.master);
    // squash settle as the spring lands
    const land = Math.sin(clamp01(inp.master / 0.6) * Math.PI) * 0.03 * sq;
    pose.bodySy -= land * (1 - s * 0.5);
    pose.bodySx += land * (1 - s * 0.5);
    intent = 'intro';
  }

  // --- idle layer: breathing ---------------------------------------------
  const L = loopEnd(cfg) - loopStart(cfg);
  const period = L / Math.max(1, Math.round(L / 3.2));
  const bph = ((t - loopStart(cfg)) / period) * Math.PI * 2;
  const breath = 0.5 - 0.5 * Math.cos(bph);
  const breathLag = 0.5 - 0.5 * Math.cos(bph - 0.45);
  pose.bodySy *= 1 + mc.breath * breath;
  pose.bodySx *= 1 + mc.breath * 0.45 * breath;
  pose.headDy += -mc.breath * 1254 * 0.25 * (breathLag - breath);
  pose.earL += mc.earLag * 0.5 * (breathLag - breath) * 2;
  pose.earR -= mc.earLag * 0.5 * (breathLag - breath) * 2;

  // --- ear twitch ---------------------------------------------------------
  for (let i = 0; i < inp.twitches.length; i++) {
    const w = inp.twitches[i];
    const v = windowCurve(t, w.t, w.t + 0.32, 0.08, 0.2);
    if (v > 0) {
      if (w.side === 0) pose.earL -= w.deg * v;
      else pose.earR += w.deg * v;
    }
  }

  // --- gaze target (priority: finger > touch > content > battery > drift) --
  const scr = layout.screen;
  const ball = ballAt(phone.phase);
  // While the ball is off-screen (it wraps each cycle) look at the scene centre.
  const ballVis = smoothstep(-0.12, 0.06, ball.x) * (1 - smoothstep(0.94, 1.12, ball.x));
  let tx = scr.x + lerp(0.5, clamp01(ball.x), ballVis) * scr.w;
  let ty = scr.y + lerp(0.55, ball.y, ballVis) * scr.h;
  // idle drift blended in a little so the eyes are never frozen
  const lph = ((t - loopStart(cfg)) / (loopEnd(cfg) - loopStart(cfg))) * Math.PI * 2;
  tx += Math.sin(lph * 2) * scr.w * 0.06;
  ty += Math.sin(lph * 1 + 1) * scr.h * 0.03;
  // battery glance (eyes dart within 200 ms of the icon turning red)
  const glance = windowCurve(t, K.redAt + 0.08, K.redAt + 1.0, 0.1, 0.25);
  if (glance > 0) {
    tx = lerp(tx, scr.x + scr.w * 0.86, glance);
    ty = lerp(ty, scr.y + scr.h * 0.03, glance);
    pose.earL -= 4 * glance;
    pose.earR += 4 * glance;
    intent = 'glanceBattery';
  }
  // notice
  const noticeW = windowCurve(t, K.noticeIn + 0.05, B.dim.start + 0.2, 0.12, 0.4);
  if (noticeW > 0) {
    tx = lerp(tx, scr.x + scr.w * 0.5, noticeW);
    ty = lerp(ty, scr.y + scr.h * 0.11, noticeW);
  }
  // dimming: follow the fading light (screen centre, sinking)
  const dimW = windowCurve(t, B.dim.start, B.deadHold.start, 0.3, 0.4);
  if (dimW > 0) {
    tx = lerp(tx, scr.x + scr.w * 0.5, dimW);
    ty = lerp(ty, scr.y + scr.h * (0.45 + 0.15 * clamp01((t - B.dim.start) / 1.6)), dimW);
  }
  // touch point
  if (inp.touchW > 0) {
    tx = lerp(tx, inp.touchX, inp.touchW);
    ty = lerp(ty, inp.touchY, inp.touchW);
  }
  // fingertip (120 ms lag so it feels alive, never locked)
  const fw = smoothstep(K.fingerEnter + 0.12, K.fingerEnter + 0.3, t) * (1 - smoothstep(K.revealStart + 0.1, K.revealStart + 0.4, t));
  if (fw > 0 && finger.visible > 0) {
    tx = lerp(tx, scr.x + finger.x * scr.w, fw);
    ty = lerp(ty, scr.y + finger.y * scr.h, fw);
  }

  // eye centres in canvas coords (neutral) for the gaze vector
  const stage = stageMatrix(layout.buddy.x, layout.buddy.y, layout.buddy.scale);
  const el = apply(stage, RIG.eyes.l.c[0], RIG.eyes.l.c[1]);
  const er = apply(stage, RIG.eyes.r.c[0], RIG.eyes.r.c[1]);
  const mx = (el[0] + er[0]) / 2;
  const my = (el[1] + er[1]) / 2;
  const dx = tx - mx;
  const dy = ty - my;
  const dist = Math.hypot(dx, dy) || 1;
  const reach = Math.min(1, dist / (layout.buddy.width * 0.45));
  let gx = (dx / dist) * reach;
  let gy = (dy / dist) * reach;
  // vertical gaze is gentler (eye ellipse is taller than it moves)
  gy *= 0.8;
  const eyeW = RIG.eyes.l.r[0] * 2;
  const amp = 0.06 * eyeW * mc.gaze;
  // slight convergence for near targets, never more than 4% of eye width
  const conv = 0.04 * eyeW * clamp01(1 - dist / layout.buddy.width) * 0.6;
  pose.eyeLX = gx * amp + conv;
  pose.eyeRX = gx * amp - conv;
  pose.eyeLY = gy * amp;
  pose.eyeRY = gy * amp;
  pose.faceParX = gx * mc.faceParallax;
  pose.faceParY = gy * mc.faceParallax * 0.5;
  pose.headRot += gx * 2.5;

  // --- beat behaviours -----------------------------------------------------
  // watch: soft head tilt toward the phone during calm playback
  const watchW = windowCurve(t, B.playing.start - 0.5, B.dim.end, 0.4, 0.5) + windowCurve(t, B.wake.end, B.settle.end + 0.6, 0.4, 0.01);
  pose.headRot += 3 * clamp01(watchW);

  // intro wave (first pass only) and settle wave
  if (firstPass) pose.arm += waveCurve(inp.master, 0.35, mc.wave.cycles, mc.wave.amplitudeDeg);
  const settleWave = waveCurve(t, B.settle.start + 0.1, 1, mc.wave.amplitudeDeg * 0.85);
  pose.arm += settleWave;
  if (firstPass && inp.master < 0.35 + mc.wave.cycles * WAVE_CYCLE + 0.3) intent = 'waveHello';
  if (Math.abs(settleWave) > 0.5) intent = 'waveHello';
  pose.lean += (pose.arm / Math.max(mc.wave.amplitudeDeg, 1)) * -0.8;

  // concerned perk at the notice: rise 1.5%, lean toward the phone, ears back
  const perk = windowCurve(t, K.noticeIn + 0.15, B.dim.start + 0.3, 0.25, 0.4);
  if (perk > 0) {
    const ant = -0.004 * windowCurve(t, K.noticeIn + 0.05, K.noticeIn + 0.2, 0.05, 0.05);
    pose.bodyDy += -0.015 * perk * sq + ant * -1;
    pose.lean += 1.2 * perk;
    pose.earL += 3 * perk;
    pose.earR -= 3 * perk;
    intent = 'concernedPerk';
  }
  // dimming: smile softens (corners down ~8%)
  const soft = smoothstep(B.dim.start, B.dim.end, t) * (1 - smoothstep(B.deadHold.start, B.deadHold.start + 0.2, t));
  // slow blink ~400 ms after black
  const slow = windowCurve(t, K.blackAt + 0.4, K.blackAt + 0.4 + 0.6, 0.28, 0.3);
  if (t >= B.off.start && t < B.deadHold.start) intent = 'lightsOut';
  // yawn: head back 6 deg, lids to half, mouth O held 0.7 s
  const y0 = B.deadHold.start + 0.05;
  const yawnOpen = smoothstep(y0, y0 + 0.18, t) * (1 - smoothstep(y0 + 0.88, y0 + 1.0, t));
  const yawnHead = windowCurve(t, y0 - 0.08, y0 + 1.0, 0.3, 0.25);
  if (yawnHead > 0) {
    pose.headRot += -6 * yawnHead;
    pose.headDy += -6 * yawnHead;
    pose.earL -= 2 * yawnHead;
    pose.earR += 2 * yawnHead;
    intent = 'yawn';
  }
  const sleepy = windowCurve(t, y0 + 0.05, K.fingerEnter + 0.3, 0.2, 0.15);
  // curious tilt when the finger appears (150 ms after it enters)
  const cur = windowCurve(t, K.fingerEnter + 0.15, B.wake.start + 0.2, 0.22, 0.4);
  const curPeak = windowCurve(t, K.fingerEnter + 0.15, K.s1Start + 0.3, 0.22, 0.5);
  if (cur > 0) {
    pose.headRot += 7 * curPeak + 3 * (cur - curPeak);
    pose.earL -= 3 * cur;
    pose.earR -= 3 * cur;
    intent = t < K.s1Start ? 'curiousTilt' : 'followSwipe';
  }
  // eyes widen 6% when he notices, and again as the swipe ends
  const widen = 0.06 * Math.max(curPeak, windowCurve(t, K.s2End, K.s2End + 0.4, 0.06, 0.2));
  pose.wide += widen;
  if (t >= K.s2End && t < K.s2End + 0.4) intent = 'swipeDone';
  // wake: smile opens, cheeks glow
  const wakeW = windowCurve(t, K.revealStart, B.celebrate.start + 0.2, 0.2, 0.2);
  if (wakeW > 0) intent = 'wake';
  // cheer: arm raised, one gentle hop, happy squint, sparkles
  const c0 = B.celebrate.start;
  const cheerW = windowCurve(t, c0, c0 + 1.1, 0.15, 0.3) * mc.cheer;
  let sparkle = 0;
  if (cheerW > 0) {
    pose.arm += 9 * cheerW;
    const hopT = t - c0 - 0.12;
    const hop = hopT > 0 && hopT < 0.5 ? Math.sin((hopT / 0.5) * Math.PI) : 0;
    const antic = windowCurve(t, c0, c0 + 0.16, 0.06, 0.08); // crouch before the hop
    const land = windowCurve(t, c0 + 0.6, c0 + 0.85, 0.05, 0.18);
    pose.bodyDy += -0.03 * hop * mc.cheer;
    const sy = 1 - (0.025 * antic + 0.035 * land) * sq * mc.cheer + 0.02 * hop * sq * mc.cheer;
    pose.bodySy *= sy;
    pose.bodySx *= 1 / sy;
    pose.squint = Math.max(pose.squint, 0.42 * windowCurve(t, c0 + 0.05, c0 + 1.2, 0.12, 0.25));
    pose.cheek = 1 + 0.2 * cheerW;
    sparkle = windowCurve(t, c0 + 0.15, c0 + 1.4, 0.1, 0.5);
    intent = 'cheer';
  }

  // touch giggle (accepted only in calm beats by the caller)
  const gt = t - inp.giggleAt;
  if (gt >= 0 && gt < 0.6) {
    const g = Math.sin((gt / 0.6) * Math.PI);
    const wob = Math.sin(gt * 30) * (1 - gt / 0.6);
    const sy = 1 - 0.035 * g * sq + 0.012 * wob * sq;
    pose.bodySy *= sy;
    pose.bodySx *= 1 / sy;
    pose.squint = Math.max(pose.squint, 0.3 * g);
    pose.cheek = Math.max(pose.cheek, 1 + 0.3 * g);
    intent = 'giggle';
  }

  // --- eyes: blinks, slow blink, sleepy lids, yawn --------------------------
  const blink = blinkClosure(t, inp.blinks);
  const lid = Math.max(blink, slow, 0.5 * Math.max(sleepy, yawnOpen));
  pose.openL = 1 - lid;
  pose.openR = 1 - lid;

  // --- mouth weights ---------------------------------------------------------
  const o = yawnOpen;
  const small = sleepy * (1 - o);
  const sft = soft * (1 - o) * (1 - small);
  pose.mouthO = o;
  pose.mouthSmall = small;
  pose.mouthSoft = sft;
  pose.mouthSmile = Math.max(0, 1 - o - small - sft);

  // --- safety limits (uncanny limits) ---------------------------------------
  pose.headRot = Math.max(-8, Math.min(8, pose.headRot));
  pose.earL = Math.max(-10, Math.min(10, pose.earL));
  pose.earR = Math.max(-10, Math.min(10, pose.earR));
  pose.arm = Math.max(-24, Math.min(24, pose.arm));
  pose.bodySx = Math.max(0.95, Math.min(1.05, pose.bodySx));
  pose.bodySy = Math.max(0.95, Math.min(1.05, pose.bodySy));

  return { pose, intent, gazeX: tx, gazeY: ty, sparkle, sparkleT: t - c0 - 0.15 };
}

// ---------------------------------------------------------------------------
// Sparkles (deterministic, around Buddy's raised paw and head, never on the
// phone's swipe area)
// ---------------------------------------------------------------------------

export function sparkleAt(i: number, tSince: number, layout: StageLayout): { x: number; y: number; s: number; a: number } {
  'worklet';
  const seed = i * 12.9898;
  const fr = (v: number) => {
    'worklet';
    const x = Math.sin(v) * 43758.5453;
    return x - Math.floor(x);
  };
  const delay = fr(seed) * 0.5;
  const life = 0.9 + fr(seed + 1) * 0.4;
  const u = (tSince - delay) / life;
  if (u <= 0 || u >= 1) return { x: 0, y: 0, s: 0, a: 0 };
  // region: above / left of the head and paw, in source coords
  const sx = 120 + fr(seed + 2) * 520;
  const sy = 140 + fr(seed + 3) * 380;
  const stage = stageMatrix(layout.buddy.x, layout.buddy.y, layout.buddy.scale);
  const p = apply(stage, sx, sy - u * 60);
  const minX = 4;
  const maxX = layout.phone.x - 4; // keep sparkles off the phone entirely
  const x = Math.max(minX, Math.min(maxX, p[0]));
  const y = Math.max(4, p[1]);
  const a = Math.sin(u * Math.PI);
  return { x, y, s: (0.6 + fr(seed + 4) * 0.6) * a, a: a * 0.9 };
}
