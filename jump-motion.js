/* EIXO JUMP motion v4 — natural 2026 locomotion, presentation only; gameplay physics untouched. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EixoJumpMotion=api;})(typeof window!=='undefined'?window:this,function(){
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),mix=(a,b,t)=>a+(b-a)*t,smooth=t=>t*t*(3-2*t);
const STRIDE_DISTANCE=94,PREVIEW_SPEED=216;
const FOOT=[[0,5.4,0,true],[.09,3.4,.25,true],[.2,-.5,.15,true],[.31,-5.6,0,true],[.39,-6.4,-1.8,false],[.54,-3.8,-7.6,false],[.68,.4,-9.4,false],[.82,4.9,-5.5,false],[.94,6.1,-1.3,false],[1,5.4,0,false]];
function footAt(phase){
 const u=((phase%1)+1)%1;let a=FOOT[0],b=FOOT[1];
 for(let i=1;i<FOOT.length;i++)if(u<=FOOT[i][0]){a=FOOT[i-1];b=FOOT[i];break;}
 let t=smooth(clamp((u-a[0])/(b[0]-a[0]),0,1));
 const contact=u<.32;
 return{x:mix(a[1],b[1],t),y:contact?0:mix(a[2],b[2],t),contact,phase:u};
}
function knee(hip,ankle,l1=9.7,l2=8.8,bias=1){
 const dx=ankle.x-hip.x,dy=ankle.y-hip.y,d=clamp(Math.hypot(dx,dy),.01,l1+l2-.01);
 const base=Math.atan2(dy,dx),off=Math.acos(clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1));
 const angle=base-off*bias;return{x:hip.x+Math.cos(angle)*l1,y:hip.y+Math.sin(angle)*l1};
}
function gait(phase){
 const u=((phase%1)+1)%1,cycle=Math.sin(u*Math.PI*2),double=Math.sin(u*Math.PI*4);
 const pelvisY=.25+Math.abs(double)*.65-cycle*.16;
 const pelvisX=cycle*.42,roll=cycle*.055;
 return{pelvisY,pelvisX,roll,legs:[0,.5].map((offset,i)=>({foot:footAt(u+offset),back:i===0}))};
}
function runnerPose(phase,{moving=false,ground=true,vy=0,time=0,speedBlend=1,airTime=0,landTime=9}={}){
 speedBlend=clamp(speedBlend,0,1);const run=moving&&ground,g=gait(phase);
 const rise=clamp(vy/340,0,1),fall=clamp(-vy/450,0,1),launch=!ground?clamp(1-airTime/.15,0,1):0;
 const land=ground&&landTime<.20?Math.sin(clamp(landTime/.20,0,1)*Math.PI):0;
 const anticipation=ground&&moving&&landTime>.22?0:0;
 const airTuck=!ground?Math.max(rise*.6,(1-fall)*.27):0;
 const bob=run?g.pelvisY*(.5+.5*speedBlend):ground?Math.sin(time*1.45)*.07:0;
 const squash=land*.095,stretch=launch*.075;
 const scaleX=1+squash*.7-stretch*.38,scaleY=1-squash+stretch;
 const lean=run?(.055+.045*speedBlend):!ground?.08*rise-.035*fall:0;
 const hipY=-15+bob-airTuck*1.2+fall*.45+land*1.35;
 const hipX=run?g.pelvisX*(.35+.65*speedBlend):0;
 const legs=[0,1].map(i=>{
  const split=i?1:-1,hip={x:hipX+split*1.7,y:hipY};let foot;
  if(run){const f=g.legs[i].foot,scale=.72+.28*speedBlend;foot={x:f.x*scale,y:f.y*(.76+.24*speedBlend),contact:f.contact};}
  else if(ground)foot={x:split*3,y:0,contact:true};
  else foot={x:split*(3.1+airTuck*2.5)+rise*(i?-1.1:.8),y:-1-airTuck*(i?7.1:8.7)+fall*(i?1.25:1.7),contact:false};
  const k=knee(hip,foot,9.7,8.8,i?1:-1);
  const footAngle=run?Math.sin((g.legs[i].foot.phase-.12)*Math.PI*2)*.16*(1-g.legs[i].foot.contact*.65):!ground?(rise?-.22:.12):0;
  return{hip,knee:k,foot,footAngle,back:i===0};
 });
 const torsoY=bob+(ground?land*.42:rise*.4-fall*.12);
 const shoulderY=hipY-13+torsoY*.2;
 const stride=Math.sin(phase*Math.PI*2);
 const torsoAngle=run?-.055-stride*.025*speedBlend:!ground?-.13*rise+.055*fall:land*.02;
 const headTilt=run?stride*.018:!ground?.06*rise-.035*fall:0;
 const armDrive=run?stride*(2.7+2*speedBlend):!ground?(rise*4.2-fall*1.9):Math.sin(time*1.35)*.3;
 const arms=[true,false].map(back=>{
  const side=back?1:-1,shoulder={x:(back?3.1:-3.5)+lean*11,y:shoulderY+3.6};
  const swing=side*armDrive,upperAngle=-.08+swing*.105;
  const bend=run?.58+Math.abs(swing)*.025:ground?.42:.82+launch*.10;
  const elbow={x:shoulder.x+Math.sin(upperAngle)*6.5,y:shoulder.y+Math.cos(upperAngle)*6.5};
  const foreAngle=upperAngle+side*bend;
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
return{STRIDE_DISTANCE,PREVIEW_SPEED,gait,runnerPose,footAt,knee,createEmitter,updateEmitter};
});
