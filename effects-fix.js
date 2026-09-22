/* EIXO V1.1.25 — VIP effects per letter */
(function(){
 const valid=['none','bounce','glow','wave','shake','float','pulse','jelly','twist','flicker','stretch','sparkle','shimmer','glitch','tilt','pop','scanline'];
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const css=document.createElement('style');
 css.textContent=`
.rank-player-name,.name-preview{white-space:nowrap;overflow:visible;text-overflow:clip}
.name-letter{display:inline-block;white-space:pre;position:relative;transform-origin:center bottom}
.name-letter.effect-bounce{animation:eixo-bounce 1.05s cubic-bezier(.34,1.35,.64,1) infinite}
.name-letter.effect-glow{animation:eixo-glow 1.6s ease-in-out infinite alternate}
.name-letter.effect-shake{animation:eixo-shake .7s ease-in-out infinite}
.name-letter.effect-pulse{animation:eixo-pulse 1.45s ease-in-out infinite}
.name-letter.effect-jelly{animation:eixo-jelly 1.2s cubic-bezier(.34,1.25,.64,1) infinite}
.name-letter.effect-twist{animation:eixo-twist 1.55s ease-in-out infinite}
.name-letter.effect-flicker{animation:eixo-flicker 1.8s ease-in-out infinite}
.name-letter.effect-stretch{animation:eixo-stretch 1.45s ease-in-out infinite}
.name-letter.effect-wave{animation:eixo-wave 1.35s cubic-bezier(.45,.05,.55,.95) infinite}
.name-letter.effect-float{animation:eixo-float 1.9s ease-in-out infinite}
.name-letter.effect-sparkle{animation:eixo-sparkle 1.55s ease-in-out infinite}
.name-letter.effect-shimmer{animation:eixo-shimmer 1.75s ease-in-out infinite}
.name-letter.effect-glitch{animation:eixo-glitch .95s linear infinite}
.name-letter.effect-tilt{animation:eixo-tilt 1.45s ease-in-out infinite}
.name-letter.effect-pop{animation:eixo-pop 1.15s cubic-bezier(.34,1.3,.64,1) infinite}
.name-letter.effect-scanline{animation:eixo-scanline 1.55s ease-in-out infinite}
@keyframes eixo-bounce{
  0%,100%{transform:translateY(0) scaleX(1) scaleY(1)}
  18%{transform:translateY(0) scaleX(1.04) scaleY(.96)}
  45%{transform:translateY(-4px) scaleX(.99) scaleY(1.02)}
  68%{transform:translateY(0) scaleX(1.03) scaleY(.97)}
  80%{transform:translateY(-1px) scaleX(1) scaleY(1)}
}
@keyframes eixo-glow{0%{text-shadow:0 0 0 currentColor}100%{text-shadow:0 0 4px currentColor,0 0 9px currentColor}}
@keyframes eixo-wave{0%,100%{transform:translateY(0)}25%{transform:translateY(-2px)}50%{transform:translateY(-3.5px)}75%{transform:translateY(-1px)}}
@keyframes eixo-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.5px)}}
@keyframes eixo-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-1px)}50%{transform:translateX(.8px)}75%{transform:translateX(-.5px)}}
@keyframes eixo-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.72;transform:scale(1.035)}}
@keyframes eixo-jelly{0%,100%{transform:scaleX(1) scaleY(1)}35%{transform:scaleX(1.06) scaleY(.96)}60%{transform:scaleX(.985) scaleY(1.025)}}
@keyframes eixo-twist{0%,100%{transform:rotate(0)}35%{transform:rotate(5deg)}65%{transform:rotate(-2deg)}}
@keyframes eixo-flicker{0%,100%{opacity:1}42%{opacity:.88}47%{opacity:.55}52%{opacity:.95}58%{opacity:.78}}
@keyframes eixo-stretch{0%,100%{transform:scaleX(1)}50%{transform:scaleX(1.12)}}
@keyframes eixo-sparkle{0%,100%{opacity:1;text-shadow:0 0 0 currentColor}35%{opacity:.86;text-shadow:0 0 3px currentColor}55%{opacity:1;text-shadow:0 0 7px currentColor,1px -1px 2px currentColor}}
@keyframes eixo-shimmer{0%,100%{opacity:.82;text-shadow:0 0 1px currentColor}50%{opacity:1;text-shadow:0 0 5px currentColor}}
@keyframes eixo-glitch{0%,100%{transform:translate(0,0)}20%{transform:translate(-1px,.5px)}40%{transform:translate(1px,-.5px)}60%{transform:translate(-.5px,0)}80%{transform:translate(.5px,.5px)}}
@keyframes eixo-tilt{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
@keyframes eixo-pop{0%,100%{transform:scale(1)}40%{transform:scale(1.12)}58%{transform:scale(.985)}72%{transform:scale(1.025)}}
@keyframes eixo-scanline{0%,100%{transform:translateY(0);opacity:1}50%{transform:translateY(1px);opacity:.82}}
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
     children.forEach((letter,i)=>{letter.style.animationDelay=(i*0.07)+'s'});
     return;
   }
   const effect=(el.className.match(/(?:^|\s)effect-([a-z]+)/)||[])[1]||'none';
   el.querySelectorAll(':scope > .name-letter').forEach((letter,i)=>{
     [...letter.classList].filter(x=>x.indexOf('effect-')===0).forEach(x=>letter.classList.remove(x));
     if(valid.includes(effect)&&effect!=='none')letter.classList.add('effect-'+effect);
     letter.style.animationDelay=(i*0.07)+'s';
   });
 }
 function fix(){document.querySelectorAll('.rank-player-name,.name-preview,.chat-name').forEach(applyEffect)}
 fix();
 const observer=new MutationObserver(()=>{observer.disconnect();requestAnimationFrame(()=>{fix();observer.observe(document.body,{childList:true,subtree:true})})});
 observer.observe(document.body,{childList:true,subtree:true});
 window.eixoApplyNameEffects=fix;
})();