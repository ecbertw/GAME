/* EIXO persistent background claims. */
(function(){
  'use strict';
  const TILE=12,$=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const wall=$('pixelWall');if(!wall)return;
  const style=document.createElement('style');style.textContent=`
    #backgroundClaimCanvas{position:absolute;inset:0;z-index:5;width:100%;height:100%;pointer-events:auto;image-rendering:pixelated}
    .claim-tooltip{position:fixed;z-index:90;display:none;padding:7px 8px;background:#070c11;border:1px solid #626e79;color:#fff;font:6px/1.6 'Press Start 2P',monospace;pointer-events:none;box-shadow:3px 3px 0 #020407;max-width:220px}
    .claim-menu{position:fixed;z-index:95;width:235px;background:#080d12;border:2px solid #626e79;box-shadow:6px 6px 0 #020407;padding:10px;color:#fff;font:6px/1.6 'Press Start 2P',monospace}
    .claim-menu.hidden{display:none}.claim-menu strong{display:block;margin-bottom:8px;font-size:7px}.claim-owner{color:#8f9aa5;margin-bottom:8px}.claim-color-row{display:grid;grid-template-columns:42px 1fr;gap:8px;align-items:center;margin:8px 0}.claim-color-row input{width:42px;height:34px;border:1px solid #626e79;background:#060a0e;padding:2px}.claim-menu button{width:100%;margin-top:6px;padding:9px 6px;border:1px solid #596671;background:#14202a;color:#fff;font:6px 'Press Start 2P',monospace;cursor:pointer}.claim-menu button.primary{background:#18c66b;border-color:#18c66b}.claim-menu button.danger{border-color:#e83e45;color:#ff6b6b}.claim-menu button:hover{filter:brightness(1.13)}
  `;document.head.appendChild(style);

  const canvas=document.createElement('canvas');canvas.id='backgroundClaimCanvas';wall.appendChild(canvas);const ctx=canvas.getContext('2d');
  const tooltip=document.createElement('div');tooltip.className='claim-tooltip';document.body.appendChild(tooltip);
  const menu=document.createElement('div');menu.className='claim-menu hidden';document.body.appendChild(menu);
  const claims=new Map();let dpr=1,active=null;

  const me=()=>window.eixoGetPlayer?.()||(()=>{try{return JSON.parse(localStorage.getItem('eixo_player')||'null')}catch(_){return null}})();
  const key=(x,y)=>x+','+y;
  function resize(){dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.max(1,Math.floor(innerWidth*dpr));canvas.height=Math.max(1,Math.floor(innerHeight*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
  function draw(){ctx.clearRect(0,0,innerWidth,innerHeight);for(const c of claims.values()){const px=c.x*TILE,py=c.y*TILE;if(px>=innerWidth||py>=innerHeight)continue;ctx.fillStyle=c.color;ctx.fillRect(px+1,py+1,TILE-2,TILE-2);ctx.strokeStyle='rgba(0,0,0,.82)';ctx.lineWidth=1;ctx.strokeRect(px+.5,py+.5,TILE-1,TILE-1);}}
  async function load(){try{const r=await fetch('/api/background/claims',{cache:'no-store'}),d=await r.json();if(!r.ok)return;claims.clear();for(const c of d.claims||[])claims.set(key(c.x,c.y),c);draw();}catch(_){}}
  function pos(e){return{x:Math.floor(e.clientX/TILE),y:Math.floor(e.clientY/TILE)}}
  function hideMenu(){menu.classList.add('hidden');active=null}
  function placeMenu(e){const w=235,h=260;menu.style.left=Math.max(8,Math.min(innerWidth-w-8,e.clientX+8))+'px';menu.style.top=Math.max(8,Math.min(innerHeight-h-8,e.clientY+8))+'px';}
  async function post(path,data){const r=await fetch(path,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(data||{})});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Request failed.');return d}
  function openMenu(e,x,y,claim){
    const p=me();active={x,y,claim};const mine=claim&&p&&claim.ownerId===p.id,admin=p?.role==='admin';
    menu.innerHTML='<strong>'+(claim?'CLAIMED PIXEL':'CLAIM PIXEL')+'</strong>'+(claim?'<div class="claim-owner">OWNER: '+esc(claim.ownerName)+'</div>':'')+((!claim||mine)?'<div class="claim-color-row"><input id="claimColor" type="color" value="'+esc(claim?.color||'#2f9bd1')+'"><span>CHOOSE COLOR</span></div><button class="primary" data-claim-save>'+(claim?'SAVE COLOR':'CLAIM PIXEL')+'</button>':'<div class="claim-owner">THIS PIXEL ALREADY HAS AN OWNER.</div>')+(admin&&claim?'<button class="danger" data-claim-clear>CLEAR THIS PIXEL</button><button class="danger" data-claim-clear-all>CLEAR ALL OWNER PIXELS</button><button class="danger" data-claim-ban24>CLEAR + BAN 24H</button><button class="danger" data-claim-banperm>CLEAR + PERMANENT BAN</button>':'');
    menu.classList.remove('hidden');placeMenu(e);
  }
  canvas.addEventListener('pointermove',e=>{const{x,y}=pos(e),c=claims.get(key(x,y));if(c){tooltip.style.display='block';tooltip.style.left=Math.min(innerWidth-230,e.clientX+12)+'px';tooltip.style.top=Math.min(innerHeight-45,e.clientY+12)+'px';tooltip.textContent='PIXEL · '+c.ownerName;}else tooltip.style.display='none';});
  canvas.addEventListener('pointerleave',()=>tooltip.style.display='none');
  canvas.addEventListener('click',e=>{e.stopPropagation();const{x,y}=pos(e),c=claims.get(key(x,y)),p=me();if(!p){window.eixoOpenAuth?.('login');return;}openMenu(e,x,y,c);});
  document.addEventListener('click',e=>{if(!e.target.closest('.claim-menu')&&e.target!==canvas)hideMenu()});
  menu.addEventListener('click',async e=>{
    const b=e.target.closest('button');if(!b||!active)return;const p=me();if(!p)return;
    b.disabled=true;
    try{
      if(b.matches('[data-claim-save]')){const color=$('claimColor')?.value||'#2f9bd1';await post('/api/background/claim',{id:p.id,token:p.token,x:active.x,y:active.y,color});}
      if(b.matches('[data-claim-clear]'))await post('/api/admin/background/clear',{id:p.id,token:p.token,x:active.x,y:active.y});
      if(b.matches('[data-claim-clear-all]'))await post('/api/admin/background/clear',{id:p.id,token:p.token,x:active.x,y:active.y,allOwner:true});
      if(b.matches('[data-claim-ban24]')){await post('/api/admin/background/clear',{id:p.id,token:p.token,x:active.x,y:active.y,allOwner:true});await post('/api/moderation/ban',{id:p.id,token:p.token,targetId:active.claim.ownerId,hours:24,reason:'Background pixel abuse.'});}
      if(b.matches('[data-claim-banperm]')){await post('/api/admin/background/clear',{id:p.id,token:p.token,x:active.x,y:active.y,allOwner:true});await post('/api/moderation/ban',{id:p.id,token:p.token,targetId:active.claim.ownerId,permanent:true,reason:'Background pixel abuse.'});}
      hideMenu();await load();
    }catch(err){b.disabled=false;alert(err.message);}
  });
  window.addEventListener('resize',resize);window.addEventListener('eixo-player-updated',load);resize();load();setInterval(load,10000);
})();