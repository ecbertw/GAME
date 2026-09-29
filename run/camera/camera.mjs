const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class RunCamera{
  constructor(){this.x=0;this.y=0;this.look=0;this.vx=0;this.vy=0}
  reset(p){this.x=p.x;this.y=p.y;this.look=0;this.vx=this.vy=0}
  update(p,dt){
    const targetLook=clamp(p.vx*.24,-2.2,2.2);
    this.look+=(targetLook-this.look)*(1-Math.exp(-5.5*dt));
    const tx=p.x+this.look;
    const verticalDelta=p.y-this.y,deadZone=.8;
    const ty=Math.abs(verticalDelta)>deadZone?p.y-Math.sign(verticalDelta)*deadZone:this.y;
    this.vx+=(tx-this.x)*18*dt;this.vy+=(ty-this.y)*10*dt;
    this.vx*=Math.exp(-8.5*dt);this.vy*=Math.exp(-7.0*dt);
    this.x+=this.vx*dt;this.y+=this.vy*dt;
  }
}
