/* EIXO AUDIO — original arcade-style site music + game feedback. */
(()=>{
  const KEY='eixo_audio_settings';
  const defaults={site:.34,game:.55};
  let settings={...defaults}; try{settings={...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(_){ }
  let ac=null,siteGain=null,gameGain=null,musicTimer=null,musicStarted=false;
  const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
  const save=()=>localStorage.setItem(KEY,JSON.stringify(settings));
  function init(){if(ac)return;const C=window.AudioContext||window.webkitAudioContext;if(!C)return;ac=new C();siteGain=ac.createGain();gameGain=ac.createGain();siteGain.gain.value=settings.site;gameGain.gain.value=settings.game;siteGain.connect(ac.destination);gameGain.connect(ac.destination);if(!musicStarted){musicStarted=true;startMusic();}}
  function resume(){init();if(ac&&ac.state==='suspended')ac.resume();}
  const osc=(freq,dur,type,gainNode,vol=.04,when=0)=>{if(!ac)return;const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.0001,ac.currentTime+when);g.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),ac.currentTime+when+.012);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+when+dur);o.connect(g);g.connect(gainNode);o.start(ac.currentTime+when);o.stop(ac.currentTime+when+dur+.03);};
  function startMusic(){
    if(musicTimer)clearInterval(musicTimer);
    /* Original 8-bit hook: short motif, repetition, syncopated accents and small variation every bar. */
    const melody=[220,261.63,329.63,392,329.63,293.66,261.63,329.63,246.94,329.63,369.99,493.88,369.99,329.63,293.66,246.94];
    const bass=[110,110,123.47,98,110,110,146.83,123.47];
    let i=0;
    const tick=()=>{if(!ac)return;const n=melody[i%melody.length];osc(n,.14,'square',siteGain,.024);if(i%2===0)osc(bass[(i/2)%bass.length|0],.25,'triangle',siteGain,.017);if(i%8===7)osc(n*2,.055,'square',siteGain,.009,.035);i++;};
    tick();musicTimer=setInterval(tick,210);
  }
  function hit(){resume();osc(659.25,.075,'square',gameGain,.075);osc(987.77,.12,'triangle',gameGain,.05,.045);}
  function perfect(){resume();osc(523.25,.065,'square',gameGain,.085);osc(783.99,.085,'square',gameGain,.07,.05);osc(1046.5,.12,'triangle',gameGain,.06,.105);osc(1567.98,.16,'sine',gameGain,.032,.16);}
  function miss(){resume();osc(220,.14,'sawtooth',gameGain,.052);osc(164.81,.2,'triangle',gameGain,.04,.055);}
  function wire(){
    document.addEventListener('pointerdown',resume,{passive:true});
    document.addEventListener('keydown',resume,{passive:true});
    window.EixoAudio={hit,perfect,miss,setSiteVolume(v){resume();settings.site=clamp(v);siteGain.gain.value=settings.site;save()},setGameVolume(v){resume();settings.game=clamp(v);gameGain.gain.value=settings.game;save()},getSettings:()=>({...settings})};
    document.addEventListener('click',e=>{const t=e.target.closest?.('[data-audio-action]');if(!t)return;const a=t.dataset.audioAction;if(a==='hit')hit();if(a==='perfect')perfect();if(a==='miss')miss();});
    /* The game already owns its hit handler; read its result after that handler runs. */
    const playResult=()=>setTimeout(()=>{const f=document.getElementById('feedback');if(!f)return;const v=(f.textContent||'').trim();if(v==='+2')perfect();else if(v==='+1')hit();else if(v==='MISS')miss();},0);
    const canvas=document.getElementById('gameCanvas');if(canvas)canvas.addEventListener('pointerdown',playResult,true);
    window.addEventListener('keydown',e=>{if(['Space','Enter'].includes(e.code))playResult();},true);
  }
  function controls(){
    const playerMenu=document.getElementById('playerMenu');if(!playerMenu||document.getElementById('eixoAudioControls'))return;
    const wrap=document.createElement('div');wrap.id='eixoAudioControls';wrap.className='audio-controls';
    wrap.innerHTML=`<div class="audio-title">♪ SOM</div><label>Som do Site <input id="siteVolume" type="range" min="0" max="1" step="0.01" value="${settings.site}"></label><label>Som do Jogo <input id="gameVolume" type="range" min="0" max="1" step="0.01" value="${settings.game}"></label>`;
    playerMenu.appendChild(wrap);
    wrap.querySelector('#siteVolume').addEventListener('input',e=>window.EixoAudio?.setSiteVolume(e.target.value));
    wrap.querySelector('#gameVolume').addEventListener('input',e=>window.EixoAudio?.setGameVolume(e.target.value));
  }
  const css=document.createElement('style');css.textContent=`.audio-controls{margin-top:8px;padding:10px;border-top:1px solid #2c3741;background:#080d12;display:flex;flex-direction:column;gap:9px}.audio-title{font-size:7px;color:#24d477;margin-bottom:2px}.audio-controls label{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:6px;color:#aeb7c0}.audio-controls input[type=range]{width:92px;accent-color:#24d477}`;document.head.appendChild(css);
  wire();const boot=()=>controls();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();new MutationObserver(boot).observe(document.body,{childList:true,subtree:true});
})();
