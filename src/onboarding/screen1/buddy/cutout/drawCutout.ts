import type { SkCanvas, SkImage, Skia as SkiaApi } from '@shopify/react-native-skia';
import { CUTOUT, MASTER_POSE, projectSurface, projectPoint, headRow, yawForTurn, raisedWeight, type CutoutPose } from './model';

export type TextureSet = Record<string, SkImage>;
export interface Resources { api: typeof SkiaApi; images: TextureSet }
type Box = { x: number; y: number; w: number; h: number };

function textured(canvas: SkCanvas, r: Resources, name: string, count: number,
  point: (u: number, v: number) => { x: number; y: number; facing?: number }, mirror = false, opacity = 1) {
  const im = r.images[name];
  if (!im || opacity <= 0) return;
  const positions: {x:number;y:number}[] = [], uv: {x:number;y:number}[] = [], indices: number[] = [], facing: number[] = [];
  for (let j = 0; j <= count; j++) for (let i = 0; i <= count; i++) {
    const u = i / count, v = j / count;
    const p=point(u,v); positions.push(p);facing.push(p.facing ?? 1); uv.push({ x: (mirror ? 1 - u : u) * im.width(), y: v * im.height() });
    if (i < count && j < count) {
      const k = j * (count + 1) + i;
      indices.push(k, k + 1, k + count + 1, k + 1, k + count + 2, k + count + 1);
    }
  }
  const visible = indices.filter((_,i)=>{ const k=Math.floor(i/3)*3; return facing[indices[k]]+facing[indices[k+1]]+facing[indices[k+2]] >= -0.00001; });
  const verts = r.api.MakeVertices(0, positions, uv, undefined, visible, true);
  const paint = r.api.Paint(); paint.setAntiAlias(true); paint.setAlphaf(opacity);
  // Decal, Linear, no mipmaps; UVs are in original texture pixels.
  const shader = im.makeShaderOptions(3, 3, 1, 0);
  paint.setShader(shader); canvas.drawVertices(verts, 3, paint);
  verts.dispose(); paint.dispose(); shader.dispose();
}
function part(canvas: SkCanvas, r: Resources, name: string, box: Box, mirror = false, opacity = 1) {
  const im = r.images[name]; if (!im) return;
  textured(canvas, r, name, CUTOUT.mesh.part, (u,v) => ({
    x: box.x + (u * im.width() - 8) / (im.width() - 16) * box.w,
    y: box.y + (v * im.height() - 8) / (im.height() - 16) * box.h,
  }), mirror, opacity);
}
function shadow(canvas: SkCanvas, r: Resources, s: {x:number;y:number;w:number;h:number;blur:number;opacity:number}) {
  const p = r.api.Paint();p.setColor(r.api.Color('#654299'));p.setAlphaf(s.opacity);
  p.setMaskFilter(r.api.MaskFilter.MakeBlur(0,s.blur,true));
  canvas.drawOval(r.api.XYWHRect(s.x-s.w/2,s.y-s.h/2,s.w,s.h),p);p.dispose();
}
function arm(canvas: SkCanvas, r: Resources, left: boolean, lift: number) {
  const rest=left?CUTOUT.armRestL:CUTOUT.armRestR, up=left?CUTOUT.armRaisedL:CUTOUT.armRaisedR;
  const box = { x:rest.x+(up.x-rest.x)*lift,y:rest.y+(up.y-rest.y)*lift,w:rest.w+(up.w-rest.w)*lift,h:rest.h+(up.h-rest.h)*lift };
  const a=raisedWeight(lift);
  part(canvas,r,'arm_viewer_right',box,left,1-a);
  part(canvas,r,'arm_viewer_left',box,!left,a);
}
/** Identical drawVertices code is used in Buddy Lab and the offscreen harness. */
export function drawCutout(canvas: SkCanvas,r:Resources,pose:CutoutPose=MASTER_POSE,headOnly=false) {
  if (!headOnly) {
    shadow(canvas,r,CUTOUT.floor);
    part(canvas,r,'torso',CUTOUT.body);
    part(canvas,r,'foot_viewer_left',CUTOUT.footL);
    part(canvas,r,'foot_viewer_right',CUTOUT.footR);
    if(pose.armL<.5)arm(canvas,r,true,pose.armL);if(pose.armR<.5)arm(canvas,r,false,pose.armR);
    shadow(canvas,r,CUTOUT.neckShadow);
  }
  // Ear anchors follow the head pose; their hidden inner joins stay under its fur.
  for (const [name,box] of [['ear_viewer_left',CUTOUT.earL],['ear_viewer_right',CUTOUT.earR]] as const) {
    const im=r.images[name];if(!im)continue;
    const cs=Math.cos(-CUTOUT.masterRoll),sn=Math.sin(-CUTOUT.masterRoll);
    textured(canvas,r,name,CUTOUT.mesh.part,(u,v)=>{
      const x=(box.x+(u*im.width()-8)/(im.width()-16)*box.w-CUTOUT.headCenter.x)/CUTOUT.headWidth;
      const y=(box.y+(v*im.height()-8)/(im.height()-16)*box.h-CUTOUT.headCenter.y)/CUTOUT.headWidth;
      const pt=projectSurface(x*cs-y*sn,y*cs+x*sn,pose);
      return {x:CUTOUT.headCenter.x+pt.x*CUTOUT.headWidth,y:CUTOUT.headCenter.y+pt.y*CUTOUT.headWidth};
    });
  }
  surfaceHead(canvas,r,pose);
  // Blush first, then eyes/mouth. Every interior vertex samples the same ellipsoid.
  const features=[...CUTOUT.features].sort((a,b)=>Number(!a.name.startsWith('blush'))-Number(!b.name.startsWith('blush')));
  for(const f of features) textured(canvas,r,f.name,CUTOUT.mesh.feature,(u,v)=>{
    const pt=projectSurface(f.x+u*f.w,f.y+v*f.h,pose);
    return {x:CUTOUT.headCenter.x+pt.x*CUTOUT.headWidth,y:CUTOUT.headCenter.y+pt.y*CUTOUT.headWidth,facing:pt.facing};
  });
  if(!headOnly){if(pose.armL>=.5)arm(canvas,r,true,pose.armL);if(pose.armR>=.5)arm(canvas,r,false,pose.armR);}
}


/** Complete closed volume, including the newly visible side on a turn. Source UVs
 * follow the approved silhouette; back-facing triangles never cover the front. */
export function surfaceHead(canvas:SkCanvas,r:Resources,pose:CutoutPose) {
  const im=r.images.head_surface;if(!im)return;
  const rows=96,cols=160; const positions: {x:number;y:number}[] = [], uv: {x:number;y:number}[] = [], indices: number[] = [], colors: Float32Array[] = [];
  for(let j=0;j<=rows;j++) for(let i=0;i<=cols;i++) {
    const v=j/rows,y=(v-.5)*CUTOUT.headAspect,row=headRow(y);
    const theta=-Math.PI+i/cols*Math.PI*2;
    const x=row.cx+row.rx*Math.sin(theta);
    const z=CUTOUT.ellipsoid.depth*Math.sqrt(Math.max(.0001,1-(y/CUTOUT.ellipsoid.ry)**2))*Math.cos(theta);
    const p=projectPoint(x,y,z,pose);
    const dy=Math.max(.001,CUTOUT.ellipsoid.depth*Math.sqrt(Math.max(.0001,1-(y/CUTOUT.ellipsoid.ry)**2)));
    const nx=Math.sin(theta)/row.rx,ny=y/(CUTOUT.ellipsoid.ry**2),nz=Math.cos(theta)/dy;
    const yaw=yawForTurn(pose.turn),nod=pose.nod*CUTOUT.maxNod;
    const facing=(-ny*Math.sin(nod)+(-nx*Math.sin(yaw)+nz*Math.cos(yaw))*Math.cos(nod))/Math.hypot(nx,ny,nz);
    colors.push(r.api.Color(`rgba(255,255,255,${Math.max(0,Math.min(1,facing*18))})`));
    positions.push({x:CUTOUT.headCenter.x+p.x*CUTOUT.headWidth,y:CUTOUT.headCenter.y+p.y*CUTOUT.headWidth});
    uv.push({x:i/cols*im.width(),y:v*im.height()});
  }
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++) {
    const k=j*(cols+1)+i;
    for(const tri of [[k,k+1,k+cols+1],[k+1,k+cols+2,k+cols+1]]) {
      const [a,b,c]=tri.map(t=>positions[t]);
      if((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)>0)indices.push(...tri);
    }
  }
  const vertices=r.api.MakeVertices(0,positions,uv,colors,indices,true);
  const p=r.api.Paint();p.setAntiAlias(true);const shader=im.makeShaderOptions(3,3,1,0);p.setShader(shader);
  canvas.drawVertices(vertices,13,p);vertices.dispose();shader.dispose();p.dispose();
}
