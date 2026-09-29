import{RUNNER}from'./runner-manifest.mjs';
function state(p){if(p.victory)return'victory';if(p.dead)return'death';if(p.landingTicks>0||p.hardLanding>0)return'land';if(!p.onGround){if(p.vy<-7)return'jumpStart';if(p.vy<-1.5)return'jump';if(Math.abs(p.vy)<=1.5)return'apex';return'fall'}if(p.skid)return'skid';const s=Math.abs(p.vx);if(s>7.1)return'fast';if(s>.45)return'run';return'idle'}
function frame(p){const s=RUNNER.states[state(p)]||RUNNER.states.idle,a=s.frames||[0];return a[Math.floor((p.tick||0)/Math.max(1,s.rate||1))%a.length]||0}
export class SpriteRunner{
 constructor(){this.image=new Image();this.image.decoding='async';this.ready=new Promise(resolve=>{this.image.onload=resolve;this.image.onerror=resolve;this.image.src=RUNNER.image})}
 draw(ctx,p,{alpha=1,tint=null,scale=1}={}){const w=1.92*scale,h=2.24*scale,x=p.x-.60*scale,y=p.y-.67*scale,f=frame(p),flip=(p.facing||1)<0;ctx.save();ctx.globalAlpha=alpha;if(this.image.complete&&this.image.naturalWidth){if(flip){ctx.translate(x+w,y);ctx.scale(-1,1);ctx.drawImage(this.image,f*RUNNER.frameWidth,0,RUNNER.frameWidth,RUNNER.frameHeight,0,0,w,h)}else ctx.drawImage(this.image,f*RUNNER.frameWidth,0,RUNNER.frameWidth,RUNNER.frameHeight,x,y,w,h);if(tint){ctx.globalCompositeOperation='source-atop';ctx.fillStyle=tint;ctx.globalAlpha=alpha*.26;ctx.fillRect(flip?0:x,y,w,h)}}ctx.restore()}
}
export const __runnerState=state;