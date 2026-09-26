'use strict';
/* JUMP runs online in capped public instances. Friend lobbies travel together. */
const crypto=require('crypto');
const physics=require('./jump-physics');
const BIOMES=['city','forest','snow','astral'];
const PUBLIC_CAPACITY=20;
const LOBBY_CAPACITY=5,LOBBY_TIMEOUT=90000;
const PALETTE=['#ffffff','#e83e45','#ff7a2f','#f1c438','#39b86a','#7bdc5a','#00e5ff','#2f9bd1','#3b82f6','#6f5cff','#a855f7','#ff4fd8','#ff6b9d','#94a3b8','#46535f','#172b3b','#263c5c','#111827'];
const FIXED_APPEARANCE={skin:'#f0c7a2',skinShade:'#dba982',eyes:'#17202a'};
const OUTFIT_DEFAULTS={hair:'#19222d',top:'#172b3b',accent:'#00e5ff',pants:'#263c5c',shoes:'#ffffff',accessory:'cape',effect:'none'};
const PARTS=['hair','top','accent','pants','shoes','accessory','effect'];
const special=(value,label,minVip)=>({value,label,minVip});
const COLOR_LABELS={
 '#ffffff':'BRANCO','#e83e45':'VERMELHO','#ff7a2f':'LARANJA','#f1c438':'AMARELO',
 '#39b86a':'VERDE','#7bdc5a':'VERDE-LIMA','#00e5ff':'CIANO','#2f9bd1':'AZUL',
 '#3b82f6':'AZUL FORTE','#6f5cff':'ÍNDIGO','#a855f7':'ROXO','#ff4fd8':'MAGENTA',
 '#ff6b9d':'ROSA','#94a3b8':'CINZENTO','#46535f':'CINZENTO ESCURO',
 '#172b3b':'AZUL PETRÓLEO','#263c5c':'AZUL NOITE','#111827':'PRETO AZULADO'
};
const baseColors=PALETTE.map(value=>special(value,COLOR_LABELS[value]||'COR',0));
const WARDROBE={
  hair:[
    special('#19222d','PRETO',0),special('#3f2a20','CASTANHO ESCURO',0),special('#754c32','CASTANHO',0),
    special('#d8b05d','LOIRO',0),special('#9aa2ad','CINZENTO',0),special('#e9edf2','BRANCO',0),special('#8f3038','RUIVO',0),
    special('#00f5ff','NEON CIANO',2),special('#ff3cf7','NEON MAGENTA',3),special('#a6ff38','NEON LIMA',4),
    special('#ff6238','PLASMA LARANJA',5),special('rainbow','ARCO-ÍRIS VIP',6)
  ],
  top:[...baseColors,special('#ffd84d','DOURADO',1),special('#00f5ff','NEON CIANO',2),special('#ff3cf7','NEON MAGENTA',3),special('#a6ff38','NEON LIMA',4),special('#ff6238','PLASMA LARANJA',5),special('rainbow','ARCO-ÍRIS VIP',6)],
  accent:[...baseColors,special('#ffe66d','DOURADO',1),special('#56f7ff','GELO ELÉTRICO',2),special('#ff70dc','ROSA LASER',3),special('#b8ff66','BRILHO TÓXICO',4),special('#ff8a4c','SOLAR',5),special('rainbow','ARCO-ÍRIS VIP',6)],
  pants:[...baseColors,special('#ffd84d','DOURADO',1),special('#5b4bff','VIOLETA REAL',1),special('#00d9ff','AZUL CYBER',2),special('#da4cff','ROXO VOID',3),special('#68ff84','VERDE NEON',4),special('#ff425f','VERMELHO PLASMA',5),special('rainbow','ARCO-ÍRIS VIP',6)],
  shoes:[...baseColors,special('#ffe66d','SOLAS DOURADAS',1),special('#75f8ff','SOLAS DE GELO',2),special('#ff8be8','LUZ ROSA',3),special('#c8ff75','LUZ LIMA',4),special('#ff9a62','LUZ DE FOGO',5),special('rainbow','ARCO-ÍRIS VIP',6)],
  accessory:[special('cape','CAPA DO VIAJANTE',0),special('none','SEM ACESSÓRIO',0),special('scarf','CACHECOL DO VENTO',2),special('satchel','BOLSA DO EXPLORADOR',4)],
  effect:[special('none','NONE',0),special('glow','BRILHO SUAVE',1),special('pulse','AURA RESPIRANTE',2),special('shimmer','CINTILAÇÃO',2),special('spark','FAÍSCAS SUAVES',3),special('halo','HALO',3),special('frost','GELO',3),special('electric','ELETRICIDADE',4),special('ember','BRASAS',4),special('mist','NÉVOA',4),special('plasma','PLASMA SUAVE',5),special('comet','RASTO',5),special('cosmic','AURA CÓSMICA',6),special('prismatic','PRISMÁTICO',6)]
};
const DEFAULTS=OUTFIT_DEFAULTS;
const instances=new Map(),sessions=new Map(),activeByPlayer=new Map();
const lobbies=new Map(),lobbyByPlayer=new Map();
let publicLobbyId=null;
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
    accessory:String(raw.accessory||OUTFIT_DEFAULTS.accessory).toLowerCase(),
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
  // DUO/TRIO was removed from JUMP. Clean the retired persistent data so old
  // teams/rankings cannot reappear after deploys or restarts.
  await db.query('DROP TABLE IF EXISTS jump_team_members');
  await db.query('DROP TABLE IF EXISTS jump_team_scores');
  await db.query('DROP TABLE IF EXISTS jump_teams');
  await db.query('CREATE TABLE IF NOT EXISTS jump_scores(player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,best_score INTEGER NOT NULL DEFAULT 0,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
  await db.query("CREATE TABLE IF NOT EXISTS jump_cosmetics(player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,colors JSONB NOT NULL DEFAULT '{}'::jsonb)");
  await db.query('CREATE TABLE IF NOT EXISTS jump_rooms(id UUID PRIMARY KEY,code VARCHAR(6) UNIQUE NOT NULL,name VARCHAR(24) NOT NULL,biome VARCHAR(12) NOT NULL,max_players INTEGER NOT NULL DEFAULT 5,owner_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
  await db.query("UPDATE jump_rooms SET biome='forest' WHERE biome='desert'");
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
  if(inst){inst.players.delete(run.playerId);if(!inst.players.size){instances.delete(inst.id);if(publicLobbyId===inst.id)publicLobbyId=null;}}
  const lobby=lobbies.get(lobbyByPlayer.get(run.playerId));
  if(lobby?.status==='playing'&&![...lobby.members.keys()].some(id=>sessions.get(activeByPlayer.get(id))?.lobbyId===lobby.id)){
    lobby.status='waiting';lobby.instanceId=null;
  }
}
function purge(){
  const now=Date.now();
  for(const run of [...sessions.values()])if(now-run.lastSeen>30000)removeSession(run);
  for(const lobby of [...lobbies.values()])for(const [id,member] of [...lobby.members]){
    if(now-member.lastSeen>LOBBY_TIMEOUT&&!activeByPlayer.has(id))detachLobbyMember(lobby,id);
  }
  for(const inst of [...instances.values()])if(!inst.players.size)instances.delete(inst.id);
}
function newInstance(biome,kind,roomId){
  const inst={id:crypto.randomUUID(),biome,kind,roomId:roomId||null,seed:crypto.randomInt(1,2147483647),players:new Map(),platforms:null,epoch:Date.now()};
  inst.platforms=physics.platforms(inst.seed,30);
  instances.set(inst.id,inst);return inst;
}
function findPublicInstance(groupSize=1){
  const open=[...instances.values()].filter(inst=>inst.kind==='public'&&!inst.roomId&&inst.players.size>0&&inst.players.size+groupSize<=PUBLIC_CAPACITY)
    .sort((a,b)=>b.players.size-a.players.size||a.epoch-b.epoch);
  if(open[0]){publicLobbyId=open[0].id;return open[0];}
  const biome=BIOMES[crypto.randomInt(0,BIOMES.length)],inst=newInstance(biome,'public',null);
  publicLobbyId=inst.id;return inst;
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
function touchLobby(p){
  const lobby=lobbies.get(lobbyByPlayer.get(p.id)),member=lobby?.members.get(p.id);
  if(member){member.lastSeen=Date.now();member.name=p.visualName||p.name;member.country=p.country;}
  return lobby||null;
}
function detachLobbyMember(lobby,id){
  if(!lobby?.members.has(id))return;
  lobby.members.delete(id);lobbyByPlayer.delete(id);lobby.version++;
  if(lobby.status==='starting')lobby.status='waiting';
  if(!lobby.members.size){lobbies.delete(lobby.id);return;}
  if(lobby.leaderId===id)lobby.leaderId=lobby.members.keys().next().value;
}
function lobbyView(lobby){
  if(!lobby)return null;
  return{id:lobby.id,code:lobby.code,name:lobby.name,leaderId:lobby.leaderId,status:lobby.status,
    maxPlayers:LOBBY_CAPACITY,memberCount:lobby.members.size,instanceId:lobby.instanceId||null,
    members:[...lobby.members.values()].map(m=>({id:m.id,name:m.name,country:m.country}))};
}
function runResponse(run,p){
  const inst=instances.get(run.instanceId);
  return{ok:true,runId:run.id,seed:inst.seed,worldTime:(Date.now()-inst.epoch)/1000,
    instanceId:inst.id,lobbyId:run.lobbyId||null,biome:run.biome,mode:'public',players:inst.players.size,
    maxPlayers:PUBLIC_CAPACITY,outfit:run.outfit,...wardrobeFor(p)};
}
function lobbyStatus(p){
  purge();const lobby=touchLobby(p),run=sessions.get(activeByPlayer.get(p.id));
  return{ok:true,lobby:lobbyView(lobby),run:lobby&&run?.lobbyId===lobby.id?runResponse(run,p):null};
}
function lobbyCreate(p,d={}){
  purge();
  if(lobbyByPlayer.has(p.id))throw error('Sai do lobby atual antes de criares outro.',409);
  const name=String(d.name||'Lobby de '+p.name).trim();
  if(!/^[\p{L}\p{N} _-]{2,24}$/u.test(name))throw error('Nome inválido. Usa 2 a 24 caracteres.');
  let code;do{code=crypto.randomBytes(3).toString('hex').toUpperCase();}while([...lobbies.values()].some(l=>l.code===code));
  const lobby={id:crypto.randomUUID(),code,name,leaderId:p.id,members:new Map(),status:'waiting',version:0,instanceId:null};
  lobbies.set(lobby.id,lobby);lobbyByPlayer.set(p.id,lobby.id);
  lobby.members.set(p.id,{id:p.id,name:p.visualName||p.name,country:p.country,lastSeen:Date.now()});
  return lobbyStatus(p);
}
function lobbyJoin(p,d={}){
  purge();const code=String(d.code||'').trim().toUpperCase();
  if(!/^[A-F0-9]{6}$/.test(code))throw error('Código inválido.');
  const lobby=[...lobbies.values()].find(l=>l.code===code);
  if(!lobby)throw error('Lobby não encontrado ou expirado.',404);
  if(lobbyByPlayer.get(p.id)===lobby.id)return lobbyStatus(p);
  if(lobbyByPlayer.has(p.id))throw error('Sai do lobby atual antes de entrares noutro.',409);
  if(lobby.status!=='waiting')throw error('O grupo já está a jogar. Aguarda o regresso ao lobby.',409);
  if(lobby.members.size>=LOBBY_CAPACITY)throw error('O lobby já tem cinco jogadores.',409);
  lobby.members.set(p.id,{id:p.id,name:p.visualName||p.name,country:p.country,lastSeen:Date.now()});
  lobbyByPlayer.set(p.id,lobby.id);lobby.version++;
  return lobbyStatus(p);
}
function lobbyLeave(p){
  purge();const lobby=lobbies.get(lobbyByPlayer.get(p.id));
  // Leaving the party does not interrupt an already-running public match.
  if(lobby){const run=sessions.get(activeByPlayer.get(p.id));if(run?.lobbyId===lobby.id)run.lobbyId=null;detachLobbyMember(lobby,p.id);}
  return{ok:true,lobby:null,run:null};
}
function createRun(p,outfit,inst,lobbyId=null){
  const id=crypto.randomUUID();
  const run={id,playerId:p.id,name:p.visualName||p.name,country:p.country,outfit,instanceId:inst.id,roomId:null,lobbyId,biome:inst.biome,kind:'public',
    state:physics.create(inst.seed,inst.platforms),keys:{left:false,right:false,jump:false},facing:1,confirmedPlatform:0,confirmedScore:0,last:Date.now(),lastSeen:Date.now(),started:Date.now(),ended:false};
  run.state.time=(Date.now()-inst.epoch)/1000;
  sessions.set(id,run);activeByPlayer.set(p.id,id);inst.players.set(p.id,run);
  return run;
}
async function lobbyStart(db,p){
  purge();const lobby=touchLobby(p);
  if(!lobby)throw error('Não estás num lobby.',404);
  if(lobby.leaderId!==p.id)throw error('Só o líder pode iniciar a partida do grupo.',403);
  if(lobby.status==='starting')throw error('O grupo já está a entrar numa instância.',409);
  if(lobby.status==='playing')return lobbyStatus(p);
  lobby.status='starting';const version=++lobby.version,ids=[...lobby.members.keys()];
  try{
    // Read current entitlements, rather than trusting a VIP level cached at join.
    const players=await db.query('SELECT id,name,country,visual_name AS "visualName",vip_level AS "vipLevel",banned_permanent AS "bannedPermanent",banned_until AS "bannedUntil" FROM players WHERE id=ANY($1::uuid[])',[ids]);
    const prepared=await Promise.all(ids.map(async id=>{
      const player=players.rows.find(row=>row.id===id);
      if(!player||player.bannedPermanent||(player.bannedUntil&&new Date(player.bannedUntil)>new Date()))throw error('Um jogador já não pode entrar na partida. Atualiza o lobby.',403);
      return{player,outfit:await getOutfit(db,player)};
    }));
    purge();
    if(!lobbies.has(lobby.id)||lobby.version!==version||lobby.status!=='starting')throw error('O lobby mudou. Inicia novamente a partida.',409);
    // No await below: capacity selection and insertion of the whole party are
    // one atomic event-loop operation, also against concurrent public starts.
    for(const id of ids)removeSession(sessions.get(activeByPlayer.get(id)));
    const inst=findPublicInstance(ids.length);
    for(const entry of prepared)createRun(entry.player,entry.outfit,inst,lobby.id);
    lobby.status='playing';lobby.instanceId=inst.id;
    return lobbyStatus(p);
  }catch(e){if(lobbies.get(lobby.id)===lobby&&lobby.version===version)lobby.status='waiting';throw e;}
}
async function start(db,p,d={}){
  if(d.roomId)throw error('As salas privadas foram substituídas por lobbies de amigos. Cria um lobby para entrarem juntos online.',410);
  purge();
  const outfit=await getOutfit(db,p);
  // Recheck after the database await: another request may have started a party.
  const lobby=touchLobby(p);
  if(lobby&&lobby.status!=='playing')throw error('Aguarda que o líder inicie o lobby ou sai do grupo para jogar.',409);
  const previous=sessions.get(activeByPlayer.get(p.id));
  if(lobby&&previous?.lobbyId===lobby.id)return runResponse(previous,p);
  let inst=lobby?instances.get(lobby.instanceId):null;
  if(lobby&&!inst)throw error('A partida do grupo terminou. Volta ao lobby.',409);
  if(inst&&inst.players.size>=PUBLIC_CAPACITY)throw error('A instância do grupo está cheia. Aguarda o regresso ao lobby.',409);
  removeSession(previous);
  // Legacy cached SOLO requests now join public matchmaking too.
  inst=inst||findPublicInstance();
  return runResponse(createRun(p,outfit,inst,lobby?.id||null),p);
}
function requireRun(p,id){purge();const run=sessions.get(String(id||''));if(!run||run.playerId!==p.id||activeByPlayer.get(p.id)!==run.id)throw error('Partida JUMP expirada. Começa novamente.',404);touchLobby(p);return run;}
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
  return [...inst.players.values()].filter(r=>r.id!==run.id&&Date.now()-r.lastSeen<30000).map(r=>{
    const live=Date.now()-Number(r.positionAt||0)<500,position=live&&r.position?r.position:r.state,motion=live&&r.motion?r.motion:null;
    return{id:r.playerId,name:r.name,x:Math.round(position.x*10)/10,y:Math.round(position.y*10)/10,best:Math.floor(r.state.best),score:r.confirmedScore||0,alive:r.state.alive,
      vx:motion?motion.vx:((r.keys.right?1:0)-(r.keys.left?1:0))*physics.SPEED,vy:motion?motion.vy:Math.round(r.state.vy||0),ground:motion?motion.ground:!!r.state.ground,
      facing:motion?motion.facing:(r.facing||1),moving:motion?motion.moving:!!r.keys.left!==!!r.keys.right,outfit:r.outfit};
  });
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
    const unit=physics.UNIT||1;
    if(x>=8*unit&&x<=physics.W-8*unit&&Math.abs(x-previous.x)<=physics.SPEED*elapsed+12*unit&&Math.abs(y-previous.y)<=physics.MAX_FALL*elapsed+16*unit){
      run.position={x,y};run.positionAt=Date.now();
      const m=d.motion&&typeof d.motion==='object'?d.motion:{};
      run.motion={vx:Math.max(-150*unit,Math.min(150*unit,Number(m.vx)||0)),vy:Math.max(-300*unit,Math.min(220*unit,Number(m.vy)||0)),ground:m.ground===true,
        moving:m.moving===true,facing:m.facing===-1?-1:1};
    }
  }
  const inst=instances.get(run.instanceId);
  return{ok:true,worldTime:inst?(Date.now()-inst.epoch)/1000:run.state.time,state:responseState(run),peers:playersIn(run),players:inst?.players.size||1,maxPlayers:PUBLIC_CAPACITY,biome:run.biome,mode:run.kind};
}
function state(p,runId){
  const run=requireRun(p,runId);advance(run);
  return{ok:true,state:responseState(run),peers:playersIn(run),players:instances.get(run.instanceId)?.players.size||1,maxPlayers:PUBLIC_CAPACITY,biome:run.biome,mode:run.kind};
}
async function finish(db,p,runId,platform){
  const run=requireRun(p,runId);advance(run);confirmProgress(run,platform);
  const score=Math.max(0,run.confirmedScore||0);
  removeSession(run);
  if(score>0){
    await db.query('INSERT INTO jump_scores(player_id,best_score,score_version) VALUES($1,$2,2) ON CONFLICT(player_id) DO UPDATE SET best_score=GREATEST(jump_scores.best_score,EXCLUDED.best_score),score_version=2,updated_at=CASE WHEN EXCLUDED.best_score>jump_scores.best_score THEN NOW() ELSE jump_scores.updated_at END',[p.id,score]);
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
    SELECT s.player_id,s.best_score AS "bestScore",
      ROW_NUMBER() OVER(ORDER BY s.best_score DESC,s.updated_at ASC,p.id) AS "worldRank",
      ROW_NUMBER() OVER(PARTITION BY p.country ORDER BY s.best_score DESC,s.updated_at ASC,p.id) AS "countryRank"
    FROM jump_scores s JOIN players p ON p.id=s.player_id WHERE s.best_score>0
  ) SELECT "worldRank","countryRank","bestScore" FROM ranked WHERE player_id=$1`,[p.id]);
  return{worldRank:Number(q.rows[0]?.worldRank||0)||null,countryRank:Number(q.rows[0]?.countryRank||0)||null,bestScore:Number(q.rows[0]?.bestScore||0)};
}
// Compatibility aliases for cached clients. Persistent private-room records are
// retained, but no longer create private instances or separate scoreboards.
async function roomCreate(db,p,d){const out=lobbyCreate(p,d);return{...out,room:out.lobby};}
async function roomJoin(db,p,d){const out=lobbyJoin(p,d);return{...out,room:out.lobby};}
async function roomList(db,p){const out=lobbyStatus(p);return{...out,rooms:out.lobby?[out.lobby]:[]};}
async function roomLeave(db,p,d){
  const lobby=lobbies.get(lobbyByPlayer.get(p.id));
  if(d?.roomId&&lobby?.id!==d.roomId)throw error('Lobby não encontrado.',404);
  return lobbyLeave(p);
}
async function roomRankings(){throw error('Os lobbies partilham o ranking público JUMP.',410);}
module.exports={initDb,BIOMES,PUBLIC_CAPACITY,LOBBY_CAPACITY,PALETTE,PARTS,DEFAULTS,FIXED_APPEARANCE,WARDROBE,wardrobeFor,getOutfit,saveOutfit,getColors,saveColors,start,input,state,finish,leave,rankings,playerRank,lobbyCreate,lobbyJoin,lobbyStatus,lobbyLeave,lobbyStart,roomCreate,roomJoin,roomList,roomLeave,roomRankings};
