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
let running = false, score = 0, x = 0, direction = 1, speed = 4.2, lastTime = 0, pulse = 0;
let rankingMode = 'country', rankingPage = 1, rankingPages = 1;
const rankingModal = document.getElementById('rankingModal');
const countrySelect = document.getElementById('countrySelect');
const countryButton = document.getElementById('countryButton');
const countryMenu = document.getElementById('countryMenu');

function getLang(){ return translations[languageByCountry[currentCountryCode] || 'en'] || translations.en; }
function applyLanguage(){
  const t=getLang();
  document.querySelectorAll('[data-i18n]').forEach(el=>{if(t[el.dataset.i18n])el.textContent=t[el.dataset.i18n];});
  document.documentElement.lang=languageByCountry[currentCountryCode]||'en';
  const c=country(currentCountryCode||'PT');
  const flagEl=document.getElementById('countryFlag'),nameEl=document.getElementById('countryName'),nationalFlag=document.getElementById('nationalFlag'),nationalTitle=document.getElementById('nationalTitle'),modalCountryTab=document.getElementById('modalCountryTab');
  if(flagEl)flagEl.textContent=c.flag;if(nameEl)nameEl.textContent=c.name;if(nationalFlag)nationalFlag.textContent=c.flag;if(nationalTitle)nationalTitle.textContent=`TOP ${c.name}`;if(modalCountryTab)modalCountryTab.textContent=`${c.flag} ${c.name}`;
  messageEl.textContent=t.instruction;
}
function fillCountryControls(){
  if(countrySelect)countrySelect.innerHTML=countryCodes.map(code=>{const c=country(code);return `<option value="${code}">${c.flag} ${c.name}</option>`}).join('');
  if(countryMenu){countryMenu.innerHTML=countryCodes.map(code=>{const c=country(code);return `<button class="country-option" type="button" data-country="${code}">${c.flag} ${c.name}</button>`}).join('');countryMenu.querySelectorAll('.country-option').forEach(btn=>btn.addEventListener('click',()=>changeCountry(btn.dataset.country)));}
}
function setCountry(code){if(!countryNames[code])return;currentCountryCode=code;localStorage.setItem('eixo_country',code);applyLanguage();loadTopRankings();}
countryButton?.addEventListener('click',()=>{if(!player)return;const open=countryMenu?.classList.toggle('open');countryButton.setAttribute('aria-expanded',String(!!open));});
document.addEventListener('click',e=>{if(!e.target.closest('.profile-area')){countryMenu?.classList.remove('open');countryButton?.setAttribute('aria-expanded','false');}});
function changeCountry(code){if(player&&player.country&&player.country!==code){countryMenu?.classList.remove('open');return;}setCountry(code);countryMenu?.classList.remove('open');countryButton?.setAttribute('aria-expanded','false');}
if(typeof window!=='undefined'){window.eixoGetPlayer=()=>player;window.eixoSetPlayer=p=>{player=p||null;window.dispatchEvent(new Event('eixo-player-updated'));};window.eixoGetCountry=()=>currentCountryCode;}

function dimensions(){const rect=canvas.getBoundingClientRect();return{w:rect.width,h:rect.height};}
function center(){const{w,h}=dimensions();return{x:w/2,y:h/2};}
function drawPixelCircle(cx,cy,radius,color,width=1,dashed=false){ctx.save();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dashed?[3,5]:[]);ctx.beginPath();ctx.arc(Math.round(cx),Math.round(cy),radius,0,Math.PI*2);ctx.stroke();ctx.restore();}
function draw(){
  const{w,h}=dimensions(),c=center();ctx.clearRect(0,0,w,h);ctx.fillStyle='#080d12';ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#69747e';ctx.fillRect(0,Math.round(c.y),w,1);
  const outer=Math.max(28,Math.min(38,h*.095)),inner=Math.max(8,Math.min(11,h*.027));
  drawPixelCircle(c.x,c.y,outer,'#7b858e',1,true);drawPixelCircle(c.x,c.y,inner,'#aeb6bd',1,false);
  const dotRadius=Math.max(6,Math.min(9,h*.021));ctx.fillStyle='#f5f7f8';ctx.fillRect(Math.round(x-dotRadius/2),Math.round(c.y-dotRadius/2),Math.ceil(dotRadius),Math.ceil(dotRadius));
  pulse+=.035;ctx.fillStyle=`rgba(255,255,255,${.13+Math.sin(pulse)*.04})`;ctx.fillRect(Math.round(x-2),Math.round(c.y-2),4,4);
}
function loop(time){if(!running)return;const dt=Math.min((time-lastTime)/16.67||1,2);lastTime=time;const{w}=dimensions(),margin=Math.max(24,w*.055);x+=direction*speed*dt;if(x>=w-margin){x=w-margin;direction=-1;}if(x<=margin){x=margin;direction=1;}draw();requestAnimationFrame(loop);}
function resetGame(){score=0;scoreEl.textContent='0';const{w}=dimensions();x=Math.max(24,w*.1);direction=1;speed=4.2;running=true;messageEl.textContent=getLang().instruction;lastTime=performance.now();requestAnimationFrame(loop);}
function stopGame(){running=false;messageEl.textContent=getLang().instruction;draw();}
function showFeedback(text,type){feedbackEl.textContent=text;feedbackEl.className=`game-feedback ${type}`;void feedbackEl.offsetWidth;feedbackEl.classList.add('show');}
function speedForScore(value){
  const progress=Math.min(Math.max(Number(value)||0,0),100)/100;
  const baseSpeed=4.2+(20-4.2)*progress;
  // Mobile screens have a much shorter travel distance, so use a gentler curve there.
  const mobile=window.matchMedia && window.matchMedia('(max-width: 820px)').matches;
  return mobile ? baseSpeed*0.55 : baseSpeed;
}
async function hit(){
  if(!player){if(window.eixoOpenAuth)window.eixoOpenAuth('login');return;}
  if(!running){resetGame();return;}
  const c=center(),distance=Math.abs(x-c.x),inner=Math.max(8,Math.min(11,dimensions().h*.027)),outer=Math.max(28,Math.min(38,dimensions().h*.095));
  if(distance<=inner+4){score+=2;speed=speedForScore(score);showFeedback('+2','good');if(window.EixoAudio)window.EixoAudio.perfect();}
  else if(distance<=outer){score+=1;speed=speedForScore(score);showFeedback('+1','ok');if(window.EixoAudio)window.EixoAudio.hit();}
  else{showFeedback('MISS','miss');if(window.EixoAudio)window.EixoAudio.miss();stopGame();await submitScore(score);return;}
  scoreEl.textContent=String(score);
}
async function submitScore(value){
  if(!player||value<=0)return;
  try{const res=await fetch('/api/scores',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:player.id,token:player.token,score:value})});const data=await res.json();if(res.ok&&data.player){player={...player,...data.player,token:player.token};localStorage.setItem('eixo_player',JSON.stringify(player));loadTopRankings();}}
  catch(e){console.warn('Score could not be submitted:',e.message);}
}

function renderTop(target,rows,empty='AINDA SEM JOGADORES'){target.innerHTML=rows.length?rows.slice(0,5).map((p,i)=>`<li><span class="rank-number">${i+1}</span><span>${escapeHtml(p.name)}</span><span class="rank-score">${Number(p.score)}</span></li>`).join(''):`<li class="empty-row">${empty}</li>`;}
function escapeHtml(value){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
async function fetchRankings(countryCode=null,page=1){const params=new URLSearchParams({page:String(page)});if(countryCode)params.set('country',countryCode);const res=await fetch(`/api/rankings?${params}`);if(!res.ok)throw new Error('Ranking indisponível');return res.json();}
async function loadTopRankings(){try{const[n,w]=await Promise.all([fetchRankings(currentCountryCode),fetchRankings()]);renderTop(document.getElementById('nationalRanking'),n.players);renderTop(document.getElementById('worldRanking'),w.players);}catch(e){console.warn(e.message);}}

async function openFullRanking(mode){rankingMode=mode;rankingPage=1;rankingModal.classList.remove('hidden');updateRankingTabs();await loadFullRanking();}
function updateRankingTabs(){document.getElementById('modalCountryTab').classList.toggle('active',rankingMode==='country');document.getElementById('modalWorldTab').classList.toggle('active',rankingMode==='world');}
async function loadFullRanking(){const code=rankingMode==='country'?currentCountryCode:null;const data=await fetchRankings(code,rankingPage);rankingPages=data.pages;const list=document.getElementById('fullRankingList');list.innerHTML=data.players.length?data.players.map((p,i)=>{const rank=(rankingPage-1)*25+i+1;const c=country(p.country);return `<li><span class="full-rank-number">${rank}</span><span class="full-player"><b>${escapeHtml(p.name)}</b><small>${c.flag} ${c.name}</small></span><span class="full-score">${Number(p.score)}</span></li>`}).join(''):`<li class="empty-full">AINDA NÃO EXISTEM JOGADORES</li>`;document.getElementById('pageInfo').textContent=`${rankingPage} / ${rankingPages}`;document.getElementById('prevPage').disabled=rankingPage<=1;document.getElementById('nextPage').disabled=rankingPage>=rankingPages;}

document.getElementById('nationalFullButton').addEventListener('click',()=>openFullRanking('country'));
document.getElementById('worldFullButton').addEventListener('click',()=>openFullRanking('world'));
document.getElementById('modalCountryTab').addEventListener('click',()=>{rankingMode='country';rankingPage=1;updateRankingTabs();loadFullRanking();});
document.getElementById('modalWorldTab').addEventListener('click',()=>{rankingMode='world';rankingPage=1;updateRankingTabs();loadFullRanking();});
document.getElementById('prevPage').addEventListener('click',()=>{if(rankingPage>1){rankingPage--;loadFullRanking();}});
document.getElementById('nextPage').addEventListener('click',()=>{if(rankingPage<rankingPages){rankingPage++;loadFullRanking();}});
document.getElementById('rankingClose').addEventListener('click',()=>closeModal(rankingModal));
rankingModal.addEventListener('click',e=>{if(e.target===rankingModal)closeModal(rankingModal);});
playButton.addEventListener('click',resetGame);canvas.addEventListener('pointerdown',hit);
window.addEventListener('keydown',e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();hit();}});
countryButton.addEventListener('click',()=>{if(player)return;const open=countryMenu.classList.toggle('open');countryButton.setAttribute('aria-expanded',String(open));});
document.addEventListener('click',e=>{if(!e.target.closest('.profile-area')){countryMenu.classList.remove('open');countryButton.setAttribute('aria-expanded','false');}});

function resizeCanvas(){const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.max(1,Math.floor(rect.width*dpr));canvas.height=Math.max(1,Math.floor(rect.height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;draw();}
function buildPixelWall(){
  const wall=document.getElementById('pixelWall');
  if(!wall)return;
  const colors=['#e83e45','#f1c438','#2f9bd1','#39b86a','#7d4ac7','#ef7b2d','#e7e7df','#172b3b'];
  const count=Math.min(2500,Math.floor(innerWidth*innerHeight/400));
  const particles=[];
  let mouseX=-9999,mouseY=-9999;

  for(let i=0;i<count;i++){
    const tile=document.createElement('i');
    const x=Math.random()*innerWidth,y=Math.random()*innerHeight;
    const size=4+Math.floor(Math.random()*8);
    tile.style.left='0';
    tile.style.top='0';
    tile.style.background=colors[Math.floor(Math.random()*colors.length)];
    tile.style.width=size+'px';
    tile.style.height=size+'px';
    tile.style.opacity=String(.35+Math.random()*.55);
    wall.appendChild(tile);
    particles.push({el:tile,x,y,ox:x,oy:y,vx:0,vy:0,pixelHit:false});
  }

  window.addEventListener('pointermove',e=>{
    if(e.pointerType&&e.pointerType!=='mouse')return;
    mouseX=e.clientX;mouseY=e.clientY;
  },{passive:true});
  window.addEventListener('pointerleave',()=>{mouseX=-9999;mouseY=-9999},{passive:true});
  window.addEventListener('blur',()=>{mouseX=-9999;mouseY=-9999},{passive:true});

  function animate(){
    for(const p of particles){
      const dx=p.x-mouseX,dy=p.y-mouseY;
      const dist=Math.hypot(dx,dy);
      const radius=80;
      if(dist<radius){
        if(dist<10&&!p.pixelHit){
          p.pixelHit=true;
          if(window.EixoAudio)window.EixoAudio.pixel();
        }
        const d=Math.max(dist,1);
        const force=Math.pow(1-d/radius,2)*0.95;
        p.vx+=(dx/d)*force;
        p.vy+=(dy/d)*force;
      }

      if(dist>18)p.pixelHit=false;

      // Permanent displacement: the pointer pushes nearby pixels out of the way,
      // and they keep their new position instead of snapping back.
      p.vx*=0.91;
      p.vy*=0.91;
      p.x+=p.vx;
      p.y+=p.vy;

      // Keep pixels on the page so they can be pushed around indefinitely.
      const size=parseFloat(p.el.style.width)||6;
      if(p.x<-size)p.x=innerWidth;
      else if(p.x>innerWidth)p.x=-size;
      if(p.y<-size)p.y=innerHeight;
      else if(p.y>innerHeight)p.y=-size;

      p.el.style.transform='translate3d('+Math.round(p.x)+'px,'+Math.round(p.y)+'px,0)';
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}

fillCountryControls();
if(currentCountryCode&&!countryNames[currentCountryCode])currentCountryCode='PT';
window.eixoCountryNames=countryNames;
window.eixoCountryCodes=countryCodes;

async function bootPlayer(){
  try{
    const res=await fetch('/api/auth/me',{cache:'no-store'});
    if(res.ok){
      const data=await res.json();
      if(data?.player){player=data.player;localStorage.setItem('eixo_player',JSON.stringify({...data.player,token:'session'}));}
    }else{
      player=null;localStorage.removeItem('eixo_player');localStorage.removeItem('eixo_country');
    }
  }catch(_){}
  if(player){currentCountryCode=String(player.country||currentCountryCode||'PT').toUpperCase();localStorage.setItem('eixo_country',currentCountryCode);applyLanguage();loadTopRankings();}
  else{applyLanguage();if(window.eixoOpenAuth)window.eixoOpenAuth('login');else window.addEventListener('eixo-auth-ready',()=>window.eixoOpenAuth?.('login'),{once:true});}
}


resizeCanvas();stopGame();buildPixelWall();
bootPlayer();

