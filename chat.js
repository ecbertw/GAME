/* EIXO chat — global and national channels. Polling keeps the backend simple and reliable for now. */
(function(){
  const $=id=>document.getElementById(id);
  const getPlayer=()=>{try{return JSON.parse(localStorage.getItem('eixo_player')||'null')}catch(_){return null}};
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const flag=code=>[...String(code||'')].map(c=>String.fromCodePoint(127397+c.charCodeAt())).join('');
  const safeColor=v=>/^#[0-9a-f]{6}$/i.test(String(v||''))?String(v):'';
  const safeEffect=v=>/^[a-z]+$/.test(String(v||''))?String(v):'none';
  const letters=(text,styles)=>{
    const arr=Array.isArray(styles)?styles:[];
    return [...String(text||'')].map((ch,i)=>{
      const s=arr[i]||{},rawColor=String(s.color||'').toLowerCase(),c=safeColor(rawColor),e=safeEffect(s.effect);
      const rainbow=rawColor==='rainbow';
      const delay=(-i*0.08).toFixed(2)+'s';
      return '<span class="name-letter'+(rainbow?' name-rainbow':'')+' effect-'+esc(e)+'"'+(c?' style="color:'+esc(c)+'"':'')+' style="animation-delay:'+delay+'">'+esc(ch)+'</span>';
    }).join('');
  };
  const tag=(type,n,country,p)=>{
    const raw=type==='global'?(p.tagGlobalColor||'#e53935'):(p.tagCountryColor||'#ff7a2f');
    const c=String(raw).toLowerCase(),rainbow=c==='rainbow';
    const label=type==='global'?'GLOBAL':esc(country);
    const style=!rainbow&&safeColor(c)?' style="background:'+esc(c)+'!important;color:#fff!important"':'';
    return '<span class="rank-tag '+type+'-'+Number(n)+(rainbow?' tag-rainbow':'')+'"'+style+'>'+Number(n)+'# '+label+'</span>';
  };
  const vip=n=>Number(n)>0?'<span class="vip-rank-tag vip-rank-'+Math.min(Number(n),6)+'">'+(Number(n)>=6?'VIP ∞':'VIP #'+Number(n))+'</span>':'';
  let channel='global',timer=0,loading=false;
  const messages=$('chatMessages'),input=$('chatInput'),form=$('chatForm'),status=$('chatStatus'),gTab=$('chatGlobalTab'),nTab=$('chatNationalTab');
  if(!messages||!input||!form||!gTab||!nTab)return;

  function setChannel(next){
    channel=next==='national'?'national':'global';
    gTab.classList.toggle('active',channel==='global');nTab.classList.toggle('active',channel==='national');
    gTab.setAttribute('aria-selected',String(channel==='global'));nTab.setAttribute('aria-selected',String(channel==='national'));
    const p=getPlayer(),c=String(p?.country||'PT').toUpperCase();
    const countryName=document.getElementById('countryName')?.textContent||c;
    nTab.textContent=flag(c)+' '+countryName;
    input.placeholder=channel==='global'?'ESCREVE UMA MENSAGEM...':'ESCREVE PARA O TEU PAÍS...';
    load(true);
  }

  function render(data,forceBottom){
    const rows=Array.isArray(data?.messages)?data.messages:[];
    if(!rows.length){messages.innerHTML='<div class="chat-empty">AINDA NÃO HÁ MENSAGENS.<br>SEJA O PRIMEIRO A FALAR.</div>';return;}
    const nearBottom=messages.scrollHeight-messages.scrollTop-messages.clientHeight<60;
    messages.innerHTML=rows.map(m=>{
      const world=Number(m.worldRank||9999),countryRank=Number(m.countryRank||9999);
      const top=channel==='global'?(world<=3?tag('global',world,m.country,m):''):(countryRank<=3?tag('national',countryRank,m.country,m):'');
      const v=Number(m.vipLevel||0),visual=m.visualName||m.name;
      const color=String(m.nameColor||'#fff').toLowerCase(),rainbow=color==='rainbow';
      const style=!rainbow&&safeColor(color)?' style="color:'+esc(color)+'"':'';
      const effect=hasLetters?'none':safeEffect(m.nameEffect);
      const hasLetters=v>0&&Array.isArray(m.letterStyles)&&m.letterStyles.length;
      const name=hasLetters?letters(visual,m.letterStyles):[...String(visual)].map(ch=>'<span class="name-letter">'+esc(ch)+'</span>').join('');
      const when=m.createdAt?new Date(m.createdAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}):'';
      return '<article class="chat-message"><div class="chat-avatar" aria-hidden="true">◆</div><div class="chat-content"><div class="chat-author"><span class="chat-name'+(rainbow?' name-rainbow':'')+(effect!=='none'?' effect-'+esc(effect):'')+'"'+style+'>'+name+'</span>'+top+vip(v)+'<span class="chat-time">'+esc(when)+'</span></div><div class="chat-text">'+esc(m.message)+'</div></div></article>';
    }).join('');
    if(forceBottom||nearBottom)messages.scrollTop=messages.scrollHeight;
  }

  async function load(forceBottom=false){
    const p=getPlayer();if(!p?.id||!p?.token){input.disabled=true;status.textContent='ENTRA NO JOGO PARA USAR O CHAT.';messages.innerHTML='<div class="chat-empty">CRIA O TEU JOGADOR PARA ENTRAR NO CHAT.</div>';return;}
    if(loading)return;loading=true;
    try{
      const r=await fetch('/api/chat?id='+encodeURIComponent(p.id)+'&token='+encodeURIComponent(p.token)+'&channel='+encodeURIComponent(channel),{cache:'no-store'});
      const d=await r.json();if(!r.ok)throw Error(d.error||'Chat indisponível.');
      input.disabled=false;status.textContent=channel==='global'?'TODOS OS JOGADORES':'APENAS '+(document.getElementById('countryName')?.textContent||p.country);
      render(d,forceBottom);
    }catch(e){status.textContent=e.message||'CHAT INDISPONÍVEL';}
    finally{loading=false;}
  }

  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const p=getPlayer(),text=input.value.trim();
    if(!p?.id||!p?.token||!text||loading)return;
    if([...text].length>300){status.textContent='MENSAGEM DEMASIADO LONGA (MÁX. 300).';return;}
    const button=form.querySelector('button');button.disabled=true;input.disabled=true;status.textContent='A ENVIAR...';
    try{
      const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,token:p.token,channel,message:text})});
      const d=await r.json();if(!r.ok)throw Error(d.error||'Não foi possível enviar.');
      input.value='';await load(true);
    }catch(e){status.textContent=e.message||'NÃO FOI POSSÍVEL ENVIAR.';input.disabled=false;}
    finally{button.disabled=false;}
  });
  gTab.addEventListener('click',()=>setChannel('global'));
  nTab.addEventListener('click',()=>setChannel('national'));
  window.addEventListener('eixo-player-updated',()=>{setChannel(channel)});
  window.addEventListener('storage',()=>load(false));
  load(true);timer=setInterval(()=>load(false),2500);
})();