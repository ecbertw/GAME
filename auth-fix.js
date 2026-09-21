/* EIXO V2 account UI: registration/login is no longer part of the game onboarding. */
(function(){
  const $=id=>document.getElementById(id);
  const modal=$('authModal'),loginForm=$('authLoginForm'),registerForm=$('authRegisterForm'),resetForm=$('authResetForm');
  if(!modal)return;
  const setPlayer=p=>{
    const clean=p?{...p,token:'session'}:null;
    if(clean){localStorage.setItem('eixo_player',JSON.stringify(clean));localStorage.setItem('eixo_country',clean.country);}
    else localStorage.removeItem('eixo_player');
    window.eixoSetPlayer?.(clean);
    const name=$('playerName');if(name)name.textContent=clean?.visualName||clean?.name||'ENTRAR';
    window.dispatchEvent(new Event('eixo-player-updated'));
  };
  const open=mode=>{
    modal.classList.remove('hidden');
    showMode(mode||'login');
  };
  const close=()=>modal.classList.add('hidden');
  function showMode(mode){
    const login=mode==='login',reset=mode==='reset';
    $('authTitle').textContent=login?'ENTRAR NO EIXO':reset?'RECUPERAR PALAVRA-PASSE':'CRIAR CONTA';
    $('authIntro').textContent=login?'Entra na tua conta para começar a jogar.':reset?'Indica o teu email. Se existir uma conta, serão enviadas instruções de recuperação.':'Cria a tua conta EIXO para começar a jogar.';
    loginForm.classList.toggle('hidden',!login);registerForm.classList.toggle('hidden',login||reset);resetForm.classList.toggle('hidden',!reset);
    $('authLoginTab').classList.toggle('active',login);$('authRegisterTab').classList.toggle('active',!login&&!reset);
  }
  function populateCountries(){
    const select=$('authRegisterCountry');if(!select||select.options.length)return;
    const codes=window.eixoCountryCodes||['PT'],names=window.eixoCountryNames||{PT:'PORTUGAL'};
    select.innerHTML=codes.map(c=>{const flag=[...c].map(x=>String.fromCodePoint(127397+x.charCodeAt())).join('');return '<option value="'+c+'">'+flag+' '+String(names[c]||c)+'</option>';}).join('');
    select.value=localStorage.getItem('eixo_country')||'PT';
  }
  async function api(path,options){const r=await fetch(path,{credentials:'same-origin',...options});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Não foi possível concluir a operação.');return d;}
  $('authLoginTab').addEventListener('click',()=>showMode('login'));
  $('authRegisterTab').addEventListener('click',()=>{populateCountries();showMode('register');});
  $('authForgotButton').addEventListener('click',()=>showMode('reset'));
  $('authBackLogin').addEventListener('click',()=>showMode('login'));
  $('authClose').addEventListener('click',()=>{if(window.eixoGetPlayer?.())close();});
  modal.addEventListener('click',e=>{if(e.target===modal&&window.eixoGetPlayer?.())close();});
  loginForm.addEventListener('submit',async e=>{
    e.preventDefault();const err=$('authLoginError'),button=loginForm.querySelector('button[type="submit"]');err.textContent='';button.disabled=true;
    try{const d=await api('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:$('authLoginEmail').value,password:$('authLoginPassword').value})});setPlayer(d.player);close();window.applyLanguage?.();window.loadTopRankings?.();}
    catch(x){err.textContent=x.message;}finally{button.disabled=false;}
  });
  registerForm.addEventListener('submit',async e=>{
    e.preventDefault();const err=$('authRegisterError'),button=registerForm.querySelector('button[type="submit"]');err.textContent='';button.disabled=true;
    try{const d=await api('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:$('authRegisterName').value,email:$('authRegisterEmail').value,password:$('authRegisterPassword').value,country:$('authRegisterCountry').value})});setPlayer(d.player);close();window.applyLanguage?.();window.loadTopRankings?.();}
    catch(x){err.textContent=x.message;}finally{button.disabled=false;}
  });
  resetForm.addEventListener('submit',async e=>{
    e.preventDefault();const err=$('authResetError'),button=resetForm.querySelector('button[type="submit"]');err.textContent='';button.disabled=true;
    try{const d=await api('/api/auth/password-reset/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:$('authResetEmail').value})});err.textContent=d.message||'Se o email existir, receberás instruções.';}
    catch(x){err.textContent=x.message;}finally{button.disabled=false;}
  });
  const playerButton=$('playerButton');
  playerButton?.addEventListener('click',e=>{
    const p=window.eixoGetPlayer?.();
    if(!p){e.stopImmediatePropagation();open('login');}
  },true);
  window.eixoOpenAuth=open;
  window.eixoLogout=async()=>{
    try{await api('/api/auth/logout',{method:'POST'});}catch(_){}
    setPlayer(null);localStorage.removeItem('eixo_country');location.reload();
  };
  populateCountries();
  window.dispatchEvent(new Event('eixo-auth-ready'));
  const p=window.eixoGetPlayer?.();if(p){$('playerName').textContent=p.visualName||p.name;modal.classList.add('hidden');}else{$('playerName').textContent='ENTRAR';}
})();
