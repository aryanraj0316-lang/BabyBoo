/**
 * Context rules checker shared by contextRules.test.ts and the Studio's
 * "Run context test" button. Scrubs the loop, poses Buddy exactly as the
 * renderer does and reports every rule violation.
 */
import { BEAT_ORDER, type HeroConfig } from './heroConfig';
import { beatAt, keyTimes, loopEnd, loopStart, phoneStateAt } from './heroTimeline';
import { fingerAt, sampleStrokes } from './gesture';
import { computeLayout, type Rect, type StageLayout } from './layout';
import { blinkSchedule, bodyActions, direct, keyMoments, sparkleAt, twitchSchedule } from './director';
import { RIG, partPolygon, rigMatrices, stageMatrix, SILHOUETTE_PARTS } from './mascot/rig';

export interface Violation { t: number; size: string; rule: string; detail: string }

type Poly = Array<[number, number]>;

function clipPoly(poly: Poly, r: Rect): Poly {
  let out = poly;
  const edges: Array<[(p: [number, number]) => boolean, (a: [number, number], b: [number, number]) => [number, number]]> = [
    [(p) => p[0] >= r.x, (a, b) => { const k = (r.x - a[0]) / (b[0] - a[0]); return [r.x, a[1] + k * (b[1] - a[1])]; }],
    [(p) => p[0] <= r.x + r.w, (a, b) => { const k = (r.x + r.w - a[0]) / (b[0] - a[0]); return [r.x + r.w, a[1] + k * (b[1] - a[1])]; }],
    [(p) => p[1] >= r.y, (a, b) => { const k = (r.y - a[1]) / (b[1] - a[1]); return [a[0] + k * (b[0] - a[0]), r.y]; }],
    [(p) => p[1] <= r.y + r.h, (a, b) => { const k = (r.y + r.h - a[1]) / (b[1] - a[1]); return [a[0] + k * (b[0] - a[0]), r.y + r.h]; }],
  ];
  for (const [inside, cut] of edges) {
    const inp = out;
    out = [];
    for (let i = 0; i < inp.length; i++) {
      const a = inp[i];
      const b = inp[(i + 1) % inp.length];
      const ia = inside(a);
      const ib = inside(b);
      if (ia && ib) out.push(b);
      else if (ia && !ib) out.push(cut(a, b));
      else if (!ia && ib) { out.push(cut(a, b)); out.push(b); }
    }
    if (!out.length) break;
  }
  return out;
}

function area(p: Poly): number {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i];
    const b = p[(i + 1) % p.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(s) / 2;
}

function bbox(p: Poly) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of p) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { x0, y0, x1, y1 };
}

export const TEST_SIZES: Array<[number, number]> = [[320, 560], [360, 640], [412, 732], [480, 860], [800, 1200]];

export interface CheckResult {
  violations: Violation[];
  samples: number;
  layouts: Record<string, StageLayout>;
}

export function runContextCheck(cfg: HeroConfig, sizes = TEST_SIZES, step = 0.05): CheckResult {
  const violations: Violation[] = [];
  const layouts: Record<string, StageLayout> = {};
  const K = keyTimes(cfg);
  const samples = sampleStrokes(cfg.finger.strokes);
  let count = 0;
  const end = loopEnd(cfg);
  const s0 = loopStart(cfg);
  const L = end - s0;

  // Body actions: one at a time, >= 300 ms apart.
  for (const firstPass of [true, false]) {
    const acts = bodyActions(cfg, K, firstPass).sort((a, b) => a.start - b.start);
    for (let i = 1; i < acts.length; i++) {
      const gap = acts[i].start - acts[i - 1].end;
      if (gap < 0.3 - 1e-6) {
        violations.push({ t: acts[i].start, size: '-', rule: 'action-gap', detail: `${acts[i - 1].name} -> ${acts[i].name} gap ${(gap * 1000).toFixed(0)} ms` });
      }
    }
  }
  // Blinks clear of key moments.
  const moments = keyMoments(cfg, K);
  for (let li = 0; li < 3; li++) {
    for (const b of blinkSchedule(cfg, li)) {
      for (const k of moments) {
        if (b.t + b.down + b.up > k - 0.25 && b.t < k + 0.25) {
          violations.push({ t: b.t, size: '-', rule: 'blink-exclusion', detail: `blink at ${b.t.toFixed(2)} near key moment ${k.toFixed(2)}` });
        }
      }
    }
  }

  for (const [W, H] of sizes) {
    const size = `${W}x${H}`;
    let lay: StageLayout;
    try {
      lay = computeLayout(W, H, { phoneRadius: cfg.phone.radius });
    } catch (e) {
      violations.push({ t: 0, size, rule: 'layout', detail: String(e) });
      continue;
    }
    layouts[size] = lay;
    const stage = stageMatrix(lay.buddy.x, lay.buddy.y, lay.buddy.scale);
    const zones = lay.zones;
    const passes: Array<[number, number]> = [[0, 0], [1, L]]; // first pass, second pass offset
    for (const [pass, off] of passes) {
      const blinks = blinkSchedule(cfg, pass);
      const twitches = twitchSchedule(cfg, pass);
      for (let tt = pass === 0 ? 0 : s0; tt <= end + 1e-9; tt += step) {
        const t = Math.min(tt, end - 1e-6);
        const master = t + off;
        count++;
        const phone = phoneStateAt(t, cfg, master);
        const finger = fingerAt(t, cfg, samples, K);
        const out = direct({ t, master, cfg, layout: lay, phone, finger, blinks, twitches, touchW: 0, touchX: 0, touchY: 0, giggleAt: -1e6, K });
        const p = out.pose;
        const m = rigMatrices(p, stage);
        // limits
        if (Math.abs(p.headRot) > RIG.parts.head.maxRotationDeg + 1e-6) violations.push({ t, size, rule: 'head-rotation', detail: p.headRot.toFixed(2) });
        if (Math.abs(p.earL) > RIG.parts.ear_l.maxRotationDeg || Math.abs(p.earR) > RIG.parts.ear_r.maxRotationDeg) violations.push({ t, size, rule: 'ear-rotation', detail: `${p.earL.toFixed(1)} ${p.earR.toFixed(1)}` });
        if (Math.abs(p.arm) > RIG.parts.arm_wave.maxRotationDeg) violations.push({ t, size, rule: 'arm-rotation', detail: p.arm.toFixed(1) });
        if (Math.abs(p.bodySx - 1) > 0.045 || Math.abs(p.bodySy - 1) > 0.045) violations.push({ t, size, rule: 'stretch', detail: `${p.bodySx.toFixed(3)} ${p.bodySy.toFixed(3)}` });
        const headW = RIG.head.ellipse[2] * 2;
        if (Math.hypot(p.faceParX, p.faceParY) > 0.06 * headW) violations.push({ t, size, rule: 'face-parallax', detail: `${p.faceParX.toFixed(1)}` });
        if (Math.abs(p.openL - p.openR) > 1e-6) violations.push({ t, size, rule: 'eye-symmetry', detail: '' });
        const msum = p.mouthSmile + p.mouthSoft + p.mouthO + p.mouthSmall;
        if (Math.abs(msum - 1) > 1e-3) violations.push({ t, size, rule: 'mouth-shape', detail: `weights sum ${msum.toFixed(3)}` });

        for (const name of [...SILHOUETTE_PARTS, 'arm_wave_front']) {
          const poly = partPolygon(name, m) as Poly;
          const bb = bbox(poly);
          if (bb.x0 < -0.5 || bb.y0 < -0.5 || bb.x1 > W + 0.5 || bb.y1 > H + 0.5) {
            violations.push({ t, size, rule: 'outside-canvas', detail: `${name} ${bb.x0.toFixed(0)},${bb.y0.toFixed(0)}..${bb.x1.toFixed(0)},${bb.y1.toFixed(0)}` });
          }
          for (const [zn, zr] of Object.entries(zones)) {
            const c = clipPoly(poly, zr);
            if (c.length >= 3 && area(c) > 0.5) violations.push({ t, size, rule: `keep-clear:${zn}`, detail: `${name} overlaps ${area(c).toFixed(1)} px2` });
          }
          const onPhone = clipPoly(poly, lay.phone);
          if (onPhone.length >= 3 && area(onPhone) > 0.5) {
            const b = bbox(onPhone);
            const A = lay.allowed;
            if (b.x1 > A.x + A.w + 0.5 || b.y0 < A.y - 0.5) {
              violations.push({ t, size, rule: 'phone-overlap', detail: `${name} reaches ${(b.x1 - lay.phone.x).toFixed(1)}px in, top ${(b.y0 - lay.phone.y).toFixed(0)}` });
            }
          }
        }
        if (out.sparkle > 0) {
          for (let i = 0; i < cfg.mascot.sparkles; i++) {
            const s = sparkleAt(i, out.sparkleT, lay);
            if (s.a <= 0) continue;
            const r = 6 * s.s;
            const z = zones.swipe;
            if (s.x + r > z.x && s.x - r < z.x + z.w && s.y + r > z.y && s.y - r < z.y + z.h) {
              violations.push({ t, size, rule: 'sparkle-swipe', detail: `sparkle ${i}` });
            }
            if (s.x - r < 0 || s.x + r > W || s.y - r < 0) violations.push({ t, size, rule: 'sparkle-canvas', detail: `sparkle ${i}` });
          }
        }
      }
    }
  }
  return { violations, samples: count, layouts };
}

/** Beat boundary check: beatAt() matches the configured table within 30 ms. */
export function checkBeats(cfg: HeroConfig): string[] {
  const errs: string[] = [];
  for (const id of BEAT_ORDER) {
    const b = cfg.beats[id];
    const mid = (b.start + b.end) / 2;
    if (beatAt(mid, cfg) !== id) errs.push(`${id} not active at ${mid}`);
    if (beatAt(b.start + 0.03, cfg) !== id) errs.push(`${id} starts late`);
  }
  return errs;
}
