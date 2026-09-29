(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.EixoRunPhysics=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='run-physics-1';
const DT=1/120;
const C=Object.freeze({
  maxRun:8.2,groundAccel:52,groundBrake:60,reverseBrake:76,airAccel:27,
  jumpVelocity:13,gravityUp:33,gravityDown:45,maxFall:22,coyote:0.10,jumpBuffer:0.12,
  jumpCut:0.52,width:0.74,height:1.42,skin:0.001
});
const INPUT={LEFT:1,RIGHT:2,JUMP:4};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const approach=(v,target,delta)=>v<target?Math.min(target,v+delta):Math.max(target,v-delta);
function createPlayer(spawn={x:1.5,y:3}){
  return {x:+spawn.x||0,y:+spawn.y||0,vx:0,vy:0,w:C.width,h:C.height,onGround:false,
    coyote:0,jumpBuffer:0,jumpHeld:false,dead:false,finished:false,deaths:0,checkpoint:{x:+spawn.x||0,y:+spawn.y||0},
    shards:new Set(),secrets:new Set(),skid:false,hardLanding:false,lastGroundVy:0,deathTicks:0,tick:0};
}
function aabb(p,r){return p.x+p.w>r.x&&p.x<r.x+r.w&&p.y+p.h>r.y&&p.y<r.y+r.h}
function movingRect(m,tick){
  const phase=(tick*DT+(m.phase||0))*Math.PI*2/Math.max(.001,m.period||2);
  const s=Math.sin(phase);
  return {x:(m.x||0)+(m.axis==='x'?(m.amplitude||0)*s:0),y:(m.y||0)+(m.axis==='y'?(m.amplitude||0)*s:0),w:m.w,h:m.h,id:m.id||''};
}
function allSolids(level,tick){
  const arr=[...(level.solids||[]),...(level.oneWayPlatforms||[]).map(x=>({...x,oneWay:true}))];
  for(const m of level.movingPlatforms||[])arr.push({...movingRect(m,tick),oneWay:!!m.oneWay,moving:true});
  return arr;
}
function resolveX(p,rects,dx){
  p.x+=dx;
  for(const r of rects){
    if(r.oneWay||!aabb(p,r))continue;
    if(dx>0)p.x=r.x-p.w-C.skin; else if(dx<0)p.x=r.x+r.w+C.skin;
    p.vx=0;
  }
}
function resolveY(p,rects,dy,oldBottom){
  p.y+=dy;p.onGround=false;
  for(const r of rects){
    if(!aabb(p,r))continue;
    if(r.oneWay){
      if(dy<0)continue;
      const top=r.y;
      if(oldBottom>top+0.08)continue;
    }
    if(dy>0){p.y=r.y-p.h-C.skin;p.onGround=true;p.lastGroundVy=p.vy;p.vy=0;}
    else if(dy<0){p.y=r.y+r.h+C.skin;p.vy=0;}
  }
}
function respawn(p){
  p.x=p.checkpoint.x;p.y=p.checkpoint.y;p.vx=0;p.vy=0;p.dead=false;p.finished=false;
  p.coyote=0;p.jumpBuffer=0;p.onGround=false;p.skid=false;p.hardLanding=false;p.deathTicks=0;
}
function step(p,level,inputMask,prevMask=0){
  if(p.finished){p.tick++;return p}\n  if(p.dead){p.deathTicks--;if(p.deathTicks<=0)respawn(p);p.tick++;return p}
  const left=!!(inputMask&INPUT.LEFT),right=!!(inputMask&INPUT.RIGHT),jump=!!(inputMask&INPUT.JUMP);
  const jumpPressed=jump&&!(prevMask&INPUT.JUMP),jumpReleased=!jump&&(prevMask&INPUT.JUMP);
  if(jumpPressed)p.jumpBuffer=C.jumpBuffer; else p.jumpBuffer=Math.max(0,p.jumpBuffer-DT);
  if(p.onGround)p.coyote=C.coyote; else p.coyote=Math.max(0,p.coyote-DT);

  let dir=(right?1:0)-(left?1:0);
  p.skid=false;
  if(p.onGround){
    if(dir){
      if(p.vx!==0&&Math.sign(p.vx)!==dir&&Math.abs(p.vx)>2.6){p.vx=approach(p.vx,0,C.reverseBrake*DT);p.skid=true;}
      else p.vx=approach(p.vx,dir*C.maxRun,C.groundAccel*DT);
    }else p.vx=approach(p.vx,0,C.groundBrake*DT);
  }else if(dir)p.vx=approach(p.vx,dir*C.maxRun,C.airAccel*DT);

  if(p.jumpBuffer>0&&p.coyote>0){
    p.vy=-C.jumpVelocity;p.onGround=false;p.coyote=0;p.jumpBuffer=0;p.jumpHeld=true;
  }
  if(jumpReleased&&p.vy<0)p.vy*=C.jumpCut;
  if(!jump)p.jumpHeld=false;
  p.vy=clamp(p.vy+(p.vy<0?C.gravityUp:C.gravityDown)*DT,-50,C.maxFall);

  const rects=allSolids(level,p.tick);
  resolveX(p,rects,p.vx*DT);
  const oldBottom=p.y+p.h,preVy=p.vy;
  resolveY(p,rects,p.vy*DT,oldBottom);
  p.hardLanding=p.onGround&&preVy>12;

  for(const h of level.hazards||[])if(aabb(p,h)){p.dead=true;p.deathTicks=54;p.deaths++;break}
  if(p.y>(level.killY||30)){p.dead=true;p.deathTicks=54;p.deaths++}
  for(const cp of level.checkpoints||[])if(aabb(p,cp)){p.checkpoint={x:cp.spawnX??cp.x,y:cp.spawnY??(cp.y-p.h-.1)}}
  for(const s of level.shards||[])if(!p.shards.has(s.id)&&aabb(p,{x:s.x-.3,y:s.y-.3,w:.6,h:.6}))p.shards.add(s.id);
  for(const s of level.secrets||[])if(!p.secrets.has(s.id)&&aabb(p,s))p.secrets.add(s.id);
  if(level.finish&&aabb(p,level.finish))p.finished=true;
  p.tick++;
  return p;
}
function simulate(level,replay,maxTicks=120*180){
  const p=createPlayer(level.spawn),changes=[...(replay||[])].sort((a,b)=>a.tick-b.tick);
  let idx=0,mask=0,prev=0;
  for(let tick=0;tick<maxTicks&&!p.finished;tick++){
    while(idx<changes.length&&changes[idx].tick===tick){mask=changes[idx].mask|0;idx++}
    step(p,level,mask,prev);prev=mask;
  }
  return p;
}
function canonicalReplay(changes){
  const out=[];let last=-1,lastMask=-1;
  for(const row of changes||[]){
    const tick=Number(row.tick),mask=Number(row.mask);
    if(!Number.isInteger(tick)||tick<0||tick<=last||!Number.isInteger(mask)||mask<0||mask>7)throw new Error('Invalid replay');
    if(mask!==lastMask)out.push({tick,mask});
    last=tick;lastMask=mask;
  }
  return out;
}
return {VERSION,DT,C,INPUT,createPlayer,step,simulate,canonicalReplay,movingRect};
});