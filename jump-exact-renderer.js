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
 // Movement is communicated by the slab's motion, not a universal cyan overlay.
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
// Particle trails are simulated in world-space and emitted only by actual movement.
const particles=new Map();
const fxColors={
 glow:['#73eaff','#c4fbff'],pulse:['#ffdb70','#fff4b2'],shimmer:['#ffe08b','#ffffff'],
 spark:['#fff6aa','#ffd260'],halo:['#ffe9a1','#fff9dd'],frost:['#8beeff','#e5fcff'],
 electric:['#38aaff','#e0faff'],ember:['#ff681f','#ffd26b'],mist:['#cbd7ff','#ffffff'],
 plasma:['#49d7ff','#ff7dff'],comet:['#53c9ff','#ffd66c'],cosmic:['#8c5cff','#f3a6ff'],
 prismatic:['#ff5f9d','#72f7ff','#ffe86c','#a5ffb6']
};
let lastTick=0;
function particlesFor(c,x,y,fx,time,moving,ground,dir,ghost,identity='local'){
 const key=ghost?'ghost:'+String(identity):'local';
 let p=particles.get(key);if(!p){p={items:[],last:time,carry:0};particles.set(key,p)}
 const dt=Math.max(0,Math.min(.05,time-p.last));p.last=time;
 if(time-lastTick>15){for(const [k,v] of particles)if(time-v.last>5)particles.delete(k);lastTick=time}
 const colors=fxColors[fx]||fxColors.glow;
 if(moving&&dt>0){
  p.carry+=dt*(fx==='mist'?48:fx==='ember'?35:42);
  while(p.carry>=1&&p.items.length<110){p.carry--;const n=p.items.length,rand=z=>{let v=Math.sin((n+1)*93.17+time*17.23+z*31.7)*43758.5453;return v-Math.floor(v)};
   p.items.push({x:x-dir*(7+rand(1)*6),y:y-(ground?2:15)-rand(2)*3,vx:-dir*(10+rand(3)*24)+(rand(4)-.5)*10,vy:-6-rand(5)*19,life:.32+rand(6)*.45,max:.77,size:rand(7)>.83?2:1,color:colors[Math.floor(rand(8)*colors.length)]});
  }
 }
 c.save();c.globalCompositeOperation='screen';
 for(let i=p.items.length-1;i>=0;i--){
  const q=p.items[i];q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=(fx==='frost'?3:fx==='mist'?-2:13)*dt;q.vx*=1-dt*.7;
  if(q.life<=0){p.items.splice(i,1);continue}
  c.globalAlpha=(ghost?.35:.85)*Math.min(1,q.life/.18)*Math.min(1,(q.max-q.life)/.08);
  c.fillStyle=q.color;c.shadowColor=q.color;c.shadowBlur=fx==='mist'?2:4;
  c.fillRect(q.x,q.y,q.size,q.size);
 }
 c.restore();
}
// Animated tips supplement the approved sprite; face, outfit and hairstyle remain unchanged.
function hairMotion(c,style,time,moving,ground,vy){
 const energy=moving?1:ground?.32:.8;
 const sway=Math.sin(time*(moving?15:5.5))*energy;
 const lift=!ground?Math.max(-1,Math.min(1,vy/180)):0;
 const base=style.hair&&HEX.test(style.hair)?style.hair:'#28c6ed';
 c.save();c.lineCap='round';c.lineJoin='round';c.strokeStyle=base;c.lineWidth=1.05;
 for(let i=0;i<3;i++){
  const yy=-39+i*1.45,xx=-9-i*.9;
  c.beginPath();c.moveTo(xx,yy);
  c.quadraticCurveTo(xx-2.5-sway*.6,yy-1.3-lift,xx-4.1-sway*(1+i*.15),yy-1.7+sway*.5-lift);
  c.stroke();
 }
 c.restore();
}
function runner(c,x,y,style,name,ghost=false,time=0,motion={}){
 const img=images.runner;if(!has(img))return false;
 const O=style||{},dir=motion.facing===-1?-1:1,moving=!!motion.moving,
       ground=motion.ground!==false,vy=Number(motion.vy)||0;
 let frame=0;
 if(!ground||Math.abs(vy)>5)frame=vy>18?3:vy< -65?5:4;
 else if(moving)frame=1+(Math.floor(time*13)%2);
 const col=frame%3,row=Math.floor(frame/3),bob=moving&&ground?Math.abs(Math.sin(time*26))*.8:0;
 c.save();c.translate(Math.round(x),Math.round(y-bob));c.scale(dir,1);
 if(ghost)c.globalAlpha=.62;
 if(ground){c.save();c.globalAlpha*=.3;c.fillStyle='#020712';c.beginPath();c.ellipse(0,1,12,2,0,0,Math.PI*2);c.fill();c.restore()}
 // Trail is rendered in world-space below, so particles persist after each step.
 c.imageSmoothingEnabled=true;
 const tinted=recolor(img,O,time);
 c.drawImage(tinted,col*112,row*144,112,144,-19,-47,38,48);
 hairMotion(c,O,time,moving,ground,vy);
 c.restore();
 if(String(O.effect||'none')!=='none')particlesFor(c,x,y,String(O.effect),time,moving,ground,dir,ghost,name);
 if(name){c.save();c.globalAlpha=ghost?.8:1;c.fillStyle=ghost?'#d9efff':'#fff';c.textAlign='center';c.font='bold 5px monospace';c.fillText(String(name).slice(0,12),Math.round(x),Math.round(y)-44);c.restore()}
 return true;
}
root.EixoJumpExactArt={version:'approved-assets-motion2-20260924',ready,background,platform,runner,images};
})(window);
