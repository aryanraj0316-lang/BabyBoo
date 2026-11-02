/**
 * Dev-only render harness for the rigged Buddy (Skia over CanvasKit in Node), using the
 * app's own rig, timeline and drawing code.
 *
 *   node tools/harness/run.cjs rig '<json>'
 *
 * JSON: { width, height, x, y, headWidth, rotate?, background?,
 *         jobs: [{ out, preset? , params?, script?: 'lab', time? }] }
 * plus { bench: n } to time rigAt() n times (ms per call).
 */
import * as fs from 'fs';
import * as path from 'path';
import { makeBuddyResources } from '../../src/onboarding/screen1/buddy/drawBuddy';
import { drawBuddyPosed } from '../../src/onboarding/screen1/buddy/drawPosed';
import { REST, poseBuddy, type RigParams } from '../../src/onboarding/screen1/buddy/rig';
import { LAB_SCRIPT, compileScript, presetParams, rigAt, type PresetName } from '../../src/onboarding/screen1/buddy/rigTimeline';

const ROOT = process.cwd();

interface Job { out: string; preset?: PresetName; params?: Partial<RigParams>; script?: 'lab'; time?: number }

export async function main(argJson: string) {
  const a = JSON.parse(argJson) as {
    width: number; height: number; x: number; y: number; headWidth: number; rotate?: number; background?: string;
    jobs?: Job[]; bench?: number;
  };
  const lab = compileScript(LAB_SCRIPT);
  if (a.bench) {
    const t0 = process.hrtime.bigint();
    for (let i = 0; i < a.bench; i++) rigAt(lab, 10 + (i % 300) * 0.1);
    const ms = Number(process.hrtime.bigint() - t0) / 1e6 / a.bench;
    console.log(JSON.stringify({ rigAtMs: ms }));
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  (globalThis as any).CanvasKit = await require(path.join(ROOT, 'node_modules/canvaskit-wasm/bin/full/canvaskit.js'))();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getSkiaExports, makeOffscreenSurface } = require(path.join(ROOT, 'node_modules/@shopify/react-native-skia/lib/commonjs/headless'));
  const { Skia } = getSkiaExports();
  const bytes = fs.readFileSync(path.join(ROOT, 'assets/onboarding/screen1/buddy/fur.png'));
  const grain = Skia.Image.MakeImageFromEncoded(Skia.Data.fromBytes(new Uint8Array(bytes)));
  const res = makeBuddyResources(Skia, grain);
  const surface = makeOffscreenSurface(a.width, a.height);
  for (const job of a.jobs ?? []) {
    let params: RigParams = { ...REST };
    if (job.preset) params = presetParams(job.preset);
    if (job.script === 'lab') params = rigAt(lab, job.time ?? 0);
    if (job.params) params = { ...params, ...job.params };
    const canvas = surface.getCanvas();
    canvas.clear(Skia.Color(a.background ?? 'transparent'));
    canvas.save();
    if (a.rotate) canvas.rotate((a.rotate * 180) / Math.PI, a.x, a.y);
    drawBuddyPosed(canvas, res, { x: a.x, y: a.y, headWidth: a.headWidth }, poseBuddy(params));
    canvas.restore();
    surface.flush();
    fs.writeFileSync(job.out, Buffer.from(surface.makeImageSnapshot().encodeToBytes()));
  }
}
