'use strict';
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const physics=require('./run/shared/physics');
const ENGINE_VERSION=physics.VERSION;
const LEVEL_DIR=path.join(__dirname,'run','levels');
const LEVELS=new Map();
const ALLOWED_CATEGORIES=new Set(['best-time','100-percent']);
const error=(message,status=400)=>Object.assign(new Error(message),{status});
function levelKey(id){return String(id||'').trim().toLowerCase();}
function loadLevel(id='astral-01'){
 const key=levelKey(id);if(LEVELS.has(key))return LEVELS.get(key);
 if(!/^[a-z0-9-]{3,40}$/.test(key))throw error('Nível RUN inválido.');
 const file=path.join(LEVEL_DIR,'astral',key+'.json');
 if(!file.startsWith(LEVEL_DIR+path.sep)||!fs.existsSync(file))throw error('Nível RUN não encontrado.',404);
 const level=JSON.parse(fs.readFileSync(file,'utf8'));
 if(level.id!==key||Number(level.version)<1||level.engineVersion!==ENGINE_VERSION)throw error('Versão do nível RUN inválida.',500);
 LEVELS.set(key,level);return level;
}
function dailyKey(now=new Date()){return now.toISOString().slice(0,10);}
function dailyDefinition(now=new Date()){
 const key=dailyKey(now);return{key,reset:'UTC',levelId:'astral-01',levelVersion:1,engineVersion:ENGINE_VERSION,rules:{preset:'first-light-daily',echoes:true}};
}
function normalizeInput(v){return{left:!!v.left,right:!!v.right,jump:!!v.jump};}
function validateReplay(replay){
 if(!replay||typeof replay!=='object'||Array.isArray(replay))throw error('Replay inválido.');
 const totalTicks=Number(replay.totalTicks);if(!Number.isInteger(totalTicks)||totalTicks<1||totalTicks>physics.DT**-1*180)throw error('Duração de replay inválida.');
 if(!Array.isArray(replay.events)||replay.events.length<1||replay.events.length>2400)throw error('Eventos de replay inválidos.');
 let prev=-1;const events=[];
 for(const raw of replay.events){
  const tick=Number(raw.tick);if(!Number.isInteger(tick)||tick<0||tick>=totalTicks||tick<prev)throw error('Sequência de replay inválida.');
  prev=tick;events.push({tick,...normalizeInput(raw)});
 }
 if(events[0].tick!==0)events.unshift({tick:0,left:false,right:false,jump:false});
 return{totalTicks,events};
}
function simulateReplay(level,replay){
 const clean=validateReplay(replay),state=physics.create(level);let input={left:false,right:false,jump:false},ei=0;
 for(let tick=0;tick<clean.totalTicks;tick++){
  while(ei<clean.events.length&&clean.events[ei].tick===tick){input=normalizeInput(clean.events[ei]);ei++;}
  physics.step(level,state,input);
  if(state.finished)break;
 }
 if(!state.finished)throw error('A run não chegou validamente à meta.',422);
 const timeMs=physics.elapsedMs(state),completion=physics.completion(level,state);
 if(timeMs<3000||timeMs>180000)throw error('Tempo de RUN impossível.',422);
 return{state,timeMs,completion,replay:{version:1,totalTicks:state.tick,events:clean.events.filter(x=>x.tick<state.tick)}};
}
async function initDb(db){
 await db.query(`CREATE TABLE IF NOT EXISTS run_attempts(id UUID PRIMARY KEY,player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,level_id VARCHAR(40) NOT NULL,level_version INTEGER NOT NULL,engine_version VARCHAR(24) NOT NULL,mode VARCHAR(12) NOT NULL DEFAULT 'standard',daily_key DATE,started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),used_at TIMESTAMPTZ,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
 await db.query(`CREATE INDEX IF NOT EXISTS run_attempts_player_started_idx ON run_attempts(player_id,started_at DESC)`);
 await db.query(`CREATE TABLE IF NOT EXISTS run_scores(player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,level_id VARCHAR(40) NOT NULL,level_version INTEGER NOT NULL,engine_version VARCHAR(24) NOT NULL,category VARCHAR(20) NOT NULL,best_ms INTEGER NOT NULL,shards INTEGER NOT NULL DEFAULT 0,secrets INTEGER NOT NULL DEFAULT 0,deaths INTEGER NOT NULL DEFAULT 0,replay JSONB NOT NULL,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(player_id,level_id,level_version,engine_version,category))`);
 await db.query(`CREATE INDEX IF NOT EXISTS run_scores_rank_idx ON run_scores(level_id,level_version,engine_version,category,best_ms,updated_at)`);
 await db.query(`CREATE TABLE IF NOT EXISTS run_daily_scores(daily_key DATE NOT NULL,player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,level_id VARCHAR(40) NOT NULL,level_version INTEGER NOT NULL,engine_version VARCHAR(24) NOT NULL,best_ms INTEGER NOT NULL,shards INTEGER NOT NULL DEFAULT 0,secrets INTEGER NOT NULL DEFAULT 0,deaths INTEGER NOT NULL DEFAULT 0,replay JSONB NOT NULL,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(daily_key,player_id))`);
 await db.query(`CREATE INDEX IF NOT EXISTS run_daily_rank_idx ON run_daily_scores(daily_key,best_ms,updated_at)`);
 await db.query(`CREATE TABLE IF NOT EXISTS run_daily_streak(player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,current_streak INTEGER NOT NULL DEFAULT 0,best_streak INTEGER NOT NULL DEFAULT 0,last_day DATE,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
 await db.query(`CREATE TABLE IF NOT EXISTS run_level_progress(player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,level_id VARCHAR(40) NOT NULL,level_version INTEGER NOT NULL,first_clear_at TIMESTAMPTZ,best_shards INTEGER NOT NULL DEFAULT 0,best_secrets INTEGER NOT NULL DEFAULT 0,discovered_secret_ids JSONB NOT NULL DEFAULT '[]'::jsonb,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(player_id,level_id,level_version))`);
}
async function start(db,player,data={}){
 const level=loadLevel(data.levelId||'astral-01'),mode=data.daily?'daily':'standard',daily=mode==='daily'?dailyDefinition():null;
 if(daily&&(daily.levelId!==level.id||daily.levelVersion!==level.version))throw error('Daily RUN desatualizado.',409);
 const id=crypto.randomUUID();
 await db.query(`INSERT INTO run_attempts(id,player_id,level_id,level_version,engine_version,mode,daily_key) VALUES($1,$2,$3,$4,$5,$6,$7)`,[id,player.id,level.id,level.version,ENGINE_VERSION,mode,daily?.key||null]);
 const pb=await db.query(`SELECT best_ms AS "bestMs" FROM run_scores WHERE player_id=$1 AND level_id=$2 AND level_version=$3 AND engine_version=$4 AND category='best-time'`,[player.id,level.id,level.version,ENGINE_VERSION]);
 let dailyBestMs=null,streak=0;if(daily){const [dr,sr]=await Promise.all([db.query(`SELECT best_ms AS "bestMs" FROM run_daily_scores WHERE daily_key=$1 AND player_id=$2`,[daily.key,player.id]),db.query(`SELECT current_streak AS streak FROM run_daily_streak WHERE player_id=$1`,[player.id])]);dailyBestMs=Number(dr.rows[0]?.bestMs)||null;streak=Number(sr.rows[0]?.streak)||0;}
 return{ok:true,attemptId:id,levelId:level.id,levelVersion:level.version,engineVersion:ENGINE_VERSION,mode,daily,bestMs:Number(pb.rows[0]?.bestMs)||null,dailyBestMs,streak,serverNow:new Date().toISOString()};
}
async function finish(db,player,data={}){
 const attemptId=String(data.attemptId||'');if(!/^[0-9a-f-]{36}$/i.test(attemptId))throw error('Tentativa RUN inválida.');
 const ar=await db.query(`SELECT id,player_id AS "playerId",level_id AS "levelId",level_version AS "levelVersion",engine_version AS "engineVersion",mode,daily_key::text AS "dailyKey",started_at AS "startedAt",used_at AS "usedAt" FROM run_attempts WHERE id=$1 AND player_id=$2`,[attemptId,player.id]);
 const a=ar.rows[0];if(!a)throw error('Tentativa RUN não encontrada.',404);if(a.usedAt)throw error('Esta tentativa RUN já foi submetida.',409);
 const level=loadLevel(a.levelId);if(Number(a.levelVersion)!==Number(level.version)||a.engineVersion!==ENGINE_VERSION)throw error('Versão RUN incompatível.',409);
 const sim=simulateReplay(level,data.replay);
 const realElapsed=Date.now()-new Date(a.startedAt).getTime();if(realElapsed+1200<sim.timeMs)throw error('A submissão chegou antes do tempo físico da run.',422);
 const claim=await db.query(`UPDATE run_attempts SET used_at=NOW() WHERE id=$1 AND player_id=$2 AND used_at IS NULL RETURNING id`,[attemptId,player.id]);if(!claim.rowCount)throw error('Esta tentativa RUN já foi submetida.',409);
 const previous=await db.query(`SELECT best_ms AS "bestMs" FROM run_scores WHERE player_id=$1 AND level_id=$2 AND level_version=$3 AND engine_version=$4 AND category='best-time'`,[player.id,level.id,level.version,ENGINE_VERSION]);
 const previousBest=Number(previous.rows[0]?.bestMs)||null,pbBeaten=previousBest==null||sim.timeMs<previousBest;
 const beforeProgress=await db.query(`SELECT first_clear_at AS "firstClearAt" FROM run_level_progress WHERE player_id=$1 AND level_id=$2 AND level_version=$3`,[player.id,level.id,level.version]);
 const firstClear=!beforeProgress.rows[0]?.firstClearAt;
 const payload=JSON.stringify(sim.replay);
 await db.query(`INSERT INTO run_scores(player_id,level_id,level_version,engine_version,category,best_ms,shards,secrets,deaths,replay) VALUES($1,$2,$3,$4,'best-time',$5,$6,$7,$8,$9::jsonb) ON CONFLICT(player_id,level_id,level_version,engine_version,category) DO UPDATE SET best_ms=EXCLUDED.best_ms,shards=EXCLUDED.shards,secrets=EXCLUDED.secrets,deaths=EXCLUDED.deaths,replay=EXCLUDED.replay,updated_at=NOW() WHERE EXCLUDED.best_ms<run_scores.best_ms`,[player.id,level.id,level.version,ENGINE_VERSION,sim.timeMs,sim.completion.shards,sim.completion.secrets,sim.state.deaths,payload]);
 if(sim.completion.complete100)await db.query(`INSERT INTO run_scores(player_id,level_id,level_version,engine_version,category,best_ms,shards,secrets,deaths,replay) VALUES($1,$2,$3,$4,'100-percent',$5,$6,$7,$8,$9::jsonb) ON CONFLICT(player_id,level_id,level_version,engine_version,category) DO UPDATE SET best_ms=EXCLUDED.best_ms,shards=EXCLUDED.shards,secrets=EXCLUDED.secrets,deaths=EXCLUDED.deaths,replay=EXCLUDED.replay,updated_at=NOW() WHERE EXCLUDED.best_ms<run_scores.best_ms`,[player.id,level.id,level.version,ENGINE_VERSION,sim.timeMs,sim.completion.shards,sim.completion.secrets,sim.state.deaths,payload]);
 const secretIds=JSON.stringify([...sim.state.secrets]);
 await db.query(`INSERT INTO run_level_progress(player_id,level_id,level_version,first_clear_at,best_shards,best_secrets,discovered_secret_ids) VALUES($1,$2,$3,NOW(),$4,$5,$6::jsonb) ON CONFLICT(player_id,level_id,level_version) DO UPDATE SET first_clear_at=COALESCE(run_level_progress.first_clear_at,NOW()),best_shards=GREATEST(run_level_progress.best_shards,EXCLUDED.best_shards),best_secrets=GREATEST(run_level_progress.best_secrets,EXCLUDED.best_secrets),discovered_secret_ids=COALESCE((SELECT jsonb_agg(DISTINCT v) FROM jsonb_array_elements(run_level_progress.discovered_secret_ids||EXCLUDED.discovered_secret_ids) AS t(v)),'[]'::jsonb),updated_at=NOW()`,[player.id,level.id,level.version,sim.completion.shards,sim.completion.secrets,secretIds]);
 let dailyRank=null,dailyStreak=null;
 if(a.mode==='daily'){
  const expected=dailyDefinition(new Date(a.startedAt));if(String(a.dailyKey).slice(0,10)!==expected.key)throw error('Daily RUN inválido.',409);
  await db.query(`INSERT INTO run_daily_scores(daily_key,player_id,level_id,level_version,engine_version,best_ms,shards,secrets,deaths,replay) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb) ON CONFLICT(daily_key,player_id) DO UPDATE SET best_ms=EXCLUDED.best_ms,shards=EXCLUDED.shards,secrets=EXCLUDED.secrets,deaths=EXCLUDED.deaths,replay=EXCLUDED.replay,updated_at=NOW() WHERE EXCLUDED.best_ms<run_daily_scores.best_ms`,[expected.key,player.id,level.id,level.version,ENGINE_VERSION,sim.timeMs,sim.completion.shards,sim.completion.secrets,sim.state.deaths,payload]);
  const rr=await db.query(`SELECT 1+COUNT(*)::int AS rank FROM run_daily_scores WHERE daily_key=$1 AND best_ms<$2`,[expected.key,sim.timeMs]);dailyRank=Number(rr.rows[0]?.rank)||null;
  const sr=await db.query(`INSERT INTO run_daily_streak(player_id,current_streak,best_streak,last_day) VALUES($1,1,1,$2) ON CONFLICT(player_id) DO UPDATE SET current_streak=CASE WHEN run_daily_streak.last_day=$2::date THEN run_daily_streak.current_streak WHEN run_daily_streak.last_day=$2::date-1 THEN run_daily_streak.current_streak+1 ELSE 1 END,best_streak=GREATEST(run_daily_streak.best_streak,CASE WHEN run_daily_streak.last_day=$2::date THEN run_daily_streak.current_streak WHEN run_daily_streak.last_day=$2::date-1 THEN run_daily_streak.current_streak+1 ELSE 1 END),last_day=$2,updated_at=NOW() RETURNING current_streak AS streak`,[player.id,expected.key]);dailyStreak=Number(sr.rows[0]?.streak)||1;
 }
 const progressEvents=['RUN_COMPLETE'];if(firstClear)progressEvents.push('FIRST_CLEAR');if(pbBeaten&&!firstClear)progressEvents.push('PB_BEATEN');if(sim.completion.shards===sim.completion.totalShards)progressEvents.push('ALL_SHARDS');if(sim.completion.secrets===sim.completion.totalSecrets)progressEvents.push('ALL_SECRETS');if(sim.state.deaths===0)progressEvents.push('NO_DEATH');if(sim.timeMs<=Number(level.meta?.timeTargetMs||0))progressEvents.push('TIME_TARGET');if(a.mode==='daily')progressEvents.push('DAILY_COMPLETE');if(dailyRank&&dailyRank<=100)progressEvents.push('DAILY_TOP_100');
 return{ok:true,attemptId,timeMs:sim.timeMs,previousBest,newPb:pbBeaten,shards:sim.completion.shards,totalShards:sim.completion.totalShards,secrets:sim.completion.secrets,totalSecrets:sim.completion.totalSecrets,deaths:sim.state.deaths,complete100:sim.completion.complete100,dailyRank,dailyStreak,progressEvents};
}
function rankingCategory(v){const c=String(v||'best-time');return ALLOWED_CATEGORIES.has(c)?c:'best-time';}
async function rankings(db,{levelId='astral-01',category='best-time',country=null,page=1}={}){
 const level=loadLevel(levelId),cat=rankingCategory(category),p=Math.max(1,Math.min(100,Number(page)||1)),limit=50,offset=(p-1)*limit;const params=[level.id,level.version,ENGINE_VERSION,cat];let filter='';
 if(country){const c=String(country).toUpperCase();if(!/^[A-Z]{2}$/.test(c))throw error('País inválido.');params.push(c);filter=` AND p.country=$${params.length}`;}
 params.push(limit,offset);const lr=params.length;
 const r=await db.query(`SELECT s.best_ms AS "bestMs",s.shards,s.secrets,s.deaths,p.id,p.name,p.visual_name AS "visualName",p.country,p.vip_level AS "vipLevel",p.featured_badge AS "featuredBadge" FROM run_scores s JOIN players p ON p.id=s.player_id WHERE s.level_id=$1 AND s.level_version=$2 AND s.engine_version=$3 AND s.category=$4${filter} ORDER BY s.best_ms ASC,s.updated_at ASC LIMIT $${lr-1} OFFSET $${lr}` ,params);
 return{ok:true,levelId:level.id,levelVersion:level.version,engineVersion:ENGINE_VERSION,category:cat,country:country?String(country).toUpperCase():null,page:p,players:r.rows};
}
async function dailyRankings(db,{country=null,page=1}={}){const d=dailyDefinition(),p=Math.max(1,Math.min(100,Number(page)||1)),limit=50,offset=(p-1)*limit,params=[d.key];let filter='';if(country){const c=String(country).toUpperCase();if(!/^[A-Z]{2}$/.test(c))throw error('País inválido.');params.push(c);filter=` AND p.country=$${params.length}`;}params.push(limit,offset);const n=params.length;const r=await db.query(`SELECT s.best_ms AS "bestMs",s.shards,s.secrets,s.deaths,p.id,p.name,p.visual_name AS "visualName",p.country,p.vip_level AS "vipLevel" FROM run_daily_scores s JOIN players p ON p.id=s.player_id WHERE s.daily_key=$1${filter} ORDER BY s.best_ms,s.updated_at LIMIT $${n-1} OFFSET $${n}`,params);return{ok:true,daily:d,players:r.rows,page:p,country:country?String(country).toUpperCase():null};}
async function echo(db,player,{levelId='astral-01',type='pb',daily=false}={}){
 const level=loadLevel(levelId),isDaily=daily===true||daily==='1'||daily==='true';let r;
 if(isDaily){
  const key=dailyDefinition().key;
  if(type==='world')r=await db.query(`SELECT s.replay,s.best_ms AS "bestMs",p.visual_name AS "visualName",p.name FROM run_daily_scores s JOIN players p ON p.id=s.player_id WHERE s.daily_key=$1 AND s.level_id=$2 AND s.level_version=$3 AND s.engine_version=$4 ORDER BY s.best_ms,s.updated_at LIMIT 1`,[key,level.id,level.version,ENGINE_VERSION]);
  else r=await db.query(`SELECT replay,best_ms AS "bestMs" FROM run_daily_scores WHERE daily_key=$1 AND player_id=$2 AND level_id=$3 AND level_version=$4 AND engine_version=$5`,[key,player.id,level.id,level.version,ENGINE_VERSION]);
 }else if(type==='world')r=await db.query(`SELECT s.replay,s.best_ms AS "bestMs",p.visual_name AS "visualName",p.name FROM run_scores s JOIN players p ON p.id=s.player_id WHERE s.level_id=$1 AND s.level_version=$2 AND s.engine_version=$3 AND s.category='best-time' ORDER BY s.best_ms,s.updated_at LIMIT 1`,[level.id,level.version,ENGINE_VERSION]);
 else r=await db.query(`SELECT replay,best_ms AS "bestMs" FROM run_scores WHERE player_id=$1 AND level_id=$2 AND level_version=$3 AND engine_version=$4 AND category='best-time'`,[player.id,level.id,level.version,ENGINE_VERSION]);
 if(!r.rows[0])return{ok:true,type,daily:isDaily,replay:null};return{ok:true,type,daily:isDaily,bestMs:Number(r.rows[0].bestMs),name:r.rows[0].visualName||r.rows[0].name||null,replay:r.rows[0].replay};
}
async function playerRank(db,player,{levelId='astral-01',category='best-time'}={}){const level=loadLevel(levelId),cat=rankingCategory(category);const own=await db.query(`SELECT best_ms AS "bestMs" FROM run_scores WHERE player_id=$1 AND level_id=$2 AND level_version=$3 AND engine_version=$4 AND category=$5`,[player.id,level.id,level.version,ENGINE_VERSION,cat]);if(!own.rows[0])return{ok:true,bestMs:null,worldRank:null,countryRank:null};const ms=Number(own.rows[0].bestMs);const [w,c]=await Promise.all([db.query(`SELECT 1+COUNT(*)::int AS rank FROM run_scores WHERE level_id=$1 AND level_version=$2 AND engine_version=$3 AND category=$4 AND best_ms<$5`,[level.id,level.version,ENGINE_VERSION,cat,ms]),db.query(`SELECT 1+COUNT(*)::int AS rank FROM run_scores s JOIN players p ON p.id=s.player_id WHERE s.level_id=$1 AND s.level_version=$2 AND s.engine_version=$3 AND s.category=$4 AND s.best_ms<$5 AND p.country=$6`,[level.id,level.version,ENGINE_VERSION,cat,ms,player.country])]);return{ok:true,bestMs:ms,worldRank:Number(w.rows[0]?.rank)||null,countryRank:Number(c.rows[0]?.rank)||null};}
module.exports={ENGINE_VERSION,initDb,loadLevel,dailyKey,dailyDefinition,validateReplay,simulateReplay,start,finish,rankings,dailyRankings,echo,playerRank};
