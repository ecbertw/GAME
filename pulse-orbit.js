/* PULSE Orbit: shared, viewport-independent rules and an observatory renderer. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.EixoPulseOrbit=api;
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  const TAU=Math.PI*2,MODE='orbit-v1',MAX_EVENTS=600,MAX_DURATION=30*60*1000;
  const wrap=angle=>((angle%TAU)+TAU)%TAU;
  const offset=(angle,target)=>wrap(angle-target+Math.PI)-Math.PI;
  const speed=score=>1.22+Math.min(140,Math.max(0,score))*.016;
  const widths=score=>({good:Math.max(.125,.215-score*.00065),perfect:Math.max(.033,.060-score*.00018)});
  function random(state){state.rng=(Math.imul(state.rng,1664525)+1013904223)>>>0;return state.rng/4294967296;}
  function createState(seed){
    const state={seed:Number(seed)>>>0,rng:Number(seed)>>>0,score:0,streak:0,hits:0,direction:1,angle:Math.PI*1.5,changedAt:0,lastInput:-1000,target:0,ended:false};
    state.target=wrap(state.angle+1.7+random(state)*1.4);
    return state;
  }
  function angleAt(state,time){return wrap(state.angle+state.direction*speed(state.score)*Math.max(0,Number(time)-state.changedAt)/1000);}
  function hit(state,time){
    const t=Math.round(Number(time));
    if(!Number.isFinite(t)||t<0||t>MAX_DURATION||state.ended||t-state.lastInput<150)return {ignored:true,points:0};
    const angle=angleAt(state,t),distance=offset(angle,state.target),limits=widths(state.score);
    const points=Math.abs(distance)<=limits.perfect?2:Math.abs(distance)<=limits.good?1:0;
    state.lastInput=t;state.angle=angle;state.changedAt=t;
    if(!points){state.ended=true;return {points:0,offset:distance,t,angle};}
    state.score+=points;state.hits++;state.streak=points===2?state.streak+1:0;state.direction*=-1;
    // The new target always requires a meaningful journey after reversing.
    state.target=wrap(angle+state.direction*(1.65+random(state)*2.55));
    return {points,offset:distance,t,angle};
  }
  function verifyRun(seed,events,score,elapsed){
    if(!Array.isArray(events)||!events.length||events.length>MAX_EVENTS)return {valid:false,reason:'invalid-events'};
    if(!Number.isInteger(score)||score<0||score>MAX_EVENTS*2)return {valid:false,reason:'invalid-score'};
    const state=createState(seed);let previous=-1;
    for(const event of events){
      const t=event?.t;
      if(!Number.isInteger(t)||t<=previous||t>MAX_DURATION||t>elapsed+750||![0,1,2].includes(event.points))return {valid:false,reason:'invalid-timing'};
      const result=hit(state,t);
      if(result.ignored||result.points!==event.points)return {valid:false,reason:'invalid-hit'};
      previous=t;
    }
    if(state.score!==score)return {valid:false,reason:'score-mismatch'};
    return {valid:true,score:state.score,hits:state.hits,streak:state.streak,ended:state.ended};
  }
  function createRenderer(canvas,{background='/assets/game-v300/pulse-observatory.webp'}={}){
    const ctx=canvas.getContext('2d');let image=null,loaded=false,w=1,h=1,dpr=1;
    if(typeof Image!=='undefined'){image=new Image();image.onload=()=>{loaded=true;};image.src=background;}
    function resize(){const rect=canvas.getBoundingClientRect();w=Math.max(1,rect.width);h=Math.max(1,rect.height);dpr=Math.min(2,globalThis.devicePixelRatio||1);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=true;}
    function line(x1,y1,x2,y2,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
    function diamond(x,y,size,color,fill=false){ctx.beginPath();ctx.moveTo(x,y-size);ctx.lineTo(x+size,y);ctx.lineTo(x,y+size);ctx.lineTo(x-size,y);ctx.closePath();ctx.strokeStyle=color;ctx.lineWidth=1;if(fill){ctx.fillStyle=color;ctx.fill();}else ctx.stroke();}
    function arc(cx,cy,r,a,b,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.arc(cx,cy,r,a,b);ctx.stroke();}
    function text(value,x,y,size,color='#efe8db',align='center',family='monospace'){ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';ctx.font=`${size}px ${family}`;ctx.fillText(value,x,y);}
    function fallback(){
      const bg=ctx.createRadialGradient(w*.5,h*.5,0,w*.5,h*.5,Math.max(w,h)*.7);bg.addColorStop(0,'#101b2a');bg.addColorStop(1,'#060c16');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
      for(let i=0;i<170;i++){const x=((i*113.743)%1)*w,y=((i*73.147)%1)*h;ctx.fillStyle=i%6?'#4f678d':'#d5cfb4';ctx.globalAlpha=.3+(i%4)*.1;ctx.fillRect(x,y,i%9?1:2,1);}ctx.globalAlpha=1;
      // Distant segmented ruins sit outside the play area.
      for(const [cx,cy,r] of [[w*-.01,h*.28,h*.29],[w*1.04,h*.70,h*.28]])for(let i=0;i<34;i++){
        const a=i/34*TAU;arc(cx,cy,r,a,a+.16,i%3?'#1b2d44':'#2b3b51',Math.max(12,h*.023));
        arc(cx,cy,r+12,a,a+.16,'#344256',2);
      }
    }
    function draw(state,time,{status='idle',reducedMotion=false,feedback='',feedbackAt=0,best=0,pt=false}={}){
      ctx.clearRect(0,0,w,h);fallback();
      if(loaded){const scale=Math.max(w/image.width,h/image.height),iw=image.width*scale,ih=image.height*scale;ctx.drawImage(image,(w-iw)/2,(h-ih)/2,iw,ih);ctx.fillStyle='#06101a38';ctx.fillRect(0,0,w,h);}
      const slim=w<600,header=slim?42:48,footer=slim?48:42,cx=w/2,cy=header+(h-header-footer)*.49,r=Math.max(35,Math.min(w*(slim?.38:.285),(h-header-footer)*.395));
      // Legibility stays local to the ring, allowing the architectural scene to show.
      const shade=ctx.createRadialGradient(cx,cy,0,cx,cy,r*1.18);shade.addColorStop(0,'#07111ad9');shade.addColorStop(.8,'#07111aba');shade.addColorStop(1,'#07111a00');ctx.fillStyle=shade;ctx.fillRect(cx-r*1.2,cy-r*1.2,r*2.4,r*2.4);
      ctx.fillStyle='#070f19be';ctx.fillRect(0,0,w,header);ctx.fillRect(0,h-footer,w,footer);line(0,header,w,header,'#8e9cad35');line(0,h-footer,w,h-footer,'#8e9cad35');
      text(slim?'PULSE':'E I X O  /  P U L S E',slim?15:24,header/2,slim?12:13,'#eedac0','left');
      text((pt?'RECORDE ':'BEST ')+best,w-(slim?15:24),header/2,slim?11:12,'#e7b87d','right');
      if(!slim)text((pt?'Ó R B I T A  ':'O R B I T  ')+String(1+Math.floor(state.hits/10)).padStart(2,'0'),cx,header/2,11,'#d5d9e5');
      const anim=reducedMotion?0:time/1000;
      for(let i=0;i<8;i++){const sx=((i*137.31+.13)%1)*w,sy=header+((i*.173+.21)%1)*(h-header-footer);const alpha=reducedMotion?.35:.25+.22*Math.sin(anim*.7+i);ctx.globalAlpha=alpha;line(sx-3,sy,sx+3,sy,'#f9d7a1');line(sx,sy-3,sx,sy+3,'#f9d7a1');}ctx.globalAlpha=1;
      // Light around the two observatory lamps gently breathes independently of play.
      for(const lamp of [[w*.077,h*.22],[w*.93,h*.81]]){const glow=ctx.createRadialGradient(lamp[0],lamp[1],0,lamp[0],lamp[1],h*.052);glow.addColorStop(0,`rgba(255,184,100,${.16+(reducedMotion?0:.035*Math.sin(anim*1.6))})`);glow.addColorStop(1,'#ffb86400');ctx.fillStyle=glow;ctx.fillRect(lamp[0]-h*.052,lamp[1]-h*.052,h*.104,h*.104);}
      arc(cx,cy,r,0,TAU,'#a7e6dd',2);arc(cx,cy,r-4,0,TAU,'#417a7940',1);
      for(let i=0;i<24;i++){const a=i*TAU/24;if(i%6===0){diamond(cx+Math.cos(a)*(r+12),cy+Math.sin(a)*(r+12),3,'#c0b4eb');continue;}arc(cx,cy,r+12,a-.018,a+.018,'#b6a7df',1.4);}
      const limits=widths(state.score),target=state.target;
      ctx.save();ctx.shadowColor='#f0b964';ctx.shadowBlur=12;arc(cx,cy,r+2,target-limits.good,target+limits.good,'#9b704a',11);arc(cx,cy,r+3,target-limits.good,target+limits.good,'#f5bd79',1.5);arc(cx,cy,r+2,target-limits.perfect,target+limits.perfect,'#fff1d1',5);ctx.restore();
      for(const a of [target-limits.good,target+limits.good])line(cx+Math.cos(a)*(r-5),cy+Math.sin(a)*(r-5),cx+Math.cos(a)*(r+12),cy+Math.sin(a)*(r+12),'#ffe1b0',2);
      const angle=status==='playing'?angleAt(state,time):state.ended?state.angle:angleAt(state,reducedMotion?0:time*.30);
      if(!reducedMotion)for(let i=1;i<28;i++){const a=angle-state.direction*i*.013;ctx.globalAlpha=(1-i/28)*.48;const radius=r+(i%3-1)*2;const size=i<7?2.2:1;ctx.fillStyle='#95f3de';ctx.fillRect(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius,size,size);}ctx.globalAlpha=1;
      const dx=cx+Math.cos(angle)*r,dy=cy+Math.sin(angle)*r;ctx.save();ctx.shadowColor='#acfff1';ctx.shadowBlur=11;diamond(dx,dy,6,'#c6fff0',true);diamond(dx,dy,10,'#99d9d0');ctx.restore();
      const fontSize=Math.max(30,Math.min(r*.43,100));
      text(pt?'P O N T O S':'S C O R E',cx,cy-r*.27,slim?9:10,'#b9c7d6');
      text(String(state.score),cx,cy+r*.04,fontSize,'#f6efdd','center','Georgia, serif');
      text((pt?'SEQUÊNCIA  ×':'STREAK  ×')+state.streak,cx,cy+r*.35,slim?10:12,'#f4bd78');
      for(let i=0;i<5;i++){ctx.fillStyle=i<Math.min(state.streak,5)?'#ffe9b9':'#6f699155';ctx.beginPath();ctx.arc(cx+(i-2)*15,cy+r*.49,4,0,TAU);ctx.fill();}
      const elapsed=Math.max(0,time-feedbackAt);
      if(feedback&&elapsed<1100){ctx.globalAlpha=Math.min(1,(1100-elapsed)/350);text(feedback,cx,cy-r*.56,slim?12:15,state.ended?'#ef9c94':'#b8f6df');ctx.globalAlpha=1;}
      if(status!=='playing'){
        const label=status==='loading'?(pt?'A LIGAR…':'CONNECTING…'):status==='ended'?(pt?'TOCA PARA RECOMEÇAR':'TAP TO RETRY'):(pt?'TOCA PARA COMEÇAR':'TAP TO BEGIN');
        text(label,cx,cy+r*.75,slim?10:11,'#f3e7d1');
      }
      const hint=slim?(pt?'ESPAÇO OU TOQUE · ZONA DOURADA':'SPACE OR TAP · GOLDEN ZONE'):(pt?'E S P A Ç O  O U  T O Q U E   ·   A C E R T A  N A  Z O N A  D O U R A D A':'S P A C E  O R  T A P   ·   H I T  T H E  G O L D E N  Z O N E');
      text(hint,cx,h-footer/2,slim?9:10,'#c5cede');
      return {cx,cy,r};
    }
    resize();return {resize,draw};
  }
  return {MODE,TAU,MAX_EVENTS,MAX_DURATION,wrap,offset,speed,widths,createState,angleAt,hit,verifyRun,createRenderer};
});
