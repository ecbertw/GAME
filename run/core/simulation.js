(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.EixoRunCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

const VERSION='run-core-2026.09';
const DT=1/120;
const INPUT=Object.freeze({LEFT:1,RIGHT:2,JUMP:4});
const TUNE=Object.freeze({
  maxSpeed:8.35,groundAccel:51,groundDecel:60,reverseDecel:76,airAccel:27,
  jumpSpeed:13.05,gravityRise:33,gravityFall:45,maxFall:22,
  coyoteTicks:12,bufferTicks:14,jumpRelease:0.50,
  width:0.72,height:1.38,deathDelayTicks:54,skidThreshold:2.7,
  hardLandingSpeed:14.5,skin:0.001
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const approach=(v,target,delta)=>v<target?Math.min(target,v+delta):Math.max(target,v-delta);
const hit=(a,b)=>a.x+a.w>b.x&&a.x<b.x+b.w&&a.y+a.h>b.y&&a.y<b.y+b.h;

function createPlayer(spawn={x:1.4,y:7.3}){
  return{
    x:Number(spawn.x)||0,y:Number(spawn.y)||0,vx:0,vy:0,w:TUNE.width,h:TUNE.height,
    facing:1,onGround:false,groundId:null,coyoteTicks:0,bufferTicks:0,
    skidTicks:0,landingTicks:0,hardLandingTicks:0,dead:false,deathTicks:0,
    finished:false,deaths:0,tick:0,checkpoint:{x:Number(spawn.x)||0,y:Number(spawn.y)||0},
    shards:new Set(),secrets:new Set(),broken:new Set(),falling:Object.create(null),boostCooldown:0
  };
}
function movingRect(def,tick){
  const period=Math.max(.25,Number(def.period)||2.5);
  const phase=(tick*DT+(Number(def.phase)||0))*Math.PI*2/period;
  const s=Math.sin(phase);
  return{
    id:def.id,
    x:(Number(def.x)||0)+(def.axis==='x'?(Number(def.amplitude)||0)*s:0),
    y:(Number(def.y)||0)+(def.axis==='y'?(Number(def.amplitude)||0)*s:0),
    w:Number(def.w)||1,h:Number(def.h)||.35,oneWay:def.oneWay!==false,moving:true
  };
}
function platformRects(level,p,tick){
  const out=[];
  for(const r of level.solids||[])out.push({...r,oneWay:false});
  for(const r of level.oneWay||[])out.push({...r,oneWay:true});
  for(const r of level.moving||[])out.push(movingRect(r,tick));
  for(const r of level.breakables||[])if(!p.broken.has(r.id))out.push({...r,breakable:true,oneWay:false});
  for(const r of level.falling||[]){
    const triggered=p.falling[r.id],delay=Math.max(0,Number(r.delay)||.3);
    let y=r.y;
    if(triggered!=null){
      const t=Math.max(0,(tick-triggered)*DT-delay);
      if(t>0)y+=9*t*t;
    }
    if(y<(level.killY||22)+4)out.push({...r,y,oneWay:true,falling:true});
  }
  return out;
}
function carry(p,level){
  if(!p.onGround||!p.groundId)return;
  const def=(level.moving||[]).find(x=>x.id===p.groundId);
  if(!def){p.groundId=null;return}
  const a=movingRect(def,Math.max(0,p.tick-1)),b=movingRect(def,p.tick);
  p.x+=b.x-a.x;p.y+=b.y-a.y;
}
function resolveX(p,rects,dx){
  p.x+=dx;if(dx===0)return;
  for(const r of rects){
    if(r.oneWay||!hit(p,r))continue;
    if(dx>0)p.x=r.x-p.w-TUNE.skin;else p.x=r.x+r.w+TUNE.skin;
    p.vx=0;
  }
}
function resolveY(p,rects,dy,oldBottom,impactVy){
  p.y+=dy;p.onGround=false;p.groundId=null;
  let landed=null;
  for(const r of rects){
    if(!hit(p,r))continue;
    if(r.oneWay&&(dy<0||oldBottom>r.y+.075))continue;
    if(dy>=0){
      p.y=r.y-p.h-TUNE.skin;p.vy=0;p.onGround=true;landed=r;
      if(r.falling&&p.falling[r.id]==null)p.falling[r.id]=p.tick;
    }else{
      if(r.breakable&&r.id){p.broken.add(r.id);continue}
      p.y=r.y+r.h+TUNE.skin;p.vy=0;
    }
  }
  if(landed?.moving)p.groundId=landed.id;
  if(landed){
    p.landingTicks=8;
    if(impactVy>=TUNE.hardLandingSpeed)p.hardLandingTicks=12;
  }
}
function respawn(p){
  p.x=p.checkpoint.x;p.y=p.checkpoint.y;p.vx=0;p.vy=0;p.onGround=false;p.groundId=null;
  p.coyoteTicks=0;p.bufferTicks=0;p.skidTicks=0;p.landingTicks=0;p.hardLandingTicks=0;
  p.dead=false;p.deathTicks=0;p.finished=false;p.boostCooldown=0;
  p.broken.clear();p.falling=Object.create(null);
}
function kill(p){
  if(p.dead||p.finished)return;
  p.dead=true;p.deathTicks=TUNE.deathDelayTicks;p.deaths++;p.onGround=false;p.groundId=null;
}
function applySurfaceDevices(p,level){
  if(p.boostCooldown>0)p.boostCooldown--;
  if(!p.onGround)return;
  const feet={x:p.x+.06,y:p.y+p.h-.09,w:p.w-.12,h:.18};
  for(const pad of level.bouncePads||[]){
    if(hit(feet,pad)){
      p.vy=-Math.max(10,Number(pad.power)||15.5);p.onGround=false;p.groundId=null;p.coyoteTicks=0;
      return;
    }
  }
  if(p.boostCooldown<=0)for(const pad of level.speedPads||[]){
    if(hit(feet,pad)){
      const dir=Number(pad.dir)||p.facing||1;
      p.vx=dir*Math.max(Math.abs(p.vx),Number(pad.speed)||10.5);
      p.facing=dir<0?-1:1;p.boostCooldown=18;break;
    }
  }
}
function applyZones(p,level){
  for(const z of level.windZones||[])if(hit(p,z)){
    p.vx=clamp(p.vx+(Number(z.forceX)||0)*DT,-13,13);
    p.vy=clamp(p.vy+(Number(z.forceY)||0)*DT,-24,TUNE.maxFall);
  }
}
function step(p,level,inputMask,previousMask=0){
  if(p.finished){p.tick++;return p}
  if(p.dead){if(--p.deathTicks<=0)respawn(p);p.tick++;return p}

  if(p.skidTicks>0)p.skidTicks--;
  if(p.landingTicks>0)p.landingTicks--;
  if(p.hardLandingTicks>0)p.hardLandingTicks--;

  carry(p,level);

  const left=!!(inputMask&INPUT.LEFT),right=!!(inputMask&INPUT.RIGHT),jump=!!(inputMask&INPUT.JUMP);
  const jumpPressed=jump&&!(previousMask&INPUT.JUMP),jumpReleased=!jump&&(previousMask&INPUT.JUMP);
  if(jumpPressed)p.bufferTicks=TUNE.bufferTicks;else if(p.bufferTicks>0)p.bufferTicks--;
  if(p.onGround)p.coyoteTicks=TUNE.coyoteTicks;else if(p.coyoteTicks>0)p.coyoteTicks--;

  const dir=(right?1:0)-(left?1:0);if(dir)p.facing=dir;
  if(p.onGround){
    if(dir){
      const reversing=Math.sign(p.vx)!==0&&Math.sign(p.vx)!==dir;
      if(reversing&&Math.abs(p.vx)>=TUNE.skidThreshold){
        p.vx=approach(p.vx,0,TUNE.reverseDecel*DT);p.skidTicks=Math.max(p.skidTicks,7);
      }else p.vx=approach(p.vx,dir*TUNE.maxSpeed,TUNE.groundAccel*DT);
    }else p.vx=approach(p.vx,0,TUNE.groundDecel*DT);
  }else if(dir)p.vx=approach(p.vx,dir*TUNE.maxSpeed,TUNE.airAccel*DT);

  if(p.bufferTicks>0&&p.coyoteTicks>0){
    p.vy=-TUNE.jumpSpeed;p.onGround=false;p.groundId=null;p.bufferTicks=0;p.coyoteTicks=0;
  }
  if(jumpReleased&&p.vy<0)p.vy*=TUNE.jumpRelease;

  p.vy=clamp(p.vy+(p.vy<0?TUNE.gravityRise:TUNE.gravityFall)*DT,-40,TUNE.maxFall);
  applyZones(p,level);

  const rects=platformRects(level,p,p.tick);
  resolveX(p,rects,p.vx*DT);
  const oldBottom=p.y+p.h,impactVy=p.vy;
  resolveY(p,rects,p.vy*DT,oldBottom,impactVy);
  applySurfaceDevices(p,level);

  for(const h of level.hazards||[])if(hit(p,h)){kill(p);break}
  if(p.y>(level.killY||22))kill(p);

  for(const cp of level.checkpoints||[])if(hit(p,cp)){
    p.checkpoint={x:Number(cp.spawnX??cp.x),y:Number(cp.spawnY??(cp.y-p.h-.1))};
  }
  for(const s of level.shards||[]){
    const r={x:s.x-.28,y:s.y-.28,w:.56,h:.56};
    if(!p.shards.has(s.id)&&hit(p,r))p.shards.add(s.id);
  }
  for(const s of level.secrets||[])if(!p.secrets.has(s.id)&&hit(p,s))p.secrets.add(s.id);
  if(level.finish&&hit(p,level.finish))p.finished=true;

  p.tick++;return p;
}
function canonicalReplay(rows){
  const out=[];let lastTick=-1,lastMask=null;
  for(const row of rows||[]){
    const tick=Number(row.tick),mask=Number(row.mask);
    if(!Number.isInteger(tick)||tick<0||tick<=lastTick||!Number.isInteger(mask)||mask<0||mask>7)throw new Error('Invalid RUN replay');
    if(mask!==lastMask)out.push({tick,mask});
    lastTick=tick;lastMask=mask;
  }
  return out;
}
function simulate(level,replay,maxTicks=120*180){
  const changes=canonicalReplay(replay),p=createPlayer(level.spawn);let i=0,mask=0,prev=0;
  for(let t=0;t<maxTicks&&!p.finished;t++){
    while(i<changes.length&&changes[i].tick===t){mask=changes[i].mask;i++}
    step(p,level,mask,prev);prev=mask;
  }
  return p;
}
return{VERSION,DT,INPUT,TUNE,createPlayer,movingRect,step,canonicalReplay,simulate};
});