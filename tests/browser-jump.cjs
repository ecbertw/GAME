const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
// Optional integration: npm install --no-save @electric-sql/pglite playwright
// Then: npx playwright install chromium; node tests/browser-jump.cjs
const {PGlite}=require('@electric-sql/pglite');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),J=require(root+'/jump-server');
(async()=>{
 fs.mkdirSync(path.join(root,'tmp/jump-qa'),{recursive:true});
 console.log('initializing PostgreSQL');const deadline=setTimeout(()=>{console.error('Validation deadline');process.exit(1)},90000);const pg=new PGlite();const db={query:async(q,a)=>{const r=await pg.query(q,a);return{...r,rowCount:r.affectedRows||r.rows.length};}};
 await pg.exec('CREATE TABLE players(id UUID PRIMARY KEY,name TEXT,country TEXT,visual_name TEXT,vip_level INT DEFAULT 0,letter_styles JSONB,name_color TEXT,name_effect TEXT,tag_global_color TEXT,tag_country_color TEXT,best_score INT DEFAULT 777)');
 const players=[0,1,2].map(i=>({id:'00000000-0000-4000-8000-00000000000'+i,name:'Test'+i,country:'PT',vipLevel:0}));
 for(const p of players)await db.query('INSERT INTO players(id,name,country) VALUES($1,$2,$3)',[p.id,p.name,p.country]);
 console.log('migrating');await J.initDb(db);await db.query('INSERT INTO jump_scores(player_id,best_score,score_version) VALUES($1,120,2)',[players[0].id]);
 await J.initDb(db);assert.equal((await db.query('SELECT best_score FROM jump_scores')).rows[0].best_score,120);
 assert.equal((await db.query('SELECT best_score FROM players')).rows[0].best_score,777);
 const server=http.createServer((req,res)=>{let file=path.join(root,req.url.split('?')[0]==='/'?'index.html':req.url.split('?')[0]);try{res.setHeader('Content-Type',file.endsWith('.svg')?'image/svg+xml':file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(3201,'127.0.0.1',r));
 console.log('launching browser');const browser=await chromium.launch({headless:true});const errors=[];
 try{
  async function pageFor(p,viewport={width:1200,height:1000}){
   const ctx=await browser.newContext({viewport});await ctx.addInitScript(p=>{localStorage.setItem('eixo_player',JSON.stringify(p));localStorage.setItem('eixo_country','PT');},p);
   const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/api/**',async route=>{
    const req=route.request(),u=new URL(req.url()),d=req.method()==='POST'?req.postDataJSON()||{}:{};let out={ok:true,players:[],rooms:[],messages:[],total:0,pages:1,page:1,player:p};
    try{
     const action=u.pathname.split('/').pop();
     if(u.pathname==='/api/jump/run/start')out=await J.start(db,p,d);
     else if(u.pathname==='/api/jump/run/input')out=J.input(p,d);
     else if(u.pathname==='/api/jump/run/finish')out=await J.finish(db,p,d.runId,d.platform);
     else if(u.pathname==='/api/jump/rankings')out=await J.rankings(db,u.searchParams.get('country'),1);
     else if(u.pathname==='/api/jump/player-rank')out=await J.playerRank(db,p);
     else if(u.pathname==='/api/jump/teams/rankings')out=await J.teams.rankings(u.searchParams.get('mode'),1);
     else if(u.pathname==='/api/jump/teams/list')out=await J.teams.list(p,u.searchParams.get('mode'));
     else if(u.pathname==='/api/jump/teams/state')out=J.teams.state(p);
     else if(u.pathname.startsWith('/api/jump/teams/'))out=await J.teams[action](p,d,J.DEFAULTS);
     await route.fulfill({json:out});
    }catch(e){await route.fulfill({status:e.status||500,json:{error:e.message}});}
   });
   console.log('opening',p.name);await page.goto('http://127.0.0.1:3201/',{waitUntil:'domcontentloaded'});await page.locator('[data-game="jump"]').click();await page.waitForTimeout(300);return page;
  }
  const a=await pageFor(players[0]),b=await pageFor(players[1]);
  // Real renderer contact sheet, with platforms, at native pixel scale x2.
  await a.evaluate(()=>{const c=document.createElement('canvas');c.id='worldSheet';c.width=900;c.height=1560;c.style='position:fixed;inset:0;z-index:99999;width:900px;height:1560px';document.body.append(c);const ctx=c.getContext('2d');ctx.scale(2,2);for(const [i,b] of ['city','forest','desert','snow'].entries()){ctx.save();ctx.translate(0,i*195);EixoJumpWorlds.draw(ctx,b,73,0,0);for(const [n,p] of EixoJumpPhysics.platforms(73,4).entries())EixoJumpWorlds.platform(ctx,b,p.x,165-p.y,p.w,n);ctx.fillStyle='#fff';ctx.font='8px monospace';ctx.fillText(b.toUpperCase(),12,16);ctx.restore();}});
  await a.locator('#worldSheet').screenshot({path:path.join(root,'tmp/jump-qa/worlds.png')});await a.locator('#worldSheet').evaluate(e=>e.remove());
  console.log('team UI');await a.locator('#jumpDuoButton').click();await a.locator('#jumpTeamName').fill('Pixel Crew');await a.locator('#jumpTeamCreate').click();await a.locator('#jumpTeamLobby').waitFor();
  const code=await a.locator('#jumpTeamLobby .room-code').textContent();
  await b.locator('#jumpDuoButton').click();await b.locator('#jumpTeamCode').fill(code);await b.locator('#jumpTeamJoin').click();await b.locator('#jumpTeamReady').click();
  await a.locator('#jumpTeamReady').click();await a.waitForTimeout(3700);
  assert.equal(await a.locator('#jumpTeamLobby').count(),0);await b.waitForTimeout(500);assert.equal(await b.locator('#jumpTeamLobby').count(),0);
  assert.match(await a.locator('#jumpWorld').textContent(),/DUO/);assert.match(await b.locator('#jumpWorld').textContent(),/DUO/);
  await a.keyboard.down('KeyW');await b.keyboard.down('KeyW');await a.waitForTimeout(600);await a.keyboard.up('KeyW');await b.keyboard.up('KeyW');
  await a.screenshot({path:path.join(root,'tmp/jump-qa/duo-desktop.png')});
  await a.locator('#jumpDuoButton').click();await a.locator('#jumpTeamLeave').click();await b.waitForTimeout(1300);assert.equal(await b.locator('#jumpEnd').isVisible(),true);
  await b.locator('#jumpRestart').click();assert.equal(await b.locator('#jumpTeamLobby').isVisible(),true);
  await b.locator('#jumpTeamLeave').click();await a.locator('[data-game="pulse"]').click();await a.locator('#gameCanvas').waitFor({state:'visible'});
  const mobile=await pageFor(players[2],{width:390,height:844});await mobile.screenshot({path:path.join(root,'tmp/jump-qa/mobile.png')});
  assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  // Exercise a full TRIO lobby in three independent sessions.
  await a.locator('[data-game="jump"]').click();
  await a.locator('#jumpTrioButton').click();await a.locator('#jumpTeamName').fill('Trio Crew');await a.locator('#jumpTeamCreate').click();
  const trioCode=await a.locator('#jumpTeamLobby .room-code').textContent();
  for(const page of [b,mobile]){await page.locator('#jumpTrioButton').click();await page.locator('#jumpTeamCode').fill(trioCode);await page.locator('#jumpTeamJoin').click();}
  await a.waitForTimeout(1200);for(const page of [b,mobile])await page.locator('#jumpTeamReady').click();
  await a.locator('#jumpTeamReady').click();await a.waitForTimeout(3700);
  for(const page of [a,b,mobile])assert.match(await page.locator('#jumpWorld').textContent(),/TRIO.*3\/3/);
  await a.screenshot({path:path.join(root,'tmp/jump-qa/trio-desktop.png')});
  for(const page of [a,b,mobile]){await page.locator('#jumpTrioButton').click();await page.locator('#jumpTeamLeave').click();}
  // Verify real PostgreSQL team inserts and ranking isolation with controlled landings.
  const physics=require(root+'/jump-physics');let clock=0;
  const service=require(root+'/jump-team-server').createService({now:()=>clock,physics:{...physics,step(s){s.bestPlatform=3;return s;}}});await service.init(db);
  const t=await service.create(players[0],{name:'SQL Team',mode:'duo',biome:'city'},J.DEFAULTS);await service.join(players[1],{code:t.code},J.DEFAULTS);
  service.ready(players[0],{ready:true});service.ready(players[1],{ready:true});clock=3100;service.tick();const r=service.state(players[0]);await service.finish(players[0],{runId:r.runId});
  assert.equal((await service.rankings('duo',1)).teams[0].score,36);assert.equal((await service.rankings('trio',1)).teams.length,0);
  assert.equal((await db.query('SELECT best_score FROM jump_scores WHERE player_id=$1',[players[0].id])).rows[0].best_score,120);
  assert.deepEqual(errors,[]);console.log('PASS: PostgreSQL migration preserves SOLO/PULSE; two browser contexts create/join/ready/auto-start/move/leave/end; PULSE switch; mobile; no page errors');
  console.log(JSON.stringify(await J.teams.rankings('duo',1)));
 }finally{await browser.close();server.close();await pg.close();clearTimeout(deadline);}
})().catch(e=>{console.error(e);process.exitCode=1;});

