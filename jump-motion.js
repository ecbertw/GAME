/* EIXO JUMP motion v5 — contact-driven, layered locomotion; gameplay physics untouched. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EixoJumpMotion=api;})(typeof window!=='undefined'?window:this,function(){
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),mix=(a,b,t)=>a+(b-a)*t,smooth=t=>t*t*(3-2*t);
const STRIDE_DISTANCE=108,PREVIEW_SPEED=216;
// One stride in canonical right-facing space. During stance the foot is locked
// to the floor; during recovery it follows a heel-led arc with toe clearance.
const FOOT=[[0,6.2,0,true],[.12,2.4,0,true],[.24,-2.2,0,true],[.36,-6.1,0,true],[.44,-6.5,-2.2,false],[.57,-3.8,-7.5,false],[.70,.8,-9.1,false],[.84,5.2,-5.1,false],[.94,6.5,-1.2,false],[1,6.2,0,false]];
function footAt(phase){
 const u=((phase%1)+1)%1;let a=FOOT[0],b=FOOT[1];
 for(let i=1;i<FOOT.length;i++)if(u<=FOOT[i][0]){a=FOOT[i-1];b=FOOT[i];break;}
 let t=smooth(clamp((u-a[0])/(b[0]-a[0]),0,1));
 const contact=u<.36;
 return{x:mix(a[1],b[1],t),y:contact?0:mix(a[2],b[2],t),contact,phase:u};
}
function knee(hip,ankle,l1=9.7,l2=8.8,bias=1){
 const dx=ankle.x-hip.x,dy=ankle.y-hip.y,d=clamp(Math.hypot(dx,dy),.01,l1+l2-.01);
 const base=Math.atan2(dy,dx),off=Math.acos(clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1));
 const angle=base-off*bias;return{x:hip.x+Math.cos(angle)*l1,y:hip.y+Math.sin(angle)*l1};
}
function forwardKnee(hip,ankle,l1=9.7,l2=8.8){
 const a=knee(hip,ankle,l1,l2,1),b=knee(hip,ankle,l1,l2,-1);
 return a.x>b.x?a:b;
}
function gait(phase){
 const u=((phase%1)+1)%1,cycle=Math.sin(u*Math.PI*2),double=Math.sin(u*Math.PI*4);
 const pelvisY=.25+Math.abs(double)*.65-cycle*.16;
 const pelvisX=cycle*.42,roll=cycle*.055;
 return{pelvisY,pelvisX,roll,legs:[0,.5].map((offset,i)=>({foot:footAt(u+offset),back:i===0}))};
}
function runnerPose(phase,{moving=false,ground=true,vy=0,time=0,speedBlend=1,airTime=0,landTime=9}={}){
 speedBlend=clamp(speedBlend,0,1);const run=moving&&ground,g=gait(phase);
 const rise=clamp(vy/360,0,1),fall=clamp(-vy/460,0,1),launch=!ground?clamp(1-airTime/.14,0,1):0;
 const land=ground&&landTime<.24?Math.sin(clamp(landTime/.24,0,1)*Math.PI):0;
 const airTuck=!ground?Math.max(rise*.72,(1-fall)*.30):0;
 const bob=run?(.18+Math.abs(Math.sin(phase*Math.PI*2))*.55)*speedBlend:ground?Math.sin(time*1.2)*.045:0;
 const squash=land*.055,stretch=launch*.035;
 const scaleX=1+squash*.38-stretch*.18,scaleY=1-squash+stretch;
 const lean=run?(.045+.035*speedBlend):!ground?.07*rise-.025*fall:0;
 const hipY=-15+bob-airTuck*1.45+fall*.38+land*.92;
 const hipX=run?Math.sin(phase*Math.PI*2)*.28*speedBlend:0;
 const legs=[0,1].map(i=>{
  const split=i?1:-1,hip={x:hipX+split*1.7,y:hipY};let foot;
  if(run){const f=g.legs[i].foot,scale=.70+.30*speedBlend;foot={x:f.x*scale,y:f.contact?0:f.y*(.72+.28*speedBlend),contact:f.contact};}
  else if(ground)foot={x:split*3,y:0,contact:true};
  else foot={x:split*(3.0+airTuck*2.4)+rise*(i?-.7:.9),y:-1.1-airTuck*(i?7.0:8.4)+fall*(i?1.2:1.8),contact:false};
  const ankle={x:foot.x,y:foot.y-3.45},k=forwardKnee(hip,ankle,8.1,7.1);
  const footAngle=run?(foot.contact?-.035:Math.sin((g.legs[i].foot.phase-.12)*Math.PI*2)*.13):!ground?(rise?-.18:.09):0;
  return{hip,knee:k,ankle,foot,footAngle,back:i===0};
 });
 const torsoY=bob+(ground?land*.30:rise*.34-fall*.10);
 const shoulderY=hipY-13+torsoY*.18;
 const stride=Math.sin(phase*Math.PI*2);
 const torsoAngle=run?-.045-stride*.018*speedBlend:!ground?-.11*rise+.045*fall:land*.012;
 const headTilt=run?stride*.012:!ground?.045*rise-.025*fall:0;
 const arms=[true,false].map((back,i)=>{
  const shoulder={x:(back?3.0:-3.35)+lean*11,y:shoulderY+3.55};
  const legX=legs[i].foot.x,drive=run?clamp(-legX/6.5,-1,1)*speedBlend:0;
  const upperAngle=!ground?.48*rise-.20*fall:run?drive*.56:Math.sin(time*1.2+(back?Math.PI:0))*.025;
  // The forearm always folds towards the character's forward side. This keeps
  // the elbow anatomical throughout the swing instead of flipping its bend.
  const foreAngle=!ground?.72+.14*rise:run?.34+drive*.16:.30;
  const elbow={x:shoulder.x+Math.sin(upperAngle)*6.5,y:shoulder.y+Math.cos(upperAngle)*6.5};
  const wrist={x:elbow.x+Math.sin(foreAngle)*4.4,y:elbow.y+Math.cos(foreAngle)*4.4};
  return{back,shoulder,elbow,wrist};
 });
 return{bob,lean,hipY,shoulderY,headY:shoulderY-13.15,torsoY,torsoAngle,headTilt,scaleX,scaleY,airTuck,rise,fall,landing:land,launch,legs,arms};
}
function createEmitter(){return{items:[],last:null,x:0,y:0,phase:0,distance:0,ground:true,serial:0,fx:'none',run:null,speedBlend:0,airTime:0,landTime:9};}
function reset(s,now){s.items.length=0;s.last=now;s.distance=0;s.phase=0;s.speedBlend=0;s.airTime=0;s.landTime=9;}
function random(s,k){const n=Math.sin(s.serial*91.37+k*27.1)*43758.5453;return n-Math.floor(n);}
function emit(s,x,y,dir,fx,count,event){
 for(let i=0;i<count&&s.items.length<72;i++){s.serial++;const base=event==='air'?.5:event==='land'?.5:.34,life=base+random(s,2)*.28;
  s.items.push({x:x+(random(s,3)-.5)*3,y:y+random(s,4)*2,vx:-dir*(8+random(s,5)*23)+(random(s,6)-.5)*13,vy:-(5+random(s,7)*18),life,max:life,size:.9+random(s,8)*1.35,angle:random(s,9)*6.28,spin:(random(s,10)-.5)*4.2,fx,event,serial:s.serial});
 }
}
function updateEmitter(s,input){
 const{time,x,y,ground,moving,vy=0,dir=1,fx='none',run=null,preview=false}=input,elapsed=s.last===null?0:time-s.last;
 const discontinuity=s.last===null||elapsed<0||elapsed>.25||run!==s.run||Math.hypot(x-s.x,y-s.y)>90;
 if(discontinuity){reset(s,time);s.x=x;s.y=y;s.ground=ground;s.fx=fx;s.run=run;}
 if(s.fx!==fx){s.items.length=0;s.distance=0;s.fx=fx;}
 const dt=discontinuity?0:clamp(elapsed,0,.05),dx=x-s.x,travel=preview&&moving?PREVIEW_SPEED*dt:Math.abs(dx),active=moving&&travel>.02;
 const target=active?clamp(travel/Math.max(dt,1/120)/PREVIEW_SPEED,0,1):0;s.speedBlend=mix(s.speedBlend,target,1-Math.exp(-dt*(active?9:13)));
 if(!ground)s.airTime=s.ground?0:s.airTime+dt;else{s.landTime=s.ground?s.landTime+dt:0;s.airTime=0;}
 const oldStep=Math.floor(s.phase*2);if(active&&ground)s.phase+=travel/STRIDE_DISTANCE;
 const pose=runnerPose(s.phase,{moving:active,ground,vy,time,speedBlend:s.speedBlend,airTime:s.airTime,landTime:s.landTime}),step=Math.floor(s.phase*2);
 for(const p of s.items){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.fx==='aurora'||p.fx==='void'?-7:24)*dt;p.vx*=Math.exp(-2.7*dt);p.angle+=p.spin*dt;}
 s.items=s.items.filter(p=>p.life>0);
 if(fx!=='none'&&!discontinuity){
  if(s.ground&&!ground)emit(s,x,y,dir,fx,9,'jump');
  if(!s.ground&&ground)emit(s,x,y,dir,fx,13,'land');
  if(active&&ground){s.distance+=travel;while(s.distance>=4.4){s.distance-=4.4;const leg=pose.legs.find(l=>l.foot.contact)||pose.legs[step%2];emit(s,x+dir*leg.foot.x,y+leg.foot.y,dir,fx,1,'trail');}if(step!==oldStep){const leg=pose.legs[step%2];emit(s,x+dir*leg.foot.x,y+leg.foot.y,dir,fx,3,'step');}}
  else if(!ground){s.distance+=Math.hypot(x-s.x,y-s.y)+dt*12;while(s.distance>=4.8){s.distance-=4.8;emit(s,x-dir*2.5,y,dir,fx,1,'air');}}
 }
 s.last=time;s.x=x;s.y=y;s.ground=ground;s.run=run;return{pose,active,dt};
}
return{STRIDE_DISTANCE,PREVIEW_SPEED,gait,runnerPose,footAt,knee,forwardKnee,createEmitter,updateEmitter};
});
