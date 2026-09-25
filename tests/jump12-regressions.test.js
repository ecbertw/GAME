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
