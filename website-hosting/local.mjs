import http from 'node:http';
import { Readable } from 'node:stream';
import { mkdirSync, readFileSync, existsSync, writeFileSync, unlinkSync } from 'node:fs';
import worker from './worker.mjs';
import {database,bucket} from './local-runtime.mjs';
mkdirSync('.local',{recursive:true});
const files=bucket();
// Local development data never enters the deployment archive.
const env={DB:database('.local/reporting.sqlite'),BUCKET:files,COOKIE_SECRET:crypto.randomUUID(),ADMIN_EMAIL:'owner@local.test'};
const server=http.createServer(async(req,res)=>{
 const headers=new Headers(req.headers);headers.delete('oai-authenticated-user-id');headers.delete('oai-authenticated-user-email');
 // Loopback-only development impersonation; never included in Worker output.
 if(req.url.startsWith('/admin')||req.url.startsWith('/api/admin/')) {headers.set('oai-authenticated-user-id','local-owner');headers.set('oai-authenticated-user-email',env.ADMIN_EMAIL);}
 const request=new Request('http://127.0.0.1:4178'+req.url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Readable.toWeb(req),duplex:'half'}:{})});
 const response=await worker.fetch(request,env,{waitUntil:p=>p.catch(console.error)});
 res.writeHead(response.status,Object.fromEntries(response.headers));
 if(response.body)Readable.fromWeb(response.body).pipe(res);else res.end();
});
server.listen(4178,'127.0.0.1',()=>console.log('BabyBoo local QA: http://127.0.0.1:4178 · owner preview /admin (loopback only)'));
