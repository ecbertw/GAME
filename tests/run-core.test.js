'use strict';const test=require('node:test'),assert=require('node:assert/strict'),C=require('../run/core/simulation.js'),L=require('../run/levels/astral-first-light.js');
const flat={spawn:{x:0,y:5.5},killY:30,solids:[{x:-10,y:7,w:40,h:4}],oneWay:[],movingPlatforms:[],breakables:[],hazards:[],shards:[],secrets:[],checkpoints:[],finish:{x:999,y:0,w:1,h:1}};
test('RUN uses 120Hz deterministic physics',()=>assert.equal(C.DT,1/120));
test('RUN accelerates smoothly and caps speed',()=>{const p=C.createPlayer(flat.spawn);p.onGround=true;let prev=0;for(let i=0;i<240;i++){C.step(p,flat,C.INPUT.RIGHT,prev);prev=C.INPUT.RIGHT}assert.ok(p.vx>8&&p.vx<=C.C.maxRun+.001)});
test('RUN has variable jump',()=>{const a=C.createPlayer(flat.spawn),b=C.createPlayer(flat.spawn);a.onGround=b.onGround=true;C.step(a,flat,C.INPUT.JUMP,0);C.step(b,flat,C.INPUT.JUMP,0);C.step(a,flat,0,C.INPUT.JUMP);C.step(b,flat,C.INPUT.JUMP,C.INPUT.JUMP);assert.ok(a.vy>b.vy)});
test('RUN skid triggers on high-speed reversal',()=>{const p=C.createPlayer(flat.spawn);p.onGround=true;p.vx=7;C.step(p,flat,C.INPUT.LEFT,0);assert.equal(p.skid,true)});
test('First Light contains exactly 42 Astral Shards',()=>assert.equal(L.shards.length,42));
test('First Light contains checkpoint, destructible blocks, moving platforms, secret and hazards',()=>{assert.ok(L.checkpoints.length&&L.breakables.length&&L.movingPlatforms.length&&L.secrets.length&&L.hazards.length)});

test('every First Light main-island gap is physically jumpable',()=>{
 for(let i=0;i<L.solids.length-1;i++){
  const a=L.solids[i],b=L.solids[i+1];
  const mini={spawn:{x:a.x+a.w-2.7,y:a.y-C.C.height-C.C.skin},killY:40,solids:[a,b],oneWay:[],movingPlatforms:[],breakables:[],hazards:[],shards:[],secrets:[],checkpoints:[],finish:{x:999,y:0,w:1,h:1}};
  const p=C.createPlayer(mini.spawn);p.onGround=true;p.vx=C.C.maxRun*.88;let prev=0,landed=false;
  for(let tick=0;tick<240;tick++){
   const mask=C.INPUT.RIGHT|(tick<18?C.INPUT.JUMP:0);C.step(p,mini,mask,prev);prev=mask;
   if(p.onGround&&p.x+p.w*.5>b.x+.35){landed=true;break}
  }
  assert.equal(landed,true,'main island gap '+a.id+' -> '+b.id+' must be reachable');
 }
});
test('First Light hazards can be cleared by a committed jump',()=>{
 for(const h of L.hazards){
  const support=L.solids.find(r=>h.x>=r.x&&h.x+h.w<=r.x+r.w&&Math.abs((h.y+h.h)-r.y)<.12);
  assert.ok(support,'hazard '+h.id+' must sit on a main island');
  const mini={spawn:{x:Math.max(support.x+.2,h.x-4.2),y:support.y-C.C.height-C.C.skin},killY:40,solids:[support],oneWay:[],movingPlatforms:[],breakables:[],hazards:[h],shards:[],secrets:[],checkpoints:[],finish:{x:999,y:0,w:1,h:1}};
  const p=C.createPlayer(mini.spawn);p.onGround=true;p.vx=C.C.maxRun*.88;let prev=0,passed=false;
  for(let tick=0;tick<180&&!p.dead;tick++){const mask=C.INPUT.RIGHT|(tick<18?C.INPUT.JUMP:0);C.step(p,mini,mask,prev);prev=mask;if(p.x>h.x+h.w+.4){passed=true;break}}
  assert.equal(passed,true,'hazard '+h.id+' must be jumpable');
 }
});
test('RUN replay re-simulation is deterministic',()=>{
 const floor={id:'floor',x:0,y:8,w:30,h:4},mini={spawn:{x:1,y:8-C.C.height-C.C.skin},startX:2,killY:30,solids:[floor],oneWay:[],movingPlatforms:[],breakables:[],hazards:[],shards:[],secrets:[],checkpoints:[],finish:{x:12,y:5,w:1.2,h:3}};
 const replay=[{t:0,m:C.INPUT.RIGHT}],a=C.simulate(mini,replay,1000),b=C.simulate(mini,replay,1000);
 assert.notEqual(a.finishTick,null);assert.equal(a.finishTick,b.finishTick);assert.equal(a.startTick,b.startTick);
});
