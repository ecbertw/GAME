export function animationState(p){
  if(p.dead)return'death';if(p.finished)return'victory';if(p.hardLanding)return'hard-land';
  if(!p.onGround){if(p.vy<-1.8)return'jump';if(Math.abs(p.vy)<=1.8)return'apex';return'fall'}
  if(p.skid)return'skid';if(Math.abs(p.vx)>1.2)return'run';return'idle';
}
export function frameFor(state,tick=0){
 if(state==='run')return 1+(Math.floor(tick/9)%4);
 if(state==='idle')return Math.floor(tick/180)%2===1&&tick%180<24?7:0;
 return({skid:5,jump:6,apex:7,fall:8,'hard-land':9,death:10,victory:11})[state]??0;
}
export const FRAME={idle:0,run:1,skid:5,jump:6,apex:7,fall:8,'hard-land':9,death:10,victory:11};