/* EIXO: translate ranking empty/loading states after dynamic renders. */
(function(){
 function apply(){if(!window.eixoT)return;const t=window.eixoT;document.querySelectorAll('.empty-row').forEach(el=>{if(el.dataset.i18nDone==='1')return;el.textContent=t('emptyRanking','NO PLAYERS YET');el.dataset.i18nDone='1'});document.querySelectorAll('.empty-full').forEach(el=>{el.textContent=t('emptyFull','THERE ARE NO PLAYERS YET')});document.querySelectorAll('.loading-row').forEach(el=>{el.textContent=t('loading','LOADING...')});}
 apply();new MutationObserver(apply).observe(document.body,{childList:true,subtree:true});
})();
