'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
async function renderer(){
 const requests=[],window={EixoJumpMotion:require('../jump-motion')};
 class Image{set src(value){this.url=value;requests.push(value);this.naturalWidth=1920;this.naturalHeight=230;queueMicrotask(()=>this.onload());}}
 const context={window,Image,performance,fetch:async url=>{requests.push(url);return{ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,url.split('?')[0]),'utf8'))}}};
 vm.createContext(context);
 for(const file of ['jump-art-layout.js','jump-exact-renderer.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
 await window.EixoJumpExactArt.ready;return{art:window.EixoJumpExactArt,layout:window.EixoJumpArtLayout,requests};
}
test('JUMP requests only Astral scenery and the approved character, without obsolete image packs',async()=>{
 const {art,requests}=await renderer();assert.equal(art.isReady(),true);
 assert.equal(requests.filter(x=>/jump-astral\.webp/.test(x)).length,1);
 assert.equal(requests.filter(x=>/platform-astral\.png/.test(x)).length,1);
 assert.equal(requests.filter(x=>/ground-astral\.png/.test(x)).length,1);
 assert.ok(requests.some(url=>url.startsWith('/assets/game-v300/hero-parts.json?')));
 assert.equal(requests.length,5,'no inactive biomes or unused prop atlases should be downloaded');
 assert.doesNotMatch(fs.readFileSync(path.join(root,'index.html'),'utf8'),/<script src="(?:assets\/(?:jump15|jump-exact)\/|jump15-art\.js)/);
});
test('Astral ground and platform art place their visible surface exactly at collision height',async()=>{
 const {art,layout}=await renderer();
 for(const index of [0,1,7])for(const width of [84,172,960]){
  const calls=[],ctx={save(){},restore(){},drawImage(...args){calls.push(args)}};
  art.platform(ctx,'astral',25,310,width,index);
  const spec=layout.surfaces.astral[index===0?'ground':'platform'];
  assert.ok(calls.length>=3);
  for(const [image,sx,sy,sw,sh,dx,dy,dw,dh] of calls){
   assert.ok(image.url.includes('astral'));assert.equal(sy,spec.rect[1]);
   assert.ok(Math.abs(dy+(spec.surface-sy)*dh/sh-310)<1e-8,'painted lip and physical sole must coincide');
   assert.ok(sx>=spec.rect[0]&&sx+sw<=spec.rect[0]+spec.rect[2]);
  }
  assert.equal(calls[0][5],25);const last=calls.at(-1);assert.equal(last[5]+last[7],25+width);
 }
});
