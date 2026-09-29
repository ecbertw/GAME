import{SpriteRunner}from'../player/sprite-runner.mjs';
const TAU=Math.PI*2;
class ArtAssets{
 constructor(){
  this.paths={
   sky:'/assets/run/astral/sky-first-light.svg',
   far:'/assets/run/astral/ruins-far.svg',
   mid:'/assets/run/astral/ruins-mid.svg',
   foreground:'/assets/run/astral/foreground.svg',
   platform:'/assets/run/astral/platform-main.svg',
   moving:'/assets/run/astral/platform-moving.svg',
   shard:'/assets/run/astral/shard.svg',
   checkpoint:'/assets/run/astral/checkpoint.svg'
  };
  this.images={};this.ready=Promise.all(Object.entries(this.paths).map(([k,src])=>new Promise(resolve=>{const im=new Image();im.decoding='async';im.onload=()=>{this.images[k]=im;resolve()};im.onerror=resolve;im.src=src})));
 }
 drawCover(ctx,img,x,y,w,h,alpha=1){if(!img)return;ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(img,x,y,w,h);ctx.restore()}
}
export class AstralRenderer{
 constructor(canvas,level){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.level=level;this.runner=new SpriteRunner();this.art=new ArtAssets();this.ready=Promise.all([this.runner.ready,this.art.ready]);this.dpr=1;this.fx=[];this.trail=[]}
 resize(){const r=this.canvas.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h}this.dpr=d}
 event(e,p){
  if(e.type==='land'||e.type==='hard-land')for(let i=0;i<(e.type==='hard-land'?18:8);i++)this.fx.push({type:e.type==='hard-land'?'impact':'dust',x:p.x+.35,y:p.y+p.h,vx:(Math.random()-.5)*(e.type==='hard-land'?4.4:3.4),vy:-.7-Math.random()*(e.type==='hard-land'?2.4:1.7),life:1});
  if(e.type==='skid')for(let i=0;i<12;i++)this.fx.push({type:'skid',x:p.x+.35,y:p.y+p.h-.04,vx:-p.facing*(1.5+Math.random()*2.8)+(Math.random()-.5),vy:-.25-Math.random()*1.1,life:1});
  if(e.type==='shard')for(let i=0;i<10;i++)this.fx.push({type:'spark',x:p.x+.35,y:p.y+.55,vx:(Math.random()-.5)*3.8,vy:(Math.random()-.5)*3.8,life:1});
  if(e.type==='break')for(let i=0;i<14;i++)this.fx.push({type:'debris',x:(e.x||p.x)+(e.w||1)*.5,y:(e.y||p.y)+(e.h||1)*.55,vx:(Math.random()-.5)*4.6,vy:-1.2-Math.random()*2.8,life:1});
  if(e.type==='death')for(let i=0;i<16;i++)this.fx.push({type:'death',x:p.x+.35,y:p.y+.55,vx:(Math.random()-.5)*4.8,vy:-1.0-Math.random()*3.6,life:1});
  if(['checkpoint','secret','finish'].includes(e.type))for(let i=0;i<(e.type==='finish'?34:24);i++)this.fx.push({type:e.type==='finish'?'victory':'spark',x:p.x+.35,y:p.y+.5,vx:(Math.random()-.5)*6,vy:(Math.random()-.5)*6,life:1});
 }
 background(ctx,w,h,cam){
  const imgs=this.art.images;
  if(imgs.sky)ctx.drawImage(imgs.sky,0,0,w,h);else{const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#2a68d6');g.addColorStop(1,'#f2b5df');ctx.fillStyle=g;ctx.fillRect(0,0,w,h)}
  const drawLayer=(img,factor,y,hScale,alpha=1)=>{if(!img)return;const iw=w*1.35,shift=-((cam.x*factor*42)%iw);ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(img,shift,y,iw,h*hScale);ctx.drawImage(img,shift+iw,y,iw,h*hScale);ctx.restore()};
  drawLayer(imgs.far,.06,h*.18,.66,.84);drawLayer(imgs.mid,.16,h*.16,.74,.96);
 }
 drawPlatformAsset(ctx,r,img){if(!img)return;const depth=Math.max(.65,Math.min(3.2,r.h*.68));ctx.drawImage(img,r.x,r.y-.18,r.w,depth+.28)}
 platform(ctx,r,moving=false){const img=moving?this.art.images.moving:this.art.images.platform;if(img)this.drawPlatformAsset(ctx,r,img);else{ctx.fillStyle='#4d5d7b';ctx.fillRect(r.x,r.y,r.w,Math.max(.5,r.h*.6));ctx.fillStyle='#76bd78';ctx.fillRect(r.x,r.y-.12,r.w,.12)}}
 shard(ctx,s,t){const im=this.art.images.shard;if(im){const bob=Math.sin(t*.004+s.x)*.08;ctx.save();ctx.translate(s.x,s.y+bob);ctx.rotate(Math.sin(t*.003+s.x)*.06);ctx.drawImage(im,-.28,-.43,.56,.75);ctx.restore();return}ctx.fillStyle='#5cf2ff';ctx.fillRect(s.x-.12,s.y-.3,.24,.6)}
 hazard(ctx,h){const n=Math.max(2,Math.round(h.w/.34));ctx.save();ctx.shadowColor='#ff244d';ctx.shadowBlur=.22;for(let i=0;i<n;i++){const x=h.x+i*h.w/n,w=h.w/n;const g=ctx.createLinearGradient(x,h.y,x,h.y+h.h);g.addColorStop(0,'#ff4a65');g.addColorStop(1,'#6e142d');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x,h.y+h.h);ctx.lineTo(x+w*.5,h.y);ctx.lineTo(x+w,h.y+h.h);ctx.closePath();ctx.fill()}ctx.restore()}
 checkpoint(ctx,cp,active,t){const im=this.art.images.checkpoint;ctx.save();ctx.translate(cp.x-.12,cp.y-.04);if(active){ctx.shadowColor='#68efff';ctx.shadowBlur=.35;ctx.globalAlpha=.92+.08*Math.sin(t*.004)}if(im)ctx.drawImage(im,0,0,1.75,4.15);ctx.restore()}
 breakable(ctx,r){ctx.save();const g=ctx.createLinearGradient(r.x,r.y,r.x+r.w,r.y+r.h);g.addColorStop(0,'#8b98b1');g.addColorStop(1,'#394760');ctx.fillStyle=g;ctx.fillRect(r.x,r.y,r.w,r.h);ctx.strokeStyle='#cbd6e8';ctx.lineWidth=.05;ctx.strokeRect(r.x+.03,r.y+.03,r.w-.06,r.h-.06);ctx.strokeStyle='#26334d';ctx.beginPath();ctx.moveTo(r.x+.2,r.y+.15);ctx.lineTo(r.x+.62,r.y+.5);ctx.lineTo(r.x+.4,r.y+.98);ctx.moveTo(r.x+.8,r.y+.1);ctx.lineTo(r.x+.58,r.y+.54);ctx.lineTo(r.x+.95,r.y+.92);ctx.stroke();ctx.restore()}
 secret(ctx,s,t,found){const cx=s.x+s.w*.5,cy=s.y+s.h*.56;ctx.save();const g=ctx.createRadialGradient(cx,cy,.2,cx,cy,2.8);g.addColorStop(0,found?'#2b6070':'#153e61');g.addColorStop(.5,'#10243e');g.addColorStop(1,'#06122500');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(cx,cy,2.8,1.9,0,0,TAU);ctx.fill();ctx.fillStyle='#5cf2ff';for(const [dx,dy,sz] of [[-1.1,.3,.4],[-.75,-.2,.26],[1.0,.2,.35],[1.25,-.1,.22]]){ctx.beginPath();ctx.moveTo(cx+dx,cy+dy-sz);ctx.lineTo(cx+dx+sz*.35,cy+dy);ctx.lineTo(cx+dx,cy+dy+sz);ctx.lineTo(cx+dx-sz*.35,cy+dy);ctx.closePath();ctx.fill()}ctx.fillStyle='#8a5a25';ctx.fillRect(cx-.48,cy+.38,.96,.46);ctx.fillStyle='#e5ac45';ctx.fillRect(cx-.52,cy+.30,1.04,.16);ctx.restore()}
 finish(ctx,f,t){ctx.save();ctx.translate(f.x+f.w/2,f.y+f.h/2);ctx.strokeStyle='#ff3155';ctx.lineWidth=.14;ctx.shadowColor='#ff3155';ctx.shadowBlur=.5;ctx.beginPath();ctx.ellipse(0,0,f.w*.44,f.h*.43,0,0,TAU);ctx.stroke();ctx.strokeStyle='#76f4ff';ctx.globalAlpha=.66+.2*Math.sin(t*.004);ctx.lineWidth=.05;ctx.beginPath();ctx.ellipse(0,0,f.w*.29,f.h*.31,0,0,TAU);ctx.stroke();ctx.restore()}
 foreground(ctx,w,h,cam){const im=this.art.images.foreground;if(!im)return;const iw=w*1.32,shift=-((cam.x*.24*56)%iw);ctx.save();ctx.globalAlpha=.72;ctx.drawImage(im,shift,h*.67,iw,h*.36);ctx.drawImage(im,shift+iw,h*.67,iw,h*.36);ctx.restore()}
 draw(player,cam,time,ghosts=[]){
  this.resize();const ctx=this.ctx,w=this.canvas.width/this.dpr,h=this.canvas.height/this.dpr;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.clearRect(0,0,w,h);this.background(ctx,w,h,cam);
  const scale=Math.min(84,Math.max(53,w/17.5)),ox=w*.30,oy=h*.56;ctx.save();ctx.setTransform(this.dpr*scale,0,0,this.dpr*scale,this.dpr*(ox-cam.x*scale),this.dpr*(oy-cam.y*scale));
  if(this.level.secrets?.[0])this.secret(ctx,this.level.secrets[0],time,player.secrets.has(this.level.secrets[0].id));
  for(const r of this.level.solids)this.platform(ctx,r,false);for(const r of this.level.oneWay)this.platform(ctx,r,false);
  for(const m of this.level.movingPlatforms)this.platform(ctx,EixoRunCore.platformAt(m,player.tick),true);
  for(const r of this.level.breakables)if(!player.broken.has(r.id))this.breakable(ctx,r);
  for(const hz of this.level.hazards)this.hazard(ctx,hz);for(const s of this.level.shards)if(!player.collected.has(s.id))this.shard(ctx,s,time);
  for(const cp of this.level.checkpoints)this.checkpoint(ctx,cp,player.checkpoint===cp.id,time);this.finish(ctx,this.level.finish,time);
  if(Math.abs(player.vx)>6.25&&!player.dead){this.trail.unshift({x:player.x,y:player.y,facing:player.facing,tick:player.tick,life:1});if(this.trail.length>7)this.trail.length=7}
  for(const t of this.trail)t.life-=.13;this.trail=this.trail.filter(t=>t.life>0);for(let i=this.trail.length-1;i>=0;i--){const t=this.trail[i];this.runner.draw(ctx,{...player,...t},{alpha:.08*t.life,tint:'#58e9ff'})}
  for(const g of ghosts||[])if(g?.player&&!g.player.dead&&g.player.finishTick==null)this.runner.draw(ctx,g.player,{alpha:.26,tint:g.tint||'#72eaff'});
  this.runner.draw(ctx,player,{alpha:player.dead?Math.max(.18,Math.min(1,player.respawnTicks/18)):1});
  for(const f of this.fx){f.x+=f.vx*.016;f.y+=f.vy*.016;f.vy+=1.8*.016;f.life-=.028;ctx.globalAlpha=Math.max(0,f.life);ctx.fillStyle=f.type==='dust'||f.type==='skid'?'#eadcec':f.type==='impact'?'#fff':f.type==='debris'?'#8794ad':f.type==='death'?'#ffcf5d':f.type==='victory'?(f.life>.55?'#ffd45f':'#ff5fd7'):'#82f7ff';ctx.beginPath();ctx.arc(f.x,f.y,.04+.08*f.life,0,TAU);ctx.fill()}ctx.globalAlpha=1;this.fx=this.fx.filter(f=>f.life>0);ctx.restore();
  this.foreground(ctx,w,h,cam);
 }
}