/**
 * Builds a harness entry with esbuild (TypeScript, the app's own drawing code)
 * and runs it in Node. Dev-only; never part of the app bundle.
 *
 *   node tools/harness/run.cjs <entry> '<json args>'     entry: buddy
 */
const path = require('path');
const esbuild = require('esbuild');

const ROOT = path.resolve(__dirname, '../..');
const ENTRIES = { buddy: 'tools/harness/renderBuddy.ts', rig: 'tools/harness/renderRig.ts', cutout: 'tools/harness/renderCutout.ts' };

(async () => {
  const [entry, args] = process.argv.slice(2);
  const outfile = path.join(ROOT, 'node_modules/.cache/harness', `${entry}.cjs`);
  await esbuild.build({
    entryPoints: [path.join(ROOT, ENTRIES[entry])],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    // Type-only imports of Skia are erased; the runtime Skia comes from the headless build.
    external: ['@shopify/react-native-skia', 'canvaskit-wasm'],
    logLevel: 'error',
  });
  process.chdir(ROOT);
  await require(outfile).main(args);
})().catch((e) => {
  console.error(e.stack || e);
  process.exit(1);
});
