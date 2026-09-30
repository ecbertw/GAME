'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');

test('RUN reboot uses Phaser and is isolated from JUMP',()=>{
  const pkg=JSON.parse(read('package.json'));
  assert.ok(pkg.dependencies.phaser);
  const files=[
    'games/run/src/main.js',
    'games/run/src/scenes/MovementLabScene.js',
    'games/run/src/player/Runner.js',
    'games/run/src/player/RunnerController.js',
    'games/run/src/player/RunnerAnimator.js',
    'games/run/src/camera/RunCamera.js',
    'games/run/src/effects/MovementFx.js'
  ];
  for(const f of files){
    const body=read(f);
    assert.doesNotMatch(body,/jump-|EixoJump|GLTF|AnimationMixer|WebSocket|Passport|Daily|ranking/i,f);
  }
});

test('RUN Movement Lab is private and Phaser is served locally',()=>{
  const server=read('server.js');
  assert.match(server,/\/run-lab/);
  assert.match(server,/role!=='admin'/);
  assert.match(server,/node_modules[\s\S]*phaser[\s\S]*phaser\.min\.js/);
});

test('Runner v2 is a 37-frame independent production pack',()=>{
  const manifest=read('games/run/src/assets/runner-manifest.js');
  const names=[
    'idle_01','idle_02','idle_03','idle_04',
    'run_01','run_02','run_03','run_04','run_05','run_06','run_07','run_08',
    'skid_01','skid_02','skid_03','jump_start_01','jump_start_02',
    'jump_rise_01','jump_rise_02','apex_01','apex_02','fall_01','fall_02',
    'land_soft_01','land_soft_02','land_hard_01','land_hard_02','land_hard_03',
    'death_01','death_02','death_03','death_04','death_05',
    'victory_01','victory_02','victory_03','victory_04'
  ];
  assert.equal(names.length,37);
  for(const name of names){
    const file=path.join(ROOT,'games/run/assets/runner/v2',name+'.svg');
    assert.ok(fs.existsSync(file),name);
    const body=fs.readFileSync(file,'utf8');
    assert.match(body,/width="256"/,name);
    assert.match(body,/viewBox="0 0 256 256"/,name);
    assert.doesNotMatch(body,/dust|trail|particle|speed-line/i,name);
    assert.match(manifest,new RegExp(name),name);
  }
  for(let i=1;i<=8;i++) assert.match(manifest,new RegExp('run_0'+i));
  assert.match(manifest,/distanceDriven:\s*true/);
  assert.match(manifest,/bakedFx:\s*false/);
  assert.match(manifest,/embedded-svg-data-uri/);
  assert.doesNotMatch(manifest,/\/games\/run\/assets\/runner\/v2\//);
  for(const part of ['a','b','c','d']){
    const data=read(`games/run/src/assets/runner-v2-data-${part}.js`);
    assert.match(data,/data:image\/svg\+xml;charset=utf-8,/);
  }
});

test('Runner v2 movement state machine is event and distance aware',()=>{
  const controller=read('games/run/src/player/RunnerController.js');
  const animator=read('games/run/src/player/RunnerAnimator.js');
  const movement=read('games/run/src/config/movement.js');
  assert.match(controller,/jumpStartMs = MOVEMENT\.jumpStartMs/);
  assert.match(controller,/reverseFacingSpeed/);
  assert.match(animator,/runDistance/);
  assert.match(animator,/runCycleDistance/);
  assert.match(movement,/spriteScale:\s*0\.62/);
  assert.match(movement,/bodyWidth:\s*40/);
});

test('RUN Movement Lab exposes movement feedback without coupling particles to physics',()=>{
  const scene=read('games/run/src/scenes/MovementLabScene.js');
  const fx=read('games/run/src/effects/MovementFx.js');
  assert.match(scene,/event\.type === 'skid'/);
  assert.match(scene,/event\.type === 'hardLand'/);
  assert.match(scene,/keydown-H/);
  assert.match(fx,/class MovementFx/);
  assert.doesNotMatch(fx,/body\.setVelocity|setGravityY|setAcceleration/);
});
