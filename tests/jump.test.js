'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const P=require('../jump-physics');
const J=require('../jump-server');
const db={query:async sql=>{
  if(sql.includes('SELECT colors FROM jump_cosmetics'))return{rows:[]};
  return{rows:[],rowCount:0};
}};
test('platform generation is deterministic, endless and progressively harder',()=>{
  assert.deepEqual(P.platforms(42,100),P.platforms(42,100));
  const s=P.create(42),first=s.platforms.length;
  s.best=s.platforms[first-1].y-100;
  P.step(s,{left:false,right:false,jump:false},1/60);
  assert.ok(s.platforms.length>first);
  const ps=P.platforms(73,120);
  assert.ok(ps[8].w>ps[80].w,'later platforms should be narrower');
  for(let i=1;i<ps.length;i++)assert.ok(ps[i].y-ps[i-1].y<=51,'vertical gap must remain within jump envelope');
});
test('moving platforms are deterministic and really move horizontally',()=>{
 const ps=P.platforms(91,140),moving=ps.filter(p=>p.moving);
 assert.ok(moving.length>=10,'a long run should contain several moving platforms');
 const p=moving[0],a=P.platformX(p,0),b=P.platformX(p,1.1);
 assert.notEqual(Math.round(a*100),Math.round(b*100));
 assert.ok(a>=0&&a+p.w<=P.W&&b>=0&&b+p.w<=P.W);
});
test('hard mode avoids vertical ladders and makes moving platforms dominant',()=>{
 const ps=P.platforms(8123,160);
 const late=ps.slice(25);
 const movingRatio=late.filter(p=>p.moving).length/late.length;
 assert.ok(movingRatio>=0.64,'late game should be mostly moving platforms');
 for(let i=6;i<ps.length;i++){
   const prev=ps[i-1],p=ps[i];
   const a=prev.x+prev.w/2,b=p.x+p.w/2;
   assert.ok(Math.abs(a-b)>=40,'late platforms must not form easy vertical ladders');
   assert.ok(Math.abs(a-b)<=112,'generated jumps must stay inside horizontal movement envelope');
 }
 assert.ok(ps[10].w>ps[40].w,'platforms should become clearly narrower');
});

test('holding jump continuously causes repeated bounces',()=>{
 const s=P.create(9);let bounces=0,prev=0;
 for(let i=0;i<360;i++){
   P.step(s,{left:false,right:false,jump:true},1/60);
   if(prev<=0&&s.vy>0)bounces++;
   prev=s.vy;
   if(!s.alive)break;
 }
 assert.ok(bounces>=2,'holding W/Space/Up must keep jumping after each landing');
});
test('landing on the next highest platform awards exactly 12 points',()=>{
 const s=P.create(17),p=s.platforms[1];
 s.x=P.platformX(p,s.time)+p.w/2;s.y=p.y+1;s.vy=-30;s.ground=false;
 for(let i=0;i<10&&s.score===0;i++)P.step(s,{left:false,right:false,jump:false},1/60);
 assert.equal(P.SCORE_PER_PLATFORM,12);
 assert.equal(s.bestPlatform,1);
 assert.equal(s.score,12);
 assert.equal(P.publicState(s).score,12);
});
test('public instances autospawn at five players per biome; slots are reusable',async()=>{
 const starts=[];
 const users=Array.from({length:13},(_,i)=>({id:'jump-test-forest-'+i,name:'J'+i,country:'PT'}));
 for(const u of users)starts.push(await J.start(db,u,{biome:'forest',multiplayer:true}));
 const sizes=[...new Set(starts.map(x=>x.instanceId))].map(id=>starts.filter(x=>x.instanceId===id).length);
 assert.deepEqual(sizes,[5,5,3]);
 const first=J.input(users[0],{runId:starts[0].runId,left:false,right:false,jump:false,platform:0});
 assert.equal(first.peers.length,4);
 const city=await J.start(db,{id:'jump-test-city',name:'C',country:'PT'},{biome:'city',multiplayer:true});
 assert.notEqual(city.instanceId,starts[0].instanceId);
 J.leave(users[0]);
 const newUser=await J.start(db,{id:'jump-test-new',name:'N',country:'PT'},{biome:'forest',multiplayer:true});
 assert.equal(newUser.instanceId,starts[0].instanceId);
 for(const u of users)J.leave(u);
 J.leave({id:'jump-test-city'});J.leave({id:'jump-test-new'});
});
test('server confirms platform points and rate-limits impossible progression',async()=>{
 const player={id:'jump-score-player',name:'SCORE',country:'PT'};
 const started=await J.start(db,player,{biome:'forest',multiplayer:false});
 let out=J.input(player,{runId:started.runId,left:false,right:false,jump:true,platform:1});
 assert.equal(out.state.score,12);
 assert.throws(()=>J.input(player,{runId:started.runId,left:false,right:false,jump:true,platform:5}),/demasiado rápida/);
 await new Promise(resolve=>setTimeout(resolve,235));
 out=J.input(player,{runId:started.runId,left:false,right:false,jump:true,platform:2});
 assert.equal(out.state.score,24);
 J.leave(player);
});
test('score migration changes old raw-height records to version 2 platform points',async()=>{
 const sql=[];
 await J.initDb({query:async q=>{sql.push(q);return{rows:[],rowCount:0}}});
 assert.ok(sql.some(q=>String(q).includes('FLOOR(best_score/40.0)')&&String(q).includes('score_version=2')));
});
test('cosmetic colors must come from the approved EIXO palette',()=>{
 assert.ok(J.PALETTE.includes(J.DEFAULTS.skin));
 assert.rejects(()=>J.saveColors(db,{id:'test'},{colors:{skin:'url(javascript:alert(1))'}}),/Cor inválida/);
});
test('browser uses A/D + arrows, W/Space/Up and never snaps to server Y',()=>{
 const js=fs.readFileSync(path.join(__dirname,'../jump.js'),'utf8');
 assert.doesNotMatch(js,/local\.y\s*=\s*out\.state\.y/);
 assert.match(js,/code==='KeyA'\|\|code==='ArrowLeft'/);
 assert.match(js,/code==='KeyD'\|\|code==='ArrowRight'/);
 assert.match(js,/code==='KeyW'\|\|code==='Space'\|\|code==='ArrowUp'/);
 assert.match(js,/platform:Number\(local\?\.bestPlatform\|\|0\)/);
 assert.match(js,/confirmedScore=Number\(out\.state\?\.score\|\|0\)/);
 assert.match(js,/P\.platformX\(p,local\.time\)/);
 assert.doesNotMatch(js,/if\(p\.moving\)\s*\{\s*c\.fillStyle='#0a5571'/);
 assert.match(js,/Moving platforms deliberately keep the exact same biome palette/);
});
