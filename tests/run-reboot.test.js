'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');

function physics(){
  const src=read('games/run/src/run-config.js').replace('export const RUN_PHYSICS','const RUN_PHYSICS');
  return Function(src+';return RUN_PHYSICS;')();
}
function levels(){
  const src=read('games/run/src/run-levels.js')
    .replace("import { RUN_PHYSICS } from './run-config.js';",'')
    .replaceAll('export const ','const ')
    .replaceAll('export function ','function ');
  return Function('RUN_PHYSICS',src+';return{RUN_LEVEL_COUNT,getRunLevel,validateRunLevel,runLevelSignature,jumpEnvelope,RUN_MIN_SAFE_EDGE};')(physics());
}

test('all 900 levels are deterministic, unique and validated',()=>{
  const api=levels(),signatures=new Set();
  assert.equal(api.RUN_LEVEL_COUNT,900);
  for(let i=0;i<900;i++){
    const a=api.getRunLevel(i),b=api.getRunLevel(i);
    assert.deepEqual(a,b,'level '+(i+1)+' is not deterministic');
    const v=api.validateRunLevel(a);
    assert.equal(v.ok,true,'level '+(i+1)+': '+v.errors.join('; '));
    signatures.add(api.runLevelSignature(a));
  }
  assert.equal(signatures.size,900,'all 900 geometries must be unique');
});

test('every mandatory jump is inside the real RUN physics envelope',()=>{
  const api=levels();
  for(let i=0;i<900;i++){
    const L=api.getRunLevel(i);
    for(let j=0;j<L.route.length-1;j++){
      const env=api.jumpEnvelope(L.route[j],L.route[j+1]);
      assert.equal(env.reachable,true,'level '+(i+1)+' jump '+j+' impossible');
    }
  }
});

test('hardcore hazards are meaningful from Level 001 onward',()=>{
  const api=levels();
  for(let i=0;i<900;i++){
    const L=api.getRunLevel(i);
    assert.ok(L.spikes.length>=2,'level '+(i+1)+' needs spikes');
    assert.ok(L.saws.length>=1,'level '+(i+1)+' needs saws');
    assert.ok(L.lasers.length>=1,'level '+(i+1)+' needs lasers');
    for(const m of L.sawMeta){
      const s=L.route[m.surface];
      assert.ok(m.y+m.r<s.top-4,'level '+(i+1)+' saw is below/on platform');
      assert.ok(m.x-m.range-m.r-s.left>=api.RUN_MIN_SAFE_EDGE,'level '+(i+1)+' saw removes left waiting zone');
      assert.ok(s.right-(m.x+m.range+m.r)>=api.RUN_MIN_SAFE_EDGE,'level '+(i+1)+' saw removes right waiting zone');
    }
    for(const m of L.laserMeta){
      const a=L.route[m.gap],b=L.route[m.gap+1];
      assert.ok(m.x>a.right&&m.x<b.left,'level '+(i+1)+' laser is not in the required gap');
      assert.ok(m.period*.42>=m.requiredOff,'level '+(i+1)+' laser has no human timing window');
    }
  }
});

test('scene destroys the old player before loading another level',()=>{
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  assert.match(scene,/if\(this\.player\)\s*\{\s*try\s*\{\s*this\.player\.destroy\(\);\s*\}\s*catch\(_\)\s*\{\s*\}\s*\}/);
  assert.match(scene,/this\.player=null/);
  assert.match(scene,/DEATHS  0/);
  assert.doesNotMatch(scene,/this\.player\.setFillStyle\(C\.hazard/);
});

test('RUN uses 900 levels, per-level timing and three-digit rank display',()=>{
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  assert.match(scene,/RUN_LEVEL_COUNT/);
  assert.match(scene,/getRunLevel\(index\)/);
  assert.match(scene,/this\.time\.now-this\.levelStartedAt/);
  assert.match(scene,/loadLevel\(this\.levelIndex\+1,\{resetClock:true\}\)/);
  assert.match(scene,/padStart\(3,'0'\)/);
  assert.doesNotMatch(scene,/const LEVELS = \[/);
});

test('RUN server progression reaches Level 900 in postgres and memory modes',()=>{
  const service=read('run-server.js');
  assert.match(service,/const RUN_LEVEL_COUNT=900/);
  assert.match(service,/n<1\|\|n>RUN_LEVEL_COUNT/);
  assert.match(service,/level===RUN_LEVEL_COUNT\?RUN_LEVEL_COUNT:level\+1/);
  assert.match(service,/best_level DESC,rb\.best_time_ms ASC/);
});

test('RUN public APIs remain wired',()=>{
  const server=read('server.js');
  assert.match(server,/\/api\/run\/start/);
  assert.match(server,/\/api\/run\/level/);
  assert.match(server,/\/api\/run\/rankings/);
});
