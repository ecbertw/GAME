'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('site uses animated ambient background instead of a pixel wall UI',()=>{
 const html=read('index.html'),js=read('redesign.js'),css=read('site-polish.css');
 assert.match(html,/site-polish\.css\?v=20260927-v311/);
 assert.doesNotMatch(html,/id="pixelWall"|background-claims\.js/);
 assert.doesNotMatch(js,/wallButton|rx-wall-open|rx-original-runner/);
 assert.match(css,/@keyframes rxAmbient/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
test('homepage and VIP visuals do not use old runner or old winter screenshot',()=>{
 const js=read('redesign.js'),css=read('site-polish.css');
 assert.match(js,/rx-community-visual/);assert.match(js,/rx-vip-showcase/);
 assert.match(css,/\.rx-hero-core/);assert.match(css,/\.rx-game-card/);
 assert.doesNotMatch(css,/snow\.webp|runner\.webp/);
});
test('Passport uses EIXO identity seal without the retired JUMP character editor',()=>{
 const js=read('redesign.js'),css=read('passport-v4.css');
 for(const id of ['rxLevel','rxExpText','rxExpBar'])assert.ok(js.includes(id),id);
 for(const badge of ['first-100','skybound','explorer'])assert.ok(js.includes(badge),badge);
 assert.match(js,/rx-passport-seal-panel/);
 assert.match(css,/\.rx-passport-seal/);
 assert.doesNotMatch(js,/rxCharacterSlot|rxCharacterFallback|EixoJumpExactArt|Editar personagem|data-rx-action="character"/);
 assert.match(js,/rx-badge-symbol/);
 assert.match(js,/rx-level-disc/);
});
test('all ranking surfaces display podium medals with fixed finishes and VIP labels',()=>{
 const css=read('site-polish.css');
 for(const file of ['ranking-fix.js','full-ranking-fix.js','jump.js']){
  const js=read(file);assert.match(js,/rank-tag medal-rank/);assert.match(js,/rank-medal-icon/);assert.doesNotMatch(js,/--rank-accent|tagGlobalColor|tagCountryColor/);assert.match(js,/vip-rank-tag/);
 }
 for(const selector of ['world-2','.world-3','.rank-medal-label'])assert.ok(css.includes(selector),selector);
});