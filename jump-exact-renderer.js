/* JUMP · Sky gardens. Art, cloth and lighting are presentation-only. */
(function(root){
'use strict';
const Motion=root.EixoJumpMotion,images={backgrounds:{},platforms:{},grounds:{},props:{},hero:null},loads=[];
let heroParts={};
const BIOMES=['forest','city','snow','astral'];
const themes={forest:{top:'#c0ddb0',rim:'#83aa73',stone:'#9eaa9a',shade:'#526960',glow:'#e4d590'},city:{top:'#efd498',rim:'#cea55c',stone:'#bda781',shade:'#72584a',glow:'#ffd994'},snow:{top:'#f4fcff',rim:'#afdddf',stone:'#9ebbc6',shade:'#536f8c',glow:'#aff6f4'},astral:{top:'#dcd9f1',rim:'#a4a8d1',stone:'#9295b5',shade:'#535375',glow:'#e3baff'}};
function load(src,done){const img=new Image();img.decoding='async';loads.push(new Promise(resolve=>{img.onload=()=>{done(img);resolve()};img.onerror=resolve;img.src=src}));}
for(const biome of BIOMES){load('/assets/game-v300/jump-'+biome+'.webp',img=>images.backgrounds[biome]=img);load('/assets/game-v300/platform-'+biome+'.png',img=>images.platforms[biome]=img);load('/assets/game-v300/ground-'+biome+'.png',img=>images.grounds[biome]=img);}
for(const name of ['banner-navy','banner-copper','banner-violet','lantern-gold','lantern-ice','crystal-lamp','vines','collectible-shard'])load('/assets/game-v300/prop-'+name+'.png',img=>images.props[name]=img);
load('/assets/game-v300/hero-parts.png',img=>images.hero=img);
loads.push(fetch('/assets/game-v300/hero-parts.json').then(r=>r.ok?r.json():{}).then(d=>{heroParts=d.parts||{}}).catch(()=>{}));
const ready=Promise.all(loads),has=img=>!!(img&&img.naturalWidth>0),clamp=(n,a=0,b=255)=>Math.max(a,Math.min(b,n));
function color(value,time,offset=0){return value==='rainbow'?'hsl('+((time*90+offset)%360)+' 84% 66%)':/^#[a-f0-9]{6}$/i.test(value||'')?value:'#a6d5d5';}
function background(c,name,W,H,cam=0,time=0){
 const img=images.backgrounds[name];if(!has(img))return false;
 c.save();c.imageSmoothingEnabled=true;
 const cover=Math.max(W/img.naturalWidth,H/img.naturalHeight)*1.035,dw=img.naturalWidth*cover,dh=img.naturalHeight*cover;
 const drift=Math.sin(cam/2200)*Math.min(10,(dh-H)/2);
 c.drawImage(img,(W-dw)/2,(H-dh)/2+drift,dw,dh);
 const shade=c.createLinearGradient(0,0,0,H);shade.addColorStop(0,'#121f3212');shade.addColorStop(.5,'#121f3200');shade.addColorStop(1,'#121f322b');c.fillStyle=shade;c.fillRect(0,0,W,H);
 drawWorldProps(c,name,W,H,time);c.restore();return true;
}
function prop(c,name,x,y,w,h,alpha=1){const img=images.props[name];if(!has(img))return;c.save();c.globalAlpha=alpha;c.drawImage(img,x,y,w,h);c.restore()}
function cloth(c,name,x,y,w,h,time){const img=images.props[name];if(!has(img))return;const slices=10;c.save();for(let i=0;i<slices;i++){const sy=i*img.naturalHeight/slices,dy=y+i*h/slices,wave=Math.sin(time*2.1-i*.5)*i*.17;c.drawImage(img,0,sy,img.naturalWidth,img.naturalHeight/slices,x+wave,dy,w,h/slices+.4)}c.restore()}
function drawWorldProps(c,name,W,H,time){
 const banner=name==='city'?'banner-copper':name==='astral'?'banner-violet':'banner-navy';
 cloth(c,banner,W*.045,H*.15,48,98,time);cloth(c,banner,W*.90,H*.22,43,88,time+.8);
 if(name==='forest')prop(c,'vines',W*.82,H*.08,70,96,.58);
 const lamp=name==='snow'?'lantern-ice':name==='astral'?'crystal-lamp':'lantern-gold';
 const pulse=.78+Math.sin(time*2)*.08;prop(c,lamp,W*.085,H*.48,28,43,pulse);prop(c,lamp,W*.885,H*.55,26,40,pulse);
}
function polygon(c,points,fill){c.fillStyle=fill;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()}
function platform(c,name,x,y,w,index,state={}){
 const t=themes[name]||themes.forest,h=index===0?38:Math.min(27,14+w*.045),img=index===0?images.grounds[name]:images.platforms[name];
 c.save();c.imageSmoothingEnabled=true;
 if(has(img)){
  // End caps retain their shape; only the stone between them expands.
  const sw=img.naturalWidth,sh=img.naturalHeight,dh=h+12,cap=Math.min(w/3,dh*.95),cut=Math.round(sw*.22);
  c.drawImage(img,0,0,cut,sh,x,y-5,cap,dh);c.drawImage(img,cut,0,sw-cut*2,sh,x+cap,y-5,Math.max(1,w-cap*2),dh);c.drawImage(img,sw-cut,0,cut,sh,x+w-cap,y-5,cap,dh);
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
function cape(c,time,moving,vy,tint,accessory){
 if(accessory==='none')return;
 const sprite=accessory==='cape'||!accessory?pieceImage('cape',tint):null;
 if(sprite){
  const lift=clamp(vy/360,-.5,1),h=19,w=moving?24:20;
  // Short horizontal strips follow a travelling wave, anchored at the shoulder.
  for(let i=0;i<12;i++){const f=i/12,sy=f*sprite.height,sh=Math.ceil(sprite.height/12),wave=Math.sin(time*(moving?7:2.6)-f*3)*f*1.5; c.drawImage(sprite,0,sy,sprite.width,sh,-w+3-f*lift*3+wave,-26+f*h-f*lift*7,w,h/12+.3)}
  return;
 }
 const sway=Math.sin(time*(moving?8:2.2)),lift=clamp(vy/240,-.8,1),length=accessory==='scarf'?20:18;
 const edge=[];for(let i=0;i<=6;i++){const t=i/6;edge.push([-3-t*(moving?12:5)+Math.sin(time*6-t*3)*t*1.8,-24+t*length-lift*t*8])}
 const width=accessory==='scarf'?2:8;
 polygon(c,[[-4,-25],[3,-24],...edge.slice().reverse().map(([x,y],i)=>[x+width*(1-i/7),y]),...edge],tint);
 c.strokeStyle='#ffffff45';c.lineWidth=.8;c.beginPath();edge.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
 if(accessory==='satchel'){c.fillStyle='#785f4a';c.fillRect(-10,-21,7,10);c.strokeStyle='#d9b88a';c.strokeRect(-10,-21,7,10)}
}
function runner(c,x,y,style,name,ghost=false,time=0,motion={}){
 const O={hair:'#19222d',top:'#172b3b',pants:'#263c5c',shoes:'#ffffff',accent:'#00e5ff',effect:'none',accessory:'cape',...(style||{})};
 const dir=motion.facing===-1?-1:1,ground=motion.ground!==false,moving=!!motion.moving,vy=Number(motion.vy)||0;
 const movement=motionState(x,y,time,motion,ghost,name,String(O.effect||'none'));
 particlesFor(c,movement.state,Number(motion.cameraY)||0,ghost);
 const top=color(O.top,time),pants=color(O.pants,time,100),hair=color(O.hair,time,200),accent=color(O.accent,time,300),shoe=color(O.shoes,time,50);
 c.save();c.translate(x,y);c.scale(dir,1);if(ghost)c.globalAlpha=.72;c.imageSmoothingEnabled=true;
 if(ground){c.save();c.globalAlpha*=.2;c.fillStyle='#153744';c.beginPath();c.ellipse(0,1,10,2,0,0,Math.PI*2);c.fill();c.restore()}
 const phase=movement.state.phase*Math.PI*2,stride=moving&&ground?Math.sin(phase):0,bob=moving&&ground?Math.abs(Math.sin(phase))*1.1:Math.sin(time*2.2)*.28;
 cape(c,time,moving,vy,accent,O.accessory);
 const hips=[{x:-2.5,y:-14-bob},{x:2,y:-14-bob}];
 for(let i=0;i<2;i++){
  const s=i?1:-1,hip=hips[i];let foot={x:s*3-stride*s*6,y:-1};
  if(!ground)foot={x:s*4+(vy>0?(i?-2:4):i?3:-3),y:vy>0?(i?-4:-8):-2};
  else if(moving)foot.y-=Math.max(0,stride*s)*5;
  const knee=Motion.knee(hip,foot,8,8);if(!i)c.globalAlpha*=.83;
  limb(c,hip,knee,3.8,pants,'thigh');limb(c,knee,foot,3.3,pants,'shin');
  if(!piece(c,'boot',foot.x+1,foot.y-2,7,4,0,shoe)){c.fillStyle='#263342';c.fillRect(foot.x-2.5,foot.y-2,7,3.5);c.fillStyle=shoe;c.fillRect(foot.x-2,foot.y-2,6,2)}
  if(!i)c.globalAlpha/=.83;
 }
 const shoulder={x:-1,y:-25-bob},armSwing=ground?stride*3:clamp(vy/70,-3,4);
 limb(c,{x:-4,y:-24-bob},{x:-6-armSwing,y:-18-bob},3.5,top,'upperArm');limb(c,{x:-6-armSwing,y:-18-bob},{x:-4-armSwing,y:-14-bob},2.2,'#d6b69a','forearm');
 if(!piece(c,'torso',0,-26-bob,12,14,0,top)){
  polygon(c,[[-5,-26-bob],[4,-26-bob],[6,-15-bob],[-5,-14-bob]],top);c.fillStyle='#f5e1b2';c.fillRect(-4,-15-bob,9,1.4);c.fillStyle='#ffffff38';c.fillRect(-3,-24-bob,1,8);
 }
 limb(c,{x:4,y:-24-bob},{x:5+armSwing,y:-19-bob},3.5,top,'upperArm');limb(c,{x:5+armSwing,y:-19-bob},{x:7+armSwing,y:-15-bob},2.2,'#d6b69a','forearm');
 if(!piece(c,'head',1,-36-bob,10,11,0,hair)){
  c.fillStyle='#263543';c.fillRect(-4,-35-bob,9,10);c.fillStyle='#dfc2a3';c.fillRect(-2,-33-bob,7,7);c.fillStyle='#ffe0b7';c.fillRect(1,-33-bob,4,5);c.fillStyle='#243444';c.fillRect(3,-31-bob,1,1.5);
 }
 if(!has(images.hero)){polygon(c,[[-5,-34-bob],[-4,-37-bob],[2,-37-bob],[6,-33-bob],[2,-33-bob],[0,-31-bob],[-3,-32-bob],[-3,-29-bob],[-5,-31-bob]],hair);c.fillStyle='#ffffff25';c.fillRect(-3,-36-bob,5,1)}
 c.fillStyle=accent;c.fillRect(-4,-26-bob,8,2);c.restore();
 if(name){c.save();c.globalAlpha=ghost?.8:1;c.fillStyle='#f5fbff';c.strokeStyle='#19333fbb';c.lineWidth=3;c.textAlign='center';c.font='600 10px system-ui';c.strokeText(String(name).slice(0,16),x,y-46);c.fillText(String(name).slice(0,16),x,y-46);c.restore()}
 return true;
}
root.EixoJumpExactArt={version:'sky-gardens-v3',ready,background,platform,runner,images,themes,heroHeight:37};
})(window);
