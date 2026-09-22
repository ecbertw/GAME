/* EIXO rainbow runtime.
   Rainbow uses hue rotation on a visible base color so it can coexist with
   transform/opacity/text-shadow effects such as BOUNCE, WAVE and GLOW. */
(function(){
 'use strict';
 const running=new WeakMap();

 function rainbowLetters(){
   const found=new Set();
   document.querySelectorAll('.rank-player-name.name-rainbow,.chat-name.name-rainbow,.name-preview.name-rainbow').forEach(parent=>{
     parent.querySelectorAll(':scope > .name-letter').forEach(el=>found.add(el));
   });
   document.querySelectorAll('.name-letter.name-rainbow').forEach(el=>found.add(el));
   return [...found];
 }

 function prepare(el,index){
   if(running.has(el))return;
   // Never depend on transparent text/background clipping: if animation is
   // paused or unsupported, the name remains visible in red instead of vanishing.
   el.style.setProperty('color','#ff3b30','important');
   el.style.setProperty('-webkit-text-fill-color','currentColor','important');
   el.style.setProperty('background','none','important');
   el.style.setProperty('background-image','none','important');
   el.style.setProperty('-webkit-background-clip','initial','important');
   el.style.setProperty('background-clip','initial','important');

   try{
     const animation=el.animate(
       [{filter:'hue-rotate(0deg)'},{filter:'hue-rotate(360deg)'}],
       {duration:1800,iterations:Infinity,easing:'linear',delay:-(index%10)*120}
     );
     running.set(el,animation);
   }catch(_){
     // CSS fallback below still keeps the text visible and animated.
     el.classList.add('eixo-rainbow-fallback');
   }
 }

 function refresh(){rainbowLetters().forEach((el,i)=>prepare(el,i));}

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
