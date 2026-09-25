'use strict';
// Optional visual integration: NODE_PATH may point to an installed Playwright.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
  if(!file.startsWith(root+path.sep)){res.writeHead(404);res.end();return;}
  try{res.setHeader('Content-Type',({'.png':'image/png','.html':'text/html','.css':'text/css','.svg':'image/svg+xml'})[path.extname(file)]||'application/javascript');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.JUMP_BROWSER_CHANNEL?{channel:process.env.JUMP_BROWSER_CHANNEL}:{})});
  const page=await browser.newPage({viewport:{width:1000,height:1230},deviceScaleFactor:1});
  const failures=[];page.on('pageerror',e=>failures.push(e.message));page.on('response',r=>{if(r.status()>=400)failures.push(r.url());});
  await page.goto('http://127.0.0.1:'+server.address().port+'/jump.js');
  await page.setContent('<body style="margin:0;background:#152032;color:white;font:16px sans-serif"><canvas id="preview" width="1000" height="1230"></canvas></body>');
  for(const name of ['bg-city','bg-forest','bg-desert','bg-snow','runner','platform-city','platform-forest','platform-desert','platform-snow','effects'])await page.addScriptTag({url:'/assets/jump-exact/jump-exact-'+name+'.js'});
  await page.addScriptTag({url:'/jump-exact-renderer.js'});
  await page.evaluate(async()=>{
   const art=window.EixoJumpExactArt;await art.ready;
   const c=document.getElementById('preview').getContext('2d');
   for(const [i,name] of ['city','forest','desert','snow'].entries()){
    const x=20+(i%2)*490,y=35+Math.floor(i/2)*255;c.fillStyle='white';c.fillText(name.toUpperCase(),x,y-9);
    c.save();c.translate(x,y);art.background(c,name,450,195);
    art.platform(c,name,0,163,450,0);
    for(let n=1;n<=4;n++)art.platform(c,name,18+(n-1)*108,45+(n%2)*55,70,n,{fragile:n===3,progress:.8});
    art.runner(c,220,163,{},'',false,0,{ground:true});c.restore();
   }
   c.fillStyle='white';c.fillText('RUN: alternating legs · JUMP: clean upper margin',20,560);
   for(let i=0;i<8;i++){
    c.save();c.translate(55+i*122,690);c.scale(2,2);
    art.runner(c,0,0,{},'',false,i/16,{ground:true,moving:true});c.restore();
   }
   for(let i=0;i<3;i++){
    c.save();c.translate(150+i*300,880);c.scale(3,3);
    art.runner(c,0,0,{},'',false,0,{ground:false,vy:[150,0,-100][i]});c.restore();
   }
   c.fillStyle='white';c.fillText('Platform silhouettes on a plain background',20,940);
   for(const [i,name] of ['city','forest','desert','snow'].entries())for(let n=1;n<=4;n++){
    c.save();c.translate(30+(n-1)*235,980+i*60);c.scale(2,2);art.platform(c,name,0,0,85,n);c.restore();
   }
  });
  fs.mkdirSync(path.join(root,'tmp/jump-qa'),{recursive:true});
  await page.screenshot({path:path.join(root,'tmp/jump-qa/renderer.png')});
  const checks=await page.evaluate(()=>{
   const art=window.EixoJumpExactArt;
   function sample(time,motion){const cv=document.createElement('canvas');cv.width=112;cv.height=160;const c=cv.getContext('2d');c.scale(2,2);art.runner(c,28,70,{},'',false,time,motion);return c.getImageData(0,0,112,160).data;}
   function components(p,w){const n=p.length/4,seen=new Uint8Array(n);let count=0;for(let i=0;i<n;i++){if(seen[i]||p[i*4+3]<32)continue;count++;const q=[i];seen[i]=1;for(let j=0;j<q.length;j++){const at=q[j],x=at%w,y=Math.floor(at/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy,k=yy*w+xx;if(xx<0||xx>=w||k<0||k>=n||seen[k]||p[k*4+3]<32)continue;seen[k]=1;q.push(k);}}}return count;}
   const jumpComponents=[150,0,-100].map(vy=>components(sample(0,{ground:false,vy}),112));
   const a=sample(.0625,{ground:true,moving:true}),b=sample(.3125,{ground:true,moving:true});
   let changedLegPixels=0;for(let y=108;y<148;y++)for(let x=0;x<112;x++){const i=(y*112+x)*4;if(a[i+3]!==b[i+3])changedLegPixels++;}
   const cv=document.createElement('canvas');cv.width=450;cv.height=195;art.background(cv.getContext('2d'),'desert',450,195);
   return {changedLegPixels,jumpComponents,backgroundSample:[...cv.getContext('2d').getImageData(225,90,1,1).data]};
  });
  assert.ok(checks.changedLegPixels>50,JSON.stringify(checks));assert.deepEqual(checks.jumpComponents,[1,1,1]);assert.equal(checks.backgroundSample[3],255);assert.deepEqual(failures,[]);
  // Exercise the actual game page and its network input, not just the gallery.
  const game=await browser.newPage();const inputs=[];
  game.on('pageerror',e=>failures.push(e.message));
  await game.addInitScript(()=>localStorage.setItem('eixo_player',JSON.stringify({id:'00000000-0000-4000-8000-000000000001',name:'Renderer QA',country:'PT',vipLevel:0})));
  await game.route('**/api/**',async route=>{
   const req=route.request(),url=new URL(req.url());let out={ok:true,players:[],rooms:[],messages:[],total:0,pages:1,page:1};
   if(url.pathname==='/api/jump/run/start')out={ok:true,runId:'qa-run',seed:73,biome:'desert',mode:'solo',outfit:{},worldTime:0};
   if(url.pathname==='/api/jump/run/input'){inputs.push(req.postDataJSON());out={ok:true,state:{score:0},peers:[]};}
   await route.fulfill({json:out});
  });
  await game.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded'});
  await game.locator('[data-game="jump"]').click();
  await game.waitForFunction(()=>window.eixoJump?.isActive());
  await game.keyboard.down('a');await game.keyboard.down('ArrowLeft');await game.keyboard.up('a');
  await game.waitForTimeout(150);assert.equal(inputs.at(-1)?.left,true);
  await game.keyboard.up('ArrowLeft');await game.waitForTimeout(150);assert.equal(inputs.at(-1)?.left,false);
  await game.keyboard.down('d');await game.evaluate(()=>window.dispatchEvent(new Event('blur')));
  await game.waitForTimeout(150);assert.equal(inputs.at(-1)?.right,false);await game.keyboard.up('d');
  await game.locator('#jumpCanvas').screenshot({path:path.join(root,'tmp/jump-qa/desert-game.png')});
  assert.deepEqual(failures,[]);
  console.log('Renderer and game-page browser checks passed:',JSON.stringify(checks));
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
