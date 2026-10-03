'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');

test('RUN jump sound follows physical launch instead of repeated keydown',()=>{
  const fix=read('games/run/run-audio-fix.js');
  const shell=read('games/run/run-shell.js');
  const main=read('games/run/src/main.js');
  const html=read('games/run/index.html');
  assert.match(fix,/audio\.__physicalJumpGate/);
  assert.match(fix,/vy<-300&&lastVy>-240/);
  assert.match(fix,/audio\?\.confirmJump\?\.\(\)/);
  assert.match(fix,/requestAnimationFrame\(frame\)/);
  assert.match(main,/window\.EixoRunGame=new Phaser\.Game\(config\)/);
  assert.doesNotMatch(shell,/addEventListener\('keydown',[\s\S]{0,260}audio\.jump/);
  assert.ok(html.indexOf('run-audio-fix.js')>html.indexOf('run-shell.js'));
});

test('RUN exposes independent music and gameplay sound controls',()=>{
  const html=read('games/run/index.html');
  const shell=read('games/run/run-shell.js');
  const fix=read('games/run/run-audio-fix.js');
  assert.match(html,/Música do Jogo[\s\S]*id="runSiteVolume"/);
  assert.match(html,/Som do Jogo[\s\S]*id="runGameVolume"/);
  assert.match(shell,/siteGain\.gain\.value=clamp\(settings\.site\)/);
  assert.match(shell,/gameGain\.gain\.value=clamp\(settings\.game\)/);
  assert.match(fix,/setMusicVolume=v=>audio\.setSiteVolume\(v\)/);
});
