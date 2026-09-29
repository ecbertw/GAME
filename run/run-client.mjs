import{RunInput}from'./input/input.mjs';
import{RunCamera}from'./camera/camera.mjs';
import{ReplayRecorder}from'./replay/recorder.mjs';
import{AstralRenderer}from'./rendering/astral-renderer.mjs';
import{SFX}from'./audio/audio.mjs';

const Core=window.EixoRunCore,level=window.EixoRunLevels.firstLight,$=id=>document.getElementById(id);
const canvas=$('runCanvas'),renderer=new AstralRenderer(canvas,level),input=new RunInput(),camera=new RunCamera(),recorder=new ReplayRecorder();
const ui={time:$('runTime'),delta:$('runDelta'),shards:$('runShards'),zone:$('runZone'),start:$('startPanel'),results:$('resultsPanel'),ranking:$('rankingPanel'),rt:$('resultTime'),rp:$('resultPb'),rs:$('resultShards'),rx:$('resultSecrets'),rd:$('resultDeaths'),rw:$('resultWorld'),rc:$('resultCountry'),rankList:$('runRanking')};

let player=Core.createPlayer(level.spawn),running=false,submitting=false,attempt=null,echoData={pb:null,world:null},echoes={},previousMask=0,acc=0,last=performance.now(),startTick=null,pbMs=null;
const daily=new URLSearchParams(location.search).get('daily')==='1';

const account=()=>{try{return JSON.parse(localStorage.getItem('eixo_player')||'null')}catch{return null}};
async function api(path,opts={}){
  const p=account(),method=opts.method||'GET',payload=method==='GET'?null:{...(opts.body||{})};
  if(p&&payload){payload.id=p.id;payload.token=p.token||'session'}
  const r=await fetch(path,{method,credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:payload?JSON.stringify(payload):undefined});
  const d=await r.json();if(!r.ok)throw Error(d.error||'RUN request failed');return d;
}
function fmt(ms){ms=Math.max(0,Math.round(ms||0));const m=Math.floor(ms/60000),s=Math.floor(ms/1000)%60,x=ms%1000;return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+'.'+String(x).padStart(3,'0')}
function runMs(){return startTick==null?0:Math.max(0,Math.round((player.tick-startTick)*(1000/120)))}

function rebuildEchoes(){
  echoes={};
  for(const key of ['pb','world']){
    const e=echoData[key];
    if(e?.replay)echoes[key]={player:Core.createPlayer(level.spawn),replay:e.replay,i:0,mask:0,prev:0};
  }
}
function resetRun(){
  player=Core.createPlayer(level.spawn);camera.reset(player);input.clear();recorder.reset(0);previousMask=0;acc=0;startTick=null;submitting=false;
  ui.time.textContent='00:00.000';ui.delta.textContent='—';ui.shards.textContent='0 / '+level.shards.length;
  ui.results.classList.add('hidden');ui.ranking.classList.add('hidden');rebuildEchoes();
}
async function begin(){
  if(!account()){location.href='/?signin=1';return}
  ui.start.classList.add('hidden');resetRun();
  try{
    attempt=await api('/api/run/start',{method:'POST',body:{levelId:level.id,daily}});
    echoData=attempt.echoes||{};pbMs=echoData.pb?.timeMs??null;rebuildEchoes();running=true;
  }catch(e){ui.start.classList.remove('hidden');alert(e.message)}
}
function stepEcho(e){
  while(e.i<e.replay.length&&e.replay[e.i].tick===e.player.tick){e.mask=e.replay[e.i].mask;e.i++}
  Core.step(e.player,level,e.mask,e.prev);e.prev=e.mask;
}
function fixed(){
  const beforeX=player.x+player.w*.5,wasGround=player.onGround,wasDead=player.dead,wasSkid=player.skidTicks,oldShards=player.shards.size,oldSecrets=player.secrets.size,oldVy=player.vy,oldVx=player.vx,oldCheckpoint=player.checkpoint.x;
  if(input.consumeChanged())recorder.sample(player.tick,input.mask);
  Core.step(player,level,input.mask,previousMask);previousMask=input.mask;
  const afterX=player.x+player.w*.5;if(startTick==null&&beforeX<level.startLine.x&&afterX>=level.startLine.x)startTick=player.tick;
  if(wasGround&&!player.onGround&&player.vy<0)SFX.jump();
  if(!wasGround&&player.onGround)(player.hardLandingTicks>0||oldVy>14?SFX.hardLand:SFX.land)();
  if(!wasSkid&&player.skidTicks)SFX.skid();
  if(Math.abs(oldVx)<9.2&&Math.abs(player.vx)>9.2)SFX.boost();
  if(player.checkpoint.x!==oldCheckpoint)SFX.checkpoint();
  if(player.shards.size>oldShards)SFX.shard();
  if(player.secrets.size>oldSecrets)SFX.secret();
  if(!wasDead&&player.dead)SFX.death();
  for(const e of Object.values(echoes))stepEcho(e);
  if(player.finished&&running){SFX.victory();finish()}
}
async function finish(){
  if(submitting||!attempt)return;submitting=true;running=false;
  try{
    const d=await api('/api/run/finish',{method:'POST',body:{attemptId:attempt.attemptId,replay:recorder.data()}});
    echoData=d.echoes||echoData;pbMs=echoData.pb?.timeMs??d.timeMs;
    ui.rt.textContent=fmt(d.timeMs);ui.rp.textContent=d.newPb?'NEW PB':(d.previousPb?fmt(d.previousPb):'—');
    ui.rs.textContent=d.shards+' / '+d.totalShards;ui.rx.textContent=d.secrets+' / '+d.totalSecrets;ui.rd.textContent=String(d.deaths);
    ui.rw.textContent=d.rankWorld?'#'+d.rankWorld:'—';ui.rc.textContent=d.rankCountry?'#'+d.rankCountry:'—';ui.results.classList.remove('hidden');
  }catch(e){ui.rp.textContent='NOT SAVED';ui.rt.textContent=e.message;ui.results.classList.remove('hidden')}
}
function updateZone(){
  const z=level.zones.find(z=>player.x>=z.fromX&&player.x<z.toX);let text=z?.name||level.name;
  if(player.x>=69&&player.x<124&&player.y<5.5)text='UPPER ROUTE · FAST';
  if(player.x>=108&&player.x<118&&player.y<2.5)text='SECRET · MOON CACHE';
  ui.zone.textContent=text;
}
async function ranking(scope='world',category='best'){
  ui.results.classList.add('hidden');ui.ranking.classList.remove('hidden');ui.rankList.replaceChildren();
  const p=account(),q=new URLSearchParams({levelId:level.id,category,page:'1'});if(scope==='country'&&p?.country)q.set('country',p.country);if(daily)q.set('daily','1');
  try{
    const d=await api('/api/run/rankings?'+q);
    for(const [i,row] of (d.players||[]).entries()){
      const li=document.createElement('li'),pos=document.createElement('b'),name=document.createElement('span'),time=document.createElement('strong');
      pos.textContent='#'+(i+1);name.textContent=(row.name||'PLAYER')+' · '+(row.country||'');time.textContent=fmt(row.timeMs);li.append(pos,name,time);ui.rankList.append(li);
    }
    if(!ui.rankList.children.length){const li=document.createElement('li');li.textContent='NO TIMES YET';ui.rankList.append(li)}
  }catch(e){const li=document.createElement('li');li.textContent=e.message;ui.rankList.append(li)}
}
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(running){acc+=dt;let loops=0;while(acc>=Core.DT&&loops<8){fixed();acc-=Core.DT;loops++}}
  camera.update(player,dt);updateZone();
  const ms=runMs();ui.time.textContent=fmt(ms);ui.shards.textContent=player.shards.size+' / '+level.shards.length;
  if(pbMs&&startTick!=null){const d=ms-pbMs;ui.delta.textContent=(d>=0?'+':'')+(d/1000).toFixed(3)}else ui.delta.textContent='—';
  const ghosts=[];if($('pbEcho').checked&&echoes.pb)ghosts.push({player:echoes.pb.player,alpha:.28,tint:'#60edff'});if($('worldEcho').checked&&echoes.world)ghosts.push({player:echoes.world.player,alpha:.25,tint:'#ffd86b'});
  renderer.draw(player,camera,ghosts);requestAnimationFrame(frame);
}
function bindHold(id,bit){
  const el=$(id),on=e=>{e.preventDefault();input.setVirtual(bit,true)},off=e=>{e.preventDefault();input.setVirtual(bit,false)};
  el.addEventListener('pointerdown',on);el.addEventListener('pointerup',off);el.addEventListener('pointercancel',off);el.addEventListener('pointerleave',off);
}
$('startRun').onclick=begin;$('retryRun').onclick=begin;$('retryTop').onclick=begin;$('rankTop').onclick=()=>ranking('world','best');$('rankResults').onclick=()=>ranking('world','best');
$('rankWorld').onclick=()=>ranking('world','best');$('rankCountry').onclick=()=>ranking('country','best');$('rank100').onclick=()=>ranking('world','100');
$('rankClose').onclick=()=>{ui.ranking.classList.add('hidden');if(!running)ui.results.classList.remove('hidden')};$('nextRun').onclick=begin;
bindHold('touchLeft',Core.INPUT.LEFT);bindHold('touchRight',Core.INPUT.RIGHT);bindHold('touchJump',Core.INPUT.JUMP);
window.addEventListener('blur',()=>input.clear());if(daily)$('modeBadge').textContent='DAILY RUN';renderer.ready.then(()=>requestAnimationFrame(frame));