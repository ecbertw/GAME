'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../jump-motion');
const P=require('../jump-physics');
const input=(time,x=0,extra={})=>({time,x,y:0,ground:true,moving:true,dir:1,fx:'comet',run:'one',...extra});
test('run cycle alternates support and lifted recovery with a flight phase',()=>{
 let airborne=false;
 for(let i=0;i<100;i++){
  const pose=M.runnerPose(i/100,{moving:true,ground:true}),[a,b]=pose.legs;
  if(!a.foot.contact&&!b.foot.contact)airborne=true;
  assert.ok(!(a.foot.contact&&b.foot.contact),'running never has double support');
  if(Math.abs(a.foot.x-b.foot.x)<2)assert.ok(Math.abs(a.foot.y-b.foot.y)>2.5,'passing legs must remain visibly separated');
  for(const leg of pose.legs)assert.ok(Math.abs(Math.hypot(leg.knee.x-leg.hip.x,leg.knee.y-leg.hip.y)-9.7)<1e-6);
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
 assert.equal(s.items.filter(p=>p.event==='jump').length,9);
 M.updateEmitter(s,input(.04,0,{ground:true}));assert.equal(s.items.filter(p=>p.event==='land').length,13);
 M.updateEmitter(s,input(.06,0,{moving:false}));assert.equal(s.items.filter(p=>p.event==='land').length,13);
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

test('the runner keeps planted soles on the collision surface throughout a stride',()=>{
 for(let frame=0;frame<1000;frame++){
  const pose=M.runnerPose(frame/1000,{moving:true,ground:true});
  for(const leg of pose.legs){
   assert.ok(leg.foot.y<=0,'a boot must never sink below the surface');
   if(leg.foot.contact)assert.equal(leg.foot.y,0,'a planted boot must touch the surface');
   assert.ok(Math.abs(Math.hypot(leg.knee.x-leg.hip.x,leg.knee.y-leg.hip.y)-9.7)<1e-6,'thigh length must not pulse');
   assert.ok(Math.abs(Math.hypot(leg.foot.x-leg.knee.x,leg.foot.y-leg.knee.y)-8.8)<1e-6,'shin must remain connected');
  }
 }
 for(const time of [0,.3,1,4])for(const leg of M.runnerPose(0,{ground:true,time}).legs)assert.equal(leg.foot.y,0);
});

test('running cadence stays near two strides per second at every frame rate and in wardrobe preview',()=>{
 assert.equal(M.PREVIEW_SPEED,P.SPEED,'preview must have the same running cadence as the game');
 for(const fps of [30,60,120])for(const preview of [false,true]){
  const s=M.createEmitter();
  for(let i=0;i<=fps;i++)M.updateEmitter(s,input(i/fps,preview?0:P.SPEED*i/fps,{preview,fx:'none'}));
  assert.ok(s.phase>2.2&&s.phase<2.4,'one second must produce a natural cadence near 2.3 strides');
  assert.ok(Math.abs(s.phase-P.SPEED/M.STRIDE_DISTANCE)<1e-9);
 }
});

test('new shoe particles emerge from the modular runner sole in either direction',()=>{
 for(const dir of [-1,1]){
  const s=M.createEmitter();M.updateEmitter(s,input(0,0,{dir}));
  M.updateEmitter(s,input(.04,dir*P.SPEED*.04,{dir}));
  const pose=M.runnerPose(s.phase,{moving:true,ground:true,speedBlend:s.speedBlend});
  const foot=pose.legs.find(leg=>leg.foot.contact).foot;
  const trail=s.items.filter(p=>p.event==='trail');assert.ok(trail.length>0);
  for(const p of trail){
   assert.ok(Math.abs(p.x-(s.x+dir*foot.x))<=1.5,'particle must start at the rendered shoe');
   assert.ok(p.y>=foot.y&&p.y<=foot.y+2);
  }
 }
});

test('arms stay attached and elbows bend forwards at rest, running and in the air',()=>{
 for(const state of [{},{moving:true},{ground:false,vy:300},{ground:false,vy:-420}])for(let i=0;i<100;i++){
  const pose=M.runnerPose(i/100,{...state,time:i/30});
  const [far,near]=pose.arms;
  assert.ok(far.back&&!near.back);
  assert.ok(near.shoulder.x<pose.lean*12&&far.shoulder.x>pose.lean*12,'visible arm belongs on the rear shoulder socket of the right-facing jacket');
  for(const {shoulder,elbow,wrist} of pose.arms){
   const upper={x:elbow.x-shoulder.x,y:elbow.y-shoulder.y},lower={x:wrist.x-elbow.x,y:wrist.y-elbow.y};
   assert.ok(Math.abs(Math.hypot(upper.x,upper.y)-6.5)<1e-9);
   assert.ok(Math.abs(Math.hypot(lower.x,lower.y)-4.4)<1e-9);
   assert.ok(Number.isFinite(wrist.x)&&Number.isFinite(wrist.y));
  }
 }
});

test('running arms counter-swing against the leg on the same side',()=>{
 for(const phase of [.25,.75]){
  const pose=M.runnerPose(phase,{moving:true});
  for(let side=0;side<2;side++){
   const {shoulder,elbow}=pose.arms[side];
   assert.ok((elbow.x-shoulder.x)*pose.legs[side].foot.x<0);
  }
 }
});

test('jump pose carries hips, torso, head and limbs through take-off and landing preparation',()=>{
 const idle=M.runnerPose(0,{ground:true}),rise=M.runnerPose(0,{ground:false,vy:300}),apex=M.runnerPose(0,{ground:false,vy:0}),fall=M.runnerPose(0,{ground:false,vy:-420});
 assert.ok(rise.airTuck>apex.airTuck&&apex.airTuck>fall.airTuck);
 assert.ok(rise.hipY<idle.hipY&&rise.shoulderY<idle.shoulderY&&rise.headY<idle.headY,'take-off must lift the whole skeleton');
 assert.ok(rise.torsoAngle<0&&fall.torsoAngle>0,'torso must lean into take-off and open before landing');
 assert.ok(rise.legs.every(leg=>leg.foot.y<fall.legs.find(other=>other.back===leg.back).foot.y),'knees tuck on ascent and extend on descent');
 for(const pose of [rise,apex,fall]){
  assert.ok(Math.abs((pose.shoulderY-pose.headY)-13.15)<1e-9,'head must remain attached to the torso');
  assert.ok(Math.abs((pose.hipY-13+pose.torsoY*.2)-pose.shoulderY)<1e-9,'shoulders must follow the hips');
 }
});

test('locomotion blends into a run and eases back to rest without snapping',()=>{
 const s=M.createEmitter();M.updateEmitter(s,input(0,0,{fx:'none'}));let previous=0;
 for(let i=1;i<=18;i++){
  M.updateEmitter(s,input(i/60,P.SPEED*i/60,{fx:'none'}));
  assert.ok(s.speedBlend>=previous&&s.speedBlend<=1);previous=s.speedBlend;
 }
 assert.ok(s.speedBlend>.8,'the start transition must reach the running pose quickly');
 const peak=s.speedBlend;
 for(let i=19;i<=36;i++)M.updateEmitter(s,input(i/60,P.SPEED*18/60,{moving:false,fx:'none'}));
 assert.ok(s.speedBlend<peak*.15,'the stop transition must settle smoothly into idle');
});

test('landing absorbs impact briefly before returning the pelvis to neutral',()=>{
 const impact=M.runnerPose(0,{ground:true,landTime:.08}),settled=M.runnerPose(0,{ground:true,landTime:1});
 assert.ok(impact.landing>.8&&settled.landing===0);
 assert.ok(impact.hipY>settled.hipY&&impact.shoulderY>settled.shoulderY);
});
