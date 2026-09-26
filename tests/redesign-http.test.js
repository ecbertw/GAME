'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),net=require('node:net'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
test('redesign pages and assets load while server files stay private', {timeout:20000}, async()=>{
 const probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
 const root=path.resolve(__dirname,'..'),env={...process.env,PORT:String(port),HOST:'127.0.0.1',ALLOW_MEMORY_DB:'1'};delete env.DATABASE_URL;
 const child=spawn(process.execPath,['server-start.js'],{cwd:root,env,stdio:['ignore','pipe','pipe']});
 try{
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Test server did not start')),10000);child.once('error',e=>{clearTimeout(timer);reject(e)});child.once('exit',code=>{clearTimeout(timer);reject(Error('Test server exited '+code))});child.stdout.on('data',chunk=>{if(String(chunk).includes('listening')){clearTimeout(timer);resolve()}});child.stderr.resume();});
  const base='http://127.0.0.1:'+port;
  for(const route of ['/','/jump','/pulse','/passport','/rankings','/rooms','/vip']){const r=await fetch(base+route);assert.equal(r.status,200,route);assert.match(await r.text(),/redesign.js/);}
  for(const file of ['/.env','/.git/HEAD','/server.js','/auth-server.js','/jump-server.js','/package.json','/ops/deploy/eixo-deploy.sh'])assert.equal((await fetch(base+file)).status,404,file);
  const redirect=await fetch(base+'/passport/?view=profile',{redirect:'manual'});assert.equal(redirect.status,308);assert.equal(redirect.headers.get('location'),'/passport?view=profile');
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const assets=[...html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css|svg)(?:\?[^" ]*)?)"/g)].map(m=>m[1]).filter(p=>!p.startsWith('http'));
  assert.ok(assets.length>40);for(const asset of assets)assert.equal((await fetch(new URL(asset,base))).status,200,asset);
 }finally{child.kill();}
});
