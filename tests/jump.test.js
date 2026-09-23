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
test('moving platforms accelerate early but remain catchable',()=>{
 const samples=[];
 for(let seed=20;seed<40;seed++){
  const ps=P.platforms(seed,40);
  ps.forEach((p,i)=>{if(p.moving)samples.push({i,speed:p.moveSpeed,linear:p.moveSpeed*p.moveAmp})});
 }
 const early=samples.filter(x=>x.i>=4&&x.i<=8).map(x=>x.speed);
 const later=samples.filter(x=>x.i>=15&&x.i<=24).map(x=>x.speed);
 assert.ok(early.length&&later.length);
 const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
 assert.ok(avg(later)>avg(early)+0.25,'speed should ramp noticeably within the first dozen jumps');
 assert.ok(samples.every(x=>x.speed<=2.241&&x.linear<=106.01),'moving platforms must stay inside the catchable velocity cap');
});
test('old platforms retire, cannot catch the player, and death happens at the visible floor',()=>{
 const s=P.create(313);
 s.bestPlatform=3;s.activeMinPlatform=2;s.jumpOrigin=3;s.ground=false;s.groundPlatform=-1;s.best=s.platforms[3].y;s.cam=Math.max(0,s.best-78);
 const rescue=s.platforms[2];
 s.y=rescue.y+2;s.vy=-120;
 s.x=rescue.x+rescue.w/2<P.W/2?P.W-8:8;
 let crossedRescue=false;
 for(let i=0;i<120&&s.alive;i++){
   P.step(s,{left:false,right:false,jump:false},1/60);
   if(s.y<rescue.y)crossedRescue=true;
   assert.notEqual(s.groundPlatform,1,'retired older platforms must never catch the player');
 }
 assert.equal(crossedRescue,true,'player should be allowed to fall past the immediate lower platform');
 assert.equal(s.alive,false,'run ends only after reaching the bottom boundary');
 assert.ok(s.y<=s.cam-22+0.5,'death threshold must align with the visible bottom edge');
 assert.equal(P.publicState(s).activeMinPlatform,2);
});
test('hard mode avoids vertical ladders and makes moving platforms dominant',()=>{
 const ps=P.platforms(8123,160);
 const late=ps.slice(25);
 const movingRatio=late.filter(p=>p.moving).length/late.length;
 assert.ok(movingRatio>=0.75,'late game should be dominated by moving platforms');
 for(let i=6;i<ps.length;i++){
   const prev=ps[i-1],p=ps[i];
   const a=prev.x+prev.w/2,b=p.x+p.w/2;
   assert.ok(Math.abs(a-b)>=40,'late platforms must not form easy vertical ladders');
   assert.ok(Math.abs(a-b)<=122,'generated jumps must stay inside horizontal movement envelope');
 }
 assert.ok(ps[10].w>ps[40].w,'platforms should become clearly narrower');
});

test('fragile platforms appear in the real difficulty curve and collapse after camping',()=>{
 const ps=P.platforms(4242,150),fragile=ps.map((p,i)=>({p,i})).filter(x=>x.p.fragile);
 assert.ok(fragile.length>=18,'late runs should contain a meaningful number of fragile platforms');
 const {p,i}=fragile[0],s=P.create(4242,ps);
 s.x=P.platformX(p,0)+p.w/2;s.y=p.y;s.best=p.y;s.cam=Math.max(0,p.y-78);s.ground=true;s.groundPlatform=i;s.bestPlatform=i;s.activeMinPlatform=Math.max(0,i-1);
 for(let n=0;n<100&&s.ground;n++)P.step(s,{left:false,right:false,jump:false},1/60);
 assert.equal(P.isBroken(s,i),true,'camping on a fragile platform should break it');
 assert.equal(s.ground,false,'the player must fall when it breaks');
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
test('skin stays fixed, hair is editable and VIP wardrobe unlocks are enforced server-side',async()=>{
 assert.ok(J.FIXED_APPEARANCE.skin);
 assert.ok(!J.PARTS.includes('skin'),'skin must never be a customisable part');
 assert.ok(J.PARTS.includes('hair'),'hair must be customisable');
 const free={id:'jump-free-outfit',vipLevel:0};
 await assert.rejects(()=>J.saveOutfit(db,free,{outfit:{...J.DEFAULTS,effect:'cosmic'}}),/requer VIP 6/);
 const saved=await J.saveOutfit(db,{id:'jump-vip-outfit',vipLevel:6},{outfit:{...J.DEFAULTS,hair:'rainbow',top:'rainbow',effect:'cosmic',skin:'#000000'}});
 assert.equal(saved.outfit.effect,'cosmic');
 assert.equal(saved.outfit.top,'rainbow');
 assert.equal(saved.outfit.hair,'rainbow');
 assert.equal('skin' in saved.outfit,false,'submitted skin values must be ignored');
});
test('multiplayer peers receive the equipped outfit and effect',async()=>{
 const a={id:'jump-outfit-a',name:'A',country:'PT',vipLevel:1};
 const b={id:'jump-outfit-b',name:'B',country:'PT',vipLevel:0};
 const ar=await J.start(db,a,{biome:'snow',multiplayer:true});
 const br=await J.start(db,b,{biome:'snow',multiplayer:true});
 await J.saveOutfit(db,a,{outfit:{...J.DEFAULTS,effect:'glow'}});
 const seen=J.input(b,{runId:br.runId,left:false,right:false,jump:false,platform:0});
 const peer=seen.peers.find(p=>p.id===a.id);
 assert.equal(peer.outfit.effect,'glow');
 J.leave(a);J.leave(b);
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
 assert.match(js,/Moving platforms keep the same biome palette|Moving platforms deliberately keep the exact same biome palette|Moving platforms keep the biome material/);
 assert.match(js,/ROSTO E PELE FIXOS · CABELO E ROUPA EDITÁVEIS/);
 assert.match(js,/peer\.outfit/);
 assert.match(js,/activeMinPlatform/);
 assert.match(js,/data-eixo-color-label/);
 assert.match(js,/facing,ground:local\.ground/);
 assert.doesNotMatch(js,/data-jump-color="skin"/);
});

test('VIP wardrobe options keep explicit COR VIP labels from the global color decorator',()=>{
 const jump=fs.readFileSync(path.join(__dirname,'../jump.js'),'utf8');
 const colors=fs.readFileSync(path.join(__dirname,'../color-options.js'),'utf8');
 assert.match(jump,/COR VIP · /);
 assert.match(colors,/option\.dataset\.eixoColorLabel==='keep'/);
});
