/* EIXO rainbow runtime: color animation that does not override per-letter movement effects. */
(function(){
 'use strict';
 const COLORS=['#ff3b30','#ffcc00','#34c759','#00e5ff','#0a84ff','#bf5af2','#ff2d55','#ff3b30'];
 const running=new WeakMap();

 function rainbowLetters(){
   const found=new Set();
   document.querySelectorAll('.rank-player-name.name-rainbow,.chat-name.name-rainbow,.name-preview.name-rainbow').forEach(parent=>{
     parent.querySelectorAll(':scope > .name-letter').forEach(el=>found.add(el));
   });
   document.querySelectorAll('.name-letter.name-rainbow').forEach(el=>found.add(el));
   return [...found];
 }

 function animateLetter(el,index){
   if(running.has(el))return;
   el.style.setProperty('background','none','important');
   el.style.setProperty('background-image','none','important');
   el.style.setProperty('-webkit-background-clip','initial','important');
   el.style.setProperty('background-clip','initial','important');
   el.style.setProperty('-webkit-text-fill-color','currentColor','important');
   const frames=COLORS.map(color=>({color}));
   const animation=el.animate(frames,{duration:1900,iterations:Infinity,easing:'linear',delay:-(index%8)*150});
   running.set(el,animation);
 }

 function refresh(){
   rainbowLetters().forEach((el,i)=>animateLetter(el,i));
 }

 let queued=false;
 const observer=new MutationObserver(()=>{
   if(queued)return;queued=true;
   requestAnimationFrame(()=>{queued=false;refresh()});
 });
 observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
 window.addEventListener('eixo-player-updated',refresh);
 refresh();
})();
