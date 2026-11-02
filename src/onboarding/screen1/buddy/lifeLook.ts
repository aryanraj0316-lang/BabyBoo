/**
 * Buddy's life and timing tokens (FINAL brief, section 2.7 and 5). Seconds, radians,
 * head widths. Rig parameters reach their new targets through these springs.
 */
export const LIFE = {
  /** Windowed re-simulation: springs are re-run over this window before t at this step. */
  window: 1.0,
  step: 1 / 120,
  /** Expression blends settle in ~300 ms (damping ratio ~0.8). */
  softSpring: { omega: 14, zeta: 0.8 },
  /** Eye moves are quicker. */
  eyeSpring: { omega: 30, zeta: 0.85 },
  /** Ears are jelly (follow-through only). */
  earSpring: { omega: 14, zeta: 0.35 },
  /** Ear jiggle and head lag from the body's vertical acceleration. */
  jiggle: { omega: 16, zeta: 0.35, gain: 0.012, headGain: 0.004 },
  breath: { period: 2.4, sleepPeriod: 4.0, sleepDepth: 1.4 },
  sway: { amount: 0.035, period: 3.6, phase: 1.3 }, // +-2 degrees, out of phase with breathing
  blink: { first: 1.2, min: 2.5, max: 5.0, close: 0.05, open: 0.09, doubleChance: 0.25, doubleGap: 0.22 },
  saccade: { min: 0.6, max: 1.5, amount: 0.6 },
  earTwitch: { first: 3.0, min: 4, max: 8, length: 0.3, amount: 0.22 },
  wave: { rate: 1.7, elbow: 0.38, rock: 0.02 }, // 2-beat rhythm from the elbow, slight body rock
  hop: {
    height: 0.2, // head widths
    anticipation: 0.12,
    dip: 0.02,
    dipSquash: 0.6,
    air: 0.42,
    stretch: 0.6,
    landSquash: 1.0, // scaleY 0.88 / scaleX 1.10
    landDecay: 0.14,
    landFreq: 14,
  },
} as const;
