/* Shared deterministic JUMP physics. Server computes the authoritative score. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.EixoJumpPhysics=api;
})(typeof window!=='undefined'?window:this,function(){
  'use strict';
  const W=450,H=195;
  function hash(seed,n){let x=(seed+Math.imul(n,0x9e3779b9))|0;x=Math.imul(x^(x>>>16),0x85ebca6b);x=Math.imul(x^(x>>>13),0xc2b2ae35);return((x^(x>>>16))>>>0)/4294967296;}
  function platforms(seed,count){
    const out=[{x:0,y:0,w:W}];let x=W/2-45,y=0;
    for(let i=1;i<=count;i++){
      const a=hash(seed,i*3+1),b=hash(seed,i*3+2),c=hash(seed,i*3+3);
      y+=31+Math.floor(a*12);
      x=Math.max(15,Math.min(W-92,x+(b-.5)*130));
      out.push({x:Math.round(x),y,w:68+Math.floor(c*28)});
    }
    return out;
  }
  function create(seed,sharedPlatforms){
    return{x:W/2,y:0,vy:0,best:0,cam:0,alive:true,ground:true,jumpBuffer:0,platforms:sharedPlatforms||platforms(seed,1800)};
  }
  function step(s,keys,dt){
    if(!s.alive)return s;
    dt=Math.max(0,Math.min(.05,Number(dt)||0));
    const dir=(keys.right?1:0)-(keys.left?1:0);
    const lastY=s.y;
    s.x=Math.max(8,Math.min(W-8,s.x+dir*133*dt));
    if(keys.jump)s.jumpBuffer=.13;else s.jumpBuffer=Math.max(0,s.jumpBuffer-dt);
    if(s.ground&&s.jumpBuffer>0){s.vy=205;s.ground=false;s.jumpBuffer=0;}
    s.vy=Math.max(-275,s.vy-380*dt);
    s.y+=s.vy*dt;
    if(s.vy<=0){
      const start=Math.max(0,Math.floor((s.y-12)/31)-3),end=Math.min(s.platforms.length-1,Math.ceil((lastY+12)/31)+3);
      for(let i=start;i<=end;i++){
        const p=s.platforms[i];
        if(lastY>=p.y-.05&&s.y<=p.y&&s.x+7>p.x&&s.x-7<p.x+p.w){
          s.y=p.y;s.vy=0;s.ground=true;break;
        }
      }
    }else s.ground=false;
    s.best=Math.max(s.best,s.y);
    s.cam=Math.max(0,s.best-78);
    if(s.y<s.cam-65||s.y<-60)s.alive=false;
    return s;
  }
  function publicState(s){return{x:Math.round(s.x*10)/10,y:Math.round(s.y*10)/10,best:Math.max(0,Math.floor(s.best)),alive:s.alive,vy:Math.round(s.vy)};}
  return{W,H,platforms,create,step,publicState};
});
