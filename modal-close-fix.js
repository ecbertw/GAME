/* EIXO: shared close + scroll containment for static and dynamic dialogs. */
(function(){
  const syncModalLock=()=>{
    const open=Boolean(document.querySelector('.modal-backdrop:not(.hidden),.acct-overlay:not(.hidden),.admin-overlay:not(.hidden)'));
    document.documentElement.classList.toggle('eixo-modal-open',open);
    document.body?.classList.toggle('eixo-modal-open',open);
  };

  document.addEventListener('click',event=>{
    const button=event.target.closest?.('button.modal-close');
    if(!button)return;
    const targetId=button.dataset.closeModal;
    const modal=(targetId?document.getElementById(targetId):null)||button.closest('.modal-backdrop');
    modal?.classList.add('hidden');
    queueMicrotask(syncModalLock);
  },true);

  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    const overlays=Array.from(document.querySelectorAll('.acct-overlay:not(.hidden),.modal-backdrop:not(.hidden),.admin-overlay:not(.hidden)'));
    const modal=overlays.at(-1);
    if(!modal)return;
    if(modal.classList.contains('acct-overlay'))modal.querySelector('#acctClose')?.click();
    else if(modal.classList.contains('admin-overlay'))modal.querySelector('.admin-close')?.click();
    else modal.classList.add('hidden');
    syncModalLock();
    event.stopPropagation();
  });

  const observer=new MutationObserver(syncModalLock);
  const boot=()=>{
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    syncModalLock();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();