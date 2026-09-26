'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const P=require('../jump-physics');

test('slower runner can land every sampled transition, including opposing moving platforms',()=>{
 // Use the actual integration/collision routine, at two frame rates, through
 // early and late difficulty. Takeoff is inside the source platform with the
 // full collision radius supported. This checks 76,800 jumps, not just a
 // continuous-motion approximation of the jump envelope.
 for(let sample=1;sample<=128;sample++){
  const seed=sample*7919,platforms=P.platforms(seed,130);
  for(let index=1;index<=100;index++)for(const time of [0,.83,2.17])for(const dt of [1/30,1/60]){
   const from=platforms[index-1],to=platforms[index];
   let height=from.y,vy=P.JUMP,flight=0;
   do{vy-=P.GRAVITY*dt;height+=vy*dt;flight+=dt;}while(vy>0||height>to.y);
   const destination=P.platformX(to,time+flight)+to.w/2,source=P.platformX(from,time);
   const x=Math.max(source+P.PLAYER_RADIUS,Math.min(source+from.w-P.PLAYER_RADIUS,destination));
   const s=P.create(seed,platforms);
   Object.assign(s,{x,y:from.y,groundPlatform:index-1,bestPlatform:index-1,
    activeMinPlatform:Math.max(0,index-2),best:from.y,time});
   for(let frame=0;frame<Math.ceil(1.5/dt);frame++){
    const dx=destination-s.x;
    P.step(s,{left:dx<-P.SPEED*dt/2,right:dx>P.SPEED*dt/2,jump:frame===0},dt);
    if(s.ground||!s.alive||s.y<from.y-1)break;
   }
   assert.equal(s.groundPlatform,index,`unreachable seed ${seed}, platform ${index}, phase ${time}, step ${dt}`);
   assert.equal(s.y,to.y,'landing must put the sole at the exact collision height');
  }
 }
});

test('browser and server use identical reduced movement and deterministic physics',()=>{
 const browser={};vm.runInNewContext(fs.readFileSync(require.resolve('../jump-physics'),'utf8'),browser);
 const B=browser.EixoJumpPhysics;
 assert.equal(B.SPEED,P.SPEED);assert.ok(P.SPEED>=200&&P.SPEED<=220,'running should retain the calmer pace');
 const serverState=P.create(404),browserState=B.create(404);
 for(let frame=0;frame<480;frame++){
  const keys={left:frame%200>100,right:frame%200<=100,jump:frame%50===0};
  P.step(serverState,keys,1/60);B.step(browserState,keys,1/60);
 }
 assert.equal(JSON.stringify(B.publicState(browserState)),JSON.stringify(P.publicState(serverState)));
});
