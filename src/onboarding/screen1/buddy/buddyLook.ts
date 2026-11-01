/**
 * Buddy's rendering look: the hand-tuned values the fur shader and face drawing
 * use on top of the measured model (buddyModel.ts). Tune the look here; the
 * drawing code holds no numbers of its own. Lengths are in head widths unless
 * a name says otherwise.
 */
export const BUDDY_LOOK = {
  /** 'baked' (lighting fitted to the reference per part) or 'procedural'. */
  shadingMode: 'baked' as 'baked' | 'procedural',
  /** Half-width of the soft, velvety fur edge. */
  edgeOfHead: 0.0045,
  /** Key light (x right, y down, z toward the viewer): from above, slightly front-right, as on the master. */
  light: [0.12, -0.62, 0.78] as [number, number, number],
  /** Head width of the master render in pixels: the scale the grain texture was baked at. */
  grainHeadPx: 686.6,
  /** Strength of the fur grain (multiplies brightness by 1 +- grain/2). */
  grainAmount: 0.1,
  /** Plush volume: >1 flattens the middle of each part and rounds its edge over. */
  plush: 1.7,
  /** Darkening of fur that faces the ground. */
  ground: 0.12,
  /** Rim light per part (suppressed wherever a part overlaps one beneath it). */
  rim: { head: 0.3, ear: 0.3, foot: 0.22, arm: 0.12, body: 0.1 },
  /**
   * Dynamic contact occlusion (computed from the current part positions, never baked).
   * soft: falloff width as a fraction of the occluder's size; strength: darkening at contact.
   */
  contact: {
    // The head's shadow: the head ellipse dropped onto the body and arms.
    headShadow: { dx: 0.0, dy: 0.05, soft: 0.3, strength: 0.55 },
    bodyByArm: { soft: 0.22, strength: 0.45, dy: 0.03 }, // cast downward: no dark ring over the arm's top
    bodyByFoot: { soft: 0.2, strength: 0.4 },
    armByFoot: { soft: 0.18, strength: 0.4 },
    earByHead: { soft: 0.1, strength: 0.3 },
  },
  /** Contact shadows blend toward the shadow lavender times this (1 = exactly the shadow colour). */
  contactDeepen: 0.92,
  /** Glossy eyes: dark centre set slightly high, a soft lighter rim toward the bottom. */
  eyeGloss: { centreUp: 0.25, reach: 1.25, from: 0.62, rim: '#3A3550' },
  /** Inner ears: recessed pink cups. */
  innerEar: {
    light: '#F7B6F6', // the cup's lower, lit part
    deep: '#D06FDC', // toward its rim
    lightDrop: 0.35, // the lit centre sits low in the cup (it is concave)
    reach: 1.15,
    edgeBlur: 0.06,
    lip: '#7C5FD8', // the ear's rim shading the top of the cup
    lipDrop: 0.45,
    lipReach: 1.25,
    lipOpacity: 0.55,
  },
  /** Puffy, raised pads. Values are in the pad's own radius unless stated. */
  pad: {
    light: '#8670EA', // up-left, toward the light (kept within the pad colour)
    deep: '#5D45CF', // at the edge
    lightOffset: 0.35,
    gradientReach: 1.35,
    shadow: '#6F55D8', // contact shadow under the pad
    shadowOpacity: 0.35,
    shadowBlur: 0.12, // in pad radii (drawn in the pad's unit space)
    shadowDrop: 0.06,
    highlight: '#FFFFFF',
    highlightOpacity: 0.35,
    highlightBlur: 0.18,
    highlightX: 0.32,
    highlightY: 0.38,
    highlightR: 0.26,
  },
  /** Heart pad half-width as a multiple of its measured equivalent radius. */
  heartScale: 1.12,
  /** Blush: soft radial falloff extent (x the measured radius), solid core and peak opacity. */
  blushSpread: 1.45,
  blushCore: 0.45,
  blushOpacity: 0.95,
  /** Tongue height as a multiple of its measured half-height (the master's measured pink, flat). */
  tongueDepth: 1.0,
  /** Mouth outline: how far down the sides run straight (0..1 of the depth) and how round the bottom is. */
  mouthBelly: 0.75,
  mouthRound: 0.55,
  /** Points used to trace a part's outline as a clip path. */
  outlineSteps: 96,
} as const;
