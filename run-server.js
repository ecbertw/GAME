'use strict';
const crypto=require('node:crypto'),Core=require('./run/core/simulation.js'),Level=require('./run/levels/astral-first-light.js');
const attempts=new Map();
async function initDb(db){if(!db)return;
 await db.query(`CREATE TABLE IF NOT EXISTS run_scores(
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  level_id VARCHAR(32) NOT NULL,level_version INTEGER NOT NULL,engine_version VARCHAR(32) NOT NULL,
  time_ms INTEGER NOT NULL,shards INTEGER NOT NULL DEFAULT 0,secrets INTEGER NOT NULL DEFAULT 0,deaths INTEGER NOT NULL DEFAULT 0,
  replay JSONB NOT NULL DEFAULT '[]'::jsonb,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(player_id,level_id,level_version)
 )`);
 await db.query('CREATE INDEX IF NOT EXISTS run_scores_level_time_idx ON run_scores(level_id,level_version,time_ms,updated_at)');
}
function start(db,p){const id=crypto.randomUUID();attempts.set(id,{playerId:p.id,created:Date.now()});return{attemptId:id,levelId:Level.id,levelVersion:Level.version,engineVersion:Core.VERSION}}
async function finish(db,p,d){
 const a=attempts.get(String(d.attemptId||''));if(!a||a.playerId!==p.id)throw Object.assign(new Error('Invalid RUN attempt.'),{status:409});attempts.delete(String(d.attemptId));
 if(Date.now()-a.created>15*60*1000)throw Object.assign(new Error('RUN attempt expired.'),{status:409});
 const replay=Array.isArray(d.replay)?d.replay.slice(0,5000):[];let last=-1;
 for(const row of replay){if(!Number.isInteger(row.t)||row.t<0||row.t>24000||row.t<last||!Number.isInteger(row.m)||row.m<0||row.m>7)throw Object.assign(new Error('Invalid RUN replay.'),{status:400});last=row.t}
 const out=Core.simulate(Level,replay);if(out.finishTick==null)throw Object.assign(new Error('RUN validation failed.'),{status:422});
 if(out.startTick==null)throw Object.assign(new Error('RUN start line was not crossed.'),{status:422});
 const timeMs=Math.round(Math.max(0,(out.finishTick-out.startTick)*Core.DT*1000));
 if(timeMs<12000||timeMs>240000)throw Object.assign(new Error('RUN time outside valid bounds.'),{status:422});
 if(db)await db.query(`INSERT INTO run_scores(player_id,level_id,level_version,engine_version,time_ms,shards,secrets,deaths,replay)
 VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
 ON CONFLICT(player_id,level_id,level_version) DO UPDATE SET
 engine_version=EXCLUDED.engine_version,time_ms=EXCLUDED.time_ms,shards=EXCLUDED.shards,secrets=EXCLUDED.secrets,deaths=EXCLUDED.deaths,replay=EXCLUDED.replay,updated_at=NOW()
 WHERE EXCLUDED.time_ms<run_scores.time_ms`,
 [p.id,Level.id,Level.version,Core.VERSION,timeMs,out.collected.size,out.secrets.size,out.deaths,JSON.stringify(replay)]);
 return{ok:true,timeMs,shards:out.collected.size,secrets:out.secrets.size,deaths:out.deaths};
}
async function rankings(db,{country='',limit=50}={}){
 if(!db)return{players:[]};const n=Math.max(1,Math.min(100,Number(limit)||50)),params=[Level.id,Level.version],filter=country?' AND p.country=$3':'';
 if(country)params.push(String(country).toUpperCase());
 const q=`SELECT p.id,p.visual_name AS "name",p.country,s.time_ms AS "timeMs",s.shards,s.secrets,s.deaths
 FROM run_scores s JOIN players p ON p.id=s.player_id WHERE s.level_id=$1 AND s.level_version=$2${filter}
 ORDER BY s.time_ms ASC,s.updated_at ASC LIMIT ${n}`;
 return{players:(await db.query(q,params)).rows};
}
async function profile(db,id){if(!db||!id)return{bestMs:null};const r=await db.query('SELECT time_ms AS "bestMs",shards,secrets,deaths FROM run_scores WHERE player_id=$1 AND level_id=$2 AND level_version=$3',[id,Level.id,Level.version]);return r.rows[0]||{bestMs:null}}
module.exports={initDb,start,finish,rankings,profile};