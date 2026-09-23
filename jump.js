/* EIXO JUMP: vertical, deterministic platformer with isolated leaderboards and 5-player worlds. */
(function(){
'use strict';
const P=window.EixoJumpPhysics;if(!P)return;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lang=()=>String(document.documentElement.lang||'en').startsWith('pt')?'pt':'en';
const T={pt:{solo:'SOLO',join:'JOIN SERVER',character:'PERSONAGEM',height:'PONTOS',restart:'RECOMEÇAR',gameOver:'FIM DE JOGO',rank:'RANKING JUMP',world:'MUNDIAL',country:'NACIONAL',rooms:'SALAS JUMP',create:'CRIAR SALA',enter:'ENTRAR',back:'VOLTAR',empty:'AINDA NÃO HÁ PONTUAÇÕES.',play:'JOGAR',saved:'GUARDADO',cancel:'CANCELAR',save:'GUARDAR',code:'CÓDIGO',noAccount:'ENTRA NA TUA CONTA PARA GUARDAR A PONTUAÇÃO.',leave:'SAIR',choose:'ESCOLHE O AMBIENTE',help:'A / D OU ← / → PARA MOVER • W / ESPAÇO / ↑ PARA SALTAR',soon:'EM BREVE'},en:{solo:'SOLO',join:'JOIN SERVER',character:'CHARACTER',height:'POINTS',restart:'RESTART',gameOver:'GAME OVER',rank:'JUMP RANKING',world:'WORLD',country:'COUNTRY',rooms:'JUMP ROOMS',create:'CREATE ROOM',enter:'ENTER',back:'BACK',empty:'NO SCORES YET.',play:'PLAY',saved:'SAVED',cancel:'CANCEL',save:'SAVE',code:'CODE',noAccount:'SIGN IN TO SAVE YOUR SCORE.',leave:'LEAVE',choose:'CHOOSE YOUR WORLD',help:'A / D OR ← / → TO MOVE • W / SPACE / ↑ TO JUMP',soon:'COMING SOON'}};
const txt=k=>T[lang()][k]||k;
const BIOMES=['city','forest','desert','snow'];
const themes={
  city:{sky:'#78c6ee',low:'#f0c8bb',hills:'#719ec0',far:'#467293',near:'#294b6d',top:'#7dc5dc',edge:'#466f9b',under:'#465671'},
  forest:{sky:'#89d9e7',low:'#daf4b6',hills:'#77ba9c',far:'#397a65',near:'#234e42',top:'#55c970',edge:'#31864c',under:'#78533a'},
  desert:{sky:'#83cae8',low:'#f9c688',hills:'#e9a16b',far:'#bd7657',near:'#8a513f',top:'#f4ce70',edge:'#b98845',under:'#ad7651'},
  snow:{sky:'#7baedb',low:'#dbf0ff',hills:'#b0c9d8',far:'#799bb8',near:'#55708d',top:'#ecf9ff',edge:'#9ebdd5',under:'#6b869e'}
};
let current='pulse',run=null,local=null,frame=null,canvas=null,ctx=null,mode='solo',biome='forest',seed=0,peers=[],outfit=null,wardrobe=null,fixedAppearance=null,keys={left:false,right:false,jump:false},confirmedScore=0,facing=1,last=0,busy=false,finishing=false,rankTimer=null,networkTimer=null,animation=null,panel=null,page=1,rankTab='world',rankingData=null,gameOver=false,roomId=null,roomLabel='',lastState=null;
const getPlayer=()=>{try{return window.eixoGetPlayer?.()||JSON.parse(localStorage.getItem('eixo_player')||'null')}catch(_){return null}};
async function api(path,options={}){
 const p=getPlayer(),url=new URL(path,location.origin);
 const opts={credentials:'same-origin',cache:'no-store',...options};
 if(opts.method==='POST'){opts.headers={'Content-Type':'application/json'};opts.body=JSON.stringify({...JSON.parse(opts.body||'{}'),id:p?.id,token:p?.token})}
 else if(p?.id)url.searchParams.set('id',p.id);
 const r=await fetch(url.pathname+url.search,opts),d=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(d.error||'JUMP unavailable');return d;
}
function modal(title,body){
 keys={left:false,right:false,jump:false};closePanel();panel=document.createElement('div');panel.className='modal-backdrop jump-modal-backdrop';panel.id='jumpPanel';
 panel.innerHTML='<div class="modal-card jump-panel" role="dialog" aria-modal="true"><button class="modal-close" type="button" id="jumpPanelClose">×</button><h2>'+esc(title)+'</h2><div id="jumpPanelBody">'+body+'</div></div>';
 document.body.appendChild(panel);$('jumpPanelClose').onclick=closePanel;panel.addEventListener('click',e=>{if(e.target===panel)closePanel()});return panel;
}
function closePanel(){panel?.remove();panel=null;}
function showError(message){$('jumpStatus').textContent=String(message||'');}
function showMode(){
 $('jumpTeamBoards')?.classList.toggle('hidden',current!=='jump');
 const switcher=$('eixoGameSwitcher');switcher.querySelectorAll('[data-game]').forEach(b=>b.classList.toggle('active',b.dataset.game===current));
 $('gameIntro').querySelector('[data-i18n="aboutText"]').textContent=current==='jump'?' — JUMP: '+txt('help'):current==='eat'?' — '+txt('soon'):window.eixoT?.('aboutText',' — a simple reflex game. Hit the center, score points and climb the ranking.')||' — a simple reflex game.';
 $('jumpRoot').classList.toggle('hidden',current!=='jump');frame.classList.toggle('jump-mode',current==='jump');
 document.body.classList.toggle('eixo-jump-view',current==='jump');
 if($('jumpRoomBoard'))$('jumpRoomBoard').classList.toggle('hidden',current!=='jump'||!roomId);
 if(current!=='jump')$('jumpRoomCreatePanel')?.classList.add('hidden');
}
async function switchGame(next){
 if(next==='eat'){modal('EAT','<p>'+txt('soon')+'</p>');return}
 if(current===next&&next==='jump'){await newRun({biome,mode,roomId});return}
 if(current===next)return;
 if(current==='jump')await stopRun();
 current=next;window.eixoJumpActive=current==='jump';closePanel();showMode();
 if(current==='jump'){
   window.stopGame?.();await newRun({biome:BIOMES[Math.floor(Math.random()*4)],mode:'solo'});
   refreshRankings();if(!animation)animation=requestAnimationFrame(loop);clearInterval(rankTimer);rankTimer=setInterval(()=>{if(!document.hidden&&current==='jump'){refreshRankings();refreshRoomBoard()}},5500);
 }else{
   clearInterval(rankTimer);clearInterval(networkTimer);if(animation)cancelAnimationFrame(animation);animation=null;
   keys={left:false,right:false,jump:false};$('rankingModal')?.classList.add('hidden');if($('rankingModalTitle'))$('rankingModalTitle').textContent='RANKING';window.eixoRefreshRankings?.();window.resetGame?.();
 }
}
async function stopRun(){
 if(team){await api('/api/jump/teams/leave',{method:'POST'});team=null;clearInterval(teamTimer);run=null;local=null;peers=[];return;}
 if(!run)return;const old=run,platform=Number(local?.bestPlatform||0);run=null;clearInterval(networkTimer);
 try{await api('/api/jump/run/finish',{method:'POST',body:JSON.stringify({runId:old.runId,platform})})}catch(e){console.warn('JUMP finalization:',e.message)}
}
function updateHud(){
 $('jumpHeight').textContent=String(Math.max(0,Number(confirmedScore)||0)).padStart(3,'0');
 $('jumpWorld').textContent=biome.toUpperCase()+(team?' · '+team.mode.toUpperCase()+' · '+team.members.length+'/'+team.capacity:mode==='solo'?' · SOLO':' · ONLINE '+(lastState?.players||1)+'/5');
 $('jumpSoloButton').textContent=txt('solo');$('jumpJoinButton').textContent='ONLINE';$('jumpCustomizeButton').textContent=txt('character');$('jumpHelp').textContent=txt('help');
}
async function newRun(options={}){
 const b=options.biome||biome;biome=b;mode=options.mode||'solo';roomId=options.roomId||null;roomLabel=options.roomLabel||'';
 await stopRun();keys={left:false,right:false,jump:false};confirmedScore=0;facing=1;local=null;gameOver=false;finishing=false;peers=[];lastState=null;$('jumpEnd').classList.add('hidden');showError('');
 if(!getPlayer()?.id){showError(txt('noAccount'));return}
 try{
   const out=await api('/api/jump/run/start',{method:'POST',body:JSON.stringify({biome,multiplayer:mode==='public',roomId})});
   run=out;seed=out.seed;biome=out.biome;mode=out.mode;outfit=out.outfit||outfit;wardrobe=out.parts?{parts:out.parts}:wardrobe;fixedAppearance=out.fixedAppearance||fixedAppearance;
   local=P.create(seed);local.time=Number(out.worldTime)||0;last=performance.now();updateHud();draw();refreshRoomBoard();clearInterval(networkTimer);
   networkTimer=setInterval(sync,60);sync();
 }catch(e){run=null;showError(e.message)}
}
async function sync(){
 if(team){await syncTeam();return;}
 if(!run||busy||current!=='jump')return;
 const identity=run.runId;busy=true;
 try{
  const out=await api('/api/jump/run/input',{method:'POST',body:JSON.stringify({runId:identity,left:keys.left,right:keys.right,jump:keys.jump,platform:Number(local?.bestPlatform||0),position:local?{x:local.x,y:local.y}:null})});
  if(run?.runId!==identity)return;
  lastState=out;if(mode!=='solo'&&local&&Number.isFinite(out.worldTime))local.time=out.worldTime;peers=out.peers||[];confirmedScore=Number(out.state?.score||0);
  // The HUD shows only server-confirmed platform points, while the local
  // physics remains smooth and is never teleported to an older snapshot.
  updateHud();
 }catch(e){if(run?.runId===identity)showError(e.message)}
 finally{busy=false}
}
async function die(){
 if(gameOver||finishing)return;finishing=true;gameOver=true;const old=run,platform=Number(local?.bestPlatform||0);run=null;clearInterval(networkTimer);
 let result={score:confirmedScore||platform*P.SCORE_PER_PLATFORM};
 try{if(old)result=await api('/api/jump/run/finish',{method:'POST',body:JSON.stringify({runId:old.runId,platform})})}catch(e){showError(e.message)}
 confirmedScore=Number(result.score||0);updateHud();
 $('jumpFinal').textContent=String(confirmedScore);$('jumpEnd').classList.remove('hidden');
 $('jumpEndTitle').textContent=txt('gameOver');$('jumpRestart').textContent=txt('restart');
 refreshRankings();refreshRoomBoard();finishing=false;
}
function drawBackground(){window.EixoJumpWorlds.draw(ctx,biome,seed,local?.cam||0,local?.time||0);}
function outfitColor(value,time,offset=0){
 if(value!=='rainbow')return value||'#fff';
 return 'hsl('+Math.round(((time||0)*115+offset)%360)+' 92% 62%)';
}
function drawCharacter(c,x,y,style,name,ghost=false,time=0,motion={}){
 const O={hair:'#19222d',top:'#172b3b',accent:'#00e5ff',pants:'#263c5c',shoes:'#ffffff',effect:'none',...(style||outfit||{})};
 const F={skin:'#f0c7a2',skinShade:'#dba982',eyes:'#17202a',...(fixedAppearance||{})};
 const top=outfitColor(O.top,time,0),accent=outfitColor(O.accent,time,85),pants=outfitColor(O.pants,time,175),shoes=outfitColor(O.shoes,time,265),hair=outfitColor(O.hair,time,315);
 const dir=motion.facing===-1?-1:1,moving=!!motion.moving,ground=motion.ground!==false,vy=Number(motion.vy||0);
 const airborne=!ground||Math.abs(vy)>5,walk=moving&&ground?Math.sin(time*14):0,rising=airborne&&vy>15,falling=airborne&&vy<-15;
 const bob=moving&&ground?Math.round(Math.abs(Math.sin(time*14))):0,bodyY=(rising?-2:falling?1:0)-bob;
 const arm=Math.round(walk*3),leg=Math.round(walk*3),outline='#101923',deep='#0a1119';
 const spriteScale=.72;
 c.save();c.globalAlpha=ghost?0.72:1;c.translate(Math.round(x),Math.round(y));c.scale(dir*spriteScale,spriteScale);c.translate(0,-17);
 const q=(xx,yy,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(xx),Math.round(yy),w,h)};
 const effect=String(O.effect||'none'),aura=outfitColor(O.accent,time,120);
 if(effect!=='none'){
  if(['glow','pulse','plasma','cosmic'].includes(effect)){c.shadowColor=aura;c.shadowBlur=effect==='glow'?7:effect==='pulse'?5+3*Math.sin(time*6):9}
  if(effect==='pulse')c.globalAlpha=(ghost?0.72:1)*(0.82+0.18*(.5+.5*Math.sin(time*7)));
  if(effect==='plasma'||effect==='cosmic'){c.globalAlpha=(ghost?0.72:1)*.18;q(-11,-26,22,34,outfitColor(effect==='cosmic'?'rainbow':O.accent,time,210));c.globalAlpha=ghost?.72:1}
 }
 // A readable 18x31 runner silhouette with a real head, hair, jacket and limbs.
 q(-7,-25+bodyY,14,15,outline);q(-6,-24+bodyY,12,13,F.skin);
 q(-6,-25+bodyY,12,4,hair);q(-7,-22+bodyY,4,5,hair);q(3,-23+bodyY,4,3,hair);
 q(-7,-18+bodyY,2,4,F.skinShade);q(5,-18+bodyY,2,4,F.skinShade);
 q(-3,-19+bodyY,2,2,F.eyes);q(2,-19+bodyY,2,2,F.eyes);q(4,-18+bodyY,1,1,'#ffffff');
 q(-1,-16+bodyY,2,1,F.skinShade);q(-3,-13+bodyY,6,1,F.skinShade);
 // Neck + jacket outline and coloured panels.
 q(-3,-11+bodyY,6,3,F.skin);q(-8,-9+bodyY,16,11,outline);q(-7,-8+bodyY,14,9,top);
 q(-1,-8+bodyY,2,9,accent);q(-5,-6+bodyY,3,2,accent);q(2,-6+bodyY,3,2,accent);
 q(-6,0+bodyY,12,2,deep);q(-5,-1+bodyY,10,1,accent);
 // Arms have shoulders, sleeves and hands instead of single bars.
 q(-11,-8+bodyY+arm,4,8,outline);q(-10,-7+bodyY+arm,3,6,top);q(-10,-1+bodyY+arm,3,3,F.skin);
 q(7,-8+bodyY-arm,4,8,outline);q(7,-7+bodyY-arm,3,6,top);q(7,-1+bodyY-arm,3,3,F.skin);
 // Belt, two articulated legs and shoes. Jump pose is visibly different.
 q(-6,2+bodyY,12,3,outline);q(-5,2+bodyY,10,2,pants);
 const lY=rising?-2:falling?1:leg,rY=rising?1:falling?-1:-leg;
 q(-6,4+lY,5,8,outline);q(-5,4+lY,4,7,pants);q(1,4+rY,5,8,outline);q(1,4+rY,4,7,pants);
 q(-7,11+lY,7,3,outline);q(-6,10+lY,6,2,shoes);q(0,11+rY,7,3,outline);q(1,10+rY,6,2,shoes);
 c.shadowBlur=0;
 if(effect==='spark'||effect==='electric'||effect==='cosmic'){
  const phase=Math.floor(time*13);for(let i=0;i<5;i++){const sx=-12+((phase*7+i*11)%25),sy=-27+((phase*5+i*13)%34);q(sx,sy,effect==='electric'?3:2,2,outfitColor(effect==='cosmic'?'rainbow':O.accent,time,i*70));}
 }
 c.restore();
 if(name){c.save();c.globalAlpha=ghost?.82:1;c.fillStyle=ghost?'#d9efff':'#fff';c.textAlign='center';c.font='bold 5px monospace';c.fillText(String(name).slice(0,12),Math.round(x),Math.round(y)-34);c.restore()}
}
function draw(){
 if(!ctx||current!=='jump')return;const c=ctx;drawBackground();
 if(!local)return;
 const cam=local.cam,screen=y=>P.H-30-(y-cam),t=themes[biome],activeMin=Math.max(0,Number(local.activeMinPlatform)||0);
 for(let i=activeMin;i<local.platforms.length;i++){
   const p=local.platforms[i];if(!p||p.y<cam-12||p.y>cam+P.H+30)continue;
   if(P.isBroken?.(local,i))continue;
   const y=Math.round(screen(p.y)),x=Math.round(P.platformX(p,local.time)),fragileProgress=P.fragileProgress?.(local,i)||0;
   // Moving platforms keep the biome material. Fragile platforms reveal their
   // danger through amber cracks only after contact instead of becoming a loud
   // unrelated colour block.
   window.EixoJumpWorlds.platform(c,biome,x,y,p.w,i,{moving:p.moving,fragile:p.fragile,progress:fragileProgress});
 }
 if(team?.status==='playing'){
  const members=team.members;
  for(let i=1;i<members.length;i++){
   const a=members[i-1].id===getPlayer()?.id?local:members[i-1].state,b=members[i].id===getPlayer()?.id?local:members[i].state;
   if(!a||!b)continue;
   const distance=Math.hypot(b.x-a.x,b.y-a.y),n=Math.max(2,Math.ceil(distance/5)),slack=Math.max(0,1-distance/team.chainLength)*12;
   for(let j=0;j<=n;j++){const f=j/n,x=Math.round(a.x+(b.x-a.x)*f),y=Math.round(screen(a.y+(b.y-a.y)*f)-4+Math.sin(f*Math.PI)*slack);c.fillStyle='#172638';c.fillRect(x-2,y-1,5,4);c.fillStyle=distance>team.chainLength?'#ffc581':'#d0e3ef';c.fillRect(x-1,y,3,2);}
  }
 }
 for(const peer of peers){
   const y=screen(peer.y);if(y>-12&&y<P.H+34)drawCharacter(c,peer.x,y,peer.outfit,peer.name,!team,local.time,{facing:peer.facing,ground:peer.ground,vy:peer.vy,moving:peer.moving});
 }
 drawCharacter(c,local.x,screen(local.y),outfit,'',false,local.time,{facing,ground:local.ground,vy:local.vy,moving:keys.left||keys.right});
 c.fillStyle='#ffffffaa';c.fillRect(0,0,P.W,1);
}
function loop(now){
 if(current!=='jump'){animation=null;return}
 let dt=Math.min(.04,(now-last)/1000||0);last=now;
 if(local&&!gameOver&&run){
  if(keys.left&&!keys.right)facing=-1;else if(keys.right&&!keys.left)facing=1;
  if(team){
   if(team.status==='playing')P.step(local,keys,dt);
  }else{P.step(local,keys,dt);if(!local.alive)die();}
  updateHud();
 }
 draw();animation=requestAnimationFrame(loop);
}
function setKey(code,on){
 if(code==='KeyA'||code==='ArrowLeft')keys.left=on;
 if(code==='KeyD'||code==='ArrowRight')keys.right=on;
 if(code==='KeyW'||code==='Space'||code==='ArrowUp')keys.jump=on;
}
function onKeyboard(e){
 if(current!=='jump'||panel||e.target?.matches('input,select,textarea,[contenteditable]'))return;
 if(['KeyA','KeyD','KeyW','Space','ArrowLeft','ArrowRight','ArrowUp'].includes(e.code)){
   e.preventDefault();e.stopImmediatePropagation();
   if(e.type==='keydown'&&e.repeat)return;
   setKey(e.code,e.type==='keydown');
   void sync();
 }
}
function bindControls(){
 window.addEventListener('keydown',onKeyboard,true);window.addEventListener('keyup',onKeyboard,true);
 window.addEventListener('blur',()=>{keys={left:false,right:false,jump:false}});
 for(const button of document.querySelectorAll('[data-jump-key]')){
  const k=button.dataset.jumpKey;button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture?.(e.pointerId);keys[k]=true;void sync()});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,()=>{keys[k]=false;void sync()});
 }
}
const flags=c=>[...String(c||'PT')].map(x=>String.fromCodePoint(127397+x.charCodeAt())).join('');
const rankLabels={pt:'O TEU RANK É:',en:'YOUR RANK IS:'};
const rankLabel=()=>rankLabels[lang()]||rankLabels.en;
const rankTag=(type,n,country,p)=>{
 const me=getPlayer();
 const raw=type==='country'?(p?.tagCountryColor||(me&&me.id===p?.id?me.tagCountryColor:'#ff7a2f')):(p?.tagGlobalColor||(me&&me.id===p?.id?me.tagGlobalColor:'#e53935'));
 const c=String(raw||'').toLowerCase(),rainbow=c==='rainbow';
 return '<span class="rank-tag '+type+'-'+n+(rainbow?' tag-rainbow':'')+'"'+(!rainbow&&/^#[0-9a-f]{6}$/.test(c)?' style="background:'+c+'!important;color:#fff!important"':'')+'>'+n+'# '+(type==='country'?esc(country):'GLOBAL')+'</span>';
};
const rankVip=n=>n>0?'<span class="vip-rank-tag vip-rank-'+Math.min(n,6)+'">'+(n>=6?'VIP ∞':'VIP #'+n)+'</span>':'';
const rankLetters=(text,styles)=>{
 const arr=Array.isArray(styles)?styles:[];
 return [...String(text||'')].map((ch,i)=>{
  const st=arr[i]||{},color=String(st.color||'').toLowerCase(),effect=String(st.effect||'none'),rainbow=color==='rainbow';
  const safeColor=/^#[0-9a-f]{6}$/i.test(color)?color:'',safeEffect=/^[a-z]+$/.test(effect)?effect:'none';
  return '<span class="name-letter'+(rainbow?' name-rainbow':'')+' effect-'+safeEffect+'"'+(safeColor?' style="color:'+safeColor+';"':'')+'>'+esc(ch)+'</span>';
 }).join('');
};
function renderTopRank(players,target,isWorld){
 if(!players?.length){target.innerHTML='<li class="empty-row">'+(window.eixoT?window.eixoT('emptyRanking','NO PLAYERS YET'):'NO PLAYERS YET')+'</li>';return}
 target.innerHTML=players.slice(0,10).map((p,i)=>{
  let tags='';
  if(isWorld){
   if(Number(p.worldRank)<=3)tags+=rankTag('world',Number(p.worldRank),'',p);
   if(Number(p.worldRank)>3&&Number(p.countryRank)<=3)tags+=rankTag('country',Number(p.countryRank),String(p.country||'').toUpperCase(),p);
  }else if(Number(p.countryRank)<=3)tags+=rankTag('country',Number(p.countryRank),String(p.country||'').toUpperCase(),p);
  const color=String(p.nameColor||'#fff').toLowerCase(),effect=p.nameEffect&&p.nameEffect!=='none'?' effect-'+esc(p.nameEffect):'',vip=Number(p.vipLevel||0);
  const hasLetters=vip>0&&Array.isArray(p.letterStyles)&&p.letterStyles.length,rainbow=color==='rainbow'&&!hasLetters,colorStyle=rainbow?'':' style="color:'+esc(color)+';"';
  const name=hasLetters?rankLetters(p.visualName||p.name,p.letterStyles):[...String(p.visualName||p.name)].map(ch=>'<span class="name-letter">'+esc(ch)+'</span>').join('');
  return '<li><span class="rank-number">'+(i+1)+'</span><span class="rank-name-wrap"><span class="rank-player-name'+(rainbow?' name-rainbow':'')+effect+(hasLetters?' vip-letter-styled':'')+'"'+colorStyle+'>'+name+'</span>'+tags+rankVip(vip)+'</span><span class="rank-score-wrap"><span class="rank-flag" title="'+esc(p.country)+'">'+flags(p.country)+'</span><span class="rank-score">'+Number(p.score||0)+'</span></span></li>';
 }).join('');
}
function setJumpMyRank(id,value){
 const el=$(id);if(!el)return;
 const n=Number(value),ok=Number.isInteger(n)&&n>0;
 el.textContent=ok?rankLabel()+' '+n:'';
 el.title=el.textContent;el.hidden=!ok;
}
async function refreshRankings(){
 if(current==='jump')void refreshTeamRanks();
 if(current!=='jump')return;
 try{
  const p=getPlayer(),code=String(p?.country||'PT').toUpperCase();
  const requests=[api('/api/jump/rankings?page=1'),api('/api/jump/rankings?page=1&country='+encodeURIComponent(code))];
  if(p?.id)requests.push(api('/api/jump/player-rank'));
  const [w,c,mine]=await Promise.all(requests);
  if(current!=='jump')return;
  renderTopRank(w.players,$('worldRanking'),true);
  renderTopRank(c.players,$('nationalRanking'),false);
  setJumpMyRank('worldMyRank',mine?.worldRank??w.players.find(x=>x.id===p?.id)?.worldRank);
  setJumpMyRank('nationalMyRank',mine?.countryRank??c.players.find(x=>x.id===p?.id)?.countryRank);
  $('nationalTitle').textContent='TOP '+code;
 }catch(e){console.warn('JUMP rankings:',e.message)}
}
function renderFullRows(players,start){
 return players?.length?players.map((x,i)=>{
  let tags='';
  if(Number(x.worldRank)<=3)tags+=rankTag('world',Number(x.worldRank),'',x);
  if(Number(x.countryRank)<=3)tags+=rankTag('country',Number(x.countryRank),String(x.country||'').toUpperCase(),x);
  const color=String(x.nameColor||'#fff').toLowerCase(),effect=x.nameEffect&&x.nameEffect!=='none'?' effect-'+esc(x.nameEffect):'',vip=Number(x.vipLevel||0);
  const hasLetters=vip>0&&Array.isArray(x.letterStyles)&&x.letterStyles.length,rainbow=color==='rainbow'&&!hasLetters,colorStyle=rainbow?'':' style="color:'+esc(color)+';"';
  const name=hasLetters?rankLetters(x.visualName||x.name,x.letterStyles):[...String(x.visualName||x.name)].map(ch=>'<span class="name-letter">'+esc(ch)+'</span>').join('');
  return '<li><span class="full-rank-number">'+(start+i+1)+'</span><span class="full-player"><span class="rank-name-wrap"><span class="rank-player-name'+(rainbow?' name-rainbow':'')+effect+(hasLetters?' vip-letter-styled':'')+'"'+colorStyle+'>'+name+'</span>'+tags+rankVip(vip)+'</span></span><span class="full-score rank-score-wrap"><span class="rank-flag" title="'+esc(x.country)+'">'+flags(x.country)+'</span><span class="rank-score">'+Number(x.score||0)+'</span></span></li>';
 }).join(''):'<li class="empty-full">'+(window.eixoT?window.eixoT('emptyFull','THERE ARE NO PLAYERS YET'):'THERE ARE NO PLAYERS YET')+'</li>';
}
async function renderJumpFull(){
 if(current!=='jump')return;
 const modalEl=$('rankingModal'),list=$('fullRankingList');if(!modalEl||modalEl.classList.contains('hidden')||!list)return;
 const country=String(getPlayer()?.country||'PT').toUpperCase();
 const q='/api/jump/rankings?page='+page+(rankTab==='country'?'&country='+encodeURIComponent(country):'');
 try{
  rankingData=await api(q);
  if(current!=='jump'||modalEl.classList.contains('hidden'))return;
  list.innerHTML=renderFullRows(rankingData.players,(page-1)*25);
  $('rankingModalTitle').textContent='RANKING · JUMP';
  $('pageInfo').textContent=page+' / '+rankingData.pages;
  $('prevPage').disabled=page<=1;$('nextPage').disabled=page>=rankingData.pages;
  $('modalWorldTab').classList.toggle('active',rankTab==='world');
  $('modalCountryTab').classList.toggle('active',rankTab==='country');
 }catch(e){showError(e.message)}
}
function openRank(modeName='world',number=1){
 rankTab=modeName;page=Math.max(1,number);
 const modalEl=$('rankingModal');if(!modalEl)return;
 modalEl.classList.remove('hidden');renderJumpFull();
}
function chooseWorld(){
 modal(txt('choose'),'<div class="jump-world-grid">'+BIOMES.map(b=>'<button class="jump-world-option '+b+'" data-biome="'+b+'"><canvas width="450" height="195" aria-hidden="true"></canvas><strong>'+b.toUpperCase()+'</strong><small>ONLINE</small></button>').join('')+'</div><p>5 PLAYERS MAX / INSTANCE · AUTO MATCHMAKING</p>');
 panel.querySelectorAll('[data-biome]').forEach(btn=>{window.EixoJumpWorlds.draw(btn.querySelector('canvas').getContext('2d'),btn.dataset.biome,73,0,0);btn.onclick=()=>{const b=btn.dataset.biome;closePanel();newRun({biome:b,mode:'public'})};});
}
async function customize(){
 if(!getPlayer()?.id){showError(txt('noAccount'));return}
 let out;try{out=await api('/api/jump/cosmetics')}catch(e){showError(e.message);return}
 outfit={...out.outfit};wardrobe={parts:out.parts};fixedAppearance=out.fixedAppearance||fixedAppearance;
 const vip=Number(out.vipLevel||0),labels={hair:'CABELO',top:'CASACO',accent:'DETALHES',pants:'CALÇAS',shoes:'SAPATILHAS',effect:'EFEITO'};
 const options=part=>(out.parts?.[part]||[]).map(item=>{
   const level=Number(item.minVip||0),locked=vip<level,vipOnly=level>0,suffix=vipOnly?' · VIP '+level:'';
   const prefix=vipOnly?(lang()==='pt'?'COR VIP · ':'VIP COLOR · '):'';
   return '<option value="'+esc(item.value)+'" data-eixo-color-label="'+(vipOnly?'keep':'auto')+'"'+(outfit[part]===item.value?' selected':'')+(locked?' disabled':'')+'>'+prefix+esc(item.label)+suffix+(locked?' · BLOQUEADO':'')+'</option>';
 }).join('');
 modal(txt('character'),'<div class="jump-custom-note">EIXO RUNNER · ROSTO E PELE FIXOS · CABELO E ROUPA EDITÁVEIS</div><div class="jump-custom-preview"><canvas id="jumpAvatarPreview" width="140" height="100"></canvas></div><div class="jump-color-list">'+Object.keys(labels).map(part=>'<label><span>'+labels[part]+(part==='effect'?' · VIP EFFECTS':'')+'</span><select data-jump-outfit="'+part+'">'+options(part)+'</select></label>').join('')+'</div><div class="jump-vip-wardrobe">VIP '+vip+' · CORES E EFEITOS EXCLUSIVOS DESBLOQUEIAM COM O VIP</div><button class="modal-button primary" id="jumpSave">'+txt('save')+'</button><p id="jumpSaveStatus"></p>');
 const preview=()=>{const cv=$('jumpAvatarPreview');if(!cv)return;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,140,100);c.save();c.translate(70,54);c.scale(3.1,3.1);drawCharacter(c,0,0,outfit,'',false,performance.now()/1000,{facing,ground:true,vy:0,moving:true});c.restore()};
 panel.querySelectorAll('[data-jump-outfit]').forEach(sel=>{sel.onchange=()=>{outfit[sel.dataset.jumpOutfit]=sel.value;preview()}});
 let previewTimer=setInterval(()=>{if(!panel||!$('jumpAvatarPreview')){clearInterval(previewTimer);return}preview()},70);preview();
 $('jumpSave').onclick=async()=>{
  try{
   const saved=await api('/api/jump/cosmetics',{method:'POST',body:JSON.stringify({outfit})});
   outfit={...saved.outfit};$('jumpSaveStatus').textContent=txt('saved');
   if(run)run.outfit=outfit;
   setTimeout(()=>{clearInterval(previewTimer);closePanel()},600);
  }catch(e){$('jumpSaveStatus').textContent=e.message}
 };
}
function renderJumpRoomMembers(players){
 return (players||[]).map(p=>{
  const styles=Array.isArray(p.letterStyles)?p.letterStyles:[],visual=String(p.visualName||p.name||'');
  const letters=styles.length?rankLetters(visual,styles):[...visual].map(ch=>'<span class="name-letter">'+esc(ch)+'</span>').join('');
  const color=String(p.nameColor||'#fff').toLowerCase(),wholeRainbow=color==='rainbow'&&!styles.length;
  let tags='';
  if(Number(p.worldRank)>=1&&Number(p.worldRank)<=3)tags+=rankTag('world',Number(p.worldRank),'',p);
  if(Number(p.countryRank)>=1&&Number(p.countryRank)<=3)tags+=rankTag('country',Number(p.countryRank),String(p.country||'').toUpperCase(),p);
  return '<li><span class="rank-number">'+Number(p.roomRank||0)+'</span><span class="full-player"><span class="rank-name-wrap"><span class="rank-player-name'+(wholeRainbow?' name-rainbow':'')+(styles.length?' vip-letter-styled':'')+'">'+letters+'</span>'+tags+rankVip(Number(p.vipLevel||0))+'</span></span><span class="rank-score-wrap"><span class="rank-flag" title="'+esc(p.country)+'">'+flags(p.country)+'</span><span class="rank-score">'+Number(p.score||0)+'</span></span></li>';
 }).join('')||'<li class="empty-row">AINDA SEM JOGADORES</li>';
}
async function refreshRoomBoard(){
 const board=$('jumpRoomBoard');if(!board)return;
 board.classList.toggle('hidden',current!=='jump'||!roomId);
 if(current!=='jump'||!roomId)return;
 $('jumpRoomTitle').textContent=roomLabel||'JUMP ROOM';
 $('jumpRoomMeta').textContent=' · '+biome.toUpperCase();
 try{
  const d=await api('/api/jump/rooms/rankings?roomId='+encodeURIComponent(roomId));
  $('jumpRoomMeta').textContent=' · '+biome.toUpperCase()+' · '+d.players.length+' JOGADORES';
  if($('jumpRoomRanking'))$('jumpRoomRanking').innerHTML=renderJumpRoomMembers(d.players);
 }catch(e){if($('jumpRoomRanking'))$('jumpRoomRanking').innerHTML='<li class="empty-row">'+esc(e.message)+'</li>'}
}
function toggleJumpCreateRoom(){
 const box=$('jumpRoomCreatePanel');if(!box)return;
 box.classList.toggle('hidden');
 if(!box.classList.contains('hidden')){box.scrollIntoView({behavior:'smooth',block:'nearest'});$('jumpRoomNameInput')?.focus()}
}
async function submitJumpRoom(){
 const button=$('jumpRoomCreateSubmit'),error=$('jumpRoomCreateError');if(!button)return;
 error.textContent='';button.disabled=true;
 try{
  const d=await api('/api/jump/rooms/create',{method:'POST',body:JSON.stringify({name:$('jumpRoomNameInput').value,biome:$('jumpRoomBiomeInput').value})});
  $('jumpCreatedRoomCode').textContent=d.room.code;$('jumpRoomCreated').classList.remove('hidden');$('jumpRoomNameInput').value='';
 }catch(e){error.textContent=e.message}finally{button.disabled=false}
}
async function loadJumpRooms(){
 const list=$('jumpRoomsList');if(!list)return;
 try{
  const d=await api('/api/jump/rooms');
  list.innerHTML=(d.rooms||[]).length?d.rooms.map(r=>{
   const full=Number(r.memberCount)>=5;
   return '<article class="room-card"><div class="room-card-main"><div class="room-card-name">'+esc(r.name)+'</div><div class="room-card-meta">'+esc(r.ownerName)+' · '+r.biome.toUpperCase()+' · '+r.memberCount+'/5 PLAYERS</div></div><div class="room-card-code">'+esc(r.code)+'</div><div class="room-card-actions"><span class="room-status">'+(full?'FULL':r.memberCount+'/5')+'</span><button type="button" class="board-more enter-room-button" data-jump-room-id="'+esc(r.id)+'">'+txt('enter')+'</button></div></article>';
  }).join(''):'<div class="rooms-empty">NO JUMP ROOMS YET</div>';
  list.querySelectorAll('[data-jump-room-id]').forEach(btn=>btn.onclick=()=>{
   const item=d.rooms.find(x=>x.id===btn.dataset.jumpRoomId);if(!item)return;
   $('jumpRoomsModal').classList.add('hidden');
   newRun({biome:item.biome,mode:'private',roomId:item.id,roomLabel:item.name});
  });
 }catch(e){list.innerHTML='<div class="rooms-empty">'+esc(e.message)+'</div>'}
}
async function jumpRooms(){
 let m=$('jumpRoomsModal');
 if(!m){
  m=document.createElement('div');m.id='jumpRoomsModal';m.className='modal-backdrop hidden';
  m.innerHTML='<div class="modal-card rooms-modal" role="dialog" aria-modal="true" aria-labelledby="jumpRoomsModalTitle"><button class="modal-close" id="jumpRoomsClose" type="button">✕</button><div class="rooms-modal-heading"><h2 id="jumpRoomsModalTitle">AS MINHAS SALAS · JUMP</h2><button class="rooms-add-button" id="jumpAddRoomButton" type="button">ADICIONAR SALA</button></div><div class="rooms-add-panel hidden" id="jumpRoomsAddPanel"><label class="room-field"><span>CÓDIGO DA SALA</span><input id="jumpJoinRoomCode" class="pixel-input room-code-input" type="text" maxlength="6" autocomplete="off" spellcheck="false" placeholder="ABC123"></label><button class="modal-button primary" id="jumpJoinRoomSubmit" type="button">ENTRAR</button><div class="form-error" id="jumpJoinRoomError"></div></div><div class="rooms-list" id="jumpRoomsList"><div class="rooms-empty">LOADING...</div></div></div>';
  document.body.appendChild(m);
  $('jumpRoomsClose').onclick=()=>m.classList.add('hidden');
  m.addEventListener('click',e=>{if(e.target===m)m.classList.add('hidden')});
  $('jumpAddRoomButton').onclick=()=>{$('jumpRoomsAddPanel').classList.toggle('hidden');$('jumpJoinRoomError').textContent='';if(!$('jumpRoomsAddPanel').classList.contains('hidden'))$('jumpJoinRoomCode').focus()};
  $('jumpJoinRoomCode').addEventListener('input',e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-F0-9]/g,'').slice(0,6)});
  $('jumpJoinRoomCode').addEventListener('keydown',e=>{if(e.key==='Enter')$('jumpJoinRoomSubmit').click()});
  $('jumpJoinRoomSubmit').onclick=async()=>{
   const button=$('jumpJoinRoomSubmit');button.disabled=true;$('jumpJoinRoomError').textContent='';
   try{await api('/api/jump/rooms/join',{method:'POST',body:JSON.stringify({code:$('jumpJoinRoomCode').value})});$('jumpJoinRoomCode').value='';$('jumpRoomsAddPanel').classList.add('hidden');await loadJumpRooms()}
   catch(e){$('jumpJoinRoomError').textContent=e.message}finally{button.disabled=false}
  };
 }
 m.classList.remove('hidden');await loadJumpRooms();
}
function confirmAbandonJumpRoom(){
 if(!roomId)return;
 let m=$('jumpAbandonRoomModal');
 if(!m){
  m=document.createElement('div');m.id='jumpAbandonRoomModal';m.className='modal-backdrop hidden';
  m.innerHTML='<div class="modal-card form-modal abandon-room-modal" role="dialog" aria-modal="true"><button class="modal-close" id="jumpAbandonClose" type="button">CLOSE</button><h2>ABANDON ROOM</h2><p>Are you sure you want to leave this JUMP room?</p><p class="abandon-room-warning">If you choose YES, it will disappear from AS MINHAS SALAS. You will need the code to join again.</p><div class="abandon-room-actions"><button class="modal-button" id="jumpAbandonCancel" type="button">NO</button><button class="modal-button primary" id="jumpAbandonConfirm" type="button">YES</button></div></div>';
  document.body.appendChild(m);
  const close=()=>m.classList.add('hidden');$('jumpAbandonClose').onclick=close;$('jumpAbandonCancel').onclick=close;m.addEventListener('click',e=>{if(e.target===m)close()});
  $('jumpAbandonConfirm').onclick=async()=>{
   const id=roomId,button=$('jumpAbandonConfirm');button.disabled=true;
   try{await api('/api/jump/rooms/leave',{method:'POST',body:JSON.stringify({roomId:id})});m.classList.add('hidden');roomId=null;roomLabel='';await newRun({mode:'solo',biome:BIOMES[Math.floor(Math.random()*4)]})}
   catch(e){showError(e.message)}finally{button.disabled=false}
  };
 }
 m.classList.remove('hidden');
}
function captureNative(selector,callback){
 const el=document.querySelector(selector);
 el?.addEventListener('click',e=>{if(current!=='jump')return;e.preventDefault();e.stopImmediatePropagation();callback() },true);
}

let team=null,teamTimer=null,teamSeq=0,teamPoll=0,teamSignature='',lastTeamMode='duo';
const teamText=(pt,en)=>lang()==='pt'?pt:en;
async function teamPost(action,data={}){return api('/api/jump/teams/'+action,{method:'POST',body:JSON.stringify(data)});}
function acceptTeam(out){
 const previousRun=team?.runId,previousStatus=team?.status;team=out;lastTeamMode=out.mode||lastTeamMode;
 const me=out.members.find(m=>m.id===getPlayer()?.id);
 if(me?.state){
  const fresh=previousRun!==out.runId||!local||local.seed!==out.seed,st=me.state;
  if(fresh){local=P.create(out.seed);Object.assign(local,st);teamSeq=0;}
  else if(out.status==='playing'){
   // Client prediction keeps DUO/TRIO as fluid as SOLO. The server remains
   // authoritative and only nudges small drift; large chain corrections snap.
   const dx=Number(st.x)-Number(local.x),dy=Number(st.y)-Number(local.y);
   if(Math.abs(dx)>38||Math.abs(dy)>44){local.x=Number(st.x);local.y=Number(st.y);local.vy=Number(st.vy||0);}
   else{local.x+=dx*.18;local.y+=dy*.14;local.vy+=(Number(st.vy||0)-Number(local.vy||0))*.16;}
   local.cam+=((Number(st.cam)||0)-Number(local.cam||0))*.18;
   local.time=Number(st.time)||local.time;
   local.ground=!!st.ground;
  }else Object.assign(local,st);
  local.bestPlatform=Number(st.platform||0);local.score=Number(st.score||0);local.seed=out.seed;
  local.brokenPlatforms=Object.fromEntries((st.broken||[]).map(i=>[i,true]));
  local.fragilePlatform=Number(st.fragilePlatform??-1);local.fragileRatio=Number(st.fragileRatio||0);
  const required=Math.max(34,...out.members.map(m=>Number(m.state?.platform||0)+34));
  if(local.platforms.length<required)local.platforms=P.platforms(out.seed,required);
  local.activeMinPlatform=Number(st.activeMinPlatform||0);
  peers=out.members.filter(m=>m.id!==getPlayer()?.id&&m.present&&m.state).map(m=>({id:m.id,name:m.name,outfit:m.outfit,...m.state}));
  outfit=me.outfit||outfit;biome=out.biome;seed=out.seed;mode=out.mode;confirmedScore=Number(out.score||0);
  run={runId:out.runId||('team-lobby:'+out.teamId)};
  if(out.status==='lobby'||out.status==='countdown'){
   gameOver=false;local.alive=true;$('jumpEnd').classList.add('hidden');$('jumpRestart').disabled=false;
  }
  if(out.status==='playing'){
   gameOver=false;local.alive=true;$('jumpEnd').classList.add('hidden');$('jumpRestart').disabled=false;
   if((previousRun!==out.runId||previousStatus!=='playing')&&$('jumpTeamLobby'))closePanel();
  }
  if(out.status==='ended'){
   gameOver=true;local.alive=false;$('jumpFinal').textContent=out.score;$('jumpEndTitle').textContent=txt('gameOver')+' · '+out.mode.toUpperCase();
   const seconds=Math.max(0,Math.ceil(Number(out.restartMs||0)/1000));
   $('jumpRestart').disabled=seconds>0;$('jumpRestart').textContent=seconds>0?teamText('RECOMEÇA EM ','RESTARTS IN ')+seconds:teamText('VOLTAR À EQUIPA','BACK TO TEAM');
   $('jumpEnd').classList.remove('hidden');
   if(out.saveError)showError(teamText('Pontuação por guardar — a tentar novamente.','Score pending — retrying.'));
   else if(out.saved)showError('');
  }
 }
 // Do not rebuild the persistent-team cards on every network snapshot.
 // Replacing those buttons 8-10 times/second detached click targets and could
 // leave the modal backdrop intercepting the user's click.
 updateHud();renderTeamLobby();
}
let teamClosing=false;
async function leaveTeamSessionToSolo(message=''){
 if(teamClosing)return;teamClosing=true;
 team=null;run=null;local=null;peers=[];clearInterval(teamTimer);teamTimer=null;teamSeq=0;closePanel();
 try{await newRun({biome,mode:'solo'});if(message)showError(message);}finally{teamClosing=false;}
}
async function syncTeam(){
 if(!team||busy||current!=='jump')return;
 const identity=team.teamId,wait=team.status==='playing'?110:team.status==='countdown'?150:team.status==='ended'?180:500;
 if(Date.now()-teamPoll<wait)return;
 busy=true;teamPoll=Date.now();
 try{
  const out=team.status==='playing'?await teamPost('input',{runId:team.runId,seq:teamSeq++,left:keys.left,right:keys.right,jump:keys.jump}):await api('/api/jump/teams/state');
  if(team?.teamId===identity)acceptTeam(out);
 }catch(e){
  if(/Entra primeiro numa das tuas equipas|Sessão expirada|Já não pertences/.test(String(e.message||'')))void leaveTeamSessionToSolo(teamText('A sessão da equipa terminou. Voltaste ao SOLO.','The team session ended. You returned to SOLO.'));
  else showError(e.message);
 }finally{busy=false;}
}
function watchTeam(out){acceptTeam(out);clearInterval(teamTimer);teamTimer=setInterval(syncTeam,60);}
async function enterTeamById(teamId){
 if(team?.teamId===teamId){showTeamLobby();return;}
 await stopRun();local=null;peers=[];run=null;
 const out=await teamPost('enter',{teamId});watchTeam(out);showTeamLobby();void refreshMyTeamsBoard();
}
function savedTeamCard(r){
 const active=team?.teamId===r.id;
 return '<article class="jump-team-room-card '+(active?'active':'')+'"><div class="jump-team-room-mode '+esc(r.mode)+'">'+esc(r.mode.toUpperCase())+'</div><div class="jump-team-room-main"><strong>'+esc(r.name)+'</strong><small>'+esc(r.biome.toUpperCase())+' · '+Number(r.memberCount)+'/'+Number(r.capacity)+'</small></div><button type="button" class="board-more" data-enter-team="'+esc(r.id)+'">'+(active?teamText('ABRIR','OPEN'):txt('enter'))+'</button></article>';
}
async function loadTeamChooserList(kind){
 const target=$('jumpTeamSavedList');if(!target)return;
 try{
  const out=await api('/api/jump/teams/list?mode='+kind),rows=out.teams||[];
  target.innerHTML=rows.length?rows.map(savedTeamCard).join(''):'<div class="jump-team-empty">'+teamText('Ainda não estás ligado a nenhuma equipa '+kind.toUpperCase()+'.','You are not linked to any '+kind.toUpperCase()+' team yet.')+'</div>';
  target.querySelectorAll('[data-enter-team]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await enterTeamById(b.dataset.enterTeam);}catch(e){if($('jumpTeamError'))$('jumpTeamError').textContent=e.message;}finally{if(b.isConnected)b.disabled=false;}});
 }catch(e){target.innerHTML='<div class="jump-team-empty">'+esc(e.message)+'</div>';}
}
async function openTeam(kind){
 lastTeamMode=kind;
 modal(kind.toUpperCase(),'<div class="jump-team-section-title">'+teamText('AS TUAS EQUIPAS','YOUR TEAMS')+'</div><div id="jumpTeamSavedList" class="jump-team-saved-list"><div class="jump-team-empty">LOADING...</div></div><div class="jump-team-divider"><span>'+teamText('NOVA EQUIPA OU CONVITE','NEW TEAM OR INVITE')+'</span></div><p class="jump-team-help">'+teamText('DUO joga com 2 pessoas e TRIO com 3. Entra numa equipa, todos ficam visíveis no mesmo mapa e, quando o último jogador carregar em PRONTO, começa automaticamente uma contagem de 3 segundos.','DUO has 2 players and TRIO has 3. Enter a team, everyone appears on the same map and the final READY automatically starts a 3-second countdown.')+'</p><div class="jump-team-create-grid"><label class="room-field"><span>'+teamText('NOME DA EQUIPA','TEAM NAME')+'</span><input id="jumpTeamName" class="pixel-input" maxlength="24" placeholder="PIXEL CREW"></label><label class="room-field"><span>'+txt('choose')+'</span><select id="jumpTeamBiome" class="pixel-input">'+BIOMES.map(b=>'<option value="'+b+'">'+b.toUpperCase()+'</option>').join('')+'</select></label></div><button class="modal-button primary" id="jumpTeamCreate">'+teamText('CRIAR EQUIPA','CREATE TEAM')+'</button><div class="jump-team-invite-row"><input id="jumpTeamCode" class="pixel-input" maxlength="12" autocomplete="off" placeholder="'+teamText('CÓDIGO DE CONVITE','INVITE CODE')+'"><button class="modal-button" id="jumpTeamJoin">'+teamText('ACEITAR CONVITE','ACCEPT INVITE')+'</button></div><p id="jumpTeamError" role="status"></p>');
 void loadTeamChooserList(kind);
 $('jumpTeamCode').addEventListener('input',e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-F0-9]/g,'').slice(0,12)});
 const action=async(create)=>{
  const button=$(create?'jumpTeamCreate':'jumpTeamJoin');button.disabled=true;
  try{
   const data=create?{mode:kind,name:$('jumpTeamName').value,biome:$('jumpTeamBiome').value}:{code:$('jumpTeamCode').value};
   await stopRun();local=null;peers=[];run=null;
   const out=await teamPost(create?'create':'join',data);watchTeam(out);showTeamLobby();void refreshMyTeamsBoard();
  }catch(e){if($('jumpTeamError'))$('jumpTeamError').textContent=e.message;}finally{if(button.isConnected)button.disabled=false;}
 };
 $('jumpTeamCreate').onclick=()=>action(true);$('jumpTeamJoin').onclick=()=>action(false);
}
function showTeamLobby(){
 if(!team)return;
 modal(team.mode.toUpperCase()+' · '+team.name,'<div id="jumpTeamLobby"></div>');teamSignature='';renderTeamLobby();
}
function renderTeamLobby(){
 const target=$('jumpTeamLobby');if(!target||!team)return;
 const seconds=team.status==='countdown'?Math.max(1,Math.ceil(Number(team.countdownMs||0)/1000)):0;
 const signature=JSON.stringify([team.status,team.saved,seconds,team.members.map(m=>[m.id,m.ready,m.present]),team.ownerId]);if(signature===teamSignature)return;teamSignature=signature;
 const me=team.members.find(m=>m.id===getPlayer()?.id),full=team.members.length===team.capacity;
 const status=team.status==='countdown'?'<div class="jump-team-countdown">'+teamText('COMEÇA EM ','STARTS IN ')+seconds+'</div>':team.status==='playing'?'<div class="jump-team-live">'+teamText('EM JOGO','LIVE')+'</div>':'';
 target.innerHTML=status+'<div class="jump-team-lobby-head"><div><span class="jump-team-room-mode '+esc(team.mode)+'">'+esc(team.mode.toUpperCase())+'</span><strong>'+esc(team.name)+'</strong><small>'+esc(team.biome.toUpperCase())+' · '+team.members.length+'/'+team.capacity+'</small></div><div class="room-code">'+esc(team.code)+'</div></div><button id="jumpCopyInvite" class="board-more">'+teamText('COPIAR CONVITE','COPY INVITE')+'</button><p class="jump-team-help">'+teamText('Fiquem os '+team.capacity+' nesta sala. Quando todos estiverem presentes e PRONTOS, o jogo arranca sozinho. Se um cair, a corrente leva a equipa inteira.','Keep all '+team.capacity+' players in this room. When everyone is present and READY, the game starts automatically. If one falls, the chain takes the whole team.')+'</p><ul class="jump-team-members">'+team.members.map(m=>'<li class="'+(m.present?'present':'offline')+'"><span class="jump-member-dot"></span><strong>'+esc(m.name)+'</strong><span>'+(m.present?(m.ready?'✓ '+teamText('PRONTO','READY'):teamText('NA SALA','IN ROOM')):teamText('FORA DA SALA','OUTSIDE'))+'</span></li>').join('')+'</ul><button class="modal-button primary" id="jumpTeamReady" '+((team.status==='countdown'||team.status==='playing')?'disabled':'')+'>'+(team.status==='countdown'?teamText('PREPARA-TE…','GET READY…'):me?.ready?teamText('CANCELAR PRONTO','NOT READY'):teamText('ESTOU PRONTO','READY'))+'</button><div class="jump-team-exit-row"><button class="board-more" id="jumpTeamLeave">'+teamText('SAIR DA SALA','LEAVE ROOM')+'</button><button class="board-more danger" id="jumpTeamAbandon">'+teamText('ABANDONAR EQUIPA','LEAVE TEAM')+'</button></div><p id="jumpTeamError" role="status"></p>';
 const perform=async(action,data)=>{try{acceptTeam(await teamPost(action,data));}catch(e){if($('jumpTeamError'))$('jumpTeamError').textContent=e.message;}};
 $('jumpTeamReady').onclick=()=>perform('ready',{ready:!me?.ready});
 $('jumpCopyInvite').onclick=async()=>{try{await navigator.clipboard.writeText(team.code);$('jumpCopyInvite').textContent=teamText('COPIADO','COPIED');}catch(_){$('jumpCopyInvite').textContent=team.code;}};
 $('jumpTeamLeave').onclick=async()=>{try{await teamPost('leave');await leaveTeamSessionToSolo();void refreshMyTeamsBoard();}catch(e){$('jumpTeamError').textContent=e.message;}};
 $('jumpTeamAbandon').onclick=async()=>{try{const id=team.teamId;await teamPost('abandon',{teamId:id});await leaveTeamSessionToSolo();void refreshMyTeamsBoard();}catch(e){$('jumpTeamError').textContent=e.message;}};
}
let myTeamsCache=[],myTeamsRenderSignature='';
function renderMyTeamsBoardFromCache(){
 const board=$('jumpMyTeamsBoard'),list=$('jumpMyTeamsList');if(!board||!list)return;
 const visible=current==='jump'&&myTeamsCache.length>0;board.classList.toggle('hidden',!visible);if(!visible){myTeamsRenderSignature='';return;}
 const signature=JSON.stringify(myTeamsCache.map(r=>[r.id,r.mode,r.name,r.biome,r.memberCount,r.capacity,team?.teamId===r.id]));
 if(signature===myTeamsRenderSignature)return;myTeamsRenderSignature=signature;
 list.innerHTML=myTeamsCache.map(savedTeamCard).join('');
 list.querySelectorAll('[data-enter-team]').forEach(b=>b.onclick=()=>enterTeamById(b.dataset.enterTeam).catch(e=>showError(e.message)));
}
async function refreshMyTeamsBoard(){
 if(current!=='jump'||!getPlayer()?.id){myTeamsCache=[];renderMyTeamsBoardFromCache();return;}
 try{
  const [d,t]=await Promise.all([api('/api/jump/teams/list?mode=duo'),api('/api/jump/teams/list?mode=trio')]);
  myTeamsCache=[...(d.teams||[]),...(t.teams||[])];renderMyTeamsBoardFromCache();
 }catch(_){myTeamsCache=[];renderMyTeamsBoardFromCache();}
}
function initTeamBoards(boards){
 const mine=document.createElement('section');mine.id='jumpMyTeamsBoard';mine.className='room-board jump-my-teams-board hidden';
 mine.innerHTML='<div class="room-board-heading"><div><span class="room-panel-mark">◆</span><strong>'+teamText('AS MINHAS EQUIPAS · JUMP','MY TEAMS · JUMP')+'</strong><small>'+teamText('DUO E TRIO','DUO & TRIO')+'</small></div></div><div id="jumpMyTeamsList" class="jump-my-teams-list"></div>';
 boards?.after(mine);
 const section=document.createElement('section');section.id='jumpTeamBoards';section.className='boards jump-team-boards hidden';
 section.innerHTML=['duo','trio'].map(m=>'<article class="board"><div class="board-title"><span class="jump-team-rank-icon '+m+'">◆</span><span>'+m.toUpperCase()+' · TOP</span></div><ol id="jumpRank'+m+'"><li class="empty-row">—</li></ol><button class="board-more" data-team-rank="'+m+'">'+teamText('VER RANKING','VIEW RANKING')+'</button></article>').join('');
 mine.after(section);section.querySelectorAll('[data-team-rank]').forEach(b=>b.onclick=()=>fullTeamRank(b.dataset.teamRank,1));
}
function teamRankPlayer(p){
 const visual=String(p.visualName||p.name||'PLAYER'),vip=Number(p.vipLevel||0),styles=Array.isArray(p.letterStyles)?p.letterStyles:[];
 const color=String(p.nameColor||'#fff').toLowerCase(),rainbow=color==='rainbow'&&!styles.length,effect=p.nameEffect&&p.nameEffect!=='none'?' effect-'+esc(p.nameEffect):'';
 const colorStyle=rainbow?'':(/^#[0-9a-f]{6}$/i.test(color)?' style="color:'+esc(color)+';"':'');
 const name=styles.length?rankLetters(visual,styles):[...visual].map(ch=>'<span class="name-letter">'+esc(ch)+'</span>').join('');
 let tags='';if(Number(p.worldRank)>=1&&Number(p.worldRank)<=3)tags+=rankTag('world',Number(p.worldRank),'',p);
 if(Number(p.countryRank)>=1&&Number(p.countryRank)<=3)tags+=rankTag('country',Number(p.countryRank),String(p.country||'').toUpperCase(),p);
 return '<span class="jump-team-player"><span class="rank-player-name'+(rainbow?' name-rainbow':'')+effect+(styles.length?' vip-letter-styled':'')+'"'+colorStyle+'>'+name+'</span><span class="jump-team-player-tags">'+tags+rankVip(vip)+'</span></span>';
}
function teamRows(rows){return rows.map(r=>'<li><span class="rank-number">'+Number(r.rank)+'</span><span class="rank-name-wrap jump-team-rank-name"><strong>'+esc(r.name)+'</strong><span class="jump-team-roster">'+(r.members||[]).map(teamRankPlayer).join('')+'</span></span><span class="rank-score">'+Number(r.score)+'</span></li>').join('')||'<li class="empty-row">'+txt('empty')+'</li>';}
async function refreshTeamRanks(){
 void refreshMyTeamsBoard();
 for(const mode of ['duo','trio'])try{const out=await api('/api/jump/teams/rankings?mode='+mode);if($('jumpRank'+mode))$('jumpRank'+mode).innerHTML=teamRows(out.teams.slice(0,5));}catch(e){if($('jumpRank'+mode))$('jumpRank'+mode).innerHTML='<li class="empty-row">'+esc(e.message)+'</li>';}
}
async function fullTeamRank(mode,page){
 try{const out=await api('/api/jump/teams/rankings?mode='+mode+'&page='+page);modal('RANKING '+mode.toUpperCase(),'<ol class="jump-rank-list">'+teamRows(out.teams)+'</ol><div class="jump-pager"><button id="jumpTeamPrev">◀</button><span>'+out.page+' / '+out.pages+'</span><button id="jumpTeamNext">▶</button></div>');$('jumpTeamPrev').disabled=page<=1;$('jumpTeamNext').disabled=page>=out.pages;$('jumpTeamPrev').onclick=()=>fullTeamRank(mode,page-1);$('jumpTeamNext').onclick=()=>fullTeamRank(mode,page+1);}catch(e){showError(e.message);}
}
function init(){
 const main=document.querySelector('.site-shell main');frame=document.querySelector('.game-frame');if(!main||!frame)return;
 const switcher=document.createElement('nav');switcher.id='eixoGameSwitcher';switcher.className='eixo-game-switcher';switcher.setAttribute('aria-label','EIXO games');
 switcher.innerHTML='<button type="button" data-game="pulse" class="active">PULSE</button><button type="button" data-game="jump">JUMP</button><button type="button" data-game="eat">EAT <span>SOON</span></button>';
 main.insertBefore(switcher,$('gameIntro'));
 switcher.querySelectorAll('[data-game]').forEach(b=>b.onclick=()=>switchGame(b.dataset.game));
 const root=document.createElement('div');root.id='jumpRoot';root.className='jump-root hidden';
 root.innerHTML='<canvas id="jumpCanvas" width="450" height="195" aria-label="JUMP platformer"></canvas>'+
 '<div class="jump-hud"><div><small>'+txt('height')+'</small><strong id="jumpHeight">000</strong></div><div id="jumpWorld">FOREST · SOLO</div></div>'+
 '<div class="jump-tools"><button id="jumpSoloButton">SOLO</button><button id="jumpJoinButton">ONLINE</button><button id="jumpDuoButton">DUO</button><button id="jumpTrioButton">TRIO</button><button id="jumpCustomizeButton">CHARACTER</button></div>'+
 '<div class="jump-help" id="jumpHelp"></div><div class="jump-status" id="jumpStatus" role="status"></div>'+
 '<div class="jump-touch-controls"><button data-jump-key="left">◀</button><button data-jump-key="right">▶</button><button data-jump-key="jump">▲</button></div>'+
 '<div class="jump-end hidden" id="jumpEnd"><strong id="jumpEndTitle">GAME OVER</strong><p>'+txt('height')+': <span id="jumpFinal">0</span></p><button id="jumpRestart">RESTART</button></div>';
 frame.appendChild(root);canvas=$('jumpCanvas');ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 const boards=document.querySelector('.boards');
 const createPanel=document.createElement('section');createPanel.id='jumpRoomCreatePanel';createPanel.className='room-create-panel hidden';
 createPanel.innerHTML='<div class="room-panel-heading"><span class="room-panel-mark">◆</span><span>CRIAR UMA SALA · JUMP</span></div><div class="room-create-grid"><label class="room-field"><span>NOME DA SALA</span><input id="jumpRoomNameInput" class="pixel-input" type="text" maxlength="24" autocomplete="off" spellcheck="false" placeholder="EX: JUMP NIGHT"></label><label class="room-field"><span>AMBIENTE</span><select id="jumpRoomBiomeInput" class="pixel-input">'+BIOMES.map(b=>'<option value="'+b+'">'+b.toUpperCase()+'</option>').join('')+'</select></label><button class="modal-button primary room-create-submit" id="jumpRoomCreateSubmit" type="button">CRIAR SALA</button></div><div class="form-error" id="jumpRoomCreateError"></div><div class="room-created hidden" id="jumpRoomCreated"><div class="room-created-label">SALA CRIADA</div><div class="room-code" id="jumpCreatedRoomCode">ABC123</div><div class="room-created-hint">Dá este código aos teus amigos para entrarem.</div><button class="board-more" id="jumpCopyRoomCode" type="button">COPIAR CÓDIGO</button></div>';
 boards?.after(createPanel);
 $('jumpRoomCreateSubmit').onclick=submitJumpRoom;
 $('jumpCopyRoomCode').onclick=async()=>{const code=$('jumpCreatedRoomCode').textContent;try{await navigator.clipboard.writeText(code);$('jumpCopyRoomCode').textContent='COPIADO';setTimeout(()=>{$('jumpCopyRoomCode').textContent='COPIAR CÓDIGO'},1400)}catch(_){$('jumpCopyRoomCode').textContent=code}};

 const roomBoard=document.createElement('section');roomBoard.id='jumpRoomBoard';roomBoard.className='room-board jump-room-board hidden';
 roomBoard.innerHTML='<div class="room-board-heading"><div><span class="room-panel-mark">◆</span><strong id="jumpRoomTitle">JUMP ROOM</strong><small id="jumpRoomMeta"></small></div><div class="room-board-actions"><button class="board-more" id="jumpRoomLeave" type="button">SAIR DA SALA</button><button class="board-more danger" id="jumpRoomAbandon" type="button">ABANDONAR SALA</button></div></div><ol id="jumpRoomRanking"></ol>';
 createPanel.after(roomBoard);
 $('jumpRoomLeave').onclick=async()=>{roomId=null;roomLabel='';await newRun({mode:'solo',biome:BIOMES[Math.floor(Math.random()*4)]})};
 $('jumpRoomAbandon').onclick=confirmAbandonJumpRoom;

 $('jumpSoloButton').onclick=()=>newRun({biome:BIOMES[Math.floor(Math.random()*4)],mode:'solo'});
 $('jumpJoinButton').onclick=chooseWorld;$('jumpCustomizeButton').onclick=customize;$('jumpRestart').onclick=()=>team?showTeamLobby():newRun({biome,mode,roomId,roomLabel});
 $('jumpDuoButton').onclick=()=>openTeam('duo');$('jumpTrioButton').onclick=()=>openTeam('trio');
 initTeamBoards(boards);
 captureNative('.action.blue[href="#ranking"]',()=>openRank('world'));
 captureNative('.action.purple[href="#rooms"]',()=>jumpRooms());
 captureNative('#createRoomButton',toggleJumpCreateRoom);
 captureNative('#worldFullButton',()=>openRank('world'));
 captureNative('#nationalFullButton',()=>openRank('country'));

 for(const id of ['modalWorldTab','modalCountryTab','prevPage','nextPage']){
  $(id)?.addEventListener('click',e=>{
   if(current!=='jump')return;
   e.preventDefault();e.stopImmediatePropagation();
   if(id==='modalWorldTab'){rankTab='world';page=1}
   else if(id==='modalCountryTab'){rankTab='country';page=1}
   else if(id==='prevPage')page=Math.max(1,page-1);
   else page=Math.min(Number(rankingData?.pages||page+1),page+1);
   renderJumpFull();
  },true);
 }
 bindControls();updateHud();document.addEventListener('visibilitychange',()=>{last=performance.now();if(!document.hidden&&current==='jump'){refreshRankings();refreshRoomBoard()}});
 window.eixoJump={switchGame,isActive:()=>current==='jump',refreshRankings};
}
init();
})();
