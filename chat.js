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
      return '<span class="name-letter'+(rainbow?' name-rainbow':'')+' effect-'+esc(e)+'" style="'+(c?'color:'+esc(c)+';':'')+'animation-delay:'+delay+'">'+esc(ch)+'</span>';
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
  const chatI18n={
    pt:{title:'CHAT',global:'GLOBAL',all:'TODOS OS JOGADORES',only:'APENAS',write:'ESCREVE UMA MENSAGEM...',writeN:'ESCREVE PARA O TEU PAÍS...',hint:'MÁX. 300 CARACTERES · EVITA SPAM',empty:'AINDA NÃO HÁ MENSAGENS.<br>SEJA O PRIMEIRO A FALAR.',need:'CRIA O TEU JOGADOR PARA ENTRAR NO CHAT.',sending:'A ENVIAR...'},
    en:{title:'CHAT',global:'GLOBAL',all:'ALL PLAYERS',only:'ONLY',write:'WRITE A MESSAGE...',writeN:'WRITE TO YOUR COUNTRY...',hint:'MAX. 300 CHARACTERS · AVOID SPAM',empty:'NO MESSAGES YET.<br>BE THE FIRST TO SPEAK.',need:'CREATE YOUR PLAYER TO USE THE CHAT.',sending:'SENDING...'},
    es:{title:'CHAT',global:'GLOBAL',all:'TODOS LOS JUGADORES',only:'SOLO',write:'ESCRIBE UN MENSAJE...',writeN:'ESCRIBE PARA TU PAÍS...',hint:'MÁX. 300 CARACTERES · EVITA EL SPAM',empty:'AÚN NO HAY MENSAJES.<br>SÉ EL PRIMERO EN HABLAR.',need:'CREA TU JUGADOR PARA USAR EL CHAT.',sending:'ENVIANDO...'},
    fr:{title:'CHAT',global:'GLOBAL',all:'TOUS LES JOUEURS',only:'SEULEMENT',write:'ÉCRIS UN MESSAGE...',writeN:'ÉCRIS POUR TON PAYS...',hint:'MAX. 300 CARACTÈRES · ÉVITE LE SPAM',empty:'AUCUN MESSAGE POUR LE MOMENT.<br>SOIS LE PREMIER À PARLER.',need:'CRÉE TON JOUEUR POUR UTILISER LE CHAT.',sending:'ENVOI...'},
    de:{title:'CHAT',global:'GLOBAL',all:'ALLE SPIELER',only:'NUR',write:'NACHRICHT SCHREIBEN...',writeN:'FÜR DEIN LAND SCHREIBEN...',hint:'MAX. 300 ZEICHEN · SPAM VERMEIDEN',empty:'NOCH KEINE NACHRICHTEN.<br>SEI DER ERSTE.',need:'ERSTELLE DEINEN SPIELER FÜR DEN CHAT.',sending:'WIRD GESENDET...'},
    it:{title:'CHAT',global:'GLOBALE',all:'TUTTI I GIOCATORI',only:'SOLO',write:'SCRIVI UN MESSAGGIO...',writeN:'SCRIVI PER IL TUO PAESE...',hint:'MAX. 300 CARATTERI · EVITA LO SPAM',empty:'NESSUN MESSAGGIO.<br>SII IL PRIMO A PARLARE.',need:'CREA IL TUO GIOCATORE PER USARE LA CHAT.',sending:'INVIO...'},
    ja:{title:'チャット',global:'全体',all:'全プレイヤー',only:'対象',write:'メッセージを書く...',writeN:'国のチャットに書く...',hint:'最大300文字 · スパム禁止',empty:'まだメッセージはありません。<br>最初に話しましょう。',need:'プレイヤーを作成するとチャットを利用できます。',sending:'送信中...'},
    ko:{title:'채팅',global:'전체',all:'모든 플레이어',only:'대상',write:'메시지를 입력하세요...',writeN:'국가 채팅에 입력하세요...',hint:'최대 300자 · 스팸 금지',empty:'아직 메시지가 없습니다.<br>첫 번째로 이야기해 보세요.',need:'플레이어를 만들면 채팅을 사용할 수 있습니다.',sending:'전송 중...'},
    zh:{title:'聊天',global:'全球',all:'所有玩家',only:'仅',write:'输入消息...',writeN:'发送到国家频道...',hint:'最多300个字符 · 请勿刷屏',empty:'暂无消息。<br>来发第一条吧。',need:'创建玩家后即可使用聊天。',sending:'发送中...'},
    ru:{title:'ЧАТ',global:'МИР',all:'ВСЕ ИГРОКИ',only:'ТОЛЬКО',write:'НАПИШИТЕ СООБЩЕНИЕ...',writeN:'НАПИШИТЕ ДЛЯ СВОЕЙ СТРАНЫ...',hint:'МАКС. 300 СИМВОЛОВ · БЕЗ СПАМА',empty:'СООБЩЕНИЙ ПОКА НЕТ.<br>БУДЬТЕ ПЕРВЫМ.',need:'СОЗДАЙТЕ ИГРОКА, ЧТОБЫ ИСПОЛЬЗОВАТЬ ЧАТ.',sending:'ОТПРАВКА...'},
    pl:{title:'CZAT',global:'GLOBALNY',all:'WSZYSCY GRACZE',only:'TYLKO',write:'NAPISZ WIADOMOŚĆ...',writeN:'NAPISZ DO SWOJEGO KRAJU...',hint:'MAKS. 300 ZNAKÓW · UNIKAJ SPAMU',empty:'BRAK WIADOMOŚCI.<br>BĄDŹ PIERWSZY.',need:'UTWÓRZ GRACZA, ABY KORZYSTAĆ Z CZATU.',sending:'WYSYŁANIE...'},
    nl:{title:'CHAT',global:'WERELD',all:'ALLE SPELERS',only:'ALLEEN',write:'SCHRIJF EEN BERICHT...',writeN:'SCHRIJF VOOR JE LAND...',hint:'MAX. 300 TEKENS · GEEN SPAM',empty:'NOG GEEN BERICHTEN.<br>WEES DE EERSTE.',need:'MAAK EEN SPELER OM DE CHAT TE GEBRUIKEN.',sending:'VERZENDEN...'},
    tr:{title:'SOHBET',global:'GLOBAL',all:'TÜM OYUNCULAR',only:'SADECE',write:'MESAJ YAZ...',writeN:'ÜLKEN İÇİN YAZ...',hint:'MAKS. 300 KARAKTER · SPAM YAPMA',empty:'HENÜZ MESAJ YOK.<br>İLK SEN KONUŞ.',need:'SOHBETİ KULLANMAK İÇİN OYUNCU OLUŞTUR.',sending:'GÖNDERİLİYOR...'},
    ar:{title:'الدردشة',global:'عالمي',all:'جميع اللاعبين',only:'فقط',write:'اكتب رسالة...',writeN:'اكتب لبلدك...',hint:'الحد الأقصى 300 حرف · تجنب الإزعاج',empty:'لا توجد رسائل بعد.<br>كن أول من يتحدث.',need:'أنشئ لاعباً لاستخدام الدردشة.',sending:'جارٍ الإرسال...'},
    sv:{title:'CHATT',global:'GLOBAL',all:'ALLA SPELARE',only:'ENDAST',write:'SKRIV ETT MEDDELANDE...',writeN:'SKRIV TILL DITT LAND...',hint:'MAX 300 TECKEN · UNDVIK SPAM',empty:'INGA MEDDELANDEN ÄN.<br>VAR FÖRST.',need:'SKAPA EN SPELARE FÖR ATT ANVÄNDA CHATTEN.',sending:'SKICKAR...'},
    no:{title:'CHAT',global:'GLOBAL',all:'ALLE SPILLERE',only:'BARE',write:'SKRIV EN MELDING...',writeN:'SKRIV TIL LANDET DITT...',hint:'MAKS 300 TEGN · UNNGÅ SPAM',empty:'INGEN MELDINGER ENNÅ.<br>VÆR DEN FØRSTE.',need:'OPPRETT EN SPILLER FOR Å BRUKE CHATEN.',sending:'SENDER...'},
    da:{title:'CHAT',global:'GLOBAL',all:'ALLE SPILLERE',only:'KUN',write:'SKRIV EN BESKED...',writeN:'SKRIV TIL DIT LAND...',hint:'MAKS. 300 TEGN · UNDGÅ SPAM',empty:'INGEN BESKEDER ENDNU.<br>VÆR DEN FØRSTE.',need:'OPRET EN SPILLER FOR AT BRUGE CHAT.',sending:'SENDER...'},
    fi:{title:'CHAT',global:'MAAILMA',all:'KAIKKI PELAAJAT',only:'VAIN',write:'KIRJOITA VIESTI...',writeN:'KIRJOITA MAASI CHATTIIN...',hint:'ENINT. 300 MERKKIÄ · EI ROSKAPOSTIA',empty:'EI VIESTEJÄ VIELÄ.<br>OLE ENSIMMÄINEN.',need:'LUO PELAAJA KÄYTTÄÄKSESI CHATTIÄ.',sending:'LÄHETETÄÄN...'},
    el:{title:'ΣΥΝΟΜΙΛΙΑ',global:'ΠΑΓΚΟΣΜΙΑ',all:'ΟΛΟΙ ΟΙ ΠΑΙΚΤΕΣ',only:'ΜΟΝΟ',write:'ΓΡΑΨΕ ΜΗΝΥΜΑ...',writeN:'ΓΡΑΨΕ ΓΙΑ ΤΗ ΧΩΡΑ ΣΟΥ...',hint:'ΜΑΞ. 300 ΧΑΡΑΚΤΗΡΕΣ · ΑΠΟΦΥΓΕ SPAM',empty:'ΔΕΝ ΥΠΑΡΧΟΥΝ ΜΗΝΥΜΑΤΑ.<br>ΜΙΛΗΣΕ ΠΡΩΤΟΣ.',need:'ΔΗΜΙΟΥΡΓΗΣΕ ΠΑΙΚΤΗ ΓΙΑ ΝΑ ΧΡΗΣΙΜΟΠΟΙΗΣΕΙΣ ΤΗ ΣΥΝΟΜΙΛΙΑ.',sending:'ΑΠΟΣΤΟΛΗ...'},
    cs:{title:'CHAT',global:'GLOBÁLNÍ',all:'VŠICHNI HRÁČI',only:'POUZE',write:'NAPIŠ ZPRÁVU...',writeN:'NAPIŠ SVÉ ZEMI...',hint:'MAX. 300 ZNAKŮ · ŽÁDNÝ SPAM',empty:'ZATÍM ŽÁDNÉ ZPRÁVY.<br>BUĎ PRVNÍ.',need:'VYTVOŘ HRÁČE PRO POUŽITÍ CHATU.',sending:'ODESÍLÁNÍ...'},
    id:{title:'CHAT',global:'GLOBAL',all:'SEMUA PEMAIN',only:'HANYA',write:'TULIS PESAN...',writeN:'TULIS UNTUK NEGARAMU...',hint:'MAKS. 300 KARAKTER · HINDARI SPAM',empty:'BELUM ADA PESAN.<br>JADILAH YANG PERTAMA.',need:'BUAT PEMAIN UNTUK MENGGUNAKAN CHAT.',sending:'MENGIRIM...'},
    th:{title:'แชท',global:'ทั่วโลก',all:'ผู้เล่นทั้งหมด',only:'เฉพาะ',write:'เขียนข้อความ...',writeN:'เขียนถึงประเทศของคุณ...',hint:'สูงสุด 300 ตัวอักษร · ห้ามสแปม',empty:'ยังไม่มีข้อความ<br>มาเป็นคนแรกกัน',need:'สร้างผู้เล่นเพื่อใช้แชท',sending:'กำลังส่ง...'},
    vi:{title:'TRÒ CHUYỆN',global:'TOÀN CẦU',all:'TẤT CẢ NGƯỜI CHƠI',only:'CHỈ',write:'VIẾT TIN NHẮN...',writeN:'VIẾT CHO QUỐC GIA CỦA BẠN...',hint:'TỐI ĐA 300 KÝ TỰ · TRÁNH SPAM',empty:'CHƯA CÓ TIN NHẮN.<br>HÃY LÀ NGƯỜI ĐẦU TIÊN.',need:'TẠO NGƯỜI CHƠI ĐỂ DÙNG TRÒ CHUYỆN.',sending:'ĐANG GỬI...'},
    he:{title:'צ׳אט',global:'עולמי',all:'כל השחקנים',only:'רק',write:'כתבו הודעה...',writeN:'כתבו למדינה שלכם...',hint:'מקסימום 300 תווים · הימנעו מספאם',empty:'אין הודעות עדיין.<br>היו הראשונים.',need:'צרו שחקן כדי להשתמש בצ׳אט.',sending:'שולח...'}
  };
  const ct=()=>window.EixoExtraLocales?.[String(document.documentElement.lang||'en').split('-')[0]]?.chat||chatI18n[document.documentElement.lang]||chatI18n.en;
  let channel='global',timer=0,loading=false;
  const messages=$('chatMessages'),input=$('chatInput'),form=$('chatForm'),status=$('chatStatus'),gTab=$('chatGlobalTab'),nTab=$('chatNationalTab');
  if(!messages||!input||!form||!gTab||!nTab)return;
  function playerCountryLabel(){
    const p=getPlayer(),cc=String(p?.country||'PT').toUpperCase(),lang=document.documentElement.lang||'en';
    const name=window.eixoLocalizedCountryName?.(cc,lang)||cc;
    const safe=esc(cc.toLowerCase());
    return '<img class="chat-country-flag" src="https://flagcdn.com/24x18/'+safe+'.png" alt="" aria-hidden="true"><span>'+esc(name)+'</span>';
  }
  function applyChatLanguage(){
    const t=ct();
    const title=document.querySelector('.chat-header-title'); if(title)title.textContent=t.title;
    gTab.textContent='🌐 '+t.global; nTab.innerHTML=playerCountryLabel();
    const hint=document.getElementById('chatHint'); if(hint)hint.textContent=t.hint;
    input.placeholder=channel==='global'?t.write:t.writeN;
  }
  new MutationObserver(m=>{if(m.some(x=>x.type==='attributes'&&x.attributeName==='lang'))applyChatLanguage()}).observe(document.documentElement,{attributes:true});

  function setChannel(next){
    channel=next==='national'?'national':'global';
    gTab.classList.toggle('active',channel==='global');nTab.classList.toggle('active',channel==='national');
    gTab.setAttribute('aria-selected',String(channel==='global'));nTab.setAttribute('aria-selected',String(channel==='national'));
    const p=getPlayer(),c=String(p?.country||'PT').toUpperCase();
    nTab.innerHTML=playerCountryLabel();
    input.placeholder=channel==='global'?ct().write:ct().writeN;
    load(true);
  }

  function render(data,forceBottom){
    const rows=Array.isArray(data?.messages)?data.messages:[];
    if(!rows.length){messages.innerHTML='<div class="chat-empty">'+ct().empty+'</div>';return;}
    const nearBottom=messages.scrollHeight-messages.scrollTop-messages.clientHeight<60;
    messages.innerHTML=rows.map(m=>{
      const world=Number(m.worldRank||9999),countryRank=Number(m.countryRank||9999);
      const top=channel==='global'?(world<=3?tag('global',world,m.country,m):''):(countryRank<=3?tag('national',countryRank,m.country,m):'');
      const v=Number(m.vipLevel||0),visual=m.visualName||m.name;
      const color=String(m.nameColor||'#fff').toLowerCase(),rainbow=color==='rainbow';
      const hasLetters=v>0&&Array.isArray(m.letterStyles)&&m.letterStyles.length;
      const style=!hasLetters&&!rainbow&&safeColor(color)?' style="color:'+esc(color)+'!important"':'';
      const effect=hasLetters?'none':safeEffect(m.nameEffect);
      const name=hasLetters?letters(visual,m.letterStyles):[...String(visual)].map(ch=>'<span class="name-letter">'+esc(ch)+'</span>').join('');
      const when=m.createdAt?new Date(m.createdAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}):'';
      const role=m.role==='admin'?'<span class="role-tag admin">ADMIN</span>':m.role==='moderator'?'<span class="role-tag">MOD</span>':'';
      const me=getPlayer(),canDelete=me?.role==='admin';
      const rawBorder=String(m.avatarBorder||'#46535f').toLowerCase(),border=safeColor(rawBorder)?' style="border-color:'+esc(rawBorder)+'"':'',borderClass=' avatar-border-'+rawBorder.replace(/[^a-z0-9-]/g,''),avatarClass=' avatar-'+String(m.avatar||'default').replace(/[^a-z0-9-]/g,'');
      const glyph={default:'◆',diamond:'◇',square:'■',circle:'●',star:'★',bolt:'⚡',shield:'⬢',hex:'⬡',crystal:'✦',spark:'✧',comet:'☄',crown:'♛',thunder:'ϟ',skull:'☠',phoenix:'♨',vortex:'◉',titan:'♜',plasma:'✺',infinity:'∞',cosmic:'✹',prism:'◈'}[m.avatar]||'◆';
      return '<article class="chat-message" data-message-id="'+esc(m.id)+'"><div class="chat-avatar'+avatarClass+borderClass+'"'+border+' aria-hidden="true">'+glyph+'</div><div class="chat-content"><div class="chat-author"><span class="chat-name'+(rainbow?' name-rainbow':'')+(effect!=='none'?' effect-'+esc(effect):'')+(hasLetters?' vip-letter-styled':'')+'"'+style+'>'+name+'</span>'+role+top+vip(v)+'<span class="chat-time">'+esc(when)+'</span>'+(canDelete?'<button class="chat-delete" data-delete-message="'+esc(m.id)+'" title="Delete message">×</button>':'')+'</div><div class="chat-text">'+esc(m.message)+'</div></div></article>';
    }).join('');
    if(forceBottom||nearBottom)messages.scrollTop=messages.scrollHeight;
  }

  async function load(forceBottom=false){
    const p=getPlayer();if(!p?.id||!p?.token){input.disabled=true;status.textContent=ct().need;messages.innerHTML='<div class="chat-empty">'+ct().need+'</div>';return;}
    if(loading)return;loading=true;
    try{
      const r=await fetch('/api/chat?id='+encodeURIComponent(p.id)+'&token='+encodeURIComponent(p.token)+'&channel='+encodeURIComponent(channel),{cache:'no-store'});
      const d=await r.json();if(!r.ok)throw Error(d.error||'Chat unavailable.');
      input.disabled=false;status.textContent=channel==='global'?ct().all:ct().only+' '+(window.eixoLocalizedCountryName?.(String(p.country||'PT').toUpperCase(),document.documentElement.lang||'en')||p.country);
      render(d,forceBottom);
    }catch(e){status.textContent=e.message||'CHAT UNAVAILABLE';}
    finally{loading=false;}
  }

  messages.addEventListener('click',async e=>{const b=e.target.closest('[data-delete-message]');if(!b)return;const p=getPlayer();if(p?.role!=='admin')return;try{const r=await fetch('/api/admin/chat',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,token:p.token,messageId:b.dataset.deleteMessage})});const d=await r.json();if(!r.ok)throw Error(d.error||'Unable to delete.');await load(false)}catch(err){status.textContent=err.message}});
    form.addEventListener('submit',async e=>{
    e.preventDefault();
    const p=getPlayer(),text=input.value.trim();
    if(!p?.id||!p?.token||!text||loading)return;
    if([...text].length>300){status.textContent='MESSAGE TOO LONG (MAX. 300).';return;}
    const button=form.querySelector('button');button.disabled=true;input.disabled=true;status.textContent=ct().sending;
    try{
      const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,token:p.token,channel,message:text})});
      const d=await r.json();if(!r.ok)throw Error(d.error||'Unable to send.');
      input.value='';await load(true);
    }catch(e){status.textContent=e.message||'UNABLE TO SEND.';input.disabled=false;}
    finally{button.disabled=false;}
  });
  gTab.addEventListener('click',()=>setChannel('global'));
  nTab.addEventListener('click',()=>setChannel('national'));
  window.addEventListener('eixo-player-updated',()=>{setChannel(channel)});
  window.addEventListener('storage',()=>load(false));
  load(true);timer=setInterval(()=>load(false),4000);
})();