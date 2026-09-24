/* JUMP15 worlds — generated premium pixel-art backgrounds + dimensional gameplay platforms. */
(function(root){
'use strict';
const palettes={
 city:{top:'#8cf7ff',edge:'#3197bb',mid:'#24475f',under:'#102535',glow:'#ff5fd0',fragile:'#ffc86b'},
 forest:{top:'#b9f28f',edge:'#66a267',mid:'#3e654d',under:'#213c31',glow:'#d8ff8c',fragile:'#ffc86b'},
 desert:{top:'#ffd889',edge:'#d38b58',mid:'#9a5848',under:'#523342',glow:'#ffb15e',fragile:'#ffc86b'},
 snow:{top:'#f6fdff',edge:'#9cd7eb',mid:'#4f7899',under:'#263f5d',glow:'#80f3ff',fragile:'#ffc86b'}
};
function fallback(c,biome){
 const p=palettes[biome]||palettes.forest,W=450,H=195,g=c.createLinearGradient(0,0,0,H);
 g.addColorStop(0,p.mid);g.addColorStop(1,p.under);c.fillStyle=g;c.fillRect(0,0,W,H);
}
function ambience(c,biome,time){
 const W=450,H=195,t=Number(time||0);
 c.save();
 if(biome==='city'){
  for(let i=0;i<9;i++){const x=(i*71+t*7)%W,y=35+(i*31)%120;c.fillStyle=i%2?'#77f8ff55':'#ff5bd055';c.fillRect(x,y,1,2)}
 }else if(biome==='forest'){
  for(let i=0;i<12;i++){const x=(i*43+t*(2+i%3))%W,y=40+(i*29)%125;c.fillStyle=i%3?'#cfff835e':'#8fffd35a';c.fillRect(x,y,1,1)}
 }else if(biome==='desert'){
  c.fillStyle='#ffc87814';for(let i=0;i<5;i++)c.fillRect((i*111-t*2)%W,55+i*18,70,1);
 }else{
  for(let i=0;i<16;i++){const x=(i*37+t*(3+i%2))%W,y=(i*23+t*5)%H;c.fillStyle='#f4fdff88';c.fillRect(x,y,i%6===0?2:1,1)}
 }
 c.restore();
}
function draw(c,biome,seed,cam=0,time=0){
 const W=450,H=195;
 if(!root.EixoJumpPremiumArt?.drawBackground?.(c,biome,W,H,cam,time))fallback(c,biome);
 ambience(c,biome,time);
}
function platform(c,biome,x,y,w,index,state={}){
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
 }else if(biome==='desert'){
  q(x+4,y-2,w-8,1,'#fff0b1');for(let j=10;j<w-5;j+=19){q(x+j,y+4,1,5,'#70404a');q(x+j+1,y+7,5,1,'#bd7156');}
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