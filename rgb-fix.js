/* EIXO V1.1.23 — continuous RGB flowing left-to-right */
(function(){
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const css=document.createElement('style');
 css.textContent='.name-rgb .name-letter{display:inline-block;-webkit-text-fill-color:transparent!important;background:linear-gradient(90deg,#ff0000,#ff7a00,#ffff00,#00ff00,#00ffff,#0066ff,#8a2be2,#ff00aa,#ff0000);background-size:320% 100%;-webkit-background-clip:text;background-clip:text;color:transparent!important}';
 document.head.appendChild(css);
 function letters(el){const text=el.textContent||'',old=[...el.querySelectorAll(':scope > .name-letter')];if(old.length===text.length&&old.length>0)return;el.innerHTML=[...text].map(ch=>'<span class="name-letter">'+esc(ch)+'</span>').join('')}
 function fix(){document.querySelectorAll('.rank-player-name.name-rainbow,.name-preview.name-rainbow').forEach(el=>{letters(el);el.classList.add('name-rgb');el.style.color='transparent';el.querySelectorAll(':scope > .name-letter').forEach(x=>{x.style.removeProperty('color');x.style.removeProperty('-webkit-text-fill-color')})})}
 let start=performance.now();
 function tick(now){const pos=-(((now-start)/28)%320);document.querySelectorAll('.rank-player-name.name-rgb,.name-preview.name-rgb').forEach(el=>el.querySelectorAll(':scope > .name-letter').forEach(letter=>letter.style.backgroundPosition=pos+'% 50%'));requestAnimationFrame(tick)}
 requestAnimationFrame(tick);fix();
 const observer=new MutationObserver(()=>{observer.disconnect();requestAnimationFrame(()=>{fix();observer.observe(document.body,{childList:true,subtree:true})})});observer.observe(document.body,{childList:true,subtree:true});
})();