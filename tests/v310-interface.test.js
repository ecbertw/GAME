const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('modern shell is active before legacy markup can paint',()=>{
 const html=read('index.html');
 assert.match(html,/<body class="eixo-modern eixo-booting">/);
 assert.match(html,/class="eixo-boot-screen"/);
 const css=read('redesign.css');
 assert.match(css,/\.eixo-booting>\.site-shell[^}]*visibility:hidden/);
 const js=read('redesign.js');
 assert.match(js,/classList\.remove\('eixo-booting'\)/);
});

test('passport uses the EIXO identity seal instead of the retired JUMP runner',()=>{
 const js=read('redesign.js');
 assert.match(js,/rx-passport-seal-panel/);
 assert.doesNotMatch(js,/rx-character-loading|rxCharacterFallback|EixoJumpExactArt|data-rx-action="character"/);
});

test('contemporary interface covers every requested surface',()=>{
 const css=read('redesign.css');
 for(const selector of ['.rx-hero','.rx-vip-hero','.vip-customize-modal','.jump-custom-preview','.acct-card','.admin-card'])assert.ok(css.includes(selector),selector);
 assert.match(read('package.json'),/"version": "3\.1\.0"/);
});
