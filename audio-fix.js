/* EIXO ORBIT AUDIO — a restrained, original Web Audio sound palette. No external samples. */
(function(){
 'use strict';
 const KEY='eixo_audio_settings';
 const defaults={master:.82,site:.20,map:.24,game:.48,orbit:.34,ui:.24};
 let state={...defaults};
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');if(saved&&typeof saved==='object')for(const key of Object.keys(defaults))if(saved[key]!==undefined)state[key]=Math.max(0,Math.min(1,Number(saved[key])||0));}catch(_){}
 const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state));}catch(_){}};
 let ctx=null,master=null,buses={},started=false,siteTimer=null,mapTimer=null,biome='',siteStep=0,mapStep=0,pulseActive=false,nextOrbit=0,nextPixel=0,lastFx='',lastFxTime=0;
 const pads={
  city:{interval:1320,tones:[220,261.63,329.63,392],base:110},
  forest:{interval:1570,tones:[196,246.94,293.66,392],base:98},
  snow:{interval:1740,tones:[261.63,329.63,392,493.88],base:130.81},
  astral:{interval:1450,tones:[174.61,220,261.63,349.23],base:87.31}
 };
 function ensure(){
  if(ctx)return true;
  const C=window.AudioContext||window.webkitAudioContext;
  if(!C)return false;
  try{
   ctx=new C();master=ctx.createGain();master.gain.value=state.master;master.connect(ctx.destination);
   for(const key of ['site','map','game','orbit','ui']){const g=ctx.createGain();g.gain.value=state[key];g.connect(master);buses[key]=g;}
   return true;
  }catch(_){ctx=null;return false;}
 }
 const audible=bus=>!!(ctx&&ctx.state==='running'&&buses[bus]&&state.master>0&&state[bus]>0&&!document.hidden);
 function setBus(key){if(!ctx)return;if(key==='master'){master.gain.setTargetAtTime(state.master,ctx.currentTime,.028);return;}if(buses[key])buses[key].gain.setTargetAtTime(key==='site'&&(biome||pulseActive)?state.site*.18:state[key],ctx.currentTime,.035);}
 function change(key,value){if(!(key in defaults))return;state[key]=clamp(value);save();if(ensure())setBus(key);if(ctx?.state==='suspended')void resume();}
 async function resume(){
  if(!ensure())return false;
  try{if(ctx.state==='suspended')await ctx.resume();}catch(_){return false;}
  if(ctx.state==='running'&&!started){
   started=true;siteTick();siteTimer=setInterval(siteTick,1020);
   if(biome)startBiomeTimer();
  }
  return ctx.state==='running';
 }
 function voice(bus,freq,{duration=.19,volume=.04,wave='sine',at=0,to=freq,attack=.025}={}){
  if(!audible(bus)||!Number.isFinite(freq)||freq<=0)return;
  const t=ctx.currentTime+Math.max(0,at),o=ctx.createOscillator(),g=ctx.createGain(),v=Math.max(.0001,volume);
  o.type=wave;o.frequency.setValueAtTime(freq,t);
  if(to!==freq)o.frequency.exponentialRampToValueAtTime(Math.max(35,to),t+Math.max(.04,duration*.76));
  g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(v,t+Math.min(attack,duration*.3));
  g.gain.exponentialRampToValueAtTime(.0001,t+duration);
  o.connect(g);g.connect(buses[bus]);
  o.onended=()=>{try{o.disconnect();g.disconnect();}catch(_){}};
  o.start(t);o.stop(t+duration+.04);
 }
 function shimmer(bus,freq,at=0,strength=.022){
  voice(bus,freq,{duration:.55,volume:strength,wave:'sine',at,attack:.075,to:freq*1.008});
  voice(bus,freq*2,{duration:.44,volume:strength*.19,wave:'triangle',at:at+.035,attack:.095,to:freq*2.015});
 }
 const siteNotes=[220,0,261.63,329.63,0,293.66,261.63,0,196,0,246.94,293.66,329.63,0,261.63,0];
 function siteTick(){
  if(!audible('site'))return;
  const i=siteStep++,freq=siteNotes[i%siteNotes.length];
  if(freq)shimmer('site',freq,0,.017);
  if(i%8===0)voice('site',110,{duration:2.4,volume:.011,attack:.28,to:110.5});
  if(i%16===14)shimmer('site',392,.2,.009);
 }
 function mapTick(){
  if(!biome||!audible('map'))return;
  const theme=pads[biome]||pads.forest,i=mapStep++,note=theme.tones[i%theme.tones.length];
  shimmer('map',note,0,.018);
  if(i%4===0)voice('map',theme.base,{duration:2.2,volume:.010,attack:.22,to:theme.base*1.005});
 }
 function startBiomeTimer(){
  if(mapTimer){clearInterval(mapTimer);mapTimer=null;}
  if(!biome)return;
  mapTick();mapTimer=setInterval(mapTick,(pads[biome]||pads.forest).interval);
 }
 function jumpBiome(name){
  const next=Object.hasOwn(pads,String(name||'').toLowerCase())?String(name).toLowerCase():'forest';
  if(biome===next&&mapTimer)return;
  biome=next;mapStep=0;if(ctx)setBus('site');
  if(started)startBiomeTimer();
 }
 function jumpStop(){biome='';if(mapTimer){clearInterval(mapTimer);mapTimer=null;}if(ctx)setBus('site');}
 function orbitStart(){if(pulseActive)return;pulseActive=true;nextOrbit=0;if(ctx)setBus('site');}
 function orbitStop(){pulseActive=false;if(ctx)setBus('site');}
 function gate(kind,wait=.11){const now=performance.now();if(kind===lastFx&&now-lastFxTime<wait)return false;lastFx=kind;lastFxTime=now;return true;}
 function ui(){if(!gate('ui',65))return;voice('ui',515,{duration:.09,volume:.025,attack:.009,to:650});}
 function hit(){if(!gate('hit'))return;voice('game',440,{duration:.17,volume:.062,to:660});shimmer('game',880,.055,.024);}
 function perfect(){if(!gate('perfect'))return;[523.25,659.25,880].forEach((f,i)=>voice('game',f,{duration:.26+i*.065,volume:.049-i*.006,at:i*.075,to:f*1.007,attack:.025}));}
 function miss(){if(!gate('miss'))return;voice('game',293.66,{duration:.25,volume:.055,to:174.61,attack:.025});voice('game',146.83,{duration:.36,volume:.027,at:.045,to:110});orbitStop();}
 function jumpJump(){if(!gate('jump',75))return;voice('game',280,{duration:.14,volume:.055,to:470,attack:.014});}
 function jumpLand(){if(!gate('land',75))return;voice('game',210,{duration:.12,volume:.037,to:145,attack:.009});}
 function jumpLose(){if(!gate('jump-lose',200))return;voice('game',310,{duration:.3,volume:.05,to:146.83});voice('game',155.56,{duration:.42,volume:.023,at:.08,to:87.31});}
 function pixel(){if(!gate('pixel',72))return;voice('game',610,{duration:.07,volume:.018,to:410,attack:.006});}
 function pixelWind(power=.35){if(!ctx||ctx.currentTime<nextPixel)return;nextPixel=ctx.currentTime+.19;voice('game',290+clamp(power)*105,{duration:.082,volume:.010+clamp(power)*.011,to:215});}
 function orbitTick(speed=2){
  if(!audible('orbit')||!pulseActive)return;
  const now=ctx.currentTime,spacing=Math.max(.33,.52-Math.min(4,Math.max(0,speed))*.032);
  if(now<nextOrbit)return;nextOrbit=now+spacing;
  voice('orbit',186+speed*13,{duration:.18,volume:.032,wave:'sine',to:128+speed*8,attack:.04});
  voice('orbit',402+speed*20,{duration:.115,volume:.013,at:.025,to:360+speed*13,attack:.022});
 }
 const names={pt:{sound:'SOM',master:'GERAL',site:'MÚSICA DO SITE',map:'AMBIENTE JUMP',game:'EFEITOS DOS JOGOS',orbit:'ROTAÇÃO PULSE',ui:'INTERFACE',hint:'Cada canal pode ser ajustado separadamente.'},
 en:{sound:'SOUND',master:'MASTER',site:'SITE MUSIC',map:'JUMP AMBIENCE',game:'GAME EFFECTS',orbit:'PULSE ROTATION',ui:'INTERFACE',hint:'Each channel has its own volume.'},
 es:{sound:'SONIDO',master:'GENERAL',site:'MÚSICA DEL SITIO',map:'AMBIENTE JUMP',game:'EFECTOS',orbit:'ROTACIÓN PULSE',ui:'INTERFAZ',hint:'Ajusta cada canal por separado.'},
 fr:{sound:'SON',master:'GÉNÉRAL',site:'MUSIQUE DU SITE',map:'AMBIANCE JUMP',game:'EFFETS',orbit:'ROTATION PULSE',ui:'INTERFACE',hint:'Réglez chaque canal séparément.'}};
 const lang=()=>names[String(document.documentElement.lang||'en').split('-')[0]]||names.en;
 const sliders=[['master','masterVolume'],['site','siteVolume'],['map','mapVolume'],['game','gameVolume'],['orbit','orbitVolume'],['ui','uiVolume']];
 let area=null,trigger=null,panel=null;
 function closeMenu(){if(panel)panel.hidden=true;if(trigger)trigger.setAttribute('aria-expanded','false');}
 function toggleMenu(force){
  if(!panel||!trigger)return;
  const open=typeof force==='boolean'?force:panel.hidden;
  panel.hidden=!open;trigger.setAttribute('aria-expanded',String(open));
 }
 function mountMenu(nav){
  if(!nav)return;
  closeMenu();area=document.createElement('div');area.className='rx-audio-menu';
  trigger=document.createElement('button');trigger.type='button';trigger.className='rx-sound-trigger';trigger.id='rxSoundToggle';trigger.setAttribute('aria-haspopup','true');trigger.setAttribute('aria-expanded','false');
  trigger.innerHTML='<span aria-hidden="true">♪</span> '+lang().sound+' <span class="rx-sound-chevron" aria-hidden="true">⌄</span>';
  panel=document.createElement('div');panel.className='rx-sound-popover';panel.id='eixoAudioControls';panel.hidden=true;panel.setAttribute('role','group');panel.setAttribute('aria-label',lang().sound);
  const h=document.createElement('div');h.className='rx-sound-heading';h.textContent='EIXO / '+lang().sound;
  panel.append(h);
  for(const [key,id] of sliders){
   const label=document.createElement('label');label.className='rx-sound-row';label.htmlFor=id;
   const caption=document.createElement('span');caption.textContent=lang()[key];
   const out=document.createElement('output');out.id=id+'Value';out.htmlFor=id;out.textContent=Math.round(state[key]*100)+'%';
   const input=document.createElement('input');input.type='range';input.id=id;input.min='0';input.max='1';input.step='.01';input.value=String(state[key]);input.setAttribute('aria-label',lang()[key]);
   input.addEventListener('input',()=>{change(key,input.value);out.textContent=Math.round(state[key]*100)+'%';});
   label.append(caption,out,input);panel.append(label);
  }
  const hint=document.createElement('p');hint.className='rx-sound-hint';hint.textContent=lang().hint;panel.append(hint);
  area.append(trigger,panel);nav.append(area);
  trigger.addEventListener('click',e=>{e.stopPropagation();toggleMenu();});
  panel.addEventListener('click',e=>e.stopPropagation());
 }
 document.addEventListener('click',e=>{if(area&&!area.contains(e.target))closeMenu();const clickable=e.target.closest?.('a,button,[role="button"]');if(clickable&&!clickable.closest?.('.rx-audio-menu'))ui();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();if(e.key==='Tab'&&panel&&!panel.hidden&&area&&!area.contains(document.activeElement))closeMenu();},{passive:true});
 const unlock=()=>{void resume();};
 document.addEventListener('pointerdown',unlock,{capture:true,passive:true,once:false});
 document.addEventListener('keydown',unlock,{capture:true,passive:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void resume();});
 window.EixoAudio={
  hit,perfect,miss,pixel,pixelWind,jumpJump,jumpLand,jumpLose,jumpBiome,jumpStop,orbitStart,orbitStop,orbitTick,ui,start:resume,resume,
  mountMenu,toggleMenu,closeMenu,getSettings:()=>({...state}),
  setSiteVolume:v=>change('site',v),setGameVolume:v=>change('game',v),setMapVolume:v=>change('map',v),
  setOrbitVolume:v=>change('orbit',v),setUiVolume:v=>change('ui',v),setMasterVolume:v=>change('master',v)
 };
})();
