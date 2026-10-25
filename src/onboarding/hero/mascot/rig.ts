/**
 * Mascot rig: data from assets/mascot/rig.json (written by
 * tools/prepare_mascot.py) and the transform hierarchy shared by the Skia
 * renderer, the context tests and the Python contact sheet
 * (tools/mascot_contact_sheet.py mirrors this file).
 *
 * Matrices are row-major 3x3 as flat 9-number arrays, which Skia accepts
 * directly for the `matrix` prop: [a, b, tx, c, d, ty, 0, 0, 1].
 */
import rigJson from '../../../../assets/mascot/rig.json';

export type M3 = number[];

export interface RigPart {
  file: string;
  normal: string | null;
  rect: [number, number, number, number];
  pivot: [number, number];
  z: number;
  maxRotationDeg: number;
  polygon: Array<[number, number]>;
  source: 'derived' | 'artist';
}

export interface RigEye {
  c: [number, number];
  r: [number, number];
  ang: number;
  highlights: Array<[number, number, number]>;
}

export interface RigData {
  version: number;
  sourceSize: number;
  textureScale: number;
  zOrder: string[];
  parts: Record<string, RigPart>;
  eyes: { l: RigEye; r: RigEye };
  mouth: {
    shapes: Record<'smile' | 'soft' | 'o' | 'small', Array<[number, number]>>;
    tongue: Record<'smile' | 'soft' | 'o' | 'small', { c: [number, number]; r: [number, number] }>;
    colors: Record<string, string>;
    bbox: [number, number, number, number];
  };
  cheeks: { l: { c: [number, number]; r: number }; r: { c: [number, number]; r: number } };
  eyelid: { colorL: string; colorR: string; fur: string };
  head: { ellipse: [number, number, number, number, number] };
  seat: [number, number];
  silhouetteBounds: [number, number, number, number];
  poses: Record<string, string>;
}

export const RIG = rigJson as unknown as RigData;

/** Part draw order, back to front, with the extra face layers. */
export const BODY_PARTS = ['torso', 'arm_rest', 'leg_l', 'arm_wave'] as const;

// ---------------------------------------------------------------------------
// Pose
// ---------------------------------------------------------------------------

export interface MascotPose {
  introScale: number;
  opacity: number;
  bodyDy: number; // fraction of the source height (negative = up)
  bodySx: number;
  bodySy: number;
  lean: number; // degrees about the seat
  headRot: number;
  headDx: number;
  headDy: number;
  earL: number;
  earR: number;
  arm: number;
  // eye offsets in source px (already scaled by gaze strength)
  eyeLX: number;
  eyeLY: number;
  eyeRX: number;
  eyeRY: number;
  faceParX: number;
  faceParY: number;
  openL: number; // 1 open .. 0 closed
  openR: number;
  wide: number;
  squint: number;
  mouthSmile: number;
  mouthSoft: number;
  mouthO: number;
  mouthSmall: number;
  cheek: number;
}

export const NEUTRAL_POSE: MascotPose = {
  introScale: 1, opacity: 1, bodyDy: 0, bodySx: 1, bodySy: 1, lean: 0,
  headRot: 0, headDx: 0, headDy: 0, earL: 0, earR: 0, arm: 0,
  eyeLX: 0, eyeLY: 0, eyeRX: 0, eyeRY: 0, faceParX: 0, faceParY: 0,
  openL: 1, openR: 1, wide: 1, squint: 0,
  mouthSmile: 1, mouthSoft: 0, mouthO: 0, mouthSmall: 0, cheek: 1,
};

// ---------------------------------------------------------------------------
// 3x3 helpers (worklets)
// ---------------------------------------------------------------------------

export function mul(a: M3, b: M3): M3 {
  'worklet';
  return [
    a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
    a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
    a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
    a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
    a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
    a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
    a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
    a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
    a[6] * b[2] + a[7] * b[5] + a[8] * b[8],
  ];
}

export function mT(x: number, y: number): M3 {
  'worklet';
  return [1, 0, x, 0, 1, y, 0, 0, 1];
}

export function mS(sx: number, sy: number): M3 {
  'worklet';
  return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
}

export function mR(deg: number): M3 {
  'worklet';
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}

/** M applied about point p: T(p) * M * T(-p). */
export function about(px: number, py: number, m: M3): M3 {
  'worklet';
  return mul(mul(mT(px, py), m), mT(-px, -py));
}

export function apply(m: M3, x: number, y: number): [number, number] {
  'worklet';
  return [m[0] * x + m[1] * y + m[2], m[3] * x + m[4] * y + m[5]];
}

// ---------------------------------------------------------------------------
// Transform hierarchy
// ---------------------------------------------------------------------------

export interface RigMatrices {
  body: M3;
  head: M3;
  earL: M3;
  earR: M3;
  arm: M3;
  face: M3; // features (cheeks, mouth, halo)
  faceBase: M3;
  eyeL: M3;
  eyeR: M3;
  hlL: M3;
  hlR: M3;
  lidL: M3; // eye frame without squash (for lids)
  lidR: M3;
  cheekL: M3;
  cheekR: M3;
}

/**
 * All part matrices in SOURCE coordinates (1254 px frame), premultiplied by
 * `stage` (source -> canvas). Mirrors Rig.render in mascot_contact_sheet.py.
 */
export function rigMatrices(p: MascotPose, stage: M3, rigIn?: RigData, squashBlink = false): RigMatrices {
  'worklet';
  const rig = rigIn ?? RIG;
  const N = rig.sourceSize;
  const seat = rig.seat;
  const P = rig.parts;
  const body = mul(stage, about(seat[0], seat[1],
    mul(mul(mul(mT(0, p.bodyDy * N), mR(p.lean)), mS(p.bodySx, p.bodySy)), mS(p.introScale, p.introScale))));
  const head = mul(body, about(P.head.pivot[0], P.head.pivot[1], mul(mT(p.headDx, p.headDy), mR(p.headRot))));
  const earL = mul(head, about(P.ear_l.pivot[0], P.ear_l.pivot[1], mR(p.earL)));
  const earR = mul(head, about(P.ear_r.pivot[0], P.ear_r.pivot[1], mR(p.earR)));
  const arm = mul(body, about(P.arm_wave.pivot[0], P.arm_wave.pivot[1], mR(p.arm)));
  const face = mul(head, mT(p.faceParX, p.faceParY));
  const faceBase = mul(head, mT(p.faceParX * 0.35, p.faceParY * 0.35));
  const el = rig.eyes.l;
  const er = rig.eyes.r;
  const oyL = squashBlink ? Math.max(p.openL, 0.02) : 1;
  const oyR = squashBlink ? Math.max(p.openR, 0.02) : 1;
  const lidL = mul(face, mT(p.eyeLX, p.eyeLY));
  const lidR = mul(face, mT(p.eyeRX, p.eyeRY));
  const eyeL = mul(lidL, about(el.c[0], el.c[1], mS(p.wide, p.wide * oyL)));
  const eyeR = mul(lidR, about(er.c[0], er.c[1], mS(p.wide, p.wide * oyR)));
  const hlL = mul(mul(face, mT(p.eyeLX * 0.25, p.eyeLY * 0.25)), about(el.c[0], el.c[1], mS(p.wide, p.wide * oyL)));
  const hlR = mul(mul(face, mT(p.eyeRX * 0.25, p.eyeRY * 0.25)), about(er.c[0], er.c[1], mS(p.wide, p.wide * oyR)));
  const cs = Math.sqrt(Math.max(p.cheek, 0.01));
  const cheekL = mul(face, about(rig.cheeks.l.c[0], rig.cheeks.l.c[1], mS(cs, cs)));
  const cheekR = mul(face, about(rig.cheeks.r.c[0], rig.cheeks.r.c[1], mS(cs, cs)));
  return { body, head, earL, earR, arm, face, faceBase, eyeL, eyeR, hlL, hlR, lidL, lidR, cheekL, cheekR };
}

/** Which matrix each textured part uses. */
export function partMatrix(name: string, m: RigMatrices): M3 {
  'worklet';
  switch (name) {
    case 'ear_l': return m.earL;
    case 'ear_r': return m.earR;
    case 'arm_wave':
    case 'arm_wave_front': return m.arm;
    case 'head':
    case 'chin_shadow': return m.head;
    case 'face_base': return m.faceBase;
    case 'eye_l': return m.eyeL;
    case 'eye_r': return m.eyeR;
    case 'highlight_l': return m.hlL;
    case 'highlight_r': return m.hlR;
    case 'cheek_l': return m.cheekL;
    case 'cheek_r': return m.cheekR;
    case 'mouth':
    case 'eye_halo_l':
    case 'eye_halo_r': return m.face;
    default: return m.body;
  }
}

/** Source -> canvas matrix for a Buddy placed by the layout. */
export function stageMatrix(x: number, y: number, scale: number, dx = 0, dy = 0, rigIn?: RigData): M3 {
  'worklet';
  const rig = rigIn ?? RIG;
  const b = rig.silhouetteBounds;
  return mul(mT(x + dx - b[0] * scale, y + dy - b[1] * scale), mS(scale, scale));
}

/** On-canvas polygon of a part for a pose (used by the context tests). */
export function partPolygon(name: string, m: RigMatrices, rig: RigData = RIG): Array<[number, number]> {
  const poly = rig.parts[name].polygon;
  const M = partMatrix(name, m);
  return poly.map(([x, y]) => apply(M, x, y));
}

/** Parts that make up Buddy's silhouette (for overlap tests and layout). */
export const SILHOUETTE_PARTS = ['ear_l', 'ear_r', 'torso', 'arm_rest', 'leg_l', 'leg_r', 'arm_wave', 'head'];
