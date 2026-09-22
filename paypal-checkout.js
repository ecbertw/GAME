/* EIXO PayPal VIP store — PayPal Web SDK v6. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const getPlayer=()=>window.eixoGetPlayer?.()||(()=>{try{return JSON.parse(localStorage.getItem('eixo_player')||'null')}catch(_){return null}})();
  let modal=null,store=null,sdk=null,session=null,sdkMode=null,loadingSdk=null;

  const T={
    pt:{title:'COMPRAR VIP',subtitle:'Apoia o EIXO e desbloqueia cosméticos permanentes.',current:'VIP ATUAL',next:'PRÓXIMO',price:'PREÇO',pay:'PAGAR COM PAYPAL',sandbox:'MODO SANDBOX — NÃO É DINHEIRO REAL',notConfigured:'O PayPal ainda não está configurado no servidor.',max:'Já tens VIP ∞. Obrigado por apoiares o EIXO!',success:'PAGAMENTO CONCLUÍDO · VIP ATUALIZADO',cancel:'Pagamento cancelado.',error:'Não foi possível concluir o pagamento.',close:'FECHAR'},
    en:{title:'BUY VIP',subtitle:'Support EIXO and unlock permanent cosmetics.',current:'CURRENT VIP',next:'NEXT',price:'PRICE',pay:'PAY WITH PAYPAL',sandbox:'SANDBOX MODE — NO REAL MONEY',notConfigured:'PayPal is not configured on the server yet.',max:'You already have VIP ∞. Thank you for supporting EIXO!',success:'PAYMENT COMPLETED · VIP UPDATED',cancel:'Payment cancelled.',error:'Unable to complete payment.',close:'CLOSE'}
  };
  const tr=()=>T[String(document.documentElement.lang||'en').split('-')[0]]||T.en;
  const label=n=>Number(n)>=6?'VIP ∞':'VIP '+Number(n||0);

  async function api(path,options={}){
    const p=getPlayer();
    if(!p?.id)throw Error('Sign in first.');
    const r=await fetch(path,{credentials:'same-origin',...options});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw Error(d.error||'Request failed.');
    return d;
  }
  async function loadStore(){
    const p=getPlayer();
    return api('/api/paypal/store?id='+encodeURIComponent(p.id),{cache:'no-store'});
  }
  function ensureModal(){
    if(modal)return modal;
    modal=document.createElement('div');
    modal.id='vipStoreModal';
    modal.className='modal-backdrop hidden';
    modal.innerHTML='<div class="modal-card vip-store-modal" role="dialog" aria-modal="true"><button class="modal-close" id="vipStoreClose" type="button">CLOSE</button><div class="vip-mark">VIP</div><h2 id="vipStoreTitle">BUY VIP</h2><p id="vipStoreSubtitle"></p><div id="vipStoreSandbox" class="vip-store-sandbox hidden"></div><div id="vipStoreLevels" class="vip-store-levels"></div><div id="vipStoreSummary" class="vip-store-summary"></div><paypal-button id="vipPaypalButton" type="pay" hidden></paypal-button><button id="vipPaypalFallback" class="modal-button primary hidden" type="button">PAY WITH PAYPAL</button><div id="vipStoreStatus" class="vip-store-status"></div></div>';
    document.body.appendChild(modal);
    $('vipStoreClose').onclick=()=>modal.classList.add('hidden');
    modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.add('hidden')});
    return modal;
  }
  function render(){
    ensureModal();const x=tr();
    $('vipStoreClose').textContent=x.close;$('vipStoreTitle').textContent=x.title;$('vipStoreSubtitle').textContent=x.subtitle;
    const prices=store?.prices||{},current=Number(store?.currentLevel||0);
    $('vipStoreLevels').innerHTML=Array.from({length:6},(_,i)=>{
      const level=i+1,owned=level<=current,next=level===store?.nextLevel;
      return '<div class="vip-store-level '+(owned?'owned ':'')+(next?'next':'')+'"><strong>'+esc(label(level))+'</strong><span>€'+esc(prices[level]||'--')+'</span><small>'+(owned?'✓':'')+'</small></div>';
    }).join('');
    const sandbox=$('vipStoreSandbox');
    sandbox.classList.toggle('hidden',store?.mode!=='sandbox');sandbox.textContent=x.sandbox;
    const summary=$('vipStoreSummary'),status=$('vipStoreStatus'),button=$('vipPaypalButton'),fallback=$('vipPaypalFallback');
    status.textContent='';button.hidden=true;fallback.classList.add('hidden');
    if(!store?.configured){
      summary.innerHTML='<strong>'+esc(x.notConfigured)+'</strong>';return;
    }
    if(!store?.nextLevel){
      summary.innerHTML='<strong>'+esc(x.max)+'</strong>';return;
    }
    summary.innerHTML='<div><span>'+esc(x.current)+'</span><strong>'+esc(current?label(current):'—')+'</strong></div><div><span>'+esc(x.next)+'</span><strong>'+esc(label(store.nextLevel))+'</strong></div><div><span>'+esc(x.price)+'</span><strong>€'+esc(store.nextPrice)+'</strong></div>';
  }
  function loadSdk(src){
    if(window.paypal?.createInstance&&sdkMode===store.mode)return Promise.resolve();
    if(loadingSdk&&sdkMode===store.mode)return loadingSdk;
    sdk=null;session=null;sdkMode=store.mode;
    document.querySelector('script[data-eixo-paypal-sdk]')?.remove();
    loadingSdk=new Promise((resolve,reject)=>{
      const s=document.createElement('script');s.dataset.eixoPaypalSdk='1';s.async=true;s.src=src;
      s.onload=()=>resolve();s.onerror=()=>reject(Error('PayPal SDK failed to load.'));
      document.head.appendChild(s);
    });
    return loadingSdk;
  }
  async function setupPayPal(){
    if(!store?.configured||!store?.nextLevel)return;
    const src=store.mode==='live'?'https://www.paypal.com/web-sdk/v6/core':'https://www.sandbox.paypal.com/web-sdk/v6/core';
    await loadSdk(src);
    sdk=await window.paypal.createInstance({clientId:store.clientId,components:['paypal-payments'],pageType:'checkout'});
    const eligible=await sdk.findEligibleMethods({currencyCode:store.currency||'EUR'});
    if(!eligible.isEligible('paypal'))throw Error('PayPal is not available for this browser/account.');
    const status=$('vipStoreStatus');
    session=sdk.createPayPalOneTimePaymentSession({
      onApprove:async({orderId})=>{
        status.textContent='PROCESSING...';
        const p=getPlayer();
        const out=await api('/api/paypal/orders/capture',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,token:p.token,orderId})});
        const me=await fetch('/api/auth/me',{credentials:'same-origin',cache:'no-store'}).then(r=>r.json()).catch(()=>null);
        if(me?.player){
          localStorage.setItem('eixo_player',JSON.stringify({...getPlayer(),...me.player,token:p.token}));
          window.dispatchEvent(new Event('eixo-player-updated'));
        }
        status.textContent=tr().success+' · '+label(out.level);
        store=await loadStore();render();await setupPayPal().catch(()=>{});
      },
      onCancel:()=>{status.textContent=tr().cancel},
      onError:e=>{console.error('PayPal checkout',e);status.textContent=tr().error}
    });
    const btn=$('vipPaypalButton');
    btn.hidden=false;
    if(!btn.dataset.bound){
      btn.dataset.bound='1';
      btn.addEventListener('click',async()=>{
        const p=getPlayer(),status=$('vipStoreStatus');
        status.textContent='OPENING PAYPAL...';
        try{
          const orderPromise=api('/api/paypal/orders/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,token:p.token})}).then(d=>d.orderId);
          await session.start({presentationMode:'auto'},orderPromise);
        }catch(e){console.error(e);status.textContent=e.message||tr().error}
      });
    }
  }
  async function open(){
    ensureModal();modal.classList.remove('hidden');$('vipStoreStatus').textContent='LOADING...';
    try{store=await loadStore();render();if(store.configured&&store.nextLevel)await setupPayPal();}
    catch(e){$('vipStoreStatus').textContent=e.message}
  }
  window.EixoVipStore={open};
})();
