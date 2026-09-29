(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.EixoRunCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='run-astral-1.0.0',DT=1/120;
const INPUT=Object.freeze({LEFT:1,RIGHT:2,JUMP:4});
const C=Object.freeze({
 width:.72,height:1.36,maxRun:8.35,groundAccel:54,groundBrake:64,reverseBrake:82,
 airAccel:28,jumpVelocity:13.15,gravityRise:33.5,gravityFall:46,maxFall:22.5,
 coyoteTicks:12,jumpBufferTicks:14,jumpCut:.50,skidThreshold:3.15,
 hardLandSpeed:14.4,respawnTicks:52,skin:.001
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),approach=(v,t,d)=>v<t?Math.min(t,v+d):Math.max(t,v-d);
const overlap=(a,b)=>a.x+a.w>b.x&&a.x<b.x+b.w&&a.y+a.h>b.y&&a.y<b.y+b.h;
const rect=(x,y,w,h,id='',extra={})=>({x,y,w,h,id,...extra});
function platformAt(m,tick){const q=(tick||0)*DT*Math.PI*2/(m.period||3),s=Math.sin(q+(m.phase||0));return rect(m.x+(m.dx||0)*s,m.y+(m.dy||0)*s,m.w,m.h,m.id,{oneWay:m.oneWay!==false,moving:true});}
function createPlayer(spawn={x:2,y:7}){
 return{x:+spawn.x||0,y:+spawn.y||0,vx:0,vy:0,w:C.width,h:C.height,facing:1,onGround:false,
 coyote:0,jumpBuffer:0,skid:false,landingTicks:0,hardLanding:0,dead:false,respawnTicks:0,deaths:0,tick:0,
 spawn:{x:+spawn.x||0,y:+spawn.y||0},checkpoint:null,collected:new Set(),secrets:new Set(),broken:new Set(),startTick:null,finishTick:null};
}
function resetAfterDeath(p){p.x=p.spawn.x;p.y=p.spawn.y;p.vx=p.vy=0;p.onGround=false;p.coyote=p.jumpBuffer=0;p.skid=false;p.hardLanding=0;p.dead=false;p.respawnTicks=0;}
function kill(p){if(p.dead||p.finishTick!=null)return false;p.dead=true;p.respawnTicks=C.respawnTicks;p.vx=p.vy=0;p.deaths++;return true;}
function staticSolids(level,p){
 const out=[];
 for(const r of level.solids||[])out.push(r);
 for(const r of level.oneWay||[])out.push({...r,oneWay:true});
 for(const r of level.breakables||[])if(!p.broken.has(r.id))out.push({...r,breakable:true});
 for(const m of level.movingPlatforms||[])out.push(platformAt(m,p.tick));
 return out;
}
function resolveX(p,solids,dx){
 if(!dx)return;p.x+=dx;
 for(const r of solids){if(r.oneWay||!overlap(p,r))continue;if(dx>0)p.x=r.x-p.w-C.skin;else p.x=r.x+r.w+C.skin;p.vx=0;}
}
function resolveY(p,solids,dy){
 const oldBottom=p.y+p.h,oldTop=p.y;p.y+=dy;p.onGround=false;let landing=0;
 for(const r of solids){
  if(!overlap(p,r))continue;
  if(r.oneWay&&(dy<0||oldBottom>r.y+.08))continue;
  if(dy>0&&oldBottom<=r.y+.10){landing=Math.max(landing,p.vy);p.y=r.y-p.h-C.skin;p.vy=0;p.onGround=true;}
  else if(dy<0&&oldTop>=r.y+r.h-.08&&!r.oneWay){
   if(r.breakable){p.broken.add(r.id);p.vy=Math.max(1.4,p.vy*.12);continue;}
   p.y=r.y+r.h+C.skin;p.vy=0;
  }
 }
 return landing;
}
function interactions(p,level,events){
 for(const s of level.shards||[])if(!p.collected.has(s.id)&&overlap(p,{x:s.x-.24,y:s.y-.32,w:.48,h:.64})){p.collected.add(s.id);events.push({type:'shard',id:s.id});}
 for(const z of level.secrets||[])if(!p.secrets.has(z.id)&&overlap(p,z)){p.secrets.add(z.id);events.push({type:'secret',id:z.id});}
 for(const cp of level.checkpoints||[])if(p.checkpoint!==cp.id&&overlap(p,cp)){p.checkpoint=cp.id;p.spawn={x:cp.spawnX,y:cp.spawnY};events.push({type:'checkpoint',id:cp.id});}
 for(const h of level.hazards||[]){const box={x:h.x+.10,y:h.y+.14,w:Math.max(.05,h.w-.20),h:Math.max(.05,h.h-.14)};if(overlap(p,box)){if(kill(p))events.push({type:'death'});break;}}
 if(!p.dead&&p.finishTick==null&&level.finish&&overlap(p,level.finish)){p.finishTick=p.tick;events.push({type:'finish'});}
}
function step(p,level,mask,prevMask=0){
 const events=[];
 if(p.finishTick!=null){p.tick++;return events;}
 if(p.dead){p.respawnTicks--;if(p.respawnTicks<=0){resetAfterDeath(p);events.push({type:'respawn'});}p.tick++;return events;}
 const left=!!(mask&INPUT.LEFT),right=!!(mask&INPUT.RIGHT),jump=!!(mask&INPUT.JUMP),prevJump=!!(prevMask&INPUT.JUMP);
 const pressed=jump&&!prevJump,released=!jump&&prevJump;if(pressed)p.jumpBuffer=C.jumpBufferTicks;else if(p.jumpBuffer>0)p.jumpBuffer--;
 if(p.onGround)p.coyote=C.coyoteTicks;else if(p.coyote>0)p.coyote--;if(p.landingTicks>0)p.landingTicks--;if(p.hardLanding>0)p.hardLanding--;
 const dir=(right?1:0)-(left?1:0);if(dir)p.facing=dir;p.skid=false;
 if(p.onGround){
  if(dir){
   if(Math.sign(p.vx)&&Math.sign(p.vx)!==dir&&Math.abs(p.vx)>=C.skidThreshold){p.vx=approach(p.vx,0,C.reverseBrake*DT);p.skid=true;}
   else p.vx=approach(p.vx,dir*C.maxRun,C.groundAccel*DT);
  }else p.vx=approach(p.vx,0,C.groundBrake*DT);
 }else if(dir)p.vx=approach(p.vx,dir*C.maxRun,C.airAccel*DT);
 if(p.jumpBuffer>0&&p.coyote>0){p.vy=-C.jumpVelocity;p.onGround=false;p.coyote=0;p.jumpBuffer=0;events.push({type:'jump'});}
 if(released&&p.vy<0)p.vy*=C.jumpCut;
 p.vy=clamp(p.vy+(p.vy<0?C.gravityRise:C.gravityFall)*DT,-40,C.maxFall);
 const solids=staticSolids(level,p);resolveX(p,solids,p.vx*DT);const landed=resolveY(p,solids,p.vy*DT);
 if(p.onGround&&landed>2){const hard=landed>C.hardLandSpeed;events.push({type:hard?'hard-land':'land',speed:landed});p.landingTicks=hard?11:6;if(hard)p.hardLanding=11;}
 if(p.startTick==null&&Number.isFinite(level.startX)&&p.x+p.w*.5>=level.startX)p.startTick=p.tick;
 interactions(p,level,events);if(p.y>(level.killY||28)&&kill(p))events.push({type:'death'});
 p.tick++;return events;
}
function simulate(level,replay,maxTicks=24000){
 const p=createPlayer(level.spawn);let prev=0,mask=0,ri=0;
 const rows=Array.isArray(replay)?replay:[];
 for(let t=0;t<maxTicks;t++){
  while(ri<rows.length&&Number(rows[ri].t)===t){mask=Number(rows[ri].m)|0;ri++;}
  step(p,level,mask,prev);prev=mask;if(p.finishTick!=null)break;
 }
 return p;
}
return{VERSION,DT,INPUT,C,createPlayer,step,kill,simulate,platformAt,overlap};
});