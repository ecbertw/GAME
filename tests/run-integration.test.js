'use strict';const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('RUN follows fixed 2D sprite / 2.5D Astral production direction',()=>{const sprite=read('run/player/sprite-runner.mjs'),renderer=read('run/rendering/astral-renderer.mjs'),manifest=read('run/player/runner-manifest.mjs');for(const s of [sprite,renderer,manifest])assert.doesNotMatch(s,/AnimationMixer|GLTFLoader|jump-rig|EixoJumpExactArt/);assert.match(manifest,/fixedOutfit:true/);assert.match(manifest,/rig3d:false/);for(const s of ['idle','run','skid','jumpStart','jump','apex','fall','land','death','victory'])assert.match(manifest,new RegExp(s+':'));assert.match(renderer,/moon|ruins|shard|checkpoint|hazard/i);assert.match(renderer,/sanctum/);assert.match(renderer,/foreground/);assert.match(renderer,/secretGrotto/);assert.match(renderer,/routeArch/)});
test('RUN page exposes First Light and game HUD',()=>{const h=read('run/index.html');assert.match(h,/FIRST LIGHT/);assert.match(h,/runShards/);assert.match(h,/EIXO RUN/);});
test('RUN modules parse',()=>{const cp=require('node:child_process');for(const f of ['run/run-client.mjs','run/input/input.mjs','run/camera/camera.mjs','run/player/runner-manifest.mjs','run/player/sprite-runner.mjs','run/rendering/astral-renderer.mjs','run/replay/recorder.mjs','run/audio/audio.mjs']){const x=cp.spawnSync(process.execPath,['--check',path.join(root,f)],{encoding:'utf8'});assert.equal(x.status,0,f+' '+x.stderr)}});
test('RUN competitive meta includes 100 percent, Daily, Echoes and server-owned Passport rewards',()=>{
 const server=read('run-server.js'),app=read('server.js'),client=read('run/run-client.mjs'),html=read('run/index.html');
 assert.match(server,/run_astral_scores_100/);assert.match(server,/run_astral_daily_scores/);assert.doesNotMatch(server,/\brun_scores\b/);assert.doesNotMatch(server,/\brun_daily_scores\b/);assert.match(server,/streakFor/);assert.match(server,/async function echo/);
 assert.match(app,/\/api\/run\/daily/);assert.match(app,/awardFixed/);assert.match(app,/run-daily/);
 assert.match(client,/dailyMode/);assert.match(client,/PB ECHO|pbEcho/);assert.match(client,/WORLD ECHO|worldEcho/);
 assert.match(html,/BEST TIME/);assert.match(html,/>100%</);assert.match(html,/data-rank-category="daily"/);
});
test('First Light secret route carries three secret Shards and an Astral lift back toward the main path',()=>{
 const level=require('../run/levels/astral-first-light.js');
 assert.equal(level.shards.filter(x=>String(x.id).startsWith('secret')).length,3);
 assert.ok(level.secrets.some(x=>x.id==='secret-grotto'));
 assert.ok(level.movingPlatforms.some(x=>x.id==='secret-lift'));
});
