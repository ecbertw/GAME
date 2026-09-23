'use strict';
/* Isolated JUMP storage and five-player instances. PULSE tables remain untouched. */
const crypto=require('crypto');
const physics=require('./jump-physics');
const teams=require('./jump-team-server').createService();
setInterval(()=>teams.tick(),1000/60).unref();
const BIOMES=['city','forest','desert','snow'];
const PALETTE=['#ffffff','#e83e45','#ff7a2f','#f1c438','#39b86a','#7bdc5a','#00e5ff','#2f9bd1','#3b82f6','#6f5cff','#a855f7','#ff4fd8','#ff6b9d','#94a3b8','#46535f','#172b3b','#263c5c','#111827'];
const FIXED_APPEARANCE={skin:'#f0c7a2',skinShade:'#dba982',eyes:'#17202a'};
const OUTFIT_DEFAULTS={hair:'#19222d',top:'#172b3b',accent:'#00e5ff',pants:'#263c5c',shoes:'#ffffff',effect:'none'};
const PARTS=['hair','top','accent','pants','shoes','effect'];
const special=(value,label,minVip)=>({value,label,minVip});
const baseColors=PALETTE.map(value=>special(value,value.toUpperCase(),0));
const WARDROBE={
  hair:[
    special('#19222d','PRETO',0),special('#3f2a20','CASTANHO ESCURO',0),special('#754c32','CASTANHO',0),
    special('#d8b05d','LOIRO',0),special('#9aa2ad','CINZENTO',0),special('#e9edf2','BRANCO',0),special('#8f3038','RUIVO',0),
    special('#00f5ff','NEON CIANO',2),special('#ff3cf7','NEON MAGENTA',3),special('#a6ff38','NEON LIMA',4),
    special('#ff6238','PLASMA LARANJA',5),special('rainbow','ARCO-ÍRIS VIP',6)
  ],
  top:[...baseColors,special('#ffd84d','DOURADO',1),special('#00f5ff','NEON CIANO',2),special('#ff3cf7','NEON MAGENTA',3),special('#a6ff38','NEON LIMA',4),special('#ff6238','PLASMA LARANJA',5),special('rainbow','ARCO-ÍRIS VIP',6)],
  accent:[...baseColors,special('#ffe66d','DOURADO',1),special('#56f7ff','GELO ELÉTRICO',2),special('#ff70dc','ROSA LASER',3),special('#b8ff66','BRILHO TÓXICO',4),special('#ff8a4c','SOLAR',5),special('rainbow','ARCO-ÍRIS VIP',6)],
  pants:[...baseColors,special('#5b4bff','VIOLETA REAL',1),special('#00d9ff','AZUL CYBER',2),special('#da4cff','ROXO VOID',3),special('#68ff84','VERDE NEON',4),special('#ff425f','VERMELHO PLASMA',5),special('rainbow','ARCO-ÍRIS VIP',6)],
  shoes:[...baseColors,special('#ffe66d','SOLAS DOURADAS',1),special('#75f8ff','SOLAS DE GELO',2),special('#ff8be8','LUZ ROSA',3),special('#c8ff75','LUZ LIMA',4),special('#ff9a62','LUZ DE FOGO',5),special('rainbow','ARCO-ÍRIS VIP',6)],
  effect:[special('none','NONE',0),special('glow','GLOW',1),special('pulse','PULSE',2),special('spark','SPARKS',3),special('electric','ELECTRIC',4),special('plasma','PLASMA',5),special('cosmic','COSMIC RGB',6)]
};
const DEFAULTS=OUTFIT_DEFAULTS;
const instances=new Map(),sessions=new Map(),activeByPlayer=new Map();
const error=(message,status=400)=>Object.assign(new Error(message),{status});
function validBiome(v){const b=String(v||'forest').toLowerCase();if(!BIOMES.includes(b))throw error('Ambiente inválido.');return b;}
function vipLevel(p){return Math.max(0,Math.min(6,Number(p?.vipLevel)||0));}
function normalizeOutfit(data){
  const raw=data&&typeof data==='object'?data:{};
  return{
    hair:String(raw.hair||OUTFIT_DEFAULTS.hair).toLowerCase(),
    top:String(raw.top||raw.shirt||OUTFIT_DEFAULTS.top).toLowerCase(),
    accent:String(raw.accent||raw.arms||OUTFIT_DEFAULTS.accent).toLowerCase(),
    pants:String(raw.pants||OUTFIT_DEFAULTS.pants).toLowerCase(),
    shoes:String(raw.shoes||OUTFIT_DEFAULTS.shoes).toLowerCase(),
    effect:String(raw.effect||OUTFIT_DEFAULTS.effect).toLowerCase()
  };
}
function validOutfit(data,p){
  const outfit=normalizeOutfit(data),vip=vipLevel(p);
  for(const key of PARTS){
    const option=(WARDROBE[key]||[]).find(x=>x.value===outfit[key]);
    if(!option)throw error('Opção de roupa inválida: '+key);
    if(vip<option.minVip)throw error('Esta opção requer VIP '+option.minVip+'.',403);
  }
  return outfit;
}
function wardrobeFor(p){return{vipLevel:vipLevel(p),parts:WARDROBE,fixedAppearance:FIXED_APPEARANCE};}
async function initDb(db){
  await teams.init(db);
  await db.query('CREATE TABLE IF NOT EXISTS jump_scores(player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,best_score INTEGER NOT NULL DEFAULT 0,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
  await db.query("CREATE TABLE IF NOT EXISTS jump_cosmetics(player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,colors JSONB NOT NULL DEFAULT '{}'::jsonb)");
  await db.query('CREATE TABLE IF NOT EXISTS jump_rooms(id UUID PRIMARY KEY,code VARCHAR(6) UNIQUE NOT NULL,name VARCHAR(24) NOT NULL,biome VARCHAR(12) NOT NULL,max_players INTEGER NOT NULL DEFAULT 5,owner_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
  await db.query('CREATE TABLE IF NOT EXISTS jump_room_members(room_id UUID NOT NULL REFERENCES jump_rooms(id) ON DELETE CASCADE,player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,best_score INTEGER NOT NULL DEFAULT 0,joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(room_id,player_id))');
  // Score v2 is platform-based: each new highest platform is worth 12 points.
  // Existing development scores stored raw height, so migrate them once.
  await db.query('ALTER TABLE jump_scores ADD COLUMN IF NOT EXISTS score_version INTEGER');
  await db.query('UPDATE jump_scores SET best_score=GREATEST(0,FLOOR(best_score/40.0)::int*12),score_version=2 WHERE score_version IS NULL OR score_version<2');
  await db.query('ALTER TABLE jump_scores ALTER COLUMN score_version SET DEFAULT 2');
  await db.query('ALTER TABLE jump_scores ALTER COLUMN score_version SET NOT NULL');
  await db.query('ALTER TABLE jump_room_members ADD COLUMN IF NOT EXISTS score_version INTEGER');
  await db.query('UPDATE jump_room_members SET best_score=GREATEST(0,FLOOR(best_score/40.0)::int*12),score_version=2 WHERE score_version IS NULL OR score_version<2');
  await db.query('ALTER TABLE jump_room_members ALTER COLUMN score_version SET DEFAULT 2');
  await db.query('ALTER TABLE jump_room_members ALTER COLUMN score_version SET NOT NULL');
  await db.query('CREATE INDEX IF NOT EXISTS jump_score_rank_idx ON jump_scores(best_score DESC,updated_at)');
}
function removeSession(run){
  if(!run)return;
  sessions.delete(run.id);
  if(activeByPlayer.get(run.playerId)===run.id)activeByPlayer.delete(run.playerId);
  const inst=instances.get(run.instanceId);
  if(inst){inst.players.delete(run.playerId);if(!inst.players.size)instances.delete(inst.id);}
}
function purge(){
  const now=Date.now();
  for(const run of [...sessions.values()])if(now-run.lastSeen>30000)removeSession(run);
  for(const inst of [...instances.values()])if(!inst.players.size)instances.delete(inst.id);
}
function newInstance(biome,kind,roomId){
  const inst={id:crypto.randomUUID(),biome,kind,roomId:roomId||null,seed:crypto.randomInt(1,2147483647),players:new Map(),platforms:null,epoch:Date.now()};
  inst.platforms=physics.platforms(inst.seed,30);
  instances.set(inst.id,inst);return inst;
}
function findInstance(biome,kind,roomId){
  for(const inst of instances.values()){
    if(inst.kind===kind&&inst.biome===biome&&inst.roomId===(roomId||null)&&inst.players.size<5)return inst;
  }
  return newInstance(biome,kind,roomId);
}
async function getOutfit(db,p){
  const r=await db.query('SELECT colors FROM jump_cosmetics WHERE player_id=$1',[p.id]);
  const normalized=normalizeOutfit(r.rows[0]?.colors||OUTFIT_DEFAULTS);
  // If a player's VIP expired, silently fall back from locked pieces instead
  // of rendering an item they no longer have access to.
  const safe={...normalized};
  for(const key of PARTS){
    const option=(WARDROBE[key]||[]).find(x=>x.value===safe[key]);
    if(!option||vipLevel(p)<option.minVip)safe[key]=OUTFIT_DEFAULTS[key];
  }
  return safe;
}
async function saveOutfit(db,p,d){
  const outfit=validOutfit(d.outfit||d.colors,p);
  await db.query('INSERT INTO jump_cosmetics(player_id,colors) VALUES($1,$2::jsonb) ON CONFLICT(player_id) DO UPDATE SET colors=EXCLUDED.colors',[p.id,JSON.stringify(outfit)]);
  const run=sessions.get(activeByPlayer.get(p.id));if(run)run.outfit=outfit;
  return{ok:true,outfit,...wardrobeFor(p)};
}
const getColors=getOutfit,saveColors=saveOutfit;
async function start(db,p,d){
  purge();
  await teams.leave(p);
  const outfit=await getOutfit(db,p);
  let roomId=null,biome=validBiome(d.biome),kind=d.mode==='online'||d.mode==='public'||d.multiplayer?'public':'solo';
  if(d.roomId){
    const r=await db.query('SELECT r.id,r.biome FROM jump_rooms r JOIN jump_room_members m ON m.room_id=r.id AND m.player_id=$2 WHERE r.id=$1',[d.roomId,p.id]);
    if(!r.rowCount)throw error('Não pertences a esta sala JUMP.',403);
    roomId=r.rows[0].id;biome=r.rows[0].biome;kind='private';
  }
  removeSession(sessions.get(activeByPlayer.get(p.id)));
  let inst=kind==='solo'?newInstance(biome,kind,null):findInstance(biome,kind,roomId);
  if(inst.players.size>=5)throw error('Instância cheia.',409);
  const id=crypto.randomUUID();
  const run={id,playerId:p.id,name:p.visualName||p.name,country:p.country,outfit,instanceId:inst.id,roomId,biome,kind,
    state:physics.create(inst.seed,inst.platforms),keys:{left:false,right:false,jump:false},facing:1,confirmedPlatform:0,confirmedScore:0,last:Date.now(),lastSeen:Date.now(),started:Date.now(),ended:false};
  run.state.time=(Date.now()-inst.epoch)/1000;
  sessions.set(id,run);activeByPlayer.set(p.id,id);inst.players.set(p.id,run);
  return{ok:true,runId:id,seed:inst.seed,worldTime:run.state.time,instanceId:kind==='solo'?null:inst.id,biome,mode:kind,players:inst.players.size,maxPlayers:5,outfit,...wardrobeFor(p)};
}
function requireRun(p,id){purge();const run=sessions.get(String(id||''));if(!run||run.playerId!==p.id||activeByPlayer.get(p.id)!==run.id)throw error('Partida JUMP expirada. Começa novamente.',404);return run;}
function advance(run){
  const now=Date.now();
  const elapsed=Math.min(.2,Math.max(0,(now-run.last)/1000));
  let rest=elapsed;
  while(rest>0&&run.state.alive){const dt=Math.min(1/60,rest);physics.step(run.state,run.keys,dt);rest-=dt;}
  run.last=now;run.lastSeen=now;
}
function playersIn(run){
  const inst=instances.get(run.instanceId);
  if(!inst)return[];
  return [...inst.players.values()].filter(r=>r.id!==run.id&&Date.now()-r.lastSeen<30000).map(r=>({id:r.playerId,name:r.name,x:Math.round((r.position||r.state).x),y:Math.round((r.position||r.state).y),best:Math.floor(r.state.best),score:r.confirmedScore||0,alive:r.state.alive,vy:Math.round(r.state.vy||0),ground:!!r.state.ground,facing:r.facing||1,moving:!!(r.keys.left||r.keys.right),outfit:r.outfit}));
}
function confirmProgress(run,raw){
  const claimed=Number(raw??run.confirmedPlatform??0);
  if(!Number.isSafeInteger(claimed)||claimed<0||claimed>100000)throw error('Progressão JUMP inválida.');
  if(claimed<=run.confirmedPlatform)return;
  if(claimed-run.confirmedPlatform>3)throw error('Progressão JUMP demasiado rápida.');
  const elapsed=Math.max(0,Date.now()-run.started);
  const maxByTime=1+Math.floor(elapsed/220);
  if(claimed>maxByTime)throw error('Progressão JUMP demasiado rápida.');
  run.confirmedPlatform=claimed;
  run.confirmedScore=claimed*physics.SCORE_PER_PLATFORM;
}
function responseState(run){
  const state=physics.publicState(run.state);
  state.platform=run.confirmedPlatform||0;
  state.score=run.confirmedScore||0;
  return state;
}
function input(p,d){
  const run=requireRun(p,d.runId);
  run.keys={left:d.left===true,right:d.right===true,jump:d.jump===true};
  if(run.keys.left&&!run.keys.right)run.facing=-1;
  else if(run.keys.right&&!run.keys.left)run.facing=1;
  advance(run);
  confirmProgress(run,d.platform);
  // Relay bounded client prediction for independent public cameras.
  if(d.position&&Number.isFinite(d.position.x)&&Number.isFinite(d.position.y)){
    const x=d.position.x,y=d.position.y,elapsed=Math.min(.5,Math.max(.06,(Date.now()-(run.positionAt||run.started))/1000));
    const previous=run.position||run.state;
    if(x>=8&&x<=physics.W-8&&Math.abs(x-previous.x)<=136*elapsed+12&&Math.abs(y-previous.y)<=282*elapsed+16){
      run.position={x,y};run.positionAt=Date.now();
    }
  }
  const inst=instances.get(run.instanceId);
  return{ok:true,worldTime:inst?(Date.now()-inst.epoch)/1000:run.state.time,state:responseState(run),peers:run.kind==='solo'?[]:playersIn(run),players:inst?.players.size||1,maxPlayers:5,biome:run.biome,mode:run.kind};
}
function state(p,runId){
  const run=requireRun(p,runId);advance(run);
  return{ok:true,state:responseState(run),peers:run.kind==='solo'?[]:playersIn(run),players:instances.get(run.instanceId)?.players.size||1,maxPlayers:5,biome:run.biome,mode:run.kind};
}
async function finish(db,p,runId,platform){
  const run=requireRun(p,runId);advance(run);confirmProgress(run,platform);
  const score=Math.max(0,run.confirmedScore||0);
  removeSession(run);
  if(score>0){
    await db.query('INSERT INTO jump_scores(player_id,best_score,score_version) VALUES($1,$2,2) ON CONFLICT(player_id) DO UPDATE SET best_score=GREATEST(jump_scores.best_score,EXCLUDED.best_score),score_version=2,updated_at=CASE WHEN EXCLUDED.best_score>jump_scores.best_score THEN NOW() ELSE jump_scores.updated_at END',[p.id,score]);
    if(run.roomId)await db.query('UPDATE jump_room_members SET best_score=GREATEST(best_score,$3),score_version=2 WHERE room_id=$1 AND player_id=$2',[run.roomId,p.id,score]);
  }
  return{ok:true,score,platform:run.confirmedPlatform||0,dead:!run.state.alive};
}
function leave(p){const run=sessions.get(activeByPlayer.get(p.id));if(run)removeSession(run);return{ok:true};}
async function rankings(db,country,page){
  const code=String(country||'').toUpperCase();
  if(code&&!/^[A-Z]{2}$/.test(code))throw error('País inválido.');
  const pg=Math.max(1,Math.min(10000,Math.floor(Number(page)||1))),offset=(pg-1)*25;
  const cte="WITH ranked AS (SELECT p.id,p.name,p.visual_name AS \"visualName\",p.country,p.vip_level AS \"vipLevel\",p.letter_styles AS \"letterStyles\",p.name_color AS \"nameColor\",p.name_effect AS \"nameEffect\",p.tag_global_color AS \"tagGlobalColor\",p.tag_country_color AS \"tagCountryColor\",s.best_score AS score,ROW_NUMBER() OVER(ORDER BY s.best_score DESC,s.updated_at ASC,p.id) AS \"worldRank\",ROW_NUMBER() OVER(PARTITION BY p.country ORDER BY s.best_score DESC,s.updated_at ASC,p.id) AS \"countryRank\" FROM jump_scores s JOIN players p ON p.id=s.player_id WHERE s.best_score>0) ";
  const filter=code?'WHERE country=$1':'';
  const args=code?[code]:[];
  const count=await db.query(cte+'SELECT COUNT(*)::int AS count FROM ranked '+filter,args);
  const rows=await db.query(cte+'SELECT * FROM ranked '+filter+' ORDER BY score DESC,"worldRank" ASC LIMIT 25 OFFSET $'+(args.length+1),[...args,offset]);
  return{players:rows.rows.map(x=>({...x,score:Number(x.score),worldRank:Number(x.worldRank),countryRank:Number(x.countryRank),letterStyles:Array.isArray(x.letterStyles)?x.letterStyles:(()=>{try{return JSON.parse(x.letterStyles||'[]')}catch(_){return[]}})()})),total:count.rows[0].count,page:pg,pages:Math.max(1,Math.ceil(count.rows[0].count/25))};
}
async function playerRank(db,p){
  const q=await db.query(`WITH ranked AS (
    SELECT s.player_id,
      ROW_NUMBER() OVER(ORDER BY s.best_score DESC,s.updated_at ASC,p.id) AS "worldRank",
      ROW_NUMBER() OVER(PARTITION BY p.country ORDER BY s.best_score DESC,s.updated_at ASC,p.id) AS "countryRank"
    FROM jump_scores s JOIN players p ON p.id=s.player_id WHERE s.best_score>0
  ) SELECT "worldRank","countryRank" FROM ranked WHERE player_id=$1`,[p.id]);
  return{worldRank:Number(q.rows[0]?.worldRank||0)||null,countryRank:Number(q.rows[0]?.countryRank||0)||null};
}
async function roomCreate(db,p,d){
  const name=String(d.name||'').trim(),biome=validBiome(d.biome);
  if(!/^[\p{L}\p{N} _-]{2,24}$/u.test(name))throw error('Nome inválido. Usa 2 a 24 caracteres.');
  for(let i=0;i<8;i++){
    const id=crypto.randomUUID(),code=crypto.randomBytes(3).toString('hex').toUpperCase(),client=await db.connect();
    try{
      await client.query('BEGIN');
      await client.query('INSERT INTO jump_rooms(id,code,name,biome,max_players,owner_id) VALUES($1,$2,$3,$4,5,$5)',[id,code,name,biome,p.id]);
      await client.query('INSERT INTO jump_room_members(room_id,player_id) VALUES($1,$2)',[id,p.id]);
      await client.query('COMMIT');
      return{ok:true,room:{id,code,name,biome,maxPlayers:5,memberCount:1,ownerName:p.name}};
    }catch(e){await client.query('ROLLBACK').catch(()=>{});if(e.code!=='23505')throw e;}finally{client.release()}
  }
  throw error('Não foi possível criar a sala.',500);
}
async function roomJoin(db,p,d){
  const code=String(d.code||'').trim().toUpperCase();
  if(!/^[A-F0-9]{6}$/.test(code))throw error('Código inválido.');
  const client=await db.connect();
  try{
    await client.query('BEGIN');
    const found=await client.query('SELECT * FROM jump_rooms WHERE code=$1 FOR UPDATE',[code]);
    if(!found.rowCount)throw error('Sala não encontrada.',404);
    const room=found.rows[0];
    const existing=await client.query('SELECT 1 FROM jump_room_members WHERE room_id=$1 AND player_id=$2',[room.id,p.id]);
    const count=await client.query('SELECT COUNT(*)::int AS count FROM jump_room_members WHERE room_id=$1',[room.id]);
    if(!existing.rowCount&&count.rows[0].count>=5)throw error('A sala já tem cinco membros.',409);
    if(!existing.rowCount)await client.query('INSERT INTO jump_room_members(room_id,player_id) VALUES($1,$2)',[room.id,p.id]);
    await client.query('COMMIT');
    return{ok:true,room:{id:room.id,code:room.code,name:room.name,biome:room.biome,maxPlayers:5,memberCount:count.rows[0].count+(existing.rowCount?0:1)}};
  }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}finally{client.release()}
}
async function roomList(db,p){
  const q=await db.query('SELECT r.id,r.code,r.name,r.biome,r.max_players AS "maxPlayers",p.name AS "ownerName",COUNT(m.player_id)::int AS "memberCount" FROM jump_rooms r JOIN jump_room_members mine ON mine.room_id=r.id AND mine.player_id=$1 JOIN players p ON p.id=r.owner_id JOIN jump_room_members m ON m.room_id=r.id GROUP BY r.id,p.name ORDER BY r.created_at DESC',[p.id]);
  return{ok:true,rooms:q.rows};
}
async function roomLeave(db,p,d){
  const id=String(d.roomId||'');
  const run=sessions.get(activeByPlayer.get(p.id));
  if(run?.roomId===id)removeSession(run);
  await db.query('DELETE FROM jump_room_members WHERE room_id=$1 AND player_id=$2',[id,p.id]);
  return{ok:true};
}
async function roomRankings(db,p,id){
  const mine=await db.query('SELECT 1 FROM jump_room_members WHERE room_id=$1 AND player_id=$2',[id,p.id]);
  if(!mine.rowCount)throw error('Não pertences a esta sala.',403);
  const q=await db.query(`WITH ranked AS (
    SELECT s.player_id,
      ROW_NUMBER() OVER(ORDER BY s.best_score DESC,s.updated_at ASC,p.id) AS "worldRank",
      ROW_NUMBER() OVER(PARTITION BY p.country ORDER BY s.best_score DESC,s.updated_at ASC,p.id) AS "countryRank"
    FROM jump_scores s JOIN players p ON p.id=s.player_id WHERE s.best_score>0
  )
  SELECT p.id,p.name,p.country,p.visual_name AS "visualName",p.vip_level AS "vipLevel",
    p.letter_styles AS "letterStyles",p.name_color AS "nameColor",p.name_effect AS "nameEffect",
    p.tag_global_color AS "tagGlobalColor",p.tag_country_color AS "tagCountryColor",
    m.best_score AS score,r."worldRank",r."countryRank"
  FROM jump_room_members m JOIN players p ON p.id=m.player_id
  LEFT JOIN ranked r ON r.player_id=p.id
  WHERE m.room_id=$1 ORDER BY m.best_score DESC,m.joined_at ASC`,[id]);
  return{ok:true,players:q.rows.map((x,i)=>({...x,roomRank:i+1,score:Number(x.score),
    worldRank:Number(x.worldRank||0)||null,countryRank:Number(x.countryRank||0)||null,
    letterStyles:Array.isArray(x.letterStyles)?x.letterStyles:(()=>{try{return JSON.parse(x.letterStyles||'[]')}catch(_){return[]}})()}))};
}
module.exports={teams,initDb,BIOMES,PALETTE,PARTS,DEFAULTS,FIXED_APPEARANCE,WARDROBE,wardrobeFor,getOutfit,saveOutfit,getColors,saveColors,start,input,state,finish,leave,rankings,playerRank,roomCreate,roomJoin,roomList,roomLeave,roomRankings};
