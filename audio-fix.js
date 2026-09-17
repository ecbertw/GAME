/* EIXO audio: original melodic chiptune soundtrack + game result feedback. */
(function(){
 const KEY='eixo_audio_settings';
 const state={site:.28,game:.48};
 try{Object.assign(state,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(_){}
 let ctx=null,master=null,siteGain=null,gameGain=null,siteTimer=null,siteStarted=false;
 const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(_){}}
 function ensure(){if(ctx){if(ctx.state==='suspended')ctx.resume();return true}try{ctx=new(window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();siteGain=ctx.createGain();gameGain=ctx.createGain();master.gain.value=.68;siteGain.gain.value=state.site;gameGain.gain.value=state.game;siteGain.connect(master);gameGain.connect(master);master.connect(ctx.destination);return true}catch(_){return false}}
 function tone(freq,dur,type,gain,dest,when=0){if(!ensure()||!freq)return;const t=ctx.currentTime+when,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+.03)}
 function kick(gain,when=0){if(!ensure())return;const t=ctx.currentTime+when,o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(125,t);o.frequency.exponentialRampToValueAtTime(48,t+.11);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+.13);o.connect(g);g.connect(siteGain);o.start(t);o.stop(t+.15)}
 function snare(gain,when=0){if(!ensure())return;const t=ctx.currentTime+when,b=ctx.createBuffer(1,ctx.sampleRate*.09,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=b;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+.09);s.connect(g);g.connect(siteGain);s.start(t);s.stop(t+.1)}
 function hat(gain,when=0){if(!ensure())return;const t=ctx.currentTime+when,b=ctx.createBuffer(1,ctx.sampleRate*.028,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);const s=ctx.createBufferSource(),g=ctx.createGain(),f=ctx.createBiquadFilter();s.buffer=b;f.type='highpass';f.frequency.value=7000;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+.028);s.connect(f);f.connect(g);g.connect(siteGain);s.start(t);s.stop(t+.035)}

 /* Original ~43 second chiptune: a memorable hook, chord movement, bass, rests and five sections.
    It is intentionally melodic rather than a stream of rising beeps. */
 const songs=[
  {bpm:112,mel:[392,392,440,523.25,0,523.25,440,392,329.63,392,440,329.63,293.66,329.63,392,0,392,392,440,523.25,587.33,523.25,440,392,329.63,293.66,329.63,392,440,392,329.63,0],bass:[196,196,220,220,261.63,261.63,220,220,164.81,164.81,196,196,146.83,146.83,196,196]},
  {bpm:116,mel:[523.25,523.25,587.33,659.25,783.99,659.25,587.33,523.25,440,440,523.25,587.33,698.46,587.33,523.25,440,392,440,493.88,523.25,587.33,523.25,493.88,440,392,440,523.25,587.33,659.25,587.33,523.25,0],bass:[261.63,261.63,293.66,293.66,220,220,261.63,261.63,196,196,246.94,246.94,220,220,196,196]},
  {bpm:110,mel:[329.63,392,493.88,392,329.63,293.66,329.63,440,523.25,440,392,329.63,293.66,329.63,392,493.88,523.25,493.88,440,392,329.63,293.66,329.63,392,440,523.25,587.33,523.25,440,392,329.63,0],bass:[164.81,164.81,196,196,220,220,196,196,146.83,146.83,164.81,164.81,196,196,220,220]},
  {bpm:120,mel:[659.25,0,659.25,783.99,880,783.99,659.25,587.33,523.25,587.33,659.25,783.99,987.77,783.99,659.25,0,587.33,659.25,783.99,880,783.99,659.25,587.33,523.25,493.88,523.25,587.33,659.25,783.99,659.25,587.33,523.25],bass:[329.63,329.63,293.66,293.66,261.63,261.63,220,220,196,196,220,220,246.94,246.94,261.63,261.63]},
  {bpm:114,mel:[392,440,523.25,587.33,659.25,587.33,523.25,440,392,329.63,392,440,523.25,440,392,329.63,261.63,329.63,392,523.25,493.88,440,392,329.63,392,440,523.25,659.25,587.33,523.25,440,392],bass:[196,196,220,220,261.63,261.63,246.94,246.94,164.81,164.81,196,196,220,220,196,196]}
 ];

 function playSection(index){
  if(!ensure())return;
  const s=songs[index%songs.length],beat=60/s.bpm,step=beat/2;
  s.mel.forEach((n,i)=>{
   const t=i*step;
   if(n) tone(n,step*.72,index%2?'square':'triangle',.025,siteGain,t);
   if(i%2===0) tone(s.bass[(i/2)%s.bass.length|0],beat*.72,'triangle',.022,siteGain,t);
   if(i%8===0) kick(.055,t);
   else if(i%8===4) snare(.026,t);
   if(i%2===1) hat(.007,t);
  });
  /* Small musical turnarounds at the end of each section. */
  const endings=[[523.25,587.33,659.25],[659.25,783.99,987.77],[440,523.25,659.25],[783.99,659.25,523.25],[523.25,659.25,783.99]];
  endings[index%songs.length].forEach((n,i)=>tone(n,.16,'square',.018,siteGain,beat*15.45+i*.11));
  return beat*16+120;
 }
 function siteLoop(index=0){if(!ensure())return;const duration=playSection(index);siteTimer=setTimeout(()=>siteLoop(index+1),duration)}
 function startSite(){if(!ensure())return;if(!siteStarted){siteStarted=true;siteLoop(0)}}

 function hit(){if(!ensure())return;tone(659.25,.09,'square',.075,gameGain);tone(987.77,.12,'triangle',.05,gameGain,.055)}
 function perfect(){if(!ensure())return;tone(523.25,.07,'square',.08,gameGain);tone(659.25,.07,'square',.07,gameGain,.055);tone(783.99,.09,'triangle',.065,gameGain,.11);tone(1046.5,.13,'triangle',.045,gameGain,.17)}
 function miss(){if(!ensure())return;tone(247,.10,'triangle',.045,gameGain);tone(185,.16,'sawtooth',.032,gameGain,.06);tone(138.59,.22,'triangle',.028,gameGain,.13)}

 function controls(){
  const menu=document.getElementById('playerMenu');if(!menu||document.getElementById('eixoAudioControls'))return;
  const wrap=document.createElement('div');wrap.id='eixoAudioControls';wrap.className='audio-controls';
  wrap.innerHTML=`<div class="audio-title">♪ SOM</div><div class="audio-row"><button type="button" class="audio-button">SOM DO SITE</button><input id="siteVolume" aria-label="Volume do site" type="range" min="0" max="1" step="0.01" value="${state.site}"></div><div class="audio-row"><button type="button" class="audio-button">SOM DO JOGO</button><input id="gameVolume" aria-label="Volume do jogo" type="range" min="0" max="1" step="0.01" value="${state.game}"></div>`;
  menu.appendChild(wrap);
  const site=wrap.querySelector('#siteVolume'),game=wrap.querySelector('#gameVolume');
  wrap.querySelectorAll('.audio-button')[0].addEventListener('click',e=>{e.stopPropagation();ensure();startSite()});
  wrap.querySelectorAll('.audio-button')[1].addEventListener('click',e=>{e.stopPropagation();ensure();perfect()});
  site.addEventListener('input',e=>{state.site=clamp(e.target.value);ensure();siteGain.gain.value=state.site;save();startSite()});
  game.addEventListener('input',e=>{state.game=clamp(e.target.value);ensure();gameGain.gain.value=state.game;save()});
 }
 function css(){
  if(document.getElementById('audioStyle'))return;
  const s=document.createElement('style');s.id='audioStyle';
  s.textContent=`#eixoAudioControls{display:flex!important;flex-direction:column!important;gap:7px!important;margin:8px 6px 3px!important;padding:9px 8px!important;border-top:1px solid #34404a!important;background:#080d12!important}.audio-controls .audio-title{font-size:6px!important;color:#24d477!important;margin-bottom:2px!important}.audio-row{display:grid!important;grid-template-columns:auto 1fr!important;gap:8px!important;align-items:center!important}.audio-button{appearance:none!important;border:1px solid #46535f!important;background:#111922!important;color:#dfe5e9!important;padding:7px 6px!important;font:6px 'Press Start 2P',monospace!important;cursor:crosshair!important;white-space:nowrap!important}.audio-button:hover{border-color:#24d477!important;color:#24d477!important}.audio-row input[type=range]{display:block!important;width:78px!important;min-width:78px!important;height:5px!important;margin:0!important;accent-color:#24d477!important;cursor:crosshair!important}`;
  document.head.appendChild(s)
 }
 function bind(){controls();css();if(!document.body.dataset.audioBound){document.body.dataset.audioBound='1';document.addEventListener('pointerdown',()=>startSite(),{once:true})}}
 bind();setInterval(bind,800);
 window.EixoAudio={hit,perfect,miss,setSiteVolume(v){state.site=clamp(v);ensure();siteGain.gain.value=state.site;save();startSite()},setGameVolume(v){state.game=clamp(v);ensure();gameGain.gain.value=state.game;save()}};
})();