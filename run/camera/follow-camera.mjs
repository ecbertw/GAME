export class FollowCamera{
  constructor(){this.x=0;this.y=0;this.vx=0;this.vy=0;this.look=0}
  reset(x,y){this.x=x;this.y=y;this.vx=this.vy=0;this.look=0}
  update(player,dt){
    const desiredLook=Math.max(-4.0,Math.min(4.0,player.vx*.48+(player.facing||1)*.45));
    this.look+=(desiredLook-this.look)*Math.min(1,dt*4.8);
    const tx=player.x+this.look;
    const dy=player.y-this.y,dead=1.05;
    const ty=Math.abs(dy)>dead?player.y-Math.sign(dy)*dead:this.y;
    const kx=17,ky=10.5,dragX=7.8,dragY=7.2;
    this.vx+=(tx-this.x)*kx*dt;this.vy+=(ty-this.y)*ky*dt;
    this.vx*=Math.exp(-dragX*dt);this.vy*=Math.exp(-dragY*dt);
    this.x+=this.vx*dt;this.y+=this.vy*dt;
  }
}