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
  // The same continuous curve is used by the game and the score verifier.
  // A more responsive opening still leaves the full ramp for the first 100 points.
  const speed=score=>1.65+(3.8-1.65)*Math.min(100,Math.max(0,score))/100;
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
    // Scene coordinates follow the source art through the cover crop. Lights and
    // waterfalls stay attached to their architecture at every viewport size.
    const observatory={
      lights:[
        {x:.074,y:.165,r:.043,strength:1},
        {x:.039,y:.375,r:.027,strength:.62},
        {x:.136,y:.612,r:.019,strength:.46},
        {x:.683,y:.802,r:.022,strength:.52},
        {x:.829,y:.774,r:.025,strength:.65},
        {x:.926,y:.389,r:.028,strength:.60},
        {x:.937,y:.802,r:.047,strength:1}
      ],
      falls:[
        {x:.1044,y:.114,end:.198,width:.0024},
        {x:.1055,y:.251,end:.420,width:.0042},
        {x:.1035,y:.483,end:.648,width:.0030,fade:true},
        {x:.9045,y:.519,end:.626,width:.0031},
        {x:.8798,y:.808,end:1.0,width:.0035,fade:true}
      ],
      stars:[[.309,.106],[.702,.129],[.816,.300],[.350,.806],[.042,.698],[.282,.237]],
      // Falling sparks are local to the architecture, outside the timing ring.
      sparks:[[.073,.150],[.937,.783],[.829,.764],[.039,.357]]
    };
    function drawObservatory(time,reducedMotion){
      if(!loaded)return;
      const scale=Math.max(w/image.width,h/image.height),iw=image.width*scale,ih=image.height*scale;
      const left=(w-iw)/2,top=(h-ih)/2,t=reducedMotion?0:time;
      ctx.save();ctx.translate(left,top);ctx.globalCompositeOperation='screen';
      for(let i=0;i<observatory.lights.length;i++){
        const light=observatory.lights[i],x=light.x*iw,y=light.y*ih,r=light.r*ih;
        const flicker=reducedMotion?1:1+.20*Math.sin(t*2.9+i*1.8)+.10*Math.sin(t*7.3+i);
        const glow=ctx.createRadialGradient(x,y,0,x,y,r);
        glow.addColorStop(0,`rgba(255,207,119,${.38*light.strength*flicker})`);
        glow.addColorStop(.25,`rgba(255,173,70,${.19*light.strength*flicker})`);
        glow.addColorStop(1,'rgba(255,138,56,0)');
        ctx.fillStyle=glow;ctx.fillRect(x-r,y-r,r*2,r*2);
      }
      for(let i=0;i<observatory.falls.length;i++){
        const fall=observatory.falls[i],x=fall.x*iw,y=fall.y*ih,length=(fall.end-fall.y)*ih,fw=Math.max(1,fall.width*iw);
        const veil=ctx.createLinearGradient(x,y,x,y+length);
        veil.addColorStop(0,'rgba(176,241,255,.14)');veil.addColorStop(.55,'rgba(123,225,255,.25)');veil.addColorStop(1,fall.fade?'rgba(101,217,255,0)':'rgba(207,255,255,.32)');
        ctx.fillStyle=veil;ctx.fillRect(x-fw/2,y,fw,length);
        for(let j=0;j<7;j++){
          const phase=((j/7+t*(.30+i*.023))%1),yy=y+phase*length;
          const alpha=(fall.fade?1-phase:.7)*(.35+.25*Math.sin(j*2+i));
          const streak=Math.max(2,length*.09),xx=x+Math.sin(j*4.1+i)*fw*.35;
          ctx.globalAlpha=alpha;line(xx,yy,xx,Math.min(y+length,yy+streak),'#bff7ff',Math.max(1,fw*.19));
        }
        ctx.globalAlpha=1;
        if(!fall.fade&&!reducedMotion)for(let j=0;j<5;j++){
          const phase=(t*.7+j/5)%1,side=j%2?1:-1;
          ctx.globalAlpha=(1-phase)*.65;ctx.fillStyle='#bbf2ff';
          ctx.fillRect(x+side*phase*fw*2,y+length-Math.sin(phase*Math.PI)*fw*1.8,1.5,1.5);
        }
        ctx.globalAlpha=1;
      }
      for(let i=0;i<observatory.stars.length;i++){
        const [sx,sy]=observatory.stars[i],x=sx*iw,y=sy*ih;
        const shimmer=reducedMotion?.55:.35+.65*Math.pow((Math.sin(t*1.6+i*2.3)+1)/2,3);
        ctx.globalAlpha=shimmer;const span=(2+3*shimmer)*Math.max(.6,iw/1672);
        line(x-span,y,x+span,y,'#ffeaca');line(x,y-span,x,y+span,'#fff3df');
      }
      if(!reducedMotion)for(let i=0;i<observatory.sparks.length;i++)for(let j=0;j<4;j++){
        const [sx,sy]=observatory.sparks[i],phase=(t*.24+j*.25+i*.13)%1;
        const x=sx*iw+Math.sin(phase*5+j)*iw*.002,y=sy*ih-phase*ih*.026;
        ctx.globalAlpha=Math.sin(phase*Math.PI)*.65;ctx.fillStyle='#ffd69b';ctx.fillRect(x,y,Math.max(1,iw*.0009),Math.max(1,iw*.0009));
      }
      ctx.restore();
    }
    function draw(state,time,{status='idle',reducedMotion=false,feedback='',feedbackAt=0,best=0,pt=false}={}){
      ctx.clearRect(0,0,w,h);fallback();
      if(loaded){const scale=Math.max(w/image.width,h/image.height),iw=image.width*scale,ih=image.height*scale;ctx.drawImage(image,(w-iw)/2,(h-ih)/2,iw,ih);ctx.fillStyle='#06101a38';ctx.fillRect(0,0,w,h);}
      const anim=reducedMotion?0:time/1000;
      drawObservatory(anim,reducedMotion);
      const slim=w<600,header=slim?42:48,footer=slim?48:42,cx=w/2,cy=header+(h-header-footer)*.49,r=Math.max(35,Math.min(w*(slim?.38:.285),(h-header-footer)*.395));
      // Legibility stays local to the ring, allowing the architectural scene to show.
      const shade=ctx.createRadialGradient(cx,cy,0,cx,cy,r*1.18);shade.addColorStop(0,'#07111ad9');shade.addColorStop(.8,'#07111aba');shade.addColorStop(1,'#07111a00');ctx.fillStyle=shade;ctx.fillRect(cx-r*1.2,cy-r*1.2,r*2.4,r*2.4);
      ctx.fillStyle='#070f19be';ctx.fillRect(0,0,w,header);ctx.fillRect(0,h-footer,w,footer);line(0,header,w,header,'#8e9cad35');line(0,h-footer,w,h-footer,'#8e9cad35');
      text(slim?'PULSE':'E I X O  /  P U L S E',slim?15:24,header/2,slim?12:13,'#eedac0','left');
      text((pt?'RECORDE ':'BEST ')+best,w-(slim?15:24),header/2,slim?11:12,'#e7b87d','right');
      if(!slim)text((pt?'Ó R B I T A  ':'O R B I T  ')+String(1+Math.floor(state.hits/10)).padStart(2,'0'),cx,header/2,11,'#d5d9e5');
      for(let i=0;i<8;i++){const sx=((i*137.31+.13)%1)*w,sy=header+((i*.173+.21)%1)*(h-header-footer);const alpha=reducedMotion?.35:.25+.22*Math.sin(anim*.7+i);ctx.globalAlpha=alpha;line(sx-3,sy,sx+3,sy,'#f9d7a1');line(sx,sy-3,sx,sy+3,'#f9d7a1');}ctx.globalAlpha=1;
      arc(cx,cy,r,0,TAU,'#a7e6dd',2);arc(cx,cy,r-4,0,TAU,'#417a7940',1);
      for(let i=0;i<24;i++){const a=i*TAU/24;if(i%6===0){diamond(cx+Math.cos(a)*(r+12),cy+Math.sin(a)*(r+12),3,'#c0b4eb');continue;}arc(cx,cy,r+12,a-.018,a+.018,'#b6a7df',1.4);}
      const limits=widths(state.score),target=state.target;
      ctx.save();ctx.shadowColor='#f0b964';ctx.shadowBlur=12;arc(cx,cy,r+2,target-limits.good,target+limits.good,'#9b704a',11);arc(cx,cy,r+3,target-limits.good,target+limits.good,'#f5bd79',1.5);arc(cx,cy,r+2,target-limits.perfect,target+limits.perfect,'#fff1d1',5);ctx.restore();
      for(const a of [target-limits.good,target+limits.good])line(cx+Math.cos(a)*(r-5),cy+Math.sin(a)*(r-5),cx+Math.cos(a)*(r+12),cy+Math.sin(a)*(r+12),'#ffe1b0',2);
      const angle=status==='playing'?angleAt(state,time):state.ended?state.angle:angleAt(state,reducedMotion?0:time*.30);
      if(!reducedMotion)for(let i=1;i<28;i++){const a=angle-state.direction*i*.013;ctx.globalAlpha=(1-i/28)*.48;const radius=r+(i%3-1)*2;const size=i<7?2.2:1;ctx.fillStyle='#95f3de';ctx.fillRect(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius,size,size);}ctx.globalAlpha=1;
      const dx=cx+Math.cos(angle)*r,dy=cy+Math.sin(angle)*r;ctx.save();ctx.shadowColor='#acfff1';ctx.shadowBlur=11;diamond(dx,dy,6,'#c6fff0',true);diamond(dx,dy,10,'#99d9d0');ctx.restore();
      const fontSize=Math.max(30,Math.min(r*.43,100));
      text(pt?'P O N T O S':'S C O R E',cx,cy-r*.34,slim?9:10,'#b9c7d6');
      text(String(state.score),cx,cy-r*.03,fontSize,'#f6efdd','center','Georgia, serif');
      // Keep the numeral fully above its own divider; the old frame-wide line
      // is disabled in pulse-orbit.css because it crossed the score itself.
      line(cx-r*.28,cy+r*.20,cx+r*.28,cy+r*.20,'#b8cad530');
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
