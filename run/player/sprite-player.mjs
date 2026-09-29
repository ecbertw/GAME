import{animationState}from'./animation-state.mjs';

const DEFAULT_RENDER={offsetX:-.52,offsetY:-.36,width:1.86,height:2.12};

function validateManifest(m){
  if(!m||typeof m!=='object')throw new Error('Invalid RUN runner manifest');
  for(const key of ['image','frameWidth','frameHeight','frames','states'])if(m[key]==null)throw new Error('RUN runner manifest missing '+key);
  if(!Number.isFinite(Number(m.frameWidth))||!Number.isFinite(Number(m.frameHeight))||Number(m.frameWidth)<=0||Number(m.frameHeight)<=0)throw new Error('Invalid RUN runner frame size');
  if(!Number.isInteger(Number(m.frames))||Number(m.frames)<1)throw new Error('Invalid RUN runner frame count');
  return m;
}
function stateSpec(m,state){
  return m.states?.[state]??m.states?.idle??{frames:[0],ticksPerFrame:1,loop:true};
}
function frameFromSpec(spec,tick){
  if(Number.isInteger(spec))return spec;
  if(Array.isArray(spec)){
    if(!spec.length)return 0;
    return spec[Math.floor(Math.max(0,tick)/8)%spec.length];
  }
  const frames=Array.isArray(spec?.frames)?spec.frames:[Number(spec?.frame)||0];
  if(!frames.length)return 0;
  const tpf=Math.max(1,Number(spec?.ticksPerFrame)||1);
  const index=Math.floor(Math.max(0,tick)/tpf);
  return frames[spec?.loop===false?Math.min(frames.length-1,index):index%frames.length];
}

export class SpritePlayer{
  constructor(manifestUrl='/assets/run/character/runner-atlas.json'){
    this.manifestUrl=manifestUrl;
    this.manifest=null;
    this.image=null;
    this.ready=this.load();
  }
  async load(){
    try{
      const response=await fetch(this.manifestUrl,{cache:'force-cache'});
      if(!response.ok)throw new Error('Runner manifest '+response.status);
      const manifest=validateManifest(await response.json());
      const image=new Image();
      image.decoding='async';
      await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('Runner atlas failed to load'));image.src=manifest.image});
      this.manifest=manifest;this.image=image;
    }catch(error){
      console.warn('EIXO RUN sprite player:',error);
    }
    return this;
  }
  state(player){return animationState(player)}
  frame(player){
    if(!this.manifest)return 0;
    const spec=stateSpec(this.manifest,this.state(player));
    const frame=frameFromSpec(spec,player.tick||0);
    return Math.max(0,Math.min(Number(this.manifest.frames)-1,Number(frame)||0));
  }
  draw(ctx,player,{alpha=1,tint=null}={}){
    const render={...DEFAULT_RENDER,...(this.manifest?.render||{})};
    const x=player.x+render.offsetX,y=player.y+render.offsetY,w=render.width,h=render.height,flip=(player.facing||1)<0;
    ctx.save();ctx.globalAlpha=alpha;
    if(this.image&&this.manifest){
      const frame=this.frame(player),fw=Number(this.manifest.frameWidth),fh=Number(this.manifest.frameHeight);
      if(flip){ctx.translate(x+w,y);ctx.scale(-1,1);ctx.drawImage(this.image,frame*fw,0,fw,fh,0,0,w,h)}
      else ctx.drawImage(this.image,frame*fw,0,fw,fh,x,y,w,h);
      if(tint){
        ctx.globalCompositeOperation='source-atop';ctx.fillStyle=tint;ctx.globalAlpha=alpha*.33;
        ctx.fillRect(flip?0:x,y,w,h);
      }
    }else{
      ctx.fillStyle=tint||'#f4f7fb';ctx.fillRect(x+w*.31,y+h*.08,w*.38,h*.84);
    }
    ctx.restore();
  }
}

export const __test={validateManifest,frameFromSpec};
