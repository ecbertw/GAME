'use strict';
const crypto=require('crypto');

const memoryAttempts=new Map();
const memoryBests=new Map();

function bad(message,status=400){const e=new Error(message);e.status=status;return e}
function cleanTime(v){const n=Math.floor(Number(v));if(!Number.isFinite(n)||n<5000||n>60*60*1000)throw bad('Invalid RUN time.');return n}
function cleanDeaths(v){const n=Math.floor(Number(v)||0);if(n<0||n>9999)throw bad('Invalid death count.');return n}
function cleanSplits(raw){
  if(!Array.isArray(raw))return[];
  const out=raw.slice(0,12).map(v=>Math.floor(Number(v))).filter(v=>Number.isFinite(v)&&v>0&&v<=60*60*1000);
  for(let i=1;i<out.length;i++)if(out[i]<out[i-1])throw bad('Invalid RUN splits.');
  return out;
}

async function initDb(pool){
  await pool.query('CREATE TABLE IF NOT EXISTS run_attempts(id UUID PRIMARY KEY,player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),finished_at TIMESTAMPTZ,client_time_ms INTEGER,deaths INTEGER NOT NULL DEFAULT 0,splits JSONB NOT NULL DEFAULT \'[]\'::jsonb,created_ip_hash CHAR(64))');
  await pool.query('CREATE INDEX IF NOT EXISTS run_attempts_player_started_idx ON run_attempts(player_id,started_at DESC)');
  await pool.query('CREATE TABLE IF NOT EXISTS run_bests(player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,best_time_ms INTEGER NOT NULL,deaths INTEGER NOT NULL DEFAULT 0,splits JSONB NOT NULL DEFAULT \'[]\'::jsonb,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
  await pool.query('CREATE INDEX IF NOT EXISTS run_bests_time_idx ON run_bests(best_time_ms ASC,deaths ASC,updated_at ASC)');
}

function hashIp(ip){return crypto.createHash('sha256').update(String(ip||'')).digest('hex')}

async function start(pool,player,ip){
  if(!player||!player.id)throw bad('Login required.',401);
  const runId=crypto.randomUUID();
  if(pool){
    await pool.query('INSERT INTO run_attempts(id,player_id,created_ip_hash) VALUES($1,$2,$3)',[runId,player.id,hashIp(ip)]);
  }else{
    memoryAttempts.set(runId,{id:runId,playerId:player.id,startedAt:Date.now(),finished:false});
  }
  return{runId,startedAt:Date.now()};
}

async function finish(pool,player,data){
  if(!player||!player.id)throw bad('Login required.',401);
  const runId=String(data&&data.runId||'');
  if(!runId)throw bad('RUN attempt required.');
  const clientTime=cleanTime(data.timeMs);
  const deaths=cleanDeaths(data.deaths);
  const splits=cleanSplits(data.splits);
  if(splits.length!==12)throw bad('RUN must contain 12 level splits.');

  if(pool){
    const client=await pool.connect();
    try{
      await client.query('BEGIN');
      const q=await client.query('SELECT id,player_id,started_at,finished_at FROM run_attempts WHERE id=$1 FOR UPDATE',[runId]);
      if(!q.rowCount||q.rows[0].player_id!==player.id)throw bad('Invalid RUN attempt.',409);
      if(q.rows[0].finished_at)throw bad('RUN attempt already finished.',409);
      const serverElapsed=Math.max(1,Date.now()-new Date(q.rows[0].started_at).getTime());
      if(serverElapsed>65*60*1000)throw bad('RUN attempt expired.',409);
      const authoritative=Math.max(clientTime,serverElapsed-2500);
      if(authoritative<5000)throw bad('RUN time rejected.',422);

      const before=await client.query('SELECT best_time_ms,deaths FROM run_bests WHERE player_id=$1 FOR UPDATE',[player.id]);
      const old=before.rows[0]||null;
      const isPersonalBest=!old||authoritative<Number(old.best_time_ms)||(authoritative===Number(old.best_time_ms)&&deaths<Number(old.deaths));

      await client.query('UPDATE run_attempts SET finished_at=NOW(),client_time_ms=$1,deaths=$2,splits=$3::jsonb WHERE id=$4',[authoritative,deaths,JSON.stringify(splits),runId]);
      if(isPersonalBest){
        await client.query('INSERT INTO run_bests(player_id,best_time_ms,deaths,splits,updated_at) VALUES($1,$2,$3,$4::jsonb,NOW()) ON CONFLICT(player_id) DO UPDATE SET best_time_ms=EXCLUDED.best_time_ms,deaths=EXCLUDED.deaths,splits=EXCLUDED.splits,updated_at=NOW()',[player.id,authoritative,deaths,JSON.stringify(splits)]);
      }
      await client.query('COMMIT');
      const board=await rankings(pool,player.id,20);
      return{ok:true,timeMs:authoritative,deaths,isPersonalBest,rank:board.me?board.me.rank:null,pbMs:board.me?board.me.timeMs:null};
    }catch(e){
      try{await client.query('ROLLBACK')}catch(_){}
      throw e;
    }finally{client.release()}
  }

  const attempt=memoryAttempts.get(runId);
  if(!attempt||attempt.playerId!==player.id||attempt.finished)throw bad('Invalid RUN attempt.',409);
  attempt.finished=true;
  const serverElapsed=Date.now()-attempt.startedAt;
  const authoritative=Math.max(clientTime,serverElapsed-2500);
  const old=memoryBests.get(player.id);
  const isPersonalBest=!old||authoritative<old.timeMs||(authoritative===old.timeMs&&deaths<old.deaths);
  if(isPersonalBest)memoryBests.set(player.id,{playerId:player.id,name:player.name,country:player.country,timeMs:authoritative,deaths,splits});
  return{ok:true,timeMs:authoritative,deaths,isPersonalBest,pbMs:(memoryBests.get(player.id)||{}).timeMs||null};
}

async function rankings(pool,playerId,limitRaw){
  const limit=Math.max(1,Math.min(50,Math.floor(Number(limitRaw)||20)));
  if(pool){
    const q=await pool.query('SELECT rb.player_id AS "playerId",p.name,p.country,rb.best_time_ms AS "timeMs",rb.deaths,rb.updated_at AS "updatedAt",ROW_NUMBER() OVER (ORDER BY rb.best_time_ms ASC,rb.deaths ASC,rb.updated_at ASC,rb.player_id ASC) AS rank FROM run_bests rb JOIN players p ON p.id=rb.player_id ORDER BY rb.best_time_ms ASC,rb.deaths ASC,rb.updated_at ASC,rb.player_id ASC');
    const all=q.rows.map(r=>({...r,timeMs:Number(r.timeMs),deaths:Number(r.deaths),rank:Number(r.rank)}));
    const me=playerId?all.find(r=>r.playerId===playerId)||null:null;
    return{players:all.slice(0,limit),me,total:all.length};
  }
  const all=[...memoryBests.values()].sort((a,b)=>a.timeMs-b.timeMs||a.deaths-b.deaths).map((r,i)=>({...r,rank:i+1}));
  return{players:all.slice(0,limit),me:playerId?all.find(r=>r.playerId===playerId)||null:null,total:all.length};
}

module.exports={initDb,start,finish,rankings};
