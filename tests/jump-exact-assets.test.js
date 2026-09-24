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
 assert.match(html,/20260924-exact9/);
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

test('visual polish preserves the approved hero and doubles the gameplay backing resolution',()=>{
 const game=read('jump.js'),renderer=read('jump-exact-renderer.js'),worlds=read('jump-worlds.js');
 assert.match(game,/id="jumpCanvas" width="900" height="390"/);
 assert.match(game,/ctx\.setTransform\(2,0,0,2,0,0\)/);
 assert.doesNotMatch(renderer,/function hairMotion\(/);
 assert.match(renderer,/function particlesFor\(/);
 assert.match(renderer,/frame=1\+\(Math\.floor\(time\*13\)%2\)/);
 assert.doesNotMatch(renderer,/fillRect\(x\+5,y-3,Math\.max\(0,w-10\),1\)/);
 for(const biome of ['city','forest','desert'])assert.match(worlds,new RegExp("biome==='"+biome+"'"));
 assert.match(worlds,/Multiple snow speeds/);
});

test('city and snow use distinct new materials and effects remain visible at rest',()=>{
 const renderer=read('jump-exact-renderer.js');
 assert.match(renderer,/c\.drawImage\(img,sx,sy,sw,sh,x-2,top,w\+4,height\)/);
 assert.match(renderer,/moving\?39:13/);
 assert.match(renderer,/fxKinds=/);
 assert.match(renderer,/row\*144,112,144/);
});

test('VIP effects render behind the complete hero and all jump platforms move',()=>{
 const renderer=read('jump-exact-renderer.js'),physics=read('jump-physics.js');
 assert.ok(renderer.indexOf('particlesFor(c,x-dir*7')<renderer.indexOf('c.drawImage(tinted,col*112'));
 assert.doesNotMatch(renderer,/Distinct animated ribbons/);
 assert.match(physics,/const moving=i>=1;/);
 assert.match(physics,/if\(gp\?\.moving\)s\.x\+=platformX/);
});
