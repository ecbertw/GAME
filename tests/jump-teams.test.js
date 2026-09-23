'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createService}=require('../jump-team-server'),P=require('../jump-physics'),J=require('../jump-server');
const users=Array.from({length:7},(_,i)=>({id:'player-'+i,name:'P'+i}));
async function fixture(physics=P){
 let clock=1000,broken=false;const writes=[];
 const service=createService({now:()=>clock,physics});
 await service.init({query:async(sql,args)=>{if(broken)throw Error('offline');writes.push({sql,args});return{rows:sql.includes('COUNT')?[{count:0}]:[]};}});
 const create=(mode='duo')=>service.create(users[0],{mode,name:'Pixel Crew',biome:'city'},J.DEFAULTS);
 const fill=(mode='duo')=>{const out=create(mode);for(let i=1;i<out.capacity;i++)service.join(users[i],{code:out.code},J.DEFAULTS);for(let i=0;i<out.capacity;i++)service.ready(users[i],{ready:true});return service.start(users[0]);};
 return{service,create,fill,writes,advance:ms=>{clock+=ms;service.tick();},breakDb:v=>broken=v};
}
test('invites, exact roster, readiness and owner-only start',async()=>{
 const f=await fixture(),s=f.service,t=f.create('trio');
 assert.throws(()=>s.start(users[0]),/prontos/);
 assert.throws(()=>s.join(users[1],{code:'invalid'}),/inválido/);
 s.join(users[1],{code:t.code});s.join(users[2],{code:t.code});
 assert.throws(()=>s.join(users[3],{code:t.code}),/cheia/);
 for(let i=0;i<3;i++)s.ready(users[i],{ready:true});
 assert.throws(()=>s.start(users[1]),/líder/);
 const run=s.start(users[0]);assert.equal(run.members.length,3);assert.equal(run.status,'playing');
 assert.equal(new Set(run.members.map(m=>m.state.time)).size,1);
 assert.throws(()=>s.create(users[0],{mode:'duo',name:'Other',biome:'city'}),/atual/);
});
test('team progression ignores submitted scores and rejects stale runs',async()=>{
 const f=await fixture(),s=f.service,t=f.fill();
 const out=s.input(users[0],{runId:t.runId,seq:1,platform:99999,score:99999});assert.equal(out.score,0);
 assert.throws(()=>s.input(users[0],{runId:'old',seq:2}),/antiga/);
 assert.throws(()=>s.input(users[4],{runId:t.runId,seq:2}),/expirada/);
 s.input(users[0],{runId:t.runId,seq:3,right:true});s.input(users[0],{runId:t.runId,seq:2,left:true});
 f.advance(100);assert.ok(s.state(users[0]).members[0].state.x>212);
});
test('one disconnected member ends everyone and never writes individual rankings',async()=>{
 const f=await fixture(),s=f.service;f.fill();f.advance(10001);
 const out=s.state(users[0]);assert.equal(out.status,'ended');assert.equal(out.reason,'disconnect');
 assert.ok(out.members.every(m=>!m.state.alive));await s.finish(users[0],{runId:out.runId});
 assert.equal(f.writes.filter(w=>w.sql.startsWith('INSERT')).length,1);
 assert.ok(f.writes.every(w=>!w.sql.includes('INSERT INTO jump_scores')&&!w.sql.includes('UPDATE players')));
});
test('joint score uses slowest member; one fall ends all and saves once',async()=>{
 // Controlled landings isolate team rules from the separately tested jump integrator.
 const physics={...P,step(s,k){if(k.right)s.bestPlatform=4;if(k.jump)s.bestPlatform=2;if(k.left)s.alive=false;return s;}};
 const f=await fixture(physics),s=f.service,t=f.fill('trio');
 s.input(users[0],{runId:t.runId,seq:0,right:true});s.input(users[1],{runId:t.runId,seq:0,right:true});
 f.advance(100);assert.equal(s.state(users[0]).score,0);
 s.input(users[2],{runId:t.runId,seq:0,jump:true});f.advance(100);assert.equal(s.state(users[0]).score,24);
 s.input(users[1],{runId:t.runId,seq:1,left:true});f.advance(20);
 const out=s.state(users[0]);assert.equal(out.reason,'fall');assert.equal(out.score,24);assert.ok(out.members.every(m=>!m.state.alive));
 await Promise.all(users.slice(0,3).map(p=>s.finish(p,{runId:t.runId})));
 assert.equal(f.writes.filter(w=>w.sql.startsWith('INSERT')).length,1);
 assert.equal(f.writes.find(w=>w.sql.startsWith('INSERT')).args[1],'trio');
});
test('taut chain pulls both endpoints, slack does not move a stationary team',async()=>{
 const stationary={...P,step:s=>s};const f=await fixture(stationary),s=f.service,t=f.fill();
 f.advance(100);assert.equal(s.state(users[0]).members[0].state.x,212);
 const stretched={...P,step(s,k){if(k.right&&!s.stretched){s.x=400;s.stretched=true;}return s;}};
 const g=await fixture(stretched),v=g.service,r=g.fill();v.input(users[1],{runId:r.runId,seq:0,right:true});g.advance(100);
 const ms=v.state(users[0]).members;assert.ok(ms[0].state.x>212);assert.ok(ms[1].state.x<400);
});
test('save failures retain result and block rematch until retry succeeds',async()=>{
 const f=await fixture(),s=f.service,t=f.fill();f.breakDb(true);
 let out=await s.finish(users[0],{runId:t.runId});assert.equal(out.saveError,true);assert.equal(out.saved,false);
 s.ready(users[0],{ready:true});s.ready(users[1],{ready:true});assert.throws(()=>s.start(users[0]),/guardar/);
 f.breakDb(false);out=await s.finish(users[0],{runId:t.runId});assert.equal(out.saved,true);
 const next=s.start(users[0]);assert.notEqual(next.runId,t.runId);
});
test('leaving fails the team, transfers leader and requires fresh readiness',async()=>{
 const f=await fixture(),s=f.service,t=f.fill();await s.leave(users[0]);
 let out=s.state(users[1]);assert.equal(out.status,'ended');assert.equal(out.ownerId,users[1].id);assert.equal(out.members.length,1);
 s.join(users[2],{code:t.code});out=s.state(users[1]);assert.ok(out.members.every(m=>!m.ready));
 assert.throws(()=>s.start(users[1]),/prontos/);
});
test('lobby invitations expire and invalid modes/names cannot create teams',async()=>{
 const f=await fixture(),s=f.service,t=f.create();f.advance(1800001);
 assert.throws(()=>s.join(users[1],{code:t.code}),/expirado/);
 assert.throws(()=>s.create(users[0],{mode:'quad',name:'Ab',biome:'city'}),/Modo/);
 assert.throws(()=>s.create(users[0],{mode:'duo',name:'<script>',biome:'city'}),/Nome/);
});
test('simultaneous public starts never exceed five members and share world clock',async()=>{
 const db={query:async()=>({rows:[]})};
 const players=Array.from({length:16},(_,i)=>({id:'concurrent-'+i,name:'C'+i}));
 const starts=await Promise.all(players.map(p=>J.start(db,p,{mode:'online',biome:'desert'})));
 const ids=[...new Set(starts.map(x=>x.instanceId))];assert.deepEqual(ids.map(id=>starts.filter(x=>x.instanceId===id).length),[5,5,5,1]);
 for(const id of ids)assert.equal(new Set(starts.filter(x=>x.instanceId===id).map(x=>x.seed)).size,1);
 for(const p of players)J.leave(p);
});


