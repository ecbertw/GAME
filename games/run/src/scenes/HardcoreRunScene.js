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
    const bar=this.add.rectangle(640,42,1230,58,0x0c0e13,.94).setStrokeStyle(1,0x2c3038,.95);
    this.levelText=this.add.text(40,25,'001 / 900', {fontFamily:'Arial Black,Arial',fontSize:'15px',color:'#ffffff'});
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
    this.startRules=this.add.text(640,285,'900 LEVELS · EACH LEVEL HAS ITS OWN CLOCK\nRANKING = HIGHEST LEVEL · FASTEST TIME',{
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
    this.levelObjects.forEach(x=>{ try{x.destroy();}catch(_){} });
    this.levelObjects=[];
    this.dynamicHazards=[];
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
    for(const s of L.spikes||[]) this.addSpikes(s[0],s[1],s[2]);
    for(const s of L.saws||[]) this.addSaw(s);
    for(const l of L.lasers||[]) this.addLaser(l);

    this.createGoal(L.goal[0],L.goal[1]);
    this.createPlayer(L.spawn[0],L.spawn[1]);

    this.levelText.setText(String(index+1).padStart(3,'0')+' / '+String(RUN_LEVEL_COUNT).padStart(3,'0'));
    this.nameText.setText(L.name);
    this.progressFill.width=760*(index/RUN_LEVEL_COUNT);
    this.cameras.main.startFollow(this.player,true,.11,.08,-230,20);
    this.cameras.main.scrollX=0;
    if(resetClock&&this.runActive) this.levelStartedAt=this.time.now;

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

  update(time){
    if(!this.player) return;
    this.updateDynamicHazards(time);

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
