/* JUMP — faithful approved image assets. Presentation only: physics, rankings and payments remain untouched. */
(function(root){
'use strict';
const packed=root.EixoJumpExactPacked||{};
const images={backgrounds:{},platforms:{},runner:null,effects:null};
const loads=[];
function load(src,done){
 if(!src)return;
 const img=new Image();img.decoding='async';
 img.onload=()=>done(img);img.onerror=()=>console.warn('JUMP exact asset failed to load');
 img.src=src;
 loads.push(img.decode?.().catch(()=>{})||Promise.resolve());
}
for(const [name,url] of Object.entries(packed.backgrounds||{}))load(url,img=>images.backgrounds[name]=img);
for(const [name,url] of Object.entries(packed.platforms||{}))load(url,img=>images.platforms[name]=img);
load(packed.runner,img=>images.runner=img);
load(packed.effects,img=>images.effects=img);
const ready=Promise.all(loads);
const has=img=>!!(img&&img.complete&&img.naturalWidth>0);
const clamp=(n,a=0,b=255)=>Math.max(a,Math.min(b,n));
const HEX=/^#[0-9a-f]{6}$/i;
const defaults={hair:'#19222d',top:'#172b3b',pants:'#263c5c',shoes:'#ffffff',accent:'#00e5ff'};
const colorKeys=['hair','top','pants'];
const variants=new Map();
function paletteColor(v,time){
 if(v==='rainbow'){
  const h=(Math.floor(time*12)*20)%360;
  const k=n=>(n+h/30)%12,a=.78,b=.38;
  const f=n=>Math.round(255*(b-a*Math.max(-1,Math.min(k(n)-3,9-k(n),1))));
  return [f(0),f(8),f(4)];
 }
 if(!HEX.test(String(v)))return null;
 return [parseInt(v.slice(1,3),16),parseInt(v.slice(3,5),16),parseInt(v.slice(5,7),16)];
}
function recolor(image,style,time){
 if(!has(image))return image;
 const chosen=colorKeys.filter(k=>style[k]&&style[k]!==defaults[k]);
 if(!chosen.length)return image;
 const key=chosen.map(k=>k+':'+style[k]+(style[k]==='rainbow'?Math.floor(time*12):'')).join('|');
 if(variants.has(key))return variants.get(key);
 const cv=document.createElement('canvas');cv.width=image.naturalWidth;cv.height=image.naturalHeight;
 const c=cv.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);
 const data=c.getImageData(0,0,cv.width,cv.height),p=data.data;
 const target={};for(const k of chosen)target[k]=paletteColor(style[k],time);
 for(let i=0;i<p.length;i+=4){
  const [r,g,b,a]=[p[i],p[i+1],p[i+2],p[i+3]];if(a<14)continue;
  // Classify the approved hero's cyan hair, golden jacket and purple trousers.
  // Skin, eyes, shadow outlines and the orange/blue scarf are preserved.
  const hair=b>r*1.36&&b>g*.91&&g>r*1.28&&b>85;
  const jacket=r>92&&r>g*1.08&&g>b*1.35&&g>54;
  const trousers=b>g*1.33&&r>g*1.20&&b>r*.96&&b>60;
  const kind=hair?'hair':jacket?'top':trousers?'pants':null;
  const t=kind&&target[kind];if(!t)continue;
  const light=clamp((r*.22+g*.53+b*.25)/205,.22,1.18);
  p[i]=clamp(t[0]*light);p[i+1]=clamp(t[1]*light);p[i+2]=clamp(t[2]*light);
 }
 c.putImageData(data,0,0);variants.set(key,cv);
 if(variants.size>38)variants.delete(variants.keys().next().value);
 return cv;
}
function background(c,name,W,H,cam=0){
 const img=images.backgrounds[name];if(!has(img))return false;
 c.save();c.imageSmoothingEnabled=true;
 // Preserve the entire approved composition, including moon/sun, skyline and foreground.
 c.drawImage(img,0,0,W,H);
 const shade=c.createLinearGradient(0,0,0,H);
 shade.addColorStop(0,'rgba(4,8,18,.02)');shade.addColorStop(.70,'rgba(4,8,18,.03)');shade.addColorStop(1,'rgba(4,8,18,.17)');
 c.fillStyle=shade;c.fillRect(0,0,W,H);
 c.restore();return true;
}
function platform(c,name,x,y,w,index,state={}){
 const img=images.platforms[name];if(!has(img))return false;
 const long=w>115,variation=Math.abs(index)%4;
 // Approved transparent atlas is 724×543: top row has four short slabs,
 // subsequent rows supply two long slab materials.
 const sx=long?0:variation*181,sy=long?(index%2?272:170):16;
 const sw=long?724:181,sh=long?99:145;
 const height=long?27:clamp(13+w*.17,17,29),top=y-5;
 c.save();c.imageSmoothingEnabled=true;
 c.shadowColor='rgba(3,7,16,.48)';c.shadowBlur=3;c.shadowOffsetY=3;
 c.drawImage(img,sx,sy,sw,sh,x-2,top,w+4,height);
 c.shadowBlur=0;c.shadowOffsetY=0;
 if(state.moving){c.fillStyle='rgba(120,236,255,.30)';c.fillRect(x+5,y-3,Math.max(0,w-10),1)}
 if(state.fragile){
  const p=clamp(Number(state.progress)||0,0,1),cracks=2+Math.floor(p*6);
  c.strokeStyle=p>.55?'rgba(255,211,112,.96)':'rgba(255,189,101,.7)';
  c.lineWidth=.75;
  for(let k=0;k<cracks;k++){
   const xx=x+6+(Math.abs(index*19+k*17)%Math.max(10,w-12));
   c.beginPath();c.moveTo(xx,y-3);c.lineTo(xx+1,y-1);c.lineTo(xx-.5,y+1+p*3);c.stroke();
  }
  if(p>.7){c.globalAlpha=.2+.2*Math.sin(p*24);c.fillStyle='#ffd47d';c.fillRect(x,y-4,w,2)}
 }
 c.restore();return true;
}
const fxFrames={
 glow:[0,0],pulse:[0,0],shimmer:[1,0],spark:[1,0],halo:[1,0],
 frost:[0,1],electric:[0,0],ember:[1,1],mist:[0,2],
 plasma:[1,2],comet:[1,2],cosmic:[1,3],prismatic:[0,3]
};
function effect(c,effect,time,moving){
 if(effect==='none'||!has(images.effects))return;
 const cell=fxFrames[effect]||[0,0],pulse=.5+.5*Math.sin(time*5.3);
 const w=effect==='comet'||effect==='prismatic'?63:49,
       h=effect==='cosmic'?37:effect==='mist'?28:31;
 const dx=-w+11-(moving?Math.sin(time*16)*2:0),dy=-26-h*.20;
 c.save();c.globalCompositeOperation='screen';
 c.globalAlpha=effect==='glow'?.34:effect==='pulse'?.3+pulse*.30:effect==='mist'?.42:.53+pulse*.20;
 c.imageSmoothingEnabled=true;
 c.drawImage(images.effects,cell[0]*362,cell[1]*135.75,362,135.75,dx,dy,w+(pulse*2),h);
 if(effect==='spark'||effect==='electric'||effect==='prismatic'){
  // Small moving glints make a real sprite visibly animated rather than a static decal.
  c.fillStyle=effect==='prismatic'?'#ffd6ff':'#c5faff';
  for(let i=0;i<3;i++){
   const xx=-19+((time*(effect==='electric'?21:11)+i*13)%32),yy=-32+((i*17+Math.floor(time*8))%34);
   c.globalAlpha=.25+.65*Math.abs(Math.sin(time*4+i*2));c.fillRect(xx,yy,i===1?2:1,2);
  }
 }
 c.restore();
}
function runner(c,x,y,style,name,ghost=false,time=0,motion={}){
 const img=images.runner;if(!has(img))return false;
 const O=style||{},dir=motion.facing===-1?-1:1,moving=!!motion.moving,
       ground=motion.ground!==false,vy=Number(motion.vy)||0;
 let frame=0;
 if(!ground||Math.abs(vy)>5)frame=vy>18?3:vy< -65?5:4;
 else if(moving)frame=1+(Math.floor(time*10)%2);
 const col=frame%3,row=Math.floor(frame/3),bob=moving&&ground?Math.abs(Math.sin(time*18))*.65:0;
 c.save();c.translate(Math.round(x),Math.round(y-bob));c.scale(dir,1);
 if(ghost)c.globalAlpha=.62;
 if(ground){c.save();c.globalAlpha*=.3;c.fillStyle='#020712';c.beginPath();c.ellipse(0,1,12,2,0,0,Math.PI*2);c.fill();c.restore()}
 effect(c,String(O.effect||'none'),time,moving);
 c.imageSmoothingEnabled=true;
 const tinted=recolor(img,O,time);
 c.drawImage(tinted,col*112,row*144,112,144,-17,-42,34,43);
 c.restore();
 if(name){c.save();c.globalAlpha=ghost?.8:1;c.fillStyle=ghost?'#d9efff':'#fff';c.textAlign='center';c.font='bold 5px monospace';c.fillText(String(name).slice(0,12),Math.round(x),Math.round(y)-44);c.restore()}
 return true;
}
root.EixoJumpExactArt={version:'approved-assets-20260924',ready,background,platform,runner,images};
})(window);
