'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');

test('JUMP online multiplayer uses interpolation and never hard-snaps remote players',()=>{
 const js=fs.readFileSync(path.join(root,'jump.js'),'utf8');
 assert.match(js,/function mergePeerSnapshots\(incoming=\[\]\)/);
 assert.match(js,/function smoothPeerViews\(dt\)/);
 assert.match(js,/renderX/);
 assert.match(js,/targetX/);
 assert.match(js,/velocityX/);
 assert.match(js,/snapshotAt/);
 assert.match(js,/Math\.min\(\.12/);
 assert.doesNotMatch(js,/Math\.abs\(dx\)>38\|\|Math\.abs\(dy\)>44/);
 assert.match(js,/local\.time\+=Math\.max\(-\.08,Math\.min\(\.08,drift\)\)\*\.12/);
});

test('ranking medals use fixed metal finishes; wardrobe standard colours keep their names',()=>{
 const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
 const vip=fs.readFileSync(path.join(root,'vip-fix.js'),'utf8');
 const rank=fs.readFileSync(path.join(root,'ranking-fix.js'),'utf8');
 assert.doesNotMatch(vip,/vipTagCustomize|vipGlobalTagColor|vipCountryTagColor|tagColors=/);
 assert.doesNotMatch(rank,/tagGlobalColor|tagCountryColor|--rank-accent/);
 const customize=server.slice(server.indexOf('async function customize('),server.indexOf('async function buyVip('));
 assert.doesNotMatch(customize,/data\.tagGlobalColor|data\.tagCountryColor|tagAllowed|tagBlocked/);
 const jumpServer=fs.readFileSync(path.join(root,'jump-server.js'),'utf8');
 assert.match(jumpServer,/const COLOR_LABELS=\{/);
 assert.match(jumpServer,/'#ffffff':'BRANCO'/);
 assert.match(jumpServer,/'#172b3b':'AZUL PETRÓLEO'/);
});
