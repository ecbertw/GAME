(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.EixoRunCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

const VERSION='run-next-1';
const DT=1/120;
const INPUT=Object.freeze({LEFT:1,RIGHT:2,JUMP:4});
const C=Object.freeze({
  width:.72,height:1.38,maxRun:8.2,
  groundAccel:52,groundBrake:60,reverseBrake:76,airAccel:27,
  jumpVelocity:13,gravityRise:33,gravityFall:45,maxFall:22,
  coyoteTicks:12,jumpBufferTicks:14,jumpCut:.5,
  skidThreshold:3.0,hardLandSpeed:14.5,respawnTicks:48,skin:.001
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const approach=(v,t,d)=>v<t?Math.min(t,v+d):Math.max(t,v-d);
const hit=(a,b)=>a.x+a.w>b.x&&a.x<b.x+b.w&&a.y+a.h>b.y&&a.y<b.y+b.h;

function createPlayer(spawn={x:1.5,y:5.5}){
  return {
    x:Number(spawn.x)||0,y:Number(spawn.y)||0,vx:0,vy:0,w:C.width,h:C.height,
    facing:1,onGround:false,coyote:0,jumpBuffer:0,skid:false,
    hardLanding:0,dead:false,respawnTicks:0,deaths:0,tick:0,
    spawn:{x:Number(spawn.x)||0,y:Number(spawn.y)||0}
  };
}
function reset(p){
  p.x=p.spawn.x;p.y=p.spawn.y;p.vx=0;p.vy=0;p.facing=1;p.onGround=false;
  p.coyote=0;p.jumpBuffer=0;p.skid=false;p.hardLanding=0;p.dead=false;p.respawnTicks=0;
}
function kill(p){
  if(p.dead)return;
  p.dead=true;p.respawnTicks=C.respawnTicks;p.vx=0;p.vy=0;p.deaths++;
}
function resolveX(p,solids,dx){
  p.x+=dx;
  for(const r of solids){
    if(!hit(p,r))continue;
    if(dx>0)p.x=r.x-p.w-C.skin;
    else if(dx<0)p.x=r.x+r.w+C.skin;
    p.vx=0;
  }
}
function resolveY(p,solids,dy){
  const oldBottom=p.y+p.h,oldTop=p.y;
  p.y+=dy;p.onGround=false;
  let landedVy=0;
  for(const r of solids){
    if(!hit(p,r))continue;
    if(r.oneWay){
      if(dy<0||oldBottom>r.y+.06)continue;
    }
    if(dy>0&&oldBottom<=r.y+.08){
      landedVy=p.vy;p.y=r.y-p.h-C.skin;p.vy=0;p.onGround=true;
    }else if(dy<0&&oldTop>=r.y+r.h-.08&&!r.oneWay){
      p.y=r.y+r.h+C.skin;p.vy=0;
    }
  }
  return landedVy;
}
function step(p,level,mask,prevMask=0){
  if(p.dead){
    if(--p.respawnTicks<=0)reset(p);
    p.tick++;return p;
  }
  const left=!!(mask&INPUT.LEFT),right=!!(mask&INPUT.RIGHT),jump=!!(mask&INPUT.JUMP);
  const prevJump=!!(prevMask&INPUT.JUMP),pressed=jump&&!prevJump,released=!jump&&prevJump;
  if(pressed)p.jumpBuffer=C.jumpBufferTicks; else if(p.jumpBuffer>0)p.jumpBuffer--;
  if(p.onGround)p.coyote=C.coyoteTicks; else if(p.coyote>0)p.coyote--;
  if(p.hardLanding>0)p.hardLanding--;

  const dir=(right?1:0)-(left?1:0);
  if(dir)p.facing=dir;
  p.skid=false;
  if(p.onGround){
    if(dir){
      if(Math.sign(p.vx)&&Math.sign(p.vx)!==dir&&Math.abs(p.vx)>=C.skidThreshold){
        p.vx=approach(p.vx,0,C.reverseBrake*DT);p.skid=true;
      }else p.vx=approach(p.vx,dir*C.maxRun,C.groundAccel*DT);
    }else p.vx=approach(p.vx,0,C.groundBrake*DT);
  }else if(dir)p.vx=approach(p.vx,dir*C.maxRun,C.airAccel*DT);

  if(p.jumpBuffer>0&&p.coyote>0){
    p.vy=-C.jumpVelocity;p.onGround=false;p.coyote=0;p.jumpBuffer=0;
  }
  if(released&&p.vy<0)p.vy*=C.jumpCut;

  p.vy=clamp(p.vy+(p.vy<0?C.gravityRise:C.gravityFall)*DT,-40,C.maxFall);
  const solids=[...(level.solids||[]),...(level.oneWay||[]).map(r=>({...r,oneWay:true}))];
  resolveX(p,solids,p.vx*DT);
  const landed=resolveY(p,solids,p.vy*DT);
  if(p.onGround&&landed>C.hardLandSpeed)p.hardLanding=10;

  for(const h of level.hazards||[])if(hit(p,h)){kill(p);break}
  if(p.y>(level.killY??24))kill(p);
  p.tick++;return p;
}
return {VERSION,DT,INPUT,C,createPlayer,reset,step,kill};
});
