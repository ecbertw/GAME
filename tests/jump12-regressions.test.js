'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');

test('JUMP multiplayer uses interpolation and never hard-snaps live team players',()=>{
 const js=fs.readFileSync(path.join(root,'jump.js'),'utf8');
 assert.match(js,/function mergePeerSnapshots\(incoming=\[\]\)/);
 assert.match(js,/function smoothPeerViews\(dt\)/);
 assert.match(js,/renderX/);
 assert.match(js,/targetX/);
 assert.doesNotMatch(js,/Math\.abs\(dx\)>38\|\|Math\.abs\(dy\)>44/);
 assert.match(js,/local\.x\+=Math\.max\(-5,Math\.min\(5,dx\)\)\*\.08/);
 assert.match(js,/local\.time\+=Math\.max\(-\.08,Math\.min\(\.08,drift\)\)\*\.12/);
});

test('saved team cards expose READY without opening the lobby',()=>{
 const js=fs.readFileSync(path.join(root,'jump.js'),'utf8');
 assert.match(js,/data-ready-team/);
 assert.match(js,/async function quickReadyTeam\(teamId\)/);
 assert.match(js,/teamPost\('ready',\{ready:!me\?\.ready\}\)/);
 assert.match(js,/bindSavedTeamCards\(list\)/);
});

test('DUO TRIO top renders names only without ranking or VIP tags',()=>{
 const js=fs.readFileSync(path.join(root,'jump.js'),'utf8');
 const start=js.indexOf('function teamRankPlayer(p){'),end=js.indexOf('function teamRows(rows){',start),fn=js.slice(start,end);
 assert.ok(start>=0&&end>start);
 assert.doesNotMatch(fn,/rankTag\(/);
 assert.doesNotMatch(fn,/rankVip\(/);
});

test('VIP tag colours use the visible palette except white; wardrobe standard colours have names',()=>{
 const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
 assert.match(server,/tagBlocked=new Set\(\['#ffffff','#f5f7ff'\]\)/);
 assert.match(server,/tagAllowed=\[\.\.\.new Set\(\[\.\.\.normalAllowed,\.\.\.VIP_COLORS\.map/);
 const vip=fs.readFileSync(path.join(root,'vip-fix.js'),'utf8');
 assert.match(vip,/tagColors=\[\.\.\.colors\.filter/);
 assert.match(vip,/!\['#f5f7ff','#ffffff'\]/);
 const jumpServer=fs.readFileSync(path.join(root,'jump-server.js'),'utf8');
 assert.match(jumpServer,/const COLOR_LABELS=\{/);
 assert.match(jumpServer,/'#ffffff':'BRANCO'/);
 assert.match(jumpServer,/'#172b3b':'AZUL PETRÓLEO'/);
});
