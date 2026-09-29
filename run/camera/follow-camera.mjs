export class FollowCamera{
  constructor(){this.x=0;this.y=0;this.vx=0;this.vy=0}
  reset(x,y){this.x=x;this.y=y;this.vx=this.vy=0}
  update(player,dt){
    const look=Math.max(-3.1,Math.min(3.1,player.vx*.38)),tx=player.x+look,dead=1.2;
    const ty=Math.abs(player.y-this.y)>dead?player.y:this.y;
    const k=14,d=7.2;
    this.vx+=(tx-this.x)*k*dt;this.vy+=(ty-this.y)*k*.55*dt;
    this.vx*=Math.exp(-d*dt);this.vy*=Math.exp(-d*dt);
    this.x+=this.vx*dt;this.y+=this.vy*dt;
  }
}