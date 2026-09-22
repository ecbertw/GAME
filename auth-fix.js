/* EIXO V2 account UI. Guests always see the authentication flow in English. */
(function(){
  const $=id=>document.getElementById(id);
  const modal=$('authModal'),loginForm=$('authLoginForm'),registerForm=$('authRegisterForm'),resetForm=$('authResetForm');
  const style=document.createElement('style');style.textContent=`
    .auth-tabs{display:flex;gap:8px;margin:16px 0}.auth-tab{flex:1;padding:10px 8px;border:1px solid rgba(255,255,255,.18);background:#111820;color:#9aa6b2;font:700 11px/1 monospace;cursor:pointer}.auth-tab.active{color:#fff;border-color:#00d4ff}.auth-link{display:block;margin:12px auto 0;background:none;border:0;color:#7fdfff;text-decoration:underline;font:700 10px/1 monospace;cursor:pointer}.auth-modal .form-error{min-height:18px;margin:8px 0;color:#ff6b6b;font:700 10px/1.3 monospace}
    .auth-country-picker{position:relative;width:100%;margin-top:0}.auth-country-native{position:absolute!important;width:1px!important;height:1px!important;opacity:0!important;pointer-events:none!important;overflow:hidden!important}.auth-country-button{width:100%;height:52px;border:2px solid #626e79;background:#070c11;color:#fff;padding:0 12px;outline:none;display:flex;align-items:center;gap:10px;cursor:pointer;text-align:left}.auth-country-button:hover,.auth-country-button:focus{border-color:#35dc75;box-shadow:4px 4px 0 #071e13}.auth-country-button .auth-country-name{flex:1;font-size:9px}.auth-country-chevron{font-size:8px;color:#aeb7c0}.auth-country-flag{width:24px;height:18px;object-fit:cover;image-rendering:auto;flex:0 0 auto}.auth-country-menu{display:none;position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:11000;max-height:260px;overflow:auto;background:#070c11;border:2px solid #626e79;box-shadow:5px 5px 0 #020407;padding:5px}.auth-country-menu.open{display:block}.auth-country-option{width:100%;min-height:38px;border:0;background:transparent;color:#fff;display:flex;align-items:center;gap:10px;padding:8px;text-align:left;cursor:pointer;font-size:7px}.auth-country-option:hover,.auth-country-option[aria-selected="true"]{background:#18232d}.auth-country-option .auth-country-name{flex:1}.auth-country-emoji{display:none;width:24px;flex:0 0 24px;text-align:center;font-size:16px;line-height:18px}.auth-country-flag.is-missing{display:none}.auth-country-flag.is-missing+.auth-country-emoji{display:inline-block}
  `;document.head.appendChild(style);
  if(!modal)return;

  const englishErrors={
    'Email inválido.':'Invalid email address.',
    'A palavra-passe deve ter pelo menos 8 caracteres.':'The password must contain at least 8 characters.',
    'Nome inválido. Usa 3–8 letras ou números, sem espaços ou símbolos.':'Invalid player name. Use 3–8 letters or numbers, with no spaces or symbols.',
    'País inválido.':'Invalid country.',
    'Já existe uma conta com esse email.':'An account already exists with that email address.',
    'Esse nome já está a ser utilizado.':'That player name is already in use.',
    'Credenciais inválidas.':'Invalid email or password.',
    'Demasiadas tentativas. Tenta novamente mais tarde.':'Too many attempts. Please try again later.',
    'Demasiados pedidos. Tenta novamente mais tarde.':'Too many requests. Please try again later.'
  };
  const errorText=v=>englishErrors[String(v||'')]||String(v||'Unable to complete the request.');
  const setPlayer=p=>{
    const clean=p?{...p,token:'session'}:null;
    if(clean){localStorage.setItem('eixo_player',JSON.stringify(clean));localStorage.setItem('eixo_country',clean.country);}
    else localStorage.removeItem('eixo_player');
    window.eixoSetPlayer?.(clean);
    if(clean?.country)window.changeCountry?.(String(clean.country).toUpperCase());
    const name=$('playerName');if(name)name.textContent=clean?.visualName||clean?.name||'SIGN IN';
    window.dispatchEvent(new Event('eixo-player-updated'));
  };
  const open=mode=>{modal.classList.remove('hidden');showMode(mode||'login');};
  const close=()=>modal.classList.add('hidden');
  function showMode(mode){
    const login=mode==='login',reset=mode==='reset';
    document.documentElement.lang=window.eixoGetPlayer?.()?document.documentElement.lang:'en';
    $('authTitle').textContent=login?'SIGN IN TO EIXO':reset?'RESET PASSWORD':'CREATE ACCOUNT';
    $('authIntro').textContent=login?'Sign in to your account to start playing.':reset?'Enter your email address. If an account exists, recovery instructions will be sent.':'Create your EIXO account to start playing.';
    $('authLoginTab').textContent='SIGN IN';$('authRegisterTab').textContent='CREATE ACCOUNT';
    $('authLoginEmail').placeholder='EMAIL';$('authLoginPassword').placeholder='PASSWORD';
    $('authRegisterName').placeholder='PLAYER NAME';$('authRegisterEmail').placeholder='EMAIL';$('authRegisterPassword').placeholder='PASSWORD (MIN. 8 CHARACTERS)';
    $('authResetEmail').placeholder='EMAIL';$('authForgotButton').textContent='FORGOT PASSWORD';$('authBackLogin').textContent='BACK TO SIGN IN';
    loginForm.querySelector('button[type="submit"]').textContent='SIGN IN ▶';registerForm.querySelector('button[type="submit"]').textContent='CREATE ACCOUNT ▶';resetForm.querySelector('button[type="submit"]').textContent='SEND INSTRUCTIONS ▶';
    $('authClose').textContent='CLOSE';
    loginForm.classList.toggle('hidden',!login);registerForm.classList.toggle('hidden',login||reset);resetForm.classList.toggle('hidden',!reset);
    $('authLoginTab').classList.toggle('active',login);$('authRegisterTab').classList.toggle('active',!login&&!reset);
  }

  let countryPickerReady=false;
  function countryName(code){try{return new Intl.DisplayNames(['en'],{type:'region'}).of(code)||code}catch(_){return window.eixoCountryNames?.[code]||code}}
  function flagUrl(code){return 'https://flagcdn.com/24x18/'+String(code).toLowerCase()+'.png'}
  function flagEmoji(code){return [...String(code||'')].map(c=>String.fromCodePoint(127397+c.charCodeAt())).join('')}
  function flagMarkup(code){const safe=String(code||'').toUpperCase();return '<img class="auth-country-flag" src="'+flagUrl(safe)+'" alt="" aria-hidden="true" onerror="this.classList.add(\'is-missing\')"><span class="auth-country-emoji" aria-hidden="true">'+flagEmoji(safe)+'</span>'}
  function populateCountries(){
    const select=$('authRegisterCountry');if(!select)return;
    const codes=[...(window.eixoCountryCodes||['PT'])].sort((a,b)=>{if(a==='PT')return-1;if(b==='PT')return 1;return countryName(a).localeCompare(countryName(b),'en')});
    select.innerHTML=codes.map(c=>'<option value="'+c+'">'+countryName(c)+'</option>').join('');
    const saved=String(localStorage.getItem('eixo_country')||'PT').toUpperCase();select.value=codes.includes(saved)?saved:'PT';
    if(countryPickerReady){updateCountryPicker();return;}
    countryPickerReady=true;select.classList.add('auth-country-native');
    const wrap=document.createElement('div');wrap.className='auth-country-picker';select.parentNode.insertBefore(wrap,select);wrap.appendChild(select);
    const button=document.createElement('button');button.type='button';button.id='authCountryButton';button.className='auth-country-button';button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
    const menu=document.createElement('div');menu.id='authCountryMenu';menu.className='auth-country-menu';menu.setAttribute('role','listbox');
    wrap.append(button,menu);
    button.addEventListener('click',e=>{e.stopPropagation();const isOpen=menu.classList.toggle('open');button.setAttribute('aria-expanded',String(isOpen));});
    menu.addEventListener('click',e=>{const option=e.target.closest('[data-country]');if(!option)return;select.value=option.dataset.country;updateCountryPicker();menu.classList.remove('open');button.setAttribute('aria-expanded','false');});
    document.addEventListener('click',e=>{if(!e.target.closest('.auth-country-picker')){menu.classList.remove('open');button.setAttribute('aria-expanded','false');}});
    updateCountryPicker();
  }
  function updateCountryPicker(){
    const select=$('authRegisterCountry'),button=$('authCountryButton'),menu=$('authCountryMenu');if(!select||!button||!menu)return;
    const code=select.value||'PT',codes=[...select.options].map(o=>o.value);
    button.innerHTML=flagMarkup(code)+'<span class="auth-country-name">'+countryName(code).toUpperCase()+'</span><span class="auth-country-chevron">▼</span>';
    menu.innerHTML=codes.map(c=>'<button type="button" class="auth-country-option" role="option" aria-selected="'+String(c===code)+'" data-country="'+c+'">'+flagMarkup(c)+'<span class="auth-country-name">'+countryName(c).toUpperCase()+'</span></button>').join('');
  }
  async function api(path,options){const r=await fetch(path,{credentials:'same-origin',...options});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(errorText(d.error));return d;}
  $('authLoginTab').addEventListener('click',()=>showMode('login'));
  $('authRegisterTab').addEventListener('click',()=>{populateCountries();showMode('register');});
  $('authForgotButton').addEventListener('click',()=>showMode('reset'));
  $('authBackLogin').addEventListener('click',()=>showMode('login'));
  $('authClose').addEventListener('click',()=>{if(window.eixoGetPlayer?.())close();});
  modal.addEventListener('click',e=>{if(e.target===modal&&window.eixoGetPlayer?.())close();});
  loginForm.addEventListener('submit',async e=>{
    e.preventDefault();const err=$('authLoginError'),button=loginForm.querySelector('button[type="submit"]');err.textContent='';button.disabled=true;
    try{const d=await api('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:$('authLoginEmail').value,password:$('authLoginPassword').value})});setPlayer(d.player);close();window.applyLanguage?.();window.loadTopRankings?.();}
    catch(x){err.textContent=errorText(x.message);}finally{button.disabled=false;}
  });
  registerForm.addEventListener('submit',async e=>{
    e.preventDefault();const err=$('authRegisterError'),button=registerForm.querySelector('button[type="submit"]');err.textContent='';button.disabled=true;
    try{const d=await api('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:$('authRegisterName').value,email:$('authRegisterEmail').value,password:$('authRegisterPassword').value,country:$('authRegisterCountry').value})});setPlayer(d.player);close();window.applyLanguage?.();window.loadTopRankings?.();}
    catch(x){err.textContent=errorText(x.message);}finally{button.disabled=false;}
  });
  resetForm.addEventListener('submit',async e=>{
    e.preventDefault();const err=$('authResetError'),button=resetForm.querySelector('button[type="submit"]');err.textContent='';button.disabled=true;
    try{await api('/api/auth/password-reset/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:$('authResetEmail').value})});err.textContent='If the email exists, recovery instructions will be sent.';}
    catch(x){err.textContent=errorText(x.message);}finally{button.disabled=false;}
  });
  const playerButton=$('playerButton');
  playerButton?.addEventListener('click',e=>{const p=window.eixoGetPlayer?.();if(!p){e.stopImmediatePropagation();open('login');}},true);
  window.eixoOpenAuth=open;
  window.eixoLogout=async()=>{try{await api('/api/auth/logout',{method:'POST'});}catch(_){}setPlayer(null);localStorage.removeItem('eixo_country');location.reload();};
  populateCountries();
  const p=window.eixoGetPlayer?.();if(p){$('playerName').textContent=p.visualName||p.name;modal.classList.add('hidden');}else{$('playerName').textContent='SIGN IN';showMode('login');}
  window.dispatchEvent(new Event('eixo-auth-ready'));
})();
