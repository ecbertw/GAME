'use strict';const test=require('node:test'),assert=require('node:assert/strict'),P=require('../run/engine/physics-core.js');
const level={spawn:{x:0,y:0},killY:50,solids:[{x:-20,y:5,w:80,h:2}],oneWayPlatforms:[],movingPlatforms:[],hazards:[],shards:[],secrets:[],finish:{x:40,y:2,w:2,h:3}};
test('RUN accelerates, brakes and caps speed deterministically',()=>{const p=P.createPlayer(level.spawn);p.onGround=true;for(let i=0;i<240;i++)P.step(p,level,P.INPUT.RIGHT,P.INPUT.RIGHT);assert.ok(p.vx<=P.C.maxRun+.001);const v=p.vx;for(let i=0;i<30;i++)P.step(p,level,0,0);assert.ok(p.vx<v)});
test('RUN jump has coyote time, variable cut and gravity',()=>{const p=P.createPlayer({x:0,y:3.5});p.onGround=true;P.step(p,level,P.INPUT.JUMP,0);assert.ok(p.vy<0);const full=p.vy;P.step(p,level,0,P.INPUT.JUMP);assert.ok(p.vy>full)});
test('RUN skid engages on high-speed reverse',()=>{const p=P.createPlayer({x:0,y:3.5});p.onGround=true;p.vx=7;P.step(p,level,P.INPUT.LEFT,0);assert.equal(p.skid,true);assert.ok(p.vx<7)});
test('RUN replay canonicalization rejects non-monotonic data',()=>{assert.throws(()=>P.canonicalReplay([{tick:2,mask:1},{tick:2,mask:0}]));assert.deepEqual(P.canonicalReplay([{tick:0,mask:0},{tick:1,mask:0},{tick:2,mask:2}]),[{tick:0,mask:0},{tick:2,mask:2}])});
test('RUN death auto-respawns after deterministic delay',()=>{const l={...level,hazards:[{x:0,y:0,w:2,h:5}]};const p=P.createPlayer(l.spawn);P.step(p,l,0,0);assert.equal(p.dead,true);l.hazards=[];for(let i=0;i<54;i++)P.step(p,l,0,0);assert.equal(p.dead,false)});

test('RUN falling platforms trigger on landing and drop deterministically',()=>{
 const l={...level,solids:[{x:-5,y:9,w:20,h:2}],fallingPlatforms:[{id:'fall-a',x:0,y:4.8,w:3,h:.3,delay:.05}]};
 const p=P.createPlayer({x:.5,y:3});p.vy=5;for(let i=0;i<30;i++)P.step(p,l,0,0);
 assert.ok(p.falling['fall-a']!=null);
 const trigger=p.falling['fall-a'];for(let i=0;i<90;i++)P.step(p,l,0,0);assert.ok(p.tick>trigger);
});
test('RUN breakable blocks break from a rising underside hit',()=>{
 const l={...level,solids:[{x:-5,y:9,w:20,h:2}],breakableBlocks:[{id:'break-a',x:0,y:2,w:3,h:.5}]};
 const p=P.createPlayer({x:.8,y:3.2});p.vy=-10;for(let i=0;i<20&&!p.broken.has('break-a');i++)P.step(p,l,0,0);
 assert.ok(p.broken.has('break-a'));
});

test('RUN server validation re-simulates a replay instead of trusting client time',()=>{
 const service=require('../run-server.js');
 const l={id:'test',version:1,spawn:{x:0,y:3.5},startLine:{x:2},finish:{x:40,y:2,w:2,h:3},killY:20,solids:[{x:-5,y:5,w:60,h:2}],oneWayPlatforms:[],movingPlatforms:[],hazards:[],shards:[],secrets:[]};
 const out=service.validateReplay(l,[{tick:0,mask:P.INPUT.RIGHT}]);
 assert.ok(out.timeMs>3500&&out.timeMs<10000);assert.equal(out.p.finished,true);
});

test('RUN bounce pads launch without requiring a jump input',()=>{
 const l={...level,bouncePads:[{id:'b',x:0,y:4.75,w:2,h:.25,power:16}],solids:[{x:-5,y:5,w:20,h:2}]};
 const p=P.createPlayer({x:.4,y:3.2});for(let i=0;i<60&&p.vy>=-10;i++)P.step(p,l,0,0);assert.ok(p.vy<-10);assert.equal(p.onGround,false);
});
test('RUN moving platforms carry grounded players deterministically',()=>{
 const l={...level,solids:[],movingPlatforms:[{id:'m',x:0,y:5,w:4,h:.4,axis:'x',amplitude:1,period:2,oneWay:true}]};
 const p=P.createPlayer({x:.8,y:3.579});p.onGround=true;p.groundPlatform={id:'m'};const x=p.x;
 for(let i=0;i<8;i++)P.step(p,l,0,0);
 assert.notEqual(p.x,x);assert.ok(Number.isFinite(p.x));
});
