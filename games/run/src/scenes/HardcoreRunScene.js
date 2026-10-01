import { RUN_PHYSICS } from '../run-config.js';
import { RUN_LEVEL_COUNT, getRunLevel } from '../run-levels.js';

const RUN_PROGRESS_KEY='eixo.run.progress.v1';

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
    localStorage.setItem(RUN_PROGRESS_KEY,JSON.stringify({
      level:Phaser.Math.Clamp(Math.floor(Number(level)||1),1,RUN_LEVEL_COUNT),
      updatedAt:Date.now()
    }));
  }catch(_){}
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
    this.playerVisual=null;
    this.runnerFacing=1;
    this.runnerPhase=0;
  }

  preload(){
    const base='/games/run/assets/neon-void/';
    this.load.svg('nv-bg',base+'background.svg');
    this.load.svg('nv-platform',base+'platform.svg');
    this.load.svg('nv-moving',base+'moving-platform.svg');
    this.load.svg('nv-spikes',base+'spikes.svg');
    this.load.svg('nv-saw',base+'saw.svg');
    this.load.svg('nv-laser',base+'laser.svg');
    this.load.svg('nv-crusher',base+'crusher.svg');
    this.load.svg('nv-exit',base+'exit.svg');
    this.load.svg('nv-stopwatch',base+'stopwatch.svg');
    this.load.svg('nv-skull',base+'skull.svg');
  }

  configureViewport(){
    const pxW=Math.max(640,Number(this.scale.width)||1280);
    const pxH=Math.max(360,Number(this.scale.height)||720);
    const zoom=pxH/720;
    this.uiZoom=zoom;
    this.uiWorldWidth=pxW/zoom;
    this.cameras.main.setViewport(0,0,pxW,pxH);
    this.cameras.main.setZoom(zoom);
  }

  uiWidth(){ return this.uiWorldWidth||1280; }
  uiCenterX(){ return this.uiWidth()/2; }

  create(){
    this.cameras.main.setBackgroundColor(C.bg);
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
    this.loadLevel(readSavedLevel()-1);
    this.refreshLeaderboard();

    this.input.keyboard.on('keydown-SPACE',()=>this.queueJump());
    this.input.keyboard.on('keydown-W',()=>this.queueJump());
    this.input.keyboard.on('keydown-UP',()=>this.queueJump());
    this.input.keyboard.on('keydown-ENTER',()=>{ if(!this.runActive&&!this.finished) this.requestStart(); });
    this.input.keyboard.on('keydown-R',()=>{ if(this.runActive&&!this.finished&&!this.dead) this.killPlayer(true); });
    this.input.keyboard.on('keydown-H',()=>window.location.assign('/'));
    this.input.on('pointerdown',()=>{ if(!this.runActive&&!this.finished) this.requestStart(); });
  }

  createHud(){
    const vw=this.uiWidth();
    this.hud=this.add.container(0,0).setScrollFactor(0).setDepth(1000);
    this.hudGlass=this.add.rectangle(vw/2,41,vw,82,0x01050b,.965);
    this.hudLine=this.add.rectangle(vw/2,81,vw,1,0x547493,.72);
    this.brandText=this.add.text(24,10,'RUN',{fontFamily:'Arial Black,Arial',fontSize:'35px',fontStyle:'italic',color:'#ffffff',letterSpacing:1});
    this.brandText.setShadow(0,0,'#d9f7ff',7,true,true);
    this.brandSlash=this.add.text(145,18,'//',{fontFamily:'Arial Black,Arial',fontSize:'23px',color:'#657487'});
    this.levelText=this.add.text(198,13,'LEVEL 001',{fontFamily:'Arial Black,Arial',fontSize:'15px',color:'#f8fbff',letterSpacing:2});
    this.nameText=this.add.text(198,40,'NEON VOID',{fontFamily:'monospace',fontSize:'10px',color:'#c1cad5',letterSpacing:6});

    const timerX=Math.max(560,Math.min(vw-330,vw*.69));
    this.timerIcon=this.add.image(timerX-132,34,'nv-stopwatch').setDisplaySize(40,40);
    this.timerText=this.add.text(timerX-92,10,'00:00.000',{fontFamily:'monospace',fontSize:'27px',fontStyle:'bold',color:'#ffffff',letterSpacing:1});
    this.pbText=this.add.text(timerX-88,45,'PB  --:--.---',{fontFamily:'monospace',fontSize:'11px',fontStyle:'bold',color:'#aeb9c8',letterSpacing:2});

    this.hudDivider=this.add.rectangle(vw-248,40,1,42,0x8192a5,.62);
    this.deathIcon=this.add.image(vw-190,39,'nv-skull').setDisplaySize(42,42);
    this.deathLabel=this.add.text(vw-144,12,'DEATHS',{fontFamily:'monospace',fontSize:'10px',fontStyle:'bold',color:'#cbd3df',letterSpacing:4});
    this.deathText=this.add.text(vw-144,34,'0',{fontFamily:'Arial Black,Arial',fontSize:'24px',color:'#ffffff'});
    this.progressBase=this.add.rectangle(vw/2,80,vw,2,0x17304a,.75);
    this.progressFill=this.add.rectangle(0,80,0,2,C.cyan,1).setOrigin(0,.5);

    this.hud.add([this.hudGlass,this.hudLine,this.brandText,this.brandSlash,this.levelText,this.nameText,this.timerIcon,this.timerText,this.pbText,this.hudDivider,this.deathIcon,this.deathLabel,this.deathText,this.progressBase,this.progressFill]);
    this.controls=this.add.text(22,692,'A/D  MOVE    SPACE  JUMP    R  RESTART    H  HOME',{fontFamily:'monospace',fontSize:'9px',color:'#66778a',letterSpacing:1}).setScrollFactor(0).setDepth(1000);
  }

  createStartOverlay(){
    const cx=this.uiCenterX(),vw=this.uiWidth();
    this.startShade=this.add.rectangle(cx,360,vw,720,0x01040a,.88).setScrollFactor(0).setDepth(2000);
    const panel=this.add.rectangle(cx,355,610,420,0x07101a,.93).setStrokeStyle(1,0x334b61,.98).setScrollFactor(0).setDepth(2001);
    const lineA=this.add.rectangle(cx,164,520,1,C.cyan,.42).setScrollFactor(0).setDepth(2002);
    const lineB=this.add.rectangle(cx,545,520,1,C.hazard,.35).setScrollFactor(0).setDepth(2002);
    this.startTitle=this.add.text(cx,180,'RUN //',{fontFamily:'Arial Black,Arial',fontSize:'72px',fontStyle:'italic',color:'#ffffff'}).setOrigin(.5).setScrollFactor(0).setDepth(2003);
    this.startTitle.setShadow(0,0,'#9eefff',10,true,true);
    this.startSub=this.add.text(cx,246,'NEON VOID',{fontFamily:'monospace',fontSize:'14px',color:'#bcecff',letterSpacing:8}).setOrigin(.5).setScrollFactor(0).setDepth(2003);
    this.startRules=this.add.text(cx,298,'900 HARDCORE LEVELS\nHIGHEST LEVEL · FASTEST TIME',{fontFamily:'Arial Black,Arial',fontSize:'12px',color:'#a8b8c8',align:'center',lineSpacing:10,letterSpacing:1}).setOrigin(.5).setScrollFactor(0).setDepth(2003);
    this.startRanking=this.add.text(cx,390,'WORLD TOP\nLOADING...',{fontFamily:'monospace',fontSize:'14px',color:'#e9f7ff',align:'left',lineSpacing:7}).setOrigin(.5).setScrollFactor(0).setDepth(2003);
    this.startPrompt=this.add.text(cx,500,'SPACE / ENTER / CLICK  —  START',{fontFamily:'Arial Black,Arial',fontSize:'15px',color:'#56ff9d',letterSpacing:1}).setOrigin(.5).setScrollFactor(0).setDepth(2003);
    this.startNote=this.add.text(cx,570,'LOGIN FOR GLOBAL RANKING · PRACTICE WORKS OFFLINE',{fontFamily:'monospace',fontSize:'9px',color:'#62778b',letterSpacing:1}).setOrigin(.5).setScrollFactor(0).setDepth(2003);
    this.startObjects=[this.startShade,panel,lineA,lineB,this.startTitle,this.startSub,this.startRules,this.startRanking,this.startPrompt,this.startNote];
  }

  queueJump(){
    this.jumpBufferUntil=this.time.now+RUN_PHYSICS.jumpBufferMs;
    if(!this.runActive&&!this.finished) this.requestStart();
  }

  async requestStart(){
    if(this.starting||this.runActive||this.finished) return;
    this.starting=true;
    this.startPrompt.setText('STARTING...');
    let runId=null;
    try{
      const res=await fetch('/api/run/start',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:'{}'});
      if(res.ok){
        const data=await res.json();
        runId=data.runId||null;
        const serverLevel=Phaser.Math.Clamp(Math.floor(Number(data.level)||1),1,RUN_LEVEL_COUNT);
        if(serverLevel!==this.levelIndex+1)this.loadLevel(serverLevel-1);
        saveLevel(serverLevel);
      }else{
        this.practice=true;
      }
    }catch(_){
      this.practice=true;
    }
    this.attemptId=runId;
    this.runActive=true;
    this.starting=false;
    this.levelStartedAt=this.time.now;
    this.startObjects.forEach(o=>o.setVisible(false));
    this.controls.setAlpha(.78);
    if(this.practice) this.pbText.setText('PRACTICE');
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
    this.goalTrigger=null;
  }

  loadLevel(index,{resetClock=false}={}){
    this.clearLevel();
    this.levelIndex=index;
    this.dead=false;
    this.levelLocked=false;
    const L=getRunLevel(index);
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
    for(const c of L.crushers||[]) this.addCrusher(c);

    this.createGoal(L.goal[0],L.goal[1]);
    this.createPlayer(L.spawn[0],L.spawn[1]);

    this.levelText.setText('LEVEL '+String(index+1).padStart(3,'0')+' / '+String(RUN_LEVEL_COUNT).padStart(3,'0'));
    this.nameText.setText(L.name+'  ·  NEON VOID');
    this.progressFill.width=this.uiWidth()*(index/RUN_LEVEL_COUNT);
    this.cameras.main.startFollow(this.player,true,.11,.08,-Math.min(260,this.uiWidth()*.18),20);
    this.cameras.main.scrollX=0;
    if(resetClock&&this.runActive) this.levelStartedAt=this.time.now;

    this.showLevelCard(index,L.name);
  }

  drawGrid(width){
    const vw=this.uiWidth();
    const bg=this.add.image(vw/2,360,'nv-bg').setScrollFactor(0).setDepth(-100).setDisplaySize(vw,720);
    const vignette=this.add.graphics().setScrollFactor(0).setDepth(-60);
    vignette.fillStyle(0x000000,.18).fillRect(0,82,vw,638);
    vignette.fillStyle(0xff3159,.025).fillRect(0,570,vw,150);
    this.levelObjects.push(bg,vignette);
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
    const r=this.add.rectangle(x,y,w,h,0x000000,0).setDepth(6);
    r.__isPlatform=true;
    this.physics.add.existing(r,true);
    const visual=this.add.image(x,y-4,'nv-moving').setDepth(9).setDisplaySize(Math.max(92,w+18),46);
    r.baseX=x;r.baseY=y;r.axis=axis;r.range=range;r.period=period;r.phase=phase;r.visual=visual;r.visualYOffset=-4;
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
    const visual=this.add.image(x,y,'nv-crusher').setDepth(15).setDisplaySize(Math.max(110,w+58),Math.max(105,h+74));
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
    const grounded=b.blocked.down||b.touching.down;
    const speed=Math.abs(b.velocity.x);
    if(b.velocity.x>8)this.runnerFacing=1;
    else if(b.velocity.x<-8)this.runnerFacing=-1;

    this.runnerPhase+=(delta||16)*(0.0048+Math.min(1,speed/RUN_PHYSICS.runSpeed)*0.0108);
    c.x=p.x;c.y=p.y;c.scaleX=this.runnerFacing;

    const g=c.bodyGraphics,halo=c.glowGraphics;
    g.clear();halo.clear();

    const moving=grounded&&speed>28;
    const phase=this.runnerPhase;
    const stride=moving?Math.sin(phase)*10.2:0;
    const bounce=moving?Math.abs(Math.sin(phase))*1.4:0;
    const lean=grounded?Math.min(2.2,speed/145):b.velocity.y<0?2.2:1.0;

    const hip={x:-1+lean*.16,y:3-bounce};
    const shoulder={x:1+lean,y:-9-bounce};

    let lk,rk,lf,rf,le,re,lh,rh;
    if(!grounded){
      if(b.velocity.y<30){
        lk={x:-8,y:8};lf={x:-13,y:16};
        rk={x:7,y:7};rf={x:13,y:11};
        le={x:7,y:-7};lh={x:13,y:-14};
        re={x:-6,y:-5};rh={x:-12,y:-10};
      }else{
        lk={x:-5,y:10};lf={x:-9,y:20};
        rk={x:5,y:10};rf={x:9,y:19};
        le={x:-4,y:-1};lh={x:-8,y:6};
        re={x:5,y:-2};rh={x:10,y:4};
      }
    }else{
      lk={x:stride*.52-2,y:11-bounce};
      lf={x:stride,y:21};
      rk={x:-stride*.52+2,y:11-bounce};
      rf={x:-stride,y:21};
      le={x:-stride*.42+2,y:-2-bounce};
      lh={x:-stride*.78+3,y:5-bounce};
      re={x:stride*.42-2,y:-2-bounce};
      rh={x:stride*.78-3,y:5-bounce};
    }

    const capsule=(gfx,a,b,width,color,alpha=1)=>{
      gfx.lineStyle(width,color,alpha);
      gfx.lineBetween(a.x,a.y,b.x,b.y);
      gfx.fillStyle(color,alpha);
      gfx.fillCircle(a.x,a.y,width/2);
      gfx.fillCircle(b.x,b.y,width/2);
    };

    const limb=(a,k,f,alpha=1)=>{
      capsule(halo,a,k,8.5,C.cyan,.085*alpha);
      capsule(halo,k,f,8.5,C.cyan,.085*alpha);
      capsule(g,a,k,4.5,C.player,alpha);
      capsule(g,k,f,4.2,C.player,alpha);
      g.fillStyle(C.player,alpha).fillEllipse(f.x,f.y+1,6.2,3.5);
    };

    // rear limbs
    limb({x:hip.x-2,y:hip.y},rk,rf,.48);
    limb({x:shoulder.x-2,y:shoulder.y+1},re,rh,.48);

    // soft silhouette glow
    halo.fillStyle(C.cyan,.07);
    halo.fillEllipse(shoulder.x,shoulder.y-1,18,24);
    halo.fillEllipse(hip.x,hip.y+1,15,16);

    // torso: wider shoulders, tapered waist, rounded silhouette
    const torso=[
      {x:shoulder.x-6.8,y:shoulder.y-1},
      {x:shoulder.x-5.2,y:shoulder.y+8},
      {x:hip.x-3.8,y:hip.y+2},
      {x:hip.x+3.8,y:hip.y+2},
      {x:shoulder.x+5.4,y:shoulder.y+8},
      {x:shoulder.x+6.8,y:shoulder.y-1}
    ];
    g.fillStyle(C.player,1);
    g.fillPoints(torso,true);
    g.fillCircle(shoulder.x-5.8,shoulder.y+1,2.3);
    g.fillCircle(shoulder.x+5.8,shoulder.y+1,2.3);
    g.fillCircle(hip.x,hip.y+1,4.2);

    // cyan seam / chest mark, no facial features
    g.lineStyle(1.4,C.cyan,.78);
    g.lineBetween(shoulder.x-2.8,shoulder.y+2,shoulder.x+3.7,shoulder.y+4.5);

    // front limbs
    limb({x:hip.x+2,y:hip.y},lk,lf,1);
    limb({x:shoulder.x+2,y:shoulder.y+1},le,lh,1);

    // neck and faceless head
    capsule(g,{x:shoulder.x+1.2,y:shoulder.y-2},{x:shoulder.x+1.7,y:shoulder.y-5},3.5,C.player,1);
    halo.fillStyle(C.cyan,.08).fillEllipse(shoulder.x+2.4,shoulder.y-11.2,12.5,14.5);
    g.fillStyle(C.player,1).fillEllipse(shoulder.x+2.4,shoulder.y-11.2,9.5,11.5);
    g.lineStyle(1,0xb7f2ff,.50).strokeEllipse(shoulder.x+2.4,shoulder.y-11.2,9.5,11.5);
  }

  showLevelCard(index,name){
    const cx=this.uiCenterX();
    const n=this.add.text(cx,260,'LEVEL '+String(index+1).padStart(3,'0'),{fontFamily:'Arial Black,Arial',fontSize:'14px',color:'#ff3159',letterSpacing:4}).setOrigin(.5).setScrollFactor(0).setDepth(1200);
    const t=this.add.text(cx,302,name,{fontFamily:'Arial Black,Arial',fontSize:'38px',color:'#ffffff'}).setOrigin(.5).setScrollFactor(0).setDepth(1200);
    n.setAlpha(0);t.setAlpha(0);
    this.tweens.add({targets:[n,t],alpha:1,duration:120,yoyo:true,hold:430,onComplete:()=>{n.destroy();t.destroy();}});
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
    const msg=this.add.text(this.uiCenterX(),355,manual?'RESTART':'DEAD',{fontFamily:'Arial Black,Arial',fontSize:'32px',color:'#ff3159'}).setOrigin(.5).setScrollFactor(0).setDepth(1500);
    this.time.delayedCall(190,()=>{
      msg.destroy();
      this.loadLevel(this.levelIndex);
    });
  }

  async completeLevel(){
    if(!this.runActive||this.finished||this.dead||this.levelLocked) return;
    this.levelLocked=true;
    const level=this.levelIndex+1;
    let levelTimeMs=Math.max(1,Math.round(this.time.now-this.levelStartedAt));
    this.timerText.setText(formatTime(levelTimeMs));
    this.progressFill.width=this.uiWidth()*(level/RUN_LEVEL_COUNT);
    this.player.body.setVelocity(0,0);
    this.player.body.enable=false;

    let serverResult=null;
    if(this.attemptId){
      try{
        const res=await fetch('/api/run/level',{
          method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',
          body:JSON.stringify({runId:this.attemptId,level,timeMs:levelTimeMs})
        });
        if(res.ok){
          serverResult=await res.json();
          if(Number.isFinite(serverResult.timeMs)) levelTimeMs=serverResult.timeMs;
          this.timerText.setText(formatTime(levelTimeMs));
          await this.refreshLeaderboard();
        }
      }catch(_){}
    }

    if(level===RUN_LEVEL_COUNT){
      this.finishRun(levelTimeMs,serverResult);
      return;
    }

    saveLevel(level===RUN_LEVEL_COUNT?RUN_LEVEL_COUNT:level+1);
    const suffix=serverResult&&serverResult.isPersonalBest?' · NEW PB':'';
    const clear=this.add.text(this.uiCenterX(),348,'CLEAR · '+formatTime(levelTimeMs)+suffix,{fontFamily:'Arial Black,Arial',fontSize:'30px',color:'#69ff9c'}).setOrigin(.5).setScrollFactor(0).setDepth(1500);
    this.time.delayedCall(420,()=>{
      clear.destroy();
      this.loadLevel(this.levelIndex+1,{resetClock:true});
      this.timerText.setText('00:00.000');
    });
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
        if(this.rankingData.me&&this.rankingData.me.timeMs&&!this.practice){
          this.pbText.setText('PB  L'+String(this.rankingData.me.level||0).padStart(3,'0')+' · '+formatTime(Number(this.rankingData.me.timeMs)));
        }
      }
    }catch(_){}
    if(this.startRanking&&this.startRanking.visible) this.startRanking.setText(this.leaderboardText());
    return this.rankingData;
  }

  update(time,delta){
    if(!this.player) return;
    this.updateDynamicPlatforms(time);
    this.updateDynamicHazards(time);
    this.updateRunnerVisual(time,delta);

    if(this.runActive&&!this.finished){
      const elapsed=this.time.now-this.levelStartedAt;
      this.timerText.setText(formatTime(elapsed));
    }

    if(!this.runActive||this.finished||this.dead||this.levelLocked) return;

    const b=this.player.body;
    const left=this.keys.left.isDown||this.keys.a.isDown;
    const right=this.keys.right.isDown||this.keys.d.isDown;
    const grounded=b.blocked.down||b.touching.down;
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

  updateDynamicPlatforms(time){
    for(const o of this.dynamicPlatforms){
      if(!o||!o.body) continue;
      const wave=Math.sin(((time+o.phase)%o.period)/o.period*Math.PI*2);
      const nx=o.axis==='x'?o.baseX+wave*o.range:o.baseX;
      const ny=o.axis==='y'?o.baseY+wave*o.range:o.baseY;
      const dx=nx-o.x,dy=ny-o.y;
      const p=this.player;
      const oldTop=o.y-o.displayHeight/2;
      const riding=!!(p&&p.body&&p.body.enable&&!this.dead&&Math.abs((p.y+19)-oldTop)<12&&p.x>o.x-o.displayWidth/2-8&&p.x<o.x+o.displayWidth/2+8&&p.body.velocity.y>=-30);
      o.x=nx;o.y=ny;
      if(o.visual){o.visual.x=nx;o.visual.y=ny+(o.visualYOffset||0);}
      o.body.updateFromGameObject();
      if(riding){
        p.x+=dx;p.y+=dy;
        p.body.position.x+=dx;p.body.position.y+=dy;
      }
    }
  }

  updateDynamicHazards(time){
    for(const d of this.dynamicHazards){
      const o=d.obj;
      if(!o||!o.body) continue;
      if(d.type==='saw'){
        const wave=Math.sin(((time+o.phase)%o.period)/o.period*Math.PI*2);
        if(o.axis==='x') o.x=o.baseX+wave*o.range;
        else o.y=o.baseY+wave*o.range;
        if(o.visual){
          o.visual.x=o.x;o.visual.y=o.y;
          o.visual.rotation+=0.055;
        }
        o.body.updateFromGameObject();
      }else if(d.type==='laser'){
        const on=((time+o.phase)%o.period)<o.period*.58;
        if(on!==o.lastOn){
          o.lastOn=on;
          o.body.enable=on;
          if(o.visual)o.visual.setAlpha(on?1:.16);
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
