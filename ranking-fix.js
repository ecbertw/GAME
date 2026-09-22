/* EIXO ranking renderer: live Top 10, tags, flags, visual-name styling and personal rank. */
(function(){
 const worldEl=document.getElementById('worldRanking'),countryEl=document.getElementById('nationalRanking');if(!worldEl||!countryEl)return;
 const esc=v=>String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
 const flag=code=>[...String(code||'')].map(c=>String.fromCodePoint(127397+c.charCodeAt())).join('');
 const rankLabels={
   pt:'O TEU RANK É:',en:'YOUR RANK IS:',es:'TU RANGO ES:',fr:'TON RANG EST:',de:'DEIN RANG IST:',it:'IL TUO RANK È:',
   ja:'あなたの順位:',ko:'내 순위:',zh:'你的排名:',ru:'ТВОЙ РАНГ:',pl:'TWÓJ RANKING:',nl:'JOUW RANG IS:',tr:'SIRAN:',
   ar:'ترتيبك:',sv:'DIN RANK ÄR:',no:'DIN RANG ER:',da:'DIN RANG ER:',fi:'SIJOITUKSESI:',el:'Η ΚΑΤΑΤΑΞΗ ΣΟΥ:',
   cs:'TVÉ POŘADÍ:',id:'PERINGKATMU:',th:'อันดับของคุณ:',vi:'HẠNG CỦA BẠN:',he:'הדירוג שלך:'
 };
 const getRankLabel=()=>rankLabels[document.documentElement.lang]||rankLabels.en;
 const tag=(type,n,country,p)=>{const me=(()=>{try{return JSON.parse(localStorage.getItem('eixo_player')||'null')}catch(_){return null}})();const raw=type==='country'?(p?.tagCountryColor||(me&&me.id===p?.id?me.tagCountryColor:'#ff7a2f')):(p?.tagGlobalColor||(me&&me.id===p?.id?me.tagGlobalColor:'#e53935'));const c=String(raw||'').toLowerCase(),rainbow=c==='rainbow';return `<span class="rank-tag ${type}-${n}${rainbow?' tag-rainbow':''}"${!rainbow&&/^#[0-9a-f]{6}$/.test(c)?` style="background:${c}!important;color:#fff!important"`:''}>${n}# ${type==='country'?esc(country):'GLOBAL'}</span>`};
 const vipTag=n=>n>0?`<span class="vip-rank-tag vip-rank-${Math.min(n,6)}">${n>=6?'VIP ∞':`VIP #${n}`}</span>`:'';
 const letters=(text,styles)=>{const arr=Array.isArray(styles)?styles:[];return [...String(text||'')].map((ch,i)=>{const s=arr[i]||{};const color=String(s.color||'').toLowerCase();const effect=String(s.effect||'none'),rainbow=color==='rainbow';const safeColor=/^#[0-9a-f]{6}$/i.test(color)?color:'';const safeEffect=/^[a-z]+$/.test(effect)?effect:'none';return `<span class="name-letter${rainbow?' name-rainbow':''} effect-${safeEffect}"${safeColor?' style="color:'+safeColor+';"':''}>${esc(ch)}</span>`}).join('')};
 function render(list,target,isWorld){if(!list?.length){target.innerHTML='<li class="empty-row">'+(window.eixoT?window.eixoT('emptyRanking','NO PLAYERS YET'):'NO PLAYERS YET')+'</li>';return}target.innerHTML=list.slice(0,10).map((p,i)=>{let tags='';if(isWorld){if(Number(p.worldRank)<=3)tags+=tag('world',Number(p.worldRank),'',p);if(Number(p.worldRank)>3&&Number(p.countryRank)<=3)tags+=tag('country',Number(p.countryRank),String(p.country||'').toUpperCase(),p);}else if(Number(p.countryRank)<=3)tags+=tag('country',Number(p.countryRank),String(p.country||'').toUpperCase(),p);const color=String(p.nameColor||'#fff').toLowerCase(),rainbow=color==='rainbow',colorStyle=rainbow?'':' style="color:'+esc(color)+';"',effect=p.nameEffect&&p.nameEffect!=='none'?` effect-${esc(p.nameEffect)}`:'',vip=Number(p.vipLevel||0);const hasLetters=vip>0&&Array.isArray(p.letterStyles)&&p.letterStyles.length;return `<li><span class="rank-number">${i+1}</span><span class="rank-name-wrap"><span class="rank-player-name${rainbow?' name-rainbow':''}${effect}${hasLetters?' vip-letter-styled':''}"${colorStyle}>${hasLetters?letters(p.visualName||p.name,p.letterStyles):[...String(p.visualName||p.name)].map(ch=>`<span class="name-letter">${esc(ch)}</span>`).join('')}</span>${tags}${vipTag(vip)}</span><span class="rank-score-wrap"><span class="rank-flag" title="${esc(p.country)}">${flag(p.country)}</span><span class="rank-score">${Number(p.score||0)}</span></span></li>`}).join('')}
 function registeredCountry(){try{const p=JSON.parse(localStorage.getItem('eixo_player')||'null');if(p?.country)return String(p.country).toUpperCase()}catch(_){}return 'PT'}
 function setMyRank(id,rank){const el=document.getElementById(id);if(!el)return;const n=Number(rank),valid=Number.isInteger(n)&&n>0;el.textContent=valid?`${getRankLabel()} ${n}`:'';el.title=el.textContent;el.hidden=!valid;}
 function ensureRankLabels(){
   const wt=document.querySelector('#worldRanking')?.closest('.board')?.querySelector('.board-title');
   const ct=document.querySelector('#nationalRanking')?.closest('.board')?.querySelector('.board-title');
   if(wt&&!document.getElementById('worldMyRank')){const s=document.createElement('span');s.id='worldMyRank';s.className='board-my-rank';s.hidden=true;wt.appendChild(s);}
   if(ct&&!document.getElementById('nationalMyRank')){const s=document.createElement('span');s.id='nationalMyRank';s.className='board-my-rank';s.hidden=true;ct.appendChild(s);}
 }
 async function load(){
   ensureRankLabels();
   const code=registeredCountry();
   const p=(()=>{try{return JSON.parse(localStorage.getItem('eixo_player')||'null')}catch(_){return null}})();
   try{
     const requests=[fetch('/api/rankings?page=1',{cache:'no-store'}),fetch('/api/rankings?country='+encodeURIComponent(code)+'&page=1',{cache:'no-store'})];
     if(p?.id)requests.push(fetch('/api/player-rank?id='+encodeURIComponent(p.id),{cache:'no-store',credentials:'same-origin'}));
     const results=await Promise.all(requests);
     if(!results[0].ok||!results[1].ok)throw Error();
     const [w,c]=await Promise.all([results[0].json(),results[1].json()]);
     render(w.players,worldEl,true);render(c.players,countryEl,false);
     if(results[2]){
       if(results[2].ok){const me=await results[2].json();setMyRank('worldMyRank',me.worldRank);setMyRank('nationalMyRank',me.countryRank);}
       else{setMyRank('worldMyRank',w.players.find(x=>x.id===p?.id)?.worldRank);setMyRank('nationalMyRank',c.players.find(x=>x.id===p?.id)?.countryRank);}
     }else{setMyRank('worldMyRank',w.players.find(x=>x.id===p?.id)?.worldRank);setMyRank('nationalMyRank',c.players.find(x=>x.id===p?.id)?.countryRank);}
   }catch(_){setMyRank('worldMyRank',null);setMyRank('nationalMyRank',null);}
 }
 window.addEventListener('eixo-player-updated',load);window.eixoRefreshRankings=load;window.loadTopRankings=load;load();setInterval(load,2000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)load()});
})();