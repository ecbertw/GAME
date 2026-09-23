'use strict';
// One authoritative simulation per chained team. No client-submitted scores.
const crypto=require('node:crypto');
const P=require('./jump-physics');
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
const LIMIT=110,DISCONNECT=10000,TTL=30*60*1000;
function createService({now=Date.now,physics=P}={}){
 const teams=new Map(),membership=new Map();
 let db;
 async function init(storage){
  db=storage;
  await db.query(`CREATE TABLE IF NOT EXISTS jump_team_scores(
   roster_key VARCHAR(64) PRIMARY KEY,mode VARCHAR(4) NOT NULL CHECK(mode IN ('duo','trio')),
   name VARCHAR(24) NOT NULL,members JSONB NOT NULL,best_score INTEGER NOT NULL DEFAULT 0,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await db.query('CREATE INDEX IF NOT EXISTS jump_team_rank_idx ON jump_team_scores(mode,best_score DESC,updated_at)');
 }
 function mine(p){const t=teams.get(membership.get(p.id));if(!t)throw fail('Equipa expirada. Cria ou aceita um convite.',404);return t;}
 function save(t){
  if(t.status!=='ended'||t.saved||t.saving)return t.saving||Promise.resolve();
  const result=t.result;
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
  t.status='ended';t.reason=reason;t.updated=now();
  t.result={key:crypto.createHash('sha256').update(t.mode+':'+[...t.members.keys()].sort().join(':')).digest('hex'),score:t.score,
   members:[...t.members.values()].map(m=>({id:m.id,name:m.name}))};
  for(const m of t.members.values()){m.state.alive=false;m.ready=false;}
  void save(t);
 }
 function advance(t){
  if(t.status!=='playing')return;
  const time=now();
  if([...t.members.values()].some(m=>time-m.seen>DISCONNECT)){end(t,'disconnect');return;}
  let rest=Math.min(.25,Math.max(0,(time-t.last)/1000));t.last=time;
  while(rest>0&&t.status==='playing'){
   const dt=Math.min(1/60,rest);rest-=dt;
   const ms=[...t.members.values()];
   for(const m of ms){if(time-m.inputAt>700)m.keys={};physics.step(m.state,m.keys,dt);}
   // Adjacent members form a chain. Slack permits jumping; tension pulls both ends.
   for(let i=1;i<ms.length;i++){
    const a=ms[i-1].state,b=ms[i].state,dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy);
    if(dist<=LIMIT)continue;
    const pull=Math.min(160,(dist-LIMIT)*9),nx=dx/dist,ny=dy/dist;
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
  for(const t of teams.values()){
   advance(t);
   if(t.status==='ended'&&!t.saved&&!t.saving&&now()-(t.retryAt||0)>5000){t.retryAt=now();void save(t);}
   if(now()-t.updated>TTL&&t.status!=='playing'&&(t.status!=='ended'||t.saved)){
    for(const id of t.members.keys())if(membership.get(id)===t.id)membership.delete(id);
    teams.delete(t.id);
   }
  }
 }
 function member(p,outfit){return{id:p.id,name:p.visualName||p.name,outfit,ready:false,seen:now(),inputAt:now(),keys:{},seq:-1};}
 function view(t,p){
  const m=t.members.get(p.id);m.seen=now();t.updated=now();
  return {ok:true,teamId:t.id,mode:t.mode,name:t.name,code:t.code,ownerId:t.ownerId,capacity:t.capacity,
   biome:t.biome,seed:t.seed,runId:t.runId,status:t.status,score:t.score||0,reason:t.reason||null,saved:!!t.saved,saveError:!!t.saveError,
   chainLength:LIMIT,members:[...t.members.values()].map(x=>({id:x.id,name:x.name,ready:x.ready,outfit:x.outfit,
    state:x.state?{...physics.publicState(x.state),cam:x.state.cam,time:x.state.time,ground:x.state.ground,facing:x.facing||1,moving:!!(x.keys.left||x.keys.right)}:null}))};
 }
 async function leave(p){
  const t=teams.get(membership.get(p.id));if(!t)return{ok:true};
  advance(t);end(t,'leave');await save(t);
  if(t.status==='ended'&&!t.saved)throw fail('Não foi possível guardar. Tenta sair novamente.',503);
  t.members.delete(p.id);membership.delete(p.id);
  if(t.ownerId===p.id)t.ownerId=t.members.keys().next().value;
  if(!t.members.size)teams.delete(t.id);
  return{ok:true};
 }
 function create(p,d,outfit){
  tick();if(membership.has(p.id))throw fail('Sai da equipa atual primeiro.',409);
  if(!['duo','trio'].includes(d.mode))throw fail('Modo inválido.');
  const name=String(d.name||'').trim();
  if(!/^[\p{L}\p{N} _-]{2,24}$/u.test(name))throw fail('Nome: 2 a 24 letras, números, espaços, _ ou -.');
  if(!['city','forest','desert','snow'].includes(d.biome))throw fail('Ambiente inválido.');
  const t={id:crypto.randomUUID(),mode:d.mode,name,biome:d.biome,capacity:d.mode==='duo'?2:3,ownerId:p.id,
   code:crypto.randomBytes(6).toString('hex').toUpperCase(),members:new Map([[p.id,member(p,outfit)]]),status:'lobby',updated:now(),inviteExpires:now()+TTL};
  teams.set(t.id,t);membership.set(p.id,t.id);return view(t,p);
 }
 function join(p,d,outfit){
  tick();const code=String(d.code||'').trim().toUpperCase();
  if(!/^[A-F0-9]{12}$/.test(code))throw fail('Convite inválido.');
  const t=[...teams.values()].find(t=>t.code===code&&t.inviteExpires>now());
  if(!t)throw fail('Convite inválido ou expirado.',404);
  if(membership.get(p.id)===t.id)return view(t,p);
  if(membership.has(p.id))throw fail('Sai da equipa atual primeiro.',409);
  if(t.status==='playing'||t.members.size>=t.capacity)throw fail('Equipa cheia ou em jogo.',409);
  if(t.status==='ended'&&!t.saved)throw fail('A aguardar gravação da partida.',409);
  t.members.set(p.id,member(p,outfit));membership.set(p.id,t.id);
  for(const m of t.members.values())m.ready=false;
  return view(t,p);
 }
 function state(p){tick();return view(mine(p),p);}
 function ready(p,d){const t=mine(p);if(t.status==='playing')throw fail('Partida já iniciada.',409);t.members.get(p.id).ready=d.ready===true;return view(t,p);}
 function start(p){
  const t=mine(p);tick();
  if(t.ownerId!==p.id)throw fail('Só o líder pode iniciar.',403);
  if(t.status==='playing'||(t.status==='ended'&&!t.saved))throw fail('Partida em curso ou por guardar.',409);
  if(t.members.size!==t.capacity||[...t.members.values()].some(m=>!m.ready||now()-m.seen>DISCONNECT))throw fail('Todos os membros têm de estar presentes e prontos.',409);
  t.seed=crypto.randomInt(1,2147483647);t.runId=crypto.randomUUID();t.score=0;t.saved=false;t.saveError=false;t.reason=null;t.result=null;
  t.status='playing';t.last=now();t.updated=now();
  const platforms=physics.platforms(t.seed,30);
  let i=0;for(const m of t.members.values()){m.state=physics.create(t.seed,platforms);m.state.x=physics.W/2+(i++-(t.capacity-1)/2)*26;m.keys={};m.seq=-1;m.seen=now();m.inputAt=now();}
  return view(t,p);
 }
 function input(p,d){
  const t=mine(p);advance(t);
  if(d.runId!==t.runId)throw fail('Partida antiga.',409);
  const m=t.members.get(p.id);
  if(!Number.isSafeInteger(d.seq)||d.seq<0)throw fail('Sequência inválida.');
  if(d.seq>m.seq&&t.status==='playing'){m.seq=d.seq;m.keys={left:d.left===true,right:d.right===true,jump:d.jump===true};m.inputAt=now();if(m.keys.left!==m.keys.right)m.facing=m.keys.left?-1:1;}
  return view(t,p);
 }
 async function finish(p,d){const t=mine(p);if(d.runId!==t.runId)throw fail('Partida antiga.',409);advance(t);end(t,'leave');await save(t);return view(t,p);}
 async function rankings(mode,page){
  if(!['duo','trio'].includes(mode))throw fail('Modo inválido.');
  const pg=Math.max(1,Math.min(10000,Math.floor(Number(page)||1)));
  const count=await db.query('SELECT COUNT(*)::int AS count FROM jump_team_scores WHERE mode=$1 AND best_score>0',[mode]);
  const rows=await db.query('SELECT name,members,best_score AS score FROM jump_team_scores WHERE mode=$1 AND best_score>0 ORDER BY best_score DESC,updated_at,roster_key LIMIT 25 OFFSET $2',[mode,(pg-1)*25]);
  return{ok:true,mode,teams:rows.rows.map((r,i)=>({...r,rank:(pg-1)*25+i+1})),page:pg,pages:Math.max(1,Math.ceil(Number(count.rows[0]?.count||0)/25))};
 }
 return{init,create,join,leave,state,ready,start,input,finish,rankings,tick,has:p=>membership.has(p.id)};
}
module.exports={createService};
