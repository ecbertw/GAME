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

test('approved Runner atlas is embedded, complete and uses the correct grid',()=>{
  const manifest=read('games/run/src/assets/runner-manifest.js');
  const runner=read('games/run/src/player/Runner.js');

  assert.match(manifest,/embedded-webp-data-uri/);
  assert.match(manifest,/frameWidth:\s*128/);
  assert.match(manifest,/frameHeight:\s*128/);
  assert.match(manifest,/run_01/);
  assert.match(manifest,/run_04/);
  assert.doesNotMatch(manifest,/\/assets\/run\/runner\/approved-runner-atlas\.webp/);
  assert.doesNotMatch(manifest,/runner-v2-data|embedded-svg-data-uri/);
  assert.match(runner,/RUNNER_FRAME_INDEX/);

  const parts=Array.from({length:8},(_,i)=>{
    const file=path.join(ROOT,'games/run/src/assets/approved-runner-data',`part${i}.js`);
    assert.ok(fs.existsSync(file),`missing part${i}.js`);
    const body=fs.readFileSync(file,'utf8');
    const match=body.match(/^export default "([^"]*)";\s*$/);
    assert.ok(match,`invalid part${i}.js wrapper`);
    return match[1];
  });

  const b64=parts.join('');
  assert.equal(b64.length,72240);
  const bin=Buffer.from(b64,'base64');
  assert.equal(bin.length,54180);
  assert.equal(bin.subarray(0,4).toString('ascii'),'RIFF');
  assert.equal(bin.subarray(8,12).toString('ascii'),'WEBP');
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
  assert.match(movement,/spriteScale:\s*1\.0/);
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


test('RUN lab redirects expired admin sessions into a safe login-return flow',()=>{
  const server=read('server.js');
  const auth=read('auth-fix.js');
  assert.match(server,/auth=login&next=%2Frun-lab/);
  assert.match(server,/url\.pathname==='\/run-lab'/);
  assert.match(server,/url\.pathname\.startsWith\('\/games\/run\/'\)/);
  assert.match(auth,/next==='\/run-lab'/);
  assert.match(auth,/finishAuthNavigation/);
  assert.match(auth,/location\.replace\(returnTo\)/);
  assert.match(auth,/forcedLogin/);
});
