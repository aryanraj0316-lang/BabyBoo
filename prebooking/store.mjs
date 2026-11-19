import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const columns='email,created_at,consented_at,status,source,medium,campaign,content';
const schema=`CREATE TABLE IF NOT EXISTS reservations(email TEXT PRIMARY KEY,created_at TEXT NOT NULL,consented_at TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'active',source TEXT NOT NULL DEFAULT '',medium TEXT NOT NULL DEFAULT '',campaign TEXT NOT NULL DEFAULT '',content TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS counters(key TEXT PRIMARY KEY,value INTEGER NOT NULL DEFAULT 0);`;

export function createStore({databaseUrl,dataDir,production,allowDisk=false}){
 if(databaseUrl){
  let pool,ready=false;
  const initialized=(async()=>{
   const {Pool}=await import('pg');
   const url=new URL(databaseUrl);if(!['postgres:','postgresql:'].includes(url.protocol))throw new Error('Invalid database protocol');
   // Hosted PostgreSQL defaults to verified TLS. Test/local URLs explicitly use sslmode=disable.
   if(!url.searchParams.has('sslmode'))url.searchParams.set('sslmode','verify-full');
   pool=new Pool({connectionString:url.href,max:3,connectionTimeoutMillis:10000,idleTimeoutMillis:30000,query_timeout:10000});
   pool.on('error',()=>{ready=false;});
   await pool.query(schema);ready=true;
  })();
  // No connection URL or credential is written to logs, even on initialization failure.
  initialized.catch(()=>{console.error('Pre-booking database unavailable. Check DATABASE_URL and database access settings.');});
  async function query(sql,values){await initialized;const result=await pool.query(sql,values);ready=true;return result;}
  return {
   driver:'postgres',get configured(){return true;},get ready(){return ready;},
   async health(){await query('SELECT 1');return true;},
   async reserve(email,now,fields){
    await initialized;const client=await pool.connect();
    try{await client.query('BEGIN');await client.query("INSERT INTO counters(key,value) VALUES('valid_requests',1) ON CONFLICT(key) DO UPDATE SET value=counters.value+1");
     await client.query(`INSERT INTO reservations(${columns}) VALUES($1,$2,$3,'active',$4,$5,$6,$7) ON CONFLICT(email) DO UPDATE SET status='active',consented_at=EXCLUDED.consented_at`,[email,now,now,...fields]);await client.query('COMMIT');
    }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
   },
   async leave(email){await query("UPDATE reservations SET status='unsubscribed' WHERE email=$1",[email]);},
   async rows(){return (await query(`SELECT ${columns} FROM reservations ORDER BY created_at DESC`)).rows;},
   async requests(){return Number((await query("SELECT value FROM counters WHERE key='valid_requests'")).rows[0]?.value||0);},
   async close(){await initialized.catch(()=>{});await pool?.end();},
  };
 }
 if(production&&!allowDisk)return {
  driver:'unconfigured',configured:false,ready:false,
  health:async()=>false,
  reserve:async()=>{throw new Error('Database not connected');},leave:async()=>{throw new Error('Database not connected');},rows:async()=>{throw new Error('Database not connected');},requests:async()=>{throw new Error('Database not connected');},close:async()=>{},
 };
 mkdirSync(dataDir,{recursive:true});const db=new DatabaseSync(path.join(dataDir,'reservations.sqlite'));db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;'+schema);
 return {
  driver:'sqlite',configured:true,ready:true,db,
  health:async()=>Boolean(db.prepare('SELECT 1 AS ok').get().ok),
  async reserve(email,now,fields){db.exec('BEGIN');try{
   db.prepare("INSERT INTO counters(key,value) VALUES('valid_requests',1) ON CONFLICT(key) DO UPDATE SET value=value+1").run();
   db.prepare(`INSERT INTO reservations(${columns}) VALUES(?,?,?,'active',?,?,?,?) ON CONFLICT(email) DO UPDATE SET status='active',consented_at=excluded.consented_at`).run(email,now,now,...fields);db.exec('COMMIT');
  }catch(error){db.exec('ROLLBACK');throw error;}},
  async leave(email){db.prepare("UPDATE reservations SET status='unsubscribed' WHERE email=?").run(email);},
  rows:async()=>db.prepare(`SELECT ${columns} FROM reservations ORDER BY created_at DESC`).all(),
  requests:async()=>db.prepare("SELECT value FROM counters WHERE key='valid_requests'").get()?.value||0,
  close:async()=>db.close(),
 };
}
