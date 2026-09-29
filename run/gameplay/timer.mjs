export class RunTimer{
  constructor(){this.started=false;this.finished=false;this.startTick=0;this.endTick=0}
  reset(){this.started=false;this.finished=false;this.startTick=this.endTick=0}
  start(tick){if(!this.started){this.started=true;this.startTick=tick}}
  finish(tick){if(this.started&&!this.finished){this.finished=true;this.endTick=tick}}
  ms(tick){if(!this.started)return 0;return Math.max(0,((this.finished?this.endTick:tick)-this.startTick)*(1000/120))}
}
export const fmt=ms=>{const total=Math.max(0,Math.round(ms)),m=Math.floor(total/60000),s=Math.floor(total/1000)%60,x=total%1000;return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+'.'+String(x).padStart(3,'0')};