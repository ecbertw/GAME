const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const feedbackEl = document.getElementById('feedback');
const messageEl = document.getElementById('gameMessage');
const playButton = document.getElementById('playButton');

ctx.imageSmoothingEnabled = false;

const countries = [
  { code: 'PT', flag: '🇵🇹', name: 'PORTUGAL', language: 'pt' },
  { code: 'ES', flag: '🇪🇸', name: 'ESPANHA', language: 'es' },
  { code: 'FR', flag: '🇫🇷', name: 'FRANÇA', language: 'fr' },
  { code: 'GB', flag: '🇬🇧', name: 'REINO UNIDO', language: 'en' },
  { code: 'BR', flag: '🇧🇷', name: 'BRASIL', language: 'pt' },
  { code: 'DE', flag: '🇩🇪', name: 'ALEMANHA', language: 'de' },
  { code: 'IT', flag: '🇮🇹', name: 'ITÁLIA', language: 'it' },
];

const translations = {
  pt: { play: 'JOGAR', ranking: 'RANKING', rooms: 'SALAS', about: 'SOBRE', myRooms: 'AS MINHAS SALAS', instruction: 'CLICA QUANDO O PONTO ESTIVER NO CENTRO', worldTop: 'TOP MUNDIAL', fullRanking: 'VER RANKING COMPLETO', aboutText: ' — um jogo simples de reflexos. Acerta no centro, soma pontos e sobe no ranking.' },
  es: { play: 'JUGAR', ranking: 'RANKING', rooms: 'SALAS', about: 'SOBRE', myRooms: 'MIS SALAS', instruction: 'PULSA CUANDO EL PUNTO ESTÉ EN EL CENTRO', worldTop: 'TOP MUNDIAL', fullRanking: 'VER RANKING COMPLETO', aboutText: ' — un juego simple de reflejos. Acerta en el centro, suma puntos y sube en el ranking.' },
  fr: { play: 'JOUER', ranking: 'CLASSEMENT', rooms: 'SALLES', about: 'À PROPOS', myRooms: 'MES SALLES', instruction: 'CLIQUE QUAND LE POINT EST AU CENTRE', worldTop: 'TOP MONDIAL', fullRanking: 'VOIR LE CLASSEMENT', aboutText: ' — un jeu de réflexes simple. Vise le centre, marque des points et grimpe au classement.' },
  en: { play: 'PLAY', ranking: 'RANKING', rooms: 'ROOMS', about: 'ABOUT', myRooms: 'MY ROOMS', instruction: 'CLICK WHEN THE DOT IS IN THE CENTER', worldTop: 'WORLD TOP', fullRanking: 'VIEW FULL RANKING', aboutText: ' — a simple reflex game. Hit the center, score points and climb the ranking.' },
  de: { play: 'SPIELEN', ranking: 'RANKING', rooms: 'RÄUME', about: 'ÜBER', myRooms: 'MEINE RÄUME', instruction: 'KLICKE, WENN DER PUNKT IN DER MITTE IST', worldTop: 'WELTWEIT', fullRanking: 'VOLLSTÄNDIGES RANKING', aboutText: ' — ein einfaches Reflexspiel. Triff die Mitte und sammle Punkte.' },
  it: { play: 'GIOCA', ranking: 'CLASSIFICA', rooms: 'STANZE', about: 'INFO', myRooms: 'LE MIE STANZE', instruction: 'CLICCA QUANDO IL PUNTO È AL CENTRO', worldTop: 'TOP MONDIALE', fullRanking: 'CLASSIFICA COMPLETA', aboutText: ' — un semplice gioco di riflessi. Colpisci il centro e scala la classifica.' },
};

const worldPlayers = [
  ['PlayerOne', 50], ['PixelMaster', 48], ['DotKing', 46], ['AimPro', 45], ['Centered', 44]
];
const nationalPlayers = {
  PT: [['TugaKing', 47], ['MinhoAim', 45], ['PortoDot', 44], ['LisboaPro', 42], ['BragaShot', 41]],
  ES: [['MadridAim', 48], ['PixelToro', 46], ['SevillaDot', 43], ['BarcaShot', 42], ['ValenciaPro', 40]],
  FR: [['ParisAim', 47], ['PixelLyon', 45], ['NiceDot', 43], ['LillePro', 42], ['RhoneShot', 40]],
  GB: [['LondonAim', 49], ['PixelFox', 47], ['YorkDot', 45], ['BristolPro', 42], ['LeedsShot', 40]],
  BR: [['BrasilAim', 49], ['PixelRio', 47], ['SaoPauloDot', 44], ['RecifePro', 42], ['BahiaShot', 40]],
  DE: [['BerlinAim', 48], ['PixelWolf', 46], ['HamburgDot', 44], ['MunichPro', 42], ['KölnShot', 40]],
  IT: [['RomaAim', 47], ['PixelRoma', 45], ['MilanDot', 43], ['TorinoPro', 42], ['NapoliShot', 40]],
};

let running = false;
let score = 0;
let x = 0;
let direction = 1;
let speed = 4.2;
let lastTime = 0;
let pulse = 0;
let currentCountry = countries[0];

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  draw();
}

function dimensions() {
  const rect = canvas.getBoundingClientRect();
  return { w: rect.width, h: rect.height };
}

function center() {
  const { w, h } = dimensions();
  return { x: w / 2, y: h / 2 };
}

function drawPixelCircle(cx, cy, radius, color, width = 1, dashed = false) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dashed ? [3, 5] : []);
  ctx.beginPath();
  ctx.arc(Math.round(cx), Math.round(cy), radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function draw() {
  const { w, h } = dimensions();
  const c = center();
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = '#080d12';
  ctx.fillRect(0, 0, w, h);

  // Axis — deliberately thin and pixel-sharp.
  ctx.fillStyle = '#69747e';
  ctx.fillRect(0, Math.round(c.y), w, 1);

  const outer = Math.max(28, Math.min(38, h * 0.095));
  const inner = Math.max(8, Math.min(11, h * 0.027));
  drawPixelCircle(c.x, c.y, outer, '#7b858e', 1, true);
  drawPixelCircle(c.x, c.y, inner, '#aeb6bd', 1, false);

  const dotRadius = Math.max(6, Math.min(9, h * 0.021));
  ctx.fillStyle = '#f5f7f8';
  ctx.fillRect(Math.round(x - dotRadius / 2), Math.round(c.y - dotRadius / 2), Math.ceil(dotRadius), Math.ceil(dotRadius));
  ctx.fillStyle = 'rgba(255,255,255,.28)';
  ctx.fillRect(Math.round(x - 1), Math.round(c.y - 1), 2, 2);

  pulse += 0.035;
  const glow = 0.13 + Math.sin(pulse) * 0.04;
  ctx.fillStyle = `rgba(255,255,255,${glow})`;
  ctx.fillRect(Math.round(x - 2), Math.round(c.y - 2), 4, 4);
}

function loop(time) {
  if (!running) return;
  const dt = Math.min((time - lastTime) / 16.67 || 1, 2);
  lastTime = time;
  const { w } = dimensions();
  const margin = Math.max(24, w * 0.055);
  x += direction * speed * dt;
  if (x >= w - margin) { x = w - margin; direction = -1; }
  if (x <= margin) { x = margin; direction = 1; }
  draw();
  requestAnimationFrame(loop);
}

function resetGame() {
  score = 0;
  scoreEl.textContent = '0';
  const { w } = dimensions();
  x = Math.max(24, w * 0.1);
  direction = 1;
  speed = 4.2;
  running = true;
  messageEl.textContent = translations[currentCountry.language].instruction;
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function stopGame() {
  running = false;
  messageEl.textContent = translations[currentCountry.language].instruction;
  draw();
}

function hit() {
  if (!running) { resetGame(); return; }
  const c = center();
  const distance = Math.abs(x - c.x);
  const inner = Math.max(8, Math.min(11, dimensions().h * 0.027));
  const outer = Math.max(28, Math.min(38, dimensions().h * 0.095));

  if (distance <= inner + 4) {
    score += 2;
    speed = Math.min(speed + 0.22, 12);
    showFeedback('+2', 'good');
  } else if (distance <= outer) {
    score += 1;
    speed = Math.min(speed + 0.12, 11);
    showFeedback('+1', 'ok');
  } else {
    showFeedback('MISS', 'miss');
    stopGame();
    return;
  }
  scoreEl.textContent = String(score);
}

function showFeedback(text, type) {
  feedbackEl.textContent = text;
  feedbackEl.className = `game-feedback ${type}`;
  void feedbackEl.offsetWidth;
  feedbackEl.classList.add('show');
}

function applyLanguage() {
  const t = translations[currentCountry.language] || translations.pt;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key]) el.textContent = t[key];
  });
  document.documentElement.lang = currentCountry.language === 'pt' ? 'pt-PT' : currentCountry.language;
  document.getElementById('countryFlag').textContent = currentCountry.flag;
  document.getElementById('countryName').textContent = currentCountry.name;
  document.getElementById('nationalFlag').textContent = currentCountry.flag;
  document.getElementById('nationalTitle').textContent = `${currentCountry.language === 'pt' ? 'TOP' : 'TOP'} ${currentCountry.name}`;
  renderRankings();
}

function renderList(target, players) {
  target.innerHTML = players.map(([name, points], i) => `
    <li><span class="rank-number">${i + 1}</span><span>${name}</span><span class="rank-score">${points}</span></li>
  `).join('');
}

function renderRankings() {
  renderList(document.getElementById('worldRanking'), worldPlayers);
  renderList(document.getElementById('nationalRanking'), nationalPlayers[currentCountry.code] || nationalPlayers.PT);
}

function buildCountryMenu() {
  const menu = document.getElementById('countryMenu');
  menu.innerHTML = countries.map(country => `
    <button class="country-option" type="button" role="option" data-country="${country.code}">${country.flag} ${country.name}</button>
  `).join('');
  menu.querySelectorAll('.country-option').forEach(btn => {
    btn.addEventListener('click', () => {
      currentCountry = countries.find(c => c.code === btn.dataset.country) || countries[0];
      menu.classList.remove('open');
      document.getElementById('countryButton').setAttribute('aria-expanded', 'false');
      applyLanguage();
    });
  });
}

playButton.addEventListener('click', resetGame);
canvas.addEventListener('pointerdown', hit);
window.addEventListener('keydown', event => {
  if (['Space', 'Enter'].includes(event.code)) {
    event.preventDefault();
    hit();
  }
});

const countryButton = document.getElementById('countryButton');
const countryMenu = document.getElementById('countryMenu');
countryButton.addEventListener('click', () => {
  const open = countryMenu.classList.toggle('open');
  countryButton.setAttribute('aria-expanded', String(open));
});
document.addEventListener('click', event => {
  if (!event.target.closest('.profile-area')) {
    countryMenu.classList.remove('open');
    countryButton.setAttribute('aria-expanded', 'false');
  }
});

// Decorative pixel tiles. They are generated locally so the prototype needs no image assets.
function buildPixelWall() {
  const wall = document.getElementById('pixelWall');
  const colors = ['#e83e45', '#f1c438', '#2f9bd1', '#39b86a', '#7d4ac7', '#ef7b2d', '#e7e7df', '#172b3b'];
  const count = Math.min(650, Math.floor((window.innerWidth * window.innerHeight) / 900));
  for (let i = 0; i < count; i++) {
    const tile = document.createElement('i');
    tile.style.left = `${Math.random() * 100}%`;
    tile.style.top = `${Math.random() * 100}%`;
    tile.style.background = colors[Math.floor(Math.random() * colors.length)];
    tile.style.width = `${4 + Math.floor(Math.random() * 8)}px`;
    tile.style.height = tile.style.width;
    tile.style.opacity = String(.35 + Math.random() * .55);
    wall.appendChild(tile);
  }
}

window.addEventListener('resize', resizeCanvas);
buildCountryMenu();
renderRankings();
buildPixelWall();
resizeCanvas();
stopGame();
