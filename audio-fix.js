/* EIXO audio: original catchy site loop + short game result sounds. */
(function(){
 const KEY='eixo_audio_settings';
 const state={site:.32,game:.48};
 try{Object.assign(state,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(_){}
 let ctx=null,master=null,siteGain=null,gameGain=null,siteTimer=null,siteStarted=false,lastFeedback='';
 const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(_){} }
 function ensure(){if(ctx){if(ctx.state==='suspended')ctx.resume();return true}try{ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();siteGain=ctx.createGain();gameGain=ctx.createGain();master.gain.value=.8;siteGain.gain.value=state.site;gameGain.gain.value=state.game;siteGain.connect(master);gameGain.connect(master);master.connect(ctx.destination);return true}catch(_){return false}}
 function tone(freq,dur,type,gain,dest,when=0){if(!ensure())return;const t=ctx.currentTime+when,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+.03)}
 /* Original hook: short motif, strong repetition, octave lift at the end of each bar and a small turnaround. */
 const melody=[220,261.63,329.63,392,329.63,293.66,261.63,329.63,246.94,329.63,369.99,493.88,369.99,329.63,293.66,246.94];
 const bass=[110,110,123.47,98,110,110,146.83,123.47];
 function siteLoop(){if(!ensure())return;const base=ctx.currentTime;melody.forEach((n,i)=>{tone(n,.14,'square',.024,siteGain,i*.21);if(i%2===0)tone(bass[(i/2)%bass.length|0],.24,'triangle',.016,siteGain,i*.21);if(i===7||i===15)tone(n*2,.055,'square',.01,siteGain,i*.21+.035)});siteTimer=setTimeout(siteLoop,melody.length*.21*1000)}
 function startSite(){if(!ensure())return;if(!siteStarted){siteStarted=true;siteLoop()}}
 function hit(){if(!ensure())return;tone(659.25,.075,'square',.085,gameGain);tone(987.77,.12,'triangle',.052,gameGain,.045)}
 function perfect(){if(!ensure())return;tone(523.25,.065,'square',.09,gameGain);tone(783.99,.08,'square',.072,gameGain,.05);tone(1046.5,.12,'triangle',.06,gameGain,.105);tone(1567.98,.16,'sine',.035,gameGain,.16)}
 function miss(){if(!ensure())return;tone(220,.14,'sawtooth',.055,gameGain);tone(164.81,.2,'triangle',.042,gameGain,.055)}
 function playResult(){setTimeout(()=>{const el=document.getElementById('feedback');if(!el)return;const v=(el.textContent||'').trim();if(v==='+2')perfect();else if(v==='+1')hit();else if(v==='MISS')miss();lastFeedback=v},0)}
 function panel(){
  if(document.getElementById('audioPanel'))return;
  const menu=document.getElementById('playerMenu');if(!menu)return;
  const b=document.createElement('button');b.type='button';b.className='player-option audio-option';b.dataset.action='audio';b.textContent='♪ SOM';menu.appendChild(b);
  const p=document.createElement('div');p.id='audioPanel';p.className='audio-panel hidden';p.innerHTML='<div class="audio-title">♪ SOM</div><div class="audio-row"><span>SOM DO SITE</span><input id="siteVolume" type="range" min="0" max="1" step="0.01"></div><div class="audio-row"><span>SOM DO JOGO</span><input id="gameVolume" type="range" min="0" max="1" step="0.01"></div><button type="button" id="audioClose">FECHAR</button>';
  document.body.appendChild(p);
  p.querySelector('#siteVolume').value=state.site;p.querySelector('#gameVolume').value=state.game;
  p.querySelector('#siteVolume').addEventListener('input',e=>{state.site=clamp(e.target.value);if(siteGain)siteGain.gain.value=state.site;save();startSite()});
  p.querySelector('#gameVolume').addEventListener('input',e=>{state.game=clamp(e.target.value);if(gameGain)gameGain.gain.value=state.game;save()});
  p.querySelector('#audioClose').addEventListener('click',()=>p.classList.add('hidden'));
  b.addEventListener('click',e=>{e.stopPropagation();startSite();p.classList.toggle('hidden')});
 }
 function css(){if(document.getElementById('audioStyle'))return;const s=document.createElement('style');s.id='audioStyle';s.textContent='.audio-panel{position:fixed;top:72px;right:18px;z-index:10000;width:230px;padding:14px;background:#0b1016;border:2px solid #26313d;box-shadow:6px 6px 0 #05070a;font:12px monospace;color:#e8edf2}.audio-panel.hidden{display:none}.audio-panel .audio-title{font-size:11px;color:#24d477;margin-bottom:12px}.audio-row{margin:10px 0}.audio-row span{display:block;font:6px "Press Start 2P",monospace;color:#aeb7c0;margin-bottom:7px}.audio-row input{display:block;width:100%;accent-color:#24d477}.audio-panel button{margin-top:4px;background:#17212b;color:#fff;border:1px solid #526171;padding:7px 10px;font:6px "Press Start 2P",monospace;cursor:crosshair}.audio-option{cursor:crosshair!important}';document.head.appendChild(s)}
 function bind(){panel();css();const canvas=document.getElementById('gameCanvas');if(canvas&&!canvas.dataset.audioBound){canvas.dataset.audioBound='1';canvas.addEventListener('pointerdown',()=>{startSite();playResult()},true)}if(!document.body.dataset.audioBound){document.body.dataset.audioBound='1';document.addEventListener('pointerdown',()=>startSite(),{once:true})}if(!window.__eixoAudioKeyBound){window.__eixoAudioKeyBound=true;window.addEventListener('keydown',e=>{if(['Space','Enter'].includes(e.code)){startSite();playResult()}},true)}}
 bind();setInterval(bind,1200);
})();