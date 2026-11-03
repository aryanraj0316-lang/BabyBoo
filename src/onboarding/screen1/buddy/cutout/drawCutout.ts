import type { SkCanvas, SkImage, Skia as SkiaApi } from '@shopify/react-native-skia';
import { CUTOUT, MASTER_POSE, projectSurface, projectPoint, headRow, prepareProjection, projectPrepared, raisedWeight, type CutoutPose } from './model';
import { MOTION, smooth } from './motion';

export type TextureSet = Record<string, SkImage | null>;
export interface Resources { api: typeof SkiaApi; images: TextureSet }
type Box = { x: number; y: number; w: number; h: number };

function textured(canvas: SkCanvas, r: Resources, name: string, count: number,
  point: (u: number, v: number) => { x: number; y: number; facing?: number }, mirror = false, opacity = 1) {
  'worklet';
  const im = r.images[name];
  if (!im || opacity <= 0) return;
  const positions: {x:number;y:number}[] = [], uv: {x:number;y:number}[] = [], indices: number[] = [], facing: number[] = [];
  for (let j=0;j<=count;j++) for(let i=0;i<=count;i++) {
    const u=i/count,v=j/count,p=point(u,v);
    positions.push({x:p.x,y:p.y}); facing.push(p.facing??1);
    uv.push({x:(mirror?1-u:u)*im.width(),y:v*im.height()});
    if(i<count&&j<count) {
      const k=j*(count+1)+i;
      indices.push(k,k+1,k+count+1,k+1,k+count+2,k+count+1);
    }
  }
  const visible:number[]=[];
  for(let k=0;k<indices.length;k+=3)if(facing[indices[k]]+facing[indices[k+1]]+facing[indices[k+2]]>=0)visible.push(indices[k],indices[k+1],indices[k+2]);
  const verts=r.api.MakeVertices(0,positions,uv,undefined,visible,true);
  const paint=r.api.Paint();paint.setAntiAlias(true);paint.setAlphaf(opacity);
  // Catmull-Rom sampling retains the original ear/eye detail through rescaling.
  const shader=im.makeShaderCubic(3,3,0,.5);paint.setShader(shader);
  canvas.drawVertices(verts,3,paint);verts.dispose();paint.dispose();shader.dispose();
}
function part(canvas:SkCanvas,r:Resources,name:string,box:Box,mirror=false,opacity=1) {
  'worklet';
  const im=r.images[name];if(!im)return;
  textured(canvas,r,name,2,(u,v)=>{
    'worklet';
    return {x:box.x+(u*im.width()-8)/(im.width()-16)*box.w,y:box.y+(v*im.height()-8)/(im.height()-16)*box.h};
  },mirror,opacity);
}
function shadow(canvas:SkCanvas,r:Resources,s:{x:number;y:number;w:number;h:number;blur:number;opacity:number}) {
  'worklet';
  const p=r.api.Paint();p.setColor(r.api.Color('#654299'));p.setAlphaf(s.opacity);
  const filter=r.api.MaskFilter.MakeBlur(0,s.blur,true);p.setMaskFilter(filter);
  canvas.drawOval(r.api.XYWHRect(s.x-s.w/2,s.y-s.h/2,s.w,s.h),p);p.dispose();filter.dispose();
}
function arm(canvas:SkCanvas,r:Resources,left:boolean,lift:number,bend:number) {
  'worklet';
  const rest=left?CUTOUT.armRestL:CUTOUT.armRestR,up=left?CUTOUT.armRaisedL:CUTOUT.armRaisedR;
  const box={x:rest.x+(up.x-rest.x)*lift,y:rest.y+(up.y-rest.y)*lift,w:rest.w+(up.w-rest.w)*lift,h:rest.h+(up.h-rest.h)*lift};
  const raised=raisedWeight(lift);
  for(let state=0;state<2;state++) {
    const name=state===0?'arm_viewer_right':'arm_viewer_left',im=r.images[name];if(!im)continue;
    const opacity=state===0?1-raised:raised;if(opacity<=0)continue;
    const mirror=state===0?left:!left,skin=CUTOUT.armSkin,elbowV=state===0?skin.restElbow:skin.raisedElbow;
    textured(canvas,r,name,CUTOUT.mesh.part,(u,v)=>{
      'worklet';
      const uu=(u*im.width()-8)/(im.width()-16),vv=(v*im.height()-8)/(im.height()-16);
      const weight=state===0?smooth(elbowV-skin.blendBack,elbowV+skin.blendFront,vv):1-smooth(elbowV-skin.blendFront,elbowV+skin.blendBack,vv);
      const angle=bend*weight*(left?1:-1),c=Math.cos(angle),s=Math.sin(angle);
      const dx=(uu-skin.center)*box.w,dy=(vv-elbowV)*box.h;
      return {x:box.x+skin.center*box.w+dx*c-dy*s,y:box.y+elbowV*box.h+dx*s+dy*c};
    },mirror,opacity);
  }
}
function ears(canvas:SkCanvas,r:Resources,pose:CutoutPose) {
  'worklet';
  for(let i=0;i<2;i++) {
    const box=i===0?CUTOUT.earL:CUTOUT.earR,name=i===0?'ear_viewer_left':'ear_viewer_right';
    const im=r.images[name];if(!im)continue;
    const cx=box.x+box.w/2,cy=box.y+box.h/2,cr=Math.cos(-CUTOUT.masterRoll),sr=Math.sin(-CUTOUT.masterRoll);
    const lx=(cx-CUTOUT.headCenter.x)/CUTOUT.headWidth,ly=(cy-CUTOUT.headCenter.y)/CUTOUT.headWidth;
    const p=projectPoint(lx*cr-ly*sr,ly*cr+lx*sr,CUTOUT.ear.depth,{...pose,turn:Math.max(-.5,Math.min(.5,pose.turn))*CUTOUT.ear.anchorYaw});
    const angle=pose.roll-CUTOUT.masterRoll+(i===0?(pose.earL??0):(pose.earR??0));
    const c=Math.cos(angle),s=Math.sin(angle),width=1-(1-CUTOUT.ear.minWidth)*Math.min(1,Math.abs(pose.turn)*2);
    // Ear surface is a broad rigid card, not a sample of the head's curvature.
    textured(canvas,r,name,2,(u,v)=>{
      'worklet';
      const dx=((u*im.width()-8)/(im.width()-16)-.5)*box.w*width;
      const dy=((v*im.height()-8)/(im.height()-16)-.5)*box.h;
      return {x:CUTOUT.headCenter.x+p.x*CUTOUT.headWidth+dx*c-dy*s,y:CUTOUT.headCenter.y+p.y*CUTOUT.headWidth+dx*s+dy*c};
    });
  }
}
/** The device and harness share the textured-mesh drawing code. */
export function drawCutout(canvas:SkCanvas,r:Resources,pose:CutoutPose=MASTER_POSE,headOnly=false) {
  'worklet';
  const hop=pose.hop??0,breath=pose.breath??0,squash=pose.rootSquash??1;
  if(!headOnly)shadow(canvas,r,{...CUTOUT.floor,w:CUTOUT.floor.w*(1-.4*hop/MOTION.hopHeight),opacity:CUTOUT.floor.opacity*(1-.35*hop/MOTION.hopHeight)});
  canvas.save();
  if(!headOnly) {
    canvas.translate(CUTOUT.floor.x,CUTOUT.floor.y-hop);canvas.scale(1/Math.sqrt(squash),squash*(1+breath));canvas.translate(-CUTOUT.floor.x,-CUTOUT.floor.y);
    part(canvas,r,'torso',CUTOUT.body);
    part(canvas,r,'foot_viewer_left',CUTOUT.footL);part(canvas,r,'foot_viewer_right',CUTOUT.footR);
    // Shoulder and elbow always sit behind the head. No layer-order pop on lift.
    arm(canvas,r,true,pose.armL,pose.elbowL??0);arm(canvas,r,false,pose.armR,pose.elbowR??0);
    shadow(canvas,r,CUTOUT.neckShadow);
  }
  ears(canvas,r,pose);surfaceHead(canvas,r,pose);
  // Blush first; every face vertex samples the same surface as the head.
  for(let layer=0;layer<2;layer++)for(const f of CUTOUT.features) {
    const isBlush=f.name.startsWith('blush');if((layer===0)!==isBlush)continue;
    const eye=f.name.startsWith('eye'),blink=eye?(pose.blink??0):0,closed=smooth(.45,.94,blink);
    const b=CUTOUT.blinkTexture,centerY=f.y+f.h*b.centerY,openScale=1-blink*b.compression;
    textured(canvas,r,f.name,CUTOUT.mesh.feature,(u,v)=>{
      'worklet';
      const y=eye?centerY+(f.y+v*f.h-centerY)*openScale:f.y+v*f.h;
      const p=projectSurface(f.x+u*f.w,y,pose);
      return {x:CUTOUT.headCenter.x+p.x*CUTOUT.headWidth,y:CUTOUT.headCenter.y+p.y*CUTOUT.headWidth,facing:p.facing};
    },false,1-closed);
    if(eye&&closed>0)textured(canvas,r,f.name==='eye_left'?'eye_closed_left':'eye_closed_right',CUTOUT.mesh.feature,(u,v)=>{
      'worklet';
      const p=projectSurface(f.x+f.w*(b.closedX+u*b.closedWidth),centerY+(v-.5)*f.h*b.closedHeight,pose);
      return {x:CUTOUT.headCenter.x+p.x*CUTOUT.headWidth,y:CUTOUT.headCenter.y+p.y*CUTOUT.headWidth,facing:p.facing};
    },false,closed);
  }
  canvas.restore();
}

// Immutable authored head vertices/normals; trig and profile sampling stay out of
// the per-frame mesh loop. Both runtimes use this same geometry.
const HEAD = (()=>{
  const data:number[][]=[],indices:number[]=[],rows=CUTOUT.mesh.rows,cols=CUTOUT.mesh.columns;
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++) {
    const v=j/rows,y=(v-.5)*CUTOUT.headAspect,row=headRow(y),theta=-Math.PI+i/cols*Math.PI*2;
    const dy=Math.max(.001,CUTOUT.ellipsoid.depth*Math.sqrt(Math.max(.0001,1-(y/CUTOUT.ellipsoid.ry)**2)));
    const nx=Math.sin(theta)/row.rx,ny=y/(CUTOUT.ellipsoid.ry**2),nz=Math.cos(theta)/dy,norm=Math.hypot(nx,ny,nz);
    data.push([row.cx+row.rx*Math.sin(theta),y,dy*Math.cos(theta),nx/norm,ny/norm,nz/norm,i/cols,v]);
    if(i<cols&&j<rows){const k=j*(cols+1)+i;indices.push(k,k+1,k+cols+1,k+1,k+cols+2,k+cols+1);}
  }
  const colors=Array.from({length:65},(_,i)=>new Float32Array([1,1,1,i/64]));
  const uv=data.map(d=>({x:d[6]*CUTOUT.headTexture.width,y:d[7]*CUTOUT.headTexture.height}));
  return {data,indices,colors,uv};
})();
export function surfaceHead(canvas:SkCanvas,r:Resources,pose:CutoutPose) {
  'worklet';
  const im=r.images.head_surface;if(!im)return;
  const positions:{x:number;y:number}[]=[],uv:{x:number;y:number}[]=[],colors:Float32Array[]=[],indices:number[]=[];
  const frame=prepareProjection(pose);
  for(const d of HEAD.data) {
    const p=projectPrepared(d[0],d[1],d[2],frame);
    const facing=-d[4]*frame.sn+(-d[3]*frame.sy+d[5]*frame.cy)*frame.cn;
    colors.push(HEAD.colors[Math.round(Math.max(0,Math.min(1,facing*24))*64)]);
    positions.push({x:CUTOUT.headCenter.x+p.x*CUTOUT.headWidth,y:CUTOUT.headCenter.y+p.y*CUTOUT.headWidth});
  }
  for(let i=0;i<HEAD.indices.length;i+=3) {
    const ia=HEAD.indices[i],ib=HEAD.indices[i+1],ic=HEAD.indices[i+2],a=positions[ia],b=positions[ib],c=positions[ic];
    if((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)>0)indices.push(ia,ib,ic);
  }
  const vertices=r.api.MakeVertices(0,positions,HEAD.uv,colors,indices,true);
  const p=r.api.Paint();p.setAntiAlias(true);const shader=im.makeShaderOptions(3,3,1,0);p.setShader(shader);
  // A tiny source-space feather removes the cutout mesh's hard pixel boundary.
  const edge=r.api.Paint(),blur=r.api.ImageFilter.MakeBlur(CUTOUT.headEdgeBlur,CUTOUT.headEdgeBlur,3,null);
  edge.setImageFilter(blur);canvas.saveLayer(edge);canvas.drawVertices(vertices,13,p);canvas.restore();
  edge.dispose();blur.dispose();vertices.dispose();shader.dispose();p.dispose();
}
