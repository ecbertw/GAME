import{RUNNER_MANIFEST as M}from'./runner-manifest.mjs';
function stateOf(p){
  if(p.dead)return'death';if(p.finished)return'victory';if(p.hardLandingTicks>0)return'hardLand';if(p.landingTicks>0)return'land';
  if(!p.onGround){if(p.vy<-8.5)return'jumpStart';if(p.vy<-1.3)return'rise';if(Math.abs(p.vy)<=1.3)return'apex';return'fall'}
  if(p.skidTicks>0)return'skid';const speed=Math.abs(p.vx);if(speed>7.15)return'fast';if(speed>1.0)return'run';if(speed>.15)return'start';return'idle';
}
function frameFor(spec,tick){const frames=spec.frames||[0],step=Math.max(1,spec.ticksPerFrame||1),i=Math.floor(Math.max(0,tick)/step);return frames[spec.loop===false?Math.min(i,frames.length-1):i%frames.length]}
export class SpriteRunner{
  constructor(){this.image=null;this.ready=this.load()}
  async load(){const img=new Image();img.decoding='async';await new Promise(resolve=>{img.onload=resolve;img.onerror=resolve;img.src=M.image});if(img.complete&&img.naturalWidth)this.image=img}
  draw(ctx,p,{alpha=1,tint=null}={}){
    const r=M.render,x=p.x+r.offsetX,y=p.y+r.offsetY,w=r.width,h=r.height,state=stateOf(p),frame=frameFor(M.states[state]||M.states.idle,p.tick||0),flip=(p.facing||1)<0;
    ctx.save();ctx.globalAlpha=alpha;
    if(this.image){
      if(flip){ctx.translate(x+w,y);ctx.scale(-1,1);ctx.drawImage(this.image,frame*M.frameWidth,0,M.frameWidth,M.frameHeight,0,0,w,h)}
      else ctx.drawImage(this.image,frame*M.frameWidth,0,M.frameWidth,M.frameHeight,x,y,w,h);
      if(tint){ctx.globalCompositeOperation='source-atop';ctx.globalAlpha=alpha*.32;ctx.fillStyle=tint;ctx.fillRect(flip?0:x,y,w,h)}
    }else{ctx.fillStyle=tint||'#f4f7fb';ctx.fillRect(x+w*.3,y+h*.12,w*.4,h*.76)}
    ctx.restore();
  }
}
export const __test={stateOf,frameFor};