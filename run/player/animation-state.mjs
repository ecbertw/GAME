export function animationState(p){
  if(p.dead)return'death';
  if(p.finished)return'victory';
  if(p.hardLanding)return'landing';
  if(!p.onGround){
    if(p.vy<-7.5)return'jump-start';
    if(p.vy<-1.4)return'jump';
    if(Math.abs(p.vy)<=1.4)return'apex';
    return'fall';
  }
  if(p.skid)return'skid';
  if(Math.abs(p.vx)>1.2)return Math.abs(p.vx)>7.2?'fast-run':'run';
  return'idle';
}
export function frameFor(state,tick=0){
  switch(state){
    case'idle':return (tick%300)>260?1:0;
    case'run':return 2+(Math.floor(tick/8)%4);
    case'fast-run':return 2+(Math.floor(tick/6)%4);
    case'skid':return 6;
    case'jump-start':return 7;
    case'jump':return 8;
    case'apex':return 9;
    case'fall':return 10;
    case'landing':return 11;
    case'death':return 12;
    case'victory':return 13;
    default:return 0;
  }
}