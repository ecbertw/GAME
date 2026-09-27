'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('Passport is a single digital document with four real achievement keys and live score fields',()=>{
 const source=read('redesign.js');
 const line=source.split('\n').find(x=>x.trimStart().startsWith('views.passport.innerHTML='));
 assert.ok(line);
 const views={passport:{innerHTML:''}};
 new Function('views','t','passportWord',line)(views,(pt,en)=>pt,()=> 'Passaporte');
 const html=views.passport.innerHTML;
 for(const id of ['rxCharacterSlot','rxCharacterFallback','rxProfileName','rxJumpBest','rxPulseBest','rxVipLevel','rxLevel','rxExpBar','rxExpText','rxPassportNumber','rxPassportTags','rxPassportTotalXp','rxPassportRemaining','rxPassportBadgeCount','rxProfileStatus'])
  assert.match(html,new RegExp('id="'+id+'"'),id);
 assert.equal((html.match(/class="rx-achievement/g)||[]).length,4);
 for(const badge of ['first-100','skybound','explorer','pulse-10'])assert.match(html,new RegExp('data-badge="'+badge+'"'));
 assert.match(html,/rx-passport-document/);
 assert.match(source,/data\.totalExp/);
 assert.match(source,/rxPassportBadgeCount/);
});

test('Passport character uses the wardrobe runner in moving preview mode and stops on leaving',()=>{
 const source=read('redesign.js');
 const wardrobe=read('jump.js');
 assert.match(wardrobe,/moving:true,preview:true,identity:"wardrobe"/);
 assert.match(source,/moving:true,preview:true,identity:'passport-live'/);
 assert.match(source,/await window\.EixoJumpExactArt\.ready/);
 assert.match(source,/cancelAnimationFrame\(characterFrame\)/);
 assert.match(source,/imageSmoothingEnabled=false/);
});

test('Global and national podium medals are distinct and contain no visible label text',()=>{
 const css=read('passport-v4.css');
 for(const file of ['jump.js','ranking-fix.js','full-ranking-fix.js']){
  const js=read(file);
  assert.match(js,/rank-medal-number/);
  assert.match(js,/aria-label/);
  assert.doesNotMatch(js,/rank-medal-label/);
  assert.doesNotMatch(js,/--rank-accent|tagGlobalColor|tagCountryColor/);
  assert.match(js,/vip-medal/);
  for(const tier of ['◆','✧','✦','♛','★','∞'])assert.ok(js.includes(tier),file+' '+tier);
 }
 assert.match(css,/\.country-1/);
 assert.match(css,/\.world-1/);
 assert.match(css,/clip-path:polygon\(50% 0,95% 21%/);
 assert.match(css,/\.vip-rank-6/);
});

test('Brand assets, versioned CSS, favicon, and VIP card showcase are connected',()=>{
 const html=read('index.html'),source=read('redesign.js');
 assert.match(html,/passport-v4\.css\?v=20260927-v312/);
 assert.match(html,/favicon\.svg\?v=20260927-v312/);
 assert.match(html,/eixo-logo\.svg\?v=20260927-v312/);
 assert.match(source,/rx-vip-pass-front/);
 const logo=read('eixo-logo.svg'),favicon=read('favicon.svg');
 assert.match(logo,/viewBox="0 0 132 44"/);
 assert.match(favicon,/viewBox="0 0 64 64"/);
 assert.match(logo,/#ff435d/);
 assert.match(favicon,/#ff435d/);
 assert.match(read('passport-v4.css'),/prefers-reduced-motion:reduce/);
});
