// EIXO no longer resets accounts when frontend code changes.
(function () {
  try { const VERSION='2026-09-18-vip-reset';
    const previous=localStorage.getItem('eixo_state_version');
    if(previous!==VERSION){ localStorage.removeItem('eixo_player'); localStorage.removeItem('eixo_country'); }
    localStorage.setItem('eixo_state_version', VERSION); } catch (_) {}
  // The very first onboarding screen is English until a country is selected.
  const setInitialEnglish = () => {
    const set=(id,text)=>{const el=document.getElementById(id);if(el)el.textContent=text;};
    set('onboardingTitle','WELCOME TO EIXO');
    set('onboardingText','First choose the country where you play.');
    const label=document.querySelector('label[for="countrySelect"]');if(label)label.textContent='COUNTRY';
    set('countryContinue','CONTINUE ▶');
  };
  setInitialEnglish();
})();
