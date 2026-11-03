import profile from '../../../../../design/buddy/assembly_review/head_surface_profile.json';
import fit from '../../../../../design/buddy/assembly_review/face_projection_fit.json';
import face from '../../../../../design/buddy/assembly_review/face_assets.json';

export const CUTOUT = {
  headWidth: 706, headAspect: 0.856, sourceHeadAspect: 674 / 836,
  headCenter: { x: 644, y: 550 }, masterRoll: face.masterRoll,
  ellipsoid: { rx: 0.5, ry: 0.428, depth: fit.depth, camera: fit.cameraDistance },
  yawThreeQuarter: fit.yawThreeQuarter, turnReference: -0.5,
  maxYaw: Math.abs(fit.yawThreeQuarter) * 1.45, maxNod: 0.23,
  mesh: { head: 96, feature: 16, part: 12 },
  background: '#F6F3FF', darkBackground: '#1A1A1E',
  armSwap: { start: 0.46, end: 0.62 },
  floor: { x: 643, y: 1166, w: 690, h: 42, blur: 17, opacity: 0.16 },
  neckShadow: { x: 635, y: 841, w: 410, h: 44, blur: 13, opacity: 0.20 },
  body: { x: 362, y: 765, w: 505, h: 397 },
  footL: { x: 326, y: 952, w: 245, h: 237 },
  footR: { x: 746, y: 952, w: 270, h: 230 },
  armRestL: { x: 372, y: 803, w: 210, h: 285 },
  armRestR: { x: 698, y: 803, w: 210, h: 285 },
  armRaisedL: { x: 134, y: 548, w: 332, h: 348 },
  armRaisedR: { x: 834, y: 548, w: 332, h: 348 },
  earL: { x: 268, y: 180, w: 264, h: 258 },
  earR: { x: 804, y: 221, w: 245, h: 240 },
  features: face.features,
} as const;

export interface CutoutPose { turn: number; nod: number; roll: number; squash: number; armL: number; armR: number }
export const NEUTRAL: CutoutPose = { turn: 0, nod: 0, roll: 0, squash: 1, armL: 0, armR: 0 };
export const MASTER_POSE: CutoutPose = { ...NEUTRAL, roll: CUTOUT.masterRoll, armL: 1 };
export const DIAGNOSTICS = [
  { label: 'Turn -1', pose: { ...NEUTRAL, turn: -1 } },
  { label: 'Turn -0.5 / 3-4', pose: { ...NEUTRAL, turn: -0.5 } },
  { label: 'Front', pose: { ...NEUTRAL } },
  { label: 'Turn +0.5', pose: { ...NEUTRAL, turn: 0.5 } },
  { label: 'Turn +1', pose: { ...NEUTRAL, turn: 1 } },
  { label: 'Nod up', pose: { ...NEUTRAL, nod: -1 } },
  { label: 'Nod down', pose: { ...NEUTRAL, nod: 1 } },
  { label: 'Tilt -8 deg', pose: { ...NEUTRAL, roll: -8 * Math.PI / 180 } },
  { label: 'Tilt +8 deg', pose: { ...NEUTRAL, roll: 8 * Math.PI / 180 } },
  { label: 'Squash 0.88', pose: { ...NEUTRAL, squash: 0.88 } },
];
export function yawForTurn(turn: number) {
  'worklet';
  const a = Math.min(1, Math.abs(turn));
  const ref = Math.abs(CUTOUT.yawThreeQuarter);
  return Math.sign(turn) * (a <= 0.5 ? a * 2 * ref : ref + (a - 0.5) * 2 * (CUTOUT.maxYaw - ref));
}
/** One ellipsoid transform for head vertices AND every point of each face quad.
 * At rest, artwork coordinates are exact. Perspective is relative to the source
 * camera, avoiding a second application of perspective to already-rendered art.
 */
export function headRow(y: number) {
  const q=Math.max(0,Math.min(96,(y/CUTOUT.headAspect+.5)*96)),i=Math.min(95,Math.floor(q)),t=q-i;
  return {cx:profile[i][0]*(1-t)+profile[i+1][0]*t,rx:profile[i][1]*(1-t)+profile[i+1][1]*t};
}
export function surfaceDepth(x:number,y:number) {
  const row=headRow(y);
  return CUTOUT.ellipsoid.depth*Math.sqrt(Math.max(.0001,1-(y/CUTOUT.ellipsoid.ry)**2))*Math.sqrt(Math.max(.0001,1-((x-row.cx)/row.rx)**2));
}
export function projectPoint(x:number,y:number,z:number,pose:CutoutPose) {
  const yaw=yawForTurn(pose.turn),nod=pose.nod*CUTOUT.maxNod,cam=CUTOUT.ellipsoid.camera;
  const xx=x*Math.cos(yaw)+z*Math.sin(yaw),zz=-x*Math.sin(yaw)+z*Math.cos(yaw);
  const yy=y*Math.cos(nod)+zz*Math.sin(nod),z2=-y*Math.sin(nod)+zz*Math.cos(nod);
  const k=(cam-Math.abs(z))/(cam-z2),sx=xx*k/Math.sqrt(pose.squash),sy=yy*k*pose.squash;
  const c=Math.cos(pose.roll),s=Math.sin(pose.roll);
  return {x:sx*c-sy*s,y:sx*s+sy*c};
}
export function projectSurface(x:number,y:number,pose:CutoutPose) {
  const z=surfaceDepth(x,y),eps=.0001;
  const nx=-(surfaceDepth(x+eps,y)-surfaceDepth(x-eps,y))/(2*eps);
  const ny=-(surfaceDepth(x,y+eps)-surfaceDepth(x,y-eps))/(2*eps);
  const yaw=yawForTurn(pose.turn),nod=pose.nod*CUTOUT.maxNod;
  const nz=-nx*Math.sin(yaw)+Math.cos(yaw);
  return {...projectPoint(x,y,z,pose),facing:-ny*Math.sin(nod)+nz*Math.cos(nod)};
}
export function raisedWeight(lift: number) {
  'worklet';
  const t = Math.max(0, Math.min(1, (lift - CUTOUT.armSwap.start) / (CUTOUT.armSwap.end - CUTOUT.armSwap.start)));
  return t * t * (3 - 2 * t);
}
