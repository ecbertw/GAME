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
 assert.match(server,/b\.players\.size-a\.players\.size/);
 assert.match(server,/inst\.players\.size>0&&inst\.players\.size\+groupSize<=PUBLIC_CAPACITY/);
 assert.match(server,/maxPlayers:PUBLIC_CAPACITY/);
 const jump=fs.readFileSync(path.join(root,'jump.js'),'utf8');
 assert.match(jump,/lastState\?\.maxPlayers\|\|run\?\.maxPlayers\|\|20/);
});

test('friend lobby UI exposes create, join, start and leave actions',()=>{
 const jump=fs.readFileSync(path.join(root,'jump.js'),'utf8');
 for(const route of ['create','join','start','leave'])assert.match(jump,new RegExp('/api/jump/lobby/'+route));
 assert.match(jump,/l\.memberCount\+'\/5/);
});

test('JUMP VIP wardrobe adds gold pants and natural effect variants',()=>{
 const server=fs.readFileSync(path.join(root,'jump-server.js'),'utf8');
 assert.match(server,/pants:\[\.\.\.baseColors,special\('#ffd84d','DOURADO',1\)/);
 for(const fx of ['shimmer','halo','frost','ember','mist','comet','prismatic'])assert.match(server,new RegExp("special\\('"+fx+"'"));
 const jump=fs.readFileSync(path.join(root,'jump.js'),'utf8');
 assert.match(jump,/Natural VIP particles: asymmetric, short-lived visual rhythm close to the silhouette/);
 assert.match(jump,/effect==='electric'/);
 assert.match(jump,/effect==='mist'/);
 assert.match(jump,/effect==='comet'/);
});

test('README keeps exactly two update reports in descending version order',()=>{
 const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');
 const reports=readme.match(/^# EIXO V\d+\.\d+\.\d+/gm)||[];
 assert.equal(reports.length,2);
 const versions=reports.map(x=>x.match(/V(\d+)\.(\d+)\.(\d+)/).slice(1).map(Number));
 const score=v=>v[0]*1000000+v[1]*1000+v[2];
 assert.ok(score(versions[0])>score(versions[1]),'newest report must stay first');
 assert.match(readme,/apenas os dois relatórios de atualização mais recentes/);
});

test('deploy script does not reference retired JUMP team files and self-reexecs after updating itself',()=>{
 const deploy=fs.readFileSync(path.join(root,'ops/deploy/eixo-deploy.sh'),'utf8');
 assert.doesNotMatch(deploy,/jump-team-server\.js/);
 assert.match(deploy,/EIXO_DEPLOY_REEXEC/);
 assert.match(deploy,/exec env EIXO_DEPLOY_REEXEC=1 bash/);
});
