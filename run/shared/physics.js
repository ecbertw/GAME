(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.EixoRunPhysics=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='run-1.0.0';
const DT=1/120;
const TICKS={coyote:12,buffer:15,respawn:58};
const C=Object.freeze({
  width:.72,height:1.42,maxRun:8.2,groundAccel:52,groundBrake:60,reverseBrake:76,
  airAccel:27,airBrake:5,jumpVelocity:13,gravityUp:33,gravityDown:45,maxFall:22,
  hardLanding:15.5,jumpCut:.48
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const approach=(v,target,delta)=>v<target?Math.min(target,v+delta):Math.max(target,v-delta);
const overlap=(a0,a1,b0,b1)=>a0<b1-1e-7&&a1>b0+1e-7;
const rectHit=(ax,ay,aw,ah,b)=>ax<b.x+b.w&&ax+aw>b.x&&ay<b.y+b.h&&ay+ah>b.y;
function triWave(v){v=((v%1)+1)%1;return v<.5?v*4-1:3-v*4;}
function platformPose(p,tick){
  const t=tick*DT,phase=Number(p.phase||0),speed=Number(p.speed||0);
  const q=triWave(t*speed+phase);
  const axis=p.axis==='y'?'y':'x';
  return{x:Number(p.x)+(axis==='x'?q*Number(p.amp||0):0),y:Number(p.y)+(axis==='y'?q*Number(p.amp||0):0),w:Number(p.w),h:Number(p.h||.35),id:String(p.id||'moving')};
}
function collisionRects(level,tick){
  const out=(level.gameplay?.solids||[]).map(r=>({...r,x:Number(r.x),y:Number(r.y),w:Number(r.w),h:Number(r.h),id:String(r.id||'solid')}));
  for(const p of level.gameplay?.movingPlatforms||[])if(!p.oneWay)out.push({...platformPose(p,tick),moving:true,source:p});
  return out;
}
function oneWayRects(level,tick){
  const out=(level.gameplay?.oneWayPlatforms||[]).map(r=>({...r,x:Number(r.x),y:Number(r.y),w:Number(r.w),h:Number(r.h||.22),id:String(r.id||'oneway')}));
  for(const p of level.gameplay?.movingPlatforms||[])if(p.oneWay)out.push({...platformPose(p,tick),moving:true,source:p});
  return out;
}
function spawnPoint(level,index=0){const cp=(level.gameplay?.checkpoints||[])[Math.max(0,index-1)];return cp?{x:Number(cp.spawnX??cp.x),y:Number(cp.spawnY??(cp.y+Number(cp.h||0)))}:{x:Number(level.spawn?.x||0),y:Number(level.spawn?.y||0)};}
function create(level){
  const s=spawnPoint(level,0);
  return{x:s.x,y:s.y,vx:0,vy:0,facing:1,onGround:false,groundId:null,groundMoving:null,
    tick:0,startedTick:null,finishTick:null,finished:false,dead:false,deathTicks:0,deaths:0,
    coyote:0,jumpBuffer:0,jumpHeld:false,jumpCutDone:false,skid:false,hardLanding:false,
    checkpoint:0,shards:new Set(),secrets:new Set(),lastEvents:[],animation:'idle'};
}
function kill(state,reason='hazard'){
  if(state.dead||state.finished)return;
  state.dead=true;state.deathTicks=TICKS.respawn;state.deaths++;state.vx=0;state.vy=0;state.onGround=false;state.groundId=null;state.groundMoving=null;
  state.lastEvents.push({type:'death',reason});state.animation='death';
}
function respawn(level,state){const s=spawnPoint(level,state.checkpoint);state.x=s.x;state.y=s.y;state.vx=0;state.vy=0;state.onGround=false;state.groundId=null;state.groundMoving=null;state.dead=false;state.deathTicks=0;state.coyote=0;state.jumpBuffer=0;state.jumpHeld=false;state.jumpCutDone=false;state.lastEvents.push({type:'respawn'});}
function step(level,state,input){
  if(state.finished){state.tick++;state.lastEvents=[];return state;}
  state.lastEvents=[];state.hardLanding=false;state.skid=false;
  const left=!!input?.left,right=!!input?.right,jump=!!input?.jump;
  if(state.dead){state.deathTicks--;if(state.deathTicks<=0)respawn(level,state);state.tick++;return state;}
  if(state.onGround)state.coyote=TICKS.coyote;else state.coyote=Math.max(0,state.coyote-1);
  if(jump&&!state.jumpHeld)state.jumpBuffer=TICKS.buffer;else state.jumpBuffer=Math.max(0,state.jumpBuffer-1);
  const dir=(right?1:0)-(left?1:0);
  if(state.groundMoving){
    const p=state.groundMoving,prev=platformPose(p,state.tick),next=platformPose(p,state.tick+1);
    state.x+=next.x-prev.x;state.y=next.y+next.h;
  }
  if(dir){
    if(state.onGround&&Math.abs(state.vx)>.65&&Math.sign(state.vx)!==dir){state.vx=approach(state.vx,0,C.reverseBrake*DT);state.skid=true;state.lastEvents.push({type:'skid'});}
    else state.vx=approach(state.vx,dir*C.maxRun,(state.onGround?C.groundAccel:C.airAccel)*DT);
    state.facing=dir;
  }else state.vx=approach(state.vx,0,(state.onGround?C.groundBrake:C.airBrake)*DT);
  state.vx=clamp(state.vx,-C.maxRun,C.maxRun);
  if(state.jumpBuffer>0&&state.coyote>0){state.vy=C.jumpVelocity;state.onGround=false;state.groundId=null;state.groundMoving=null;state.coyote=0;state.jumpBuffer=0;state.jumpCutDone=false;state.lastEvents.push({type:'jump'});}
  if(!jump&&state.jumpHeld&&state.vy>0&&!state.jumpCutDone){state.vy*=C.jumpCut;state.jumpCutDone=true;}
  state.jumpHeld=jump;
  state.vy-=((state.vy>0)?C.gravityUp:C.gravityDown)*DT;state.vy=Math.max(state.vy,-C.maxFall);
  const solids=collisionRects(level,state.tick+1),half=C.width/2;
  let nx=state.x+state.vx*DT;
  for(const r of solids){
    if(!overlap(state.y,state.y+C.height,r.y,r.y+r.h))continue;
    if(state.vx>0&&state.x+half<=r.x+1e-6&&nx+half>r.x){nx=r.x-half;state.vx=0;}
    else if(state.vx<0&&state.x-half>=r.x+r.w-1e-6&&nx-half<r.x+r.w){nx=r.x+r.w+half;state.vx=0;}
  }
  state.x=nx;
  const prevY=state.y,prevVy=state.vy,ny=state.y+state.vy*DT;
  let landed=null;
  if(state.vy<=0){
    const floors=solids.concat(oneWayRects(level,state.tick+1));
    let best=-Infinity;
    for(const r of floors){const top=r.y+r.h;if(!overlap(state.x-half,state.x+half,r.x,r.x+r.w))continue;if(prevY>=top-1e-5&&ny<=top+1e-6&&top>best){best=top;landed=r;}}
    if(landed){state.y=best;state.vy=0;state.onGround=true;state.groundId=landed.id;state.groundMoving=landed.moving?landed.source:null;state.coyote=TICKS.coyote;const impact=-prevVy;if(impact>C.hardLanding){state.hardLanding=true;state.lastEvents.push({type:'hardLanding',impact});}else if(impact>2)state.lastEvents.push({type:'land',impact});}
    else{state.y=ny;state.onGround=false;state.groundId=null;state.groundMoving=null;}
  }else{
    let ceiling=Infinity,hit=null;
    for(const r of solids){if(!overlap(state.x-half,state.x+half,r.x,r.x+r.w))continue;const bottom=r.y;if(prevY+C.height<=bottom+1e-6&&ny+C.height>=bottom-1e-6&&bottom<ceiling){ceiling=bottom;hit=r;}}
    if(hit){state.y=ceiling-C.height;state.vy=0;}else state.y=ny;
    state.onGround=false;state.groundId=null;state.groundMoving=null;
  }
  if(state.startedTick==null&&state.x>=Number(level.start?.x||0)){state.startedTick=state.tick+1;state.lastEvents.push({type:'start'});}
  const px=state.x-half,py=state.y;
  for(const h of level.gameplay?.hazards||[])if(rectHit(px,py,C.width,C.height,h)){kill(state,String(h.id||'hazard'));break;}
  if(!state.dead&&state.y<Number(level.killY??-12))kill(state,'fall');
  if(!state.dead){
    for(const sh of level.gameplay?.shards||[]){if(state.shards.has(sh.id))continue;const dx=state.x-Number(sh.x),dy=(state.y+C.height*.55)-Number(sh.y);if(dx*dx+dy*dy<.82*.82){state.shards.add(sh.id);state.lastEvents.push({type:'shard',id:sh.id});}}
    for(const sec of level.gameplay?.secrets||[]){if(state.secrets.has(sec.id))continue;if(rectHit(px,py,C.width,C.height,sec)){state.secrets.add(sec.id);state.lastEvents.push({type:'secret',id:sec.id});}}
    for(let i=0;i<(level.gameplay?.checkpoints||[]).length;i++){const cp=level.gameplay.checkpoints[i];if(state.checkpoint<i+1&&rectHit(px,py,C.width,C.height,cp)){state.checkpoint=i+1;state.lastEvents.push({type:'checkpoint',id:cp.id||String(i+1)});}}
    const f=level.finish||{};if(state.startedTick!=null&&state.x>=Number(f.x||Infinity)&&state.y>=Number(f.yMin??-999)&&state.y<=Number(f.yMax??999)){state.finished=true;state.finishTick=state.tick+1;state.vx=0;state.lastEvents.push({type:'finish'});state.animation='victory';}
  }
  if(!state.dead&&!state.finished){
    if(!state.onGround)state.animation=state.vy>1.2?'jump-rise':state.vy>-1.2?'apex':'fall';
    else if(state.hardLanding)state.animation='hard-land';
    else if(state.skid)state.animation='skid';
    else if(Math.abs(state.vx)>6.5)state.animation='run-fast';
    else if(Math.abs(state.vx)>.35)state.animation='run';
    else state.animation='idle';
  }
  state.tick++;return state;
}
function elapsedMs(state){if(state.startedTick==null)return 0;const end=state.finishTick??state.tick;return Math.max(0,Math.round((end-state.startedTick)*DT*1000));}
function completion(level,state){const totalShards=(level.gameplay?.shards||[]).length,totalSecrets=(level.gameplay?.secrets||[]).length;return{shards:state.shards.size,totalShards,secrets:state.secrets.size,totalSecrets,percent:Math.round(((state.shards.size+state.secrets.size)/Math.max(1,totalShards+totalSecrets))*100),complete100:state.shards.size===totalShards&&state.secrets.size===totalSecrets};}
function publicState(level,state){return{x:state.x,y:state.y,vx:state.vx,vy:state.vy,facing:state.facing,onGround:state.onGround,dead:state.dead,finished:state.finished,tick:state.tick,timeMs:elapsedMs(state),checkpoint:state.checkpoint,deaths:state.deaths,animation:state.animation,skid:state.skid,...completion(level,state)};}
return{VERSION,DT,TICKS,C,create,step,kill,elapsedMs,completion,publicState,platformPose,triWave};
});
