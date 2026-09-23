'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const P=require('../jump-physics');
const J=require('../jump-server');
const db={query:async sql=>{
  if(sql.includes('SELECT colors FROM jump_cosmetics'))return{rows:[]};
  return{rows:[],rowCount:0};
}};
test('platform generation is deterministic and continues beyond initial section',()=>{
  assert.deepEqual(P.platforms(42,100),P.platforms(42,100));
  const s=P.create(42),first=s.platforms.length;
  s.best=s.platforms[first-1].y-100;
  P.step(s,{left:false,right:false,jump:false},1/60);
  assert.ok(s.platforms.length>first);
  assert.ok(s.platforms.at(-1).y>s.platforms[first-1].y);
});
test('jumping, walking and collision run without browser globals',()=>{
 const s=P.create(42);
 for(let i=0;i<260;i++){
   const above=s.platforms.find(p=>p.y>s.y+1)||s.platforms[1],t=above.x+above.w/2;
   const jump=(i%55)===0;
   P.step(s,{left:s.x>t+3,right:s.x<t-3,jump},1/60);
   if(!s.alive)break;
 }
 assert.ok(s.best>=30,'player must be able to clear the first jump');
});
test('generated JUMP difficulty increases but adjacent platforms remain physically plausible',()=>{
 const ps=P.platforms(73,120);
 assert.ok(ps[8].w>ps[80].w,'later platforms should be narrower');
 for(let i=1;i<ps.length;i++){
   assert.ok(ps[i].y-ps[i-1].y<=50,'vertical gap must remain within jump envelope');
   const a=ps[i-1].x+ps[i-1].w/2,b=ps[i].x+ps[i].w/2;
   assert.ok(Math.abs(a-b)<155,'horizontal shift must remain reachable');
 }
});
test('holding W/Space produces one jump until the key is released',()=>{
 const s=P.create(9);s.x=8;
 for(let i=0;i<180;i++)P.step(s,{left:false,right:false,jump:true},1/60);
 assert.ok(s.y<2,'holding jump must not repeatedly auto-jump');
 P.step(s,{left:false,right:false,jump:false},1/60);
 P.step(s,{left:false,right:false,jump:true},1/60);
 assert.ok(s.vy>0,'a fresh press starts another jump');
});
test('public instances autospawn at five players per biome; slots are reusable',async()=>{
 const starts=[];
 const users=Array.from({length:13},(_,i)=>({id:'jump-test-forest-'+i,name:'J'+i,country:'PT'}));
 for(const u of users)starts.push(await J.start(db,u,{biome:'forest',multiplayer:true}));
 const sizes=[...new Set(starts.map(x=>x.instanceId))].map(id=>starts.filter(x=>x.instanceId===id).length);
 assert.deepEqual(sizes,[5,5,3]);
 const first=J.input(users[0],{runId:starts[0].runId,left:false,right:false,jumpSeq:0});
 assert.equal(first.peers.length,4);
 assert.ok(first.peers.every(p=>users.slice(0,5).some(u=>u.id===p.id)));
 const city=await J.start(db,{id:'jump-test-city',name:'C',country:'PT'},{biome:'city',multiplayer:true});
 assert.notEqual(city.instanceId,starts[0].instanceId);
 J.leave(users[0]);
 const newUser=await J.start(db,{id:'jump-test-new',name:'N',country:'PT'},{biome:'forest',multiplayer:true});
 assert.equal(newUser.instanceId,starts[0].instanceId);
 for(const u of users)J.leave(u);
 J.leave({id:'jump-test-city'});J.leave({id:'jump-test-new'});
});
test('cosmetic colors must come from the approved EIXO palette',()=>{
 assert.ok(J.PALETTE.includes(J.DEFAULTS.skin));
 assert.rejects(()=>J.saveColors(db,{id:'test'},{colors:{skin:'url(javascript:alert(1))'}}),/Cor inválida/);
});

test('server accepts monotonic jump taps and rejects sequence rollback',async()=>{
 const player={id:'jump-sync-player',name:'SYNC',country:'PT'};
 const started=await J.start(db,player,{biome:'forest',multiplayer:false});
 J.input(player,{runId:started.runId,left:false,right:false,jumpSeq:1});
 await new Promise(resolve=>setTimeout(resolve,35));
 const out=J.input(player,{runId:started.runId,left:false,right:false,jumpSeq:1});
 assert.ok(out.state.y>0,'authoritative server must register the jump');
 assert.throws(()=>J.input(player,{runId:started.runId,left:false,right:false,jumpSeq:0}),/Controlo de salto inválido/);
 J.leave(player);
});
test('JUMP browser code never overwrites local position from a network snapshot',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const js=fs.readFileSync(path.join(__dirname,'../jump.js'),'utf8');
 assert.doesNotMatch(js,/local\.y\s*=\s*out\.state\.y/);
 assert.match(js,/code==='KeyW'\|\|code==='Space'/);
 assert.match(js,/code==='KeyA'/);
 assert.match(js,/code==='KeyD'/);
 assert.match(js,/\/api\/jump\/rankings/);
 assert.match(js,/room-create-panel/);
 assert.match(js,/room-card/);
 assert.match(js,/room-board-heading/);
});
