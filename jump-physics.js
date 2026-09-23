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
    let prev=out[out.length-1],x=out.length===1?W/2-45:prev.x,y=prev.y;
    for(let i=out.length;i<=count;i++){
      const a=hash(seed,i*7+1),b=hash(seed,i*7+2),c=hash(seed,i*7+3);
      // Difficulty becomes clearly visible after the first few safe jumps:
      // narrower platforms, slightly larger gaps and stronger zig-zags.
      const difficulty=Math.min(1,Math.max(0,(i-4)/22));
      const gap=32+Math.floor(a*(9+7*difficulty))+Math.floor(3*difficulty);
      const width=Math.round(90-(34*difficulty)+c*(10-3*difficulty));
      const lateral=128+Math.round(32*difficulty);
      y+=gap;
      x=Math.max(12,Math.min(W-width-12,x+(b-.5)*lateral));

      // Like classic vertical climbers, moving platforms are introduced
      // progressively instead of appearing everywhere from the first jump.
      const moveRoll=hash(seed,i*7+4);
      const moveChance=i<5?0:(0.16+0.30*difficulty);
      const moving=moveRoll<moveChance;
      let moveCenter=x,moveAmp=0,moveSpeed=0,movePhase=0;
      if(moving){
        const desired=16+hash(seed,i*7+5)*(17+10*difficulty);
        const min=Math.max(12,x-desired),max=Math.min(W-width-12,x+desired);
        moveCenter=(min+max)/2;moveAmp=Math.max(0,(max-min)/2);
        moveSpeed=0.72+hash(seed,i*7+6)*0.72+0.12*difficulty;
        movePhase=hash(seed,i*7+7)*Math.PI*2;
      }
      out.push({x:Math.round(x),y,w:width,moving,moveCenter,moveAmp,moveSpeed,movePhase});
    }
  }
  function create(seed,sharedPlatforms){
    return{x:W/2,y:0,vy:0,best:0,cam:0,alive:true,ground:true,groundPlatform:0,bestPlatform:0,score:0,time:0,jumpBuffer:0,seed,platforms:sharedPlatforms||platforms(seed,30)};
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

    // Holding jump keeps the buffer armed. This intentionally means that
    // landing while W/Space/Up is held causes the next jump automatically.
    if(keys.jump)s.jumpBuffer=.13;else s.jumpBuffer=Math.max(0,s.jumpBuffer-dt);
    if(s.ground&&s.jumpBuffer>0){s.vy=207;s.ground=false;s.groundPlatform=-1;s.jumpBuffer=0;}

    s.vy=Math.max(-282,s.vy-386*dt);
    s.y+=s.vy*dt;
    if(s.vy<=0){
      const firstAtLeast=(value)=>{let lo=0,hi=s.platforms.length;while(lo<hi){const mid=(lo+hi)>>1;if(s.platforms[mid].y<value)lo=mid+1;else hi=mid;}return lo;};
      const start=Math.max(0,firstAtLeast(s.y-2)-2),end=Math.min(s.platforms.length-1,firstAtLeast(lastY+2)+2);
      let landed=false;
      for(let i=start;i<=end;i++){
        const p=s.platforms[i],px=platformX(p,s.time);
        if(lastY>=p.y-.05&&s.y<=p.y&&s.x+7>px&&s.x-7<px+p.w){
          s.y=p.y;s.vy=0;s.ground=true;s.groundPlatform=i;landed=true;
          if(i>s.bestPlatform){s.bestPlatform=i;s.score=i*SCORE_PER_PLATFORM;}
          break;
        }
      }
      if(!landed)s.ground=false;
    }else{s.ground=false;s.groundPlatform=-1}

    s.best=Math.max(s.best,s.y);
    if(s.platforms[s.platforms.length-1].y<s.best+350)extend(s.platforms,s.seed,s.platforms.length+25);
    s.cam=Math.max(0,s.best-78);
    if(s.y<s.cam-65||s.y<-60)s.alive=false;
    return s;
  }
  function publicState(s){return{x:Math.round(s.x*10)/10,y:Math.round(s.y*10)/10,best:Math.max(0,Math.floor(s.best)),platform:Math.max(0,Number(s.bestPlatform)||0),score:Math.max(0,Number(s.score)||0),alive:s.alive,vy:Math.round(s.vy)};}
  return{W,H,SCORE_PER_PLATFORM,hash,platformX,platforms,create,step,publicState};
});
