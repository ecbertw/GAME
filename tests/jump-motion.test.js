'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../jump-motion');
const input=(time,x=0,extra={})=>({time,x,y:0,ground:true,moving:true,dir:1,fx:'comet',run:'one',...extra});
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
test('shoe effects remain continuously visible through a complete jump and its apex',()=>{
 const s=M.createEmitter();M.updateEmitter(s,input(0));
 const arc=[-8,-18,-29,-38,-45,-49,-50,-49,-45,-38,-28,-16,-5];
 for(let i=0;i<arc.length;i++){
  M.updateEmitter(s,input((i+1)/30,i*.8,{ground:false,y:arc[i]}));
  assert.ok(s.items.length>0,'airborne frame '+i+' lost every effect');
 }
 assert.ok(s.items.some(p=>p.event==='air'),'jump needs a continuous airborne wake');
 assert.ok(s.items.some(p=>p.max>=.46),'air particles must survive the slower apex');
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
