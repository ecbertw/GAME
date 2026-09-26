/* Shared deterministic JUMP physics. Client renders smoothly; server validates progress. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.EixoJumpPhysics=api;
})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  // World units match the 16:9 art canvas. Time/difficulty stay independent of pixels.
  const UNIT=2,W=960,H=540,SCORE_PER_PLATFORM=12,SPEED=272,JUMP=414,GRAVITY=772,MAX_FALL=564;
  const PLAYER_RADIUS=10,CAMERA_ANCHOR=170,FLOOR_MARGIN=48;
  function hash(seed,n){let x=(seed+Math.imul(n,0x9e3779b9))|0;x=Math.imul(x^(x>>>16),0x85ebca6b);x=Math.imul(x^(x>>>13),0xc2b2ae35);return((x^(x>>>16))>>>0)/4294967296;}
  function platformX(p,time){
    if(!p?.moving)return Number(p?.x||0);
    return p.moveCenter+Math.sin((Number(time)||0)*p.moveSpeed+p.movePhase)*p.moveAmp;
  }
  function platforms(seed,count){
    const out=[{x:0,y:0,w:W,moving:false,fragile:false,difficulty:0}];extend(out,seed,count);return out;
  }
  function extend(out,seed,count){
    let prev=out[out.length-1],y=prev.y;
    for(let i=out.length;i<=count;i++){
      const a=hash(seed,i*11+1),b=hash(seed,i*11+2),c=hash(seed,i*11+3);
      // Difficulty reaches "real game" pace quickly. By ~20 platforms the
      // geometry is already close to the endless curve instead of staying easy
      // for the first 1000 points.
      const difficulty=Math.min(1,Math.max(0,(i-2)/14));
      const gap=UNIT*Math.min(51,35+Math.floor(a*(10+6*difficulty))+Math.floor(5*difficulty));
      const width=UNIT*Math.round(84-(42*difficulty)+c*(7-2*difficulty));

      // Force meaningful left/right routing while keeping the jump envelope
      // physically reachable at full horizontal speed.
      const prevCenter=Number(prev.x||0)+Number(prev.w||W)/2;
      const minShift=UNIT*(i<=2?26:42+Math.round(34*difficulty));
      const maxShift=UNIT*(i<=2?60:66+Math.round(52*difficulty));
      const shift=minShift+hash(seed,i*11+4)*(maxShift-minShift);
      let direction=hash(seed,i*11+5)<.5?-1:1;
      const minCenter=24+width/2,maxCenter=W-24-width/2;
      let target=prevCenter+direction*shift;
      if(target<minCenter||target>maxCenter){direction*=-1;target=prevCenter+direction*shift}
      target=Math.max(minCenter,Math.min(maxCenter,target));
      let x=target-width/2;
      y+=gap;

      // Moving platforms dominate the late game (normally 80%+) and accelerate
      // sooner than jump8 while remaining within a catchable linear velocity.
      const moveChance=.30+.55*difficulty;
      const moving=i>3&&(i%4===0||hash(seed,i*11+6)<moveChance);
      let moveCenter=x,moveAmp=0,moveSpeed=0,movePhase=0;
      if(moving){
        const desired=UNIT*(19+hash(seed,i*11+7)*(22+13*difficulty));
        const min=Math.max(24,x-desired),max=Math.min(W-width-24,x+desired);
        moveCenter=(min+max)/2;
        moveAmp=Math.max(16,(max-min)/2);
        const speedProgress=Math.min(1,Math.max(0,(i-2)/10));
        const desiredSpeed=(1.02+1.05*speedProgress)+hash(seed,i*11+8)*0.22;
        moveSpeed=Math.min(2.24,desiredSpeed,212/Math.max(1,moveAmp));
        movePhase=hash(seed,i*11+9)*Math.PI*2;
      }

      // Fragile platforms start after the onboarding jumps. Standing on one
      // for too long cracks it and then removes its collision entirely.
      const fragileChance=i<7?0:(0.08+0.27*difficulty);
      const fragile=i>=7&&hash(seed,i*11+10)<fragileChance;
      const fragileLimit=fragile?(1.08-0.34*difficulty+hash(seed,i*11+11)*0.16):0;
      out.push({x:Math.round(x),y,w:width,moving,moveCenter,moveAmp,moveSpeed,movePhase,fragile,fragileLimit,difficulty});
      prev=out[out.length-1];
    }
  }
  function create(seed,sharedPlatforms){
    return{x:W/2,y:0,vy:0,best:0,cam:0,alive:true,ground:true,groundPlatform:0,jumpOrigin:0,bestPlatform:0,activeMinPlatform:0,score:0,time:0,jumpBuffer:0,seed,platforms:sharedPlatforms||platforms(seed,30),brokenPlatforms:{},fragileTimers:{},fragilePlatform:-1,fragileRatio:0};
  }
  function isBroken(s,index){
    const b=s?.brokenPlatforms??s?.broken;
    return Array.isArray(b)?b.includes(index):!!b?.[index];
  }
  function fragileProgress(s,index){
    const p=s?.platforms?.[index];
    if(!p?.fragile)return 0;
    if(Number(s?.fragilePlatform)===index&&Number.isFinite(Number(s?.fragileRatio))&&Number(s.fragileRatio)>0)return Math.max(0,Math.min(1,Number(s.fragileRatio)));
    return Math.max(0,Math.min(1,Number(s?.fragileTimers?.[index]||0)/Math.max(.01,Number(p.fragileLimit)||1)));
  }
  function step(s,keys,dt){
    if(!s.alive)return s;
    dt=Math.max(0,Math.min(.05,Number(dt)||0));
    const oldTime=Number(s.time)||0,newTime=oldTime+dt;
    let groundIndex=Number.isInteger(s.groundPlatform)?s.groundPlatform:-1;

    if(s.ground&&groundIndex>=0&&isBroken(s,groundIndex)){
      s.ground=false;s.groundPlatform=-1;groundIndex=-1;
    }
    if(s.ground&&groundIndex>=0){
      const gp=s.platforms[groundIndex];
      if(gp?.moving)s.x+=platformX(gp,newTime)-platformX(gp,oldTime);
      if(gp?.fragile){
        s.fragileTimers=s.fragileTimers||{};
        s.fragileTimers[groundIndex]=Number(s.fragileTimers[groundIndex]||0)+dt;
        s.fragilePlatform=groundIndex;
        s.fragileRatio=Math.min(1,s.fragileTimers[groundIndex]/Math.max(.01,gp.fragileLimit||1));
        if(s.fragileRatio>=1){
          s.brokenPlatforms=s.brokenPlatforms||{};
          s.brokenPlatforms[groundIndex]=true;
          s.ground=false;s.groundPlatform=-1;s.jumpOrigin=groundIndex;groundIndex=-1;
        }
      }else{
        s.fragilePlatform=-1;s.fragileRatio=0;
      }
    }else{
      s.fragilePlatform=-1;s.fragileRatio=0;
    }
    s.time=newTime;

    const dir=(keys.right?1:0)-(keys.left?1:0);
    const lastY=s.y;
    s.x=Math.max(PLAYER_RADIUS,Math.min(W-PLAYER_RADIUS,s.x+dir*SPEED*dt));

    if(s.ground&&groundIndex>=0){
      const gp=s.platforms[groundIndex],gx=platformX(gp,s.time);
      if(s.x+PLAYER_RADIUS<=gx||s.x-PLAYER_RADIUS>=gx+gp.w){
        s.ground=false;s.groundPlatform=-1;s.jumpOrigin=groundIndex;
      }
    }

    if(keys.jump)s.jumpBuffer=.13;else s.jumpBuffer=Math.max(0,s.jumpBuffer-dt);
    if(s.ground&&s.jumpBuffer>0){
      s.jumpOrigin=Number.isInteger(s.groundPlatform)?s.groundPlatform:0;
      s.vy=JUMP;s.ground=false;s.groundPlatform=-1;s.jumpBuffer=0;
    }

    s.vy=Math.max(-MAX_FALL,s.vy-GRAVITY*dt);
    s.y+=s.vy*dt;
    if(s.vy<=0){
      const firstAtLeast=(value)=>{let lo=0,hi=s.platforms.length;while(lo<hi){const mid=(lo+hi)>>1;if(s.platforms[mid].y<value)lo=mid+1;else hi=mid;}return lo;};
      const start=Math.max(0,firstAtLeast(s.y-2)-2),end=Math.min(s.platforms.length-1,firstAtLeast(lastY+2)+2);
      const lowestAllowed=Math.max(0,Number(s.activeMinPlatform)||0);
      let landed=false;
      for(let i=start;i<=end;i++){
        if(i<lowestAllowed||isBroken(s,i))continue;
        const p=s.platforms[i],px=platformX(p,s.time);
        if(lastY>=p.y-.05&&s.y<=p.y&&s.x+PLAYER_RADIUS>px&&s.x-PLAYER_RADIUS<px+p.w){
          s.y=p.y;s.vy=0;s.ground=true;s.groundPlatform=i;s.jumpOrigin=i;landed=true;
          if(p.fragile){
            s.fragilePlatform=i;
            s.fragileRatio=fragileProgress(s,i);
          }else{s.fragilePlatform=-1;s.fragileRatio=0}
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
    if(s.platforms[s.platforms.length-1].y<s.best+H+160)extend(s.platforms,s.seed,s.platforms.length+25);
    s.cam=Math.max(0,s.best-CAMERA_ANCHOR);
    if(s.y<=s.cam-FLOOR_MARGIN)s.alive=false;
    return s;
  }
  function publicState(s){
    const broken=Array.isArray(s.broken)?s.broken:Object.keys(s.brokenPlatforms||{}).filter(k=>s.brokenPlatforms[k]).map(Number);
    return{x:Math.round(s.x*10)/10,y:Math.round(s.y*10)/10,best:Math.max(0,Math.floor(s.best)),platform:Math.max(0,Number(s.bestPlatform)||0),activeMinPlatform:Math.max(0,Number(s.activeMinPlatform)||0),score:Math.max(0,Number(s.score)||0),alive:s.alive,vy:Math.round(s.vy),ground:!!s.ground,groundPlatform:Number.isInteger(s.groundPlatform)?s.groundPlatform:-1,broken,fragilePlatform:Number(s.fragilePlatform??-1),fragileRatio:Math.round(Math.max(0,Math.min(1,Number(s.fragileRatio)||0))*100)/100};
  }
  return{W,H,UNIT,SPEED,JUMP,GRAVITY,MAX_FALL,PLAYER_RADIUS,CAMERA_ANCHOR,FLOOR_MARGIN,SCORE_PER_PLATFORM,hash,platformX,platforms,create,step,publicState,isBroken,fragileProgress};
});
