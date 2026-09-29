'use strict';
const crypto=require('node:crypto'),Core=require('./run/core/simulation.js'),Level=require('./run/levels/astral-first-light.js');
const attempts=new Map();
async function initDb(db){if(!db)return;
 await db.query(`CREATE TABLE IF NOT EXISTS run_astral_scores(
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  level_id VARCHAR(32) NOT NULL,level_version INTEGER NOT NULL,engine_version VARCHAR(32) NOT NULL,
  time_ms INTEGER NOT NULL,shards INTEGER NOT NULL DEFAULT 0,secrets INTEGER NOT NULL DEFAULT 0,deaths INTEGER NOT NULL DEFAULT 0,
  replay JSONB NOT NULL DEFAULT '[]'::jsonb,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(player_id,level_id,level_version)
 )`);
 await db.query('CREATE INDEX IF NOT EXISTS run_astral_scores_level_time_idx ON run_astral_scores(level_id,level_version,time_ms,updated_at)');
 await db.query(`CREATE TABLE IF NOT EXISTS run_astral_scores_100(
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  level_id VARCHAR(32) NOT NULL,level_version INTEGER NOT NULL,engine_version VARCHAR(32) NOT NULL,
  time_ms INTEGER NOT NULL,shards INTEGER NOT NULL,secrets INTEGER NOT NULL,deaths INTEGER NOT NULL DEFAULT 0,
  replay JSONB NOT NULL DEFAULT '[]'::jsonb,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(player_id,level_id,level_version)
 )`);
 await db.query('CREATE INDEX IF NOT EXISTS run_astral_scores_100_level_time_idx ON run_astral_scores_100(level_id,level_version,time_ms,updated_at)');
 await db.query(`CREATE TABLE IF NOT EXISTS run_astral_daily_scores(
  challenge_date DATE NOT NULL,player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  level_id VARCHAR(32) NOT NULL,level_version INTEGER NOT NULL,engine_version VARCHAR(32) NOT NULL,
  time_ms INTEGER NOT NULL,shards INTEGER NOT NULL DEFAULT 0,secrets INTEGER NOT NULL DEFAULT 0,deaths INTEGER NOT NULL DEFAULT 0,
  replay JSONB NOT NULL DEFAULT '[]'::jsonb,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(challenge_date,player_id)
 )`);
 await db.query('CREATE INDEX IF NOT EXISTS run_astral_daily_scores_date_time_idx ON run_astral_daily_scores(challenge_date,time_ms,updated_at)');
}
const utcDate=()=>new Date().toISOString().slice(0,10);
function previousUtcDate(key){const d=new Date(key+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10)}
async function streakFor(db,playerId,today){
 if(!db)return 0;const r=await db.query('SELECT challenge_date FROM run_astral_daily_scores WHERE player_id=$1 AND challenge_date<=$2::date ORDER BY challenge_date DESC LIMIT 366',[playerId,today]);
 const days=new Set(r.rows.map(x=>{const v=x.challenge_date;return v instanceof Date?v.toISOString().slice(0,10):String(v).slice(0,10)}));let streak=0,key=today;
 while(days.has(key)){streak++;key=previousUtcDate(key)}return streak;
}
function start(db,p,d={}){
 const now=Date.now();if(attempts.size>5000)for(const [k,v] of attempts)if(now-v.created>15*60*1000)attempts.delete(k);
 const id=crypto.randomUUID(),dailyDate=d.daily?utcDate():null;attempts.set(id,{playerId:p.id,created:now,dailyDate});
 return{attemptId:id,levelId:Level.id,levelVersion:Level.version,engineVersion:Core.VERSION,daily:!!dailyDate,dailyDate};
}
async function finish(db,p,d){
 const attemptId=String(d.attemptId||'');const a=attempts.get(attemptId);if(!a||a.playerId!==p.id)throw Object.assign(new Error('Invalid RUN attempt.'),{status:409});attempts.delete(attemptId);
 if(Date.now()-a.created>15*60*1000)throw Object.assign(new Error('RUN attempt expired.'),{status:409});
 const replay=Array.isArray(d.replay)?d.replay.slice(0,5000):[];let last=-1;
 for(const row of replay){if(!Number.isInteger(row.t)||row.t<0||row.t>24000||row.t<last||!Number.isInteger(row.m)||row.m<0||row.m>7)throw Object.assign(new Error('Invalid RUN replay.'),{status:400});last=row.t}
 const out=Core.simulate(Level,replay);if(out.finishTick==null)throw Object.assign(new Error('RUN validation failed.'),{status:422});
 if(out.startTick==null)throw Object.assign(new Error('RUN start line was not crossed.'),{status:422});
 const timeMs=Math.round(Math.max(0,(out.finishTick-out.startTick)*Core.DT*1000));
 if(timeMs<12000||timeMs>240000)throw Object.assign(new Error('RUN time outside valid bounds.'),{status:422});
 let previousBest=null;if(db){const prev=await db.query('SELECT time_ms FROM run_astral_scores WHERE player_id=$1 AND level_id=$2 AND level_version=$3',[p.id,Level.id,Level.version]);previousBest=prev.rows[0]?.time_ms??null;}
 const isPb=previousBest==null||timeMs<Number(previousBest),is100=out.collected.size===Level.shardTotal&&out.secrets.size>=Level.secrets.length;
 if(db)await db.query(`INSERT INTO run_astral_scores(player_id,level_id,level_version,engine_version,time_ms,shards,secrets,deaths,replay)
 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
 ON CONFLICT(player_id,level_id,level_version) DO UPDATE SET
 engine_version=EXCLUDED.engine_version,time_ms=EXCLUDED.time_ms,shards=EXCLUDED.shards,secrets=EXCLUDED.secrets,deaths=EXCLUDED.deaths,replay=EXCLUDED.replay,updated_at=NOW()
 WHERE EXCLUDED.time_ms<run_astral_scores.time_ms`,
 [p.id,Level.id,Level.version,Core.VERSION,timeMs,out.collected.size,out.secrets.size,out.deaths,JSON.stringify(replay)]);
 if(db&&is100)await db.query(`INSERT INTO run_astral_scores_100(player_id,level_id,level_version,engine_version,time_ms,shards,secrets,deaths,replay)
 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
 ON CONFLICT(player_id,level_id,level_version) DO UPDATE SET engine_version=EXCLUDED.engine_version,time_ms=EXCLUDED.time_ms,shards=EXCLUDED.shards,secrets=EXCLUDED.secrets,deaths=EXCLUDED.deaths,replay=EXCLUDED.replay,updated_at=NOW()
 WHERE EXCLUDED.time_ms<run_astral_scores_100.time_ms`,[p.id,Level.id,Level.version,Core.VERSION,timeMs,out.collected.size,out.secrets.size,out.deaths,JSON.stringify(replay)]);
 let daily=false,streak=0;
 if(db&&a.dailyDate){
  daily=true;
  await db.query(`INSERT INTO run_astral_daily_scores(challenge_date,player_id,level_id,level_version,engine_version,time_ms,shards,secrets,deaths,replay)
  VALUES($1::date,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
  ON CONFLICT(challenge_date,player_id) DO UPDATE SET level_id=EXCLUDED.level_id,level_version=EXCLUDED.level_version,engine_version=EXCLUDED.engine_version,time_ms=EXCLUDED.time_ms,shards=EXCLUDED.shards,secrets=EXCLUDED.secrets,deaths=EXCLUDED.deaths,replay=EXCLUDED.replay,updated_at=NOW()
  WHERE EXCLUDED.time_ms<run_astral_daily_scores.time_ms`,[a.dailyDate,p.id,Level.id,Level.version,Core.VERSION,timeMs,out.collected.size,out.secrets.size,out.deaths,JSON.stringify(replay)]);
  streak=await streakFor(db,p.id,a.dailyDate);
 }
 return{ok:true,runId:attemptId,timeMs,shards:out.collected.size,secrets:out.secrets.size,deaths:out.deaths,isPb,is100,allShards:out.collected.size===Level.shardTotal,noDeath:out.deaths===0,daily,dailyDate:a.dailyDate||null,streak};
}
async function rankings(db,{country='',limit=50,category='best'}={}){
 if(!db)return{players:[]};const n=Math.max(1,Math.min(100,Number(limit)||50)),params=[Level.id,Level.version],filter=country?' AND p.country=$3':'';
 if(country)params.push(String(country).toUpperCase());
 const table=category==='100'?'run_astral_scores_100':'run_astral_scores';
 const q=`SELECT p.id,p.visual_name AS "name",p.country,s.time_ms AS "timeMs",s.shards,s.secrets,s.deaths
 FROM ${table} s JOIN players p ON p.id=s.player_id WHERE s.level_id=$1 AND s.level_version=$2${filter}
 ORDER BY s.time_ms ASC,s.updated_at ASC LIMIT ${n}`;
 return{players:(await db.query(q,params)).rows,category:category==='100'?'100':'best'};
}
async function profile(db,id){if(!db||!id)return{bestMs:null};const r=await db.query('SELECT time_ms AS "bestMs",shards,secrets,deaths FROM run_astral_scores WHERE player_id=$1 AND level_id=$2 AND level_version=$3',[id,Level.id,Level.version]);return r.rows[0]||{bestMs:null}}
async function daily(db,{id='',country='',limit=50}={}){
 const date=utcDate();if(!db)return{date,levelId:Level.id,levelVersion:Level.version,players:[],bestMs:null,streak:0};
 const n=Math.max(1,Math.min(100,Number(limit)||50)),params=[date],filter=country?' AND p.country=$2':'';
 if(country)params.push(String(country).toUpperCase());
 const rows=await db.query(`SELECT p.id,p.visual_name AS "name",p.country,d.time_ms AS "timeMs",d.shards,d.secrets,d.deaths
 FROM run_astral_daily_scores d JOIN players p ON p.id=d.player_id WHERE d.challenge_date=$1::date${filter}
 ORDER BY d.time_ms ASC,d.updated_at ASC LIMIT ${n}`,params);
 let bestMs=null,streak=0;if(id){const mine=await db.query('SELECT time_ms AS "bestMs" FROM run_astral_daily_scores WHERE challenge_date=$1::date AND player_id=$2',[date,id]);bestMs=mine.rows[0]?.bestMs??null;streak=await streakFor(db,id,date)}
 return{date,levelId:Level.id,levelVersion:Level.version,players:rows.rows,bestMs,streak};
}
async function echo(db,{type='world',id=''}={}){
 if(!db)return{replay:[],timeMs:null};
 if(type==='pb'&&id){
  const r=await db.query('SELECT time_ms AS "timeMs",replay FROM run_astral_scores WHERE player_id=$1 AND level_id=$2 AND level_version=$3',[id,Level.id,Level.version]);
  return r.rows[0]||{replay:[],timeMs:null};
 }
 const r=await db.query('SELECT time_ms AS "timeMs",replay FROM run_astral_scores WHERE level_id=$1 AND level_version=$2 ORDER BY time_ms ASC,updated_at ASC LIMIT 1',[Level.id,Level.version]);
 return r.rows[0]||{replay:[],timeMs:null};
}
module.exports={initDb,start,finish,rankings,profile,daily,echo};