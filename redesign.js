/* Routes and modern presentation over the existing account, chat, ranking and game modules. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),routes=['home','jump','pulse','passport','rankings','rooms','vip'];
const paths={home:'/',jump:'/jump',pulse:'/pulse',passport:'/passport',rankings:'/rankings',rooms:'/rooms',vip:'/vip'};
const pt=()=>document.documentElement.lang.startsWith('pt');
const t=(a,b)=>pt()?a:b;
const language=()=>String(document.documentElement.lang||'en').split('-')[0].toLowerCase();
const passportWords={pt:'Passaporte',en:'Passport',es:'Pasaporte',fr:'Passeport',de:'Reisepass',it:'Passaporto',ja:'パスポート',ko:'패스포트',zh:'护照',ru:'Паспорт',pl:'Paszport',nl:'Paspoort',tr:'Pasaport',ar:'جواز السفر',sv:'Pass',no:'Pass',da:'Pas',fi:'Passi',el:'Διαβατήριο',cs:'Pas',id:'Paspor',th:'พาสปอร์ต',vi:'Hộ chiếu',he:'דרכון'};
const passportWord=()=>passportWords[language()]||passportWords.en;
const flag=code=>{const c=String(code||'').toUpperCase();return /^[A-Z]{2}$/.test(c)?[...c].map(x=>String.fromCodePoint(127397+x.charCodeAt())).join(''):'🌐';};
const vipGlyph=n=>['','◆','✧','✦','♛','★','∞'][Math.min(Math.max(0,Number(n)||0),6)]||'';
const passportRankTag=(type,n)=>'<span class="rank-tag medal-rank '+type+'-'+n+'" title="'+(type==='country'?t('TOP NACIONAL','NATIONAL TOP'):'TOP GLOBAL')+' #'+n+'"><span class="rank-medal-icon" aria-hidden="true"><span class="rank-medal-number">'+n+'</span></span></span>';
const passportVipTag=n=>n>0?'<span class="vip-rank-tag vip-medal vip-rank-'+Math.min(n,6)+'" title="VIP '+(n>=6?'∞':n)+'"><span class="vip-medal-mark" aria-hidden="true">'+vipGlyph(n)+'</span></span>':'';
const passportAchievementGlyph=b=>({'first-100':'100','skybound':'↟','explorer':'✦','pulse-10':'◎','run-first-clear':'▶','run-astral-100':'◆','run-no-death':'◇','run-daily':'☼'}[b]||'');
const passportAchievementTag=b=>passportAchievementGlyph(b)?'<span class="achievement-tag achievement-'+String(b)+'" title="'+String(b)+'"><span aria-hidden="true">'+passportAchievementGlyph(b)+'</span></span>':'';
const formatRunTime=ms=>{ms=Number(ms);if(!Number.isFinite(ms)||ms<=0)return'—';ms=Math.round(ms);const m=Math.floor(ms/60000),s=Math.floor(ms/1000)%60,x=ms%1000;return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+'.'+String(x).padStart(3,'0')};
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
const character=make('canvas','');character.id='rxCharacter';character.width=1120;character.height=1160;character.setAttribute('aria-label',t('A tua personagem JUMP','Your JUMP character'));
const notice=make('div','rx-notice');notice.hidden=true;notice.setAttribute('role','status');document.body.append(notice);
let noticeTimer;
function notify(message){clearTimeout(noticeTimer);notice.textContent=String(message||'');notice.hidden=!message;noticeTimer=setTimeout(()=>notice.hidden=true,6000);}
if($('eixoAudioControls'))$('eixoAudioControls').hidden=true;
function labels(){
 character.setAttribute('aria-label',t('A tua personagem JUMP','Your JUMP character'));
 nav.setAttribute('aria-label',t('Navegação principal','Main navigation'));rankTabs.setAttribute('aria-label',t('Âmbito do ranking','Ranking scope'));
 nav.innerHTML=routes.filter(x=>!['jump','pulse'].includes(x)).map(x=>'<a href="'+paths[x]+'" data-rx-route="'+x+'">'+({home:t('Início','Home'),passport:passportWord(),rankings:'Rankings',rooms:t('Salas','Rooms'),vip:'VIP'})[x]+'</a>').join('')+'<a href="/run">RUN</a>';window.EixoAudio?.mountMenu?.(nav);
 gameMast.innerHTML='<div class="rx-game-mast-copy"><p class="rx-eyebrow">EIXO ARCADE / <span data-rx-game-name>JUMP</span></p><h1 data-rx-game-title>'+t('Salta. Supera. Repete.','Jump. Beat it. Repeat.')+'</h1><p data-rx-game-copy>'+t('Cada plataforma conta. Bate o teu recorde e sobe no ranking.','Every platform counts. Beat your best and climb the ranking.')+'</p></div><div class="rx-game-live"><i aria-hidden="true"></i><span>'+t('AO VIVO','LIVE')+'</span><strong data-rx-game-mode>JUMP</strong></div>';
 gameTools.innerHTML='<a class="rx-button" href="/" data-rx-route="home">← '+t('Início','Home')+'</a><a class="rx-button" href="/passport" data-rx-route="passport">'+passportWord()+'</a><button class="rx-button" type="button" data-rx-action="sound">'+t('Som','Sound')+'</button><button class="rx-button" type="button" data-rx-action="fullscreen">'+t('Ecrã inteiro','Fullscreen')+'</button>';
 rankTabs.innerHTML='<button type="button" data-rx-scope="world">'+t('Global','Global')+'</button><button type="button" data-rx-scope="country">'+t('Nacional','National')+'</button>';
 views.home.innerHTML='<div class="rx-hero rx-community-hero"><div class="rx-hero-copy"><p class="rx-eyebrow">'+t('JOGA. LIGA-TE. EVOLUI.','PLAY. CONNECT. EVOLVE.')+'</p><h1>'+t('Há sempre mais<br>para descobrir.','There is always more<br>to discover.')+'</h1><p>'+t('Jogos rápidos, progressão, rankings e uma comunidade que cresce contigo.','Quick games, progression, rankings and a community that grows with you.')+'</p><a class="rx-button primary" href="#eixoGames">'+t('Explorar jogos','Explore games')+' ↓</a></div><div class="rx-community-visual" aria-hidden="true"><span class="rx-community-orbit orbit-a"></span><span class="rx-community-orbit orbit-b"></span><span class="rx-community-node node-a"></span><span class="rx-community-node node-b"></span><span class="rx-community-node node-c"></span><div class="rx-community-core"><strong>E<span>•</span></strong><small>EIXO</small></div></div></div><div class="rx-three rx-section" id="eixoGames"><article class="rx-game-card"><h2>JUMP</h2><p>'+t('Supera o teu recorde. Encontra a comunidade.','Beat your best. Meet the community.')+'</p><a class="rx-button" href="/jump" data-rx-route="jump">'+t('Jogar','Play')+' ↗</a></article><article class="rx-game-card"><h2>PULSE</h2><p>'+t('O momento certo faz toda a diferença.','Timing makes all the difference.')+'</p><a class="rx-button" href="/pulse" data-rx-route="pulse">'+t('Jogar','Play')+' ↗</a></article><article class="rx-game-card"><h2>RUN</h2><p>'+t('Corre por ASTRAL, recolhe Shards e domina o First Light.','Run through ASTRAL, collect Shards and master First Light.')+'</p><a class="rx-button" href="/run">'+t('Jogar','Play')+' ↗</a></article></div><div class="rx-two rx-section"><article class="rx-panel"><p class="rx-eyebrow">EIXO '+passportWord().toUpperCase()+'</p><h2>'+t('A tua personagem. O teu percurso.','Your character. Your journey.')+'</h2><p class="rx-muted">'+t('Consulta o perfil e acede às tuas personalizações.','See your profile and access your customizations.')+'</p><a class="rx-button" href="/passport" data-rx-route="passport">'+t('Abrir ','Open ')+passportWord()+' ↗</a></article><article class="rx-panel"><p class="rx-eyebrow">'+t('COMUNIDADE','COMMUNITY')+'</p><h2>'+t('Quem chega mais longe?','Who goes furthest?')+'</h2><p class="rx-muted">'+t('Rankings próprios para cada jogo, globais e nacionais.','Global and national leaderboards for each game.')+'</p><a class="rx-button" href="/rankings" data-rx-route="rankings">'+t('Ver rankings','View rankings')+' ↗</a></article></div>';
 views.passport.innerHTML='<div class="rx-passport-intro"><div><p class="rx-eyebrow">EIXO / '+passportWord().toUpperCase()+'</p><h1>'+t('A tua identidade.<br>O teu universo.','Your identity.<br>Your universe.')+'</h1><p>'+t('Cada partida faz parte da tua história.','Every run becomes part of your story.')+'</p></div><span class="rx-intro-crest" aria-hidden="true">E<span>•</span></span></div>'+'<div class="rx-passport-document"><div class="rx-passport-document-top"><span class="rx-passport-brand"><img src="/eixo-logo.svg?v=20260927-v312" alt="EIXO"><b>'+passportWord().toUpperCase()+'</b></span><span class="rx-passport-document-code" id="rxPassportNumber">EIXO / MEMBER</span></div>'+'<div class="rx-passport-body"><div class="rx-passport-photo"><div class="rx-character" id="rxCharacterSlot"><div class="rx-character-loading" id="rxCharacterFallback" aria-hidden="true"><i></i><span>'+t('A preparar personagem','Preparing character')+'</span></div></div><div class="rx-photo-caption"><span class="rx-live-dot"></span><span>'+t('PERSONAGEM / AO VIVO','CHARACTER / LIVE')+'</span><span>JUMP</span></div></div>'+'<div class="rx-passport-identity"><div class="rx-identity-heading"><span class="rx-eyebrow">'+t('IDENTIFICAÇÃO DO JOGADOR','PLAYER IDENTIFICATION')+'</span><span class="rx-passport-check" aria-hidden="true">✳</span></div><div class="rx-passport-name-row"><h2 id="rxProfileName"></h2><span id="rxPassportTags" class="rx-passport-tags"></span></div><div class="rx-identity-sub"><span id="rxProfileCountry" class="rx-passport-flag">🌐</span></div>'+'<div class="rx-stat-row rx-passport-stats"><span><strong id="rxRunBest">—</strong>RUN / PB</span><span><strong id="rxJumpBest">—</strong>JUMP / '+t('RECORDE','BEST')+'</span><span><strong id="rxPulseBest">—</strong>PULSE / '+t('RECORDE','BEST')+'</span><span><strong id="rxVipLevel">—</strong>VIP / STATUS</span></div>'+'<div class="rx-passport-progress"><div class="rx-level-disc"><span>EIXO LEVEL</span><strong id="rxLevel">—</strong></div><div class="rx-progress-details"><div class="rx-progress-topline"><span>'+t('Próximo nível','Next level')+'</span><strong id="rxExpText">— EXP</strong></div><div class="rx-progress-track" aria-label="EXP"><i id="rxExpBar"></i></div><div class="rx-passport-xp-detail"><span>'+t('TOTAL EXP','TOTAL XP')+' · <b id="rxPassportTotalXp">—</b></span><span id="rxPassportRemaining">—</span></div></div></div>'+'<div class="rx-actions rx-passport-actions"><button type="button" class="rx-button" data-rx-action="name">'+t('Nome e efeitos','Name & effects')+'</button><button type="button" class="rx-button" data-rx-action="character">'+t('Editar personagem','Edit character')+'</button><button type="button" class="rx-button" data-rx-action="account">'+t('Conta','Account')+'</button></div><p class="rx-status" id="rxProfileStatus" role="status"></p></div></div>'+'<div class="rx-passport-visas"><div class="rx-passport-visas-head rx-row rx-section"><div><p class="rx-eyebrow">EIXO / VISAS</p><h2>'+t('Os teus carimbos.','Your stamps.')+'</h2></div><span class="rx-tag">'+t('CONQUISTAS','ACHIEVEMENTS')+' · <strong id="rxPassportBadgeCount">—</strong> / 08</span></div>'+ '<div class="rx-badge-grid"><article class="rx-achievement rx-locked" data-badge="explorer" data-badge="skybound" data-badge="first-100"><div class="rx-medallion gold" aria-hidden="true"><span class="rx-badge-symbol"><strong>100</strong></span></div><span class="rx-badge-series">01 / ORIGEM</span><h3>'+t('Primeiros 100','First 100')+'</h3><p>'+t('Uma marca de quem esteve no início.','A mark for those who were here first.')+'</p><small>'+t('Ainda não atribuída','Not awarded yet')+'</small></article><article class="rx-achievement rx-locked"><div class="rx-medallion blue" aria-hidden="true"><span class="rx-badge-symbol"><svg viewBox="0 0 64 64"><path d="M10 49h44M14 49l18-33 18 33M20 37h24M32 16v33"></path><path d="m26 24 6-8 6 8"></path></svg></span></div><span class="rx-badge-series">02 / JUMP</span><h3>'+t('Nas alturas','Sky high')+'</h3><p>'+t('Para celebrar marcos no JUMP.','Celebrate milestones in JUMP.')+'</p><small>'+t('Ainda não atribuída','Not awarded yet')+'</small></article><article class="rx-achievement rx-locked"><div class="rx-medallion violet" aria-hidden="true"><span class="rx-badge-symbol"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="23"></circle><path d="m40 24-7 16-9 4 7-16zM32 5v7M32 52v7M5 32h7M52 32h7"></path></svg></span></div><span class="rx-badge-series">03 / EIXO</span><h3>'+t('Explorador','Explorer')+'</h3><p>'+t('Há mais para descobrir no EIXO.','There is more to discover in EIXO.')+'</p><small>'+t('Ainda não atribuída','Not awarded yet')+'</small></article><article class="rx-achievement rx-locked" data-badge="pulse-10"><div class="rx-medallion teal" aria-hidden="true"><span class="rx-badge-symbol"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="21"/><circle cx="32" cy="32" r="11"/><path d="M32 3v9m0 40v9M3 32h9m40 0h9"/></svg></span></div><span class="rx-badge-series">04 / PULSE</span><h3>'+t('No centro','Bullseye')+'</h3><p>'+t('10 pontos no PULSE.','Score 10 in PULSE.')+'</p><small>'+t('Por conquistar','Locked')+'</small></article><article class="rx-achievement rx-locked" data-badge="run-first-clear"><div class="rx-medallion red" aria-hidden="true"><span class="rx-badge-symbol"><strong>▶</strong></span></div><span class="rx-badge-series">05 / RUN</span><h3>'+t('Primeira Luz','First Light')+'</h3><p>'+t('Conclui ASTRAL 01.','Clear ASTRAL 01.')+'</p><small>'+t('Por conquistar','Locked')+'</small></article><article class="rx-achievement rx-locked" data-badge="run-astral-100"><div class="rx-medallion blue" aria-hidden="true"><span class="rx-badge-symbol"><strong>◆</strong></span></div><span class="rx-badge-series">06 / RUN</span><h3>100% ASTRAL</h3><p>'+t('Recolhe os 42 Shards e encontra o segredo.','Collect all 42 Shards and find the secret.')+'</p><small>'+t('Por conquistar','Locked')+'</small></article><article class="rx-achievement rx-locked" data-badge="run-no-death"><div class="rx-medallion violet" aria-hidden="true"><span class="rx-badge-symbol"><strong>◇</strong></span></div><span class="rx-badge-series">07 / RUN</span><h3>'+t('Sem cair','No deaths')+'</h3><p>'+t('Termina o First Light sem morrer.','Finish First Light without dying.')+'</p><small>'+t('Por conquistar','Locked')+'</small></article><article class="rx-achievement rx-locked" data-badge="run-daily"><div class="rx-medallion teal" aria-hidden="true"><span class="rx-badge-symbol"><strong>☼</strong></span></div><span class="rx-badge-series">08 / DAILY</span><h3>DAILY RUN</h3><p>'+t('Conclui o desafio diário do RUN.','Complete the daily RUN challenge.')+'</p><small>'+t('Por conquistar','Locked')+'</small></article></div>'+'<p class="rx-note">'+t('A EXP e as conquistas refletem partidas validadas de JUMP e PULSE.','XP and achievements are earned through validated JUMP and PULSE runs.')+'</p></div><div class="rx-passport-foot"><span>EIXO · SMALL PIXELS / BIG IDEAS</span><span>'+t('A tua história continua.','Your journey continues.')+'</span><span>✳</span></div></div>';
 views.passport.querySelectorAll('.rx-achievement').forEach((e,i)=>e.dataset.badge=['first-100','skybound','explorer','pulse-10','run-first-clear','run-astral-100','run-no-death','run-daily'][i]);
 
 views.passport.querySelector('.rx-note').textContent=t('Ganha EXP em partidas validadas de RUN, JUMP e PULSE. Clica numa conquista desbloqueada para a destacares nos rankings e no chat. Só podes mostrar uma de cada vez.','Earn XP in validated RUN, JUMP and PULSE games. Click an unlocked achievement to feature it in rankings and chat. You can display one at a time.');
 $('rxCharacterSlot').prepend(character);
 views.rankings.innerHTML='<div class="rx-heading"><p class="rx-eyebrow">RANKINGS EIXO</p><h1>'+t('Até onde consegues ir?','How far can you go?')+'</h1></div><div class="rx-sheet-tabs"><button type="button" class="rx-button" data-rx-board="jump">JUMP</button><button type="button" class="rx-button" data-rx-board="pulse">PULSE</button><button type="button" class="rx-button" data-rx-action="full-ranking">'+t('Ranking completo','Full ranking')+'</button></div>';
 views.rankings.append(rankMount);
 views.rooms.innerHTML='<div class="rx-heading"><p class="rx-eyebrow">'+t('SALAS EIXO','EIXO ROOMS')+'</p><h1>'+t('Um lugar para os teus.','A place for your people.')+'</h1><p class="rx-muted">'+t('Escolhe o jogo para consultar ou criar uma sala privada.','Choose a game to view or create a private room.')+'</p></div><div class="rx-sheet-tabs"><button type="button" class="rx-button" data-rx-roomgame="jump">JUMP</button><button type="button" class="rx-button" data-rx-roomgame="pulse">PULSE</button></div><div class="rx-two"><article class="rx-panel"><h2>'+t('As tuas salas','Your rooms')+'</h2><p class="rx-muted">'+t('Consulta as salas ou entra com um código.','View your rooms or join with a code.')+'</p><button type="button" class="rx-button primary" data-rx-action="rooms">'+t('Abrir salas','Open rooms')+' ↗</button></article><article class="rx-panel"><h2>'+t('Cria o teu espaço','Create your space')+'</h2><p class="rx-muted">'+t('Convida os teus amigos e acompanha os resultados da sala.','Invite your friends and follow your room leaderboard.')+'</p><button type="button" class="rx-button" data-rx-action="create-room">'+t('Criar sala','Create room')+' ↗</button></article></div>';
 views.vip.innerHTML='<div class="rx-panel rx-vip-hero rx-two"><div><p class="rx-eyebrow">EIXO VIP</p><h1>'+t('O teu estilo.<br>Mais presente.','Your style.<br>More presence.')+'</h1><p class="rx-muted">'+t('Descobre as opções VIP e gere o teu acesso.','Explore VIP options and manage your access.')+'</p><div class="rx-actions"><button type="button" class="rx-button primary" data-rx-action="vip">'+t('Ver o meu VIP','View my VIP')+'</button><button type="button" class="rx-button" data-rx-action="vip-store">'+t('Planos e preços','Plans & pricing')+'</button></div></div><div class="rx-vip-showcase" aria-hidden="true"><div class="rx-vip-aura"></div><div class="rx-vip-pass rx-vip-pass-back"><span>EIXO / MEMBER</span><b>VIP 01</b><i>✦</i></div><div class="rx-vip-pass rx-vip-pass-middle"><span>EIXO / SELECT</span><b>VIP 03</b><i>✧</i></div><div class="rx-vip-pass rx-vip-pass-front"><span>EIXO / INFINITE ACCESS</span><div class="rx-vip-pass-focus"><em>E<span>•</span></em><strong>VIP ∞</strong></div><small>YOUR STYLE. YOUR SIGNATURE.</small></div></div></div><div class="rx-three rx-section"><article class="rx-panel"><h2>'+t('Nome e efeitos','Name & effects')+'</h2><p class="rx-muted">'+t('As cores e animações que já conheces.','The colors and animations you know.')+'</p><button type="button" class="rx-button" data-rx-action="name">'+t('Personalizar','Customize')+'</button></article><article class="rx-panel"><h2>'+t('A tua personagem','Your character')+'</h2><p class="rx-muted">'+t('O desenho original e as tuas combinações.','The original design and your combinations.')+'</p><button type="button" class="rx-button" data-rx-action="character">'+t('Abrir guarda-roupa','Open wardrobe')+'</button></article><article class="rx-panel"><h2>'+t('A tua conta','Your account')+'</h2><p class="rx-muted">'+t('Gere o perfil e as opções existentes.','Manage your profile and existing options.')+'</p><button type="button" class="rx-button" data-rx-action="account">'+t('Definições','Settings')+'</button></article></div>';
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
 const old=route;if(old===next&&['jump','pulse'].includes(next))return queue;if(old==='passport'&&next!=='passport'){cancelAnimationFrame(characterFrame);characterFrame=0;}route=next;updateActive();
 if(history&&location.pathname!==paths[next])window.history.pushState({},'',paths[next]);
 for(const [k,e] of Object.entries(views))if(k!=='pulse')e.hidden=k!==(next==='pulse'?'jump':next);
 if(old!==next)window.scrollTo({top:0,behavior:'instant'});
 if(next==='rankings'){rankMount.append(boards);boards.querySelectorAll('.board').forEach(e=>e.hidden=false);}else rankWrap.append(boards);
 document.title='EIXO — '+({home:t('Início','Home'),jump:'JUMP',pulse:'PULSE',passport:passportWord(),rankings:'Rankings',rooms:t('Salas','Rooms'),vip:'VIP'})[next];
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
 $('rxPassportNumber').textContent=p?.id?'EIXO / '+String(p.id).replace(/[^a-z0-9]/gi,'').slice(-8).toUpperCase():'EIXO / MEMBER';
 $('rxProfileCountry').textContent=p?flag(p.country):'🌐';
 $('rxProfileCountry').title=p?String(p.country||''):t('Sem país','No country');
 $('rxPassportTags').replaceChildren();
 $('rxVipLevel').textContent=p?(Number(p.vipLevel)>=6?'∞':String(Number(p.vipLevel)||0)):'—';
 $('rxPulseBest').textContent=p&&Number.isFinite(Number(p.bestScore))?String(Number(p.bestScore)):'—';$('rxJumpBest').textContent='—';$('rxRunBest').textContent='—';
 $('rxProfileStatus').textContent='';character.hidden=true;const characterFallback=$('rxCharacterFallback');characterFallback.hidden=false;characterFallback.classList.toggle('is-empty',!p);characterFallback.querySelector('span').textContent=p?t('A preparar personagem','Preparing character'):t('Inicia sessão para veres a tua personagem','Sign in to see your character');
 $('rxLevel').textContent='—';$('rxExpText').textContent='— EXP';$('rxExpBar').style.width='0%';$('rxPassportTotalXp').textContent='—';$('rxPassportRemaining').textContent='—';$('rxPassportBadgeCount').textContent='—';views.passport.querySelectorAll('[data-badge]').forEach(card=>{card.classList.add('rx-locked');card.querySelector('small').textContent=t('Por conquistar','Locked');});
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
  const [cosmetics,rank,progress,pulseRank,runProfile]=await Promise.allSettled(['/api/jump/cosmetics','/api/jump/player-rank','/api/passport','/api/pulse/orbit/player-rank','/api/run/profile'].map(async path=>{const res=await fetch(path+'?id='+encodeURIComponent(p.id),{credentials:'same-origin',cache:'no-store'});if(!res.ok)throw Error('profile');return res.json();}));
  if(generation!==profileGeneration||player()?.id!==p.id)return;
  let passportRanks='';if(rank.status==='fulfilled'){const rv=rank.value||{};$('rxJumpBest').textContent=String(Number(rv.score??rv.bestScore)||0);if(Number(rv.worldRank)>=1&&Number(rv.worldRank)<=3)passportRanks+=passportRankTag('world',Number(rv.worldRank));if(Number(rv.countryRank)>=1&&Number(rv.countryRank)<=3)passportRanks+=passportRankTag('country',Number(rv.countryRank));}
  if(pulseRank.status==='fulfilled')$('rxPulseBest').textContent=String(Number(pulseRank.value.bestScore)||0);
  if(runProfile.status==='fulfilled')$('rxRunBest').textContent=formatRunTime(runProfile.value.bestMs);
  if(cosmetics.status==='fulfilled'){await window.EixoJumpExactArt.ready;if(generation!==profileGeneration)return;const outfit=cosmetics.value.outfit||{};drawCharacter(outfit);}
  let featured=null;if(progress.status==='fulfilled'){const data=progress.value,total=Math.max(1,Number(data.nextLevelExp)||1),current=Math.max(0,Number(data.levelExp)||0);featured=data.featuredBadge||null;$('rxLevel').textContent=String(data.level);$('rxExpText').textContent=current+' / '+total+' EXP';$('rxExpBar').style.width=Math.min(100,current/total*100)+'%';$('rxPassportTotalXp').textContent=String(Math.max(0,Number(data.totalExp)||0));$('rxPassportRemaining').textContent=t('Faltam ','Remaining ')+Math.max(0,total-current)+' EXP';const earned=new Set((data.badges||[]).map(x=>x.badge));let count=0;views.passport.querySelectorAll('[data-badge]').forEach(card=>{const ok=earned.has(card.dataset.badge),selected=ok&&featured===card.dataset.badge;if(ok)count++;card.classList.toggle('rx-locked',!ok);card.classList.toggle('is-featured',selected);card.setAttribute('aria-pressed',String(selected));card.querySelector('small').textContent=selected?t('Em destaque','Featured'):ok?t('Clica para destacar','Click to feature'):t('Por conquistar','Locked');});$('rxPassportBadgeCount').textContent=String(count);} $('rxPassportTags').innerHTML=passportRanks+passportAchievementTag(featured)+passportVipTag(Number(p.vipLevel)||0);
  if(cosmetics.status==='rejected'||rank.status==='rejected'||progress.status==='rejected'||pulseRank.status==='rejected'||runProfile.status==='rejected')$('rxProfileStatus').textContent=t('Alguns dados não estão disponíveis de momento.','Some profile data is temporarily unavailable.');
 }catch(_){if(generation===profileGeneration)$('rxProfileStatus').textContent=t('Não foi possível carregar a personagem.','Unable to load your character.');}
}
function drawCharacter(outfit){
 cancelAnimationFrame(characterFrame);character.hidden=false;$('rxCharacterFallback').hidden=true;
 const render=()=>{if(route!=='passport'||character.hidden){characterFrame=0;return;}const now=performance.now()/1000,c=character.getContext('2d');c.setTransform(2,0,0,2,0,0);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.clearRect(0,0,560,580);c.save();c.translate(280+Math.sin(now*1.9)*3,490+Math.sin(now*7.2)*1.4);c.scale(5.2,5.2);window.EixoJumpExactArt.runner(c,0,0,outfit,'',false,now,{facing:1,ground:true,vy:0,moving:true,preview:true,identity:'passport-live'});c.restore();characterFrame=requestAnimationFrame(render);};render();
}
async function action(type){
 if(['name','character','account','rooms','create-room'].includes(type)&&!player())return window.eixoOpenAuth?.('login');
 if(type==='name')return Number(player()?.vipLevel)>0?window.eixoOpenVipCustomize?.():window.eixoOpenPlayerCustomize?.();
 if(type==='account')return window.EixoAccountUI?.openSettings();
 if(type==='vip')return window.eixoOpenVip?.();
 if(type==='vip-store'){if(window.EixoVipStore?.open)return window.EixoVipStore.open();return window.eixoOpenVip?.();}
 if(type==='character')return window.eixoJump.openCharacter();
 if(type==='rooms'){await navigate(roomGame);if(roomGame==='jump')return window.eixoJump.openRooms();return window.eixoOpenRooms?.();}
 if(type==='create-room'){await navigate(roomGame);$('createRoomButton').click();return;}
 if(type==='full-ranking'){document.querySelector('.action.blue').click();return;}
 if(type==='sound'){window.EixoAudio?.toggleMenu?.();return;}
 if(type==='fullscreen'){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch(_){notify(t('O ecrã inteiro não está disponível neste navegador.','Fullscreen is not available in this browser.'));}return;}
}
document.addEventListener('click',async e=>{
 const badge=e.target.closest('#rx-passport .rx-achievement[data-badge]');
 if(badge&&!badge.classList.contains('rx-locked')){
  e.preventDefault();const p=player();if(!p)return;
  const selected=badge.classList.contains('is-featured')?null:badge.dataset.badge;
  try{const res=await fetch('/api/passport/badge',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,badge:selected})});const data=await res.json();if(!res.ok)throw Error(data.error||'badge');notify(selected?t('Conquista destacada.','Achievement featured.'):t('Conquista removida do destaque.','Achievement unfeatured.'));await refreshProfile();window.eixoRefreshRankings?.();}catch(err){notify(err.message||t('Não foi possível atualizar a conquista.','Unable to update achievement.'));}return;
 }
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
requestAnimationFrame(()=>requestAnimationFrame(()=>{
 document.body.classList.remove('eixo-booting');
 document.body.classList.add('eixo-ready');
}));
})();
