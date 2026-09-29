import{RUNNER}from'./runner-manifest.mjs';
function state(p){
  if(p.dead)return'dead';
  if(p.hardLanding>0)return'land';
  if(!p.onGround){if(p.vy<-2)return'jump';if(Math.abs(p.vy)<=2)return'apex';return'fall'}
  if(p.skid)return'skid';
  const speed=Math.abs(p.vx);if(speed>7.1)return'fast';if(speed>.5)return'run';return'idle';
}
function frameFor(p){
  const spec=RUNNER.states[state(p)]||RUNNER.states.idle,frames=spec.frames||[0],rate=Math.max(1,spec.rate||1);
  return frames[Math.floor((p.tick||0)/rate)%frames.length]||0;
}
export class SpriteRunner{
  constructor(){this.image=new Image();this.image.decoding='async';this.ready=new Promise(resolve=>{this.image.onload=resolve;this.image.onerror=resolve;this.image.src=RUNNER.image})}
  draw(ctx,p,{alpha=1,tint=null}={}){
    const w=1.72,h=2.12,x=p.x-.50,y=p.y-.48,frame=frameFor(p),flip=(p.facing||1)<0;
    ctx.save();ctx.globalAlpha=alpha;
    if(this.image.complete&&this.image.naturalWidth){
      if(flip){ctx.translate(x+w,y);ctx.scale(-1,1);ctx.drawImage(this.image,frame*RUNNER.frameWidth,0,RUNNER.frameWidth,RUNNER.frameHeight,0,0,w,h)}
      else ctx.drawImage(this.image,frame*RUNNER.frameWidth,0,RUNNER.frameWidth,RUNNER.frameHeight,x,y,w,h);
      if(tint){ctx.globalCompositeOperation='source-atop';ctx.fillStyle=tint;ctx.globalAlpha=alpha*.28;ctx.fillRect(flip?0:x,y,w,h)}
    }else{ctx.fillStyle='#f4f7fb';ctx.fillRect(x+w*.32,y+h*.1,w*.36,h*.82)}
    ctx.restore();
  }
}
