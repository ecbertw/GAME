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
  return Function('RUN_PHYSICS',src+';return{RUN_LEVEL_COUNT,getRunLevel,validateRunLevel,runLevelSignature,runLevelName,jumpEnvelope};')(physics());
}

test('RUN exposes 900 deterministic unique levels',()=>{
  const api=levels(),signatures=new Set(),names=new Set();
  assert.equal(api.RUN_LEVEL_COUNT,900);
  for(let i=0;i<900;i++){
    const a=api.getRunLevel(i),b=api.getRunLevel(i);
    assert.deepEqual(a,b,'level '+(i+1)+' changed between generations');
    signatures.add(api.runLevelSignature(a));
    names.add(a.name);
  }
  assert.equal(signatures.size,900);
  assert.equal(names.size,900);
});

test('every one of the 900 levels has a validated path to EXIT',()=>{
  const api=levels();
  for(let i=0;i<900;i++){
    const L=api.getRunLevel(i),v=api.validateRunLevel(L);
    assert.equal(v.ok,true,'level '+(i+1)+': '+v.errors.join('; '));
    for(let j=0;j<L.route.length-1;j++)assert.equal(api.jumpEnvelope(L.route[j],L.route[j+1]).reachable,true,'level '+(i+1)+' jump '+j);
  }
});

test('RUN scene uses generated levels and per-level timing',()=>{
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  assert.match(scene,/getRunLevel/);
  assert.match(scene,/RUN_LEVEL_COUNT/);
  assert.doesNotMatch(scene,/const LEVELS = \[/);
  assert.match(scene,/001 \/ 900/);
  assert.match(scene,/this\.time\.now-this\.levelStartedAt/);
  assert.match(scene,/loadLevel\(this\.levelIndex\+1,\{resetClock:true\}\)/);
  assert.match(scene,/DEATHS  0/);
  assert.match(scene,/this\.player\.setVisible\(false\)/);
  assert.doesNotMatch(scene,/this\.player\.setFillStyle\(C\.hazard/);
});

test('RUN server accepts progression through Level 900',()=>{
  const service=read('run-server.js');
  assert.match(service,/const RUN_LEVEL_COUNT=900/);
  assert.match(service,/n<1\|\|n>RUN_LEVEL_COUNT/);
  assert.match(service,/slice\(0,RUN_LEVEL_COUNT\)/);
  assert.match(service,/level===RUN_LEVEL_COUNT/);
  assert.match(service,/best_level DESC,rb\.best_time_ms ASC/);
});

test('RUN public route and APIs remain wired',()=>{
  const server=read('server.js');
  assert.match(server,/require\('\.\/run-server'\)/);
  assert.match(server,/url\.pathname==='\/run'/);
  assert.match(server,/\/api\/run\/start/);
  assert.match(server,/\/api\/run\/level/);
  assert.match(server,/\/api\/run\/rankings/);
});

test('RUN is still isolated from the old visual stack',()=>{
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  const main=read('games/run/src/main.js');
  assert.match(main,/HardcoreRunScene/);
  assert.doesNotMatch(scene,/Astral|runner-manifest|approved-runner|jump-(?:physics|motion|worlds|exact-renderer)|EixoJump|WebSocket/);
});
