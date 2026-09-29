'use strict';const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('RUN is isolated from JUMP renderer and multiplayer',()=>{const c=read('run/run-client.mjs')+read('run-server.js');assert.doesNotMatch(c,/EixoJumpExactArt|jump-rig|WebSocket|LIVE ECHO|FRIEND ECHO/);assert.match(c,/PB|pb/);assert.match(c,/world/);});
test('RUN page exposes First Light, echoes and deterministic physics',()=>{const h=read('run.html'),p=read('run/engine/physics-core.js');assert.match(h,/ASTRAL 01/);assert.match(h,/PB ECHO/);assert.match(h,/WORLD ECHO/);assert.match(p,/1\/120/);});
test('RUN has 42 persistent shard ids, routes and a versioned First Light',async()=>{const m=await import('../run/levels/astral/astral-01.mjs');assert.equal(m.ASTRAL01.version,2);assert.equal(m.ASTRAL01.shards.length,42);assert.equal(new Set(m.ASTRAL01.shards.map(x=>x.id)).size,42);assert.ok(m.ASTRAL01.secrets.length>=1);const groups=Object.fromEntries(['main','challenge','alternate','secret'].map(g=>[g,m.ASTRAL01.shards.filter(x=>x.group===g).length]));assert.deepEqual(groups,{main:25,challenge:10,alternate:4,secret:3});assert.ok(m.ASTRAL01.routes.upper&&m.ASTRAL01.routes.lower&&m.ASTRAL01.routes.secret);assert.ok(m.ASTRAL01.bouncePads.length&&m.ASTRAL01.speedPads.length&&m.ASTRAL01.fallingPlatforms.length);});

test('RUN source modules parse under Node',()=>{const cp=require('node:child_process');for(const file of ['run/run-client.mjs','run/rendering/renderer.mjs','run/audio/audio.mjs','run/camera/follow-camera.mjs','run/input/input.mjs']){const out=cp.spawnSync(process.execPath,['--check',require('node:path').join(__dirname,'..',file)],{encoding:'utf8'});assert.equal(out.status,0,file+' '+out.stderr)}});

test('ASTRAL 01 main route is deterministically traversable with authored hazards',async()=>{
 const {ASTRAL01}=await import('../run/levels/astral/astral-01.mjs');const P=require('../run/engine/physics-core.js'),p=P.createPlayer(ASTRAL01.spawn);let prev=0,jumpHold=0;
 for(let tick=0;tick<120*115&&!p.finished;tick++){
  if(p.onGround&&jumpHold===0){
   const bottom=p.y+p.h,center=p.x+p.w*.5;
   const support=ASTRAL01.solids.find(r=>center>=r.x&&center<=r.x+r.w&&Math.abs(bottom-r.y)<.16);
   const edge=support?support.x+support.w-(p.x+p.w):99;
   const hazard=ASTRAL01.hazards.find(h=>h.type!=='void'&&h.x>p.x&&h.x-p.x<2.1&&Math.abs((h.y+h.h)-bottom)<.9);
   if(edge<1.05||hazard)jumpHold=46;
  }
  const mask=P.INPUT.RIGHT|(jumpHold>0?P.INPUT.JUMP:0);P.step(p,ASTRAL01,mask,prev);prev=mask;if(jumpHold>0)jumpHold--;
 }
 assert.equal(p.finished,true,`scripted runner stopped at x=${p.x.toFixed(2)}, deaths=${p.deaths}`);
 assert.ok(p.deaths<10,'main route should not require excessive deaths');
});

test('RUN final art pipeline uses layered Astral rendering and the 14-frame runner',()=>{
 const renderer=read('run/rendering/renderer.mjs'),atlas=JSON.parse(read('assets/run/character/runner-atlas.json'));
 assert.match(renderer,/drawParallaxRuins/);assert.match(renderer,/waterfall/);assert.match(renderer,/foreground/);assert.match(renderer,/drawFinish/);
 assert.equal(atlas.frames,14);assert.equal(atlas.frameWidth,160);assert.equal(atlas.states.victory,13);
});

test('First Light main islands stay within the authored jump envelope',async()=>{
 const {ASTRAL01}=await import('../run/levels/astral/astral-01.mjs');
 for(let i=0;i<ASTRAL01.solids.length-1;i++){
  const a=ASTRAL01.solids[i],b=ASTRAL01.solids[i+1],gap=b.x-(a.x+a.w),rise=a.y-b.y;
  assert.ok(gap<=4.2,`gap ${a.id}->${b.id} is ${gap}`);
  assert.ok(rise<=1.65,`rise ${a.id}->${b.id} is ${rise}`);
 }
});
