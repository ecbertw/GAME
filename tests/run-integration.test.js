'use strict';const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('RUN is isolated from JUMP renderer and multiplayer',()=>{const c=read('run/run-client.mjs')+read('run-server.js');assert.doesNotMatch(c,/EixoJumpExactArt|jump-rig|WebSocket|LIVE ECHO|FRIEND ECHO/);assert.match(c,/PB|pb/);assert.match(c,/world/);});
test('RUN page exposes First Light, echoes and deterministic physics',()=>{const h=read('run.html'),p=read('run/engine/physics-core.js');assert.match(h,/ASTRAL 01/);assert.match(h,/PB ECHO/);assert.match(h,/WORLD ECHO/);assert.match(p,/1\/120/);});
test('RUN has 42 persistent shard ids, routes and a versioned First Light',async()=>{const m=await import('../run/levels/astral/astral-01.mjs');assert.equal(m.ASTRAL01.version,2);assert.equal(m.ASTRAL01.shards.length,42);assert.equal(new Set(m.ASTRAL01.shards.map(x=>x.id)).size,42);assert.ok(m.ASTRAL01.secrets.length>=1);const groups=Object.fromEntries(['main','challenge','alternate','secret'].map(g=>[g,m.ASTRAL01.shards.filter(x=>x.group===g).length]));assert.deepEqual(groups,{main:25,challenge:10,alternate:4,secret:3});assert.ok(m.ASTRAL01.routes.upper&&m.ASTRAL01.routes.lower&&m.ASTRAL01.routes.secret);assert.ok(m.ASTRAL01.bouncePads.length&&m.ASTRAL01.speedPads.length&&m.ASTRAL01.fallingPlatforms.length);});

test('RUN source modules parse under Node',()=>{const cp=require('node:child_process');for(const file of ['run/run-client.mjs','run/rendering/renderer.mjs','run/player/sprite-player.mjs','run/audio/audio.mjs','run/camera/follow-camera.mjs','run/input/input.mjs']){const out=cp.spawnSync(process.execPath,['--check',require('node:path').join(__dirname,'..',file)],{encoding:'utf8'});assert.equal(out.status,0,file+' '+out.stderr)}});



test('RUN final art pipeline uses layered Astral rendering and a manifest-driven fixed-outfit sprite runner',()=>{
 const renderer=read('run/rendering/renderer.mjs'),sprite=read('run/player/sprite-player.mjs'),atlas=JSON.parse(read('assets/run/character/runner-atlas.json'));
 assert.match(renderer,/drawParallaxRuins/);assert.match(renderer,/waterfall/);assert.match(renderer,/foreground/);assert.match(renderer,/drawFinish/);
 assert.match(renderer,/SpritePlayer/);assert.doesNotMatch(renderer,/frame\*160/);
 assert.equal(atlas.version,3);assert.equal(atlas.frames,14);assert.equal(atlas.frameWidth,160);assert.equal(atlas.fixedOutfit,true);assert.match(atlas.image,/runner-atlas\.svg$/);
 assert.ok(atlas.states['fast-run']&&atlas.states['jump-start']&&atlas.states.victory);
 assert.match(sprite,/manifest/);assert.match(sprite,/animationState/);assert.doesNotMatch(sprite,/EixoJumpExactArt|jump-rig|AnimationMixer/);
});

test('First Light main islands stay within the authored jump envelope',async()=>{
 const {ASTRAL01}=await import('../run/levels/astral/astral-01.mjs');
 for(let i=0;i<ASTRAL01.solids.length-1;i++){
  const a=ASTRAL01.solids[i],b=ASTRAL01.solids[i+1],gap=b.x-(a.x+a.w),rise=a.y-b.y;
  assert.ok(gap<=4.2,`gap ${a.id}->${b.id} is ${gap}`);
  assert.ok(rise<=1.65,`rise ${a.id}->${b.id} is ${rise}`);
 }
});

test('First Light requires active platforming instead of hold-right play',async()=>{
 const {ASTRAL01}=await import('../run/levels/astral/astral-01.mjs');
 const gaps=ASTRAL01.solids.slice(0,-1).map((a,i)=>ASTRAL01.solids[i+1].x-(a.x+a.w)).filter(g=>g>.75);
 const surfaceHazards=ASTRAL01.hazards.filter(h=>h.type!=='void');
 const pits=ASTRAL01.hazards.filter(h=>h.type==='void');
 assert.ok(gaps.length>=15,'First Light should contain repeated mandatory gaps');
 assert.ok(surfaceHazards.length>=14,'First Light should require hazard timing');
 assert.ok(pits.length>=15,'First Light should punish missed jumps');
 assert.ok(ASTRAL01.movingPlatforms.length>=5&&ASTRAL01.fallingPlatforms.length>=4,'dynamic platforming should be present');
});

test('First Light upper route platform gaps are reachable after the bounce entry',async()=>{
 const {ASTRAL01}=await import('../run/levels/astral/astral-01.mjs');
 const ids=['upper-01','upper-02','upper-03','upper-04','upper-05','secret-step','secret-roof','upper-06'];
 const route=ids.map(id=>ASTRAL01.oneWayPlatforms.find(p=>p.id===id));
 assert.ok(route.every(Boolean));
 for(let i=0;i<route.length-1;i++){
  const a=route[i],b=route[i+1],gap=b.x-(a.x+a.w),rise=a.y-b.y;
  assert.ok(gap<=4.9,`upper gap ${a.id}->${b.id} is ${gap}`);
  assert.ok(rise<=1.21,`upper rise ${a.id}->${b.id} is ${rise}`);
 }
 const entry=ASTRAL01.bouncePads.find(p=>p.id==='bounce-upper');
 assert.ok(entry&&entry.power>=16.5,'upper route must have a deliberate high-launch entry');
});
