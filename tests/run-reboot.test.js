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
  return Function('RUN_PHYSICS',src+';return{RUN_LEVEL_COUNT,RUN_STYLE_COUNT,getRunLevel,validateRunLevel,runLevelSignature,runStructuralProfile,jumpEnvelope};')(physics());
}

test('all 900 RUN levels are deterministic unique and solvable',()=>{
  const api=levels(),signatures=new Set();
  assert.equal(api.RUN_LEVEL_COUNT,900);
  for(let i=0;i<900;i++){
    const L=api.getRunLevel(i);
    assert.deepEqual(api.getRunLevel(i),L,'level '+(i+1)+' must be deterministic');
    const result=api.validateRunLevel(L);
    assert.equal(result.ok,true,'level '+(i+1)+': '+result.errors.join('; '));
    signatures.add(api.runLevelSignature(L));
    for(let j=0;j<L.route.length-1;j++){
      assert.equal(api.jumpEnvelope(L.route[j],L.route[j+1]).reachable,true,'level '+(i+1)+' jump '+j+' impossible');
    }
  }
  assert.equal(signatures.size,900);
});

test('spawn is always completely clean and the first jump has no laser',()=>{
  const api=levels();
  for(let i=0;i<900;i++){
    const L=api.getRunLevel(i);
    assert.equal(L.spikeMeta.some(m=>m.surface===0),false,'level '+(i+1)+' spawn spike');
    assert.equal(L.sawMeta.some(m=>m.surface===0),false,'level '+(i+1)+' spawn saw');
    assert.equal(L.laserMeta.some(m=>m.gap===0),false,'level '+(i+1)+' spawn laser');
  }
});

test('RUN has broad structural variety across the 900 levels',()=>{
  const api=levels(),profiles=new Set(),styles=new Set(),themes=new Set();
  for(let i=0;i<900;i++){
    const L=api.getRunLevel(i);
    profiles.add(api.runStructuralProfile(L));
    styles.add(L.style);
    themes.add(L.hazardTheme);
  }
  assert.equal(styles.size,24);
  assert.equal(themes.size,6);
  assert.ok(profiles.size>=700,'structural profiles='+profiles.size);
});

test('every level remains hardcore with validated hazards',()=>{
  const api=levels();
  for(let i=0;i<900;i++){
    const L=api.getRunLevel(i);
    assert.ok(L.spikes.length>=2,'level '+(i+1)+' missing spikes');
    assert.ok(L.saws.length>=1,'level '+(i+1)+' missing saw');
    assert.ok(L.lasers.length>=1,'level '+(i+1)+' missing laser');
    for(const m of L.sawMeta){
      const s=L.route[m.surface];
      assert.ok(m.y+m.r<s.top-4,'level '+(i+1)+' saw below platform');
    }
    for(const m of L.laserMeta){
      assert.ok(m.period*.42>=m.requiredOff,'level '+(i+1)+' laser timing impossible');
    }
  }
});

test('RUN progress survives refresh and deploy',()=>{
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  const service=read('run-server.js');
  assert.match(scene,/eixo\.run\.progress\.v1/);
  assert.match(scene,/localStorage\.getItem/);
  assert.match(scene,/localStorage\.setItem/);
  assert.match(scene,/this\.loadLevel\(readSavedLevel\(\)-1\)/);
  assert.match(scene,/saveLevel\(level===RUN_LEVEL_COUNT\?RUN_LEVEL_COUNT:level\+1\)/);
  assert.match(service,/finished_at IS NULL/);
  assert.match(service,/const level=Math\.max\(current,bestNext\)/);
  assert.match(service,/resumed:true/);
});

test('RUN keeps cleanup timer and ranking formatting correct',()=>{
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  assert.match(scene,/this\.player\.destroy\(\)/);
  assert.match(scene,/DEATHS  0/);
  assert.match(scene,/String\(min\)\.padStart\(2,'0'\)/);
  assert.match(scene,/String\(sec\)\.padStart\(2,'0'\)/);
  assert.match(scene,/String\(p\.level\|\|0\)\.padStart\(3,'0'\)/);
  assert.doesNotMatch(scene,/this\.player\.setFillStyle\(C\.hazard/);
});

test('RUN server progression reaches level 900',()=>{
  const service=read('run-server.js');
  assert.match(service,/const RUN_LEVEL_COUNT=900/);
  assert.match(service,/level===RUN_LEVEL_COUNT\?RUN_LEVEL_COUNT:level\+1/);
  assert.match(service,/best_level DESC,rb\.best_time_ms ASC/);
});
