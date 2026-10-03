'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');

test('RUN startup ranking uses the same EIXO name effect runtime as main rankings',()=>{
  const html=read('games/run/index.html');
  const shell=read('games/run/run-shell.js');

  assert.match(html,/\/effects-fix\.js\?v=20261003-rankeffects1/);
  assert.match(html,/\/rgb-fix\.js\?v=20261003-rankeffects1/);
  assert.match(shell,/class=\"name-letter/);
  assert.match(shell,/class=\"rank-player-name/);
  assert.match(shell,/vip-letter-styled/);
  assert.match(shell,/window\.eixoApplyNameEffects\?\.\(\)/);

  assert.doesNotMatch(shell,/runBounce|runGlow|run-name-rainbow|run-name-letter/);
});
