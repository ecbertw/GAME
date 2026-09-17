/* EIXO AUDIO — original arcade-style music + game feedback. */
(()=>{
  const KEY='eixo_audio_settings';
  const defaults={site:.34,game:.55};
  let settings={...defaults}; try{settings={...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(_){ }
  let ac=null, siteGain=null, gameGain=null, musicTimer=null, step=0, musicStarted=false;
  const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
  const save=()=>{localStorage.setItem(KEY,JSON.stringify(settings));};
  function init(){
    if(ac)return;
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
    ac=new C(); siteGain=ac.createGain(); gameGain=ac.createGain();
    siteGain.gain.value=settings.site;gameGain.gain.value=settings.game;
    siteGain.connect(ac.destination);gameGain.connect(ac.destination);
    if(!musicStarted){musicStarted=true;startMusic();}
  }
  function resume(){init();if(ac&&ac.state==='suspended')ac.resume();}
  const osc=(freq,dur,type,gainNode,vol=.04,when=0,detune=0)=>{
    if(!ac)return;const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=freq;o.detune.value=detune;g.gain.setValueAtTime(.0001,ac.currentTime+when);g.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),ac.currentTime+when+.012);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+when+dur);o.connect(g);g.connect(gainNode);o.start(ac.currentTime+when);o.stop(ac.currentTime+when+dur+.03);
  };
  function startMusic(){
    if(musicTimer)clearInterval(musicTimer);
    const notes=[220,277.18,329.63,369.99,329.63,277.18,246.94,329.63,415.3,369.99,329.63,277.18,246.94,277.18,329.63,440];
    const bass=[110,110,123.47,138.59,123.47,110,98,123.47];
    let i=0;
    const tick=()=>{if(!ac)return;const n=notes[i%notes.length];osc(n,.16,'square',siteGain,.022);if(i%2===0)osc(bass[(i/2)%bass.length|0],.24,'triangle',siteGain,.018);if(i%4===3)osc(n*2,.07,'sine',siteGain,.012,.03);i++;};
    tick();musicTimer=setInterval(tick,230);
  }
  function hit(){resume();osc(659.25,.08,'square',gameGain,.08);osc(987.77,.13,'triangle',gameGain,.055,.055);osc(1318.51,.16,'sine',gameGain,.035,.105);}
  function perfect(){resume();osc(523.25,.07,'square',gameGain,.09);osc(783.99,.09,'square',gameGain,.07,.055);osc(1046.5,.14,'triangle',gameGain,.06,.11);osc(1567.98,.18,'sine',gameGain,.035,.17);}
  function miss(){resume();osc(220,.16,'sawtooth',gameGain,.055);osc(164.81,.22,'triangle',gameGain,.045,.06);}
  function wire(){
    document.addEventListener('pointerdown',resume,{passive:true});
    document.addEventListener('keydown',resume,{passive:true});
    window.EixoAudio={hit,perfect,miss,setSiteVolume(v){resume();settings.site=clamp(v);siteGain.gain.value=settings.site;save()},setGameVolume(v){resume();settings.game=clamp(v);gameGain.gain.value=settings.game;save()},getSettings:()=>({...settings})};
    document.addEventListener('click',e=>{const t=e.target.closest?.('[data-audio-action]');if(!t)return;const action=t.dataset.audioAction;if(action==='hit')hit();if(action==='perfect')perfect();if(action==='miss')miss();});
  }
  function controls(){
    const playerMenu=document.getElementById('playerMenu');if(!playerMenu||document.getElementById('eixoAudioControls'))return;
    const wrap=document.createElement('div');wrap.id='eixoAudioControls';wrap.className='audio-controls';
    wrap.innerHTML=`<div class="audio-title">♪ SOM</div><label>Som do Site <input id="siteVolume" type="range" min="0" max="1" step="0.01" value="${settings.site}"></label><label>Som do Jogo <input id="gameVolume" type="range" min="0" max="1" step="0.01" value="${settings.game}"></label>`;
    playerMenu.appendChild(wrap);
    wrap.querySelector('#siteVolume').addEventListener('input',e=>window.EixoAudio?.setSiteVolume(e.target.value));
    wrap.querySelector('#gameVolume').addEventListener('input',e=>window.EixoAudio?.setGameVolume(e.target.value));
  }
  wire();
  const boot=()=>{controls();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  new MutationObserver(boot).observe(document.body,{childList:true,subtree:true});
})();
