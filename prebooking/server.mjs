import http from 'node:http';
import { createReadStream, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { createStore } from './store.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const emailValue=value=>typeof value==='string'?value.trim().toLowerCase():'';
const validEmail=email=>email.length<=254&&/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email)&&!/[\r\n\x00-\x1f]/.test(email);
const csv=value=>'"'+String(value??'').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';

export function createPrebookingServer({dataDir=process.env.DATA_DIR||path.join(root,'prebooking/.data'),adminPassword=process.env.ADMIN_PASSWORD||'',production=process.env.NODE_ENV==='production'||process.env.RENDER==='true',databaseUrl=process.env.DATABASE_URL||'',allowDisk=process.env.STORAGE_DRIVER==='sqlite'}={}){
 if(production&&adminPassword&&adminPassword.length<16){adminPassword='';console.error('Admin is locked: configure ADMIN_PASSWORD with at least 16 characters.');}
 const store=createStore({databaseUrl,dataDir,production,allowDisk});const db=store.db;
 const rate=new Map(),salt=randomBytes(32);
 function limited(req){const address=production?(String(req.headers['x-forwarded-for']||req.socket.remoteAddress).split(',').at(-1).trim()):req.socket.remoteAddress;const key=createHash('sha256').update(salt).update(address||'').digest('hex');const now=Date.now();for(const [k,v]of rate)if(v.until<now)rate.delete(k);const v=rate.get(key)||{until:now+60000,hits:0};v.hits++;rate.set(key,v);return v.hits>15;}
 function admin(req){if(!adminPassword)return false;const encoded=(req.headers.authorization||'').replace(/^Basic /,'');let value='';try{value=Buffer.from(encoded,'base64').toString();}catch{}const actual=createHash('sha256').update(value).digest(),expected=createHash('sha256').update('admin:'+adminPassword).digest();return timingSafeEqual(actual,expected);}
 const files={
  '/': ['prebooking/public/index.html','text/html; charset=utf-8'], '/prebook':['prebooking/public/index.html','text/html; charset=utf-8'],
  '/privacy':['prebooking/public/privacy.html','text/html; charset=utf-8'], '/leave':['prebooking/public/leave.html','text/html; charset=utf-8'],
  '/style.css':['prebooking/public/style.css','text/css; charset=utf-8'],'/app.js':['prebooking/public/app.js','text/javascript; charset=utf-8'],'/leave.js':['prebooking/public/leave.js','text/javascript; charset=utf-8'],
  '/assets/buddy.webp':['public/buddy-seated-wave.webp','image/webp'],'/assets/buddy.webm':['public/buddy-idle-loop.webm','video/webm'],
  '/assets/nunito.ttf':['public/fonts/nunito-variable.ttf','font/ttf'],'/assets/favicon.svg':['public/favicon.svg','image/svg+xml'],
  '/assets/share.jpg':['prebooking/public/share.jpg','image/jpeg'],
 };
 const server=http.createServer(async(req,res)=>{
  const nonce=randomBytes(16).toString('base64');
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('Cache-Control','no-store');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy',`default-src 'self'; script-src 'self'; style-src 'self' 'nonce-${nonce}'; img-src 'self' data:; media-src 'self'; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`);
  if(production)res.setHeader('Strict-Transport-Security','max-age=31536000');
  const send=(status,body,type='application/json; charset=utf-8')=>{res.writeHead(status,{'Content-Type':type});res.end(req.method==='HEAD'?undefined:type.startsWith('application/json')?JSON.stringify(body):body);};
  try{
   const url=new URL(req.url,'http://localhost'),route=url.pathname;
   if(route==='/healthz')return send(200,{ok:true,registrationsConfigured:store.configured});
   if(route==='/api/config'){
    let available=false;try{available=await store.health();}catch{}
    return send(200,{registrationsAvailable:available});
   }
   if(route==='/api/prebook'||route==='/api/leave'){
    if(req.method!=='POST')return send(405,{error:'Use POST.'});
    const origin=req.headers.origin;if(origin){let host;try{host=new URL(origin).host;}catch{return send(403,{error:'Invalid origin.'});}if(host!==req.headers.host)return send(403,{error:'Invalid origin.'});}
    if(!String(req.headers['content-type']).startsWith('application/json'))return send(415,{error:'Expected JSON.'});
    if(limited(req)){res.setHeader('Retry-After','60');return send(429,{error:'Too many requests. Please try again in a minute.'});}
    let bytes=0,body='';for await(const chunk of req){bytes+=chunk.length;if(bytes>4096)return send(413,{error:'Request too large.'});body+=chunk;}
    let value;try{value=JSON.parse(body);}catch{return send(400,{error:'Invalid request.'});}
    if(!value||typeof value!=='object'||Array.isArray(value))return send(400,{error:'Invalid request.'});
    const email=emailValue(value.email);
    if(route==='/api/leave'){if(!validEmail(email))return send(400,{error:'Enter a valid email address.'});await store.leave(email);return send(200,{ok:true});}
    if(value.website)return send(200,{ok:true});
    if(!validEmail(email))return send(400,{error:'Enter a valid email address.'});
    if(value.consent!==true)return send(400,{error:'Please agree to receive launch updates.'});
    const fields=['utm_source','utm_medium','utm_campaign','utm_content'].map(k=>typeof value[k]==='string'?value[k].replace(/[\x00-\x1f]/g,'').slice(0,160):'');
    const now=new Date().toISOString();await store.reserve(email,now,fields);
    return send(200,{ok:true});
   }
   if(route==='/admin'||route==='/admin/export.csv'){
    if(!['GET','HEAD'].includes(req.method))return send(405,{error:'Method not allowed.'});
    if(!admin(req)){res.setHeader('WWW-Authenticate','Basic realm="BabyBoo launch list", charset="UTF-8"');return send(401,'Owner sign-in required.','text/plain; charset=utf-8');}
    const rows=await store.rows();
    if(route.endsWith('.csv')){res.setHeader('Content-Disposition','attachment; filename="babyboo-reservations.csv"');return send(200,[['email','created_at','consented_at','status','source','medium','campaign','content'],...rows.map(r=>Object.values(r))].map(row=>row.map(csv).join(',')).join('\r\n'),'text/csv; charset=utf-8');}
    const active=rows.filter(r=>r.status==='active').length,requests=await store.requests();
    return send(200,`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>BabyBoo reservations</title><link rel="stylesheet" href="/style.css"><style nonce="${nonce}">main{max-width:1100px;margin:40px auto;padding:24px}.metrics{display:flex;gap:30px;flex-wrap:wrap}.metrics strong{font-size:36px;display:block}.table{overflow:auto}table{border-collapse:collapse;width:100%;font-size:13px}td,th{padding:14px;text-align:left;border-bottom:1px solid #ffffff22;white-space:nowrap}h1{font-size:38px;margin:24px 0}p{color:#b7afc5}a{color:#cfb0f2}</style><main><a href="/">← BabyBoo</a><h1>Your first little community.</h1><div class="metrics"><p><strong>${active}</strong>Active reservations</p><p><strong>${rows.length-active}</strong>Unsubscribed</p><p><strong>${requests}</strong>Valid signup requests, including repeats</p></div><p>One reservation per email address. Addresses are not verified. These are signups, not payments, downloads or installs. Refresh for current data.</p><p><a href="/admin/export.csv">Export CSV</a></p><div class="table"><table><thead><tr><th>Email</th><th>Reserved (UTC)</th><th>Status</th><th>Source</th><th>Campaign</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escape(r.email)}</td><td>${escape(r.created_at)}</td><td>${escape(r.status)}</td><td>${escape(r.source)}</td><td>${escape(r.campaign)}</td></tr>`).join('')}</tbody></table></div></main></html>`,'text/html; charset=utf-8');
   }
   if(!['GET','HEAD'].includes(req.method))return send(405,{error:'Method not allowed.'});
   const asset=files[route];if(!asset||!existsSync(path.join(root,asset[0])))return send(404,'Not found.','text/plain; charset=utf-8');
   const filename=path.join(root,asset[0]),stat=statSync(filename);let start=0,end=stat.size-1,status=200;
   if(route.startsWith('/assets/'))res.setHeader('Cache-Control','public, max-age=86400');
   if(asset[1].startsWith('video/')){res.setHeader('Accept-Ranges','bytes');if(req.headers.range){const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!match||(!match[1]&&!match[2])){res.setHeader('Content-Range',`bytes */${stat.size}`);return send(416,{error:'Invalid range.'});}if(!match[1]){start=Math.max(0,stat.size-Number(match[2]));}else{start=Number(match[1]);end=match[2]?Math.min(end,Number(match[2])):end;}if(start>end||start>=stat.size){res.setHeader('Content-Range',`bytes */${stat.size}`);return send(416,{error:'Invalid range.'});}status=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${stat.size}`);}}
   res.writeHead(status,{'Content-Type':asset[1],'Content-Length':end-start+1});if(req.method==='HEAD')return res.end();createReadStream(filename,{start,end}).on('error',()=>res.destroy()).pipe(res);
  }catch{if(!res.headersSent)send(503,{error:'We couldn’t save your request. Please try again.'});else res.destroy();}
 });
 return {server,db,store,close:()=>new Promise((resolve,reject)=>server.close(()=>{store.close().then(resolve,reject);}))};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const app=createPrebookingServer();const port=Number(process.env.PORT||4180);
 app.server.listen(port,process.env.HOST||(process.env.NODE_ENV==='production'||process.env.RENDER==='true'?'0.0.0.0':'127.0.0.1'),()=>console.log(`BabyBoo pre-booking: http://localhost:${port}/prebook`));
 process.on('SIGTERM',async()=>{await app.close();process.exit(0);});
}
