'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');

test('DUO/TRIO implementation is fully retired from the active JUMP surface',()=>{
 const jump=fs.readFileSync(path.join(root,'jump.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
 const css=fs.readFileSync(path.join(root,'jump.css'),'utf8');
 assert.equal(fs.existsSync(path.join(root,'jump-team-server.js')),false);
 assert.doesNotMatch(jump,/jumpDuoButton|jumpTrioButton|\/api\/jump\/teams\/|jumpTeam/);
 assert.doesNotMatch(server,/\/api\/jump\/teams\//);
 assert.doesNotMatch(css,/jump-team|jumpTeam|jumpDuo|jumpTrio/);
});

test('JUMP migrates retired team persistence away',()=>{
 const server=fs.readFileSync(path.join(root,'jump-server.js'),'utf8');
 for(const table of ['jump_team_members','jump_team_scores','jump_teams'])assert.match(server,new RegExp("DROP TABLE IF EXISTS "+table));
});

test('ONLINE uses one sequential public lobby with capacity 20',()=>{
 const server=fs.readFileSync(path.join(root,'jump-server.js'),'utf8');
 assert.match(server,/const PUBLIC_CAPACITY=20/);
 assert.match(server,/let publicLobbyId=null/);
 assert.match(server,/publicLobbyId&&instances\.get\(publicLobbyId\)/);
 assert.match(server,/current\.players\.size<PUBLIC_CAPACITY/);
 assert.match(server,/maxPlayers:run\.kind==='public'\?PUBLIC_CAPACITY:5/);
 const jump=fs.readFileSync(path.join(root,'jump.js'),'utf8');
 assert.match(jump,/lastState\?\.maxPlayers\|\|run\?\.maxPlayers\|\|20/);
});

test('ONLINE modal contains one play card without internal matchmaking explanation',()=>{
 const jump=fs.readFileSync(path.join(root,'jump.js'),'utf8');
 const start=jump.indexOf('function chooseWorld(){'),end=jump.indexOf('async function customize()',start),fn=jump.slice(start,end);
 assert.match(fn,/id="jumpOnlineMatch"/);
 assert.doesNotMatch(fn,/matchmaking procura|Matchmaking fills|Só cria outra|new one opens/);
});

test('JUMP VIP wardrobe adds gold pants and natural effect variants',()=>{
 const server=fs.readFileSync(path.join(root,'jump-server.js'),'utf8');
 assert.match(server,/pants:\[\.\.\.baseColors,special\('#ffd84d','DOURADO',1\)/);
 for(const fx of ['shimmer','halo','frost','ember','mist','comet','prismatic'])assert.match(server,new RegExp("special\\('"+fx+"'"));
 const jump=fs.readFileSync(path.join(root,'jump.js'),'utf8');
 assert.match(jump,/Cosmetic particles stay close to the runner instead of orbiting like props/);
 assert.match(jump,/effect==='electric'/);
 assert.match(jump,/effect==='mist'/);
 assert.match(jump,/effect==='comet'/);
});

test('README keeps exactly the two latest update reports',()=>{
 const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');
 const reports=readme.match(/^# EIXO V\d+\.\d+\.\d+/gm)||[];
 assert.deepEqual(reports,['# EIXO V2.3.1','# EIXO V2.3.0']);
 assert.match(readme,/apenas os dois relatórios de atualização mais recentes/);
});

test('deploy script does not reference retired JUMP team files',()=>{
 const deploy=fs.readFileSync(path.join(root,'ops/deploy/eixo-deploy.sh'),'utf8');
 assert.doesNotMatch(deploy,/jump-team-server\.js/);
});
