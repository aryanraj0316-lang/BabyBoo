/**
 * Buddy's rendering look: the hand-tuned values the fur shader and face drawing
 * use on top of the measured model (buddyModel.ts). Tune the look here; the
 * drawing code holds no numbers of its own.
 */
export const BUDDY_LOOK = {
  /** Width of the fuzzy fur edge, in head widths. */
  edgeOfHead: 0.009,
  /** Key light direction (x right, y down, z toward the viewer). The master is lit from above, slightly front-right. */
  light: [0.12, -0.62, 0.78] as [number, number, number],
  /** Head width of the master render in pixels: the scale the grain texture was baked at. */
  grainHeadPx: 686.6,
  /** Concave parts (inner ears) read as cups: lit from below. */
  cupLight: [0, 0.62, 0.78] as [number, number, number],
  /** Strength of the fur grain (multiplies brightness by 1 +- grain/2). */
  grainAmount: 0.12,
  /** Rim light per part: strong on outward-facing parts, weak where parts meet the body. */
  rim: { head: 0.35, ear: 0.35, foot: 0.25, arm: 0.08, body: 0.12 },
  /** Contact darkening beside occluding parts (under the chin, beside the arms), 0..1. */
  contact: 0.38,
  /** Glossy eyes: dark centre set slightly high, a soft lighter rim toward the bottom. */
  eyeGloss: { centreUp: 0.25, reach: 1.25, from: 0.62, rim: '#3A3550' },
  /** Inner ear shading. */
  innerEarShadow: '#D97FE6',
  innerEarHigh: '#F6B8F8',
  /** Heart pad half-width as a multiple of its measured equivalent radius. */
  heartScale: 1.12,
  /** Blush: soft radial falloff extent (x the measured radius) and peak opacity. */
  blushSpread: 1.45,
  blushCore: 0.45,
  blushOpacity: 0.95,
  /** Tongue height as a multiple of its measured half-height (it sits low in the mouth). */
  tongueDepth: 1.0,
  /** Mouth outline: how far down the sides run straight (0..1 of the depth) and how round the bottom is. */
  mouthBelly: 0.75,
  mouthRound: 0.55,
  /** Points used to trace a part's outline as a clip path. */
  outlineSteps: 96,
} as const;
