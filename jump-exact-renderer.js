/* JUMP — faithful approved image assets. Presentation only: physics, rankings and payments remain untouched. */
(function(root){
'use strict';
const packed=root.EixoJumpExactPacked||{};
const Motion=root.EixoJumpMotion;
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
 const earlyDesert=name==='desert'&&index>=1&&index<=10;
 const height=ground?(name==='desert'?32:27):Motion.platformSize(w,rect[2],rect[3],earlyDesert).height;
 const surface=ground?({city:19,forest:29,snow:26,desert:27}[name]):({city:[34,34,34,34],forest:[53,50,49,46],snow:[51,51,51,51],desert:[17,8,8,8]}[name][Math.abs(index)%4]);
 const top=y-surface/rect[3]*height;
 c.save();c.imageSmoothingEnabled=!earlyDesert;
 c.shadowColor='rgba(3,7,16,.48)';c.shadowBlur=earlyDesert?0:3;c.shadowOffsetY=3;
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
// Emit in world coordinates; rendering alone applies the camera offset.
const particles=new Map();
const fxColors={
 glow:['#73eaff','#c4fbff'],pulse:['#ffdb70','#fff4b2'],shimmer:['#ffe08b','#ffffff'],
 spark:['#fff6aa','#ffd260'],halo:['#ffe9a1','#fff9dd'],frost:['#8beeff','#e5fcff'],
 electric:['#38aaff','#e0faff'],ember:['#ff681f','#ffd26b'],mist:['#cbd7ff','#ffffff'],
 plasma:['#49d7ff','#ff7dff'],comet:['#53c9ff','#ffd66c'],cosmic:['#8c5cff','#f3a6ff'],
 prismatic:['#ff5f9d','#72f7ff','#ffe86c','#a5ffb6']
};

function motionState(x,y,time,motion,ghost,name,fx){
 const key=String(motion.identity||(ghost?'peer:'+name:'local'));
 let state=particles.get(key);if(!state){state=Motion.createEmitter();particles.set(key,state);}
 const result=Motion.updateEmitter(state,{time,x,y:Number.isFinite(motion.worldY)?motion.worldY:y,
  ground:motion.ground!==false,moving:!!motion.moving,dir:motion.facing===-1?-1:1,fx,
  run:motion.runId||null,preview:!!motion.preview});
 // Expire inactive remote/preview emitters without tying them to another clock.
 state.touched=performance.now();for(const [k,p] of particles)if(state.touched-p.touched>10000)particles.delete(k);
 return {state,...result};
}
function particlesFor(c,state,offset,ghost){
 c.save();c.globalCompositeOperation='screen';
 // A short tapered wake connects recent emissions, never a full-body aura.
 if(['glow','comet','plasma','prismatic','electric'].includes(state.fx)){
  const trail=state.items.filter((p,i)=>p.event==='trail'&&p.life/p.max>.35&&i%2===0).slice(-9);
  if(trail.length>2){
   const first=trail[0],last=trail[trail.length-1],colors=fxColors[state.fx];
   const fade=Math.min(1,last.life/.15),g=c.createLinearGradient(first.x,first.y+offset,last.x+.01,last.y+offset);
   g.addColorStop(0,'transparent');g.addColorStop(.45,colors[0]);g.addColorStop(1,colors[1]);
   c.strokeStyle=g;c.lineWidth=1.25;c.lineCap='round';c.globalAlpha=(ghost?.25:.65)*fade;c.shadowColor=colors[0];c.shadowBlur=2;
   c.beginPath();c.moveTo(first.x,first.y+offset);
   for(let i=1;i<trail.length;i++){const a=trail[i-1],b=trail[i];c.quadraticCurveTo(a.x,a.y+offset-1,(a.x+b.x)/2,(a.y+b.y)/2+offset);}
   c.lineTo(last.x,last.y+offset);c.stroke();
  }
 }
 for(const p of state.items){
  const age=1-p.life/p.max,fade=Math.sin(Math.PI*Math.min(1,age))*(1-age*.4);
  const colors=fxColors[p.fx]||fxColors.glow,color=colors[p.serial%colors.length];
  const x=p.x,y=p.y+offset,size=p.size*(1-age*.45);
  c.save();c.translate(x,y);c.globalAlpha=(ghost?.42:.85)*fade;
  c.fillStyle=color;c.strokeStyle=color;c.lineWidth=.65;c.shadowColor=color;c.shadowBlur=p.fx==='mist'?0:1.7;
  if(p.event==='land'&&p.serial%4===0){
   c.beginPath();c.ellipse(0,0,2+age*8,.6+age*1.7,0,0,Math.PI*2);c.stroke();
  }else if(p.fx==='mist'){
   c.globalAlpha*=.42;c.beginPath();c.ellipse(0,0,size*(1+age*1.6),size*(.5+age*.6),p.angle,0,Math.PI*2);c.fill();
  }else if(p.fx==='ember'){
   c.beginPath();c.moveTo(0,-size*1.8);c.quadraticCurveTo(size*1.4,0,0,size*.7);c.quadraticCurveTo(-size,0,0,-size*1.8);c.fill();
   c.fillStyle='#fff0a0';c.fillRect(-.3,-.5,.6,.8);
  }else if(p.fx==='frost'||p.fx==='prismatic'){
   c.rotate(p.angle);c.beginPath();c.moveTo(0,-size*1.8);c.lineTo(size*.7,0);c.lineTo(0,size);c.lineTo(-size*.7,0);c.closePath();c.fill();
   c.strokeStyle='#f2ffff';c.lineWidth=.35;c.beginPath();c.moveTo(0,-size*1.5);c.lineTo(0,size*.6);c.stroke();
  }else if(p.fx==='comet'||p.fx==='glow'||p.fx==='electric'||p.fx==='plasma'){
   const tail=Math.min(7,2+Math.abs(p.vx)*.12)*(1-age);
   c.lineWidth=size*.65;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-Math.sign(p.vx||1)*tail*.6,-size,-Math.sign(p.vx||1)*tail,-size*.4);c.stroke();
   c.fillStyle=p.fx==='comet'?'#ffe7a2':'#edffff';c.fillRect(-.4,-.4,.8,.8);
  }else if(p.fx==='halo'||p.fx==='pulse'){
   c.rotate(p.angle);c.beginPath();c.ellipse(0,0,size*(1+age),size*.45,0,0,Math.PI*1.5);c.stroke();
  }else{
   c.rotate(p.angle*.25);c.beginPath();c.moveTo(-size,0);c.lineTo(size,0);c.moveTo(0,-size);c.lineTo(0,size);c.stroke();
   if(p.fx==='cosmic'&&p.serial%3===0){c.beginPath();c.arc(0,0,size*1.5,0,Math.PI*2);c.stroke();}
  }
  c.restore();
 }
 c.restore();
}
// A two-bone rig uses source-space masks instead of slicing both legs in half.
// Joint positions follow the contact/recovery gait; the original pixels remain.
const rigParts={
 backThigh:{a:[60,84],b:[43,113],poly:[[52,78],[68,84],[61,99],[52,116],[43,123],[30,119],[33,108],[44,96]]},
 backShin:{a:[43,113],b:[37,132],poly:[[33,108],[54,112],[49,122],[44,133],[28,133],[31,122]]},
 frontThigh:{a:[75,84],b:[80,115],poly:[[67,79],[83,81],[88,98],[92,116],[86,124],[70,122],[69,110]]},
 frontShin:{a:[80,115],b:[81,132],poly:[[70,112],[92,112],[89,125],[91,133],[73,133],[71,125]]}
};
function drawBone(c,sprite,part,a,b){
 const r=rigParts[part],angle=Math.atan2(b.y-a.y,b.x-a.x)-Math.atan2(r.b[1]-r.a[1],r.b[0]-r.a[0]);
 const scale=Math.hypot(b.x-a.x,b.y-a.y)/Math.hypot(r.b[0]-r.a[0],r.b[1]-r.a[1]);
 c.save();c.translate(a.x,a.y);c.rotate(angle);c.scale(Math.min(1.12,scale),scale);c.translate(-r.a[0],-r.a[1]);
 c.beginPath();r.poly.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.clip();c.drawImage(sprite,0,0);c.restore();
}
function drawRun(c,sprite,torso,pose){
 c.save();c.translate(-19,-47);c.scale(38/112,48/144);
 for(const [i,leg] of pose.legs.entries()){
  const prefix=i?'front':'back';c.save();if(!i)c.globalAlpha*=.86;
  drawBone(c,sprite,prefix+'Thigh',leg.hip,leg.knee);
  drawBone(c,sprite,prefix+'Shin',leg.knee,leg.foot);
  // Shoes retain their silhouette instead of being rotated as another shin.
  const shoe=i?[72,126,32,18,81]:[25,126,23,18,37];
  c.save();c.translate(leg.foot.x,leg.foot.y);c.rotate(leg.foot.contact?0:-.2);
  c.drawImage(sprite,shoe[0],shoe[1],shoe[2],shoe[3],shoe[0]-shoe[4],-6,shoe[2],shoe[3]);c.restore();c.restore();
 }
 c.save();c.translate(65,84+pose.bob);c.rotate(pose.lean*.18);c.translate(-65,-84);
 // Use the approved leaning run torso and bent arms, not the upright idle pose.
 c.drawImage(torso,0,0,112,96,5,-12,112,96);c.restore();c.restore();
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
 const movement=motionState(x,y,time,motion,ghost,name,String(O.effect||'none'));
 const running=moving&&ground&&movement.active;
 const col=frame%3,row=Math.floor(frame/3);
 // Emit in world coordinates first: the character is drawn on top of the trail.
 particlesFor(c,movement.state,Number(motion.cameraY)||0,ghost);
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(dir,1);
 if(ghost)c.globalAlpha=.62;
 if(ground){c.save();c.globalAlpha*=.3;c.fillStyle='#020712';c.beginPath();c.ellipse(0,1,12,2,0,0,Math.PI*2);c.fill();c.restore()}
 // Trail is rendered in world-space below, so particles persist after each step.
 c.imageSmoothingEnabled=true;
 const tinted=recolor(img,O,time);
 // Keep the original cell placement but omit the upper row's shoe fragments.
 const inset=row===1?16:0;
 const sprite=atlasSprite(tinted,[col*112,row*144+inset,112,144-inset],'runner:'+frame+':'+colorKeys.map(k=>O[k]||'').join(':')+':'+(colorKeys.some(k=>O[k]==='rainbow')?Math.floor(time*12):''));
 // Bound the cache when rainbow cosmetics generate new colour variants.
 if(spriteCache.size>100)for(const key of spriteCache.keys()){if(/^(runner|torso):/.test(key))spriteCache.delete(key);if(spriteCache.size<=60)break;}
 // Discard the disconnected marks in the top margin of jump frames.
 if(running){
  const runFrame=1+(Math.floor(movement.state.phase*2)%2);
  const torso=atlasSprite(tinted,[runFrame*112,0,112,144],'torso:'+runFrame+':'+colorKeys.map(k=>O[k]||'').join(':')+':'+(colorKeys.some(k=>O[k]==='rainbow')?Math.floor(time*12):''));
  drawRun(c,sprite,torso,movement.pose);
 }else c.drawImage(sprite,0,0,112,144-inset,-19,-47+inset/3,38,(144-inset)/3);

 c.restore();
 if(name){c.save();c.globalAlpha=ghost?.8:1;c.fillStyle=ghost?'#d9efff':'#fff';c.textAlign='center';c.font='bold 5px monospace';c.fillText(String(name).slice(0,12),Math.round(x),Math.round(y)-44);c.restore()}
 return true;
}
root.EixoJumpExactArt={version:'run-cycle-shoe-trails-20260925',ready,background,platform,runner,images};
})(window);
