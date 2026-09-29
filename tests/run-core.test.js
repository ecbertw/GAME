'use strict';const test=require('node:test'),assert=require('node:assert/strict'),C=require('../run/core/simulation.js'),L=require('../run/levels/astral-first-light.js');
const flat={spawn:{x:0,y:5.5},killY:30,solids:[{x:-10,y:7,w:40,h:4}],oneWay:[],movingPlatforms:[],breakables:[],hazards:[],shards:[],secrets:[],checkpoints:[],finish:{x:999,y:0,w:1,h:1}};
test('RUN uses 120Hz deterministic physics',()=>assert.equal(C.DT,1/120));
test('RUN accelerates smoothly and caps speed',()=>{const p=C.createPlayer(flat.spawn);p.onGround=true;let prev=0;for(let i=0;i<240;i++){C.step(p,flat,C.INPUT.RIGHT,prev);prev=C.INPUT.RIGHT}assert.ok(p.vx>8&&p.vx<=C.C.maxRun+.001)});
test('RUN has variable jump',()=>{const a=C.createPlayer(flat.spawn),b=C.createPlayer(flat.spawn);a.onGround=b.onGround=true;C.step(a,flat,C.INPUT.JUMP,0);C.step(b,flat,C.INPUT.JUMP,0);C.step(a,flat,0,C.INPUT.JUMP);C.step(b,flat,C.INPUT.JUMP,C.INPUT.JUMP);assert.ok(a.vy>b.vy)});
test('RUN skid triggers on high-speed reversal',()=>{const p=C.createPlayer(flat.spawn);p.onGround=true;p.vx=7;C.step(p,flat,C.INPUT.LEFT,0);assert.equal(p.skid,true)});
test('First Light contains exactly 42 Astral Shards',()=>assert.equal(L.shards.length,42));
test('First Light contains checkpoint, destructible blocks, moving platforms, secret and hazards',()=>{assert.ok(L.checkpoints.length&&L.breakables.length&&L.movingPlatforms.length&&L.secrets.length&&L.hazards.length)});

test('First Light is reachable and its recorded replay is deterministic',()=>{
 const p=C.createPlayer(L.spawn),replay=[];let prev=0,lastMask=null;
 for(let tick=0;tick<18000&&p.finishTick==null;tick++){
  let mask=C.INPUT.RIGHT;
  if(p.onGround)mask|=C.INPUT.JUMP;
  if(mask!==lastMask){replay.push({t:tick,m:mask});lastMask=mask}
  C.step(p,L,mask,prev);prev=mask;
 }
 assert.notEqual(p.finishTick,null,'autoplay must reach the First Light gate; x='+p.x.toFixed(2)+' y='+p.y.toFixed(2)+' deaths='+p.deaths+' checkpoint='+p.checkpoint);
 const again=C.simulate(L,replay,18000);
 assert.equal(again.finishTick,p.finishTick,'server replay must reproduce the same finish tick');
 assert.equal(again.deaths,p.deaths,'replay must reproduce deaths');
});
