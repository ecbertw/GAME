'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('JUMP runner uses individually loaded HD parts and continuous skeleton without touching gameplay physics',()=>{
 const motion=read('jump-motion.js'),renderer=read('jump-exact-renderer.js'),physics=read('jump-physics.js');
 assert.match(motion,/const STRIDE_DISTANCE=112,PREVIEW_SPEED=216/);
 for(const key of ['RUN_LEG','RUN_ARM','AIR','sampleLeg','sampleArm','sampleAir','landing:land'])assert.ok(motion.includes(key),key);
 assert.match(renderer,/version:'eixo-runner-v8-rig'/);
 assert.doesNotMatch(renderer,/hero-v7-run|hero-v7-air|sheet\.width\/count/);assert.match(renderer,/EixoJumpRig\.pose/);assert.match(renderer,/imageSmoothingQuality='high'/);
 assert.doesNotMatch(physics,/RUN_LEG|RUN_ARM|sampleAir|footAngle/);
});

test('JUMP effects V2 are orbit-led, tiered and migrate legacy selections',()=>{
 const server=read('jump-server.js'),renderer=read('jump-exact-renderer.js'),doc=read('docs/jump-effects-v2.md');
 for(const fx of ['orbit','ion','stardust','resonance','comet','aurora','quantum','eclipse','supernova','void','singularity','prism']){
  assert.ok(server.includes("special('"+fx+"'"),fx+' wardrobe');
  assert.ok(renderer.includes(fx),fx+' renderer');
  assert.ok(doc.toLowerCase().includes(fx),fx+' docs');
 }
 assert.match(server,/const LEGACY_EFFECTS=\{/);
 assert.match(server,/glow:'orbit'/);assert.match(server,/prismatic:'prism'/);
 assert.doesNotMatch(server,/BRILHO SUAVE|AURA RESPIRANTE|ELETRICIDADE|AURA CÓSMICA/);
});

test('ADMIN remains functional but has no public visual tag',()=>{
 const ui=read('ui.js'),chat=read('chat.js'),server=read('server.js');
 assert.doesNotMatch(ui,/\[ADMIN\]/);
 assert.doesNotMatch(chat,/role-tag admin|>ADMIN<\/span>/);
 assert.match(ui,/data-action="admin"/);
 assert.match(server,/function requireAdmin/);
 assert.match(chat,/me\?\.role==='admin'/);
});

test('one earned achievement can be featured between rank and VIP tags everywhere',()=>{
 const progression=read('progression-server.js'),server=read('server.js'),passport=read('redesign.js'),rank=read('ranking-fix.js'),full=read('full-ranking-fix.js'),jump=read('jump.js'),chat=read('chat.js');
 assert.match(progression,/featured_badge/);assert.match(progression,/async function equipBadge/);
 assert.match(progression,/SELECT 1 FROM player_badges WHERE player_id=\$1 AND badge=\$2/);
 assert.match(server,/\/api\/passport\/badge/);
 assert.match(passport,/achievementTag|passportAchievementTag/);
 assert.match(passport,/featured=data\.featuredBadge/);
 assert.match(passport,/rx-achievement\.is-featured|classList\.toggle\('is-featured'/);
 assert.match(passport,/passportRanks\+passportAchievementTag\(featured\)\+passportVipTag/);
 assert.match(rank,/tags\}\$\{achievementTag\(p\.featuredBadge\)\}\$\{vipTag/);
 assert.match(full,/achievementTag\(x\.featuredBadge\)/);
 assert.match(jump,/achievementTag\(p\.featuredBadge\)/);
 assert.match(chat,/achievementTag\(m\.featuredBadge\)\+vip/);
});

test('PULSE orbit sound is armed while the ball visibly rotates, including idle mode',()=>{
 const html=read('index.html'),game=read('game.js'),audio=read('audio-fix.js');
 assert.ok(html.indexOf('audio-fix.js?v=20260927-v316')<html.indexOf('game.js?v=20260927-v316'));
 assert.match(game,/running\?Orbit\.speed\(orbitState\.score\):1\.15/);
 assert.match(game,/resizeCanvas\(\);window\.EixoAudio\?\.orbitStart\?\.\(\);window\.EixoAudio\?\.resume\?\.\(\);scheduleOrbit/);
 assert.match(audio,/function orbitStart\(\)\{if\(pulseActive\)return/);
 assert.match(audio,/orbit:\.34/);
});
