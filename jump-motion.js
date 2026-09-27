/* Presentation-only locomotion and shoe particles; no gameplay physics. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EixoJumpMotion=api;})(typeof window!=='undefined'?window:this,function(){
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),mix=(a,b,t)=>a+(b-a)*t;
// One phase is a full left/right stride. At 216 world units per second this
// gives just under two strides per second instead of the old six.
const STRIDE_DISTANCE=112,PREVIEW_SPEED=216;
// A complete running stride: initial contact, absorption, mid-stance,
// propulsion, toe-off, folded recovery and forward reach. The 34% stance
// interval leaves a true flight phase between alternating feet.
const FOOT=[[0,5,0,true],[.10,2.5,0,true],[.22,-2,0,true],[.34,-5.8,0,true],[.42,-6.2,-2,false],[.56,-3.4,-7.4,false],[.70,.2,-8.4,false],[.84,4.2,-4.8,false],[1,5,0,false]];
function footAt(phase){
 const u=((phase%1)+1)%1;let a=FOOT[0],b=FOOT[1];
 for(let i=1;i<FOOT.length;i++)if(u<=FOOT[i][0]){a=FOOT[i-1];b=FOOT[i];break;}
 let t=(u-a[0])/(b[0]-a[0]);t=t*t*(3-2*t);
 return {x:mix(a[1],b[1],t),y:mix(a[2],b[2],t),contact:u<.34,phase:u};
}
function knee(hip,ankle,l1=32,l2=23){
 const dx=ankle.x-hip.x,dy=ankle.y-hip.y,d=clamp(Math.hypot(dx,dy),.01,l1+l2-.01);
 const angle=Math.atan2(dy,dx)-Math.acos(clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1));
 return {x:hip.x+Math.cos(angle)*l1,y:hip.y+Math.sin(angle)*l1};
}
function gait(phase){
 const u=((phase%1)+1)%1,half=(u*2)%1;
 // The pelvis drops under load and rises during propulsion/flight.
 const bob=half<.22?mix(0,1.05,half/.22):half<.52?mix(1.05,-.75,(half-.22)/.30):half<.72?mix(-.75,-1.2,(half-.52)/.20):mix(-1.2,0,(half-.72)/.28);
 return {bob,lean:-.10,legs:[0,.5].map((offset,i)=>{
  const foot=footAt(u+offset),hip={x:i?1.5:-1.5,y:-15+bob};
  return {hip,knee:knee(hip,foot,9.5,8.5),foot,back:i===0};
 })};
}
// Coordinates are relative to the visible soles of the 42px modular runner.
// Support feet stay exactly on y=0; only the recovery foot leaves the floor.
function runnerPose(phase,{moving=false,ground=true,vy=0,time=0,speedBlend=1,airTime=0,landTime=9}={}){
 const walk=gait(phase),running=moving&&ground;
 speedBlend=clamp(speedBlend,0,1);
 const landing=ground&&landTime<.16?Math.sin(clamp(landTime/.16,0,1)*Math.PI)*2.2:0;
 const bob=running?walk.bob*(.55+.45*speedBlend):ground?Math.sin(time*1.6)*.08:0;
 const rise=clamp(vy/300,0,1),fall=clamp(-vy/420,0,1);
 // The whole body participates in a jump: it lengthens at take-off, curls in
 // the air, then opens its legs before landing. All values remain relative to
 // the physical sole so gameplay and collision stay untouched.
 const launch=!ground?clamp(1-airTime/.13,0,1):0;
 const airTuck=!ground?Math.max(rise*.68,(1-fall)*.30):0;
 const hipY=-15+bob-airTuck*1.4+fall*.55+landing;
 const legs=[0,1].map(i=>{
  const hip={x:i?2:-1.4,y:hipY};let foot;
  if(running){const f=walk.legs[i].foot,walkScale=.72+.28*speedBlend;foot={x:f.x*walkScale,y:f.y*(.72+.28*speedBlend),contact:f.contact};}
  else if(ground)foot={x:i?3.2:-2.8,y:0,contact:true};
  else {
   const split=i?1:-1;
   // The leading knee comes forward while the trailing leg folds under the
   // pelvis. Both extend again independently before contact.
   foot={x:split*(2.8+airTuck*2.4)-rise*1.15,y:-.8-airTuck*(i?6.8:8.5)+fall*(i?1.0:1.8),contact:false};
  }
  return {hip,knee:knee(hip,foot,9.5,8.5),foot,back:i===0};
 });
 const crouch=!ground?rise*.85-fall*.25:landing*.22;
 const lean=running?.035+.025*speedBlend:ground?0:.045*rise-.02*fall;
 const torsoY=bob+crouch,shoulderY=hipY-13+torsoY*.25;
 const torsoTwist=running?Math.sin(phase*Math.PI*2)*.022*speedBlend:0;
 const torsoAngle=running?-.02-torsoTwist:!ground?-.085*rise+.04*fall:landing*.012;
 const armSwing=ground?Math.sin(time*1.7)*.08:rise*3.4-fall*1.7;
 // The jacket is a right-facing profile: its visible socket is on the left.
 // Far arm is painted behind the torso; near arm covers that visible socket.
 const arms=[true,false].map(back=>{
  const shoulder={x:(back?3:-3.4)+lean*12,y:shoulderY+3.6};
  const leg=legs[back?0:1],counter=running?-leg.foot.x*(.075+.035*speedBlend):0;
  const angle=-.16+counter+(ground?(back?1:-1)*armSwing*.18:(back?1:-1)*armSwing*.2);
  const bend=running?.62+.18*speedBlend:ground?.46:.78+launch*.12;
  const elbow={x:shoulder.x+Math.sin(angle)*6.4,y:shoulder.y+Math.cos(angle)*6.4};
  const wrist={x:elbow.x+Math.sin(angle+bend)*4.3,y:elbow.y+Math.cos(angle+bend)*4.3};
  return {back,shoulder,elbow,wrist};
 });
 return {bob,lean,hipY,shoulderY,headY:shoulderY-13.1,torsoY,torsoAngle,airTuck,rise,fall,landing,launch,legs,arms};
}
function createEmitter(){return {items:[],last:null,x:0,y:0,phase:0,distance:0,ground:true,serial:0,fx:'none',run:null,speedBlend:0,airTime:0,landTime:9};}
function reset(s,now){s.items.length=0;s.last=now;s.distance=0;s.phase=0;s.speedBlend=0;s.airTime=0;s.landTime=9;}
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
 const speedTarget=active?clamp(travel/Math.max(dt,1/120)/PREVIEW_SPEED,0,1):0;
 s.speedBlend=mix(s.speedBlend,speedTarget,1-Math.exp(-dt*(active?10:14)));
 if(!ground)s.airTime=s.ground?0:s.airTime+dt;else{s.landTime=s.ground?s.landTime+dt:0;s.airTime=0;}
 const oldStep=Math.floor(s.phase*2);
 if(active&&ground)s.phase+=travel/STRIDE_DISTANCE;
 const runner=runnerPose(s.phase,{moving:active,ground,vy,time,speedBlend:s.speedBlend,airTime:s.airTime,landTime:s.landTime}),step=Math.floor(s.phase*2);
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
 return {pose:runner,active,dt};
}
return {STRIDE_DISTANCE,PREVIEW_SPEED,gait,runnerPose,footAt,knee,createEmitter,updateEmitter};
});
