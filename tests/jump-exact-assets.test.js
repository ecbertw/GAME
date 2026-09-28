'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const biomes=['forest','city','snow','astral'];

test('V3 JUMP loads its modular renderer before worlds and gameplay',()=>{
 const html=read('index.html'),names=['jump-motion.js','jump-art-layout.js','jump-scenery.js','jump-exact-renderer.js','jump-worlds.js','jump.js'];
 const order=names.map(n=>html.indexOf(n));assert.ok(order.every(x=>x>=0));
 for(let i=1;i<order.length;i++)assert.ok(order[i]>order[i-1]);
 assert.match(html,/jump-exact-renderer\.js\?v=20260928-v328/);assert.doesNotMatch(html,/jump-rig\.js/);
});

test('arm atlas pivots join at the same elbow and preserve the hand beyond the wrist',()=>{
 const {upperArm,forearm}=JSON.parse(read('assets/game-v300/hero-parts.json')).parts;
 for(const part of [upperArm,forearm])for(const [x,y] of [part.pivot,part.tip]){
  assert.ok(x>=0&&x<part.rect[2]&&y>=0&&y<part.rect[3]);
 }
 assert.deepEqual(upperArm.tip.map((p,i)=>p+upperArm.rect[i]),forearm.pivot.map((p,i)=>p+forearm.rect[i]));
 assert.ok(forearm.tip[1]<forearm.rect[3]-40,'the wrist cannot use the fingertip as its pivot');
});
test('each realm keeps background, platform and ground in separate editable assets',()=>{
 for(const biome of biomes)for(const prefix of ['jump','platform','ground']){
  const ext=prefix==='jump'?'webp':'png',file=path.join(root,'assets','game-v300',`${prefix}-${biome}.${ext}`);
  assert.ok(fs.statSync(file).size>100000,`missing ${prefix} module for ${biome}`);
 }
 const renderer=read('jump-exact-renderer.js');
 assert.match(renderer,/images=\{backgrounds:\{\},platforms:\{\},grounds:\{\},props:\{\},parts:\{\},heroRun:null,heroAir:null\}/);
 assert.match(renderer,/index===0\?images\.grounds\[name\]:images\.platforms\[name\]/);
});

test('animated scenery props and character body parts are independent modules',()=>{
 for(const prop of ['banner-navy','banner-copper','banner-violet','lantern-gold','lantern-ice','crystal-lamp','vines','collectible-shard'])
  assert.ok(fs.statSync(path.join(root,'assets','game-v300','prop-'+prop+'.png')).size>100000,'missing prop '+prop);
 const manifest=JSON.parse(read('assets/game-v300/hero-parts.json'));
 for(const part of ['head','torso','cape','upperArm','forearm','thigh','shin','boot'])assert.ok(manifest.parts[part]?.rect);
 const renderer=read('jump-exact-renderer.js');
 assert.match(renderer,/function cloth\(/);assert.match(renderer,/function drawWorldProps\(/);
 assert.match(renderer,/function partImage\(/);assert.match(renderer,/function drawCape\(/);
 assert.doesNotMatch(renderer,/scarfTail|accessory==='satchel'/);
 for(const fx of ['orbit','ion','stardust','resonance','comet','aurora','quantum','eclipse','supernova','void','singularity','prism'])assert.match(renderer,new RegExp(fx+':\\['));
});

test('the 16:9 world uses a 2x backing canvas and a continuous 3D runner',()=>{
 const game=read('jump.js'),renderer=read('jump-exact-renderer.js'),three=read('jump-3d-renderer.mjs'),css=read('redesign.css');
 assert.match(game,/id="jumpCanvas" width="1920" height="1080"/);
 assert.match(game,/ctx\.setTransform\(2,0,0,2,0,0\)/);assert.match(css,/aspect-ratio:16\/9/);
 assert.match(renderer,/heroHeight:82/);assert.match(renderer,/particlesFor\(c,state/);assert.match(three,/MODEL_HEIGHT=82/);assert.match(three,/cloneSkeleton/);
});
