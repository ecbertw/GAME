'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
function physics(){const src=read('games/run/src/run-config.js').replace('export const RUN_PHYSICS','const RUN_PHYSICS');return Function(src+';return RUN_PHYSICS;')()}
function levels(){const src=read('games/run/src/run-levels.js').replace("import { RUN_PHYSICS } from './run-config.js';",'').replaceAll('export const ','const ').replaceAll('export function ','function ');return Function('RUN_PHYSICS',src+';return{RUN_LEVEL_COUNT,RUN_STYLE_COUNT,RUN_THEME_COUNT,getRunLevel,validateRunLevel,runLevelSignature,runChallengeProfile,jumpEnvelope};')(physics())}

test('all 100 hardcore levels are deterministic unique and solvable',()=>{
  const api=levels(),sigs=new Set();
  for(let i=0;i<100;i++){
    const L=api.getRunLevel(i),v=api.validateRunLevel(L);
    assert.deepEqual(api.getRunLevel(i),L);
    assert.equal(v.ok,true,'L'+(i+1)+': '+v.errors.join('; '));
    sigs.add(api.runLevelSignature(L));
    for(let j=0;j<L.route.length-1;j++)assert.equal(api.jumpEnvelope(L.route[j],L.route[j+1]).reachable,true,'L'+(i+1)+' jump '+j);
  }
  assert.equal(sigs.size,100);
});

test('spawn stays clean and challenge placement never accidentally overlaps',()=>{
  const api=levels();
  for(let i=0;i<100;i++){
    const L=api.getRunLevel(i),surfaces=new Set(),gaps=new Set();
    for(const c of L.challengeSlots){
      if(c.surface!==undefined){assert.notEqual(c.surface,0,'L'+(i+1)+' spawn challenge');assert.equal(surfaces.has(c.surface),false,'L'+(i+1)+' overlapping surface');surfaces.add(c.surface)}
      if(c.gap!==undefined){assert.notEqual(c.gap,0,'L'+(i+1)+' first-gap challenge');assert.equal(gaps.has(c.gap),false,'L'+(i+1)+' overlapping gap');gaps.add(c.gap)}
    }
  }
});

test('levels use varied challenge counts and all eight module families',()=>{
  const api=levels(),profiles=new Set(),families=new Set(),styles=new Set(),themes=new Set();
  for(let i=0;i<100;i++){const L=api.getRunLevel(i);profiles.add(api.runChallengeProfile(L));styles.add(L.style);themes.add(L.theme);for(const c of L.challengeSlots)families.add(c.type)}
  assert.equal(styles.size,24);assert.equal(themes.size,8);assert.ok(profiles.size>=80,'profiles='+profiles.size);
  for(const type of ['spike','saw','laser','mover','crusher','tunnel','swingLaser','pulseFloor'])assert.ok(families.has(type),type+' missing');
});

test('there are never more than two consecutive empty route pieces',()=>{
  const api=levels();
  for(let i=0;i<100;i++){
    const L=api.getRunLevel(i),ss=new Set(L.challengeSlots.filter(x=>x.surface!==undefined).map(x=>x.surface)),gg=new Set(L.challengeSlots.filter(x=>x.gap!==undefined).map(x=>x.gap));let run=0;
    for(let s=1;s<L.route.length-1;s++){run=(ss.has(s)||gg.has(s-1)||gg.has(s))?0:run+1;assert.ok(run<=2,'L'+(i+1)+' has '+run+' empty pieces')}
  }
});

test('moving platforms crushers and ceiling hazards are rendered by the scene',()=>{
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  assert.match(scene,/addMovingPlatform/);assert.match(scene,/addCrusher/);assert.match(scene,/addCeilingPlatform/);assert.match(scene,/addCeilingSpikes/);assert.match(scene,/addSwingLaser/);assert.match(scene,/addPulseFloor/);assert.match(scene,/updateDynamicPlatforms/);assert.match(scene,/type==='crusher'/);assert.match(scene,/type==='swingLaser'/);assert.match(scene,/type==='pulseFloor'/);
});

test('RUN persistence and ranking rules remain intact',()=>{
  const scene=read('games/run/src/scenes/HardcoreRunScene.js'),service=read('run-server.js');
  assert.match(scene,/eixo\.run\.progress\.v1/);assert.match(scene,/localStorage\.getItem/);assert.match(scene,/localStorage\.setItem/);
  assert.match(service,/best_level DESC,rb\.best_time_ms ASC/);assert.match(service,/const RUN_LEVEL_COUNT=100/);
});


test('NEON VOID visual layer is edge-to-edge and keeps physics separate from the runner rig',()=>{
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  const main=read('games/run/src/main.js');
  const css=read('games/run/run.css');
  const html=read('games/run/index.html');
  assert.match(main,/Phaser\.Scale\.RESIZE/);
  assert.match(css,/\.run-stage\{[\s\S]*position:fixed;left:0;right:0;top:76px;bottom:0/);
  assert.match(css,/#run-root\{position:absolute;inset:0;z-index:1;overflow:hidden;background:transparent\}/);
  assert.match(html,/class="run-site-nav"/);
  assert.match(html,/eixo-logo\.svg/);
  assert.match(html,/href="\/passport">Passaporte/);
  assert.match(html,/href="\/rankings">Rankings/);
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
  for(const asset of ['background.svg','platform.svg','moving-platform.svg','spikes.svg','saw.svg','laser.svg','swing-laser.svg','crusher.svg','exit.svg','stopwatch.svg','skull.svg']){
    assert.ok(fs.existsSync(path.join(ROOT,'games/run/assets/neon-void',asset)),asset+' missing');
  }
  assert.match(scene,/this\.load\.svg\('nv-bg'/);
  assert.match(scene,/this\.load\.svg\('nv-platform'/);
  assert.match(scene,/this\.add\.image\(x,y,'nv-saw'\)/);
  assert.match(scene,/this\.add\.image\(x,y,'nv-crusher'\)/);
  assert.match(scene,/this\.add\.image\(x,top,'nv-exit'\)/);
  assert.doesNotMatch(scene,/speed streaks/);
  assert.doesNotMatch(scene,/const tail=18\+speed/);
  assert.match(html,/20261001-runfix3/);
});


test('retired RUN lab routes and old public JUMP route no longer expose separate games',()=>{
  const server=read('server.js');
  assert.match(server,/\['\/run-lab','\/run-admin','\/run-lab\/admin','\/jump'\]/);
  assert.match(server,/Location:'\/run'/);
  assert.equal(fs.existsSync(path.join(ROOT,'games/run/admin.html')),false);
  assert.equal(fs.existsSync(path.join(ROOT,'games/run/src/admin-main.js')),false);
});

test('public EIXO presentation promotes RUN and PULSE instead of old JUMP',()=>{
  const home=read('redesign.js');
  const jumpShell=read('jump.js');
  assert.match(home,/<h2>RUN<\/h2>/);
  assert.match(home,/href="\/run"/);
  assert.ok(home.includes("RUN / '+t('NÍVEL','LEVEL')+'"));
  assert.match(jumpShell,/data-game="run">RUN/);
  assert.doesNotMatch(jumpShell,/data-game="jump">JUMP/);
});


test('spike artwork is flush with floor and ceiling surfaces',()=>{
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  const spikes=read('games/run/assets/neon-void/spikes.svg');
  assert.match(scene,/for\(const c of L\.ceilings\|\|\[\]\) this\.addCeilingPlatform/);
  assert.match(scene,/addCeilingPlatform\(x,y,w,h\)/);
  assert.match(scene,/this\.add\.image\(x,top,'nv-spikes'\)\s*\.setOrigin\(\.5,1\)/);
  assert.match(scene,/this\.add\.image\(x,bottom,'nv-spikes'\)\s*\.setOrigin\(\.5,0\)\s*\.setFlipY\(true\)/);
  assert.doesNotMatch(scene,/baselineOffset/);
  assert.match(spikes,/M0 44H320/);
  assert.match(spikes,/M0 44L10 5/);
});


test('moving platforms use stable sinusoidal dynamic physics and the runner idles while riding',()=>{
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  assert.match(scene,/const visualOffsetY=3/);
  assert.match(scene,/r\.body\.setAllowGravity\(false\)/);
  assert.match(scene,/r\.body\.setImmovable\(true\)/);
  assert.match(scene,/const idealSpeed=cosine\*/);
  assert.match(scene,/Phaser\.Math\.Clamp\(idealSpeed\+errX\*5,-300,300\)/);
  assert.match(scene,/this\.ridingPlatform=riding/);
  assert.match(scene,/grounded=b\.blocked\.down\|\|b\.touching\.down\|\|!!this\.ridingPlatform/);
  assert.match(scene,/inputMoving/);
});

test('new timed hazards are validated and rendered',()=>{
  const levels=read('games/run/src/run-levels.js');
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  assert.match(levels,/addSwingLaser/);
  assert.match(levels,/addPulseFloor/);
  assert.match(levels,/period\*\.45<m\.requiredOff/);
  assert.match(levels,/period\*\.44<m\.requiredOff/);
  assert.match(scene,/this\.load\.svg\('nv-swing-laser'/);
  assert.match(scene,/addSwingLaser\(spec\)/);
  assert.match(scene,/addPulseFloor\(spec\)/);
});


test('RUN start overlay and HUD are DOM-centered and the initial runner is restored',()=>{
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  const html=read('games/run/index.html');
  const css=read('games/run/run.css');
  const main=read('games/run/src/main.js');
  assert.match(html,/id="run-start-overlay"/);
  assert.match(html,/id="run-start-ranking"/);
  assert.match(css,/display:flex;align-items:center;justify-content:center/);
  assert.match(css,/background-image:[\s\S]*background\.svg/);
  assert.match(main,/transparent: true/);
  assert.match(html,/id="run-game-hud"/);
  assert.match(html,/id="run-hud-deaths"/);
  assert.match(scene,/c\.glowGraphics=glow/);
  assert.match(scene,/g\.fillStyle\(C\.player,1\)\.fillCircle/);
});


test('DOM start overlay does not use Phaser camera coordinates',()=>{
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  const start=scene.slice(scene.indexOf('  createStartOverlay(){'),scene.indexOf('  queueJump(){'));
  assert.match(start,/getElementById\('run-start-overlay'\)/);
  assert.doesNotMatch(start,/this\.add\.rectangle/);
  assert.doesNotMatch(start,/uiCenterX/);
});


test('completed levels can be retried before moving on',()=>{
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  const service=read('run-server.js');
  const html=read('games/run/index.html');
  assert.match(html,/id="run-clear-retry"/);
  assert.match(html,/id="run-clear-next"/);
  assert.match(scene,/retryClearedLevel\(\)/);
  assert.match(scene,/nextAfterClear\(\)/);
  assert.match(scene,/this\.awaitingClearChoice=true/);
  assert.match(service,/const isRetry=level===completedLevel/);
});

test('100-level generator is hardcore from level one',()=>{
  const api=levels();
  let minChallenges=999,minFamilies=999,maxEmpty=0;
  for(let i=0;i<100;i++){
    const L=api.getRunLevel(i);
    minChallenges=Math.min(minChallenges,L.challengeSlots.length);
    minFamilies=Math.min(minFamilies,new Set(L.challengeSlots.map(x=>x.type)).size);
    const ss=new Set(L.challengeSlots.filter(x=>x.surface!==undefined).map(x=>x.surface));
    const gg=new Set(L.challengeSlots.filter(x=>x.gap!==undefined).map(x=>x.gap));
    let empty=0;
    for(let j=1;j<L.route.length-1;j++){empty=(ss.has(j)||gg.has(j-1)||gg.has(j))?0:empty+1;maxEmpty=Math.max(maxEmpty,empty);}
  }
  assert.ok(minChallenges>=9,'min challenges '+minChallenges);
  assert.ok(minFamilies>=3,'min families '+minFamilies);
  assert.ok(maxEmpty<=1,'max empty '+maxEmpty);
});


test('level selector unlocks completed levels and preserves per-level PBs',()=>{
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  const html=read('games/run/index.html');
  const css=read('games/run/run.css');
  const server=read('server.js');
  const service=read('run-server.js');

  assert.match(html,/id="run-open-levels"/);
  assert.match(html,/id="run-level-overlay"/);
  assert.match(html,/id="run-level-grid"/);
  assert.match(html,/id="run-clear-levels"/);
  assert.match(scene,/selectLevel\(level\)/);
  assert.match(scene,/refreshLevelStatus\(\)/);
  assert.match(scene,/RUN_LEVEL_BESTS_KEY/);
  assert.match(scene,/Math\.max\(current,Math\.floor\(Number\(level\)\|\|1\)\)/);
  assert.match(scene,/body:JSON\.stringify\(\{level:requested\}\)/);
  assert.match(css,/background-position:center center,center clamp\(72px,10vh,118px\)/);
  assert.match(server,/url\.pathname==='\/api\/run\/levels'/);
  assert.match(service,/CREATE TABLE IF NOT EXISTS run_level_bests/);
  assert.match(service,/async function levelStatus/);
  assert.match(service,/RUN level is locked/);
});

test('replaying an older RUN level does not replace highest overall progress',()=>{
  const service=read('run-server.js');
  assert.match(service,/level>Number\(old\.best_level\|\|0\)\|\|\(level===Number\(old\.best_level\|\|0\)&&timeMs<Number\(old\.best_time_ms\)\)/);
  assert.match(service,/isLevelPersonalBest/);
  assert.match(service,/best_level DESC,rb\.best_time_ms ASC/);
});


test('detailed Neon Void background fills the full RUN playfield',()=>{
  const bg=read('games/run/assets/neon-void/background.svg');
  const css=read('games/run/run.css');
  assert.match(bg,/id="far-city"/);
  assert.match(bg,/id="mid-city"/);
  assert.match(bg,/id="foreground"/);
  assert.match(bg,/M0 1080V430/);
  assert.match(bg,/M1840 1080V868/);
  assert.match(bg,/M0 728H1920M0 824H1920M0 930H1920M0 1028H1920/);
  assert.match(bg,/radialGradient id="planet"/);
  assert.match(bg,/filter id="glowBlue"/);
  assert.match(bg,/filter id="glowRed"/);
  assert.match(css,/background\.svg\?v=20261001-bgdetail2/);
});


test('transient RUN notices are DOM-centered instead of camera-positioned',()=>{
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  const html=read('games/run/index.html');
  const css=read('games/run/run.css');

  assert.match(html,/id="run-notice-overlay"/);
  assert.match(html,/id="run-notice-title"/);
  assert.match(scene,/createNoticeOverlay\(\)/);
  assert.match(scene,/showCenteredNotice\(\{/);
  assert.match(scene,/title:manual\?'RESTART':'DEAD'/);

  assert.match(css,/\.run-notice-inner\{position:absolute;left:50%;top:50%;transform:translate\(-50%,-50%\)/);

  const death=scene.slice(scene.indexOf('  killPlayer(manual){'),scene.indexOf('  async completeLevel(){'));
  assert.doesNotMatch(death,/this\.add\.text/);

  const card=scene.slice(scene.indexOf('  showLevelCard(index,name){'),scene.indexOf('  killPlayer(manual){'));
  assert.doesNotMatch(card,/uiCenterX/);
  assert.doesNotMatch(card,/this\.add\.text/);
});


test('RUN shell matches the EIXO site visual language',()=>{
  const html=read('games/run/index.html');
  const css=read('games/run/run.css');
  assert.match(html,/class="run-site-brand"[\s\S]*eixo-logo\.svg/);
  assert.match(html,/01 \/ ARCADE/);
  assert.match(html,/100 níveis hardcore/);
  assert.match(css,/\.run-start-card\{[\s\S]*border-radius:28px/);
  assert.match(css,/linear-gradient\(135deg,#172338f5,#111c2df2/);
  assert.match(css,/\.run-site-nav\{[\s\S]*background:#09111f/);
  assert.doesNotMatch(html,/>HOME<|>PULSE<|EIXO HOME/);
});




test('RUN completion persists account progress and ranking bests',()=>{
  const service=read('run-server.js');
  assert.match(service,/INSERT INTO run_bests\(player_id,best_level,best_time_ms/);
  assert.match(service,/INSERT INTO run_level_bests\(player_id,level,best_time_ms/);
  assert.match(service,/bestLevel\+1/);
});


test('RUN mutations accept privacy browsers with the secure session cookie even without fetch metadata',()=>{
  const server=read('server.js');
  assert.match(server,/runCookiePost&&parseCookies\(req\)\[SESSION_COOKIE\]/);
  assert.doesNotMatch(server,/runCookiePost&&browserSameOrigin/);
  assert.match(server,/if\(fetchSite==='cross-site'\)return json\(res,403/);
});

test('RUN shows persistence failures instead of silently losing progress',()=>{
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  const html=read('games/run/index.html');
  assert.match(html,/id="run-start-status"/);
  assert.match(scene,/PROGRESSO NÃO GUARDADO/);
  assert.match(scene,/await this\.refreshLevelStatus\(\)/);
  assert.match(scene,/PROGRESSO ONLINE INDISPONÍVEL/);
});


test('level status unlocks exactly the level after the recorded best',()=>{
  const service=read('run-server.js');
  assert.match(service,/const completedLevel=Math\.max\(0,Math\.min\(RUN_LEVEL_COUNT,Number\(best\.rows\[0\]\?\.best_level\)\|\|0\)\);/);
  assert.match(service,/const unlockedLevel=completedLevel>=RUN_LEVEL_COUNT\?RUN_LEVEL_COUNT:completedLevel\+1;/);
});


test('RUN header mirrors the main EIXO navigation and account controls',()=>{
  const html=read('games/run/index.html');
  const css=read('games/run/run.css');
  const shell=read('games/run/run-shell.js');
  for(const label of ['Início','Passaporte','Rankings','Salas','VIP'])assert.match(html,new RegExp('>'+label+'<'));
  assert.match(html,/id="runSoundButton"/);
  assert.match(html,/id="runPlayerButton"/);
  assert.match(html,/id="runCountryButton"/);
  assert.match(html,/run-vip-top-button/);
  assert.doesNotMatch(html,/run-site-pill/);
  assert.match(css,/background:rgba\(9,15,26,.96\)/);
  assert.match(shell,/eixo_player/);
  assert.match(shell,/eixo_audio_settings/);
});
