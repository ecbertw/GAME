/* EIXO: before registration, the country picker is always presented in English. */
(function(){
 function apply(){let p=null;try{p=JSON.parse(localStorage.getItem('eixo_player')||'null')}catch(_){};if(p)return;const selected=localStorage.getItem('eixo_country');if(selected)return;document.documentElement.lang='en';document.documentElement.dir='ltr';const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};set('onboardingTitle','WELCOME TO EIXO');set('onboardingText','First choose your country.');const l=document.querySelector('label[for="countrySelect"]');if(l)l.textContent='COUNTRY';set('countryContinue','CONTINUE ▶');}
 apply();
})();
