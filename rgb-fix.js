/* EIXO V1.1.24 — RGB por letra, independente do efeito */
(function(){
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const css=document.createElement('style');
 css.textContent=`.name-rgb .name-letter{display:inline-block!important;background:none!important;background-image:none!important;-webkit-background-clip:initial!important;background-clip:initial!important;-webkit-text-fill-color:currentColor!important;color:inherit}`;
 document.head.appendChild(css);

 function letters(el){
   const text=el.textContent||'';
   const old=[...el.querySelectorAll(':scope > .name-letter')];
   if(old.length===text.length&&old.length>0)return;
   el.innerHTML=[...text].map(ch=>'<span class="name-letter">'+esc(ch)+'</span>').join('');
 }

 function fix(){
   document.querySelectorAll('.rank-player-name.name-rainbow,.name-preview.name-rainbow').forEach(el=>{
     letters(el);
     el.classList.add('name-rgb');
     el.style.color='transparent';
     el.querySelectorAll(':scope > .name-letter').forEach((letter,i)=>{
       letter.style.setProperty('--rgb-index',i);
     });
   });
 }

 // Animate only while RGB names are actually present.
 let rgbEls=[],running=false;
 function refreshRgb(){
   rgbEls=[...document.querySelectorAll('.rank-player-name.name-rgb,.name-preview.name-rgb')];
   if(rgbEls.length&&!running){running=true;requestAnimationFrame(tick)}
 }
 const start=performance.now();
 function tick(now){
   if(document.hidden){running=false;return}
   if(!rgbEls.length){running=false;return}
   const phase=((now-start)/18)%360;
   for(const el of rgbEls){
     el.querySelectorAll(':scope > .name-letter').forEach((letter,i)=>{
       const hue=(phase+i*28)%360,color='hsl('+hue+',100%,60%)';
       letter.style.color=color;letter.style.webkitTextFillColor=color;letter.style.background='none';
     });
   }
   requestAnimationFrame(tick);
 }
 fix();refreshRgb();
 const observer=new MutationObserver(()=>{
   observer.disconnect();requestAnimationFrame(()=>{fix();refreshRgb();observer.observe(document.body,{childList:true,subtree:true})});
 });
 observer.observe(document.body,{childList:true,subtree:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshRgb()});
})();