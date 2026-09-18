// EIXO account persistence: registration is tied to this browser's local storage.
// Do not reset eixo_player/eixo_country when frontend code changes.
(function(){
  try{
    const setInitialEnglish=()=>{
      const set=(id,text)=>{const el=document.getElementById(id);if(el)el.textContent=text;};
      set('onboardingTitle','WELCOME TO EIXO');
      set('onboardingText','First choose the country where you play.');
      const label=document.querySelector('label[for="countrySelect"]');if(label)label.textContent='COUNTRY';
      set('countryContinue','CONTINUE');
    };
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setInitialEnglish,{once:true});else setInitialEnglish();
  }catch(_){}
})();
