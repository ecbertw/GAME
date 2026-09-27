/* Continuous HD skeleton. Coordinates are relative to the collision sole. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.EixoJumpRig=api;})(typeof window!=='undefined'?window:this,function(){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t,TAU=Math.PI*2;
const point=(p,a,l)=>({x:p.x+Math.sin(a)*l,y:p.y+Math.cos(a)*l});
function knee(hip,ankle){
 const dx=ankle.x-hip.x,dy=ankle.y-hip.y,d=Math.hypot(dx,dy),reach=clamp(d,.1,28.99),ux=dx/(d||1),uy=dy/(d||1),along=(225-196+reach*reach)/(2*reach),side=Math.sqrt(Math.max(0,225-along*along));
 return{x:hip.x+ux*along+uy*side,y:hip.y+uy*along-ux*side};
}
function foot(phase){
 const u=((phase%1)+1)%1,stance=.30;
 if(u<stance)return{x:16.8-33.6*u/stance,y:0,contact:true};
 const q=(u-stance)/(1-stance),ease=q*q*(3-2*q);
 return{x:mix(-16.8,16.8,ease),y:-9*Math.sin(Math.PI*q)**2,contact:false};
}
function target(phase,{ground=true,vy=0,time=0,speed=0,landing=0}={}){
 const run=clamp(speed,0,1),cycle=phase*TAU,hip={x:0,y:mix(-31,-25,run)+Math.sin(cycle*2)*.55*run+landing*1.2},lean=.10*run,shoulder={x:hip.x+lean*20,y:hip.y-20};
 const lift=ground?0:clamp((vy+300)/650,0,1),legs=[];
 for(let i=0;i<2;i++){
  const f=foot(phase+i*.5),side=i?1:-1;
  const sole=ground?{x:mix(side*2.2,f.x,run),y:f.y*run,contact:run<.01||f.contact}:{x:side*5+lift*2,y:-2-lift*(i?6:9),contact:false};
  legs.push({hip:{x:hip.x,y:hip.y},sole});
 }
 const arms=[0,1].map(i=>{const drive=Math.cos(cycle+i*Math.PI),a=ground?-.55*drive*run:.15+lift*.35,b=ground?mix(.16,1.0+a*.35,run):1.1;const origin={x:shoulder.x+(i?-1:1),y:shoulder.y+2},elbow=point(origin,a,10),wrist=point(elbow,b,9);return{shoulder:origin,elbow,wrist};});
 return{hip,shoulder,legs,arms,head:{x:shoulder.x+1,y:shoulder.y-14+Math.sin(time*1.4)*.08},lean};
}
function pose(state,phase,input,dt,reset=false){
 const goal=target(phase,input),blend=reset||!state.pose?1:1-Math.exp(-Math.max(0,dt)*24),old=state.pose;
 const pair=(a,b)=>({x:mix(a.x,b.x,blend),y:mix(a.y,b.y,blend)});
 const out={...goal,hip:old?pair(old.hip,goal.hip):goal.hip,shoulder:old?pair(old.shoulder,goal.shoulder):goal.shoulder,head:old?pair(old.head,goal.head):goal.head};
 out.legs=goal.legs.map((leg,i)=>{
  // Grounded soles use the continuous contact trajectory directly. Air targets
  // are damped, so apex/velocity changes cannot replace the entire silhouette.
  const sole=old&&!input.ground?pair(old.legs[i].sole,leg.sole):leg.sole;
  const hip={...out.hip},ankle={x:sole.x,y:sole.y-3},joint=knee(hip,ankle);
  return{hip,knee:joint,ankle,sole,contact:leg.sole.contact,back:i===0};
 });
 out.arms=goal.arms.map((arm,i)=>{
  const a=Math.atan2(arm.elbow.x-arm.shoulder.x,arm.elbow.y-arm.shoulder.y),b=Math.atan2(arm.wrist.x-arm.elbow.x,arm.wrist.y-arm.elbow.y);
  const previous=old?.arms[i],aa=previous?mix(previous.a,a,blend):a,bb=previous?mix(previous.b,b,blend):b,shoulder={x:out.shoulder.x+(i?-1:1),y:out.shoulder.y+2},elbow=point(shoulder,aa,10),wrist=point(elbow,bb,9);
  return{shoulder,elbow,wrist,a:aa,b:bb,back:i===0};
 });
 state.pose=out;return out;
}
return{foot,knee,target,pose};
});
