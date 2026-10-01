'use strict';
const crypto=require('crypto');

const RUN_LEVEL_COUNT=100;
const memoryAttempts=new Map();
const memoryBests=new Map();

function bad(message,status=400){const e=new Error(message);e.status=status;return e}
function cleanTime(v){const n=Math.floor(Number(v));if(!Number.isFinite(n)||n<1000||n>60*60*1000)throw bad('Invalid RUN level time.');return n}
function cleanLevel(v){const n=Math.floor(Number(v));if(!Number.isFinite(n)||n<1||n>RUN_LEVEL_COUNT)throw bad('Invalid RUN level.');return n}

async function initDb(pool){
  await pool.query('CREATE TABLE IF NOT EXISTS run_attempts(id UUID PRIMARY KEY,player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),finished_at TIMESTAMPTZ,client_time_ms INTEGER,deaths INTEGER NOT NULL DEFAULT 0,splits JSONB NOT NULL DEFAULT \'[]\'::jsonb,created_ip_hash CHAR(64))');
  await pool.query('ALTER TABLE run_attempts ADD COLUMN IF NOT EXISTS current_level INTEGER NOT NULL DEFAULT 1, ADD COLUMN IF NOT EXISTS completed_level INTEGER NOT NULL DEFAULT 0');
  await pool.query('CREATE INDEX IF NOT EXISTS run_attempts_player_started_idx ON run_attempts(player_id,started_at DESC)');

  await pool.query('CREATE TABLE IF NOT EXISTS run_bests(player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,best_time_ms INTEGER NOT NULL,deaths INTEGER NOT NULL DEFAULT 0,splits JSONB NOT NULL DEFAULT \'[]\'::jsonb,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
  await pool.query('ALTER TABLE run_bests ADD COLUMN IF NOT EXISTS best_level INTEGER NOT NULL DEFAULT 0');
  await pool.query('CREATE INDEX IF NOT EXISTS run_bests_progress_idx ON run_bests(best_level DESC,best_time_ms ASC,updated_at ASC)');
  await pool.query('UPDATE run_bests SET best_level=LEAST(best_level,$1) WHERE best_level>$1',[RUN_LEVEL_COUNT]);
  await pool.query('UPDATE run_attempts SET current_level=LEAST(current_level,$1),completed_level=LEAST(completed_level,$1) WHERE current_level>$1 OR completed_level>$1',[RUN_LEVEL_COUNT]);
}

function hashIp(ip){return crypto.createHash('sha256').update(String(ip||'')).digest('hex')}

async function start(pool,player,ip){
  if(!player||!player.id)throw bad('Login required.',401);

  if(pool){
    const [best,existing]=await Promise.all([
      pool.query('SELECT best_level FROM run_bests WHERE player_id=$1',[player.id]),
      pool.query('SELECT id,current_level,completed_level FROM run_attempts WHERE player_id=$1 AND finished_at IS NULL ORDER BY started_at DESC LIMIT 1',[player.id])
    ]);
    const bestLevel=Math.max(0,Math.min(RUN_LEVEL_COUNT,Number(best.rows[0]?.best_level)||0));
    const bestNext=bestLevel>=RUN_LEVEL_COUNT?RUN_LEVEL_COUNT:bestLevel+1;

    if(existing.rowCount){
      const row=existing.rows[0];
      const current=Math.max(1,Math.min(RUN_LEVEL_COUNT,Number(row.current_level)||1));
      const level=Math.max(current,bestNext);
      if(level!==current){
        await pool.query('UPDATE run_attempts SET current_level=$1,completed_level=GREATEST(completed_level,$2) WHERE id=$3',[level,Math.max(0,level-1),row.id]);
      }
      return{runId:row.id,level,resumed:true};
    }

    const level=bestNext,runId=crypto.randomUUID();
    await pool.query('INSERT INTO run_attempts(id,player_id,created_ip_hash,current_level,completed_level) VALUES($1,$2,$3,$4,$5)',[runId,player.id,hashIp(ip),level,Math.max(0,level-1)]);
    return{runId,level,resumed:false};
  }

  const best=memoryBests.get(player.id);
  const bestLevel=Math.max(0,Math.min(RUN_LEVEL_COUNT,Number(best?.level)||0));
  const bestNext=bestLevel>=RUN_LEVEL_COUNT?RUN_LEVEL_COUNT:bestLevel+1;
  const existing=[...memoryAttempts.values()].reverse().find(a=>a.playerId===player.id&&!a.finished);
  if(existing){
    existing.currentLevel=Math.max(existing.currentLevel,bestNext);
    existing.completedLevel=Math.max(existing.completedLevel,existing.currentLevel-1);
    return{runId:existing.id,level:existing.currentLevel,resumed:true};
  }

  const runId=crypto.randomUUID();
  memoryAttempts.set(runId,{id:runId,playerId:player.id,currentLevel:bestNext,completedLevel:Math.max(0,bestNext-1),finished:false,times:[]});
  return{runId,level:bestNext,resumed:false};
}

async function completeLevel(pool,player,data){
  if(!player||!player.id)throw bad('Login required.',401);
  const runId=String(data&&data.runId||'');
  if(!runId)throw bad('RUN attempt required.');
  const level=cleanLevel(data&&data.level);
  const timeMs=cleanTime(data&&data.timeMs);

  if(pool){
    const client=await pool.connect();
    try{
      await client.query('BEGIN');
      const q=await client.query('SELECT id,player_id,current_level,completed_level,finished_at,splits FROM run_attempts WHERE id=$1 FOR UPDATE',[runId]);
      if(!q.rowCount||q.rows[0].player_id!==player.id)throw bad('Invalid RUN attempt.',409);
      const currentLevel=Number(q.rows[0].current_level)||1;
      const completedLevel=Number(q.rows[0].completed_level)||0;
      const isRetry=level===completedLevel&&currentLevel===Math.min(RUN_LEVEL_COUNT,level+1);
      if(q.rows[0].finished_at&&!isRetry)throw bad('RUN attempt already finished.',409);
      if(currentLevel!==level&&!isRetry)throw bad('RUN level out of sequence.',409);

      const times=Array.isArray(q.rows[0].splits)?q.rows[0].splits.slice(0,RUN_LEVEL_COUNT):[];
      const previous=Number(times[level-1]);
      times[level-1]=Number.isFinite(previous)?Math.min(previous,timeMs):timeMs;
      const finished=level===RUN_LEVEL_COUNT;
      const nextLevel=finished?RUN_LEVEL_COUNT:Math.max(currentLevel,level+1);
      await client.query(
        'UPDATE run_attempts SET completed_level=GREATEST(completed_level,$1),current_level=$2,client_time_ms=$3,splits=$4::jsonb,finished_at=NULL WHERE id=$5',
        [level,nextLevel,times[level-1],JSON.stringify(times),runId]
      );

      const before=await client.query('SELECT best_level,best_time_ms FROM run_bests WHERE player_id=$1 FOR UPDATE',[player.id]);
      const old=before.rows[0]||null;
      const isPersonalBest=!old||level>Number(old.best_level||0)||(level===Number(old.best_level||0)&&timeMs<Number(old.best_time_ms));

      if(isPersonalBest){
        await client.query(
          'INSERT INTO run_bests(player_id,best_level,best_time_ms,deaths,splits,updated_at) VALUES($1,$2,$3,0,$4::jsonb,NOW()) ON CONFLICT(player_id) DO UPDATE SET best_level=EXCLUDED.best_level,best_time_ms=EXCLUDED.best_time_ms,deaths=0,splits=EXCLUDED.splits,updated_at=NOW()',
          [player.id,level,timeMs,JSON.stringify(times)]
        );
      }

      await client.query('COMMIT');
      const board=await rankings(pool,player.id,20);
      return{
        ok:true,level,timeMs,finished,isPersonalBest,
        rank:board.me?board.me.rank:null,
        pbLevel:board.me?board.me.level:null,
        pbMs:board.me?board.me.timeMs:null
      };
    }catch(e){
      try{await client.query('ROLLBACK')}catch(_){}
      throw e;
    }finally{client.release()}
  }

  const attempt=memoryAttempts.get(runId);
  if(!attempt||attempt.playerId!==player.id)throw bad('Invalid RUN attempt.',409);
  const isRetry=level===attempt.completedLevel&&attempt.currentLevel===Math.min(RUN_LEVEL_COUNT,level+1);
  if(attempt.currentLevel!==level&&!isRetry)throw bad('RUN level out of sequence.',409);
  const previous=Number(attempt.times[level-1]);
  attempt.times[level-1]=Number.isFinite(previous)?Math.min(previous,timeMs):timeMs;
  attempt.completedLevel=Math.max(attempt.completedLevel,level);
  attempt.currentLevel=level===RUN_LEVEL_COUNT?RUN_LEVEL_COUNT:Math.max(attempt.currentLevel,level+1);
  attempt.finished=false;

  const old=memoryBests.get(player.id);
  const isPersonalBest=!old||level>old.level||(level===old.level&&timeMs<old.timeMs);
  if(isPersonalBest)memoryBests.set(player.id,{playerId:player.id,name:player.name,country:player.country,level,timeMs,updatedAt:Date.now()});
  const board=await rankings(null,player.id,20);
  return{ok:true,level,timeMs,finished:level===RUN_LEVEL_COUNT,isPersonalBest,rank:board.me?.rank||null,pbLevel:board.me?.level||null,pbMs:board.me?.timeMs||null};
}

async function rankings(pool,playerId,limitRaw){
  const limit=Math.max(1,Math.min(50,Math.floor(Number(limitRaw)||20)));
  if(pool){
    const q=await pool.query('SELECT rb.player_id AS "playerId",p.name,p.country,rb.best_level AS level,rb.best_time_ms AS "timeMs",rb.updated_at AS "updatedAt",ROW_NUMBER() OVER (ORDER BY rb.best_level DESC,rb.best_time_ms ASC,rb.updated_at ASC,rb.player_id ASC) AS rank FROM run_bests rb JOIN players p ON p.id=rb.player_id WHERE rb.best_level>0 ORDER BY rb.best_level DESC,rb.best_time_ms ASC,rb.updated_at ASC,rb.player_id ASC');
    const all=q.rows.map(r=>({...r,level:Number(r.level),timeMs:Number(r.timeMs),rank:Number(r.rank)}));
    const me=playerId?all.find(r=>r.playerId===playerId)||null:null;
    return{players:all.slice(0,limit),me,total:all.length};
  }
  const all=[...memoryBests.values()]
    .sort((a,b)=>b.level-a.level||a.timeMs-b.timeMs||a.updatedAt-b.updatedAt)
    .map((r,i)=>({...r,rank:i+1}));
  return{players:all.slice(0,limit),me:playerId?all.find(r=>r.playerId===playerId)||null:null,total:all.length};
}

module.exports={initDb,start,completeLevel,rankings};
