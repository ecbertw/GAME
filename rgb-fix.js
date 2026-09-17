/* EIXO RGB color: render RGB names safely even when the ranking is rebuilt dynamically. */
(function(){
 const palette=['#ff3b30','#ff9500','#ffd60a','#34c759','#0a84ff','#bf5af2'];
 const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
 const css=document.createElement('style');
 css.textContent=`@property --eixo-rgb-hue{syntax:"<angle>";inherits:false;initial-value:0deg}.rank-player-name.name-rgb,.name-preview.name-rgb{color:transparent!important;-webkit-text-fill-color:transparent!important;background:none!important}.rank-player-name.name-rgb .name-letter,.name-preview.name-rgb .name-letter{color:hsl(calc(var(--eixo-rgb-hue) + var(--i) * 28deg),100%,60%)!important;-webkit-text-fill-color:hsl(calc(var(--eixo-rgb-hue) + var(--i) * 28deg),100%,60%)!important;background:none!important;animation:eixo-rgb-cycle 2.4s linear infinite!important}@keyframes eixo-rgb-cycle{from{--eixo-rgb-hue:0deg}to{--eixo-rgb-hue:360deg}}`;
 document.head.appendChild(css);
 function letters(el){if(el.querySelector('.name-letter'))return;const text=el.textContent||'';el.innerHTML=[...text].map((ch,i)=>`<span class="name-letter" style="--i:${i}">${esc(ch)}</span>`).join('');}
 function fixOptions(){const el=document.getElementById('customizeColor');if(!el)return;[...el.options].forEach(o=>{if(String(o.value).toLowerCase()==='rainbow'&&o.textContent!=='RGB')o.textContent='RGB';});}
 function fixNames(){
  document.querySelectorAll('.rank-player-name.name-rainbow,.name-preview.name-rainbow').forEach(el=>{letters(el);el.classList.remove('name-rainbow');el.classList.add('name-rgb');el.style.color='transparent';el.style.removeProperty('background');el.style.removeProperty('-webkit-text-fill-color');el.querySelectorAll('.name-letter').forEach((letter,i)=>letter.style.setProperty('--i',i));el.dataset.rgbReady='1';});
  document.querySelectorAll('.rank-player-name.name-rgb,.name-preview.name-rgb').forEach(el=>{letters(el);el.querySelectorAll('.name-letter').forEach((letter,i)=>letter.style.setProperty('--i',i));el.dataset.rgbReady='1';});
 }
 function apply(){fixOptions();fixNames();}
 apply();
 const observer=new MutationObserver(()=>{observer.disconnect();requestAnimationFrame(()=>{apply();observer.observe(document.body,{childList:true,subtree:true})})});
 observer.observe(document.body,{childList:true,subtree:true});
})();
