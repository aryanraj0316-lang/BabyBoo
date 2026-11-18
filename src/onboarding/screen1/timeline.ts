/**
 * The demo timeline. `sceneAt(t, elapsed)` turns the master clock into every
 * animated value in the scene. It is one pure worklet: nothing in the scene
 * keeps its own timer, so nothing can drift, and any moment can be shown by
 * setting the clock (debug scrubber, reduced-motion still, tests).
 *
 *   t        loop time in seconds, 0..demo.loop
 *   elapsed  unwrapped time since the demo started; drives breathing and sway
 *            so they never jump at the loop seam
 *   motion   1 normally, 0 to switch off living motion (reduced motion)
 */
import { bezier, clamp, hexToRgb, lerp, mixRgb, progress, smoothstep, springAt, springDecay } from './anim';
import { BUDDY_BOUNDS, type BuddyFrameId } from './buddyMetrics.generated';
import { dialogueAt } from './dialogue';
import {
  battery as BAT, buddyLight as BL, buddyMotion as BM, buddyTimeline, demo, dim as DIM, dot as DOT, ease,
  emptyBattery as EB, haloTimeline as HT, home as HOME, homePill as PILL, loopSeam as SEAM, palette, spring,
  reelGesture as RG, swipes as SW, toast as TOAST, unlock as U,
} from './tokens';

// ---------------------------------------------------------------------------
// Resolved once, captured by the worklet
// ---------------------------------------------------------------------------

/** Frame ids in a fixed order; the scene draws one image per id. */
export const FRAME_IDS = Object.keys(BUDDY_BOUNDS) as BuddyFrameId[];

const EVENTS = buddyTimeline.map(([time, frame, big]) => ({
  time: time as number,
  frame: FRAME_IDS.indexOf(frame as BuddyFrameId),
  big: big as boolean,
}));

const C = {
  green: hexToRgb(palette.battery.green),
  amber: hexToRgb(palette.battery.amber),
  red: hexToRgb(palette.battery.red),
  haloCool: hexToRgb(palette.halo.cool),
  haloWarm: hexToRgb(palette.halo.warm),
  lightCool: hexToRgb(BL.cool.color),
  lightWarm: hexToRgb(BL.warm.color),
};

const STANDARD = ease.standard;
const DECELERATE = ease.decelerate;
const ACCELERATE = ease.accelerate;

/** Peak speed of a full-energy swipe, so the stretch can be normalised. */
const SWIPE_PEAK_V = (() => {
  let peak = 0;
  for (let i = 1; i < 400; i++) peak = Math.max(peak, springAt(i / 400, spring.snappy.stiffness, spring.snappy.dampingRatio).v);
  return peak;
})();

/** Time the dim finishes: from here the black lock layer replaces the dimmed feed. */
const DIM_END = DIM.at + DIM.length;

// Breathing: rate and depth change during the worried and sleepy windows. The
// phase is integrated ahead of time so changing the rate never jumps.
const BREATH_STEPS = 1100;
const BREATH_DT = demo.loop / BREATH_STEPS;

function windowWeight(t: number, from: number, to: number, blend: number): number {
  'worklet';
  return smoothstep(progress(t, from - blend / 2, from + blend / 2)) * (1 - smoothstep(progress(t, to - blend / 2, to + blend / 2)));
}

function breathShape(t: number): { rate: number; amplitude: number } {
  'worklet';
  const b = BM.breath;
  const worried = windowWeight(t, b.worried.from, b.worried.to, b.blend);
  const sleepy = windowWeight(t, b.sleepy.from, b.sleepy.to, b.blend);
  const base = 1 - worried - sleepy;
  return {
    rate: base / b.period + worried / b.worried.period + sleepy / b.sleepy.period,
    amplitude: base * b.amplitude + worried * b.worried.amplitude + sleepy * b.sleepy.amplitude,
  };
}

const BREATH_PHASE: number[] = (() => {
  const out = [0];
  for (let i = 1; i <= BREATH_STEPS; i++) {
    const mid = (i - 0.5) * BREATH_DT;
    out.push(out[i - 1] + 2 * Math.PI * breathShape(mid).rate * BREATH_DT);
  }
  return out;
})();
const BREATH_PER_LOOP = BREATH_PHASE[BREATH_STEPS];

function breathPhase(t: number, elapsed: number): number {
  'worklet';
  const loops = Math.floor(elapsed / demo.loop);
  const f = clamp(t / BREATH_DT, 0, BREATH_STEPS);
  const i = Math.min(BREATH_STEPS - 1, Math.floor(f));
  const within = lerp(BREATH_PHASE[i], BREATH_PHASE[i + 1], f - i);
  return loops * BREATH_PER_LOOP + within;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface SceneState {
  dialogueId: number;
  dialogueOpacity: number;
  // Feed (reels, status bar, toast, empty battery, dim)
  feedOpacity: number;
  feedTime: number; // the feed's own time: frozen at 0 while it fades back in at the seam
  feedOffset: number; // in reel heights
  feedStretch: number; // vertical scale while swiping fast
  reelGestureOpacity: number;
  reelGestureTravel: number;
  environmentTime: number;
  environmentMotion: number;
  batteryLevel: number;
  batteryColor: [number, number, number];
  toastIn: number; // spring 0..1 (can overshoot)
  toastOut: number; // 0..1
  emptyIcon: number; // 0..1
  dim: number; // 0..1
  // Lock layer, home pill and the touch dot (fractions of the screen height)
  lockVisible: number;
  lockOffset: number;
  lockOpacity: number;
  pillOpacity: number;
  dotVisible: number;
  dotTravel: number;
  gestureProgress: number;
  dotScale: number;
  dotCore: number;
  dotRing: number;
  dotGlowScale: number;
  trailOpacity: number;
  // Home screen
  homeScale: number;
  iconsTime: number; // seconds since the icons began arriving (negative before)
  // Halo and light
  haloColor: [number, number, number];
  haloFactor: number;
  lightColor: [number, number, number];
  lightIntensity: number;
  shadowIntensity: number;
  // Buddy
  frameFrom: number;
  frameTo: number;
  frameMix: number;
  buddyScaleX: number;
  buddyScaleY: number;
  buddyRotate: number; // degrees
  buddyDy: number; // points, positive is down
  floorShadowScale: number;
  floorShadowOpacity: number;
}

function swipeOffset(t: number): { offset: number; speed: number } {
  'worklet';
  let offset = 0;
  let speed = 0;
  for (let i = 0; i < SW.times.length; i++) {
    const s = springAt(t - SW.times[i], spring.snappy.stiffness * SW.energy[i], spring.snappy.dampingRatio);
    offset += s.x * SW.distance[i];
    speed += s.v * SW.distance[i];
  }
  // The stall: travel part of the way, then settle back.
  const st = SW.stall;
  const local = t - st.time;
  if (local > 0) {
    if (local < st.rise) offset += st.reach * bezier(DECELERATE, local / st.rise);
    else offset += st.reach * springDecay(local - st.rise, spring.soft.stiffness, spring.soft.dampingRatio);
  }
  return { offset, speed };
}

function batteryColor(level: number): [number, number, number] {
  'worklet';
  const toAmber = 1 - smoothstep(progress(level, BAT.amberBelow - BAT.blend, BAT.amberBelow));
  const toRed = 1 - smoothstep(progress(level, BAT.redBelow - BAT.blend, BAT.redBelow));
  return mixRgb(mixRgb(C.green, C.amber, toAmber), C.red, toRed);
}

function popScale(dt: number): number {
  'worklet';
  const p = BM.pop;
  if (dt < 0) return 1;
  if (dt < p.downAt) return lerp(1, p.down, bezier(STANDARD, dt / p.downAt));
  if (dt < p.upAt) return lerp(p.down, p.up, bezier(STANDARD, (dt - p.downAt) / (p.upAt - p.downAt)));
  return 1 + (p.up - 1) * springDecay(dt - p.upAt, spring.bouncy.stiffness, spring.bouncy.dampingRatio);
}

function bounce(t: number): { dy: number; sx: number; sy: number; height: number } {
  'worklet';
  const b = BM.bounce;
  const tb = t - b.at;
  const rest = { dy: 0, sx: 1, sy: 1, height: 0 };
  if (tb < 0) return rest;
  const t1 = b.takeoff;
  const t2 = t1 + b.air;
  const t3 = t2 + b.land;
  const t4 = t3 + b.recover;
  if (tb < t1) {
    const k = smoothstep(tb / t1);
    return { dy: 0, sx: lerp(1, b.squash.x, k), sy: lerp(1, b.squash.y, k), height: 0 };
  }
  if (tb < t2) {
    const a = (tb - t1) / b.air;
    const height = 4 * a * (1 - a); // parabola, 1 at the top
    // Squash -> stretch at the top -> neutral as he comes down.
    const sx = a < 0.5 ? lerp(b.squash.x, b.stretch.x, smoothstep(a / 0.5)) : lerp(b.stretch.x, 1, smoothstep((a - 0.5) / 0.5));
    const sy = a < 0.5 ? lerp(b.squash.y, b.stretch.y, smoothstep(a / 0.5)) : lerp(b.stretch.y, 1, smoothstep((a - 0.5) / 0.5));
    return { dy: -b.height * height, sx, sy, height };
  }
  if (tb < t3) {
    const k = smoothstep((tb - t2) / b.land);
    return { dy: 0, sx: lerp(1, b.squash.x, k), sy: lerp(1, b.squash.y, k), height: 0 };
  }
  if (tb < t4) {
    const k = smoothstep((tb - t3) / b.recover);
    return { dy: 0, sx: lerp(b.squash.x, 1, k), sy: lerp(b.squash.y, 1, k), height: 0 };
  }
  return rest;
}

export function sceneAt(t: number, elapsed: number, motion: number): SceneState {
  'worklet';
  // ---- Feed --------------------------------------------------------------
  const seam = progress(t, SEAM.at, SEAM.at + SEAM.length);
  const inSeam = t >= SEAM.at;
  const feedT = inSeam ? 0 : t;
  const feedOpacity = inSeam ? bezier(STANDARD, seam) : t < DIM_END ? 1 : 0;

  const sw = swipeOffset(feedT);
  const feedStretch = 1 + SW.stretch * clamp(sw.speed / SWIPE_PEAK_V, 0, 1);
  let reelGestureOpacity = 0;
  let reelGestureTravel = 0;
  for (let i = 0; i < SW.times.length; i++) {
    const local = feedT - SW.times[i];
    if (local >= -RG.lead && local <= RG.end) {
      reelGestureOpacity = motion * smoothstep(progress(local, -RG.lead, RG.fadeInEnd)) * (1 - smoothstep(progress(local, RG.fadeOutFrom, RG.end)));
      reelGestureTravel = clamp(sw.offset - i, 0, 1);
    }
  }

  const drain = progress(feedT, BAT.drainFrom, BAT.drainTo);
  const batteryLevel = lerp(BAT.start, BAT.end, drain);

  const toastIn = feedT < TOAST.inAt ? 0 : springAt(feedT - TOAST.inAt, spring.snappy.stiffness, spring.snappy.dampingRatio).x;
  const toastOut = bezier(ACCELERATE, progress(feedT, TOAST.outAt, TOAST.outAt + 0.25));
  const emptyIcon = bezier(DECELERATE, progress(feedT, EB.inAt, EB.inAt + 0.25));
  const dimAmount = bezier(STANDARD, progress(feedT, DIM.at, DIM.at + DIM.length));

  // ---- Lock layer, pill, dot (Beat 4) ------------------------------------
  const u = t - demo.beats.unlock;
  const swipeP = bezier(DECELERATE, progress(u, U.swipe[0], U.swipe[1]));
  const releaseP = bezier(STANDARD, progress(u, U.release[0], U.release[1]));
  const exitP = bezier(ACCELERATE, progress(u, U.release[0], U.release[1]));
  const dotTravel = U.travelOfScreen * swipeP;

  // A screen-off letter gesture finishes before the dark layer fades away.
  const gestureProgress = progress(u, U.swipe[0], U.swipe[1]);
  const lockOffset = 0;
  const lockOpacity = 1 - exitP;
  const lockVisible = t >= DIM_END && u < U.release[1] ? 1 : 0;

  const appear = bezier(DECELERATE, progress(u, U.appear[0], U.appear[1]));
  const pillBase = PILL.opacity * progress(t, PILL.inAt, PILL.inAt + 0.25);
  const pillOpacity = lerp(pillBase, PILL.activeOpacity, appear);

  const settleFade = 1 - bezier(STANDARD, progress(u, U.settle[0], U.settle[1]));
  const dotVisible = u >= 0 && u < U.settle[1] ? 1 : 0;
  const dotScale = lerp(DOT.appearScale, 1, appear) * lerp(1, DOT.releaseScale, releaseP);
  const dotCore = appear * lerp(1, DOT.releaseCoreOpacity, releaseP) * settleFade;
  const dotRing = appear * (1 - releaseP);
  const pulse = Math.sin(Math.PI * progress(u, U.hold[0], U.hold[1]));
  const dotGlowScale = 1 + (DOT.glowPulse - 1) * pulse;
  const trailOpacity = 1 - releaseP;

  // ---- Home screen ---------------------------------------------------------
  const settle = springAt(u - U.settle[0], spring.soft.stiffness, spring.soft.dampingRatio).x;
  const homeScale = u < U.settle[0] ? HOME.scaleFrom : lerp(HOME.scaleFrom, 1, settle);
  const iconsTime = u - HOME.iconsFrom;

  // ---- Halo and the light on Buddy ----------------------------------------
  const warm = bezier(STANDARD, progress(t, HT.warmAt, HT.warmAt + HT.warmLength));
  const toCool = bezier(STANDARD, seam);
  const warmth = warm * (1 - toCool);
  const haloColor = mixRgb(C.haloCool, C.haloWarm, warmth);
  const haloFactor = t < HT.warmAt ? lerp(1, HT.dimFactor, dimAmount) : lerp(HT.dimFactor, 1, warm);

  let flicker = 0;
  if (t < DIM.at) {
    for (let i = 0; i < SW.times.length; i++) {
      const since = t - SW.times[i];
      if (since >= 0) flicker += BL.flicker.amount * Math.exp(-since / BL.flicker.decay);
    }
  }
  const lightColor = mixRgb(C.lightCool, C.lightWarm, warmth);
  // Cool and flickering with the reels, fading to a faint ambient over the dim; warm after unlock.
  const lightIntensity =
    t < HT.warmAt
      ? lerp(BL.cool.intensity * (1 + flicker), BL.ambient, dimAmount)
      : lerp(BL.ambient, lerp(BL.warm.intensity, BL.cool.intensity, toCool), warm);
  const shadowIntensity = BL.farShadow.intensity * clamp(lightIntensity / BL.cool.intensity, 0, 1);

  // ---- Buddy ---------------------------------------------------------------
  let i = 0;
  for (let k = 0; k < EVENTS.length; k++) if (EVENTS[k].time <= t) i = k;
  const ev = EVENTS[i];
  const prev = i > 0 ? EVENTS[i - 1] : EVENTS[EVENTS.length - 1];
  const dt = t - ev.time;
  const frameMix = i === 0 ? 1 : bezier(STANDARD, progress(dt, 0, BM.crossfade));
  // The last pop's tiny residue is brought to exactly 1 by the loop end, so the seam is invisible.
  const seamRest = 1 - smoothstep(progress(t, demo.loop - 0.2, demo.loop));
  // Reduced motion (motion = 0) shows a still, so no pop or dip either.
  const pop = i === 0 ? 1 : 1 + (popScale(dt) - 1) * (i === EVENTS.length - 1 ? seamRest : 1) * motion;

  // Anticipation: a small dip before big changes, released by the pop.
  let dip = 0;
  const next = i + 1 < EVENTS.length ? EVENTS[i + 1] : null;
  if (next && next.big && t > next.time - BM.anticipation.lead) {
    dip = BM.anticipation.dip * bezier(STANDARD, progress(t, next.time - BM.anticipation.lead, next.time));
  }
  if (ev.big && i > 0) dip += BM.anticipation.dip * springDecay(dt, spring.bouncy.stiffness, spring.bouncy.dampingRatio);
  dip *= motion;

  const shape = breathShape(t);
  const breath = 1 + motion * shape.amplitude * (0.5 - 0.5 * Math.cos(breathPhase(t, elapsed)));
  const worried = windowWeight(t, BM.breath.worried.from, BM.breath.worried.to, BM.breath.blend);
  const sleepy = windowWeight(t, BM.breath.sleepy.from, BM.breath.sleepy.to, BM.breath.blend);
  const sway = BM.sway.degrees * Math.sin((2 * Math.PI * elapsed) / BM.sway.period);
  const jump = bounce(t);
  const dialogue = dialogueAt(t, motion);

  return {
    dialogueId: dialogue.id,
    dialogueOpacity: dialogue.opacity,
    feedOpacity,
    feedTime: feedT,
    feedOffset: sw.offset,
    feedStretch,
    reelGestureOpacity,
    reelGestureTravel,
    environmentTime: t,
    environmentMotion: motion,
    batteryLevel,
    batteryColor: batteryColor(batteryLevel),
    toastIn,
    toastOut,
    emptyIcon,
    dim: dimAmount,
    lockVisible,
    lockOffset,
    lockOpacity,
    pillOpacity,
    dotVisible,
    dotTravel,
    gestureProgress,
    dotScale,
    dotCore,
    dotRing,
    dotGlowScale,
    trailOpacity,
    homeScale,
    iconsTime,
    haloColor,
    haloFactor,
    lightColor,
    lightIntensity,
    shadowIntensity,
    frameFrom: prev.frame,
    frameTo: ev.frame,
    frameMix,
    buddyScaleX: pop * lerp(1, jump.sx, motion) * breath,
    buddyScaleY: pop * lerp(1, jump.sy, motion) * breath,
    buddyRotate: motion * (sway + worried * BM.breath.worried.lean),
    buddyDy: dip + motion * (jump.dy + sleepy * BM.breath.sleepy.sink),
    floorShadowScale: 1 - BM.bounce.shadowShrink * jump.height,
    floorShadowOpacity: 1 - BM.bounce.shadowLighten * jump.height,
  };
}
