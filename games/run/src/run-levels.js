import { RUN_PHYSICS } from './run-config.js';

export const RUN_LEVEL_COUNT=900;
export const RUN_ROUTE_MARGIN=.82;
export const RUN_MIN_SAFE_EDGE=46;
export const RUN_STYLE_COUNT=24;

const PREFIXES=['ASH','BLACK','COLD','DARK','DEAD','DUST','ECHO','FROST','GLASS','GRIM','IRON','LAST','LOST','NEON','NIGHT','NULL','PALE','RED','RIFT','RUST','SHARP','SILENT','STEEL','STONE','VOID','WHITE','WILD','ZERO','BROKEN','FINAL'];
const SUFFIXES=['BRIDGE','CAGE','CHASM','CIRCUIT','CLIMB','CORRIDOR','CUT','DROP','EDGE','FALL','FAULT','GATE','GRID','KNIFE','LINE','MAZE','NEEDLE','PATH','PIT','RAIL','RIFT','RUN','SHAFT','SPIRE','STEP','THREAD','TOWER','TRIAL','WALL','ZONE'];

function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function mulberry32(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
function rngFor(n){return mulberry32((0xA53C9E21^Math.imul(n,0x85EBCA6B)^Math.imul(n+17,0xC2B2AE35))>>>0)}
function surface(kind,left,right,top){return{kind,left:Math.round(left),right:Math.round(right),top:Math.round(top)}}
function widthOf(s){return s.right-s.left}
function gapBetween(a,b){return Math.max(0,b.left-a.right)}

export function runLevelName(n){
  n=clamp(Math.floor(Number(n)||1),1,RUN_LEVEL_COUNT);
  const z=n-1;
  return PREFIXES[Math.floor(z/30)]+' '+SUFFIXES[z%30];
}

export function jumpEnvelope(a,b,margin=RUN_ROUTE_MARGIN){
  const rise=a.top-b.top;
  const disc=RUN_PHYSICS.jumpSpeed**2-2*RUN_PHYSICS.gravityY*rise;
  if(disc<0)return{reachable:false,gap:gapBetween(a,b),maxGap:0,flight:0,rise};
  const flight=(RUN_PHYSICS.jumpSpeed+Math.sqrt(disc))/RUN_PHYSICS.gravityY;
  const maxGap=RUN_PHYSICS.runSpeed*flight*margin;
  const gap=gapBetween(a,b);
  return{reachable:gap<=maxGap,gap,maxGap,flight,rise};
}

function nextTop(style,i,count,prev,d,rng){
  const archetype=style%8,variant=Math.floor(style/8);
  const rise=44+Math.round(20*d)+variant*3,drop=48+Math.round(24*d)+variant*3;
  let sign;
  switch(archetype){
    case 0: sign=i%2===0?-1:1; break;                         // zig-zag
    case 1: sign=i<count*.66?-1:1; break;                     // climb
    case 2: sign=i<count*.58?1:-1; break;                     // drop then recover
    case 3: sign=(i%4===0||i%4===1)?-1:1; break;              // double steps
    case 4: sign=rng()<.62?-1:1; break;                       // jagged ascent
    case 5: sign=rng()<.38?-1:1; break;                       // jagged descent
    case 6: sign=i%3===0?-1:(rng()<.5?-1:1); break;           // pulse
    default: sign=rng()<.5?-1:1;                              // void
  }
  if(prev>=638&&sign>0)sign=-1;
  if(prev<=365&&sign<0)sign=1;
  let mag=22+rng()*(24+22*d);
  if(archetype===6)mag*=.78;
  if(variant===1){mag*=.88;if(i%5===4)sign*=-1;}
  if(variant===2){mag*=1.08;if(i%4===2)sign*=-1;}
  if(prev>=638&&sign>0)sign=-1;
  if(prev<=365&&sign<0)sign=1;
  const delta=sign<0?-Math.min(rise,mag):Math.min(drop,mag);
  return Math.round(clamp(prev+delta,350,650));
}

function addSpike(level,surfaceIndex,rng){
  const s=level.route[surfaceIndex],w=widthOf(s);
  if(w<132)return false;
  const safe=RUN_MIN_SAFE_EDGE+2+Math.round(rng()*8);
  const maxSpike=w-safe*2;
  if(maxSpike<34)return false;
  const spikeW=Math.round(clamp(38+rng()*Math.min(54,maxSpike-30),34,maxSpike));
  const offset=(rng()-.5)*Math.max(0,maxSpike-spikeW);
  const x=Math.round((s.left+s.right)/2+offset);
  level.spikes.push([x,s.top,spikeW]);
  level.spikeMeta.push({surface:surfaceIndex,x,width:spikeW,safe});
  return true;
}

function addSaw(level,surfaceIndex,rng,d){
  const s=level.route[surfaceIndex],w=widthOf(s);
  if(w<176)return false;
  const r=Math.round(17+5*d+rng()*2);
  const edge=RUN_MIN_SAFE_EDGE+8;
  const maxRange=Math.floor(w/2-r-edge);
  if(maxRange<12)return false;
  const range=Math.round(clamp(18+22*d+rng()*16,12,maxRange));
  const x=Math.round((s.left+s.right)/2);
  const y=Math.round(s.top-(r+10)); // always above the platform, never below it
  const period=Math.round(1420-180*d+rng()*360);
  const phase=Math.round(rng()*period);
  level.saws.push([x,y,r,'x',range,period,phase]);
  level.sawMeta.push({surface:surfaceIndex,x,y,r,range,edge});
  return true;
}

function addLaser(level,gapIndex,rng,d){
  if(gapIndex<0||gapIndex>=level.route.length-1)return false;
  const a=level.route[gapIndex],b=level.route[gapIndex+1];
  const gap=gapBetween(a,b);
  if(gap<72)return false;
  const env=jumpEnvelope(a,b);
  const top=Math.max(90,Math.min(a.top,b.top)-190);
  const bottom=Math.max(a.top,b.top)+4;
  const h=Math.round(bottom-top);
  const x=Math.round((a.right+b.left)/2);
  const requiredOff=env.flight*1000+220;
  const period=Math.round(Math.max(1750-180*d+rng()*260,requiredOff/.42+120));
  const phase=Math.round(rng()*period);
  level.lasers.push([x,Math.round((top+bottom)/2),10,h,period,phase]);
  level.laserMeta.push({gap:gapIndex,x,top,bottom,period,requiredOff});
  return true;
}

function decorateHardcore(level,rng,d){
  const platformIndices=[];
  const wideIndices=[];
  for(let i=1;i<level.route.length-1;i++){
    platformIndices.push(i);
    if(widthOf(level.route[i])>=176)wideIndices.push(i);
  }

  // Spawn surface is always completely clean.
  let spikeCount=0;
  for(const i of platformIndices){
    const chance=.28+.18*d+(level.archetype===3?.14:0);
    if(rng()<chance&&addSpike(level,i,rng))spikeCount++;
  }
  while(spikeCount<2){
    const candidate=platformIndices.find(i=>!level.spikeMeta.some(m=>m.surface===i)&&widthOf(level.route[i])>=132);
    if(candidate===undefined)break;
    if(addSpike(level,candidate,rng))spikeCount++; else break;
  }

  let sawCount=0;
  const sawOrder=[...wideIndices].sort((a,b)=>((a+level.number)%5)-((b+level.number)%5));
  for(const i of sawOrder){
    const chance=.20+.20*d+(level.archetype===5?.18:0);
    if((sawCount===0||rng()<chance)&&addSaw(level,i,rng,d))sawCount++;
    if(sawCount>=1+Math.floor(d*2))break;
  }
  if(sawCount===0){
    const i=wideIndices[0];
    if(i!==undefined&&addSaw(level,i,rng,d))sawCount++;
  }

  let laserCount=0;
  const gaps=[];
  for(let i=1;i<level.route.length-1;i++)if(gapBetween(level.route[i],level.route[i+1])>=72)gaps.push(i);
  const start=(level.number*3)%Math.max(1,gaps.length);
  for(let k=0;k<gaps.length;k++){
    const i=gaps[(start+k)%gaps.length];
    const chance=.18+.22*d+(level.archetype===6?.20:0);
    if((laserCount===0||rng()<chance)&&addLaser(level,i,rng,d))laserCount++;
    if(laserCount>=1+Math.floor(d*2))break;
  }

  // Late levels get denser mixed hazards, but never remove the guaranteed waiting/landing zones.
  const extraBudget=Math.floor(d*3);
  for(let n=0;n<extraBudget;n++){
    const choice=Math.floor(rng()*3);
    if(choice===0&&platformIndices.length)addSpike(level,platformIndices[Math.floor(rng()*platformIndices.length)],rng);
    else if(choice===1&&wideIndices.length)addSaw(level,wideIndices[Math.floor(rng()*wideIndices.length)],rng,d);
    else if(gaps.length)addLaser(level,gaps[Math.floor(rng()*gaps.length)],rng,d);
  }
}

export function getRunLevel(index){
  const idx=Math.floor(Number(index));
  if(!Number.isFinite(idx)||idx<0||idx>=RUN_LEVEL_COUNT)throw new RangeError('RUN level index out of range.');
  const n=idx+1,d=idx/(RUN_LEVEL_COUNT-1),rng=rngFor(n),style=(n-1)%RUN_STYLE_COUNT,archetype=style%8,hazardTheme=(Math.imul(n,5)+Math.floor((n-1)/RUN_STYLE_COUNT))%6;
  const floors=[[0,360,650]],platforms=[],walls=[],spikes=[],saws=[],lasers=[];
  const spikeMeta=[],sawMeta=[],laserMeta=[];
  const route=[surface('floor',0,360,650)];
  const steps=12+(style%4)+Math.floor(d*3)+Math.floor(rng()*2);
  let prev=route[0];

  for(let i=0;i<steps;i++){
    const top=nextTop(style,i,steps,prev.top,d,rng);
    const family=Math.floor(style/8);
    const kind=(family===0?'platform':family===1&&i%4===2?'floor':family===2&&i%3===1?'floor':'platform');
    const lane=(i+style)%4;
    let width;
    if(kind==='floor')width=Math.round(220+rng()*105);
    else if(lane===1)width=Math.round(198+rng()*(46+16*d));
    else if(lane===3)width=Math.round(154+rng()*24);
    else width=Math.round(clamp(112-20*d+(rng()-.5)*24,82,128));

    const probe=surface('platform',0,width,top);
    const env=jumpEnvelope(prev,probe,1);
    const ratio=clamp(.74+.06*d+rng()*.10+(archetype===7?.025:0),.72,.90);
    const desired=env.maxGap*RUN_ROUTE_MARGIN*ratio;
    const gap=Math.round(clamp(desired,76,205));
    const left=prev.right+gap,right=left+width;
    const s=surface(kind,left,right,top);
    route.push(s);
    if(kind==='floor')floors.push([left,right,top]);
    else platforms.push([Math.round((left+right)/2),top+9,width,18]);
    prev=s;
  }

  const endTop=prev.top,endWidth=380;
  const endProbe=surface('floor',0,endWidth,endTop);
  const endEnv=jumpEnvelope(prev,endProbe,1);
  const endRatio=clamp(.76+.05*d+rng()*.08,.74,.88);
  const endGap=Math.round(clamp(endEnv.maxGap*RUN_ROUTE_MARGIN*endRatio,78,205));
  const endStart=prev.right+endGap,endEnd=endStart+endWidth;
  route.push(surface('floor',endStart,endEnd,endTop));
  floors.push([endStart,endEnd,endTop]);

  const level={
    number:n,seed:n,name:runLevelName(n),style,archetype,hazardTheme,difficulty:d,
    width:Math.ceil(endEnd+70),spawn:[82,615],goal:[Math.round(endStart+250),endTop],
    floors,platforms,walls,spikes,saws,lasers,route,spikeMeta,sawMeta,laserMeta
  };

  decorateHardcore(level,rng,d);
  return level;
}

function validateSpikes(level,errors){
  const sameHeightRange=RUN_PHYSICS.runSpeed*(2*RUN_PHYSICS.jumpSpeed/RUN_PHYSICS.gravityY)*.70;
  for(const m of level.spikeMeta){
    const s=level.route[m.surface];
    if(!s){errors.push('spike missing surface');continue}
    const leftSafe=(m.x-m.width/2)-s.left;
    const rightSafe=s.right-(m.x+m.width/2);
    if(leftSafe<RUN_MIN_SAFE_EDGE||rightSafe<RUN_MIN_SAFE_EDGE)errors.push('spike removes safe landing/takeoff zone on '+m.surface);
    if(m.width+30>sameHeightRange)errors.push('spike strip too wide on '+m.surface);
    const spec=level.spikes.find(x=>x[0]===m.x&&x[2]===m.width);
    if(!spec||spec[1]!==s.top)errors.push('spike not on top of platform '+m.surface);
  }
}

function validateSaws(level,errors){
  for(const m of level.sawMeta){
    const s=level.route[m.surface];
    if(!s){errors.push('saw missing surface');continue}
    if(m.y+m.r>=s.top-4)errors.push('saw is not visibly above platform '+m.surface);
    const minX=m.x-m.range-m.r,maxX=m.x+m.range+m.r;
    if(minX-s.left<RUN_MIN_SAFE_EDGE||s.right-maxX<RUN_MIN_SAFE_EDGE)errors.push('saw removes waiting zone on '+m.surface);
    if(!(m.x>s.left&&m.x<s.right))errors.push('saw not over platform '+m.surface);
  }
}

function validateLasers(level,errors){
  for(const m of level.laserMeta){
    const a=level.route[m.gap],b=level.route[m.gap+1];
    if(!a||!b){errors.push('laser missing gap');continue}
    if(!(m.x>a.right&&m.x<b.left))errors.push('laser not inside route gap '+m.gap);
    if(m.bottom<Math.max(a.top,b.top))errors.push('laser does not reach platform height '+m.gap);
    if(m.period*.42<m.requiredOff)errors.push('laser off-window too short '+m.gap);
  }
}

export function validateRunLevel(level){
  const errors=[];
  if(!level||!Array.isArray(level.route)||level.route.length<3)return{ok:false,errors:['missing route']};
  if(!Number.isInteger(level.number)||level.number<1||level.number>RUN_LEVEL_COUNT)errors.push('bad level number');
  if(level.spikeMeta.some(m=>m.surface===0))errors.push('spawn platform contains spikes');
  if(level.sawMeta.some(m=>m.surface===0))errors.push('spawn platform contains saw');
  if(level.laserMeta.some(m=>m.gap===0))errors.push('spawn jump contains laser');
  const first=level.route[0],last=level.route.at(-1);
  if(!(first.left<=level.spawn[0]&&first.right>=level.spawn[0]))errors.push('spawn unsupported');
  if(!(last.left<=level.goal[0]&&last.right>=level.goal[0]))errors.push('goal unsupported');
  for(let i=0;i<level.route.length-1;i++){
    const a=level.route[i],b=level.route[i+1];
    if(b.left<=a.right)errors.push('route not strictly forward '+i);
    const env=jumpEnvelope(a,b);
    if(!env.reachable)errors.push('unreachable jump '+i+' gap='+env.gap.toFixed(1)+' max='+env.maxGap.toFixed(1));
    if(b.kind==='platform'&&widthOf(b)<82)errors.push('landing too narrow '+(i+1));
  }
  validateSpikes(level,errors);
  validateSaws(level,errors);
  validateLasers(level,errors);
  if(level.spikes.length<2)errors.push('not enough spikes');
  if(level.saws.length<1)errors.push('missing saw challenge');
  if(level.lasers.length<1)errors.push('missing laser challenge');
  return{ok:errors.length===0,errors};
}

export function runLevelSignature(level){
  return JSON.stringify({style:level.style,hazardTheme:level.hazardTheme,route:level.route.map(s=>[s.kind,s.left,s.right,s.top]),spikes:level.spikes,saws:level.saws,lasers:level.lasers,goal:level.goal});
}
export function runStructuralProfile(level){
  return JSON.stringify({style:level.style,hazardTheme:level.hazardTheme,kinds:level.route.map(s=>s.kind[0]).join(''),heights:level.route.slice(1,-1).map((s,i,a)=>i===0?Math.sign(s.top-level.route[0].top):Math.sign(s.top-a[i-1].top)).join(','),widths:level.route.slice(1,-1).map(s=>widthOf(s)>=176?'W':widthOf(s)>=132?'M':'N').join('')});
}
