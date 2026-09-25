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
// Exported directly from the approved 25 September desert art sheet.
const desertSheet={image:null};
load('/assets/jump-exact/desert-approved-20260925.png',img=>desertSheet.image=img);
const ready=Promise.all(loads);
const has=img=>!!(img&&(img.complete?img.naturalWidth>0:img.getContext&&img.width>0));
const spriteCache=new Map();
// Atlas cells are not evenly spaced. Explicit bounds exclude neighbouring art.
const platformRects={
 city:[[6,20,175,151],[193,20,188,155],[390,20,170,153],[568,20,152,153]],
 forest:[[3,0,203,152],[209,5,173,173],[385,5,193,183],[582,5,138,172]],
 snow:[[0,0,201,158],[203,0,194,158],[399,0,165,158],[566,0,158,168]],
 desert:[[40,565,180,102],[24,672,124,69],[160,674,134,65],[553,660,136,81]]
};
const floorRects={city:[8,183,706,93],forest:[5,179,711,95],snow:[5,169,714,88],desert:[9,390,1965,123]};
function atlasSprite(image,rect,key,checker=false){
 if(spriteCache.has(key))return spriteCache.get(key);
 const cv=document.createElement('canvas');cv.width=rect[2];cv.height=rect[3];
 const c=cv.getContext('2d',{willReadFrequently:true});c.drawImage(image,...rect,0,0,cv.width,cv.height);
 const data=c.getImageData(0,0,cv.width,cv.height),p=data.data,n=cv.width*cv.height;
 // The supplied presentation sheet has a baked checkerboard, not alpha.
 // Its neutral light pixels are distinct from the warm masonry and foliage.
 if(checker)for(let i=0;i<p.length;i+=4){const hi=Math.max(p[i],p[i+1],p[i+2]),lo=Math.min(p[i],p[i+1],p[i+2]);if(lo>105&&hi-lo<30)p[i+3]=0;}
 // Retain the main connected silhouette, discarding stray atlas fragments.
 const seen=new Uint8Array(n),queue=new Int32Array(n);let largest=[];
 for(let start=0;start<n;start++){
  if(seen[start]||p[start*4+3]<32)continue;
  let head=0,tail=1;queue[0]=start;seen[start]=1;
  while(head<tail){const at=queue[head++],x=at%cv.width,y=Math.floor(at/cv.width);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    if(x+dx<0||x+dx>=cv.width||y+dy<0||y+dy>=cv.height)continue;
    const next=at+dy*cv.width+dx;if(!seen[next]&&p[next*4+3]>=32){seen[next]=1;queue[tail++]=next;}
   }
  }
  if(tail>largest.length)largest=queue.slice(0,tail);
 }
 const keep=new Uint8Array(n);for(const at of largest)keep[at]=1;
 for(let i=0;i<n;i++)if(!keep[i])p[i*4+3]=0;
 c.putImageData(data,0,0);spriteCache.set(key,cv);return cv;
}
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
 const sheet=name==='desert'&&has(desertSheet.image);const img=sheet?desertSheet.image:images.backgrounds[name];if(!has(img))return false;
 c.save();c.imageSmoothingEnabled=true;
 // The supplied panorama is wider than the viewport. Frame the sun and arch
 // without stretching the ruins; labels and the other atlas rows stay outside.
 if(sheet){const sw=344*W/H;c.drawImage(img,(1983-sw)*.62,0,sw,344,0,0,W,H);}else c.drawImage(img,0,0,W,H);
 const shade=c.createLinearGradient(0,0,0,H);
 shade.addColorStop(0,'rgba(4,8,18,.02)');shade.addColorStop(.70,'rgba(4,8,18,.03)');shade.addColorStop(1,'rgba(4,8,18,.17)');
 c.fillStyle=shade;c.fillRect(0,0,W,H);
 c.restore();return true;
}
function platform(c,name,x,y,w,index,state={}){
 const supplied=name==='desert'&&has(desertSheet.image);
 const img=supplied?desertSheet.image:images.platforms[name];if(!has(img))return false;
 // While the new desert sheet loads, use the existing world renderer fallback.
 if(name==='desert'&&!supplied)return false;
 const ground=index===0,rect=ground?floorRects[name]:platformRects[name]?.[Math.abs(index)%4];
 if(!rect)return false;
 const art=atlasSprite(img,rect,name+':'+(ground?'floor':Math.abs(index)%4),supplied);
 const height=ground?(name==='desert'?32:27):clamp(13+w*.17,17,29);
 const surface=ground?({city:19,forest:29,snow:26,desert:27}[name]):({city:[34,34,34,34],forest:[53,50,49,46],snow:[51,51,51,51],desert:[17,8,8,8]}[name][Math.abs(index)%4]);
 const top=y-surface/rect[3]*height;
 c.save();c.imageSmoothingEnabled=true;
 c.shadowColor='rgba(3,7,16,.48)';c.shadowBlur=3;c.shadowOffsetY=3;
 c.drawImage(art,0,0,art.width,art.height,x-2,top,w+4,height);
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
 else if(moving)frame=0;
 const col=frame%3,row=Math.floor(frame/3),bob=moving&&ground?Math.abs(Math.sin(time*26))*.8:0;
 // Emit in world coordinates first: the character is drawn on top of the trail.
 if(String(O.effect||'none')!=='none')particlesFor(c,x-dir*7,y+1,String(O.effect),time,moving,ground,dir,ghost,name);
 c.save();c.translate(Math.round(x),Math.round(y-bob));c.scale(dir,1);
 if(ghost)c.globalAlpha=.62;
 if(ground){c.save();c.globalAlpha*=.3;c.fillStyle='#020712';c.beginPath();c.ellipse(0,1,12,2,0,0,Math.PI*2);c.fill();c.restore()}
 // Trail is rendered in world-space below, so particles persist after each step.
 c.imageSmoothingEnabled=true;
 const tinted=recolor(img,O,time);
 // Keep the original cell placement but omit the upper row's shoe fragments.
 const inset=row===1?16:0;
 const sprite=atlasSprite(tinted,[col*112,row*144+inset,112,144-inset],'runner:'+frame+':'+colorKeys.map(k=>O[k]||'').join(':')+':'+(colorKeys.some(k=>O[k]==='rainbow')?Math.floor(time*12):''));
 // Bound the cache when rainbow cosmetics generate new colour variants.
 if(spriteCache.size>100)for(const key of spriteCache.keys()){if(key.startsWith('runner:'))spriteCache.delete(key);if(spriteCache.size<=60)break;}
 // Discard the disconnected marks in the top margin of jump frames.
 if(moving&&ground){
  // Articulated legs use the approved standing sprite. Each swings around
  // its own hip; the torso covers the joint, preserving a continuous body.
  const stride=Math.sin(time*Math.PI*4),lift=Math.abs(Math.cos(time*Math.PI*4));
  c.save();c.translate(-19,-47);c.scale(38/112,48/144);
  for(const leg of [{sx:0,sw:61,hip:54,phase:1},{sx:61,sw:51,hip:73,phase:-1}]){
   c.save();c.translate(leg.hip,87);c.rotate(stride*.48*leg.phase);
   c.scale(1,1-.10*lift);
   c.drawImage(sprite,leg.sx,87,leg.sw,29,leg.sx-leg.hip,0,leg.sw,29);
   // Bend the trailing knee during recovery instead of sliding rigid legs.
   c.translate(0,27);c.rotate(Math.max(0,-stride*leg.phase)*.65);
   c.drawImage(sprite,leg.sx,114,leg.sw,30,leg.sx-leg.hip,0,leg.sw,30);c.restore();
  }
  c.drawImage(sprite,0,0,112,91,0,0,112,91);c.restore();
 }else c.drawImage(sprite,0,0,112,144-inset,-19,-47+inset/3,38,(144-inset)/3);

 c.restore();
 if(name){c.save();c.globalAlpha=ghost?.8:1;c.fillStyle=ghost?'#d9efff':'#fff';c.textAlign='center';c.font='bold 5px monospace';c.fillText(String(name).slice(0,12),Math.round(x),Math.round(y)-44);c.restore()}
 return true;
}
root.EixoJumpExactArt={version:'approved-desert-controls-animation-20260925',ready,background,platform,runner,images};
})(window);
