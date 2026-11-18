import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';

// Frontend assets are a sanitized export of the EXISTING Vite site. No APKs,
// credentials, app sources, profile data or native build outputs are included.
const assets = JSON.parse(readFileSync(new URL('./web-assets.json', import.meta.url), 'utf8'));
if (!assets['/index.html']) throw new Error('Missing existing website export');
for (const key of Object.keys(assets)) if (/\.(apk|aab|env)$/i.test(key)) throw new Error('Unsafe bundled file');
mkdirSync('dist/server', {recursive:true});
mkdirSync('dist/.openai', {recursive:true});
let worker = readFileSync('worker.mjs','utf8').replace("import assets from './web-assets.json' with { type: 'json' };", `const assets = ${JSON.stringify(assets)};`);
worker = worker.replace("import adminPage from './admin-page.mjs';", readFileSync('admin-page.mjs','utf8').replace('export default ', 'const adminPage = '));
writeFileSync('dist/server/index.js', worker);
writeFileSync('dist/.openai/hosting.json', readFileSync('.openai/hosting.json'));
console.log(`Built existing website + Worker API; ${Object.keys(assets).length} assets; APK excluded.`);
