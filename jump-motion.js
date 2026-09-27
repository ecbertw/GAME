/* Presentation-only locomotion and shoe particles; no gameplay physics. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EixoJumpMotion=api;})(typeof window!=='undefined'?window:this,function(){
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),mix=(a,b,t)=>a+(b-a)*t;
// One phase is a full left/right stride. At 216 world units per second this
// gives just under two strides per second instead of the old six.
const STRIDE_DISTANCE=112,PREVIEW_SPEED=216;
// Contact -> compression -> toe-off -> folded recovery -> forward reach.
// The support foot moves backwards linearly while the other clears the floor.
const FOOT=[[0,19,132],[.16,0,132],[.32,-21,132],[.46,-28,111],[.64,-5,101],[.82,19,114],[1,19,132]];
function footAt(phase){
 const u=((phase%1)+1)%1;let a=FOOT[0],b=FOOT[1];
 for(let i=1;i<FOOT.length;i++)if(u<=FOOT[i][0]){a=FOOT[i-1];b=FOOT[i];break;}
 let t=(u-a[0])/(b[0]-a[0]);if(u>.32)t=t*t*(3-2*t);
 return {x:64+mix(a[1],b[1],t),y:mix(a[2],b[2],t),contact:u<.32,phase:u};
}
function knee(hip,ankle,l1=32,l2=23){
 const dx=ankle.x-hip.x,dy=ankle.y-hip.y,d=clamp(Math.hypot(dx,dy),.01,l1+l2-.01);
 const angle=Math.atan2(dy,dx)-Math.acos(clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1));
 return {x:hip.x+Math.cos(angle)*l1,y:hip.y+Math.sin(angle)*l1};
}
function gait(phase){
 const u=((phase%1)+1)%1,half=(u*2)%1;
 const bob=half<.64?Math.sin(half/.64*Math.PI)*2.5:-Math.sin((half-.64)/.36*Math.PI)*3;
 return {bob,lean:-.10,legs:[0,.5].map((offset,i)=>{
  const foot=footAt(u+offset),hip={x:i?70:61,y:83+bob};
  return {hip,knee:knee(hip,foot),foot,back:i===0};
 })};
}
// Coordinates are relative to the visible soles of the 42px modular runner.
// Support feet stay exactly on y=0; only the recovery foot leaves the floor.
function runnerPose(phase,{moving=false,ground=true,vy=0,time=0}={}){
 const walk=gait(phase),running=moving&&ground;
 const bob=running?walk.bob*.27:ground?Math.sin(time*2)*.12:0;
 const rise=clamp(vy/300,0,1),fall=clamp(-vy/420,0,1);
 const hipY=-16+bob;
 const legs=[0,1].map(i=>{
  const hip={x:i?2:-1.4,y:hipY};let foot;
  if(running){const f=walk.legs[i].foot;foot={x:(f.x-64)*.26,y:(f.y-132)*.26,contact:f.contact};}
  else if(ground)foot={x:i?4:-3,y:0,contact:true};
  else foot={x:i?4-rise*2:-4-rise*2,y:i?-2-rise*3:-1-rise*7+fall,contact:false};
  return {hip,knee:knee(hip,foot,9.5,8.5),foot,back:i===0};
 });
 const lean=running?.055:ground?0:rise*.025,shoulderY=-29+bob;
 const armSwing=running?Math.sin(phase*Math.PI*2)*3.3:ground?Math.sin(time*2)*.12:rise*3-fall*1.5;
 // The jacket is a right-facing profile: its visible socket is on the left.
 // Far arm is painted behind the torso; near arm covers that visible socket.
 const arms=[true,false].map(back=>{
  const shoulder={x:(back?3:-3.4)+lean*12,y:shoulderY+3.6};
  const angle=-.16+(running?-legs[back?0:1].foot.x*.085:(back?1:-1)*armSwing*.18);
  const bend=running?.75:ground?.46:.85;
  const elbow={x:shoulder.x+Math.sin(angle)*6.4,y:shoulder.y+Math.cos(angle)*6.4};
  const wrist={x:elbow.x+Math.sin(angle+bend)*4.3,y:elbow.y+Math.cos(angle+bend)*4.3};
  return {back,shoulder,elbow,wrist};
 });
 return {bob,lean,hipY,shoulderY,headY:-42+bob,armSwing,legs,arms};
}
function createEmitter(){return {items:[],last:null,x:0,y:0,phase:0,distance:0,ground:true,serial:0,fx:'none',run:null};}
function reset(s,now){s.items.length=0;s.last=now;s.distance=0;s.phase=0;}
function random(s,k){const n=Math.sin(s.serial*91.37+k*27.1)*43758.5453;return n-Math.floor(n);}
function emit(s,x,y,dir,fx,count,event){
 for(let i=0;i<count&&s.items.length<64;i++){
  s.serial++;const life=(event==='air'?.46:.32)+random(s,2)*(event==='air'?.26:.22);
  s.items.push({x:x+(random(s,3)-.5)*3,y:y+random(s,4)*2,
   vx:-dir*(9+random(s,5)*22)+(random(s,6)-.5)*16,vy:-(6+random(s,7)*20),
   life,max:life,size:1.1+random(s,8)*1.1,angle:random(s,9)*6.28,spin:(random(s,10)-.5)*5,
   fx,event,serial:s.serial});
 }
}
function updateEmitter(s,input){
 const {time,x,y,ground,moving,vy=0,dir=1,fx='none',run=null,preview=false}=input;
 const elapsed=s.last===null?0:time-s.last;
 const discontinuity=s.last===null||elapsed<0||elapsed>.25||run!==s.run||Math.hypot(x-s.x,y-s.y)>90;
 if(discontinuity){reset(s,time);s.x=x;s.y=y;s.ground=ground;s.fx=fx;s.run=run;}
 if(s.fx!==fx){s.items.length=0;s.distance=0;s.fx=fx;}
 const dt=discontinuity?0:clamp(elapsed,0,.05),dx=x-s.x,travel=preview&&moving?PREVIEW_SPEED*dt:Math.abs(dx);
 const active=moving&&travel>.02;
 const oldStep=Math.floor(s.phase*2);
 if(active&&ground)s.phase+=travel/STRIDE_DISTANCE;
 const pose=gait(s.phase),runner=runnerPose(s.phase,{moving:active,ground,vy,time}),step=Math.floor(s.phase*2);
 for(const p of s.items){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.fx==='mist'?-4:30)*dt;p.vx*=Math.exp(-3*dt);p.angle+=p.spin*dt;}
 s.items=s.items.filter(p=>p.life>0);
 if(fx!=='none'&&!discontinuity){
  if(s.ground&&!ground)emit(s,x,y,dir,fx,7,'jump');
  if(!s.ground&&ground)emit(s,x,y,dir,fx,10,'land');
  if(active&&ground){
   s.distance+=travel;
   // Both soles emit at their actual animated positions, in world coordinates.
   while(s.distance>=3){s.distance-=3;const leg=runner.legs.find(l=>l.foot.contact)||runner.legs[step%2];
    emit(s,x+dir*leg.foot.x,y+leg.foot.y,dir,fx,2,'trail');}
   if(step!==oldStep){const leg=runner.legs[step%2];emit(s,x+dir*leg.foot.x,y+leg.foot.y,dir,fx,4,'step');}
  }else if(!ground){
   // Keep a light shoe wake alive for the whole jump, including the apex.
   s.distance+=Math.hypot(x-s.x,y-s.y)+dt*18;
   while(s.distance>=2.8){s.distance-=2.8;emit(s,x-dir*3,y,dir,fx,2,'air');}
  }
 }
 s.last=time;s.x=x;s.y=y;s.ground=ground;s.run=run;
 return {pose,active,dt};
}
return {STRIDE_DISTANCE,PREVIEW_SPEED,gait,runnerPose,footAt,knee,createEmitter,updateEmitter};
});
