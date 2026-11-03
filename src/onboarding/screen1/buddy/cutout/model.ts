import profile from '../../../../../design/buddy/assembly_review/head_surface_profile.json';
import fit from '../../../../../design/buddy/assembly_review/face_projection_fit.json';
import face from '../../../../../design/buddy/assembly_review/face_assets.json';

export const CUTOUT = {
  headWidth: 706, headAspect: 0.856, sourceHeadAspect: 674 / 836,
  headCenter: { x: 644, y: 550 }, masterRoll: face.masterRoll,
  ellipsoid: { rx: 0.5, ry: 0.428, depth: fit.depth, camera: fit.cameraDistance },
  yawThreeQuarter: fit.yawThreeQuarter, turnReference: -0.5,
  maxYaw: Math.abs(fit.yawThreeQuarter), maxNod: 0.18,
  // The authored right eye sits farther out: protect its outline margin too.
  rightYawSafety: 0.82,
  // Preserve the broad plush silhouette as the ellipsoid turns.
  turnWidthCompensation: 0.12,
  mesh: { rows: 48, columns: 96, feature: 8, part: 12 },
  headEdgeBlur: 1.15,
  stage: { size:1254, small:200, paddingTop:38, gap:20 },
  headTexture: {width:2048,height:1024},
  armSkin: {center:.53,restElbow:.49,raisedElbow:.60,blendBack:.14,blendFront:.18},
  blinkTexture: {centerY:.53,compression:.92,closedX:.11,closedWidth:.78,closedHeight:.20},
  ear: { minWidth: 0.96, depth: 0.10, anchorYaw: 0.28 },
  background: '#F6F3FF', darkBackground: '#1A1A1E',
  armSwap: { start: 0.46, end: 0.62 },
  floor: { x: 643, y: 1166, w: 690, h: 42, blur: 17, opacity: 0.16 },
  neckShadow: { x: 635, y: 841, w: 410, h: 58, blur: 18, opacity: 0.22 },
  body: { x: 362, y: 765, w: 505, h: 397 },
  footL: { x: 326, y: 952, w: 245, h: 237 },
  footR: { x: 746, y: 952, w: 270, h: 230 },
  armRestL: { x: 372, y: 803, w: 210, h: 285 },
  armRestR: { x: 698, y: 803, w: 210, h: 285 },
  armRaisedL: { x: 126, y: 548, w: 314, h: 348 },
  armRaisedR: { x: 840, y: 548, w: 314, h: 348 },
  earL: { x: 268, y: 180, w: 264, h: 258 },
  earR: { x: 804, y: 221, w: 245, h: 240 },
  features: face.features,
} as const;

export interface CutoutPose {
  turn: number; nod: number; roll: number; squash: number; armL: number; armR: number;
  blink?: number; breath?: number; earL?: number; earR?: number;
  elbowL?: number; elbowR?: number; hop?: number; rootSquash?: number;
}
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
  const a = Math.min(0.5, Math.abs(turn));
  const ref = Math.abs(CUTOUT.yawThreeQuarter);
  return Math.sign(turn) * a * 2 * ref * (turn>0?CUTOUT.rightYawSafety:1);
}
/** One ellipsoid transform for head vertices AND every point of each face quad.
 * At rest, artwork coordinates are exact. Perspective is relative to the source
 * camera, avoiding a second application of perspective to already-rendered art.
 */
export function headRow(y: number) {
  'worklet';
  const q=Math.max(0,Math.min(96,(y/CUTOUT.headAspect+.5)*96)),i=Math.min(95,Math.floor(q)),t=q-i;
  return {cx:profile[i][0]*(1-t)+profile[i+1][0]*t,rx:profile[i][1]*(1-t)+profile[i+1][1]*t};
}
export function surfaceDepth(x:number,y:number) {
  'worklet';
  const row=headRow(y);
  return CUTOUT.ellipsoid.depth*Math.sqrt(Math.max(.0001,1-(y/CUTOUT.ellipsoid.ry)**2))*Math.sqrt(Math.max(.0001,1-((x-row.cx)/row.rx)**2));
}
export function projectPoint(x:number,y:number,z:number,pose:CutoutPose) {
  'worklet';
  return projectPrepared(x,y,z,prepareProjection(pose));
}
export function prepareProjection(pose:CutoutPose) {
  'worklet';
  const yaw=yawForTurn(pose.turn),nod=pose.nod*CUTOUT.maxNod;
  return {cy:Math.cos(yaw),sy:Math.sin(yaw),cn:Math.cos(nod),sn:Math.sin(nod),cr:Math.cos(pose.roll),sr:Math.sin(pose.roll),
    sx:(1+CUTOUT.turnWidthCompensation*(yaw/CUTOUT.maxYaw)**2)/Math.sqrt(pose.squash),squash:pose.squash};
}
export function projectPrepared(x:number,y:number,z:number,p:ReturnType<typeof prepareProjection>) {
  'worklet';
  const xx=x*p.cy+z*p.sy,zz=-x*p.sy+z*p.cy,yy=y*p.cn+zz*p.sn,z2=-y*p.sn+zz*p.cn;
  const k=(CUTOUT.ellipsoid.camera-Math.abs(z))/(CUTOUT.ellipsoid.camera-z2),sx=xx*k*p.sx,sy=yy*k*p.squash;
  return {x:sx*p.cr-sy*p.sr,y:sx*p.sr+sy*p.cr};
}
export function projectSurface(x:number,y:number,pose:CutoutPose) {
  'worklet';
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
