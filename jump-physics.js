/* Shared deterministic JUMP physics. Client renders smoothly; server validates progress. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.EixoJumpPhysics=api;
})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  const W=450,H=195,SCORE_PER_PLATFORM=12;
  function hash(seed,n){let x=(seed+Math.imul(n,0x9e3779b9))|0;x=Math.imul(x^(x>>>16),0x85ebca6b);x=Math.imul(x^(x>>>13),0xc2b2ae35);return((x^(x>>>16))>>>0)/4294967296;}
  function platformX(p,time){
    if(!p?.moving)return Number(p?.x||0);
    return p.moveCenter+Math.sin((Number(time)||0)*p.moveSpeed+p.movePhase)*p.moveAmp;
  }
  function platforms(seed,count){
    const out=[{x:0,y:0,w:W,moving:false}];extend(out,seed,count);return out;
  }
  function extend(out,seed,count){
    let prev=out[out.length-1],y=prev.y;
    for(let i=out.length;i<=count;i++){
      const a=hash(seed,i*9+1),b=hash(seed,i*9+2),c=hash(seed,i*9+3);
      // Hard-mode curve inspired by endless vertical climbers:
      // the tutorial ends quickly, then precision ramps aggressively.
      const difficulty=Math.min(1,Math.max(0,(i-3)/18));
      const gap=Math.min(50,34+Math.floor(a*(8+7*difficulty))+Math.floor(5*difficulty));
      const width=Math.round(88-(38*difficulty)+c*(8-3*difficulty));

      // Never allow long "elevator shafts" of nearly vertical platforms.
      // Every new platform has a meaningful horizontal displacement while
      // remaining within the player's physical jump envelope.
      const prevCenter=Number(prev.x||0)+Number(prev.w||W)/2;
      const minShift=i<=3?28:46+Math.round(32*difficulty);
      const maxShift=i<=3?58:68+Math.round(40*difficulty);
      const shift=minShift+hash(seed,i*9+4)*(maxShift-minShift);
      let direction=hash(seed,i*9+5)<.5?-1:1;
      const minCenter=12+width/2,maxCenter=W-12-width/2;
      let target=prevCenter+direction*shift;
      if(target<minCenter||target>maxCenter){direction*=-1;target=prevCenter+direction*shift}
      target=Math.max(minCenter,Math.min(maxCenter,target));
      let x=target-width/2;
      y+=gap;

      // Moving platforms rapidly become the dominant platform type.
      // By the mid-game roughly 2/3–4/5 platforms move horizontally.
      const moveChance=i<4?0:(0.34+0.46*difficulty);
      const forcedMover=i>=11&&(i%3===0||i%7===0);
      const moving=i>=4&&(forcedMover||hash(seed,i*9+6)<moveChance);
      let moveCenter=x,moveAmp=0,moveSpeed=0,movePhase=0;
      if(moving){
        const desired=18+hash(seed,i*9+7)*(20+12*difficulty);
        const min=Math.max(12,x-desired),max=Math.min(W-width-12,x+desired);
        moveCenter=(min+max)/2;
        moveAmp=Math.max(8,(max-min)/2);
        // Movement speed ramps quickly from the first moving platforms and
        // reaches its cap after roughly a dozen jumps, not after a long run.
        const speedProgress=Math.min(1,Math.max(0,(i-3)/12));
        const desiredSpeed=0.90+1.00*speedProgress+hash(seed,i*9+8)*0.20;
        // Slightly faster than the previous curve, but still capped by peak
        // horizontal velocity so the platform remains physically catchable.
        moveSpeed=Math.min(2.08,desiredSpeed,98/Math.max(1,moveAmp));
        movePhase=hash(seed,i*9+9)*Math.PI*2;
      }
      out.push({x:Math.round(x),y,w:width,moving,moveCenter,moveAmp,moveSpeed,movePhase,difficulty});
      prev=out[out.length-1];
    }
  }
  function create(seed,sharedPlatforms){
    return{x:W/2,y:0,vy:0,best:0,cam:0,alive:true,ground:true,groundPlatform:0,jumpOrigin:0,bestPlatform:0,activeMinPlatform:0,score:0,time:0,jumpBuffer:0,seed,platforms:sharedPlatforms||platforms(seed,30)};
  }
  function step(s,keys,dt){
    if(!s.alive)return s;
    dt=Math.max(0,Math.min(.05,Number(dt)||0));
    const oldTime=Number(s.time)||0,newTime=oldTime+dt;
    const groundIndex=Number.isInteger(s.groundPlatform)?s.groundPlatform:-1;
    if(s.ground&&groundIndex>=0){
      const gp=s.platforms[groundIndex];
      if(gp?.moving)s.x+=platformX(gp,newTime)-platformX(gp,oldTime);
    }
    s.time=newTime;

    const dir=(keys.right?1:0)-(keys.left?1:0);
    const lastY=s.y;
    s.x=Math.max(8,Math.min(W-8,s.x+dir*136*dt));

    // Walking off an edge must actually start a fall. Remember the platform
    // we left so falling past its immediate lower neighbour ends the run.
    if(s.ground&&groundIndex>=0){
      const gp=s.platforms[groundIndex],gx=platformX(gp,s.time);
      if(s.x+7<=gx||s.x-7>=gx+gp.w){
        s.ground=false;s.groundPlatform=-1;s.jumpOrigin=groundIndex;
      }
    }

    // Holding jump keeps the buffer armed. This intentionally means that
    // landing while W/Space/Up is held causes the next jump automatically.
    if(keys.jump)s.jumpBuffer=.13;else s.jumpBuffer=Math.max(0,s.jumpBuffer-dt);
    if(s.ground&&s.jumpBuffer>0){
      s.jumpOrigin=Number.isInteger(s.groundPlatform)?s.groundPlatform:0;
      s.vy=207;s.ground=false;s.groundPlatform=-1;s.jumpBuffer=0;
    }

    s.vy=Math.max(-282,s.vy-386*dt);
    s.y+=s.vy*dt;
    if(s.vy<=0){
      const firstAtLeast=(value)=>{let lo=0,hi=s.platforms.length;while(lo<hi){const mid=(lo+hi)>>1;if(s.platforms[mid].y<value)lo=mid+1;else hi=mid;}return lo;};
      const start=Math.max(0,firstAtLeast(s.y-2)-2),end=Math.min(s.platforms.length-1,firstAtLeast(lastY+2)+2);
      // Platforms older than the current best platform - 1 are retired from
      // gameplay completely: they are never collidable again and the renderer
      // also hides them. This prevents "invisible floor" rescues.
      const lowestAllowed=Math.max(0,Number(s.activeMinPlatform)||0);
      let landed=false;
      for(let i=start;i<=end;i++){
        if(i<lowestAllowed)continue;
        const p=s.platforms[i],px=platformX(p,s.time);
        if(lastY>=p.y-.05&&s.y<=p.y&&s.x+7>px&&s.x-7<px+p.w){
          s.y=p.y;s.vy=0;s.ground=true;s.groundPlatform=i;s.jumpOrigin=i;landed=true;
          if(i>s.bestPlatform){
            s.bestPlatform=i;s.score=i*SCORE_PER_PLATFORM;
            s.activeMinPlatform=Math.max(0,i-1);
          }
          break;
        }
      }
      if(!landed)s.ground=false;
    }else{s.ground=false;s.groundPlatform=-1}

    s.best=Math.max(s.best,s.y);
    if(s.platforms[s.platforms.length-1].y<s.best+350)extend(s.platforms,s.seed,s.platforms.length+25);
    s.cam=Math.max(0,s.best-78);
    // The run ends only when the avatar's feet touch the visible bottom edge.
    // drawCharacter extends ~8px below s.y and screen(s.y)=H-30-(s.y-cam),
    // therefore cam-22 aligns death with the bottom border.
    if(s.y<=s.cam-22)s.alive=false;
    return s;
  }
  function publicState(s){return{x:Math.round(s.x*10)/10,y:Math.round(s.y*10)/10,best:Math.max(0,Math.floor(s.best)),platform:Math.max(0,Number(s.bestPlatform)||0),activeMinPlatform:Math.max(0,Number(s.activeMinPlatform)||0),score:Math.max(0,Number(s.score)||0),alive:s.alive,vy:Math.round(s.vy)};}
  return{W,H,SCORE_PER_PLATFORM,hash,platformX,platforms,create,step,publicState};
});
