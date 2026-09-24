'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const assets=['bg-city','bg-forest','bg-desert','bg-snow','runner','platform-city','platform-forest','platform-desert','platform-snow','effects'];
test('approved JUMP artwork is loaded before the renderer, physics and game',()=>{
 const html=read('index.html');
 const order=[...assets.map(n=>'assets/jump-exact/jump-exact-'+n+'.js'),'jump-exact-renderer.js','jump-worlds.js','jump.js'].map(n=>html.indexOf('src="'+n+'?'));
 assert.ok(order.every(x=>x>=0),'missing image asset or script');
 for(let i=1;i<order.length;i++)assert.ok(order[i]>order[i-1],'scripts are out of order');
 assert.match(html,/20260924-exact1/);
});
test('all four approved scenes, four transparent platform atlases, runner and VFX are real WebP artwork',()=>{
 for(const name of assets){
  const js=read('assets/jump-exact/jump-exact-'+name+'.js');
  const list=js.match(/\+\[\s*([\s\S]*?)\s*\]\.join\(""\)/);
  assert.ok(list,'encoded artwork missing: '+name);
  const parts=[...list[1].matchAll(/"([A-Za-z0-9+/=]+)"/g)].map(m=>m[1]);
  const bytes=Buffer.from(parts.join(''),'base64');
  assert.ok(bytes.length>50000,'placeholder / thumbnail instead of real artwork: '+name);
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
 }
});
test('approved sprites are active while the old renderer remains as a safe fallback',()=>{
 const game=read('jump.js'),worlds=read('jump-worlds.js'),renderer=read('jump-exact-renderer.js');
 assert.match(game,/EixoJumpExactArt\?\.runner/);
 assert.match(worlds,/EixoJumpExactArt\?\.background/);
 assert.match(worlds,/EixoJumpExactArt\?\.platform/);
 assert.match(renderer,/function recolor\(/);
 for(const fx of ['glow','pulse','shimmer','spark','halo','frost','electric','ember','mist','plasma','comet','cosmic','prismatic'])assert.match(renderer,new RegExp(fx+':\\['));
 assert.match(game,/const P=window\.EixoJumpPhysics/);
});
