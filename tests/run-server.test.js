'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const P=require('../run/shared/physics');const R=require('../run-server');
const level={id:'tiny',version:1,engineVersion:P.VERSION,spawn:{x:0,y:.01},start:{x:.5},finish:{x:28,yMin:-4,yMax:4},killY:-5,meta:{timeTargetMs:5000},gameplay:{solids:[{id:'floor',x:-2,y:-1,w:40,h:1}],oneWayPlatforms:[],movingPlatforms:[],hazards:[],shards:[{id:'s1',x:3,y:.7}],secrets:[],checkpoints:[],splits:[]}};
test('daily challenge key is stable UTC date',()=>{assert.equal(R.dailyKey(new Date('2026-09-29T23:59:00Z')),'2026-09-29');assert.equal(R.dailyDefinition(new Date('2026-09-29T01:00:00Z')).reset,'UTC');});
test('replay validation rejects disorder and excessive durations',()=>{assert.throws(()=>R.validateReplay({totalTicks:10,events:[{tick:3},{tick:2}]}),/sequência/i);assert.throws(()=>R.validateReplay({totalTicks:999999,events:[{tick:0}]}),/duração/i);});
test('server replay simulation reproduces a valid finish and canonical stats',()=>{const replay={totalTicks:1000,events:[{tick:0,right:true,left:false,jump:false}]};const out=R.simulateReplay(level,replay);assert.ok(out.timeMs>0);assert.equal(out.state.finished,true);assert.equal(out.completion.shards,1);assert.equal(out.replay.events.length,1);});
test('same replay has identical canonical time',()=>{const replay={totalTicks:1000,events:[{tick:0,right:true,jump:false}]};assert.equal(R.simulateReplay(level,replay).timeMs,R.simulateReplay(level,replay).timeMs);});
