/* EIXO JUMP: vertical, deterministic platformer with isolated leaderboards and 5-player worlds. */
(function(){
'use strict';
const P=window.EixoJumpPhysics;if(!P)return;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lang=()=>String(document.documentElement.lang||'en').startsWith('pt')?'pt':'en';
const T={pt:{solo:'SOLO',join:'JOIN SERVER',character:'PERSONAGEM',height:'ALTURA',restart:'RECOMEÇAR',gameOver:'FIM DE JOGO',rank:'RANKING JUMP',world:'MUNDIAL',country:'NACIONAL',rooms:'SALAS JUMP',create:'CRIAR SALA',enter:'ENTRAR',back:'VOLTAR',empty:'AINDA NÃO HÁ PONTUAÇÕES.',play:'JOGAR',saved:'GUARDADO',cancel:'CANCELAR',save:'GUARDAR',code:'CÓDIGO',noAccount:'ENTRA NA TUA CONTA PARA GUARDAR A PONTUAÇÃO.',leave:'SAIR',choose:'ESCOLHE O AMBIENTE',help:'← → / A D PARA MOVER • ESPAÇO PARA SALTAR',soon:'EM BREVE'},en:{solo:'SOLO',join:'JOIN SERVER',character:'CHARACTER',height:'HEIGHT',restart:'RESTART',gameOver:'GAME OVER',rank:'JUMP RANKING',world:'WORLD',country:'COUNTRY',rooms:'JUMP ROOMS',create:'CREATE ROOM',enter:'ENTER',back:'BACK',empty:'NO SCORES YET.',play:'PLAY',saved:'SAVED',cancel:'CANCEL',save:'SAVE',code:'CODE',noAccount:'SIGN IN TO SAVE YOUR SCORE.',leave:'LEAVE',choose:'CHOOSE YOUR WORLD',help:'← → / A D TO MOVE • SPACE TO JUMP',soon:'COMING SOON'}};
const txt=k=>T[lang()][k]||k;
const BIOMES=['city','forest','desert','snow'];
const themes={
  city:{sky:'#78c6ee',low:'#f0c8bb',hills:'#719ec0',far:'#467293',near:'#294b6d',top:'#7dc5dc',edge:'#466f9b',under:'#465671'},
  forest:{sky:'#89d9e7',low:'#daf4b6',hills:'#77ba9c',far:'#397a65',near:'#234e42',top:'#55c970',edge:'#31864c',under:'#78533a'},
  desert:{sky:'#83cae8',low:'#f9c688',hills:'#e9a16b',far:'#bd7657',near:'#8a513f',top:'#f4ce70',edge:'#b98845',under:'#ad7651'},
  snow:{sky:'#7baedb',low:'#dbf0ff',hills:'#b0c9d8',far:'#799bb8',near:'#55708d',top:'#ecf9ff',edge:'#9ebdd5',under:'#6b869e'}
};
let current='pulse',run=null,local=null,frame=null,canvas=null,ctx=null,mode='solo',biome='forest',seed=0,peers=[],colors=null,palette=[],keys={left:false,right:false,jump:false},jumpSeq=0,last=0,busy=false,finishing=false,rankTimer=null,networkTimer=null,animation=null,panel=null,page=1,rankTab='world',rankingData=null,gameOver=false,roomId=null,roomLabel='',lastState=null;
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
 const switcher=$('eixoGameSwitcher');switcher.querySelectorAll('[data-game]').forEach(b=>b.classList.toggle('active',b.dataset.game===current));
 $('gameIntro').querySelector('[data-i18n="aboutText"]').textContent=current==='jump'?' — JUMP: '+txt('help'):current==='eat'?' — '+txt('soon'):window.eixoT?.('aboutText',' — a simple reflex game. Hit the center, score points and climb the ranking.')||' — a simple reflex game.';
 $('jumpRoot').classList.toggle('hidden',current!=='jump');frame.classList.toggle('jump-mode',current==='jump');
 document.body.classList.toggle('eixo-jump-view',current==='jump');if($('jumpRoomBoard'))$('jumpRoomBoard').classList.toggle('hidden',current!=='jump'||!roomId);
}
async function switchGame(next){
 if(next==='eat'){modal('EAT','<p>'+txt('soon')+'</p>');return}
 if(current===next&&next==='jump'){await newRun({biome,mode,roomId});return}
 if(current===next)return;
 if(current==='jump')await stopRun();
 current=next;window.eixoJumpActive=current==='jump';closePanel();showMode();
 if(current==='jump'){
   window.stopGame?.();await newRun({biome:BIOMES[Math.floor(Math.random()*4)],mode:'solo'});
   refreshRankings();if(!animation)animation=requestAnimationFrame(loop);clearInterval(rankTimer);rankTimer=setInterval(()=>{if(!document.hidden&&current==='jump')refreshRoomBoard()},5500);
 }else{
   clearInterval(rankTimer);clearInterval(networkTimer);if(animation)cancelAnimationFrame(animation);animation=null;
   keys={left:false,right:false,jump:false};window.eixoRefreshRankings?.();window.resetGame?.();
 }
}
async function stopRun(){
 if(!run)return;const old=run;run=null;clearInterval(networkTimer);
 try{await api('/api/jump/run/finish',{method:'POST',body:JSON.stringify({runId:old.runId})})}catch(e){console.warn('JUMP finalization:',e.message)}
}
function updateHud(){
 $('jumpHeight').textContent=String(Math.floor(local?.best||0)).padStart(3,'0');
 $('jumpWorld').textContent=biome.toUpperCase()+(mode==='solo'?' · SOLO':' · '+(lastState?.players||1)+'/5');
 $('jumpSoloButton').textContent=txt('solo');$('jumpJoinButton').textContent=txt('join');$('jumpCustomizeButton').textContent=txt('character');$('jumpHelp').textContent=txt('help');
}
async function newRun(options={}){
 const b=options.biome||biome;biome=b;mode=options.mode||'solo';roomId=options.roomId||null;roomLabel=options.roomLabel||'';
 await stopRun();keys={left:false,right:false,jump:false};jumpSeq=0;local=null;gameOver=false;finishing=false;peers=[];lastState=null;$('jumpEnd').classList.add('hidden');showError('');
 if(!getPlayer()?.id){showError(txt('noAccount'));return}
 try{
   const out=await api('/api/jump/run/start',{method:'POST',body:JSON.stringify({biome,multiplayer:mode==='public',roomId})});
   run=out;seed=out.seed;biome=out.biome;mode=out.mode;colors=out.colors||colors;
   local=P.create(seed);last=performance.now();updateHud();draw();refreshRoomBoard();clearInterval(networkTimer);
   networkTimer=setInterval(sync,125);sync();
 }catch(e){run=null;showError(e.message)}
}
async function sync(){
 if(!run||busy||current!=='jump')return;
 const identity=run.runId;busy=true;
 try{
  const out=await api('/api/jump/run/input',{method:'POST',body:JSON.stringify({runId:identity,left:keys.left,right:keys.right,jumpSeq})});
  if(run?.runId!==identity)return;
  lastState=out;peers=out.peers||[];
  if(!out.state?.alive&&!gameOver)await die();
  // Never teleport the local sprite to an older network snapshot. The server
  // independently validates height/death; its snapshots drive remote players only.
  updateHud();
 }catch(e){if(run?.runId===identity)showError(e.message)}
 finally{busy=false}
}
async function die(){
 if(gameOver||finishing)return;finishing=true;gameOver=true;const old=run;run=null;clearInterval(networkTimer);
 let result={score:Math.floor(local?.best||0)};
 try{if(old)result=await api('/api/jump/run/finish',{method:'POST',body:JSON.stringify({runId:old.runId})})}catch(e){showError(e.message)}
 $('jumpFinal').textContent=String(result.score||0);$('jumpEnd').classList.remove('hidden');
 $('jumpEndTitle').textContent=txt('gameOver');$('jumpRestart').textContent=txt('restart');
 refreshRankings();refreshRoomBoard();finishing=false;
}
function drawBackground(){
 const t=themes[biome],c=ctx,cam=local?.cam||0;
 const g=c.createLinearGradient(0,0,0,P.H);g.addColorStop(0,t.sky);g.addColorStop(1,t.low);c.fillStyle=g;c.fillRect(0,0,P.W,P.H);
 // Distinct pixel-art scenery with parallax; no external textures or heavy animation.
 const shift=(cam*.11)%P.W;
 if(biome==='city'){
   c.fillStyle='#ecf3e1';c.fillRect(350-shift*.16,20,18,18);
   for(let i=-2;i<24;i++){let x=i*26-shift*.2;let h=23+Math.floor(P.hash?P.hash(seed,i):Math.abs(Math.sin(i*5+seed))*.99)*44;c.fillStyle=i%3?t.far:t.hills;c.fillRect(x,P.H-h,24,h);c.fillStyle='#f9df99';for(let j=5;j<22;j+=9)for(let y=P.H-h+8;y<P.H;y+=10)c.fillRect(x+j,y,3,4);}
   for(let i=-2;i<17;i++){const x=i*35-shift*.5,h=22+(i*i*13%58);c.fillStyle=t.near;c.fillRect(x,P.H-h,32,h);c.fillStyle='#fbd891';for(let j=6;j<30;j+=10)for(let y=P.H-h+8;y<P.H;y+=12)c.fillRect(x+j,y,3,4);}
 }else if(biome==='forest'){
   c.fillStyle='#f0fff0';for(let i=0;i<7;i++){let x=(i*93-shift*.16+P.W*2)%P.W;c.fillRect(x,25+i%3*12,24,5);c.fillRect(x+6,20+i%3*12,15,5)}
   for(let i=-2;i<13;i++){const x=i*52-shift*.36;c.fillStyle=t.far;c.fillRect(x+9,60,7,135);c.fillStyle='#3c9873';c.fillRect(x-3,50,31,18);c.fillRect(x+3,32,21,25);c.fillStyle='#68c77c';c.fillRect(x+1,38,17,14)}
   for(let i=-1;i<7;i++){const x=i*92-shift*.65;c.fillStyle='#764f38';c.fillRect(x+20,10,14,190);c.fillStyle=t.near;c.fillRect(x+4,3,50,27);c.fillStyle='#428653';c.fillRect(x-5,17,66,18);c.fillStyle='#69bb67';c.fillRect(x+7,7,33,19)}
 }else if(biome==='desert'){
   c.fillStyle='#ffe9b1';c.fillRect(345-shift*.05,20,24,24);
   for(let i=-2;i<10;i++){let x=i*76-shift*.26,h=30+i*i*7%60;c.fillStyle=t.hills;c.fillRect(x,P.H-h,65,h);c.fillStyle=t.far;c.fillRect(x+14,P.H-h-22,24,24)}
   for(let i=-1;i<8;i++){let x=i*90-shift*.55;c.fillStyle=t.near;c.fillRect(x+10,P.H-63,13,63);c.fillRect(x-3,P.H-45,47,14);c.fillStyle='#427950';c.fillRect(x+59,P.H-32,5,27);c.fillRect(x+56,P.H-27,13,4)}
 }else{
   c.fillStyle='#f4fcff';for(let i=0;i<20;i++)c.fillRect((i*53+13)%P.W,(i*37+18)%110,2,2);
   for(let i=-1;i<9;i++){let x=i*70-shift*.25;c.fillStyle=t.hills;c.beginPath();c.moveTo(x,P.H);c.lineTo(x+35,66+i%3*9);c.lineTo(x+84,P.H);c.fill();c.fillStyle='#f7fcff';c.beginPath();c.moveTo(x+20,92);c.lineTo(x+35,66+i%3*9);c.lineTo(x+50,91);c.fill();}
   for(let i=-2;i<12;i++){let x=i*45-shift*.5;c.fillStyle=t.near;c.fillRect(x+15,P.H-32,7,32);c.beginPath();c.moveTo(x+2,P.H-20);c.lineTo(x+18,P.H-65);c.lineTo(x+36,P.H-20);c.fill();c.fillStyle='#ebfaf9';c.fillRect(x+12,P.H-45,9,3)}
 }
 // Small drifting square particles in four biomes.
 for(let i=0;i<18;i++){let x=(i*71+seed%47+cam*(i%3+1)*.08)%P.W,y=(i*37+cam*.18)%P.H;c.fillStyle=i%3?'#ffffff72':'#ffffffaa';c.fillRect(Math.round(x),Math.round(y),2,2)}
}
function drawCharacter(c,x,y,style,name,ghost=false){
 if(!style)style=colors||{};
 const S={...{skin:'#ffcc99',hair:'#172b3b',shirt:'#00e5ff',arms:'#ffcc99',pants:'#3b82f6',shoes:'#ffffff',eyes:'#172b3b'},...style};
 c.save();c.globalAlpha=ghost?0.75:1;
 const q=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h)};
 // 12x22 customisable sprite: separate hair, head, eyes, torso, arms, trousers and shoes.
 q(x-5,y-22,10,2,S.hair);q(x-6,y-20,12,4,S.hair);q(x-5,y-16,10,6,S.skin);q(x-3,y-14,2,2,S.eyes);q(x+2,y-14,2,2,S.eyes);
 q(x-5,y-10,10,7,S.shirt);q(x-8,y-10,3,6,S.arms);q(x+5,y-10,3,6,S.arms);
 q(x-5,y-3,4,6,S.pants);q(x+1,y-3,4,6,S.pants);q(x-6,y+2,5,2,S.shoes);q(x+1,y+2,5,2,S.shoes);
 if(name){c.fillStyle=ghost?'#e5f4ff':'#fff';c.textAlign='center';c.font='5px monospace';c.fillText(String(name).slice(0,12),x,y-28)}
 c.restore();
}
function draw(){
 if(!ctx||current!=='jump')return;const c=ctx;drawBackground();
 if(!local)return;
 const cam=local.cam,screen=y=>P.H-30-(y-cam),t=themes[biome];
 for(const p of local.platforms){if(p.y<cam-12||p.y>cam+P.H+30)continue;const y=Math.round(screen(p.y)),x=Math.round(p.x);
   c.fillStyle='#00000026';c.fillRect(x+2,y+4,p.w,7);c.fillStyle=t.under;c.fillRect(x,y+2,p.w,6);c.fillStyle=t.edge;c.fillRect(x,y,p.w,3);c.fillStyle=t.top;c.fillRect(x+2,y-3,p.w-4,4);
   if(biome==='forest'){c.fillStyle='#c8f18e';for(let j=11;j<p.w;j+=24)c.fillRect(x+j,y-5,2,2)}
   if(biome==='desert'){c.fillStyle='#f7e0a6';c.fillRect(x+9,y-1,12,2)}
   if(biome==='snow'){c.fillStyle='#fff';c.fillRect(x+3,y-5,p.w-6,3)}
 }
 for(const peer of peers){let y=screen(peer.y);if(y>-10&&y<P.H+35)drawCharacter(c,peer.x,y,peer.colors,peer.name,true)}
 drawCharacter(c,local.x,screen(local.y),colors,'');
 c.fillStyle='#ffffffaa';c.fillRect(0,0,P.W,1);
}
function loop(now){
 if(current!=='jump'){animation=null;return}
 let dt=Math.min(.04,(now-last)/1000||0);last=now;
 if(local&&!gameOver&&run){
  P.step(local,keys,dt);if(!local.alive)die();
  updateHud();
 }
 draw();animation=requestAnimationFrame(loop);
}
function setKey(code,on){
 if(['ArrowLeft','KeyA'].includes(code))keys.left=on;
 if(['ArrowRight','KeyD'].includes(code))keys.right=on;
 if(code==='Space'){
   if(on&&!keys.jump)jumpSeq++;
   keys.jump=on;
 }
}
function onKeyboard(e){
 if(current!=='jump'||panel||e.target?.matches('input,select,textarea,[contenteditable]'))return;
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyA','KeyD'].includes(e.code)){
   e.preventDefault();e.stopImmediatePropagation();
   if(e.type==='keydown'&&e.repeat)return;
   setKey(e.code,e.type==='keydown');
   // Sync immediately on key transitions rather than waiting for the
   // next polling tick, reducing movement and jump input latency.
   void sync();
 }
}
function bindControls(){
 window.addEventListener('keydown',onKeyboard,true);window.addEventListener('keyup',onKeyboard,true);
 window.addEventListener('blur',()=>{keys={left:false,right:false,jump:false}});
 for(const button of document.querySelectorAll('[data-jump-key]')){
  const k=button.dataset.jumpKey;button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture?.(e.pointerId);if(k==='jump'&&!keys.jump)jumpSeq++;keys[k]=true;void sync()});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,()=>{keys[k]=false;void sync()});
 }
}
const flags=c=>[...String(c||'PT')].map(x=>String.fromCodePoint(127397+x.charCodeAt())).join('');
// Share the PULSE leaderboard UI: the renderer itself selects JUMP data and
// retains VIP names, colored letters, top tags, flags and personal ranking.
function refreshRankings(){if(current==='jump')window.eixoRefreshRankings?.();}
function openRank(){document.querySelector('.action.blue[href="#ranking"]')?.click();}
function chooseWorld(){
 modal(txt('choose'),'<div class="jump-world-grid">'+BIOMES.map(b=>'<button class="jump-world-option '+b+'" data-biome="'+b+'"><strong>'+b.toUpperCase()+'</strong><small>JOIN SERVER</small></button>').join('')+'</div><p>5 PLAYERS MAX / INSTANCE · AUTO MATCHMAKING</p>');
 panel.querySelectorAll('[data-biome]').forEach(btn=>btn.onclick=()=>{const b=btn.dataset.biome;closePanel();newRun({biome:b,mode:'public'})});
}
async function customize(){
 if(!getPlayer()?.id){showError(txt('noAccount'));return}
 let out;try{out=await api('/api/jump/cosmetics')}catch(e){showError(e.message);return}
 colors=out.colors;palette=out.palette||[];
 const labels={skin:'SKIN',hair:'HAIR',shirt:'SHIRT',arms:'ARMS',pants:'PANTS',shoes:'SHOES',eyes:'EYES'};
 modal(txt('character'),'<div class="jump-custom-preview"><canvas id="jumpAvatarPreview" width="120" height="85"></canvas></div><div class="jump-color-list">'+(out.parts||Object.keys(labels)).map(part=>'<label><span>'+labels[part]+'</span><select data-jump-color="'+part+'">'+palette.map(color=>'<option value="'+color+'"'+(colors[part]===color?' selected':'')+'>'+color.toUpperCase()+'</option>').join('')+'</select></label>').join('')+'</div><button class="modal-button primary" id="jumpSave">'+txt('save')+'</button><p id="jumpSaveStatus"></p>');
 const preview=()=>{const cv=$('jumpAvatarPreview');if(!cv)return;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,120,85);c.save();c.translate(35,12);c.scale(4,3);drawCharacter(c,0,22,colors,'');c.restore()};
 panel.querySelectorAll('[data-jump-color]').forEach(s=>{s.style.color=s.value;s.style.borderColor=s.value;s.onchange=()=>{colors[s.dataset.jumpColor]=s.value;s.style.color=s.value;s.style.borderColor=s.value;preview()}});preview();
 $('jumpSave').onclick=async()=>{try{await api('/api/jump/cosmetics',{method:'POST',body:JSON.stringify({colors})});$('jumpSaveStatus').textContent=txt('saved');setTimeout(closePanel,600)}catch(e){$('jumpSaveStatus').textContent=e.message}};
}
async function refreshRoomBoard(){
 const board=$('jumpRoomBoard');
 if(!board)return;
 board.classList.toggle('hidden',current!=='jump'||!roomId);
 if(current!=='jump'||!roomId)return;
 $('jumpRoomTitle').textContent=(roomLabel||'JUMP ROOM')+' · '+biome.toUpperCase();
 $('jumpRoomMeta').textContent=' · '+biome.toUpperCase()+' · 5 MAX';
 try{
  const d=await api('/api/jump/rooms/rankings?roomId='+encodeURIComponent(roomId));
  if(!$('jumpRoomRanking'))return;
  const tag=(kind,n,country,color)=>n>=1&&n<=3?'<span class="rank-tag '+kind+'-'+n+'"'+(/^#[0-9a-f]{6}$/i.test(color||'')?' style="background:'+esc(color)+'!important;color:#fff!important"':'')+'>'+n+'# '+(kind==='country'?esc(country):'GLOBAL')+'</span>':'';
  const vip=n=>n>0?'<span class="vip-rank-tag vip-rank-'+Math.min(n,6)+'">'+(n>=6?'VIP ∞':'VIP #'+n)+'</span>':'';
  $('jumpRoomRanking').innerHTML=d.players.map((p,i)=>{
    const styles=Array.isArray(p.letterStyles)?p.letterStyles:[],name=String(p.visualName||p.name||'');
    const letters=[...name].map((ch,j)=>{
      const st=styles[j]||{},color=String(st.color||'').toLowerCase(),effect=/^[a-z]+$/.test(String(st.effect||'none'))?String(st.effect||'none'):'none';
      return '<span class="name-letter'+(color==='rainbow'?' name-rainbow':'')+' effect-'+effect+'"'+(/^#[0-9a-f]{6}$/i.test(color)?' style="color:'+color+'"':'')+'>'+esc(ch)+'</span>';
    }).join('');
    const rainbow=String(p.nameColor||'').toLowerCase()==='rainbow'&&!styles.length;
    return '<li><span class="rank-number">'+(i+1)+'</span><span class="full-player"><span class="rank-name-wrap"><span class="rank-player-name'+(rainbow?' name-rainbow':'')+(styles.length?' vip-letter-styled':'')+'">'+(letters||esc(name))+'</span>'+tag('world',Number(p.worldRank),p.country,p.tagGlobalColor)+tag('country',Number(p.countryRank),p.country,p.tagCountryColor)+vip(Number(p.vipLevel||0))+'</span></span><span class="rank-score-wrap"><span class="rank-flag" title="'+esc(p.country)+'">'+esc(flags(p.country))+'</span><span class="rank-score">'+Number(p.score||0)+'</span></span></li>';
  }).join('');
 }catch(e){if($('jumpRoomRanking'))$('jumpRoomRanking').textContent=e.message}
}
async function jumpRooms(tab='list'){
 modal(txt('rooms'),'<div class="rooms-modal-heading jump-room-modal-heading"><button id="jumpRoomsListTab" class="board-more" type="button">'+txt('rooms')+'</button><button id="jumpRoomsNewTab" class="rooms-add-button" type="button">'+txt('create')+'</button></div><div id="jumpRoomFeedback" class="form-error" role="status"></div><div id="jumpRoomsBody"></div>');
 $('jumpRoomsListTab').onclick=()=>renderJumpRooms('list');
 $('jumpRoomsNewTab').onclick=()=>renderJumpRooms('create');
 await renderJumpRooms(tab);
}
async function renderJumpRooms(tab){
 const body=$('jumpRoomsBody');if(!body)return;
 $('jumpRoomFeedback').textContent='';
 if(tab==='create'){
  body.innerHTML='<div class="room-create-grid jump-room-create-grid"><label class="room-field"><span>ROOM NAME</span><input class="pixel-input" id="jumpRoomName" maxlength="24" placeholder="JUMP NIGHT"></label><label class="room-field"><span>WORLD · 5 PLAYERS MAX</span><select class="pixel-input" id="jumpRoomBiome">'+BIOMES.map(b=>'<option value="'+b+'">'+b.toUpperCase()+'</option>').join('')+'</select></label><button class="modal-button primary room-create-submit" id="jumpCreateRoom">'+txt('create')+'</button></div>';
  $('jumpCreateRoom').onclick=async()=>{
   const button=$('jumpCreateRoom');button.disabled=true;
   try{
    const d=await api('/api/jump/rooms/create',{method:'POST',body:JSON.stringify({name:$('jumpRoomName').value,biome:$('jumpRoomBiome').value})});
    await jumpRooms('list');if($('jumpRoomFeedback'))$('jumpRoomFeedback').textContent='ROOM CREATED · '+d.room.code;
   }catch(e){$('jumpRoomFeedback').textContent=e.message}finally{button.disabled=false}
  };
  return;
 }
 body.innerHTML='<div class="jump-join-code"><label class="room-field"><span>ROOM CODE</span><input class="pixel-input" id="jumpRoomCode" maxlength="6" placeholder="'+txt('code')+'"></label><button id="jumpRoomJoin" class="modal-button primary">'+txt('enter')+'</button></div><div class="rooms-list" id="jumpRoomList">LOADING...</div>';
 $('jumpRoomCode').addEventListener('input',e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-F0-9]/g,'').slice(0,6)});
 $('jumpRoomJoin').onclick=async()=>{
  const button=$('jumpRoomJoin');button.disabled=true;
  try{
   const d=await api('/api/jump/rooms/join',{method:'POST',body:JSON.stringify({code:$('jumpRoomCode').value})});
   await renderJumpRooms('list');
   if($('jumpRoomFeedback'))$('jumpRoomFeedback').textContent='ROOM JOINED · '+d.room.code;
  }catch(e){$('jumpRoomFeedback').textContent=e.message}finally{button.disabled=false}
 };
 try{
  const result=await api('/api/jump/rooms');if(!$('jumpRoomList'))return;
  $('jumpRoomList').innerHTML=result.rooms.length?result.rooms.map(r=>
   '<article class="room-card"><div class="room-card-main"><div class="room-card-name">'+esc(r.name)+'</div><div class="room-card-meta">'+esc(r.ownerName)+' · '+r.biome.toUpperCase()+' · '+r.memberCount+'/5 PLAYERS</div></div><div class="room-card-code">'+esc(r.code)+'</div><div class="room-card-actions"><button class="board-more" data-copy-code="'+esc(r.code)+'" type="button">COPY CODE</button><button class="board-more enter-room-button" data-room="'+esc(r.id)+'" type="button">'+txt('enter')+'</button></div></article>'
  ).join(''):'<div class="rooms-empty">NO JUMP ROOMS YET</div>';
  panel.querySelectorAll('[data-room]').forEach(b=>b.onclick=()=>{
   const item=result.rooms.find(x=>x.id===b.dataset.room);if(!item)return;
   closePanel();newRun({biome:item.biome,mode:'private',roomId:item.id,roomLabel:item.name});
  });
  panel.querySelectorAll('[data-copy-code]').forEach(b=>b.onclick=async()=>{
    try{await navigator.clipboard.writeText(b.dataset.copyCode);b.textContent='COPIED'}catch(_){b.textContent=b.dataset.copyCode}
  });
 }catch(e){if($('jumpRoomList'))$('jumpRoomList').textContent=e.message}
}
function captureNative(selector,callback){
 const el=document.querySelector(selector);
 el?.addEventListener('click',e=>{if(current!=='jump')return;e.preventDefault();e.stopImmediatePropagation();callback() },true);
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
 '<div class="jump-tools"><button id="jumpSoloButton">SOLO</button><button id="jumpJoinButton">JOIN SERVER</button><button id="jumpCustomizeButton">CHARACTER</button></div>'+
 '<div class="jump-help" id="jumpHelp"></div><div class="jump-status" id="jumpStatus" role="status"></div>'+
 '<div class="jump-touch-controls"><button data-jump-key="left">◀</button><button data-jump-key="right">▶</button><button data-jump-key="jump">▲</button></div>'+
 '<div class="jump-end hidden" id="jumpEnd"><strong id="jumpEndTitle">GAME OVER</strong><p>HEIGHT: <span id="jumpFinal">0</span></p><button id="jumpRestart">RESTART</button></div>';
 frame.appendChild(root);canvas=$('jumpCanvas');ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 const roomBoard=document.createElement('section');roomBoard.id='jumpRoomBoard';roomBoard.className='room-board jump-room-board hidden';
 roomBoard.innerHTML='<div class="room-board-heading"><div><span class="room-panel-mark">◆</span><strong id="jumpRoomTitle">JUMP ROOM</strong><small id="jumpRoomMeta"></small></div><div class="room-board-actions"><button class="board-more" id="jumpRoomLeave" type="button">LEAVE ROOM</button><button class="board-more danger" id="jumpRoomAbandon" type="button">ABANDON ROOM</button></div></div><ol id="jumpRoomRanking"></ol>';
 document.querySelector('.boards')?.before(roomBoard);
 $('jumpRoomLeave').onclick=async()=>{
   if(!roomId)return;
   await newRun({mode:'solo',biome:BIOMES[Math.floor(Math.random()*4)]});
 };
 $('jumpRoomAbandon').onclick=()=>{
   if(!roomId)return;
   modal('ABANDON JUMP ROOM','<p>Leave this room permanently? You will need the code to rejoin.</p><div class="abandon-room-actions"><button class="modal-button" id="jumpAbandonNo" type="button">NO</button><button class="modal-button primary" id="jumpAbandonYes" type="button">YES</button></div>');
   $('jumpAbandonNo').onclick=closePanel;
   $('jumpAbandonYes').onclick=async()=>{
     const id=roomId,button=$('jumpAbandonYes');button.disabled=true;
     try{
       await api('/api/jump/rooms/leave',{method:'POST',body:JSON.stringify({roomId:id})});
       closePanel();
       await newRun({mode:'solo',biome:BIOMES[Math.floor(Math.random()*4)]});
     }catch(e){if($('jumpPanelBody'))$('jumpPanelBody').append(document.createTextNode(e.message));button.disabled=false}
   };
 };

 $('jumpSoloButton').onclick=()=>newRun({biome:BIOMES[Math.floor(Math.random()*4)],mode:'solo'});
 $('jumpJoinButton').onclick=chooseWorld;$('jumpCustomizeButton').onclick=customize;$('jumpRestart').onclick=()=>newRun({biome,mode,roomId,roomLabel});
 captureNative('.action.purple[href="#rooms"]',()=>jumpRooms('list'));
 captureNative('#createRoomButton',()=>jumpRooms('create'));
 bindControls();updateHud();document.addEventListener('visibilitychange',()=>{last=performance.now();if(!document.hidden&&current==='jump')refreshRankings()});
 window.eixoJump={switchGame,isActive:()=>current==='jump',refreshRankings};
}
init();
})();
