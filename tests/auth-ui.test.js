'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

test('guest boot never locks the whole site behind authentication',()=>{
  const game=fs.readFileSync(path.join(__dirname,'../game.js'),'utf8');
  const auth=fs.readFileSync(path.join(__dirname,'../auth-fix.js'),'utf8');
  assert.match(game,/Guests must still be able to browse\/click the site/);
  assert.match(game,/auth\.classList\.add\('hidden'\)/);
  assert.doesNotMatch(game,/else\{applyLanguage\(\);if\(window\.eixoOpenAuth\)window\.eixoOpenAuth\('login'\)/);
  assert.match(auth,/playerButton\?\.addEventListener\('click',[\s\S]*open\('login'\)/);
});
