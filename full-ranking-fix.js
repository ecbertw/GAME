(function(){
 const esc=v=>String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
 const flag=c=>[...String(c||'')].map(x=>String.fromCodePoint(127397+x.charCodeAt())).join('');
 const tag=(t,n,country,p)=>{const me=(()=>{try{return JSON.parse(localStorage.getItem('eixo_player')||'null')}catch(_){return null}})();const raw=t==='country'?(p?.tagCountryColor||(me&&me.id===p?.id?me.tagCountryColor:'#ff7a2f')):(p?.tagGlobalColor||(me&&me.id===p?.id?me.tagGlobalColor:'#e53935'));const c=String(raw||'').toLowerCase(),rainbow=c==='rainbow';return `<span class="rank-tag ${t}-${n}${rainbow?' tag-rainbow':''}"${!rainbow&&/^#[0-9a-f]{6}$/.test(c)?` style="--tag-color:${c}"`:''}>${n}# ${t==='country'?esc(country):'GLOBAL'}</span>`};const vipTag=n=>n>0?`<span class="vip-rank-tag vip-rank-${Math.min(n,6)}">${n>=6?'VIP ∞':`VIP #${n}`}</span>`:'';const letters=(text,styles)=>{const arr=Array.isArray(styles)?styles:[];return [...String(text||'')].map((ch,i)=>{const s=arr[i]||{};const color=String(s.color||'').toLowerCase();const effect=String(s.effect||'none'),rainbow=color==='rainbow';const safeColor=/^#[0-9a-f]{6}$/i.test(color)?color:'';const safeEffect=/^[a-z]+$/.test(effect)?effect:'none';return `<span class="name-letter${rainbow?' name-rainbow':''} effect-${safeEffect}"${safeColor?' style="color:'+safeColor+';"':''}>${esc(ch)}</span>`}).join('')};
 async function render(){const modal=document.getElementById('rankingModal'),list=document.getElementById('fullRankingList');if(!modal||modal.classList.contains('hidden')||!list)return;const active=document.querySelector('.ranking-tab.active')?.id;const countryMode=active==='modalCountryTab';let page=1;const m=document.getElementById('pageInfo')?.textContent?.match(/^(\d+)/);if(m)page=Number(m[1])||1;let p=null;try{p=JSON.parse(localStorage.getItem('eixo_player')||'null')}catch(_){}const country=p?.country||'PT';try{const u=countryMode?`/api/rankings?country=${encodeURIComponent(country)}&page=${page}`:`/api/rankings?page=${page}`;const r=await fetch(u,{cache:'no-store'}),d=await r.json();if(!r.ok)throw Error();list.innerHTML=d.players.length?d.players.map((x,i)=>{let tags='';if(x.worldRank<=3)tags+=tag('world',x.worldRank,'',x);if(x.countryRank<=3)tags+=tag('country',x.countryRank,String(x.country||'').toUpperCase(),x);const color=String(x.nameColor||'#fff').toLowerCase(),effect=x.nameEffect&&x.nameEffect!=='none'?` effect-${esc(x.nameEffect)}`:'',vip=Number(x.vipLevel||0);const hasLetters=vip>0&&Array.isArray(x.letterStyles)&&x.letterStyles.length,rainbow=color==='rainbow'&&!hasLetters,colorStyle=rainbow?'':' style="color:'+esc(color)+';"';return `<li><span class="full-rank-number">${(page-1)*25+i+1}</span><span class="full-player"><span class="rank-name-wrap"><span class="rank-player-name${rainbow?' name-rainbow':''}${effect}${hasLetters?' vip-letter-styled':''}"${colorStyle}>${hasLetters?letters(x.visualName||x.name,x.letterStyles):[...String(x.visualName||x.name)].map(ch=>`<span class="name-letter">${esc(ch)}</span>`).join('')}</span>${tags}${vipTag(vip)}</span></span><span class="full-score rank-score-wrap"><span class="rank-flag" title="${esc(x.country)}">${esc(flag(x.country))}</span><span class="rank-score">${Number(x.score||0)}</span></span></li>`}).join('') :'<li class="empty-full">'+(window.eixoT?window.eixoT('emptyFull','THERE ARE NO PLAYERS YET'):'THERE ARE NO PLAYERS YET')+'</li>';}catch(_){}}
 function bindMainRanking(){
  const button=document.querySelector('.action.blue[href="#ranking"]');
  const modal=document.getElementById('rankingModal');
  if(button&&modal&&button.dataset.rankingBound!=='1'){
   button.dataset.rankingBound='1';
   button.addEventListener('click',e=>{
    e.preventDefault();
    const world=document.getElementById('modalWorldTab'),countryTab=document.getElementById('modalCountryTab');
    if(world&&countryTab){world.classList.add('active');countryTab.classList.remove('active');}
    const info=document.getElementById('pageInfo');if(info)info.textContent='1 / 1';
    modal.classList.remove('hidden');
    render();
   });
  }
  document.getElementById('worldFullButton')?.remove();
  document.getElementById('nationalFullButton')?.remove();
 }
 bindMainRanking();
 setInterval(render,3000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});
})();
