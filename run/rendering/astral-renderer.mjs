import{SpriteRunner}from'../player/sprite-runner.mjs';
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class AstralRenderer{
 constructor(canvas,level){
  this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.level=level;this.runner=new SpriteRunner();this.dpr=1;
  this.fx=[];this.trail=[];this.stars=Array.from({length:120},(_,i)=>({x:(i*97.113)%1,y:(i*61.71)%1,r:.45+(i%4)*.26,a:.20+((i*37)%70)/100}));
 }
 event(e,p){
  if(e.type==='land'||e.type==='hard-land')for(let i=0;i<(e.type==='hard-land'?18:8);i++)this.fx.push({type:e.type==='hard-land'?'impact':'dust',x:p.x+.35,y:p.y+p.h,vx:(Math.random()-.5)*(e.type==='hard-land'?4.4:3.4),vy:-.7-Math.random()*(e.type==='hard-land'?2.4:1.7),life:1});
  if(e.type==='skid')for(let i=0;i<12;i++)this.fx.push({type:'skid',x:p.x+.35,y:p.y+p.h-.04,vx:-p.facing*(1.5+Math.random()*2.8)+(Math.random()-.5),vy:-.25-Math.random()*1.1,life:1});
  if(e.type==='shard')for(let i=0;i<10;i++)this.fx.push({type:'spark',x:p.x+.35,y:p.y+.55,vx:(Math.random()-.5)*3.8,vy:(Math.random()-.5)*3.8,life:1});
  if(e.type==='death')for(let i=0;i<16;i++)this.fx.push({type:'death',x:p.x+.35,y:p.y+.55,vx:(Math.random()-.5)*4.8,vy:-1.0-Math.random()*3.6,life:1});
  if(['checkpoint','secret','finish'].includes(e.type))for(let i=0;i<(e.type==='finish'?34:24);i++)this.fx.push({type:e.type==='finish'?'victory':'spark',x:p.x+.35,y:p.y+.5,vx:(Math.random()-.5)*(e.type==='finish'?6.0:5.0),vy:(Math.random()-.5)*(e.type==='finish'?6.0:5.0),life:1});
 }
 resize(){const r=this.canvas.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h}this.dpr=d}
 roundRect(ctx,x,y,w,h,r){const q=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+q,y);ctx.arcTo(x+w,y,x+w,y+h,q);ctx.arcTo(x+w,y+h,x,y+h,q);ctx.arcTo(x,y+h,x,y,q);ctx.arcTo(x,y,x+w,y,q);ctx.closePath()}
 sky(ctx,w,h,cam){
  const p=this.level.visual.palette,g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,p.skyTop);g.addColorStop(.43,p.skyMid);g.addColorStop(.76,'#a9bcfb');g.addColorStop(1,p.skyHaze);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  const mx=w*this.level.visual.moonX-cam.x*.42,my=h*this.level.visual.moonY,rr=Math.min(w,h)*this.level.visual.moonRadius;
  ctx.save();ctx.shadowColor='#fff7ed';ctx.shadowBlur=45;const mg=ctx.createRadialGradient(mx-rr*.28,my-rr*.35,rr*.08,mx,my,rr);mg.addColorStop(0,'#fffdf8');mg.addColorStop(.72,'#f5f2ff');mg.addColorStop(1,'#ccd8f6');ctx.fillStyle=mg;ctx.beginPath();ctx.arc(mx,my,rr,0,TAU);ctx.fill();ctx.restore();
  ctx.fillStyle='#fff';for(const s of this.stars){ctx.globalAlpha=s.a;ctx.beginPath();ctx.arc(((s.x*w*1.35-cam.x*1.3)%(w*1.35)+w*1.35)%(w*1.35),s.y*h*.57,s.r,0,TAU);ctx.fill()}ctx.globalAlpha=1;
  for(let i=0;i<8;i++){const x=((i*250-cam.x*3.5)%(w+360))-180,y=h*(.30+.055*(i%3));ctx.save();ctx.globalAlpha=.58;ctx.fillStyle=i%2?'#f7c4ed':'#fff';ctx.beginPath();ctx.ellipse(x,y,110,26,0,0,TAU);ctx.ellipse(x+72,y+3,86,22,0,0,TAU);ctx.ellipse(x-62,y+7,70,18,0,0,TAU);ctx.fill();ctx.restore();}
 }
 sanctum(ctx,w,h,cam){
  const x=w*.72-cam.x*1.25,y=h*.43,r=Math.min(w,h)*.12;
  ctx.save();ctx.globalAlpha=.46;
  const beam=ctx.createLinearGradient(x,y-r*2,x,y+r*2.5);beam.addColorStop(0,'#baf8ff00');beam.addColorStop(.28,'#9cf7ff88');beam.addColorStop(.72,'#6ae7ff55');beam.addColorStop(1,'#6ae7ff00');ctx.fillStyle=beam;ctx.fillRect(x-r*.16,y-r*2,r*.32,r*4.7);
  ctx.strokeStyle='#b8f6ff';ctx.lineWidth=2.3;ctx.shadowColor='#7befff';ctx.shadowBlur=16;
  for(const [rx,ry,a] of [[r*1.7,r*.30,.70],[r*1.25,r*.21,.55],[r*.84,r*.14,.42]]){ctx.globalAlpha=a;ctx.beginPath();ctx.ellipse(x,y-r*.72,rx,ry,-.18,0,TAU);ctx.stroke()}
  ctx.shadowBlur=0;ctx.globalAlpha=.62;ctx.fillStyle='#667fbd';ctx.beginPath();ctx.moveTo(x-r*1.08,y-r*.52);ctx.lineTo(x+r*1.03,y-r*.52);ctx.lineTo(x+r*.72,y+r*.18);ctx.lineTo(x+r*.25,y+r*.78);ctx.lineTo(x-r*.18,y+r*.54);ctx.lineTo(x-r*.72,y+r*.10);ctx.closePath();ctx.fill();
  ctx.fillStyle='#8fcf9b';ctx.fillRect(x-r*.92,y-r*.58,r*1.75,r*.10);
  ctx.fillStyle='#dbe6ff';for(let i=-3;i<=3;i++){const xx=x+i*r*.22,hh=r*(.52+.09*((i+3)%3));ctx.fillRect(xx-r*.055,y-r*.58-hh,r*.11,hh)}
  ctx.strokeStyle='#cfdaf4';ctx.lineWidth=4;ctx.globalAlpha=.58;ctx.beginPath();ctx.moveTo(x-r*.64,y-r*.58);ctx.quadraticCurveTo(x,y-r*1.42,x+r*.64,y-r*.58);ctx.stroke();
  ctx.restore();
 }
 farIslands(ctx,w,h,cam,factor,base,alpha){
  ctx.save();ctx.globalAlpha=alpha;const gap=260,shift=-((cam.x*40*factor)%gap);
  for(let i=-2;i<Math.ceil(w/gap)+3;i++){const x=shift+i*gap+(i%2)*38,yy=base-(i%3)*34;
   ctx.fillStyle='#6d80be';ctx.beginPath();ctx.moveTo(x,yy);ctx.lineTo(x+92,yy);ctx.lineTo(x+72,yy+26);ctx.lineTo(x+45,yy+64);ctx.lineTo(x+18,yy+26);ctx.closePath();ctx.fill();
   ctx.fillStyle='#7ecb8d';ctx.fillRect(x+4,yy-5,83,8);
   ctx.strokeStyle='#c4d0f1';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x+12,yy);ctx.lineTo(x+12,yy-62);ctx.quadraticCurveTo(x+47,yy-104,x+82,yy-62);ctx.lineTo(x+82,yy);ctx.stroke();
   ctx.fillStyle='#d8e4ff';ctx.fillRect(x+43,yy-132,10,72);
  }ctx.restore();
 }
 ruins(ctx,w,h,cam,factor,base,alpha){
  const gap=220,shift=-((cam.x*42*factor)%gap);ctx.save();ctx.globalAlpha=alpha;
  for(let i=-2;i<Math.ceil(w/gap)+3;i++){const x=shift+i*gap+(i%2)*26,hh=105+(i%4)*30;
   ctx.fillStyle=factor<.18?'#8da4dc':'#526aa7';ctx.fillRect(x,base-hh,42,hh);ctx.fillRect(x+58,base-hh*.72,30,hh*.72);
   ctx.strokeStyle=factor<.18?'#cfdbf5':'#8ca5db';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x+12,base);ctx.quadraticCurveTo(x+70,base-hh*.90,x+128,base);ctx.stroke();
   ctx.fillStyle='#7ad39b';ctx.fillRect(x+8,base-hh-8,54,8);
  }ctx.restore();
 }
 waterfallWorld(ctx,x,y,depth){
  const g=ctx.createLinearGradient(x,y,x,y+depth);g.addColorStop(0,'#d8fbff');g.addColorStop(.18,'#75ecff');g.addColorStop(1,'#50bfff00');ctx.fillStyle=g;ctx.globalAlpha=.70;ctx.fillRect(x,y,.48,depth);ctx.globalAlpha=.35;ctx.fillStyle='#fff';ctx.fillRect(x+.14,y,.07,depth*.94);ctx.globalAlpha=1;
 }
 island(ctx,r,oneWay=false){
  const p=this.level.visual.palette,depth=oneWay?.52:Math.max(1.2,Math.min(2.8,r.h*.72));
  const grd=ctx.createLinearGradient(0,r.y,0,r.y+depth);grd.addColorStop(0,'#8591a9');grd.addColorStop(.36,p.stoneShadow);grd.addColorStop(1,'#29334e');ctx.fillStyle=grd;
  ctx.beginPath();ctx.moveTo(r.x,r.y);ctx.lineTo(r.x+r.w,r.y);ctx.lineTo(r.x+r.w-.25,r.y+depth*.40);ctx.lineTo(r.x+r.w*.77,r.y+depth);ctx.lineTo(r.x+r.w*.56,r.y+depth*.76);ctx.lineTo(r.x+r.w*.32,r.y+depth*.93);ctx.lineTo(r.x,r.y+depth*.42);ctx.closePath();ctx.fill();
  ctx.fillStyle='#dce7f4';ctx.fillRect(r.x,r.y-.20,r.w,.16);ctx.fillStyle='#afbdd5';ctx.fillRect(r.x,r.y-.05,r.w,.10);
  ctx.fillStyle=p.grass;ctx.fillRect(r.x,r.y-.18,r.w,.08);ctx.fillStyle='#9be17f';ctx.fillRect(r.x,r.y-.18,r.w,.035);
  if(r.w>5){for(let q=r.x+.8;q<r.x+r.w-.6;q+=2.2){ctx.fillStyle='#6dbf78';ctx.beginPath();ctx.moveTo(q,r.y-.20);ctx.lineTo(q+.06,r.y-.42);ctx.lineTo(q+.13,r.y-.20);ctx.fill();ctx.fillStyle=(Math.floor(q*10)%2?'#ef9cda':'#8bf3ff');ctx.beginPath();ctx.arc(q+.06,r.y-.43,.035,0,TAU);ctx.fill()}}
  if(!oneWay)for(let q=r.x+.55;q<r.x+r.w-.3;q+=1.45){ctx.fillStyle='#57e4ff';ctx.globalAlpha=.72;ctx.fillRect(q,r.y+.45,.08,.52);ctx.globalAlpha=1}
 }
 shard(ctx,s,t){
  ctx.save();ctx.translate(s.x,s.y);ctx.rotate(Math.sin(t*.003+s.x)*.12);ctx.shadowColor='#53efff';ctx.shadowBlur=.40;ctx.fillStyle='#54ebff';ctx.beginPath();ctx.moveTo(0,-.46);ctx.lineTo(.26,-.07);ctx.lineTo(.11,.44);ctx.lineTo(-.13,.44);ctx.lineTo(-.27,-.07);ctx.closePath();ctx.fill();ctx.fillStyle='#dffcff';ctx.beginPath();ctx.moveTo(0,-.34);ctx.lineTo(.09,-.06);ctx.lineTo(0,.25);ctx.lineTo(-.07,-.05);ctx.closePath();ctx.fill();ctx.restore();
 }
 hazard(ctx,h){
  const n=Math.max(2,Math.round(h.w/.34));ctx.save();ctx.shadowColor='#ff244d';ctx.shadowBlur=.24;
  for(let i=0;i<n;i++){const x=h.x+i*h.w/n,w=h.w/n,g=ctx.createLinearGradient(x,h.y,x,h.y+h.h);g.addColorStop(0,'#ff3e5d');g.addColorStop(1,'#71152e');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x,h.y+h.h);ctx.lineTo(x+w*.5,h.y);ctx.lineTo(x+w,h.y+h.h);ctx.closePath();ctx.fill()}ctx.restore();
 }
 checkpoint(ctx,cp,t){
  ctx.save();ctx.translate(cp.x+cp.w/2,cp.y+cp.h/2);ctx.fillStyle='#26355d';ctx.fillRect(-.25,-cp.h/2,.50,cp.h);ctx.fillStyle='#ef294f';ctx.fillRect(-.25,-cp.h/2,.50,.18);
  ctx.fillStyle='#5d4b86';ctx.fillRect(.25,-cp.h*.35,1.10,1.70);ctx.strokeStyle='#b9c8f2';ctx.lineWidth=.06;ctx.strokeRect(.25,-cp.h*.35,1.10,1.70);
  ctx.strokeStyle='#74f2ff';ctx.globalAlpha=.68+.22*Math.sin(t*.004);ctx.beginPath();ctx.arc(.80,.48,.28,0,TAU);ctx.stroke();ctx.beginPath();ctx.moveTo(.60,.25);ctx.lineTo(1.00,.70);ctx.moveTo(1.00,.25);ctx.lineTo(.60,.70);ctx.stroke();ctx.restore();
 }
 breakable(ctx,r){
  ctx.fillStyle='#56617a';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.strokeStyle='#9aa9c4';ctx.lineWidth=.055;ctx.strokeRect(r.x+.04,r.y+.04,r.w-.08,r.h-.08);
  ctx.strokeStyle='#2f3a56';ctx.beginPath();ctx.moveTo(r.x+.22,r.y+.18);ctx.lineTo(r.x+.62,r.y+.52);ctx.lineTo(r.x+.40,r.y+.98);ctx.moveTo(r.x+.75,r.y+.15);ctx.lineTo(r.x+.55,r.y+.55);ctx.lineTo(r.x+.92,r.y+.91);ctx.stroke();
  ctx.fillStyle='#65efff';ctx.globalAlpha=.8;ctx.fillRect(r.x+.52,r.y+.46,.16,.16);ctx.globalAlpha=1;
 }
 finish(ctx,f,t){
  ctx.save();ctx.translate(f.x+f.w/2,f.y+f.h/2);ctx.strokeStyle='#ff3155';ctx.lineWidth=.14;ctx.shadowColor='#ff3155';ctx.shadowBlur=.52;ctx.beginPath();ctx.ellipse(0,0,f.w*.44,f.h*.43,0,0,TAU);ctx.stroke();ctx.strokeStyle='#76f4ff';ctx.globalAlpha=.62+.24*Math.sin(t*.004);ctx.lineWidth=.05;ctx.beginPath();ctx.ellipse(0,0,f.w*.29,f.h*.31,0,0,TAU);ctx.stroke();ctx.restore();
 }
 foreground(ctx,w,h,cam){
  ctx.save();ctx.globalAlpha=.34;ctx.fillStyle='#0b2a54';
  for(let i=0;i<7;i++){const x=((i*220-cam.x*70)%(w+300))-120,base=h+12,height=38+(i%3)*18;ctx.beginPath();ctx.ellipse(x,base-height*.15,92,height*.55,0,0,TAU);ctx.fill()}
  ctx.globalAlpha=.26;ctx.fillStyle='#3edcff';
  for(let i=0;i<5;i++){const x=((i*330-cam.x*94)%(w+380))-110,y=h-20;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+12,y-64-(i%2)*25);ctx.lineTo(x+25,y);ctx.closePath();ctx.fill()}
  ctx.restore();
 }
 draw(player,cam,time,ghosts=[]){
  this.resize();const ctx=this.ctx,w=this.canvas.width/this.dpr,h=this.canvas.height/this.dpr;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.clearRect(0,0,w,h);
  this.sky(ctx,w,h,cam);this.sanctum(ctx,w,h,cam);this.farIslands(ctx,w,h,cam,.05,h*.55,.30);this.ruins(ctx,w,h,cam,.10,h*.72,.33);this.ruins(ctx,w,h,cam,.23,h*.85,.48);
  const scale=Math.min(78,Math.max(49,w/18)),ox=w*.31,oy=h*.55;ctx.save();ctx.setTransform(this.dpr*scale,0,0,this.dpr*scale,this.dpr*(ox-cam.x*scale),this.dpr*(oy-cam.y*scale));
  for(const r of this.level.solids)this.island(ctx,r,false);for(const r of this.level.oneWay)this.island(ctx,r,true);
  for(const m of this.level.movingPlatforms){const r=EixoRunCore.platformAt(m,player.tick);this.island(ctx,r,true);ctx.fillStyle='#63f1ff';ctx.fillRect(r.x+.35,r.y+.34,r.w-.7,.08)}
  for(const r of this.level.breakables)if(!player.broken.has(r.id))this.breakable(ctx,r);
  for(const x of this.level.visual.waterfalls||[]){const base=this.level.solids.find(s=>x>=s.x&&x<=s.x+s.w);if(base)this.waterfallWorld(ctx,x,base.y+.08,4.2)}
  for(const hz of this.level.hazards)this.hazard(ctx,hz);for(const s of this.level.shards)if(!player.collected.has(s.id))this.shard(ctx,s,time);for(const cp of this.level.checkpoints)this.checkpoint(ctx,cp,time);this.finish(ctx,this.level.finish,time);
  if(Math.abs(player.vx)>6.25&&!player.dead){this.trail.unshift({x:player.x,y:player.y,facing:player.facing,tick:player.tick,life:1});if(this.trail.length>7)this.trail.length=7}
  for(const t of this.trail)t.life-=.13;this.trail=this.trail.filter(t=>t.life>0);for(let i=this.trail.length-1;i>=0;i--){const t=this.trail[i];this.runner.draw(ctx,{...player,...t},{alpha:.075*t.life,tint:'#58e9ff'})}
  for(const g of ghosts||[])if(g?.player&&!g.player.dead&&g.player.finishTick==null)this.runner.draw(ctx,g.player,{alpha:.28,tint:g.tint||'#72eaff'});
  if(!player.dead&&Number(player.vipLevel)>0){const radius=.72+.08*Math.sin(time*.006);ctx.save();ctx.globalAlpha=.15+.03*Math.min(6,Number(player.vipLevel));ctx.fillStyle=Number(player.vipLevel)>=6?'#ffd45e':'#66eaff';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=.45;ctx.beginPath();ctx.ellipse(player.x+.36,player.y+.7,radius,radius*1.35,0,0,TAU);ctx.fill();ctx.restore()}
  this.runner.draw(ctx,player,{alpha:player.dead?Math.max(.18,Math.min(1,player.respawnTicks/18)):1});
  for(const f of this.fx){f.x+=f.vx*.016;f.y+=f.vy*.016;f.vy+=1.8*.016;f.life-=.028;ctx.globalAlpha=Math.max(0,f.life);ctx.fillStyle=f.type==='dust'||f.type==='skid'?'#eadcec':f.type==='impact'?'#ffffff':f.type==='death'?'#ffcf5d':f.type==='victory'?(f.life>.55?'#ffd45f':'#ff5fd7'):'#82f7ff';ctx.beginPath();ctx.arc(f.x,f.y,.04+.08*f.life,0,TAU);ctx.fill()}ctx.globalAlpha=1;this.fx=this.fx.filter(f=>f.life>0);ctx.restore();
  this.foreground(ctx,w,h,cam);
 }
}