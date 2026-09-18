/* EIXO RGB color: animated hue on the name container so per-letter effects remain independent. */
(function(){
 const palette=['#ff3b30','#ff9500','#ffd60a','#34c759','#0a84ff','#bf5af2'];
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const css=document.createElement('style');
 css.textContent=`@property --eixo-rgb-hue{syntax:"<angle>";inherits:true;initial-value:0deg}.rank-player-name.name-rgb,.rank-player-name.name-rainbow,.name-preview.name-rgb,.name-preview.name-rainbow{color:inherit!important;-webkit-text-fill-color:initial!important;background:none!important;animation:none!important}.rank-player-name.name-rgb .name-letter,.rank-player-name.name-rainbow .name-letter,.name-preview.name-rgb .name-letter,.name-preview.name-rainbow .name-letter{display:inline-block;color:hsl(var(--eixo-rgb-hue),100%,60%)!important;-webkit-text-fill-color:hsl(var(--eixo-rgb-hue),100%,60%)!important;background:none!important;animation:eixo-rgb-letter 3.6s linear infinite!important;animation-delay:calc(var(--i) * .16s)!important}@keyframes eixo-rgb-letter{0%{--eixo-rgb-hue:0deg}16.666%{--eixo-rgb-hue:60deg}33.333%{--eixo-rgb-hue:120deg}50%{--eixo-rgb-hue:180deg}66.666%{--eixo-rgb-hue:240deg}83.333%{--eixo-rgb-hue:300deg}100%{--eixo-rgb-hue:360deg}}`;
 document.head.appendChild(css);
 function letters(el){if(el.querySelector('.name-letter'))return;const text=el.textContent||'';el.innerHTML=[...text].map((ch,i)=>`<span class="name-letter" style="--i:${i}">${esc(ch)}</span>`).join('');}
 function fixOptions(){const el=document.getElementById('customizeColor');if(!el)return;[...el.options].forEach(o=>{if(String(o.value).toLowerCase()==='rainbow'&&o.textContent!=='RGB')o.textContent='RGB';});}
 function fixNames(){
  document.querySelectorAll('.rank-player-name.name-rainbow,.name-preview.name-rainbow').forEach(el=>{letters(el);el.classList.add('name-rgb');el.style.color='transparent';el.style.removeProperty('background');el.style.removeProperty('-webkit-text-fill-color');el.querySelectorAll('.name-letter').forEach((letter,i)=>letter.style.setProperty('--i',i));el.dataset.rgbReady='1';});
  document.querySelectorAll('.rank-player-name.name-rgb,.name-preview.name-rgb').forEach(el=>{letters(el);el.querySelectorAll('.name-letter').forEach((letter,i)=>letter.style.setProperty('--i',i));el.dataset.rgbReady='1';});
 }
 function apply(){fixOptions();fixNames();}
 apply();
 const observer=new MutationObserver(()=>{observer.disconnect();requestAnimationFrame(()=>{apply();observer.observe(document.body,{childList:true,subtree:true})})});
 observer.observe(document.body,{childList:true,subtree:true});
})();