export class GameLoop{
 constructor(step=1/120){this.stepSize=step;this.acc=0;this.last=0;this.raf=0;this.running=false;}
 start(step,render){this.stop();this.running=true;this.acc=0;this.last=performance.now();const frame=now=>{if(!this.running)return;let dt=Math.min(.1,Math.max(0,(now-this.last)/1000));this.last=now;this.acc+=dt;let n=0;while(this.acc>=this.stepSize&&n<16){step(this.stepSize);this.acc-=this.stepSize;n++;}if(n===16)this.acc=0;render(this.acc/this.stepSize,dt);this.raf=requestAnimationFrame(frame);};this.raf=requestAnimationFrame(frame);}
 stop(){this.running=false;if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;}
}
