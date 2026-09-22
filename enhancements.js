/* EIXO auxiliary UX: contact, suggestions and bug-report forms only.
   Room rendering, session validation and name customization live in their dedicated modules. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const close=id=>$(id)?.classList.add('hidden');

 async function sendForm(form,type,errorId){
   const err=$(errorId);if(err)err.textContent='';
   const data=Object.fromEntries(new FormData(form).entries());
   try{
     const r=await fetch('/api/'+type,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
     const d=await r.json().catch(()=>({}));
     if(!r.ok)throw Error(d.error||'Unable to send.');
     form.reset();close(form.closest('.modal-backdrop')?.id);
     alert(window.eixoT?window.eixoT('messageSent','Message sent. Thank you!'):'Message sent. Thank you!');
   }catch(e){if(err)err.textContent=e.message}
 }

 $('contactForm')?.addEventListener('submit',e=>{e.preventDefault();sendForm(e.currentTarget,'contact','contactError')});
 $('suggestionForm')?.addEventListener('submit',e=>{e.preventDefault();sendForm(e.currentTarget,'contact','suggestionError')});
 $('bugForm')?.addEventListener('submit',e=>{e.preventDefault();sendForm(e.currentTarget,'bugs','bugError')});
})();
