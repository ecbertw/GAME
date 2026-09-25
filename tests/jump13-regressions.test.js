'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');

test('audio exposes three independent buses: site music, game effects and map soundtrack',()=>{
 const audio=fs.readFileSync(path.join(root,'audio-fix.js'),'utf8');
 assert.match(audio,/const state=\{site:\.24,game:\.48,map:\.32\}/);
 assert.match(audio,/mapGain=ctx\.createGain\(\)/);
 assert.match(audio,/id="siteVolume"/);
 assert.match(audio,/id="gameVolume"/);
 assert.match(audio,/id="mapVolume"/);
 assert.match(audio,/note\(n,\.18,theme\.wave,\.011,mapGain,0\)/);
 assert.match(audio,/setMapVolume\(v\)/);
 assert.doesNotMatch(audio,/jumpBiomeName\?state\.site\*\.12:state\.site/);
});

test('PULSE and JUMP intro copy use the game names and JUMP has only the top control hint',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const jump=fs.readFileSync(path.join(root,'jump.js'),'utf8');
 assert.match(html,/<strong>PULSE<\/strong>/);
 assert.match(jump,/brand\.textContent=current==='jump'\?'JUMP'.*'PULSE'/);
 assert.match(jump,/A \/ D OU ◀ \/ ▶ PARA MOVER • W \/ ESPAÇO \/ ▲ PARA SALTAR/);
 assert.doesNotMatch(jump,/id="jumpHelp"/);
});

test('ONLINE shows one matchmaking card and does not expose a biome picker',()=>{
 const jump=fs.readFileSync(path.join(root,'jump.js'),'utf8');
 const start=jump.indexOf('function chooseWorld(){'),end=jump.indexOf('async function customize()',start),fn=jump.slice(start,end);
 assert.ok(start>=0&&end>start);
 assert.match(fn,/JOGAR ONLINE/);
 assert.match(fn,/id="jumpOnlineMatch"/);
 assert.match(fn,/newRun\(\{mode:'public'\}\)/);
 assert.doesNotMatch(fn,/matchmaking procura|Matchmaking fills/);
 assert.doesNotMatch(fn,/BIOMES\.map/);
 assert.doesNotMatch(fn,/data-biome/);
 const server=fs.readFileSync(path.join(root,'jump-server.js'),'utf8');
 assert.match(server,/function findPublicInstance\(\)/);
 assert.match(server,/const PUBLIC_CAPACITY=20/);
 assert.match(server,/b\.players\.size-a\.players\.size/);
});

test('white is removed from VIP tag choices and legacy white values normalize to defaults',()=>{
 const vip=fs.readFileSync(path.join(root,'vip-fix.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
 assert.match(vip,/colors\.filter\(\(\[v\]\)=>!\['#f5f7ff','#ffffff'\]/);
 assert.match(server,/tagBlocked=new Set\(\['#ffffff','#f5f7ff'\]\)/);
 assert.match(server,/if\(tagBlocked\.has\(tagGlobalColor\)\)tagGlobalColor='#e53935'/);
});
