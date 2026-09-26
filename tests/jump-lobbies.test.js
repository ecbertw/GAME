'use strict';
const test=require('node:test'),assert=require('node:assert/strict');

function setup(){
  delete require.cache[require.resolve('../jump-server')];
  const api=require('../jump-server'),players=new Map(),outfits=new Map();
  const db={query:async(sql,args=[])=>{
    if(sql.includes('FROM players WHERE id=ANY'))return{rows:args[0].map(id=>players.get(id)).filter(Boolean)};
    if(sql.startsWith('SELECT colors'))return{rows:outfits.has(args[0])?[{colors:outfits.get(args[0])}]:[]};
    if(sql.startsWith('INSERT INTO jump_cosmetics')){outfits.set(args[0],JSON.parse(args[1]));return{rows:[]};}
    if(sql.startsWith('INSERT INTO jump_scores'))return{rows:[]};
    throw new Error('Unexpected query: '+sql);
  }};
  function player(id,vipLevel=0){const p={id,name:id,country:'PT',vipLevel};players.set(id,p);return p;}
  function group(prefix,count=5){
    const members=Array.from({length:count},(_,i)=>player(prefix+i));
    const created=api.lobbyCreate(members[0],{name:'Amigos'});
    members.slice(1).forEach(p=>api.lobbyJoin(p,{code:created.lobby.code}));
    return members;
  }
  return{api,db,player,players,outfits,group};
}

test('JUMP legacy solo requests join public instances and private runs are retired',async()=>{
  const {api,db,player}=setup(),a=player('a'),b=player('b');
  const first=await api.start(db,a,{mode:'solo',biome:'city'});
  const second=await api.start(db,b,{multiplayer:false,biome:'snow'});
  assert.equal(first.mode,'public');assert.equal(first.instanceId,second.instanceId);
  assert.equal(first.maxPlayers,20);assert.equal(api.state(a,first.runId).peers[0].id,b.id);
  await assert.rejects(api.start(db,a,{roomId:'old-room'}),e=>e.status===410);
});

test('friend lobbies cap at five, reject multiple memberships, and transfer leadership',async()=>{
  const {api,group,player}=setup(),members=group('g'),outsider=player('extra');
  const lobby=api.lobbyStatus(members[0]).lobby;
  assert.equal(lobby.memberCount,5);assert.equal(lobby.maxPlayers,5);
  assert.throws(()=>api.lobbyJoin(outsider,{code:lobby.code}),e=>e.status===409);
  assert.equal(api.lobbyJoin(members[1],{code:lobby.code}).lobby.memberCount,5);
  assert.throws(()=>api.lobbyCreate(members[1],{}),e=>e.status===409);
  const other=api.lobbyCreate(outsider,{});
  assert.throws(()=>api.lobbyJoin(members[1],{code:other.lobby.code}),e=>e.status===409);
  api.lobbyLeave(members[0]);
  assert.equal(api.lobbyStatus(members[1]).lobby.leaderId,members[1].id);
  assert.equal(api.lobbyStatus(members[0]).lobby,null);
});

test('leader launches a whole group into one public instance without splitting into remaining slots',async()=>{
  const {api,db,player,group}=setup();
  const publicUsers=Array.from({length:18},(_,i)=>player('public'+i));
  const initial=await Promise.all(publicUsers.map(p=>api.start(db,p,{})));
  const members=group('party'),leader=members[0];
  await assert.rejects(api.lobbyStart(db,members[1]),e=>e.status===403);
  await assert.rejects(api.start(db,leader,{}),e=>e.status===409);
  const launched=await api.lobbyStart(db,leader);
  const runs=members.map(p=>api.lobbyStatus(p).run);
  assert.equal(new Set(runs.map(r=>r.instanceId)).size,1);
  assert.notEqual(runs[0].instanceId,initial[0].instanceId);
  assert.equal(launched.lobby.status,'playing');assert.equal(runs[0].players,5);
  assert.equal(api.state(leader,runs[0].runId).peers.length,4);
  assert.throws(()=>api.state(members[1],runs[0].runId),e=>e.status===404);
  assert.ok(launched.lobby.members.every(m=>!('runId' in m)));
  assert.throws(()=>api.lobbyJoin(player('late'),{code:launched.lobby.code}),e=>e.status===409);
  const publicExtra=await api.start(db,player('single'),{});
  assert.equal(publicExtra.instanceId,initial[0].instanceId,'solo arrivals should fill available public slots');
});

test('concurrent group launches and individual arrivals never overfill an instance',async()=>{
  const {api,db,group,player}=setup();
  const parties=Array.from({length:5},(_,i)=>group('party'+i+'-'));
  const singles=Array.from({length:17},(_,i)=>player('single'+i));
  const results=await Promise.all([...parties.map(g=>api.lobbyStart(db,g[0])),...singles.map(p=>api.start(db,p,{}))]);
  assert.equal(results.length,22);
  const seen=new Map();
  for(const g of parties){
    const runs=g.map(p=>api.lobbyStatus(p).run);
    assert.equal(new Set(runs.map(r=>r.instanceId)).size,1);
    for(const r of runs)seen.set(r.instanceId,(seen.get(r.instanceId)||0)+1);
  }
  for(const r of results.slice(parties.length))seen.set(r.instanceId,(seen.get(r.instanceId)||0)+1);
  assert.equal([...seen.values()].reduce((a,b)=>a+b,0),42);
  assert.ok([...seen.values()].every(count=>count<=20));
});

test('concurrent launches by the same leader create exactly one party match',async()=>{
  const {api,db,group}=setup(),members=group('repeat');
  const results=await Promise.allSettled([api.lobbyStart(db,members[0]),api.lobbyStart(db,members[0])]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(results.find(r=>r.status==='rejected').reason.status,409);
  const leader=api.lobbyStatus(members[0]);
  assert.equal(api.state(members[0],leader.run.runId).players,5);
  assert.equal((await api.lobbyStart(db,members[0])).run.runId,leader.run.runId);
});

test('membership changes during outfit reads cancel the entire launch without partial allocation',async()=>{
  const {api,db,group}=setup(),members=group('cancel');
  let unblock;const original=db.query;
  db.query=async(sql,args)=>{
    if(sql.includes('FROM players WHERE id=ANY'))await new Promise(resolve=>{unblock=resolve;});
    return original(sql,args);
  };
  const pending=api.lobbyStart(db,members[0]);
  assert.equal(api.lobbyStatus(members[0]).lobby.status,'starting');
  api.lobbyLeave(members[1]);unblock();
  await assert.rejects(pending,e=>e.status===409);
  assert.equal(api.lobbyStatus(members[0]).lobby.status,'waiting');
  assert.equal(api.lobbyStatus(members[0]).run,null);
  assert.equal(api.lobbyStatus(members[1]).lobby,null);
});

test('VIP outfits are revalidated for every party member at launch',async()=>{
  const {api,db,group,players,outfits}=setup(),members=group('vip',2);
  outfits.set(members[1].id,{...api.DEFAULTS,top:'rainbow',effect:'cosmic'});
  players.set(members[1].id,{...members[1],vipLevel:0});
  await api.lobbyStart(db,members[0]);
  assert.equal(api.lobbyStatus(members[1]).run.outfit.top,api.DEFAULTS.top);
  assert.equal(api.lobbyStatus(members[1]).run.outfit.effect,'none');
  assert.equal(api.lobbyStatus(members[0]).run.outfit.hair,api.DEFAULTS.hair);
});

test('banned members prevent party allocation and leave the lobby recoverable',async()=>{
  const {api,db,group,players}=setup(),members=group('banned');
  players.set(members[3].id,{...members[3],bannedPermanent:true});
  await assert.rejects(api.lobbyStart(db,members[0]),e=>e.status===403);
  assert.equal(api.lobbyStatus(members[0]).lobby.status,'waiting');
  assert.ok(members.every(p=>api.lobbyStatus(p).run===null));
  api.lobbyLeave(members[3]);
  assert.equal((await api.lobbyStart(db,members[0])).run.players,4);
});

test('lobby returns to waiting after all runs finish and can launch again',async()=>{
  const {api,db,group}=setup(),members=group('again');
  const original=(await api.lobbyStart(db,members[0])).run;
  for(const member of members){const run=api.lobbyStatus(member).run;await api.finish(db,member,run.runId,0);}
  assert.equal(api.lobbyStatus(members[0]).lobby.status,'waiting');
  const next=await api.lobbyStart(db,members[0]);
  assert.equal(next.run.players,5);assert.notEqual(next.run.runId,original.runId);
});

test('leaving a playing lobby preserves the public run and private run ids stay owner-only',async()=>{
  const {api,db,group}=setup(),members=group('depart',2);
  await api.lobbyStart(db,members[0]);
  const run=api.lobbyStatus(members[1]).run;
  api.lobbyLeave(members[1]);
  assert.equal(api.lobbyStatus(members[1]).lobby,null);
  assert.equal(api.state(members[1],run.runId).players,2);
  assert.throws(()=>api.input(members[0],{runId:run.runId}),e=>e.status===404);
});

test('stale lobby members expire and leadership follows members still present',()=>{
  const {api,group}=setup(),members=group('timeout',2),originalNow=Date.now;
  let now=originalNow();Date.now=()=>now;
  try{
    now+=50000;api.lobbyStatus(members[1]);
    now+=41000;
    const lobby=api.lobbyStatus(members[1]).lobby;
    assert.equal(lobby.memberCount,1);assert.equal(lobby.leaderId,members[1].id);
    assert.equal(api.lobbyStatus(members[0]).lobby,null);
    now+=91000;assert.equal(api.lobbyStatus(members[1]).lobby,null);
  }finally{Date.now=originalNow;}
});

test('legacy room endpoints expose only current friend lobbies and retire private rankings',async()=>{
  const {api,db,player}=setup(),p=player('legacy');
  const created=await api.roomCreate(db,p,{name:'Amigos',biome:'snow'});
  assert.equal(created.room.id,created.lobby.id);
  assert.equal((await api.roomList(db,p)).rooms.length,1);
  await assert.rejects(api.roomRankings(db,p,created.room.id),e=>e.status===410);
  await api.roomLeave(db,p,{roomId:created.room.id});
  assert.equal((await api.roomList(db,p)).rooms.length,0);
});
