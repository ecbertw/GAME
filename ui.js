(() => {
  const playerButton=document.getElementById('playerButton'),playerMenu=document.getElementById('playerMenu'),playerName=document.getElementById('playerName'),vipTopButton=document.getElementById('vipTopButton'),vipTopMenu=document.getElementById('vipTopMenu'),countryButton=document.getElementById('countryButton'),countryMenu=document.getElementById('countryMenu');
  if(!playerButton||!playerMenu||!playerName)return;
  const labels={
    pt:{settings:'DEFINIÇÕES',customize:'PERSONALIZAR NOME',bugs:'REPORTAR BUGS',suggestions:'SUGESTÕES',contact:'CONTACTOS',logout:'SAIR DA CONTA',vipSoon:'VIP — EM BREVE',vipCustomize:'PERSONALIZAR NOME VIP',signIn:'ENTRAR'},
    en:{settings:'SETTINGS',customize:'CUSTOMIZE NAME',bugs:'REPORT BUGS',suggestions:'SUGGESTIONS',contact:'CONTACT',logout:'LOG OUT',vipSoon:'VIP — COMING SOON',vipCustomize:'CUSTOMIZE VIP NAME',signIn:'SIGN IN'},
    es:{settings:'AJUSTES',customize:'PERSONALIZAR NOMBRE',bugs:'REPORTAR BUGS',suggestions:'SUGERENCIAS',contact:'CONTACTO',logout:'CERRAR SESIÓN',vipSoon:'VIP — PRÓXIMAMENTE',vipCustomize:'PERSONALIZAR NOMBRE VIP',signIn:'ENTRAR'},
    fr:{settings:'PARAMÈTRES',customize:'PERSONNALISER LE NOM',bugs:'SIGNALER UN BUG',suggestions:'SUGGESTIONS',contact:'CONTACT',logout:'DÉCONNEXION',vipSoon:'VIP — BIENTÔT',vipCustomize:'PERSONNALISER LE NOM VIP',signIn:'CONNEXION'},
    de:{settings:'EINSTELLUNGEN',customize:'NAMEN ANPASSEN',bugs:'BUG MELDEN',suggestions:'VORSCHLÄGE',contact:'KONTAKT',logout:'ABMELDEN',vipSoon:'VIP — BALD VERFÜGBAR',vipCustomize:'VIP-NAMEN ANPASSEN',signIn:'ANMELDEN'},
    it:{settings:'IMPOSTAZIONI',customize:'PERSONALIZZA NOME',bugs:'SEGNALA BUG',suggestions:'SUGGERIMENTI',contact:'CONTATTI',logout:'ESCI',vipSoon:'VIP — IN ARRIVO',vipCustomize:'PERSONALIZZA NOME VIP',signIn:'ACCEDI'},
    ja:{settings:'設定',customize:'名前を変更',bugs:'バグを報告',suggestions:'提案',contact:'お問い合わせ',logout:'ログアウト',vipSoon:'VIP — 近日公開',vipCustomize:'VIP名をカスタマイズ',signIn:'ログイン'},
    ko:{settings:'설정',customize:'이름 변경',bugs:'버그 신고',suggestions:'제안',contact:'문의하기',logout:'로그아웃',vipSoon:'VIP — 출시 예정',vipCustomize:'VIP 이름 변경',signIn:'로그인'},
    zh:{settings:'设置',customize:'自定义名称',bugs:'报告错误',suggestions:'建议',contact:'联系',logout:'退出登录',vipSoon:'VIP — 即将推出',vipCustomize:'自定义 VIP 名称',signIn:'登录'},
    ru:{settings:'НАСТРОЙКИ',customize:'ИЗМЕНИТЬ ИМЯ',bugs:'СООБЩИТЬ ОБ ОШИБКЕ',suggestions:'ПРЕДЛОЖЕНИЯ',contact:'КОНТАКТ',logout:'ВЫЙТИ',vipSoon:'VIP — СКОРО',vipCustomize:'НАСТРОИТЬ VIP-ИМЯ',signIn:'ВОЙТИ'},
    pl:{settings:'USTAWIENIA',customize:'ZMIENIĆ NAZWĘ',bugs:'ZGŁOŚ BŁĄD',suggestions:'SUGESTIE',contact:'KONTAKT',logout:'WYLOGUJ',vipSoon:'VIP — WKRÓTCE',vipCustomize:'DOSTOSUJ NAZWĘ VIP',signIn:'ZALOGUJ'},
    nl:{settings:'INSTELLINGEN',customize:'NAAM AANPASSEN',bugs:'BUG MELDEN',suggestions:'SUGGESTIES',contact:'CONTACT',logout:'UITLOGGEN',vipSoon:'VIP — BINNENKORT',vipCustomize:'VIP-NAAM AANPASSEN',signIn:'INLOGGEN'},
    tr:{settings:'AYARLAR',customize:'ADI ÖZELLEŞTİR',bugs:'HATA BİLDİR',suggestions:'ÖNERİLER',contact:'İLETİŞİM',logout:'ÇIKIŞ YAP',vipSoon:'VIP — YAKINDA',vipCustomize:'VIP ADINI ÖZELLEŞTİR',signIn:'GİRİŞ YAP'},
    ar:{settings:'الإعدادات',customize:'تخصيص الاسم',bugs:'الإبلاغ عن خطأ',suggestions:'اقتراحات',contact:'تواصل',logout:'تسجيل الخروج',vipSoon:'VIP — قريباً',vipCustomize:'تخصيص اسم VIP',signIn:'تسجيل الدخول'},
    sv:{settings:'INSTÄLLNINGAR',customize:'ANPASSA NAMN',bugs:'RAPPORTERA BUGG',suggestions:'FÖRSLAG',contact:'KONTAKT',logout:'LOGGA UT',vipSoon:'VIP — KOMMER SNART',vipCustomize:'ANPASSA VIP-NAMN',signIn:'LOGGA IN'},
    no:{settings:'INNSTILLINGER',customize:'TILPASS NAVN',bugs:'RAPPORTER FEIL',suggestions:'FORSLAG',contact:'KONTAKT',logout:'LOGG UT',vipSoon:'VIP — KOMMER SNART',vipCustomize:'TILPASS VIP-NAVN',signIn:'LOGG INN'},
    da:{settings:'INDSTILLINGER',customize:'TILPAS NAVN',bugs:'RAPPORTER FEJL',suggestions:'FORSLAG',contact:'KONTAKT',logout:'LOG UD',vipSoon:'VIP — KOMMER SNART',vipCustomize:'TILPAS VIP-NAVN',signIn:'LOG IND'},
    fi:{settings:'ASETUKSET',customize:'MUOKKAA NIMEÄ',bugs:'ILMOITA VIRHEESTÄ',suggestions:'EHDOTUKSET',contact:'YHTEYSTIEDOT',logout:'KIRJAUDU ULOS',vipSoon:'VIP — TULOSSA',vipCustomize:'MUOKKAA VIP-NIMEÄ',signIn:'KIRJAUDU'},
    el:{settings:'ΡΥΘΜΙΣΕΙΣ',customize:'ΠΡΟΣΑΡΜΟΓΗ ΟΝΟΜΑΤΟΣ',bugs:'ΑΝΑΦΟΡΑ ΣΦΑΛΜΑΤΟΣ',suggestions:'ΠΡΟΤΑΣΕΙΣ',contact:'ΕΠΙΚΟΙΝΩΝΙΑ',logout:'ΑΠΟΣΥΝΔΕΣΗ',vipSoon:'VIP — ΣΥΝΤΟΜΑ',vipCustomize:'ΠΡΟΣΑΡΜΟΓΗ VIP ΟΝΟΜΑΤΟΣ',signIn:'ΣΥΝΔΕΣΗ'},
    cs:{settings:'NASTAVENÍ',customize:'PŘIZPŮSOBIT JMÉNO',bugs:'NAHLÁSIT CHYBU',suggestions:'NÁVRHY',contact:'KONTAKT',logout:'ODHLÁSIT',vipSoon:'VIP — JIŽ BRZY',vipCustomize:'PŘIZPŮSOBIT VIP JMÉNO',signIn:'PŘIHLÁSIT'},
    id:{settings:'PENGATURAN',customize:'SESUAIKAN NAMA',bugs:'LAPORKAN BUG',suggestions:'SARAN',contact:'KONTAK',logout:'KELUAR',vipSoon:'VIP — SEGERA',vipCustomize:'SESUAIKAN NAMA VIP',signIn:'MASUK'},
    th:{settings:'การตั้งค่า',customize:'ปรับแต่งชื่อ',bugs:'รายงานบั๊ก',suggestions:'ข้อเสนอแนะ',contact:'ติดต่อ',logout:'ออกจากระบบ',vipSoon:'VIP — เร็ว ๆ นี้',vipCustomize:'ปรับแต่งชื่อ VIP',signIn:'เข้าสู่ระบบ'},
    vi:{settings:'CÀI ĐẶT',customize:'TÙY CHỈNH TÊN',bugs:'BÁO LỖI',suggestions:'GỢI Ý',contact:'LIÊN HỆ',logout:'ĐĂNG XUẤT',vipSoon:'VIP — SẮP RA MẮT',vipCustomize:'TÙY CHỈNH TÊN VIP',signIn:'ĐĂNG NHẬP'},
    he:{settings:'הגדרות',customize:'התאמת שם',bugs:'דיווח על באג',suggestions:'הצעות',contact:'צור קשר',logout:'התנתקות',vipSoon:'VIP — בקרוב',vipCustomize:'התאמת שם VIP',signIn:'התחברות'}
  };
  const lang=()=>String(document.documentElement.lang||'en').split('-')[0];
  const t=()=>window.EixoExtraLocales?.[lang()]?.menu||labels[lang()]||labels.en;
  function render(){
    let p=null;try{p=JSON.parse(localStorage.getItem('eixo_player')||'null')}catch(_){}
    const x=t();
    playerName.textContent=p?(p.name+(p.role==='admin'?' [ADMIN]':p.role==='moderator'?' [MOD]':'')):x.signIn;
    playerMenu.innerHTML=(p?'<button type="button" class="player-option account-menu-option" data-action="settings">'+x.settings+'</button>':'')+
      '<button type="button" class="player-option" data-action="customize">'+x.customize+'</button>'+
      '<button type="button" class="player-option" data-action="bugs">'+x.bugs+'</button>'+
      '<button type="button" class="player-option" data-action="suggestions">'+x.suggestions+'</button>'+
      '<button type="button" class="player-option" data-action="contact">'+x.contact+'</button>'+
      (p?'<button type="button" class="player-option account-menu-option" data-action="logout">'+x.logout+'</button>':'');
    if(vipTopMenu){const b=[...vipTopMenu.querySelectorAll('button')];if(b[0])b[0].textContent=x.vipSoon;if(b[1])b[1].textContent=x.vipCustomize;}
  }
  vipTopButton?.addEventListener('click',e=>{e.stopPropagation();const open=vipTopMenu?.classList.toggle('open');vipTopButton.setAttribute('aria-expanded',String(!!open));});
  vipTopMenu?.addEventListener('click',e=>{const b=e.target.closest('[data-vip-action]');if(!b)return;vipTopMenu.classList.remove('open');vipTopButton?.setAttribute('aria-expanded','false');if(b.dataset.vipAction==='buy'){window.eixoOpenVip?.();}else if(b.dataset.vipAction==='customize'){const p=(()=>{try{return JSON.parse(localStorage.getItem('eixo_player')||'null')}catch(_){return null}})();if(Number(p?.vipLevel||0)>0)window.eixoOpenVipCustomize?.();else window.eixoOpenVip?.();}});

  playerButton.addEventListener('click',e=>{e.stopPropagation();render();const open=playerMenu.classList.toggle('open');playerButton.setAttribute('aria-expanded',String(open));});
  playerButton.closest('.player-area')?.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter')e.stopPropagation()});
  function openMenuAction(action){
  if(action==='settings'){window.EixoAccountUI?.openSettings();return}
  if(action==='logout'){window.eixoLogout?.();return}
  if(action==='customize'){if(typeof window.eixoOpenPlayerCustomize==='function'){window.eixoOpenPlayerCustomize();}return}
  if(action==='vip'){const open=playerMenu.classList.toggle('vip-open');const b=playerMenu.querySelector('.vip-menu-toggle');b?.setAttribute('aria-expanded',String(open));return}
  if(action==='vip-buy'){if(window.eixoOpenVip)window.eixoOpenVip();return}
  if(action==='vip-customize'){
    let p=null;try{p=JSON.parse(localStorage.getItem('eixo_player')||'null')}catch(_){}
    if(Number(p?.vipLevel||0)>0&&window.eixoOpenVipCustomize){window.eixoOpenVipCustomize();}else if(window.eixoOpenVip){window.eixoOpenVip();}
    return
  }
  if(action==='contact'){document.getElementById('contactModal')?.classList.remove('hidden');return}
  if(action==='bugs'){document.getElementById('bugModal')?.classList.remove('hidden');return}
  if(action==='suggestions'){document.getElementById('suggestionModal')?.classList.remove('hidden');return}
  window.dispatchEvent(new CustomEvent('eixo-player-menu',{detail:{action}}));
}
  playerMenu.addEventListener('click',e=>{const b=e.target.closest('.player-option');if(!b)return;const action=b.dataset.action;if(action==='vip'){openMenuAction(action);return;}playerMenu.classList.remove('open','vip-open');playerButton.setAttribute('aria-expanded','false');openMenuAction(action);});
  const rankingTabs=document.querySelector('.ranking-tabs'),worldTab=document.getElementById('modalWorldTab'),countryTab=document.getElementById('modalCountryTab');if(rankingTabs&&worldTab&&countryTab)rankingTabs.append(worldTab,countryTab);
  document.addEventListener('click',e=>{if(!e.target.closest('.player-area')){playerMenu.classList.remove('open','vip-open');playerMenu.querySelector('.vip-menu-toggle')?.setAttribute('aria-expanded','false');playerButton.setAttribute('aria-expanded','false')}if(!e.target.closest('.vip-top-area')){vipTopMenu?.classList.remove('open');vipTopButton?.setAttribute('aria-expanded','false')}if(!e.target.closest('.profile-area')){countryMenu?.classList.remove('open');countryButton?.setAttribute('aria-expanded','false')}});
  document.querySelectorAll('.modal-close[data-close-modal]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.closeModal)?.classList.add('hidden')));
  document.querySelectorAll('.modal-backdrop').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.add('hidden')}));
  render();window.addEventListener('eixo-auth-ready',render);window.addEventListener('storage',render);window.addEventListener('eixo-player-updated',render);new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
