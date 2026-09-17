/* EIXO audio: lightweight procedural pixel-game music, no external audio files. */
(function(){
 const KEY='eixo_audio_settings';
 const state={site:0.28,game:0.36};
 try{Object.assign(state,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(_){}
 let ctx=null,master=null,siteGain=null,gameGain=null,siteTimer=null,gameTimer=null,gamePlaying=false,lastScore='';
 const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(_){} }
 function ensure(){if(ctx){if(ctx.state==='suspended')ctx.resume();return true}try{ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();siteGain=ctx.createGain();gameGain=ctx.createGain();master.gain.value=.72;siteGain.gain.value=state.site;gameGain.gain.value=state.game;siteGain.connect(master);gameGain.connect(master);master.connect(ctx.destination);return true}catch(_){return false}}
 function tone(freq,dur,type,gain,dest,when=0){if(!ensure())return;const t=ctx.currentTime+when,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+.03)}
 const notes=[261.63,329.63,392,523.25,392,329.63,293.66,349.23,440,587.33,440,349.23,261.63,329.63,392,493.88];
 function siteLoop(){if(!ensure())return;notes.forEach((n,i)=>tone(n,.24,'square',.018,siteGain,i*.28));siteTimer=setTimeout(siteLoop,notes.length*.28*1000)}
 function gameLoop(){if(!gamePlaying)return;if(!ensure())return;const seq=[196,246.94,293.66,392,293.66,246.94,220,277.18,329.63,440,329.63,277.18];seq.forEach((n,i)=>tone(n,.16,'triangle',.035,gameGain,i*.19));gameTimer=setTimeout(gameLoop,seq.length*.19*1000)}
 function startSite(){if(!ensure())return;if(!siteTimer)siteLoop()}
 function startGame(){if(!ensure()||gamePlaying)return;gamePlaying=true;gameLoop()}
 function stopGame(){gamePlaying=false;clearTimeout(gameTimer);gameTimer=null}
 function hit(){if(!ensure())return;tone(523.25,.08,'square',.10,gameGain);tone(783.99,.12,'square',.07,gameGain,.045);tone(1046.5,.16,'triangle',.055,gameGain,.09)}
 function panel(){
  if(document.getElementById('audioPanel'))return;
  const menu=document.getElementById('playerMenu');if(!menu)return;
  const b=document.createElement('button');b.type='button';b.className='player-option audio-option';b.dataset.action='audio';b.textContent='♪ SOM';menu.appendChild(b);
  const p=document.createElement('div');p.id='audioPanel';p.className='audio-panel hidden';p.innerHTML='<div class="audio-title">♪ SOM</div><label>VOLUME DO SITE<input id="siteVolume" type="range" min="0" max="1" step="0.01"></label><label>VOLUME DO JOGO<input id="gameVolume" type="range" min="0" max="1" step="0.01"></label><button type="button" id="audioClose">FECHAR</button>';
  document.body.appendChild(p);
  p.querySelector('#siteVolume').value=state.site;p.querySelector('#gameVolume').value=state.game;
  p.querySelector('#siteVolume').addEventListener('input',e=>{state.site=clamp(e.target.value);if(siteGain)siteGain.gain.value=state.site;save();startSite()});
  p.querySelector('#gameVolume').addEventListener('input',e=>{state.game=clamp(e.target.value);if(gameGain)gameGain.gain.value=state.game;save()});
  p.querySelector('#audioClose').addEventListener('click',()=>p.classList.add('hidden'));
  b.addEventListener('click',e=>{e.stopPropagation();startSite();p.classList.toggle('hidden')});
 }
 function css(){if(document.getElementById('audioStyle'))return;const s=document.createElement('style');s.id='audioStyle';s.textContent='.audio-panel{position:fixed;top:72px;right:18px;z-index:1000;width:220px;padding:14px;background:#0b1016;border:2px solid #26313d;box-shadow:6px 6px 0 #05070a;font:12px monospace;color:#e8edf2}.audio-panel.hidden{display:none}.audio-panel .audio-title{font-size:15px;margin-bottom:12px}.audio-panel label{display:block;margin:10px 0}.audio-panel input{display:block;width:100%;margin-top:7px;accent-color:#3b82f6}.audio-panel button{margin-top:4px;background:#17212b;color:#fff;border:1px solid #526171;padding:7px 10px;font:inherit;cursor:crosshair}.audio-option{cursor:crosshair!important}';document.head.appendChild(s)}
 function bind(){panel();css();const canvas=document.getElementById('gameCanvas');if(canvas&&!canvas.dataset.audioBound){canvas.dataset.audioBound='1';canvas.addEventListener('pointerdown',()=>{startSite();startGame()})}if(!document.body.dataset.audioBound){document.body.dataset.audioBound='1';document.addEventListener('pointerdown',()=>startSite(),{once:true});}}
 function watchScore(){const el=document.getElementById('score');if(!el)return;if(lastScore==='' )lastScore=el.textContent;if(el.textContent!==lastScore){const old=Number(lastScore),now=Number(el.textContent);lastScore=el.textContent;if(Number.isFinite(now)&&now>old)hit()}}
 bind();setInterval(bind,1200);setInterval(watchScore,80);
})();