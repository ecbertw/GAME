/* EIXO ban screen — replaces the normal site while a signed-in account is banned. */
(function(){
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let timer=0;
  function fmt(ms){
    const total=Math.max(0,Math.floor(ms/1000));
    const d=Math.floor(total/86400),h=Math.floor((total%86400)/3600),m=Math.floor((total%3600)/60),s=total%60;
    const parts=[];if(d)parts.push(d+'d');parts.push(String(h).padStart(2,'0')+'h',String(m).padStart(2,'0')+'m',String(s).padStart(2,'0')+'s');return parts.join(' ');
  }
  function show(ban){
    clearInterval(timer);
    let root=document.getElementById('eixoBanScreen');
    if(!root){root=document.createElement('div');root.id='eixoBanScreen';document.body.appendChild(root);}
    root.innerHTML='<div class="ban-card"><div class="ban-mark">◆</div><h1>'+(ban?.permanent?'PERMANENTLY BANNED':'ACCOUNT SUSPENDED')+'</h1><p class="ban-copy">'+esc(ban?.permanent?'This account has been permanently banned from EIXO.':'This account is temporarily suspended from EIXO.')+'</p>'+(ban?.reason?'<div class="ban-reason"><span>REASON</span><strong>'+esc(ban.reason)+'</strong></div>':'')+(ban?.permanent?'':'<div class="ban-countdown"><span>TIME REMAINING</span><strong id="banCountdown">--</strong></div>')+'<div class="ban-foot">EIXO · SMALL PIXELS · BIG IDEAS</div></div>';
    document.documentElement.classList.add('eixo-banned');
    const tick=()=>{
      if(ban?.permanent)return;
      const until=Date.parse(ban?.until||'');
      const left=Number.isFinite(until)?until-Date.now():0;
      const el=document.getElementById('banCountdown');if(el)el.textContent=fmt(left);
      if(left<=0){clearInterval(timer);location.reload();}
    };
    tick();timer=setInterval(tick,1000);
  }
  window.eixoShowBan=show;
  window.addEventListener('eixo-ban',e=>show(e.detail||{}));
  if(window.__eixoPendingBan)show(window.__eixoPendingBan);
})();