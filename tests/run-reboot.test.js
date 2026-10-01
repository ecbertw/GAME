'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');

test('RUN is a standalone Phaser hardcore platformer',()=>{
  const main=read('games/run/src/main.js');
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  assert.match(main,/HardcoreRunScene/);
  assert.match(scene,/const LEVELS = \[/);
  assert.match(scene,/HARDCORE PLATFORMER/);
  assert.match(scene,/wallLeft/);
  assert.match(scene,/killPlayer/);
  assert.match(scene,/addSaw/);
  assert.match(scene,/addLaser/);
  assert.doesNotMatch(scene,/Astral|runner-manifest|approved-runner|JUMP|WebSocket/);
});

test('RUN contains twelve timed levels and one continuous run clock',()=>{
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  const names=[...scene.matchAll(/name:'([^']+)'/g)].map(m=>m[1]);
  assert.equal(names.length,12);
  assert.match(scene,/this\.runStartedAt=this\.time\.now/);
  assert.match(scene,/this\.time\.now-this\.runStartedAt/);
  assert.match(scene,/this\.splits\.push/);
  assert.match(scene,/this\.deaths\+=1/);
});

test('RUN has its own server-side time leaderboard',()=>{
  const service=read('run-server.js');
  assert.match(service,/CREATE TABLE IF NOT EXISTS run_attempts/);
  assert.match(service,/CREATE TABLE IF NOT EXISTS run_bests/);
  assert.match(service,/best_time_ms ASC/);
  assert.match(service,/serverElapsed-2500/);
  assert.match(service,/splits\.length!==12/);
});

test('RUN public route and ranking APIs are wired into server',()=>{
  const server=read('server.js');
  assert.match(server,/require\('\.\/run-server'\)/);
  assert.match(server,/url\.pathname==='\/run'/);
  assert.match(server,/\/api\/run\/start/);
  assert.match(server,/\/api\/run\/finish/);
  assert.match(server,/\/api\/run\/rankings/);
  assert.match(server,/runService\.initDb/);
});

test('RUN no longer depends on the old visual asset stack',()=>{
  const index=read('games/run/index.html');
  const css=read('games/run/run.css');
  const main=read('games/run/src/main.js');
  assert.match(index,/12 LEVELS/);
  assert.match(css,/#08090d/);
  assert.doesNotMatch(index,/MOVEMENT LAB|PRIVATE BUILD|ASTRAL/);
  assert.doesNotMatch(main,/MovementLabScene|FirstLightScene/);
});
