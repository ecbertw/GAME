const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const ROOT = __dirname;
const DATABASE_URL = process.env.DATABASE_URL;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon'
};

const countries = new Set([
  'AF','AL','DZ','AD','AO','AG','AR','AM','AU','AT','AZ','BS','BH','BD','BB','BY','BE','BZ','BJ','BT','BO','BA','BW','BR','BN','BG','BF','BI','CV','KH','CM','CA','CF','TD','CL','CN','CO','KM','CG','CD','CR','CI','HR','CU','CY','CZ','DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','SZ','ET','FJ','FI','FR','GA','GM','GE','DE','GH','GR','GD','GT','GN','GW','GY','HT','HN','HU','IS','IN','ID','IR','IQ','IE','IL','IT','JM','JP','JO','KZ','KE','KI','KP','KR','KW','KG','LA','LV','LB','LS','LR','LY','LI','LT','LU','MG','MW','MY','MV','ML','MT','MH','MR','MU','MX','FM','MD','MC','MN','ME','MA','MZ','MM','NA','NR','NP','NL','NZ','NI','NE','NG','MK','NO','OM','PK','PW','PA','PG','PY','PE','PH','PL','PT','QA','RO','RU','RW','KN','LC','VC','WS','SM','ST','SA','SN','RS','SC','SL','SG','SK','SI','SB','SO','ZA','SS','ES','LK','SD','SR','SE','CH','SY','TJ','TZ','TH','TL','TG','TO','TT','TN','TR','TM','TV','UG','UA','AE','GB','US','UY','UZ','VU','VA','VE','VN','YE','ZM','ZW','PS','XK'
]);

let pg = null;
let dbReady = false;
try {
  if (DATABASE_URL) {
    pg = require('pg');
    pg.types.setTypeParser(20, value => Number(value));
  }
} catch (error) {
  console.error('PostgreSQL module unavailable:', error.message);
}

const memoryPlayers = new Map();

function normalizeName(name) { return String(name || '').trim().toUpperCase(); }
function validName(name) { return /^[A-Za-z0-9]{3,16}$/.test(name); }
function validCountry(country) { return countries.has(String(country || '').toUpperCase()); }
function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}
function body(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; if (raw.length > 10000) req.destroy(); });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}
function tokenHash(token) { return crypto.createHash('sha256').update(token).digest('hex'); }
function publicPlayer(p) { return { id: p.id, name: p.name, country: p.country, bestScore: Number(p.bestScore || 0) }; }

async function initDb() {
  if (!pg || !DATABASE_URL) return;
  const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }, max: 5 });
  global.db = pool;
  await pool.query(`CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY, name VARCHAR(16) NOT NULL, name_key VARCHAR(16) UNIQUE NOT NULL,
    country CHAR(2) NOT NULL, token_hash CHAR(64) NOT NULL, best_score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  // Development phase: every server start/deployment begins with an empty account and ranking database.
  await pool.query('TRUNCATE TABLE players');
  dbReady = true;
  console.log('PostgreSQL ranking database ready. Development reset applied.');
}

async function registerPlayer(name, country) {
  const cleanName = String(name).trim();
  const nameKey = normalizeName(cleanName);
  if (!validName(cleanName)) throw Object.assign(new Error('Nome inválido. Use 3–16 letras ou números, sem espaços ou símbolos.'), { status: 400 });
  if (!validCountry(country)) throw Object.assign(new Error('País inválido.'), { status: 400 });
  const id = crypto.randomUUID();
  const token = crypto.randomBytes(32).toString('hex');
  if (dbReady) {
    try {
      const result = await global.db.query('INSERT INTO players (id,name,name_key,country,token_hash) VALUES ($1,$2,$3,$4,$5) RETURNING id,name,country,best_score', [id, cleanName, nameKey, country.toUpperCase(), tokenHash(token)]);
      return { player: publicPlayer({ ...result.rows[0], bestScore: result.rows[0].best_score }), token };
    } catch (error) {
      if (error.code === '23505') throw Object.assign(new Error('Esse nome já está a ser utilizado.'), { status: 409 });
      throw error;
    }
  }
  for (const p of memoryPlayers.values()) if (p.nameKey === nameKey) throw Object.assign(new Error('Esse nome já está a ser utilizado.'), { status: 409 });
  const player = { id, name: cleanName, nameKey, country: country.toUpperCase(), tokenHash: tokenHash(token), bestScore: 0 };
  memoryPlayers.set(id, player);
  return { player: publicPlayer(player), token };
}

async function authenticate(id, token) {
  if (!id || !token) return null;
  const hash = tokenHash(token);
  if (dbReady) {
    const result = await global.db.query('SELECT id,name,country,best_score AS "bestScore",token_hash FROM players WHERE id=$1', [id]);
    const p = result.rows[0];
    return p && p.token_hash === hash ? p : null;
  }
  const p = memoryPlayers.get(id);
  return p && p.tokenHash === hash ? p : null;
}

async function submitScore(id, token, score) {
  const player = await authenticate(id, token);
  if (!player) throw Object.assign(new Error('Sessão inválida.'), { status: 401 });
  const value = Math.max(0, Math.min(100000, Math.floor(Number(score))));
  if (!Number.isFinite(value)) throw Object.assign(new Error('Pontuação inválida.'), { status: 400 });
  if (dbReady) {
    const result = await global.db.query('UPDATE players SET best_score=GREATEST(best_score,$1), updated_at=NOW() WHERE id=$2 RETURNING id,name,country,best_score AS "bestScore"', [value, id]);
    return publicPlayer(result.rows[0]);
  }
  player.bestScore = Math.max(player.bestScore, value);
  return publicPlayer(player);
}

async function rankings(country, page = 1) {
  const safePage = Math.max(1, Math.floor(Number(page) || 1));
  const offset = (safePage - 1) * 25;
  if (dbReady) {
    const where = country ? 'WHERE country=$1' : '';
    const args = country ? [country.toUpperCase(), 25, offset] : [25, offset];
    const result = await global.db.query(`SELECT name,country,best_score AS score FROM players ${where} ORDER BY best_score DESC, updated_at ASC, created_at ASC LIMIT $${country ? 2 : 1} OFFSET $${country ? 3 : 2}`, args);
    const count = await global.db.query(`SELECT COUNT(*)::int AS total FROM players ${where}`, country ? [country.toUpperCase()] : []);
    return { players: result.rows, total: count.rows[0].total, page: safePage, pages: Math.max(1, Math.ceil(count.rows[0].total / 25)) };
  }
  let values = [...memoryPlayers.values()].filter(p => !country || p.country === country.toUpperCase());
  values.sort((a,b) => b.bestScore - a.bestScore);
  return { players: values.slice(offset, offset + 25).map(p => ({ name:p.name, country:p.country, score:p.bestScore })), total: values.length, page:safePage, pages:Math.max(1, Math.ceil(values.length / 25)) };
}

async function handleApi(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/rankings') {
    const country = url.searchParams.get('country') || '';
    if (country && !validCountry(country)) return json(res, 400, { error: 'País inválido.' });
    return json(res, 200, { country: country || null, ...(await rankings(country || null, url.searchParams.get('page') || 1)) });
  }
  if (req.method === 'POST' && url.pathname === '/api/players') {
    try { const data = await body(req); return json(res, 201, await registerPlayer(data.name, data.country)); }
    catch (error) { return json(res, error.status || 500, { error: error.message || 'Erro no servidor.' }); }
  }
  if (req.method === 'POST' && url.pathname === '/api/scores') {
    try { const data = await body(req); return json(res, 200, { player: await submitScore(data.id, data.token, data.score) }); }
    catch (error) { return json(res, error.status || 500, { error: error.message || 'Erro no servidor.' }); }
  }
  if (req.method === 'GET' && url.pathname === '/api/me') {
    const player = await authenticate(url.searchParams.get('id'), url.searchParams.get('token'));
    return json(res, player ? 200 : 401, player ? { player: publicPlayer(player) } : { error:'Sessão inválida.' });
  }
  return json(res, 404, { error: 'API endpoint not found.' });
}

function serveFile(res, filePath) {
  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) return json(res, 404, { error:'Not found' });
    const ext = path.extname(filePath).toLowerCase();
    const cacheControl = ['.html','.js','.css'].includes(ext) ? 'no-store, no-cache, must-revalidate' : 'public, max-age=3600';
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream', 'Cache-Control': cacheControl });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname === '/health' || url.pathname === '/healthz') return json(res, 200, { ok:true, database:dbReady ? 'postgresql' : 'memory' });
    if (url.pathname.startsWith('/api/')) return handleApi(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error:'Method Not Allowed' });
    let pathname = decodeURIComponent(url.pathname); if (pathname === '/') pathname = '/index.html';
    const filePath = path.resolve(ROOT, pathname.replace(/^\/+/, ''));
    if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) return json(res, 403, { error:'Forbidden' });
    fs.stat(filePath, (error, stats) => {
      if (!error && stats.isFile()) return serveFile(res, filePath);
      return serveFile(res, path.join(ROOT, 'index.html'));
    });
  } catch (error) { console.error(error); json(res, 500, { error:'Internal server error' }); }
});

initDb().catch(error => { console.error('Database initialization failed:', error.message); dbReady = false; });
server.listen(PORT, HOST, () => console.log(`EIXO server listening on ${HOST}:${PORT}`));