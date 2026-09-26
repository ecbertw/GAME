'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../jump.js'),'utf8');
function lifecycle(current){
 const calls={reset:0,start:0};
 const c={current,window:{eixoRefreshRankings(){},resetGame(){calls.reset++},stopGame(){}},stopRun:async()=>{},closePanel(){},showMode(){},resetControls(){},refreshRankings:async()=>{},refreshRoomBoard(){},newRun:async()=>{calls.start++},rankTimer:null,networkTimer:null,animation:null,biome:'forest',mode:'solo',roomId:null,BIOMES:['forest'],clearInterval(){},setInterval(){return 1},requestAnimationFrame(){return 1},cancelAnimationFrame(){},loop(){},$:()=>null,document:{hidden:false},Math};
 vm.createContext(c);vm.runInContext(source.slice(source.indexOf('async function switchGame('),source.indexOf('async function stopRun(')),c);return {c,calls};
}
for(const from of ['jump','pulse'])for(const to of ['jump','pulse'])test(`viewing ${to} rankings from ${from} starts no game`,async()=>{const {c,calls}=lifecycle(from);await c.switchGame(to,{play:false});assert.equal(calls.reset,0);assert.equal(calls.start,0)});
test('opening a playable JUMP page starts exactly one run',async()=>{const {c,calls}=lifecycle('pulse');await c.switchGame('jump',{play:true});assert.equal(calls.start,1)});
test('Passport receives the actual best score with existing rank fields',async()=>{const api=require('../jump-server');const db={query:async(sql,args)=>{assert.deepEqual(args,['test-player']);return {rows:[{worldRank:'3',countryRank:'1',bestScore:'127'}]}}};assert.deepEqual(await api.playerRank(db,{id:'test-player'}),{worldRank:3,countryRank:1,bestScore:127})});

test('VIP store asks guests to sign in without requesting account data',async()=>{
 const source=fs.readFileSync(require.resolve('../paypal-checkout.js'),'utf8');let opened=0;
 const c={getPlayer:()=>null,window:{eixoOpenAuth:mode=>{assert.equal(mode,'login');opened++}},loadStore:()=>{throw Error('Guest must not load store')}};
 vm.createContext(c);vm.runInContext(source.slice(source.indexOf("async function open(mode="),source.indexOf('window.EixoVipStore=')),c);await c.open();assert.equal(opened,1);
});
