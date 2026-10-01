import { RUN_PHYSICS } from './run-config.js';

export const RUN_LEVEL_COUNT=900;
export const RUN_ROUTE_MARGIN=.72;
const PREFIXES=['ASH','BLACK','COLD','DARK','DEAD','DUST','ECHO','FROST','GLASS','GRIM','IRON','LAST','LOST','NEON','NIGHT','NULL','PALE','RED','RIFT','RUST','SHARP','SILENT','STEEL','STONE','VOID','WHITE','WILD','ZERO','BROKEN','FINAL'];
const SUFFIXES=['BRIDGE','CAGE','CHASM','CIRCUIT','CLIMB','CORRIDOR','CUT','DROP','EDGE','FALL','FAULT','GATE','GRID','KNIFE','LINE','MAZE','NEEDLE','PATH','PIT','RAIL','RIFT','RUN','SHAFT','SPIRE','STEP','THREAD','TOWER','TRIAL','WALL','ZONE'];

function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function mulberry32(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
function rngFor(n){return mulberry32((0xA53C9E21^Math.imul(n,0x85EBCA6B)^Math.imul(n+17,0xC2B2AE35))>>>0)}
function surface(kind,left,right,top){return{kind,left:Math.round(left),right:Math.round(right),top:Math.round(top)}}
function gap(a,b){return Math.max(0,b.left-a.right)}

export function runLevelName(n){
  n=clamp(Math.floor(Number(n)||1),1,RUN_LEVEL_COUNT);
  const z=n-1;
  return PREFIXES[Math.floor(z/30)]+' '+SUFFIXES[z%30];
}
export function jumpEnvelope(a,b,margin=RUN_ROUTE_MARGIN){
  const rise=a.top-b.top;
  const disc=RUN_PHYSICS.jumpSpeed**2-2*RUN_PHYSICS.gravityY*rise;
  if(disc<0)return{reachable:false,gap:gap(a,b),maxGap:0,flight:0,rise};
  const flight=(RUN_PHYSICS.jumpSpeed+Math.sqrt(disc))/RUN_PHYSICS.gravityY;
  const maxGap=RUN_PHYSICS.runSpeed*flight*margin;
  const g=gap(a,b);
  return{reachable:g<=maxGap,gap:g,maxGap,flight,rise};
}
export function canReachSurface(a,b,margin=RUN_ROUTE_MARGIN){return !!a&&!!b&&b.right>=a.left&&jumpEnvelope(a,b,margin).reachable}

function nextTop(archetype,i,count,prev,d,rng){
  const maxRise=32+Math.round(34*d),maxDrop=38+Math.round(44*d);
  let dir=1;
  if(archetype===0)dir=i%2===0?-1:1;
  else if(archetype===1)dir=prev>390?-1:1;
  else if(archetype===2)dir=i<count*.52?-1:1;
  else if(archetype===3)dir=rng()<.55?-1:1;
  else if(archetype===4)dir=i%4<2?-1:1;
  else dir=(i%3===0||rng()<.38)?-1:1;
  let mag=12+rng()*(18+42*d);
  if(archetype===4)mag*=.72;
  const delta=dir<0?-Math.min(maxRise,mag):Math.min(maxDrop,mag);
  return Math.round(clamp(prev+delta,350,650));
}
function addHazards(level,route,rng,d,n){
  const sawChance=.08+.38*d,laserChance=n<45?0:.03+.29*d;
  for(let i=0;i<route.length-1;i++){
    const a=route[i],b=route[i+1],g=gap(a,b);
    if(g<52)continue;
    const x=Math.round((a.right+b.left)/2),roll=rng();
    if(roll<sawChance){
      const radius=Math.round(15+8*d+rng()*3);
      const maxRange=Math.max(8,Math.floor(g/2-radius-8));
      const range=Math.round(Math.min(maxRange,18+30*d+rng()*8));
      const y=Math.round(Math.max(a.top,b.top)+55);
      const period=Math.round(1750-420*d+rng()*420);
      level.saws.push([x,y,radius,'x',range,period,Math.round(rng()*period)]);
    }else if(roll<sawChance+laserChance){
      const period=Math.round(1950-250*d+rng()*380);
      const h=Math.round(145+45*d);
      const top=Math.min(a.top,b.top);
      level.lasers.push([x,Math.round(top-h*.5+12),9,h,period,Math.round(rng()*period)]);
    }
  }
}

export function getRunLevel(index){
  const idx=Math.floor(Number(index));
  if(!Number.isFinite(idx)||idx<0||idx>=RUN_LEVEL_COUNT)throw new RangeError('RUN level index out of range.');
  const n=idx+1,d=idx/(RUN_LEVEL_COUNT-1),rng=rngFor(n),archetype=(n-1)%6;
  const floors=[[0,330,650]],platforms=[],walls=[],spikes=[],saws=[],lasers=[];
  const route=[surface('floor',0,330,650)];
  const steps=7+Math.floor(d*9)+Math.floor(rng()*3);
  let prev=route[0];

  for(let i=0;i<steps;i++){
    const top=nextTop(archetype,i,steps,prev.top,d,rng);
    let width=Math.round(clamp(150-68*d+(rng()-.5)*24,78,164));
    if(i===0)width=clamp(width+(n%11)-5,78,164);
    const rise=prev.top-top;
    const disc=RUN_PHYSICS.jumpSpeed**2-2*RUN_PHYSICS.gravityY*rise;
    const flight=disc>0?(RUN_PHYSICS.jumpSpeed+Math.sqrt(disc))/RUN_PHYSICS.gravityY:.25;
    const safe=RUN_PHYSICS.runSpeed*flight*RUN_ROUTE_MARGIN;
    const desired=70+96*d+(rng()-.5)*26;
    const g=Math.round(clamp(Math.min(desired,safe-18),54,188));
    const left=prev.right+g,right=left+width;
    const s=surface('platform',left,right,top);
    route.push(s);
    platforms.push([Math.round((left+right)/2),top+9,width,18]);
    prev=s;
  }

  const endTop=prev.top,endWidth=360;
  const endSafe=RUN_PHYSICS.runSpeed*(2*RUN_PHYSICS.jumpSpeed/RUN_PHYSICS.gravityY)*RUN_ROUTE_MARGIN;
  const endGap=Math.round(clamp(Math.min(82+86*d+(rng()-.5)*18,endSafe-22),58,184));
  const endStart=prev.right+endGap,endEnd=endStart+endWidth;
  route.push(surface('floor',endStart,endEnd,endTop));
  floors.push([endStart,endEnd,endTop]);

  const level={number:n,seed:n,name:runLevelName(n),archetype,difficulty:d,width:Math.ceil(endEnd+70),spawn:[82,615],goal:[Math.round(endStart+235),endTop],floors,platforms,walls,spikes,saws,lasers,route};
  addHazards(level,route,rng,d,n);
  return level;
}

function validateHazards(level,errors){
  for(const laser of level.lasers){
    const [x,,,,period]=laser;
    const i=level.route.findIndex((a,k)=>k<level.route.length-1&&x>a.right&&x<level.route[k+1].left);
    if(i<0)continue;
    const g=gap(level.route[i],level.route[i+1]);
    const required=g/RUN_PHYSICS.runSpeed*1000+140;
    if(period*.42<required)errors.push('laser window too short at '+i);
  }
  for(const saw of level.saws){
    const [x,y,r,axis]=saw;
    const i=level.route.findIndex((a,k)=>k<level.route.length-1&&x>a.right&&x<level.route[k+1].left);
    if(i<0)continue;
    const safeY=Math.max(level.route[i].top,level.route[i+1].top)+12;
    if(axis==='x'&&y-r<safeY)errors.push('saw intrudes into route at '+i);
  }
}
export function validateRunLevel(level){
  const errors=[];
  if(!level||!Array.isArray(level.route)||level.route.length<3)return{ok:false,errors:['missing route']};
  if(!Number.isInteger(level.number)||level.number<1||level.number>RUN_LEVEL_COUNT)errors.push('bad level number');
  const first=level.route[0],last=level.route.at(-1);
  if(!(first.left<=level.spawn[0]&&first.right>=level.spawn[0]))errors.push('spawn unsupported');
  if(!(last.left<=level.goal[0]&&last.right>=level.goal[0]))errors.push('goal unsupported');
  for(let i=0;i<level.route.length-1;i++){
    const a=level.route[i],b=level.route[i+1];
    if(b.left<=a.right)errors.push('route not forward '+i);
    const env=jumpEnvelope(a,b);
    if(!env.reachable)errors.push('unreachable jump '+i+' gap='+env.gap.toFixed(1)+' max='+env.maxGap.toFixed(1));
    if(b.kind==='platform'&&b.right-b.left<78)errors.push('platform too narrow '+(i+1));
  }
  validateHazards(level,errors);
  return{ok:errors.length===0,errors};
}
export function runLevelSignature(level){return JSON.stringify({floors:level.floors,platforms:level.platforms,walls:level.walls,spikes:level.spikes,saws:level.saws,lasers:level.lasers,goal:level.goal})}
