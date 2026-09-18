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

 // Uma única fase percorre as letras: cada letra tem uma tonalidade diferente
 // e a onda avança sempre para a direita. O efeito CSS da letra continua separado.
 const start=performance.now();
 function tick(now){
   const phase=((now-start)/18)%360;
   document.querySelectorAll('.rank-player-name.name-rgb,.name-preview.name-rgb').forEach(el=>{
     el.querySelectorAll(':scope > .name-letter').forEach((letter,i)=>{
       const hue=(phase+i*28)%360;
       letter.style.color='hsl('+hue+',100%,60%)';
       letter.style.webkitTextFillColor='hsl('+hue+',100%,60%)';
       letter.style.background='none';
     });
   });
   requestAnimationFrame(tick);
 }

 fix();
 requestAnimationFrame(tick);
 const observer=new MutationObserver(()=>{
   observer.disconnect();
   requestAnimationFrame(()=>{
     fix();
     observer.observe(document.body,{childList:true,subtree:true});
   });
 });
 observer.observe(document.body,{childList:true,subtree:true});
})();