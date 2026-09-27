'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');

test('orbit audio exposes isolated buses and a main-menu mixer',()=>{
 const audio=fs.readFileSync(path.join(root,'audio-fix.js'),'utf8');
 for(const channel of ['master','site','map','game','orbit','ui'])assert.match(audio,new RegExp(channel+'Volume|'+channel+':'));
 for(const id of ['siteVolume','gameVolume','mapVolume','orbitVolume','uiVolume','masterVolume'])assert.ok(audio.includes(id));
 for(const name of ['hit','perfect','miss','jumpJump','jumpLand','jumpLose','orbitTick','jumpBiome','jumpStop','mountMenu'])assert.match(audio,new RegExp('function '+name+'\\('));
 assert.match(audio,/window\.EixoAudio=\{/);
 assert.doesNotMatch(audio,/type='square'|wave:'square'/);
});

test('PULSE and JUMP intro copy use the game names and JUMP has only the top control hint',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const jump=fs.readFileSync(path.join(root,'jump.js'),'utf8');
 assert.match(html,/<strong>PULSE<\/strong>/);
 assert.match(jump,/brand\.textContent=current==='jump'\?'JUMP'.*'PULSE'/);
 assert.match(jump,/A \/ D OU ◀ \/ ▶ PARA MOVER • W \/ ESPAÇO \/ ▲ PARA SALTAR/);
 assert.doesNotMatch(jump,/id="jumpHelp"/);
});

test('JUMP exposes online matchmaking and a friend lobby without a biome picker',()=>{
 const jump=fs.readFileSync(path.join(root,'jump.js'),'utf8');
 assert.match(jump,/jumpSoloButton'\)\.textContent='ONLINE'/);
 assert.match(jump,/LOBBY DE AMIGOS/);
 assert.match(jump,/\/api\/jump\/lobby\/start/);
 assert.doesNotMatch(jump,/id="jumpRoomBiomeInput"/);
 const server=fs.readFileSync(path.join(root,'jump-server.js'),'utf8');
 assert.match(server,/function findPublicInstance\(groupSize=1\)/);
 assert.match(server,/const PUBLIC_CAPACITY=20/);
 assert.match(server,/b\.players\.size-a\.players\.size/);
});

test('ranking TAG colours cannot be edited in the VIP interface or profile endpoint',()=>{
 const vip=fs.readFileSync(path.join(root,'vip-fix.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
 const customize=server.slice(server.indexOf('async function customize('),server.indexOf('async function buyVip('));
 assert.doesNotMatch(vip,/vipGlobalTagColor|vipCountryTagColor|vipTagCustomize/);
 assert.doesNotMatch(customize,/data\.tagGlobalColor|data\.tagCountryColor|tag_global_color=\$5/);
 assert.match(customize,/letter_styles=\$4,updated_at=NOW\(\)/);
});

