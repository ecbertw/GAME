/* EIXO ranking renderer: PULSE + RUN identity styling, resilient boot and Passport avatar. */
(function(){
 'use strict';
 const worldEl=document.getElementById('worldRanking'),countryEl=document.getElementById('nationalRanking');
 const esc=v=>String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
 const flag=code=>{const c=String(code||'').toUpperCase();return /^[A-Z]{2}$/.test(c)?[...c].map(x=>String.fromCodePoint(127397+x.charCodeAt())).join(''):'🌐';};
 const rankLabels={pt:'O TEU RANK É:',en:'YOUR RANK IS:',es:'TU RANGO ES:',fr:'TON RANG EST:',de:'DEIN RANG IST:',it:'IL TUO RANK È:',ja:'あなたの順位:',ko:'내 순위:',zh:'你的排名:',ru:'ТВОЙ РАНГ:',pl:'TWÓJ RANKING:',nl:'JOUW RANG IS:',tr:'SIRAN:',ar:'ترتيبك:',sv:'DIN RANK ÄR:',no:'DIN RANG ER:',da:'DIN RANG ER:',fi:'SIJOITUKSESI:',el:'Η ΚΑΤΑΤΑΞΗ ΣΟΥ:',cs:'TVÉ POŘADÍ:',id:'PERINGKATMU:',th:'อันดับของคุณ:',vi:'HẠNG CỦA BẠN:',he:'הדירוג שלך:'};
 const getRankLabel=()=>rankLabels[String(document.documentElement.lang||'en').split('-')[0]]||rankLabels.en;
 const tag=(type,n,country)=>{const label=type==='country'?esc(country)+' #'+n:'GLOBAL #'+n;return '<span class="rank-tag medal-rank '+type+'-'+n+'" title="'+label+'" aria-label="'+label+'"><span class="rank-medal-icon" aria-hidden="true"><span class="rank-medal-number">'+n+'</span></span></span>';};
 const vipTag=n=>n>0?'<span class="vip-rank-tag vip-medal vip-rank-'+Math.min(n,6)+'" title="VIP '+(n>=6?'∞':n)+'" aria-label="VIP '+(n>=6?'∞':n)+'"><span class="vip-medal-mark" aria-hidden="true">'+['','◆','✧','✦','♛','★','∞'][Math.min(n,6)]+'</span></span>':'';
 const achievement=b=>({['first-100']:'100',['skybound']:'↟',['explorer']:'✦',['pulse-10']:'◎'}[b]||'');
 const achievementTag=b=>achievement(b)?'<span class="achievement-tag achievement-'+esc(b)+'" title="'+esc(b)+'" aria-label="Featured achievement"><span aria-hidden="true">'+achievement(b)+'</span></span>':'';
 const safeEffect=v=>/^[a-z]+$/.test(String(v||''))?String(v):'none';
 const letters=(text,styles)=>{const arr=Array.isArray(styles)?styles:[];return [...String(text||'')].map((ch,i)=>{const s=arr[i]||{},color=String(s.color||'').toLowerCase(),effect=safeEffect(s.effect),rainbow=color==='rainbow',safeColor=/^#[0-9a-f]{6}$/i.test(color)?color:'';return '<span class="name-letter'+(rainbow?' name-rainbow':'')+' effect-'+effect+'"'+(safeColor?' style="color:'+safeColor+';"':'')+'>'+esc(ch)+'</span>';}).join('');};
 function styledName(p){
   const color=String(p?.nameColor||'#ffffff').toLowerCase(),effect=safeEffect(p?.nameEffect),vip=Number(p?.vipLevel||0),hasLetters=vip>0&&Array.isArray(p?.letterStyles)&&p.letterStyles.length>0,rainbow=color==='rainbow'&&!hasLetters,safeColor=/^#[0-9a-f]{6}$/i.test(color)?color:'#ffffff';
   const cls='rank-player-name'+(rainbow?' name-rainbow':'')+(effect!=='none'?' effect-'+effect:'')+(hasLetters?' vip-letter-styled':'');
   const style=rainbow?'':' style="color:'+esc(safeColor)+';"';
   const body=hasLetters?letters(p.visualName||p.name,p.letterStyles):[...String(p.visualName||p.name||'PLAYER')].map(ch=>'<span class="name-letter">'+esc(ch)+'</span>').join('');
   return '<span class="'+cls+'"'+style+'>'+body+'</span>';
 }
 function rankTags(p,isWorld){
   let tags='';const wr=Number(p.worldRank||p.rank||0),cr=Number(p.countryRank||0);
   if(isWorld){if(wr>=1&&wr<=3)tags+=tag('world',wr,'');if(wr>3&&cr>=1&&cr<=3)tags+=tag('country',cr,String(p.country||'').toUpperCase());}
   else if(cr>=1&&cr<=3)tags+=tag('country',cr,String(p.country||'').toUpperCase());
   return tags+achievementTag(p.featuredBadge)+vipTag(Number(p.vipLevel||0));
 }
 function render(list,target,isWorld){
   if(!target)return;
   if(!list?.length){target.innerHTML='<li class="empty-row">'+(window.eixoT?window.eixoT('emptyRanking','NO PLAYERS YET'):'NO PLAYERS YET')+'</li>';return;}
   target.innerHTML=list.slice(0,10).map((p,i)=>'<li><span class="rank-number">'+(i+1)+'</span><span class="rank-name-wrap">'+styledName(p)+rankTags(p,isWorld)+'</span><span class="rank-score-wrap"><span class="rank-flag" title="'+esc(p.country)+'">'+flag(p.country)+'</span><span class="rank-score">'+Number(p.score||0)+'</span></span></li>').join('');
   window.eixoApplyNameEffects?.();
 }
 function registeredCountry(){try{const p=JSON.parse(localStorage.getItem('eixo_player')||'null');if(p?.country)return String(p.country).toUpperCase()}catch(_){}return 'PT'}
 function setMyRank(id,rank){const el=document.getElementById(id);if(!el)return;const n=Number(rank),valid=Number.isInteger(n)&&n>0;el.textContent=valid?getRankLabel()+' '+n:'';el.title=el.textContent;el.hidden=!valid;}
 function ensureRankLabels(){
   const wt=document.querySelector('#worldRanking')?.closest('.board')?.querySelector('.board-title');
   const ct=document.querySelector('#nationalRanking')?.closest('.board')?.querySelector('.board-title');
   if(wt&&!document.getElementById('worldMyRank')){const s=document.createElement('span');s.id='worldMyRank';s.className='board-my-rank';s.hidden=true;wt.appendChild(s);}
   if(ct&&!document.getElementById('nationalMyRank')){const s=document.createElement('span');s.id='nationalMyRank';s.className='board-my-rank';s.hidden=true;ct.appendChild(s);}
 }
 async function load(){
   if(!worldEl||!countryEl||window.eixoJumpActive)return;
   ensureRankLabels();const code=registeredCountry();const p=(()=>{try{return JSON.parse(localStorage.getItem('eixo_player')||'null')}catch(_){return null}})();
   try{
     const requests=[fetch('/api/pulse/orbit/rankings?page=1',{cache:'no-store'}),fetch('/api/pulse/orbit/rankings?country='+encodeURIComponent(code)+'&page=1',{cache:'no-store'})];
     if(p?.id)requests.push(fetch('/api/pulse/orbit/player-rank?id='+encodeURIComponent(p.id),{cache:'no-store',credentials:'same-origin'}));
     const results=await Promise.all(requests);if(!results[0].ok||!results[1].ok)throw Error();
     const [w,c]=await Promise.all([results[0].json(),results[1].json()]);if(window.eixoJumpActive)return;
     render(w.players,worldEl,true);render(c.players,countryEl,false);
     if(results[2]){if(results[2].ok){const me=await results[2].json();setMyRank('worldMyRank',me.worldRank);setMyRank('nationalMyRank',me.countryRank);}else{setMyRank('worldMyRank',w.players.find(x=>x.id===p?.id)?.worldRank);setMyRank('nationalMyRank',c.players.find(x=>x.id===p?.id)?.countryRank);}}
     else{setMyRank('worldMyRank',w.players.find(x=>x.id===p?.id)?.worldRank);setMyRank('nationalMyRank',c.players.find(x=>x.id===p?.id)?.countryRank);}
   }catch(_){setMyRank('worldMyRank',null);setMyRank('nationalMyRank',null);}
 }

 /* Style roster: the normal EIXO ranking endpoint already exposes visualName, colors, effects, VIP, badges and per-letter styling. */
 let styleCache={at:0,map:new Map()},stylePromise=null;
 async function styleRoster(force=false){
   if(!force&&Date.now()-styleCache.at<15000&&styleCache.map.size)return styleCache.map;
   if(stylePromise)return stylePromise;
   stylePromise=(async()=>{
     const first=await fetch('/api/rankings?page=1',{credentials:'same-origin',cache:'no-store'});if(!first.ok)throw Error('styles');
     const data=await first.json(),pages=Math.min(30,Math.max(1,Number(data.pages)||1)),rows=[...(data.players||[])];
     if(pages>1){const rest=await Promise.all(Array.from({length:pages-1},(_,i)=>fetch('/api/rankings?page='+(i+2),{credentials:'same-origin',cache:'no-store'}).then(r=>r.ok?r.json():{players:[]})));for(const d of rest)rows.push(...(d.players||[]));}
     const map=new Map(rows.map(p=>[String(p.id),p]));styleCache={at:Date.now(),map};return map;
   })().finally(()=>{stylePromise=null});
   return stylePromise;
 }
 function runTime(ms){const n=Math.max(0,Math.floor(Number(ms)||0)),min=Math.floor(n/60000),sec=Math.floor((n%60000)/1000),m=n%1000;return String(min).padStart(2,'0')+':'+String(sec).padStart(2,'0')+'.'+String(m).padStart(3,'0');}
 function mergeRunRows(rows,map){return (rows||[]).map(p=>{const style=map.get(String(p.playerId||p.id))||{};return {...style,...p,id:p.playerId||p.id,visualName:style.visualName||p.name,worldRank:Number(p.rank||p.worldRank||0),countryRank:Number(p.countryRank||0),letterStyles:Array.isArray(style.letterStyles)?style.letterStyles:[]};});}
 function runRows(rows,isWorld){
   if(!rows.length)return '<li class="empty-row">'+(document.documentElement.lang.startsWith('pt')?'AINDA NÃO HÁ TEMPOS REGISTADOS.':'NO TIMES RECORDED YET.')+'</li>';
   return rows.slice(0,50).map((p,i)=>{
     const pos=isWorld?Number(p.worldRank||i+1):Number(p.countryRank||i+1);
     return '<li><span class="rank-number">'+pos+'</span><span class="rank-name-wrap">'+styledName(p)+rankTags(p,isWorld)+'</span><span class="rank-score-wrap eixo-run-score-wrap"><span class="rank-flag" title="'+esc(p.country)+'">'+flag(p.country)+'</span><span class="rank-score eixo-run-score"><b>L'+String(Number(p.level)||0).padStart(3,'0')+'</b><em>'+runTime(p.timeMs)+'</em></span></span></li>';
   }).join('');
 }
 let runRendering=false,lastRunRender=0;
 async function enhanceRunRankings(force=false){
   const view=document.querySelector('.rx-run-ranking-view');if(!view)return;
   const runButton=document.querySelector('[data-rx-board="run"]');if(runButton&&runButton.getAttribute('aria-pressed')!=='true'&&!runButton.classList.contains('active'))return;
   if(runRendering||(!force&&view.dataset.eixoRunStyled==='1'&&Date.now()-lastRunRender<3500))return;
   runRendering=true;
   try{
     const [rr,styles]=await Promise.all([fetch('/api/run/rankings?limit=50',{credentials:'same-origin',cache:'no-store'}),styleRoster()]);if(!rr.ok)throw Error('run-ranking');
     const data=await rr.json(),world=mergeRunRows(data.players,styles),national=mergeRunRows(data.countryPlayers,styles),country=String(data.country||data.me?.country||registeredCountry()).toUpperCase(),me=data.me||null;
     view.innerHTML='<section class="boards eixo-run-boards"><article class="board"><div class="board-title"><span>🌐</span><span>TOP MUNDIAL</span><span class="board-my-rank">'+(me?.rank?getRankLabel()+' '+me.rank:'')+'</span></div><ol class="eixo-run-list">'+runRows(world,true)+'</ol></article><article class="board"><div class="board-title"><span>'+flag(country)+'</span><span>TOP '+esc(country==='PT'?'PORTUGAL':country)+'</span><span class="board-my-rank">'+(me?.countryRank?getRankLabel()+' '+me.countryRank:'')+'</span></div><ol class="eixo-run-list">'+runRows(national,false)+'</ol></article></section>';
     view.dataset.eixoRunStyled='1';lastRunRender=Date.now();window.eixoApplyNameEffects?.();
   }catch(_){/* redesign.js keeps its fallback content */}
   finally{runRendering=false;}
 }
 function scheduleRunEnhance(force=false){setTimeout(()=>enhanceRunRankings(force),80);}

 /* Passport: replace the retired identity seal with the avatar currently selected in Account settings. */
 const AVATAR_GLYPHS={default:'◆',diamond:'◇',square:'■',circle:'●',star:'★',bolt:'⚡',shield:'⬢',hex:'⬡',crystal:'✦',spark:'✧',comet:'☄',crown:'♛',thunder:'ϟ',skull:'☠',phoenix:'♨',vortex:'◉',titan:'♜',plasma:'✺',infinity:'∞',cosmic:'✹',prism:'◈'};
 const safeClass=v=>String(v||'').replace(/[^a-z0-9-]/gi,'').toLowerCase();
 function currentPlayer(){return window.eixoGetPlayer?.()||(()=>{try{return JSON.parse(localStorage.getItem('eixo_player')||'null')}catch(_){return null}})();}
 function patchPassportAvatar(){
   const panel=document.querySelector('#rx-passport .rx-passport-seal-panel');if(!panel)return;
   if(!panel.querySelector('#rxPassportAvatar'))panel.innerHTML='<div class="rx-passport-avatar-stage"><div id="rxPassportAvatar" class="rx-passport-avatar"><span></span></div></div><div class="rx-passport-seal-caption">AVATAR DO JOGADOR</div>';
   const p=currentPlayer(),el=document.getElementById('rxPassportAvatar');if(!el)return;
   const avatar=String(p?.avatar||'default'),border=String(p?.avatarBorder||'#46535f').toLowerCase();
   el.className='rx-passport-avatar avatar-'+safeClass(avatar)+(border.startsWith('#')?'':' border-'+safeClass(border));
   el.querySelector('span').textContent=(window.eixoAvatarGlyph?.(avatar)||AVATAR_GLYPHS[avatar]||'◆');
   el.style.borderColor=/^#[0-9a-f]{6}$/i.test(border)?border:'';
 }

 /* Small presentation patch loaded before redesign.js: centered boot aura + exact PULSE-like RUN rows + Passport avatar effects. */
 const style=document.createElement('style');
 style.textContent=`
 .eixo-booting>.eixo-boot-screen{background:radial-gradient(circle at 50% 50%,#202949 0,transparent 32%),#080d15!important}
 .eixo-run-boards{width:100%}.eixo-run-boards .board-title{display:flex;align-items:center;gap:9px}.eixo-run-boards .board-title .board-my-rank{margin-left:auto}
 .eixo-run-score-wrap{min-width:190px;justify-content:flex-end}.eixo-run-score{display:flex!important;align-items:center;gap:12px;white-space:nowrap}.eixo-run-score b{font:800 11px/1 Inter,Arial,sans-serif;color:#b49aff}.eixo-run-score em{font:800 10px/1 ui-monospace,SFMono-Regular,Consolas,monospace;color:#e2e9f4;font-style:normal}
 .rx-passport-avatar-stage{position:relative;min-height:355px;display:grid;place-items:center;border:1px solid #62759b67;border-radius:17px;background:radial-gradient(circle at 50% 42%,#343a67 0,#1d2942 42%,#0f1a2c 78%);overflow:hidden}
 .rx-passport-avatar-stage:before{content:"";position:absolute;width:220px;height:220px;border:1px solid #a9a5e32e;border-radius:50%;box-shadow:0 0 0 42px #a7acf008,0 0 0 82px #a7acf005}
 .rx-passport-avatar{position:relative;z-index:2;width:142px;height:142px;display:grid;place-items:center;border:4px solid #46535f;border-radius:30px;background:linear-gradient(145deg,#242f43,#0e1725);box-shadow:0 22px 50px #0509148f,inset 0 1px #ffffff30;color:#f4f7ff;font:72px/1 Arial,sans-serif;transition:.2s}
 .rx-passport-avatar>span{position:relative;z-index:2;filter:drop-shadow(0 5px 8px #0007)}
 .rx-passport-avatar.border-glow-blue{border-color:#00d4ff;box-shadow:0 0 16px #00d4ff,0 22px 50px #0509148f}.rx-passport-avatar.border-glow-yellow{border-color:#ffd43b;box-shadow:0 0 16px #ffd43b,0 22px 50px #0509148f}
 .rx-passport-avatar.border-pulse-green{border-color:#39d98a;animation:rxAvatarPulseGreen 1.1s ease-in-out infinite}.rx-passport-avatar.border-pulse-purple{border-color:#b66cff;animation:rxAvatarPulsePurple 1.1s ease-in-out infinite}
 .rx-passport-avatar.border-electric-yellow{border-color:#ffd43b;animation:rxAvatarElectric .32s steps(2,end) infinite}.rx-passport-avatar.border-electric-blue{border-color:#00d4ff;animation:rxAvatarElectric .32s steps(2,end) infinite}
 .rx-passport-avatar.border-flame-orange{border-color:#ff7a2f;animation:rxAvatarFlameOrange .65s ease-in-out infinite alternate}.rx-passport-avatar.border-flame-red{border-color:#ef4444;animation:rxAvatarFlameRed .65s ease-in-out infinite alternate}
 .rx-passport-avatar.border-plasma-cyan{border-color:#00e5ff;box-shadow:0 0 10px #00e5ff,0 0 24px #7c4dff;animation:rxAvatarPlasma 1.2s linear infinite}.rx-passport-avatar.border-plasma-purple{border-color:#c084fc;box-shadow:0 0 10px #c084fc,0 0 24px #ff4fd8;animation:rxAvatarPlasma 1.2s linear infinite}
 .rx-passport-avatar.border-cosmic{border-color:#7c4dff;box-shadow:0 0 12px #7c4dff,0 0 26px #00e5ff,0 0 38px #ff4fd8;animation:rxAvatarCosmic 1.8s ease-in-out infinite}.rx-passport-avatar.border-infinity-rgb,.rx-passport-avatar.border-rainbow{border-color:#ff4d4d;animation:rxAvatarRgb 1.55s linear infinite}
 @keyframes rxAvatarPulseGreen{50%{box-shadow:0 0 24px #39d98a}}@keyframes rxAvatarPulsePurple{50%{box-shadow:0 0 24px #b66cff}}@keyframes rxAvatarElectric{50%{filter:brightness(1.7);transform:translateX(1px)}}
 @keyframes rxAvatarFlameOrange{to{box-shadow:0 -8px 16px #ff7a2f,0 -17px 28px #ef4444}}@keyframes rxAvatarFlameRed{to{box-shadow:0 -8px 16px #ef4444,0 -17px 28px #ff7a2f}}@keyframes rxAvatarPlasma{50%{filter:hue-rotate(80deg)}}@keyframes rxAvatarCosmic{50%{transform:scale(1.04);filter:hue-rotate(80deg)}}
 @keyframes rxAvatarRgb{0%{border-color:#ff4d4d;box-shadow:0 0 22px #ff4d4d}17%{border-color:#ffd43b;box-shadow:0 0 22px #ffd43b}34%{border-color:#39d98a;box-shadow:0 0 22px #39d98a}51%{border-color:#00d4ff;box-shadow:0 0 22px #00d4ff}68%{border-color:#6f5cff;box-shadow:0 0 22px #6f5cff}85%{border-color:#ff4fd8;box-shadow:0 0 22px #ff4fd8}100%{border-color:#ff4d4d;box-shadow:0 0 22px #ff4d4d}}
 @media(max-width:700px){.rx-passport-avatar-stage{min-height:280px}.rx-passport-avatar{width:118px;height:118px;font-size:60px}}
 `;
 document.head.appendChild(style);

 /* A JS exception later in the page must never trap the visitor behind the boot screen. */
 const finishBoot=()=>{document.body?.classList.remove('eixo-booting');document.body?.classList.add('eixo-ready');};
 window.addEventListener('load',()=>setTimeout(finishBoot,120),{once:true});
 setTimeout(finishBoot,2500);

 window.addEventListener('eixo-player-updated',()=>{load();styleCache.at=0;setTimeout(patchPassportAvatar,0);scheduleRunEnhance(true);});
 window.addEventListener('eixo-outfit-updated',()=>{setTimeout(patchPassportAvatar,0);scheduleRunEnhance(true);});
 window.eixoRefreshRankings=load;window.loadTopRankings=load;
 if(worldEl&&countryEl)load();
 setInterval(()=>{load();if(location.pathname.replace(/\/$/,'')==='/rankings')scheduleRunEnhance(true);},5000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){load();scheduleRunEnhance(true);patchPassportAvatar();}});
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-rx-board="run"],[data-rx-route="rankings"]'))scheduleRunEnhance(true);if(e.target.closest?.('[data-rx-route="passport"]'))setTimeout(patchPassportAvatar,100);},true);
 window.addEventListener('popstate',()=>{scheduleRunEnhance(true);setTimeout(patchPassportAvatar,80);});
 const observer=new MutationObserver(()=>{if(document.querySelector('.rx-run-ranking-view'))scheduleRunEnhance(false);if(document.querySelector('#rx-passport .rx-passport-seal-panel'))patchPassportAvatar();});
 observer.observe(document.documentElement,{childList:true,subtree:true});
})();
