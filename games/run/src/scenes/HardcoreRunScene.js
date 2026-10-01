import { RUN_PHYSICS } from '../run-config.js?v=20261001-progressfix2';
import { RUN_LEVEL_COUNT, getRunLevel } from '../run-levels.js?v=20261001-progressfix2';

const RUN_PROGRESS_KEY='eixo.run.progress.v1';
const RUN_LEVEL_BESTS_KEY='eixo.run.level-bests.v1';

function readSavedLevel(){
  try{
    const raw=localStorage.getItem(RUN_PROGRESS_KEY);
    const data=raw?JSON.parse(raw):null;
    const level=Math.floor(Number(data&&data.level));
    return Number.isFinite(level)?Phaser.Math.Clamp(level,1,RUN_LEVEL_COUNT):1;
  }catch(_){return 1}
}

function saveLevel(level){
  try{
    const current=readSavedLevel();
    const next=Phaser.Math.Clamp(Math.max(current,Math.floor(Number(level)||1)),1,RUN_LEVEL_COUNT);
    localStorage.setItem(RUN_PROGRESS_KEY,JSON.stringify({level:next,updatedAt:Date.now()}));
    return next;
  }catch(_){return readSavedLevel()}
}

function readLevelBests(){
  try{
    const raw=localStorage.getItem(RUN_LEVEL_BESTS_KEY);
    const data=raw?JSON.parse(raw):{};
    return data&&typeof data==='object'?data:{};
  }catch(_){return{}}
}

function saveLevelBest(level,timeMs){
  const n=Phaser.Math.Clamp(Math.floor(Number(level)||1),1,RUN_LEVEL_COUNT);
  const ms=Math.max(1,Math.floor(Number(timeMs)||0));
  const all=readLevelBests();
  const previous=Number(all[String(n)]);
  const isPersonalBest=!Number.isFinite(previous)||ms<previous;
  if(isPersonalBest){
    all[String(n)]=ms;
    try{localStorage.setItem(RUN_LEVEL_BESTS_KEY,JSON.stringify(all));}catch(_){}
  }
  return{isPersonalBest,bestMs:isPersonalBest?ms:previous};
}

const C = {
  bg:0x030711, bg2:0x07111f, grid:0x17304a,
  platform:0x101824, platformEdge:0xe9fbff, platformGlow:0x78e8ff,
  hazard:0xff3159, hazardDark:0x5b1025, safe:0x56ff9d,
  player:0xf8fdff, cyan:0x62dcff, accent:0xff3159, muted:0x8090a6
};

function formatTime(ms){
  if(!Number.isFinite(ms)) return '--:--.---';
  const total=Math.max(0,Math.floor(ms));
  const min=Math.floor(total/60000);
  const sec=Math.floor((total%60000)/1000);
  const milli=total%1000;
  return String(min).padStart(2,'0')+':'+String(sec).padStart(2,'0')+'.'+String(milli).padStart(3,'0');
}

export class HardcoreRunScene extends Phaser.Scene {
  constructor(){
    super('HardcoreRun');
    this.levelIndex=0;
    this.deaths=0;
    this.runActive=false;
    this.finished=false;
    this.starting=false;
    this.attemptId=null;
    this.practice=false;
    this.levelObjects=[];
    this.levelLinks=[];
    this.dynamicHazards=[];
    this.dynamicPlatforms=[];
    this.ridingPlatform=null;
    this.playerVisual=null;
    this.runnerFacing=1;
    this.runnerPhase=0;
    this.awaitingClearChoice=false;
    this.lastClearResult=null;
    this.selectedLevel=readSavedLevel();
    this.maxUnlockedLevel=readSavedLevel();
    this.completedLevel=Math.max(0,this.maxUnlockedLevel-1);
    this.levelTimes=readLevelBests();
  }

  preload(){
    const base='/games/run/assets/neon-void/';
    this.load.svg('nv-bg',base+'background.svg');
    this.load.svg('nv-platform',base+'platform.svg');
    this.load.svg('nv-moving',base+'moving-platform.svg');
    this.load.svg('nv-spikes',base+'spikes.svg');
    this.load.svg('nv-saw',base+'saw.svg');
    this.load.svg('nv-laser',base+'laser.svg');
    this.load.svg('nv-swing-laser',base+'swing-laser.svg');
    this.load.svg('nv-crusher',base+'crusher.svg');
    this.load.svg('nv-exit',base+'exit.svg');
    this.load.svg('nv-stopwatch',base+'stopwatch.svg');
    this.load.svg('nv-skull',base+'skull.svg');
  }

  configureViewport(){
    const root=document.getElementById('run-root');
    const rect=root&&root.getBoundingClientRect?root.getBoundingClientRect():null;
    const pxW=Math.max(640,Math.round((rect&&rect.width)||window.innerWidth||1280));
    const pxH=Math.max(360,Math.round((rect&&rect.height)||Math.max(360,(window.innerHeight||796)-76)));

    if(Math.abs(Number(this.scale.width)-pxW)>1||Math.abs(Number(this.scale.height)-pxH)>1){
      this.scale.resize(pxW,pxH);
    }

    const zoom=pxH/720;
    this.uiZoom=zoom;
    this.uiWorldWidth=pxW/zoom;
    this.cameras.main.setViewport(0,0,pxW,pxH);
    this.cameras.main.setZoom(zoom);
  }

  uiWidth(){ return this.uiWorldWidth||1280; }
  uiCenterX(){ return this.uiWidth()/2; }

  create(){
    this.configureViewport();
    this.physics.world.setBounds(0,0,1280,720);
    this.keys=this.input.keyboard.addKeys({
      left:Phaser.Input.Keyboard.KeyCodes.LEFT,
      right:Phaser.Input.Keyboard.KeyCodes.RIGHT,
      a:Phaser.Input.Keyboard.KeyCodes.A,
      d:Phaser.Input.Keyboard.KeyCodes.D,
      jump:Phaser.Input.Keyboard.KeyCodes.SPACE,
      w:Phaser.Input.Keyboard.KeyCodes.W,
      up:Phaser.Input.Keyboard.KeyCodes.UP,
      restart:Phaser.Input.Keyboard.KeyCodes.R,
      home:Phaser.Input.Keyboard.KeyCodes.H
    });
    this.jumpBufferUntil=0;
    this.coyoteUntil=0;
    this.jumpWasHeld=false;
    this.dead=false;
    this.levelLocked=false;

    this.createHud();
    this.createStartOverlay();
    this.createClearOverlay();
    this.createLevelSelector();
    this.createNoticeOverlay();
    this.loadLevel(this.selectedLevel-1);
    this.refreshLeaderboard();
    this.refreshLevelStatus();

    this.input.keyboard.on('keydown-SPACE',()=>this.queueJump());
    this.input.keyboard.on('keydown-W',()=>this.queueJump());
    this.input.keyboard.on('keydown-UP',()=>this.queueJump());
    this.input.keyboard.on('keydown-ENTER',()=>{ if(this.awaitingClearChoice)this.nextAfterClear(); else if(!this.runActive&&!this.finished)this.requestStart(); });
    this.input.keyboard.on('keydown-R',()=>{ if(this.awaitingClearChoice)this.retryClearedLevel(); else if(this.runActive&&!this.finished&&!this.dead)this.killPlayer(true); });
    this.input.keyboard.on('keydown-H',()=>window.location.assign('/'));
    this.input.on('pointerdown',()=>{ if(!this.runActive&&!this.finished) this.requestStart(); });
  }

  createHud(){
    const bindText=id=>{
      const el=document.getElementById(id);
      return{setText(value){if(el)el.textContent=String(value);return this;},setAlpha(value){if(el)el.style.opacity=String(value);return this;}};
    };
    this.levelText=bindText('run-hud-level');
    this.nameText=bindText('run-hud-name');
    this.timerText=bindText('run-hud-time');
    this.pbText=bindText('run-hud-pb');
    this.deathText=bindText('run-hud-deaths');
    this.controls=bindText('run-controls');
    this.progressEl=document.getElementById('run-hud-progress-fill');
  }

  setProgress(value){
    if(this.progressEl)this.progressEl.style.width=(Phaser.Math.Clamp(Number(value)||0,0,1)*100).toFixed(2)+'%';
  }

  createStartOverlay(){
    this.startOverlayEl=document.getElementById('run-start-overlay');
    this.startRankingEl=document.getElementById('run-start-ranking');
    this.startPromptEl=document.getElementById('run-start-prompt');
    this.startSelectedEl=document.getElementById('run-start-selected');
    this.startStatusEl=document.getElementById('run-start-status');

    if(this.startRankingEl)this.startRankingEl.textContent='WORLD TOP\nLOADING...';
    if(this.startPromptEl)this.startPromptEl.textContent='SPACE / ENTER / CLICK  —  START';
    this.updateSelectedLevelUi();

    if(this.startOverlayEl){
      this.startOverlayEl.classList.remove('is-hidden');
      this.startOverlayEl.addEventListener('pointerdown',()=>{
        if(!this.runActive&&!this.finished)this.requestStart();
      });
    }
  }

  createLevelSelector(){
    this.levelOverlayEl=document.getElementById('run-level-overlay');
    this.levelGridEl=document.getElementById('run-level-grid');
    this.levelSummaryEl=document.getElementById('run-level-summary');

    const open=document.getElementById('run-open-levels');
    const close=document.getElementById('run-level-close');
    if(open)open.addEventListener('pointerdown',e=>{e.stopPropagation();this.openLevelSelector();});
    if(close)close.addEventListener('pointerdown',e=>{e.stopPropagation();this.closeLevelSelector();});
    if(this.levelOverlayEl)this.levelOverlayEl.addEventListener('pointerdown',e=>e.stopPropagation());

    this.renderLevelSelector();
  }

  updateSelectedLevelUi(){
    const level=Phaser.Math.Clamp(Math.floor(Number(this.selectedLevel)||1),1,RUN_LEVEL_COUNT);
    if(this.startSelectedEl)this.startSelectedEl.textContent='LEVEL '+String(level).padStart(3,'0');
    if(this.startPromptEl&&!this.starting)this.startPromptEl.textContent='JOGAR NÍVEL '+String(level).padStart(3,'0')+' ↗';
    this.updateLevelPbHud();
  }

  updateLevelPbHud(){
    const level=this.levelIndex+1;
    const ms=Number(this.levelTimes&&this.levelTimes[String(level)]);
    if(Number.isFinite(ms))this.pbText.setText('PB  '+formatTime(ms));
    else if(this.practice)this.pbText.setText('PRACTICE');
    else this.pbText.setText('PB  --:--.---');
  }

  openLevelSelector(){
    if(!this.levelOverlayEl)return;
    this.renderLevelSelector();
    this.levelOverlayEl.classList.remove('is-hidden');
  }

  closeLevelSelector(){
    if(this.levelOverlayEl)this.levelOverlayEl.classList.add('is-hidden');
  }

  renderLevelSelector(){
    if(this.levelSummaryEl)this.levelSummaryEl.textContent='UNLOCKED '+String(this.maxUnlockedLevel).padStart(3,'0')+' / '+String(RUN_LEVEL_COUNT);
    if(!this.levelGridEl)return;

    const items=[];
    for(let level=1;level<=RUN_LEVEL_COUNT;level++){
      const unlocked=level<=this.maxUnlockedLevel;
      const completed=level<=this.completedLevel;
      const selected=level===this.selectedLevel;
      const ms=Number(this.levelTimes&&this.levelTimes[String(level)]);
      const sub=Number.isFinite(ms)?formatTime(ms):(completed?'CLEARED':unlocked?'CURRENT':'LOCKED');
      items.push(
        '<button type="button" class="run-level-cell'+(selected?' is-selected':'')+(completed?' is-complete':'')+'" data-level="'+level+'" '+(unlocked?'':'disabled')+'>'+
        '<strong>'+String(level).padStart(3,'0')+'</strong><span>'+sub+'</span></button>'
      );
    }
    this.levelGridEl.innerHTML=items.join('');
    this.levelGridEl.querySelectorAll('[data-level]:not([disabled])').forEach(btn=>{
      btn.addEventListener('click',e=>{
        e.stopPropagation();
        this.selectLevel(Number(btn.dataset.level));
      });
    });
  }

  selectLevel(level){
    const n=Phaser.Math.Clamp(Math.floor(Number(level)||1),1,RUN_LEVEL_COUNT);
    if(n>this.maxUnlockedLevel)return;
    this.selectedLevel=n;
    this.closeLevelSelector();

    // Selection is a pre-run action. If the clear screen was open, end that
    // attempt locally and show the start screen for the newly selected level.
    if(this.awaitingClearChoice){
      this.hideClearOverlay();
      this.awaitingClearChoice=false;
      this.runActive=false;
      this.finished=false;
      this.attemptId=null;
    }

    if(!this.runActive){
      this.loadLevel(n-1);
      if(this.startOverlayEl)this.startOverlayEl.classList.remove('is-hidden');
    }
    this.updateSelectedLevelUi();
  }

  async refreshLevelStatus(){
    const localUnlocked=readSavedLevel();
    const localTimes=readLevelBests();
    let remote=null;
    try{
      const res=await fetch('/api/run/levels',{credentials:'same-origin',cache:'no-store'});
      if(res.ok)remote=await res.json();
    }catch(_){}

    const remoteUnlocked=Math.floor(Number(remote&&remote.unlockedLevel)||1);
    const remoteCompleted=Math.floor(Number(remote&&remote.completedLevel)||0);
    const authenticated=!!(remote&&remote.authenticated);
    this.maxUnlockedLevel=Phaser.Math.Clamp(authenticated?remoteUnlocked:Math.max(localUnlocked,remoteUnlocked),1,RUN_LEVEL_COUNT);
    this.completedLevel=Phaser.Math.Clamp(authenticated?remoteCompleted:Math.max(Math.max(0,localUnlocked-1),remoteCompleted),0,RUN_LEVEL_COUNT);

    const merged={...localTimes};
    const remoteTimes=remote&&remote.times&&typeof remote.times==='object'?remote.times:{};
    for(const [level,value] of Object.entries(remoteTimes)){
      const ms=Number(value),old=Number(merged[level]);
      if(Number.isFinite(ms)&&(!Number.isFinite(old)||ms<old))merged[level]=ms;
    }
    this.levelTimes=merged;

    if(this.selectedLevel>this.maxUnlockedLevel)this.selectedLevel=this.maxUnlockedLevel;
    this.renderLevelSelector();
    this.updateSelectedLevelUi();
    return remote;
  }

  createClearOverlay(){
    this.clearOverlayEl=document.getElementById('run-clear-overlay');
    this.clearTitleEl=document.getElementById('run-clear-title');
    this.clearTimeEl=document.getElementById('run-clear-time');
    this.clearPbEl=document.getElementById('run-clear-pb');
    const retry=document.getElementById('run-clear-retry');
    const levels=document.getElementById('run-clear-levels');
    const next=document.getElementById('run-clear-next');
    if(retry)retry.addEventListener('click',e=>{e.stopPropagation();this.retryClearedLevel();});
    if(levels)levels.addEventListener('click',e=>{e.stopPropagation();this.openLevelSelector();});
    if(next)next.addEventListener('click',e=>{e.stopPropagation();this.nextAfterClear();});
  }

  hideClearOverlay(){
    if(this.clearOverlayEl)this.clearOverlayEl.classList.add('is-hidden');
  }

  queueJump(){
    if(this.awaitingClearChoice){this.nextAfterClear();return;}
    this.jumpBufferUntil=this.time.now+RUN_PHYSICS.jumpBufferMs;
    if(!this.runActive&&!this.finished)this.requestStart();
  }

  async requestStart(){
    if(this.starting||this.runActive||this.finished)return;
    this.starting=true;
    if(this.startPromptEl)this.startPromptEl.textContent='A INICIAR...';
    if(this.startStatusEl)this.startStatusEl.textContent='';

    const requested=Phaser.Math.Clamp(Math.floor(Number(this.selectedLevel)||1),1,this.maxUnlockedLevel||1);
    let runId=null;
    this.practice=false;

    try{
      const res=await fetch('/api/run/start',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'same-origin',
        body:JSON.stringify({level:requested})
      });
      if(res.ok){
        const data=await res.json();
        runId=data.runId||null;
        const serverLevel=Phaser.Math.Clamp(Math.floor(Number(data.level)||requested),1,RUN_LEVEL_COUNT);
        if(Number.isFinite(Number(data.unlockedLevel)))this.maxUnlockedLevel=Math.max(this.maxUnlockedLevel,Math.floor(Number(data.unlockedLevel)));
        this.selectedLevel=serverLevel;
        if(serverLevel!==this.levelIndex+1)this.loadLevel(serverLevel-1);
      }else{
        const data=await res.json().catch(()=>({}));
        this.practice=true;
        if(this.startStatusEl)this.startStatusEl.textContent=(res.status===401?'INICIA SESSÃO PARA GUARDAR O PROGRESSO':'PROGRESSO ONLINE INDISPONÍVEL · '+String(data.error||res.status));
        if(requested!==this.levelIndex+1)this.loadLevel(requested-1);
      }
    }catch(_){
      this.practice=true;
      if(this.startStatusEl)this.startStatusEl.textContent='PROGRESSO ONLINE INDISPONÍVEL';
      if(requested!==this.levelIndex+1)this.loadLevel(requested-1);
    }

    this.attemptId=runId;
    this.runActive=true;
    this.starting=false;
    this.levelStartedAt=this.time.now;
    if(this.startOverlayEl)this.startOverlayEl.classList.add('is-hidden');
    this.closeLevelSelector();
    this.controls.setAlpha(.78);
    this.updateLevelPbHud();
  }

  clearLevel(){
    this.levelLinks.forEach(x=>{ try{x.destroy();}catch(_){} });
    this.levelLinks=[];
    if(this.player){ try{this.player.destroy();}catch(_){} }
    this.player=null;
    this.playerVisual=null;
    this.levelObjects.forEach(x=>{ try{x.destroy();}catch(_){} });
    this.levelObjects=[];
    this.dynamicHazards=[];
    this.dynamicPlatforms=[];
    this.ridingPlatform=null;
    this.goalTrigger=null;
  }

  loadLevel(index,{resetClock=false}={}){
    this.hideClearOverlay();
    this.awaitingClearChoice=false;
    this.clearLevel();
    this.levelIndex=Phaser.Math.Clamp(index,0,RUN_LEVEL_COUNT-1);
    this.dead=false;
    this.levelLocked=false;
    const L=getRunLevel(this.levelIndex);
    this.physics.world.setBounds(0,0,L.width,720);
    this.cameras.main.setBounds(0,0,L.width,720);
    this.configureViewport();
    this.drawGrid(L.width);

    for(const f of L.floors||[]) this.addFloor(f[0],f[1],f[2]);
    for(const p of L.platforms||[]) this.addPlatform(p[0],p[1],p[2],p[3]);
    for(const w of L.walls||[]) this.addPlatform(w[0],w[1],w[2],w[3]);
    for(const c of L.ceilings||[]) this.addCeilingPlatform(c[0],c[1],c[2],c[3]);
    for(const p of L.movingPlatforms||[]) this.addMovingPlatform(p);
    for(const s of L.spikes||[]) this.addSpikes(s[0],s[1],s[2]);
    for(const s of L.ceilingSpikes||[]) this.addCeilingSpikes(s[0],s[1],s[2]);
    for(const s of L.saws||[]) this.addSaw(s);
    for(const l of L.lasers||[]) this.addLaser(l);
    for(const l of L.swingLasers||[]) this.addSwingLaser(l);
    for(const p of L.pulseFloors||[]) this.addPulseFloor(p);
    for(const c of L.crushers||[]) this.addCrusher(c);

    this.createGoal(L.goal[0],L.goal[1]);
    this.createPlayer(L.spawn[0],L.spawn[1]);

    this.levelText.setText('LEVEL '+String(this.levelIndex+1).padStart(3,'0')+' / '+String(RUN_LEVEL_COUNT).padStart(3,'0'));
    this.nameText.setText(L.name+'  ·  NEON VOID');
    this.setProgress((this.levelIndex+1)/RUN_LEVEL_COUNT);
    this.updateLevelPbHud();
    this.cameras.main.startFollow(this.player,true,.11,.08,-Math.min(260,this.uiWidth()*.18),20);
    this.cameras.main.scrollX=0;
    if(resetClock&&this.runActive) this.levelStartedAt=this.time.now;

    this.showLevelCard(this.levelIndex,L.name);
  }

  drawGrid(width){
    const vw=this.uiWidth();
    const vignette=this.add.graphics().setScrollFactor(0).setDepth(-60);
    vignette.fillStyle(0x02050a,.12).fillRect(0,82,vw,638);
    vignette.fillStyle(0x163451,.045).fillRect(0,520,vw,200);
    this.levelObjects.push(vignette);
  }

  addFloor(start,end,top){
    const h=720-top+90;
    return this.addPlatform((start+end)/2,top+h/2,end-start,h,true);
  }

  addPlatform(x,y,w,h,solidFloor=false){
    const r=this.add.rectangle(x,y,w,h,0x000000,0).setDepth(5);
    r.__isPlatform=true;
    this.physics.add.existing(r,true);
    const top=y-h/2;
    const visualH=solidFloor?Math.min(92,Math.max(58,h*.30)):Math.min(50,Math.max(38,h+24));
    const cap=this.add.image(x,top,'nv-platform').setOrigin(.5,0).setDepth(7).setDisplaySize(w,visualH);
    if(solidFloor&&h>visualH){
      const bodyH=h-visualH;
      const body=this.add.rectangle(x,top+visualH+bodyH/2,w,bodyH,0x070c13,1).setDepth(5);
      body.setStrokeStyle(1,0x182332,.9);
      const braces=this.add.graphics().setDepth(6);
      braces.lineStyle(2,0x28364a,.48);
      for(let bx=x-w/2+18;bx<x+w/2-18;bx+=72){
        braces.lineBetween(bx,top+visualH+8,Math.min(bx+42,x+w/2-12),Math.min(top+h-10,top+visualH+64));
        braces.lineBetween(Math.min(bx+42,x+w/2-12),top+visualH+8,bx,Math.min(top+h-10,top+visualH+64));
      }
      this.levelObjects.push(body,braces);
    }
    this.levelObjects.push(r,cap);
    return r;
  }


  addCeilingPlatform(x,y,w,h){
    const r=this.add.rectangle(x,y,w,h,0x000000,0).setDepth(5);
    r.__isPlatform=true;
    this.physics.add.existing(r,true);

    // Ceiling artwork is the floor artwork mirrored vertically: the bright
    // walkable-looking edge belongs on the underside, not on the top.
    const bottom=y+h/2;
    const visualH=Math.min(50,Math.max(38,h+24));
    const cap=this.add.image(x,bottom,'nv-platform')
      .setOrigin(.5,1)
      .setFlipY(true)
      .setDepth(7)
      .setDisplaySize(w,visualH);

    this.levelObjects.push(r,cap);
    return r;
  }

  addMovingPlatform(spec){
    const x=spec[0],y=spec[1],w=spec[2],h=spec[3],axis=spec[4],range=spec[5],period=spec[6],phase=spec[7]||0;
    const theta=((this.time.now+phase)%period)/period*Math.PI*2;
    const wave=Math.sin(theta);
    const startX=axis==='x'?x+wave*range:x;
    const startY=axis==='y'?y+wave*range:y;

    const r=this.add.rectangle(startX,startY,w,h,0x000000,0).setDepth(6);
    r.__isPlatform=true;
    r.__isMovingPlatform=true;

    this.physics.add.existing(r);
    r.body.setAllowGravity(false);
    r.body.setImmovable(true);
    r.body.setSize(w,h,true);
    r.body.setVelocity(0,0);
    if(r.body.setFriction)r.body.setFriction(1,1);
    r.body.reset(startX,startY);

    const visualOffsetY=3;
    const visual=this.add.image(startX,startY+visualOffsetY,'nv-moving').setDepth(9).setDisplaySize(Math.max(92,w+18),46);

    r.baseX=x;r.baseY=y;r.axis=axis;r.range=range;r.period=period;r.phase=phase;
    r.visual=visual;r.visualYOffset=visualOffsetY;

    this.levelObjects.push(r,visual);
    this.dynamicPlatforms.push(r);
    return r;
  }

  addCeilingSpikes(x,bottom,width){
    const h=24;
    const sensor=this.add.rectangle(x,bottom+h/2,width,h,0x000000,0).setDepth(9);
    sensor.__isHazard=true;
    this.physics.add.existing(sensor,true);

    // After flipY the spike baseline sits 6/44 of the texture height from
    // the visual top. Pull the texture up by that amount so the baseline
    // touches the underside of the ceiling and the teeth point downward.
    const visualH=38;
    const baselineOffset=visualH*(6/44);
    const visual=this.add.image(x,bottom-baselineOffset,'nv-spikes')
      .setOrigin(.5,0)
      .setFlipY(true)
      .setDepth(12)
      .setDisplaySize(width,visualH);
    this.levelObjects.push(sensor,visual);
  }

  addCrusher(spec){
    const x=spec[0],y=spec[1],w=spec[2],h=spec[3],range=spec[4],period=spec[5],phase=spec[6]||0;
    const block=this.add.rectangle(x,y,w,h,0x000000,0).setDepth(12);
    block.__isHazard=true;
    this.physics.add.existing(block,true);
    const visual=this.add.image(x,y,'nv-crusher').setDepth(15).setDisplaySize(Math.max(72,w+16),Math.max(82,h+18));
    block.baseY=y;block.range=range;block.period=period;block.phase=phase;block.visual=visual;
    this.levelObjects.push(block,visual);
    this.dynamicHazards.push({type:'crusher',obj:block});
  }

  addSpikes(x,top,width){
    const h=24;
    const sensor=this.add.rectangle(x,top-h/2,width,h,0x000000,0).setDepth(9);
    sensor.__isHazard=true;
    this.physics.add.existing(sensor,true);

    // The SVG has 6 transparent units below its baseline. Move the image
    // down by the scaled margin so the visible base sits exactly on top.
    const visualH=38;
    const baselineOffset=visualH*(6/44);
    const visual=this.add.image(x,top+baselineOffset,'nv-spikes')
      .setOrigin(.5,1)
      .setDepth(12)
      .setDisplaySize(width,visualH);
    this.levelObjects.push(sensor,visual);
  }

  addSaw(spec){
    const x=spec[0],y=spec[1],r=spec[2],axis=spec[3],range=spec[4],period=spec[5],phase=spec[6]||0;
    const saw=this.add.circle(x,y,r,0x000000,0).setDepth(12);
    saw.__isHazard=true;
    this.physics.add.existing(saw,true);
    const visual=this.add.image(x,y,'nv-saw').setDepth(15).setDisplaySize((r+9)*2,(r+9)*2);
    saw.baseX=x;saw.baseY=y;saw.axis=axis;saw.range=range;saw.period=period;saw.phase=phase;saw.visual=visual;
    this.levelObjects.push(saw,visual);
    this.dynamicHazards.push({type:'saw',obj:saw});
  }

  addSwingLaser(spec){
    const pivotX=spec[0],pivotY=spec[1],length=spec[2],angleDeg=spec[3],period=spec[4],phase=spec[5]||0;
    const visual=this.add.image(pivotX,pivotY,'nv-swing-laser').setOrigin(.5,0).setDepth(14).setDisplaySize(42,length);

    const sensors=[];
    const count=Math.max(5,Math.min(9,Math.round(length/34)));
    for(let i=0;i<count;i++){
      const dist=24+(length-34)*(i/(Math.max(1,count-1)));
      const sensor=this.add.circle(pivotX,pivotY+dist,7,0x000000,0).setDepth(12);
      sensor.__isHazard=true;
      sensor.swingDist=dist;
      this.physics.add.existing(sensor,true);
      sensors.push(sensor);
      this.levelObjects.push(sensor);
    }

    const anchor=sensors[0];
    anchor.pivotX=pivotX;anchor.pivotY=pivotY;anchor.length=length;anchor.angleDeg=angleDeg;
    anchor.period=period;anchor.phase=phase;anchor.visual=visual;anchor.sensors=sensors;anchor.lastOn=true;
    this.levelObjects.push(visual);
    this.dynamicHazards.push({type:'swingLaser',obj:anchor});
  }

  addPulseFloor(spec){
    const x=spec[0],top=spec[1],width=spec[2],period=spec[3],phase=spec[4]||0;
    const sensor=this.add.rectangle(x,top-5,width,10,0x000000,0).setDepth(12);
    sensor.__isHazard=true;
    this.physics.add.existing(sensor,true);

    const visual=this.add.container(x,top-4).setDepth(13);
    const glow=this.add.rectangle(0,0,width+18,16,C.hazard,.10);
    const rail=this.add.rectangle(0,0,width,5,C.hazard,.95);
    const core=this.add.rectangle(0,-1,width-10,1,0xffffff,.72);
    visual.add([glow,rail,core]);

    sensor.period=period;sensor.phase=phase;sensor.visual=visual;sensor.lastOn=true;
    this.levelObjects.push(sensor,visual);
    this.dynamicHazards.push({type:'pulseFloor',obj:sensor});
  }

  addLaser(spec){
    const x=spec[0],y=spec[1],w=spec[2],h=spec[3],period=spec[4],phase=spec[5]||0;
    const beam=this.add.rectangle(x,y,w,h,C.hazard,0).setDepth(12);
    beam.__isHazard=true;
    this.physics.add.existing(beam,true);
    const visual=this.add.image(x,y,'nv-laser').setDepth(14).setDisplaySize(38,h+24);
    beam.period=period;beam.phase=phase;beam.visual=visual;beam.lastOn=true;
    this.levelObjects.push(beam,visual);
    this.dynamicHazards.push({type:'laser',obj:beam});
  }

  createGoal(x,top){
    const visual=this.add.image(x,top,'nv-exit').setOrigin(.5,1).setDepth(12).setDisplaySize(92,145);
    const label=this.add.text(x,top-166,'EXIT',{fontFamily:'monospace',fontSize:'10px',fontStyle:'bold',color:'#76ffae',letterSpacing:4}).setOrigin(.5).setDepth(13);
    const trigger=this.add.rectangle(x,top-60,68,122,0x69ff9c,0);
    trigger.__isGoal=true;
    this.physics.add.existing(trigger,true);
    this.goalTrigger=trigger;
    this.levelObjects.push(visual,label,trigger);
  }

  createPlayer(x,y){
    // Physics stays deliberately simple and invisible. The articulated runner is visual only.
    this.player=this.add.rectangle(x,y,24,38,0xffffff,0).setDepth(30);
    this.physics.add.existing(this.player);
    const b=this.player.body;
    b.setSize(22,36);
    b.setMaxVelocity(460,980);
    b.setDragX(0);
    b.setCollideWorldBounds(false);

    this.createRunnerVisual(x,y);

    for(const obj of this.levelObjects){
      if(!obj.body) continue;
      if(obj.__isPlatform){
        this.levelLinks.push(this.physics.add.collider(this.player,obj));
      }else if(obj.__isHazard){
        this.levelLinks.push(this.physics.add.overlap(this.player,obj,()=>this.killPlayer(false)));
      }
    }
    this.levelLinks.push(this.physics.add.overlap(this.player,this.goalTrigger,()=>this.completeLevel()));
  }

  createRunnerVisual(x,y){
    const c=this.add.container(x,y).setDepth(40);
    const glow=this.add.graphics();
    const body=this.add.graphics();
    c.add([glow,body]);
    c.glowGraphics=glow;
    c.bodyGraphics=body;
    this.playerVisual=c;
    this.runnerPhase=0;
    this.runnerFacing=1;
    this.levelObjects.push(c);
    this.updateRunnerVisual(0,16);
  }

  updateRunnerVisual(time,delta=16){
    const p=this.player,c=this.playerVisual;
    if(!p||!p.body||!c)return;
    const b=p.body;
    const grounded=b.blocked.down||b.touching.down||!!this.ridingPlatform;
    const speed=Math.abs(b.velocity.x);
    if(b.velocity.x>8)this.runnerFacing=1;
    else if(b.velocity.x<-8)this.runnerFacing=-1;

    const inputMoving=!!(this.keys&&((this.keys.left.isDown||this.keys.a.isDown)!==(this.keys.right.isDown||this.keys.d.isDown)));
    const moving=grounded&&inputMoving&&speed>35;
    if(moving)this.runnerPhase+=(delta||16)*(0.0045+Math.min(1,speed/RUN_PHYSICS.runSpeed)*0.0105);
    c.x=p.x;c.y=p.y+1;c.scaleX=this.runnerFacing;

    const g=c.bodyGraphics,halo=c.glowGraphics;
    g.clear();halo.clear();

    const stride=moving?Math.sin(this.runnerPhase)*9:0;
    const lift=moving?Math.max(0,Math.sin(this.runnerPhase*2))*2:0;
    const lean=grounded?Math.min(.13,speed/2600):(b.velocity.y<0?.10:.03);
    const shoulder={x:lean*22,y:-9-lift};
    const hip={x:0,y:3-lift};

    let lf,rf,lh,rh,lk,rk,le,re;
    if(!grounded){
      if(b.velocity.y<20){
        lf={x:-7,y:15};rf={x:9,y:10};lk={x:-10,y:8};rk={x:5,y:7};
        lh={x:8,y:-18};rh={x:-8,y:-13};le={x:6,y:-12};re={x:-7,y:-8};
      }else{
        lf={x:-7,y:20};rf={x:7,y:18};lk={x:-4,y:10};rk={x:5,y:10};
        lh={x:-7,y:4};rh={x:8,y:2};le={x:-4,y:-4};re={x:6,y:-3};
      }
    }else{
      lf={x:stride,y:20};rf={x:-stride,y:20};
      lk={x:stride*.48-2,y:11-lift};rk={x:-stride*.48+2,y:11-lift};
      lh={x:-stride*.72,y:4-lift};rh={x:stride*.72,y:4-lift};
      le={x:-stride*.42,y:-2-lift};re={x:stride*.42,y:-2-lift};
    }

    const drawLimb=(a,k,f,alpha=1)=>{
      halo.lineStyle(8,C.cyan,.07*alpha);halo.lineBetween(a.x,a.y,k.x,k.y);halo.lineBetween(k.x,k.y,f.x,f.y);
      g.lineStyle(5,C.player,alpha);g.lineBetween(a.x,a.y,k.x,k.y);g.lineBetween(k.x,k.y,f.x,f.y);
      g.fillStyle(C.player,alpha).fillCircle(k.x,k.y,2.5);
    };

    drawLimb({x:hip.x-2,y:hip.y},rk,rf,.58);
    drawLimb({x:shoulder.x-2,y:shoulder.y},re,rh,.58);
    halo.lineStyle(10,C.cyan,.07);halo.lineBetween(hip.x,hip.y,shoulder.x,shoulder.y);
    g.lineStyle(7,C.player,1);g.lineBetween(hip.x,hip.y,shoulder.x,shoulder.y);
    drawLimb({x:hip.x+2,y:hip.y},lk,lf,1);
    drawLimb({x:shoulder.x+2,y:shoulder.y},le,lh,1);
    halo.fillStyle(C.cyan,.08).fillCircle(shoulder.x+2,shoulder.y-9,7);
    g.fillStyle(C.player,1).fillCircle(shoulder.x+2,shoulder.y-9,5);
    g.lineStyle(1,0x9df0ff,.7).strokeCircle(shoulder.x+2,shoulder.y-9,5);
    g.fillStyle(C.cyan,.9).fillCircle(shoulder.x+1,shoulder.y+2,1.5);
  }

  createNoticeOverlay(){
    this.noticeOverlayEl=document.getElementById('run-notice-overlay');
    this.noticeKickerEl=document.getElementById('run-notice-kicker');
    this.noticeTitleEl=document.getElementById('run-notice-title');
    this.noticeTimer=null;
  }

  showCenteredNotice({kicker='',title='',danger=false,duration=650}={}){
    if(!this.noticeOverlayEl)return;

    if(this.noticeTimer){
      clearTimeout(this.noticeTimer);
      this.noticeTimer=null;
    }

    if(this.noticeKickerEl)this.noticeKickerEl.textContent=String(kicker||'');
    if(this.noticeTitleEl)this.noticeTitleEl.textContent=String(title||'');
    this.noticeOverlayEl.classList.toggle('is-danger',!!danger);
    this.noticeOverlayEl.classList.remove('is-hidden');

    this.noticeTimer=setTimeout(()=>{
      if(this.noticeOverlayEl)this.noticeOverlayEl.classList.add('is-hidden');
      this.noticeTimer=null;
    },Math.max(100,Number(duration)||650));
  }

  showLevelCard(index,name){
    this.showCenteredNotice({
      kicker:'LEVEL '+String(index+1).padStart(3,'0'),
      title:name,
      danger:false,
      duration:700
    });
  }


  killPlayer(manual){
    if(!this.runActive||this.finished||this.dead||this.levelLocked) return;
    this.dead=true;
    this.deaths+=1;
    this.deathText.setText(String(this.deaths));
    this.player.body.enable=false;
    this.player.setVisible(false);
    if(this.playerVisual)this.playerVisual.setVisible(false);
    this.cameras.main.shake(85,.004);
    this.cameras.main.flash(70,255,49,89,false);
    this.showCenteredNotice({
      kicker:'',
      title:manual?'RESTART':'DEAD',
      danger:true,
      duration:360
    });
    this.time.delayedCall(360,()=>{
      this.loadLevel(this.levelIndex);
    });
  }

  async completeLevel(){
    if(!this.runActive||this.finished||this.dead||this.levelLocked)return;
    this.levelLocked=true;
    const level=this.levelIndex+1;
    let levelTimeMs=Math.max(1,Math.round(this.time.now-this.levelStartedAt));
    this.timerText.setText(formatTime(levelTimeMs));
    this.setProgress(level/RUN_LEVEL_COUNT);
    this.player.body.setVelocity(0,0);
    this.player.body.enable=false;

    let serverResult=null;
    let saveError='';
    if(this.attemptId){
      try{
        const res=await fetch('/api/run/level',{
          method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',
          body:JSON.stringify({runId:this.attemptId,level,timeMs:levelTimeMs})
        });
        if(res.ok){
          serverResult=await res.json();
          if(Number.isFinite(serverResult.timeMs))levelTimeMs=serverResult.timeMs;
          this.timerText.setText(formatTime(levelTimeMs));
          await this.refreshLeaderboard();
          await this.refreshLevelStatus();
        }else{
          const data=await res.json().catch(()=>({}));
          saveError=String(data.error||('HTTP '+res.status));
        }
      }catch(_){
        saveError='NETWORK';
      }
    }else if(!this.practice){
      saveError='NO ATTEMPT';
    }

    const localResult=saveLevelBest(level,levelTimeMs);
    const localUnlocked=level<RUN_LEVEL_COUNT?saveLevel(level+1):saveLevel(RUN_LEVEL_COUNT);
    this.maxUnlockedLevel=Math.max(this.maxUnlockedLevel,localUnlocked);
    this.completedLevel=Math.max(this.completedLevel,level);

    const serverLevelPb=serverResult&&Number(serverResult.levelPbMs);
    const bestMs=Number.isFinite(serverLevelPb)?serverLevelPb:localResult.bestMs;
    if(Number.isFinite(bestMs))this.levelTimes[String(level)]=bestMs;
    this.renderLevelSelector();

    this.lastClearResult={level,timeMs:levelTimeMs,serverResult};
    this.awaitingClearChoice=true;

    const isLevelPb=!!(serverResult&&serverResult.isLevelPersonalBest)||localResult.isPersonalBest;
    const suffix=saveError?'PROGRESSO NÃO GUARDADO · '+saveError:(isLevelPb?'NOVO PB DO NÍVEL':'NÍVEL CONCLUÍDO');
    if(this.clearTitleEl)this.clearTitleEl.textContent='LEVEL '+String(level).padStart(3,'0')+' CLEAR';
    if(this.clearTimeEl)this.clearTimeEl.textContent=formatTime(levelTimeMs);
    if(this.clearPbEl){
      this.clearPbEl.textContent=suffix;
      this.clearPbEl.classList.toggle('is-error',!!saveError);
    }
    const next=document.getElementById('run-clear-next');
    if(next)next.textContent=level>=RUN_LEVEL_COUNT?'FINISH RUN':'NEXT LEVEL';
    if(this.clearOverlayEl)this.clearOverlayEl.classList.remove('is-hidden');
  }

  retryClearedLevel(){
    if(!this.awaitingClearChoice||!this.lastClearResult)return;
    this.hideClearOverlay();
    this.awaitingClearChoice=false;
    this.selectedLevel=this.lastClearResult.level;
    this.loadLevel(this.lastClearResult.level-1,{resetClock:true});
    this.updateSelectedLevelUi();
    this.timerText.setText('00:00.000');
  }

  nextAfterClear(){
    if(!this.awaitingClearChoice||!this.lastClearResult)return;
    const result=this.lastClearResult;
    this.hideClearOverlay();
    this.awaitingClearChoice=false;
    if(result.level>=RUN_LEVEL_COUNT){
      this.finishRun(result.timeMs,result.serverResult);
      return;
    }
    this.selectedLevel=result.level+1;
    this.loadLevel(result.level,{resetClock:true});
    this.updateSelectedLevelUi();
    this.timerText.setText('00:00.000');
  }


  async finishRun(levelTimeMs,serverResult){
    this.finished=true;
    this.runActive=false;
    this.timerText.setText(formatTime(levelTimeMs));
    await this.refreshLeaderboard();
    this.showFinishOverlay(levelTimeMs,serverResult);
  }

  showFinishOverlay(levelTimeMs,result){
    const cx=this.uiCenterX(),vw=this.uiWidth();
    this.add.rectangle(cx,360,vw,720,0x050609,.90).setScrollFactor(0).setDepth(2500);
    this.add.text(cx,145,'LEVEL '+RUN_LEVEL_COUNT+' COMPLETE',{fontFamily:'Arial Black,Arial',fontSize:'46px',color:'#ffffff'}).setOrigin(.5).setScrollFactor(0).setDepth(2501);
    this.add.text(cx,235,formatTime(levelTimeMs),{fontFamily:'Arial Black,Arial',fontSize:'58px',color:'#69ff9c'}).setOrigin(.5).setScrollFactor(0).setDepth(2501);
    let note=this.practice?'PRACTICE — NOT SUBMITTED':'LEVEL '+RUN_LEVEL_COUNT;
    if(!this.practice&&result&&result.isPersonalBest) note+='   ·   NEW PERSONAL BEST';
    this.add.text(cx,305,note,{fontFamily:'Arial Black,Arial',fontSize:'13px',color:this.practice?'#8f96a3':'#ff3159'}).setOrigin(.5).setScrollFactor(0).setDepth(2501);
    this.add.text(cx,410,this.leaderboardText(),{fontFamily:'monospace',fontSize:'15px',color:'#e8eaf0',align:'left',lineSpacing:7}).setOrigin(.5).setScrollFactor(0).setDepth(2501);
    this.add.text(cx,590,'REFRESH PAGE TO RUN AGAIN   ·   H  EIXO HOME',{fontFamily:'Arial Black,Arial',fontSize:'12px',color:'#7b818d'}).setOrigin(.5).setScrollFactor(0).setDepth(2501);
  }

  leaderboardText(){
    const rows=(this.rankingData&&this.rankingData.players)||[];
    if(!rows.length) return 'WORLD TOP\nNO TIMES YET';
    const lines=['WORLD TOP'];
    rows.slice(0,7).forEach((p,i)=>{
      const pos=String(i+1).padStart(3,'0');
      const name=String(p.name||'PLAYER').slice(0,14).padEnd(14,' ');
      lines.push(pos+'  '+name+'  L'+String(p.level||0).padStart(3,'0')+'  '+formatTime(Number(p.timeMs)));
    });
    if(this.rankingData&&this.rankingData.me&&this.rankingData.me.timeMs){
      lines.push('');
      lines.push('YOUR PB  L'+String(this.rankingData.me.level||0).padStart(3,'0')+'  '+formatTime(Number(this.rankingData.me.timeMs))+'  #'+this.rankingData.me.rank);
    }
    return lines.join('\n');
  }

  async refreshLeaderboard(){
    try{
      const res=await fetch('/api/run/rankings?limit=10',{credentials:'same-origin'});
      if(res.ok){
        this.rankingData=await res.json();
        if(this.rankingData.me&&Number.isFinite(Number(this.rankingData.me.level))){
          const remoteUnlocked=Number(this.rankingData.me.level)>=RUN_LEVEL_COUNT?RUN_LEVEL_COUNT:Number(this.rankingData.me.level)+1;
          this.maxUnlockedLevel=Math.max(this.maxUnlockedLevel,remoteUnlocked);
        }
      }
    }catch(_){}
    if(this.startRankingEl)this.startRankingEl.textContent=this.leaderboardText();
    this.updateLevelPbHud();
    return this.rankingData;
  }

  update(time,delta){
    if(!this.player) return;
    this.updateDynamicPlatforms(time,delta);
    this.updateDynamicHazards(time);
    this.updateRunnerVisual(time,delta);

    if(this.runActive&&!this.finished&&!this.awaitingClearChoice){
      const elapsed=this.time.now-this.levelStartedAt;
      this.timerText.setText(formatTime(elapsed));
    }

    if(!this.runActive||this.finished||this.dead||this.levelLocked) return;

    const b=this.player.body;
    const left=this.keys.left.isDown||this.keys.a.isDown;
    const right=this.keys.right.isDown||this.keys.d.isDown;
    const grounded=b.blocked.down||b.touching.down||!!this.ridingPlatform;
    const wallLeft=b.blocked.left||b.touching.left;
    const wallRight=b.blocked.right||b.touching.right;

    if(grounded) this.coyoteUntil=this.time.now+RUN_PHYSICS.coyoteMs;
    const onWall=!grounded&&(wallLeft||wallRight);
    if(onWall&&b.velocity.y>190) b.setVelocityY(190);

    const target=left&&!right?-RUN_PHYSICS.runSpeed:right&&!left?RUN_PHYSICS.runSpeed:0;
    const accel=grounded?0.32:0.20;
    b.setVelocityX(Phaser.Math.Linear(b.velocity.x,target,accel));

    const jumpHeld=this.keys.jump.isDown||this.keys.w.isDown||this.keys.up.isDown;
    const wantsJump=this.time.now<=this.jumpBufferUntil;
    if(wantsJump){
      if(onWall){
        b.setVelocityY(-RUN_PHYSICS.wallJumpSpeed);
        b.setVelocityX(wallLeft?RUN_PHYSICS.wallKickSpeed:-RUN_PHYSICS.wallKickSpeed);
        this.jumpBufferUntil=0;
        this.coyoteUntil=0;
      }else if(grounded||this.time.now<=this.coyoteUntil){
        b.setVelocityY(-RUN_PHYSICS.jumpSpeed);
        this.jumpBufferUntil=0;
        this.coyoteUntil=0;
      }
    }

    if(this.jumpWasHeld&&!jumpHeld&&b.velocity.y<-210) b.setVelocityY(b.velocity.y*.48);
    this.jumpWasHeld=jumpHeld;

    if(this.player.y>770||this.player.x<-80) this.killPlayer(false);
  }

  updateDynamicPlatforms(time,delta=16){
    const p=this.player;
    let riding=null;

    for(const o of this.dynamicPlatforms){
      if(!o||!o.body)continue;

      const theta=((time+o.phase)%o.period)/o.period*Math.PI*2;
      const wave=Math.sin(theta);
      const cosine=Math.cos(theta);
      const targetX=o.axis==='x'?o.baseX+wave*o.range:o.baseX;
      const targetY=o.axis==='y'?o.baseY+wave*o.range:o.baseY;
      const idealSpeed=cosine*(Math.PI*2*o.range)/(o.period/1000);

      const errX=targetX-o.x;
      const errY=targetY-o.y;
      const vx=o.axis==='x'?Phaser.Math.Clamp(idealSpeed+errX*5,-300,300):0;
      const vy=o.axis==='y'?Phaser.Math.Clamp(idealSpeed+errY*5,-300,300):0;

      o.body.setVelocity(vx,vy);

      if(o.visual){
        o.visual.x=o.x;
        o.visual.y=o.y+(o.visualYOffset||0);
      }

      if(p&&p.body&&p.body.enable&&!this.dead){
        const pb=p.body,ob=o.body;
        const horizontal=pb.right>ob.left+3&&pb.left<ob.right-3;
        const feetGap=Math.abs(pb.bottom-ob.top);
        if(horizontal&&feetGap<=9&&pb.velocity.y>=-45)riding=o;
      }
    }

    this.ridingPlatform=riding;
  }

  updateDynamicHazards(time){
    for(const d of this.dynamicHazards){
      const o=d.obj;
      if(!o||!o.body) continue;

      if(d.type==='saw'){
        const wave=Math.sin(((time+o.phase)%o.period)/o.period*Math.PI*2);
        if(o.axis==='x')o.x=o.baseX+wave*o.range;
        else o.y=o.baseY+wave*o.range;
        if(o.visual){
          o.visual.x=o.x;o.visual.y=o.y;
          o.visual.rotation+=0.055;
        }
        o.body.updateFromGameObject();

      }else if(d.type==='laser'){
        const on=((time+o.phase)%o.period)<o.period*.58;
        if(on!==o.lastOn){
          o.lastOn=on;o.body.enable=on;
          if(o.visual)o.visual.setAlpha(on?1:.16);
        }

      }else if(d.type==='swingLaser'){
        const cycle=((time+o.phase)%o.period)/o.period;
        const angle=Math.sin(cycle*Math.PI*2)*Phaser.Math.DegToRad(o.angleDeg);
        const on=cycle<.55;
        if(o.visual){
          o.visual.x=o.pivotX;o.visual.y=o.pivotY;
          o.visual.rotation=angle;
          o.visual.setAlpha(on?1:.14);
        }
        for(const sensor of o.sensors){
          const dist=sensor.swingDist;
          sensor.x=o.pivotX+Math.sin(angle)*dist;
          sensor.y=o.pivotY+Math.cos(angle)*dist;
          sensor.body.updateFromGameObject();
          sensor.body.enable=on;
        }
        o.lastOn=on;

      }else if(d.type==='pulseFloor'){
        const on=((time+o.phase)%o.period)<o.period*.56;
        if(on!==o.lastOn){
          o.lastOn=on;o.body.enable=on;
          if(o.visual)o.visual.setAlpha(on?1:.12);
        }

      }else if(d.type==='crusher'){
        const phase=((time+o.phase)%o.period)/o.period;
        const drop=(1-Math.cos(phase*Math.PI*2))*.5;
        o.y=o.baseY+drop*o.range;
        if(o.visual){o.visual.x=o.x;o.visual.y=o.y;}
        o.body.updateFromGameObject();
      }
    }
  }
}
