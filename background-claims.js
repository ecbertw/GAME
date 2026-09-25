/* EIXO persistent background claims + entitlement-aware color palette. */
(function(){
  'use strict';
  const TILE=12,$=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const wall=$('pixelWall');if(!wall)return;

  const I18N={
    en:{close:'CLOSE',claim:'CLAIM PIXEL',claimed:'CLAIMED PIXEL',owner:'OWNER',standard:'STANDARD COLORS',vip:'VIP COLORS',ranking:'RANK COLORS',custom:'CUSTOM COLOR',choose:'CHOOSE COLOR',save:'SAVE COLOR',take:'CLAIM PIXEL',owned:'THIS PIXEL ALREADY HAS AN OWNER.',rainbow:'RAINBOW · TOP 1'},
    pt:{close:'FECHAR',claim:'MARCAR PIXEL',claimed:'PIXEL MARCADO',owner:'DONO',standard:'CORES NORMAIS',vip:'CORES VIP',ranking:'CORES DE RANKING',custom:'COR PERSONALIZADA',choose:'ESCOLHER COR',save:'GUARDAR COR',take:'MARCAR PIXEL',owned:'ESTE PIXEL JÁ TEM DONO.',rainbow:'ARCO-ÍRIS · TOP 1'},
    es:{close:'CERRAR',claim:'MARCAR PÍXEL',claimed:'PÍXEL MARCADO',owner:'DUEÑO',standard:'COLORES NORMALES',vip:'COLORES VIP',ranking:'COLORES DE RANKING',custom:'COLOR PERSONALIZADO',choose:'ELEGIR COLOR',save:'GUARDAR COLOR',take:'MARCAR PÍXEL',owned:'ESTE PÍXEL YA TIENE DUEÑO.',rainbow:'ARCOÍRIS · TOP 1'},
    fr:{close:'FERMER',claim:'MARQUER PIXEL',claimed:'PIXEL MARQUÉ',owner:'PROPRIÉTAIRE',standard:'COULEURS NORMALES',vip:'COULEURS VIP',ranking:'COULEURS DE CLASSEMENT',custom:'COULEUR PERSONNALISÉE',choose:'CHOISIR COULEUR',save:'ENREGISTRER',take:'MARQUER PIXEL',owned:'CE PIXEL A DÉJÀ UN PROPRIÉTAIRE.',rainbow:'ARC-EN-CIEL · TOP 1'},
    de:{close:'SCHLIESSEN',claim:'PIXEL MARKIEREN',claimed:'PIXEL MARKIERT',owner:'BESITZER',standard:'NORMALE FARBEN',vip:'VIP-FARBEN',ranking:'RANGLISTENFARBEN',custom:'EIGENE FARBE',choose:'FARBE WÄHLEN',save:'FARBE SPEICHERN',take:'PIXEL MARKIEREN',owned:'DIESES PIXEL HAT BEREITS EINEN BESITZER.',rainbow:'REGENBOGEN · TOP 1'},
    it:{close:'CHIUDI',claim:'MARCA PIXEL',claimed:'PIXEL MARCATO',owner:'PROPRIETARIO',standard:'COLORI NORMALI',vip:'COLORI VIP',ranking:'COLORI CLASSIFICA',custom:'COLORE PERSONALIZZATO',choose:'SCEGLI COLORE',save:'SALVA COLORE',take:'MARCA PIXEL',owned:'QUESTO PIXEL HA GIÀ UN PROPRIETARIO.',rainbow:'ARCOBALENO · TOP 1'}
  };
  const tr=()=>I18N[String(document.documentElement.lang||'en').split('-')[0]]||I18N.en;

  const style=document.createElement('style');style.textContent=`
    #backgroundClaimCanvas{position:absolute;inset:0;z-index:5;width:100%;height:100%;pointer-events:auto;image-rendering:pixelated}
    .claim-tooltip{position:fixed;z-index:90;display:none;padding:7px 8px;background:#070c11;border:1px solid #626e79;color:#fff;font:6px/1.6 'Press Start 2P',monospace;pointer-events:none;box-shadow:3px 3px 0 #020407;max-width:220px}
    .claim-menu{position:fixed;z-index:95;width:270px;max-height:min(620px,78vh);overflow:auto;background:#080d12;border:2px solid #626e79;box-shadow:6px 6px 0 #020407;padding:11px;color:#fff;font:6px/1.6 'Press Start 2P',monospace}
    .claim-menu.hidden{display:none}.claim-menu>strong{display:block;margin:0 58px 8px 0;font-size:7px}.claim-owner{color:#8f9aa5;margin-bottom:9px}
    .claim-menu .claim-close{position:absolute;right:8px;top:7px;width:auto;margin:0;padding:4px 5px;border:0;background:transparent;color:#9da7b0;font-size:5px}.claim-menu .claim-close:hover{color:#fff;background:transparent}
    .claim-palette-group{margin:10px 0;padding-top:9px;border-top:1px solid #27323b}.claim-palette-title{display:block;color:#8d99a3;font-size:5px;margin-bottom:7px}
    .claim-swatches{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}.claim-swatch{position:relative!important;width:28px!important;height:28px!important;min-width:0!important;margin:0!important;padding:0!important;border:2px solid #394651!important;background:var(--swatch)!important;box-shadow:none!important}
    .claim-swatch.rainbow{background:linear-gradient(135deg,#ff3b30,#ffcc00,#34c759,#00e5ff,#0a84ff,#bf5af2,#ff2d55)!important}
    .claim-swatch.selected{border-color:#fff!important;outline:2px solid #00e5ff;outline-offset:1px}.claim-swatch:hover{transform:scale(1.08)}
    .claim-color-row{display:grid;grid-template-columns:42px 1fr;gap:8px;align-items:center;margin:8px 0}.claim-color-row input{width:42px;height:34px;border:1px solid #626e79;background:#060a0e;padding:2px}
    .claim-menu button{width:100%;margin-top:6px;padding:9px 6px;border:1px solid #596671;background:#14202a;color:#fff;font:6px 'Press Start 2P',monospace;cursor:pointer}.claim-menu button.primary{background:#18c66b;border-color:#18c66b}.claim-menu button.danger{border-color:#e83e45;color:#ff6b6b}.claim-menu button:hover{filter:brightness(1.13)}
  `;document.head.appendChild(style);

  const canvas=document.createElement('canvas');canvas.id='backgroundClaimCanvas';wall.appendChild(canvas);const ctx=canvas.getContext('2d');
  const tooltip=document.createElement('div');tooltip.className='claim-tooltip';document.body.appendChild(tooltip);
  const menu=document.createElement('div');menu.className='claim-menu hidden';document.body.appendChild(menu);
  const claims=new Map();let dpr=1,active=null,paletteCache=null,paletteAt=0;

  const me=()=>window.eixoGetPlayer?.()||(()=>{try{return JSON.parse(localStorage.getItem('eixo_player')||'null')}catch(_){return null}})();
  const key=(x,y)=>x+','+y;
  function resize(){dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.max(1,Math.floor(innerWidth*dpr));canvas.height=Math.max(1,Math.floor(innerHeight*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
  function tileFill(c,px,py){
    if(String(c.color).toLowerCase()!=='rainbow')return c.color;
    const g=ctx.createLinearGradient(px+1,py+1,px+TILE-2,py+TILE-2);
    [['#ff3b30',0],['#ffcc00',.18],['#34c759',.36],['#00e5ff',.54],['#0a84ff',.7],['#bf5af2',.85],['#ff2d55',1]].forEach(([color,at])=>g.addColorStop(at,color));
    return g;
  }
  function draw(){ctx.clearRect(0,0,innerWidth,innerHeight);for(const c of claims.values()){const px=c.x*TILE,py=c.y*TILE;if(px>=innerWidth||py>=innerHeight)continue;ctx.fillStyle=tileFill(c,px,py);ctx.fillRect(px+1,py+1,TILE-2,TILE-2);ctx.strokeStyle='rgba(0,0,0,.82)';ctx.lineWidth=1;ctx.strokeRect(px+.5,py+.5,TILE-1,TILE-1);}}
  async function load(){try{const r=await fetch('/api/background/claims',{cache:'no-store'}),d=await r.json();if(!r.ok)return;claims.clear();for(const c of d.claims||[])claims.set(key(c.x,c.y),c);draw();}catch(_){}}
  async function loadPalette(){
    const p=me();if(!p?.id)return{standard:['#ffffff','#e53935','#ff7a2f','#ffd43b','#39d98a','#00d4ff','#3b82f6','#b66cff'],vip:[],ranking:[]};
    if(paletteCache&&Date.now()-paletteAt<30000)return paletteCache;
    try{const r=await fetch('/api/background/palette?id='+encodeURIComponent(p.id)+'&token='+encodeURIComponent(p.token||''),{cache:'no-store',credentials:'same-origin'}),d=await r.json();if(!r.ok)throw Error(d.error||'Palette unavailable');paletteCache=d;paletteAt=Date.now();return d}catch(_){return{standard:['#ffffff','#e53935','#ff7a2f','#ffd43b','#39d98a','#00d4ff','#3b82f6','#b66cff'],vip:[],ranking:[]}}
  }
  function pos(e){return{x:Math.floor(e.clientX/TILE),y:Math.floor(e.clientY/TILE)}}
  function hideMenu(){menu.classList.add('hidden');active=null}
  function placeMenu(e){const w=270,h=Math.min(620,innerHeight*.78);menu.style.left=Math.max(8,Math.min(innerWidth-w-8,e.clientX+8))+'px';menu.style.top=Math.max(8,Math.min(innerHeight-h-8,e.clientY+8))+'px';}
  async function post(path,data){const r=await fetch(path,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(data||{})});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Request failed.');return d}
  function swatchGroup(label,values,seen){
    const list=(values||[]).map(v=>String(v).toLowerCase()).filter(v=>{if(seen.has(v))return false;seen.add(v);return true});
    if(!list.length)return'';
    return '<div class="claim-palette-group"><span class="claim-palette-title">'+esc(label)+'</span><div class="claim-swatches">'+list.map(v=>'<button type="button" class="claim-swatch'+(v==='rainbow'?' rainbow':'')+'" data-claim-color="'+esc(v)+'" style="'+(v==='rainbow'?'':'--swatch:'+esc(v))+'" title="'+esc(v==='rainbow'?tr().rainbow:v)+'" aria-label="'+esc(v==='rainbow'?tr().rainbow:v)+'"></button>').join('')+'</div></div>';
  }
  async function openMenu(e,x,y,claim){
    const p=me(),t=tr();active={x,y,claim,selectedColor:String(claim?.color||'#2f9bd1').toLowerCase()};const mine=claim&&p&&claim.ownerId===p.id,admin=p?.role==='admin';
    let chooser='';
    if(!claim||mine){
      const pal=await loadPalette(),seen=new Set();
      chooser=swatchGroup(t.standard,pal.standard,seen)+swatchGroup(t.vip,pal.vip,seen)+swatchGroup(t.ranking,pal.ranking,seen)+
        '<div class="claim-palette-group"><span class="claim-palette-title">'+esc(t.custom)+'</span><div class="claim-color-row"><input id="claimColor" type="color" value="'+esc(/^#[0-9a-f]{6}$/i.test(active.selectedColor)?active.selectedColor:'#2f9bd1')+'"><span>'+esc(t.choose)+'</span></div></div>'+
        '<button class="primary" data-claim-save>'+(claim?esc(t.save):esc(t.take))+'</button>';
    }else chooser='<div class="claim-owner">'+esc(t.owned)+'</div>';
    if(!active)return;
    menu.innerHTML='<button type="button" class="claim-close" data-claim-close>'+esc(t.close)+'</button><strong>'+(claim?esc(t.claimed):esc(t.claim))+'</strong>'+(claim?'<div class="claim-owner">'+esc(t.owner)+': '+esc(claim.ownerName)+'</div>':'')+chooser+(admin&&claim?'<button class="danger" data-claim-clear>CLEAR THIS PIXEL</button><button class="danger" data-claim-clear-all>CLEAR ALL OWNER PIXELS</button><button class="danger" data-claim-ban24>CLEAR + BAN 24H</button><button class="danger" data-claim-banperm>CLEAR + PERMANENT BAN</button>':'');
    menu.classList.remove('hidden');placeMenu(e);refreshSelected();
    $('claimColor')?.addEventListener('input',ev=>{if(!active)return;active.selectedColor=ev.target.value.toLowerCase();refreshSelected()});
  }
  function refreshSelected(){if(!active)return;menu.querySelectorAll('[data-claim-color]').forEach(b=>b.classList.toggle('selected',b.dataset.claimColor===active.selectedColor));}
  canvas.addEventListener('pointermove',e=>{const{x,y}=pos(e),c=claims.get(key(x,y));if(c){tooltip.style.display='block';tooltip.style.left=Math.min(innerWidth-230,e.clientX+12)+'px';tooltip.style.top=Math.min(innerHeight-45,e.clientY+12)+'px';tooltip.textContent='PIXEL · '+c.ownerName;}else tooltip.style.display='none';});
  canvas.addEventListener('pointerleave',()=>tooltip.style.display='none');
  canvas.addEventListener('click',e=>{e.stopPropagation();const{x,y}=pos(e),c=claims.get(key(x,y)),p=me(),at={clientX:e.clientX,clientY:e.clientY};if(!p){window.eixoOpenAuth?.('login');return;}openMenu(at,x,y,c);});
  document.addEventListener('click',e=>{if(!e.target.closest('.claim-menu')&&e.target!==canvas)hideMenu()});
  menu.addEventListener('click',async e=>{
    if(e.target.closest('[data-claim-close]')){hideMenu();return;}
    const colorButton=e.target.closest('[data-claim-color]');
    if(colorButton&&active){active.selectedColor=colorButton.dataset.claimColor;const input=$('claimColor');if(input&&/^#[0-9a-f]{6}$/i.test(active.selectedColor))input.value=active.selectedColor;refreshSelected();return;}
    const b=e.target.closest('button');if(!b||!active)return;const p=me();if(!p)return;
    b.disabled=true;
    try{
      if(b.matches('[data-claim-save]')){const color=active.selectedColor||$('claimColor')?.value||'#2f9bd1';await post('/api/background/claim',{id:p.id,token:p.token,x:active.x,y:active.y,color});}
      if(b.matches('[data-claim-clear]'))await post('/api/admin/background/clear',{id:p.id,token:p.token,x:active.x,y:active.y});
      if(b.matches('[data-claim-clear-all]'))await post('/api/admin/background/clear',{id:p.id,token:p.token,x:active.x,y:active.y,allOwner:true});
      if(b.matches('[data-claim-ban24]')){await post('/api/admin/background/clear',{id:p.id,token:p.token,x:active.x,y:active.y,allOwner:true});await post('/api/moderation/ban',{id:p.id,token:p.token,targetId:active.claim.ownerId,hours:24,reason:'Background pixel abuse.'});}
      if(b.matches('[data-claim-banperm]')){await post('/api/admin/background/clear',{id:p.id,token:p.token,x:active.x,y:active.y,allOwner:true});await post('/api/moderation/ban',{id:p.id,token:p.token,targetId:active.claim.ownerId,permanent:true,reason:'Background pixel abuse.'});}
      hideMenu();await load();
    }catch(err){b.disabled=false;alert(err.message);}
  });
  window.addEventListener('resize',resize);window.addEventListener('eixo-player-updated',()=>{paletteCache=null;load()});resize();load();setInterval(load,30000);
})();
