/* Four connected sky realms. Ambient motion never changes collision geometry. */
(function(root){
'use strict';
const palettes={
 forest:{top:'#d5e2b1',sky:'#b4d7d4',mist:'#d7e6d6',far:'#7eaa9b',glow:'#e6e8a4'},
 city:{top:'#f6d592',sky:'#e5bd9c',mist:'#f4dfba',far:'#b49380',glow:'#ffd28e'},
 snow:{top:'#f6feff',sky:'#a9c7d9',mist:'#e3eff1',far:'#8ea9be',glow:'#beefff'},
 astral:{top:'#e5d9f6',sky:'#8a8eae',mist:'#c8bfd7',far:'#727b9b',glow:'#e7c1ff'}
};
const names={forest:{pt:'Jardins do Céu',en:'Sky Gardens'},city:{pt:'Aquedutos do Sol',en:'Sunlit Aqueducts'},snow:{pt:'Observatório de Gelo',en:'Frost Observatory'},astral:{pt:'Santuário Astral',en:'Astral Sanctuary'}};
function fallback(c,biome,W,H,time){
 const p=palettes[biome]||palettes.forest,g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,p.sky);g.addColorStop(1,p.mist);c.fillStyle=g;c.fillRect(0,0,W,H);
 c.save();c.globalAlpha=.30;c.fillStyle=p.far;
 for(let i=0;i<9;i++){const x=i*137-80,y=80+(i*61)%280;c.beginPath();c.moveTo(x,y);c.lineTo(x+105,y);c.lineTo(x+61,y+72);c.lineTo(x+22,y+51);c.closePath();c.fill();c.fillRect(x+32,y-55,11,55);c.fillRect(x+80,y-90,9,90)}c.restore();
}
function ambience(c,biome,time,W,H){
 const p=palettes[biome]||palettes.forest,t=Number(time)||0,wrap=(v,m)=>((v%m)+m)%m;
 c.save();
 // Thin distant clouds move through the architecture in all four realms.
 c.globalAlpha=.07;c.fillStyle='#ffffff';for(let i=0;i<6;i++){const x=wrap(i*193+t*(2+i%3),W+260)-130,y=135+(i*71)%(H-170);c.beginPath();c.ellipse(x,y,90+i*9,8+i%3*3,0,0,Math.PI*2);c.fill()}
 if(biome==='snow'){
  // Multiple snow speeds produce depth without a distracting full-screen storm.
  for(let i=0;i<28;i++){const x=wrap(i*71+Math.sin(t*.4+i)*8+t*1.2,W),y=wrap(i*59+t*(4+i%4*2),H);c.globalAlpha=.18+i%4*.10;c.fillStyle='#f6ffff';c.fillRect(x,y,i%9===0?2:1.1,i%9===0?2:1.1)}
 }else{
  for(let i=0;i<18;i++){const phase=i*2.399+t*(.26+i%5*.07),x=wrap(i*89+Math.sin(phase)*15,W),y=65+(i*61)%(H-95)+Math.cos(phase*.7)*10;c.globalAlpha=.1+.4*(.5+.5*Math.sin(phase*1.5));c.fillStyle=p.glow;c.shadowColor=p.glow;c.shadowBlur=4;c.fillRect(x,y,1.4,1.4)}c.shadowBlur=0;
 }
 c.restore();
}
function draw(c,biome,seed,cam=0,time=0){
 const W=root.EixoJumpPhysics?.W||960,H=root.EixoJumpPhysics?.H||540;
 if(!root.EixoJumpExactArt?.background?.(c,biome,W,H,cam,time))fallback(c,biome,W,H,time);
 ambience(c,biome,time,W,H);
}
function platform(c,biome,x,y,w,index,state={}){return root.EixoJumpExactArt?.platform?.(c,biome,x,y,w,index,state)}
root.EixoJumpWorlds={draw,platform,palettes,names,version:'sky-gardens-v3'};
})(typeof window==='undefined'?globalThis:window);
