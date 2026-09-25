/* JUMP15 worlds — generated premium pixel-art backgrounds + dimensional gameplay platforms. */
(function(root){
'use strict';
const palettes={
 city:{top:'#8cf7ff',edge:'#3197bb',mid:'#24475f',under:'#102535',glow:'#ff5fd0',fragile:'#ffc86b'},
 forest:{top:'#b9f28f',edge:'#66a267',mid:'#3e654d',under:'#213c31',glow:'#d8ff8c',fragile:'#ffc86b'},
 snow:{top:'#f6fdff',edge:'#9cd7eb',mid:'#4f7899',under:'#263f5d',glow:'#80f3ff',fragile:'#ffc86b'}
};
function fallback(c,biome){
 const p=palettes[biome]||palettes.forest,W=450,H=195,g=c.createLinearGradient(0,0,0,H);
 g.addColorStop(0,p.mid);g.addColorStop(1,p.under);c.fillStyle=g;c.fillRect(0,0,W,H);
}
// Atmospheric layers use deterministic, time-based motion, independent of physics.
function ambience(c,biome,time){
 const W=450,H=195,t=Number(time||0);
 const wrap=(v,m)=>((v%m)+m)%m;
 c.save();c.globalCompositeOperation='screen';
 if(biome==='city'){
  // Distant airborne traffic and slow neon reflections.
  for(let i=0;i<13;i++){
   const x=wrap(i*67+t*(i%3===0?-5:3+i%4),W+35)-15,y=19+(i*37)%132;
   c.globalAlpha=.18+(i%4)*.065;c.fillStyle=i%2?'#74dcff':'#ff77d8';
   c.fillRect(x,y,i%3===0?5:2,.55);c.fillRect(x-3,y,1,.55);
  }
  for(let i=0;i<5;i++){const x=wrap(i*107+t*1.7,W);c.globalAlpha=.11;c.fillStyle='#ff8fdd';c.fillRect(x,149+i*6,11,1)}
 }else if(biome==='forest'){
  // Fireflies follow independent elliptical paths rather than scrolling in lockstep.
  for(let i=0;i<23;i++){
   const phase=i*2.399,tick=t*(.43+(i%5)*.12)+phase;
   const x=wrap(i*43+Math.sin(tick)*12,W),y=30+(i*29)%145+Math.cos(tick*.77)*7;
   c.globalAlpha=.2+.48*(.5+.5*Math.sin(tick*1.6));c.fillStyle=i%3?'#e2ff94':'#7efee5';
   c.fillRect(x,y,i%7===0?1.5:1,1);
  }
 }else{
  // Multiple snow speeds, including slow foreground flakes.
  for(let i=0;i<35;i++){
   const speed=2+i%5*1.8,x=wrap(i*41+Math.sin(t*.8+i)*4+t*(i%2?-.9:.5),W);
   const y=wrap(i*31+t*speed,H);
   c.globalAlpha=.26+(i%4)*.12;c.fillStyle=i%6===0?'#a9f6ff':'#f3fcff';
   c.fillRect(x,y,i%9===0?1.6:1,i%9===0?1.6:1);
  }
 }
 c.restore();
}
function draw(c,biome,seed,cam=0,time=0){
 const W=450,H=195;
 if(root.EixoJumpExactArt?.background?.(c,biome,W,H,cam,time)){ambience(c,biome,time);return}
 if(!root.EixoJumpPremiumArt?.drawBackground?.(c,biome,W,H,cam,time))fallback(c,biome);
 ambience(c,biome,time);
}
function platform(c,biome,x,y,w,index,state={}){
 if(root.EixoJumpExactArt?.platform?.(c,biome,x,y,w,index,state))return;
 const p=palettes[biome]||palettes.forest,fragile=!!state.fragile,progress=Math.max(0,Math.min(1,Number(state.progress)||0));
 x=Math.round(x);y=Math.round(y);w=Math.round(w);
 const q=(xx,yy,ww,hh,col)=>{c.fillStyle=col;c.fillRect(Math.round(xx),Math.round(yy),Math.max(1,Math.round(ww)),Math.max(1,Math.round(hh)))};
 c.save();
 // Floating shadow gives a faux-3D slab without changing collision geometry.
 q(x+4,y+10,w,5,'#02071166');
 q(x+1,y+4,w-2,8,p.under);
 q(x+2,y+2,w-4,7,p.mid);
 q(x,y,w,3,p.edge);
 q(x+2,y-3,w-4,3,p.top);
 q(x+5,y-4,Math.max(2,w-10),1,'#ffffff77');
 // Bevel/end caps.
 q(x,y+2,3,8,p.under);q(x+w-3,y+2,3,8,'#08121f88');
 // Biome material details.
 if(biome==='city'){
  for(let j=8;j<w-6;j+=18){q(x+j,y+4,8,1,'#6ff6ff');q(x+j+2,y+7,4,1,index%2?p.glow:'#a9faff');}
  q(x+4,y+1,2,1,p.glow);q(x+w-6,y+1,2,1,'#6ff6ff');
 }else if(biome==='forest'){
  for(let j=5;j<w-4;j+=13){q(x+j,y-5,3,2,index%2?'#9ee477':'#d0f7a2');q(x+j+2,y-6,1,2,'#deffb8');}
  q(x+8,y+8,2,6,'#37533e');
 }else{
  q(x+2,y-5,w-4,3,'#f8feff');q(x+5,y-6,Math.max(2,w-10),1,'#ffffff');
  for(let j=9;j<w-5;j+=18){q(x+j,y+5,3,5,'#75c7e2');q(x+j+1,y+10,1,3,'#c9f4ff');}
 }
 if(fragile){
  const warn=progress>.02?p.fragile:'#d99b55';
  const cracks=2+Math.floor(progress*6);
  for(let j=0;j<cracks;j++){const cx=x+7+((index*13+j*17)%Math.max(10,w-14)),cy=y+1+(j%3);q(cx,cy,2,1,warn);q(cx+1,cy+1,1,2,warn)}
  if(progress>.65){c.globalAlpha=.45+.4*Math.sin(progress*30);q(x+2,y-3,w-4,2,warn);c.globalAlpha=1}
 }
 c.restore();
}
root.EixoJumpWorlds={draw,platform,palettes,version:'jump15'};
})(typeof window==='undefined'?globalThis:window);
