/* EIXO PayPal VIP + support store — PayPal Web SDK v6. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const getPlayer=()=>window.eixoGetPlayer?.()||(()=>{try{return JSON.parse(localStorage.getItem('eixo_player')||'null')}catch(_){return null}})();
  let modal=null,store=null,sdk=null,session=null,sdkMode=null,loadingSdk=null,view='vip';

  const T={
    pt:{
      title:'COMPRAR VIP',subtitle:'Apoia o EIXO e desbloqueia cosméticos permanentes.',current:'VIP ATUAL',next:'PRÓXIMO',price:'PREÇO',
      pay:'PAGAR COM PAYPAL',sandbox:'MODO SANDBOX — NÃO É DINHEIRO REAL',notConfigured:'O PayPal ainda não está configurado no servidor.',
      max:'Já tens VIP ∞. Podes continuar a apoiar o EIXO com o valor que quiseres.',supportTitle:'APOIAR EIXO',
      supportSubtitle:'Escolhe o valor que queres dar ao EIXO. Este pagamento não altera o teu nível VIP.',supportAmount:'VALOR',
      supportHint:'Mínimo €{min} · máximo €{max}',success:'PAGAMENTO CONCLUÍDO · VIP ATUALIZADO',
      supportSuccess:'OBRIGADO PELO APOIO · PAGAMENTO CONCLUÍDO',cancel:'Pagamento cancelado.',
      error:'Não foi possível concluir o pagamento.',invalidAmount:'Introduz um valor válido.',close:'FECHAR'
    },
    en:{
      title:'BUY VIP',subtitle:'Support EIXO and unlock permanent cosmetics.',current:'CURRENT VIP',next:'NEXT',price:'PRICE',
      pay:'PAY WITH PAYPAL',sandbox:'SANDBOX MODE — NO REAL MONEY',notConfigured:'PayPal is not configured on the server yet.',
      max:'You already have VIP ∞. You can keep supporting EIXO with any amount.',supportTitle:'SUPPORT EIXO',
      supportSubtitle:'Choose how much you want to give EIXO. This payment does not change your VIP level.',supportAmount:'AMOUNT',
      supportHint:'Minimum €{min} · maximum €{max}',success:'PAYMENT COMPLETED · VIP UPDATED',
      supportSuccess:'THANK YOU FOR THE SUPPORT · PAYMENT COMPLETED',cancel:'Payment cancelled.',
      error:'Unable to complete payment.',invalidAmount:'Enter a valid amount.',close:'CLOSE'
    }
  };
  const tr=()=>T[String(document.documentElement.lang||'en').split('-')[0]]||T.en;
  const label=n=>Number(n)>=6?'VIP ∞':'VIP '+Number(n||0);
  const fmt=(s,map)=>Object.entries(map||{}).reduce((v,[k,x])=>v.replace('{'+k+'}',x),s);

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
  function supportMode(){
    return view==='donation'||!store?.nextLevel;
  }
  function ensureModal(){
    if(modal)return modal;
    modal=document.createElement('div');
    modal.id='vipStoreModal';
    modal.className='modal-backdrop hidden';
    modal.innerHTML='<div class="modal-card vip-store-modal" role="dialog" aria-modal="true"><button class="modal-close" id="vipStoreClose" type="button">CLOSE</button><div class="vip-mark">VIP</div><h2 id="vipStoreTitle">BUY VIP</h2><p id="vipStoreSubtitle"></p><div id="vipStoreSandbox" class="vip-store-sandbox hidden"></div><div id="vipStoreLevels" class="vip-store-levels"></div><div id="vipStoreSummary" class="vip-store-summary"></div><div id="vipSupportAmountWrap" class="vip-support-amount hidden"><label for="vipSupportAmount" id="vipSupportAmountLabel">AMOUNT</label><div class="vip-support-input"><span>€</span><input id="vipSupportAmount" type="number" inputmode="decimal" min="0.50" max="1000.00" step="0.01" value="5.00" autocomplete="off"></div><small id="vipSupportHint"></small></div><paypal-button id="vipPaypalButton" type="pay" hidden></paypal-button><button id="vipPaypalFallback" class="modal-button primary hidden" type="button">PAY WITH PAYPAL</button><div id="vipStoreStatus" class="vip-store-status"></div></div>';
    document.body.appendChild(modal);
    $('vipStoreClose').onclick=()=>modal.classList.add('hidden');
    modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.add('hidden')});
    return modal;
  }
  function render(){
    ensureModal();const x=tr(),current=Number(store?.currentLevel||0),support=supportMode();
    $('vipStoreClose').textContent=x.close;
    $('vipStoreTitle').textContent=support?x.supportTitle:x.title;
    $('vipStoreSubtitle').textContent=support?(view==='vip'&&current>=6?x.max:x.supportSubtitle):x.subtitle;

    const prices=store?.prices||{},levels=$('vipStoreLevels');
    levels.classList.toggle('hidden',view==='donation');
    levels.innerHTML=Array.from({length:6},(_,i)=>{
      const level=i+1,owned=level<=current,next=level===store?.nextLevel;
      return '<div class="vip-store-level '+(owned?'owned ':'')+(next?'next':'')+'"><strong>'+esc(label(level))+'</strong><span>€'+esc(prices[level]||'--')+'</span><small>'+(owned?'✓':'')+'</small></div>';
    }).join('');

    const sandbox=$('vipStoreSandbox');
    sandbox.classList.toggle('hidden',store?.mode!=='sandbox');sandbox.textContent=x.sandbox;
    const summary=$('vipStoreSummary'),status=$('vipStoreStatus'),button=$('vipPaypalButton'),fallback=$('vipPaypalFallback'),amountWrap=$('vipSupportAmountWrap');
    status.textContent='';button.hidden=true;fallback.classList.add('hidden');
    amountWrap.classList.toggle('hidden',!support);
    summary.classList.toggle('hidden',support);

    if(!store?.configured){
      summary.classList.remove('hidden');
      summary.innerHTML='<strong>'+esc(x.notConfigured)+'</strong>';
      amountWrap.classList.add('hidden');
      return;
    }

    if(support){
      const min=String(store.supportMin||'0.50'),max=String(store.supportMax||'1000.00'),input=$('vipSupportAmount');
      input.min=min;input.max=max;
      if(Number(input.value)<Number(min)||Number(input.value)>Number(max))input.value='5.00';
      $('vipSupportAmountLabel').textContent=x.supportAmount;
      $('vipSupportHint').textContent=fmt(x.supportHint,{min,max});
      return;
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
  function supportAmount(){
    const input=$('vipSupportAmount'),raw=String(input?.value||'').trim().replace(',','.'),value=Number(raw);
    const min=Number(store?.supportMin||0.5),max=Number(store?.supportMax||1000);
    if(!Number.isFinite(value)||value<min||value>max||!/^\\d+(?:\\.\\d{1,2})?$/.test(raw))throw Error(tr().invalidAmount);
    return value.toFixed(2);
  }
  async function setupPayPal(){
    if(!store?.configured||(!supportMode()&&!store?.nextLevel))return;
    const src=store.mode==='live'?'https://www.paypal.com/web-sdk/v6/core':'https://www.sandbox.paypal.com/web-sdk/v6/core';
    await loadSdk(src);
    sdk=await window.paypal.createInstance({clientId:store.clientId,components:['paypal-payments'],pageType:'checkout'});
    const eligible=await sdk.findEligibleMethods({currencyCode:store.currency||'EUR'});
    if(!eligible.isEligible('paypal'))throw Error('PayPal is not available for this browser/account.');
    const status=$('vipStoreStatus');
    session=sdk.createPayPalOneTimePaymentSession({
      onApprove:async({orderId})=>{
        status.textContent='PROCESSING...';
        const p=getPlayer(),wasSupport=supportMode();
        const out=await api('/api/paypal/orders/capture',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,token:p.token,orderId})});
        if(!wasSupport){
          const me=await fetch('/api/auth/me',{credentials:'same-origin',cache:'no-store'}).then(r=>r.json()).catch(()=>null);
          if(me?.player){
            localStorage.setItem('eixo_player',JSON.stringify({...getPlayer(),...me.player,token:p.token}));
            window.dispatchEvent(new Event('eixo-player-updated'));
          }
        }
        status.textContent=wasSupport?tr().supportSuccess:tr().success+' · '+label(out.level);
        store=await loadStore();
        render();
        await setupPayPal().catch(()=>{});
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
          const support=supportMode();
          const payload={id:p.id,token:p.token,type:support?'donation':'vip'};
          if(support)payload.amount=supportAmount();
          const orderPromise=api('/api/paypal/orders/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(d=>({orderId:String(d.orderId||'')}));
          await session.start({presentationMode:'auto'},orderPromise);
        }catch(e){console.error(e);status.textContent=e.message||tr().error}
      });
    }
  }
  async function open(mode='vip'){
    view=mode==='donation'?'donation':'vip';
    ensureModal();modal.classList.remove('hidden');$('vipStoreStatus').textContent='LOADING...';
    try{store=await loadStore();render();if(store.configured&&(supportMode()||store.nextLevel))await setupPayPal();}
    catch(e){$('vipStoreStatus').textContent=e.message}
  }
  window.EixoVipStore={open,openDonate:()=>open('donation')};
})();