/* EIXO administrator dashboard */
(function(){
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const get=()=>{try{return JSON.parse(localStorage.getItem('eixo_player')||'null')}catch(_){return null}};
  let root=null,refreshTimer=0;
  const style=document.createElement('style');style.textContent=`
    .admin-overlay{position:fixed;inset:0;z-index:12000;background:#000c;display:flex;align-items:center;justify-content:center;padding:18px}
    .admin-card{width:min(920px,97vw);max-height:92vh;overflow:auto;background:#091017;border:2px solid #596671;box-shadow:9px 9px 0 #020407;padding:18px;color:#fff}
    .admin-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}.admin-head h2{margin:0;font-size:17px}.admin-close{border:0;background:transparent;color:#fff;cursor:pointer;font:9px 'Press Start 2P',monospace}
    .admin-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.admin-metric{border:1px solid #394651;background:#070c11;padding:14px;min-height:88px}.admin-metric span{display:block;color:#8a96a0;font-size:7px;line-height:1.55}.admin-metric strong{display:block;margin-top:12px;font-size:20px;color:#f3f5f6}
    .admin-security{border:1px solid #394651;background:#070c11;padding:13px;margin-bottom:14px;font-size:8px;line-height:1.9}.admin-security.ok{border-color:#18c66b}.admin-security.warn{border-color:#f1c438}.admin-security.danger{border-color:#e83e45}.admin-security input{width:100%;box-sizing:border-box;margin:7px 0;background:#05090d;border:1px solid #46535f;color:#fff;padding:10px;font:8px 'Press Start 2P',monospace}.admin-secret{display:block;overflow-wrap:anywhere;color:#00e5ff;margin:8px 0}.admin-section{margin-top:20px;border-top:2px solid #27323b;padding-top:16px}.admin-section h3{font-size:11px;margin:0 0 12px}.admin-toolbar{display:flex;gap:8px;flex-wrap:wrap}.admin-toolbar input{flex:1;min-width:220px;background:#070c11;border:1px solid #46535f;color:#fff;padding:11px;font:8px 'Press Start 2P',monospace}.admin-btn{border:1px solid #596671;background:#14202a;color:#fff;padding:10px 11px;cursor:pointer;font:8px 'Press Start 2P',monospace}.admin-btn:hover{filter:brightness(1.12)}.admin-btn.danger{border-color:#e83e45;color:#ff7676}
    .admin-ban-list{margin-top:10px}.admin-ban{display:grid;grid-template-columns:1.2fr .6fr .8fr 1.4fr auto;gap:8px;align-items:center;border-top:1px solid #25313a;padding:11px 2px;font-size:8px;line-height:1.7}.admin-ban small{color:#78848f;font-size:7px}.admin-empty{padding:18px 0;color:#78848f;font-size:8px}.admin-subgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.admin-mini-list{border:1px solid #2f3942;background:#070c11;padding:12px;min-height:96px;font-size:8px;line-height:1.9}
    @media(max-width:760px){.admin-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.admin-subgrid{grid-template-columns:1fr}.admin-ban{grid-template-columns:1fr}.admin-ban .admin-btn{justify-self:start}}
  `;document.head.appendChild(style);

  function close(){clearInterval(refreshTimer);refreshTimer=0;root?.remove();root=null}
  async function getJson(url){const r=await fetch(url,{cache:'no-store',credentials:'same-origin'}),d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Unable to load.');return d}
  async function post(url,data){const r=await fetch(url,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(data||{})}),d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Unable to complete action.');return d}
  const dur=s=>{s=Number(s)||0;const d=Math.floor(s/86400),h=Math.floor((s%86400)/3600),m=Math.floor((s%3600)/60);return (d?d+'d ':'')+h+'h '+m+'m'};

  async function unlockDashboard(){await Promise.all([loadMetrics(),loadBans()]);if(!refreshTimer)refreshTimer=setInterval(loadMetrics,30000)}
  async function loadSecurity(){
    if(!root)return false;const p=get(),box=root.querySelector('#adminSecurity');
    try{
      const s=await getJson('/api/admin/mfa/status?id='+encodeURIComponent(p.id));
      if(!s.configured){
        box.className='admin-security warn';box.innerHTML='<b>ADMIN MFA NOT CONFIGURED</b><br>The server encryption key still needs to be configured. Admin actions currently use password + fresh session protection.';
        return true;
      }
      if(s.enabled&&s.verified){
        box.className='admin-security ok';box.innerHTML='<b>ADMIN MFA VERIFIED</b><br>This administrative session is protected with TOTP.';
        return true;
      }
      if(s.enabled&&!s.verified){
        box.className='admin-security danger';box.innerHTML='<b>ADMIN MFA REQUIRED</b><br>Enter the 6-digit code from your authenticator app.<input id="adminMfaCode" inputmode="numeric" maxlength="6" placeholder="000000"><button class="admin-btn" id="adminMfaVerify">VERIFY MFA</button><div id="adminMfaMsg"></div>';
        box.querySelector('#adminMfaVerify').onclick=async()=>{const msg=box.querySelector('#adminMfaMsg');try{await post('/api/admin/mfa/verify',{id:p.id,token:p.token,code:box.querySelector('#adminMfaCode').value});msg.textContent='VERIFIED';await loadSecurity();await unlockDashboard()}catch(e){msg.textContent=e.message}};
        return false;
      }
      box.className='admin-security danger';box.innerHTML='<b>ADMIN MFA SETUP REQUIRED</b><br>Confirm your current EIXO password to generate a TOTP secret.<input id="adminMfaPassword" type="password" autocomplete="current-password" placeholder="CURRENT PASSWORD"><button class="admin-btn" id="adminMfaSetup">GENERATE MFA SECRET</button><div id="adminMfaSetupBody"></div>';
      box.querySelector('#adminMfaSetup').onclick=async()=>{const body=box.querySelector('#adminMfaSetupBody');try{const d=await post('/api/admin/mfa/setup',{id:p.id,token:p.token,password:box.querySelector('#adminMfaPassword').value});body.innerHTML='<span class="admin-secret">'+esc(d.secret)+'</span><div>Add this secret manually to Google Authenticator, Microsoft Authenticator, 1Password, Bitwarden or another TOTP app. Then enter the generated code:</div><input id="adminMfaEnableCode" inputmode="numeric" maxlength="6" placeholder="000000"><button class="admin-btn" id="adminMfaEnable">ENABLE MFA</button><div id="adminMfaEnableMsg"></div>';body.querySelector('#adminMfaEnable').onclick=async()=>{const msg=body.querySelector('#adminMfaEnableMsg');try{await post('/api/admin/mfa/enable',{id:p.id,token:p.token,code:body.querySelector('#adminMfaEnableCode').value});msg.textContent='MFA ENABLED';await loadSecurity();await unlockDashboard()}catch(e){msg.textContent=e.message}}}catch(e){body.textContent=e.message}};
      return false;
    }catch(e){box.className='admin-security danger';box.textContent=e.message;return false}
  }

  async function loadMetrics(){
    if(!root)return;const p=get();if(!p?.id)return close();
    const box=root.querySelector('#adminMetrics');
    try{
      const d=await getJson('/api/admin/metrics?id='+encodeURIComponent(p.id));
      const metrics=[
        ['ONLINE NOW',d.onlineNow],['TOTAL PLAYERS',d.totalPlayers],['ACTIVE 24H',d.active24h],['NEW 24H',d.new24h],
        ['NEW 7 DAYS',d.new7d],['VIP PLAYERS',d.vipPlayers],['GAMES 24H',d.games24h],['GAMES RECORDED',d.gamesRecorded],
        ['TEMP BANS',d.temporaryBans],['PERMANENT BANS',d.permanentBans],['ANTICHEAT 24H',d.antiCheatFlags24h],['PIXELS CLAIMED',d.backgroundClaims],
        ['CHAT MSG 24H',d.messages24h],['ROOMS',d.rooms],['SERVER UPTIME',dur(d.uptimeSeconds)],
        ['LOGIN OK 24H',d.loginSuccess24h],['LOGIN FAIL 24H',d.loginFailure24h],['ADMINS ONLINE',d.adminsOnline],['ANTICHEAT 7D',d.antiCheatFlags7d],
        ['BANS 7D',d.bans7d],['UNBANS 7D',d.unbans7d],['AVG SCORE 24H',d.avgScore24h]
      ];
      box.innerHTML=metrics.map(([k,v])=>'<div class="admin-metric"><span>'+esc(k)+'</span><strong>'+esc(v)+'</strong></div>').join('');
      root.querySelector('#adminCountries').innerHTML=(d.countries||[]).map(x=>esc(x.country)+' · '+Number(x.count)).join('<br>')||'NO DATA';
      root.querySelector('#adminVip').innerHTML=(d.vipBreakdown||[]).map(x=>'VIP '+(Number(x.level)>=6?'∞':Number(x.level))+' · '+Number(x.count)).join('<br>')||'NO VIP PLAYERS';
    }catch(e){box.innerHTML='<div class="admin-empty">'+esc(e.message)+'</div>'}
  }
  async function loadBans(){
    if(!root)return;const p=get(),q=root.querySelector('#adminBanSearch').value.trim(),list=root.querySelector('#adminBanList');list.innerHTML='<div class="admin-empty">LOADING...</div>';
    try{
      const d=await getJson('/api/admin/bans?id='+encodeURIComponent(p.id)+'&q='+encodeURIComponent(q));
      list.innerHTML=(d.bans||[]).length?(d.bans||[]).map(b=>'<div class="admin-ban" data-id="'+esc(b.id)+'"><div><b>'+esc(b.name)+'</b><br><small>'+esc(b.country)+' · '+esc(b.role)+'</small></div><div>'+(b.permanent?'PERMANENT':'TEMP')+'</div><div>'+(!b.permanent&&b.until?esc(new Date(b.until).toLocaleString()):'—')+'</div><div>'+esc(b.reason||'NO REASON')+'</div><button class="admin-btn danger" data-unban>UNBAN</button></div>').join(''):'<div class="admin-empty">NO ACTIVE BANS</div>';
    }catch(e){list.innerHTML='<div class="admin-empty">'+esc(e.message)+'</div>'}
  }
  async function open(){
    const p=get();if(p?.role!=='admin')return;
    close();root=document.createElement('div');root.className='admin-overlay';root.innerHTML='<div class="admin-card"><div class="admin-head"><h2>EIXO ADMIN</h2><button class="admin-close" type="button">CLOSE</button></div><div id="adminSecurity" class="admin-security">CHECKING ADMIN SECURITY...</div><div class="admin-grid" id="adminMetrics"><div class="admin-empty">LOCKED UNTIL SECURITY CHECK...</div></div><div class="admin-section"><h3>OVERVIEW</h3><div class="admin-subgrid"><div class="admin-mini-list"><b>TOP COUNTRIES</b><br><span id="adminCountries">LOADING...</span></div><div class="admin-mini-list"><b>VIP DISTRIBUTION</b><br><span id="adminVip">LOADING...</span></div></div></div><div class="admin-section"><h3>BAN MANAGEMENT</h3><div class="admin-toolbar"><input id="adminBanSearch" maxlength="40" placeholder="SEARCH PLAYER NAME"><button class="admin-btn" id="adminBanSearchBtn">SEARCH</button><button class="admin-btn" id="adminBanRefresh">REFRESH</button></div><div class="admin-ban-list" id="adminBanList"></div></div></div>';
    document.body.appendChild(root);root.querySelector('.admin-close').onclick=close;root.addEventListener('click',e=>{if(e.target===root)close()});
    root.querySelector('#adminBanSearchBtn').onclick=loadBans;root.querySelector('#adminBanRefresh').onclick=loadBans;root.querySelector('#adminBanSearch').addEventListener('keydown',e=>{if(e.key==='Enter')loadBans()});
    root.querySelector('#adminBanList').addEventListener('click',async e=>{const b=e.target.closest('[data-unban]');if(!b)return;const row=b.closest('[data-id]');b.disabled=true;try{await post('/api/admin/unban',{id:p.id,token:p.token,targetId:row.dataset.id});await Promise.all([loadBans(),loadMetrics()])}catch(err){b.disabled=false;alert(err.message)}});
    const ready=await loadSecurity();if(ready)await unlockDashboard();
  }
  window.EixoAdminUI={open,close};
})();