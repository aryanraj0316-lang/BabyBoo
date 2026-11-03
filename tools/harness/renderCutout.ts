import * as fs from 'fs';
import * as path from 'path';
import { drawCutout, surfaceHead } from '../../src/onboarding/screen1/buddy/cutout/drawCutout';
import { MASTER_POSE, NEUTRAL, DIAGNOSTICS } from '../../src/onboarding/screen1/buddy/cutout/model';

export async function main() {
  const root=process.cwd(),out=path.join(root,'design/buddy/assembly_review');
  (globalThis as any).CanvasKit=await require(path.join(root,'node_modules/canvaskit-wasm/bin/full/canvaskit.js'))();
  const {getSkiaExports,makeOffscreenSurface}=require(path.join(root,'node_modules/@shopify/react-native-skia/lib/commonjs/headless'));
  const {Skia}=getSkiaExports();const images:Record<string,any>={};
  for(const dir of ['design/buddy/parts_review/cutouts','design/buddy/assembly_review/face']) for(const file of fs.readdirSync(path.join(root,dir))) {
    if(!file.endsWith('.png'))continue;
    const image=Skia.Image.MakeImageFromEncoded(Skia.Data.fromBytes(new Uint8Array(fs.readFileSync(path.join(root,dir,file)))));
    if(!image)throw new Error('Failed to decode '+file);images[file.slice(0,-4)]=image;
  }
  const surface=makeOffscreenSurface(1254,1254),canvas=surface.getCanvas();
  for(const job of [{name:'assembled_master',pose:MASTER_POSE},{name:'assembled_neutral',pose:NEUTRAL},...DIAGNOSTICS.map((d,i)=>({name:`head_${i}`,pose:d.pose,head:true}))]) {
    canvas.clear(Skia.Color('transparent'));drawCutout(canvas,{api:Skia,images},job.pose,'head' in job);
    surface.flush();fs.writeFileSync(path.join(out,job.name+'.png'),Buffer.from(surface.makeImageSnapshot().encodeToBytes()));
  }
  canvas.clear(Skia.Color('transparent'));surfaceHead(canvas,{api:Skia,images},NEUTRAL);surface.flush();fs.writeFileSync(path.join(out,'head_aspect.png'),Buffer.from(surface.makeImageSnapshot().encodeToBytes()));
  console.log('Rendered assembly, neutral and 10 surface-projection diagnostic frames with Skia.');
}
