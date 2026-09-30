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

test('RUN uses the approved Runner atlas, not a procedural redraw',()=>{
  const manifest=read('games/run/src/assets/runner-manifest.js');
  const runner=read('games/run/src/player/Runner.js');
  assert.match(manifest,/approved-runner-atlas\.webp/);
  assert.match(manifest,/atlas_de_sprites_do_corredor_anime\.png/);
  assert.match(manifest,/frameWidth:\s*256/);
  assert.match(manifest,/frameHeight:\s*256/);
  assert.match(manifest,/run_01/);
  assert.match(manifest,/run_04/);
  assert.doesNotMatch(manifest,/runner-v2-data|embedded-svg-data-uri/);
  assert.match(runner,/RUNNER_FRAME_INDEX/);
  assert.ok(fs.existsSync(path.join(ROOT,'assets/run/runner/approved-runner-atlas.webp')));
});

test('RUN movement state machine remains event and distance aware',()=>{
  const controller=read('games/run/src/player/RunnerController.js');
  const animator=read('games/run/src/player/RunnerAnimator.js');
  const movement=read('games/run/src/config/movement.js');
  assert.match(controller,/jumpStartMs = MOVEMENT\.jumpStartMs/);
  assert.match(controller,/reverseFacingSpeed/);
  assert.match(animator,/runDistance/);
  assert.match(animator,/runCycleDistance/);
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
