(function(){
  'use strict';
  const forbidden=/[▶◀→←➜➤►▸✕✓◆+∞]/g;
  function clean(root){
    if(!root)return;
    root.querySelectorAll('button').forEach(btn=>{
      if(btn.closest('.topbar') && (btn.classList.contains('player-button') || btn.classList.contains('country-button'))) return;
      const walker=document.createTreeWalker(btn,NodeFilter.SHOW_TEXT);
      const nodes=[];
      while(walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(n=>{n.nodeValue=n.nodeValue.replace(forbidden,'').replace(/ {2,}/g,' ').trim()});
    });
  }
  function start(){
    clean(document);
    new MutationObserver(m=>m.forEach(x=>x.addedNodes.forEach(n=>{
      if(n.nodeType===1) clean(n);
    }))).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();