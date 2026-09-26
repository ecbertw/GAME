const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const feedbackEl = document.getElementById('feedback');
const messageEl = document.getElementById('gameMessage');
const playButton = document.getElementById('playButton');

ctx.imageSmoothingEnabled = false;

// 195 sovereign states + Kosovo for practical country selection.
const countryNames = {
AF:'AFEGANISTÃO',AL:'ALBÂNIA',DZ:'ARGÉLIA',AD:'ANDORRA',AO:'ANGOLA',AG:'ANTÍGUA E BARBUDA',AR:'ARGENTINA',AM:'ARMÉNIA',AU:'AUSTRÁLIA',AT:'ÁUSTRIA',AZ:'AZERBAIJÃO',BS:'BAHAMAS',BH:'BARÉM',BD:'BANGLADECHE',BB:'BARBADOS',BY:'BIELORRÚSSIA',BE:'BÉLGICA',BZ:'BELIZE',BJ:'BENIM',BT:'BUTÃO',BO:'BOLÍVIA',BA:'BÓSNIA E HERZEGOVINA',BW:'BOTSUANA',BR:'BRASIL',BN:'BRUNEI',BG:'BULGÁRIA',BF:'BURQUINA FASO',BI:'BURUNDI',CV:'CABO VERDE',KH:'CAMBOJA',CM:'CAMARÕES',CA:'CANADÁ',CF:'REPÚBLICA CENTRO-AFRICANA',TD:'CHADE',CL:'CHILE',CN:'CHINA',CO:'COLÔMBIA',KM:'COMORES',CG:'CONGO',CD:'REPÚBLICA DEMOCRÁTICA DO CONGO',CR:'COSTA RICA',CI:'COSTA DO MARFIM',HR:'CROÁCIA',CU:'CUBA',CY:'CHIPRE',CZ:'CHÉQUIA',DK:'DINAMARCA',DJ:'DJIBOUTI',DM:'DOMINICA',DO:'REPÚBLICA DOMINICANA',EC:'EQUADOR',EG:'EGITO',SV:'EL SALVADOR',GQ:'GUI. EQUATORIAL',ER:'ERITREIA',EE:'ESTÓNIA',SZ:'ESSUATÍNI',ET:'ETIÓPIA',FJ:'FIJI',FI:'FINLÂNDIA',FR:'FRANÇA',GA:'GABÃO',GM:'GÂMBIA',GE:'GEÓRGIA',DE:'ALEMANHA',GH:'GANA',GR:'GRÉCIA',GD:'GRANADA',GT:'GUATEMALA',GN:'GUIRINÉ',GW:'GUINÉ-BISSAU',GY:'GUIANA',HT:'HAITI',HN:'HONDURAS',HU:'HUNGRIA',IS:'ISLÂNDIA',IN:'ÍNDIA',ID:'INDONÉSIA',IR:'IRÃO',IQ:'IRAQUE',IE:'IRLANDA',IL:'ISRAEL',IT:'ITÁLIA',JM:'JAMAICA',JP:'JAPÃO',JO:'JORDÂNIA',KZ:'CAZAQUISTÃO',KE:'QUÉNIA',KI:'KIRIBATI',KP:'COREIA DO NORTE',KR:'COREIA DO SUL',KW:'KUWAIT',KG:'QUIRGUISTÃO',LA:'LAOS',LV:'LETÓNIA',LB:'LÍBANO',LS:'LESOTO',LR:'LIBÉRIA',LY:'LÍBIA',LI:'LIECHTENSTEIN',LT:'LITUÂNIA',LU:'LUXEMBURGO',MG:'MADAGÁSCAR',MW:'MALAWI',MY:'MALÁSIA',MV:'MALDIVAS',ML:'MALI',MT:'MALTA',MH:'ILHAS MARSHALL',MR:'MAURITÂNIA',MU:'MAURÍCIA',MX:'MÉXICO',FM:'MICRONÉSIA',MD:'MOLDÁVIA',MC:'MÓNACO',MN:'MONGÓLIA',ME:'MONTENEGRO',MA:'MARROCOS',MZ:'MOÇAMBIQUE',MM:'MIANMAR',NA:'NAMÍBIA',NR:'NAURU',NP:'NEPAL',NL:'PAÍSES BAIXOS',NZ:'NOVA ZELÂNDIA',NI:'NICARÁGUA',NE:'NÍGER',NG:'NIGÉRIA',MK:'MACEDÓNIA DO NORTE',NO:'NORUEGA',OM:'OMÃ',PK:'PAQUISTÃO',PW:'PALAU',PA:'PANAMÁ',PG:'PAPUA-NOVA GUINÉ',PY:'PARAGUAI',PE:'PERU',PH:'FILIPINAS',PL:'POLÓNIA',PT:'PORTUGAL',QA:'CATAR',RO:'ROMÉNIA',RU:'RÚSSIA',RW:'RUANDA',KN:'SÃO CRISTÓVÃO E NEVES',LC:'SANTA LÚCIA',VC:'SÃO VICENTE E GRANADINAS',WS:'SAMOA',SM:'SAN MARINO',ST:'SÃO TOMÉ E PRÍNCIPE',SA:'ARÁBIA SAUDITA',SN:'SENEGAL',RS:'SÉRVIA',SC:'SEICHELES',SL:'SERRA LEOA',SG:'SINGAPURA',SK:'ESLOVÁQUIA',SI:'ESLOVÉNIA',SB:'ILHAS SALOMÃO',SO:'SOMÁLIA',ZA:'ÁFRICA DO SUL',SS:'SUDÃO DO SUL',ES:'ESPANHA',LK:'SRI LANKA',SD:'SUDÃO',SR:'SURINAME',SE:'SUÉCIA',CH:'SUÍÇA',SY:'SÍRIA',TJ:'TAJIQUISTÃO',TZ:'TANZÂNIA',TH:'TAILÂNDIA',TL:'TIMOR-LESTE',TG:'TOGO',TO:'TONGA',TT:'TRINDADE E TOBAGO',TN:'TUNÍSIA',TR:'TURQUIA',TM:'TURQUEMENISTÃO',TV:'TUVALU',UG:'UGANDA',UA:'UCRÂNIA',AE:'EMIRADOS ÁRABES UNIDOS',GB:'REINO UNIDO',US:'ESTADOS UNIDOS',UY:'URUGUAI',UZ:'UZBEQUISTÃO',VU:'VANUATU',VA:'VATICANO',VE:'VENEZUELA',VN:'VIETNAME',YE:'IÉMEN',ZM:'ZÂMBIA',ZW:'ZIMBABUÉ',PS:'PALESTINA',XK:'KOSOVO'
};
const countryCodes = Object.keys(countryNames).sort((a,b) => countryNames[a].localeCompare(countryNames[b], 'pt'));
const country = code => ({ code, name: countryNames[code], flag: [...code].map(c => String.fromCodePoint(127397 + c.charCodeAt())).join('') });
const languageByCountry = { PT:'pt', BR:'pt', ES:'es', FR:'fr', DE:'de', IT:'it', GB:'en', US:'en', CA:'en', AU:'en', IE:'en', NZ:'en', AT:'de', CH:'de', BE:'fr', LU:'fr', MX:'es', AR:'es', CL:'es', CO:'es', PE:'es', UY:'es' };

const translations = {
  pt:{play:'JOGAR',ranking:'RANKING',rooms:'SALAS',about:'SOBRE',myRooms:'AS MINHAS SALAS',instruction:'',worldTop:'TOP MUNDIAL',fullRanking:'VER RANKING COMPLETO',aboutText:' — um jogo simples de reflexos. Acerta no centro, soma pontos e sobe no ranking.',welcome:'BEM-VINDO AO EIXO',countryIntro:'Primeiro escolhe o país onde jogas.',country:'PAÍS',continue:'CONTINUAR',nameTitle:'ESCOLHE O TEU NOME',nameText:'Este nome ficará associado à tua conta e não poderá ser usado por outra pessoa.',nameLabel:'NOME DO JOGADOR',create:'CRIAR JOGADOR',nameInvalid:'Nome inválido. Usa 3–8 letras ou números, sem espaços ou símbolos.',nameTaken:'Esse nome já está a ser utilizado.'},
  en:{play:'PLAY',ranking:'RANKING',rooms:'ROOMS',about:'ABOUT',myRooms:'MY ROOMS',instruction:'CLICK WHEN THE DOT IS IN THE CENTER',worldTop:'WORLD TOP',fullRanking:'VIEW FULL RANKING',aboutText:' — a simple reflex game. Hit the center, score points and climb the ranking.',welcome:'WELCOME TO EIXO',countryIntro:'First choose your country.',country:'COUNTRY',continue:'CONTINUE',nameTitle:'CHOOSE YOUR NAME',nameText:'This name will be linked to your player and cannot be used by anyone else.',nameLabel:'PLAYER NAME',create:'CREATE PLAYER',nameInvalid:'Invalid name. Use 3–8 letters or numbers, with no spaces or symbols.',nameTaken:'That name is already in use.'},
  es:{play:'JUGAR',ranking:'RANKING',rooms:'SALAS',about:'SOBRE',myRooms:'MIS SALAS',instruction:'PULSA CUANDO EL PUNTO ESTÉ EN EL CENTRO',worldTop:'TOP MUNDIAL',fullRanking:'VER RANKING COMPLETO',aboutText:' — un juego simple de reflejos. Acerta en el centro y sube en el ranking.',welcome:'BIENVENIDO A EIXO',countryIntro:'Primero elige tu país.',country:'PAÍS',continue:'CONTINUAR',nameTitle:'ELIGE TU NOMBRE',nameText:'Este nombre quedará asociado a tu jugador y no podrá usarlo otra persona.',nameLabel:'NOMBRE DEL JUGADOR',create:'CREAR JUGADOR',nameInvalid:'Nombre inválido. Usa 3–8 letras o números, sin espacios ni símbolos.',nameTaken:'Ese nombre ya está en uso.'},
  fr:{play:'JOUER',ranking:'CLASSEMENT',rooms:'SALLES',about:'À PROPOS',myRooms:'MES SALLES',instruction:'CLIQUE QUAND LE POINT EST AU CENTRE',worldTop:'TOP MONDIAL',fullRanking:'VOIR LE CLASSEMENT',aboutText:' — un jeu simple de réflexes. Vise le centre et grimpe au classement.',welcome:'BIENVENUE SUR EIXO',countryIntro:'Choisis d’abord ton pays.',country:'PAYS',continue:'CONTINUER',nameTitle:'CHOISIS TON NOM',nameText:'Ce nom sera associé à ton joueur et ne pourra pas être utilisé par quelqu’un d’autre.',nameLabel:'NOM DU JOUEUR',create:'CRÉER LE JOUEUR',nameInvalid:'Nom invalide. Utilise 3–8 lettres ou chiffres, sans espaces ou symboles.',nameTaken:'Ce nom est déjà utilisé.'},
  de:{play:'SPIELEN',ranking:'RANKING',rooms:'RÄUME',about:'ÜBER',myRooms:'MEINE RÄUME',instruction:'KLICKE, WENN DER PUNKT IN DER MITTE IST',worldTop:'WELTWEIT',fullRanking:'VOLLSTÄNDIGES RANKING',aboutText:' — ein einfaches Reflexspiel. Triff die Mitte und steige im Ranking.',welcome:'WILLKOMMEN BEI EIXO',countryIntro:'Wähle zuerst dein Land.',country:'LAND',continue:'WEITER',nameTitle:'WÄHLE DEINEN NAMEN',nameText:'Dieser Name wird deinem Spieler zugeordnet und kann nicht von jemand anderem verwendet werden.',nameLabel:'SPIELERNAME',create:'SPIELER ERSTELLEN',nameInvalid:'Ungültiger Name. Verwende 3–8 Buchstaben oder Zahlen, ohne Leerzeichen oder Symbole.',nameTaken:'Dieser Name wird bereits verwendet.'},
  it:{play:'GIOCA',ranking:'CLASSIFICA',rooms:'STANZE',about:'INFO',myRooms:'LE MIE STANZE',instruction:'CLICCA QUANDO IL PUNTO È AL CENTRO',worldTop:'TOP MONDIALE',fullRanking:'CLASSIFICA COMPLETA',aboutText:' — un semplice gioco di riflessi. Colpisci il centro e scala la classifica.',welcome:'BENVENUTO SU EIXO',countryIntro:'Scegli prima il tuo paese.',country:'PAESE',continue:'CONTINUA',nameTitle:'SCEGLI IL TUO NOME',nameText:'Questo nome sarà associato al tuo giocatore e non potrà essere usato da altri.',nameLabel:'NOME DEL GIOCATORE',create:'CREA GIOCATORE',nameInvalid:'Nome non valido. Usa 3–8 lettere o numeri, senza spazi o simboli.',nameTaken:'Questo nome è già utilizzato.'}
};

let currentCountryCode = localStorage.getItem('eixo_country') || 'PT';
let player = JSON.parse(localStorage.getItem('eixo_player') || 'null');
const Orbit=window.EixoPulseOrbit;
let running=false,score=0,orbitState=Orbit.createState(19),orbitRenderer=null,orbitFrame=null,orbitActive=false,orbitStatus='idle',orbitLoading=false,orbitGeneration=0;
let roundStartedAt=0,hitTelemetry=[],roundRunId=null,roundRoomId=null,orbitFeedback='',orbitFeedbackAt=0,orbitBest=0;
const orbitMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
let rankingMode = 'country', rankingPage = 1, rankingPages = 1;
const rankingModal = document.getElementById('rankingModal');
const countrySelect = document.getElementById('countrySelect');
const countryButton = document.getElementById('countryButton');
const countryMenu = document.getElementById('countryMenu');

function getLang(){ return !player ? translations.en : (translations[languageByCountry[currentCountryCode] || 'en'] || translations.en); }
function applyLanguage(){
  const t=getLang();
  document.querySelectorAll('[data-i18n]').forEach(el=>{if(t[el.dataset.i18n])el.textContent=t[el.dataset.i18n];});
  document.documentElement.lang=!player?'en':(languageByCountry[currentCountryCode]||'en');
  const c=country(currentCountryCode||'PT');
  const flagEl=document.getElementById('countryFlag'),nameEl=document.getElementById('countryName'),nationalFlag=document.getElementById('nationalFlag'),nationalTitle=document.getElementById('nationalTitle'),modalCountryTab=document.getElementById('modalCountryTab');
  if(flagEl)flagEl.textContent=c.flag;if(nameEl)nameEl.textContent=c.name;if(nationalFlag)nationalFlag.textContent=c.flag;if(nationalTitle)nationalTitle.textContent=`TOP ${c.name}`;if(modalCountryTab)modalCountryTab.textContent=`${c.flag} ${c.name}`;
  if(!orbitLoading)messageEl.textContent='';
}
function fillCountryControls(){
  if(countrySelect)countrySelect.innerHTML=countryCodes.map(code=>{const c=country(code);return `<option value="${code}">${c.flag} ${c.name}</option>`}).join('');
  if(countryMenu){countryMenu.innerHTML=countryCodes.map(code=>{const c=country(code);return `<button class="country-option" type="button" data-country="${code}">${c.flag} ${c.name}</button>`}).join('');countryMenu.querySelectorAll('.country-option').forEach(btn=>btn.addEventListener('click',()=>changeCountry(btn.dataset.country)));}
}
function setCountry(code){if(!countryNames[code])return;currentCountryCode=code;localStorage.setItem('eixo_country',code);if(player?.id)localStorage.setItem('eixo_ui_country_'+player.id,code);applyLanguage();loadTopRankings();}
countryButton?.addEventListener('click',()=>{if(!player)return;const open=countryMenu?.classList.toggle('open');countryButton.setAttribute('aria-expanded',String(!!open));});
document.addEventListener('click',e=>{if(!e.target.closest('.profile-area')){countryMenu?.classList.remove('open');countryButton?.setAttribute('aria-expanded','false');}});
function changeCountry(code){setCountry(code);countryMenu?.classList.remove('open');countryButton?.setAttribute('aria-expanded','false');}
if(typeof window!=='undefined'){window.eixoGetPlayer=()=>player;window.eixoSetPlayer=p=>{player=p||null;window.dispatchEvent(new Event('eixo-player-updated'));};window.eixoGetCountry=()=>currentCountryCode;}

function pulseVisible(){return orbitActive&&!document.hidden&&!window.eixoJumpActive&&window.eixoRoute==='pulse';}
function orbitTime(){return running||orbitState.ended?Math.max(0,performance.now()-roundStartedAt):performance.now();}
function draw(){
  if(!orbitRenderer)orbitRenderer=Orbit.createRenderer(canvas);
  orbitRenderer.draw(orbitState,orbitTime(),{status:orbitStatus,reducedMotion:!!orbitMotion?.matches,feedback:orbitFeedback,feedbackAt:orbitFeedbackAt,best:orbitBest,pt:document.documentElement.lang.startsWith('pt')});
}
function loop(){orbitFrame=null;if(!pulseVisible())return;draw();if(running||!orbitMotion?.matches)orbitFrame=requestAnimationFrame(loop);}
function scheduleOrbit(){if(!orbitFrame&&pulseVisible())orbitFrame=requestAnimationFrame(loop);}
function resetGame(){
  stopGame();orbitActive=true;orbitState=Orbit.createState(19);orbitStatus='idle';score=0;scoreEl.textContent='0';orbitFeedback='';messageEl.textContent='';
  canvas.setAttribute('aria-label',document.documentElement.lang.startsWith('pt')?'PULSE Órbita. Espaço, Enter ou toque para acertar na zona dourada.':'PULSE Orbit. Space, Enter or tap to hit the golden zone.');
  canvas.setAttribute('tabindex','0');resizeCanvas();scheduleOrbit();
}
function completedRun(){return {runId:roundRunId,score,telemetry:hitTelemetry.slice(),roomId:roundRoomId,playerId:player?.id};}
function stopGame(){
  const completed=running&&score>0?completedRun():null;running=false;orbitActive=false;orbitLoading=false;orbitGeneration++;
  if(orbitFrame)cancelAnimationFrame(orbitFrame);orbitFrame=null;
  if(completed)void submitScore(completed);
}
async function beginOrbit(){
  if(orbitLoading||!pulseVisible())return;
  if(!player?.id){window.eixoOpenAuth?.('login');return;}
  const generation=++orbitGeneration;orbitLoading=true;orbitStatus='loading';messageEl.textContent='';draw();
  try{
    const res=await fetch('/api/pulse/orbit/start',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:player.id,token:player.token})}),data=await res.json();
    if(generation!==orbitGeneration||!pulseVisible())return;
    if(!res.ok)throw Error(data.error||'PULSE unavailable.');
    if(!data.runId||data.mode!==Orbit.MODE||!Number.isInteger(data.seed))throw Error('PULSE unavailable.');
    roundRunId=data.runId;roundRoomId=window.eixoActiveRoomId||null;orbitBest=Number(data.bestScore)||0;orbitState=Orbit.createState(data.seed);
    score=0;scoreEl.textContent='0';orbitFeedback='';hitTelemetry=[];roundStartedAt=performance.now();running=true;orbitStatus='playing';
  }catch(e){if(generation===orbitGeneration){orbitStatus='idle';messageEl.textContent=e.message;}}
  finally{if(generation===orbitGeneration){orbitLoading=false;draw();scheduleOrbit();}}
}
function hit(){
  if(!pulseVisible()||orbitLoading)return;
  if(!running){void beginOrbit();return;}
  const result=Orbit.hit(orbitState,Math.round(performance.now()-roundStartedAt));if(result.ignored)return;
  hitTelemetry.push({t:result.t,points:result.points});score=orbitState.score;scoreEl.textContent=String(score);
  const pt=document.documentElement.lang.startsWith('pt');orbitFeedback=result.points===2?(pt?'PERFEITO +2':'PERFECT +2'):result.points===1?'+1':pt?'FIM DA ÓRBITA':'ORBIT ENDED';orbitFeedbackAt=result.t;
  feedbackEl.textContent=orbitFeedback;
  if(result.points===2)window.EixoAudio?.perfect();else if(result.points)window.EixoAudio?.hit();else window.EixoAudio?.miss();
  if(!result.points||hitTelemetry.length>=Orbit.MAX_EVENTS){running=false;orbitState.ended=true;orbitStatus='ended';void submitScore(completedRun());}
  draw();scheduleOrbit();
}
async function submitScore(completed){
  if(!completed.runId||!completed.telemetry.length||completed.playerId!==player?.id)return;
  try{
    const res=await fetch('/api/pulse/orbit/scores',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:player.id,token:player.token,score:completed.score,telemetry:completed.telemetry,runId:completed.runId,roomId:completed.roomId})}),data=await res.json();
    if(res.status===423&&data.ban){window.__eixoPendingBan=data.ban;window.dispatchEvent(new CustomEvent('eixo-ban',{detail:data.ban}));return;}
    if(!res.ok)throw Error(data.error||'Score could not be saved.');
    if(data.scoreAccepted&&completed.playerId===player?.id){orbitBest=Math.max(orbitBest,Number(data.bestScore)||0);player={...player,pulseOrbitBest:orbitBest};localStorage.setItem('eixo_player',JSON.stringify(player));loadTopRankings();window.dispatchEvent(new Event('eixo-player-updated'));if(data.roomScoreAccepted&&data.roomId)window.dispatchEvent(new CustomEvent('eixo-room-score-updated',{detail:{roomId:data.roomId,score:data.roomScore}}));}
  }catch(e){if(pulseVisible())messageEl.textContent=e.message;}
}

function renderTop(target,rows,empty='NO PLAYERS YET'){target.innerHTML=rows.length?rows.slice(0,10).map((p,i)=>`<li><span class="rank-number">${i+1}</span><span>${escapeHtml(p.name)}</span><span class="rank-score">${Number(p.score)}</span></li>`).join(''):`<li class="empty-row">${empty}</li>`;}
function escapeHtml(value){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
async function fetchRankings(countryCode=null,page=1){const params=new URLSearchParams({page:String(page)});if(countryCode)params.set('country',countryCode);const res=await fetch(`/api/pulse/orbit/rankings?${params}`);if(!res.ok)throw new Error('Ranking unavailable');return res.json();}
async function loadTopRankings(){if(typeof window.eixoRefreshRankings==='function')return window.eixoRefreshRankings();try{const[n,w]=await Promise.all([fetchRankings(currentCountryCode),fetchRankings()]);renderTop(document.getElementById('nationalRanking'),n.players);renderTop(document.getElementById('worldRanking'),w.players);}catch(e){console.warn(e.message);}}

async function openFullRanking(mode){rankingMode=mode;rankingPage=1;rankingModal.classList.remove('hidden');updateRankingTabs();await loadFullRanking();}
function updateRankingTabs(){document.getElementById('modalCountryTab').classList.toggle('active',rankingMode==='country');document.getElementById('modalWorldTab').classList.toggle('active',rankingMode==='world');}
async function loadFullRanking(){const code=rankingMode==='country'?currentCountryCode:null;const data=await fetchRankings(code,rankingPage);rankingPages=data.pages;const list=document.getElementById('fullRankingList');list.innerHTML=data.players.length?data.players.map((p,i)=>{const rank=(rankingPage-1)*25+i+1;const c=country(p.country);return `<li><span class="full-rank-number">${rank}</span><span class="full-player"><b>${escapeHtml(p.name)}</b><small>${c.flag} ${c.name}</small></span><span class="full-score">${Number(p.score)}</span></li>`}).join(''):`<li class="empty-full">THERE ARE NO PLAYERS YET</li>`;document.getElementById('pageInfo').textContent=`${rankingPage} / ${rankingPages}`;document.getElementById('prevPage').disabled=rankingPage<=1;document.getElementById('nextPage').disabled=rankingPage>=rankingPages;}

document.getElementById('nationalFullButton').addEventListener('click',()=>openFullRanking('country'));
document.getElementById('worldFullButton').addEventListener('click',()=>openFullRanking('world'));
document.getElementById('modalCountryTab').addEventListener('click',()=>{rankingMode='country';rankingPage=1;updateRankingTabs();loadFullRanking();});
document.getElementById('modalWorldTab').addEventListener('click',()=>{rankingMode='world';rankingPage=1;updateRankingTabs();loadFullRanking();});
document.getElementById('prevPage').addEventListener('click',()=>{if(rankingPage>1){rankingPage--;loadFullRanking();}});
document.getElementById('nextPage').addEventListener('click',()=>{if(rankingPage<rankingPages){rankingPage++;loadFullRanking();}});
document.getElementById('rankingClose').addEventListener('click',()=>closeModal(rankingModal));
rankingModal.addEventListener('click',e=>{if(e.target===rankingModal)closeModal(rankingModal);});
playButton.addEventListener('click',()=>{if(!window.eixoJumpActive)hit()});canvas.addEventListener('pointerdown',e=>{if(e.button&&e.button!==0)return;hit()});
window.addEventListener('keydown',e=>{if(window.eixoJumpActive||(window.eixoRoute&&window.eixoRoute!=='pulse')||e.target?.closest?.('input,select,textarea,button,a,[contenteditable]')||document.querySelector('.modal-backdrop:not(.hidden)'))return;if(['Space','Enter'].includes(e.code)){e.preventDefault();if(!e.repeat)hit();}});
countryButton.addEventListener('click',()=>{if(player)return;const open=countryMenu.classList.toggle('open');countryButton.setAttribute('aria-expanded',String(open));});
document.addEventListener('click',e=>{if(!e.target.closest('.profile-area')){countryMenu.classList.remove('open');countryButton.setAttribute('aria-expanded','false');}});

function resizeCanvas(){if(!orbitRenderer)orbitRenderer=Orbit.createRenderer(canvas);orbitRenderer.resize();draw();scheduleOrbit();}
window.addEventListener('resize',resizeCanvas,{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(running){const completed=completedRun();running=false;orbitState.ended=true;orbitStatus='ended';void submitScore(completed);}if(orbitFrame)cancelAnimationFrame(orbitFrame);orbitFrame=null;}else scheduleOrbit();});
orbitMotion?.addEventListener?.('change',()=>{if(orbitFrame)cancelAnimationFrame(orbitFrame);orbitFrame=null;draw();scheduleOrbit();});

function buildPixelWall(){
  const wall=document.getElementById('pixelWall');if(!wall)return;
  const colors=['#e83e45','#f1c438','#2f9bd1','#39b86a','#7d4ac7','#ef7b2d','#e7e7df','#172b3b'];
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const lowPower=reduced||Number(navigator.hardwareConcurrency||4)<=4||(navigator.deviceMemory&&Number(navigator.deviceMemory)<=4);
  document.documentElement.classList.toggle('eixo-low-power',!!lowPower);
  const area=innerWidth*innerHeight,count=Math.max(90,Math.min(lowPower?280:650,Math.floor(area/(lowPower?6500:3000))));
  const particles=[];let mouseX=-9999,mouseY=-9999,movingUntil=0,lastFrame=0;
  for(let i=0;i<count;i++){
    const tile=document.createElement('i'),x=Math.random()*innerWidth,y=Math.random()*innerHeight,size=4+Math.floor(Math.random()*8);
    tile.style.cssText='left:0;top:0;background:'+colors[Math.floor(Math.random()*colors.length)]+';width:'+size+'px;height:'+size+'px;opacity:'+(0.35+Math.random()*.55).toFixed(2)+';transform:translate3d('+Math.round(x)+'px,'+Math.round(y)+'px,0)';
    wall.appendChild(tile);particles.push({el:tile,x,y,vx:0,vy:0,pixelHit:false,size});
  }
  window.addEventListener('pointermove',e=>{if(e.pointerType&&e.pointerType!=='mouse')return;mouseX=e.clientX;mouseY=e.clientY;movingUntil=performance.now()+75},{passive:true});
  window.addEventListener('pointerleave',()=>{mouseX=-9999;mouseY=-9999},{passive:true});
  window.addEventListener('blur',()=>{mouseX=-9999;mouseY=-9999},{passive:true});
  function animate(now){
    if(lowPower&&now-lastFrame<30){requestAnimationFrame(animate);return}lastFrame=now;
    const pointerActive=now<movingUntil,under=pointerActive?document.elementFromPoint(mouseX,mouseY):null;
    const protectedUi=under?.closest('.site-shell,.chat-sidebar,.modal-backdrop,.acct-overlay,.admin-overlay'),canSound=pointerActive&&!protectedUi;
    let directHit=false,windStrength=0;const radius=120,r2=radius*radius;
    for(const p of particles){
      const dx=p.x-mouseX,dy=p.y-mouseY,dist2=dx*dx+dy*dy;let near=false;
      if(pointerActive&&dist2<r2){
        near=true;const dist=Math.sqrt(Math.max(dist2,1));
        if(canSound&&(p.vx*p.vx+p.vy*p.vy)>.0007)windStrength=Math.max(windStrength,1-dist/radius);
        if(dist<10&&!p.pixelHit){p.pixelHit=true;if(canSound)directHit=true}
        const force=(1-dist/radius);const f=force*force*.95;p.vx+=(dx/dist)*f;p.vy+=(dy/dist)*f;
      }else if(dist2>324)p.pixelHit=false;
      const moving=near||Math.abs(p.vx)+Math.abs(p.vy)>.018;
      if(!moving)continue;
      p.vx*=.91;p.vy*=.91;p.x+=p.vx;p.y+=p.vy;
      if(p.x<-p.size)p.x=innerWidth;else if(p.x>innerWidth)p.x=-p.size;if(p.y<-p.size)p.y=innerHeight;else if(p.y>innerHeight)p.y=-p.size;
      p.el.style.transform='translate3d('+Math.round(p.x)+'px,'+Math.round(p.y)+'px,0)';
    }
    if(directHit)window.EixoAudio?.pixel();else if(windStrength>.12)window.EixoAudio?.pixelWind(windStrength);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

fillCountryControls();
if(currentCountryCode&&!countryNames[currentCountryCode])currentCountryCode='PT';
window.eixoCountryNames=countryNames;
window.eixoCountryCodes=countryCodes;

async function bootPlayer(){
  const initialId=player?.id||null;
  try{
    const res=await fetch('/api/auth/me',{cache:'no-store',credentials:'same-origin'});
    if(player?.id&&player.id!==initialId)return; // A newer login/registration has completed.
    if(res.ok){
      const data=await res.json();
      if(player?.id&&player.id!==initialId)return;
      if(data?.player){player={...data.player,token:'session'};localStorage.setItem('eixo_player',JSON.stringify(player));}
    }else if(res.status===423){
      const data=await res.json().catch(()=>({}));
      window.__eixoPendingBan=data.ban||{permanent:false,until:null,reason:null};
      window.dispatchEvent(new CustomEvent('eixo-ban',{detail:window.__eixoPendingBan}));
      return;
    }else{
      player=null;currentCountryCode='PT';localStorage.removeItem('eixo_player');localStorage.removeItem('eixo_country');
    }
  }catch(_){}
  if(player){
    const preferred=localStorage.getItem('eixo_ui_country_'+player.id);
    currentCountryCode=String(preferred&&countryNames[preferred]?preferred:player.country||'PT').toUpperCase();
    localStorage.setItem('eixo_country',currentCountryCode);
    applyLanguage();loadTopRankings();
  }else{
    // Guests must still be able to browse/click the site. A stale or missing
    // session should never leave a full-screen auth overlay intercepting the UI.
    applyLanguage();
    const auth=document.getElementById('authModal');if(auth)auth.classList.add('hidden');
    document.documentElement.classList.remove('eixo-modal-open');document.body.classList.remove('eixo-modal-open');
  }
  window.dispatchEvent(new Event('eixo-player-updated'));
}


resizeCanvas();stopGame();buildPixelWall();
bootPlayer();

