/* EIXO V1.1.16 — standalone player name customization */
(function(){
 const $=id=>document.getElementById(id);
 const get=()=>{try{return JSON.parse(localStorage.getItem('eixo_player')||'null')}catch(_){return null}};
 const open=()=>{const m=$('playerCustomizeModal');if(m)m.classList.remove('hidden')};
 const close=()=>{const m=$('playerCustomizeModal');if(m)m.classList.add('hidden')};
 const auth=()=>{const p=get();return p?.id&&p?.token?{id:p.id,token:p.token}:null};
 const ALL=['#ffffff','#ff4d4d','#ff7a2f','#ffd43b','#7bdc5a','#39d98a','#00d4ff','#3b82f6','#6f5cff','#b66cff','#ff4fd8','#ff6b9d','#a8e063','#00f0ff','#f97316','#facc15','#94a3b8','#e2e8f0','#22c55e','#ef4444','rainbow'];
 const WORLD=['#39d98a','#3b82f6','#f59e0b'],COUNTRY=['#ffd43b','#b66cff','#ff7a2f'],OTHER=['#00d4ff','#ff4fd8','#ffffff'];
 const EFFECTS=[['none','Nenhum'],['bounce','Salta'],['glow','Brilha'],['wave','Onda'],['shake','Treme'],['float','Flutua'],['pulse','Pulsa'],['jelly','Gelatina']];
 async function rank(){const a=auth();if(!a)throw Error('Sessão inválida.');const r=await fetch('/api/player-rank?id='+encodeURIComponent(a.id)+'&token='+encodeURIComponent(a.token),{cache:'no-store'});if(!r.ok)throw Error('Ranking indisponível.');const d=await r.json();return{world:Number(d.worldRank)||9999,country:Number(d.countryRank)||9999};}
 function preview(){const n=$('playerCustomizeName'),c=$('playerCustomizeColor'),e=$('playerCustomizeEffect'),p=$('playerCustomizePreview');if(!p)return;p.textContent=n?.value||get()?.name||'JOGADOR';p.className='name-preview '+(e?.value?'effect-'+e.value:'effect-none')+(c?.value==='rainbow'?' name-rainbow':'');p.style.color=c?.value==='rainbow'?'#fff':(c?.value||'#fff');}
 async function show(){
   const p=get();if(!p)return;
   const m=$('playerCustomizeModal'),hint=$('playerCustomizeHint'),name=$('playerCustomizeName'),color=$('playerCustomizeColor'),effect=$('playerCustomizeEffect'),err=$('playerCustomizeError');
   err.textContent='';hint.textContent='A verificar a tua posição no ranking...';name.value=p.visualName||p.name||'';open();
   try{
    const r=await rank(),w1=r.world===1,w23=r.world===2||r.world===3,c1=r.country===1,c23=r.country===2||r.country===3,eligible=w1||w23||c1||c23;
    color.innerHTML='';effect.innerHTML='';
    if(!eligible){hint.textContent='A personalização está disponível apenas para TOP 1/2/3 mundial ou TOP 1/2/3 do país.';return;}
    let colors=w1?ALL:w23?WORLD:c1?COUNTRY:OTHER;
    color.innerHTML=colors.map(x=>'<option value="'+x+'">'+(x==='rainbow'?'ARCO-ÍRIS':x)+'</option>').join('');
    color.value=colors.includes(p.nameColor)?p.nameColor:colors[0];
    const canEffect=w1||r.world===2||r.country===1||r.country===2;
    effect.innerHTML=EFFECTS.map(x=>'<option value="'+x[0]+'">'+x[1]+'</option>').join('');
    effect.value=canEffect?(p.nameEffect||'none'):'none';
    name.disabled=!w1;
    hint.textContent=w1?'TOP 1 MUNDIAL: podes mudar o nome visual, cor e efeito. O nome oficial não muda.':w23?'TOP 2/3 MUNDIAL: podes escolher as cores especiais.' :c1?'TOP 1 DO PAÍS: podes escolher as cores nacionais e efeitos.':'TOP 2/3 DO PAÍS: podes escolher as cores reservadas.';
    preview();
   }catch(e){err.textContent=e.message;hint.textContent='Não foi possível carregar as opções.';}
 }
 async function save(){
   const a=auth(),err=$('playerCustomizeError');if(!a)return;err.textContent='';
   try{const r=await fetch('/api/profile/customize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:a.id,token:a.token,visualName:$('playerCustomizeName').value,color:$('playerCustomizeColor').value,effect:$('playerCustomizeEffect').value})}),d=await r.json();if(!r.ok)throw Error(d.error||'Não foi possível guardar.');localStorage.setItem('eixo_player',JSON.stringify({...get(),...d.player,token:a.token}));window.dispatchEvent(new Event('eixo-player-updated'));close();window.eixoRefreshRankings?.();}catch(e){err.textContent=e.message;}
 }
 function add(){if($('playerCustomizeModal'))return;const m=document.createElement('div');m.id='playerCustomizeModal';m.className='modal-backdrop hidden';m.innerHTML='<div class="modal-card form-modal player-customize-modal" role="dialog" aria-modal="true"><button class="modal-close" id="playerCustomizeClose" type="button">FECHAR</button><h2>PERSONALIZAR NOME</h2><p id="playerCustomizeHint">As opções disponíveis dependem da tua posição no ranking.</p><label class="field-label">NOME VISUAL<input id="playerCustomizeName" class="pixel-input" maxlength="16" autocomplete="off"></label><label class="field-label">COR DO NOME<select id="playerCustomizeColor" class="pixel-input"></select></label><label class="field-label">EFEITO<select id="playerCustomizeEffect" class="pixel-input"></select></label><div class="name-preview" id="playerCustomizePreview">JOGADOR</div><div class="form-error" id="playerCustomizeError"></div><button class="modal-button primary" id="playerCustomizeSave" type="button">GUARDAR</button></div>';document.body.appendChild(m);
  m.addEventListener('click',e=>{if(e.target===m)close()});$('playerCustomizeClose').addEventListener('click',close);$('playerCustomizeSave').addEventListener('click',save);
  ['playerCustomizeName','playerCustomizeColor','playerCustomizeEffect'].forEach(id=>$(id)?.addEventListener('input',preview));
 }
 add();window.eixoOpenPlayerCustomize=show;
})();