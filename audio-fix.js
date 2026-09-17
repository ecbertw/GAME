/* EIXO audio: simple melodic soundtrack + isolated game feedback. */
(function(){
 const KEY='eixo_audio_settings';
 const state={site:.24,game:.48};
 try{Object.assign(state,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(_){}
 let ctx=null,master=null,siteGain=null,gameGain=null,started=false,timer=null,lastFx='',lastFxAt=0;
 const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(_){}}
 function ensure(){if(ctx){if(ctx.state==='suspended')ctx.resume();return true}try{ctx=new(window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();siteGain=ctx.createGain();gameGain=ctx.createGain();master.gain.value=.72;siteGain.gain.value=state.site;gameGain.gain.value=state.game;siteGain.connect(master);gameGain.connect(master);master.connect(ctx.destination);return true}catch(_){return false}}
 function note(freq,dur,wave,gain,dest,at){if(!ensure()||!freq)return;const t=ctx.currentTime+at,o=ctx.createOscillator(),g=ctx.createGain();o.type=wave;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.018);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+.03)}
 
 /* One melody, no drums and no simultaneous backing layer. The rests are intentional. */
 const phrases=[
  {bpm:76,notes:[[392,.30],[440,.30],[523.25,.55],[0,.25],[493.88,.30],[440,.30],[392,.65],[0,.35],[329.63,.30],[392,.30],[440,.55],[0,.25],[392,.30],[349.23,.30],[329.63,.75],[0,.45]]},
  {bpm:78,notes:[[523.25,.30],[587.33,.30],[659.25,.55],[0,.25],[587.33,.30],[523.25,.30],[493.88,.65],[0,.35],[440,.30],[493.88,.30],[523.25,.55],[0,.25],[440,.30],[392,.30],[329.63,.75],[0,.45]]},
  {bpm:80,notes:[[329.63,.30],[392,.30],[493.88,.55],[0,.25],[523.25,.30],[493.88,.30],[440,.65],[0,.35],[392,.30],[440,.30],[523.25,.55],[0,.25],[587.33,.30],[523.25,.30],[493.88,.75],[0,.45]]},
  {bpm:74,notes:[[392,.38],[523.25,.38],[659.25,.70],[0,.30],[587.33,.38],[523.25,.38],[440,.75],[0,.35],[392,.38],[440,.38],[523.25,.70],[0,.30],[493.88,.38],[440,.38],[392,.95],[0,.65]]}
 ];
 function playPhrase(pi){
  if(!ensure())return;
  const p=phrases[pi%phrases.length],unit=60/p.bpm;
  let t=0;
  p.notes.forEach(([freq,beats])=>{if(freq)note(freq,unit*beats*.82,'square',.034,siteGain,t);t+=unit*beats});
  return t*1000+900;
 }
 function loop(pi=0){if(!ensure())return;const d=playPhrase(pi);timer=setTimeout(()=>loop(pi+1),d)}
 function start(){if(!ensure())return;if(!started){started=true;loop(0)}}
 
 function fxGate(kind){const now=performance.now();if(lastFx===kind&&now-lastFxAt<120)return false;lastFx=kind;lastFxAt=now;return true}
 function hit(){if(!fxGate('hit')||!ensure())return;note(659.25,.075,'square',.075,gameGain,0);note(987.77,.11,'triangle',.052,gameGain,.055)}
 function perfect(){if(!fxGate('perfect')||!ensure())return;note(523.25,.07,'square',.08,gameGain,0);note(659.25,.07,'square',.07,gameGain,.055);note(783.99,.08,'triangle',.062,gameGain,.11);note(1046.5,.13,'triangle',.045,gameGain,.17)}
 function miss(){if(!fxGate('miss')||!ensure())return;note(247,.09,'triangle',.05,gameGain,0);note(185,.13,'sawtooth',.034,gameGain,.055);note(138.59,.2,'triangle',.028,gameGain,.12)}
 
 function bindGameFeedback(){const el=document.getElementById('feedback');if(!el||el.dataset.audioBridge)return;el.dataset.audioBridge='1';new MutationObserver(()=>{const v=(el.textContent||'').trim();if(v==='+2')perfect();else if(v==='+1')hit();else if(v==='MISS')miss()}).observe(el,{childList:true,characterData:true,subtree:true})}
 function controls(){const menu=document.getElementById('playerMenu');if(!menu||document.getElementById('eixoAudioControls'))return;const w=document.createElement('div');w.id='eixoAudioControls';w.className='audio-controls';w.innerHTML=`<div class="audio-title">♪ SOM</div><div class="audio-row"><button type="button" class="audio-button">SOM DO SITE</button><input id="siteVolume" type="range" min="0" max="1" step=".01" value="${state.site}" aria-label="Volume do site"></div><div class="audio-row"><button type="button" class="audio-button">SOM DO JOGO</button><input id="gameVolume" type="range" min="0" max="1" step=".01" value="${state.game}" aria-label="Volume do jogo"></div>`;menu.appendChild(w);const sv=w.querySelector('#siteVolume'),gv=w.querySelector('#gameVolume'),buttons=w.querySelectorAll('.audio-button');buttons[0].addEventListener('click',e=>{e.stopPropagation();start()});buttons[1].addEventListener('click',e=>{e.stopPropagation();perfect()});sv.addEventListener('input',e=>{state.site=clamp(e.target.value);ensure();siteGain.gain.value=state.site;save();start()});gv.addEventListener('input',e=>{state.game=clamp(e.target.value);ensure();gameGain.gain.value=state.game;save()})}
 function css(){if(document.getElementById('audioStyle'))return;const s=document.createElement('style');s.id='audioStyle';s.textContent=`#eixoAudioControls{display:flex!important;flex-direction:column!important;gap:7px!important;margin:8px 6px 3px!important;padding:9px 8px!important;border-top:1px solid #34404a!important;background:#080d12!important}.audio-controls .audio-title{font-size:6px!important;color:#24d477!important;margin-bottom:2px!important}.audio-row{display:grid!important;grid-template-columns:auto 1fr!important;gap:8px!important;align-items:center!important}.audio-button{appearance:none!important;border:1px solid #46535f!important;background:#111922!important;color:#dfe5e9!important;padding:7px 6px!important;font:6px 'Press Start 2P',monospace!important;cursor:crosshair!important;white-space:nowrap!important}.audio-button:hover{border-color:#24d477!important;color:#24d477!important}.audio-row input[type=range]{display:block!important;width:78px!important;min-width:78px!important;height:5px!important;margin:0!important;accent-color:#24d477!important;cursor:crosshair!important}`;document.head.appendChild(s)}
 function bind(){controls();css();bindGameFeedback();if(!document.body.dataset.audioBound){document.body.dataset.audioBound='1';document.addEventListener('pointerdown',start,{once:true})}}
 bind();setInterval(bind,500);
 window.EixoAudio={hit,perfect,miss,start,setSiteVolume(v){state.site=clamp(v);ensure();siteGain.gain.value=state.site;save();start()},setGameVolume(v){state.game=clamp(v);ensure();gameGain.gain.value=state.game;save()}};
})();