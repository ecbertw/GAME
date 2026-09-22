/* EIXO ban screen — replaces the normal site while a signed-in account is banned. */
(function(){
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const style=document.createElement('style');style.textContent=`
    html.eixo-banned body{overflow:hidden!important;background:#05080c!important}
    html.eixo-banned body>*:not(#eixoBanScreen){display:none!important}
    #eixoBanScreen{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px;background:radial-gradient(circle at 50% 35%,#17131a 0,#070b10 42%,#030507 100%);color:#f4f5f6;font-family:'Press Start 2P',monospace}
    .ban-card{position:relative;width:min(650px,96vw);padding:36px 28px;border:3px solid #e83e45;outline:3px solid #201015;background:#090e14;box-shadow:9px 9px 0 #020305;text-align:center}
    .ban-mark{color:#e83e45;margin-bottom:18px;font-size:18px}.ban-card h1{margin:0 0 20px;color:#ff6b6b;font-size:18px;line-height:1.7}.ban-copy{color:#aab3bb;font-size:8px;line-height:2;margin:0 auto 22px;max-width:520px}
    .ban-reason,.ban-countdown{border:2px solid #3b4650;background:#070b0f;margin:14px 0;padding:16px}.ban-reason span,.ban-countdown span{display:block;color:#68737e;font-size:6px;margin-bottom:10px}.ban-reason strong{display:block;color:#fff;font-size:8px;line-height:1.8}.ban-countdown strong{display:block;color:#ffd43b;font-size:15px;letter-spacing:1px}
    .ban-foot{margin-top:24px;color:#4d5861;font-size:6px}
  `;document.head.appendChild(style);
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