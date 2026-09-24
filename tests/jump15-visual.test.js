'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');

test('jump15 loads approved visual assets before the world and runner renderers',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const order=['jump-art-bg-city.js','jump-art-bg-forest.js','jump-art-bg-desert.js','jump-art-bg-snow.js','jump-art-runner.js','jump-art.js','jump-worlds.js','jump.js'].map(x=>html.indexOf(x));
 assert.ok(order.every(x=>x>=0),'all jump15 art scripts must be loaded');
 assert.deepEqual([...order].sort((a,b)=>a-b),order,'packed art and decoder must load before renderers');
 assert.match(html,/jump\.css\?v=20260924-jump15/);
});

test('all four approved biome packs and the semantic runner atlas are present',()=>{
 for(const biome of ['city','forest','desert','snow']){
  const src=fs.readFileSync(path.join(root,'jump-art-bg-'+biome+'.js'),'utf8');
  assert.match(src,new RegExp('backgrounds\\["'+biome+'"\\]'));
  assert.match(src,/w:\d+,h:\d+,p:\[/);
  assert.match(src,/z:"[A-Za-z0-9+/=]+"/);
 }
 const runner=fs.readFileSync(path.join(root,'jump-art-runner.js'),'utf8');
 assert.match(runner,/runnerAtlas=\{w:\d+,h:\d+,rgba:"/);
 assert.match(runner,/mask:"/);
});

test('art decoder inflates backgrounds and the semantic runner without external requests',()=>{
 const art=fs.readFileSync(path.join(root,'jump-art.js'),'utf8');
 assert.match(art,/new DecompressionStream\('deflate'\)/);
 assert.match(art,/decodeBackground/);
 assert.match(art,/decodeRunner/);
 assert.match(art,/art\.background=key=>/);
});

test('runner is atlas-driven with six animation poses and layered 2026 effects',()=>{
 const jump=fs.readFileSync(path.join(root,'jump.js'),'utf8');
 assert.match(jump,/function runnerPose\(time,motion\)/);
 assert.match(jump,/Math\.floor\(time\*9\)%2\?1:2/);
 assert.match(jump,/function tintedRunner\(pose,O,time\)/);
 assert.match(jump,/function runnerEffect\(/);
 assert.match(jump,/globalCompositeOperation='screen'/);
 assert.match(jump,/createRadialGradient/);
 assert.match(jump,/c\.ellipse\(/);
 assert.match(jump,/const target=38/);
 assert.doesNotMatch(jump,/A readable 18x31 runner silhouette/);
});

test('main JUMP canvas uses a 2x backing store while gameplay remains 450x195',()=>{
 const jump=fs.readFileSync(path.join(root,'jump.js'),'utf8');
 assert.match(jump,/id="jumpCanvas" width="900" height="390"/);
 assert.match(jump,/ctx\.setTransform\(2,0,0,2,0,0\)/);
 const physics=fs.readFileSync(path.join(root,'jump-physics.js'),'utf8');
 assert.match(physics,/W=450,H=195|W:450|const W=450/);
});

test('legacy procedural world identity is replaced by approved-art composition',()=>{
 const worlds=fs.readFileSync(path.join(root,'jump-worlds.js'),'utf8');
 assert.match(worlds,/EixoJumpArt\?\.background\?\.\(biome\)/);
 assert.match(worlds,/version:'jump15-art'/);
 assert.doesNotMatch(worlds,/landmark towers and bridges|giant natural arch|massive foreground trees/);
});
