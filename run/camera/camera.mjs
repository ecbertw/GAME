const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class RunCamera{
 constructor(){this.x=0;this.y=0;this.look=0;this.vx=0;this.vy=0}
 reset(p){this.x=p.x;this.y=p.y;this.look=0;this.vx=this.vy=0}
 update(p,dt){
  const wanted=clamp(p.vx*.30,-2.7,2.7);this.look+=(wanted-this.look)*(1-Math.exp(-5.4*dt));
  const tx=p.x+this.look,dy=p.y-this.y,dead=.75,ty=Math.abs(dy)>dead?p.y-Math.sign(dy)*dead:this.y;
  this.vx+=(tx-this.x)*20*dt;this.vy+=(ty-this.y)*10*dt;this.vx*=Math.exp(-9*dt);this.vy*=Math.exp(-7.2*dt);
  this.x+=this.vx*dt;this.y+=this.vy*dt;
 }
}