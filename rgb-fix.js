/* EIXO RGB: animate global rainbow names and per-letter rainbow safely. */
(function(){
 'use strict';
 const css=document.createElement('style');
 css.textContent=`
  .name-rgb>.name-letter,.name-letter.name-rainbow{display:inline-block!important;background:none!important;background-image:none!important;-webkit-background-clip:initial!important;background-clip:initial!important;-webkit-text-fill-color:currentColor!important}
 `;
 document.head.appendChild(css);

 let targets=[],running=false;
 function refresh(){
   const found=[];
   document.querySelectorAll('.rank-player-name,.chat-name,.name-preview').forEach(el=>{
     const globalRainbow=el.classList.contains('name-rainbow');
     const letters=[...el.querySelectorAll(':scope > .name-letter')];
     if(!letters.length)return;
     if(globalRainbow)el.classList.add('name-rgb');
     else el.classList.remove('name-rgb');
     for(const letter of letters){
       const perLetter=letter.classList.contains('name-rainbow');
       if(globalRainbow||perLetter)found.push(letter);
     }
   });
   targets=found;
   if(targets.length&&!running&&!document.hidden){running=true;requestAnimationFrame(tick)}
 }
 const started=performance.now();
 function tick(now){
   if(document.hidden||!targets.length){running=false;return}
   const phase=((now-started)/18)%360;
   for(let i=0;i<targets.length;i++){
     const hue=(phase+i*28)%360,color='hsl('+hue+',100%,60%)',letter=targets[i];
     letter.style.setProperty('color',color,'important');
     letter.style.setProperty('-webkit-text-fill-color',color,'important');
     letter.style.setProperty('background','none','important');
   }
   requestAnimationFrame(tick);
 }
 let pending=false;
 const observer=new MutationObserver(()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;refresh()})});
 observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
 refresh();
})();
