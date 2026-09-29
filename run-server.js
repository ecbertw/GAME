'use strict';
const crypto=require('node:crypto');
const Physics=require('./run/engine/physics-core.js');
const progression=require('./progression-server.js');
const levelPromise=import('./run/levels/astral/astral-01.mjs').then(m=>m.ASTRAL01);
const ENGINE_VERSION=Physics.VERSION;
const utcDay=()=>new Date().toISOString().slice(0,10);
async function initDb(db){
 await db.query(`CREATE TABLE IF NOT EXISTS run_attempts(
  id UUID PRIMARY KEY,player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  level_id VARCHAR(40) NOT NULL,level_version INTEGER NOT NULL,engine_version VARCHAR(40) NOT NULL,
  daily_date DATE,started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),used_at TIMESTAMPTZ)`);
 await db.query(`CREATE INDEX IF NOT EXISTS run_attempts_player_started_idx ON run_attempts(player_id,started_at DESC)`);
 await db.query(`CREATE TABLE IF NOT EXISTS run_best_times(
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,level_id VARCHAR(40) NOT NULL,
  level_version INTEGER NOT NULL,category VARCHAR(12) NOT NULL CHECK(category IN ('best','100')),
  best_ms INTEGER NOT NULL,replay JSONB NOT NULL,shards INTEGER NOT NULL DEFAULT 0,secrets INTEGER NOT NULL DEFAULT 0,
  deaths INTEGER NOT NULL DEFAULT 0,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(player_id,level_id,level_version,category))`);
 await db.query(`CREATE INDEX IF NOT EXISTS run_best_rank_idx ON run_best_times(level_id,level_version,category,best_ms,updated_at)`);
 await db.query(`CREATE TABLE IF NOT EXISTS run_daily_scores(
  daily_date DATE NOT NULL,player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  level_id VARCHAR(40) NOT NULL,level_version INTEGER NOT NULL,best_ms INTEGER NOT NULL,replay JSONB NOT NULL,
  shards INTEGER NOT NULL DEFAULT 0,secrets INTEGER NOT NULL DEFAULT 0,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(daily_date,player_id))`);
 await db.query(`CREATE INDEX IF NOT EXISTS run_daily_rank_idx ON run_daily_scores(daily_date,best_ms,updated_at)`);
 await db.query(`CREATE TABLE IF NOT EXISTS run_level_progress(
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,level_id VARCHAR(40) NOT NULL,level_version INTEGER NOT NULL,
  cleared BOOLEAN NOT NULL DEFAULT FALSE,all_shards BOOLEAN NOT NULL DEFAULT FALSE,all_secrets BOOLEAN NOT NULL DEFAULT FALSE,
  shard_ids JSONB NOT NULL DEFAULT '[]'::jsonb,secret_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  best_ms INTEGER,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(player_id,level_id,level_version))`);
 await db.query(`CREATE TABLE IF NOT EXISTS run_daily_progress(
  player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,last_daily DATE,streak INTEGER NOT NULL DEFAULT 0,best_streak INTEGER NOT NULL DEFAULT 0)`);
}
async function levelById(id){const l=await levelPromise;if(id!==l.id)throw Object.assign(new Error('RUN level not found.'),{status:404});return l}
function publicEcho(row){return row?{timeMs:Number(row.best_ms),replay:row.replay,player:{name:row.name||'',country:row.country||''}}:null}
async function echoes(db,p,level){
 const [pb,wr]=await Promise.all([
  db.query(`SELECT best_ms,replay FROM run_best_times WHERE player_id=$1 AND level_id=$2 AND level_version=$3 AND category='best'`,[p.id,level.id,level.version]),
  db.query(`SELECT r.best_ms,r.replay,p.name,p.country FROM run_best_times r JOIN players p ON p.id=r.player_id WHERE r.level_id=$1 AND r.level_version=$2 AND r.category='best' ORDER BY r.best_ms,r.updated_at LIMIT 1`,[level.id,level.version])
 ]);
 return{pb:publicEcho(pb.rows[0]),world:publicEcho(wr.rows[0])};
}
async function start(db,p,data={}){
 const level=await levelById(data.levelId||'astral-01'),daily=!!data.daily,attemptId=crypto.randomUUID(),day=daily?utcDay():null;
 await db.query(`INSERT INTO run_attempts(id,player_id,level_id,level_version,engine_version,daily_date) VALUES($1,$2,$3,$4,$5,$6)`,
  [attemptId,p.id,level.id,level.version,ENGINE_VERSION,day]);
 const e=await echoes(db,p,level);
 return{ok:true,attemptId,levelId:level.id,levelVersion:level.version,engineVersion:ENGINE_VERSION,dailyId:day,echoes:e};
}
function validateReplay(level,replay){
 const rows=Physics.canonicalReplay(replay);
 if(!rows.length||rows[0].tick!==0)throw Object.assign(new Error('Invalid RUN replay.'),{status:400});
 if(rows.length>5000||rows.at(-1).tick>120*180)throw Object.assign(new Error('RUN replay outside limits.'),{status:400});
 const p=Physics.createPlayer(level.spawn);let idx=0,mask=0,prev=0,startTick=null,finishTick=null;
 const max=120*180;
 for(let tick=0;tick<max&&!p.finished;tick++){
  while(idx<rows.length&&rows[idx].tick===tick){mask=rows[idx].mask;idx++}
  Physics.step(p,level,mask,prev);prev=mask;
  if(startTick==null&&p.x+p.w*.5>=level.startLine.x)startTick=tick;
  if(p.finished){finishTick=tick;break}
 }
 if(startTick==null||finishTick==null||finishTick<=startTick)throw Object.assign(new Error('RUN did not produce a valid finish.'),{status:422});
 const timeMs=Math.round((finishTick-startTick)*(1000/120));
 if(timeMs<3500||timeMs>180000)throw Object.assign(new Error('Impossible RUN completion time.'),{status:422});
 return{replay:rows,p,timeMs,startTick,finishTick,complete100:p.shards.size===(level.shards||[]).length&&p.secrets.size===(level.secrets||[]).length};
}
async function updateDailyStreak(db,playerId,day){
 const row=(await db.query('SELECT last_daily,streak,best_streak FROM run_daily_progress WHERE player_id=$1',[playerId])).rows[0];
 let streak=1,best=1;
 if(row?.last_daily){
  const prev=new Date(row.last_daily),cur=new Date(day),diff=Math.round((cur-prev)/86400000);
  streak=diff===0?Number(row.streak):diff===1?Number(row.streak)+1:1;best=Math.max(Number(row.best_streak||0),streak);
 }
 await db.query(`INSERT INTO run_daily_progress(player_id,last_daily,streak,best_streak) VALUES($1,$2,$3,$4)
 ON CONFLICT(player_id) DO UPDATE SET last_daily=EXCLUDED.last_daily,streak=EXCLUDED.streak,best_streak=GREATEST(run_daily_progress.best_streak,EXCLUDED.best_streak)`,[playerId,day,streak,best]);
 return{streak,bestStreak:best};
}
async function finish(db,p,data={}){
 const attemptId=String(data.attemptId||'');
 const a=(await db.query(`UPDATE run_attempts SET used_at=NOW() WHERE id=$1 AND player_id=$2 AND used_at IS NULL RETURNING *`,[attemptId,p.id])).rows[0];
 if(!a){const exists=await db.query('SELECT 1 FROM run_attempts WHERE id=$1 AND player_id=$2',[attemptId,p.id]);throw Object.assign(new Error(exists.rowCount?'RUN attempt already submitted.':'RUN attempt not found.'),{status:exists.rowCount?409:404})}
 if(a.engine_version!==ENGINE_VERSION)throw Object.assign(new Error('RUN engine version mismatch.'),{status:409});
 const level=await levelById(a.level_id);
 if(Number(a.level_version)!==level.version)throw Object.assign(new Error('RUN level version mismatch.'),{status:409});
 const v=validateReplay(level,data.replay);
 const old=(await db.query(`SELECT best_ms FROM run_best_times WHERE player_id=$1 AND level_id=$2 AND level_version=$3 AND category='best'`,[p.id,level.id,level.version])).rows[0];
 const isPb=!old||v.timeMs<Number(old.best_ms),firstClear=!old;
 await db.query(`INSERT INTO run_best_times(player_id,level_id,level_version,category,best_ms,replay,shards,secrets,deaths)
 VALUES($1,$2,$3,'best',$4,$5::jsonb,$6,$7,$8)
 ON CONFLICT(player_id,level_id,level_version,category) DO UPDATE SET best_ms=EXCLUDED.best_ms,replay=EXCLUDED.replay,shards=EXCLUDED.shards,secrets=EXCLUDED.secrets,deaths=EXCLUDED.deaths,updated_at=NOW()
 WHERE EXCLUDED.best_ms<run_best_times.best_ms`,[p.id,level.id,level.version,v.timeMs,JSON.stringify(v.replay),v.p.shards.size,v.p.secrets.size,v.p.deaths]);
 if(v.complete100)await db.query(`INSERT INTO run_best_times(player_id,level_id,level_version,category,best_ms,replay,shards,secrets,deaths)
 VALUES($1,$2,$3,'100',$4,$5::jsonb,$6,$7,$8)
 ON CONFLICT(player_id,level_id,level_version,category) DO UPDATE SET best_ms=EXCLUDED.best_ms,replay=EXCLUDED.replay,shards=EXCLUDED.shards,secrets=EXCLUDED.secrets,deaths=EXCLUDED.deaths,updated_at=NOW()
 WHERE EXCLUDED.best_ms<run_best_times.best_ms`,[p.id,level.id,level.version,v.timeMs,JSON.stringify(v.replay),v.p.shards.size,v.p.secrets.size,v.p.deaths]);
 await db.query(`INSERT INTO run_level_progress(player_id,level_id,level_version,cleared,all_shards,all_secrets,shard_ids,secret_ids,best_ms)
 VALUES($1,$2,$3,TRUE,$4,$5,$6::jsonb,$7::jsonb,$8)
 ON CONFLICT(player_id,level_id,level_version) DO UPDATE SET cleared=TRUE,all_shards=run_level_progress.all_shards OR EXCLUDED.all_shards,all_secrets=run_level_progress.all_secrets OR EXCLUDED.all_secrets,
 shard_ids=EXCLUDED.shard_ids,secret_ids=EXCLUDED.secret_ids,best_ms=LEAST(COALESCE(run_level_progress.best_ms,EXCLUDED.best_ms),EXCLUDED.best_ms),updated_at=NOW()`,
 [p.id,level.id,level.version,v.p.shards.size===level.shards.length,v.p.secrets.size===level.secrets.length,JSON.stringify([...v.p.shards]),JSON.stringify([...v.p.secrets]),v.timeMs]);
 let daily=null;
 if(a.daily_date){
  await db.query(`INSERT INTO run_daily_scores(daily_date,player_id,level_id,level_version,best_ms,replay,shards,secrets) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7,$8)
  ON CONFLICT(daily_date,player_id) DO UPDATE SET best_ms=EXCLUDED.best_ms,replay=EXCLUDED.replay,shards=EXCLUDED.shards,secrets=EXCLUDED.secrets,updated_at=NOW()
  WHERE EXCLUDED.best_ms<run_daily_scores.best_ms`,[a.daily_date,p.id,level.id,level.version,v.timeMs,JSON.stringify(v.replay),v.p.shards.size,v.p.secrets.size]);
  daily=await updateDailyStreak(db,p.id,a.daily_date);
 }
 const badges=[];if(firstClear)badges.push('run-first-clear','run-astral-01');if(v.complete100)badges.push('run-astral-100');if(v.p.deaths===0)badges.push('run-no-death');if(a.daily_date)badges.push('run-daily');
 const xp=20+(firstClear?25:0)+(isPb&&!firstClear?10:0)+(v.complete100?25:0)+(a.daily_date?15:0)+(v.p.deaths===0?10:0);
 const progress=await progression.awardFixed(db,p.id,'run',attemptId,xp,badges);
 const e=await echoes(db,p,level);
 return{ok:true,timeMs:v.timeMs,newPb:isPb,previousPb:old?Number(old.best_ms):null,shards:v.p.shards.size,totalShards:level.shards.length,secrets:v.p.secrets.size,totalSecrets:level.secrets.length,deaths:v.p.deaths,complete100:v.complete100,daily,progress,echoes:e};
}
async function rankings(db,{levelId='astral-01',category='best',country='',page=1,daily=false}={}){
 const level=await levelById(levelId),limit=100,offset=(Math.max(1,Number(page)||1)-1)*limit;
 if(daily){
  const vals=[utcDay()],where=country?' AND p.country=$2':'';
  if(country)vals.push(String(country).toUpperCase());
  vals.push(limit,offset);const li=country?3:2,oi=country?4:3;
  const r=await db.query(`SELECT p.id,p.name,p.country,d.best_ms AS "timeMs",d.shards,d.secrets FROM run_daily_scores d JOIN players p ON p.id=d.player_id WHERE d.daily_date=$1${where} ORDER BY d.best_ms,d.updated_at LIMIT $${li} OFFSET $${oi}`,vals);
  return{ok:true,dailyId:utcDay(),players:r.rows};
 }
 if(!['best','100'].includes(category))throw Object.assign(new Error('Invalid RUN ranking category.'),{status:400});
 const vals=[level.id,level.version,category],where=country?' AND p.country=$4':'';
 if(country)vals.push(String(country).toUpperCase());
 vals.push(limit,offset);const li=country?5:4,oi=country?6:5;
 const r=await db.query(`SELECT p.id,p.name,p.country,b.best_ms AS "timeMs",b.shards,b.secrets,b.deaths FROM run_best_times b JOIN players p ON p.id=b.player_id WHERE b.level_id=$1 AND b.level_version=$2 AND b.category=$3${where} ORDER BY b.best_ms,b.updated_at LIMIT $${li} OFFSET $${oi}`,vals);
 return{ok:true,levelId:level.id,levelVersion:level.version,category,players:r.rows};
}
async function daily(){const l=await levelPromise;return{ok:true,dailyId:utcDay(),levelId:l.id,levelVersion:l.version,rules:{sameLevel:true,reset:'00:00 UTC'}}}
module.exports={ENGINE_VERSION,initDb,start,finish,rankings,daily,validateReplay};
