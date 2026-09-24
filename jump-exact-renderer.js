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
 const sx=long?0:variation*181,sy=long?(index%2?272:170):16;
 const sw=long?724:181,sh=long?99:145;
 const height=long?27:clamp(13+w*.17,17,29),top=y+1;
 c.save();c.imageSmoothingEnabled=true;
 c.shadowColor='rgba(3,7,16,.48)';c.shadowBlur=3;c.shadowOffsetY=3;
 // Use the actual approved transparent biome atlas for ALL four worlds.
 // The previous geometric city/snow substitute discarded the supplied artwork.
 c.drawImage(img,sx,sy,sw,sh,x-2,top,w+4,height);
 if(name==='desert'&&index===0){
  const lip=c.createLinearGradient(0,top-2,0,top+4);
  lip.addColorStop(0,'rgba(255,241,183,.92)');lip.addColorStop(1,'rgba(235,147,83,.38)');
  c.fillStyle=lip;c.fillRect(x,top-2,w,2);
 }
 c.shadowBlur=0;c.shadowOffsetY=0;
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
const fxKinds={frost:'snow',ember:'fire',electric:'lightning',mist:'cloud',comet:'streak',cosmic:'star',prismatic:'star',spark:'star',plasma:'star'};
let lastTick=0;
function particlesFor(c,x,y,fx,time,moving,ground,dir,ghost,identity='local'){
 const key=ghost?'ghost:'+String(identity||'peer'):'local';
 let p=particles.get(key);if(!p){p={items:[],last:time,carry:0,fx:null};particles.set(key,p)}
 const dt=Math.max(0,Math.min(.05,time-p.last));p.last=time;
 if(time-lastTick>15){for(const [k,v] of particles)if(time-v.last>5)particles.delete(k);lastTick=time}
 if(p.fx!==fx){p.fx=fx;p.carry=0;p.items.length=0}
 const colors=fxColors[fx]||fxColors.glow,kind=fxKinds[fx]||'dust';
 // A subtle, continuously animated signature makes the equipped effect
 // identifiable even while standing still; movement releases a larger trail.
 p.carry+=dt*(moving?39:13);
 let serial=p.serial||0;
 while(p.carry>=1&&p.items.length<48){
  p.carry--;serial++;
  const rand=z=>{const v=Math.sin(serial*93.17+z*31.7)*43758.5453;return v-Math.floor(v)};
  const spread=moving?12:9;
  p.items.push({x:x+(rand(1)-.5)*spread-dir*(moving?5:0),
   y:y-1-rand(2)*7,vx:(rand(3)-.5)*12-dir*(moving?29:0),
   vy:kind==='snow'?-(4+rand(4)*11):-(12+rand(4)*22),
   life:.4+rand(5)*.55,max:.95,size:.7+rand(6)*1.5,
   color:colors[Math.floor(rand(7)*colors.length)],seed:rand(8)*6.28});
 }
 p.serial=serial;
 c.save();c.globalCompositeOperation='screen';
 for(let i=p.items.length-1;i>=0;i--){
  const q=p.items[i];q.life-=dt;q.x+=q.vx*dt+Math.sin(time*6+q.seed)*dt*3;
  q.y+=q.vy*dt;q.vy+=(kind==='fire'?-7:kind==='snow'?2:7)*dt;
  q.vx*=1-dt*.6;
  if(q.life<=0){p.items.splice(i,1);continue}
  const alpha=(ghost?.4:.92)*Math.min(1,q.life/.22)*Math.min(1,(q.max-q.life)/.12);
  c.globalAlpha=alpha;c.fillStyle=q.color;c.strokeStyle=q.color;
  c.shadowColor=q.color;c.shadowBlur=kind==='fire'||kind==='lightning'?5:3;
  const size=q.size*(kind==='cloud'?1.6:1);
  if(kind==='fire'){
   c.beginPath();c.moveTo(q.x,q.y-size*1.8);c.quadraticCurveTo(q.x+size,q.y,q.x,q.y+size);
   c.quadraticCurveTo(q.x-size,q.y,q.x,q.y-size*1.8);c.fill();
  }else if(kind==='snow'){
   c.fillRect(q.x-size*.7,q.y,size*1.4,1);c.fillRect(q.x,q.y-size*.7,1,size*1.4);
  }else if(kind==='lightning'){
   c.lineWidth=.85;c.beginPath();c.moveTo(q.x-2,q.y-3);c.lineTo(q.x+1,q.y);
   c.lineTo(q.x-1,q.y+2);c.lineTo(q.x+2,q.y+4);c.stroke();
  }else if(kind==='star'){
   c.fillRect(q.x-size,q.y,2*size,1.2);c.fillRect(q.x,q.y-size,1.2,2*size);
  }else if(kind==='streak'){
   c.fillRect(q.x,q.y,size,1.5);c.globalAlpha=alpha*.4;c.fillRect(q.x-q.vx*.07,q.y-q.vy*.07,size*1.6,1);
  }else{
   c.beginPath();c.arc(q.x,q.y,size*.7,0,Math.PI*2);c.fill();
  }
 }
 c.restore();
}
// Do not paint synthetic hair strands. The approved hair belongs to the
// sprite itself; a separate alpha-isolated hair layer is needed for deformation.
function runner(c,x,y,style,name,ghost=false,time=0,motion={}){
 const img=images.runner;if(!has(img))return false;
 const O=style||{},dir=motion.facing===-1?-1:1,moving=!!motion.moving,
       ground=motion.ground!==false,vy=Number(motion.vy)||0;
 let frame=0;
 if(!ground||Math.abs(vy)>5)frame=vy>18?3:vy< -65?5:4;
 else if(moving)frame=1+(Math.floor(time*13)%2);
 const col=frame%3,row=Math.floor(frame/3),bob=moving&&ground?Math.abs(Math.sin(time*26))*.8:0;
 // Emit in world coordinates first: the character is drawn on top of the trail.\n if(String(O.effect||'none')!=='none')particlesFor(c,x-dir*7,y+1,String(O.effect),time,moving,ground,dir,ghost,name);\n c.save();c.translate(Math.round(x),Math.round(y-bob));c.scale(dir,1);
 if(ghost)c.globalAlpha=.62;
 if(ground){c.save();c.globalAlpha*=.3;c.fillStyle='#020712';c.beginPath();c.ellipse(0,1,12,2,0,0,Math.PI*2);c.fill();c.restore()}
 // Trail is rendered in world-space below, so particles persist after each step.
 c.imageSmoothingEnabled=true;
 const tinted=recolor(img,O,time);
 // Discard the disconnected marks in the top margin of jump frames.
 c.drawImage(tinted,col*112,row*144,112,144,-19,-47,38,48);

 c.restore();
 if(name){c.save();c.globalAlpha=ghost?.8:1;c.fillStyle=ghost?'#d9efff':'#fff';c.textAlign='center';c.font='bold 5px monospace';c.fillText(String(name).slice(0,12),Math.round(x),Math.round(y)-44);c.restore()}
 return true;
}
root.EixoJumpExactArt={version:'approved-assets-vfx5-20260924',ready,background,platform,runner,images};
})(window);
