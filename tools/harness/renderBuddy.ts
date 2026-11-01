/**
 * Dev-only render harness: draws Buddy headless (Skia over CanvasKit in Node)
 * with the app's own drawBuddy() and writes a transparent PNG.
 *
 *   node tools/harness/run.cjs buddy '{"out":"x.png","width":496,"height":540,"x":245,"y":199,"headWidth":345}'
 */
import * as fs from 'fs';
import * as path from 'path';
import { drawBuddy, makeBuddyResources } from '../../src/onboarding/screen1/buddy/drawBuddy';

// The runner (run.cjs) changes to the repo root before calling main().
const ROOT = process.cwd();

export async function main(argJson: string) {
  const args = JSON.parse(argJson) as { out: string; width: number; height: number; x: number; y: number; headWidth: number; view?: 'front' | 'threeQuarter' };
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  (globalThis as any).CanvasKit = await require(path.join(ROOT, 'node_modules/canvaskit-wasm/bin/full/canvaskit.js'))();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getSkiaExports, makeOffscreenSurface } = require(path.join(ROOT, 'node_modules/@shopify/react-native-skia/lib/commonjs/headless'));
  const { Skia } = getSkiaExports();
  const bytes = fs.readFileSync(path.join(ROOT, 'assets/onboarding/screen1/buddy/fur.png'));
  const grain = Skia.Image.MakeImageFromEncoded(Skia.Data.fromBytes(new Uint8Array(bytes)));
  const res = makeBuddyResources(Skia, grain);
  const surface = makeOffscreenSurface(args.width, args.height);
  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color('transparent'));
  drawBuddy(canvas, res, { x: args.x, y: args.y, headWidth: args.headWidth }, args.view ?? 'front');
  surface.flush();
  fs.writeFileSync(args.out, Buffer.from(surface.makeImageSnapshot().encodeToBytes()));
}
