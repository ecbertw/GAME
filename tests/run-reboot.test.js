'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
function physics(){const src=read('games/run/src/run-config.js').replace('export const RUN_PHYSICS','const RUN_PHYSICS');return Function(src+';return RUN_PHYSICS;')()}
function levels(){const src=read('games/run/src/run-levels.js').replace("import { RUN_PHYSICS } from './run-config.js';",'').replaceAll('export const ','const ').replaceAll('export function ','function ');return Function('RUN_PHYSICS',src+';return{RUN_LEVEL_COUNT,RUN_STYLE_COUNT,RUN_THEME_COUNT,getRunLevel,validateRunLevel,runLevelSignature,runChallengeProfile,jumpEnvelope};')(physics())}

test('all 900 modular levels are deterministic unique and solvable',()=>{
  const api=levels(),sigs=new Set();
  for(let i=0;i<900;i++){
    const L=api.getRunLevel(i),v=api.validateRunLevel(L);
    assert.deepEqual(api.getRunLevel(i),L);
    assert.equal(v.ok,true,'L'+(i+1)+': '+v.errors.join('; '));
    sigs.add(api.runLevelSignature(L));
    for(let j=0;j<L.route.length-1;j++)assert.equal(api.jumpEnvelope(L.route[j],L.route[j+1]).reachable,true,'L'+(i+1)+' jump '+j);
  }
  assert.equal(sigs.size,900);
});

test('spawn stays clean and challenge placement never accidentally overlaps',()=>{
  const api=levels();
  for(let i=0;i<900;i++){
    const L=api.getRunLevel(i),surfaces=new Set(),gaps=new Set();
    for(const c of L.challengeSlots){
      if(c.surface!==undefined){assert.notEqual(c.surface,0,'L'+(i+1)+' spawn challenge');assert.equal(surfaces.has(c.surface),false,'L'+(i+1)+' overlapping surface');surfaces.add(c.surface)}
      if(c.gap!==undefined){assert.notEqual(c.gap,0,'L'+(i+1)+' first-gap challenge');assert.equal(gaps.has(c.gap),false,'L'+(i+1)+' overlapping gap');gaps.add(c.gap)}
    }
  }
});

test('levels use varied challenge counts and all six module families',()=>{
  const api=levels(),profiles=new Set(),families=new Set(),styles=new Set(),themes=new Set();
  for(let i=0;i<900;i++){const L=api.getRunLevel(i);profiles.add(api.runChallengeProfile(L));styles.add(L.style);themes.add(L.theme);for(const c of L.challengeSlots)families.add(c.type)}
  assert.equal(styles.size,24);assert.equal(themes.size,8);assert.ok(profiles.size>=80,'profiles='+profiles.size);
  for(const type of ['spike','saw','laser','mover','crusher','tunnel'])assert.ok(families.has(type),type+' missing');
});

test('there are never more than two consecutive empty route pieces',()=>{
  const api=levels();
  for(let i=0;i<900;i++){
    const L=api.getRunLevel(i),ss=new Set(L.challengeSlots.filter(x=>x.surface!==undefined).map(x=>x.surface)),gg=new Set(L.challengeSlots.filter(x=>x.gap!==undefined).map(x=>x.gap));let run=0;
    for(let s=1;s<L.route.length-1;s++){run=(ss.has(s)||gg.has(s-1)||gg.has(s))?0:run+1;assert.ok(run<=2,'L'+(i+1)+' has '+run+' empty pieces')}
  }
});

test('moving platforms crushers and ceiling hazards are rendered by the scene',()=>{
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  assert.match(scene,/addMovingPlatform/);assert.match(scene,/addCrusher/);assert.match(scene,/addCeilingSpikes/);assert.match(scene,/updateDynamicPlatforms/);assert.match(scene,/type==='crusher'/);
});

test('RUN persistence and ranking rules remain intact',()=>{
  const scene=read('games/run/src/scenes/HardcoreRunScene.js'),service=read('run-server.js');
  assert.match(scene,/eixo\.run\.progress\.v1/);assert.match(scene,/localStorage\.getItem/);assert.match(scene,/localStorage\.setItem/);
  assert.match(service,/best_level DESC,rb\.best_time_ms ASC/);assert.match(service,/const RUN_LEVEL_COUNT=900/);
});


test('NEON VOID visual layer is edge-to-edge and keeps physics separate from the runner rig',()=>{
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  const main=read('games/run/src/main.js');
  const css=read('games/run/run.css');
  const html=read('games/run/index.html');
  assert.match(main,/Phaser\.Scale\.RESIZE/);
  assert.match(css,/width:100vw/);
  assert.match(css,/height:100vh/);
  assert.doesNotMatch(html,/run-header/);
  assert.match(scene,/createRunnerVisual/);
  assert.match(scene,/updateRunnerVisual/);
  assert.match(scene,/this\.player=this\.add\.rectangle\(x,y,24,38,0xffffff,0\)/);
  assert.match(scene,/movingPlatforms/);
  assert.match(scene,/NEON VOID/);
  assert.match(scene,/nv-platform/);
});


test('NEON VOID SVG asset pack is wired and speed tracks are removed',()=>{
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  const html=read('games/run/index.html');
  for(const asset of ['background.svg','platform.svg','moving-platform.svg','spikes.svg','saw.svg','laser.svg','crusher.svg','exit.svg','stopwatch.svg','skull.svg']){
    assert.ok(fs.existsSync(path.join(ROOT,'games/run/assets/neon-void',asset)),asset+' missing');
  }
  assert.match(scene,/this\.load\.svg\('nv-bg'/);
  assert.match(scene,/this\.load\.svg\('nv-platform'/);
  assert.match(scene,/this\.add\.image\(x,y,'nv-saw'\)/);
  assert.match(scene,/this\.add\.image\(x,y,'nv-crusher'\)/);
  assert.match(scene,/this\.add\.image\(x,top,'nv-exit'\)/);
  assert.doesNotMatch(scene,/speed streaks/);
  assert.doesNotMatch(scene,/const tail=18\+speed/);
  assert.match(html,/neonvoid-svg2/);
});
