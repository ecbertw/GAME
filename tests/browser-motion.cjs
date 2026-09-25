'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+req.url.split('?')[0]);if(!file.startsWith(root+path.sep)){res.writeHead(404).end();return;}try{res.setHeader('Content-Type',file.endsWith('.png')?'image/png':'application/javascript');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.JUMP_BROWSER_CHANNEL?{channel:process.env.JUMP_BROWSER_CHANNEL}:{})});
  const page=await browser.newPage({viewport:{width:960,height:660}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/jump.js');
  await page.setContent('<body style="margin:0"><canvas width="960" height="660"></canvas></body>');
  for(const src of ['assets/jump-exact/jump-exact-runner.js','jump-motion.js','jump-exact-renderer.js'])await page.addScriptTag({url:'/'+src});
  await page.evaluate(async()=>{
   await EixoJumpExactArt.ready;
   window.paint=t=>{
    const c=document.querySelector('canvas').getContext('2d');c.fillStyle='#111b2d';c.fillRect(0,0,960,660);
    c.fillStyle='#f1f5ff';c.font='bold 22px sans-serif';c.fillText('JUMP · corrida e efeitos dos sapatos',24,34);
    c.font='14px sans-serif';c.fillStyle='#9caecc';c.fillText(t<2?'Corrida →':t<3?'Salto e aterragem':t<4.5?'← Mudança de direção':'Paragem · os efeitos dissipam-se',24,60);
    const fx=['glow','shimmer','frost','ember','mist','comet','prismatic','cosmic','electric'];
    const labels=['LUZ','OURO','GELO','BRASAS','NÉVOA','COMETA','PRISMA','CÓSMICO','RAIO'];
    for(let i=0;i<fx.length;i++){
     const cx=16+(i%3)*316,cy=80+Math.floor(i/3)*190;
     c.fillStyle='#19263b';c.fillRect(cx,cy,304,178);c.fillStyle='#a7b9da';c.font='bold 12px sans-serif';c.fillText(labels[i],cx+12,cy+20);
     c.save();c.translate(cx+7,cy+27);c.scale(1.5,1.5);
     c.strokeStyle='#405474';c.lineWidth=1;c.beginPath();c.moveTo(0,83);c.lineTo(192,83);c.stroke();
     let x,ground=true,height=0,moving=true,dir=1;
     if(t<2)x=25+t*55;
     else if(t<3){x=135;ground=t>2.98;height=Math.sin((t-2)*Math.PI)*28;moving=false;}
     else if(t<4.5){x=135-(t-3)*60;dir=-1;}
     else{x=45;moving=false;dir=-1;}
     EixoJumpExactArt.runner(c,x,83-height,{effect:fx[i]},'',false,t,{ground,moving,facing:dir,vy:ground?0:Math.cos((t-2)*Math.PI)*90,worldY:-height,cameraY:83,identity:'demo:'+fx[i],runId:'demo'});
     c.restore();
    }
   };
   for(let i=0;i<=90;i++)paint(i/60);
  });
  fs.mkdirSync(path.join(root,'tmp/jump-qa'),{recursive:true});
  await page.screenshot({path:path.join(root,'tmp/jump-qa/shoe-effects.png')});
  const video=await page.evaluate(async()=>{
   const canvas=document.querySelector('canvas'),stream=canvas.captureStream(30),recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9'}),chunks=[];
   recorder.ondataavailable=e=>chunks.push(e.data);const stopped=new Promise(r=>recorder.onstop=r);recorder.start();
   const start=performance.now();await new Promise(done=>{function frame(now){const t=(now-start)/1000;paint(Math.min(t,6));if(t<6)requestAnimationFrame(frame);else done();}requestAnimationFrame(frame);});
   recorder.stop();await stopped;stream.getTracks().forEach(t=>t.stop());
   const bytes=new Uint8Array(await new Blob(chunks).arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(binary);
  });
  fs.writeFileSync(path.join(root,'tmp/jump-qa/shoe-effects.webm'),Buffer.from(video,'base64'));
  await page.screenshot({path:path.join(root,'tmp/jump-qa/shoe-effects-idle.png')});
  assert.deepEqual(errors,[]);console.log('Motion preview recorded: running, jump/landing, reverse, idle; nine effects; no browser errors.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
