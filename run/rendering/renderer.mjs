import{animationState}from'../player/animation-state.mjs';
import{SpritePlayer}from'../player/sprite-player.mjs';

const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export class Renderer{
  constructor(canvas,level){
    this.c=canvas;
    this.ctx=canvas.getContext('2d',{alpha:false});
    this.level=level;
    this.dpr=1;
    this.assets={};
    this.spritePlayer=new SpritePlayer();
    this.particles=[];
    this.trail=[];
    this.lastState='idle';
    this.stars=Array.from({length:95},(_,i)=>({
      x:(i*137.37)%1,
      y:.04+((i*73.17)%1)*.58,
      r:.5+(i%4)*.35,
      a:.35+(i%5)*.11
    }));
    this.ready=this.load();
  }

  async load(){
    const load=(k,src)=>new Promise(res=>{
      const img=new Image();
      img.onload=()=>{this.assets[k]=img;res()};
      img.onerror=()=>res();
      img.src=src;
    });
    await Promise.all([this.spritePlayer.ready,load('farArt','/assets/run/astral/ruins-far-v2.svg'),load('nearArt','/assets/run/astral/ruins-near-v2.svg'),load('fgArt','/assets/run/astral/foreground-v2.svg')]);
  }

  resize(){
    const r=this.c.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);
    const cw=Math.max(1,Math.round(r.width*d)),ch=Math.max(1,Math.round(r.height*d));
    if(this.c.width!==cw||this.c.height!==ch){this.c.width=cw;this.c.height=ch}
    this.dpr=d;
  }

  world(ctx,cam,scale,ox,oy){
    ctx.setTransform(this.dpr*scale,0,0,this.dpr*scale,this.dpr*(ox-cam.x*scale),this.dpr*(oy-cam.y*scale));
  }

  drawSky(ctx,w,h,cam){
    const sky=ctx.createLinearGradient(0,0,0,h);
    sky.addColorStop(0,'#102b72');
    sky.addColorStop(.45,'#345dba');
    sky.addColorStop(.73,'#7b88db');
    sky.addColorStop(1,'#d6bdf4');
    ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);

    const moonX=w*.74-(cam.x*.018*w)%w*.08,moonY=h*.19-cam.y*2.5,moonR=Math.min(w,h)*.16;
    const mg=ctx.createRadialGradient(moonX-moonR*.28,moonY-moonR*.32,moonR*.08,moonX,moonY,moonR);
    mg.addColorStop(0,'#ffffff');mg.addColorStop(.56,'#f2f4ff');mg.addColorStop(.84,'#d7e7ff');mg.addColorStop(1,'#9eb9ef');
    ctx.fillStyle=mg;ctx.beginPath();ctx.arc(moonX,moonY,moonR,0,TAU);ctx.fill();
    ctx.globalAlpha=.12;ctx.fillStyle='#6f78b8';
    for(let i=0;i<7;i++){ctx.beginPath();ctx.ellipse(moonX+(i%3-1)*moonR*.32,moonY+(Math.floor(i/3)-1)*moonR*.25,moonR*(.09+(i%2)*.04),moonR*.055,0,0,TAU);ctx.fill()}
    ctx.globalAlpha=1;

    for(const s of this.stars){
      const sx=((s.x*w*1.35-cam.x*1.8)% (w*1.35)+w*1.35)%(w*1.35)-w*.12;
      ctx.globalAlpha=s.a;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(sx,s.y*h,s.r,0,TAU);ctx.fill();
    }
    ctx.globalAlpha=1;

    this.cloudBand(ctx,w,h,cam,.028,h*.29,'#f8e8ff',.30);
    this.cloudBand(ctx,w,h,cam,.055,h*.46,'#e7d7ff',.22);
  }

  cloudBand(ctx,w,h,cam,factor,y,color,alpha){
    const shift=-((cam.x*28*factor)%(w*.72));
    ctx.globalAlpha=alpha;ctx.fillStyle=color;
    for(let row=0;row<2;row++){
      for(let i=-2;i<5;i++){
        const x=shift+i*w*.34+row*w*.12;
        const yy=y+row*58;
        ctx.beginPath();
        ctx.ellipse(x,yy,95,28,0,0,TAU);
        ctx.ellipse(x+70,yy+4,78,23,0,0,TAU);
        ctx.ellipse(x-68,yy+7,66,20,0,0,TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha=1;
  }

  imageParallax(ctx,img,w,h,cam,factor,y,sizeH,alpha=1){
    if(!img)return;
    const tileW=w*1.35,shift=-((cam.x*34*factor)%tileW);
    ctx.save();ctx.globalAlpha=alpha;
    for(let i=-1;i<3;i++)ctx.drawImage(img,shift+i*tileW,y-cam.y*factor*6,tileW,sizeH);
    ctx.restore();
  }

  drawParallaxRuins(ctx,w,h,cam,factor,baseY,scaleY,alpha,near=false){
    const spacing=235,shift=-((cam.x*38*factor)%spacing);
    ctx.save();ctx.globalAlpha=alpha;
    for(let i=-2;i<Math.ceil(w/spacing)+3;i++){
      const x=shift+i*spacing+(i%2)*34;
      const seed=((i%7)+7)%7;
      const towerH=(135+seed*19)*scaleY;
      const width=52+(seed%3)*12;
      const grad=ctx.createLinearGradient(x,baseY-towerH,x+width,baseY);
      grad.addColorStop(0,near?'#233d7d':'#7180c5');
      grad.addColorStop(1,near?'#142952':'#4e61a7');
      ctx.fillStyle=grad;
      ctx.fillRect(x,baseY-towerH,width,towerH);
      ctx.fillStyle=near?'#172c59':'#5f6fb2';
      ctx.fillRect(x+width*.32,baseY-towerH-32*scaleY,width*.36,32*scaleY);
      ctx.beginPath();ctx.moveTo(x+width*.32,baseY-towerH-32*scaleY);ctx.lineTo(x+width*.5,baseY-towerH-54*scaleY);ctx.lineTo(x+width*.68,baseY-towerH-32*scaleY);ctx.fill();

      if(seed%2===0){
        ctx.strokeStyle=near?'#627ed1':'#b2b9ee';ctx.lineWidth=near?8:6;
        ctx.beginPath();ctx.moveTo(x+width+18,baseY);ctx.lineTo(x+width+18,baseY-76*scaleY);
        ctx.quadraticCurveTo(x+width+72,baseY-140*scaleY,x+width+126,baseY-76*scaleY);
        ctx.lineTo(x+width+126,baseY);ctx.stroke();
      }
      if(seed%3===0){
        ctx.fillStyle=near?'#563f86':'#b49ee2';ctx.globalAlpha=alpha*.78;
        ctx.beginPath();ctx.ellipse(x+width*.5,baseY-towerH-67,74,15,0,0,TAU);ctx.fill();
        ctx.globalAlpha=alpha;
      }
    }
    ctx.restore();
  }

  drawFloatingIslands(ctx,w,h,cam){
    const shift=-((cam.x*12*.09)%310);
    ctx.save();ctx.globalAlpha=.43;
    for(let i=-1;i<8;i++){
      const x=shift+i*310+(i%2)*88,y=h*(.31+(i%3)*.07);
      ctx.fillStyle='#586bb3';
      ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+74,y-18,x+148,y);ctx.lineTo(x+112,y+54);ctx.lineTo(x+52,y+72);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#aeeaff';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x+12,y);ctx.lineTo(x+138,y);ctx.stroke();
      if(i%3===0){ctx.strokeStyle='#7fe9ff';ctx.globalAlpha=.25;ctx.lineWidth=11;ctx.beginPath();ctx.moveTo(x+93,y+5);ctx.lineTo(x+91,y+145);ctx.stroke();ctx.globalAlpha=.43}
    }
    ctx.restore();
  }

  drawWorldDecor(ctx,player){
    const d=this.level.decorations||{};
    for(const a of d.arches||[]){
      ctx.save();ctx.globalAlpha=.33;ctx.strokeStyle='#8aa0d6';ctx.lineWidth=.22;
      ctx.beginPath();ctx.moveTo(a.x,a.y+a.h);ctx.lineTo(a.x,a.y+1.2);
      ctx.quadraticCurveTo(a.x+a.w*.5,a.y-1.1,a.x+a.w,a.y+1.2);
      ctx.lineTo(a.x+a.w,a.y+a.h);ctx.stroke();
      ctx.strokeStyle='#b4d7ef';ctx.lineWidth=.045;ctx.stroke();ctx.restore();
    }
    for(const b of d.banners||[])this.banner(ctx,b);
    for(const c of d.crystals||[])this.crystal(ctx,c.x,c.y,c.s||1,'#48e6ff','#2877d9');
    for(const wf of d.waterfalls||[])this.waterfall(ctx,wf);
    for(const cp of this.level.checkpoints||[])this.checkpoint(ctx,cp,player);
  }

  waterfall(ctx,wf){
    const g=ctx.createLinearGradient(wf.x,0,wf.x+wf.w,0);
    g.addColorStop(0,'rgba(110,235,255,0)');
    g.addColorStop(.25,'rgba(116,239,255,.52)');
    g.addColorStop(.6,'rgba(224,250,255,.72)');
    g.addColorStop(1,'rgba(70,190,255,0)');
    ctx.fillStyle=g;ctx.fillRect(wf.x,wf.y,wf.w,wf.h);
    ctx.fillStyle='rgba(151,239,255,.18)';
    for(let i=0;i<4;i++)ctx.fillRect(wf.x+wf.w*(.15+i*.21),wf.y,wf.w*.05,wf.h);
  }

  banner(ctx,b){
    ctx.save();
    ctx.strokeStyle='#c6d4eb';ctx.lineWidth=.09;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x,b.y+b.h);ctx.stroke();
    const g=ctx.createLinearGradient(b.x,b.y,b.x,b.y+b.h);
    g.addColorStop(0,'#263a78');g.addColorStop(1,'#7d285f');
    ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(b.x+.08,b.y+.35);ctx.lineTo(b.x+1.05,b.y+.55);ctx.lineTo(b.x+.9,b.y+3.15);ctx.lineTo(b.x+.15,b.y+2.85);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#b7c9ff';ctx.lineWidth=.07;ctx.beginPath();ctx.arc(b.x+.55,b.y+1.55,.27,0,TAU);ctx.stroke();
    ctx.restore();
  }

  platform(r,ctx,kind='solid'){
    const thin=kind!=='solid';
    const depth=thin?Math.min(.95,Math.max(.55,r.h*2.2)):Math.max(1.35,r.h*.88);
    ctx.save();
    const rock=ctx.createLinearGradient(r.x,r.y,r.x,r.y+depth);
    rock.addColorStop(0,kind==='break'?'#65759c':'#53678f');
    rock.addColorStop(.18,'#35496f');
    rock.addColorStop(1,'#172748');
    ctx.fillStyle=rock;
    ctx.beginPath();
    ctx.moveTo(r.x,r.y+.05);ctx.lineTo(r.x+r.w,r.y+.05);
    ctx.lineTo(r.x+r.w-.18,r.y+depth*.52);
    ctx.lineTo(r.x+r.w*.82,r.y+depth);
    ctx.lineTo(r.x+r.w*.58,r.y+depth*.82);
    ctx.lineTo(r.x+r.w*.36,r.y+depth*1.06);
    ctx.lineTo(r.x+r.w*.12,r.y+depth*.72);
    ctx.lineTo(r.x,r.y+depth*.38);ctx.closePath();ctx.fill();

    const top=ctx.createLinearGradient(r.x,r.y-.12,r.x,r.y+.24);
    top.addColorStop(0,'#d7f7da');top.addColorStop(.34,'#84ba76');top.addColorStop(.42,'#687a68');top.addColorStop(1,'#4b5872');
    ctx.fillStyle=top;ctx.fillRect(r.x,r.y-.11,r.w,.34);

    ctx.strokeStyle='#aaf8ff';ctx.globalAlpha=kind==='moving'?.85:.36;ctx.lineWidth=.055;
    ctx.beginPath();ctx.moveTo(r.x+.12,r.y+.2);ctx.lineTo(r.x+r.w-.12,r.y+.2);ctx.stroke();ctx.globalAlpha=1;

    ctx.strokeStyle='#24375b';ctx.lineWidth=.05;
    const cracks=Math.min(7,Math.max(2,Math.floor(r.w/2.1)));
    for(let i=0;i<cracks;i++){
      const x=r.x+.45+(i+.35)*r.w/cracks;
      ctx.beginPath();ctx.moveTo(x,r.y+.38);ctx.lineTo(x-.16,r.y+.75);ctx.lineTo(x+.07,r.y+1.03);ctx.stroke();
    }
    if(kind==='moving'){
      ctx.fillStyle='#44def8';ctx.globalAlpha=.28;ctx.fillRect(r.x+.25,r.y+depth-.06,r.w-.5,.12);ctx.globalAlpha=1;
    }
    if(kind==='falling'){
      ctx.strokeStyle='#ffbd6b';ctx.lineWidth=.07;ctx.setLineDash([.16,.12]);ctx.strokeRect(r.x+.08,r.y+.04,r.w-.16,.32);ctx.setLineDash([]);
    }
    if(kind==='break'){
      ctx.strokeStyle='#ffcb7a';ctx.lineWidth=.055;ctx.beginPath();ctx.moveTo(r.x+r.w*.25,r.y+.15);ctx.lineTo(r.x+r.w*.5,r.y+.55);ctx.lineTo(r.x+r.w*.42,r.y+.9);ctx.moveTo(r.x+r.w*.68,r.y+.18);ctx.lineTo(r.x+r.w*.55,r.y+.55);ctx.stroke();
    }
    ctx.restore();
  }

  hazard(h,ctx){
    if(h.type==='void')return;
    const count=Math.max(2,Math.round(h.w/.34));
    for(let i=0;i<count;i++){
      const x=h.x+i*h.w/count,ww=h.w/count;
      const g=ctx.createLinearGradient(x,h.y+h.h,x+ww,h.y);
      g.addColorStop(0,'#6f102c');g.addColorStop(.55,'#ef2b4a');g.addColorStop(1,'#ff8c9e');
      ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x,h.y+h.h);ctx.lineTo(x+ww*.48,h.y);ctx.lineTo(x+ww,h.y+h.h);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#ffb1bf';ctx.lineWidth=.025;ctx.stroke();
    }
  }

  crystal(ctx,x,y,s=1,c1='#44eaff',c2='#6259ff'){
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);
    const g=ctx.createLinearGradient(-.2,-.6,.3,.6);g.addColorStop(0,'#e7ffff');g.addColorStop(.28,c1);g.addColorStop(1,c2);
    ctx.shadowColor=c1;ctx.shadowBlur=.35;ctx.fillStyle=g;
    ctx.beginPath();ctx.moveTo(0,-.62);ctx.lineTo(.28,-.05);ctx.lineTo(.12,.58);ctx.lineTo(0,.72);ctx.lineTo(-.14,.56);ctx.lineTo(-.28,-.05);ctx.closePath();ctx.fill();
    ctx.shadowBlur=0;ctx.strokeStyle='#eaffff';ctx.lineWidth=.035;ctx.stroke();ctx.restore();
  }

  drawShard(ctx,s,tick){
    const pulse=1+Math.sin((tick+s.x*4)*.055)*.08;
    ctx.save();ctx.translate(s.x,s.y);ctx.scale(pulse,pulse);ctx.rotate(Math.sin((tick+s.x)*.025)*.08);
    const g=ctx.createLinearGradient(0,-.55,0,.58);g.addColorStop(0,'#ecffff');g.addColorStop(.25,'#65f2ff');g.addColorStop(.7,'#15ccec');g.addColorStop(1,'#5567ff');
    ctx.shadowColor='#4feaff';ctx.shadowBlur=.42;ctx.fillStyle=g;
    ctx.beginPath();ctx.moveTo(0,-.58);ctx.lineTo(.28,-.04);ctx.lineTo(.12,.5);ctx.lineTo(0,.66);ctx.lineTo(-.12,.5);ctx.lineTo(-.28,-.04);ctx.closePath();ctx.fill();
    ctx.shadowBlur=0;ctx.strokeStyle='#eaffff';ctx.lineWidth=.035;ctx.stroke();ctx.restore();
  }

  checkpoint(ctx,cp,player){
    const active=player.checkpoint.x===(cp.spawnX??cp.x);
    ctx.save();ctx.globalAlpha=active?1:.82;
    ctx.strokeStyle=active?'#6ff8ff':'#b9c5e8';ctx.lineWidth=.1;
    ctx.beginPath();ctx.moveTo(cp.x+.25,cp.y+cp.h);ctx.lineTo(cp.x+.25,cp.y+.35);ctx.lineTo(cp.x+.75,cp.y);ctx.lineTo(cp.x+1.25,cp.y+.35);ctx.lineTo(cp.x+1.25,cp.y+cp.h);ctx.stroke();
    ctx.fillStyle=active?'rgba(67,238,255,.30)':'rgba(71,96,156,.30)';ctx.fillRect(cp.x+.43,cp.y+.45,.65,1.55);ctx.restore();
  }

  drawFinish(ctx,tick){
    const f=this.level.finish,pulse=.72+Math.sin(tick*.04)*.12;
    ctx.save();ctx.translate(f.x+f.w*.5,f.y+f.h*.52);
    ctx.strokeStyle='#ff3657';ctx.lineWidth=.14;ctx.shadowColor='#ff3657';ctx.shadowBlur=.6;
    ctx.beginPath();ctx.ellipse(0,0,f.w*.42,f.h*.43,0,0,TAU);ctx.stroke();
    ctx.strokeStyle='#8ff6ff';ctx.lineWidth=.05;ctx.globalAlpha=pulse;
    ctx.beginPath();ctx.ellipse(0,0,f.w*.28,f.h*.32,0,0,TAU);ctx.stroke();
    ctx.globalAlpha=.23;ctx.fillStyle='#f6d7ff';ctx.beginPath();ctx.ellipse(0,0,f.w*.24,f.h*.29,0,0,TAU);ctx.fill();ctx.restore();
  }

  pad(ctx,pad,type){
    ctx.save();
    const c=type==='bounce'?'#ff3657':'#45e7ff';
    ctx.shadowColor=c;ctx.shadowBlur=.25;ctx.fillStyle='#142342';ctx.fillRect(pad.x,pad.y,pad.w,pad.h);
    ctx.fillStyle=c;ctx.fillRect(pad.x+.08,pad.y-.06,pad.w-.16,.1);
    ctx.shadowBlur=0;ctx.strokeStyle='#fff';ctx.lineWidth=.035;
    if(type==='speed'){for(let i=0;i<2;i++){const x=pad.x+.45+i*.55;ctx.beginPath();ctx.moveTo(x,pad.y+.04);ctx.lineTo(x+.22,pad.y+.11);ctx.lineTo(x,pad.y+.18);ctx.stroke()}}
    else{ctx.beginPath();ctx.moveTo(pad.x+pad.w*.25,pad.y+.16);ctx.lineTo(pad.x+pad.w*.5,pad.y+.02);ctx.lineTo(pad.x+pad.w*.75,pad.y+.16);ctx.stroke()}
    ctx.restore();
  }

  fallingRect(f,player){
    const trigger=player.falling?.[f.id],delay=Math.max(0,Number(f.delay??.32));let y=f.y;
    if(trigger!=null){const elapsed=Math.max(0,(player.tick-trigger)/120-delay);if(elapsed>0)y+=.5*18*elapsed*elapsed}
    return{...f,y};
  }

  runner(p,ctx,alpha=1,tint){
    this.spritePlayer.draw(ctx,p,{alpha,tint});
  }

  foreground(ctx,w,h,cam){
    ctx.save();ctx.globalAlpha=.74;ctx.fillStyle='#102243';
    const shift=-((cam.x*58*1.08)%260);
    for(let i=-2;i<Math.ceil(w/260)+3;i++){
      const x=shift+i*260;
      ctx.beginPath();ctx.moveTo(x,h);ctx.quadraticCurveTo(x+25,h-110,x+68,h-42);ctx.quadraticCurveTo(x+102,h-135,x+145,h-34);ctx.lineTo(x+200,h);ctx.closePath();ctx.fill();
    }
    ctx.fillStyle='#17315a';ctx.globalAlpha=.36;
    for(let i=0;i<14;i++){const x=(i*137-cam.x*15)%(w+120);ctx.beginPath();ctx.arc(x,h-25-(i%3)*18,22+(i%4)*8,0,TAU);ctx.fill()}
    ctx.restore();
  }

  speedOverlay(ctx,w,h,p){
    const speed=Math.abs(p.vx);
    if(speed<7.4)return;
    ctx.save();ctx.globalAlpha=clamp((speed-7.4)/4,.05,.22);ctx.strokeStyle='#d8f9ff';ctx.lineWidth=1.4;
    for(let i=0;i<18;i++){
      const y=(i*67+p.tick*3)%h,x=((i*151+p.tick*8)%w);
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-55-(i%3)*18,y+4);ctx.stroke();
    }
    ctx.restore();
  }

  draw(player,cam,echoes=[]){
    this.resize();
    const state=animationState(player);
    if(Math.abs(player.vx)>6.4&&!player.dead){
      this.trail.unshift({x:player.x,y:player.y,life:1,facing:player.facing,tick:player.tick});
      if(this.trail.length>9)this.trail.length=9;
    }
    for(const t of this.trail)t.life-=.075;this.trail=this.trail.filter(t=>t.life>0);
    if((state==='skid'&&this.lastState!=='skid')||(state==='landing'&&this.lastState!=='landing')){
      for(let i=0;i<11;i++)this.particles.push({x:player.x+player.w*.5,y:player.y+player.h,vx:(i-5)*.025,vy:-.025-(i%4)*.014,life:1});
    }
    this.lastState=state;
    for(const q of this.particles){q.x+=q.vx;q.y+=q.vy;q.vy+=.004;q.life-=.045}
    this.particles=this.particles.filter(q=>q.life>0);

    const ctx=this.ctx,w=this.c.width/this.dpr,h=this.c.height/this.dpr;
    ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.clearRect(0,0,w,h);
    this.drawSky(ctx,w,h,cam);
    this.imageParallax(ctx,this.assets.farArt,w,h,cam,.07,h*.02,h*.83,.72);
    this.drawParallaxRuins(ctx,w,h,cam,.08,h*.76,.72,.22,false);
    this.drawFloatingIslands(ctx,w,h,cam);
    this.imageParallax(ctx,this.assets.nearArt,w,h,cam,.24,h*.18,h*.78,.72);
    this.drawParallaxRuins(ctx,w,h,cam,.22,h*.84,1.0,.26,true);

    const scale=Math.min(76,Math.max(48,w/18)),ox=w*.34,oy=h*.56;
    ctx.save();this.world(ctx,cam,scale,ox,oy);

    this.drawWorldDecor(ctx,player);

    for(const r of this.level.solids||[])this.platform(r,ctx,'solid');
    for(const r of this.level.oneWayPlatforms||[])this.platform(r,ctx,'oneway');
    for(const m of this.level.movingPlatforms||[])this.platform(window.EixoRunPhysics.movingRect(m,player.tick),ctx,'moving');
    for(const f of this.level.fallingPlatforms||[])this.platform(this.fallingRect(f,player),ctx,'falling');
    for(const b of this.level.breakableBlocks||[])if(!player.broken.has(b.id))this.platform(b,ctx,'break');

    for(const hzd of this.level.hazards||[])this.hazard(hzd,ctx);
    for(const p of this.level.bouncePads||[])this.pad(ctx,p,'bounce');
    for(const p of this.level.speedPads||[])this.pad(ctx,p,'speed');

    for(const s of this.level.shards||[])if(!player.shards.has(s.id))this.drawShard(ctx,s,player.tick);
    this.drawFinish(ctx,player.tick);

    for(let i=this.trail.length-1;i>=0;i--){
      const t=this.trail[i];this.runner({...player,x:t.x,y:t.y,facing:t.facing,tick:t.tick},ctx,.04*t.life,'#63eaff');
    }
    for(const q of this.particles){
      ctx.globalAlpha=Math.max(0,q.life)*.58;ctx.fillStyle='#d7f3ff';
      ctx.beginPath();ctx.arc(q.x,q.y,.045+.075*q.life,0,TAU);ctx.fill();
    }
    ctx.globalAlpha=1;
    for(const e of echoes)this.runner(e.player,ctx,e.alpha||.22,e.tint);
    this.runner(player,ctx,1);
    ctx.restore();

    this.imageParallax(ctx,this.assets.fgArt,w,h,cam,1.08,h*.58,h*.42,.78);
    this.foreground(ctx,w,h,cam);
    this.speedOverlay(ctx,w,h,player);
  }
}