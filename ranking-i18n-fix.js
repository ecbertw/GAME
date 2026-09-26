/* EIXO: translate ranking empty/loading states after dynamic renders. */
(function(){
 function apply(){
  if(!window.eixoT)return;
  for(const [selector,key,fallback] of [['.empty-row','emptyRanking','NO PLAYERS YET'],['.empty-full','emptyFull','THERE ARE NO PLAYERS YET'],['.loading-row','loading','LOADING...']]){
   const text=window.eixoT(key,fallback);
   document.querySelectorAll(selector).forEach(el=>{if(el.textContent!==text)el.textContent=text});
  }
 }
 apply();new MutationObserver(apply).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['lang']});
})();
