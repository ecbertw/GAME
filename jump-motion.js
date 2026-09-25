/* Presentation-only locomotion and shoe particles; no gameplay physics. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EixoJumpMotion=api;})(typeof window!=='undefined'?window:this,function(){
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),mix=(a,b,t)=>a+(b-a)*t;
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
 const {time,x,y,ground,moving,dir=1,fx='none',run=null,preview=false}=input;
 const elapsed=s.last===null?0:time-s.last;
 const discontinuity=s.last===null||elapsed<0||elapsed>.25||run!==s.run||Math.hypot(x-s.x,y-s.y)>90;
 if(discontinuity){reset(s,time);s.x=x;s.y=y;s.ground=ground;s.fx=fx;s.run=run;}
 if(s.fx!==fx){s.items.length=0;s.distance=0;s.fx=fx;}
 const dt=discontinuity?0:clamp(elapsed,0,.05),dx=x-s.x,travel=preview&&moving?136*dt:Math.abs(dx);
 const active=moving&&travel>.02;
 if(active&&ground)s.phase+=travel/44;
 const pose=gait(s.phase),oldStep=Math.floor((s.phase-travel/44)*2),step=Math.floor(s.phase*2);
 for(const p of s.items){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.fx==='mist'?-4:30)*dt;p.vx*=Math.exp(-3*dt);p.angle+=p.spin*dt;}
 s.items=s.items.filter(p=>p.life>0);
 if(fx!=='none'&&!discontinuity){
  if(s.ground&&!ground)emit(s,x,y,dir,fx,7,'jump');
  if(!s.ground&&ground)emit(s,x,y,dir,fx,10,'land');
  if(active&&ground){
   s.distance+=travel;
   // Both soles emit at their actual animated positions, in world coordinates.
   while(s.distance>=3){s.distance-=3;const leg=pose.legs.find(l=>l.foot.contact)||pose.legs[step%2];
    emit(s,x+dir*(leg.foot.x-56)*38/112,y+(leg.foot.y-132)/3,dir,fx,2,'trail');}
   if(step!==oldStep){const leg=pose.legs[step%2];emit(s,x+dir*(leg.foot.x-56)*38/112,y,dir,fx,4,'step');}
  }else if(!ground){
   // Keep a light shoe wake alive for the whole jump, including the apex.
   s.distance+=Math.hypot(x-s.x,y-s.y)+dt*18;
   while(s.distance>=2.8){s.distance-=2.8;emit(s,x-dir*3,y,dir,fx,2,'air');}
  }
 }
 s.last=time;s.x=x;s.y=y;s.ground=ground;s.run=run;
 return {pose,active,dt};
}
return {gait,footAt,knee,createEmitter,updateEmitter};
});
