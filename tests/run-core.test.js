'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),Core=require('../run/core/simulation.js'),level=require('../run/levels/astral-first-light.js');
const flat={spawn:{x:0,y:3.6},killY:20,solids:[{x:-10,y:5,w:80,h:3}],oneWay:[],moving:[],falling:[],breakables:[],hazards:[],bouncePads:[],speedPads:[],windZones:[],checkpoints:[],shards:[],secrets:[],finish:{x:50,y:2,w:2,h:3}};
test('RUN vNext uses a 120 Hz deterministic core',()=>{assert.equal(Core.DT,1/120);assert.match(Core.VERSION,/2026\.09/)});
test('acceleration is gradual and capped',()=>{const p=Core.createPlayer({x:0,y:3.6});p.onGround=true;for(let i=0;i<240;i++)Core.step(p,flat,Core.INPUT.RIGHT,Core.INPUT.RIGHT);assert.ok(p.vx>8&&p.vx<=Core.TUNE.maxSpeed+.001)});
test('high-speed reversal enters skid before changing direction',()=>{const p=Core.createPlayer({x:0,y:3.6});p.onGround=true;p.vx=7;Core.step(p,flat,Core.INPUT.LEFT,0);assert.ok(p.skidTicks>0);assert.ok(p.vx<7)});
test('jump release creates a shorter jump',()=>{const p=Core.createPlayer({x:0,y:3.6});p.onGround=true;Core.step(p,flat,Core.INPUT.JUMP,0);const full=p.vy;Core.step(p,flat,0,Core.INPUT.JUMP);assert.ok(p.vy>full)});
test('coyote time remains available after leaving ground',()=>{const p=Core.createPlayer({x:0,y:3.6});p.onGround=true;Core.step(p,flat,0,0);p.onGround=false;Core.step(p,flat,Core.INPUT.JUMP,0);assert.ok(p.vy<0)});
test('replay canonicalization rejects non-monotonic ticks',()=>{assert.throws(()=>Core.canonicalReplay([{tick:1,mask:1},{tick:1,mask:0}]));assert.deepEqual(Core.canonicalReplay([{tick:0,mask:0},{tick:1,mask:0},{tick:2,mask:2}]),[{tick:0,mask:0},{tick:2,mask:2}])});
test('First Light is a new level version with 42 persistent shards',()=>{assert.equal(level.version,10);assert.equal(level.shards.length,42);assert.equal(new Set(level.shards.map(s=>s.id)).size,42);assert.ok(level.routes.upper&&level.routes.lower&&level.routes.secret)});
test('main islands stay inside the authored jump envelope',()=>{for(let i=0;i<level.solids.length-1;i++){const a=level.solids[i],b=level.solids[i+1],gap=b.x-(a.x+a.w),rise=a.y-b.y;assert.ok(gap<=4.3,'gap '+a.id+'->'+b.id+' = '+gap);assert.ok(rise<=1.7,'rise '+a.id+'->'+b.id+' = '+rise)}});
test('First Light main route is deterministically finishable with ordinary jump timing',()=>{
 const p=Core.createPlayer(level.spawn);let prev=0,hold=0,maxX=p.x,wasDead=false;const deathXs=[];
 for(let tick=0;tick<120*120&&!p.finished;tick++){
   let jump=false;
   if(hold>0){jump=true;hold--}
   if(p.onGround&&hold===0){
     const bottom=p.y+p.h,center=p.x+p.w*.5;
     const support=level.solids.find(s=>center>=s.x&&center<=s.x+s.w&&Math.abs(bottom-s.y)<.14);
     const hazard=level.hazards.find(h=>h.x>p.x&&h.x-p.x<2.6&&Math.abs((h.y+h.h)-bottom)<.8);
     if((support&&support.x+support.w-(p.x+p.w)<2.15)||hazard){hold=42;jump=true}
   }
   const mask=Core.INPUT.RIGHT|(jump?Core.INPUT.JUMP:0);
   Core.step(p,level,mask,prev);prev=mask;maxX=Math.max(maxX,p.x);
   if(p.dead&&!wasDead)deathXs.push(Number(p.x.toFixed(2)));wasDead=p.dead;
 }
 assert.equal(p.finished,true,'scripted route stopped at x='+p.x.toFixed(2)+' maxX='+maxX.toFixed(2)+' deaths='+p.deaths+' deathXs='+deathXs.join(','));
 assert.ok(p.deaths<10,'main route should not require repeated blind deaths');
});
