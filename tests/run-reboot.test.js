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
    'games/run/src/camera/RunCamera.js'
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

test('RUN runner production pack is validated and compiled into one runtime atlas',()=>{
  const manifest=JSON.parse(read('games/run/assets/runner/manifest.json'));
  const validation=JSON.parse(read('games/run/assets/runner/validation.json'));
  const atlas=JSON.parse(read('games/run/assets/runner/atlas.json'));
  assert.equal(validation.validated,true);
  assert.equal(validation.rules.paddingPx,24);
  assert.equal(Object.keys(manifest.frames).length,16);
  assert.equal(Object.keys(atlas.frames).length,16);assert.equal(atlas.cell,56);
  const atlasFile=path.join(ROOT,'games/run/assets/runner/runner-atlas.webp');
  assert.ok(fs.existsSync(atlasFile));
  assert.ok(fs.statSync(atlasFile).size>13000);
  for(const name of Object.keys(manifest.frames)){
    const margins=validation.frames[name].margins;
    assert.ok(Math.min(margins.left,margins.top,margins.right,margins.bottom)>=24,name);
    assert.ok(Number.isInteger(atlas.frames[name].index),name);
  }
});
