/* EIXO audio: fresh original arcade soundtrack + isolated game feedback. */
(function(){
 const KEY='eixo_audio_settings';
 const state={site:.24,game:.48};
 try{Object.assign(state,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(_){}
 let ctx=null,master=null,siteGain=null,gameGain=null,started=false,timer=null;
 const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(_){}}
 function ensure(){
  if(ctx){if(ctx.state==='suspended')ctx.resume();return true}
  try{ctx=new(window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();siteGain=ctx.createGain();gameGain=ctx.createGain();master.gain.value=.72;siteGain.gain.value=state.site;gameGain.gain.value=state.game;siteGain.connect(master);gameGain.connect(master);master.connect(ctx.destination);return true}catch(_){return false}
 }
 function note(freq,dur,wave,gain,dest,at){
  if(!ensure()||!freq)return;
  const t=ctx.currentTime+at,o=ctx.createOscillator(),g=ctx.createGain();
  o.type=wave;o.frequency.setValueAtTime(freq,t);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g);g.connect(dest);o.start(t);o.stop(t+dur+.03)
 }
 function noise(dur,gain,at,filterFreq){
  if(!ensure())return;
  const t=ctx.currentTime+at,b=ctx.createBuffer(1,Math.floor(ctx.sampleRate*dur),ctx.sampleRate),d=b.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);
  const s=ctx.createBufferSource(),g=ctx.createGain(),f=ctx.createBiquadFilter();s.buffer=b;f.type='highpass';f.frequency.value=filterFreq;
  g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f);f.connect(g);g.connect(siteGain);s.start(t);s.stop(t+dur+.01)
 }
 function kick(at){note(120,.11,'sine',.055,siteGain,at);if(ensure()){const t=ctx.currentTime+at;}}
 function snare(at){noise(.075,.025,at,1800)}
 function hat(at){noise(.025,.007,at,6500)}

 /* Completely new composition.
    5 x 4-bar sections at ~100-108 BPM = about 45 seconds.
    A/B/A'/C/Final: memorable hook, chord movement, syncopation and breathing space. */
 const C=[261.63,293.66,329.63,349.23,392,440,493.88,523.25,587.33,659.25,698.46,783.99,880];
 const sections=[
  {bpm:104,chords:[[261.63,329.63,392],[196,246.94,293.66],[220,261.63,329.63],[174.61,220,261.63]],mel:[392,440,523.25,440,392,329.63,293.66,329.63,392,0,392,523.25,587.33,523.25,440,392],bass:[261.63,261.63,196,196,220,220,174.61,174.61]},
  {bpm:108,chords:[[329.63,392,493.88],[261.63,329.63,392],[293.66,349.23,440],[220,261.63,329.63]],mel:[523.25,587.33,659.25,587.33,523.25,493.88,440,493.88,523.25,659.25,783.99,659.25,587.33,523.25,493.88,440],bass:[329.63,329.63,261.63,261.63,293.66,293.66,220,220]},
  {bpm:102,chords:[[261.63,329.63,392],[220,293.66,349.23],[246.94,329.63,392],[196,246.94,293.66]],mel:[392,329.63,293.66,329.63,392,523.25,440,392,329.63,392,440,523.25,659.25,587.33,523.25,493.88],bass:[261.63,261.63,220,220,246.94,246.94,196,196]},
  {bpm:106,chords:[[349.23,440,523.25],[392,493.88,587.33],[261.63,329.63,392],[293.66,392,493.88]],mel:[659.25,0,659.25,783.99,880,783.99,659.25,587.33,523.25,587.33,659.25,783.99,659.25,587.33,523.25,440],bass:[349.23,349.23,392,392,261.63,261.63,293.66,293.66]},
  {bpm:104,chords:[[261.63,329.63,392],[196,246.94,293.66],[220,293.66,349.23],[261.63,329.63,392]],mel:[392,392,440,523.25,587.33,523.25,440,392,329.63,392,440,523.25,659.25,587.33,523.25,392],bass:[261.63,261.63,196,196,220,220,261.63,261.63]}
 ];
 function playSection(si){
  if(!ensure())return;
  const s=sections[si%sections.length],beat=60/s.bpm,step=beat/2;
  /* Four bars, each chord lasts one bar. */
  for(let i=0;i<32;i++){
   const t=i*step,bar=Math.floor(i/8),ch=s.chords[bar];
   const m=s.mel[i%16];
   if(m)note(m,step*.82,si%2?'square':'triangle',.025,siteGain,t);
   if(i%2===0)note(s.bass[(i/2)%8],beat*.82,'triangle',.021,siteGain,t);
   if(i%4===0)kick(t);
   if(i%4===2)snare(t);
   if(i%2===1)hat(t);
   /* Quiet chord stabs make it feel like a song rather than a scale. */
   if(i%8===0)ch.forEach((n,j)=>note(n,.16,'square',.008,siteGain,t+j*.012));
  }
  const end=[523.25,587.33,659.25,783.99,659.25,523.25];
  end.forEach((n,i)=>note(n,.12,'square',.014,siteGain,beat*15.55+i*.08));
  return beat*16+180;
 }
 function loop(si=0){if(!ensure())return;const d=playSection(si);timer=setTimeout(()=>loop(si+1),d)}
 function start(){if(!ensure())return;if(!started){started=true;loop(0)}}

 function hit(){if(!ensure())return;note(659.25,.075,'square',.075,gameGain,0);note(987.77,.11,'triangle',.052,gameGain,.055)}
 function perfect(){if(!ensure())return;note(523.25,.07,'square',.08,gameGain,0);note(659.25,.07,'square',.07,gameGain,.055);note(783.99,.08,'triangle',.062,gameGain,.11);note(1046.5,.13,'triangle',.045,gameGain,.17)}
 function miss(){if(!ensure())return;note(247,.09,'triangle',.05,gameGain,0);note(185,.13,'sawtooth',.034,gameGain,.055);note(138.59,.2,'triangle',.028,gameGain,.12)}

 function controls(){
  const menu=document.getElementById('playerMenu');if(!menu||document.getElementById('eixoAudioControls'))return;
  const w=document.createElement('div');w.id='eixoAudioControls';w.className='audio-controls';
  w.innerHTML=`<div class="audio-title">♪ SOM</div><div class="audio-row"><button type="button" class="audio-button">SOM DO SITE</button><input id="siteVolume" type="range" min="0" max="1" step=".01" value="${state.site}" aria-label="Volume do site"></div><div class="audio-row"><button type="button" class="audio-button">SOM DO JOGO</button><input id="gameVolume" type="range" min="0" max="1" step=".01" value="${state.game}" aria-label="Volume do jogo"></div>`;
  menu.appendChild(w);
  const sv=w.querySelector('#siteVolume'),gv=w.querySelector('#gameVolume'),buttons=w.querySelectorAll('.audio-button');
  buttons[0].addEventListener('click',e=>{e.stopPropagation();start()});
  buttons[1].addEventListener('click',e=>{e.stopPropagation();perfect()});
  sv.addEventListener('input',e=>{state.site=clamp(e.target.value);ensure();siteGain.gain.value=state.site;save();start()});
  gv.addEventListener('input',e=>{state.game=clamp(e.target.value);ensure();gameGain.gain.value=state.game;save()});
 }
 function css(){
  if(document.getElementById('audioStyle'))return;
  const s=document.createElement('style');s.id='audioStyle';s.textContent=`#eixoAudioControls{display:flex!important;flex-direction:column!important;gap:7px!important;margin:8px 6px 3px!important;padding:9px 8px!important;border-top:1px solid #34404a!important;background:#080d12!important}.audio-controls .audio-title{font-size:6px!important;color:#24d477!important;margin-bottom:2px!important}.audio-row{display:grid!important;grid-template-columns:auto 1fr!important;gap:8px!important;align-items:center!important}.audio-button{appearance:none!important;border:1px solid #46535f!important;background:#111922!important;color:#dfe5e9!important;padding:7px 6px!important;font:6px 'Press Start 2P',monospace!important;cursor:crosshair!important;white-space:nowrap!important}.audio-button:hover{border-color:#24d477!important;color:#24d477!important}.audio-row input[type=range]{display:block!important;width:78px!important;min-width:78px!important;height:5px!important;margin:0!important;accent-color:#24d477!important;cursor:crosshair!important}`;document.head.appendChild(s)
 }
 function bind(){controls();css();if(!document.body.dataset.audioBound){document.body.dataset.audioBound='1';document.addEventListener('pointerdown',start,{once:true})}}
 bind();setInterval(bind,800);
 window.EixoAudio={hit,perfect,miss,start,setSiteVolume(v){state.site=clamp(v);ensure();siteGain.gain.value=state.site;save();start()},setGameVolume(v){state.game=clamp(v);ensure();gameGain.gain.value=state.game;save()}};
})();