import { chromium } from 'playwright';
import http from 'node:http';
import { readFileSync, existsSync, mkdirSync, writeFileSync, createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'../../..'),OUT=process.env.AD_OUTPUT_DIR||path.join(ROOT,'design/prebooking/cinematic');mkdirSync(OUT,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.png':'image/png','.ttf':'font/ttf'};
const server=http.createServer((req,res)=>{const route=decodeURIComponent(new URL(req.url,'http://local').pathname);let file=route==='/vendor/gsap.min.js'?path.join(HERE,'node_modules/gsap/dist/gsap.min.js'):path.join(HERE,route==='/'?'index.html':route);if(!file.startsWith(HERE)||!existsSync(file)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(readFileSync(file));});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url=`http://127.0.0.1:${server.address().port}`;
if(process.argv.includes('--preview')){console.log(url);process.on('SIGINT',()=>{server.close();process.exit();});await new Promise(()=>{});}
const profile=path.join(HERE,'.browser-profile');mkdirSync(profile,{recursive:true});
// Dedicated local render browser, never the user's browser profile or account.
const localBrowser='C:/Users/LENOVO/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe';
const browser=await chromium.launch({headless:true,...(process.env.AD_BROWSER?{executablePath:process.env.AD_BROWSER}:existsSync(localBrowser)?{executablePath:localBrowser}:{}),args:['--disable-dev-shm-usage','--disable-gpu','--font-render-hinting=none'],env:{...process.env,TEMP:profile,TMP:profile}});
const context=await browser.newContext({viewport:{width:1080,height:1920},deviceScaleFactor:2});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(url,{waitUntil:'networkidle'});await page.evaluate(()=>window.assetReady);
const audits=[];
async function frame(n,file){await page.evaluate(n=>window.renderFrame(n),n);if(n%15===0){const audit=await page.evaluate(()=>window.safeAudit());audits.push({frame:n,time:n/30,elements:audit});}return page.screenshot({type:file?'png':'jpeg',...(file?{}:{quality:100}),scale:'device',...(file?{path:file}:{})});}
if(process.argv.includes('--stills')){
 for(const n of (process.argv.includes('--quick')?[30,240,330,449]:[0,30,75,105,165,225,240,285,330,375,405,449])){await frame(n,path.join(OUT,`preview-${String(n).padStart(3,'0')}.png`));console.log('Preview',n);}
}else{
 const portrait=path.join(OUT,'BabyBoo_Prebooking_Cinematic_1080x1920.mp4'),feed=path.join(OUT,'BabyBoo_Prebooking_Cinematic_1080x1350.mp4');
 const settings=['-an','-c:v','libx264','-preset','fast','-b:v','24M','-minrate','24M','-maxrate','24M','-bufsize','48M','-x264-params','nal-hrd=cbr:force-cfr=1','-pix_fmt','yuv420p','-r','30','-movflags','+faststart'];
 const encoder=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-filter_complex','[0:v]scale=1080:1920:flags=lanczos,split=2[portrait][crop];[crop]crop=1080:1350:0:285[feed]','-map','[portrait]',...settings,portrait,'-map','[feed]',...settings,feed],{stdio:['pipe','ignore','pipe']});
 let encoderErrors='';encoder.stderr.on('data',b=>encoderErrors+=b);const completion=once(encoder,'close');
 for(let n=0;n<450;n++){
  const screenshot=await frame(n);
  if(n===449)await page.screenshot({type:'png',scale:'device',path:path.join(OUT,'last-frame-2160x3840.png')});
  if(!encoder.stdin.write(screenshot))await once(encoder.stdin,'drain');
  if(n%15===0)console.log(`Rendered ${n+1}/450`);
 }
 encoder.stdin.end();const [code]=await completion;if(code!==0)throw new Error(encoderErrors);
 writeFileSync(path.join(OUT,'encoder.log'),encoderErrors);
 console.log('Rendered portrait and4:5 at24Mbps from2x supersampled frames.');
}
writeFileSync(path.join(OUT,process.argv.includes('--stills')?'preview-audit.json':'safe-zone-audit.json'),JSON.stringify({safe:{top:250,bottom:340,left:60,right:60},errors,audits},null,2));
await context.close();await browser.close();await new Promise(resolve=>server.close(resolve));
if(errors.length)throw new Error(errors.join('\n'));
