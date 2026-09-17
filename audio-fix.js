/* EIXO audio: original catchy site loop + short game result sounds. */
(function(){
 const KEY='eixo_audio_settings';
 const state={site:.32,game:.48};
 try{Object.assign(state,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(_){}
 let ctx=null,master=null,siteGain=null,gameGain=null,siteTimer=null,siteStarted=false,lastFeedback='';
 const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(_){} }
 function ensure(){if(ctx){if(ctx.state==='suspended')ctx.resume();return true}try{ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();siteGain=ctx.createGain();gameGain=ctx.createGain();master.gain.value=.8;siteGain.gain.value=state.site;gameGain.gain.value=state.game;siteGain.connect(master);gameGain.connect(master);master.connect(ctx.destination);return true}catch(_){return false}}
 function tone(freq,dur,type,gain,dest,when=0){if(!ensure())return;const t=ctx.currentTime+when,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+.018);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+.04)}
 /* Longer ~45s arrangement: A/B/C/D sections, recurring hook with variation and breathing space. */
 const sections=[
  {bpm:104,notes:[261.63,329.63,392,329.63,293.66,329.63,440,392,349.23,392,523.25,392,329.63,293.66,261.63,0]},
  {bpm:98,notes:[329.63,392,493.88,392,349.23,392,523.25,493.88,440,392,349.23,329.63,293.66,329.63,392,0]},
  {bpm:112,notes:[261.63,329.63,392,523.25,493.88,392,329.63,293.66,261.63,293.66,349.23,440,392,349.23,329.63,0]},
  {bpm:100,notes:[392,349.23,329.63,261.63,293.66,329.63,392,440,523.25,493.88,440,392,349.23,329.63,293.66,0]}
 ];
 function playSection(sectionIndex){if(!ensure())return;const s=sections[sectionIndex%sections.length],beat=60000/s.bpm;const bass=[110,123.47,98,110,146.83,123.47,110,98];s.notes.forEach((n,i)=>{if(!n)return;const type=sectionIndex%3===0?'triangle':sectionIndex%3===1?'square':'sine';tone(n,beat*.70,type,.016,siteGain,i*beat);if(i%2===0)tone(bass[(i/2)%bass.length|0],beat*1.15,'triangle',.011,siteGain,i*beat);if(sectionIndex%4===2&&i%8===7)tone(n*2,beat*.25,'sine',.008,siteGain,i*beat+.04)});return beat*16+900}
 function siteLoop(sectionIndex=0){if(!ensure())return;const duration=playSection(sectionIndex);siteTimer=setTimeout(()=>siteLoop(sectionIndex+1),duration)}
 function startSite(){if(!ensure())return;if(!siteStarted){siteStarted=true;siteLoop(0)}}
 function hit(){if(!ensure())return;tone(659.25,.07,'square',.085,gameGain);tone(987.77,.10,'triangle',.06,gameGain,.045)}
 function perfect(){if(!ensure())return;tone(523.25,.065,'square',.09,gameGain);tone(783.99,.075,'square',.075,gameGain,.05);tone(1046.5,.11,'triangle',.065,gameGain,.105);tone(1567.98,.16,'sine',.04,gameGain,.17)}
 function miss(){if(!ensure())return;tone(220,.13,'sawtooth',.05,gameGain);tone(164.81,.20,'triangle',.04,gameGain,.06)}
 function playResult(){setTimeout(()=>{const el=document.getElementById('feedback');if(!el)return;const v=(el.textContent||'').trim();if(v==='+2')perfect();else if(v==='+1')hit();else if(v==='MISS')miss();lastFeedback=v},0)}
 function controls(){
  const menu=document.getElementById('playerMenu');if(!menu||document.getElementById('eixoAudioControls'))return;
  const wrap=document.createElement('div');wrap.id='eixoAudioControls';wrap.className='audio-controls';
  wrap.innerHTML=`<div class="audio-title">♪ SOM</div><div class="audio-row"><button type="button" class="audio-button">SOM DO SITE</button><input id="siteVolume" aria-label="Volume do site" type="range" min="0" max="1" step="0.01" value="${state.site}"></div><div class="audio-row"><button type="button" class="audio-button">SOM DO JOGO</button><input id="gameVolume" aria-label="Volume do jogo" type="range" min="0" max="1" step="0.01" value="${state.game}"></div>`;
  menu.appendChild(wrap);
  const site=wrap.querySelector('#siteVolume'),game=wrap.querySelector('#gameVolume');
  wrap.querySelectorAll('.audio-button')[0].addEventListener('click',e=>{e.stopPropagation();ensure();startSite()});
  wrap.querySelectorAll('.audio-button')[1].addEventListener('click',e=>{e.stopPropagation();ensure();hit()});
  site.addEventListener('input',e=>{state.site=clamp(e.target.value);ensure();siteGain.gain.value=state.site;save();startSite()});
  game.addEventListener('input',e=>{state.game=clamp(e.target.value);ensure();gameGain.gain.value=state.game;save()});
 }
 function css(){if(document.getElementById('audioStyle'))return;const s=document.createElement('style');s.id='audioStyle';s.textContent=`#eixoAudioControls{display:flex!important;flex-direction:column!important;gap:7px!important;margin:8px 6px 3px!important;padding:9px 8px!important;border-top:1px solid #34404a!important;background:#080d12!important}.audio-controls .audio-title{font-size:6px!important;color:#24d477!important;margin-bottom:2px!important}.audio-row{display:grid!important;grid-template-columns:auto 1fr!important;gap:8px!important;align-items:center!important}.audio-button{appearance:none!important;border:1px solid #46535f!important;background:#111922!important;color:#dfe5e9!important;padding:7px 6px!important;font:6px 'Press Start 2P',monospace!important;cursor:crosshair!important;white-space:nowrap!important}.audio-button:hover{border-color:#24d477!important;color:#24d477!important}.audio-row input[type=range]{display:block!important;width:78px!important;min-width:78px!important;height:5px!important;margin:0!important;accent-color:#24d477!important;cursor:crosshair!important}`;document.head.appendChild(s)}
 function bind(){controls();css();if(!document.body.dataset.audioBound){document.body.dataset.audioBound='1';document.addEventListener('pointerdown',()=>startSite(),{once:true})}if(!window.__eixoAudioKeyBound){window.__eixoAudioKeyBound=true;window.addEventListener('keydown',e=>{if(['Space','Enter'].includes(e.code)){startSite();playResult()}},true)}}
 bind();setInterval(bind,800);
 window.EixoAudio={hit,perfect,miss,setSiteVolume(v){state.site=clamp(v);ensure();siteGain.gain.value=state.site;save();startSite()},setGameVolume(v){state.game=clamp(v);ensure();gameGain.gain.value=state.game;save()}};
})();
