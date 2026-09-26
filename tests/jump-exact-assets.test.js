'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const biomes=['forest','city','snow','astral'];

test('V3 JUMP loads its modular renderer before worlds and gameplay',()=>{
 const html=read('index.html'),names=['jump-motion.js','jump-exact-renderer.js','jump-worlds.js','jump.js'];
 const order=names.map(n=>html.indexOf(n));assert.ok(order.every(x=>x>=0));
 for(let i=1;i<order.length;i++)assert.ok(order[i]>order[i-1]);
 assert.match(html,/jump-exact-renderer\.js\?v=20260926-v300/);
});
test('each realm keeps background, platform and ground in separate editable assets',()=>{
 for(const biome of biomes)for(const prefix of ['jump','platform','ground']){
  const ext=prefix==='jump'?'webp':'png',file=path.join(root,'assets','game-v300',`${prefix}-${biome}.${ext}`);
  assert.ok(fs.statSync(file).size>100000,`missing ${prefix} module for ${biome}`);
 }
 const renderer=read('jump-exact-renderer.js');
 assert.match(renderer,/images=\{backgrounds:\{\},platforms:\{\},grounds:\{\},props:\{\},hero:null\}/);
 assert.match(renderer,/index===0\?images\.grounds\[name\]:images\.platforms\[name\]/);
});

test('animated scenery props and character body parts are independent modules',()=>{
 for(const prop of ['banner-navy','banner-copper','banner-violet','lantern-gold','lantern-ice','crystal-lamp','vines','collectible-shard'])
  assert.ok(fs.statSync(path.join(root,'assets','game-v300','prop-'+prop+'.png')).size>100000,'missing prop '+prop);
 const manifest=JSON.parse(read('assets/game-v300/hero-parts.json'));
 for(const part of ['head','torso','cape','upperArm','forearm','thigh','shin','boot'])assert.ok(manifest.parts[part]?.rect);
 const renderer=read('jump-exact-renderer.js');
 assert.match(renderer,/function cloth\(/);assert.match(renderer,/function drawWorldProps\(/);
 assert.match(renderer,/function pieceImage\(/);assert.match(renderer,/function cape\(/);
 for(const fx of ['glow','pulse','shimmer','spark','halo','frost','electric','ember','mist','plasma','comet','cosmic','prismatic'])assert.match(renderer,new RegExp(fx+':\\['));
});

test('the 16:9 world uses a 2x backing canvas and a small articulated runner',()=>{
 const game=read('jump.js'),renderer=read('jump-exact-renderer.js'),css=read('redesign.css');
 assert.match(game,/id="jumpCanvas" width="1920" height="1080"/);
 assert.match(game,/ctx\.setTransform\(2,0,0,2,0,0\)/);assert.match(css,/aspect-ratio:16\/9/);
 assert.match(renderer,/heroHeight:37/);assert.match(renderer,/Motion\.knee/);assert.match(renderer,/particlesFor\(c,movement\.state/);
});
