'use strict';

const crypto=require('crypto');

const VIP_PRICES_CENTS=Object.freeze({1:123,2:149,3:199,4:249,5:299,6:399});
const CURRENCY='EUR';

function mode(){
  return String(process.env.PAYPAL_MODE||'sandbox').toLowerCase()==='live'?'live':'sandbox';
}
function apiBase(){
  return mode()==='live'?'https://api-m.paypal.com':'https://api-m.sandbox.paypal.com';
}
function clientId(){return String(process.env.PAYPAL_CLIENT_ID||'').trim();}
function clientSecret(){return String(process.env.PAYPAL_CLIENT_SECRET||'').trim();}
function webhookId(){return String(process.env.PAYPAL_WEBHOOK_ID||'').trim();}
function configured(){return Boolean(clientId()&&clientSecret());}
function centsToValue(cents){return (Number(cents)/100).toFixed(2);}
function vipLabel(level){return Number(level)>=6?'VIP ∞':'VIP '+Number(level);}
const SUPPORT_MIN_CENTS=50;
const SUPPORT_MAX_CENTS=100000;
function supportCents(value){
  const normalized=String(value??'').trim().replace(',','.');
  if(!/^(?:\\d+)(?:\\.\\d{1,2})?$/.test(normalized))throw Object.assign(new Error('Introduz um valor válido para o apoio.'),{status:400});
  const cents=Math.round(Number(normalized)*100);
  if(!Number.isSafeInteger(cents)||cents<SUPPORT_MIN_CENTS||cents>SUPPORT_MAX_CENTS){
    throw Object.assign(new Error('O valor do apoio deve estar entre €0,50 e €1000,00.'),{status:400});
  }
  return cents;
}

async function initDb(db){
  await db.query(`CREATE TABLE IF NOT EXISTS vip_payments(
    id UUID PRIMARY KEY,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    vip_level INTEGER NOT NULL CHECK(vip_level BETWEEN 1 AND 6),
    amount_cents INTEGER NOT NULL CHECK(amount_cents>0),
    currency CHAR(3) NOT NULL DEFAULT 'EUR',
    paypal_order_id VARCHAR(40) UNIQUE,
    paypal_capture_id VARCHAR(40) UNIQUE,
    status VARCHAR(24) NOT NULL DEFAULT 'CREATED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    captured_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await db.query(`ALTER TABLE vip_payments ADD COLUMN IF NOT EXISTS payment_type VARCHAR(16) NOT NULL DEFAULT 'VIP'`);
  await db.query(`ALTER TABLE vip_payments ALTER COLUMN vip_level DROP NOT NULL`);
  await db.query(`CREATE INDEX IF NOT EXISTS vip_payments_player_created_idx ON vip_payments(player_id,created_at DESC)`);
  await db.query(`CREATE INDEX IF NOT EXISTS vip_payments_status_idx ON vip_payments(status)`);
  await db.query(`CREATE INDEX IF NOT EXISTS vip_payments_type_idx ON vip_payments(payment_type)`);
}

async function accessToken(){
  if(!configured())throw Object.assign(new Error('PayPal is not configured.'),{status:503});
  const basic=Buffer.from(clientId()+':'+clientSecret()).toString('base64');
  const r=await fetch(apiBase()+'/v1/oauth2/token',{
    method:'POST',
    headers:{Authorization:'Basic '+basic,'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json'},
    body:'grant_type=client_credentials',
    signal:AbortSignal.timeout(10000)
  });
  const d=await r.json().catch(()=>({}));
  if(!r.ok||!d.access_token)throw Object.assign(new Error('PayPal authentication failed.'),{status:502});
  return d.access_token;
}
async function pp(path,options={}){
  const token=await accessToken();
  const r=await fetch(apiBase()+path,{
    ...options,
    headers:{Authorization:'Bearer '+token,'Content-Type':'application/json','Accept':'application/json',...(options.headers||{})},
    signal:AbortSignal.timeout(15000)
  });
  const d=await r.json().catch(()=>({}));
  if(!r.ok){
    const detail=d?.details?.[0]?.description||d?.message||'PayPal request failed.';
    const err=Object.assign(new Error(detail),{status:502,paypalStatus:r.status,paypal:d});
    throw err;
  }
  return d;
}

function publicStore(player){
  const current=Math.max(0,Math.min(6,Number(player?.vipLevel||0)));
  const next=current<6?current+1:null;
  return{
    configured:configured(),
    mode:mode(),
    clientId:configured()?clientId():'',
    currency:CURRENCY,
    currentLevel:current,
    nextLevel:next,
    nextPrice:next?centsToValue(VIP_PRICES_CENTS[next]):null,
    prices:Object.fromEntries(Object.entries(VIP_PRICES_CENTS).map(([k,v])=>[k,centsToValue(v)])),
    supportMin:centsToValue(SUPPORT_MIN_CENTS),
    supportMax:centsToValue(SUPPORT_MAX_CENTS)
  };
}

async function createOrder(db,player,options={}){
  if(!configured())throw Object.assign(new Error('PayPal ainda não está configurado.'),{status:503});
  const current=Math.max(0,Math.min(6,Number(player.vipLevel||0)));
  const type=String(options.type||'vip').trim().toLowerCase()==='donation'?'DONATION':'VIP';
  let level=null,cents=0,referenceId='',description='';

  if(type==='VIP'){
    if(current>=6)throw Object.assign(new Error('Já tens VIP ∞. Podes continuar a apoiar o EIXO com um valor livre.'),{status:400});
    level=current+1;
    cents=VIP_PRICES_CENTS[level];
    referenceId='vip-'+level;
    description='EIXO '+vipLabel(level);
  }else{
    cents=supportCents(options.amount);
    referenceId='support';
    description=current>=6?'EIXO VIP ∞ Support':'EIXO Support';
  }

  const paymentId=crypto.randomUUID();
  await db.query(
    'INSERT INTO vip_payments(id,player_id,vip_level,amount_cents,currency,status,payment_type) VALUES($1,$2,$3,$4,$5,$6,$7)',
    [paymentId,player.id,level,cents,CURRENCY,'CREATING',type]
  );

  try{
    const order=await pp('/v2/checkout/orders',{
      method:'POST',
      headers:{'PayPal-Request-Id':paymentId},
      body:JSON.stringify({
        intent:'CAPTURE',
        purchase_units:[{
          reference_id:referenceId,
          custom_id:String(player.id),
          invoice_id:'EIXO-'+paymentId,
          description,
          amount:{currency_code:CURRENCY,value:centsToValue(cents)}
        }],
        payment_source:{paypal:{experience_context:{
          brand_name:'EIXO',
          shipping_preference:'NO_SHIPPING',
          user_action:'PAY_NOW'
        }}}
      })
    });
    if(!order?.id)throw Object.assign(new Error('PayPal did not return an order ID.'),{status:502});
    await db.query('UPDATE vip_payments SET paypal_order_id=$1,status=$2,updated_at=NOW() WHERE id=$3',[order.id,'CREATED',paymentId]);
    return{orderId:order.id,type:type.toLowerCase(),level,price:centsToValue(cents),currency:CURRENCY};
  }catch(e){
    await db.query('UPDATE vip_payments SET status=$1,updated_at=NOW() WHERE id=$2',['CREATE_FAILED',paymentId]).catch(()=>{});
    throw e;
  }
}
function captureFromOrder(order){
  const unit=order?.purchase_units?.[0];
  const capture=unit?.payments?.captures?.[0];
  return{unit,capture};
}

async function fulfillCapture(db,orderId,capture){
  if(!orderId||!capture?.id)return{fulfilled:false};
  const client=await db.connect();
  try{
    await client.query('BEGIN');
    const q=await client.query('SELECT * FROM vip_payments WHERE paypal_order_id=$1 FOR UPDATE',[orderId]);
    if(!q.rowCount){await client.query('ROLLBACK');return{fulfilled:false,unknownOrder:true}}
    const pay=q.rows[0];
    if(pay.status==='CAPTURED'){
      await client.query('COMMIT');
      return{fulfilled:true,already:true,type:String(pay.payment_type||'VIP').toLowerCase(),level:pay.vip_level==null?null:Number(pay.vip_level),captureId:pay.paypal_capture_id};
    }
    const expected=centsToValue(pay.amount_cents);
    const actual=String(capture?.amount?.value||'');
    const currency=String(capture?.amount?.currency_code||'').toUpperCase();
    const status=String(capture?.status||'').toUpperCase();
    if(status!=='COMPLETED')throw Object.assign(new Error('PayPal payment is not completed.'),{status:409});
    if(currency!==pay.currency||actual!==expected)throw Object.assign(new Error('PayPal amount validation failed.'),{status:409});
    const dup=await client.query('SELECT id FROM vip_payments WHERE paypal_capture_id=$1 AND id<>$2',[capture.id,pay.id]);
    if(dup.rowCount)throw Object.assign(new Error('PayPal capture was already used.'),{status:409});

    const paymentType=String(pay.payment_type||'VIP').toUpperCase();
    if(paymentType==='VIP'&&Number(pay.vip_level)>0){
      await client.query('UPDATE players SET vip_level=GREATEST(vip_level,$1),updated_at=NOW() WHERE id=$2',[pay.vip_level,pay.player_id]);
    }
    await client.query('UPDATE vip_payments SET paypal_capture_id=$1,status=$2,captured_at=NOW(),updated_at=NOW() WHERE id=$3',[capture.id,'CAPTURED',pay.id]);
    await client.query('COMMIT');
    return{fulfilled:true,type:paymentType.toLowerCase(),level:pay.vip_level==null?null:Number(pay.vip_level),captureId:capture.id};
  }catch(e){
    try{await client.query('ROLLBACK')}catch(_){}
    throw e;
  }finally{client.release()}
}

async function captureKnownOrder(db,id,requestKey){
  let order;
  try{
    order=await pp('/v2/checkout/orders/'+encodeURIComponent(id)+'/capture',{
      method:'POST',
      headers:{'PayPal-Request-Id':requestKey}
    });
  }catch(e){
    // A replay/race can make PayPal report an already-captured order.
    // Retrieve the authoritative order and fulfill idempotently from its capture.
    if(Number(e.paypalStatus)!==422)throw e;
    order=await pp('/v2/checkout/orders/'+encodeURIComponent(id),{method:'GET'});
  }
  const {capture}=captureFromOrder(order);
  if(!capture?.id)throw Object.assign(new Error('PayPal did not return a completed capture.'),{status:409});
  return fulfillCapture(db,id,capture);
}

async function captureOrder(db,player,orderId){
  const id=String(orderId||'').trim();
  if(!/^[A-Z0-9-]{10,40}$/i.test(id))throw Object.assign(new Error('Invalid PayPal order ID.'),{status:400});
  const q=await db.query('SELECT player_id AS "playerId",status FROM vip_payments WHERE paypal_order_id=$1',[id]);
  if(!q.rowCount)throw Object.assign(new Error('Unknown PayPal order.'),{status:404});
  if(q.rows[0].playerId!==player.id)throw Object.assign(new Error('This PayPal order belongs to another account.'),{status:403});

  if(q.rows[0].status==='CAPTURED'){
    const p=await db.query('SELECT vip_level AS "vipLevel" FROM players WHERE id=$1',[player.id]);
    return{ok:true,level:Number(p.rows[0]?.vipLevel||0),already:true};
  }

  const result=await captureKnownOrder(db,id,'capture-'+id);
  const p=await db.query('SELECT vip_level AS "vipLevel" FROM players WHERE id=$1',[player.id]);
  return{ok:true,level:Number(p.rows[0]?.vipLevel||result.level||0),orderId:id,captureId:result.captureId||null};
}

async function verifyWebhook(headers,event){
  if(!webhookId())throw Object.assign(new Error('PayPal webhook is not configured.'),{status:503});
  const payload={
    transmission_id:String(headers['paypal-transmission-id']||''),
    transmission_time:String(headers['paypal-transmission-time']||''),
    cert_url:String(headers['paypal-cert-url']||''),
    auth_algo:String(headers['paypal-auth-algo']||''),
    transmission_sig:String(headers['paypal-transmission-sig']||''),
    webhook_id:webhookId(),
    webhook_event:event
  };
  if(!payload.transmission_id||!payload.transmission_time||!payload.cert_url||!payload.auth_algo||!payload.transmission_sig){
    throw Object.assign(new Error('Missing PayPal webhook signature headers.'),{status:400});
  }
  const d=await pp('/v1/notifications/verify-webhook-signature',{method:'POST',body:JSON.stringify(payload)});
  return d?.verification_status==='SUCCESS';
}

async function handleWebhook(db,headers,event){
  if(!(await verifyWebhook(headers,event)))throw Object.assign(new Error('Invalid PayPal webhook signature.'),{status:400});
  const type=String(event?.event_type||'');
  const resource=event?.resource||{};

  if(type==='CHECKOUT.ORDER.APPROVED'){
    const orderId=String(resource?.id||'');
    if(orderId){
      const q=await db.query('SELECT status FROM vip_payments WHERE paypal_order_id=$1',[orderId]);
      if(q.rowCount&&q.rows[0].status!=='CAPTURED'){
        await db.query("UPDATE vip_payments SET status='APPROVED',updated_at=NOW() WHERE paypal_order_id=$1 AND status<>'CAPTURED'",[orderId]);
        await captureKnownOrder(db,orderId,'webhook-capture-'+orderId);
      }
    }
  }else if(type==='CHECKOUT.ORDER.DECLINED'){
    const orderId=String(resource?.id||'');
    if(orderId)await db.query("UPDATE vip_payments SET status='DECLINED',updated_at=NOW() WHERE paypal_order_id=$1 AND status<>'CAPTURED'",[orderId]);
  }else if(type==='PAYMENT.CAPTURE.PENDING'){
    const orderId=resource?.supplementary_data?.related_ids?.order_id;
    if(orderId)await db.query("UPDATE vip_payments SET status='PENDING',updated_at=NOW() WHERE paypal_order_id=$1 AND status<>'CAPTURED'",[String(orderId)]);
  }else if(type==='PAYMENT.CAPTURE.COMPLETED'){
    const orderId=resource?.supplementary_data?.related_ids?.order_id;
    if(orderId)await fulfillCapture(db,String(orderId),resource);
  }else if(type==='PAYMENT.CAPTURE.DENIED'){
    const orderId=resource?.supplementary_data?.related_ids?.order_id;
    if(orderId)await db.query("UPDATE vip_payments SET status='DENIED',updated_at=NOW() WHERE paypal_order_id=$1 AND status<>'CAPTURED'",[String(orderId)]);
  }else if(type==='CHECKOUT.PAYMENT-APPROVAL.REVERSED'){
    const orderId=resource?.id;
    if(orderId)await db.query("UPDATE vip_payments SET status='REVERSED',updated_at=NOW() WHERE paypal_order_id=$1 AND status<>'CAPTURED'",[String(orderId)]);
  }
  return{ok:true};
}

module.exports={VIP_PRICES_CENTS,CURRENCY,SUPPORT_MIN_CENTS,SUPPORT_MAX_CENTS,configured,mode,initDb,publicStore,createOrder,captureOrder,handleWebhook};
