/**
 * Free-form unlock gesture: smoothed strokes (normalized 0..1 inside the
 * phone screen), arc-length sampling and the fingertip's path over time.
 * No dots, no grid, no snapping. Pure; all runtime functions are worklets.
 */
import type { HeroConfig, Stroke } from './heroConfig';
import { clamp01, cubicBezier, keyTimes, lerp, smoothstep, type KeyTimes } from './heroTimeline';

export interface StrokeSamples {
  /** x0, y0, x1, y1, ... along the smoothed curve */
  pts: number[];
  /** cumulative arc length, normalized 0..1, one per point */
  cum: number[];
  length: number;
}

const SEG = 10;

/** Catmull-Rom (centripetal-ish via uniform with end duplication) sampling. */
export function sampleStroke(stroke: Stroke): StrokeSamples {
  const p = stroke;
  const n = p.length;
  const pts: number[] = [];
  if (n === 1) {
    pts.push(p[0][0], p[0][1], p[0][0], p[0][1]);
  } else {
    for (let i = 0; i < n - 1; i++) {
      const p0 = p[Math.max(0, i - 1)];
      const p1 = p[i];
      const p2 = p[i + 1];
      const p3 = p[Math.min(n - 1, i + 2)];
      for (let s = 0; s < SEG; s++) {
        const t = s / SEG;
        const t2 = t * t;
        const t3 = t2 * t;
        const x = 0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
        const y = 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
        pts.push(x, y);
      }
    }
    pts.push(p[n - 1][0], p[n - 1][1]);
  }
  const cum: number[] = [0];
  let L = 0;
  for (let i = 2; i < pts.length; i += 2) {
    L += Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
    cum.push(L);
  }
  for (let i = 0; i < cum.length; i++) cum[i] = L > 0 ? cum[i] / L : 0;
  return { pts, cum, length: L };
}

export function sampleStrokes(strokes: Stroke[]): StrokeSamples[] {
  return strokes.map(sampleStroke);
}

/** Point at arc-length fraction f along a sampled stroke. */
export function strokePoint(s: StrokeSamples, f: number): { x: number; y: number } {
  'worklet';
  const cum = s.cum;
  const u = clamp01(f);
  let lo = 0;
  let hi = cum.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (cum[m] < u) lo = m;
    else hi = m;
  }
  const span = cum[hi] - cum[lo] || 1;
  const k = (u - cum[lo]) / span;
  return {
    x: lerp(s.pts[lo * 2], s.pts[hi * 2], k),
    y: lerp(s.pts[lo * 2 + 1], s.pts[hi * 2 + 1], k),
  };
}

/** Human stroke progress: ease in / out with a gentle speed wobble. */
function strokeProgress(u: number, seed: number): number {
  'worklet';
  const e = cubicBezier(0.45, 0.05, 0.35, 1, clamp01(u));
  const wobble = 0.018 * Math.sin(u * Math.PI * 2 + seed) * Math.sin(u * Math.PI);
  return clamp01(e + wobble);
}

export interface FingerState {
  x: number; // normalized screen coords of the fingertip
  y: number;
  visible: number; // 0..1 opacity
  contact: number; // 0..1 pressing the glass
  /** trail windows per stroke (head and tail as arc fractions) */
  s1Head: number;
  s1Tail: number;
  s2Head: number;
  s2Tail: number;
  strokeIndex: number; // -1 none, 0, 1 drawing
}

const ENTER_FROM = { x: 1.25, y: 1.12 };

/**
 * Where the fingertip is at timeline time t. `samples` are the sampled
 * strokes (only the first two are animated; extra free-draw strokes are
 * chained after them).
 */
export function fingerAt(t: number, cfg: HeroConfig, samples: StrokeSamples[], Kin?: KeyTimes): FingerState {
  'worklet';
  const K = Kin ?? keyTimes(cfg);
  const out: FingerState = {
    x: ENTER_FROM.x, y: ENTER_FROM.y, visible: 0, contact: 0,
    s1Head: 0, s1Tail: 0, s2Head: 0, s2Tail: 0, strokeIndex: -1,
  };
  if (t < K.fingerEnter || t > K.fingerGone + 0.05 || samples.length === 0) return out;
  const tapPt = { x: 0.6, y: 0.62 };
  const s1 = samples[0];
  const s2 = samples.length > 1 ? samples[1] : samples[0];
  const s1a = strokePoint(s1, 0);
  const s1b = strokePoint(s1, 1);
  const s2a = strokePoint(s2, 0);
  const s2b = strokePoint(s2, 1);
  const trailLen = cfg.finger.trailLength;
  out.visible = smoothstep(K.fingerEnter, K.fingerEnter + 0.25, t) * (1 - smoothstep(K.fingerGone - 0.4, K.fingerGone, t));

  if (t < K.tapAt) {
    const u = cubicBezier(0.22, 1, 0.36, 1, clamp01((t - K.fingerEnter) / (K.tapAt - K.fingerEnter)));
    out.x = lerp(ENTER_FROM.x, tapPt.x, u);
    out.y = lerp(ENTER_FROM.y, tapPt.y, u);
  } else if (t < K.tapAt + 0.22) {
    out.x = tapPt.x;
    out.y = tapPt.y;
    out.contact = 1 - smoothstep(K.tapAt + 0.12, K.tapAt + 0.22, t);
  } else if (t < K.s1Start) {
    const u = cubicBezier(0.4, 0, 0.2, 1, clamp01((t - K.tapAt - 0.22) / (K.s1Start - K.tapAt - 0.22)));
    out.x = lerp(tapPt.x, s1a.x, u);
    out.y = lerp(tapPt.y, s1a.y, u) - Math.sin(u * Math.PI) * 0.05;
    out.contact = smoothstep(K.s1Start - 0.08, K.s1Start, t);
  } else if (t < K.s1End) {
    const f = strokeProgress((t - K.s1Start) / (K.s1End - K.s1Start), 0.7);
    const p = strokePoint(s1, f);
    out.x = p.x;
    out.y = p.y;
    out.contact = 1;
    out.strokeIndex = 0;
  } else if (t < K.s2Start) {
    // lift: arc above the glass from the end of stroke one to stroke two
    const u = cubicBezier(0.4, 0, 0.2, 1, clamp01((t - K.s1End) / (K.s2Start - K.s1End)));
    out.x = lerp(s1b.x, s2a.x, u);
    out.y = lerp(s1b.y, s2a.y, u) - Math.sin(u * Math.PI) * 0.06;
    out.contact = 1 - smoothstep(0, 0.25, u) + smoothstep(0.75, 1, u);
  } else if (t < K.s2End) {
    const f = strokeProgress((t - K.s2Start) / (K.s2End - K.s2Start), 2.1);
    const p = strokePoint(s2, f);
    out.x = p.x;
    out.y = p.y;
    out.contact = 1;
    out.strokeIndex = 1;
  } else {
    const u = smoothstep(K.s2End, K.s2End + 0.35, t);
    out.x = s2b.x + u * 0.05;
    out.y = s2b.y + u * 0.08;
    out.contact = 1 - smoothstep(K.s2End, K.s2End + 0.12, t);
  }
  // Human jitter (deterministic), only while moving on the glass.
  const j = cfg.finger.jitter / 300;
  out.x += j * (Math.sin(t * 37.1) + 0.6 * Math.sin(t * 61.7 + 1.3));
  out.y += j * (Math.sin(t * 43.3 + 0.4) + 0.6 * Math.sin(t * 57.9 + 2.1));

  // Trail windows (fade over trailLen seconds).
  const prog1 = (tt: number) => {
    'worklet';
    if (tt <= K.s1Start) return 0;
    if (tt >= K.s1End) return 1;
    return strokeProgress((tt - K.s1Start) / (K.s1End - K.s1Start), 0.7);
  };
  const prog2 = (tt: number) => {
    'worklet';
    if (tt <= K.s2Start) return 0;
    if (tt >= K.s2End) return 1;
    return strokeProgress((tt - K.s2Start) / (K.s2End - K.s2Start), 2.1);
  };
  out.s1Head = prog1(t);
  out.s1Tail = prog1(t - trailLen);
  out.s2Head = prog2(t);
  out.s2Tail = prog2(t - trailLen);
  return out;
}

/** Ramer-Douglas-Peucker simplification for recorded free-draw strokes. */
export function simplifyStroke(points: Stroke, epsilon = 0.008): Stroke {
  if (points.length < 3) return points.slice();
  const keep = new Array(points.length).fill(false);
  keep[0] = keep[points.length - 1] = true;
  const stack: Array<[number, number]> = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    let maxD = 0;
    let idx = -1;
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const dx = bx - ax;
    const dy = by - ay;
    const L = Math.hypot(dx, dy) || 1e-9;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * points[i][0] - dx * points[i][1] + bx * ay - by * ax) / L;
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (maxD > epsilon && idx > 0) {
      keep[idx] = true;
      stack.push([a, idx], [idx, b]);
    }
  }
  return points.filter((_, i) => keep[i]).map(([x, y]) => [+x.toFixed(4), +y.toFixed(4)] as [number, number]);
}
