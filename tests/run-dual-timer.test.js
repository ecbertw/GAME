'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');

test('RUN keeps a resettable attempt timer and a continuous level total',()=>{
  const timing=read('games/run/run-timing.js');
  const html=read('games/run/index.html');
  assert.match(timing,/TENTATIVA/);
  assert.match(timing,/TEMPO TOTAL/);
  assert.match(timing,/RECORDE/);
  assert.match(timing,/state\.pendingDeathReset=true/);
  assert.match(timing,/this\.levelStartedAt=this\.time\.now/);
  assert.match(timing,/state\.totalStartedAt=scene\.time\.now/);
  assert.match(timing,/currentTotal\(this\)/);
  assert.match(html,/run-timing\.js\?v=20261003-timing1/);
});

test('RUN ranking still receives the successful attempt time, not total learning time',()=>{
  const timing=read('games/run/run-timing.js');
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  assert.match(timing,/state\.pendingDeathReset/);
  assert.match(scene,/Math\.round\(this\.time\.now-this\.levelStartedAt\)/);
  assert.match(scene,/body:JSON\.stringify\(\{runId:this\.attemptId\|\|null,level,timeMs:levelTimeMs\}\)/);
  assert.doesNotMatch(timing,/\/api\/run\/level/);
});

test('clear screen shows final attempt, total level time and record separately',()=>{
  const timing=read('games/run/run-timing.js');
  assert.match(timing,/TENTATIVA FINAL/);
  assert.match(timing,/id="run-clear-total-time"/);
  assert.match(timing,/id="run-clear-record"/);
  assert.match(timing,/saveLastTotal\(state\.frozen\.level,state\.frozen\.totalMs,state\.frozen\.attemptMs,this\.deaths\)/);
});
