'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('community home hero no longer duplicates JUMP and has a platform slogan',()=>{
 const js=read('redesign.js'),css=read('interface-v5.css');
 assert.match(js,/PLAY\. CONNECT\. EVOLVE\./);
 assert.match(js,/There is always more/);
 assert.match(js,/rx-community-visual/);
 assert.doesNotMatch(js,/Your next leap/);
 assert.match(css,/rx-community-core/);
});

test('Passport localizes its label, uses a flag and shows rank/VIP tags next to the larger player name',()=>{
 const js=read('redesign.js'),css=read('interface-v5.css');
 assert.match(js,/passportWords=\{/);
 for(const pair of ["pt:'Passaporte'","en:'Passport'","es:'Pasaporte'","fr:'Passeport'","de:'Reisepass'"])assert.ok(js.includes(pair),pair);
 assert.match(js,/const flag=code/);
 assert.match(js,/rxPassportTags/);
 assert.match(js,/passportRankTag/);
 assert.match(js,/passportVipTag/);
 assert.match(css,/rx-passport-name-row #rxProfileName/);
 assert.match(css,/rx-passport-flag/);
});

test('ranking medals are compact without accent outlines and ranking-page names are larger',()=>{
 const css=read('interface-v5.css');
 assert.match(css,/width:20px!important/);
 assert.match(css,/country-1/);
 assert.match(css,/::after\{display:none!important\}/);
 assert.match(css,/data-page=rankings.*rank-player-name/);
});

test('VIP menus, VIP modal and VIP pricing use the modern interface',()=>{
 const css=read('interface-v5.css'),vip=read('vip-fix.js');
 assert.match(css,/vip-top-button/);
 assert.match(css,/vip-top-menu/);
 assert.match(css,/vip-submenu/);
 assert.match(css,/vip-store-level strong/);
 assert.match(css,/vip-store-level span/);
 assert.match(vip,/vip-rank-tag vip-medal/);
 assert.match(vip,/vip-status-center/);
});

test('game intro instructions are removed visually and responsive rules cover narrow screens',()=>{
 const css=read('interface-v5.css');
 assert.match(css,/data-page=jump.*game-intro/);
 assert.match(css,/data-page=pulse.*game-intro/);
 for(const bp of ['900px','620px','390px'])assert.ok(css.includes(bp),bp);
 assert.match(css,/overflow-x:hidden/);
});
