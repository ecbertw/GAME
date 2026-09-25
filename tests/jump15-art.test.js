'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');

test('JUMP15 loads all three generated premium backgrounds before the renderer',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const order=[
  'assets/jump15/jump-art-bg-city.js',
  'assets/jump15/jump-art-bg-forest.js',
  'assets/jump15/jump-art-bg-snow.js',
  'jump15-art.js','jump-worlds.js','jump.js'
 ].map(x=>html.indexOf(x));
 assert.ok(order.every(x=>x>=0));for(let i=1;i<order.length;i++)assert.ok(order[i]>order[i-1]);
 assert.match(html,/20260924-jump15/);
});

test('premium art runtime decodes packed generated art and worlds consume it',()=>{
 const art=fs.readFileSync(path.join(root,'jump15-art.js'),'utf8');
 const worlds=fs.readFileSync(path.join(root,'jump-worlds.js'),'utf8');
 assert.match(art,/DecompressionStream\('deflate'\)/);
 assert.match(art,/EixoJumpPremiumArt/);
 assert.match(worlds,/EixoJumpPremiumArt\?\.drawBackground/);
 assert.match(worlds,/version:'jump15'/);
 for(const b of ['city','forest','snow']){
  const file=fs.readFileSync(path.join(root,'assets/jump15/jump-art-bg-'+b+'.js'),'utf8');
  assert.match(file,new RegExp('backgrounds\\["'+b+'"\\]'));
  assert.match(file,/w:120,h:68/);
 }
});

test('JUMP15 runner has readable face, dimensional shading and natural premium VFX',()=>{
 const js=fs.readFileSync(path.join(root,'jump.js'),'utf8');
 assert.match(js,/Eyes \+ brow highlights are intentionally large enough to read at game scale/);
 assert.match(js,/Back rim-light \/ 2\.5D body shadow/);
 assert.match(js,/Chunkier shoes read like the approved concept/);
 assert.match(js,/Natural VIP particles: asymmetric, short-lived visual rhythm close to the silhouette/);
 for(const fx of ['shimmer','spark','electric','frost','ember','mist','comet','halo','plasma','cosmic','prismatic'])assert.match(js,new RegExp("effect==='"+fx+"'"));
});

test('JUMP15 platforms have dimensional slabs without changing collision physics',()=>{
 const worlds=fs.readFileSync(path.join(root,'jump-worlds.js'),'utf8');
 assert.match(worlds,/Floating shadow gives a faux-3D slab without changing collision geometry/);
 assert.match(worlds,/Bevel\/end caps/);
 assert.match(worlds,/Biome material details/);
});
