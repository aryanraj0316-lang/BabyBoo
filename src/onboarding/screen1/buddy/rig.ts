/**
 * Buddy's rig: rig parameters -> posed geometry (pure worklets, no Skia).
 *
 * Units: head width = 1, origin at the head centre of the rest pose, y down.
 * The pose is built as a small hierarchy:
 *
 *   root (rootX/rootY)            -> everything
 *     base pose ('sit')           -> where body, feet, shoulders and the neck rest
 *       body (squash, breath, bodyLean about the seat)
 *         head (neck pivot: headTilt + headLag, headNod; headTurn slides the face)
 *           ears (earAngle + earJiggle, earPerk), face (eyes, blush, mouth)
 *         arms (shoulder -> elbow -> paw, two segments + a round paw)
 *     feet (on the floor, follow the root)
 *
 * Extensible by design: `base` selects a base pose (only 'sit' exists now; a lying
 * pose adds a new entry in BASES without touching the drawing code), and every pose
 * exports `attach.pawL / attach.pawR` frames (position + angle) for props held in the paws.
 */
import { BUDDY_MODEL as M } from './buddyModel';
import { RIG_LOOK as R } from './rigLook';

// ---------------------------------------------------------------------------
// Parameters
// ---------------------------------------------------------------------------

export interface RigParams {
  rootX: number; rootY: number; squash: number; bodyLean: number; breath: number;
  headTilt: number; headTurn: number; headNod: number; headLag: number;
  earAngleL: number; earAngleR: number; earPerkL: number; earPerkR: number;
  shoulderL: number; elbowL: number; pawOpenL: number;
  shoulderR: number; elbowR: number; pawOpenR: number;
  gazeX: number; gazeY: number; eyeOpen: number; blink: number; saccadeX: number; saccadeY: number;
  eyeRound: number; eyeHappy: number; eyeSleepy: number; eyeSqueeze: number;
  mouthOpen: number; mouthWidth: number; mouthCurve: number;
  mouthSmile: number; mouthO: number; mouthWavy: number; mouthYawn: number; mouthClosed: number;
  blush: number;
}

export type RigKey = keyof RigParams;

export const REST: RigParams = {
  rootX: 0, rootY: 0, squash: 0, bodyLean: 0, breath: 0,
  headTilt: 0, headTurn: 0, headNod: 0, headLag: 0,
  earAngleL: 0, earAngleR: 0, earPerkL: 0, earPerkR: 0,
  shoulderL: 0, elbowL: 0, pawOpenL: 0,
  shoulderR: 0, elbowR: 0, pawOpenR: 0,
  gazeX: 0, gazeY: 0, eyeOpen: 1, blink: 0, saccadeX: 0, saccadeY: 0,
  eyeRound: 1, eyeHappy: 0, eyeSleepy: 0, eyeSqueeze: 0,
  mouthOpen: 1, mouthWidth: 1, mouthCurve: 0,
  mouthSmile: 1, mouthO: 0, mouthWavy: 0, mouthYawn: 0, mouthClosed: 0,
  blush: 1,
};

export const RIG_KEYS = Object.keys(REST) as RigKey[];

/** Slider ranges for Buddy Lab. */
export const RIG_RANGES: Record<RigKey, [number, number]> = {
  rootX: [-0.5, 0.5], rootY: [-0.6, 0.2], squash: [-1, 1], bodyLean: [-0.3, 0.3], breath: [0, 1],
  headTilt: [-0.5, 0.5], headTurn: [-1, 1], headNod: [-1, 1], headLag: [-0.3, 0.3],
  earAngleL: [-0.8, 0.8], earAngleR: [-0.8, 0.8], earPerkL: [-1, 1], earPerkR: [-1, 1],
  shoulderL: [-0.6, 3.2], elbowL: [-1.5, 2.8], pawOpenL: [0, 1],
  shoulderR: [-0.6, 3.2], elbowR: [-1.5, 2.8], pawOpenR: [0, 1],
  gazeX: [-1, 1], gazeY: [-1, 1], eyeOpen: [0, 1.3], blink: [0, 1], saccadeX: [-1, 1], saccadeY: [-1, 1],
  eyeRound: [0, 1], eyeHappy: [0, 1], eyeSleepy: [0, 1], eyeSqueeze: [0, 1],
  mouthOpen: [0, 1.4], mouthWidth: [0.5, 1.5], mouthCurve: [-1, 1],
  mouthSmile: [0, 1], mouthO: [0, 1], mouthWavy: [0, 1], mouthYawn: [0, 1], mouthClosed: [0, 1],
  blush: [0, 1.5],
};

// ---------------------------------------------------------------------------
// Posed geometry
// ---------------------------------------------------------------------------

export interface Ell { cx: number; cy: number; rx: number; ryTop: number; ryBot: number; nTop: number; nBot: number; rot: number }
export interface Seg { ax: number; ay: number; bx: number; by: number; ra: number; rb: number }
export interface PosedArm { upper: Seg; fore: Seg; paw: { cx: number; cy: number; r: number; rot: number; open: number }; front: boolean }
export interface Frame { x: number; y: number; angle: number }
export interface Posed {
  parts: { earL: Ell; earR: Ell; body: Ell; footL: Ell; footR: Ell; head: Ell };
  innerEars: Array<{ side: 'earL' | 'earR'; cx: number; cy: number; r: number }>;
  arms: { armL: PosedArm; armR: PosedArm };
  eyes: Array<{ cx: number; cy: number; poly: number[]; highlight: number; er: number }>;
  blush: Array<{ cx: number; cy: number; r: number; alpha: number }>;
  mouth: { poly: number[]; tongue: number[]; tongueTop: number; tongueBottom: number; tongueAlpha: number };
  /** Head frame (for face clipping and props on the head). */
  headFrame: Frame;
  /** Prop attachment frames in the paws. */
  attach: { pawL: Frame; pawR: Frame };
  floorY: number;
}

const V = M.views.front;
const P = V.parts;
const TD = M.turnDelta;
const FLOOR = Math.max(P.footL.cy + P.footL.ryBot, P.footR.cy + P.footR.ryBot);

/** Base poses. A base sets where the body parts rest; only sitting exists today. */
export const BASES = {
  sit: { bodyDy: 0, headDy: 0 },
} as const;
export type BaseName = keyof typeof BASES;

// ---------------------------------------------------------------------------
// Small affine helpers (2x3: a, b, c, d, e, f maps (x, y) -> (a x + c y + e, b x + d y + f))
// ---------------------------------------------------------------------------

type Mat = [number, number, number, number, number, number];

function mul(m: Mat, n: Mat): Mat {
  'worklet';
  return [
    m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}
function tr(x: number, y: number): Mat {
  'worklet';
  return [1, 0, 0, 1, x, y];
}
function rotm(a: number): Mat {
  'worklet';
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, s, -s, c, 0, 0];
}
function scl(x: number, y: number): Mat {
  'worklet';
  return [x, 0, 0, y, 0, 0];
}
function about(m: Mat, x: number, y: number): Mat {
  'worklet';
  return mul(tr(x, y), mul(m, tr(-x, -y)));
}
function ap(m: Mat, x: number, y: number): [number, number] {
  'worklet';
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}
/** Rotation angle and mean scale of a (similarity-ish) matrix. */
function angleOf(m: Mat): number {
  'worklet';
  return Math.atan2(m[1], m[0]);
}

function placeEll(e: Ell, m: Mat, sx = 1, sy = 1): Ell {
  'worklet';
  const [cx, cy] = ap(m, e.cx, e.cy);
  const k = Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));
  return { cx, cy, rx: e.rx * k * sx, ryTop: e.ryTop * k * sy, ryBot: e.ryBot * k * sy, nTop: e.nTop, nBot: e.nBot, rot: e.rot + angleOf(m) };
}

function lerp(a: number, b: number, t: number): number {
  'worklet';
  return a + (b - a) * t;
}
function clamp(x: number, lo: number, hi: number): number {
  'worklet';
  return x < lo ? lo : x > hi ? hi : x;
}

/** Half-width of the head outline at height y (head-local, rest head). */
function headHalfWidth(y: number): number {
  'worklet';
  const h = P.head;
  const ry = y < 0 ? h.ryTop : h.ryBot;
  const n = y < 0 ? h.nTop : h.nBot;
  const v = Math.min(1, Math.abs(y) / ry);
  return h.rx * Math.pow(Math.max(0, 1 - Math.pow(v, n)), 1 / n);
}

// ---------------------------------------------------------------------------
// Shapes for blending (closed polygons with a shared parameterisation: start at the
// left, go over the top to the right, come back along the bottom)
// ---------------------------------------------------------------------------

const EYE_N = 48;
const MOUTH_N = 72;

function shapeEllipse(n: number, rx: number, ry: number, cy = 0): number[] {
  'worklet';
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI + (2 * Math.PI * i) / n;
    out.push(rx * Math.cos(a), cy + ry * Math.sin(a));
  }
  return out;
}

/** A band of given thickness along y = f(x) for x in [-hw, hw]. */
function shapeBand(n: number, hw: number, thick: number, f: (x: number) => number): number[] {
  'worklet';
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI + (2 * Math.PI * i) / n;
    const x = hw * Math.cos(a);
    const top = i < n / 2;
    // Taper the band's ends so the line closes in round points.
    const taper = Math.sqrt(Math.max(0, 1 - (x / hw) * (x / hw)));
    out.push(x, f(x) + (top ? -1 : 1) * (thick / 2) * (0.35 + 0.65 * taper));
  }
  return out;
}

function blendPolys(polys: number[][], w: number[]): number[] {
  'worklet';
  let total = 0;
  for (let k = 0; k < w.length; k++) total += w[k];
  const out = new Array<number>(polys[0].length).fill(0);
  for (let k = 0; k < polys.length; k++) {
    const wk = total > 0 ? w[k] / total : k === 0 ? 1 : 0;
    if (wk === 0) continue;
    const pk = polys[k];
    for (let i = 0; i < out.length; i++) out[i] += pk[i] * wk;
  }
  return out;
}

// The traced mouth (72 points, same parameterisation), relative to the corner line.
const SMILE_FLAT: number[] = (() => {
  const pts = V.mouthOutline as unknown as number[][];
  const cornerY = (V.mouth.left[1] + V.mouth.right[1]) / 2;
  const out: number[] = [];
  for (const [x, y] of pts) out.push(x * R.smileScale, (y - cornerY) * R.smileScale);
  return out;
})();
const SMILE_HALF = ((V.mouth.right[0] - V.mouth.left[0]) / 2) * R.smileScale;
const TONGUE_FLAT: number[] = (() => {
  const pts = V.tongueOutline as unknown as number[][];
  const cornerY = (V.mouth.left[1] + V.mouth.right[1]) / 2;
  // The tongue fills the bottom of the mouth: grown a little around its centre and set
  // lower, so the mouth's own outline clips it (no dark rim below it).
  let cx = 0;
  let cy = 0;
  for (const [x, y] of pts) {
    cx += x / pts.length;
    cy += y / pts.length;
  }
  const out: number[] = [];
  for (const [x, y] of pts) {
    out.push((cx + (x - cx) * R.tongueGrow) * R.smileScale, (cy + (y - cy) * R.tongueGrow - cornerY + R.tongueDrop) * R.smileScale);
  }
  return out;
})();

// ---------------------------------------------------------------------------
// The pose
// ---------------------------------------------------------------------------

// The arm: the shoulder sits up under the head (hidden by it), so the limb is long enough
// to reach the mouth, the chest and above the head; at rest it hangs nearly straight down
// to the paw on the tummy, with the elbow bent slightly outward.
const ARM = (() => {
  const A = V.armRest;
  const sx = A.shoulder[0] * R.shoulderXScale;
  const sy = R.shoulderY;
  const px = A.paw[0];
  const py = A.paw[1];
  const reach = Math.hypot(px - sx, py - sy);
  const len = reach / R.restStraightness; // a little longer than the reach: the elbow bends at rest
  const lu = len * R.upperArmShare;
  const lf = len * (1 - R.upperArmShare);
  // Rest angles (viewer-right arm) from two-link IK, elbow out (+x).
  const base = Math.atan2(py - sy, px - sx);
  const cosA = (lu * lu + reach * reach - lf * lf) / (2 * lu * reach);
  const aU = base - Math.acos(Math.max(-1, Math.min(1, cosA)));
  const ex = sx + Math.cos(aU) * lu;
  const ey = sy + Math.sin(aU) * lu;
  const aF = Math.atan2(py - ey, px - ex);
  return { sx, sy, lu, lf, aU, bend: aF - aU };
})();

function poseArm(side: 'armL' | 'armR', bodyM: Mat, shoulder: number, elbow: number, open: number, headBottom: number): PosedArm {
  'worklet';
  const A = V.armRest;
  const sign = side === 'armL' ? -1 : 1;
  const [sx, sy] = ap(bodyM, ARM.sx * sign, ARM.sy);
  const bodyA = angleOf(bodyM);
  const ks = Math.sqrt(Math.abs(bodyM[0] * bodyM[3] - bodyM[1] * bodyM[2]));
  // Rest angles mirrored per side; positive shoulder / elbow raise the arm outward and up.
  const restU = sign > 0 ? ARM.aU : Math.PI - ARM.aU;
  const aU = restU + bodyA - sign * shoulder;
  const aF = aU + sign * ARM.bend - sign * elbow;
  const lu = ARM.lu * ks;
  const lf = ARM.lf * ks;
  const ex = sx + Math.cos(aU) * lu;
  const ey = sy + Math.sin(aU) * lu;
  const pxx = ex + Math.cos(aF) * lf;
  const pyy = ey + Math.sin(aF) * lf;
  const rMid = (A.ra + A.rb) / 2;
  return {
    upper: { ax: sx, ay: sy, bx: ex, by: ey, ra: A.ra, rb: rMid },
    fore: { ax: ex, ay: ey, bx: pxx, by: pyy, ra: rMid, rb: A.rb },
    paw: { cx: pxx, cy: pyy, r: A.pawR, rot: (aF - Math.PI / 2) * R.padFollow, open },
    // A paw raised to the face: its forearm and paw are drawn in front of the head.
    front: pyy < headBottom,
  };
}

export function poseBuddy(p: RigParams, base: BaseName = 'sit'): Posed {
  'worklet';
  const B = BASES[base];
  const root = tr(p.rootX, p.rootY + B.bodyDy);

  // Body: volume-preserving squash and breathing, anchored at the floor; lean about the seat.
  const sx = 1 + R.squashX * p.squash;
  const sy = (1 - R.squashY * p.squash) * (1 + R.breathScale * p.breath);
  const seatY = FLOOR;
  let bodyM = about(scl(sx, sy), 0, seatY);
  bodyM = mul(about(rotm(p.bodyLean), 0, seatY), bodyM);
  bodyM = mul(root, bodyM);

  // Head: rides on the body; pivots at the neck.
  const neckY = P.head.ryBot * R.neckOfChin;
  const headRest = ap(bodyM, 0, B.headDy);
  const headSx = 1 + R.headSquashX * p.squash;
  const headSy = 1 - R.headSquashY * p.squash;
  let headM = mul(tr(headRest[0], headRest[1] + p.headNod * R.nodDrop), scl(headSx, headSy));
  headM = mul(headM, about(rotm(p.headTilt + p.headLag + p.bodyLean), 0, neckY));

  // Face layout under headTurn: the measured 3/4 deltas, scaled toward the centre and clamped.
  const t = p.headTurn;
  const k = clamp(Math.abs(t) / 0.5, 0, 2) * R.turnCentral;
  const mir = t > 0 ? -1 : 1; // positive turn: mirror the 3/4 deltas (looking the other way)
  const pick = (i: number) => (t > 0 ? 1 - i : i);

  const eyeW = M.gaze;
  const fx = p.gazeX * eyeW.faceX;
  const fy = p.gazeY * eyeW.faceY;
  const faceNod = p.headNod * R.nodFace;

  // Eyes.
  const eyes: Posed['eyes'] = [];
  const eyeShapeW = [p.eyeRound * (1 - p.blink), p.eyeHappy * (1 - p.blink), p.eyeSleepy + p.blink * (1 - p.eyeSleepy), p.eyeSqueeze * (1 - p.blink)];
  for (let i = 0; i < 2; i++) {
    const e = V.eyes[i];
    const d = TD.eyes[pick(i)];
    const er0 = Math.sqrt(e.rx * e.ry);
    let rx = e.rx * lerp(1, d.rx, k);
    const ry = e.ry * lerp(1, d.ry, k);
    rx = Math.max(rx, e.rx * R.minEyeWidth); // never a sliver
    let cx = e.c[0] + mir * d.d[0] * k + (fx + p.saccadeX * eyeW.eyeExtra) * er0;
    let cy = e.c[1] + d.d[1] * k + (fy + p.saccadeY * eyeW.eyeExtra) * er0 + faceNod;
    const limit = headHalfWidth(cy) - rx - R.faceMargin;
    cx = clamp(cx, -limit, limit);
    const open = p.eyeOpen;
    const round = shapeEllipse(EYE_N, rx, ry * open);
    const happy = shapeBand(EYE_N, rx * 1.05, ry * 0.42, (x) => -ry * 0.55 * (1 - (x / rx) * (x / rx)) + ry * 0.25);
    const sleepy = shapeBand(EYE_N, rx * 1.05, ry * 0.3, (x) => ry * 0.3 * (1 - (x / rx) * (x / rx)) - ry * 0.05);
    // Squeezed eyes: '>' for the left eye, '<' for the right, built as a '^' band and turned 90 degrees.
    const dir = i === 0 ? 1 : -1;
    const hw = ry * R.squeezeHeight;
    const vband = shapeBand(EYE_N, hw, rx * R.squeezeThick, (x) => -rx * R.squeezeDepth * (1 - Math.abs(x) / hw) + rx * R.squeezeDepth * 0.5);
    const squeeze: number[] = [];
    for (let j = 0; j < vband.length; j += 2) {
      squeeze.push(dir > 0 ? -vband[j + 1] : vband[j + 1], dir > 0 ? vband[j] : -vband[j]);
    }
    const poly = blendPolys([round, happy, sleepy, squeeze], eyeShapeW);
    const [ex, ey] = ap(headM, cx, cy);
    const hs = Math.sqrt(Math.abs(headM[0] * headM[3] - headM[1] * headM[2]));
    const ang = angleOf(headM);
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    const world: number[] = [];
    for (let j = 0; j < poly.length; j += 2) world.push(ex + (poly[j] * ca - poly[j + 1] * sa) * hs, ey + (poly[j] * sa + poly[j + 1] * ca) * hs);
    const roundW = eyeShapeW[0] / Math.max(1e-6, eyeShapeW[0] + eyeShapeW[1] + eyeShapeW[2] + eyeShapeW[3]);
    eyes.push({ cx: ex, cy: ey, poly: world, highlight: roundW * clamp(open * 1.6 - 0.6, 0, 1), er: Math.sqrt(rx * ry * open) * hs });
  }

  // Blush.
  const blush: Posed['blush'] = [];
  for (let i = 0; i < 2; i++) {
    const b = V.blush[i];
    const d = TD.blush[pick(i)];
    let cx = b.c[0] + mir * d.d[0] * k + fx * Math.sqrt(V.eyes[i].rx * V.eyes[i].ry);
    const cy = b.c[1] + d.d[1] * k + faceNod;
    const r = b.r * lerp(1, d.r, k);
    const limit = headHalfWidth(cy) - r * 0.3;
    cx = clamp(cx, -limit, limit);
    const [x, y] = ap(headM, cx, cy);
    blush.push({ cx: x, cy: y, r: r * headSx, alpha: p.blush });
  }

  // Mouth.
  const md = TD.mouth;
  const er0 = Math.sqrt(V.eyes[0].rx * V.eyes[0].ry);
  const width = p.mouthWidth * lerp(1, Math.max(md.width, R.minMouthWidth), k);
  const cornerY = (V.mouth.left[1] + V.mouth.right[1]) / 2 + md.d[1] * k + fy * er0 + faceNod;
  let mcx = V.mouth.left[0] / 2 + V.mouth.right[0] / 2 + mir * md.d[0] * k + fx * er0;
  const half = SMILE_HALF * width;
  const limitM = headHalfWidth(cornerY + R.mouthDepthForClamp) - half - R.faceMargin;
  mcx = clamp(mcx, -limitM, limitM);
  const open = p.mouthOpen;
  const smile: number[] = [];
  for (let j = 0; j < SMILE_FLAT.length; j += 2) smile.push(SMILE_FLAT[j], Math.max(0, SMILE_FLAT[j + 1]) * open + Math.min(0, SMILE_FLAT[j + 1]));
  const oShape = shapeEllipse(MOUTH_N, R.mouthO.rx, R.mouthO.ry * open, R.mouthO.ry * open * 0.9);
  const wavy = shapeBand(MOUTH_N, SMILE_HALF * 0.9, R.mouthLine, (x) => R.wavyAmp * Math.sin((x / (SMILE_HALF * 0.9)) * Math.PI * 1.5) + R.mouthLine * 0.5);
  const yawn = shapeEllipse(MOUTH_N, R.mouthYawn.rx, R.mouthYawn.ry * open, R.mouthYawn.ry * open * 0.85);
  const closed = shapeBand(MOUTH_N, SMILE_HALF * 0.75, R.mouthLine, (x) => R.closedCurve * (1 - (x / (SMILE_HALF * 0.75)) * (x / (SMILE_HALF * 0.75))));
  const mw = [p.mouthSmile, p.mouthO, p.mouthWavy, p.mouthYawn, p.mouthClosed];
  const local = blendPolys([smile, oShape, wavy, yawn, closed], mw);
  const hs = Math.sqrt(Math.abs(headM[0] * headM[3] - headM[1] * headM[2]));
  const toWorld = (lx: number, ly: number) => {
    const xx = mcx + lx * width;
    const yy = cornerY + ly + p.mouthCurve * R.curveAmount * (1 - Math.min(1, (lx / SMILE_HALF) * (lx / SMILE_HALF)));
    return ap(headM, xx, yy);
  };
  const mouthPoly: number[] = [];
  for (let j = 0; j < local.length; j += 2) {
    const [x, y] = toWorld(local[j], local[j + 1]);
    mouthPoly.push(x, y);
  }
  const tongue: number[] = [];
  const tScale = clamp(open, 0, 1.3);
  for (let j = 0; j < TONGUE_FLAT.length; j += 2) {
    const [x, y] = toWorld(TONGUE_FLAT[j], TONGUE_FLAT[j + 1] * tScale);
    tongue.push(x, y);
  }
  let tTop = Infinity;
  let tBot = -Infinity;
  for (let j = 1; j < tongue.length; j += 2) {
    tTop = Math.min(tTop, tongue[j]);
    tBot = Math.max(tBot, tongue[j]);
  }
  const mwT = mw[0] + mw[1] + mw[2] + mw[3] + mw[4];
  const tongueAlpha = mwT > 0 ? ((mw[0] + mw[3]) / mwT) * clamp(open * 1.5 - 0.2, 0, 1) : 0;

  // Ears (attached to the head, rotate about where they meet it).
  const ears: Ell[] = [];
  const inner: Posed['innerEars'] = [];
  for (let i = 0; i < 2; i++) {
    const side = i === 0 ? 'earL' : 'earR';
    const e = P[side];
    const d = TD.ears[t > 0 ? (i === 0 ? 'earR' : 'earL') : side];
    const cx0 = e.cx + mir * d[0] * k;
    const cy0 = e.cy + d[1] * k;
    const angle = (i === 0 ? -1 : 1) * (i === 0 ? p.earAngleL : p.earAngleR);
    const perk = i === 0 ? p.earPerkL : p.earPerkR;
    // Hinge: where the ear meets the head, toward the head centre.
    const hx = cx0 * R.earHinge;
    const hy = cy0 * R.earHinge;
    const dist = Math.hypot(cx0, cy0);
    const ux = cx0 / dist;
    const uy = cy0 / dist;
    const lm = mul(headM, about(rotm(angle), hx, hy));
    const ex = cx0 + ux * perk * R.earPerkLift;
    const ey = cy0 + uy * perk * R.earPerkLift;
    // The ear keeps its own frame (its baked lighting lives there); the hinge rotation moves it.
    const ell: Ell = { ...e, cx: ex, cy: ey, ryTop: e.ryTop * (1 + perk * R.earPerkStretch), ryBot: e.ryBot * (1 + perk * R.earPerkStretch) };
    ears.push(placeEll(ell, lm));
    for (const ie of V.innerEars) {
      if (ie.side !== side) continue;
      const di = TD.innerEars[t > 0 ? (i === 0 ? 'earR' : 'earL') : side];
      const [x, y] = ap(lm, ie.c[0] + mir * di.d[0] * k + (ex - cx0), ie.c[1] + di.d[1] * k + (ey - cy0));
      inner.push({ side, cx: x, cy: y, r: ie.r * lerp(1, di.r, k) * hs });
    }
  }

  const head = placeEll(P.head, headM);
  const body = placeEll(P.body, bodyM);
  // Feet stay on the floor (they only follow the root, plus a little squash spread).
  const footM = mul(root, about(scl(1 + R.footSpread * p.squash, 1), 0, FLOOR));
  const footL = placeEll(P.footL, footM);
  const footR = placeEll(P.footR, footM);

  const headBottom = head.cy + head.ryBot * 0.6;
  const armL = poseArm('armL', bodyM, p.shoulderL, p.elbowL, p.pawOpenL, headBottom);
  const armR = poseArm('armR', bodyM, p.shoulderR, p.elbowR, p.pawOpenR, headBottom);
  const headA = angleOf(headM);
  const [hx, hy] = ap(headM, 0, 0);
  return {
    parts: { earL: ears[0], earR: ears[1], body, footL, footR, head },
    innerEars: inner,
    arms: { armL, armR },
    eyes,
    blush,
    mouth: { poly: mouthPoly, tongue, tongueTop: tTop, tongueBottom: tBot, tongueAlpha },
    headFrame: { x: hx, y: hy, angle: headA },
    attach: {
      pawL: { x: armL.paw.cx, y: armL.paw.cy, angle: armL.paw.rot },
      pawR: { x: armR.paw.cx, y: armR.paw.cy, angle: armR.paw.rot },
    },
    floorY: FLOOR + p.rootY,
  };
}

// ---------------------------------------------------------------------------
// Two-link IK (for presets): shoulder and elbow angles that put the paw at a target.
// ---------------------------------------------------------------------------

export function ikArm(side: 'armL' | 'armR', target: [number, number]): { shoulder: number; elbow: number } {
  // Solve in the viewer-right frame (mirror the target for the left arm), elbow out.
  const sign = side === 'armL' ? -1 : 1;
  const tx = target[0] * sign;
  const ty = target[1];
  const dx = tx - ARM.sx;
  const dy = ty - ARM.sy;
  const dist = Math.min(Math.hypot(dx, dy), (ARM.lu + ARM.lf) * 0.999);
  const base = Math.atan2(dy, dx);
  const cosA = (ARM.lu * ARM.lu + dist * dist - ARM.lf * ARM.lf) / (2 * ARM.lu * dist);
  const alpha = Math.acos(clamp(cosA, -1, 1));
  // Of the two elbow solutions, bend away from the head and chest (out and down).
  const away = (a: number) => {
    const ex_ = ARM.sx + Math.cos(a) * ARM.lu;
    const ey_ = ARM.sy + Math.sin(a) * ARM.lu;
    return Math.hypot(ex_ - R.ikAwayFrom[0], ey_ - R.ikAwayFrom[1]);
  };
  const aU = away(base - alpha) >= away(base + alpha) ? base - alpha : base + alpha;
  const ex = ARM.sx + Math.cos(aU) * ARM.lu;
  const ey = ARM.sy + Math.sin(aU) * ARM.lu;
  const aF = Math.atan2(ty - ey, tx - ex);
  // poseArm (viewer-right): aU = ARM.aU - shoulder, aF = aU + ARM.bend - elbow.
  return { shoulder: ARM.aU - aU, elbow: aU + ARM.bend - aF };
}
