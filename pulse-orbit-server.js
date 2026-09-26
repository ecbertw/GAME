'use strict';
const crypto=require('node:crypto');
const Orbit=require('./pulse-orbit');
const error=(message,status=400)=>Object.assign(new Error(message),{status});
async function initDb(db){
  await db.query(`CREATE TABLE IF NOT EXISTS pulse_orbit_runs(id UUID PRIMARY KEY,player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,seed BIGINT NOT NULL,started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),used_at TIMESTAMPTZ)`);
  await db.query(`CREATE INDEX IF NOT EXISTS pulse_orbit_runs_started_idx ON pulse_orbit_runs(started_at)`);
  await db.query(`CREATE TABLE IF NOT EXISTS pulse_orbit_scores(player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,best_score INTEGER NOT NULL DEFAULT 0,best_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await db.query(`CREATE TABLE IF NOT EXISTS pulse_orbit_room_scores(room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,best_score INTEGER NOT NULL DEFAULT 0,best_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(room_id,player_id))`);
}
async function start(db,player){
  if(!db)throw error('PULSE está temporariamente indisponível.',503);
  const runId=crypto.randomUUID(),seed=crypto.randomBytes(4).readUInt32LE();
  await db.query(`DELETE FROM pulse_orbit_runs WHERE started_at<NOW()-INTERVAL '2 hours' OR player_id=$1 AND used_at IS NULL`,[player.id]);
  await db.query('INSERT INTO pulse_orbit_runs(id,player_id,seed) VALUES($1,$2,$3)',[runId,player.id,seed]);
  const best=await db.query('SELECT best_score FROM pulse_orbit_scores WHERE player_id=$1',[player.id]);
  return {runId,seed,mode:Orbit.MODE,bestScore:Number(best.rows[0]?.best_score||0)};
}
async function finish(db,player,data){
  if(!db)throw error('PULSE está temporariamente indisponível.',503);
  if(!/^[0-9a-f-]{36}$/i.test(String(data.runId||'')))throw error('Partida inválida.');
  const client=await db.connect();
  try{
    await client.query('BEGIN');
    const q=await client.query('SELECT seed,started_at,used_at FROM pulse_orbit_runs WHERE id=$1 AND player_id=$2 FOR UPDATE',[data.runId,player.id]);
    if(!q.rows.length||q.rows[0].used_at)throw error('Esta partida já terminou ou não existe.',409);
    const elapsed=Date.now()-new Date(q.rows[0].started_at).getTime();
    if(elapsed<0||elapsed>Orbit.MAX_DURATION+15000)throw error('A partida expirou.',409);
    const verified=Orbit.verifyRun(Number(q.rows[0].seed),data.telemetry,data.score,elapsed);
    if(!verified.valid)throw error('A pontuação não corresponde aos acertos da partida.',422);
    await client.query('UPDATE pulse_orbit_runs SET used_at=NOW() WHERE id=$1',[data.runId]);
    const best=await client.query(`INSERT INTO pulse_orbit_scores(player_id,best_score) VALUES($1,$2) ON CONFLICT(player_id) DO UPDATE SET best_score=GREATEST(pulse_orbit_scores.best_score,EXCLUDED.best_score),best_at=CASE WHEN EXCLUDED.best_score>pulse_orbit_scores.best_score THEN NOW() ELSE pulse_orbit_scores.best_at END RETURNING best_score`,[player.id,verified.score]);
    let roomScore=null;
    if(data.roomId){
      const member=await client.query('SELECT player_id FROM room_members WHERE room_id=$1 AND player_id=$2',[data.roomId,player.id]);
      if(!member.rows.length)throw error('Já não pertences a esta sala.',403);
      const room=await client.query(`INSERT INTO pulse_orbit_room_scores(room_id,player_id,best_score) VALUES($1,$2,$3) ON CONFLICT(room_id,player_id) DO UPDATE SET best_score=GREATEST(pulse_orbit_room_scores.best_score,EXCLUDED.best_score),best_at=CASE WHEN EXCLUDED.best_score>pulse_orbit_room_scores.best_score THEN NOW() ELSE pulse_orbit_room_scores.best_at END RETURNING best_score`,[data.roomId,player.id,verified.score]);
      roomScore=Number(room.rows[0].best_score);
    }
    await client.query('COMMIT');
    return {scoreAccepted:true,score:verified.score,bestScore:Number(best.rows[0].best_score),roomScore,roomScoreAccepted:roomScore!==null,roomId:data.roomId||null,mode:Orbit.MODE};
  }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}finally{client.release();}
}
const rankedSql=`SELECT p.id,p.name,p.country,p.visual_name AS "visualName",p.name_color AS "nameColor",p.name_effect AS "nameEffect",p.vip_level AS "vipLevel",p.letter_styles AS "letterStyles",p.tag_global_color AS "tagGlobalColor",p.tag_country_color AS "tagCountryColor",s.best_score AS score,ROW_NUMBER() OVER(ORDER BY s.best_score DESC,s.best_at,p.id) AS "worldRank",ROW_NUMBER() OVER(PARTITION BY p.country ORDER BY s.best_score DESC,s.best_at,p.id) AS "countryRank" FROM pulse_orbit_scores s JOIN players p ON p.id=s.player_id WHERE s.best_score>0`;
function row(value){let styles=value.letterStyles;try{if(typeof styles==='string')styles=JSON.parse(styles);}catch(_){styles=[];}return {...value,score:Number(value.score||0),worldRank:Number(value.worldRank||0),countryRank:Number(value.countryRank||0),vipLevel:Number(value.vipLevel||0),letterStyles:Array.isArray(styles)?styles:[]};}
async function rankings(db,country,page=1){
  const safe=Math.max(1,Math.min(100000,Math.floor(Number(page)||1)));
  if(!db)return {players:[],total:0,page:safe,pages:1,mode:Orbit.MODE};
  const code=String(country||'').toUpperCase(),params=code?[code]:[],filter=code?' WHERE country=$1':'';
  const count=await db.query(`SELECT COUNT(*) AS total FROM (${rankedSql}) ranked${filter}`,params);
  const total=Number(count.rows[0]?.total||0),pages=Math.max(1,Math.ceil(total/25)),actual=Math.min(safe,pages);
  const q=await db.query(`SELECT * FROM (${rankedSql}) ranked${filter} ORDER BY "worldRank" LIMIT 25 OFFSET $${params.length+1}`,[...params,(actual-1)*25]);
  return {players:q.rows.map(row),total,page:actual,pages,mode:Orbit.MODE};
}
async function playerRank(db,player){
  if(!db)return {worldRank:null,countryRank:null,bestScore:0,mode:Orbit.MODE};
  const q=await db.query(`SELECT score,"worldRank","countryRank" FROM (${rankedSql}) ranked WHERE id=$1`,[player.id]);
  return {worldRank:q.rows[0]?Number(q.rows[0].worldRank):null,countryRank:q.rows[0]?Number(q.rows[0].countryRank):null,bestScore:Number(q.rows[0]?.score||0),mode:Orbit.MODE};
}
async function roomRankings(db,player,roomId){
  const membership=await db.query('SELECT player_id FROM room_members WHERE room_id=$1 AND player_id=$2',[roomId,player.id]);
  if(!membership.rows.length)throw error('Não pertences a esta sala.',403);
  const q=await db.query(`SELECT p.id,p.name,p.country,p.visual_name AS "visualName",p.name_color AS "nameColor",p.name_effect AS "nameEffect",p.vip_level AS "vipLevel",p.letter_styles AS "letterStyles",p.tag_global_color AS "tagGlobalColor",p.tag_country_color AS "tagCountryColor",COALESCE(s.best_score,0) AS score,r."worldRank",r."countryRank" FROM room_members m JOIN players p ON p.id=m.player_id LEFT JOIN pulse_orbit_room_scores s ON s.player_id=p.id AND s.room_id=m.room_id LEFT JOIN (${rankedSql}) r ON r.id=p.id WHERE m.room_id=$1 ORDER BY COALESCE(s.best_score,0) DESC,s.best_at,m.joined_at,p.id`,[roomId]);
  return q.rows.map((v,i)=>({...row(v),roomRank:i+1}));
}
module.exports={initDb,start,finish,rankings,playerRank,roomRankings};
