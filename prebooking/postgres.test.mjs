import test from 'node:test';
import assert from 'node:assert/strict';
import { createPrebookingServer } from './server.mjs';
const url=process.env.TEST_DATABASE_URL;
async function start(databaseUrl=url){const app=createPrebookingServer({production:true,databaseUrl,adminPassword:'postgres-test-owner-password'});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));return {...app,base:`http://127.0.0.1:${app.server.address().port}`};}
const post=(base,body,route='/api/prebook')=>fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
const auth={Authorization:'Basic '+Buffer.from('admin:postgres-test-owner-password').toString('base64')};
test('free production page works with no database but never confirms reservations',async()=>{const app=await start('');try{assert.equal((await fetch(app.base+'/prebook')).status,200);assert.equal((await fetch(app.base+'/healthz')).status,200);assert.deepEqual(await (await fetch(app.base+'/api/config')).json(),{registrationsAvailable:false});assert.equal((await post(app.base,{email:'test@example.com',consent:true})).status,503);assert.equal(app.store.driver,'unconfigured');}finally{await app.close();}});
test('unavailable database fails closed without exposing connection data',async()=>{const app=await start('postgresql://privateuser:privatepass@127.0.0.1:1/notconnected?sslmode=disable');try{const response=await post(app.base,{email:'test@example.com',consent:true});assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/privatepass|privateuser|postgresql/);}finally{await app.close();}});
test('real PostgreSQL persists, deduplicates, reports and unsubscribes across app restarts',{skip:!url},async()=>{
 let app=await start();const email='postgres-'+crypto.randomUUID()+'@example.test';
 try{
  assert.equal((await fetch(app.base+'/api/config')).status,200);
  assert.equal(app.store.driver,'postgres');
  for(let i=0;i<2;i++)assert.equal((await post(app.base,{email:i?email.toUpperCase():email,consent:true,utm_source:'instagram',utm_campaign:i?'second':'first'})).status,200);
  const rows=await app.store.rows(),mine=rows.filter(r=>r.email===email);assert.equal(mine.length,1);assert.equal(mine[0].campaign,'first');assert.equal(await app.store.requests()>=2,true);
  await app.close();app=await start();assert.equal((await app.store.rows()).find(r=>r.email===email).status,'active');
  const report=await fetch(app.base+'/admin/export.csv',{headers:auth});assert.equal(report.status,200);assert.match(await report.text(),new RegExp(email));
  await post(app.base,{email},'/api/leave');assert.equal((await app.store.rows()).find(r=>r.email===email).status,'unsubscribed');
  await post(app.base,{email,consent:true});assert.equal((await app.store.rows()).find(r=>r.email===email).status,'active');
 }finally{await app.close();}
});
test('concurrent PostgreSQL signups keep a single reservation',{skip:!url},async()=>{const app=await start(),email='parallel-'+crypto.randomUUID()+'@example.test';try{const responses=await Promise.all(Array.from({length:8},()=>post(app.base,{email,consent:true})));assert.equal(responses.every(r=>r.status===200),true);assert.equal((await app.store.rows()).filter(r=>r.email===email).length,1);}finally{await app.close();}});


test('weak production admin password locks admin without crashing public page',async()=>{
 const app=createPrebookingServer({production:true,databaseUrl:'',adminPassword:'short'});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+app.server.address().port;
 try{assert.equal((await fetch(base+'/')).status,200);assert.equal((await fetch(base+'/admin',{headers:{Authorization:'Basic '+Buffer.from('admin:short').toString('base64')}})).status,401);}finally{await app.close();}
});
