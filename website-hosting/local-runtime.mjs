import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';

export function database(filename=':memory:') {
 const sqlite=new DatabaseSync(filename);sqlite.exec('PRAGMA foreign_keys=ON');
 if(!sqlite.prepare("SELECT name FROM sqlite_master WHERE name='sessions'").get())sqlite.exec(readFileSync(new URL('./drizzle/0000_launch.sql',import.meta.url),'utf8'));
 const prepare=sql=>({bind(...args){return {first:async()=>sqlite.prepare(sql).get(...args)||null,all:async()=>({results:sqlite.prepare(sql).all(...args)}),run:async()=>sqlite.prepare(sql).run(...args),_sql:sql,_args:args};}});
 return {prepare,batch:async stmts=>{sqlite.exec('BEGIN');try{const r=stmts.map(s=>sqlite.prepare(s._sql).run(...s._args));sqlite.exec('COMMIT');return r;}catch(e){sqlite.exec('ROLLBACK');throw e;}},sqlite};
}
export function bucket(directory) {
 const objects=new Map();
 return {objects,async put(key,body,options={}) {const bytes=new Uint8Array(await new Response(body).arrayBuffer());if(options.sha256){const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));if(!hash.every((v,i)=>v===new Uint8Array(options.sha256)[i]))throw new Error('Checksum mismatch');}objects.set(key,bytes);return {size:bytes.length};},async get(key,{range}={}){const original=objects.get(key);if(!original)return null;const bytes=range?original.slice(range.offset,range.offset+range.length):original;return {body:new ReadableStream({start(c){c.enqueue(bytes);c.close();}}),size:original.length};},async delete(key){objects.delete(key);}};
}
