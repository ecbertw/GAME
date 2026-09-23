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
 for(let i=0;i<120;i++){
   const t=s.platforms[1].x+s.platforms[1].w/2;
   P.step(s,{left:s.x>t+3,right:s.x<t-3,jump:true},1/60);
   if(!s.alive)break;
 }
 assert.ok(s.best>=40,'player must be able to clear early platforms');
});
test('public instances autospawn at five players per biome; slots are reusable',async()=>{
 const starts=[];
 const users=Array.from({length:13},(_,i)=>({id:'jump-test-forest-'+i,name:'J'+i,country:'PT'}));
 for(const u of users)starts.push(await J.start(db,u,{biome:'forest',multiplayer:true}));
 const sizes=[...new Set(starts.map(x=>x.instanceId))].map(id=>starts.filter(x=>x.instanceId===id).length);
 assert.deepEqual(sizes,[5,5,3]);
 const first=J.input(users[0],{runId:starts[0].runId,left:false,right:false,jump:false});
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

test('holding Space does not trigger repeated jumps on every landing',()=>{
  const p=P.create(17);p.x=8; // Upper platforms cannot land under the far-left edge.
  for(let i=0;i<240;i++)P.step(p,{left:false,right:false,jump:true},1/60);
  assert.equal(p.y,0,'holding the key must not automatically jump again after landing');
  P.step(p,{left:false,right:false,jump:false},1/60);
  P.step(p,{left:false,right:false,jump:true},1/60);
  assert.ok(p.y>0,'a new key press must start a new jump');
});
test('server keeps short Space presses via jump sequence and rejects rollback of sequence',async()=>{
 const player={id:'jump-test-input',name:'Input',country:'PT'};
 const started=await J.start(db,player,{biome:'city',multiplayer:false});
 const first=J.input(player,{runId:started.runId,left:false,right:false,jumpSeq:1});
 assert.ok(first.state.alive);
 await new Promise(resolve=>setTimeout(resolve,35));
 const released=J.input(player,{runId:started.runId,left:false,right:false,jumpSeq:1});
 assert.ok(released.state.y>0,'server must register a tap even if released before its next input');
 assert.throws(()=>J.input(player,{runId:started.runId,jumpSeq:0}),/Controlo de salto inválido/);
 J.leave(player);
});
test('rank API uses jump_scores only and returns separate global/national place',async()=>{
 const mock={query:async(sql,args)=>{
  assert.match(sql,/FROM jump_scores s JOIN players p/);
  assert.deepEqual(args,['jump-test-player']);
  return{rows:[{worldRank:'14',countryRank:'3'}]};
 }};
 assert.deepEqual(await J.playerRank(mock,{id:'jump-test-player'}),{worldRank:14,countryRank:3});
});
test('PULSE and JUMP share ranking presentation but not ranking API routes',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const ranking=fs.readFileSync(path.join(__dirname,'../ranking-fix.js'),'utf8');
 const full=fs.readFileSync(path.join(__dirname,'../full-ranking-fix.js'),'utf8');
 const jump=fs.readFileSync(path.join(__dirname,'../jump.js'),'utf8');
 assert.match(ranking,/isJump\?'\/api\/jump\/rankings':'\/api\/rankings'/);
 assert.match(full,/isJump\?'\/api\/jump\/rankings':'\/api\/rankings'/);
 assert.match(jump,/if\(code==='Space'\)/);
 assert.doesNotMatch(jump,/keys\.jump=on;[\s\S]*?KeyW/);
 assert.doesNotMatch(jump,/local\.y=out\.state\.y/);
});
