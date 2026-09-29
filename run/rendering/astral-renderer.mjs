import{SpriteRunner}from'../player/sprite-runner.mjs';
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class AstralRenderer{
  constructor(canvas,level){
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.level=level;this.dpr=1;this.runner=new SpriteRunner();
    this.trails=[];this.ready=this.runner.ready;
    this.stars=Array.from({length:110},(_,i)=>({x:(i*.61803398875)%1,y:.04+((i*37.7)%100)/170,r:.5+(i%3)*.45,a:.35+(i%5)*.11}));
  }
  resize(){
    const r=this.canvas.getBoundingClientRect(),d=Math.min(2,window.devicePixelRatio||1),w=Math.max(1,Math.round(r.width*d)),h=Math.max(1,Math.round(r.height*d));
    if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h}this.dpr=d;
  }
  sky(ctx,w,h,cam){
    const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#122e78');g.addColorStop(.43,'#3e63c3');g.addColorStop(.72,'#8f8ce2');g.addColorStop(1,'#e0c9f6');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    const mx=w*.74-cam.x*1.2,my=h*.19-cam.y*.8,r=Math.min(w,h)*.155,mg=ctx.createRadialGradient(mx-r*.28,my-r*.3,r*.08,mx,my,r);
    mg.addColorStop(0,'#fff');mg.addColorStop(.58,'#f4f5ff');mg.addColorStop(.84,'#cfe0ff');mg.addColorStop(1,'#91ace9');ctx.fillStyle=mg;ctx.beginPath();ctx.arc(mx,my,r,0,TAU);ctx.fill();
    ctx.globalAlpha=.13;ctx.fillStyle='#6876b8';for(let i=0;i<8;i++){ctx.beginPath();ctx.ellipse(mx+((i%4)-1.5)*r*.24,my+(Math.floor(i/4)-.5)*r*.3,r*(.06+(i%3)*.025),r*.045,0,0,TAU);ctx.fill()}ctx.globalAlpha=1;
    for(const s of this.stars){const x=((s.x*w*1.4-cam.x*1.7)%(w*1.4)+w*1.4)%(w*1.4)-w*.12;ctx.globalAlpha=s.a;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,s.y*h,s.r,0,TAU);ctx.fill()}ctx.globalAlpha=1;
    this.clouds(ctx,w,h,cam,.028,h*.32,'#f8eaff',.36);this.clouds(ctx,w,h,cam,.065,h*.49,'#e3d9ff',.22);
    this.ruins(ctx,w,h,cam,.08,h*.76,.34,false);this.islands(ctx,w,h,cam,.12);this.ruins(ctx,w,h,cam,.23,h*.84,.32,true);
  }
  clouds(ctx,w,h,cam,factor,y,color,alpha){
    const shift=-((cam.x*42*factor)%(w*.42));ctx.globalAlpha=alpha;ctx.fillStyle=color;
    for(let i=-2;i<5;i++){const x=shift+i*w*.32;ctx.beginPath();ctx.ellipse(x,y,100,30,0,0,TAU);ctx.ellipse(x+72,y+3,82,24,0,0,TAU);ctx.ellipse(x-65,y+7,66,20,0,0,TAU);ctx.fill()}ctx.globalAlpha=1;
  }
  ruins(ctx,w,h,cam,factor,baseY,alpha,near){
    const spacing=225,shift=-((cam.x*38*factor)%spacing);ctx.save();ctx.globalAlpha=alpha;
    for(let i=-2;i<Math.ceil(w/spacing)+3;i++){
      const x=shift+i*spacing+(i%2)*29,seed=((i%7)+7)%7,tall=130+seed*18,width=46+(seed%3)*12;
      const gr=ctx.createLinearGradient(x,baseY-tall,x+width,baseY);gr.addColorStop(0,near?'#243f7d':'#8290cf');gr.addColorStop(1,near?'#14274f':'#5265a9');ctx.fillStyle=gr;ctx.fillRect(x,baseY-tall,width,tall);
      ctx.fillStyle=near?'#1a315f':'#6878bb';ctx.fillRect(x+width*.34,baseY-tall-26,width*.32,26);
      if(seed%2===0){ctx.strokeStyle=near?'#5e7ac8':'#c4c9ef';ctx.lineWidth=near?7:5;ctx.beginPath();ctx.moveTo(x+width+12,baseY);ctx.lineTo(x+width+12,baseY-62);ctx.quadraticCurveTo(x+width+57,baseY-112,x+width+102,baseY-62);ctx.lineTo(x+width+102,baseY);ctx.stroke()}
    }ctx.restore();
  }
  islands(ctx,w,h,cam,factor){
    const shift=-((cam.x*36*factor)%300);ctx.save();ctx.globalAlpha=.42;
    for(let i=-1;i<7;i++){const x=shift+i*300+(i%2)*72,y=h*(.30+(i%3)*.065);ctx.fillStyle='#5d6fb5';ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+70,y-20,x+142,y);ctx.lineTo(x+108,y+58);ctx.lineTo(x+52,y+70);ctx.closePath();ctx.fill();ctx.strokeStyle='#b7f5ff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+12,y);ctx.lineTo(x+132,y);ctx.stroke()}ctx.restore();
  }
  worldTransform(ctx,cam,scale,ox,oy){ctx.setTransform(this.dpr*scale,0,0,this.dpr*scale,this.dpr*(ox-cam.x*scale),this.dpr*(oy-cam.y*scale))}
  platform(ctx,r,kind='solid'){
    const thin=kind!=='solid',depth=thin ? .72 : Math.max(1.2,Math.min(r.h,3.8));ctx.save();
    const rock=ctx.createLinearGradient(r.x,r.y,r.x,r.y+depth);rock.addColorStop(0,'#60759c');rock.addColorStop(.18,'#3c537a');rock.addColorStop(1,'#1a2b50');ctx.fillStyle=rock;
    ctx.beginPath();ctx.moveTo(r.x,r.y);ctx.lineTo(r.x+r.w,r.y);ctx.lineTo(r.x+r.w-.16,r.y+depth*.55);ctx.lineTo(r.x+r.w*.82,r.y+depth);ctx.lineTo(r.x+r.w*.58,r.y+depth*.82);ctx.lineTo(r.x+r.w*.35,r.y+depth*1.04);ctx.lineTo(r.x+r.w*.12,r.y+depth*.73);ctx.lineTo(r.x,r.y+depth*.4);ctx.closePath();ctx.fill();
    const top=ctx.createLinearGradient(r.x,r.y-.12,r.x,r.y+.22);top.addColorStop(0,'#d9f6d5');top.addColorStop(.32,'#8cc47e');top.addColorStop(.42,'#647b6d');top.addColorStop(1,'#52627a');ctx.fillStyle=top;ctx.fillRect(r.x,r.y-.1,r.w,.32);
    ctx.strokeStyle=kind==='moving'?'#70f3ff':'#b5eaff';ctx.globalAlpha=kind==='moving'?.8:.3;ctx.lineWidth=.045;ctx.beginPath();ctx.moveTo(r.x+.12,r.y+.18);ctx.lineTo(r.x+r.w-.12,r.y+.18);ctx.stroke();ctx.globalAlpha=1;
    if(kind==='falling'){ctx.strokeStyle='#ffc56f';ctx.lineWidth=.055;ctx.setLineDash([.14,.1]);ctx.strokeRect(r.x+.08,r.y+.03,r.w-.16,.3);ctx.setLineDash([])}
    if(kind==='break'){ctx.strokeStyle='#ffd28d';ctx.lineWidth=.05;ctx.beginPath();ctx.moveTo(r.x+r.w*.25,r.y+.1);ctx.lineTo(r.x+r.w*.5,r.y+.55);ctx.lineTo(r.x+r.w*.42,r.y+.9);ctx.stroke()}
    ctx.restore();
  }
  shard(ctx,s,tick){
    const pulse=1+Math.sin((tick+s.x*5)*.05)*.08;ctx.save();ctx.translate(s.x,s.y);ctx.scale(pulse,pulse);const g=ctx.createLinearGradient(0,-.55,0,.6);g.addColorStop(0,'#f2ffff');g.addColorStop(.22,'#6cf5ff');g.addColorStop(.7,'#1dd1ef');g.addColorStop(1,'#6468ff');ctx.shadowColor='#66f5ff';ctx.shadowBlur=.36;ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,-.58);ctx.lineTo(.28,-.06);ctx.lineTo(.12,.5);ctx.lineTo(0,.66);ctx.lineTo(-.12,.5);ctx.lineTo(-.28,-.06);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#eaffff';ctx.lineWidth=.03;ctx.stroke();ctx.restore();
  }
  hazard(ctx,h){
    const count=Math.max(2,Math.round(h.w/.34));for(let i=0;i<count;i++){const x=h.x+i*h.w/count,ww=h.w/count,g=ctx.createLinearGradient(x,h.y+h.h,x+ww,h.y);g.addColorStop(0,'#71152f');g.addColorStop(.58,'#ef3150');g.addColorStop(1,'#ff9bac');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x,h.y+h.h);ctx.lineTo(x+ww*.5,h.y);ctx.lineTo(x+ww,h.y+h.h);ctx.closePath();ctx.fill()}
  }
  checkpoint(ctx,cp,p){
    const active=Math.abs(p.checkpoint.x-(cp.spawnX??cp.x))<.01;ctx.save();ctx.strokeStyle=active?'#6ff9ff':'#c0c9ea';ctx.lineWidth=.09;ctx.beginPath();ctx.moveTo(cp.x+.15,cp.y+cp.h);ctx.lineTo(cp.x+.15,cp.y+.4);ctx.lineTo(cp.x+.65,cp.y);ctx.lineTo(cp.x+1.15,cp.y+.4);ctx.lineTo(cp.x+1.15,cp.y+cp.h);ctx.stroke();ctx.fillStyle=active?'rgba(91,244,255,.28)':'rgba(80,103,165,.24)';ctx.fillRect(cp.x+.34,cp.y+.5,.62,1.5);ctx.restore();
  }
  finish(ctx,f,tick){
    const pulse=.75+Math.sin(tick*.045)*.1;ctx.save();ctx.translate(f.x+f.w*.5,f.y+f.h*.5);ctx.strokeStyle='#ff3658';ctx.lineWidth=.13;ctx.shadowColor='#ff3658';ctx.shadowBlur=.5;ctx.beginPath();ctx.ellipse(0,0,f.w*.42,f.h*.42,0,0,TAU);ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='#95f7ff';ctx.globalAlpha=pulse;ctx.lineWidth=.045;ctx.beginPath();ctx.ellipse(0,0,f.w*.28,f.h*.3,0,0,TAU);ctx.stroke();ctx.restore();
  }
  pads(ctx,pad,type){ctx.save();const c=type==='bounce'?'#ff3658':'#55ebff';ctx.fillStyle='#172746';ctx.fillRect(pad.x,pad.y,pad.w,pad.h);ctx.shadowColor=c;ctx.shadowBlur=.22;ctx.fillStyle=c;ctx.fillRect(pad.x+.06,pad.y-.055,pad.w-.12,.09);ctx.restore()}
  foreground(ctx,w,h,cam){
    const shift=-((cam.x*62)%270);ctx.save();ctx.globalAlpha=.68;ctx.fillStyle='#11284c';
    for(let i=-2;i<Math.ceil(w/270)+3;i++){const x=shift+i*270;ctx.beginPath();ctx.moveTo(x,h);ctx.quadraticCurveTo(x+30,h-108,x+70,h-38);ctx.quadraticCurveTo(x+103,h-138,x+152,h-30);ctx.lineTo(x+205,h);ctx.closePath();ctx.fill()}ctx.restore();
  }
  fx(ctx,w,h,p){
    if(Math.abs(p.vx)>7.2&&!p.dead){ctx.save();ctx.globalAlpha=clamp((Math.abs(p.vx)-7.2)/4,.04,.17);ctx.strokeStyle='#e5fbff';ctx.lineWidth=1.2;for(let i=0;i<14;i++){const y=(i*71+p.tick*3)%h,x=(i*137+p.tick*8)%w;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-46-(i%3)*14,y+3);ctx.stroke()}ctx.restore()}
  }
  draw(p,cam,echoes=[]){
    this.resize();const ctx=this.ctx,w=this.canvas.width/this.dpr,h=this.canvas.height/this.dpr;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);this.sky(ctx,w,h,cam);
    const scale=clamp(w/18.5,48,74),ox=w*.33,oy=h*.58;ctx.save();this.worldTransform(ctx,cam,scale,ox,oy);
    for(const r of this.level.solids)this.platform(ctx,r,'solid');
    for(const r of this.level.oneWay)this.platform(ctx,r,'oneway');
    for(const r of this.level.moving)this.platform(ctx,window.EixoRunCore.movingRect(r,p.tick),'moving');
    for(const r of this.level.falling){const trigger=p.falling[r.id];let rr={...r};if(trigger!=null){const t=Math.max(0,(p.tick-trigger)/120-(r.delay||.3));if(t>0)rr.y+=9*t*t}this.platform(ctx,rr,'falling')}
    for(const r of this.level.breakables)if(!p.broken.has(r.id))this.platform(ctx,r,'break');
    for(const hzd of this.level.hazards)this.hazard(ctx,hzd);
    for(const pad of this.level.bouncePads)this.pads(ctx,pad,'bounce');
    for(const pad of this.level.speedPads)this.pads(ctx,pad,'speed');
    for(const cp of this.level.checkpoints)this.checkpoint(ctx,cp,p);
    for(const s of this.level.shards)if(!p.shards.has(s.id))this.shard(ctx,s,p.tick);
    this.finish(ctx,this.level.finish,p.tick);
    if(Math.abs(p.vx)>6.5&&!p.dead){this.trails.unshift({x:p.x,y:p.y,facing:p.facing,tick:p.tick,life:1});if(this.trails.length>7)this.trails.length=7}
    for(const t of this.trails)t.life-=.08;this.trails=this.trails.filter(t=>t.life>0);
    for(let i=this.trails.length-1;i>=0;i--){const t=this.trails[i];this.runner.draw(ctx,{...p,x:t.x,y:t.y,facing:t.facing,tick:t.tick},{alpha:.045*t.life,tint:'#67edff'})}
    for(const e of echoes)this.runner.draw(ctx,e.player,{alpha:e.alpha||.25,tint:e.tint});
    this.runner.draw(ctx,p);ctx.restore();this.foreground(ctx,w,h,cam);this.fx(ctx,w,h,p);
  }
}