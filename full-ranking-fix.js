(function(){
 const esc=v=>String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
 const flag=c=>[...String(c||'')].map(x=>String.fromCodePoint(127397+x.charCodeAt())).join('');
 const tag=(t,n)=>`<span class="rank-tag ${t}-${n}">TOP ${n}</span>`;
 async function render(){const modal=document.getElementById('rankingModal'),list=document.getElementById('fullRankingList');if(!modal||modal.classList.contains('hidden')||!list)return;const active=document.querySelector('.ranking-tab.active')?.id;const countryMode=active==='modalCountryTab';let page=1;const m=document.getElementById('pageInfo')?.textContent?.match(/^(\d+)/);if(m)page=Number(m[1])||1;let p=null;try{p=JSON.parse(localStorage.getItem('eixo_player')||'null')}catch(_){}const country=p?.country||'PT';try{const u=countryMode?`/api/rankings?country=${encodeURIComponent(country)}&page=${page}`:`/api/rankings?page=${page}`;const r=await fetch(u,{cache:'no-store'}),d=await r.json();if(!r.ok)throw Error();list.innerHTML=d.players.length?d.players.map((x,i)=>{let tags='';if(x.worldRank<=3)tags+=tag('world',x.worldRank);if(countryMode&&x.countryRank<=3)tags+=tag('country',x.countryRank);const color=String(x.nameColor||'#fff').toLowerCase(),rainbow=color==='rainbow',effect=x.nameEffect&&x.nameEffect!=='none'?` effect-${esc(x.nameEffect)}`:'';return `<li><span class="full-rank-number">${(page-1)*25+i+1}</span><span class="full-player"><span class="rank-name-wrap"><span class="rank-player-name${rainbow?' name-rainbow':''}${effect}" style="${rainbow?'':'color:'+esc(color)+';'}">${esc(x.visualName||x.name)}</span>${tags}</span></span><span class="full-score rank-score-wrap"><span class="rank-flag" title="${esc(x.country)}">${esc(flag(x.country))}</span><span class="rank-score">${Number(x.score||0)}</span></span></li>`}).join(''):'<li class="empty-full">AINDA NÃO EXISTEM JOGADORES</li>';}catch(_){}}
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
 setInterval(render,700);document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});
})();
