import{SpriteRunner}from'../player/sprite-runner.mjs';
const TAU=Math.PI*2;
export class AstralRenderer{
 constructor(canvas,level){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.level=level;this.runner=new SpriteRunner();this.dpr=1;this.fx=[];this.trail=[];this.stars=Array.from({length:110},(_,i)=>({x:(i*97.113)%1,y:(i*61.71)%1,r:.45+(i%4)*.28}))}
 event(e,p){if(e.type==='land'||e.type==='hard-land')for(let i=0;i<(e.type==='hard-land'?12:6);i++)this.fx.push({type:'dust',x:p.x+.35,y:p.y+p.h,vx:(Math.random()-.5)*3,vy:-.6-Math.random()*1.8,life:1});
 if(e.type==='shard')for(let i=0;i<8;i++)this.fx.push({type:'spark',x:p.x+.35,y:p.y+.55,vx:(Math.random()-.5)*3.5,vy:(Math.random()-.5)*3.5,life:1});
 if(e.type==='checkpoint'||e.type==='secret'||e.type==='finish')for(let i=0;i<18;i++)this.fx.push({type:'spark',x:p.x+.35,y:p.y+.5,vx:(Math.random()-.5)*4.5,vy:(Math.random()-.5)*4.5,life:1});}
 resize(){const r=this.canvas.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h}this.dpr=d}
 sky(ctx,w,h,cam){const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#0a2866');g.addColorStop(.42,'#3f68c9');g.addColorStop(.74,'#8a8de2');g.addColorStop(1,'#f1bedf');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  const mx=w*.72-cam.x*.4,my=h*.19,rr=Math.min(w,h)*.17,mg=ctx.createRadialGradient(mx-rr*.32,my-rr*.35,rr*.07,mx,my,rr);mg.addColorStop(0,'#fff');mg.addColorStop(.64,'#f2f4ff');mg.addColorStop(1,'#aabdea');ctx.fillStyle=mg;ctx.beginPath();ctx.arc(mx,my,rr,0,TAU);ctx.fill();
  ctx.fillStyle='#fff';for(const s of this.stars){ctx.globalAlpha=.22+(s.x*.7);ctx.beginPath();ctx.arc(((s.x*w*1.3-cam.x*1.3)%(w*1.3)+w*1.3)%(w*1.3),s.y*h*.56,s.r,0,TAU);ctx.fill()}ctx.globalAlpha=1;
  for(let i=0;i<7;i++){const x=((i*250-cam.x*4.2)%(w+320))-160,y=h*(.31+.05*(i%3));ctx.fillStyle=i%2?'#f5c8f0aa':'#ffffffa0';ctx.beginPath();ctx.ellipse(x,y,95,24,0,0,TAU);ctx.ellipse(x+70,y+4,75,19,0,0,TAU);ctx.fill();}
 }
 ruins(ctx,w,h,cam,factor,base,alpha){const gap=230,shift=-((cam.x*38*factor)%gap);ctx.save();ctx.globalAlpha=alpha;for(let i=-2;i<Math.ceil(w/gap)+3;i++){const x=shift+i*gap+(i%2)*28,hh=100+(i%4)*32;ctx.fillStyle=factor<.18?'#7388cb':'#2b4b89';ctx.fillRect(x,base-hh,44,hh);ctx.fillRect(x+54,base-hh*.70,30,hh*.70);ctx.strokeStyle=factor<.18?'#b5c3f0':'#7290cb';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x+10,base);ctx.quadraticCurveTo(x+70,base-hh*.86,x+130,base);ctx.stroke();ctx.fillStyle='#77e5d655';ctx.fillRect(x+12,base-hh-7,52,7)}ctx.restore()}
 island(ctx,x,y,w,depth=2.1){const grd=ctx.createLinearGradient(0,y,0,y+depth);grd.addColorStop(0,'#6e778d');grd.addColorStop(.35,'#424a64');grd.addColorStop(1,'#20283f');ctx.fillStyle=grd;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y);ctx.lineTo(x+w-.3,y+depth*.45);ctx.lineTo(x+w*.72,y+depth);ctx.lineTo(x+w*.42,y+depth*.74);ctx.lineTo(x+w*.18,y+depth*.92);ctx.lineTo(x,y+depth*.4);ctx.closePath();ctx.fill();ctx.fillStyle='#55a857';ctx.fillRect(x,y-.13,w,.28);ctx.fillStyle='#9ddd76';ctx.fillRect(x,y-.13,w,.07);for(let q=x+.4;q<x+w-.3;q+=1.4){ctx.fillStyle='#69e8ff';ctx.fillRect(q,y+.42,.08,.45)}}
 shard(ctx,s,t){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(Math.sin(t*.003+s.x)*.12);ctx.shadowColor='#51eaff';ctx.shadowBlur=.38;ctx.fillStyle='#59efff';ctx.beginPath();ctx.moveTo(0,-.43);ctx.lineTo(.24,-.05);ctx.lineTo(.10,.42);ctx.lineTo(-.12,.42);ctx.lineTo(-.25,-.05);ctx.closePath();ctx.fill();ctx.fillStyle='#d4fbff';ctx.beginPath();ctx.moveTo(0,-.32);ctx.lineTo(.08,-.05);ctx.lineTo(0,.23);ctx.lineTo(-.06,-.04);ctx.closePath();ctx.fill();ctx.restore()}
 hazard(ctx,h){const n=Math.max(2,Math.round(h.w/.34));ctx.shadowColor='#ff244d';ctx.shadowBlur=.22;ctx.fillStyle='#ff244d';for(let i=0;i<n;i++){const x=h.x+i*h.w/n,w=h.w/n;ctx.beginPath();ctx.moveTo(x,h.y+h.h);ctx.lineTo(x+w*.5,h.y);ctx.lineTo(x+w,h.y+h.h);ctx.closePath();ctx.fill()}ctx.shadowBlur=0}
 checkpoint(ctx,cp,t){ctx.save();ctx.translate(cp.x+cp.w/2,cp.y+cp.h/2);ctx.fillStyle='#473657';ctx.fillRect(-.22,-cp.h/2,.44,cp.h);ctx.fillStyle='#ef294f';ctx.fillRect(-.22,-cp.h/2,.44,.16);ctx.strokeStyle='#6fefff';ctx.lineWidth=.07;ctx.globalAlpha=.72+.2*Math.sin(t*.004);ctx.beginPath();ctx.ellipse(0,0,.5,1.15,0,0,TAU);ctx.stroke();ctx.restore()}
 finish(ctx,f,t){ctx.save();ctx.translate(f.x+f.w/2,f.y+f.h/2);ctx.strokeStyle='#ff3155';ctx.lineWidth=.14;ctx.shadowColor='#ff3155';ctx.shadowBlur=.45;ctx.beginPath();ctx.ellipse(0,0,f.w*.42,f.h*.42,0,0,TAU);ctx.stroke();ctx.strokeStyle='#7af2ff';ctx.globalAlpha=.62+.24*Math.sin(t*.004);ctx.lineWidth=.05;ctx.beginPath();ctx.ellipse(0,0,f.w*.28,f.h*.31,0,0,TAU);ctx.stroke();ctx.restore()}
 draw(player,cam,time){
  this.resize();const ctx=this.ctx,w=this.canvas.width/this.dpr,h=this.canvas.height/this.dpr;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.clearRect(0,0,w,h);
  this.sky(ctx,w,h,cam);this.ruins(ctx,w,h,cam,.08,h*.72,.32);this.ruins(ctx,w,h,cam,.22,h*.84,.44);
  const scale=Math.min(76,Math.max(48,w/18)),ox=w*.31,oy=h*.55;ctx.save();ctx.setTransform(this.dpr*scale,0,0,this.dpr*scale,this.dpr*(ox-cam.x*scale),this.dpr*(oy-cam.y*scale));
  for(const r of this.level.solids)this.island(ctx,r.x,r.y,r.w,Math.min(2.7,r.h*.75));
  for(const r of this.level.oneWay)this.island(ctx,r.x,r.y,r.w,.55);
  for(const m of this.level.movingPlatforms){const r=EixoRunCore.platformAt(m,player.tick);this.island(ctx,r.x,r.y,r.w,.5);ctx.fillStyle='#6fefff';ctx.fillRect(r.x+.4,r.y+.35,r.w-.8,.08)}
  for(const r of this.level.breakables)if(!player.broken.has(r.id)){ctx.fillStyle='#51566e';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.strokeStyle='#8b91a9';ctx.lineWidth=.05;ctx.strokeRect(r.x+.04,r.y+.04,r.w-.08,r.h-.08);ctx.fillStyle='#67eaff';ctx.fillRect(r.x+.5,r.y+.46,.18,.18)}
  for(const hz of this.level.hazards)this.hazard(ctx,hz);
  for(const s of this.level.shards)if(!player.collected.has(s.id))this.shard(ctx,s,time);
  for(const cp of this.level.checkpoints)this.checkpoint(ctx,cp,time);this.finish(ctx,this.level.finish,time);
  if(Math.abs(player.vx)>6.3&&!player.dead){this.trail.unshift({x:player.x,y:player.y,facing:player.facing,tick:player.tick,life:1});if(this.trail.length>6)this.trail.length=6}
  for(const t of this.trail)t.life-=.14;this.trail=this.trail.filter(t=>t.life>0);for(let i=this.trail.length-1;i>=0;i--){const t=this.trail[i];this.runner.draw(ctx,{...player,...t},{alpha:.07*t.life,tint:'#56e8ff'})}
  if(!player.dead)this.runner.draw(ctx,player);
  for(const f of this.fx){f.x+=f.vx*.016;f.y+=f.vy*.016;f.vy+=1.8*.016;f.life-=.028;ctx.globalAlpha=Math.max(0,f.life);ctx.fillStyle=f.type==='dust'?'#d9d7eb':'#7df6ff';ctx.beginPath();ctx.arc(f.x,f.y,.04+.08*f.life,0,TAU);ctx.fill()}ctx.globalAlpha=1;this.fx=this.fx.filter(f=>f.life>0);
  ctx.restore();
  ctx.save();ctx.globalAlpha=.36;ctx.fillStyle='#152b5d';for(let i=0;i<10;i++){const x=((i*190-cam.x*64)%(w+240))-100;ctx.beginPath();ctx.ellipse(x,h-10,100,34,0,0,TAU);ctx.fill()}ctx.restore();
 }
}