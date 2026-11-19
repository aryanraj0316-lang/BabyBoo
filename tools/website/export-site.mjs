import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon','.webp':'image/webp','.woff2':'font/woff2','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8'};
const assets={};
function scan(dir, prefix='') { for(const entry of readdirSync(dir,{withFileTypes:true})) {
 const key=`${prefix}/${entry.name}`,file=path.join(dir,entry.name);
 if(entry.isDirectory()) scan(file,key);
 else if(types[path.extname(entry.name)] || key==='/babyboo-app-demo.mp4') assets[key]={type:key.endsWith('.mp4')?'video/mp4':types[path.extname(entry.name)],body:readFileSync(file).toString('base64')};
}}
scan(path.join(root,'dist'));
writeFileSync(path.join(root,'website-hosting/web-assets.json'),JSON.stringify(assets));
console.log(`Exported ${Object.keys(assets).length} website assets. APK files excluded.`);
