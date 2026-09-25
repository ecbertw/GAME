'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../jump-motion'),P=require('../jump-physics');
const input=(time,x=0,extra={})=>({time,x,y:0,ground:true,moving:true,dir:1,fx:'comet',run:'one',...extra});
test('first ten desert platforms preserve source proportions at every generated width',()=>{
 for(const seed of [1,73,998])for(const [i,p] of P.platforms(seed,12).entries()){
  if(i<1||i>10)continue;
  for(const [w,h] of [[180,102],[124,69],[134,65],[136,81]]){
   const size=M.platformSize(p.w,w,h,true);assert.ok(Math.abs(size.width/size.height-w/h)<1e-10);assert.equal(size.width,p.w+4);
  }
 }
 assert.equal(M.platformSize(50,180,102,false).height,21.5);
});
test('run cycle alternates support and lifted recovery with a flight phase',()=>{
 let airborne=false;
 for(let i=0;i<100;i++){
  const pose=M.gait(i/100),[a,b]=pose.legs;
  if(!a.foot.contact&&!b.foot.contact)airborne=true;
  assert.ok(!(a.foot.contact&&b.foot.contact),'running never has double support');
  if(Math.abs(a.foot.x-b.foot.x)<7)assert.ok(Math.abs(a.foot.y-b.foot.y)>12,'passing legs must remain visibly separated');
  for(const leg of pose.legs){const dx=leg.foot.x-leg.hip.x,dy=leg.foot.y-leg.hip.y;assert.ok(dx*(leg.knee.y-leg.hip.y)-dy*(leg.knee.x-leg.hip.x)<=0,'knees bend forwards, never backwards');assert.ok(Math.abs(Math.hypot(leg.knee.x-leg.hip.x,leg.knee.y-leg.hip.y)-32)<1e-6);}
 }
 assert.ok(airborne);assert.deepEqual(M.gait(0),M.gait(1));
});
test('stationary players and blocked movement do not run or emit effects',()=>{
 const s=M.createEmitter();for(let i=0;i<60;i++)M.updateEmitter(s,input(i/60));
 assert.equal(s.items.length,0);assert.equal(s.phase,0);
});
test('trail follows distance and persists behind the player, then expires at rest',()=>{
 const s=M.createEmitter();for(let i=0;i<30;i++)M.updateEmitter(s,input(i/60,i*136/60));
 assert.ok(s.items.length>0&&s.items.length<=64);assert.ok(s.items.some(p=>p.x<s.x-10));
 const phase=s.phase;
 for(let i=30;i<90;i++)M.updateEmitter(s,input(i/60,s.x,{moving:false}));
 assert.equal(s.items.length,0);assert.equal(s.phase,phase);
});
test('jump and landing emit short separate bursts and idle never repeats them',()=>{
 const s=M.createEmitter();M.updateEmitter(s,input(0));M.updateEmitter(s,input(.02,0,{ground:false,y:-2}));
 assert.equal(s.items.filter(p=>p.event==='jump').length,7);
 M.updateEmitter(s,input(.04,0,{ground:true}));assert.equal(s.items.filter(p=>p.event==='land').length,10);
 M.updateEmitter(s,input(.06,0,{moving:false}));assert.equal(s.items.filter(p=>p.event==='land').length,10);
});
test('restarts, teleports, hidden-tab gaps and effect changes cannot leave stale trails',()=>{
 for(const change of [{time:2},{time:-1},{run:'two'},{x:900},{fx:'none'}]){
  const s=M.createEmitter();M.updateEmitter(s,input(0));M.updateEmitter(s,input(.04,8));assert.ok(s.items.length);
  M.updateEmitter(s,{...input(.06,8),...change});assert.equal(s.items.length,0);
 }
});
test('wardrobe preview has independent emitter state from the game and peers',()=>{
 const local=M.createEmitter(),preview=M.createEmitter();M.updateEmitter(local,input(0));M.updateEmitter(local,input(.04,8));
 const n=local.items.length;M.updateEmitter(preview,input(50,0,{preview:true}));M.updateEmitter(preview,input(50.04,0,{preview:true}));
 assert.equal(local.items.length,n);assert.ok(preview.items.length>0);
});
test('camera scrolling is not part of emitter world coordinates',()=>{
 const s=M.createEmitter();M.updateEmitter(s,input(0));M.updateEmitter(s,input(.04,8));
 const p=s.items[0],before=p.y;M.updateEmitter(s,input(.04,8,{cameraY:100}));assert.equal(p.y,before);
});
