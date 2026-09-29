'use strict';const test=require('node:test'),assert=require('node:assert/strict'),C=require('../run/core/simulation.js');
const level={spawn:{x:0,y:5.5},killY:30,solids:[{x:-10,y:7,w:40,h:4}],oneWay:[],hazards:[]};
test('RUN vNext accelerates and caps ground speed',()=>{const p=C.createPlayer(level.spawn);p.onGround=true;let prev=0;for(let i=0;i<240;i++){C.step(p,level,C.INPUT.RIGHT,prev);prev=C.INPUT.RIGHT}assert.ok(p.vx<=C.C.maxRun+.001);assert.ok(p.vx>7.5)});
test('RUN vNext supports variable jump height',()=>{const a=C.createPlayer(level.spawn),b=C.createPlayer(level.spawn);a.onGround=b.onGround=true;C.step(a,level,C.INPUT.JUMP,0);C.step(b,level,C.INPUT.JUMP,0);C.step(a,level,0,C.INPUT.JUMP);C.step(b,level,C.INPUT.JUMP,C.INPUT.JUMP);assert.ok(a.vy>b.vy)});
test('RUN vNext enters skid on a high-speed reversal',()=>{const p=C.createPlayer(level.spawn);p.onGround=true;p.vx=7;C.step(p,level,C.INPUT.LEFT,0);assert.equal(p.skid,true);assert.ok(p.vx<7)});
test('RUN vNext respawns quickly after death',()=>{const p=C.createPlayer(level.spawn);C.kill(p);for(let i=0;i<C.C.respawnTicks;i++)C.step(p,level,0,0);assert.equal(p.dead,false)});
