(()=>{
  'use strict';

  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const flag=code=>{const c=String(code||'PT').toUpperCase();return /^[A-Z]{2}$/.test(c)?[...c].map(x=>String.fromCodePoint(127397+x.charCodeAt())).join(''):'🌐';};
  const countryName=code=>{const c=String(code||'PT').toUpperCase();try{return new Intl.DisplayNames(['pt'],{type:'region'}).of(c)?.toUpperCase()||c}catch(_){return c}};
  const readPlayer=()=>{try{return JSON.parse(localStorage.getItem('eixo_player')||'null')}catch(_){return null}};
  const player=readPlayer();
  const country=String(localStorage.getItem(player?.id?'eixo_ui_country_'+player.id:'eixo_country')||player?.country||'PT').toUpperCase();

  if($('runPlayerName'))$('runPlayerName').textContent=player?.visualName||player?.name||'ENTRAR';
  if($('runCountryFlag'))$('runCountryFlag').textContent=flag(country);
  if($('runCountryName'))$('runCountryName').textContent=countryName(country);

  const playerButton=$('runPlayerButton'),playerMenu=$('runPlayerMenu');
  const soundButton=$('runSoundButton'),soundMenu=$('runSoundMenu');
  const closeMenus=except=>{
    if(except!=='player'){playerMenu?.classList.remove('is-open');playerButton?.setAttribute('aria-expanded','false')}
    if(except!=='sound'){soundMenu?.classList.remove('is-open');soundButton?.setAttribute('aria-expanded','false')}
  };
  playerButton?.addEventListener('click',e=>{e.stopPropagation();const open=!playerMenu.classList.contains('is-open');closeMenus('player');playerMenu.classList.toggle('is-open',open);playerButton.setAttribute('aria-expanded',String(open));});
  soundButton?.addEventListener('click',e=>{e.stopPropagation();const open=!soundMenu.classList.contains('is-open');closeMenus('sound');soundMenu.classList.toggle('is-open',open);soundButton.setAttribute('aria-expanded',String(open));});
  document.addEventListener('click',()=>closeMenus());

  /* RUN audio: low Neon Void ambience plus lightweight procedural gameplay SFX. */
  const KEY='eixo_audio_settings',defaults={site:.34,game:.55};
  let settings={...defaults};try{settings={...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(_){}
  const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
  let ac=null,siteGain=null,gameGain=null,ambientStarted=false,ambientTimer=null;
  function ensureAudio(){
    if(!ac){
      const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
      ac=new C();siteGain=ac.createGain();gameGain=ac.createGain();siteGain.gain.value=clamp(settings.site);gameGain.gain.value=clamp(settings.game);siteGain.connect(ac.destination);gameGain.connect(ac.destination);
    }
    if(ac.state==='suspended')ac.resume().catch(()=>{});
    if(!ambientStarted)startAmbient();
    return ac;
  }
  function tone({from,to=from,dur=.12,type='sine',vol=.05,delay=0,gain=gameGain}={}){
    if(!ensureAudio()||!gain)return;
    const now=ac.currentTime+delay,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(Math.max(20,from||220),now);o.frequency.exponentialRampToValueAtTime(Math.max(20,to||from||220),now+dur);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),now+.012);g.gain.exponentialRampToValueAtTime(.0001,now+dur);o.connect(g);g.connect(gain);o.start(now);o.stop(now+dur+.03);
  }
  function startAmbient(){
    if(!ac||ambientStarted)return;ambientStarted=true;
    const pad=(freq,type,vol)=>{const o=ac.createOscillator(),g=ac.createGain(),lfo=ac.createOscillator(),lg=ac.createGain();o.type=type;o.frequency.value=freq;g.gain.value=vol;lfo.type='sine';lfo.frequency.value=.075+freq/4000;lg.gain.value=vol*.38;lfo.connect(lg);lg.connect(g.gain);o.connect(g);g.connect(siteGain);o.start();lfo.start();};
    pad(55,'sine',.025);pad(82.41,'triangle',.012);pad(164.81,'sine',.006);
    const breathe=()=>{if(!ac||ac.state!=='running')return;tone({from:220,to:174.61,dur:1.4,type:'sine',vol:.007,gain:siteGain});tone({from:329.63,to:261.63,dur:1.1,type:'triangle',vol:.004,delay:.18,gain:siteGain});};
    breathe();ambientTimer=setInterval(breathe,4200);
  }
  const audio={
    resume:ensureAudio,
    jump(){tone({from:235,to:510,dur:.11,type:'square',vol:.045});tone({from:420,to:660,dur:.08,type:'sine',vol:.026,delay:.025});},
    death(){tone({from:190,to:62,dur:.30,type:'sawtooth',vol:.065});tone({from:110,to:45,dur:.38,type:'triangle',vol:.045,delay:.04});},
    clear(){tone({from:392,to:392,dur:.12,type:'triangle',vol:.048});tone({from:523.25,to:523.25,dur:.14,type:'sine',vol:.052,delay:.10});tone({from:659.25,to:783.99,dur:.24,type:'triangle',vol:.052,delay:.21});},
    start(){tone({from:164.81,to:246.94,dur:.20,type:'triangle',vol:.04});tone({from:329.63,to:493.88,dur:.18,type:'sine',vol:.03,delay:.09});},
    ui(){tone({from:520,to:620,dur:.045,type:'sine',vol:.018});},
    setSiteVolume(v){settings.site=clamp(v);if(siteGain)siteGain.gain.value=settings.site;try{localStorage.setItem(KEY,JSON.stringify(settings))}catch(_){}},
    setGameVolume(v){settings.game=clamp(v);if(gameGain)gameGain.gain.value=settings.game;try{localStorage.setItem(KEY,JSON.stringify(settings))}catch(_){}},
    getSettings:()=>({...settings})
  };
  window.EixoRunAudio=audio;
  window.EixoAudio={...(window.EixoAudio||{}),setSiteVolume:v=>audio.setSiteVolume(v),setGameVolume:v=>audio.setGameVolume(v),getSettings:audio.getSettings};
  document.addEventListener('pointerdown',ensureAudio,{passive:true});document.addEventListener('keydown',ensureAudio,{passive:true});

  const site=$('runSiteVolume'),game=$('runGameVolume');
  if(site)site.value=String(settings.site);if(game)game.value=String(settings.game);
  site?.addEventListener('input',e=>audio.setSiteVolume(e.target.value));game?.addEventListener('input',e=>audio.setGameVolume(e.target.value));

  /* Styled RUN ranking. Use the exact same name markup/classes as the normal EIXO rankings. */
  const safeEffect=v=>/^[a-z]+$/.test(String(v||''))?String(v):'none';
  const letters=(text,styles)=>{const arr=Array.isArray(styles)?styles:[];return [...String(text||'')].map((ch,i)=>{const s=arr[i]||{},color=String(s.color||'').toLowerCase(),effect=safeEffect(s.effect),rainbow=color==='rainbow',safeColor=/^#[0-9a-f]{6}$/i.test(color)?color:'';return '<span class="name-letter'+(rainbow?' name-rainbow':'')+' effect-'+effect+'"'+(safeColor?' style="color:'+safeColor+'"':'')+'>'+esc(ch)+'</span>';}).join('');};
  function styledName(p){const color=String(p?.nameColor||'#fff').toLowerCase(),effect=safeEffect(p?.nameEffect),vip=Number(p?.vipLevel||0),hasLetters=vip>0&&Array.isArray(p?.letterStyles)&&p.letterStyles.length,rainbow=color==='rainbow'&&!hasLetters,safeColor=/^#[0-9a-f]{6}$/i.test(color)?color:'#fff',body=hasLetters?letters(p.visualName||p.name,p.letterStyles):[...String(p.visualName||p.name||'PLAYER')].map(ch=>'<span class="name-letter">'+esc(ch)+'</span>').join('');return '<span class="rank-player-name'+(rainbow?' name-rainbow':'')+(effect!=='none'?' effect-'+effect:'')+(hasLetters?' vip-letter-styled':'')+'"'+(rainbow?'':' style="color:'+safeColor+'"')+'>'+body+'</span>';}
  function vipTag(n){n=Number(n)||0;return n>0?'<span class="run-rank-vip">VIP '+(n>=6?'∞':n)+'</span>':'';}
  function achievementTag(b){const g=({'first-100':'100','skybound':'↟','explorer':'✦','pulse-10':'◎'}[b]||'');return g?'<span class="run-rank-achievement">'+g+'</span>':'';}
  function medal(p){const n=Number(p.rank||0);return n>=1&&n<=3?'<span class="run-rank-medal">'+n+'</span>':'';}
  function fmt(ms){const n=Math.max(0,Math.floor(Number(ms)||0));return String(Math.floor(n/60000)).padStart(2,'0')+':'+String(Math.floor((n%60000)/1000)).padStart(2,'0')+'.'+String(n%1000).padStart(3,'0');}
  let styleCache={at:0,map:new Map()},rankBusy=false;
  async function playerStyles(){
    if(Date.now()-styleCache.at<15000&&styleCache.map.size)return styleCache.map;
    const first=await fetch('/api/rankings?page=1',{credentials:'same-origin',cache:'no-store'});if(!first.ok)throw Error('styles');const data=await first.json(),pages=Math.min(30,Math.max(1,Number(data.pages)||1)),all=[...(data.players||[])];
    if(pages>1){const rest=await Promise.all(Array.from({length:pages-1},(_,i)=>fetch('/api/rankings?page='+(i+2),{credentials:'same-origin',cache:'no-store'}).then(r=>r.ok?r.json():{players:[]})));for(const x of rest)all.push(...(x.players||[]));}
    styleCache={at:Date.now(),map:new Map(all.map(p=>[String(p.id),p]))};return styleCache.map;
  }
  let rankHost=$('run-start-ranking');
  if(rankHost&&rankHost.tagName==='PRE'){
    const div=document.createElement('div');div.id=rankHost.id;div.className=rankHost.className;div.setAttribute('aria-live','polite');rankHost.replaceWith(div);rankHost=div;
  }
  async function refreshStartRanking(){
    if(!rankHost||rankBusy)return;rankBusy=true;
    try{
      const [r,styles]=await Promise.all([fetch('/api/run/rankings?limit=10',{credentials:'same-origin',cache:'no-store'}),playerStyles()]);if(!r.ok)throw Error('rank');const data=await r.json();
      const rows=(data.players||[]).slice(0,7).map(p=>({...styles.get(String(p.playerId||p.id)),...p,letterStyles:styles.get(String(p.playerId||p.id))?.letterStyles||[]}));
      rankHost.innerHTML='<div class="run-start-rank-head"><span>🌐</span><strong>WORLD TOP</strong></div>'+(rows.length?rows.map((p,i)=>'<div class="run-rank-row"><span class="run-rank-pos">'+String(i+1).padStart(2,'0')+'</span><span class="run-rank-identity">'+styledName(p)+'<span class="run-rank-tags">'+medal(p)+achievementTag(p.featuredBadge)+vipTag(p.vipLevel)+'</span></span><span class="run-rank-result"><span class="run-rank-flag">'+flag(p.country)+'</span><b>L'+String(Number(p.level)||0).padStart(3,'0')+'</b><em>'+fmt(p.timeMs)+'</em></span></div>').join(''):'<div class="run-rank-empty">AINDA NÃO HÁ TEMPOS REGISTADOS.</div>')+(data.me?.timeMs?'<div class="run-rank-me">TEU PB · L'+String(Number(data.me.level)||0).padStart(3,'0')+' · '+fmt(data.me.timeMs)+' · #'+Number(data.me.rank||0)+'</div>':'');
      window.eixoApplyNameEffects?.();
    }catch(_){rankHost.innerHTML='<div class="run-rank-empty">RANKING TEMPORARIAMENTE INDISPONÍVEL</div>';}
    finally{rankBusy=false;}
  }
  if(rankHost){
    const ro=new MutationObserver(()=>{if(!rankBusy&&!rankHost.querySelector('.run-rank-row')&&!rankHost.querySelector('.run-rank-empty'))setTimeout(refreshStartRanking,0);});ro.observe(rankHost,{childList:true,subtree:true,characterData:true});refreshStartRanking();setInterval(refreshStartRanking,5000);
  }

  /* Audio state follows the real game overlays, so sounds do not depend on Phaser internals. */
  const startOverlay=$('run-start-overlay'),clearOverlay=$('run-clear-overlay'),noticeTitle=$('run-notice-title');
  let startWasHidden=startOverlay?.classList.contains('is-hidden')||false,clearWasVisible=clearOverlay?!clearOverlay.classList.contains('is-hidden'):false,lastNotice='';
  if(startOverlay)new MutationObserver(()=>{const hidden=startOverlay.classList.contains('is-hidden');if(hidden&&!startWasHidden)audio.start();startWasHidden=hidden;}).observe(startOverlay,{attributes:true,attributeFilter:['class']});
  if(clearOverlay)new MutationObserver(()=>{const visible=!clearOverlay.classList.contains('is-hidden');if(visible&&!clearWasVisible)audio.clear();clearWasVisible=visible;}).observe(clearOverlay,{attributes:true,attributeFilter:['class']});
  if(noticeTitle)new MutationObserver(()=>{const v=(noticeTitle.textContent||'').trim();if(v&&v!==lastNotice&&(v==='DEAD'||v==='RESTART'))audio.death();lastNotice=v;}).observe(noticeTitle,{childList:true,characterData:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target.closest?.('.run-level-cell,.run-level-open,.run-clear-actions button,.run-start-button'))audio.ui();});

  const css=document.createElement('style');css.textContent=`
  .run-start-ranking{white-space:normal!important;font-family:Inter,Arial,sans-serif!important;line-height:1.2!important;color:#edf3ff!important;min-height:235px}
  .run-start-rank-head{display:flex;align-items:center;gap:8px;padding-bottom:11px;margin-bottom:3px;border-bottom:1px solid #314158}.run-start-rank-head strong{font:800 10px Inter,Arial,sans-serif;letter-spacing:1px}
  .run-rank-row{display:grid;grid-template-columns:24px minmax(0,1fr) auto;gap:9px;align-items:center;min-height:43px;border-bottom:1px solid #29384c}.run-rank-pos{font:800 9px Inter,Arial,sans-serif;color:#e6c85c}.run-rank-identity{display:flex;align-items:center;gap:5px;min-width:0;flex-wrap:wrap}.run-rank-identity .rank-player-name{display:inline-flex;min-width:0;font:800 10px Inter,Arial,sans-serif;white-space:nowrap;overflow:visible}.run-rank-identity .name-letter{display:inline-block;transform-origin:center bottom;white-space:pre}.run-rank-tags{display:inline-flex;gap:3px;align-items:center}.run-rank-medal,.run-rank-achievement,.run-rank-vip{display:inline-grid;place-items:center;min-width:16px;height:16px;padding:0 4px;border:1px solid #6c5a39;border-radius:6px;background:#302719;color:#f0cd73;font:800 7px Inter,Arial,sans-serif}.run-rank-achievement{border-color:#59647b;background:#202a3b;color:#d8def1}.run-rank-vip{border-color:#4a807d;background:#152b2d;color:#71e1d7}.run-rank-result{display:grid;grid-template-columns:auto auto;align-items:center;justify-items:end;gap:2px 7px;white-space:nowrap}.run-rank-flag{grid-row:1/3;font-size:12px}.run-rank-result b{font:800 9px Inter,Arial,sans-serif;color:#b9a5ff}.run-rank-result em{font:800 8px ui-monospace,SFMono-Regular,Consolas,monospace;color:#dfe7f2;font-style:normal}.run-rank-me{margin-top:10px;padding-top:9px;border-top:1px solid #3a4961;color:#a99de3;font:800 8px Inter,Arial,sans-serif;letter-spacing:.4px}.run-rank-empty{padding:20px 0;color:#73869d;font:700 9px Inter,Arial,sans-serif}
  @media(max-width:820px){.run-rank-result em{display:none}.run-rank-row{grid-template-columns:20px minmax(0,1fr) auto}}
  `;document.head.appendChild(css);
})();