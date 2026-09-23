const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
// Optional integration: npm install --no-save @electric-sql/pglite playwright
// Then: npx playwright install chromium; node tests/browser-jump.cjs
const {PGlite}=require('@electric-sql/pglite');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),J=require(root+'/jump-server');
(async()=>{
 fs.mkdirSync(path.join(root,'tmp/jump-qa'),{recursive:true});
 console.log('initializing PostgreSQL');const deadline=setTimeout(()=>{console.error('Validation deadline');process.exit(1)},90000);
 const pg=new PGlite(),db={query:async(q,a)=>{const r=await pg.query(q,a);return{...r,rowCount:r.affectedRows||r.rows.length};}};
 await pg.exec('CREATE TABLE players(id UUID PRIMARY KEY,name TEXT,country TEXT,visual_name TEXT,vip_level INT DEFAULT 0,letter_styles JSONB,name_color TEXT,name_effect TEXT,tag_global_color TEXT,tag_country_color TEXT,best_score INT DEFAULT 777)');
 const players=[0,1,2].map(i=>({id:'00000000-0000-4000-8000-00000000000'+i,name:'Test'+i,country:'PT',vipLevel:6}));
 for(const p of players)await db.query('INSERT INTO players(id,name,country,vip_level) VALUES($1,$2,$3,$4)',[p.id,p.name,p.country,p.vipLevel]);
 console.log('migrating');await J.initDb(db);await db.query('INSERT INTO jump_scores(player_id,best_score,score_version) VALUES($1,120,2)',[players[0].id]);await J.initDb(db);
 assert.equal((await db.query('SELECT best_score FROM jump_scores')).rows[0].best_score,120);
 assert.equal((await db.query('SELECT best_score FROM players')).rows[0].best_score,777);

 const server=http.createServer((req,res)=>{let file=path.join(root,req.url.split('?')[0]==='/'?'index.html':req.url.split('?')[0]);try{res.setHeader('Content-Type',file.endsWith('.svg')?'image/svg+xml':file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(3201,'127.0.0.1',r));
 console.log('launching browser');const browser=await chromium.launch({headless:true}),errors=[];
 try{
  async function pageFor(p,viewport={width:1200,height:1000}){
   const ctx=await browser.newContext({viewport});await ctx.addInitScript(p=>{localStorage.setItem('eixo_player',JSON.stringify(p));localStorage.setItem('eixo_country','PT');},p);
   const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/api/**',async route=>{
    const req=route.request(),u=new URL(req.url()),d=req.method()==='POST'?req.postDataJSON()||{}:{};let out={ok:true,players:[],rooms:[],messages:[],total:0,pages:1,page:1,player:p};
    try{
     if(u.pathname==='/api/jump/run/start')out=await J.start(db,p,d);
     else if(u.pathname==='/api/jump/run/input')out=J.input(p,d);
     else if(u.pathname==='/api/jump/run/finish')out=await J.finish(db,p,d.runId,d.platform);
     else if(u.pathname==='/api/jump/run/leave')out=J.leave(p);
     else if(u.pathname==='/api/jump/rankings')out=await J.rankings(db,u.searchParams.get('country'),1);
     else if(u.pathname==='/api/jump/player-rank')out=await J.playerRank(db,p);
     else if(u.pathname==='/api/jump/cosmetics'&&req.method()==='GET')out={ok:true,outfit:await J.getOutfit(db,p),...J.wardrobeFor(p)};
     else if(u.pathname==='/api/jump/cosmetics'&&req.method()==='POST')out=await J.saveOutfit(db,p,d);
     await route.fulfill({json:out});
    }catch(e){await route.fulfill({status:e.status||500,json:{error:e.message}});}
   });
   await page.goto('http://127.0.0.1:3201/',{waitUntil:'domcontentloaded'});await page.locator('[data-game="jump"]').click();await page.waitForTimeout(250);return page;
  }

  const a=await pageFor(players[0]),b=await pageFor(players[1]);
  // World renderer contact sheet.
  await a.evaluate(()=>{const c=document.createElement('canvas');c.id='worldSheet';c.width=900;c.height=1560;c.style='position:fixed;inset:0;z-index:99999;width:900px;height:1560px';document.body.append(c);const ctx=c.getContext('2d');ctx.scale(2,2);for(const [i,b] of ['city','forest','desert','snow'].entries()){ctx.save();ctx.translate(0,i*195);EixoJumpWorlds.draw(ctx,b,73,0,0);for(const [n,p] of EixoJumpPhysics.platforms(73,4).entries())EixoJumpWorlds.platform(ctx,b,p.x,165-p.y,p.w,n);ctx.fillStyle='#fff';ctx.font='8px monospace';ctx.fillText(b.toUpperCase(),12,16);ctx.restore();}});
  await a.locator('#worldSheet').screenshot({path:path.join(root,'tmp/jump-qa/worlds.png')});await a.locator('#worldSheet').evaluate(e=>e.remove());

  // ONLINE is one matchmaking action. Two independent browsers must converge on
  // the same public instance and see a 20-player capacity.
  for(const page of [a,b]){await page.locator('#jumpJoinButton').click();assert.equal(await page.locator('#jumpOnlineMatch').count(),1);await page.locator('#jumpOnlineMatch').click();await page.waitForTimeout(350);}
  assert.match(await a.locator('#jumpWorld').textContent(),/ONLINE 2\/20/);
  assert.match(await b.locator('#jumpWorld').textContent(),/ONLINE 2\/20/);
  assert.equal(await a.locator('#jumpDuoButton').count(),0);assert.equal(await a.locator('#jumpTrioButton').count(),0);

  // Gold pants and expanded VIP effects are visible in the customizer.
  await a.locator('#jumpCustomizeButton').click();
  const pants=await a.locator('[data-jump-outfit="pants"] option').allTextContents();
  assert.ok(pants.some(x=>/DOURADO/.test(x)));
  const effects=await a.locator('[data-jump-outfit="effect"] option').allTextContents();
  for(const name of ['CINTILAÇÃO','HALO','GELO','BRASAS','NÉVOA','RASTO','PRISMÁTICO'])assert.ok(effects.some(x=>x.includes(name)),name+' missing');
  await a.locator('#jumpPanelClose').click();

  const mobile=await pageFor(players[2],{width:390,height:844});await mobile.screenshot({path:path.join(root,'tmp/jump-qa/mobile.png')});
  assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);
  console.log('PASS: JUMP worlds render; ONLINE converges two browser sessions into one 20-player lobby; DUO/TRIO UI is absent; VIP cosmetics render; mobile has no horizontal overflow.');
 }finally{await browser.close();server.close();await pg.close();clearTimeout(deadline);}
})().catch(e=>{console.error(e);process.exitCode=1;});
