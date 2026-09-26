/* Routes and modern presentation over the existing account, chat, ranking and game modules. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),routes=['home','jump','pulse','passport','rankings','rooms','vip'];
const paths={home:'/',jump:'/jump',pulse:'/pulse',passport:'/passport',rankings:'/rankings',rooms:'/rooms',vip:'/vip'};
const pt=()=>document.documentElement.lang.startsWith('pt');
const t=(a,b)=>pt()?a:b;
const player=()=>window.eixoGetPlayer?.()||null;
let route='home',rankGame='jump',roomGame='jump',rankScope='world',queue=Promise.resolve(),profileGeneration=0,characterFrame=0,lastLanguage=document.documentElement.lang;
const shell=document.querySelector('.site-shell'),main=shell.querySelector('main'),top=shell.querySelector('.topbar');
const hero=$('game'),intro=$('gameIntro'),boards=$('ranking'),chat=$('chatSidebar'),switcher=$('eixoGameSwitcher');
if(!hero||!boards||!chat||!window.eixoJump)return;
document.body.classList.add('eixo-modern');
const make=(tag,cls,html)=>{const e=document.createElement(tag);e.className=cls;if(html)e.innerHTML=html;return e;};
const nav=make('nav','rx-nav');nav.setAttribute('aria-label',t('Navegação principal','Main navigation'));top.querySelector('.brand').after(nav);
const views={};for(const key of routes){if(key==='pulse')continue;views[key]=make('section','rx-page');views[key].id='rx-'+key;views[key].hidden=true;main.append(views[key]);}
views.pulse=views.jump;views.jump.classList.add('rx-game-page');
const gameMast=make('header','rx-game-mast'),gameTools=make('div','rx-game-utilities'),playLayout=make('div','rx-play-layout'),playMain=make('div','rx-play-main'),social=make('aside','rx-social'),rankWrap=make('section','rx-rank-wrap'),rankTabs=make('div','rx-rank-tabs');
rankTabs.setAttribute('aria-label',t('Âmbito do ranking','Ranking scope'));
rankWrap.append(rankTabs,boards);social.append(rankWrap,chat);playLayout.append(playMain,social);views.jump.append(gameMast,gameTools,switcher,intro,playLayout);playMain.append(hero);
for(const id of ['roomCreatePanel','roomBoard','jumpRoomCreatePanel','jumpRoomBoard']){const e=$(id);if(e)playMain.append(e);}
const rankMount=make('div','rx-ranking-mount');
const character=make('canvas','');character.id='rxCharacter';character.width=560;character.height=580;character.setAttribute('aria-label',t('A tua personagem JUMP','Your JUMP character'));
const notice=make('div','rx-notice');notice.hidden=true;notice.setAttribute('role','status');document.body.append(notice);
let noticeTimer;
function notify(message){clearTimeout(noticeTimer);notice.textContent=String(message||'');notice.hidden=!message;noticeTimer=setTimeout(()=>notice.hidden=true,6000);}
const wallButton=make('button','rx-button');wallButton.type='button';wallButton.dataset.rxAction='wall';document.querySelector('.footer')?.append(wallButton);
const wallHint=make('div','rx-wall-hint');wallHint.hidden=true;document.body.append(wallHint);
function closeWall(){document.body.classList.remove('rx-wall-open');wallHint.hidden=true;wallButton.setAttribute('aria-pressed','false');}
window.addEventListener('keydown',e=>{if(e.key==='Escape')closeWall();});
if($('eixoAudioControls'))$('eixoAudioControls').hidden=true;
function labels(){
 character.setAttribute('aria-label',t('A tua personagem JUMP','Your JUMP character'));
 nav.setAttribute('aria-label',t('Navegação principal','Main navigation'));rankTabs.setAttribute('aria-label',t('Âmbito do ranking','Ranking scope'));
 wallButton.textContent=t('Mural de píxeis','Pixel wall');wallButton.setAttribute('aria-pressed','false');
 wallHint.innerHTML='<span>'+t('Escolhe um píxel e deixa a tua marca.','Choose a pixel and leave your mark.')+'</span><button class="rx-button" type="button" data-rx-action="wall-close">'+t('Voltar ao site','Back to site')+' ×</button>';
 nav.innerHTML=routes.filter(x=>!['jump','pulse'].includes(x)).map(x=>'<a href="'+paths[x]+'" data-rx-route="'+x+'">'+({home:t('Início','Home'),passport:'Passport',rankings:'Rankings',rooms:t('Salas','Rooms'),vip:'VIP'})[x]+'</a>').join('');
 gameMast.innerHTML='<div class="rx-game-mast-copy"><p class="rx-eyebrow">EIXO ARCADE / <span data-rx-game-name>JUMP</span></p><h1 data-rx-game-title>'+t('Salta. Supera. Repete.','Jump. Beat it. Repeat.')+'</h1><p data-rx-game-copy>'+t('Cada plataforma conta. Bate o teu recorde e sobe no ranking.','Every platform counts. Beat your best and climb the ranking.')+'</p></div><div class="rx-game-live"><i aria-hidden="true"></i><span>'+t('AO VIVO','LIVE')+'</span><strong data-rx-game-mode>JUMP</strong></div>';
 gameTools.innerHTML='<a class="rx-button" href="/" data-rx-route="home">← '+t('Início','Home')+'</a><a class="rx-button" href="/passport" data-rx-route="passport">Passport</a><button class="rx-button" type="button" data-rx-action="sound">'+t('Som','Sound')+'</button><button class="rx-button" type="button" data-rx-action="fullscreen">'+t('Ecrã inteiro','Fullscreen')+'</button>';
 rankTabs.innerHTML='<button type="button" data-rx-scope="world">'+t('Global','Global')+'</button><button type="button" data-rx-scope="country">'+t('Nacional','National')+'</button>';
 views.home.innerHTML='<div class="rx-hero"><div class="rx-hero-copy"><p class="rx-eyebrow">SMALL PIXELS. BIG IDEAS.</p><h1>'+t('O próximo salto<br>é teu.','Your next leap<br>starts here.')+'</h1><p>'+t('Jogos para entrar num instante. Um estilo que é só teu.','Games to jump into. A style that is yours.')+'</p><a class="rx-button primary" href="/jump" data-rx-route="jump">'+t('Jogar JUMP','Play JUMP')+' ↗</a></div><div class="rx-original-runner" role="img" aria-label="JUMP"></div></div><div class="rx-three rx-section"><article class="rx-game-card"><h2>JUMP</h2><p>'+t('Supera o teu recorde. Encontra a comunidade.','Beat your best. Meet the community.')+'</p><a class="rx-button" href="/jump" data-rx-route="jump">'+t('Jogar','Play')+' ↗</a></article><article class="rx-game-card"><h2>PULSE</h2><p>'+t('O momento certo faz toda a diferença.','Timing makes all the difference.')+'</p><a class="rx-button" href="/pulse" data-rx-route="pulse">'+t('Jogar','Play')+' ↗</a></article><article class="rx-game-card"><h2>EAT</h2><p>'+t('Um novo desafio está a ganhar forma.','A new challenge is taking shape.')+'</p><span class="rx-tag gold">'+t('EM BREVE','COMING SOON')+'</span></article></div><div class="rx-two rx-section"><article class="rx-panel"><p class="rx-eyebrow">EIXO PASSPORT</p><h2>'+t('A tua personagem. O teu percurso.','Your character. Your journey.')+'</h2><p class="rx-muted">'+t('Consulta o perfil e acede às tuas personalizações.','See your profile and access your customizations.')+'</p><a class="rx-button" href="/passport" data-rx-route="passport">'+t('Abrir Passport','Open Passport')+' ↗</a></article><article class="rx-panel"><p class="rx-eyebrow">'+t('COMUNIDADE','COMMUNITY')+'</p><h2>'+t('Quem chega mais longe?','Who goes furthest?')+'</h2><p class="rx-muted">'+t('Rankings próprios para cada jogo, globais e nacionais.','Global and national leaderboards for each game.')+'</p><a class="rx-button" href="/rankings" data-rx-route="rankings">'+t('Ver rankings','View rankings')+' ↗</a></article></div>';
 views.passport.innerHTML='<div class="rx-heading"><p class="rx-eyebrow">EIXO PASSPORT</p><h1>'+t('O teu percurso.<br>O teu estilo.','Your journey.<br>Your style.')+'</h1></div><div class="rx-panel rx-passport"><div class="rx-character" id="rxCharacterSlot"><div class="rx-original-runner" id="rxCharacterFallback" aria-hidden="true"></div></div><div class="rx-profile-copy"><h1 id="rxProfileName"></h1><p id="rxProfileCountry" class="rx-muted"></p><div class="rx-stat-row"><span><strong id="rxJumpBest">—</strong>JUMP</span><span><strong id="rxPulseBest">—</strong>PULSE</span><span><strong id="rxVipLevel">—</strong>VIP</span></div><div class="rx-actions"><button type="button" class="rx-button" data-rx-action="name">'+t('Nome e efeitos','Name & effects')+'</button><button type="button" class="rx-button" data-rx-action="character">'+t('Personagem','Character')+'</button><button type="button" class="rx-button" data-rx-action="account">'+t('Conta','Account')+'</button></div><p class="rx-status" id="rxProfileStatus" role="status"></p></div></div><div class="rx-row rx-section"><h2>'+t('Conquistas para colecionar','Achievements to collect')+'</h2><span class="rx-tag">'+t('EM PREPARAÇÃO','IN DEVELOPMENT')+'</span></div><div class="rx-badge-grid"><article class="rx-achievement rx-locked"><div class="rx-medallion gold" aria-hidden="true">100</div><h3>'+t('Primeiros 100','First 100')+'</h3><p>'+t('Uma marca de quem esteve no início.','A mark for those who were here first.')+'</p><small>'+t('Ainda não atribuída','Not awarded yet')+'</small></article><article class="rx-achievement rx-locked"><div class="rx-medallion blue" aria-hidden="true">↑</div><h3>'+t('Nas alturas','Sky high')+'</h3><p>'+t('Para celebrar marcos no JUMP.','Celebrate milestones in JUMP.')+'</p><small>'+t('Ainda não atribuída','Not awarded yet')+'</small></article><article class="rx-achievement rx-locked"><div class="rx-medallion" aria-hidden="true">✦</div><h3>'+t('Explorador','Explorer')+'</h3><p>'+t('Há mais para descobrir no EIXO.','There is more to discover in EIXO.')+'</p><small>'+t('Ainda não atribuída','Not awarded yet')+'</small></article></div><p class="rx-note">'+t('Níveis, EXP e desafios diários estão em preparação. As badges acima mostram a coleção planeada; não representam conquistas já atribuídas.','Levels, XP and daily challenges are in development. These badges preview the planned collection; they are not awarded achievements.')+'</p>';
 $('rxCharacterSlot').prepend(character);
 views.rankings.innerHTML='<div class="rx-heading"><p class="rx-eyebrow">RANKINGS EIXO</p><h1>'+t('Até onde consegues ir?','How far can you go?')+'</h1></div><div class="rx-sheet-tabs"><button type="button" class="rx-button" data-rx-board="jump">JUMP</button><button type="button" class="rx-button" data-rx-board="pulse">PULSE</button><button type="button" class="rx-button" data-rx-action="full-ranking">'+t('Ranking completo','Full ranking')+'</button></div>';
 views.rankings.append(rankMount);
 views.rooms.innerHTML='<div class="rx-heading"><p class="rx-eyebrow">'+t('SALAS EIXO','EIXO ROOMS')+'</p><h1>'+t('Um lugar para os teus.','A place for your people.')+'</h1><p class="rx-muted">'+t('Escolhe o jogo para consultar ou criar uma sala privada.','Choose a game to view or create a private room.')+'</p></div><div class="rx-sheet-tabs"><button type="button" class="rx-button" data-rx-roomgame="jump">JUMP</button><button type="button" class="rx-button" data-rx-roomgame="pulse">PULSE</button></div><div class="rx-two"><article class="rx-panel"><h2>'+t('As tuas salas','Your rooms')+'</h2><p class="rx-muted">'+t('Consulta as salas ou entra com um código.','View your rooms or join with a code.')+'</p><button type="button" class="rx-button primary" data-rx-action="rooms">'+t('Abrir salas','Open rooms')+' ↗</button></article><article class="rx-panel"><h2>'+t('Cria o teu espaço','Create your space')+'</h2><p class="rx-muted">'+t('Convida os teus amigos e acompanha os resultados da sala.','Invite your friends and follow your room leaderboard.')+'</p><button type="button" class="rx-button" data-rx-action="create-room">'+t('Criar sala','Create room')+' ↗</button></article></div>';
 views.vip.innerHTML='<div class="rx-panel rx-vip-hero rx-two"><div><p class="rx-eyebrow">EIXO VIP</p><h1>'+t('O teu estilo.<br>Mais presente.','Your style.<br>More presence.')+'</h1><p class="rx-muted">'+t('Descobre as opções VIP e gere o teu acesso.','Explore VIP options and manage your access.')+'</p><div class="rx-actions"><button type="button" class="rx-button primary" data-rx-action="vip">'+t('Ver o meu VIP','View my VIP')+'</button><button type="button" class="rx-button" data-rx-action="vip-store">'+t('Planos e preços','Plans & pricing')+'</button></div></div><div class="rx-character"><div class="rx-original-runner" role="img" aria-label="JUMP"></div></div></div><div class="rx-three rx-section"><article class="rx-panel"><h2>'+t('Nome e efeitos','Name & effects')+'</h2><p class="rx-muted">'+t('As cores e animações que já conheces.','The colors and animations you know.')+'</p><button type="button" class="rx-button" data-rx-action="name">'+t('Personalizar','Customize')+'</button></article><article class="rx-panel"><h2>'+t('A tua personagem','Your character')+'</h2><p class="rx-muted">'+t('O desenho original e as tuas combinações.','The original design and your combinations.')+'</p><button type="button" class="rx-button" data-rx-action="character">'+t('Abrir guarda-roupa','Open wardrobe')+'</button></article><article class="rx-panel"><h2>'+t('A tua conta','Your account')+'</h2><p class="rx-muted">'+t('Gere o perfil e as opções existentes.','Manage your profile and existing options.')+'</p><button type="button" class="rx-button" data-rx-action="account">'+t('Definições','Settings')+'</button></article></div>';
 updateActive();refreshProfile();
}
function updateActive(){
 document.body.dataset.page=route;window.eixoRoute=route;
 nav.querySelectorAll('a').forEach(a=>{if(a.dataset.rxRoute===route)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 rankTabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.rxScope===rankScope)));
 document.querySelectorAll('[data-rx-board]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.rxBoard===rankGame)));
 document.querySelectorAll('[data-rx-roomgame]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.rxRoomgame===roomGame)));
 const gameName=route==='pulse'?'PULSE':'JUMP',pulse=route==='pulse';
 gameMast.querySelector('[data-rx-game-name]').textContent=gameName;gameMast.querySelector('[data-rx-game-mode]').textContent=gameName;
 gameMast.querySelector('[data-rx-game-title]').textContent=pulse?t('Foca. Acerta. Domina.','Focus. Hit. Master it.'):t('Salta. Supera. Repete.','Jump. Beat it. Repeat.');
 gameMast.querySelector('[data-rx-game-copy]').textContent=pulse?t('O centro perfeito vale tudo. Mantém o ritmo e supera o teu máximo.','The perfect center is everything. Keep the rhythm and beat your best.'):t('Cada plataforma conta. Bate o teu recorde e sobe no ranking.','Every platform counts. Beat your best and climb the ranking.');
 if(route==='pulse'){const copy=intro.querySelector('[data-i18n="aboutText"]');if(copy)copy.textContent=t(' — Acerta no centro, soma pontos e supera o teu recorde.',' — Hit the center, score points and beat your best.');}
 const gamePage=['jump','pulse'].includes(route);boards.querySelectorAll('.board').forEach((e,i)=>e.hidden=gamePage&&((rankScope==='world')!==(i===0)));
}
function readRoute(){const path=location.pathname.replace(/\/$/,'')||'/';return Object.keys(paths).find(k=>paths[k]===path)||'home';}
function navigate(next,{history=true}={}){
 if(!routes.includes(next))next='home';
 closeWall();const old=route;if(old===next&&['jump','pulse'].includes(next))return queue;route=next;updateActive();
 if(history&&location.pathname!==paths[next])window.history.pushState({},'',paths[next]);
 for(const [k,e] of Object.entries(views))if(k!=='pulse')e.hidden=k!==(next==='pulse'?'jump':next);
 if(old!==next)window.scrollTo({top:0,behavior:'instant'});
 if(next==='rankings'){rankMount.append(boards);boards.querySelectorAll('.board').forEach(e=>e.hidden=false);}else rankWrap.append(boards);
 document.title='EIXO — '+({home:t('Início','Home'),jump:'JUMP',pulse:'PULSE',passport:'Passport',rankings:'Rankings',rooms:t('Salas','Rooms'),vip:'VIP'})[next];
 queue=queue.catch(()=>{}).then(async()=>{
   if(route!==next)return;
   const playing=['jump','pulse'].includes(next);
   if(old!==next||!playing)await window.eixoJump.suspend();
   if(route!==next)return;
   if(playing)await window.eixoJump.switchGame(next,{play:true});
   else if(next==='rankings')await window.eixoJump.switchGame(rankGame,{play:false});
   else if(next==='rooms')await window.eixoJump.switchGame(roomGame,{play:false});
   if(route!==next)return;
   updateActive();window.dispatchEvent(new Event('resize'));
   if(next==='passport')refreshProfile();
 }).catch(e=>console.warn('EIXO navigation:',e));
 return queue;
}
async function refreshProfile(){
 const name=$('rxProfileName');if(!name||route!=='passport')return;
 const p=player(),generation=++profileGeneration;
 name.textContent=p?(p.visualName||p.name):t('O teu Passport','Your Passport');
 $('rxProfileCountry').textContent=p?String(p.country||''):t('Entra na tua conta para veres o teu perfil.','Sign in to see your profile.');
 $('rxVipLevel').textContent=p?String(Number(p.vipLevel)||0):'—';
 $('rxPulseBest').textContent=p&&Number.isFinite(Number(p.bestScore))?String(Number(p.bestScore)):'—';$('rxJumpBest').textContent='—';
 $('rxProfileStatus').textContent='';character.hidden=true;$('rxCharacterFallback').hidden=false;
 if(!p)return;
 // Use the same per-letter classes as the existing name renderer; never normalize the palette.
 const styled=document.createElement('span');styled.className='rank-player-name';
 const perLetter=Number(p.vipLevel)>0&&Array.isArray(p.letterStyles)&&p.letterStyles.length>0;
 const safeEffect=v=>/^[a-z]+$/.test(String(v||''))?v:'none';
 if(perLetter)styled.classList.add('vip-letter-styled');else styled.classList.add('effect-'+safeEffect(p.nameEffect));
 const setColor=(el,color)=>{if(color==='rainbow')el.classList.add('name-rainbow');else if(/^#[a-f0-9]{6}$/i.test(String(color)))el.style.color=color;};
 if(!perLetter)setColor(styled,p.nameColor||'#ffffff');
 [...String(p.visualName||p.name||'')].forEach((ch,i)=>{const letter=document.createElement('span');letter.className='name-letter';letter.textContent=ch;if(perLetter){setColor(letter,p.letterStyles[i]?.color||'#ffffff');letter.classList.add('effect-'+safeEffect(p.letterStyles[i]?.effect));}styled.append(letter);});
 name.replaceChildren(styled);window.eixoApplyNameEffects?.();
 try{
  const [cosmetics,rank]=await Promise.allSettled(['/api/jump/cosmetics','/api/jump/player-rank'].map(async path=>{const res=await fetch(path+'?id='+encodeURIComponent(p.id),{credentials:'same-origin',cache:'no-store'});if(!res.ok)throw Error('profile');return res.json();}));
  if(generation!==profileGeneration||player()?.id!==p.id)return;
  if(rank.status==='fulfilled'){$('rxJumpBest').textContent=String(Number(rank.value.score??rank.value.bestScore)||0);}
  if(cosmetics.status==='fulfilled'){await window.EixoJumpExactArt.ready;if(generation!==profileGeneration)return;const outfit=cosmetics.value.outfit||{};drawCharacter(outfit);}
  if(cosmetics.status==='rejected'||rank.status==='rejected')$('rxProfileStatus').textContent=t('Alguns dados não estão disponíveis de momento.','Some profile data is temporarily unavailable.');
 }catch(_){if(generation===profileGeneration)$('rxProfileStatus').textContent=t('Não foi possível carregar a personagem.','Unable to load your character.');}
}
function drawCharacter(outfit){
 cancelAnimationFrame(characterFrame);character.hidden=false;$('rxCharacterFallback').hidden=true;
 const render=()=>{if(route!=='passport'){characterFrame=0;return;}const c=character.getContext('2d');c.clearRect(0,0,560,580);c.save();c.translate(280,480);c.scale(7,7);window.EixoJumpExactArt.runner(c,0,0,outfit,'',false,performance.now()/1000,{facing:1,ground:true,moving:false,preview:true,identity:'passport'});c.restore();characterFrame=requestAnimationFrame(render);};render();
}
async function action(type){
 if(['name','character','account','rooms','create-room'].includes(type)&&!player())return window.eixoOpenAuth?.('login');
 if(type==='name')return Number(player()?.vipLevel)>0?window.eixoOpenVipCustomize?.():window.eixoOpenPlayerCustomize?.();
 if(type==='account')return window.EixoAccountUI?.openSettings();
 if(type==='vip')return window.eixoOpenVip?.();
 if(type==='vip-store'){if(window.EixoVipStore?.open)return window.EixoVipStore.open();return window.eixoOpenVip?.();}
 if(type==='character')return window.eixoJump.openCharacter();
 if(type==='wall-close'){closeWall();return;}
 if(type==='wall'){await navigate('home');document.body.classList.add('rx-wall-open');wallHint.hidden=false;wallButton.setAttribute('aria-pressed','true');await window.eixoJump.suspend();return;}
 if(type==='rooms'){await navigate(roomGame);if(roomGame==='jump')return window.eixoJump.openRooms();return window.eixoOpenRooms?.();}
 if(type==='create-room'){await navigate(roomGame);$('createRoomButton').click();return;}
 if(type==='full-ranking'){document.querySelector('.action.blue').click();return;}
 if(type==='sound'){const controls=$('eixoAudioControls');if(controls)controls.hidden=!controls.hidden;return;}
 if(type==='fullscreen'){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(_){notify(t('O ecrã inteiro não está disponível neste navegador.','Fullscreen is not available in this browser.'));}return;}
}
document.addEventListener('click',e=>{
 const link=e.target.closest('[data-rx-route]');if(link&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&e.button===0){e.preventDefault();navigate(link.dataset.rxRoute);return;}
 const button=e.target.closest('[data-rx-action]');if(button){e.preventDefault();action(button.dataset.rxAction).catch(err=>notify(err.message||t('Não foi possível concluir esta ação.','Unable to complete this action.')));return;}
 const scope=e.target.closest('[data-rx-scope]');if(scope){rankScope=scope.dataset.rxScope;updateActive();return;}
 const rank=e.target.closest('[data-rx-board]');if(rank){rankGame=rank.dataset.rxBoard;navigate('rankings',{history:false});return;}
 const room=e.target.closest('[data-rx-roomgame]');if(room){roomGame=room.dataset.rxRoomgame;navigate('rooms',{history:false});}
});
// Capture the existing selector to keep one navigation owner and avoid two run starts.
switcher.addEventListener('click',e=>{const b=e.target.closest('[data-game]');if(!b||b.dataset.game==='eat')return;e.preventDefault();e.stopImmediatePropagation();navigate(b.dataset.game);},true);
top.querySelector('.brand').addEventListener('click',e=>{if(e.ctrlKey||e.metaKey)return;e.preventDefault();navigate('home');});
window.addEventListener('popstate',()=>navigate(readRoute(),{history:false}));
window.addEventListener('eixo-player-updated',refreshProfile);
window.addEventListener('eixo-outfit-updated',refreshProfile);
window.addEventListener('eixo-ui-error',e=>notify(e.detail));
new MutationObserver(()=>{if(lastLanguage===document.documentElement.lang)return;lastLanguage=document.documentElement.lang;labels();navigate(route,{history:false});}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
labels();
const initial=location.hash==='#game'?'pulse':location.hash==='#ranking'?'rankings':location.hash==='#rooms'?'rooms':readRoute();
navigate(initial,{history:location.hash.length>0});
window.EixoRedesign={navigate,current:()=>route};
})();
