'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('VIP no longer exposes TAG-colour controls, promises or writes',()=>{
 const vip=read('vip-fix.js'),extra=read('locale-extra.js'),server=read('server.js');
 for(const obsolete of ['vipTagCustomize','vipGlobalTagColor','vipCountryTagColor','renderTagControls','tagColors=','WORLD TAG COLOR','COR DA TAG MUNDIAL'])
  assert.ok(!vip.includes(obsolete),'obsolete VIP UI: '+obsolete);
 assert.doesNotMatch(vip,/personalizar as cores das TAGs|customize ranking TAG colors/);
 assert.doesNotMatch(extra,/worldTag:|countryTag:|lockOn:|lockOff:/);
 const customize=server.slice(server.indexOf('async function customize('),server.indexOf('async function buyVip('));
 assert.match(customize,/letter_styles=\$4,updated_at=NOW\(\)/);
 assert.doesNotMatch(customize,/data\.tagGlobalColor|data\.tagCountryColor|tag_global_color=\$5/);
 for(const file of ['ranking-fix.js','full-ranking-fix.js','jump.js','chat.js'])
  assert.doesNotMatch(read(file),/--rank-accent|tagGlobalColor|tagCountryColor/);
});

test('orbit sound engine supports six separate persisted controls and initializes silently',()=>{
 const source=read('audio-fix.js'),stored=new Map();
 const make=tag=>({tagName:tag,children:[],attributes:{},hidden:false,append(...nodes){this.children.push(...nodes);},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,fn){this['on'+k]=fn;}});
 const document={hidden:false,documentElement:{lang:'pt'},addEventListener(){},createElement:make};
 const localStorage={getItem:k=>stored.get(k)||null,setItem:(k,v)=>stored.set(k,v)};
 const window={};
 vm.runInNewContext(source,{window,document,localStorage,performance:{now:()=>0},setInterval(){return 1;},clearInterval(){},setTimeout(){}},{timeout:1000});
 const audio=window.EixoAudio;
 assert.ok(audio);
 for(const fn of ['hit','perfect','miss','jumpJump','jumpLand','jumpLose','jumpBiome','jumpStop','orbitStart','orbitStop','orbitTick','pixel','ui','mountMenu','toggleMenu'])assert.equal(typeof audio[fn],'function',fn);
 assert.equal(audio.getSettings().orbit,.22);
 audio.setOrbitVolume(.34);audio.setGameVolume(2);audio.setSiteVolume(-5);
 assert.equal(audio.getSettings().orbit,.34);assert.equal(audio.getSettings().game,1);assert.equal(audio.getSettings().site,0);
 assert.ok(stored.get('eixo_audio_settings').includes('"orbit":0.34'));
 const nav=make('nav');audio.mountMenu(nav);assert.equal(nav.children.length,1);
 const [toggle,panel]=nav.children[0].children;
 assert.equal(toggle.attributes['aria-expanded'],'false');
 assert.equal(panel.id,'eixoAudioControls');
 assert.equal(panel.children.filter(c=>c.tagName==='label').length,6);
 audio.toggleMenu();assert.equal(panel.hidden,false);
 audio.closeMenu();assert.equal(panel.hidden,true);
});

test('PULSE rotation plays on its live render loop and stops when the run ends',()=>{
 const game=read('game.js'),audio=read('audio-fix.js');
 assert.match(game,/EixoAudio\?\.orbitTick\?\.\(Orbit\.speed\(orbitState\.score\)\)/);
 assert.match(game,/EixoAudio\?\.orbitStart\?\.\(\)/);
 assert.match(game,/EixoAudio\?\.orbitStop\?\.\(\)/);
 assert.match(audio,/nextOrbit=now\+spacing/);
 assert.match(audio,/if\(!audible\('orbit'\)\|\|!pulseActive\)return/);
 assert.doesNotMatch(audio,/wave:'square'|type='square'/);
});

test('navigation owns the SOUND submenu and ranking names are larger in both contexts',()=>{
 const redesign=read('redesign.js'),css=read('interface-v7.css'),menu=read('orbit-audio.css');
 assert.match(redesign,/EixoAudio\?\.mountMenu\?\.\(nav\)/);
 assert.match(redesign,/EixoAudio\?\.toggleMenu\?\.\(\)/);
 assert.match(menu,/rx-sound-popover/);
 assert.match(menu,/cursor:url\('\/eixo-cursor-action\.svg/);
 assert.match(css,/rx-ranking-mount \.board \.rank-player-name/);
 assert.match(css,/rx-social \.board \.rank-player-name/);
 const html=read('index.html');
 assert.match(html,/orbit-audio\.css\?v=20260927-v315/);
 assert.match(html,/audio-fix\.js\?v=20260927-v315/);
});
