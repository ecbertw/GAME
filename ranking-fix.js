/* EIXO ranking renderer: live Top 5, tags, flags and visual-name styling. */
(function(){
 const worldEl=document.getElementById('worldRanking'),countryEl=document.getElementById('nationalRanking');if(!worldEl||!countryEl)return;
 const esc=v=>String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
 const flag=code=>[...String(code||'')].map(c=>String.fromCodePoint(127397+c.charCodeAt())).join('');
 const tag=(type,n)=>`<span class="rank-tag ${type}-${n}">TOP ${n}</span>`;
 function render(list,target){if(!list?.length){target.innerHTML='<li class="empty-row">AINDA SEM JOGADORES</li>';return}target.innerHTML=list.slice(0,5).map((p,i)=>{let tags='';if(Number(p.worldRank)<=3)tags+=tag('world',Number(p.worldRank));if(Number(p.countryRank)<=3)tags+=tag('country',Number(p.countryRank));const color=String(p.nameColor||'#fff').toLowerCase(),rainbow=color==='rainbow',effect=p.nameEffect&&p.nameEffect!=='none'?` effect-${esc(p.nameEffect)}`:'';return `<li><span class="rank-number">${i+1}</span><span class="rank-name-wrap"><span class="rank-player-name${rainbow?' name-rainbow':''}${effect}" style="${rainbow?'':'color:'+esc(color)+';'}">${esc(p.visualName||p.name)}</span>${tags}</span><span class="rank-score-wrap"><span class="rank-flag" title="${esc(p.country)}">${flag(p.country)}</span><span class="rank-score">${Number(p.score||0)}</span></span></li>`}).join('')}
 function registeredCountry(){try{const p=JSON.parse(localStorage.getItem('eixo_player')||'null');if(p?.country)return String(p.country).toUpperCase()}catch(_){}return 'PT'}
 async function load(){const code=registeredCountry();try{const [wr,cr]=await Promise.all([fetch('/api/rankings?page=1',{cache:'no-store'}),fetch('/api/rankings?country='+encodeURIComponent(code)+'&page=1',{cache:'no-store'})]);if(!wr.ok||!cr.ok)throw Error();const [w,c]=await Promise.all([wr.json(),cr.json()]);render(w.players,worldEl);render(c.players,countryEl)}catch(_){} }
 window.eixoRefreshRankings=load;window.loadTopRankings=load;load();setInterval(load,2000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)load()});
})();
