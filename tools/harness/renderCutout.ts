import * as fs from 'fs';
import * as path from 'path';
import { drawCutout, surfaceHead } from '../../src/onboarding/screen1/buddy/cutout/drawCutout';
import { MASTER_POSE, NEUTRAL, DIAGNOSTICS } from '../../src/onboarding/screen1/buddy/cutout/model';
import { motionPose } from '../../src/onboarding/screen1/buddy/cutout/motion';

export async function main(arg?:string) {
  const animated=arg==='motion'||arg==='checks'||arg==='movie';
  const root=process.cwd(),out=path.join(root,animated?'design/buddy/animation_review':'design/buddy/assembly_review');
  fs.mkdirSync(out,{recursive:true});
  (globalThis as any).CanvasKit=await require(path.join(root,'node_modules/canvaskit-wasm/bin/full/canvaskit.js'))();
  const {getSkiaExports,makeOffscreenSurface}=require(path.join(root,'node_modules/@shopify/react-native-skia/lib/commonjs/headless'));
  const {Skia}=getSkiaExports();const images:Record<string,any>={};
  for(const dir of ['design/buddy/parts_review/cutouts','design/buddy/assembly_review/face']) for(const file of fs.readdirSync(path.join(root,dir))) {
    if(!file.endsWith('.png'))continue;
    const image=Skia.Image.MakeImageFromEncoded(Skia.Data.fromBytes(new Uint8Array(fs.readFileSync(path.join(root,dir,file)))));
    if(!image)throw new Error('Failed to decode '+file);images[file.slice(0,-4)]=image;
  }
  const movie=arg==='movie',size=movie?512:1254;
  const surface=makeOffscreenSurface(size,size),canvas=surface.getCanvas();
  canvas.scale(size/1254,size/1254);
  if(movie) {
    const dir=path.join(out,'movie');fs.mkdirSync(dir,{recursive:true});
    for(let frame=0;frame<600;frame++) {
      canvas.clear(Skia.Color('#F6F3FF'));drawCutout(canvas,{api:Skia,images},motionPose(frame/30));surface.flush();
      fs.writeFileSync(path.join(dir,`frame_${String(frame+1).padStart(4,'0')}.png`),Buffer.from(surface.makeImageSnapshot().encodeToBytes()));
    }
    console.log('Rendered 600 exact-clock frames at 30 fps for local motion inspection.');return;
  }
  const times=[0,1.57,3.6,6.4,7.2,9.1,10.1,12.4,12.8,13.2,13.6,16.7,17.21,19.07];
  const jobs=[{name:'assembled_master',pose:MASTER_POSE},{name:'assembled_neutral',pose:NEUTRAL},...DIAGNOSTICS.map((d,i)=>({name:`head_${i}`,pose:d.pose,head:true})),...(animated?times.map((t,i)=>({name:`motion_${i.toString().padStart(2,'0')}`,pose:motionPose(t)})):[]),...(animated?[{name:'surface_extreme_left',pose:{...NEUTRAL,turn:-1},surface:true},{name:'surface_extreme_right',pose:{...NEUTRAL,turn:1},surface:true}]:[])];
  if(animated)fs.writeFileSync(path.join(out,'keyframes.json'),JSON.stringify(times.map((t,i)=>({name:`motion_${i.toString().padStart(2,'0')}`,seconds:t,pose:motionPose(t)})),null,2));
  for(const job of jobs) {
    if(arg==='checks'&&!['assembled_master','assembled_neutral','head_0','head_4','surface_extreme_left','surface_extreme_right'].includes(job.name))continue;
    canvas.clear(Skia.Color('transparent'));
    if('surface' in job)surfaceHead(canvas,{api:Skia,images},job.pose);else drawCutout(canvas,{api:Skia,images},job.pose,'head' in job);
    surface.flush();fs.writeFileSync(path.join(out,job.name+'.png'),Buffer.from(surface.makeImageSnapshot().encodeToBytes()));
  }
  canvas.clear(Skia.Color('transparent'));surfaceHead(canvas,{api:Skia,images},NEUTRAL);surface.flush();fs.writeFileSync(path.join(out,'head_aspect.png'),Buffer.from(surface.makeImageSnapshot().encodeToBytes()));
  console.log('Rendered assembly, neutral and 10 surface-projection diagnostic frames with Skia.');
}
