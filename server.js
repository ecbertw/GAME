const http=require('http');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const authService=require('./auth-server');
const paypalService=require('./paypal-server');
const PORT=Number(process.env.PORT)||3000;
const HOST=String(process.env.HOST||'127.0.0.1');
const ALLOWED_HOSTS=new Set(String(process.env.PUBLIC_HOSTS||'eixo.at,www.eixo.at,127.0.0.1,localhost').split(',').map(v=>v.trim().toLowerCase()).filter(Boolean));
function requestHost(req){return String(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim().toLowerCase().replace(/:\d+$/,'')}
function allowedRequestHost(req){return ALLOWED_HOSTS.has(requestHost(req))}
const ROOT=__dirname;
const PRIVATE_STATIC_NAMES=new Set(['server.js','server-start.js','auth-server.js','paypal-server.js','package.json','package-lock.json','README.md','.gitignore','LICENSE']);
const PUBLIC_STATIC_EXTS=new Set(['.html','.css','.js','.png','.jpg','.jpeg','.gif','.svg','.webp','.ico','.woff','.woff2']);
function isPublicStaticRequestPath(pathname){
  const clean=String(pathname||'').replace(/^\/+/,''),parts=clean.split('/');
  if(!clean)return true;
  if(parts.some(part=>!part||part.startsWith('.')))return false;
  if(parts[0]==='ops'||PRIVATE_STATIC_NAMES.has(clean))return false;
  const ext=path.extname(clean).toLowerCase();
  return PUBLIC_STATIC_EXTS.has(ext);
}
const DATABASE_URL=process.env.DATABASE_URL;
const MIME_TYPES={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.svg':'image/svg+xml','.webp':'image/webp','.ico':'image/x-icon'};
const countries=new Set('AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG MK NO OM PK PW PA PG PY PE PH PL PT QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA SS ES LK SD SR SE CH SY TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VA VE VN YE ZM ZW PS XK'.split(' '));
let pg=null,dbReady=false;
try{if(DATABASE_URL){pg=require('pg');pg.types.setTypeParser(20,v=>Number(v));}}catch(e){console.error('PostgreSQL unavailable:',e.message);}
const memoryPlayers=new Map(),memoryRooms=new Map(),memoryMembers=new Map(),memoryMessages=[];
const PG_PARAM=String.fromCharCode(36);
const loginRate=new Map();
const SESSION_COOKIE='__Host-eixo_session';
const SESSION_DAYS=30;
function mfaEncryptionKey(){
  const raw=String(process.env.MFA_ENCRYPTION_KEY||'').trim();
  if(/^[0-9a-f]{64}$/i.test(raw))return Buffer.from(raw,'hex');
  try{const b=Buffer.from(raw,'base64');if(b.length===32)return b}catch(_){}
  return null;
}
function base32Encode(buf){const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits=0,value=0,out='';for(const byte of buf){value=(value<<8)|byte;bits+=8;while(bits>=5){out+=alphabet[(value>>>(bits-5))&31];bits-=5}}if(bits>0)out+=alphabet[(value<<(5-bits))&31];return out}
function base32Decode(input){const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits=0,value=0,bytes=[];for(const ch of String(input||'').toUpperCase().replace(/[^A-Z2-7]/g,'')){const idx=alphabet.indexOf(ch);if(idx<0)continue;value=(value<<5)|idx;bits+=5;if(bits>=8){bytes.push((value>>>(bits-8))&255);bits-=8}}return Buffer.from(bytes)}
function totpCode(secret,time=Date.now()){const key=base32Decode(secret),counter=Math.floor(time/30000),msg=Buffer.alloc(8);msg.writeBigUInt64BE(BigInt(counter));const h=crypto.createHmac('sha1',key).update(msg).digest(),offset=h[h.length-1]&15,num=(h.readUInt32BE(offset)&0x7fffffff)%1000000;return String(num).padStart(6,'0')}
function validTotp(secret,code){const clean=String(code||'').replace(/\D/g,'');if(clean.length!==6)return false;for(const drift of [-30000,0,30000]){const expected=totpCode(secret,Date.now()+drift);if(crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(clean)))return true}return false}
function encryptMfaSecret(secret){const key=mfaEncryptionKey();if(!key)throw Object.assign(new Error('MFA encryption key is not configured.'),{status:503});const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key,iv),enc=Buffer.concat([cipher.update(String(secret),'utf8'),cipher.final()]),tag=cipher.getAuthTag();return [iv.toString('base64url'),tag.toString('base64url'),enc.toString('base64url')].join('.')}
function decryptMfaSecret(payload){const key=mfaEncryptionKey();if(!key)throw Object.assign(new Error('MFA encryption key is not configured.'),{status:503});const [ivS,tagS,encS]=String(payload||'').split('.');if(!ivS||!tagS||!encS)throw Object.assign(new Error('Invalid MFA configuration.'),{status:500});const decipher=crypto.createDecipheriv('aes-256-gcm',key,Buffer.from(ivS,'base64url'));decipher.setAuthTag(Buffer.from(tagS,'base64url'));return Buffer.concat([decipher.update(Buffer.from(encS,'base64url')),decipher.final()]).toString('utf8')}
function parseCookies(req){const out={};for(const part of String(req.headers.cookie||'').split(';')){const i=part.indexOf('=');if(i>0)out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim())}return out;}
function setSessionCookie(res,token,persistent=false){const maxAge=persistent?'; Max-Age='+(SESSION_DAYS*86400):'';res.setHeader('Set-Cookie',SESSION_COOKIE+'='+encodeURIComponent(token)+maxAge+'; Path=/; HttpOnly; Secure; SameSite=Strict');}
function clearSessionCookie(res){res.setHeader('Set-Cookie',SESSION_COOKIE+'=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict');}
function sessionHash(v){return crypto.createHash('sha256').update(String(v||'')).digest('hex');}
const chatRate=new Map();
const feedbackRate=new Map();
const paypalRate=new Map();
function boundedRate(map,key,limit,windowMs,maxEntries=10000){
  const now=Date.now();
  if(map.size>maxEntries){
    for(const [k,v] of map){if(now-v.start>windowMs)map.delete(k)}
    if(map.size>maxEntries){let drop=map.size-maxEntries;for(const k of map.keys()){map.delete(k);if(--drop<=0)break}}
  }
  const row=map.get(key);
  if(!row||now-row.start>windowMs){map.set(key,{start:now,count:1});return true}
  row.count++;return row.count<=limit;
}
const WORLD_COLORS=['#e53935','#00d4ff','#ffd43b'];
const COUNTRY_TOP_COLORS=['#ff7a2f','#6f5cff','#7bdc5a'];
const COUNTRY_OTHER_COLORS=['#00d4ff','#ff4fd8','#ffffff'];
const ALL_COLORS=['#ffffff','#e53935','#ff4d4d','#ff7a2f','#ffd43b','#7bdc5a','#39d98a','#00d4ff','#3b82f6','#6f5cff','#b66cff','#ff4fd8','#ff6b9d','#a8e063','#00f0ff','#f97316','#facc15','#94a3b8','#e2e8f0','#22c55e','#ef4444'];
const VIP_COLORS=['#f5f7ff','#00e5ff','#7c4dff','#ff4fd8','#ff6b6b','#7cff6b','#00bfa6','#ff9f1c','#d9ff00','#c084fc'];
const VIP_EFFECTS=['none','bounce','glow','wave','shake','float','pulse','jelly','twist','flicker','stretch','sparkle','shimmer','glitch','tilt','pop','scanline'];
const EFFECTS=['none','bounce','glow','shake','pulse','jelly','twist','flicker','stretch'];
function normalizeName(v){return String(v||'').trim().toUpperCase();}
function validName(v){return /^[A-Za-z0-9]{3,8}$/.test(v);}
function validCountry(v){return countries.has(String(v||'').trim().toUpperCase());}
function validRoomName(v){return /^[\p{L}\p{N}][\p{L}\p{N} _-]{1,23}$/u.test(String(v||'').trim());}
function validRoomSize(v){return Number.isInteger(Number(v))&&Number(v)>=1&&Number(v)<=50;}
function vipLevelOf(p){return Number(p.vipLevel||0);}
function validVipVisualName(v){const s=String(v??'').trim();return s.length>=1&&s.length<=16;}
function parseLetterStyles(v){try{return Array.isArray(v)?v:JSON.parse(v||'[]')}catch(_){return[]}}
function securityHeaders(){return {'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','X-Permitted-Cross-Domain-Policies':'none','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=(self)','Cross-Origin-Opener-Policy':'same-origin-allow-popups','Cross-Origin-Resource-Policy':'same-origin','Vary':'Origin, Sec-Fetch-Site','Content-Security-Policy':"default-src 'self'; script-src 'self' https://www.paypal.com https://www.sandbox.paypal.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https://flagcdn.com https://www.paypalobjects.com https://www.paypal.com https://www.sandbox.paypal.com data:; connect-src 'self' https://api-m.paypal.com https://api-m.sandbox.paypal.com https://www.paypal.com https://www.sandbox.paypal.com; frame-src https://www.paypal.com https://www.sandbox.paypal.com; base-uri 'self'; form-action 'self' https://www.paypal.com https://www.sandbox.paypal.com; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests",'Strict-Transport-Security':'max-age=63072000; includeSubDomains; preload'};}
function json(res,status,payload){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...securityHeaders()});res.end(JSON.stringify(payload));}
function body(req){return new Promise((resolve,reject)=>{let raw='',done=false;const fail=e=>{if(done)return;done=true;reject(e)};req.on('data',chunk=>{if(done)return;raw+=chunk;if(Buffer.byteLength(raw,'utf8')>30000){fail(Object.assign(new Error('Payload too large.'),{status:413}));req.resume();}});req.on('end',()=>{if(done)return;try{const data=raw?JSON.parse(raw):{};if(!data||typeof data!=='object'||Array.isArray(data))throw Object.assign(new Error('Invalid JSON'),{status:400});const c=parseCookies(req);if(c[SESSION_COOKIE])data.token=c[SESSION_COOKIE];done=true;resolve(data);}catch(e){fail(Object.assign(e,{status:e.status||400}));}});req.on('error',fail);});}
function tokenHash(v){return crypto.createHash('sha256').update(String(v)).digest('hex');}
function publicPlayer(p){let styles=[];try{styles=Array.isArray(p.letterStyles)?p.letterStyles:JSON.parse(p.letterStyles||'[]')}catch(_){}return{id:p.id,name:p.name,country:p.country,bestScore:Number(p.bestScore||0),visualName:p.visualName||p.name,nameColor:p.nameColor||'#ffffff',nameEffect:p.nameEffect||'none',vipLevel:Number(p.vipLevel||0),letterStyles:styles,tagGlobalColor:p.tagGlobalColor||'#e53935',tagCountryColor:p.tagCountryColor||'#ff7a2f',avatar:p.avatar||'default',avatarBorder:p.avatarBorder||'#46535f',role:p.role||'player',bannedUntil:p.bannedUntil||null,bannedPermanent:!!p.bannedPermanent,banReason:p.banReason||null};}
function code(){const a='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<6;i++)s+=a[crypto.randomInt(a.length)];return s;}
function publicRoom(r,count){return{id:r.id,code:r.code,name:r.name,maxPlayers:Number(r.max_players??r.maxPlayers),memberCount:Number(count),ownerName:r.owner_name||r.ownerName||''};}
async function initDb(){
  memoryPlayers.clear();memoryRooms.clear();memoryMembers.clear();
  if(!pg||!DATABASE_URL)return;
  const pool=new pg.Pool({connectionString:DATABASE_URL,ssl:DATABASE_URL.includes('localhost')?false:{rejectUnauthorized:false},max:5,connectionTimeoutMillis:10000,query_timeout:15000});global.db=pool;
  await pool.query(`CREATE TABLE IF NOT EXISTS accounts(id UUID PRIMARY KEY,email VARCHAR(200) UNIQUE NOT NULL,password_hash TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await pool.query(`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS mfa_secret_enc TEXT, ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE`);
  await pool.query(`CREATE TABLE IF NOT EXISTS sessions(id UUID PRIMARY KEY,account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,token_hash CHAR(64) UNIQUE NOT NULL,expires_at TIMESTAMPTZ NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS mfa_verified BOOLEAN NOT NULL DEFAULT FALSE`);
  await pool.query(`CREATE TABLE IF NOT EXISTS password_reset_tokens(id UUID PRIMARY KEY,account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,token_hash CHAR(64) UNIQUE NOT NULL,expires_at TIMESTAMPTZ NOT NULL,used_at TIMESTAMPTZ,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await pool.query(`CREATE INDEX IF NOT EXISTS sessions_account_idx ON sessions(account_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS players(id UUID PRIMARY KEY,name VARCHAR(16) NOT NULL,name_key VARCHAR(16) UNIQUE NOT NULL,country CHAR(2) NOT NULL,token_hash CHAR(64) NOT NULL,best_score INTEGER NOT NULL DEFAULT 0,visual_name VARCHAR(16),name_color VARCHAR(20) NOT NULL DEFAULT '#ffffff',name_effect VARCHAR(20) NOT NULL DEFAULT 'none',vip_level INTEGER NOT NULL DEFAULT 0,letter_styles TEXT NOT NULL DEFAULT '[]',tag_global_color VARCHAR(20) NOT NULL DEFAULT '#e53935',tag_country_color VARCHAR(20) NOT NULL DEFAULT '#ff7a2f',avatar VARCHAR(40) NOT NULL DEFAULT 'default',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await pool.query(`ALTER TABLE players ALTER COLUMN visual_name TYPE VARCHAR(16);`);
  await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS account_id UUID UNIQUE REFERENCES accounts(id) ON DELETE CASCADE`);
  await pool.query(`ALTER TABLE players ALTER COLUMN token_hash DROP NOT NULL`);
  await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS role VARCHAR(12) NOT NULL DEFAULT 'player', ADD COLUMN IF NOT EXISTS avatar_border VARCHAR(32) NOT NULL DEFAULT '#46535f', ADD COLUMN IF NOT EXISTS banned_until TIMESTAMPTZ, ADD COLUMN IF NOT EXISTS banned_permanent BOOLEAN NOT NULL DEFAULT FALSE, ADD COLUMN IF NOT EXISTS ban_reason VARCHAR(240)`);
  await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS best_score_at TIMESTAMPTZ`);
  await pool.query(`UPDATE players SET best_score_at=COALESCE(best_score_at,created_at) WHERE best_score>0 AND best_score_at IS NULL`);
  // Pin the owner to the verified player UUID; display names can change.
  await pool.query("UPDATE players SET role='admin' WHERE id=$1 AND account_id IS NOT NULL AND role IN ('player','moderator')", ['dd88732f-7907-4120-ad75-e6fc3878c8cb']);
  await pool.query(`DELETE FROM players WHERE account_id IS NULL`);
  await pool.query(`DELETE FROM sessions WHERE expires_at<=NOW()`);
  await pool.query(`DELETE FROM password_reset_tokens WHERE expires_at<=NOW() OR used_at IS NOT NULL`);
  await pool.query(`UPDATE players SET tag_global_color='#e53935' WHERE tag_global_color IS NULL OR tag_global_color='#39d98a'`);
  await pool.query(`UPDATE players SET tag_country_color='#ff7a2f' WHERE tag_country_color IS NULL OR tag_country_color='#ffd43b'`);
  await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS visual_name VARCHAR(32), ADD COLUMN IF NOT EXISTS name_color VARCHAR(20) NOT NULL DEFAULT '#ffffff', ADD COLUMN IF NOT EXISTS name_effect VARCHAR(20) NOT NULL DEFAULT 'none', ADD COLUMN IF NOT EXISTS vip_level INTEGER NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS letter_styles TEXT NOT NULL DEFAULT '[]', ADD COLUMN IF NOT EXISTS tag_global_color VARCHAR(20) NOT NULL DEFAULT '#e53935', ADD COLUMN IF NOT EXISTS tag_country_color VARCHAR(20) NOT NULL DEFAULT '#ff7a2f', ADD COLUMN IF NOT EXISTS avatar VARCHAR(40) NOT NULL DEFAULT 'default'`);
  await pool.query(`CREATE TABLE IF NOT EXISTS chat_messages(id UUID PRIMARY KEY,player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,channel VARCHAR(10) NOT NULL CHECK(channel IN ('global','national')),message VARCHAR(300) NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await pool.query(`CREATE INDEX IF NOT EXISTS chat_messages_channel_created_idx ON chat_messages(channel,created_at DESC)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS rooms(id UUID PRIMARY KEY,code VARCHAR(6) UNIQUE NOT NULL,name VARCHAR(24) NOT NULL,max_players INTEGER NOT NULL CHECK(max_players BETWEEN 1 AND 50),owner_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await pool.query(`ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_max_players_check`);
  await pool.query(`ALTER TABLE rooms ADD CONSTRAINT rooms_max_players_check CHECK(max_players BETWEEN 1 AND 50)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS room_members(room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(room_id,player_id))`);
  await pool.query(`ALTER TABLE room_members ADD COLUMN IF NOT EXISTS best_score INTEGER NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS score_updated_at TIMESTAMPTZ`);
  await pool.query(`CREATE TABLE IF NOT EXISTS messages(id UUID PRIMARY KEY,type VARCHAR(20) NOT NULL,name VARCHAR(80),email VARCHAR(200),subject VARCHAR(160),message TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await paypalService.initDb(pool);
  await pool.query(`CREATE TABLE IF NOT EXISTS background_claims(x INTEGER NOT NULL,y INTEGER NOT NULL,owner_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,color VARCHAR(7) NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(x,y))`);
  await pool.query(`ALTER TABLE background_claims ALTER COLUMN color TYPE VARCHAR(16)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS background_claims_owner_idx ON background_claims(owner_id)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS anti_cheat_runs(id UUID PRIMARY KEY,player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,score INTEGER NOT NULL,risk INTEGER NOT NULL DEFAULT 0,flagged BOOLEAN NOT NULL DEFAULT FALSE,details JSONB NOT NULL DEFAULT '{}'::jsonb,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await pool.query(`CREATE INDEX IF NOT EXISTS anti_cheat_runs_player_created_idx ON anti_cheat_runs(player_id,created_at DESC)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS game_runs(id UUID PRIMARY KEY,player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),used_at TIMESTAMPTZ,created_ip_hash CHAR(64),created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await pool.query(`CREATE INDEX IF NOT EXISTS game_runs_player_started_idx ON game_runs(player_id,started_at DESC)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS online_presence(player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await pool.query(`CREATE INDEX IF NOT EXISTS online_presence_seen_idx ON online_presence(last_seen DESC)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS security_audit(id UUID PRIMARY KEY,actor_id UUID REFERENCES players(id) ON DELETE SET NULL,action VARCHAR(80) NOT NULL,target_id UUID REFERENCES players(id) ON DELETE SET NULL,metadata JSONB NOT NULL DEFAULT '{}'::jsonb,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await pool.query(`CREATE INDEX IF NOT EXISTS security_audit_created_idx ON security_audit(created_at DESC)`);
  dbReady=true;await enforceTopOneCosmetics();console.log('PostgreSQL database ready. EIXO V2 accounts/sessions active; legacy test players removed.');
}
async function authenticateSession(token){if(!token||!dbReady)return null;const h=sessionHash(token);const r=await global.db.query('SELECT p.id,p.name,p.country,p.best_score AS "bestScore",p.visual_name AS "visualName",p.name_color AS "nameColor",p.name_effect AS "nameEffect",p.vip_level AS "vipLevel",p.letter_styles AS "letterStyles",p.tag_global_color AS "tagGlobalColor",p.tag_country_color AS "tagCountryColor",p.avatar,p.avatar_border AS "avatarBorder",p.role,p.banned_until AS "bannedUntil",p.banned_permanent AS "bannedPermanent",p.ban_reason AS "banReason",s.created_at AS "sessionCreatedAt",s.mfa_verified AS "mfaVerified",a.mfa_enabled AS "mfaEnabled" FROM sessions s JOIN players p ON p.account_id=s.account_id JOIN accounts a ON a.id=s.account_id WHERE s.token_hash='+PG_PARAM+'1 AND s.expires_at>NOW()',[h]);return r.rows[0]||null;}
async function authenticate(id,token){if(!id||!token||!dbReady)return null;const h=sessionHash(token);const r=await global.db.query('SELECT p.id,p.name,p.country,p.best_score AS "bestScore",p.visual_name AS "visualName",p.name_color AS "nameColor",p.name_effect AS "nameEffect",p.vip_level AS "vipLevel",p.letter_styles AS "letterStyles",p.tag_global_color AS "tagGlobalColor",p.tag_country_color AS "tagCountryColor",p.avatar,p.avatar_border AS "avatarBorder",p.role,p.banned_until AS "bannedUntil",p.banned_permanent AS "bannedPermanent",p.ban_reason AS "banReason",s.created_at AS "sessionCreatedAt",s.mfa_verified AS "mfaVerified",a.mfa_enabled AS "mfaEnabled" FROM sessions s JOIN players p ON p.account_id=s.account_id JOIN accounts a ON a.id=s.account_id WHERE p.id='+PG_PARAM+'1 AND s.token_hash='+PG_PARAM+'2 AND s.expires_at>NOW()',[id,h]);return r.rows[0]||null;}
async function registerPlayer(name,country){const clean=String(name).trim(),key=normalizeName(clean);if(!validName(clean))throw Object.assign(new Error('Nome inválido. Use 3–8 letras ou números, sem espaços ou símbolos.'),{status:400});if(!validCountry(country))throw Object.assign(new Error('País inválido.'),{status:400});const id=crypto.randomUUID(),token=crypto.randomBytes(32).toString('hex');if(dbReady){try{const r=await global.db.query('INSERT INTO players(id,name,name_key,country,token_hash,visual_name) VALUES($1,$2,$3,$4,$5,$2) RETURNING id,name,country,best_score AS "bestScore",visual_name AS "visualName",name_color AS "nameColor",name_effect AS "nameEffect",vip_level AS "vipLevel",letter_styles AS "letterStyles",tag_global_color AS "tagGlobalColor",tag_country_color AS "tagCountryColor"',[id,clean,key,String(country).toUpperCase(),tokenHash(token)]);return{player:publicPlayer(r.rows[0]),token};}catch(e){if(e.code==='23505')throw Object.assign(new Error('Esse nome já está a ser utilizado.'),{status:409});throw e;}}for(const p of memoryPlayers.values())if(p.nameKey===key)throw Object.assign(new Error('Esse nome já está a ser utilizado.'),{status:409});const p={id,name:clean,nameKey:key,country:String(country).toUpperCase(),tokenHash:tokenHash(token),bestScore:0,visualName:clean,nameColor:'#ffffff',nameEffect:'none',vipLevel:0,letterStyles:[],tagGlobalColor:'#e53935',tagCountryColor:'#ff7a2f'};memoryPlayers.set(id,p);return{player:publicPlayer(p),token};}
async function startGameRun(id,token,ip=''){const p=await roomAuth(id,token);const runId=crypto.randomUUID(),ipHash=ip?crypto.createHash('sha256').update(String(ip)).digest('hex'):null;await global.db.query('DELETE FROM game_runs WHERE started_at<NOW()-INTERVAL \'2 hours\' OR used_at IS NOT NULL AND used_at<NOW()-INTERVAL \'30 minutes\'');await global.db.query('INSERT INTO game_runs(id,player_id,created_ip_hash) VALUES($1,$2,$3)',[runId,p.id,ipHash]);return{runId,startedAt:Date.now()};}
async function consumeGameRun(playerId,runId,score){if(!runId)throw Object.assign(new Error('Invalid game run.'),{status:400,code:'RUN_REQUIRED'});const client=await global.db.connect();try{await client.query('BEGIN');const q=await client.query('SELECT id,started_at,used_at FROM game_runs WHERE id=$1 AND player_id=$2 FOR UPDATE',[String(runId),playerId]);if(!q.rowCount||q.rows[0].used_at)throw Object.assign(new Error('Invalid or already used game run.'),{status:409,code:'RUN_INVALID'});const elapsed=Date.now()-new Date(q.rows[0].started_at).getTime();if(elapsed<0||elapsed>30*60*1000)throw Object.assign(new Error('Game run expired.'),{status:409,code:'RUN_EXPIRED'});const generousMax=8+Math.floor(elapsed/120)*2;if(Number(score)>generousMax)throw Object.assign(new Error('Score timing validation failed.'),{status:422,code:'RUN_TIMING'});await client.query('UPDATE game_runs SET used_at=NOW() WHERE id=$1',[runId]);await client.query('COMMIT');return{elapsed};}catch(e){try{await client.query('ROLLBACK')}catch(_){}throw e}finally{client.release()}}
function analyzeRunTelemetry(score,raw){
  const events=Array.isArray(raw)?raw.slice(0,600):[];
  const hits=events.filter(e=>e&&Number(e.points)>0).map(e=>({t:Number(e.t),offset:Number(e.offset),points:Number(e.points)})).filter(e=>Number.isFinite(e.t)&&Number.isFinite(e.offset)&&[1,2].includes(e.points));
  let risk=0;const reasons=[];const pointSum=hits.reduce((a,e)=>a+e.points,0);
  if(Number(score)>=20&&!hits.length){risk+=60;reasons.push('missing-telemetry');}
  if(hits.length&&pointSum!==Number(score)){risk+=100;reasons.push('score-mismatch');}
  if(hits.length>=20){
    const buckets=new Map();for(const e of hits){const k=(Math.round(e.offset*10)/10).toFixed(1);buckets.set(k,(buckets.get(k)||0)+1);}
    const repeated=Math.max(0,...buckets.values());
    if(repeated>=50){risk+=55;reasons.push('50-identical-offsets');}
    else if(repeated>=35){risk+=35;reasons.push('many-identical-offsets');}
    else if(repeated>=25){risk+=20;reasons.push('repeated-offsets');}
    const perfect=hits.filter(e=>Math.abs(e.offset)<=0.5).length;
    if(perfect>=50){risk+=40;reasons.push('50-near-perfect');}
    else if(perfect>=30){risk+=22;reasons.push('many-near-perfect');}
    const intervals=[];for(let i=1;i<hits.length;i++){const d=hits[i].t-hits[i-1].t;if(d>0&&d<10000)intervals.push(d);}
    if(intervals.length>=15){const mean=intervals.reduce((a,b)=>a+b,0)/intervals.length;const variance=intervals.reduce((a,b)=>a+(b-mean)*(b-mean),0)/intervals.length;const cv=Math.sqrt(variance)/Math.max(mean,1);if(mean<70){risk+=45;reasons.push('implausibly-fast-input');}if(cv<0.015){risk+=30;reasons.push('machine-like-timing');}else if(cv<0.03){risk+=18;reasons.push('very-regular-timing');}}
  }
  return{risk:Math.min(risk,200),flagged:risk>=45,reasons,eventCount:hits.length,pointSum};
}
async function submitScore(id,token,score,telemetry,runId,roomId=null){
  const p=await roomAuth(id,token);
  const v=Math.floor(Number(score));
  if(!Number.isFinite(v))throw Object.assign(new Error('Pontuação inválida.'),{status:400});
  const value=Math.max(0,Math.min(100000,v));
  const run=await consumeGameRun(p.id,runId,value);
  const anti=analyzeRunTelemetry(value,telemetry);anti.runElapsedMs=run.elapsed;
  if(dbReady){
    await global.db.query('INSERT INTO anti_cheat_runs(id,player_id,score,risk,flagged,details) VALUES($1,$2,$3,$4,$5,$6::jsonb)',[crypto.randomUUID(),id,value,anti.risk,anti.flagged,JSON.stringify({reasons:anti.reasons,eventCount:anti.eventCount,pointSum:anti.pointSum,roomId:roomId||null})]);
    if(anti.reasons.includes('score-mismatch')||anti.reasons.includes('implausibly-fast-input'))return{player:publicPlayer(p),antiCheat:{...anti,scoreAccepted:false},roomScoreAccepted:false};
    const client=await global.db.connect();
    try{
      await client.query('BEGIN');
      const r=await client.query('UPDATE players SET best_score_at=CASE WHEN $1>best_score THEN NOW() ELSE best_score_at END,best_score=GREATEST(best_score,$1),updated_at=NOW() WHERE id=$2 RETURNING id,name,country,best_score AS "bestScore",visual_name AS "visualName",name_color AS "nameColor",name_effect AS "nameEffect",vip_level AS "vipLevel",letter_styles AS "letterStyles",tag_global_color AS "tagGlobalColor",tag_country_color AS "tagCountryColor",avatar,avatar_border AS "avatarBorder",role,banned_until AS "bannedUntil",banned_permanent AS "bannedPermanent",ban_reason AS "banReason"',[value,id]);
      let roomScore=null,roomScoreAccepted=false;
      if(roomId){
        const member=await client.query('SELECT best_score FROM room_members WHERE room_id=$1 AND player_id=$2 FOR UPDATE',[String(roomId),id]);
        if(!member.rowCount)throw Object.assign(new Error('Não pertences a esta sala.'),{status:403});
        const rr=await client.query('UPDATE room_members SET best_score=GREATEST(best_score,$1),score_updated_at=CASE WHEN $1>best_score THEN NOW() ELSE score_updated_at END WHERE room_id=$2 AND player_id=$3 RETURNING best_score AS "bestScore"',[value,String(roomId),id]);
        roomScore=Number(rr.rows[0]?.bestScore||0);roomScoreAccepted=true;
      }
      await client.query('COMMIT');
      await enforceTopOneCosmetics();
      return{player:publicPlayer(r.rows[0]),antiCheat:{...anti,scoreAccepted:true},roomScore,roomScoreAccepted,roomId:roomId||null};
    }catch(e){try{await client.query('ROLLBACK')}catch(_){}throw e}finally{client.release()}
  }
  p.bestScore=Math.max(p.bestScore,value);
  return{player:publicPlayer(p),antiCheat:{...anti,scoreAccepted:true},roomScore:null,roomScoreAccepted:false,roomId:roomId||null};
}
async function getAllPlayers(){if(dbReady){const r=await global.db.query('SELECT id,name,country,best_score AS score,visual_name AS "visualName",name_color AS "nameColor",name_effect AS "nameEffect",vip_level AS "vipLevel",letter_styles AS "letterStyles",tag_global_color AS "tagGlobalColor",tag_country_color AS "tagCountryColor",best_score_at AS "bestScoreAt",updated_at AS "updatedAt",created_at AS "createdAt" FROM players');return r.rows.map(p=>({...p,letterStyles:parseLetterStyles(p.letterStyles)}));}return[...memoryPlayers.values()].map(p=>({id:p.id,name:p.name,country:p.country,score:p.bestScore,visualName:p.visualName,nameColor:p.nameColor,nameEffect:p.nameEffect,vipLevel:Number(p.vipLevel||0),letterStyles:p.letterStyles||[],tagGlobalColor:p.tagGlobalColor||'#e53935',tagCountryColor:p.tagCountryColor||'#ff7a2f',updatedAt:0,createdAt:0}));}
async function ranked(){const rows=await getAllPlayers();rows.sort((a,b)=>Number(b.score)-Number(a.score)||String(a.bestScoreAt||a.createdAt||'').localeCompare(String(b.bestScoreAt||b.createdAt||''))||String(a.createdAt||'').localeCompare(String(b.createdAt||''))||String(a.id).localeCompare(String(b.id)));const world=new Map(rows.map((p,i)=>[p.id,i+1]));const countryMaps=new Map();for(const p of rows){if(!countryMaps.has(p.country))countryMaps.set(p.country,[]);countryMaps.get(p.country).push(p);}const cr=new Map();for(const list of countryMaps.values())list.forEach((p,i)=>cr.set(p.id,i+1));return{rows,world,country:cr};}
async function playerRanks(id,token){await roomAuth(id,token);const r=await ranked();return{worldRank:r.world.get(id)||9999,countryRank:r.country.get(id)||9999};}
async function rankings(country,page=1){const safe=Math.max(1,Math.floor(Number(page)||1)),offset=(safe-1)*25,r=await ranked();let list=country?r.rows.filter(p=>p.country===country.toUpperCase()):r.rows;const total=list.length;list=list.slice(offset,offset+25).map(p=>({...p,score:Number(p.score||0),worldRank:r.world.get(p.id),countryRank:r.country.get(p.id)}));return{players:list,total,page:safe,pages:Math.max(1,Math.ceil(total/25))};}
async function roomAuth(id,token){const p=await authenticate(id,token);if(!p)throw Object.assign(new Error('Sessão inválida.'),{status:401});if(p.bannedPermanent||(p.bannedUntil&&new Date(p.bannedUntil)>new Date()))throw Object.assign(new Error('A tua conta está temporariamente ou permanentemente bloqueada.'),{status:403});return p;}
function requireAdmin(p){if(!p||p.role!=='admin')throw Object.assign(new Error('Apenas o administrador pode executar esta ação.'),{status:403});const created=Date.parse(p.sessionCreatedAt||'');if(!Number.isFinite(created)||Date.now()-created>8*60*60*1000)throw Object.assign(new Error('Admin session expired. Sign in again to continue.'),{status:401});if(mfaEncryptionKey()){if(!p.mfaEnabled)throw Object.assign(new Error('ADMIN MFA setup required.'),{status:428});if(!p.mfaVerified)throw Object.assign(new Error('ADMIN MFA verification required.'),{status:401});}}
function requireStaff(p){if(!p||!['admin','moderator'].includes(p.role))throw Object.assign(new Error('Sem permissões de moderação.'),{status:403});}
const BASIC_AVATARS=['default','diamond','square','circle','star','bolt','shield','hex'];
const VIP_AVATARS={1:['crystal','spark'],2:['comet','crown'],3:['thunder','skull'],4:['phoenix','vortex'],5:['titan','plasma'],6:['infinity','cosmic']};
const BASIC_BORDERS=['#46535f','#ffffff','#2f9bd1','#39b86a','#e83e45','#f1c438','#ef7b2d','#7d4ac7'];
const VIP_BORDERS={1:['glow-blue','glow-yellow'],2:['pulse-green','pulse-purple'],3:['electric-yellow','electric-blue'],4:['flame-orange','flame-red'],5:['plasma-cyan','plasma-purple'],6:['cosmic','infinity-rgb']};
function unlockedByTier(base,tiers,level){const out=[...base];for(let i=1;i<=Math.min(6,Number(level)||0);i++)out.push(...(tiers[i]||[]));return out;}
function validAvatar(v,vip,worldRank){const allowed=unlockedByTier(BASIC_AVATARS,VIP_AVATARS,vip);if(Number(worldRank)===1)allowed.push('prism');return allowed.includes(String(v||''));}
function validBorder(v,vip,worldRank){const value=String(v||'').toLowerCase(),allowed=unlockedByTier(BASIC_BORDERS,VIP_BORDERS,vip);if(Number(worldRank)===1)allowed.push('rainbow');return allowed.includes(value);}
async function enforceTopOneCosmetics(){
  if(!dbReady)return;
  const r=await ranked(),topId=r.rows[0]?.id;
  if(!topId)return;
  const q=await global.db.query(`SELECT id,vip_level AS "vipLevel",name_color AS "nameColor",letter_styles AS "letterStyles",avatar,avatar_border AS "avatarBorder",tag_global_color AS "tagGlobalColor",tag_country_color AS "tagCountryColor"
    FROM players
    WHERE id<>$1 AND (
      LOWER(name_color)='rainbow' OR LOWER(avatar)='prism' OR LOWER(avatar_border)='rainbow'
      OR LOWER(tag_global_color)='rainbow' OR LOWER(tag_country_color)='rainbow'
      OR letter_styles::text ILIKE '%rainbow%'
    )`,[topId]);
  await global.db.query("UPDATE background_claims SET color='#ff3b30',updated_at=NOW() WHERE color='rainbow' AND owner_id<>$1",[topId]);
  for(const p of q.rows){
    const styles=parseLetterStyles(p.letterStyles).map(s=>String(s?.color||'').toLowerCase()==='rainbow'?{...s,color:Number(p.vipLevel||0)>0?'#f5f7ff':'#ffffff'}:s);
    const color=String(p.nameColor||'').toLowerCase()==='rainbow'?(Number(p.vipLevel||0)>0?'#f5f7ff':'#ffffff'):p.nameColor;
    const avatar=String(p.avatar||'').toLowerCase()==='prism'?'default':p.avatar;
    const border=String(p.avatarBorder||'').toLowerCase()==='rainbow'?'#46535f':p.avatarBorder;
    const globalTag=String(p.tagGlobalColor||'').toLowerCase()==='rainbow'?'#e53935':p.tagGlobalColor;
    const countryTag=String(p.tagCountryColor||'').toLowerCase()==='rainbow'?'#ff7a2f':p.tagCountryColor;
    await global.db.query('UPDATE players SET name_color=$1,letter_styles=$2,avatar=$3,avatar_border=$4,tag_global_color=$5,tag_country_color=$6,updated_at=NOW() WHERE id=$7',[color,JSON.stringify(styles),avatar,border,globalTag,countryTag,p.id]);
  }
}
async function updateAccountProfile(id,token,data){const p=await roomAuth(id,token),r=await ranked(),worldRank=r.world.get(id)||9999;const avatar=String(data.avatar||p.avatar||'default'),border=String(data.avatarBorder||p.avatarBorder||'#46535f').toLowerCase(),newName=String(data.name||p.name).trim();if(!validName(newName))throw Object.assign(new Error('O nome deve ter 3–8 letras ou números.'),{status:400});if(!validAvatar(avatar,vipLevelOf(p),worldRank))throw Object.assign(new Error('Esse avatar ainda não está disponível para a tua conta.'),{status:403});if(!validBorder(border,vipLevelOf(p),worldRank))throw Object.assign(new Error('Essa borda ainda não está disponível para a tua conta.'),{status:403});const q=await global.db.query('UPDATE players SET avatar=$1,avatar_border=$2,name=$3,name_key=$4,visual_name=CASE WHEN visual_name=name THEN $3 ELSE visual_name END,updated_at=NOW() WHERE id=$5 RETURNING id,name,country,best_score AS "bestScore",visual_name AS "visualName",name_color AS "nameColor",name_effect AS "nameEffect",vip_level AS "vipLevel",letter_styles AS "letterStyles",tag_global_color AS "tagGlobalColor",tag_country_color AS "tagCountryColor",avatar,avatar_border AS "avatarBorder",role,banned_until AS "bannedUntil",banned_permanent AS "bannedPermanent",ban_reason AS "banReason"',[avatar,border,newName,normalizeName(newName),id]);return{player:publicPlayer(q.rows[0]),worldRank};}
async function resolveTarget(value){const s=String(value||'').trim();const q=await global.db.query('SELECT id FROM players WHERE id::text=$1 OR name_key=$2 LIMIT 1',[s,normalizeName(s)]);if(!q.rowCount)throw Object.assign(new Error('Jogador não encontrado.'),{status:404});return q.rows[0].id;}
async function adminSetVip(adminId,token,targetId,level){
  const a=await roomAuth(adminId,token);requireAdmin(a);targetId=await resolveTarget(targetId);
  const v=Math.max(0,Math.min(6,Math.floor(Number(level))));
  const ranks=await ranked(),worldRank=ranks.world.get(targetId)||9999,countryRank=ranks.country.get(targetId)||9999;
  const cur=await global.db.query('SELECT id,name,visual_name AS "visualName",name_color AS "nameColor",name_effect AS "nameEffect",letter_styles AS "letterStyles",avatar,avatar_border AS "avatarBorder",tag_global_color AS "tagGlobalColor",tag_country_color AS "tagCountryColor" FROM players WHERE id=$1',[targetId]);
  if(!cur.rowCount)throw Object.assign(new Error('Jogador não encontrado.'),{status:404});
  const p=cur.rows[0],allowedAvatars=unlockedByTier(BASIC_AVATARS,VIP_AVATARS,v),allowedBorders=unlockedByTier(BASIC_BORDERS,VIP_BORDERS,v);
  if(worldRank===1){allowedAvatars.push('prism');allowedBorders.push('rainbow');}
  let avatar=allowedAvatars.includes(String(p.avatar||'default'))?String(p.avatar||'default'):'default';
  let border=allowedBorders.includes(String(p.avatarBorder||'#46535f').toLowerCase())?String(p.avatarBorder||'#46535f').toLowerCase():'#46535f';
  let visual=String(p.visualName||p.name),color=String(p.nameColor||'#ffffff').toLowerCase(),effect=String(p.nameEffect||'none'),styles=parseLetterStyles(p.letterStyles),tagGlobal=String(p.tagGlobalColor||'#e53935').toLowerCase(),tagCountry=String(p.tagCountryColor||'#ff7a2f').toLowerCase();
  if(v===0){
    styles=[];
    const allowed=paletteFor({worldRank,countryRank}).map(x=>x.toLowerCase());
    if(!allowed.includes(color))color=allowed[0]||'#ffffff';
    if(!EFFECTS.includes(effect))effect='none';
    if(worldRank!==1||!validName(visual))visual=p.name;
    tagGlobal='#e53935';tagCountry='#ff7a2f';
  }else{
    if((tagGlobal==='rainbow'||tagCountry==='rainbow')&&worldRank!==1){tagGlobal='#e53935';tagCountry='#ff7a2f';}
  }
  await global.db.query('UPDATE players SET vip_level=$1,avatar=$2,avatar_border=$3,visual_name=$4,name_color=$5,name_effect=$6,letter_styles=$7,tag_global_color=$8,tag_country_color=$9,updated_at=NOW() WHERE id=$10',[v,avatar,border,visual,color,effect,JSON.stringify(styles),tagGlobal,tagCountry,targetId]);
  await auditSecurity(a.id,'admin.vip',targetId,{level:v});return{ok:true,level:v};
}
async function adminSetRole(adminId,token,targetId,role){const a=await roomAuth(adminId,token);requireAdmin(a);targetId=await resolveTarget(targetId);if(!['player','moderator'].includes(role))throw Object.assign(new Error('Cargo inválido.'),{status:400});if(targetId===a.id)throw Object.assign(new Error('Não podes alterar o teu próprio cargo de administrador.'),{status:400});const q=await global.db.query('UPDATE players SET role=$1,updated_at=NOW() WHERE id=$2 RETURNING id',[role,targetId]);if(!q.rowCount)throw Object.assign(new Error('Jogador não encontrado.'),{status:404});await auditSecurity(a.id,'admin.role',targetId,{role});return{ok:true,role};}
async function moderateBan(actorId,token,targetId,hours,permanent=false,reason=''){const a=await roomAuth(actorId,token);requireStaff(a);targetId=await resolveTarget(targetId);const t=await global.db.query('SELECT id,role FROM players WHERE id=$1',[targetId]);if(!t.rowCount)throw Object.assign(new Error('Jogador não encontrado.'),{status:404});if(t.rows[0].role==='admin'||(a.role==='moderator'&&t.rows[0].role==='moderator'))throw Object.assign(new Error('Não tens permissão para bloquear este jogador.'),{status:403});const why=String(reason||'Violation of EIXO rules.').trim().slice(0,240);if(permanent){requireAdmin(a);await global.db.query('UPDATE players SET banned_permanent=TRUE,banned_until=NULL,ban_reason=$1 WHERE id=$2',[why,targetId]);await auditSecurity(a.id,'moderation.ban_permanent',targetId,{reason:why});}else{const h=Math.max(1,Math.min(a.role==='moderator'?24:720,Math.floor(Number(hours)||24)));await global.db.query("UPDATE players SET banned_permanent=FALSE,banned_until=NOW()+($1::text||' hours')::interval,ban_reason=$2 WHERE id=$3",[h,why,targetId]);await auditSecurity(a.id,'moderation.ban_temporary',targetId,{hours:h,reason:why});}return{ok:true};}
async function kickPlayer(actorId,token,targetId){const a=await roomAuth(actorId,token);requireStaff(a);targetId=await resolveTarget(targetId);const t=await global.db.query('SELECT role FROM players WHERE id=$1',[targetId]);if(!t.rowCount)throw Object.assign(new Error('Jogador não encontrado.'),{status:404});if(t.rows[0].role==='admin'||(a.role==='moderator'&&t.rows[0].role==='moderator'))throw Object.assign(new Error('Não tens permissão para expulsar este jogador.'),{status:403});await global.db.query('DELETE FROM sessions WHERE account_id=(SELECT account_id FROM players WHERE id=$1)',[targetId]);return{ok:true};}
async function deleteChatMessage(actorId,token,messageId){const a=await roomAuth(actorId,token);requireAdmin(a);const q=await global.db.query('DELETE FROM chat_messages WHERE id=$1 RETURNING id',[messageId]);if(!q.rowCount)throw Object.assign(new Error('Mensagem não encontrada.'),{status:404});return{ok:true};}
async function adminAntiCheat(actorId,token){const a=await roomAuth(actorId,token);requireAdmin(a);const r=await global.db.query('SELECT ac.id,ac.player_id AS "playerId",p.name,ac.score,ac.risk,ac.flagged,ac.details,ac.created_at AS "createdAt" FROM anti_cheat_runs ac JOIN players p ON p.id=ac.player_id WHERE ac.flagged=TRUE ORDER BY ac.created_at DESC LIMIT 100');return{runs:r.rows};}
async function auditSecurity(actorId,action,targetId=null,metadata={}){try{await global.db.query('INSERT INTO security_audit(id,actor_id,action,target_id,metadata) VALUES($1,$2,$3,$4,$5::jsonb)',[crypto.randomUUID(),actorId||null,String(action).slice(0,80),targetId||null,JSON.stringify(metadata||{})]);}catch(_){}}
async function presencePing(id,token){const p=await roomAuth(id,token);await global.db.query('INSERT INTO online_presence(player_id,last_seen) VALUES($1,NOW()) ON CONFLICT(player_id) DO UPDATE SET last_seen=EXCLUDED.last_seen',[p.id]);return{ok:true};}
async function adminMfaStatus(id,token){const p=await roomAuth(id,token);if(p.role!=='admin')throw Object.assign(new Error('Apenas o administrador pode executar esta ação.'),{status:403});return{configured:!!mfaEncryptionKey(),enabled:!!p.mfaEnabled,verified:!!p.mfaVerified};}
async function adminMfaSetup(id,token,password){const p=await roomAuth(id,token);if(p.role!=='admin')throw Object.assign(new Error('Apenas o administrador pode executar esta ação.'),{status:403});if(!mfaEncryptionKey())throw Object.assign(new Error('MFA encryption key is not configured.'),{status:503});const q=await global.db.query('SELECT a.id,a.email,a.password_hash AS "passwordHash" FROM accounts a JOIN players p ON p.account_id=a.id WHERE p.id=$1',[p.id]);if(!q.rowCount||!(await authService.verifyPassword(String(password||''),q.rows[0].passwordHash)))throw Object.assign(new Error('Current password is incorrect.'),{status:401});const secret=base32Encode(crypto.randomBytes(20)),enc=encryptMfaSecret(secret);await global.db.query('UPDATE accounts SET mfa_secret_enc=$1,mfa_enabled=FALSE,updated_at=NOW() WHERE id=$2',[enc,q.rows[0].id]);await global.db.query('UPDATE sessions SET mfa_verified=FALSE WHERE account_id=$1',[q.rows[0].id]);await auditSecurity(p.id,'admin.mfa_setup',p.id,{});const label=encodeURIComponent('EIXO:'+q.rows[0].email),issuer=encodeURIComponent('EIXO');return{secret,otpauthUri:'otpauth://totp/'+label+'?secret='+secret+'&issuer='+issuer+'&algorithm=SHA1&digits=6&period=30'};}
async function adminMfaEnable(id,token,code){const p=await roomAuth(id,token);if(p.role!=='admin')throw Object.assign(new Error('Apenas o administrador pode executar esta ação.'),{status:403});const q=await global.db.query('SELECT a.id,a.mfa_secret_enc AS "secretEnc" FROM accounts a JOIN players p ON p.account_id=a.id WHERE p.id=$1',[p.id]);if(!q.rowCount||!q.rows[0].secretEnc)throw Object.assign(new Error('Start MFA setup first.'),{status:400});const secret=decryptMfaSecret(q.rows[0].secretEnc);if(!validTotp(secret,code))throw Object.assign(new Error('Invalid authentication code.'),{status:401});const h=sessionHash(token);await global.db.query('UPDATE accounts SET mfa_enabled=TRUE,updated_at=NOW() WHERE id=$1',[q.rows[0].id]);await global.db.query('UPDATE sessions SET mfa_verified=(token_hash=$1) WHERE account_id=$2',[h,q.rows[0].id]);await auditSecurity(p.id,'admin.mfa_enabled',p.id,{});return{ok:true};}
async function adminMfaVerify(id,token,code){const p=await roomAuth(id,token);if(p.role!=='admin')throw Object.assign(new Error('Apenas o administrador pode executar esta ação.'),{status:403});const q=await global.db.query('SELECT a.id,a.mfa_enabled AS "enabled",a.mfa_secret_enc AS "secretEnc" FROM accounts a JOIN players p ON p.account_id=a.id WHERE p.id=$1',[p.id]);if(!q.rowCount||!q.rows[0].enabled||!q.rows[0].secretEnc)throw Object.assign(new Error('ADMIN MFA is not enabled.'),{status:428});if(!validTotp(decryptMfaSecret(q.rows[0].secretEnc),code))throw Object.assign(new Error('Invalid authentication code.'),{status:401});await global.db.query('UPDATE sessions SET mfa_verified=TRUE WHERE token_hash=$1',[sessionHash(token)]);await auditSecurity(p.id,'admin.mfa_verified',p.id,{});return{ok:true};}
async function adminMetrics(actorId,token){const a=await roomAuth(actorId,token);requireAdmin(a);const q=await global.db.query(`
 SELECT
  (SELECT COUNT(*)::int FROM players) AS "totalPlayers",
  (SELECT COUNT(*)::int FROM players WHERE created_at>=NOW()-INTERVAL '24 hours') AS "new24h",
  (SELECT COUNT(*)::int FROM players WHERE created_at>=NOW()-INTERVAL '7 days') AS "new7d",
  (SELECT COUNT(*)::int FROM online_presence WHERE last_seen>=NOW()-INTERVAL '90 seconds') AS "onlineNow",
  (SELECT COUNT(*)::int FROM online_presence WHERE last_seen>=NOW()-INTERVAL '24 hours') AS "active24h",
  (SELECT COUNT(*)::int FROM players WHERE vip_level>0) AS "vipPlayers",
  (SELECT COUNT(*)::int FROM players WHERE banned_permanent=TRUE) AS "permanentBans",
  (SELECT COUNT(*)::int FROM players WHERE banned_permanent=FALSE AND banned_until>NOW()) AS "temporaryBans",
  (SELECT COUNT(*)::int FROM background_claims) AS "backgroundClaims",
  (SELECT COUNT(*)::int FROM rooms) AS "rooms",
  (SELECT COUNT(*)::int FROM chat_messages WHERE created_at>=NOW()-INTERVAL '24 hours') AS "messages24h",
  (SELECT COUNT(*)::int FROM anti_cheat_runs) AS "gamesRecorded",
  (SELECT COUNT(*)::int FROM anti_cheat_runs WHERE created_at>=NOW()-INTERVAL '24 hours') AS "games24h",
  (SELECT COUNT(*)::int FROM anti_cheat_runs WHERE flagged=TRUE AND created_at>=NOW()-INTERVAL '24 hours') AS "antiCheatFlags24h",
  (SELECT COUNT(*)::int FROM anti_cheat_runs WHERE flagged=TRUE AND created_at>=NOW()-INTERVAL '7 days') AS "antiCheatFlags7d",
  (SELECT COALESCE(ROUND(AVG(score)::numeric,1),0) FROM anti_cheat_runs WHERE created_at>=NOW()-INTERVAL '24 hours') AS "avgScore24h",
  (SELECT COUNT(*)::int FROM security_audit WHERE action='auth.login_success' AND created_at>=NOW()-INTERVAL '24 hours') AS "loginSuccess24h",
  (SELECT COUNT(*)::int FROM security_audit WHERE action='auth.login_failure' AND created_at>=NOW()-INTERVAL '24 hours') AS "loginFailure24h",
  (SELECT COUNT(*)::int FROM security_audit WHERE action LIKE 'moderation.ban_%' AND created_at>=NOW()-INTERVAL '7 days') AS "bans7d",
  (SELECT COUNT(*)::int FROM security_audit WHERE action='admin.unban' AND created_at>=NOW()-INTERVAL '7 days') AS "unbans7d",
  (SELECT COUNT(*)::int FROM online_presence op JOIN players p ON p.id=op.player_id WHERE p.role='admin' AND op.last_seen>=NOW()-INTERVAL '90 seconds') AS "adminsOnline"`);
 const countries=await global.db.query('SELECT country,COUNT(*)::int count FROM players GROUP BY country ORDER BY count DESC,country ASC LIMIT 8');
 const vip=await global.db.query('SELECT vip_level AS level,COUNT(*)::int count FROM players WHERE vip_level>0 GROUP BY vip_level ORDER BY vip_level');
 return{...q.rows[0],uptimeSeconds:Math.floor(process.uptime()),countries:countries.rows,vipBreakdown:vip.rows};
}
async function adminBans(actorId,token,query=''){const a=await roomAuth(actorId,token);requireAdmin(a);const q=String(query||'').trim().slice(0,40);const params=[];let filter="WHERE (p.banned_permanent=TRUE OR p.banned_until>NOW())";if(q){params.push('%'+q+'%');filter+=' AND (p.name ILIKE $1 OR p.name_key ILIKE $1)';}const r=await global.db.query('SELECT p.id,p.name,p.country,p.role,p.vip_level AS "vipLevel",p.banned_permanent AS "permanent",p.banned_until AS "until",p.ban_reason AS "reason" FROM players p '+filter+' ORDER BY p.banned_permanent DESC,p.banned_until DESC NULLS LAST,p.name ASC LIMIT 200',params);return{bans:r.rows};}
async function adminUnban(actorId,token,targetId){const a=await roomAuth(actorId,token);requireAdmin(a);targetId=await resolveTarget(targetId);const r=await global.db.query('UPDATE players SET banned_permanent=FALSE,banned_until=NULL,ban_reason=NULL,updated_at=NOW() WHERE id=$1 RETURNING id,name',[targetId]);if(!r.rowCount)throw Object.assign(new Error('Jogador não encontrado.'),{status:404});await auditSecurity(a.id,'admin.unban',targetId,{});return{ok:true,player:r.rows[0]};}
const STANDARD_PIXEL_COLORS=['#ffffff','#e53935','#ff7a2f','#ffd43b','#7bdc5a','#39d98a','#00d4ff','#3b82f6','#6f5cff','#b66cff','#ff4fd8','#94a3b8'];
function claimLimitForVip(vip){return Number(vip)>=6?12:Math.max(1,Math.min(6,Number(vip||0)+1));}
function validClaimColor(v){const s=String(v||'').toLowerCase();return /^#[0-9a-f]{6}$/i.test(s)||s==='rainbow';}
async function backgroundPalette(id,token){
  const p=await roomAuth(id,token),r=await ranked(),worldRank=r.world.get(p.id)||9999,countryRank=r.country.get(p.id)||9999;
  const ranking=[...new Set(paletteFor({worldRank,countryRank}).map(v=>String(v).toLowerCase()))];
  return{standard:STANDARD_PIXEL_COLORS,vip:Number(p.vipLevel||0)>0?VIP_COLORS:[],ranking,worldRank,countryRank,custom:true};
}
async function listBackgroundClaims(){if(!dbReady)return[];const r=await global.db.query('SELECT bc.x,bc.y,bc.color,bc.owner_id AS "ownerId",p.name AS "ownerName",p.country,bc.created_at AS "createdAt" FROM background_claims bc JOIN players p ON p.id=bc.owner_id ORDER BY bc.created_at ASC LIMIT 10000');return r.rows;}
async function claimBackgroundTile(id,token,x,y,color){const p=await roomAuth(id,token),gx=Math.floor(Number(x)),gy=Math.floor(Number(y)),col=String(color||'').toLowerCase();if(!Number.isInteger(gx)||!Number.isInteger(gy)||gx<0||gy<0||gx>1000||gy>1000)throw Object.assign(new Error('Quadrado inválido.'),{status:400});if(!validClaimColor(col))throw Object.assign(new Error('Cor inválida.'),{status:400});if(col==='rainbow'){const ranks=await ranked();if((ranks.world.get(p.id)||9999)!==1)throw Object.assign(new Error('RAINBOW é exclusivo do TOP 1 mundial.'),{status:403});}const existing=await global.db.query('SELECT owner_id FROM background_claims WHERE x=$1 AND y=$2',[gx,gy]);if(existing.rowCount&&existing.rows[0].owner_id!==p.id)throw Object.assign(new Error('Este quadrado já pertence a outro jogador.'),{status:409});if(!existing.rowCount){const count=await global.db.query('SELECT COUNT(*)::int count FROM background_claims WHERE owner_id=$1',[p.id]);const limit=claimLimitForVip(p.vipLevel);if(count.rows[0].count>=limit)throw Object.assign(new Error('Já atingiste o teu limite de quadrados ('+limit+').'),{status:403});await global.db.query('INSERT INTO background_claims(x,y,owner_id,color) VALUES($1,$2,$3,$4)',[gx,gy,p.id,col]);}else await global.db.query('UPDATE background_claims SET color=$1,updated_at=NOW() WHERE x=$2 AND y=$3 AND owner_id=$4',[col,gx,gy,p.id]);return{ok:true,x:gx,y:gy,color:col,ownerId:p.id,ownerName:p.name,limit:claimLimitForVip(p.vipLevel)};}
async function adminClearBackground(actorId,token,x,y,allOwner=false){const a=await roomAuth(actorId,token);requireAdmin(a);const gx=Math.floor(Number(x)),gy=Math.floor(Number(y));const q=await global.db.query('SELECT owner_id FROM background_claims WHERE x=$1 AND y=$2',[gx,gy]);if(!q.rowCount)return{ok:true,removed:0};const ownerId=q.rows[0].owner_id;const r=allOwner?await global.db.query('DELETE FROM background_claims WHERE owner_id=$1 RETURNING x',[ownerId]):await global.db.query('DELETE FROM background_claims WHERE x=$1 AND y=$2 RETURNING x',[gx,gy]);return{ok:true,removed:r.rowCount,ownerId};}
async function createRoom(id,token,name,maxPlayers){const p=await roomAuth(id,token),n=String(name||'').trim(),size=Number(maxPlayers),vip=vipLevelOf(p);if(!validRoomName(n))throw Object.assign(new Error('Nome da sala inválido. Use 2–24 letras, números, espaços, hífen ou underscore.'),{status:400});if(!validRoomSize(size))throw Object.assign(new Error('Tamanho de sala inválido.'),{status:400});const maxAllowed=vip>=4?50:vip>=1?20:8;if(size>maxAllowed)throw Object.assign(new Error(vip?'O teu nível VIP permite no máximo '+maxAllowed+' jogadores por sala.':'Jogadores sem VIP podem criar salas até 8 jogadores.'),{status:403});if(dbReady){for(let i=0;i<10;i++){const rid=crypto.randomUUID(),c=code(),client=await global.db.connect();try{await client.query('BEGIN');const r=await client.query('INSERT INTO rooms(id,code,name,max_players,owner_id) VALUES($1,$2,$3,$4,$5) RETURNING id,code,name,max_players',[rid,c,n,size,id]);await client.query('INSERT INTO room_members(room_id,player_id) VALUES($1,$2)',[rid,id]);await client.query('COMMIT');return publicRoom({...r.rows[0],owner_name:p.name},1);}catch(e){try{await client.query('ROLLBACK')}catch(_){}if(e.code!=='23505')throw e;}finally{client.release();}}}let c=code();while([...memoryRooms.values()].some(r=>r.code===c))c=code();const r={id:crypto.randomUUID(),code:c,name:n,maxPlayers:size,ownerId:id,ownerName:p.name};memoryRooms.set(r.id,r);memoryMembers.set(r.id,new Set([id]));return publicRoom(r,1);}
async function listRooms(id,token){await roomAuth(id,token);if(dbReady){const r=await global.db.query(`SELECT r.id,r.code,r.name,r.max_players,r.owner_id,p.name owner_name,COUNT(rm.player_id)::int member_count FROM rooms r JOIN room_members mine ON mine.room_id=r.id AND mine.player_id=$1 JOIN players p ON p.id=r.owner_id LEFT JOIN room_members rm ON rm.room_id=r.id GROUP BY r.id,p.name ORDER BY r.created_at DESC`,[id]);return r.rows.map(x=>publicRoom(x,x.member_count));}const out=[];for(const r of memoryRooms.values()){const m=memoryMembers.get(r.id)||new Set();if(m.has(id))out.push(publicRoom(r,m.size));}return out;}
async function joinRoom(id,token,codeInput){await roomAuth(id,token);const c=String(codeInput||'').trim().toUpperCase();if(!/^[A-Z0-9]{5,6}$/.test(c))throw Object.assign(new Error('Código de sala inválido.'),{status:400});if(dbReady){const client=await global.db.connect();try{await client.query('BEGIN');const q=await client.query('SELECT r.id,r.code,r.name,r.max_players,r.owner_id,p.name owner_name FROM rooms r JOIN players p ON p.id=r.owner_id WHERE r.code=$1 FOR UPDATE',[c]);const r=q.rows[0];if(!r)throw Object.assign(new Error('Sala não encontrada.'),{status:404});const mine=await client.query('SELECT 1 FROM room_members WHERE room_id=$1 AND player_id=$2',[r.id,id]);const count=await client.query('SELECT COUNT(*)::int count FROM room_members WHERE room_id=$1',[r.id]);if(!mine.rowCount&&count.rows[0].count>=r.max_players)throw Object.assign(new Error('Esta sala já está cheia.'),{status:409});if(!mine.rowCount)await client.query('INSERT INTO room_members(room_id,player_id) VALUES($1,$2)',[r.id,id]);await client.query('COMMIT');return publicRoom(r,count.rows[0].count+(mine.rowCount?0:1));}catch(e){try{await client.query('ROLLBACK')}catch(_){}throw e;}finally{client.release();}}const r=[...memoryRooms.values()].find(x=>x.code===c);if(!r)throw Object.assign(new Error('Sala não encontrada.'),{status:404});const m=memoryMembers.get(r.id)||new Set();if(!m.has(id)&&m.size>=r.maxPlayers)throw Object.assign(new Error('Esta sala já está cheia.'),{status:409});m.add(id);memoryMembers.set(r.id,m);return publicRoom(r,m.size);}
async function leaveRoom(id,token,roomId){await roomAuth(id,token);if(dbReady){await global.db.query('DELETE FROM room_members WHERE room_id=$1 AND player_id=$2',[roomId,id]);return{ok:true};}const m=memoryMembers.get(roomId);if(m)m.delete(id);return{ok:true};}
async function abandonRoom(id,token,roomId){await roomAuth(id,token);if(dbReady){await global.db.query('DELETE FROM room_members WHERE room_id=$1 AND player_id=$2',[roomId,id]);return{ok:true};}const m=memoryMembers.get(roomId);if(m)m.delete(id);return{ok:true};}
async function roomRankings(id,token,roomId){
  await roomAuth(id,token);
  const ranks=await ranked();
  if(dbReady){
    const mine=await global.db.query('SELECT 1 FROM room_members WHERE room_id=$1 AND player_id=$2',[roomId,id]);
    if(!mine.rowCount)throw Object.assign(new Error('Não pertences a esta sala.'),{status:403});
    const r=await global.db.query(`SELECT p.id,p.name,p.country,rm.best_score AS score,p.visual_name AS "visualName",p.name_color AS "nameColor",p.name_effect AS "nameEffect",p.vip_level AS "vipLevel",p.letter_styles AS "letterStyles",p.tag_global_color AS "tagGlobalColor",p.tag_country_color AS "tagCountryColor",rm.score_updated_at AS "scoreUpdatedAt",rm.joined_at AS "joinedAt" FROM room_members rm JOIN players p ON p.id=rm.player_id WHERE rm.room_id=$1 ORDER BY rm.best_score DESC,rm.score_updated_at ASC NULLS LAST,rm.joined_at ASC`,[roomId]);
    return r.rows.map((p,i)=>({...p,score:Number(p.score||0),worldRank:ranks.world.get(p.id)||9999,countryRank:ranks.country.get(p.id)||9999,letterStyles:parseLetterStyles(p.letterStyles),tagGlobalColor:p.tagGlobalColor||'#e53935',tagCountryColor:p.tagCountryColor||'#ff7a2f',roomRank:i+1}));
  }
  const m=memoryMembers.get(roomId)||new Set(),arr=[...m].map(x=>memoryPlayers.get(x)).filter(Boolean);
  return arr.map((p,i)=>({id:p.id,name:p.name,country:p.country,score:0,visualName:p.visualName,nameColor:p.nameColor,nameEffect:p.nameEffect,vipLevel:Number(p.vipLevel||0),letterStyles:p.letterStyles||[],tagGlobalColor:p.tagGlobalColor||'#e53935',tagCountryColor:p.tagCountryColor||'#ff7a2f',worldRank:ranks.world.get(p.id)||9999,countryRank:ranks.country.get(p.id)||9999,roomRank:i+1}));
}
function paletteFor(rank){if(rank.worldRank===1)return [...ALL_COLORS,'rainbow'];if(rank.worldRank===2||rank.worldRank===3)return WORLD_COLORS;if(rank.countryRank===1)return COUNTRY_TOP_COLORS;if(rank.countryRank===2||rank.countryRank===3)return COUNTRY_OTHER_COLORS;return[];}
async function customize(id,token,data){const auth=await roomAuth(id,token),r=await ranked(),p=r.rows.find(x=>x.id===id);if(!p)throw Object.assign(new Error('Jogador não encontrado.'),{status:404});const worldRank=r.world.get(id),countryRank=r.country.get(id),vip=vipLevelOf(auth),allowed=paletteFor({worldRank,countryRank});let color=String(data.color||p.nameColor||'#ffffff').toLowerCase();let effect=String(data.effect||p.nameEffect||'none');let visual=String(data.visualName??p.visualName??p.name).trim();let letterStyles=parseLetterStyles(data.letterStyles);let tagGlobalColor=String(data.tagGlobalColor??p.tagGlobalColor??'#39d98a').toLowerCase();let tagCountryColor=String(data.tagCountryColor??p.tagCountryColor??'#ffd43b').toLowerCase();if(vip>0){if(!validVipVisualName(visual))throw Object.assign(new Error('Nome visual VIP inválido. Usa até 16 caracteres.'),{status:400});if(color==='rainbow'&&worldRank!==1)throw Object.assign(new Error('A cor Arco-Íris é exclusiva do TOP 1 mundial.'),{status:403});const normalAllowed=ALL_COLORS.map(x=>x.toLowerCase());const vipAllowed=[...new Set([...VIP_COLORS,...normalAllowed])];if(color==='rainbow'){if(worldRank!==1)throw Object.assign(new Error('A cor Arco-Íris é exclusiva do TOP 1 mundial.'),{status:403});}else if(!vipAllowed.includes(color))throw Object.assign(new Error('Essa cor não está disponível para VIP.'),{status:403});if(!VIP_EFFECTS.includes(effect)&&!EFFECTS.includes(effect))throw Object.assign(new Error('Efeito inválido.'),{status:400});if(letterStyles.length>32)throw Object.assign(new Error('Demasiados estilos de letras.'),{status:400});letterStyles=letterStyles.map(s=>({color:String(s&&s.color!=null?s.color:color).toLowerCase(),effect:String(s&&s.effect!=null?s.effect:'none')}));for(const s of letterStyles){const letterColor=String(s.color||'').toLowerCase();if(letterColor==='rainbow'){if(worldRank!==1)throw Object.assign(new Error('Arco-Íris por letra é exclusivo do TOP 1 mundial.'),{status:403});}else if(!VIP_COLORS.map(x=>x.toLowerCase()).includes(letterColor)&&!normalAllowed.includes(letterColor))throw Object.assign(new Error('Cor de letra VIP inválida.'),{status:403});if(!VIP_EFFECTS.includes(s.effect)&&!EFFECTS.includes(s.effect))throw Object.assign(new Error('Efeito de letra VIP inválido.'),{status:400});}const tagAllowed=[...normalAllowed,'rainbow'];if(vip===6){if(!tagAllowed.includes(tagGlobalColor)||!tagAllowed.includes(tagCountryColor))throw Object.assign(new Error('Cor da TAG inválida.'),{status:400});if((tagGlobalColor==='rainbow'||tagCountryColor==='rainbow')&&worldRank!==1)throw Object.assign(new Error('A cor Arco-Íris é exclusiva do TOP 1 mundial.'),{status:403});}else{tagGlobalColor=p.tagGlobalColor||'#e53935';tagCountryColor=p.tagCountryColor||'#ff7a2f';}}else{if(!allowed.map(x=>x.toLowerCase()).includes(color))throw Object.assign(new Error('Essa cor não está disponível para a tua posição.'),{status:403});if(!EFFECTS.includes(effect))throw Object.assign(new Error('Efeito inválido.'),{status:400});if(worldRank===1){if(!validName(visual))throw Object.assign(new Error('O nome visual só pode ter 3–8 letras ou números.'),{status:400});}else visual=p.visualName||p.name;const canEffect=worldRank===1||worldRank===2||worldRank===3||countryRank===1||countryRank===2||countryRank===3;if(!canEffect)effect='none';letterStyles=[];tagGlobalColor=p.tagGlobalColor||'#e53935';tagCountryColor=p.tagCountryColor||'#ff7a2f';}if(dbReady){const q=await global.db.query('UPDATE players SET visual_name=$1,name_color=$2,name_effect=$3,letter_styles=$4,tag_global_color=$5,tag_country_color=$6,updated_at=NOW() WHERE id=$7 RETURNING id,name,country,best_score AS "bestScore",visual_name AS "visualName",name_color AS "nameColor",name_effect AS "nameEffect",vip_level AS "vipLevel",letter_styles AS "letterStyles",tag_global_color AS "tagGlobalColor",tag_country_color AS "tagCountryColor"',[visual,color,effect,JSON.stringify(letterStyles),tagGlobalColor,tagCountryColor,id]);return{player:publicPlayer(q.rows[0]),worldRank,countryRank};}const m=memoryPlayers.get(id);m.visualName=visual;m.nameColor=color;m.nameEffect=effect;m.letterStyles=letterStyles;m.tagGlobalColor=tagGlobalColor;m.tagCountryColor=tagCountryColor;return{player:publicPlayer(m),worldRank,countryRank};}
async function buyVip(id,token){const p=await roomAuth(id,token),current=vipLevelOf(p);const next=Math.min(current+1,6);if(dbReady){const q=await global.db.query('UPDATE players SET vip_level=$1,updated_at=NOW() WHERE id=$2 RETURNING id,name,country,best_score AS "bestScore",visual_name AS "visualName",name_color AS "nameColor",name_effect AS "nameEffect",vip_level AS "vipLevel",letter_styles AS "letterStyles",tag_global_color AS "tagGlobalColor",tag_country_color AS "tagCountryColor"',[next,id]);return{player:publicPlayer(q.rows[0]),purchased:true,level:next};}p.vipLevel=next;return{player:publicPlayer(p),purchased:true,level:next};}
function cleanChatMessage(v){
  return String(v??'').normalize('NFC').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'').trim();
}
function checkChatRate(id){
  const now=Date.now(),windowMs=10000,max=5;
  const recent=(chatRate.get(id)||[]).filter(t=>now-t<windowMs);
  if(recent.length>=max)throw Object.assign(new Error('Estás a enviar mensagens demasiado depressa. Espera alguns segundos.'),{status:429});
  recent.push(now);chatRate.set(id,recent);
  if(chatRate.size>5000)for(const [key,times] of chatRate)if(times.every(t=>now-t>=windowMs))chatRate.delete(key);
}
async function sendChatMessage(id,token,channel,message){
  const p=await roomAuth(id,token),text=cleanChatMessage(message);
  if(!['global','national'].includes(channel))throw Object.assign(new Error('Canal de chat inválido.'),{status:400});
  if(!text)throw Object.assign(new Error('Escreve uma mensagem antes de enviar.'),{status:400});
  if([...text].length>300)throw Object.assign(new Error('A mensagem pode ter no máximo 300 caracteres.'),{status:400});
  checkChatRate(p.id);
  if(dbReady){
    await global.db.query('INSERT INTO chat_messages(id,player_id,channel,message) VALUES($1,$2,$3,$4)',[crypto.randomUUID(),p.id,channel,text]);
  }else{
    memoryMessages.push({id:crypto.randomUUID(),playerId:p.id,channel,message:text,createdAt:new Date().toISOString()});
  }
  return {ok:true};
}
async function getChatMessages(id,token,channel){
  const p=await roomAuth(id,token);
  if(!['global','national'].includes(channel))throw Object.assign(new Error('Canal de chat inválido.'),{status:400});
  if(dbReady){
    const params=channel==='national'?[p.country]:[];
    const where=channel==='national'?'WHERE cm.channel=\'national\' AND pl.country=$1':"WHERE cm.channel='global'";
    const r=await global.db.query(`SELECT cm.id,cm.channel,cm.message,cm.created_at AS "createdAt",
      pl.id AS "playerId",pl.name,pl.country,pl.visual_name AS "visualName",pl.name_color AS "nameColor",
      pl.name_effect AS "nameEffect",pl.vip_level AS "vipLevel",pl.letter_styles AS "letterStyles",
      pl.tag_global_color AS "tagGlobalColor",pl.tag_country_color AS "tagCountryColor",
      pl.avatar,pl.avatar_border AS "avatarBorder",pl.role
      FROM chat_messages cm JOIN players pl ON pl.id=cm.player_id ${where}
      ORDER BY cm.created_at DESC LIMIT 50`,params);
    const ranks=await ranked(),rows=r.rows.reverse();
    return rows.map(x=>({...x,letterStyles:parseLetterStyles(x.letterStyles),worldRank:ranks.world.get(x.playerId)||9999,countryRank:ranks.country.get(x.playerId)||9999,avatar:x.avatar||'default'}));
  }
  const rows=memoryMessages.filter(m=>m.playerId&&m.channel===channel&&(channel!=='national'||(memoryPlayers.get(m.playerId)?.country===p.country))).slice(-50);
  const ranks=await ranked();
  return rows.map(m=>{const pl=memoryPlayers.get(m.playerId);return pl?{id:m.id,channel:m.channel,message:m.message,createdAt:m.createdAt,playerId:pl.id,name:pl.name,country:pl.country,visualName:pl.visualName,nameColor:pl.nameColor,nameEffect:pl.nameEffect,vipLevel:Number(pl.vipLevel||0),letterStyles:pl.letterStyles||[],tagGlobalColor:pl.tagGlobalColor||'#e53935',tagCountryColor:pl.tagCountryColor||'#ff7a2f',worldRank:ranks.world.get(pl.id)||9999,countryRank:ranks.country.get(pl.id)||9999,avatar:'default'}:null}).filter(Boolean);
}
async function saveMessage(type,data,ip=''){const rateKey='feedback:'+String(ip||'unknown');if(!boundedRate(feedbackRate,rateKey,8,60*60*1000))throw Object.assign(new Error('Demasiados pedidos. Tenta novamente mais tarde.'),{status:429});const name=String(data.name||'').trim().slice(0,80),email=String(data.email||'').trim().slice(0,200),subject=String(data.subject||'').trim().slice(0,160),message=String(data.message||'').trim().slice(0,5000);if(!message)throw Object.assign(new Error('Escreve uma mensagem antes de enviar.'),{status:400});if(dbReady){await global.db.query('INSERT INTO messages(id,type,name,email,subject,message) VALUES($1,$2,$3,$4,$5,$6)',[crypto.randomUUID(),type,name,email,subject,message]);}else memoryMessages.push({id:crypto.randomUUID(),type,name,email,subject,message,createdAt:new Date().toISOString()});return{ok:true};}
function clientIp(req) {
  const peer = req.socket.remoteAddress || '';
  const localProxy = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(peer);
  const forwarded = String(req.headers['x-real-ip'] || '').trim();
  // Only trust X-Real-IP overwritten by the local Nginx proxy.
  if (localProxy && require('node:net').isIP(forwarded)) return forwarded;
  return peer;
}
async function handleApi(req,res,url){
 try{
  const paypalWebhook=req.method==='POST'&&url.pathname==='/api/paypal/webhook';
  if(['POST','PUT','PATCH','DELETE'].includes(req.method)&&!paypalWebhook){
    const fetchSite=String(req.headers['sec-fetch-site']||'').toLowerCase();
    if(fetchSite==='cross-site')return json(res,403,{error:'Origem não autorizada.'});
    const targetHost=requestHost(req);
    if(!ALLOWED_HOSTS.has(targetHost))return json(res,403,{error:'Host não autorizado.'});
    const source=String(req.headers.origin||req.headers.referer||'').trim();
    if(!source)return json(res,403,{error:'Origem não autorizada.'});
    let ok=false;try{ok=new URL(source).hostname.toLowerCase()===targetHost}catch(_){}
    if(!ok)return json(res,403,{error:'Origem não autorizada.'});
  }
  const cookieToken=parseCookies(req)[SESSION_COOKIE];
  if(cookieToken)url.searchParams.set('token',cookieToken);
  if(req.method==='GET'&&url.pathname==='/api/chat'){return json(res,200,{channel:url.searchParams.get('channel')||'global',messages:await getChatMessages(url.searchParams.get('id'),url.searchParams.get('token'),url.searchParams.get('channel')||'global')});}
  if(req.method==='POST'&&url.pathname==='/api/chat'){const d=await body(req);return json(res,201,await sendChatMessage(d.id,d.token,d.channel,d.message));}
  if(req.method==='GET'&&url.pathname==='/api/player-rank'){return json(res,200,await playerRanks(url.searchParams.get('id'),url.searchParams.get('token')));}
  if(req.method==='GET'&&url.pathname==='/api/rankings'){const c=url.searchParams.get('country')||'';if(c&&!validCountry(c))return json(res,400,{error:'País inválido.'});return json(res,200,{country:c||null,...await rankings(c||null,url.searchParams.get('page')||1)});}
  if(req.method==='POST'&&url.pathname==='/api/auth/register'){const d=await body(req);d.ip=clientIp(req);try{const out=await authService.createAccount({db:global.db,normalizeName,validName,validCountry,publicPlayer,authenticate},d);await auditSecurity(out.player?.id||null,'auth.register',out.player?.id||null,{ipHash:crypto.createHash('sha256').update(String(d.ip||'')).digest('hex')});setSessionCookie(res,out.session,false);return json(res,201,{player:out.player});}catch(e){await auditSecurity(null,'auth.register_failure',null,{ipHash:crypto.createHash('sha256').update(String(d.ip||'')).digest('hex')});throw e;}}
  if(req.method==='POST'&&url.pathname==='/api/auth/login'){const d=await body(req);d.ip=clientIp(req);const ipHash=crypto.createHash('sha256').update(String(d.ip||'')).digest('hex');const emailHash=crypto.createHash('sha256').update(String(d.email||'').trim().toLowerCase()).digest('hex');try{const out=await authService.loginAccount({db:global.db,authenticate,publicPlayer},d);await auditSecurity(out.player?.id||null,'auth.login_success',out.player?.id||null,{ipHash,emailHash});setSessionCookie(res,out.session,!!d.rememberMe&&out.player?.role!=='admin');return json(res,200,{player:out.player});}catch(e){await auditSecurity(null,'auth.login_failure',null,{ipHash,emailHash});throw e;}}
  if(req.method==='POST'&&url.pathname==='/api/auth/logout'){const out=await authService.logout(global.db,parseCookies(req)[SESSION_COOKIE]);clearSessionCookie(res);res.setHeader('Clear-Site-Data','"cache", "cookies", "storage"');return json(res,200,out);}
  if(req.method==='POST'&&url.pathname==='/api/auth/password-reset/request'){const d=await body(req);d.ip=clientIp(req);return json(res,200,await authService.requestReset(global.db,d));}
  if(req.method==='POST'&&url.pathname==='/api/auth/password-reset/confirm'){const d=await body(req);return json(res,200,await authService.resetPassword(global.db,d));}
  if(req.method==='POST'&&url.pathname==='/api/players'){return json(res,410,{error:'Este endpoint foi substituído pelo sistema de contas EIXO.'});}
  if(req.method==='POST'&&url.pathname==='/api/game/start'){const d=await body(req);return json(res,201,await startGameRun(d.id,d.token,clientIp(req)));}
  if(req.method==='POST'&&url.pathname==='/api/scores'){const d=await body(req);return json(res,200,await submitScore(d.id,d.token,d.score,d.telemetry,d.runId,d.roomId||null));}
  if(req.method==='GET'&&url.pathname==='/api/auth/me'){const p=await authenticateSession(url.searchParams.get('token'));if(p&&(p.bannedPermanent||(p.bannedUntil&&new Date(p.bannedUntil)>new Date())))return json(res,423,{error:'Conta bloqueada.',ban:{permanent:!!p.bannedPermanent,until:p.bannedUntil||null,reason:p.banReason||null}});return json(res,p?200:401,p?{player:publicPlayer(p)}:{error:'Sessão inválida.'});}
  if(req.method==='GET'&&url.pathname==='/api/me'){const p=await authenticate(url.searchParams.get('id'),url.searchParams.get('token'));if(p&&(p.bannedPermanent||(p.bannedUntil&&new Date(p.bannedUntil)>new Date())))return json(res,423,{error:'Conta bloqueada.',ban:{permanent:!!p.bannedPermanent,until:p.bannedUntil||null,reason:p.banReason||null}});return json(res,p?200:401,p?{player:publicPlayer(p)}:{error:'Sessão inválida.'});}
  if(req.method==='GET'&&url.pathname==='/api/profile/ranks'){const p=await roomAuth(url.searchParams.get('id'),url.searchParams.get('token'));const r=await ranked();return json(res,200,{worldRank:r.world.get(p.id)||null,countryRank:r.country.get(p.id)||null});}
  if(req.method==='POST'&&url.pathname==='/api/profile/customize'){const d=await body(req);return json(res,200,await customize(d.id,d.token,d));}
  if(req.method==='POST'&&url.pathname==='/api/profile/account'){const d=await body(req);return json(res,200,await updateAccountProfile(d.id,d.token,d));}
  if(req.method==='GET'&&url.pathname==='/api/paypal/store'){const p=await roomAuth(url.searchParams.get('id'),url.searchParams.get('token'));return json(res,200,paypalService.publicStore(p));}
  if(req.method==='POST'&&url.pathname==='/api/paypal/orders/create'){const d=await body(req);const p=await roomAuth(d.id,d.token);const paymentType=String(d.type||'vip').toLowerCase()==='donation'?'donation':'vip';const paypalCreateLimit=paypalService.mode()==='sandbox'?30:6,paypalCreateKey=paymentType==='donation'?'create:'+p.id+':donation':'create:'+p.id+':vip-'+Number(p.vipLevel||0);if(!boundedRate(paypalRate,paypalCreateKey,paypalCreateLimit,10*60*1000))throw Object.assign(new Error(paymentType==='donation'?'Demasiadas tentativas de apoio. Tenta novamente dentro de alguns minutos.':'Demasiadas tentativas de pagamento neste nível VIP. Tenta novamente dentro de alguns minutos.'),{status:429});const out=await paypalService.createOrder(global.db,p,{type:paymentType,amount:d.amount});await auditSecurity(p.id,'payment.paypal_order_created',p.id,{orderId:out.orderId,type:out.type,level:out.level,price:out.price,currency:out.currency});return json(res,201,out);}
  if(req.method==='POST'&&url.pathname==='/api/paypal/orders/status'){const d=await body(req);const p=await roomAuth(d.id,d.token);const orderId=d.orderId;if(!boundedRate(paypalRate,'status:'+p.id+':'+orderId,180,10*60*1000))throw Object.assign(new Error('Demasiadas verificações de pagamento. Aguarda um momento.'),{status:429});return json(res,200,await paypalService.orderStatus(global.db,p,orderId));}
  if(req.method==='POST'&&url.pathname==='/api/paypal/orders/capture'){const d=await body(req);const p=await roomAuth(d.id,d.token);const paypalCaptureLimit=paypalService.mode()==='sandbox'?60:12;if(!boundedRate(paypalRate,'capture:'+p.id,paypalCaptureLimit,10*60*1000))throw Object.assign(new Error('Demasiadas tentativas de captura. Tenta novamente dentro de alguns minutos.'),{status:429});const out=await paypalService.captureOrder(global.db,p,d.orderId);paypalRate.delete(out.type==='donation'?'create:'+p.id+':donation':'create:'+p.id+':vip-'+Number(p.vipLevel||0));paypalRate.delete('capture:'+p.id);await auditSecurity(p.id,'payment.paypal_captured',p.id,{orderId:out.orderId||d.orderId,type:out.type,level:out.level,captureId:out.captureId||null});return json(res,200,out);}
  if(req.method==='POST'&&url.pathname==='/api/paypal/webhook'){const event=await body(req);return json(res,200,await paypalService.handleWebhook(global.db,req.headers,event));}
  if(req.method==='POST'&&url.pathname==='/api/admin/vip'){const d=await body(req);return json(res,200,await adminSetVip(d.id,d.token,d.targetId,d.level));}
  if(req.method==='POST'&&url.pathname==='/api/admin/role'){const d=await body(req);return json(res,200,await adminSetRole(d.id,d.token,d.targetId,String(d.role||'')));}
  if(req.method==='POST'&&url.pathname==='/api/moderation/ban'){const d=await body(req);return json(res,200,await moderateBan(d.id,d.token,d.targetId,d.hours,!!d.permanent,d.reason));}
  if(req.method==='POST'&&url.pathname==='/api/moderation/kick'){const d=await body(req);return json(res,200,await kickPlayer(d.id,d.token,d.targetId));}
  if(req.method==='DELETE'&&url.pathname==='/api/admin/chat'){const d=await body(req);return json(res,200,await deleteChatMessage(d.id,d.token,d.messageId));}
  if(req.method==='GET'&&url.pathname==='/api/admin/anti-cheat'){return json(res,200,await adminAntiCheat(url.searchParams.get('id'),url.searchParams.get('token')));}
  if(req.method==='POST'&&url.pathname==='/api/presence/ping'){const d=await body(req);return json(res,200,await presencePing(d.id,d.token));}
  if(req.method==='GET'&&url.pathname==='/api/admin/mfa/status'){return json(res,200,await adminMfaStatus(url.searchParams.get('id'),url.searchParams.get('token')));}
  if(req.method==='POST'&&url.pathname==='/api/admin/mfa/setup'){const d=await body(req);return json(res,200,await adminMfaSetup(d.id,d.token,d.password));}
  if(req.method==='POST'&&url.pathname==='/api/admin/mfa/enable'){const d=await body(req);return json(res,200,await adminMfaEnable(d.id,d.token,d.code));}
  if(req.method==='POST'&&url.pathname==='/api/admin/mfa/verify'){const d=await body(req);return json(res,200,await adminMfaVerify(d.id,d.token,d.code));}
  if(req.method==='GET'&&url.pathname==='/api/admin/metrics'){return json(res,200,await adminMetrics(url.searchParams.get('id'),url.searchParams.get('token')));}
  if(req.method==='GET'&&url.pathname==='/api/admin/bans'){return json(res,200,await adminBans(url.searchParams.get('id'),url.searchParams.get('token'),url.searchParams.get('q')||''));}
  if(req.method==='POST'&&url.pathname==='/api/admin/unban'){const d=await body(req);return json(res,200,await adminUnban(d.id,d.token,d.targetId));}
  if(req.method==='GET'&&url.pathname==='/api/background/claims'){return json(res,200,{claims:await listBackgroundClaims()});}
  if(req.method==='GET'&&url.pathname==='/api/background/palette'){return json(res,200,await backgroundPalette(url.searchParams.get('id'),url.searchParams.get('token')));}
  if(req.method==='POST'&&url.pathname==='/api/background/claim'){const d=await body(req);return json(res,200,await claimBackgroundTile(d.id,d.token,d.x,d.y,d.color));}
  if(req.method==='POST'&&url.pathname==='/api/admin/background/clear'){const d=await body(req);return json(res,200,await adminClearBackground(d.id,d.token,d.x,d.y,!!d.allOwner));}
  if(req.method==='POST'&&url.pathname==='/api/rooms'){const d=await body(req);return json(res,201,{room:await createRoom(d.id,d.token,d.name,d.maxPlayers)});}
  if(req.method==='GET'&&url.pathname==='/api/rooms'){return json(res,200,{rooms:await listRooms(url.searchParams.get('id'),url.searchParams.get('token'))});}
  if(req.method==='POST'&&url.pathname==='/api/rooms/join'){const d=await body(req);return json(res,200,{room:await joinRoom(d.id,d.token,d.code)});}
  if(req.method==='POST'&&url.pathname==='/api/rooms/leave'){const d=await body(req);return json(res,200,await leaveRoom(d.id,d.token,d.roomId));}
  if(req.method==='POST'&&url.pathname==='/api/rooms/abandon'){const d=await body(req);return json(res,200,await abandonRoom(d.id,d.token,d.roomId));}
  if(req.method==='GET'&&url.pathname==='/api/rooms/rankings'){return json(res,200,{players:await roomRankings(url.searchParams.get('id'),url.searchParams.get('token'),url.searchParams.get('roomId'))});}
  if(req.method==='POST'&&url.pathname==='/api/contact'){const d=await body(req);return json(res,201,await saveMessage('contact',d,clientIp(req)));}
  if(req.method==='POST'&&url.pathname==='/api/bugs'){const d=await body(req);return json(res,201,await saveMessage('bug',d,clientIp(req)));}
  return json(res,404,{error:'API endpoint not found.'});
 }catch(e){const status=Number(e.status)||500;if(status>=500){console.error('EIXO API error:',e&&e.stack?e.stack:e);return json(res,500,{error:'Internal server error.'});}return json(res,status,{error:e.message||'Request failed.'});}
}
function serveFile(res,filePath){fs.stat(filePath,(err,st)=>{if(err||!st.isFile())return json(res,404,{error:'Not found'});const ext=path.extname(filePath).toLowerCase(),sourceAsset=['.js','.css'].includes(ext);res.writeHead(200,{...securityHeaders(),'Content-Type':MIME_TYPES[ext]||'application/octet-stream','Cache-Control':['.html','.js','.css'].includes(ext)?'no-store, no-cache, must-revalidate':'public, max-age=3600',...(sourceAsset?{'X-Robots-Tag':'noindex, nofollow, noarchive'}:{})});fs.createReadStream(filePath).pipe(res);});}
const server=http.createServer(async(req,res)=>{try{if(!allowedRequestHost(req))return json(res,421,{error:'Misdirected Request'});const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);if(url.pathname==='/health'||url.pathname==='/healthz')return json(res,200,{ok:true,database:dbReady?'postgresql':'memory'});if(url.pathname.startsWith('/api/'))return handleApi(req,res,url);if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Method Not Allowed'});let pathname=decodeURIComponent(url.pathname);if(pathname==='/')pathname='/index.html';if(!isPublicStaticRequestPath(pathname))return json(res,404,{error:'Not found'});const fp=path.resolve(ROOT,pathname.replace(/^\/+/,''));if(fp!==ROOT&&!fp.startsWith(ROOT+path.sep))return json(res,404,{error:'Not found'});fs.stat(fp,(e,s)=>{if(!e&&s.isFile())return serveFile(res,fp);const hasExt=Boolean(path.extname(pathname));if(hasExt)return json(res,404,{error:'Not found'});return serveFile(res,path.join(ROOT,'index.html'));});}catch(e){console.error(e);json(res,500,{error:'Internal server error'});}});
server.requestTimeout=15000;
server.headersTimeout=10000;
server.keepAliveTimeout=5000;
server.maxHeadersCount=100;
(async()=>{
  try{
    await initDb();
    if(!dbReady&&process.env.ALLOW_MEMORY_DB!=='1')throw new Error('PostgreSQL is required in production.');
    server.listen(PORT,HOST,()=>console.log(`EIXO server listening on ${HOST}:${PORT}`));
  }catch(e){
    console.error('Database initialization failed:',e&&e.message?e.message:e);
    dbReady=false;
    if(process.env.ALLOW_MEMORY_DB==='1')server.listen(PORT,HOST,()=>console.log(`EIXO development server listening on ${HOST}:${PORT} without PostgreSQL`));
    else setTimeout(()=>process.exit(1),100);
  }
})();