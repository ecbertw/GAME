const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class RunCamera{
  constructor(){this.x=0;this.y=0;this.look=0;this.ready=false}
  reset(player){this.x=player.x;this.y=player.y;this.look=0;this.ready=true}
  update(player,dt){
    if(!this.ready)this.reset(player);
    const speedRatio=clamp(Math.abs(player.vx)/8.35,0,1);
    const desiredLook=(player.facing||1)*(0.55+1.9*speedRatio);
    this.look+=(desiredLook-this.look)*(1-Math.exp(-5.2*dt));
    const targetX=player.x+player.w*.5+this.look;
    this.x+=(targetX-this.x)*(1-Math.exp(-7.4*dt));
    const playerY=player.y+player.h*.55,delta=playerY-this.y,dead=.9;
    if(Math.abs(delta)>dead){
      const targetY=playerY-Math.sign(delta)*dead;
      this.y+=(targetY-this.y)*(1-Math.exp(-4.5*dt));
    }
  }
}