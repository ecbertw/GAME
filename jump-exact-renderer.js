/* JUMP · Sky gardens. Art, cloth and lighting are presentation-only. */
(function(root){
'use strict';
const Motion=root.EixoJumpMotion,images={backgrounds:{},platforms:{},grounds:{},props:{},parts:{},heroRun:null,heroAir:null},loads=[];
const PARTS=['head','torso','upperArm','forearm','hand','thigh','shin','boot','cape'];
const BIOMES=['astral'];
const themes={forest:{top:'#c0ddb0',rim:'#83aa73',stone:'#9eaa9a',shade:'#526960',glow:'#e4d590'},city:{top:'#efd498',rim:'#cea55c',stone:'#bda781',shade:'#72584a',glow:'#ffd994'},snow:{top:'#f4fcff',rim:'#afdddf',stone:'#9ebbc6',shade:'#536f8c',glow:'#aff6f4'},astral:{top:'#dcd9f1',rim:'#a4a8d1',stone:'#9295b5',shade:'#535375',glow:'#e3baff'}};
const ART_VERSION='20260929-v343';
function versioned(src){return src+(src.includes('?')?'&':'?')+'v='+ART_VERSION}
function load(src,done){
 const img=new Image();img.decoding='async';let retried=false;
 loads.push(new Promise(resolve=>{
  img.onload=()=>{done(img);resolve()};
  img.onerror=()=>{if(!retried){retried=true;img.src=versioned(src)+(src.includes('?')?'&':'&')+'retry=1';return}resolve()};
  img.src=versioned(src);
 }));
}
for(const biome of BIOMES){load('/assets/game-v300/jump-'+biome+'.webp',img=>images.backgrounds[biome]=img);load('/assets/game-v300/platform-'+biome+'.png',img=>images.platforms[biome]=img);load('/assets/game-v300/ground-'+biome+'.png',img=>images.grounds[biome]=img);}
load('/assets/game-v300/hero-v15-run.png',img=>images.heroRun=img);
load('/assets/game-v300/hero-v10-air.png',img=>images.heroAir=img);
const ready=Promise.all(loads),has=img=>!!(img&&img.naturalWidth>0),clamp=(n,a=0,b=255)=>Math.max(a,Math.min(b,n));
function color(value,time,offset=0){return value==='rainbow'?'hsl('+((time*90+offset)%360)+' 84% 66%)':/^#[a-f0-9]{6}$/i.test(value||'')?value:'#a6d5d5';}
function background(c,name,W,H,cam=0,time=0){
 const img=images.backgrounds[name];if(!has(img))return false;
 c.save();c.imageSmoothingEnabled=true;
 const cover=Math.max(W/img.naturalWidth,H/img.naturalHeight)*1.035,dw=img.naturalWidth*cover,dh=img.naturalHeight*cover;
 const drift=Math.sin(cam/2200)*Math.min(10,(dh-H)/2);
 c.drawImage(img,(W-dw)/2,(H-dh)/2+drift,dw,dh);
 c.save();c.translate((W-dw)/2,(H-dh)/2+drift);drawWorldProps(c,name,dw,dh,time,img);c.restore();
 const shade=c.createLinearGradient(0,0,0,H);shade.addColorStop(0,'#121f3212');shade.addColorStop(.5,'#121f3200');shade.addColorStop(1,'#121f322b');c.fillStyle=shade;c.fillRect(0,0,W,H);
 c.restore();return true;
}
function prop(c,name,x,y,w,h,alpha=1){const img=images.props[name];if(!has(img))return;c.save();c.globalAlpha=alpha;c.drawImage(img,x,y,w,h);c.restore()}
function cloth(c,name,x,y,w,h,time){const img=images.props[name];if(!has(img))return;const slices=10;c.save();for(let i=0;i<slices;i++){const sy=i*img.naturalHeight/slices,dy=y+i*h/slices,wave=Math.sin(time*2.1-i*.5)*i*.17;c.drawImage(img,0,sy,img.naturalWidth,img.naturalHeight/slices,x+wave,dy,w,h/slices+.4)}c.restore()}
function drawWorldProps(c,name,W,H,time,img){
 root.EixoJumpScenery?.draw(c,img,name,W,H,time);
}
function polygon(c,points,fill){c.fillStyle=fill;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()}
function platform(c,name,x,y,w,index,state={}){
 const t=themes[name]||themes.forest,h=index===0?38:24,img=index===0?images.grounds[name]:images.platforms[name];
 c.save();c.imageSmoothingEnabled=true;
 if(has(img)){
  // End caps retain their shape. Repeat native stone sections rather than
  // compressing a whole wall into one platform. PNG padding never affects feet.
  const spec=root.EixoJumpArtLayout.surfaces[name][index===0?'ground':'platform'];
  const [sx,sy,sw,sh]=spec.rect,scale=h/sh,top=y-(spec.surface-sy)*scale;
  const cut=60,cap=Math.min(w/4,cut*scale),centerW=Math.max(0,w-cap*2),tile=256*scale;
  c.drawImage(img,sx,sy,cut,sh,x,top,cap,h);
  for(let dx=0;dx<centerW;dx+=tile){const width=Math.min(tile,centerW-dx),sourceX=sx+cut+(Math.abs(index)%4)*270;c.drawImage(img,sourceX,sy,width/scale,sh,x+cap+dx,top,width,h)}
  c.drawImage(img,sx+sw-cut,sy,cut,sh,x+w-cap,top,cap,h);
 }else{
  // A readable collision lip on a tapered floating masonry island.
  polygon(c,[[x,y],[x+w,y],[x+w-7,y+h*.66],[x+w*.7,y+h],[x+w*.38,y+h+4],[x+6,y+h*.62]],t.shade);
  polygon(c,[[x+1,y+3],[x+w-2,y+3],[x+w-9,y+h*.6],[x+w*.55,y+h-1],[x+8,y+h*.55]],t.stone);
  c.fillStyle=t.rim;c.fillRect(x,y-2,w,5);c.fillStyle=t.top;c.fillRect(x+2,y-3,w-4,3);
  c.globalAlpha=.30;c.strokeStyle=t.shade;c.lineWidth=1;
  for(let dx=15;dx<w-8;dx+=20){c.beginPath();c.moveTo(x+dx,y+4);c.lineTo(x+dx+2,y+h*.7);c.stroke()}c.restore();c.save();
  if(name==='forest')for(let dx=9;dx<w-6;dx+=17){c.fillStyle=dx%3?'#82a976':'#d4e2af';c.fillRect(x+dx,y-5,5,3)}
  if(name==='snow')for(let dx=15;dx<w-6;dx+=27)polygon(c,[[x+dx,y+6],[x+dx+5,y+6],[x+dx+2,y+h+7]],'#bce7ef');
 }
 // A small moving-platform lantern explains motion without changing material.
 if(state.moving){c.fillStyle=t.glow;c.shadowColor=t.glow;c.shadowBlur=6;c.fillRect(x+w/2-2,y+8,4,3);c.shadowBlur=0}
 if(state.fragile){const progress=clamp(Number(state.progress)||0,0,1);c.strokeStyle=progress>.55?'#ffb56f':'#7d6356';c.lineWidth=1.1;for(let k=0;k<3+Math.floor(progress*4);k++){const xx=x+8+(index*19+k*23)%Math.max(10,w-16);c.beginPath();c.moveTo(xx,y-2);c.lineTo(xx-2,y+4);c.lineTo(xx+3,y+9);c.stroke()}}
 c.restore();return true;
}
// Emit in world coordinates; rendering alone applies the camera offset.
const particles=new Map();
const fxColors={
 orbit:['#7be7ff','#b7a0ff'],ion:['#73f5db','#d4fff6'],stardust:['#f9e6a2','#ffffff'],
 resonance:['#9eb6ff','#e4dcff'],comet:['#75dcff','#ffd78b'],aurora:['#64efc0','#c494ff'],
 quantum:['#55d7ff','#ff83dc'],eclipse:['#7b73b9','#d8d2ff'],supernova:['#ff9c70','#ffe9a6'],
 void:['#7561b8','#c4a9ff'],singularity:['#b4a2ff','#65e8dc'],prism:['#ff7da9','#73eaff','#ffe574','#93ffc1']
};

function motionState(x,y,time,motion,ghost,name,fx){
 const key=String(motion.identity||(ghost?'peer:'+name:'local'));
 let state=particles.get(key);if(!state){state=Motion.createEmitter();particles.set(key,state);}
 const result=Motion.updateEmitter(state,{time,x,y:Number.isFinite(motion.worldY)?motion.worldY:y,
  ground:motion.ground!==false,moving:!!motion.moving,vy:Number(motion.vy)||0,dir:motion.facing===-1?-1:1,fx,
  run:motion.runId||null,preview:!!motion.preview});
 // Expire inactive remote/preview emitters without tying them to another clock.
 state.touched=performance.now();for(const [k,p] of particles)if(state.touched-p.touched>10000)particles.delete(k);
 return {state,...result};
}
function particlesFor(c,state,offset,ghost){
 const colors=fxColors[state.fx]||fxColors.orbit,alpha=ghost?.33:1,x0=state.x,y0=state.y+offset;
 c.save();c.globalCompositeOperation='screen';
 // Signature effects have a quiet core language: arcs, orbital points and short wakes.
 if(['orbit','eclipse','singularity','prism','resonance'].includes(state.fx)){
  const t=(state.last||0)*2.1,r=state.fx==='singularity'?9.5:state.fx==='eclipse'?8:6.8;
  c.globalAlpha=.32*alpha;c.strokeStyle=colors[0];c.lineWidth=.55;c.shadowColor=colors[1]||colors[0];c.shadowBlur=2.5;
  c.beginPath();c.ellipse(x0,y0-18,r,r*.34,t*.14,0,Math.PI*1.45);c.stroke();
  for(let i=0;i<(state.fx==='singularity'?3:2);i++){const q=t+i*Math.PI*2/3;c.fillStyle=colors[i%colors.length];c.beginPath();c.arc(x0+Math.cos(q)*r,y0-18+Math.sin(q)*r*.34,.75,0,Math.PI*2);c.fill();}
 }
 if(['comet','quantum','ion','prism','supernova'].includes(state.fx)){
  const trail=state.items.filter((p,i)=>(p.event==='trail'||p.event==='air')&&p.life/p.max>.2&&i%2===0).slice(-10);
  if(trail.length>2){const first=trail[0],last=trail[trail.length-1],g=c.createLinearGradient(first.x,first.y+offset,last.x+.01,last.y+offset);g.addColorStop(0,'transparent');g.addColorStop(.5,colors[0]);g.addColorStop(1,colors[1]||colors[0]);c.globalAlpha=.5*alpha;c.strokeStyle=g;c.lineWidth=1;c.lineCap='round';c.beginPath();c.moveTo(first.x,first.y+offset);for(let i=1;i<trail.length;i++){const u=trail[i-1],v=trail[i];c.quadraticCurveTo(u.x,u.y+offset,(u.x+v.x)/2,(u.y+v.y)/2+offset);}c.lineTo(last.x,last.y+offset);c.stroke();}
 }
 for(const p of state.items){
  const age=1-p.life/p.max,fade=Math.sin(Math.PI*Math.min(1,age))*(1-age*.3),cols=fxColors[p.fx]||colors,col=cols[p.serial%cols.length],x=p.x,y=p.y+offset,z=p.size*(1-age*.35);
  c.save();c.translate(x,y);c.rotate(p.angle);c.globalAlpha=.78*alpha*fade;c.fillStyle=col;c.strokeStyle=col;c.shadowColor=col;c.shadowBlur=2;c.lineWidth=.6;
  if(p.event==='land'&&p.serial%3===0){c.globalAlpha*=.55;c.beginPath();c.ellipse(0,0,2+age*9,.55+age*1.6,0,0,Math.PI*2);c.stroke();}
  else if(p.fx==='aurora'){c.globalAlpha*=.5;c.beginPath();c.ellipse(0,0,z*(1+age*2),z*.42,p.angle,0,Math.PI*2);c.fill();}
  else if(p.fx==='void'||p.fx==='eclipse'){c.globalAlpha*=.5;c.beginPath();c.arc(0,0,z*(.8+age),0,Math.PI*2);c.stroke();c.beginPath();c.arc(z*.9,0,.35,0,Math.PI*2);c.fill();}
  else if(p.fx==='stardust'||p.fx==='prism'){c.beginPath();for(let k=0;k<4;k++){const q=k*Math.PI/2;c.moveTo(Math.cos(q)*z*.25,Math.sin(q)*z*.25);c.lineTo(Math.cos(q)*z*1.55,Math.sin(q)*z*1.55);}c.stroke();}
  else if(p.fx==='supernova'){c.beginPath();c.arc(0,0,z*.7,0,Math.PI*2);c.fill();c.globalAlpha*=.45;c.beginPath();c.arc(0,0,z*(1.4+age*1.6),0,Math.PI*2);c.stroke();}
  else if(p.fx==='singularity'){c.globalAlpha*=.55;c.beginPath();c.arc(0,0,z*(1+age),0,Math.PI*2);c.stroke();c.beginPath();c.arc(0,0,z*.35,0,Math.PI*2);c.fill();}
  else if(p.fx==='resonance'||p.fx==='orbit'){c.beginPath();c.ellipse(0,0,z*(1+age),z*.4,0,0,Math.PI*1.65);c.stroke();}
  else {const tail=Math.min(6,2+Math.abs(p.vx)*.1)*(1-age);c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-Math.sign(p.vx||1)*tail*.6,-z,-Math.sign(p.vx||1)*tail,-z*.2);c.stroke();c.fillStyle=cols[1]||'#fff';c.fillRect(-.35,-.35,.7,.7);}
  c.restore();
 }
 c.restore();
}

const partCache=new Map(),bounds={};let partCacheBytes=0;
const defaults={hair:'#19222d',top:'#e7d8b5',pants:'#263c5c',shoes:'#76503c',accent:'#b76632'};
function material(part,r,g,b,y){
 if(part==='head')return b>r*.95&&r<125?'hair':null;
 if(part==='torso')return y>.75&&b>r*.95?'pants':r>110&&g>90&&b>55?'top':null;
 if(part==='upperArm')return r>105&&g>85?'top':null;
 if(part==='thigh'||part==='shin')return 'pants';
 if(part==='boot')return r>g*1.08&&r>b*1.1?'shoes':null;
 if(part==='cape')return 'accent';
 return null;
}
function partImage(part,tones){
 const img=images.parts[part];if(!has(img))return null;
 const channels={head:['hair'],torso:['top','pants'],upperArm:['top'],forearm:[],hand:[],thigh:['pants'],shin:['pants'],boot:['shoes'],cape:['accent']}[part];
 const original=channels.every(k=>tones[k]===defaults[k]),key=part+':'+(original?'original':channels.map(k=>tones[k]).join(':'));
 if(partCache.has(key)){const value=partCache.get(key);partCache.delete(key);partCache.set(key,value);return value;}
 const cv=document.createElement('canvas');cv.width=img.naturalWidth;cv.height=img.naturalHeight;
 const q=cv.getContext('2d',{willReadFrequently:true});q.drawImage(img,0,0,cv.width,cv.height);
 const pixels=q.getImageData(0,0,cv.width,cv.height),d=pixels.data;
 let left=cv.width,right=0,top=cv.height,bottom=0;
 const colors={};for(const k of Object.keys(defaults)){q.fillStyle=tones[k];q.fillRect(0,0,1,1);colors[k]=q.getImageData(0,0,1,1).data;}
 for(let i=0;i<d.length;i+=4){
  if(d[i+3]<200){d[i+3]=0;continue;}
  const px=(i/4)%cv.width,py=Math.floor(i/4/cv.width);left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,py);bottom=Math.max(bottom,py);
  if(original)continue;
  const r=d[i],g=d[i+1],b=d[i+2],m=material(part,r,g,b,py/cv.height);
  if(!m||tones[m]===defaults[m])continue;
  const base=m==='top'?205:m==='hair'?57:m==='pants'?62:m==='accent'?120:90;
  const light=clamp((r*.22+g*.55+b*.23)/base,.18,1.6),target=colors[m];
  d[i]=clamp(target[0]*light);d[i+1]=clamp(target[1]*light);d[i+2]=clamp(target[2]*light);
 }
 q.putImageData(pixels,0,0);bounds[part]=[left,top,right-left+1,bottom-top+1];
 const result={image:cv,rect:bounds[part],bytes:cv.width*cv.height*4};partCache.set(key,result);partCacheBytes+=result.bytes;
 while(partCacheBytes>128*1024*1024&&partCache.size>1){const oldest=partCache.keys().next().value;partCacheBytes-=partCache.get(oldest).bytes;partCache.delete(oldest);}return result;
}
function drawPart(c,part,tones,x,y,w,h,angle=0,pivotX=.5,pivotY=0){
 const p=partImage(part,tones);if(!p)return;
 c.save();c.translate(x,y);c.rotate(angle);c.drawImage(p.image,...p.rect,-w*pivotX,-h*pivotY,w,h);c.restore();
}
function segment(c,part,tones,a,b,width){
 const length=Math.hypot(b.x-a.x,b.y-a.y),angle=Math.atan2(b.x-a.x,b.y-a.y);
 // Canvas positive rotation takes the down-axis left; negate the bone angle.
 drawPart(c,part,tones,a.x,a.y,width,length+2,-angle,.5,.06);
}
function drawCape(c,pose,state,dt,time,speed,vy,ground,tones){
 const wanted=-.08-speed*.92+(ground?0:clamp(vy/1100,-.25,.25));
 if(!state.cloth)state.cloth={angle:-.08,velocity:0};
 const cloth=state.cloth;
 cloth.velocity+=(wanted-cloth.angle)*40*dt;cloth.velocity*=Math.exp(-10*dt);cloth.angle+=cloth.velocity*dt;
 const p=partImage('cape',tones);if(!p)return;
 let previous={x:pose.shoulder.x-3,y:pose.shoulder.y-2};
 const n=18,len=27/n;
 for(let i=0;i<n;i++){
  const f=(i+.5)/n,angle=cloth.angle+Math.sin(time*6-f*3)*.07*speed*f;
  const next={x:previous.x+Math.sin(angle)*len,y:previous.y+Math.cos(angle)*len},width=3+f*10;
  c.save();c.translate(previous.x,previous.y);c.rotate(-angle);
  c.drawImage(p.image,p.rect[0],p.rect[1]+p.rect[3]*i/n,p.rect[2],p.rect[3]/n,-width/2,0,width,len+.4);c.restore();previous=next;
 }
}
const heroSheetCache=new Map();
function rgb(value){const cv=document.createElement('canvas');cv.width=cv.height=1;const q=cv.getContext('2d');q.fillStyle=value;q.fillRect(0,0,1,1);return q.getImageData(0,0,1,1).data;}
function recolorSheet(img,tones){
 const key=(img===images.heroRun?'run:':'air:')+tones.join(':');if(heroSheetCache.has(key))return heroSheetCache.get(key);
 const cv=document.createElement('canvas');cv.width=img.naturalWidth;cv.height=img.naturalHeight;const q=cv.getContext('2d',{willReadFrequently:true});q.drawImage(img,0,0);
 const data=q.getImageData(0,0,cv.width,cv.height),px=data.data,target=tones.map(rgb),h=cv.height;
 for(let i=0;i<px.length;i+=4){if(px[i+3]<24)continue;const r=px[i],g=px[i+1],b=px[i+2],y=((i/4/cv.width)|0),skin=r>145&&g>72&&r>g*1.13&&g>b*1.08;let group=-1,base=120;
  if(!skin&&r>105&&r>g*1.30&&r>b*1.35){group=4;base=135;}
  else if(!skin&&y>h*.57&&r>48&&r>g*1.12&&g>b*.82){group=3;base=82;}
  else if(!skin&&y<h*.48&&r<105&&b>r*.82&&b>g*.78){group=0;base=58;}
  else if(!skin&&r<115&&b>r*.92&&b>g*.82){group=2;base=61;}
  else if(!skin&&r>135&&g>105&&b>68){group=1;base=190;}
  if(group<0)continue;const light=clamp((r*.23+g*.55+b*.22)/base,.22,1.55),t=target[group];px[i]=clamp(t[0]*light);px[i+1]=clamp(t[1]*light);px[i+2]=clamp(t[2]*light);
 }
 q.putImageData(data,0,0);heroSheetCache.set(key,cv);if(heroSheetCache.size>12)heroSheetCache.delete(heroSheetCache.keys().next().value);return cv;
}
function heroFrame(c,state,ground,moving,vy,tones){
 let img,count,index;if(ground&&state.landTime<.20){img=images.heroAir;count=6;index=5;}else if(!ground){img=images.heroAir;count=6;index=vy>150?2:vy>-90?3:4;}else if(moving||state.speedBlend>.08){img=images.heroRun;count=8;index=Math.floor((((state.phase%1)+1)%1)*count)%count;}else{img=images.heroAir;count=6;index=0;}
 const sheet=recolorSheet(img,tones),sw=sheet.width/count,sh=sheet.height,dh=84,dw=dh*sw/sh;c.drawImage(sheet,index*sw,0,sw,sh,-dw/2,-dh*.895,dw,dh);
}
function effects(c,x,y,style,name,ghost=false,time=0,motion={}){
 const O={...defaults,accessory:'none',effect:'none',...(style||{})},movement=motionState(x,y,time,motion,ghost,name,O.effect),state=movement.state;
 particlesFor(c,state,Number(motion.cameraY)||0,ghost);
 if(motion.ground!==false){c.save();c.globalAlpha=ghost?.11:.2;c.fillStyle='#07101d';c.beginPath();c.ellipse(x,y+.5,15,2,0,0,Math.PI*2);c.fill();c.restore()}
 if(name){c.save();c.globalAlpha=ghost?.8:1;c.fillStyle='#f5fbff';c.strokeStyle='#19333fbb';c.lineWidth=3;c.textAlign='center';c.font='600 10px system-ui';c.strokeText(String(name).slice(0,16),x,y-78);c.fillText(String(name).slice(0,16),x,y-78);c.restore()}
 return true;
}
function runner(c,x,y,style,name,ghost=false,time=0,motion={}){
 if(!has(images.heroRun)||!has(images.heroAir))return true;
 const O={...defaults,accessory:'cape',effect:'none',...(style||{})},tones={};
 // Rainbow uses a bounded palette, avoiding full-sheet work on every frame.
 for(const key of Object.keys(defaults))tones[key]=color(O[key],Math.floor(time*8)/8);
 const ground=motion.ground!==false,moving=!!motion.moving,vy=Number(motion.vy)||0,dir=motion.facing===-1?-1:1;
 const movement=motionState(x,y,time,motion,ghost,name,O.effect),state=movement.state;
 particlesFor(c,state,Number(motion.cameraY)||0,ghost);
 c.save();c.translate(x,y);c.scale(dir,1);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';if(ghost)c.globalAlpha=.72;
 if(ground){c.save();c.globalAlpha*=.2;c.fillStyle='#07101d';c.beginPath();c.ellipse(0,.5,15,2,0,0,Math.PI*2);c.fill();c.restore();}
 heroFrame(c,state,ground,moving,vy,[tones.hair,tones.top,tones.pants,tones.shoes,tones.accent]);c.restore();
 if(name){c.save();c.globalAlpha=ghost?.8:1;c.fillStyle='#f5fbff';c.strokeStyle='#19333fbb';c.lineWidth=3;c.textAlign='center';c.font='600 10px system-ui';c.strokeText(String(name).slice(0,16),x,y-78);c.fillText(String(name).slice(0,16),x,y-78);c.restore();}
 return true;
}
root.EixoJumpExactArt={version:'eixo-runner-v17-3d-effects',ready,background,platform,runner,effects,images,themes,heroHeight:82,isReady:()=>has(images.heroRun)&&has(images.heroAir)&&has(images.backgrounds.astral)&&has(images.platforms.astral)&&has(images.grounds.astral)};
})(window);
