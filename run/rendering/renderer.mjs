import{animationState,FRAME}from'../player/animation-state.mjs';
export class Renderer{
 constructor(canvas,level){
  this.c=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.level=level;this.dpr=1;this.assets={};this.ready=this.load();
  this.particles=[];
 }
 async load(){
  const load=(k,src)=>new Promise(res=>{const i=new Image();i.onload=()=>{this.assets[k]=i;res()};i.onerror=()=>res();i.src=src});
  await Promise.all([
    load('runner','/assets/run/character/runner-atlas.svg'),
    load('sky','/assets/run/astral/sky.svg'),load('far','/assets/run/astral/far.svg'),load('near','/assets/run/astral/near.svg'),
    load('platform','/assets/run/astral/platform.svg'),load('shard','/assets/run/astral/shard.svg')
  ]);
 }
 resize(){const r=this.c.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);if(this.c.width!==Math.round(r.width*d)||this.c.height!==Math.round(r.height*d)){this.c.width=Math.round(r.width*d);this.c.height=Math.round(r.height*d)}this.dpr=d}
 world(ctx,cam,scale,ox,oy){ctx.setTransform(this.dpr*scale,0,0,this.dpr*scale,this.dpr*(ox-cam.x*scale),this.dpr*(oy-cam.y*scale))}
 drawLayer(img,cam,factor,y=0){const x=-((cam.x*factor)%40);for(let i=-1;i<5;i++)this.ctx.drawImage(img,(x+i*40)*this.dpr,(y-cam.y*factor)*this.dpr,40*this.dpr,18*this.dpr)}
 draw(player,cam,echoes=[]){
  this.resize();const ctx=this.ctx,w=this.c.width/this.dpr,h=this.c.height/this.dpr;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#071326';ctx.fillRect(0,0,w,h);
  if(this.assets.sky)ctx.drawImage(this.assets.sky,0,0,w,h);
  const scale=Math.min(72,Math.max(45,w/18)),ox=w*.38,oy=h*.56;
  const layer=(img,factor,yOff,sizeY)=>{if(!img)return;const x0=-(cam.x*scale*factor)%w;for(let i=-1;i<3;i++)ctx.drawImage(img,x0+i*w,yOff-cam.y*scale*factor,w,sizeY)};
  layer(this.assets.far,.12,h*.08,h*.72);layer(this.assets.near,.30,h*.23,h*.66);
  ctx.save();this.world(ctx,cam,scale,ox,oy);
  for(const r of this.level.solids||[])this.platform(r,ctx);
  for(const r of this.level.oneWayPlatforms||[])this.platform(r,ctx,true);
  for(const m of this.level.movingPlatforms||[]){const r=window.EixoRunPhysics.movingRect(m,player.tick);this.platform(r,ctx,true)}
  ctx.fillStyle='#ff3657';for(const z of this.level.hazards||[]){ctx.beginPath();for(let x=z.x;x<z.x+z.w;x+=.45){ctx.moveTo(x,z.y+z.h);ctx.lineTo(x+.225,z.y);ctx.lineTo(x+.45,z.y+z.h)}ctx.fill()}
  for(const s of this.level.shards||[])if(!player.shards.has(s.id)){if(this.assets.shard)ctx.drawImage(this.assets.shard,s.x-.36,s.y-.55,.72,1.1);else{ctx.fillStyle='#37e7ff';ctx.fillRect(s.x-.15,s.y-.3,.3,.6)}}
  ctx.strokeStyle='#ff2f4f';ctx.lineWidth=.05;ctx.strokeRect(this.level.finish.x,this.level.finish.y,this.level.finish.w,this.level.finish.h);
  for(const e of echoes)this.runner(e.player,ctx,e.alpha||.24,e.tint);
  this.runner(player,ctx,1);
  ctx.restore();
  layer(this.assets.near,1.08,h*.78,h*.28);
 }
 platform(r,ctx,oneWay=false){if(this.assets.platform)ctx.drawImage(this.assets.platform,r.x,r.y,r.w,r.h);else{ctx.fillStyle=oneWay?'#7ccfff':'#283b68';ctx.fillRect(r.x,r.y,r.w,r.h)}}
 runner(p,ctx,alpha=1,tint){ctx.save();ctx.globalAlpha=alpha;const frame=FRAME[animationState(p)]??0,fw=128,fh=160;
  const x=p.x-.43,y=p.y-.25,w=1.6,h=2.0;const flip=p.vx<-.15;
  if(flip){ctx.translate(x+w,y);ctx.scale(-1,1);this.drawRunnerFrame(ctx,frame,0,w,h)}else this.drawRunnerFrame(ctx,frame,x,y,w,h);
  if(tint){ctx.globalCompositeOperation='source-atop';ctx.fillStyle=tint;ctx.globalAlpha*=.25;ctx.fillRect(flip?0:x,y,w,h)}
  ctx.restore()}
 drawRunnerFrame(ctx,frame,x,y,w,h){if(this.assets.runner)ctx.drawImage(this.assets.runner,frame*128,0,128,160,x,y,w,h);else{ctx.fillStyle='#fff';ctx.fillRect(x+w*.3,y,w*.4,h)}}
}