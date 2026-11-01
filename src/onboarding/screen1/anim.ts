/**
 * Motion maths for the demo. Every function is a pure worklet: given a time it
 * returns a value, so the whole scene can be computed from the master clock on
 * the UI thread (and unit-tested in Node, where the 'worklet' directive is a
 * plain string).
 */

export function clamp(x: number, lo: number, hi: number): number {
  'worklet';
  return x < lo ? lo : x > hi ? hi : x;
}

export function lerp(a: number, b: number, t: number): number {
  'worklet';
  return a + (b - a) * t;
}

/** 0..1 progress of t through [from, to], clamped. */
export function progress(t: number, from: number, to: number): number {
  'worklet';
  if (to <= from) return t >= to ? 1 : 0;
  return clamp((t - from) / (to - from), 0, 1);
}

export function smoothstep(x: number): number {
  'worklet';
  const c = clamp(x, 0, 1);
  return c * c * (3 - 2 * c);
}

/** CSS-style cubic-bezier(x1, y1, x2, y2) evaluated at x in 0..1. */
export function bezier(curve: readonly [number, number, number, number] | readonly number[], x: number): number {
  'worklet';
  const x1 = curve[0];
  const y1 = curve[1];
  const x2 = curve[2];
  const y2 = curve[3];
  const c = clamp(x, 0, 1);
  if (c === 0 || c === 1) return c;
  // Solve bx(s) = c for s with Newton steps, falling back to bisection.
  const bx = (s: number) => 3 * x1 * s * (1 - s) * (1 - s) + 3 * x2 * s * s * (1 - s) + s * s * s;
  const dbx = (s: number) => 3 * x1 * (1 - s) * (1 - s) + 6 * (x2 - x1) * s * (1 - s) + 3 * (1 - x2) * s * s;
  let s = c;
  for (let i = 0; i < 6; i++) {
    const d = dbx(s);
    if (Math.abs(d) < 1e-6) break;
    const next = s - (bx(s) - c) / d;
    if (next < 0 || next > 1) break;
    s = next;
  }
  if (Math.abs(bx(s) - c) > 1e-4) {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 30; i++) {
      s = (lo + hi) / 2;
      if (bx(s) < c) lo = s;
      else hi = s;
    }
  }
  return 3 * y1 * s * (1 - s) * (1 - s) + 3 * y2 * s * s * (1 - s) + s * s * s;
}

/**
 * A spring released at rest from 0 toward 1 (mass 1), `t` seconds after it
 * started. Returns position and velocity (per second). Underdamped springs
 * overshoot by exp(-zeta * pi / sqrt(1 - zeta^2)).
 */
export function springAt(t: number, stiffness: number, dampingRatio: number): { x: number; v: number } {
  'worklet';
  if (t <= 0) return { x: 0, v: 0 };
  const w = Math.sqrt(stiffness);
  const z = dampingRatio;
  if (z < 1) {
    const wd = w * Math.sqrt(1 - z * z);
    const e = Math.exp(-z * w * t);
    const x = 1 - e * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
    const v = e * ((w * w) / wd) * Math.sin(wd * t);
    return { x, v };
  }
  const e = Math.exp(-w * t);
  return { x: 1 - (1 + w * t) * e, v: w * w * t * e };
}

/** A spring that starts displaced by 1 and settles to 0 (e.g. a pop overshoot decaying). */
export function springDecay(t: number, stiffness: number, dampingRatio: number): number {
  'worklet';
  return 1 - springAt(t, stiffness, dampingRatio).x;
}

/** '#RRGGBB' -> [r, g, b] (0..255). Not a worklet: resolve colours up front. */
export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function mixRgb(a: readonly number[], b: readonly number[], t: number): [number, number, number] {
  'worklet';
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

export function rgba(c: readonly number[], alpha: number): string {
  'worklet';
  return `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${clamp(alpha, 0, 1)})`;
}
