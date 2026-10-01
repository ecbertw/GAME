const LEVELS = [
  {
    name:'FIRST BLOOD', width:1900, spawn:[82,615], goal:[1810,650],
    floors:[[0,430,650],[520,900,650],[1000,1350,650],[1460,1900,650]],
    platforms:[[665,555,150,22],[1168,548,148,22]],
    spikes:[[250,650,74],[745,650,76],[1190,650,78],[1635,650,84]]
  },
  {
    name:'NEEDLES', width:2150, spawn:[82,615], goal:[2070,650],
    floors:[[0,2150,650]],
    platforms:[[460,545,126,20],[825,520,130,20],[1180,550,130,20],[1540,515,126,20],[1840,555,118,20]],
    spikes:[[270,650,105],[590,650,125],[950,650,135],[1310,650,125],[1665,650,128],[1940,650,92]]
  },
  {
    name:'STAIRCASE', width:2200, spawn:[80,615], goal:[2110,500],
    floors:[[0,420,650],[500,820,620],[900,1220,590],[1300,1600,555],[1690,2200,500]],
    platforms:[[420,555,92,20],[840,525,92,20],[1260,490,92,20],[1645,440,92,20]],
    spikes:[[300,650,78],[665,620,70],[1050,590,72],[1445,555,70],[1870,500,95]]
  },
  {
    name:'THE SHAFT', width:2050, spawn:[82,615], goal:[1970,650],
    floors:[[0,430,650],[720,1080,650],[1370,1710,650],[1790,2050,650]],
    platforms:[[500,575,115,20],[615,495,105,20],[1130,565,110,20],[1240,485,105,20],[1325,405,95,20],[1685,520,90,20]],
    walls:[[680,545,24,210],[1095,545,24,210],[1360,500,24,300],[1740,565,24,170]],
    spikes:[[300,650,82],[830,650,90],[1500,650,90],[1885,650,70]]
  },
  {
    name:'THREAD', width:2380, spawn:[80,615], goal:[2290,650],
    floors:[[0,330,650],[520,810,650],[1010,1300,650],[1510,1800,650],[2010,2380,650]],
    platforms:[[410,575,78,18],[905,535,72,18],[1405,575,72,18],[1905,535,72,18]],
    spikes:[[190,650,72],[650,650,96],[1140,650,100],[1645,650,102],[2170,650,92]],
    saws:[[750,500,21,'y',130,1500,0],[1260,465,21,'y',145,1650,350],[1760,485,22,'y',140,1450,700]]
  },
  {
    name:'TEETH', width:2450, spawn:[80,615], goal:[2360,650],
    floors:[[0,2450,650]],
    platforms:[[410,530,105,20],[775,545,110,20],[1135,520,105,20],[1500,550,112,20],[1850,520,106,20],[2170,545,100,20]],
    spikes:[[250,650,100],[540,650,130],[900,650,140],[1250,650,140],[1620,650,135],[1980,650,130],[2250,650,80]],
    saws:[[675,575,22,'x',95,1350,0],[1040,570,23,'x',90,1450,420],[1430,575,23,'x',90,1300,740],[1785,570,23,'x',95,1400,220]]
  },
  {
    name:'NO FLOOR', width:2500, spawn:[80,615], goal:[2410,650],
    floors:[[0,290,650],[2220,2500,650]],
    platforms:[[390,590,110,18],[555,515,90,18],[715,570,86,18],[865,485,84,18],[1020,555,82,18],[1170,470,82,18],[1325,545,82,18],[1480,460,82,18],[1635,535,82,18],[1790,450,84,18],[1950,530,90,18],[2100,585,105,18]],
    saws:[[635,405,21,'x',85,1500,200],[1250,390,21,'x',90,1450,600],[1870,390,22,'x',90,1350,900]]
  },
  {
    name:'ASCENT', width:2200, spawn:[80,615], goal:[2110,315],
    floors:[[0,390,650],[1860,2200,315]],
    platforms:[[470,575,112,20],[615,505,108,20],[760,435,104,20],[905,365,100,20],[1050,455,98,20],[1195,385,94,20],[1340,315,94,20],[1485,405,94,20],[1630,350,94,20],[1775,295,110,20]],
    walls:[[1015,510,20,250],[1450,430,20,260]],
    spikes:[[235,650,75],[1980,315,78]],
    saws:[[1110,300,21,'y',120,1450,0],[1555,250,21,'y',100,1320,500]]
  },
  {
    name:'PULSE', width:2450, spawn:[80,615], goal:[2360,650],
    floors:[[0,2450,650]],
    platforms:[[430,545,110,20],[840,515,104,20],[1250,545,104,20],[1660,515,104,20],[2070,545,104,20]],
    spikes:[[250,650,82],[605,650,90],[1015,650,90],[1425,650,90],[1835,650,90],[2225,650,82]],
    lasers:[[735,505,10,145,1500,0],[1145,490,10,160,1450,450],[1555,505,10,145,1400,800],[1965,490,10,160,1350,200]]
  },
  {
    name:'LOCKSTEP', width:2600, spawn:[80,615], goal:[2510,650],
    floors:[[0,390,650],[500,830,620],[940,1260,590],[1370,1690,620],[1800,2120,590],[2230,2600,650]],
    platforms:[[445,540,76,18],[885,505,76,18],[1315,500,76,18],[1745,505,76,18],[2175,540,76,18]],
    spikes:[[250,650,82],[650,620,92],[1090,590,92],[1520,620,92],[1950,590,92],[2390,650,85]],
    saws:[[760,480,22,'x',105,1280,0],[1200,445,22,'x',105,1240,350],[1630,480,22,'x',105,1200,700],[2060,445,22,'x',105,1160,150]],
    lasers:[[900,470,9,120,1250,250],[1760,470,9,120,1180,650]]
  },
  {
    name:'NO REST', width:2800, spawn:[80,615], goal:[2710,650],
    floors:[[0,320,650],[470,740,650],[900,1170,650],[1330,1600,650],[1760,2030,650],[2190,2460,650],[2580,2800,650]],
    platforms:[[390,555,72,18],[820,515,70,18],[1250,555,70,18],[1680,515,70,18],[2110,555,70,18],[2520,515,70,18]],
    spikes:[[170,650,72],[575,650,82],[1000,650,82],[1430,650,82],[1860,650,82],[2290,650,82],[2660,650,70]],
    saws:[[690,505,22,'y',115,1200,0],[1120,470,22,'y',120,1160,300],[1550,505,22,'y',115,1120,600],[1980,470,22,'y',120,1080,900],[2410,505,22,'y',115,1040,150]],
    lasers:[[785,500,9,150,1120,200],[1645,500,9,150,1080,500],[2500,500,9,150,1040,800]]
  },
  {
    name:'THE LINE', width:3150, spawn:[80,615], goal:[3060,650],
    floors:[[0,360,650],[490,780,650],[930,1210,620],[1360,1640,650],[1790,2070,600],[2220,2500,650],[2650,3150,650]],
    platforms:[[425,545,70,18],[855,500,66,18],[1285,520,66,18],[1715,485,66,18],[2145,505,66,18],[2575,485,66,18]],
    spikes:[[210,650,82],[600,650,95],[1030,620,92],[1470,650,92],[1900,600,92],[2330,650,92],[2820,650,130]],
    saws:[[745,490,23,'x',100,1080,0],[1175,455,23,'x',100,1040,250],[1605,470,23,'x',100,1000,500],[2035,450,23,'x',100,960,750],[2465,470,23,'x',100,920,150]],
    lasers:[[905,470,10,150,980,200],[1335,480,10,170,940,450],[1765,450,10,180,900,700],[2195,470,10,160,860,100],[2625,460,10,170,820,350]]
  }
];

const C = {
  bg:0x08090d, grid:0x242730, platform:0xe9ecf2, platformEdge:0xffffff,
  hazard:0xff3159, safe:0x69ff9c, player:0xf8fafc, accent:0xff3159, muted:0x8a909d
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
    this.splits=[];
    this.runActive=false;
    this.finished=false;
    this.starting=false;
    this.attemptId=null;
    this.practice=false;
    this.levelObjects=[];
    this.levelLinks=[];
    this.dynamicHazards=[];
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
    this.loadLevel(0);
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
    const bar=this.add.rectangle(640,42,1230,58,0x0c0e13,.94).setStrokeStyle(1,0x2c3038,.95);
    this.levelText=this.add.text(40,25,'01 / 12', {fontFamily:'Arial Black,Arial',fontSize:'15px',color:'#ffffff'});
    this.nameText=this.add.text(126,25,'FIRST BLOOD', {fontFamily:'Arial Black,Arial',fontSize:'15px',color:'#8f96a3'});
    this.timerText=this.add.text(640,18,'00:00.000',{fontFamily:'Arial Black,Arial',fontSize:'28px',color:'#ffffff'}).setOrigin(.5,0);
    this.pbText=this.add.text(1230,21,'PB  --:--.---',{fontFamily:'Arial Black,Arial',fontSize:'13px',color:'#8f96a3'}).setOrigin(1,0);
    this.deathText=this.add.text(1230,43,'DEATHS  0',{fontFamily:'Arial Black,Arial',fontSize:'10px',color:'#ff3159'}).setOrigin(1,0);
    this.progressBase=this.add.rectangle(640,80,760,3,0x2a2d34,.85);
    this.progressFill=this.add.rectangle(260,80,0,3,C.accent,1).setOrigin(0,.5);
    this.hud.add([bar,this.levelText,this.nameText,this.timerText,this.pbText,this.deathText,this.progressBase,this.progressFill]);

    this.controls=this.add.text(30,686,'A/D ou ←/→  MOVE   ·   SPACE/W/↑  JUMP + WALL JUMP   ·   R  RESTART   ·   H  HOME',{
      fontFamily:'Arial Black,Arial',fontSize:'10px',color:'#676d79',letterSpacing:1
    }).setScrollFactor(0).setDepth(1000);
  }

  createStartOverlay(){
    this.startShade=this.add.rectangle(640,360,1280,720,0x050609,.84).setScrollFactor(0).setDepth(2000);
    this.startTitle=this.add.text(640,150,'RUN',{fontFamily:'Arial Black,Arial',fontSize:'92px',fontStyle:'italic',color:'#ffffff'}).setOrigin(.5).setScrollFactor(0).setDepth(2001);
    this.startTitle.setShadow(8,8,'#ff3159',0,true,true);
    this.startSub=this.add.text(640,225,'HARDCORE PLATFORMER',{fontFamily:'Arial Black,Arial',fontSize:'16px',color:'#ff3159',letterSpacing:5}).setOrigin(.5).setScrollFactor(0).setDepth(2001);
    this.startRules=this.add.text(640,285,'12 LEVELS · ONE CLOCK · EVERY DEATH COSTS TIME\nNO CHECKPOINTS INSIDE A LEVEL · FASTEST TOTAL TIME WINS',{
      fontFamily:'Arial Black,Arial',fontSize:'13px',color:'#b5bac5',align:'center',lineSpacing:10
    }).setOrigin(.5).setScrollFactor(0).setDepth(2001);
    this.startRanking=this.add.text(640,380,'WORLD TOP\nLOADING...',{
      fontFamily:'monospace',fontSize:'15px',color:'#e8eaf0',align:'left',lineSpacing:7
    }).setOrigin(.5).setScrollFactor(0).setDepth(2001);
    this.startPrompt=this.add.text(640,570,'SPACE / ENTER / CLICK  —  START RUN',{
      fontFamily:'Arial Black,Arial',fontSize:'17px',color:'#69ff9c'
    }).setOrigin(.5).setScrollFactor(0).setDepth(2001);
    this.startNote=this.add.text(640,615,'LOGIN REQUIRED FOR GLOBAL RANKING · PRACTICE STILL WORKS WITHOUT LOGIN',{
      fontFamily:'Arial Black,Arial',fontSize:'10px',color:'#656b77',letterSpacing:1
    }).setOrigin(.5).setScrollFactor(0).setDepth(2001);
    this.startObjects=[this.startShade,this.startTitle,this.startSub,this.startRules,this.startRanking,this.startPrompt,this.startNote];
  }

  queueJump(){
    this.jumpBufferUntil=this.time.now+120;
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
      }else{
        this.practice=true;
      }
    }catch(_){
      this.practice=true;
    }
    this.attemptId=runId;
    this.runActive=true;
    this.starting=false;
    this.runStartedAt=this.time.now;
    this.levelStartedAt=this.time.now;
    this.startObjects.forEach(o=>o.setVisible(false));
    this.controls.setAlpha(.78);
    if(this.practice) this.pbText.setText('PRACTICE');
  }

  clearLevel(){
    this.levelLinks.forEach(x=>{ try{x.destroy();}catch(_){} });
    this.levelLinks=[];
    this.levelObjects.forEach(x=>{ try{x.destroy();}catch(_){} });
    this.levelObjects=[];
    this.dynamicHazards=[];
    this.player=null;
    this.goalTrigger=null;
  }

  loadLevel(index){
    this.clearLevel();
    this.levelIndex=index;
    this.dead=false;
    this.levelLocked=false;
    const L=LEVELS[index];
    this.physics.world.setBounds(0,0,L.width,720);
    this.cameras.main.setBounds(0,0,L.width,720);
    this.drawGrid(L.width);

    for(const f of L.floors||[]) this.addFloor(f[0],f[1],f[2]);
    for(const p of L.platforms||[]) this.addPlatform(p[0],p[1],p[2],p[3]);
    for(const w of L.walls||[]) this.addPlatform(w[0],w[1],w[2],w[3]);
    for(const s of L.spikes||[]) this.addSpikes(s[0],s[1],s[2]);
    for(const s of L.saws||[]) this.addSaw(s);
    for(const l of L.lasers||[]) this.addLaser(l);

    this.createGoal(L.goal[0],L.goal[1]);
    this.createPlayer(L.spawn[0],L.spawn[1]);

    this.levelText.setText(String(index+1).padStart(2,'0')+' / '+String(LEVELS.length).padStart(2,'0'));
    this.nameText.setText(L.name);
    this.progressFill.width=760*(index/LEVELS.length);
    this.cameras.main.startFollow(this.player,true,.11,.08,-230,20);
    this.cameras.main.scrollX=0;
    this.levelStartedAt=this.time.now;

    this.showLevelCard(index,L.name);
  }

  drawGrid(width){
    const g=this.add.graphics().setDepth(-10);
    g.fillStyle(C.bg,1).fillRect(0,0,width,720);
    g.lineStyle(1,C.grid,.22);
    for(let x=0;x<width;x+=80) g.lineBetween(x,0,x,720);
    for(let y=0;y<=720;y+=80) g.lineBetween(0,y,width,y);
    g.lineStyle(1,0xffffff,.035);
    for(let x=40;x<width;x+=400) g.lineBetween(x,0,x,720);
    this.levelObjects.push(g);
  }

  addFloor(start,end,top){
    const h=720-top+90;
    return this.addPlatform((start+end)/2,top+h/2,end-start,h,true);
  }

  addPlatform(x,y,w,h,solidFloor=false){
    const r=this.add.rectangle(x,y,w,h,C.platform,solidFloor?1:.96).setDepth(5);
    r.setStrokeStyle(1,C.platformEdge,.45);
    r.__isPlatform=true;
    this.physics.add.existing(r,true);
    this.levelObjects.push(r);
    return r;
  }

  addSpikes(x,top,width){
    const h=24;
    const sensor=this.add.rectangle(x,top-h/2,width,h,C.hazard,.12).setDepth(9);
    sensor.__isHazard=true;
    this.physics.add.existing(sensor,true);
    const g=this.add.graphics().setDepth(10);
    const count=Math.max(2,Math.floor(width/22));
    const step=width/count;
    g.fillStyle(C.hazard,1);
    for(let i=0;i<count;i++){
      const left=x-width/2+i*step;
      g.fillTriangle(left,top,left+step/2,top-h,left+step,top);
    }
    this.levelObjects.push(sensor,g);
  }

  addSaw(spec){
    const x=spec[0], y=spec[1], r=spec[2], axis=spec[3], range=spec[4], period=spec[5], phase=spec[6]||0;
    const saw=this.add.circle(x,y,r,C.hazard,1).setDepth(12);
    saw.setStrokeStyle(4,0x6c1027,1);
    saw.__isHazard=true;
    const hub=this.add.circle(x,y,Math.max(4,r*.25),0x0b0c10,1).setDepth(13);
    this.physics.add.existing(saw,true);
    saw.baseX=x;saw.baseY=y;saw.axis=axis;saw.range=range;saw.period=period;saw.phase=phase;saw.hub=hub;
    this.levelObjects.push(saw,hub);
    this.dynamicHazards.push({type:'saw',obj:saw});
  }

  addLaser(spec){
    const x=spec[0], y=spec[1], w=spec[2], h=spec[3], period=spec[4], phase=spec[5]||0;
    const beam=this.add.rectangle(x,y,w,h,C.hazard,.95).setDepth(11);
    const glow=this.add.rectangle(x,y,w+12,h,C.hazard,.13).setDepth(10);
    beam.__isHazard=true;
    this.physics.add.existing(beam,true);
    beam.period=period;beam.phase=phase;beam.glow=glow;beam.lastOn=true;
    this.levelObjects.push(beam,glow);
    this.dynamicHazards.push({type:'laser',obj:beam});
  }

  createGoal(x,top){
    const gate=this.add.rectangle(x,top-48,44,96,0x0b0c10,.35).setStrokeStyle(3,C.safe,1).setDepth(8);
    const line=this.add.rectangle(x,top-48,4,82,C.safe,.9).setDepth(9);
    const label=this.add.text(x,top-115,'EXIT',{fontFamily:'Arial Black,Arial',fontSize:'10px',color:'#69ff9c'}).setOrigin(.5).setDepth(9);
    const trigger=this.add.rectangle(x,top-48,48,100,0x69ff9c,0);
    trigger.__isGoal=true;
    this.physics.add.existing(trigger,true);
    this.goalTrigger=trigger;
    this.levelObjects.push(gate,line,label,trigger);
  }

  createPlayer(x,y){
    this.player=this.add.rectangle(x,y,26,38,C.player,1).setDepth(30);
    this.player.setStrokeStyle(2,0x0a0b0f,1);
    this.physics.add.existing(this.player);
    const b=this.player.body;
    b.setSize(24,36);
    b.setMaxVelocity(460,980);
    b.setDragX(0);
    b.setCollideWorldBounds(false);

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

  showLevelCard(index,name){
    const n=this.add.text(640,260,'LEVEL '+String(index+1).padStart(2,'0'),{fontFamily:'Arial Black,Arial',fontSize:'14px',color:'#ff3159',letterSpacing:4}).setOrigin(.5).setScrollFactor(0).setDepth(1200);
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
    this.player.setFillStyle(C.hazard,1);
    this.cameras.main.shake(85,.004);
    this.cameras.main.flash(70,255,49,89,false);
    const msg=this.add.text(640,355,manual?'RESTART':'DEAD',{fontFamily:'Arial Black,Arial',fontSize:'32px',color:'#ff3159'}).setOrigin(.5).setScrollFactor(0).setDepth(1500);
    this.time.delayedCall(190,()=>{
      msg.destroy();
      this.loadLevel(this.levelIndex);
    });
  }

  completeLevel(){
    if(!this.runActive||this.finished||this.dead||this.levelLocked) return;
    this.levelLocked=true;
    const elapsed=this.time.now-this.runStartedAt;
    this.splits.push(Math.round(elapsed));
    this.progressFill.width=760*((this.levelIndex+1)/LEVELS.length);
    this.player.body.setVelocity(0,0);
    this.player.body.enable=false;

    if(this.levelIndex===LEVELS.length-1){
      this.finishRun();
      return;
    }
    const clear=this.add.text(640,348,'CLEAR',{fontFamily:'Arial Black,Arial',fontSize:'42px',color:'#69ff9c'}).setOrigin(.5).setScrollFactor(0).setDepth(1500);
    this.time.delayedCall(320,()=>{
      clear.destroy();
      this.loadLevel(this.levelIndex+1);
    });
  }

  async finishRun(){
    this.finished=true;
    this.runActive=false;
    let finalMs=Math.round(this.time.now-this.runStartedAt);
    let serverResult=null;
    if(this.attemptId){
      try{
        const res=await fetch('/api/run/finish',{
          method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',
          body:JSON.stringify({runId:this.attemptId,timeMs:finalMs,deaths:this.deaths,splits:this.splits})
        });
        if(res.ok){
          serverResult=await res.json();
          if(Number.isFinite(serverResult.timeMs)) finalMs=serverResult.timeMs;
        }
      }catch(_){}
    }
    this.timerText.setText(formatTime(finalMs));
    await this.refreshLeaderboard();
    this.showFinishOverlay(finalMs,serverResult);
  }

  showFinishOverlay(finalMs,result){
    this.add.rectangle(640,360,1280,720,0x050609,.88).setScrollFactor(0).setDepth(2500);
    this.add.text(640,145,'RUN COMPLETE',{fontFamily:'Arial Black,Arial',fontSize:'52px',color:'#ffffff'}).setOrigin(.5).setScrollFactor(0).setDepth(2501);
    this.add.text(640,235,formatTime(finalMs),{fontFamily:'Arial Black,Arial',fontSize:'58px',color:'#69ff9c'}).setOrigin(.5).setScrollFactor(0).setDepth(2501);
    let note='DEATHS  '+this.deaths;
    if(this.practice) note+='   ·   PRACTICE — NOT SUBMITTED';
    else if(result&&result.isPersonalBest) note+='   ·   NEW PERSONAL BEST';
    this.add.text(640,305,note,{fontFamily:'Arial Black,Arial',fontSize:'13px',color:this.practice?'#8f96a3':'#ff3159'}).setOrigin(.5).setScrollFactor(0).setDepth(2501);
    this.add.text(640,410,this.leaderboardText(),{fontFamily:'monospace',fontSize:'15px',color:'#e8eaf0',align:'left',lineSpacing:7}).setOrigin(.5).setScrollFactor(0).setDepth(2501);
    this.add.text(640,590,'REFRESH PAGE TO RUN AGAIN   ·   H  EIXO HOME',{fontFamily:'Arial Black,Arial',fontSize:'12px',color:'#7b818d'}).setOrigin(.5).setScrollFactor(0).setDepth(2501);
  }

  leaderboardText(){
    const rows=(this.rankingData&&this.rankingData.players)||[];
    if(!rows.length) return 'WORLD TOP\nNO TIMES YET';
    const lines=['WORLD TOP'];
    rows.slice(0,7).forEach((p,i)=>{
      const pos=String(i+1).padStart(2,'0');
      const name=String(p.name||'PLAYER').slice(0,14).padEnd(14,' ');
      lines.push(pos+'  '+name+'  '+formatTime(Number(p.timeMs)));
    });
    if(this.rankingData&&this.rankingData.me&&this.rankingData.me.timeMs){
      lines.push('');
      lines.push('YOUR PB  '+formatTime(Number(this.rankingData.me.timeMs))+'  #'+this.rankingData.me.rank);
    }
    return lines.join('\n');
  }

  async refreshLeaderboard(){
    try{
      const res=await fetch('/api/run/rankings?limit=10',{credentials:'same-origin'});
      if(res.ok){
        this.rankingData=await res.json();
        if(this.rankingData.me&&this.rankingData.me.timeMs&&!this.practice){
          this.pbText.setText('PB  '+formatTime(Number(this.rankingData.me.timeMs)));
        }
      }
    }catch(_){}
    if(this.startRanking&&this.startRanking.visible) this.startRanking.setText(this.leaderboardText());
    return this.rankingData;
  }

  update(time){
    if(!this.player) return;
    this.updateDynamicHazards(time);

    if(this.runActive&&!this.finished){
      const elapsed=this.time.now-this.runStartedAt;
      this.timerText.setText(formatTime(elapsed));
    }

    if(!this.runActive||this.finished||this.dead||this.levelLocked) return;

    const b=this.player.body;
    const left=this.keys.left.isDown||this.keys.a.isDown;
    const right=this.keys.right.isDown||this.keys.d.isDown;
    const grounded=b.blocked.down||b.touching.down;
    const wallLeft=b.blocked.left||b.touching.left;
    const wallRight=b.blocked.right||b.touching.right;

    if(grounded) this.coyoteUntil=this.time.now+95;
    const onWall=!grounded&&(wallLeft||wallRight);
    if(onWall&&b.velocity.y>190) b.setVelocityY(190);

    const target=left&&!right?-350:right&&!left?350:0;
    const accel=grounded?0.32:0.20;
    b.setVelocityX(Phaser.Math.Linear(b.velocity.x,target,accel));

    const jumpHeld=this.keys.jump.isDown||this.keys.w.isDown||this.keys.up.isDown;
    const wantsJump=this.time.now<=this.jumpBufferUntil;
    if(wantsJump){
      if(onWall){
        b.setVelocityY(-570);
        b.setVelocityX(wallLeft?430:-430);
        this.jumpBufferUntil=0;
        this.coyoteUntil=0;
      }else if(grounded||this.time.now<=this.coyoteUntil){
        b.setVelocityY(-610);
        this.jumpBufferUntil=0;
        this.coyoteUntil=0;
      }
    }

    if(this.jumpWasHeld&&!jumpHeld&&b.velocity.y<-210) b.setVelocityY(b.velocity.y*.48);
    this.jumpWasHeld=jumpHeld;

    if(this.player.y>770||this.player.x<-80) this.killPlayer(false);
  }

  updateDynamicHazards(time){
    for(const d of this.dynamicHazards){
      const o=d.obj;
      if(!o||!o.body) continue;
      if(d.type==='saw'){
        const wave=Math.sin(((time+o.phase)%o.period)/o.period*Math.PI*2);
        if(o.axis==='x') o.x=o.baseX+wave*o.range;
        else o.y=o.baseY+wave*o.range;
        o.hub.x=o.x;o.hub.y=o.y;
        o.body.updateFromGameObject();
      }else if(d.type==='laser'){
        const on=((time+o.phase)%o.period)<o.period*.58;
        if(on!==o.lastOn){
          o.lastOn=on;
          o.body.enable=on;
          o.setAlpha(on ? .98 : .13);
          o.glow.setAlpha(on ? .18 : .035);
        }
      }
    }
  }
}
