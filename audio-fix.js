/* EIXO audio: longer melodic soundtrack with natural variation + isolated game feedback. */
(function(){
 const KEY='eixo_audio_settings';
 const state={site:.24,game:.48,map:.32};
 try{Object.assign(state,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(_){}
 let ctx=null,master=null,siteGain=null,gameGain=null,mapGain=null,started=false,timer=null,lastFx='',lastFxAt=0,jumpTimer=null,jumpBiomeName='',jumpStep=0;
 const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(_){}}
 function ensure(){if(ctx)return true;try{ctx=new(window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();siteGain=ctx.createGain();gameGain=ctx.createGain();mapGain=ctx.createGain();master.gain.value=.72;siteGain.gain.value=state.site;gameGain.gain.value=state.game;mapGain.gain.value=state.map;siteGain.connect(master);gameGain.connect(master);mapGain.connect(master);master.connect(ctx.destination);return true}catch(_){return false}}
 async function resume(){if(!ensure())return false;try{if(ctx.state==='suspended')await ctx.resume();return ctx.state==='running'}catch(_){return false}}
 function ready(){if(!ensure())return false;if(ctx.state==='suspended')ctx.resume().catch(()=>{});return true}
 function note(freq,dur,wave,gain,dest,at){if(!ready()||!freq)return;const t=ctx.currentTime+at,o=ctx.createOscillator(),g=ctx.createGain();o.type=wave;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.018);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+.03)}
 function noise(dur=.06,gain=.02,cutoff=900,at=0){
  if(!ready())return;const t=ctx.currentTime+at,len=Math.max(1,Math.floor(ctx.sampleRate*dur)),buffer=ctx.createBuffer(1,len,ctx.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<len;i++)data[i]=(Math.random()*2-1)*(1-i/len);
  const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=buffer;filter.type='lowpass';filter.frequency.value=cutoff;
  g.gain.setValueAtTime(Math.max(.0001,gain),t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);src.connect(filter);filter.connect(g);g.connect(gameGain);src.start(t);src.stop(t+dur+.02);
 }
 
 /* Long theme: still one melodic voice. Variation comes from phrasing, rests and register,
    never from drums or a stack of simultaneous instruments. */
 const phrases=[
  {bpm:76,notes:[[392,.30],[440,.30],[523.25,.55],[0,.25],[493.88,.30],[440,.30],[392,.65],[0,.35],[329.63,.30],[392,.30],[440,.55],[0,.25],[392,.30],[349.23,.30],[329.63,.75],[0,.45]]},
  {bpm:80,notes:[[523.25,.24],[587.33,.24],[659.25,.42],[587.33,.24],[523.25,.42],[493.88,.24],[440,.55],[0,.28],[493.88,.24],[523.25,.24],[587.33,.42],[659.25,.24],[783.99,.48],[659.25,.24],[587.33,.55],[0,.40]]},
  {bpm:82,notes:[[659.25,.24],[587.33,.24],[523.25,.42],[493.88,.24],[523.25,.24],[587.33,.42],[659.25,.58],[0,.28],[783.99,.24],[659.25,.24],[587.33,.42],[523.25,.24],[493.88,.24],[440,.42],[392,.65],[0,.45]]},
  {bpm:78,notes:[[329.63,.30],[392,.30],[493.88,.55],[0,.25],[523.25,.30],[493.88,.30],[440,.65],[0,.30],[392,.24],[440,.24],[523.25,.42],[587.33,.24],[659.25,.48],[587.33,.24],[523.25,.60],[0,.40]]},
  {bpm:84,notes:[[392,.20],[440,.20],[493.88,.32],[523.25,.20],[587.33,.32],[659.25,.44],[587.33,.20],[523.25,.32],[493.88,.20],[440,.44],[0,.25],[493.88,.20],[523.25,.20],[587.33,.32],[659.25,.20],[783.99,.48],[659.25,.32],[587.33,.55],[0,.35]]},
  {bpm:82,notes:[[659.25,.20],[783.99,.20],[880,.36],[783.99,.20],[659.25,.36],[587.33,.20],[523.25,.50],[0,.25],[587.33,.20],[659.25,.20],[783.99,.36],[659.25,.20],[587.33,.36],[523.25,.20],[493.88,.52],[0,.35]]},
  {bpm:79,notes:[[440,.30],[493.88,.30],[587.33,.55],[0,.22],[659.25,.30],[587.33,.30],[523.25,.62],[0,.28],[493.88,.24],[523.25,.24],[587.33,.42],[659.25,.24],[698.46,.48],[659.25,.24],[587.33,.58],[0,.38]]},
  {bpm:76,notes:[[392,.30],[523.25,.30],[659.25,.58],[0,.25],[587.33,.30],[523.25,.30],[440,.70],[0,.30],[392,.30],[440,.30],[523.25,.55],[0,.25],[493.88,.30],[440,.30],[392,.95],[0,.65]]}
 ];
 function playPhrase(pi){
  if(!ensure())return;
  const p=phrases[pi%phrases.length],unit=60/p.bpm;
  let t=0;
  p.notes.forEach(([freq,beats])=>{if(freq)note(freq,unit*beats*.84,'square',.034,siteGain,t);t+=unit*beats});
  return t*1000+850;
 }
 function loop(pi=0){if(!ready())return;const d=playPhrase(pi);timer=setTimeout(()=>loop(pi+1),d)}
 async function start(){const ok=await resume();if(!ok)return;if(!started){started=true;loop(0)}}
 
 function fxGate(kind){const now=performance.now();if(lastFx===kind&&now-lastFxAt<120)return false;lastFx=kind;lastFxAt=now;return true}
 function hit(){if(!fxGate('hit')||!ready())return;note(659.25,.075,'square',.075,gameGain,0);note(987.77,.11,'triangle',.052,gameGain,.055)}
 function perfect(){if(!fxGate('perfect')||!ready())return;note(523.25,.07,'square',.08,gameGain,0);note(659.25,.07,'square',.07,gameGain,.055);note(783.99,.08,'triangle',.062,gameGain,.11);note(1046.5,.13,'triangle',.045,gameGain,.17)}
 function miss(){if(!fxGate('miss')||!ready())return;note(247,.09,'triangle',.05,gameGain,0);note(185,.13,'sawtooth',.034,gameGain,.055);note(138.59,.2,'triangle',.028,gameGain,.12)}
 function jumpJump(){if(!fxGate('jump')||!ready())return;note(330,.045,'square',.032,gameGain,0);note(495,.07,'triangle',.025,gameGain,.032)}
 function jumpLand(){if(!fxGate('land')||!ready())return;noise(.045,.018,650);note(105,.05,'triangle',.024,gameGain,0)}
 function jumpLose(){if(!fxGate('jump-lose')||!ready())return;noise(.16,.032,500);note(196,.1,'sawtooth',.036,gameGain,0);note(146.83,.15,'triangle',.034,gameGain,.07);note(98,.24,'sine',.026,gameGain,.16)}
 const jumpThemes={
  city:{interval:510,notes:[130.81,196,261.63,329.63,392],bass:[65.41,73.42,82.41,98],wave:'square'},
  forest:{interval:760,notes:[261.63,329.63,392,493.88,587.33],bass:[98,110,130.81,146.83],wave:'sine'},
  desert:{interval:690,notes:[146.83,174.61,220,261.63,329.63],bass:[73.42,82.41,98,110],wave:'triangle'},
  snow:{interval:830,notes:[329.63,440,493.88,659.25,783.99],bass:[82.41,98,110,130.81],wave:'sine'}
 };
 function jumpStop(){
  if(jumpTimer){clearInterval(jumpTimer);jumpTimer=null;}
  jumpBiomeName='';jumpStep=0;if(siteGain&&ctx)siteGain.gain.setTargetAtTime(state.site,ctx.currentTime,.08);
 }
 function jumpBiome(name){
  resume();const biome=String(name||'forest').toLowerCase(),theme=jumpThemes[biome]||jumpThemes.forest;
  if(jumpBiomeName===biome&&jumpTimer)return;
  if(jumpTimer)clearInterval(jumpTimer);jumpBiomeName=biome;jumpStep=0;
  if(siteGain&&ctx)siteGain.gain.setTargetAtTime(state.site,ctx.currentTime,.08);
  const tick=()=>{if(!ready())return;const i=jumpStep++,n=theme.notes[i%theme.notes.length],b=theme.bass[Math.floor(i/2)%theme.bass.length];note(n,.18,theme.wave,.011,mapGain,0);if(i%2===0)note(b,.35,'sine',.0075,mapGain,.015);if(biome==='city'&&i%4===3)note(n*2,.05,'square',.0055,mapGain,.08);if(biome==='forest'&&i%5===4)note(n*1.5,.28,'sine',.006,mapGain,.11);if(biome==='desert'&&i%4===2)note(n*.75,.24,'triangle',.006,mapGain,.1);if(biome==='snow'&&i%3===2)note(n*2,.4,'sine',.0045,mapGain,.14);};
  tick();jumpTimer=setInterval(tick,theme.interval);
 }
 // Short dry tap (22–32 ms), inspired by compact UI clicks; no ringing tail.
 // Reference: https://kenney.nl/assets/interface-sounds (original synthesis, no sample used).
 // Both particle interactions share one voice, so dense movement cannot stack sounds.
 let nextPixelAt=0;
 function softPixel(intensity=.35,direct=false){
  if(state.game<=0||!ready())return;
  const now=ctx.currentTime;
  if(now<nextPixelAt)return;
  nextPixelAt=now+(direct?.10:.18);
  const strength=clamp(intensity),dur=direct?.032:.022;
  const o=ctx.createOscillator(),g=ctx.createGain();
  o.type='sine';
  o.frequency.setValueAtTime(direct?620:470,now);
  o.frequency.exponentialRampToValueAtTime(direct?260:230,now+dur);
  g.gain.setValueAtTime(.0001,now);
  g.gain.linearRampToValueAtTime(direct?.022:.006+strength*.003,now+.002);
  g.gain.exponentialRampToValueAtTime(.0001,now+dur);
  o.connect(g);g.connect(gameGain);
  o.onended=()=>{o.disconnect();g.disconnect()};
  o.start(now);o.stop(now+dur+.003);
 }
 function pixel(){softPixel(1,true)}
 function pixelWind(intensity=.35){softPixel(intensity)}
 function controls(){
  const frame=document.querySelector('.game-frame');
  if(!frame||document.getElementById('eixoAudioControls'))return;
  const w=document.createElement('div');w.id='eixoAudioControls';w.className='audio-controls';
  w.innerHTML=`<label class="audio-slider"><span>MÚSICA</span><input id="siteVolume" type="range" min="0" max="1" step=".01" value="${state.site}" aria-label="Volume da música do site"></label><label class="audio-slider"><span>JOGO</span><input id="gameVolume" type="range" min="0" max="1" step=".01" value="${state.game}" aria-label="Volume dos efeitos do jogo"></label><label class="audio-slider"><span>MAPA</span><input id="mapVolume" type="range" min="0" max="1" step=".01" value="${state.map}" aria-label="Volume da música do mapa"></label>`;
  frame.insertAdjacentElement('afterend',w);
  const sv=w.querySelector('#siteVolume'),gv=w.querySelector('#gameVolume'),mv=w.querySelector('#mapVolume');
  sv.addEventListener('input',e=>{state.site=clamp(e.target.value);ensure();siteGain.gain.value=state.site;save();start()});
  gv.addEventListener('input',e=>{state.game=clamp(e.target.value);ensure();gameGain.gain.value=state.game;save()});
  mv.addEventListener('input',e=>{state.map=clamp(e.target.value);ensure();mapGain.gain.value=state.map;save();});
 }
 function css(){if(document.getElementById('audioStyle'))return;const s=document.createElement('style');s.id='audioStyle';s.textContent=`#eixoAudioControls{display:flex!important;align-items:flex-start!important;justify-content:center!important;gap:28px!important;margin:0 auto 12px!important;padding:6px 10px!important;width:min(620px,calc(100% - 20px))!important;box-sizing:border-box!important}.audio-slider{display:flex!important;flex-direction:column!important;gap:5px!important;flex:1!important;min-width:0!important}.audio-slider span{font:5px 'Press Start 2P',monospace!important;color:#69747e!important;line-height:1!important;text-align:center!important}.audio-slider input[type=range]{appearance:none!important;-webkit-appearance:none!important;width:100%!important;height:3px!important;margin:2px 0!important;background:#34404a!important;border:0!important;outline:0!important;cursor:crosshair!important}.audio-slider input[type=range]::-webkit-slider-thumb{appearance:none!important;-webkit-appearance:none!important;width:8px!important;height:8px!important;border:0!important;border-radius:0!important;background:#24d477!important;cursor:crosshair!important}.audio-slider input[type=range]::-moz-range-thumb{width:8px!important;height:8px!important;border:0!important;border-radius:0!important;background:#24d477!important;cursor:crosshair!important}.audio-slider input[type=range]::-moz-range-track{height:3px!important;background:#34404a!important;border:0!important}@media(max-width:480px){#eixoAudioControls{gap:18px!important;width:calc(100% - 20px)!important;padding:5px 4px!important;margin-bottom:10px!important}.audio-slider span{font-size:4px!important}.audio-slider input[type=range]{height:3px!important}.audio-slider input[type=range]::-webkit-slider-thumb{width:7px!important;height:7px!important}.audio-slider input[type=range]::-moz-range-thumb{width:7px!important;height:7px!important}}`;document.head.appendChild(s)}
 function bind(){controls();css();if(!document.body.dataset.audioBound){document.body.dataset.audioBound='1';const unlock=()=>resume().then(()=>start());document.addEventListener('pointerdown',unlock,{capture:true,passive:true});document.addEventListener('keydown',unlock,{capture:true,passive:true});document.addEventListener('touchstart',unlock,{capture:true,passive:true})}}
 bind();
 window.EixoAudio={hit,perfect,miss,pixel,pixelWind,jumpJump,jumpLand,jumpLose,jumpBiome,jumpStop,start,resume,setSiteVolume(v){state.site=clamp(v);ensure();siteGain.gain.value=state.site;save();start()},setGameVolume(v){state.game=clamp(v);ensure();gameGain.gain.value=state.game;save()},setMapVolume(v){state.map=clamp(v);ensure();mapGain.gain.value=state.map;save()}};
})();
