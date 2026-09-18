/* EIXO RGB — continuous left-to-right letter flow, independent from effects. */
(function(){
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const css=document.createElement('style');
 css.textContent=`.rank-player-name.name-rgb,.rank-player-name.name-rainbow,.name-preview.name-rgb,.name-preview.name-rainbow{color:inherit!important;background:none!important;-webkit-text-fill-color:initial!important;animation:none!important}.rank-player-name.name-rgb .name-letter,.rank-player-name.name-rainbow .name-letter,.name-preview.name-rgb .name-letter,.name-preview.name-rainbow .name-letter{-webkit-text-fill-color:initial!important;background:none!important}`;
 document.head.appendChild(css);
 function letters(el){const existing=[...el.querySelectorAll(':scope > .name-letter')];if(existing.length)return existing;const text=el.textContent||'';el.innerHTML=[...text].map(ch=>`<span class="name-letter">${esc(ch)}</span>`).join('');return [...el.querySelectorAll(':scope > .name-letter')];}
 function apply(){document.querySelectorAll('.rank-player-name.name-rainbow,.name-preview.name-rainbow').forEach(el=>{const ls=letters(el);ls.forEach((letter,i)=>{letter.style.setProperty('--i',i);});el.classList.add('name-rgb');});}
 let start=performance.now();
 function tick(now){const phase=((now-start)/24)%360;document.querySelectorAll('.rank-player-name.name-rgb,.name-preview.name-rgb').forEach(el=>{const ls=letters(el);ls.forEach((letter,i)=>{const hue=(phase+i*55)%360;letter.style.setProperty('--rgb-h',hue+'deg');letter.style.color='hsl('+hue+',100%,60%)';});});requestAnimationFrame(tick);}
 apply();requestAnimationFrame(tick);
 const observer=new MutationObserver(()=>{observer.disconnect();requestAnimationFrame(()=>{apply();observer.observe(document.body,{childList:true,subtree:true})})});
 observer.observe(document.body,{childList:true,subtree:true});
})();