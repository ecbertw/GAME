'use strict';
// Persistent DUO/TRIO rosters with one authoritative live simulation per entered team.
const crypto=require('node:crypto');
const P=require('./jump-physics');
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
const LIMIT=110,DISCONNECT=10000;
const MODES=new Set(['duo','trio']),BIOMES=new Set(['city','forest','desert','snow']);
function createService({now=Date.now,physics=P}={}){
 const teams=new Map(),membership=new Map();
 let db;
 const cap=mode=>mode==='duo'?2:3;
 async function init(storage){
  db=storage;
  await db.query(`CREATE TABLE IF NOT EXISTS jump_team_scores(
   roster_key VARCHAR(64) PRIMARY KEY,mode VARCHAR(4) NOT NULL CHECK(mode IN ('duo','trio')),
   name VARCHAR(24) NOT NULL,members JSONB NOT NULL,best_score INTEGER NOT NULL DEFAULT 0,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await db.query('CREATE INDEX IF NOT EXISTS jump_team_rank_idx ON jump_team_scores(mode,best_score DESC,updated_at)');
  await db.query(`CREATE TABLE IF NOT EXISTS jump_teams(
   id UUID PRIMARY KEY,code VARCHAR(12) UNIQUE NOT NULL,mode VARCHAR(4) NOT NULL CHECK(mode IN ('duo','trio')),
   name VARCHAR(24) NOT NULL,biome VARCHAR(8) NOT NULL,owner_id TEXT NOT NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await db.query(`CREATE TABLE IF NOT EXISTS jump_team_members(
   team_id UUID NOT NULL REFERENCES jump_teams(id) ON DELETE CASCADE,
   player_id TEXT NOT NULL,player_name VARCHAR(32) NOT NULL,
   joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(team_id,player_id))`);
  await db.query('CREATE INDEX IF NOT EXISTS jump_team_members_player_idx ON jump_team_members(player_id,joined_at DESC)');
 }
 function blankMember(row){return{id:String(row.player_id),name:String(row.player_name||'PLAYER'),outfit:null,ready:false,present:false,seen:0,inputAt:0,keys:{},seq:-1,state:null,facing:1,position:null,positionAt:0};}
 function rosterKey(t){return crypto.createHash('sha256').update(t.mode+':'+[...t.members.keys()].sort().join(':')).digest('hex');}
 function previewState(t,index){
  const s=physics.create(t.seed);
  s.x=physics.W/2+(index-(t.capacity-1)/2)*26;
  s.ground=true;s.groundPlatform=0;s.jumpOrigin=0;
  return s;
 }
 function refreshPreview(t){
  let i=0;
  for(const m of t.members.values()){
   if(m.present)m.state=previewState(t,i);
   else m.state=null;
   m.ready=false;m.keys={};m.seq=-1;m.inputAt=now();i++;
  }
 }
 function resetLobby(t,newSeed=true){
  t.status='lobby';t.reason=null;t.runId=null;t.score=0;t.startsAt=0;t.restartAt=0;t.result=null;
  if(newSeed||!t.seed)t.seed=crypto.randomInt(1,2147483647);
  refreshPreview(t);t.updated=now();
 }
 async function hydrate(teamId){
  if(teams.has(teamId))return teams.get(teamId);
  const tr=await db.query('SELECT id::text AS id,code,mode,name,biome,owner_id FROM jump_teams WHERE id=$1::uuid',[teamId]);
  const row=tr.rows[0];if(!row)throw fail('Equipa não encontrada.',404);
  const mr=await db.query('SELECT player_id,player_name FROM jump_team_members WHERE team_id=$1::uuid ORDER BY joined_at,player_id',[teamId]);
  const t={id:String(row.id),code:String(row.code),mode:String(row.mode),name:String(row.name),biome:String(row.biome),ownerId:String(row.owner_id),capacity:cap(row.mode),
   members:new Map(mr.rows.map(x=>[String(x.player_id),blankMember(x)])),status:'lobby',updated:now(),seed:crypto.randomInt(1,2147483647),runId:null,score:0,startsAt:0,saved:true,saveError:false};
  teams.set(t.id,t);return t;
 }
 async function list(p,mode){
  if(!MODES.has(mode))throw fail('Modo inválido.');
  const r=await db.query(`SELECT t.id::text AS id,t.code,t.mode,t.name,t.biome,t.owner_id,
   COUNT(allm.player_id)::int AS member_count
   FROM jump_team_members mine
   JOIN jump_teams t ON t.id=mine.team_id
   JOIN jump_team_members allm ON allm.team_id=t.id
   WHERE mine.player_id=$1 AND t.mode=$2
   GROUP BY t.id,t.code,t.mode,t.name,t.biome,t.owner_id,t.updated_at,t.created_at
   ORDER BY t.updated_at DESC,t.created_at DESC`,[String(p.id),mode]);
  return{ok:true,mode,teams:r.rows.map(x=>{const id=String(x.id),active=membership.get(String(p.id))===id,live=teams.get(id),member=live?.members.get(String(p.id));return{id,code:x.code,mode:x.mode,name:x.name,biome:x.biome,ownerId:String(x.owner_id),memberCount:Number(x.member_count||0),capacity:cap(x.mode),active,ready:!!(active&&member?.ready),status:active?(live?.status||'lobby'):'idle'};})};
 }
 async function save(t){
  if(t.status!=='ended'||t.saved||t.saving)return t.saving||Promise.resolve();
  const result=t.result;if(!result)return;
  t.saving=db.query(`INSERT INTO jump_team_scores(roster_key,mode,name,members,best_score) VALUES($1,$2,$3,$4::jsonb,$5)
   ON CONFLICT(roster_key) DO UPDATE SET name=CASE WHEN EXCLUDED.best_score>jump_team_scores.best_score THEN EXCLUDED.name ELSE jump_team_scores.name END,
   members=CASE WHEN EXCLUDED.best_score>jump_team_scores.best_score THEN EXCLUDED.members ELSE jump_team_scores.members END,
   best_score=GREATEST(jump_team_scores.best_score,EXCLUDED.best_score),
   updated_at=CASE WHEN EXCLUDED.best_score>jump_team_scores.best_score THEN NOW() ELSE jump_team_scores.updated_at END`,
   [result.key,t.mode,t.name,JSON.stringify(result.members),result.score]).then(()=>{t.saved=true;t.saveError=false;}).catch(()=>{t.saveError=true;}).finally(()=>{t.saving=null;});
  return t.saving;
 }
 function end(t,reason){
  if(t.status!=='playing')return;
  t.status='ended';t.reason=reason;t.updated=now();t.startsAt=0;t.restartAt=reason==='fall'?now()+2200:0;
  t.result={key:rosterKey(t),score:t.score,
   members:[...t.members.values()].map(m=>({id:m.id,name:m.name}))};
  t.saved=false;
  for(const m of t.members.values()){if(m.state)m.state.alive=false;m.ready=false;m.keys={};}
  void save(t);
 }
 function beginRun(t,newSeed=false){
  if(newSeed||!t.seed)t.seed=crypto.randomInt(1,2147483647);
  t.runId=crypto.randomUUID();t.score=0;t.saved=false;t.saveError=false;t.reason=null;t.result=null;
  t.status='playing';t.last=now();t.updated=now();t.startsAt=0;t.restartAt=0;
  const shared=physics.platforms(t.seed,34);let i=0;
  for(const m of t.members.values()){
   m.state=physics.create(t.seed,shared);m.state.x=physics.W/2+(i++-(t.capacity-1)/2)*26;
   m.keys={};m.seq=-1;m.seen=now();m.inputAt=now();m.ready=false;m.position=null;m.positionAt=0;
  }
 }
 function allPresent(t){return t.members.size===t.capacity&&[...t.members.values()].every(m=>m.present&&now()-m.seen<=DISCONNECT);}
 function allPresentReady(t){return allPresent(t)&&[...t.members.values()].every(m=>m.ready);}
 function maybeCountdown(t){
  if(t.status==='ended')return;
  if(allPresentReady(t)){
   if(t.status==='lobby'){t.status='countdown';t.startsAt=now()+3000;t.updated=now();}
  }else if(t.status==='countdown'){
   t.status='lobby';t.startsAt=0;t.updated=now();
  }
 }
 function advance(t){
  if(t.status!=='playing')return;
  const time=now();
  if([...t.members.values()].some(m=>!m.present||time-m.seen>DISCONNECT)){end(t,'disconnect');return;}
  let rest=Math.min(.25,Math.max(0,(time-t.last)/1000));t.last=time;
  while(rest>0&&t.status==='playing'){
   const dt=Math.min(1/60,rest);rest-=dt;
   const ms=[...t.members.values()];
   for(const m of ms){if(time-m.inputAt>700)m.keys={};physics.step(m.state,m.keys,dt);}
   for(let i=1;i<ms.length;i++){
    const a=ms[i-1].state,b=ms[i].state,dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy);
    if(dist<=LIMIT)continue;
    const pull=Math.min(170,(dist-LIMIT)*9.5),nx=dx/dist,ny=dy/dist;
    for(const [s,sign] of [[a,1],[b,-1]]){
     s.x=Math.max(8,Math.min(physics.W-8,s.x+sign*nx*pull*dt));
     s.vy+=sign*ny*pull*dt*7;
     if(Math.abs(ny)>.25){s.ground=false;s.groundPlatform=-1;s.y+=sign*ny*pull*dt;}
    }
   }
   t.score=Math.max(t.score,Math.min(...ms.map(m=>m.state.bestPlatform))*physics.SCORE_PER_PLATFORM);
   if(ms.some(m=>!m.state.alive||m.state.y<=m.state.cam-22))end(t,'fall');
  }
 }
 function tick(){
  const time=now();
  for(const t of teams.values()){
   if(t.status!=='playing'){
    for(const m of t.members.values())if(m.present&&time-m.seen>DISCONNECT){m.present=false;m.ready=false;m.state=null;if(membership.get(m.id)===t.id)membership.delete(m.id);}
   }
   if(t.status==='lobby'||t.status==='countdown'){
    maybeCountdown(t);
    if(t.status==='countdown'&&time>=t.startsAt&&allPresentReady(t))beginRun(t);
   }
   advance(t);
   if(t.status==='ended'&&!t.saved&&!t.saving&&time-(t.retryAt||0)>5000){t.retryAt=time;void save(t);}
   if(t.status==='ended'&&t.saved&&t.restartAt){
    if(!allPresent(t)){t.restartAt=0;resetLobby(t,true);}
    else if(time>=t.restartAt)beginRun(t,true);
   }
  }
 }
 function mine(p){const id=membership.get(String(p.id)),t=id&&teams.get(id);if(!t)throw fail('Entra primeiro numa das tuas equipas.',404);return t;}
 function view(t,p){
  const m=t.members.get(String(p.id));if(!m)throw fail('Já não pertences a esta equipa.',403);
  if(membership.get(String(p.id))===t.id){m.present=true;m.seen=now();}
  t.updated=now();
  const countdownMs=t.status==='countdown'?Math.max(0,t.startsAt-now()):0,restartMs=t.status==='ended'&&t.restartAt?Math.max(0,t.restartAt-now()):0;
  return{ok:true,teamId:t.id,mode:t.mode,name:t.name,code:t.code,ownerId:t.ownerId,capacity:t.capacity,biome:t.biome,seed:t.seed,runId:t.runId,status:t.status,score:t.score||0,reason:t.reason||null,saved:!!t.saved,saveError:!!t.saveError,countdownMs,restartMs,
   chainLength:LIMIT,members:[...t.members.values()].map(x=>({id:x.id,name:x.name,ready:!!x.ready,present:!!x.present,outfit:x.outfit,
    state:x.state?{...physics.publicState(x.state),...(x.position?{x:x.position.x,y:x.position.y}:{}),cam:x.state.cam,time:x.state.time,ground:x.position?.ground??x.state.ground,vy:Number.isFinite(x.position?.vy)?x.position.vy:x.state.vy,facing:x.facing||1,moving:!!(x.keys.left||x.keys.right)}:null}))};
 }
 async function enter(p,d,outfit){
  const teamId=String(d.teamId||'');if(!/^[0-9a-f-]{36}$/i.test(teamId))throw fail('Equipa inválida.');
  const check=await db.query('SELECT player_name FROM jump_team_members WHERE team_id=$1::uuid AND player_id=$2',[teamId,String(p.id)]);
  if(!check.rows[0])throw fail('Não pertences a esta equipa.',403);
  const old=membership.get(String(p.id));
  if(old&&old!==teamId)await leave(p);
  const t=await hydrate(teamId),m=t.members.get(String(p.id));
  if(!m)throw fail('Não pertences a esta equipa.',403);
  if(t.status==='ended'&&t.saved&&!t.restartAt)resetLobby(t,true);
  m.name=String(p.visualName||p.name||m.name).slice(0,32);m.outfit=outfit||m.outfit;m.present=true;m.ready=false;m.seen=now();m.inputAt=now();m.keys={};m.seq=-1;
  await db.query('UPDATE jump_team_members SET player_name=$3 WHERE team_id=$1::uuid AND player_id=$2',[teamId,String(p.id),m.name]);
  membership.set(String(p.id),teamId);
  if(!m.state)m.state=previewState(t,[...t.members.keys()].indexOf(m.id));
  maybeCountdown(t);return view(t,p);
 }
 async function create(p,d,outfit){
  if(!MODES.has(d.mode))throw fail('Modo inválido.');
  const name=String(d.name||'').trim();if(!/^[\p{L}\p{N} _-]{2,24}$/u.test(name))throw fail('Nome: 2 a 24 letras, números, espaços, _ ou -.');
  if(!BIOMES.has(d.biome))throw fail('Ambiente inválido.');
  const id=crypto.randomUUID(),code=crypto.randomBytes(6).toString('hex').toUpperCase(),playerName=String(p.visualName||p.name||'PLAYER').slice(0,32);
  await db.query('INSERT INTO jump_teams(id,code,mode,name,biome,owner_id) VALUES($1::uuid,$2,$3,$4,$5,$6)',[id,code,d.mode,name,d.biome,String(p.id)]);
  await db.query('INSERT INTO jump_team_members(team_id,player_id,player_name) VALUES($1::uuid,$2,$3)',[id,String(p.id),playerName]);
  return enter(p,{teamId:id},outfit);
 }
 async function join(p,d,outfit){
  const code=String(d.code||'').trim().toUpperCase();if(!/^[A-F0-9]{12}$/.test(code))throw fail('Convite inválido.');
  const tr=await db.query('SELECT id::text AS id,mode FROM jump_teams WHERE code=$1',[code]);const row=tr.rows[0];if(!row)throw fail('Convite inválido.',404);
  const count=await db.query('SELECT COUNT(*)::int AS count FROM jump_team_members WHERE team_id=$1::uuid',[String(row.id)]);
  const exists=await db.query('SELECT 1 FROM jump_team_members WHERE team_id=$1::uuid AND player_id=$2',[String(row.id),String(p.id)]);
  if(!exists.rows[0]&&Number(count.rows[0]?.count||0)>=cap(row.mode))throw fail('Equipa cheia.',409);
  if(!exists.rows[0]){
   const playerName=String(p.visualName||p.name||'PLAYER').slice(0,32);
   await db.query('INSERT INTO jump_team_members(team_id,player_id,player_name) VALUES($1::uuid,$2,$3)',[String(row.id),String(p.id),playerName]);
   const active=teams.get(String(row.id));if(active&&!active.members.has(String(p.id)))active.members.set(String(p.id),blankMember({player_id:String(p.id),player_name:playerName}));
  }
  return enter(p,{teamId:String(row.id)},outfit);
 }
 function state(p){tick();return view(mine(p),p);}
 function ready(p,d){
  const t=mine(p);tick();const m=t.members.get(String(p.id));if(!m.present)throw fail('Entra na sala da equipa primeiro.',409);
  if(t.status==='playing')throw fail('Partida já iniciada.',409);
  if(t.status==='ended'&&!t.saved)throw fail('A aguardar gravação da partida.',409);
  if(t.status==='ended'&&t.restartAt)return view(t,p);
  if(t.status==='ended'&&t.saved)resetLobby(t,true);
  m.ready=d.ready===true;m.seen=now();
  if(!m.ready&&t.status==='countdown'){t.status='lobby';t.startsAt=0;}
  maybeCountdown(t);return view(t,p);
 }
 function start(p){
  // Compatibility endpoint only: it cannot bypass the automatic countdown.
  const t=mine(p);tick();maybeCountdown(t);return view(t,p);
 }
 function input(p,d){
  const t=mine(p);tick();
  // A client can legitimately have one last packet in flight when a fall ends
  // the run or the automatic rematch has already created a new run. Returning
  // the authoritative current room state lets it recover immediately instead
  // of getting stuck on "Partida antiga.".
  if(t.status!=='playing'||d.runId!==t.runId)return view(t,p);
  const m=t.members.get(String(p.id));if(!m.present)throw fail('Sessão expirada.',409);
  if(!Number.isSafeInteger(d.seq)||d.seq<0)throw fail('Sequência inválida.');
  if(d.seq>m.seq){
   m.seq=d.seq;m.keys={left:d.left===true,right:d.right===true,jump:d.jump===true};m.inputAt=now();m.seen=now();if(m.keys.left!==m.keys.right)m.facing=m.keys.left?-1:1;
   // Relay the client's locally predicted pose for rendering only. The
   // authoritative physics/score still live in m.state, so this removes visual
   // rollback without making client positions authoritative for results.
   if(d.position&&Number.isFinite(d.position.x)&&Number.isFinite(d.position.y)){
    const x=Number(d.position.x),y=Number(d.position.y),stamp=now(),elapsed=Math.min(.5,Math.max(.04,(stamp-(m.positionAt||m.inputAt||stamp-60))/1000));
    const previous=m.position||m.state;
    if(x>=8&&x<=physics.W-8&&Math.abs(x-previous.x)<=190*elapsed+20&&Math.abs(y-previous.y)<=360*elapsed+28){
     m.position={x,y,vy:Number(d.position.vy)||0,ground:d.position.ground===true};m.positionAt=stamp;
    }
   }
  }
  advance(t);return view(t,p);
 }
 async function finish(p,d){
  const t=mine(p);if(d.runId!==t.runId)throw fail('Partida antiga.',409);advance(t);end(t,'leave');await save(t);return view(t,p);
 }
 async function leave(p){
  const id=membership.get(String(p.id));if(!id)return{ok:true};
  const t=teams.get(id);if(!t){membership.delete(String(p.id));return{ok:true};}
  advance(t);
  if(t.status==='playing'){end(t,'leave');await save(t);if(!t.saved)throw fail('Não foi possível guardar a partida. Tenta novamente.',503);}
  // Leaving the active team room closes that session for everybody. The
  // persistent roster remains available in AS MINHAS EQUIPAS for later.
  for(const x of t.members.values()){
   if(membership.get(x.id)===t.id)membership.delete(x.id);
   x.present=false;x.ready=false;x.keys={};x.state=null;x.seq=-1;
  }
  resetLobby(t,true);t.updated=now();
  return{ok:true,teamId:t.id,sessionClosed:true};
 }
 async function abandon(p,d={}){
  const teamId=String(d.teamId||membership.get(String(p.id))||'');if(!teamId)throw fail('Equipa inválida.');
  if(membership.get(String(p.id))===teamId)await leave(p);
  const t=teams.get(teamId)||await hydrate(teamId);
  if(!t.members.has(String(p.id)))throw fail('Não pertences a esta equipa.',403);
  const oldRosterKey=rosterKey(t);
  await db.query('DELETE FROM jump_team_members WHERE team_id=$1::uuid AND player_id=$2',[teamId,String(p.id)]);
  t.members.delete(String(p.id));
  // A ranking entry represents the current roster, not a historical lineup.
  // Removing any member invalidates the old roster score immediately.
  await db.query('DELETE FROM jump_team_scores WHERE roster_key=$1',[oldRosterKey]);
  if(!t.members.size){await db.query('DELETE FROM jump_teams WHERE id=$1::uuid',[teamId]);teams.delete(teamId);return{ok:true,deleted:true};}
  if(t.ownerId===String(p.id)){
   t.ownerId=t.members.keys().next().value;await db.query('UPDATE jump_teams SET owner_id=$2,updated_at=NOW() WHERE id=$1::uuid',[teamId,t.ownerId]);
  }
  if(t.status==='playing')end(t,'leave');
  if(t.status==='countdown'||t.status==='ended'){resetLobby(t,true);}
  for(const x of t.members.values())x.ready=false;
  return{ok:true,ownerId:t.ownerId};
 }
 async function rankings(mode,page){
  if(!MODES.has(mode))throw fail('Modo inválido.');
  const pg=Math.max(1,Math.min(10000,Math.floor(Number(page)||1)));
  const count=await db.query('SELECT COUNT(*)::int AS count FROM jump_team_scores WHERE mode=$1 AND best_score>0',[mode]);
  const rows=await db.query('SELECT name,members,best_score AS score FROM jump_team_scores WHERE mode=$1 AND best_score>0 ORDER BY best_score DESC,updated_at,roster_key LIMIT 25 OFFSET $2',[mode,(pg-1)*25]);
  const ids=[...new Set(rows.rows.flatMap(r=>(Array.isArray(r.members)?r.members:[]).map(m=>String(m.id||'')).filter(Boolean)))];
  const profiles=new Map();
  if(ids.length){
   const q=await db.query(`WITH ranked AS (
    SELECT p.id::text AS id,
      ROW_NUMBER() OVER(ORDER BY s.best_score DESC,s.updated_at ASC,p.id) AS "worldRank",
      ROW_NUMBER() OVER(PARTITION BY p.country ORDER BY s.best_score DESC,s.updated_at ASC,p.id) AS "countryRank"
    FROM jump_scores s JOIN players p ON p.id=s.player_id WHERE s.best_score>0
   )
   SELECT p.id::text AS id,p.name,p.visual_name AS "visualName",p.country,p.vip_level AS "vipLevel",
    p.letter_styles AS "letterStyles",p.name_color AS "nameColor",p.name_effect AS "nameEffect",
    p.tag_global_color AS "tagGlobalColor",p.tag_country_color AS "tagCountryColor",
    r."worldRank",r."countryRank"
   FROM players p LEFT JOIN ranked r ON r.id=p.id::text
   WHERE p.id::text=ANY($1::text[])`,[ids]);
   for(const x of q.rows){
    const styles=Array.isArray(x.letterStyles)?x.letterStyles:(()=>{try{return JSON.parse(x.letterStyles||'[]')}catch(_){return[]}})();
    profiles.set(String(x.id),{...x,worldRank:Number(x.worldRank||0)||null,countryRank:Number(x.countryRank||0)||null,vipLevel:Number(x.vipLevel||0),letterStyles:styles});
   }
  }
  return{ok:true,mode,teams:rows.rows.map((r,i)=>({...r,score:Number(r.score||0),rank:(pg-1)*25+i+1,
   members:(Array.isArray(r.members)?r.members:[]).map(m=>({...m,...(profiles.get(String(m.id))||{})}))})),page:pg,pages:Math.max(1,Math.ceil(Number(count.rows[0]?.count||0)/25))};
 }
 return{init,list,create,join,enter,leave,abandon,state,ready,start,input,finish,rankings,tick,has:p=>membership.has(String(p.id))};
}
module.exports={createService};
