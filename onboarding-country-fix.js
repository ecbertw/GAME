/* EIXO onboarding country selector: alphabetical list, Portugal selected by default. */
(function(){
 function apply(){
  const select=document.getElementById('countrySelect');
  if(!select)return;
  const options=[...select.options];
  options.sort((a,b)=>a.textContent.replace(/^[^\p{L}]*/u,'').localeCompare(b.textContent.replace(/^[^\p{L}]*/u,''),'pt'));
  options.forEach(o=>select.appendChild(o));
  const hasPlayer=!!localStorage.getItem('eixo_player');
  if(!hasPlayer && document.getElementById('onboardingModal')?.classList.contains('hidden')===false){
   select.value='PT';
  }
 }
 apply();
 const obs=new MutationObserver(()=>apply());
 const target=document.getElementById('countrySelect');
 if(target)obs.observe(target,{childList:true});
})();
