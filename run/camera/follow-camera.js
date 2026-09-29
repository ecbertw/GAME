const damp=(current,target,lambda,dt)=>target+(current-target)*Math.exp(-lambda*dt);
export class FollowCamera{
 constructor(){this.x=0;this.y=1.4;this.ready=false;this.look=0;}
 reset(state){this.x=state.x;this.y=state.y+1.6;this.look=0;this.ready=true;}
 update(state,dt){if(!this.ready)this.reset(state);const desiredLook=Math.max(-3.6,Math.min(3.6,state.vx*.42));this.look=damp(this.look,desiredLook,7.5,dt);this.x=damp(this.x,state.x+this.look,6.8,dt);const targetY=state.y+1.6,diff=targetY-this.y;if(Math.abs(diff)>1.25)this.y=damp(this.y,targetY-Math.sign(diff)*.85,4.5,dt);return this;}
}
