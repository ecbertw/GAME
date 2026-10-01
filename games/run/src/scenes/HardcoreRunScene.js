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

  create(){
    this.cameras.main.setBackgroundColor(C.bg);
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
    this.hud=this.add.container(0,0).setScrollFactor(0).setDepth(1000);

    const glass=this.add.rectangle(640,39,1280,78,0x02050a,.91);
    const bottomLine=this.add.rectangle(640,77,1280,1,0x2b4961,.85);
    const redDash=this.add.rectangle(190,39,32,3,C.accent,1).setRotation(-.08);

    this.brandText=this.add.text(28,14,'RUN',{fontFamily:'Arial Black,Arial',fontSize:'31px',fontStyle:'italic',color:'#f6fbff',letterSpacing:2});
    this.brandSlash=this.add.text(146,20,'//',{fontFamily:'Arial Black,Arial',fontSize:'17px',color:'#60758b'});
    this.levelText=this.add.text(220,15,'LEVEL 001 / 900',{fontFamily:'Arial Black,Arial',fontSize:'13px',color:'#f4fbff',letterSpacing:1});
    this.nameText=this.add.text(220,39,'NEON VOID',{fontFamily:'monospace',fontSize:'11px',color:'#7b9bb6',letterSpacing:4});

    this.timerLabel=this.add.text(640,9,'TIME',{fontFamily:'Arial Black,Arial',fontSize:'9px',color:'#72869a',letterSpacing:2}).setOrigin(.5,0);
    this.timerText=this.add.text(640,25,'00:00.000',{fontFamily:'Arial Black,Arial',fontSize:'28px',color:'#ffffff'}).setOrigin(.5,0);

    this.pbText=this.add.text(1010,17,'PB  --:--.---',{fontFamily:'monospace',fontSize:'13px',color:'#79dfff'}).setOrigin(1,0);
    this.deathText=this.add.text(1240,17,'DEATHS  0',{fontFamily:'Arial Black,Arial',fontSize:'11px',color:'#ff5573'}).setOrigin(1,0);
    this.deathIcon=this.add.text(1080,13,'◆',{fontFamily:'Arial Black,Arial',fontSize:'17px',color:'#ff3159'});

    this.progressBase=this.add.rectangle(640,76,780,2,0x183044,.9);
    this.progressFill=this.add.rectangle(250,76,0,2,C.cyan,1).setOrigin(0,.5);

    this.hud.add([glass,bottomLine,redDash,this.brandText,this.brandSlash,this.levelText,this.nameText,this.timerLabel,this.timerText,this.pbText,this.deathIcon,this.deathText,this.progressBase,this.progressFill]);

    this.controls=this.add.text(24,691,'A/D  MOVE    SPACE  JUMP    R  RESTART    H  HOME',{
      fontFamily:'monospace',fontSize:'10px',color:'#50667a',letterSpacing:1
    }).setScrollFactor(0).setDepth(1000);
  }

  createStartOverlay(){
    this.startShade=this.add.rectangle(640,360,1280,720,0x02050a,.82).setScrollFactor(0).setDepth(2000);
    const panel=this.add.rectangle(640,355,610,420,0x07101a,.87).setStrokeStyle(1,0x27445b,.95).setScrollFactor(0).setDepth(2001);
    const lineA=this.add.rectangle(640,164,520,1,C.cyan,.42).setScrollFactor(0).setDepth(2002);
    const lineB=this.add.rectangle(640,545,520,1,C.hazard,.35).setScrollFactor(0).setDepth(2002);

    this.startTitle=this.add.text(640,180,'RUN //',{fontFamily:'Arial Black,Arial',fontSize:'72px',fontStyle:'italic',color:'#ffffff'}).setOrigin(.5).setScrollFactor(0).setDepth(2003);
    this.startTitle.setShadow(5,5,'#12384f',6,true,true);
    this.startSub=this.add.text(640,246,'NEON VOID',{fontFamily:'monospace',fontSize:'14px',color:'#79dfff',letterSpacing:8}).setOrigin(.5).setScrollFactor(0).setDepth(2003);
    this.startRules=this.add.text(640,298,'900 HARDCORE LEVELS\nHIGHEST LEVEL · FASTEST TIME',{
      fontFamily:'Arial Black,Arial',fontSize:'12px',color:'#a8b8c8',align:'center',lineSpacing:10,letterSpacing:1
    }).setOrigin(.5).setScrollFactor(0).setDepth(2003);
    this.startRanking=this.add.text(640,390,'WORLD TOP\nLOADING...',{
      fontFamily:'monospace',fontSize:'14px',color:'#e9f7ff',align:'left',lineSpacing:7
    }).setOrigin(.5).setScrollFactor(0).setDepth(2003);
    this.startPrompt=this.add.text(640,500,'SPACE / ENTER / CLICK  —  START',{
      fontFamily:'Arial Black,Arial',fontSize:'15px',color:'#56ff9d',letterSpacing:1
    }).setOrigin(.5).setScrollFactor(0).setDepth(2003);
    this.startNote=this.add.text(640,570,'LOGIN FOR GLOBAL RANKING · PRACTICE WORKS OFFLINE',{
      fontFamily:'monospace',fontSize:'9px',color:'#62778b',letterSpacing:1
    }).setOrigin(.5).setScrollFactor(0).setDepth(2003);
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
    this.drawGrid(L.width);

    for(const f of L.floors||[]) this.addFloor(f[0],f[1],f[2]);
    for(const p of L.platforms||[]) this.addPlatform(p[0],p[1],p[2],p[3]);
    for(const w of L.walls||[]) this.addPlatform(w[0],w[1],w[2],w[3]);
    for(const c of L.ceilings||[]) this.addPlatform(c[0],c[1],c[2],c[3]);
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
    this.progressFill.width=760*(index/RUN_LEVEL_COUNT);
    this.cameras.main.startFollow(this.player,true,.11,.08,-230,20);
    this.cameras.main.scrollX=0;
    if(resetClock&&this.runActive) this.levelStartedAt=this.time.now;

    this.showLevelCard(index,L.name);
  }

  drawGrid(width){
    const sky=this.add.graphics().setScrollFactor(0).setDepth(-80);
    sky.fillStyle(C.bg,1).fillRect(0,0,1280,720);
    sky.fillStyle(C.bg2,.95).fillRect(0,78,1280,642);

    // distant planet / arc
    sky.fillStyle(0x0c2440,.65).fillCircle(1070,230,190);
    sky.fillStyle(C.bg2,1).fillCircle(1010,265,185);
    sky.lineStyle(2,0x4a86b0,.18).strokeCircle(1070,230,190);

    // distant city silhouettes
    for(let i=0;i<22;i++){
      const x=i*66-20;
      const h=90+((i*47)%210);
      const w=34+((i*19)%42);
      sky.fillStyle(i%3===0?0x081522:0x07101b,.96).fillRect(x,650-h,w,h);
      if(i%2===0){
        sky.fillStyle(0x2b94c4,.22);
        for(let yy=650-h+20;yy<630;yy+=34) sky.fillRect(x+w*.42,yy,3,10);
      }
    }

    const grid=this.add.graphics().setScrollFactor(0).setDepth(-70);
    grid.lineStyle(1,C.grid,.20);
    for(let x=0;x<=1280;x+=80) grid.lineBetween(x,78,x,720);
    for(let y=80;y<=720;y+=80) grid.lineBetween(0,y,1280,y);
    grid.lineStyle(1,0x6cc7ff,.045);
    for(let x=40;x<1280;x+=320) grid.lineBetween(x,78,x,720);

    const haze=this.add.graphics().setScrollFactor(0).setDepth(-60);
    haze.fillStyle(0x0b2740,.10).fillRect(0,360,1280,360);
    haze.fillStyle(0xff3159,.025).fillRect(0,560,1280,160);

    this.levelObjects.push(sky,grid,haze);
  }

  addFloor(start,end,top){
    const h=720-top+90;
    return this.addPlatform((start+end)/2,top+h/2,end-start,h,true);
  }

  addPlatform(x,y,w,h,solidFloor=false){
    const r=this.add.rectangle(x,y,w,h,C.platform,1).setDepth(5);
    r.setStrokeStyle(1,0x24384b,.95);
    r.__isPlatform=true;
    this.physics.add.existing(r,true);

    const top=y-h/2;
    const shadow=this.add.rectangle(x,top+7,w,14,0x000000,.45).setDepth(5);
    const glow=this.add.rectangle(x,top+1,w,5,C.platformGlow,.10).setDepth(6);
    const edge=this.add.rectangle(x,top,w,2,C.platformEdge,.94).setDepth(7);

    const leftCap=this.add.rectangle(x-w/2+3,top+8,3,16,C.cyan,.18).setDepth(7);
    const rightCap=this.add.rectangle(x+w/2-3,top+8,3,16,C.cyan,.18).setDepth(7);

    if(!solidFloor&&h<=40){
      const panel=this.add.rectangle(x,y+Math.min(7,h*.18),Math.max(8,w-18),Math.max(3,h*.30),0x07101a,.82).setDepth(6);
      this.levelObjects.push(panel);
    }

    this.levelObjects.push(r,shadow,glow,edge,leftCap,rightCap);
    return r;
  }

  addMovingPlatform(spec){
    const x=spec[0],y=spec[1],w=spec[2],h=spec[3],axis=spec[4],range=spec[5],period=spec[6],phase=spec[7]||0;
    const r=this.add.rectangle(x,y,w,h,0x000000,0).setDepth(6);
    r.__isPlatform=true;
    this.physics.add.existing(r,true);

    const visual=this.add.container(x,y).setDepth(8);
    const glow=this.add.rectangle(0,0,w+8,h+8,C.cyan,.10);
    const base=this.add.rectangle(0,0,w,h,0x0d1723,1).setStrokeStyle(2,0xbcefff,.9);
    const top=this.add.rectangle(0,-h/2+1,w-8,2,0xffffff,.95);
    const arrows=this.add.text(0,0,axis==='x'?'‹‹  ››':'▲\n▼',{fontFamily:'Arial Black,Arial',fontSize:axis==='x'?'12px':'8px',color:'#73e6ff',align:'center'}).setOrigin(.5);
    visual.add([glow,base,top,arrows]);

    r.baseX=x;r.baseY=y;r.axis=axis;r.range=range;r.period=period;r.phase=phase;r.visual=visual;
    this.levelObjects.push(r,visual);
    this.dynamicPlatforms.push(r);
    return r;
  }

  addCeilingSpikes(x,bottom,width){
    const h=24;
    const sensor=this.add.rectangle(x,bottom+h/2,width,h,0x000000,0).setDepth(9);
    sensor.__isHazard=true;
    this.physics.add.existing(sensor,true);
    const g=this.add.graphics().setDepth(11);
    const count=Math.max(2,Math.floor(width/22)),step=width/count;
    g.fillStyle(C.hazard,.15);
    g.fillRect(x-width/2,bottom,width,4);
    g.fillStyle(C.hazard,1);
    for(let i=0;i<count;i++){
      const left=x-width/2+i*step;
      g.fillTriangle(left,bottom,left+step/2,bottom+h,left+step,bottom);
    }
    g.lineStyle(1,0xff9aad,.85).lineBetween(x-width/2,bottom,x+width/2,bottom);
    this.levelObjects.push(sensor,g);
  }

  addCrusher(spec){
    const x=spec[0],y=spec[1],w=spec[2],h=spec[3],range=spec[4],period=spec[5],phase=spec[6]||0;
    const block=this.add.rectangle(x,y,w,h,0x000000,0).setDepth(12);
    block.__isHazard=true;
    this.physics.add.existing(block,true);

    const visual=this.add.container(x,y).setDepth(14);
    const glow=this.add.rectangle(0,h/2+5,w+12,16,C.hazard,.12);
    const body=this.add.rectangle(0,0,w,h,0x111a26,1).setStrokeStyle(2,0x344557,1);
    const face=this.add.rectangle(0,4,w-10,h-16,0x0a111a,1);
    const warning=this.add.rectangle(0,h/2-10,w-8,10,C.hazardDark,1).setStrokeStyle(1,C.hazard,.9);
    const arrow=this.add.text(0,2,'▼',{fontFamily:'Arial Black,Arial',fontSize:'15px',color:'#ff3159'}).setOrigin(.5);
    visual.add([glow,body,face,warning,arrow]);

    block.baseY=y;block.range=range;block.period=period;block.phase=phase;block.visual=visual;
    this.levelObjects.push(block,visual);
    this.dynamicHazards.push({type:'crusher',obj:block});
  }

  addSpikes(x,top,width){
    const h=24;
    const sensor=this.add.rectangle(x,top-h/2,width,h,0x000000,0).setDepth(9);
    sensor.__isHazard=true;
    this.physics.add.existing(sensor,true);
    const g=this.add.graphics().setDepth(11);
    const count=Math.max(2,Math.floor(width/22)),step=width/count;
    g.fillStyle(C.hazard,.12).fillRect(x-width/2,top-h-4,width,h+8);
    g.fillStyle(C.hazard,1);
    for(let i=0;i<count;i++){
      const left=x-width/2+i*step;
      g.fillTriangle(left,top,left+step/2,top-h,left+step,top);
    }
    g.lineStyle(1,0xffa1b1,.9).lineBetween(x-width/2,top,x+width/2,top);
    this.levelObjects.push(sensor,g);
  }

  addSaw(spec){
    const x=spec[0],y=spec[1],r=spec[2],axis=spec[3],range=spec[4],period=spec[5],phase=spec[6]||0;
    const saw=this.add.circle(x,y,r,0x000000,0).setDepth(12);
    saw.__isHazard=true;
    this.physics.add.existing(saw,true);

    const visual=this.add.container(x,y).setDepth(15);
    const g=this.add.graphics();
    g.fillStyle(C.hazard,.12).fillCircle(0,0,r+10);
    const teeth=16;
    g.fillStyle(C.hazard,1);
    for(let i=0;i<teeth;i++){
      const a=i/teeth*Math.PI*2;
      const a1=a-.10,a2=a+.10;
      g.fillTriangle(
        Math.cos(a1)*(r-1),Math.sin(a1)*(r-1),
        Math.cos(a)*(r+7),Math.sin(a)*(r+7),
        Math.cos(a2)*(r-1),Math.sin(a2)*(r-1)
      );
    }
    g.fillStyle(0x17202b,1).fillCircle(0,0,r-3);
    g.lineStyle(3,0xff5474,1).strokeCircle(0,0,r-3);
    g.fillStyle(0x030711,1).fillCircle(0,0,Math.max(5,r*.28));
    g.lineStyle(2,0x8de9ff,.85).strokeCircle(0,0,Math.max(5,r*.28));
    visual.add(g);

    saw.baseX=x;saw.baseY=y;saw.axis=axis;saw.range=range;saw.period=period;saw.phase=phase;saw.visual=visual;
    this.levelObjects.push(saw,visual);
    this.dynamicHazards.push({type:'saw',obj:saw});
  }

  addLaser(spec){
    const x=spec[0],y=spec[1],w=spec[2],h=spec[3],period=spec[4],phase=spec[5]||0;
    const beam=this.add.rectangle(x,y,w,h,C.hazard,.98).setDepth(12);
    const glow=this.add.rectangle(x,y,w+18,h,C.hazard,.10).setDepth(10);
    const emitterTop=this.add.rectangle(x,y-h/2,22,13,0x111a26,1).setStrokeStyle(2,0xff4f6e,.9).setDepth(13);
    const emitterBottom=this.add.rectangle(x,y+h/2,22,13,0x111a26,1).setStrokeStyle(2,0xff4f6e,.9).setDepth(13);
    const coreTop=this.add.rectangle(x,y-h/2,6,6,C.hazard,1).setDepth(14);
    const coreBottom=this.add.rectangle(x,y+h/2,6,6,C.hazard,1).setDepth(14);
    beam.__isHazard=true;
    this.physics.add.existing(beam,true);
    beam.period=period;beam.phase=phase;beam.glow=glow;beam.lastOn=true;
    this.levelObjects.push(beam,glow,emitterTop,emitterBottom,coreTop,coreBottom);
    this.dynamicHazards.push({type:'laser',obj:beam});
  }

  createGoal(x,top){
    const glow=this.add.rectangle(x,top-48,66,116,C.safe,.08).setDepth(7);
    const outer=this.add.rectangle(x,top-48,56,106,0x07150f,.72).setStrokeStyle(3,C.safe,.95).setDepth(8);
    const inner=this.add.rectangle(x,top-48,42,88,0x0b2318,.88).setStrokeStyle(1,0xb2ffd0,.5).setDepth(9);
    const line=this.add.rectangle(x,top-48,4,70,C.safe,.9).setDepth(10);
    const cap=this.add.rectangle(x,top-98,42,5,C.safe,.8).setDepth(10);
    const label=this.add.text(x,top-119,'EXIT',{fontFamily:'Arial Black,Arial',fontSize:'10px',color:'#72ffae',letterSpacing:2}).setOrigin(.5).setDepth(10);
    const arrow=this.add.text(x,top-145,'▼',{fontFamily:'Arial Black,Arial',fontSize:'12px',color:'#56ff9d'}).setOrigin(.5).setDepth(10);
    const trigger=this.add.rectangle(x,top-48,60,110,0x69ff9c,0);
    trigger.__isGoal=true;
    this.physics.add.existing(trigger,true);
    this.goalTrigger=trigger;
    this.levelObjects.push(glow,outer,inner,line,cap,label,arrow,trigger);
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
    if(!p||!p.body||!c) return;
    const b=p.body;
    const grounded=b.blocked.down||b.touching.down;
    const speed=Math.abs(b.velocity.x);
    if(b.velocity.x>8)this.runnerFacing=1;
    else if(b.velocity.x<-8)this.runnerFacing=-1;

    this.runnerPhase+=(delta||16)*(0.0045+Math.min(1,speed/RUN_PHYSICS.runSpeed)*0.0105);
    c.x=p.x;c.y=p.y+1;c.scaleX=this.runnerFacing;

    const g=c.bodyGraphics,halo=c.glowGraphics;
    g.clear();halo.clear();

    const moving=speed>35;
    const phase=this.runnerPhase;
    const stride=grounded&&moving?Math.sin(phase)*9:0;
    const lift=grounded&&moving?Math.max(0,Math.sin(phase*2))*2:0;
    const lean=grounded?Math.min(.13,speed/2600):(b.velocity.y<0?.10:.03);

    // speed streaks
    if(grounded&&speed>120){
      halo.lineStyle(2,C.cyan,.28);
      const tail=18+speed*.045;
      for(let i=0;i<3;i++) halo.lineBetween(-13-tail-i*7,5+i*5,-15-i*3,5+i*5);
      halo.fillStyle(C.cyan,.12).fillCircle(-18,18,5);
    }

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
      halo.lineStyle(9,C.cyan,.10*alpha);halo.lineBetween(a.x,a.y,k.x,k.y);halo.lineBetween(k.x,k.y,f.x,f.y);
      g.lineStyle(5,C.player,alpha);g.lineBetween(a.x,a.y,k.x,k.y);g.lineBetween(k.x,k.y,f.x,f.y);
      g.fillStyle(C.player,alpha).fillCircle(k.x,k.y,2.5);
    };

    // rear limbs
    drawLimb({x:hip.x-2,y:hip.y},rk,rf,.58);
    drawLimb({x:shoulder.x-2,y:shoulder.y},re,rh,.58);

    // torso glow + body
    halo.lineStyle(11,C.cyan,.11);halo.lineBetween(hip.x,hip.y,shoulder.x,shoulder.y);
    g.lineStyle(7,C.player,1);g.lineBetween(hip.x,hip.y,shoulder.x,shoulder.y);

    // front limbs
    drawLimb({x:hip.x+2,y:hip.y},lk,lf,1);
    drawLimb({x:shoulder.x+2,y:shoulder.y},le,lh,1);

    // head
    halo.fillStyle(C.cyan,.12).fillCircle(shoulder.x+2,shoulder.y-9,7);
    g.fillStyle(C.player,1).fillCircle(shoulder.x+2,shoulder.y-9,5);
    g.lineStyle(1,0x9df0ff,.8).strokeCircle(shoulder.x+2,shoulder.y-9,5);

    // chest accent
    g.fillStyle(C.cyan,.95).fillCircle(shoulder.x+1,shoulder.y+2,1.6);
  }

  showLevelCard(index,name){
    const n=this.add.text(640,260,'LEVEL '+String(index+1).padStart(3,'0'),{fontFamily:'Arial Black,Arial',fontSize:'14px',color:'#ff3159',letterSpacing:4}).setOrigin(.5).setScrollFactor(0).setDepth(1200);
    const t=this.add.text(640,302,name,{fontFamily:'Arial Black,Arial',fontSize:'38px',color:'#ffffff'}).setOrigin(.5).setScrollFactor(0).setDepth(1200);
    n.setAlpha(0);t.setAlpha(0);
    this.tweens.add({targets:[n,t],alpha:1,duration:120,yoyo:true,hold:430,onComplete:()=>{n.destroy();t.destroy();}});
  }

  killPlayer(manual){
    if(!this.runActive||this.finished||this.dead||this.levelLocked) return;
    this.dead=true;
    this.deaths+=1;
    this.deathText.setText('DEATHS  '+this.deaths);
    this.player.body.enable=false;
    this.player.setVisible(false);
    if(this.playerVisual)this.playerVisual.setVisible(false);
    this.cameras.main.shake(85,.004);
    this.cameras.main.flash(70,255,49,89,false);
    const msg=this.add.text(640,355,manual?'RESTART':'DEAD',{fontFamily:'Arial Black,Arial',fontSize:'32px',color:'#ff3159'}).setOrigin(.5).setScrollFactor(0).setDepth(1500);
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
    this.progressFill.width=760*(level/RUN_LEVEL_COUNT);
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
    const clear=this.add.text(640,348,'CLEAR · '+formatTime(levelTimeMs)+suffix,{fontFamily:'Arial Black,Arial',fontSize:'30px',color:'#69ff9c'}).setOrigin(.5).setScrollFactor(0).setDepth(1500);
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
    this.add.rectangle(640,360,1280,720,0x050609,.88).setScrollFactor(0).setDepth(2500);
    this.add.text(640,145,'LEVEL '+RUN_LEVEL_COUNT+' COMPLETE',{fontFamily:'Arial Black,Arial',fontSize:'46px',color:'#ffffff'}).setOrigin(.5).setScrollFactor(0).setDepth(2501);
    this.add.text(640,235,formatTime(levelTimeMs),{fontFamily:'Arial Black,Arial',fontSize:'58px',color:'#69ff9c'}).setOrigin(.5).setScrollFactor(0).setDepth(2501);
    let note=this.practice?'PRACTICE — NOT SUBMITTED':'LEVEL '+RUN_LEVEL_COUNT;
    if(!this.practice&&result&&result.isPersonalBest) note+='   ·   NEW PERSONAL BEST';
    this.add.text(640,305,note,{fontFamily:'Arial Black,Arial',fontSize:'13px',color:this.practice?'#8f96a3':'#ff3159'}).setOrigin(.5).setScrollFactor(0).setDepth(2501);
    this.add.text(640,410,this.leaderboardText(),{fontFamily:'monospace',fontSize:'15px',color:'#e8eaf0',align:'left',lineSpacing:7}).setOrigin(.5).setScrollFactor(0).setDepth(2501);
    this.add.text(640,590,'REFRESH PAGE TO RUN AGAIN   ·   H  EIXO HOME',{fontFamily:'Arial Black,Arial',fontSize:'12px',color:'#7b818d'}).setOrigin(.5).setScrollFactor(0).setDepth(2501);
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
      if(o.visual){o.visual.x=nx;o.visual.y=ny;}
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
          o.setAlpha(on ? .98 : .13);
          o.glow.setAlpha(on ? .18 : .035);
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
