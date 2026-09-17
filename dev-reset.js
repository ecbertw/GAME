// EIXO no longer resets accounts when frontend code changes.
(function () {
  try { localStorage.setItem('eixo_state_version', '2026-09-17-persistent'); } catch (_) {}
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
