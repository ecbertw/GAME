/* EIXO audio: longer melodic soundtrack with natural variation + isolated game feedback. */
(function(){
 const KEY='eixo_audio_settings';
 const state={site:.24,game:.48};
 try{Object.assign(state,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(_){}
 let ctx=null,master=null,siteGain=null,gameGain=null,started=false,timer=null,lastFx='',lastFxAt=0;
 const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(_){}}
 function ensure(){if(ctx){if(ctx.state==='suspended')ctx.resume();return true}try{ctx=new(window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();siteGain=ctx.createGain();gameGain=ctx.createGain();master.gain.value=.72;siteGain.gain.value=state.site;gameGain.gain.value=state.game;siteGain.connect(master);gameGain.connect(master);master.connect(ctx.destination);return true}catch(_){return false}}
 function note(freq,dur,wave,gain,dest,at){if(!ensure()||!freq)return;const t=ctx.currentTime+at,o=ctx.createOscillator(),g=ctx.createGain();o.type=wave;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.018);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+.03)}
 
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
 function loop(pi=0){if(!ensure())return;const d=playPhrase(pi);timer=setTimeout(()=>loop(pi+1),d)}
 function start(){if(!ensure())return;if(!started){started=true;loop(0)}}
 
 function fxGate(kind){const now=performance.now();if(lastFx===kind&&now-lastFxAt<120)return false;lastFx=kind;lastFxAt=now;return true}
 function hit(){if(!fxGate('hit')||!ensure())return;note(659.25,.075,'square',.075,gameGain,0);note(987.77,.11,'triangle',.052,gameGain,.055)}
 function perfect(){if(!fxGate('perfect')||!ensure())return;note(523.25,.07,'square',.08,gameGain,0);note(659.25,.07,'square',.07,gameGain,.055);note(783.99,.08,'triangle',.062,gameGain,.11);note(1046.5,.13,'triangle',.045,gameGain,.17)}
 function miss(){if(!fxGate('miss')||!ensure())return;note(247,.09,'triangle',.05,gameGain,0);note(185,.13,'sawtooth',.034,gameGain,.055);note(138.59,.2,'triangle',.028,gameGain,.12)}
 function bindGameFeedback(){const el=document.getElementById('feedback');if(!el||el.dataset.audioBridge)return;el.dataset.audioBridge='1';new MutationObserver(()=>{const v=(el.textContent||'').trim();if(v==='+2')perfect();else if(v==='+1')hit();else if(v==='MISS')miss()}).observe(el,{childList:true,characterData:true,subtree:true})}
 function controls(){
  const frame=document.querySelector('.game-frame');
  if(!frame||document.getElementById('eixoAudioControls'))return;
  const w=document.createElement('div');w.id='eixoAudioControls';w.className='audio-controls';
  w.innerHTML=`<label class="audio-slider"><span>MÚSICA</span><input id="siteVolume" type="range" min="0" max="1" step=".01" value="${state.site}" aria-label="Volume da música"></label><label class="audio-slider"><span>JOGO</span><input id="gameVolume" type="range" min="0" max="1" step=".01" value="${state.game}" aria-label="Volume do jogo"></label>`;
  frame.insertAdjacentElement('afterend',w);
  const sv=w.querySelector('#siteVolume'),gv=w.querySelector('#gameVolume');
  sv.addEventListener('input',e=>{state.site=clamp(e.target.value);ensure();siteGain.gain.value=state.site;save();start()});
  gv.addEventListener('input',e=>{state.game=clamp(e.target.value);ensure();gameGain.gain.value=state.game;save()});
 }
 function css(){if(document.getElementById('audioStyle'))return;const s=document.createElement('style');s.id='audioStyle';s.textContent=`#eixoAudioControls{display:flex!important;align-items:flex-start!important;justify-content:center!important;gap:28px!important;margin:0 auto 12px!important;padding:6px 10px!important;width:min(430px,calc(100% - 20px))!important;box-sizing:border-box!important}.audio-slider{display:flex!important;flex-direction:column!important;gap:5px!important;flex:1!important;min-width:0!important}.audio-slider span{font:5px 'Press Start 2P',monospace!important;color:#69747e!important;line-height:1!important;text-align:center!important}.audio-slider input[type=range]{appearance:none!important;-webkit-appearance:none!important;width:100%!important;height:3px!important;margin:2px 0!important;background:#34404a!important;border:0!important;outline:0!important;cursor:crosshair!important}.audio-slider input[type=range]::-webkit-slider-thumb{appearance:none!important;-webkit-appearance:none!important;width:8px!important;height:8px!important;border:0!important;border-radius:0!important;background:#24d477!important;cursor:crosshair!important}.audio-slider input[type=range]::-moz-range-thumb{width:8px!important;height:8px!important;border:0!important;border-radius:0!important;background:#24d477!important;cursor:crosshair!important}.audio-slider input[type=range]::-moz-range-track{height:3px!important;background:#34404a!important;border:0!important}@media(max-width:480px){#eixoAudioControls{gap:18px!important;width:calc(100% - 20px)!important;padding:5px 4px!important;margin-bottom:10px!important}.audio-slider span{font-size:4px!important}.audio-slider input[type=range]{height:3px!important}.audio-slider input[type=range]::-webkit-slider-thumb{width:7px!important;height:7px!important}.audio-slider input[type=range]::-moz-range-thumb{width:7px!important;height:7px!important}}`;document.head.appendChild(s)}
 function bind(){controls();css();bindGameFeedback();if(!document.body.dataset.audioBound){document.body.dataset.audioBound='1';document.addEventListener('pointerdown',start,{once:true})}}
 bind();setInterval(bind,500);
 window.EixoAudio={hit,perfect,miss,start,setSiteVolume(v){state.site=clamp(v);ensure();siteGain.gain.value=state.site;save();start()},setGameVolume(v){state.game=clamp(v);ensure();gameGain.gain.value=state.game;save()}};
})();