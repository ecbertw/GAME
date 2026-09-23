'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createService}=require('../jump-team-server'),P=require('../jump-physics'),J=require('../jump-server');
const users=Array.from({length:7},(_,i)=>({id:'player-'+i,name:'P'+i}));

function memoryDb(){
 const teams=new Map(),members=new Map(),scores=new Map(),writes=[];
 const teamMembers=id=>[...(members.get(id)||new Map()).values()];
 return{writes,teams,members,scores,async query(sql,args=[]){
  const q=String(sql).replace(/\s+/g,' ').trim();writes.push({sql:q,args});
  if(/^(CREATE|ALTER) |^CREATE INDEX/.test(q))return{rows:[],rowCount:0};
  if(q.startsWith('INSERT INTO jump_teams(')){
   const [id,code,mode,name,biome,ownerId]=args;teams.set(String(id),{id:String(id),code,mode,name,biome,owner_id:String(ownerId),updated_at:Date.now(),created_at:Date.now()});return{rows:[],rowCount:1};
  }
  if(q.startsWith('INSERT INTO jump_team_members(')){
   const [teamId,playerId,playerName]=args,id=String(teamId),pid=String(playerId);if(!members.has(id))members.set(id,new Map());members.get(id).set(pid,{player_id:pid,player_name:playerName,joined_at:Date.now()});return{rows:[],rowCount:1};
  }
  if(q.startsWith('SELECT id::text AS id,code,mode,name,biome,owner_id FROM jump_teams WHERE id=')){
   const t=teams.get(String(args[0]));return{rows:t?[{...t}]:[]};
  }
  if(q.startsWith('SELECT player_id,player_name FROM jump_team_members WHERE team_id='))return{rows:teamMembers(String(args[0]))};
  if(q.startsWith('SELECT player_name FROM jump_team_members WHERE team_id=')){
   const m=members.get(String(args[0]))?.get(String(args[1]));return{rows:m?[{player_name:m.player_name}]:[]};
  }
  if(q.startsWith('UPDATE jump_team_members SET player_name=')){
   const m=members.get(String(args[0]))?.get(String(args[1]));if(m)m.player_name=args[2];return{rows:[],rowCount:m?1:0};
  }
  if(q.startsWith('SELECT id::text AS id,mode FROM jump_teams WHERE code=')){
   const t=[...teams.values()].find(x=>x.code===args[0]);return{rows:t?[{id:t.id,mode:t.mode}]:[]};
  }
  if(q.startsWith('SELECT COUNT(*)::int AS count FROM jump_team_members WHERE team_id='))return{rows:[{count:teamMembers(String(args[0])).length}]};
  if(q.startsWith('SELECT 1 FROM jump_team_members WHERE team_id=')){
   const m=members.get(String(args[0]))?.get(String(args[1]));return{rows:m?[{one:1}]:[]};
  }
  if(q.startsWith('DELETE FROM jump_team_scores WHERE roster_key=')){const ok=scores.delete(String(args[0]));return{rows:[],rowCount:ok?1:0};}
  if(q.startsWith('DELETE FROM jump_team_members WHERE team_id=')){
   const ok=members.get(String(args[0]))?.delete(String(args[1]));return{rows:[],rowCount:ok?1:0};
  }
  if(q.startsWith('DELETE FROM jump_teams WHERE id=')){teams.delete(String(args[0]));members.delete(String(args[0]));return{rows:[],rowCount:1};}
  if(q.startsWith('UPDATE jump_teams SET owner_id=')){const t=teams.get(String(args[0]));if(t)t.owner_id=String(args[1]);return{rows:[],rowCount:t?1:0};}
  if(q.includes('FROM jump_team_members mine')){
   const [playerId,mode]=args,rows=[];for(const t of teams.values()){if(t.mode!==mode||!members.get(t.id)?.has(String(playerId)))continue;rows.push({id:t.id,code:t.code,mode:t.mode,name:t.name,biome:t.biome,owner_id:t.owner_id,member_count:teamMembers(t.id).length});}return{rows};
  }
  if(q.startsWith('INSERT INTO jump_team_scores(')){
   const [key,mode,name,json,score]=args,old=scores.get(key),parsed=JSON.parse(json);if(!old||Number(score)>old.best_score)scores.set(key,{roster_key:key,mode,name,members:parsed,best_score:Number(score),updated_at:Date.now()});return{rows:[],rowCount:1};
  }
  if(q.startsWith('SELECT COUNT(*)::int AS count FROM jump_team_scores WHERE mode='))return{rows:[{count:[...scores.values()].filter(x=>x.mode===args[0]&&x.best_score>0).length}]};
  if(q.startsWith('SELECT name,members,best_score AS score FROM jump_team_scores WHERE mode=')){
   const rows=[...scores.values()].filter(x=>x.mode===args[0]&&x.best_score>0).sort((a,b)=>b.best_score-a.best_score).slice(Number(args[1]||0),Number(args[1]||0)+25).map(x=>({name:x.name,members:x.members,score:x.best_score}));return{rows};
  }
  if(q.includes('FROM players p LEFT JOIN ranked r ON r.id=p.id::text')){
   const ids=args[0]||[];return{rows:ids.map((id,i)=>({id:String(id),name:'P'+i,visualName:'P'+i,country:'PT',vipLevel:i===0?2:0,letterStyles:[],nameColor:i===0?'#ff0000':'#ffffff',nameEffect:'none',tagGlobalColor:'#e53935',tagCountryColor:'#ff7a2f',worldRank:i+1,countryRank:i+1}))};
  }
  throw new Error('Unhandled SQL in test: '+q);
 }};
}
async function fixture(physics=P){
 let clock=1000,broken=false;const mem=memoryDb(),rawQuery=mem.query.bind(mem);
 const db={...mem,query:async(sql,args)=>{if(broken&&String(sql).includes('jump_team_scores'))throw Error('offline');return rawQuery(sql,args);}};
 const service=createService({now:()=>clock,physics});await service.init(db);
 const create=async(mode='duo')=>service.create(users[0],{mode,name:'Pixel Crew',biome:'city'},J.DEFAULTS);
 const fill=async(mode='duo')=>{const out=await create(mode);for(let i=1;i<out.capacity;i++)await service.join(users[i],{code:out.code},J.DEFAULTS);for(let i=0;i<out.capacity;i++)service.ready(users[i],{ready:true});clock+=3100;service.tick();return service.state(users[0]);};
 return{service,create,fill,db,advance:ms=>{clock+=ms;service.tick();},breakDb:v=>broken=v};
}

test('persistent roster, room re-entry and automatic READY countdown',async()=>{
 const f=await fixture(),s=f.service,t=await f.create('trio');
 await s.join(users[1],{code:t.code},J.DEFAULTS);await s.join(users[2],{code:t.code},J.DEFAULTS);
 s.ready(users[0],{ready:true});s.ready(users[1],{ready:true});let out=s.ready(users[2],{ready:true});
 assert.equal(out.status,'countdown');assert.ok(out.countdownMs>0);
 f.advance(3100);out=s.state(users[0]);assert.equal(out.status,'playing');assert.ok(out.runId);
 await s.leave(users[0]);assert.throws(()=>s.state(users[0]),/Entra primeiro/);
 const listed=await s.list(users[0],'trio');assert.equal(listed.teams.length,1);assert.equal(listed.teams[0].name,'Pixel Crew');
 out=await s.enter(users[0],{teamId:t.teamId},J.DEFAULTS);assert.equal(out.status,'lobby','re-entering a saved roster returns to a fresh waiting room');
});

test('team cannot start until the complete roster is present and ready',async()=>{
 const f=await fixture(),s=f.service,t=await f.create();
 s.ready(users[0],{ready:true});f.advance(3500);assert.equal(s.state(users[0]).status,'lobby');
 await s.join(users[1],{code:t.code},J.DEFAULTS);let out=s.ready(users[1],{ready:true});
 assert.equal(out.status,'countdown');f.advance(3100);assert.equal(s.state(users[0]).status,'playing');
});

test('team progression ignores submitted scores and stale packets recover current state',async()=>{
 const f=await fixture(),s=f.service,t=await f.fill();
 const out=s.input(users[0],{runId:t.runId,seq:1,platform:99999,score:99999});assert.equal(out.score,0);
 const stale=s.input(users[0],{runId:'old',seq:2});assert.equal(stale.runId,t.runId);assert.equal(stale.status,'playing');
 assert.throws(()=>s.input(users[4],{runId:t.runId,seq:2}),/Entra primeiro/);
 s.input(users[0],{runId:t.runId,seq:3,right:true});s.input(users[0],{runId:t.runId,seq:2,left:true});
 f.advance(100);assert.ok(s.state(users[0]).members.find(x=>x.id===users[0].id).state.x>199);
});

test('one disconnected member ends the shared session and never writes individual rankings',async()=>{
 const f=await fixture(),s=f.service;await f.fill();f.advance(10001);
 await new Promise(resolve=>setImmediate(resolve));
 assert.throws(()=>s.state(users[0]),/Entra primeiro/);
 const scoreWrites=f.db.writes.filter(w=>w.sql.startsWith('INSERT INTO jump_team_scores'));
 assert.equal(scoreWrites.length,1);assert.ok(f.db.writes.every(w=>!w.sql.includes('INSERT INTO jump_scores')&&!w.sql.includes('UPDATE players')));
});

test('joint score uses slowest member; one fall ends all and saves once',async()=>{
 const physics={...P,step(s,k){if(k.right)s.bestPlatform=4;if(k.jump)s.bestPlatform=2;if(k.left)s.alive=false;return s;}};
 const f=await fixture(physics),s=f.service,t=await f.fill('trio');
 s.input(users[0],{runId:t.runId,seq:0,right:true});s.input(users[1],{runId:t.runId,seq:0,right:true});f.advance(100);assert.equal(s.state(users[0]).score,0);
 s.input(users[2],{runId:t.runId,seq:0,jump:true});f.advance(100);assert.equal(s.state(users[0]).score,24);
 s.input(users[1],{runId:t.runId,seq:1,left:true});f.advance(20);
 const out=s.state(users[0]);assert.equal(out.reason,'fall');assert.equal(out.score,24);
 await Promise.all(users.slice(0,3).map(p=>s.finish(p,{runId:t.runId})));
 assert.equal(f.db.writes.filter(w=>w.sql.startsWith('INSERT INTO jump_team_scores')).length,1);
});

test('a fall auto-starts a fresh run when the full team stays present',async()=>{
 const physics={...P,step(s,k){if(k.left)s.alive=false;return s;}};
 const f=await fixture(physics),s=f.service,t=await f.fill();
 s.input(users[0],{runId:t.runId,seq:0,left:true});f.advance(20);
 let ended=s.state(users[0]);assert.equal(ended.status,'ended');assert.ok(ended.restartMs>0);
 await new Promise(resolve=>setImmediate(resolve));
 const oldRun=ended.runId,oldSeed=ended.seed;f.advance(2300);
 const next=s.state(users[0]);assert.equal(next.status,'playing');assert.notEqual(next.runId,oldRun);assert.notEqual(next.seed,oldSeed);
});

test('leaving an active room closes the session for every teammate but keeps the roster',async()=>{
 const f=await fixture(),s=f.service,t=await f.fill();
 await s.leave(users[0]);
 assert.throws(()=>s.state(users[1]),/Entra primeiro/);
 assert.equal((await s.list(users[0],'duo')).teams.length,1);
 assert.equal((await s.list(users[1],'duo')).teams.length,1);
});

test('team rankings enrich member names with the same profile and rank tags data',async()=>{
 const physics={...P,step(s){s.bestPlatform=2;return s;}};
 const f=await fixture(physics),s=f.service,t=await f.fill();
 // Controlled progress writes one team result; the mock profile query supplies rank styling.
 s.input(users[0],{runId:t.runId,seq:0});s.input(users[1],{runId:t.runId,seq:0});f.advance(100);
 await s.finish(users[0],{runId:t.runId});
 const out=await s.rankings('duo',1);assert.equal(out.teams.length,1);
 assert.equal(out.teams[0].members[0].country,'PT');assert.equal(out.teams[0].members[0].worldRank,1);
 assert.ok('nameColor' in out.teams[0].members[0]);
});

test('taut chain pulls both endpoints, slack does not move a stationary team',async()=>{
 const stationary={...P,step:s=>s};const f=await fixture(stationary),s=f.service;await f.fill();f.advance(100);const a=s.state(users[0]).members.map(x=>x.state.x);
 assert.ok(Math.abs(a[0]-212)<=1);
 const stretched={...P,step(s,k){if(k.right&&!s.stretched){s.x=400;s.stretched=true;}return s;}};
 const g=await fixture(stretched),v=g.service,r=await g.fill();v.input(users[1],{runId:r.runId,seq:0,right:true});g.advance(100);
 const ms=v.state(users[0]).members;assert.ok(ms[0].state.x>212);assert.ok(ms[1].state.x<400);
});

test('save failures block rematch until retry succeeds',async()=>{
 const f=await fixture(),s=f.service,t=await f.fill();f.breakDb(true);
 let out=await s.finish(users[0],{runId:t.runId});assert.equal(out.saveError,true);assert.equal(out.saved,false);
 assert.throws(()=>s.ready(users[0],{ready:true}),/guardar/);
 f.breakDb(false);out=await s.finish(users[0],{runId:t.runId});assert.equal(out.saved,true);
});

test('leaving keeps membership; abandoning transfers ownership and removes the old roster from TOP',async()=>{
 const physics={...P,step(s){s.bestPlatform=2;return s;}};
 const f=await fixture(physics),s=f.service,t=await f.fill();
 s.input(users[0],{runId:t.runId,seq:0});s.input(users[1],{runId:t.runId,seq:0});f.advance(100);
 await s.finish(users[0],{runId:t.runId});
 assert.equal((await s.rankings('duo',1)).teams.length,1);
 await s.leave(users[0]);assert.equal((await s.list(users[0],'duo')).teams.length,1);
 await s.abandon(users[0],{teamId:t.teamId});assert.equal((await s.list(users[0],'duo')).teams.length,0);
 assert.equal((await s.rankings('duo',1)).teams.length,0,'old roster score must disappear as soon as one member abandons');
 const listed=await s.list(users[1],'duo');assert.equal(listed.teams[0].ownerId,users[1].id);
 await s.abandon(users[1],{teamId:t.teamId});assert.equal(f.db.teams.has(t.teamId),false,'empty persistent teams are deleted');
});

test('invalid team data and full rosters are rejected',async()=>{
 const f=await fixture(),s=f.service,t=await f.create();
 assert.rejects(()=>s.join(users[1],{code:'invalid'}),/inválido/);
 await s.join(users[1],{code:t.code},J.DEFAULTS);
 await assert.rejects(()=>s.join(users[2],{code:t.code},J.DEFAULTS),/cheia/);
 await assert.rejects(()=>s.create(users[3],{mode:'quad',name:'Ab',biome:'city'},J.DEFAULTS),/Modo/);
 await assert.rejects(()=>s.create(users[3],{mode:'duo',name:'<script>',biome:'city'},J.DEFAULTS),/Nome/);
});

test('simultaneous public starts never exceed five members and share world clock',async()=>{
 const db={query:async()=>({rows:[]})};
 const players=Array.from({length:16},(_,i)=>({id:'concurrent-'+i,name:'C'+i}));
 const starts=await Promise.all(players.map(p=>J.start(db,p,{mode:'online',biome:'desert'})));
 const ids=[...new Set(starts.map(x=>x.instanceId))];assert.deepEqual(ids.map(id=>starts.filter(x=>x.instanceId===id).length),[5,5,5,1]);
 for(const id of ids)assert.equal(new Set(starts.filter(x=>x.instanceId===id).map(x=>x.seed)).size,1);
 for(const p of players)J.leave(p);
});
