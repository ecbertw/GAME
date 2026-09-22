/* lightweight authenticated presence heartbeat */
(function(){
  'use strict';
  async function ping(){
    let p=null;try{p=JSON.parse(localStorage.getItem('eixo_player')||'null')}catch(_){}
    if(!p?.id||document.hidden)return;
    try{await fetch('/api/presence/ping',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,token:p.token}),keepalive:true})}catch(_){}
  }
  window.addEventListener('eixo-player-updated',ping);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)ping()});
  ping();setInterval(ping,30000);
})();