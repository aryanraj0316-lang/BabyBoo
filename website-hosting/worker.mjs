import assets from './web-assets.json' with { type: 'json' };
import adminPage from './admin-page.mjs';

const MAX_APK = 90 * 1024 * 1024;
const decodedAssets = new Map();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const json = (data, status=200, extra={}) => new Response(JSON.stringify(data), {status, headers:{'Content-Type':'application/json','Cache-Control':'no-store',...extra}});
const query = (env, sql, ...args) => env.DB.prepare(sql).bind(...args);
const owner = (req, env) => Boolean(env.ADMIN_EMAIL && req.headers.get('oai-authenticated-user-id') && req.headers.get('oai-authenticated-user-email')?.toLowerCase() === env.ADMIN_EMAIL.toLowerCase());
const sameOrigin = req => req.headers.get('origin') === new URL(req.url).origin;
const bot = req => /bot|crawler|spider|preview|facebookexternalhit|headless/i.test(req.headers.get('user-agent')||'') || req.headers.get('purpose')==='prefetch' || req.headers.get('sec-purpose')?.includes('prefetch');

function adminSignIn(signedIn) {
 return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BabyBoo · Owner sign-in</title><style>@font-face{font-family:'BabyBoo Nunito';src:url('/fonts/nunito-variable.ttf') format('truetype');font-weight:400 900;font-display:swap}*{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;padding:24px;background:radial-gradient(ellipse at 100% 100%,#38244855,transparent 65%),#0e0c17;color:#f8f7fa;font:17px/1.6 'BabyBoo Nunito',system-ui}main{width:100%;max-width:510px;border:1px solid #53415f;border-radius:28px;background:#1b152580;padding:42px}h1{font-size:32px;line-height:1.2;letter-spacing:-.8px}p{color:#c0b8cc}.brand{font-size:25px;font-weight:800;color:white;text-decoration:none}.button{display:block;text-align:center;border-radius:999px;padding:14px 20px;background:#f6f2f8;color:#14101a;font-weight:750;text-decoration:none;margin:28px 0 16px}.back{color:#c7a5ed;text-decoration:none;font-size:14px}.note{font-size:13px;color:#aaa0b7}</style></head><body><main><a class="brand" href="/">BabyBoo</a><h1>${signedIn?'This account cannot open the dashboard.':'Your download dashboard.'}</h1><p>${signedIn?'The website is public, but its reporting and APK controls are restricted to the site owner. Sign out, then use the ChatGPT account that owns this site.':'Sign in with the ChatGPT account that owns this site to view download activity and manage the APK release.'}</p><a class="button" target="_top" href="${signedIn?'/signout-with-chatgpt?return_to=%2Fadmin':'/signin-with-chatgpt?return_to=%2Fadmin'}">${signedIn?'Sign out and switch account':'Sign in with ChatGPT'}</a><p class="note">No APK is required to access reporting. Signing in does not publish a release or change the public website.</p><a class="back" href="/">Back to BabyBoo</a></main></body></html>`,{status:signedIn?403:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});
}

async function mac(value, secret) {
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value)));
 return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function equal(a,b) { if(a.length!==b.length)return false; let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0; }
async function session(req,env) {
 if(!env.COOKIE_SECRET) throw new Error('Session signing is not configured');
 const cookie=(req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('bb_session='))?.slice(11);
 let id;
 if(cookie) {const parts=cookie.split('.');if(UUID.test(parts[0])&&parts.length===2&&equal(parts[1],await mac(parts[0],env.COOKIE_SECRET)))id=parts[0];}
 if(id) {
  const previous=await query(env,'SELECT first_seen FROM sessions WHERE id=?',id).first();
  if(!previous||Date.now()-Date.parse(previous.first_seen.replace(' ','T')+'Z')>=1800000)id=undefined;
 }
 const fresh=!id;id||=crypto.randomUUID();
 const url=new URL(req.url), clean=k=>(url.searchParams.get(k)||'').replace(/[\x00-\x1f]/g,'').slice(0,100);
 await query(env,'INSERT INTO sessions(id,source,medium,campaign) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET last_seen=CURRENT_TIMESTAMP',id,clean('utm_source'),clean('utm_medium'),clean('utm_campaign')).run();
 return {id,cookie:fresh?`bb_session=${id}.${await mac(id,env.COOKIE_SECRET)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=1800`:null};
}

export function parseRange(header,size) {
 if(!header)return {start:0,end:size-1,partial:false};
 const m=/^bytes=(\d*)-(\d*)$/.exec(header);if(!m||(!m[1]&&!m[2]))return null;
 let start=m[1]?Number(m[1]):Math.max(0,size-Number(m[2]));
 let end=m[1]?(m[2]?Math.min(Number(m[2]),size-1):size-1):size-1;
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)return null;
 return {start,end,partial:true};
}
export function coveredBytes(ranges) {
 let total=0,left=0,right=-1;
 for(const r of ranges.sort((a,b)=>a.range_start-b.range_start)) {
  if(r.range_start>right+1) {total+=Math.max(0,right-left+1);left=r.range_start;right=r.range_end;}
  else right=Math.max(right,r.range_end);
 }
 return total+Math.max(0,right-left+1);
}

async function download(req,env,ctx) {
 const release=await query(env,'SELECT * FROM releases WHERE active=1').first();
 if(!release)return json({error:'The APK is not available yet. Please check back soon.'},404);
 const range=parseRange(req.headers.get('range'),release.size);
 if(!range)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${release.size}`,'Cache-Control':'no-store'}});
 const headers={'Content-Type':'application/vnd.android.package-archive','Content-Disposition':'attachment; filename="BabyBoo.apk"','Accept-Ranges':'bytes','Content-Length':String(range.end-range.start+1),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-APK-SHA256':release.sha256};
 if(range.partial)headers['Content-Range']=`bytes ${range.start}-${range.end}/${release.size}`;
 if(req.method==='HEAD')return new Response(null,{status:range.partial?206:200,headers});
 if(bot(req))return json({error:'Open the download page in a browser.'},400);
 const url=new URL(req.url);let id=url.searchParams.get('id');
 if(!id) {url.searchParams.set('id',crypto.randomUUID());return new Response(null,{status:302,headers:{Location:url.pathname+url.search,'Cache-Control':'no-store'}});}
 if(!UUID.test(id))return json({error:'Invalid download identifier'},400);
 let sess,tracking=true;
 try {
  sess=await session(req,env);
  await query(env,'INSERT OR IGNORE INTO downloads(id,session_id,release_id) VALUES(?,?,?)',id,sess.id,release.id).run();
  const attempt=await query(env,'SELECT session_id,release_id FROM downloads WHERE id=?',id).first();
  if(attempt.session_id!==sess.id||attempt.release_id!==release.id)return json({error:'This link has expired. Start a new download from the website.'},409);
 } catch(e) {tracking=false;console.error('download_tracking_unavailable');headers['X-Download-Tracking']='unavailable';}
 if(sess?.cookie)headers['Set-Cookie']=sess.cookie;
 let object;
 try {object=await env.BUCKET.get(release.object_key,{range:{offset:range.start,length:range.end-range.start+1}});}catch(e){object=null;}
 if(!object) {if(tracking)await query(env,"UPDATE downloads SET status='failed' WHERE id=? AND status!='served'",id).run().catch(()=>{});return json({error:'The file is temporarily unavailable. Please retry.'},503);}
 const transfer=crypto.randomUUID();
 if(tracking)try{await query(env,"INSERT INTO transfers(id,download_id,range_start,range_end,status) VALUES(?,?,?,?,'streaming')",transfer,id,range.start,range.end).run();}catch(e){tracking=false;headers['X-Download-Tracking']='unavailable';}
 let bytes=0,done=false;
 const finish=async status=>{
  if(done)return;done=true;if(!tracking)return;
  try {
   await query(env,'UPDATE transfers SET bytes=?,status=?,finished_at=CURRENT_TIMESTAMP WHERE id=?',bytes,status,transfer).run();
   const rows=await query(env,"SELECT range_start,range_end FROM transfers WHERE download_id=? AND status='finished'",id).all();
   const covered=coveredBytes(rows.results);
   const next=covered>=release.size?'served':status==='finished'?'partial':status;
   await query(env,"UPDATE downloads SET status=? WHERE id=? AND status!='served'",next,id).run();
  }catch(e){console.error('download_transfer_finalization_failed');}
 };
 const reader=object.body.getReader();
 const body=new ReadableStream({async pull(controller){try {
  const chunk=await reader.read();
  if(chunk.done){controller.close();ctx.waitUntil(finish(bytes===range.end-range.start+1?'finished':'failed'));}
  else {bytes+=chunk.value.byteLength;controller.enqueue(chunk.value);}
 }catch(e){controller.error(e);ctx.waitUntil(finish('failed'));}},async cancel(reason){await reader.cancel(reason);ctx.waitUntil(finish('interrupted'));}});
 return new Response(body,{status:range.partial?206:200,headers});
}

async function stats(env) {
 const counts=await query(env,`SELECT (SELECT count(*) FROM sessions) AS sessions,
 (SELECT count(*) FROM sessions s WHERE NOT EXISTS(SELECT 1 FROM downloads d WHERE d.session_id=s.id)) AS no_attempt,
 (SELECT count(DISTINCT session_id) FROM downloads) AS attempted_sessions,
 (SELECT count(*) FROM downloads) AS attempts,
 (SELECT count(*) FROM downloads WHERE status='served') AS served,
 (SELECT count(*) FROM downloads WHERE status IN ('failed','interrupted')) AS interrupted,
 (SELECT count(*) FROM downloads WHERE status IN ('started','partial')) AS unconfirmed`).first();
 const campaigns=await query(env,`SELECT s.source,s.medium,s.campaign,count(DISTINCT s.id) AS sessions,
 count(DISTINCT d.id) AS attempts,count(DISTINCT CASE WHEN d.status='served' THEN d.id END) AS served
 FROM sessions s LEFT JOIN downloads d ON d.session_id=s.id GROUP BY s.source,s.medium,s.campaign ORDER BY sessions DESC LIMIT 100`).all();
 const recent=await query(env,`SELECT d.id,d.created_at,d.status,r.version,s.source,s.campaign FROM downloads d
 JOIN sessions s ON s.id=d.session_id JOIN releases r ON r.id=d.release_id ORDER BY d.created_at DESC LIMIT 50`).all();
 const daily=await query(env,`SELECT date(created_at) AS day,count(*) AS attempts,
 sum(CASE WHEN status='served' THEN 1 ELSE 0 END) AS served FROM downloads WHERE created_at>=datetime('now','-30 days') GROUP BY day ORDER BY day`).all();
 return {...counts,campaigns:campaigns.results,recent:recent.results,daily:daily.results,updatedAt:new Date().toISOString()};
}

async function upload(req,env) {
 const url=new URL(req.url), version=url.searchParams.get('version')||'',size=Number(url.searchParams.get('size'));
 const hash=req.headers.get('x-apk-sha256')||'';
 if(!/^[a-zA-Z0-9][a-zA-Z0-9.\-+ ]{0,49}$/.test(version)||!Number.isSafeInteger(size)||size<4||size>MAX_APK||!/^[a-f0-9]{64}$/i.test(hash))return json({error:'Provide a version, valid SHA-256 and APK up to90MiB.'},400);
 const reader=req.body?.getReader();if(!reader)return json({error:'Missing APK'},400);
 const first=await reader.read();
 if(first.done||first.value[0]!==0x50||first.value[1]!==0x4b){await reader.cancel();return json({error:'This is not an APK/ZIP file.'},400);}
 let received=0,initial=first.value;
 const body=new ReadableStream({async pull(c){const chunk=initial?{value:initial,done:false}:await reader.read();initial=null;if(chunk.done){c.close();return;}received+=chunk.value.byteLength;if(received>MAX_APK||received>size){c.error(new Error('File too large'));await reader.cancel();return;}c.enqueue(chunk.value);},cancel:r=>reader.cancel(r)});
 const id=crypto.randomUUID(),key=`releases/${id}.apk`;
 try {
  const digest=Uint8Array.from(hash.match(/../g),x=>parseInt(x,16));
  // R2 requires a known-length stream; keep large uploads out of Worker memory.
  let value=body,pump=Promise.resolve();
  if(globalThis.FixedLengthStream) {
   const fixed=new globalThis.FixedLengthStream(size);
   pump=body.pipeTo(fixed.writable);
   pump.catch(()=>{});
   value=fixed.readable;
  }
  const obj=await env.BUCKET.put(key,value,{sha256:digest.buffer,httpMetadata:{contentType:'application/vnd.android.package-archive'},customMetadata:{version,sha256:hash.toLowerCase()}});
  await pump;
  if(!obj||obj.size!==size)throw new Error('Size mismatch');
  await env.DB.batch([
   query(env,'UPDATE releases SET active=0 WHERE active=1'),
   query(env,'INSERT INTO releases(id,object_key,version,size,sha256,active) VALUES(?,?,?,?,?,1)',id,key,version,size,hash.toLowerCase())
  ]);
  return json({available:true,version,size,sha256:hash.toLowerCase()});
 }catch(e){await env.BUCKET.delete(key).catch(()=>{});return json({error:'Upload failed. No new release was activated. Check the file and retry.'},503);}
}

async function handle(req,env,ctx) {
 const url=new URL(req.url), path=url.pathname;
 if(path==='/api/release') {
  if(req.method!=='GET'&&req.method!=='HEAD')return json({error:'Method not allowed'},405);
  const row=await query(env,'SELECT version,size,sha256 FROM releases WHERE active=1').first();return json(row?{available:true,...row}:{available:false});
 }
 if(path.startsWith('/api/admin/')||path==='/admin') {
  if(!owner(req,env)) {
   if(path==='/admin')return adminSignIn(Boolean(req.headers.get('oai-authenticated-user-id')));
   return json({error:'Owner access required'},403);
  }
  if(path==='/admin'&&req.method==='GET')return new Response(adminPage,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});
  if(path==='/api/admin/stats'&&req.method==='GET')return json(await stats(env));
  if(path==='/api/admin/releases'&&req.method==='POST') {
   if(!sameOrigin(req))return json({error:'Origin rejected'},403);
   return upload(req,env);
  }
  if(path==='/api/admin/releases'&&req.method==='DELETE') {
   if(!sameOrigin(req))return json({error:'Origin rejected'},403);
   await query(env,'UPDATE releases SET active=0 WHERE active=1').run();return json({available:false});
  }
  return json({error:'Not found'},404);
 }
 if(path==='/download'||path==='/BabyBoo-preview.apk') {
  if(!['GET','HEAD'].includes(req.method))return json({error:'Method not allowed'},405);
  return download(req,env,ctx);
 }
 if(path==='/website-privacy')return new Response('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>BabyBoo website measurement</title><body style="max-width:680px;margin:60px auto;padding:24px;font:18px/1.6 system-ui;color:#e2daed;background:#0e0c17"><h1>Website measurement</h1><p>This website uses a signed, anonymous 30-minute session cookie to count visits and APK transfer attempts. It stores session times, campaign labels from ad links, release versions and transfer outcomes. It does not store names, email addresses or raw IP addresses in its download database.</p><p>Sessions are browser sessions, not verified people. A server-finished transfer does not prove a file was saved or the app was installed. These website measurements do not add tracking to the BabyBoo app.</p><p>The site owner can access the reporting dashboard. Hosting providers may separately maintain operational/security logs.</p><p><a href="/">Back to BabyBoo</a></p></body></html>',{headers:{'Content-Type':'text/html; charset=utf-8'}});
 if(path==='/robots.txt')return new Response('User-agent: *\nDisallow: /admin\nDisallow: /api/\nDisallow: /download\n');
 if(req.method!=='GET'&&req.method!=='HEAD')return json({error:'Method not allowed'},405);
 const asset=assets[path]||(path==='/'||path==='/privacy'||path==='/app'?assets['/index.html']:null);
 if(!asset)return json({error:'Not found'},404);
 const headers={'Content-Type':asset.type,'Cache-Control':path.startsWith('/assets/')?'public, max-age=31536000, immutable':'no-store'};
 if(path==='/'&&req.method==='GET'&&!bot(req))try{const s=await session(req,env);if(s.cookie)headers['Set-Cookie']=s.cookie;}catch(e){console.error('visit_tracking_unavailable');}
 let bytes=decodedAssets.get(asset);
 if(!bytes){bytes=Uint8Array.from(atob(asset.body),x=>x.charCodeAt(0));decodedAssets.set(asset,bytes);}
 if(asset.type.startsWith('video/')) {
  const range=parseRange(req.headers.get('range'),bytes.length);
  if(!range)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${bytes.length}`}});
  headers['Accept-Ranges']='bytes';headers['Content-Length']=String(range.end-range.start+1);
  if(range.partial)headers['Content-Range']=`bytes ${range.start}-${range.end}/${bytes.length}`;
  return new Response(req.method==='HEAD'?null:bytes.slice(range.start,range.end+1),{status:range.partial?206:200,headers});
 }
 return new Response(req.method==='HEAD'?null:bytes,{headers});
}

export default {async fetch(req,env,ctx) {
 try {
  const res=await handle(req,env,ctx);
  res.headers.set('X-Content-Type-Options','nosniff');
  res.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
  res.headers.set('X-Frame-Options','SAMEORIGIN');
  res.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  return res;
 }catch(e){console.error('website_request_failed');return json({error:'Temporarily unavailable. Please retry.'},503);}
}};
