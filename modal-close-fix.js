/* EIXO: shared close behaviour for static and dynamically created dialogs.
   Existing modal-specific handlers can still run; this is a safety fallback. */
(function(){
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('button.modal-close');
    if(!button)return;
    const targetId=button.dataset.closeModal;
    const modal=(targetId?document.getElementById(targetId):null)||button.closest('.modal-backdrop');
    modal?.classList.add('hidden');
  },true);
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    const overlays=Array.from(document.querySelectorAll('.acct-overlay:not(.hidden),.modal-backdrop:not(.hidden)'));
    const modal=overlays.at(-1);
    if(!modal)return;
    if(modal.classList.contains('acct-overlay'))modal.querySelector('#acctClose')?.click();
    else modal.classList.add('hidden');
    event.stopPropagation();
  });
})();