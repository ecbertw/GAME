/* JUMP · Sky gardens. Art, cloth and lighting are presentation-only. */
(function(root){
'use strict';
const Motion=root.EixoJumpMotion,images={backgrounds:{},platforms:{},grounds:{},props:{},hero:null},loads=[];
let heroParts={};
const BIOMES=['astral'];
const themes={forest:{top:'#c0ddb0',rim:'#83aa73',stone:'#9eaa9a',shade:'#526960',glow:'#e4d590'},city:{top:'#efd498',rim:'#cea55c',stone:'#bda781',shade:'#72584a',glow:'#ffd994'},snow:{top:'#f4fcff',rim:'#afdddf',stone:'#9ebbc6',shade:'#536f8c',glow:'#aff6f4'},astral:{top:'#dcd9f1',rim:'#a4a8d1',stone:'#9295b5',shade:'#535375',glow:'#e3baff'}};
function load(src,done){const img=new Image();img.decoding='async';loads.push(new Promise(resolve=>{img.onload=()=>{done(img);resolve()};img.onerror=resolve;img.src=src}));}
for(const biome of BIOMES){load('/assets/game-v300/jump-'+biome+'.webp',img=>images.backgrounds[biome]=img);load('/assets/game-v300/platform-'+biome+'.png',img=>images.platforms[biome]=img);load('/assets/game-v300/ground-'+biome+'.png',img=>images.grounds[biome]=img);}
load('/assets/game-v300/hero-parts.png',img=>images.hero=img);
loads.push(fetch('/assets/game-v300/hero-parts.json?v=20260927-v302').then(r=>r.ok?r.json():{}).then(d=>{heroParts=d.parts||{}}).catch(()=>{}));
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
  ground:motion.ground!==false,moving:!!motion.moving,vy:Number(motion.vy)||0,dir:motion.facing===-1?-1:1,fx,
  run:motion.runId||null,preview:!!motion.preview});
 // Expire inactive remote/preview emitters without tying them to another clock.
 state.touched=performance.now();for(const [k,p] of particles)if(state.touched-p.touched>10000)particles.delete(k);
 return {state,...result};
}
function particlesFor(c,state,offset,ghost){
 c.save();c.globalCompositeOperation='screen';
 // A short tapered wake connects recent emissions, never a full-body aura.
 if(['glow','comet','plasma','prismatic','electric'].includes(state.fx)){
  const trail=state.items.filter((p,i)=>(p.event==='trail'||p.event==='air')&&p.life/p.max>.22&&i%2===0).slice(-12);
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

const pieceCache=new Map();
function pieceImage(part,tint){
 const spec=heroParts[part];if(!spec||!has(images.hero))return null;
 const original={head:'#19222d',torso:'#e7d8b5',upperArm:'#e7d8b5',forearm:'#e7d8b5',thigh:'#263c5c',shin:'#263c5c',cape:'#b76632',boot:'#76503c'};if(tint===original[part])tint=null;
 const key=part+':'+(tint||'');if(pieceCache.has(key))return pieceCache.get(key);
 const rect=spec.rect,cv=document.createElement('canvas');cv.width=rect[2];cv.height=rect[3];const c=cv.getContext('2d');c.drawImage(images.hero,...rect,0,0,cv.width,cv.height);
 if(tint){
  const probe=document.createElement('canvas');probe.width=probe.height=1;const pc=probe.getContext('2d');pc.fillStyle=tint;pc.fillRect(0,0,1,1);const target=pc.getImageData(0,0,1,1).data,data=c.getImageData(0,0,cv.width,cv.height),px=data.data;
  for(let i=0;i<px.length;i+=4){const r=px[i],g=px[i+1],b=px[i+2];if(px[i+3]<20)continue;
   const skin=r>145&&g>85&&r>g*1.12&&g>b*1.18;
   const navy=b>r*.97&&b>g*.9&&r<145;
   if(part==='head'&&!navy)continue;
   if(part==='forearm'&&skin)continue;
   if((part==='torso'||part==='upperArm')&&(Math.max(r,g,b)<45||(r>g*1.5&&g>b*1.35)))continue;
   const base=part==='head'||part==='thigh'||part==='shin'?64:part==='cape'?140:part==='boot'?96:210;
   const light=clamp((r*.22+g*.53+b*.25)/base,.13,1.45);px[i]=clamp(target[0]*light);px[i+1]=clamp(target[1]*light);px[i+2]=clamp(target[2]*light);
  }c.putImageData(data,0,0);
 }
 pieceCache.set(key,cv);if(pieceCache.size>100)pieceCache.delete(pieceCache.keys().next().value);return cv;
}
function piece(c,part,x,y,w,h,angle,tint){const img=pieceImage(part,tint);if(!img)return false;c.save();c.translate(x,y);c.rotate(angle||0);c.drawImage(img,-w/2,0,w,h);c.restore();return true;}
function limb(c,a,b,width,tint,part){
 const angle=Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2,length=Math.hypot(b.x-a.x,b.y-a.y);
 if(piece(c,part,a.x,a.y,width+2,length+1,angle,tint))return;
 c.lineCap='round';c.strokeStyle='#24313d';c.lineWidth=width+1.8;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();c.strokeStyle=tint;c.lineWidth=width;c.stroke();c.strokeStyle='#ffffff38';c.lineWidth=.7;c.beginPath();c.moveTo(a.x-.8,a.y+1);c.lineTo(b.x-.8,b.y-1);c.stroke();
}
function armSegment(c,part,a,b,tint){
 const sprite=pieceImage(part,tint),spec=heroParts[part];if(!sprite||!spec.pivot||!spec.tip)return;
 const [px,py]=spec.pivot,[tx,ty]=spec.tip,sourceLength=Math.hypot(tx-px,ty-py);
 const scale=Math.hypot(b.x-a.x,b.y-a.y)/sourceLength;
 const angle=Math.atan2(b.y-a.y,b.x-a.x)-Math.atan2(ty-py,tx-px);
 c.save();c.translate(a.x,a.y);c.rotate(angle);c.scale(scale,scale);
 // The sleeve pivots at its anatomical joint. Fingers extend past the wrist;
 // they are never compressed into the elbow-to-wrist bone.
 c.drawImage(sprite,-px,-py);c.restore();
}
function arm(c,pose,tint){
 c.save();if(pose.back)c.globalAlpha*=.78;
 armSegment(c,'upperArm',pose.shoulder,pose.elbow,tint);
 armSegment(c,'forearm',pose.elbow,pose.wrist,tint);c.restore();
}
function cape(c,time,moving,ground,vy,tint,state){
 const sprite=pieceImage('cape',tint);if(!sprite)return;
 let cloth=state.cloth,dt=cloth?clamp(time-cloth.time,0,.05):0;
 if(!cloth||!Number.isFinite(dt)||time<cloth.time||time-cloth.time>.12)cloth=state.cloth={time,open:0,openV:0,lag:0,lagV:0,bend:0,bendV:0};
 cloth.time=time;const air=!ground,speed=state.speedBlend||0;
 const targets={open:moving?.72+.28*speed:air?.58+Math.min(.25,Math.abs(vy)/1200):0,lag:air?clamp(vy/330,-1,1):0,bend:moving?Math.sin(state.phase*Math.PI*4)*.7:0};
 // Reduced position-based cloth: the shoulder is a hard attachment, while
 // spread, vertical lag and curvature use critically damped spring constraints.
 for(const [key,stiff,damp] of [['open',48,11],['lag',35,9],['bend',28,8]]){
  const v=key+'V';cloth[v]+=(targets[key]-cloth[key])*stiff*dt;cloth[v]*=Math.exp(-damp*dt);cloth[key]+=cloth[v]*dt;
 }
 cloth.open=clamp(cloth.open,0,1);cloth.lag=clamp(cloth.lag,-1,1);
 const slices=14,w=13+cloth.open*12,h=24-cloth.open*6;
 for(let i=0;i<slices;i++){
  const f=i/slices,sy=Math.floor(f*sprite.height),sh=Math.ceil(sprite.height/slices);
  const curve=cloth.bend*f*f-cloth.open*f*1.4,y=-30+f*h+cloth.lag*f*4.2;
  c.drawImage(sprite,0,sy,sprite.width,sh,-w+3+curve,y,w,h/slices+.35);
 }
}
function runner(c,x,y,style,name,ghost=false,time=0,motion={}){
 const O={hair:'#19222d',top:'#e7d8b5',pants:'#263c5c',shoes:'#76503c',accent:'#b76632',effect:'none',accessory:'cape',...(style||{})};
 // Never silently replace the approved artwork with a different character.
 if(!has(images.hero)||!heroParts.head){return true;}
 const dir=motion.facing===-1?-1:1,ground=motion.ground!==false,moving=!!motion.moving,vy=Number(motion.vy)||0;
 const movement=motionState(x,y,time,motion,ghost,name,String(O.effect||'none'));
 particlesFor(c,movement.state,Number(motion.cameraY)||0,ghost);
 const top=color(O.top,time),pants=color(O.pants,time,100),hair=color(O.hair,time,200),accent=color(O.accent,time,300),shoe=color(O.shoes,time,50);
 const pose=movement.pose;
 c.save();c.translate(x,y);c.scale(dir,1);if(ghost)c.globalAlpha=.72;c.imageSmoothingEnabled=true;
 if(ground){c.save();c.globalAlpha*=.18;c.fillStyle='#17283a';c.beginPath();c.ellipse(0,.4,9,1.2,0,0,Math.PI*2);c.fill();c.restore()}
 if(O.accessory!=='none'){c.save();c.translate(pose.lean*12,pose.torsoY);cape(c,time,moving,ground,vy,accent,movement.state);c.restore();}
 for(const leg of pose.legs){
  const {foot,back}=leg,hip={x:leg.hip.x,y:leg.hip.y+(ground&&!moving?-2:0)},ankle={x:foot.x,y:foot.y-3.5},knee=Motion.knee(hip,ankle,8,7);
  c.save();if(back)c.globalAlpha*=.82;
  limb(c,hip,knee,3.8,pants,'thigh');limb(c,knee,ankle,3.1,pants,'shin');
  piece(c,'boot',foot.x+1,foot.y-5.5,6.1,5.5,0,shoe);c.restore();
 }
 const sy=pose.shoulderY,lean=pose.lean*12;
 arm(c,pose.arms[0],top);
 piece(c,'torso',lean,sy-1,11.5,17,pose.torsoAngle,top);
 arm(c,pose.arms[1],top);
 piece(c,'head',1+lean,pose.headY,13,13,0,hair);c.restore();
 if(name){c.save();c.globalAlpha=ghost?.8:1;c.fillStyle='#f5fbff';c.strokeStyle='#19333fbb';c.lineWidth=3;c.textAlign='center';c.font='600 10px system-ui';c.strokeText(String(name).slice(0,16),x,y-49);c.fillText(String(name).slice(0,16),x,y-49);c.restore()}
 return true;
}
root.EixoJumpExactArt={version:'sky-gardens-v3',ready,background,platform,runner,images,themes,heroHeight:42,isReady:()=>has(images.hero)&&!!heroParts.head};
})(window);
