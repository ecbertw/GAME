/* JUMP 15 — approved 2026 2.5D pixel-art worlds. Gameplay geometry stays deterministic. */
(function(root){
'use strict';
const W=450,H=195;
const materials={
 city:{top:'#7ef4ff',top2:'#2e91b6',front:'#13283e',deep:'#091523',rim:'#ff53c8',glow:'#57eaff',fragile:'#ffc56b'},
 forest:{top:'#a9db78',top2:'#5f944e',front:'#233c34',deep:'#10251f',rim:'#77d9a0',glow:'#b9ff9b',fragile:'#ffc56b'},
 desert:{top:'#ffd287',top2:'#c47b55',front:'#69404b',deep:'#362638',rim:'#ffb869',glow:'#ffe0a0',fragile:'#ffc56b'},
 snow:{top:'#f6fdff',top2:'#8ecce0',front:'#355574',deep:'#172942',rim:'#7af2ff',glow:'#c8fbff',fragile:'#ffc56b'}
};
const fallback={
 city:['#162a52','#553f72','#d37d8c'],forest:['#13283e','#285a59','#73a69a'],
 desert:['#704a78','#c36f68','#f8bd73'],snow:['#071b42','#174f78','#76a7c8']
};
function rounded(c,x,y,w,h,r){
 r=Math.max(0,Math.min(r,h/2,w/2));c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();
}
function fallbackDraw(c,biome,time){
 const cols=fallback[biome]||fallback.forest,g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,cols[0]);g.addColorStop(.58,cols[1]);g.addColorStop(1,cols[2]);c.fillStyle=g;c.fillRect(0,0,W,H);
 c.save();c.globalAlpha=.2;c.fillStyle='#dffaff';for(let i=0;i<14;i++){const x=(i*43+(time||0)*2)%500-20,y=18+(i*29)%95;c.fillRect(x,y,1+(i%3===0),1+(i%4===0));}c.restore();
}
function draw(c,biome,seed,cam=0,time=0){
 const bg=root.EixoJumpArt?.background?.(biome);c.save();c.imageSmoothingEnabled=true;
 if(bg){
  // The approved concept art is the world itself. A tiny overscan/parallax shift
  // keeps it alive while avoiding the old flat procedural-map look.
  const zoom=1.035,ow=W*zoom,oh=H*zoom,shift=((cam||0)*.018)%10;
  c.drawImage(bg,-(ow-W)/2-shift,-(oh-H)/2,ow,oh);
 }else fallbackDraw(c,biome,time);
 // Cinematic depth/readability: subtle lower haze + edge vignette, not a dark wash.
 const haze=c.createLinearGradient(0,H*.55,0,H);haze.addColorStop(0,'rgba(8,15,25,0)');haze.addColorStop(1,biome==='desert'?'rgba(74,38,42,.20)':'rgba(3,12,22,.28)');c.fillStyle=haze;c.fillRect(0,0,W,H);
 const edge=c.createRadialGradient(W/2,H*.48,70,W/2,H*.48,290);edge.addColorStop(.45,'rgba(0,0,0,0)');edge.addColorStop(1,'rgba(0,5,12,.34)');c.fillStyle=edge;c.fillRect(0,0,W,H);
 // Very sparse environmental motes give depth without covering gameplay.
 c.globalCompositeOperation='screen';
 for(let i=0;i<9;i++){
  const x=((seed*13+i*67+(time||0)*(biome==='snow'?7:2.2))%520)-35;
  const y=18+((seed*7+i*31+(time||0)*(biome==='forest'?3.1:1.1))%155);
  const a=.12+(i%3)*.035;c.globalAlpha=a;c.fillStyle=biome==='desert'?'#ffd38a':biome==='forest'?'#bbff9d':biome==='snow'?'#e9ffff':'#7beaff';c.fillRect(x,y,i%4===0?2:1,i%5===0?2:1);
 }
 c.restore();
}
function platform(c,biome,x,y,w,index,state={}){
 const m=materials[biome]||materials.forest,fragile=!!state.fragile,progress=Math.max(0,Math.min(1,Number(state.progress)||0));
 const h=11,depth=6,xx=Math.round(x),yy=Math.round(y);
 c.save();
 // Contact shadow / AO makes every platform float in front of the art.
 c.shadowColor='rgba(0,0,0,.55)';c.shadowBlur=7;c.shadowOffsetY=4;c.fillStyle='rgba(0,0,0,.33)';rounded(c,xx+2,yy+4,w,depth+5,3);c.fill();c.shadowBlur=0;c.shadowOffsetY=0;
 // Front face with a vertical material gradient.
 const front=c.createLinearGradient(0,yy+1,0,yy+h+depth);front.addColorStop(0,m.front);front.addColorStop(1,m.deep);c.fillStyle=front;rounded(c,xx,yy,w,h+depth,3);c.fill();
 // 2.5D top slab.
 const top=c.createLinearGradient(0,yy-5,0,yy+4);top.addColorStop(0,m.top);top.addColorStop(.52,m.top2);top.addColorStop(1,m.front);c.fillStyle=top;rounded(c,xx,yy-5,w,10,3);c.fill();
 c.globalCompositeOperation='screen';c.globalAlpha=.6;c.fillStyle=m.glow;c.fillRect(xx+4,yy-4,Math.max(4,w-8),1);
 c.globalAlpha=.24;c.fillStyle=m.rim;c.fillRect(xx+6,yy+3,Math.max(2,w-12),1);c.globalCompositeOperation='source-over';c.globalAlpha=1;
 // Material detail remains biome-specific and restrained.
 if(biome==='city'){
  c.fillStyle='#071522';for(let j=7;j<w-7;j+=15)c.fillRect(xx+j,yy+7,7,2);
  c.fillStyle=index%2?m.rim:m.glow;for(let j=10;j<w-8;j+=24)c.fillRect(xx+j,yy+8,5,1);
 }else if(biome==='forest'){
  c.fillStyle='#b7ed83';for(let j=6;j<w-6;j+=16){c.fillRect(xx+j,yy-7,6,2);c.fillRect(xx+j+2,yy-9,2,2)}
  c.fillStyle='#41623e';for(let j=11;j<w-5;j+=22)c.fillRect(xx+j,yy+6,2,5);
 }else if(biome==='desert'){
  c.strokeStyle='rgba(74,37,43,.52)';c.lineWidth=1;for(let j=13;j<w-8;j+=26){c.beginPath();c.moveTo(xx+j,yy);c.lineTo(xx+j+3,yy+5);c.lineTo(xx+j+1,yy+9);c.stroke()}
 }else{
  c.fillStyle='rgba(255,255,255,.92)';rounded(c,xx+2,yy-7,w-4,4,2);c.fill();
  c.fillStyle='#a9e7f4';for(let j=9;j<w-7;j+=21){c.beginPath();c.moveTo(xx+j,yy+5);c.lineTo(xx+j+3,yy+11);c.lineTo(xx+j+6,yy+5);c.fill()}
 }
 if(state.moving){
  c.globalCompositeOperation='screen';c.globalAlpha=.6;c.fillStyle=m.glow;const pulse=3+Math.round((Math.sin((index||0)+performance.now()/250)+1)*2);c.fillRect(xx+w/2-pulse,yy+8,pulse*2,1);c.globalCompositeOperation='source-over';c.globalAlpha=1;
 }
 if(fragile){
  const warn=progress>.02?m.fragile:'rgba(255,197,107,.58)';c.strokeStyle=warn;c.lineWidth=1;
  const cracks=2+Math.floor(progress*6);for(let j=0;j<cracks;j++){const cx=xx+8+((index*17+j*23)%Math.max(12,w-16));c.beginPath();c.moveTo(cx,yy-2);c.lineTo(cx+2,yy+1);c.lineTo(cx+1,yy+4);c.stroke()}
  if(progress>.58){c.globalCompositeOperation='screen';c.globalAlpha=.2+.32*progress;c.fillStyle=warn;rounded(c,xx+2,yy-5,w-4,10,2);c.fill()}
 }
 c.restore();
}
root.EixoJumpWorlds={draw,platform,materials,version:'jump15-art'};
})(typeof window==='undefined'?globalThis:window);