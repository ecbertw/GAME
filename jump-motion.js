/* EIXO JUMP motion v6 — authored pose animation; gameplay physics untouched. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EixoJumpMotion=api;})(typeof window!=='undefined'?window:this,function(){
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),mix=(a,b,t)=>a+(b-a)*t,smooth=t=>t*t*(3-2*t);
const STRIDE_DISTANCE=112,PREVIEW_SPEED=216;
const RUN_LEG=[
 {t:0,foot:[6.2,0],knee:[6.928,4.387],contact:true,angle:-.04},
 {t:.125,foot:[3.1,0],knee:[6.386,5.144],contact:true,angle:-.05},
 {t:.25,foot:[0,0],knee:[5.074,6.442],contact:true,angle:-.04},
 {t:.375,foot:[-5.4,0],knee:[.944,8.145],contact:true,angle:0},
 {t:.5,foot:[-6.1,-2.2],knee:[.997,8.139],contact:false,angle:.12},
 {t:.625,foot:[-3.2,-7.1],knee:[3.324,7.496],contact:false,angle:.16},
 {t:.75,foot:[1.1,-8.8],knee:[8.119,1.147],contact:false,angle:.09},
 {t:.875,foot:[5.1,-4.8],knee:[8.196,.25],contact:false,angle:-.04},
 {t:1,foot:[6.2,0],knee:[6.928,4.387],contact:false,angle:-.04}
];
const RUN_ARM=[
 {t:0,elbow:[-3.2,5.5],wrist:[.4,9.1]},
 {t:.25,elbow:[-.8,6.4],wrist:[1.8,10.1]},
 {t:.5,elbow:[3.6,5.3],wrist:[5.2,9.4]},
 {t:.75,elbow:[-.8,6.4],wrist:[1.8,10.1]},
 {t:1,elbow:[-3.2,5.5],wrist:[.4,9.1]}
];
const AIR=[
 {t:0,hipY:-16.2,torso:-.12,head:.04,feet:[[-4.8,-8.8],[4.6,-6.8]],knees:[[1.1,-12.8],[5.8,-11.2]],arms:[[3.8,4.7,5.7,8.4],[2.6,5.3,4.8,8.8]]},
 {t:.45,hipY:-16.7,torso:-.025,head:0,feet:[[-5.6,-7.6],[5.5,-7.8]],knees:[[.2,-12.2],[5.2,-12.3]],arms:[[2.7,5.4,4.8,9],[1.8,5.8,4.1,9.4]]},
 {t:1,hipY:-14.8,torso:.055,head:-.025,feet:[[-3.8,-2.2],[4.5,-1]],knees:[[1,-8.6],[5.6,-8]],arms:[[-1.4,6.2,1.8,9.9],[-2,6,1.2,9.7]]}
];
function frame(track,u){u=((u%1)+1)%1;let a=track[0],b=track[track.length-1];for(let i=1;i<track.length;i++)if(u<=track[i].t){a=track[i-1];b=track[i];break;}const q=smooth(clamp((u-a.t)/(b.t-a.t),0,1));return{a,b,q};}
const pair=(a,b,q)=>[mix(a[0],b[0],q),mix(a[1],b[1],q)];
function sampleLeg(u){const {a,b,q}=frame(RUN_LEG,u),foot=pair(a.foot,b.foot,q),k=pair(a.knee,b.knee,q);return{foot:{x:foot[0],y:a.contact&&b.contact?0:foot[1],contact:a.contact&&b.contact},knee:{x:k[0],y:k[1]},footAngle:mix(a.angle,b.angle,q)};}
function sampleArm(u){const {a,b,q}=frame(RUN_ARM,u),e=pair(a.elbow,b.elbow,q),w=pair(a.wrist,b.wrist,q);return{elbow:e,wrist:w};}
function sampleAir(u){u=clamp(u,0,1);let a=AIR[0],b=AIR[AIR.length-1];for(let i=1;i<AIR.length;i++)if(u<=AIR[i].t){a=AIR[i-1];b=AIR[i];break;}const q=smooth(clamp((u-a.t)/(b.t-a.t),0,1)),out={hipY:mix(a.hipY,b.hipY,q),torso:mix(a.torso,b.torso,q),head:mix(a.head,b.head,q),feet:[],knees:[],arms:[]};for(let i=0;i<2;i++){out.feet.push(pair(a.feet[i],b.feet[i],q));out.knees.push(pair(a.knees[i],b.knees[i],q));out.arms.push(a.arms[i].map((v,n)=>mix(v,b.arms[i][n],q)));}return out;}
function footAt(phase){const s=sampleLeg(phase);return{...s.foot,phase:((phase%1)+1)%1};}
function gait(phase){phase=((phase%1)+1)%1;return{pelvisY:.18+Math.abs(Math.sin(phase*Math.PI*2))*.48,pelvisX:Math.sin(phase*Math.PI*2)*.24,roll:Math.sin(phase*Math.PI*2)*.035,legs:[0,.5].map((offset,i)=>({...sampleLeg(phase+offset),back:i===0}))};}
function runnerPose(phase,{moving=false,ground=true,vy=0,time=0,speedBlend=1,airTime=0,landTime=9}={}){
 speedBlend=moving?clamp(speedBlend,0,1):0;const run=moving&&ground,g=gait(phase),rise=clamp(vy/360,0,1),fall=clamp(-vy/460,0,1),launch=!ground?clamp(1-airTime/.14,0,1):0,land=ground&&landTime<.24?Math.sin(clamp(landTime/.24,0,1)*Math.PI):0;
 const air=sampleAir(rise>0?(1-rise)*.45:.45+fall*.55),bob=run?g.pelvisY*speedBlend:ground?Math.sin(time*1.2)*.04:0,hipY=ground?-15+bob+land*.88:air.hipY,hipX=run?g.pelvisX*speedBlend:0;
 const idleFeet=[[-3,0],[3,0]],idleKnees=[[1,-8.3],[4.8,-8.3]];
 const legs=[0,1].map(i=>{const src=ground?g.legs[i]:null,hip={x:hipX+(i?1.7:-1.7),y:hipY},f=ground?[mix(idleFeet[i][0],src.foot.x,speedBlend),mix(idleFeet[i][1],src.foot.y,speedBlend)]:air.feet[i],authoredKnee=ground?[hip.x+src.knee.x,hip.y+src.knee.y]:air.knees[i],k=ground?[mix(idleKnees[i][0],authoredKnee[0],speedBlend),mix(idleKnees[i][1],authoredKnee[1],speedBlend)]:authoredKnee,foot={x:f[0],y:f[1],contact:ground&&(run?src.foot.contact:true)},ankle={x:foot.x,y:foot.y-3.45};return{hip,knee:{x:k[0],y:k[1]},ankle,foot,footAngle:ground?mix(0,src.footAngle,speedBlend):(rise?-.16:.08),back:i===0};});
 const torsoY=bob+(ground?land*.28:0),shoulderY=hipY-13+torsoY*.16,stride=Math.sin(phase*Math.PI*2),lean=run?.075:!ground?.065*rise-.02*fall:0,torsoAngle=ground?(run?-.05-stride*.014*speedBlend:land*.012):air.torso,headTilt=ground?(run?stride*.01:0):air.head;
 const arms=[true,false].map((back,i)=>{const shoulder={x:(back?3:-3.35)+lean*11,y:shoulderY+3.55};let e,w;if(ground){const r=sampleArm(phase+(i?.5:0)),idleE=[0,6.35],idleW=[1.5,10.2];e=[mix(idleE[0],r.elbow[0],speedBlend),mix(idleE[1],r.elbow[1],speedBlend)];w=[mix(idleW[0],r.wrist[0],speedBlend),mix(idleW[1],r.wrist[1],speedBlend)];}else{const a=air.arms[i];e=[a[0],a[1]];w=[a[2],a[3]];}return{back,shoulder,elbow:{x:shoulder.x+e[0],y:shoulder.y+e[1]},wrist:{x:shoulder.x+w[0],y:shoulder.y+w[1]}};});
 const squash=land*.05,stretch=launch*.025;return{bob,lean,hipY,shoulderY,headY:shoulderY-13.15,torsoY,torsoAngle,headTilt,scaleX:1+squash*.3-stretch*.15,scaleY:1-squash+stretch,airTuck:ground?0:1-rise*.25, rise,fall,landing:land,launch,legs,arms};
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
return{STRIDE_DISTANCE,PREVIEW_SPEED,gait,runnerPose,footAt,createEmitter,updateEmitter};
});
