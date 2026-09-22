/* EIXO V1.1.25 — VIP effects per letter */
(function(){
 const valid=['none','bounce','glow','wave','shake','float','pulse','jelly','twist','flicker','stretch','sparkle','shimmer','glitch','tilt','pop','scanline'];
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const css=document.createElement('style');
 css.textContent=`
.rank-player-name,.name-preview{white-space:nowrap;overflow:visible;text-overflow:clip}
.name-letter{display:inline-block;white-space:pre;position:relative;transform-origin:center bottom}
.name-letter.effect-bounce{animation:eixo-bounce .65s steps(2,end) infinite alternate}
.name-letter.effect-glow{animation:eixo-glow 1.3s ease-in-out infinite alternate}
.name-letter.effect-shake{animation:eixo-shake .35s steps(2,end) infinite}
.name-letter.effect-pulse{animation:eixo-pulse 1.1s ease-in-out infinite}
.name-letter.effect-jelly{animation:eixo-jelly .9s ease-in-out infinite}
.name-letter.effect-twist{animation:eixo-twist 1.1s ease-in-out infinite}
.name-letter.effect-flicker{animation:eixo-flicker 1.5s steps(2,end) infinite}
.name-letter.effect-stretch{animation:eixo-stretch 1.2s ease-in-out infinite}
.name-letter.effect-wave{animation:eixo-wave .9s ease-in-out infinite}
.name-letter.effect-float{animation:eixo-float 1.3s ease-in-out infinite}
.name-letter.effect-sparkle{animation:eixo-sparkle 1.2s steps(2,end) infinite}
.name-letter.effect-shimmer{animation:eixo-shimmer 1.4s ease-in-out infinite}
.name-letter.effect-glitch{animation:eixo-glitch .55s steps(2,end) infinite}
.name-letter.effect-tilt{animation:eixo-tilt 1s ease-in-out infinite alternate}
.name-letter.effect-pop{animation:eixo-pop .85s steps(2,end) infinite}
.name-letter.effect-scanline{animation:eixo-scanline 1.15s linear infinite}
@keyframes eixo-bounce{to{transform:translateY(-4px)}} @keyframes eixo-glow{to{text-shadow:0 0 8px currentColor}}
@keyframes eixo-wave{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}} @keyframes eixo-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes eixo-shake{25%{transform:translateX(-2px)}75%{transform:translateX(2px)}} @keyframes eixo-pulse{50%{opacity:.5}}
@keyframes eixo-jelly{0%,100%{transform:scale(1)}50%{transform:scaleX(1.08) scaleY(.92)}} @keyframes eixo-twist{0%,100%{transform:rotate(0)}50%{transform:rotate(8deg)}}
@keyframes eixo-flicker{0%,100%{opacity:1}45%{opacity:.35}55%{opacity:.9}70%{opacity:.45}} @keyframes eixo-stretch{0%,100%{transform:scaleX(1)}50%{transform:scaleX(1.22)}}
@keyframes eixo-sparkle{0%,100%{opacity:1;text-shadow:none}25%{opacity:.55;text-shadow:1px 0 0 currentColor,-1px 0 0 currentColor}50%{opacity:1;text-shadow:0 0 7px currentColor}} @keyframes eixo-shimmer{0%,100%{opacity:.65}50%{opacity:1;text-shadow:0 0 5px currentColor}}
@keyframes eixo-glitch{0%,100%{transform:translate(0,0)}25%{transform:translate(-2px,1px)}50%{transform:translate(2px,-1px)}75%{transform:translate(-1px,0)}} @keyframes eixo-tilt{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}
@keyframes eixo-pop{0%,100%{transform:scale(1)}45%{transform:scale(1.28)}65%{transform:scale(.94)}} @keyframes eixo-scanline{0%,100%{transform:translateY(0);opacity:1}50%{transform:translateY(2px);opacity:.65}}
`;
 document.head.appendChild(css);
 function makeLetters(el){
   const text=el.textContent||'', old=[...el.querySelectorAll(':scope > .name-letter')];
   if(old.length===text.length&&old.length>0)return;
   el.innerHTML=[...text].map(ch=>'<span class="name-letter">'+esc(ch)+'</span>').join('');
 }
 function applyEffect(el){
   makeLetters(el);
   const children=el.querySelectorAll(':scope > .name-letter');
   if(el.classList.contains('vip-letter-styled')){
     children.forEach((letter,i)=>{letter.style.animationDelay=(i*0.05)+'s'});
     return;
   }
   const effect=(el.className.match(/(?:^|\s)effect-([a-z]+)/)||[])[1]||'none';
   el.querySelectorAll(':scope > .name-letter').forEach((letter,i)=>{
     [...letter.classList].filter(x=>x.indexOf('effect-')===0).forEach(x=>letter.classList.remove(x));
     if(valid.includes(effect)&&effect!=='none')letter.classList.add('effect-'+effect);
     letter.style.animationDelay=(i*0.05)+'s';
   });
 }
 function fix(){document.querySelectorAll('.rank-player-name,.name-preview,.chat-name').forEach(applyEffect)}
 fix();
 const observer=new MutationObserver(()=>{observer.disconnect();requestAnimationFrame(()=>{fix();observer.observe(document.body,{childList:true,subtree:true})})});
 observer.observe(document.body,{childList:true,subtree:true});
 window.eixoApplyNameEffects=fix;
})();