'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'tmp/jump-qa');
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+req.url.split('?')[0]);if(!file.startsWith(root+path.sep)){res.writeHead(404).end();return;}try{res.setHeader('Content-Type',file.endsWith('.png')?'image/png':file.endsWith('.webp')?'image/webp':'application/javascript');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true,channel:'chrome'});const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/jump.js');await page.setContent('<body style="margin:0;background:#172339"><canvas width="1440" height="1000"></canvas></body>');
  for(const src of ['jump-motion.js','jump-art-layout.js','jump-exact-renderer.js'])await page.addScriptTag({url:'/'+src});
  const report=await page.evaluate(async()=>{
   const A=EixoJumpExactArt;await A.ready;if(!A.isReady())throw Error('Missing component');
   const c=document.querySelector('canvas').getContext('2d');c.fillStyle='#172339';c.fillRect(0,0,1440,1000);
   const alpha={};for(const [part,img] of Object.entries(A.images.parts)){const cv=document.createElement('canvas');cv.width=img.naturalWidth;cv.height=img.naturalHeight;const q=cv.getContext('2d');q.drawImage(img,0,0);alpha[part]=q.getImageData(0,0,1,1).data[3];}
   function draw(id,x,y,scale,frames,extra={},style={}){c.save();c.translate(x,y);c.scale(scale,scale);for(let n=0;n<=frames;n++){c.globalAlpha=n===frames?1:0;A.runner(c,0,0,style,'',false,n/120,{preview:true,moving:true,ground:true,identity:id,...extra});}c.restore();}
   c.fillStyle='#c2eaff';c.font='20px sans-serif';c.fillText('RUN · eight moments from the restored authored animation',24,32);
   for(let i=0;i<8;i++)draw('run'+i,90+i*178,260,2.9,120+Math.round(i*120*112/216/8));
   c.fillText('IDLE · RISE · APEX · FALL · LEFT · NO CAPE · CUSTOM COLOURS',24,324);
   const states=[{moving:false},{ground:false,vy:350},{ground:false,vy:0},{ground:false,vy:-350},{facing:-1},{},{}];
   for(let i=0;i<states.length;i++)draw('state'+i,100+i*200,585,3.3,150,states[i],i===5?{accessory:'none'}:i===6?{hair:'#ffffff',top:'#39b86a',pants:'#6f5cff',shoes:'#ff7a2f',accent:'#00e5ff'}:{});
   c.fillText('ASTRAL · gameplay scale',24,650);c.save();c.translate(20,670);c.beginPath();c.rect(0,0,1400,300);c.clip();A.background(c,'astral',1400,300);A.platform(c,'astral',0,250,1400,0);for(let i=0;i<4;i++)A.runner(c,200+i*300,250,{},'',false,2,{moving:false,ground:true,identity:'scene'+i});c.restore();
   window.animateRig=(t)=>{c.clearRect(0,0,1440,1000);c.fillStyle='#172339';c.fillRect(0,0,1440,1000);for(let i=0;i<4;i++){c.save();c.translate(200+i*350,650);c.scale(5,5);const flight=i===1,ground=!flight||t%3>1,vy=flight?400-(t%3)*800:0;A.runner(c,0,0,i===3?{accessory:'none'}:{},'',false,t,{preview:true,moving:i!==2,ground,vy,facing:i===3?-1:1,identity:'video'+i});c.restore();}};
   return{alpha};
  });
  for(const [part,a] of Object.entries(report.alpha))assert.equal(a,0,part+' needs true transparency');fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'authored-v9.png')});
  const video=await page.evaluate(async()=>{const cv=document.querySelector('canvas'),stream=cv.captureStream(60),rec=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9'}),chunks=[];rec.ondataavailable=e=>chunks.push(e.data);const done=new Promise(r=>rec.onstop=r);rec.start();const start=performance.now();await new Promise(resolve=>{function frame(now){animateRig((now-start)/1000);if(now-start<6000)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame)});rec.stop();await done;stream.getTracks().forEach(t=>t.stop());const bytes=new Uint8Array(await new Blob(chunks).arrayBuffer());let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(text);});
  fs.writeFileSync(path.join(out,'authored-v9.webm'),Buffer.from(video,'base64'));
  const source=fs.readFileSync(path.join(root,'jump.js'),'utf8'),customize=source.slice(source.indexOf('async function customize(){'),source.indexOf('function renderJumpRoomMembers'));
  const service=require('../jump-server'),wardrobe=service.wardrobeFor({vipLevel:0});
  await page.evaluate(data=>{
   window.fixture={...data,outfit:{...data.defaults,top:'#39b86a',accessory:'none'}};window.outfit=null;window.wardrobe=null;window.fixedAppearance=null;window.run={};window.panel=null;window.facing=1;
   window.$=id=>document.getElementById(id);window.getPlayer=()=>({id:'test',vipLevel:0});window.lang=()=> 'pt';window.txt=x=>x;window.esc=x=>String(x);window.showError=e=>{throw Error(e)};
   window.api=async(url,opts)=>{if(opts){window.persisted=JSON.parse(opts.body).outfit;return{outfit:window.persisted}}return window.fixture};
   window.modal=(title,html)=>{window.panel=document.createElement('section');panel.innerHTML=html;document.body.appendChild(panel)};window.closePanel=()=>{panel?.remove();window.panel=null};window.drawCharacter=()=>{};
  },wardrobe);
  await page.addScriptTag({content:customize+'\nwindow.openTestWardrobe=customize;'});await page.evaluate(()=>openTestWardrobe());
  await page.click('#jumpResetOutfit');
  const restored=await page.evaluate(()=>Object.fromEntries([...document.querySelectorAll('[data-jump-outfit]')].map(s=>[s.dataset.jumpOutfit,s.value])));assert.deepEqual(restored,wardrobe.defaults);
  await page.click('#jumpSave');assert.deepEqual(await page.evaluate(()=>window.persisted),wardrobe.defaults);
  assert.deepEqual(errors,[]);console.log('Individual alpha assets, enlarged poses, Astral view, continuous motion and actual wardrobe reset/save passed; no browser errors.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
