import {randomBytes,createHash} from 'node:crypto';
export const normalizeCode=v=>typeof v==='string'?v.trim().toUpperCase():'';
const hash=v=>createHash('sha256').update(v).digest('hex');
const handle=v=>typeof v==='string'?v.trim().replace(/^@/,''):'';
const validHandle=v=>/^[a-zA-Z0-9._]{1,30}$/.test(v);
export async function creatorRoute({route,req,send,store,admin,limited}){
 if(!['/api/referral','/api/reviews','/api/creator-review','/api/admin/codes','/api/admin/invites','/api/admin/reviews'].includes(route))return false;
 const owner=route.startsWith('/api/admin/');
 if(owner&&!admin(req)){send(401,{error:'Owner sign-in required.'});return true;}
 if(req.method==='GET'){
  if(route==='/api/reviews')send(200,{reviews:await store.sql("SELECT handle,rating,body,disclosure FROM creator_reviews WHERE status='approved' ORDER BY created_at DESC LIMIT 24")});
  else if(route==='/api/admin/codes')send(200,{codes:await store.sql('SELECT c.*, (SELECT COUNT(*) FROM reservations r WHERE r.referral_code=c.code) AS reservations FROM creator_codes c ORDER BY code')});
  else if(route==='/api/admin/reviews')send(200,{reviews:await store.sql('SELECT * FROM creator_reviews ORDER BY created_at DESC')});
  else send(405,{error:'Use POST.'});
  return true;
 }
 if(req.method!=='POST'){send(405,{error:'Use POST.'});return true;}
 const origin=req.headers.origin;
 if(origin&&new URL(origin).host!==req.headers.host){send(403,{error:'Invalid origin.'});return true;}
 if(!String(req.headers['content-type']).startsWith('application/json')){send(415,{error:'Expected JSON.'});return true;}
 if(limited(req)){send(429,{error:'Too many requests. Try again in a minute.'});return true;}
 let size=0,body='';for await(const chunk of req){size+=chunk.length;if(size>4096){send(413,{error:'Request too large.'});return true;}body+=chunk;}
 let v;try{v=JSON.parse(body);}catch{send(400,{error:'Invalid request.'});return true;}
 if(!v||typeof v!=='object'||Array.isArray(v)){send(400,{error:'Invalid request.'});return true;}
 const bad=message=>send(400,{error:message});
 if(route==='/api/referral'){
  const code=normalizeCode(v.code);if(!/^[A-Z0-9_-]{3,24}$/.test(code)){bad('Enter a valid referral code.');return true;}
  const coupon=(await store.sql('SELECT code,bonus FROM creator_codes WHERE code=$1 AND active=1',[code]))[0];
  if(!coupon)bad('This referral code is invalid or inactive.');else send(200,{code:coupon.code,bonusShutdowns:coupon.bonus});
 }else if(route==='/api/admin/codes'){
  const code=normalizeCode(v.code),creator=handle(v.handle),bonus=Number(v.bonus);
  if(!/^[A-Z0-9_-]{3,24}$/.test(code)||!validHandle(creator)||!Number.isInteger(bonus)||bonus<1||bonus>100){bad('Use a 3–24 character code, Instagram handle, and bonus between 1 and 100.');return true;}
  await store.sql('INSERT INTO creator_codes(code,handle,bonus,active) VALUES($1,$2,$3,$4) ON CONFLICT(code) DO UPDATE SET handle=excluded.handle,bonus=excluded.bonus,active=excluded.active',[code,creator,bonus,v.active===true?1:0]);send(200,{ok:true});
 }else if(route==='/api/admin/invites'){
  const creator=handle(v.handle);if(!validHandle(creator)){bad('Enter a valid Instagram handle.');return true;}
  const token=randomBytes(32).toString('hex');await store.sql('INSERT INTO creator_invites(token_hash,handle,created_at) VALUES($1,$2,$3)',[hash(token),creator,new Date().toISOString()]);
  send(200,{path:'/early-access#invite='+token});
 }else if(route==='/api/creator-review'){
  if(v.website){send(200,{ok:true});return true;}
  const token=typeof v.token==='string'?v.token:'',creator=handle(v.handle),rating=Number(v.rating),text=typeof v.body==='string'?v.body.trim():'';
  if(!/^[a-f0-9]{64}$/.test(token)||!validHandle(creator)||!Number.isInteger(rating)||rating<1||rating>5||text.length<20||text.length>1500||v.consent!==true){bad('Check your invitation, handle, rating, review (20–1500 characters), and publishing consent.');return true;}
  const invite=(await store.sql('SELECT handle FROM creator_invites WHERE token_hash=$1',[hash(token)]))[0];
  if(!invite||invite.handle.toLowerCase()!==creator.toLowerCase()){bad('This invitation does not match your handle.');return true;}
  const existing=await store.sql('SELECT token_hash FROM creator_reviews WHERE token_hash=$1',[hash(token)]);
  if(existing.length){bad('A review has already been submitted for this invitation.');return true;}
  await store.sql("INSERT INTO creator_reviews(token_hash,handle,rating,body,disclosure,status,created_at) VALUES($1,$2,$3,$4,$5,'pending',$6) ON CONFLICT(token_hash) DO NOTHING",[hash(token),invite.handle,rating,text,v.partner===true?'Free trial APK provided. Creator may earn referral benefits.':'Free trial APK provided.',new Date().toISOString()]);
  send(200,{ok:true});
 }else if(route==='/api/admin/reviews'){
  if(!['approved','hidden'].includes(v.status)||!/^[a-f0-9]{64}$/.test(v.id||'')){bad('Invalid review action.');return true;}
  await store.sql('UPDATE creator_reviews SET status=$1 WHERE token_hash=$2',[v.status,v.id]);send(200,{ok:true});
 }
 return true;
}
