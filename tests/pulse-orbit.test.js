'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Orbit=require('../pulse-orbit'),Progress=require('../progression-server');

test('PULSE orbit is deterministic and verifies the exact accepted telemetry',()=>{
 const seed=18432,a=Orbit.createState(seed),b=Orbit.createState(seed);assert.deepEqual(a,b);
 const events=[];let now=0;
 for(let i=0;i<8&&!a.ended;i++){
  const distance=Math.abs(Orbit.offset(a.target,a.angle));
  now+=Math.max(160,Math.round(distance/Orbit.speed(a.score)*1000));
  const result=Orbit.hit(a,now);events.push({t:result.t,points:result.points});
 }
 const verified=Orbit.verifyRun(seed,events,a.score,now+10);
 assert.equal(verified.valid,true);assert.equal(verified.score,a.score);
 assert.equal(Orbit.verifyRun(seed,events,a.score+1,now+10).valid,false);
});

test('PULSE production assets, client and isolated score service are wired',()=>{
 const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),server=fs.readFileSync(path.join(root,'server.js'),'utf8');
 assert.ok(fs.statSync(path.join(root,'assets','game-v300','pulse-observatory.webp')).size>100000);
 assert.ok(html.indexOf('pulse-orbit.js')<html.indexOf('game.js'));
 assert.match(server,/pulseOrbitService\.initDb/);assert.match(server,/\/api\/pulse\/orbit\/scores/);
});

test('Passport levels grow predictably and progression stays server owned',()=>{
 assert.equal(Progress.levelFrom(0),1);assert.equal(Progress.levelFrom(99),1);assert.equal(Progress.levelFrom(100),2);assert.equal(Progress.levelFrom(400),3);
 const source=fs.readFileSync(path.join(__dirname,'../progression-server.js'),'utf8');
 assert.match(source,/UNIQUE\(game,run_id\)/);assert.match(source,/first-100/);assert.match(source,/skybound/);assert.match(source,/explorer/);
});

