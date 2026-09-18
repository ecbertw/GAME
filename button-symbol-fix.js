(function(){
  'use strict';
  const forbidden=/[▶◀→←➜➤►▸▼✕✓◆+∞]/g;
  function cleanButton(btn){
    if(!btn || btn.tagName!=='BUTTON') return;
    if(btn.closest('.topbar') && (btn.classList.contains('player-button') || btn.classList.contains('country-button'))) return;
    const walker=document.createTreeWalker(btn,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n=>{
      const cleaned=n.nodeValue.replace(forbidden,'').replace(/ {2,}/g,' ').trim();
      if(cleaned!==n.nodeValue) n.nodeValue=cleaned;
    });
  }
  function clean(root=document){
    if(root.nodeType===1 && root.tagName==='BUTTON') cleanButton(root);
    if(root.querySelectorAll) root.querySelectorAll('button').forEach(cleanButton);
  }
  function start(){
    clean(document);
    const observer=new MutationObserver(mutations=>{
      mutations.forEach(m=>{
        if(m.target && m.target.closest) cleanButton(m.target.closest('button'));
        m.addedNodes.forEach(n=>{
          if(n.nodeType===1) clean(n);
          if(n.parentElement) cleanButton(n.parentElement.closest('button'));
        });
      });
    });
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
    setInterval(()=>clean(document),1000);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();