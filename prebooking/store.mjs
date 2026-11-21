import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const columns='email,created_at,consented_at,status,source,medium,campaign,content,referral_code,bonus_shutdowns';
const schema=`CREATE TABLE IF NOT EXISTS reservations(email TEXT PRIMARY KEY,created_at TEXT NOT NULL,consented_at TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'active',source TEXT NOT NULL DEFAULT '',medium TEXT NOT NULL DEFAULT '',campaign TEXT NOT NULL DEFAULT '',content TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS creator_codes(code TEXT PRIMARY KEY,handle TEXT NOT NULL,bonus INTEGER NOT NULL,active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS creator_invites(token_hash TEXT PRIMARY KEY,handle TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS creator_reviews(token_hash TEXT PRIMARY KEY,handle TEXT NOT NULL,rating INTEGER NOT NULL,body TEXT NOT NULL,disclosure TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',created_at TEXT NOT NULL);
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
   const migration=await pool.connect();try{await migration.query('BEGIN');await migration.query('SELECT pg_advisory_xact_lock(187036243)');await migration.query(schema);await migration.query("ALTER TABLE reservations ADD COLUMN IF NOT EXISTS referral_code TEXT NOT NULL DEFAULT ''; ALTER TABLE reservations ADD COLUMN IF NOT EXISTS bonus_shutdowns INTEGER NOT NULL DEFAULT 0");await migration.query('COMMIT');}catch(error){await migration.query('ROLLBACK');throw error;}finally{migration.release();}ready=true;
  })();
  // No connection URL or credential is written to logs, even on initialization failure.
  initialized.catch(()=>{console.error('Pre-booking database unavailable. Check DATABASE_URL and database access settings.');});
  async function query(sql,values){await initialized;const result=await pool.query(sql,values);ready=true;return result;}
  return {
   sql:async(sql,values=[])=> (await query(sql,values)).rows,
   driver:'postgres',get configured(){return true;},get ready(){return ready;},
   async health(){await query('SELECT 1');return true;},
   async reserve(email,now,fields,referral=''){
    await initialized;const client=await pool.connect();
    try{await client.query('BEGIN');let bonus=0;if(referral){const coupon=(await client.query('SELECT bonus FROM creator_codes WHERE code=$1 AND active=1 FOR SHARE',[referral])).rows[0];if(!coupon)throw new Error('Invalid referral');bonus=coupon.bonus;}await client.query("INSERT INTO counters(key,value) VALUES('valid_requests',1) ON CONFLICT(key) DO UPDATE SET value=counters.value+1");
     await client.query(`INSERT INTO reservations(${columns}) VALUES($1,$2,$3,'active',$4,$5,$6,$7,$8,$9) ON CONFLICT(email) DO UPDATE SET status='active',consented_at=EXCLUDED.consented_at`,[email,now,now,...fields,referral,bonus]);await client.query('COMMIT');
    }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
   },
   async leave(email){await query("UPDATE reservations SET status='unsubscribed' WHERE email=$1",[email]);},
   async rows(){return (await query(`SELECT ${columns} FROM reservations ORDER BY created_at DESC`)).rows;},
   async requests(){return Number((await query("SELECT value FROM counters WHERE key='valid_requests'")).rows[0]?.value||0);},
   async close(){await initialized.catch(()=>{});await pool?.end();},
  };
 }
 if(production&&!allowDisk)return {
  sql:async()=>{throw new Error('Database not connected');},driver:'unconfigured',configured:false,ready:false,
  health:async()=>false,
  reserve:async()=>{throw new Error('Database not connected');},leave:async()=>{throw new Error('Database not connected');},rows:async()=>{throw new Error('Database not connected');},requests:async()=>{throw new Error('Database not connected');},close:async()=>{},
 };
 mkdirSync(dataDir,{recursive:true});const db=new DatabaseSync(path.join(dataDir,'reservations.sqlite'));db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;'+schema);
 for(const [name,type] of [['referral_code',"TEXT NOT NULL DEFAULT ''"],['bonus_shutdowns','INTEGER NOT NULL DEFAULT 0']])if(!db.prepare('PRAGMA table_info(reservations)').all().some(c=>c.name===name))db.exec('ALTER TABLE reservations ADD COLUMN '+name+' '+type);
 return {
  sql:async(sql,values=[])=>{const statement=db.prepare(sql.replace(/\$[0-9]+/g,'?'));return statement.columns().length?statement.all(...values): (statement.run(...values),[]);},
  driver:'sqlite',configured:true,ready:true,db,
  health:async()=>Boolean(db.prepare('SELECT 1 AS ok').get().ok),
  async reserve(email,now,fields,referral=''){db.exec('BEGIN');try{let bonus=0;if(referral){const coupon=db.prepare('SELECT bonus FROM creator_codes WHERE code=? AND active=1').get(referral);if(!coupon)throw new Error('Invalid referral');bonus=coupon.bonus;}
   db.prepare("INSERT INTO counters(key,value) VALUES('valid_requests',1) ON CONFLICT(key) DO UPDATE SET value=value+1").run();
   db.prepare(`INSERT INTO reservations(${columns}) VALUES(?,?,?,'active',?,?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET status='active',consented_at=excluded.consented_at`).run(email,now,now,...fields,referral,bonus);db.exec('COMMIT');
  }catch(error){db.exec('ROLLBACK');throw error;}},
  async leave(email){db.prepare("UPDATE reservations SET status='unsubscribed' WHERE email=?").run(email);},
  rows:async()=>db.prepare(`SELECT ${columns} FROM reservations ORDER BY created_at DESC`).all(),
  requests:async()=>db.prepare("SELECT value FROM counters WHERE key='valid_requests'").get()?.value||0,
  close:async()=>db.close(),
 };
}
