/* EIXO rooms: create a room, share its code and join friends' rooms. */
(function () {
  const createRoomButton = document.getElementById('createRoomButton');
  const createPanel = document.getElementById('roomCreatePanel');
  const roomNameInput = document.getElementById('roomNameInput');
  const roomSizeInput = document.getElementById('roomSizeInput');
  const roomCreateSubmit = document.getElementById('roomCreateSubmit');
  const roomCreateError = document.getElementById('roomCreateError');
  const roomCreated = document.getElementById('roomCreated');
  const createdRoomCode = document.getElementById('createdRoomCode');
  const copyRoomCode = document.getElementById('copyRoomCode');
  const roomsModal = document.getElementById('roomsModal');
  const roomsClose = document.getElementById('roomsClose');
  const addRoomButton = document.getElementById('addRoomButton');
  const roomsAddPanel = document.getElementById('roomsAddPanel');
  const joinRoomCode = document.getElementById('joinRoomCode');
  const joinRoomSubmit = document.getElementById('joinRoomSubmit');
  const joinRoomError = document.getElementById('joinRoomError');
  const roomsList = document.getElementById('roomsList');
  if (!createRoomButton || !roomsModal) return;

  const texts = {
    pt: { createRoom:'CRIAR SALA', createRoomTitle:'CRIAR UMA SALA', roomName:'NOME DA SALA', players:'JOGADORES', create:'CRIAR SALA', roomCreated:'SALA CRIADA', shareCode:'Dá este código aos teus amigos para entrarem.', copyCode:'COPIAR CÓDIGO', copied:'CÓDIGO COPIADO', myRoomsTitle:'AS MINHAS SALAS', addRoom:'ADICIONAR SALA', roomCode:'CÓDIGO DA SALA', join:'ENTRAR', loading:'A CARREGAR...', empty:'AINDA NÃO ESTÁS EM NENHUMA SALA.', leave:'SAIR', full:'CHEIA', playersLabel:'JOGADORES', invalidName:'Nome da sala inválido.', invalidCode:'Código inválido.', notFound:'Sala não encontrada.', fullError:'Esta sala já está cheia.', createdError:'Não foi possível criar a sala.' },
    en: { createRoom:'CREATE ROOM', createRoomTitle:'CREATE A ROOM', roomName:'ROOM NAME', players:'PLAYERS', create:'CREATE ROOM', roomCreated:'ROOM CREATED', shareCode:'Give this code to your friends so they can join.', copyCode:'COPY CODE', copied:'CODE COPIED', myRoomsTitle:'MY ROOMS', addRoom:'ADD ROOM', roomCode:'ROOM CODE', join:'JOIN', loading:'LOADING...', empty:'YOU ARE NOT IN ANY ROOMS YET.', leave:'LEAVE', full:'FULL', playersLabel:'PLAYERS', invalidName:'Invalid room name.', invalidCode:'Invalid room code.', notFound:'Room not found.', fullError:'This room is already full.', createdError:'Could not create the room.' },
    es: { createRoom:'CREAR SALA', createRoomTitle:'CREAR UNA SALA', roomName:'NOMBRE DE LA SALA', players:'JUGADORES', create:'CREAR SALA', roomCreated:'SALA CREADA', shareCode:'Da este código a tus amigos para que entren.', copyCode:'COPIAR CÓDIGO', copied:'CÓDIGO COPIADO', myRoomsTitle:'MIS SALAS', addRoom:'AÑADIR SALA', roomCode:'CÓDIGO DE LA SALA', join:'ENTRAR', loading:'CARGANDO...', empty:'AÚN NO ESTÁS EN NINGUNA SALA.', leave:'SALIR', full:'LLENA', playersLabel:'JUGADORES', invalidName:'Nombre de sala no válido.', invalidCode:'Código no válido.', notFound:'Sala no encontrada.', fullError:'Esta sala está llena.', createdError:'No se pudo crear la sala.' },
    fr: { createRoom:'CRÉER UNE SALLE', createRoomTitle:'CRÉER UNE SALLE', roomName:'NOM DE LA SALLE', players:'JOUEURS', create:'CRÉER LA SALLE', roomCreated:'SALLE CRÉÉE', shareCode:'Donne ce code à tes amis pour qu’ils rejoignent la salle.', copyCode:'COPIER LE CODE', copied:'CODE COPIÉ', myRoomsTitle:'MES SALLES', addRoom:'AJOUTER UNE SALLE', roomCode:'CODE DE LA SALLE', join:'REJOINDRE', loading:'CHARGEMENT...', empty:'TU N’ES DANS AUCUNE SALLE.', leave:'QUITTER', full:'PLEINE', playersLabel:'JOUEURS', invalidName:'Nom de salle invalide.', invalidCode:'Code invalide.', notFound:'Salle introuvable.', fullError:'Cette salle est pleine.', createdError:'Impossible de créer la salle.' },
    de: { createRoom:'RAUM ERSTELLEN', createRoomTitle:'EINEN RAUM ERSTELLEN', roomName:'RAUMNAME', players:'SPIELER', create:'RAUM ERSTELLEN', roomCreated:'RAUM ERSTELLT', shareCode:'Gib diesen Code deinen Freunden zum Beitreten.', copyCode:'CODE KOPIEREN', copied:'CODE KOPIERT', myRoomsTitle:'MEINE RÄUME', addRoom:'RAUM HINZUFÜGEN', roomCode:'RAUMCODE', join:'BEITRETEN', loading:'LADEN...', empty:'DU BIST NOCH IN KEINEM RAUM.', leave:'VERLASSEN', full:'VOLL', playersLabel:'SPIELER', invalidName:'Ungültiger Raumname.', invalidCode:'Ungültiger Code.', notFound:'Raum nicht gefunden.', fullError:'Dieser Raum ist voll.', createdError:'Raum konnte nicht erstellt werden.' },
    it: { createRoom:'CREA STANZA', createRoomTitle:'CREA UNA STANZA', roomName:'NOME DELLA STANZA', players:'GIOCATORI', create:'CREA STANZA', roomCreated:'STANZA CREATA', shareCode:'Dai questo codice ai tuoi amici per entrare.', copyCode:'COPIA CODICE', copied:'CODICE COPIATO', myRoomsTitle:'LE MIE STANZE', addRoom:'AGGIUNGI STANZA', roomCode:'CODICE STANZA', join:'ENTRA', loading:'CARICAMENTO...', empty:'NON SEI ANCORA IN NESSUNA STANZA.', leave:'ESCI', full:'PIENA', playersLabel:'GIOCATORI', invalidName:'Nome della stanza non valido.', invalidCode:'Codice non valido.', notFound:'Stanza non trovata.', fullError:'Questa stanza è piena.', createdError:'Impossibile creare la stanza.' },
    ja: { createRoom:'ルーム作成', createRoomTitle:'ルームを作成', roomName:'ルーム名', players:'プレイヤー', create:'ルームを作成', roomCreated:'ルーム作成完了', shareCode:'このコードを友達に伝えて参加してもらいましょう。', copyCode:'コードをコピー', copied:'コードをコピーしました', myRoomsTitle:'マイルーム', addRoom:'ルーム追加', roomCode:'ルームコード', join:'参加', loading:'読み込み中...', empty:'参加しているルームはありません。', leave:'退出', full:'満員', playersLabel:'プレイヤー', invalidName:'ルーム名が正しくありません。', invalidCode:'コードが正しくありません。', notFound:'ルームが見つかりません。', fullError:'このルームは満員です。', createdError:'ルームを作成できませんでした。' },
    ko: { createRoom:'방 만들기', createRoomTitle:'방 만들기', roomName:'방 이름', players:'플레이어', create:'방 만들기', roomCreated:'방 생성 완료', shareCode:'친구에게 이 코드를 알려서 참여하게 하세요.', copyCode:'코드 복사', copied:'코드가 복사되었습니다', myRoomsTitle:'내 방', addRoom:'방 추가', roomCode:'방 코드', join:'참여', loading:'불러오는 중...', empty:'아직 참여한 방이 없습니다.', leave:'나가기', full:'가득 참', playersLabel:'플레이어', invalidName:'방 이름이 올바르지 않습니다.', invalidCode:'코드가 올바르지 않습니다.', notFound:'방을 찾을 수 없습니다.', fullError:'이 방은 가득 찼습니다.', createdError:'방을 만들 수 없습니다.' },
    zh: { createRoom:'创建房间', createRoomTitle:'创建房间', roomName:'房间名称', players:'玩家', create:'创建房间', roomCreated:'房间已创建', shareCode:'把这个代码发给朋友即可加入。', copyCode:'复制代码', copied:'代码已复制', myRoomsTitle:'我的房间', addRoom:'添加房间', roomCode:'房间代码', join:'加入', loading:'加载中...', empty:'你还没有加入任何房间。', leave:'退出', full:'已满', playersLabel:'玩家', invalidName:'房间名称无效。', invalidCode:'代码无效。', notFound:'找不到房间。', fullError:'房间已满。', createdError:'无法创建房间。' },
    ru: { createRoom:'СОЗДАТЬ КОМНАТУ', createRoomTitle:'СОЗДАТЬ КОМНАТУ', roomName:'НАЗВАНИЕ КОМНАТЫ', players:'ИГРОКИ', create:'СОЗДАТЬ', roomCreated:'КОМНАТА СОЗДАНА', shareCode:'Передай этот код друзьям, чтобы они вошли.', copyCode:'КОПИРОВАТЬ КОД', copied:'КОД СКОПИРОВАН', myRoomsTitle:'МОИ КОМНАТЫ', addRoom:'ДОБАВИТЬ КОМНАТУ', roomCode:'КОД КОМНАТЫ', join:'ВОЙТИ', loading:'ЗАГРУЗКА...', empty:'ТЫ ЕЩЁ НЕ В КОМНАТАХ.', leave:'ВЫЙТИ', full:'ЗАПОЛНЕНА', playersLabel:'ИГРОКИ', invalidName:'Неверное название комнаты.', invalidCode:'Неверный код.', notFound:'Комната не найдена.', fullError:'Комната уже заполнена.', createdError:'Не удалось создать комнату.' },
    pl: { createRoom:'UTWÓRZ POKÓJ', createRoomTitle:'UTWÓRZ POKÓJ', roomName:'NAZWA POKOJU', players:'GRACZE', create:'UTWÓRZ POKÓJ', roomCreated:'POKÓJ UTWORZONY', shareCode:'Podaj ten kod znajomym, aby mogli dołączyć.', copyCode:'KOPIUJ KOD', copied:'KOD SKOPIOWANY', myRoomsTitle:'MOJE POKOJE', addRoom:'DODAJ POKÓJ', roomCode:'KOD POKOJU', join:'DOŁĄCZ', loading:'ŁADOWANIE...', empty:'NIE JESTEŚ JESZCZE W ŻADNYM POKOJU.', leave:'WYJDŹ', full:'PEŁNY', playersLabel:'GRACZE', invalidName:'Nieprawidłowa nazwa pokoju.', invalidCode:'Nieprawidłowy kod.', notFound:'Nie znaleziono pokoju.', fullError:'Pokój jest pełny.', createdError:'Nie udało się utworzyć pokoju.' },
    nl: { createRoom:'KAMER MAKEN', createRoomTitle:'EEN KAMER MAKEN', roomName:'KAMERNAAM', players:'SPELERS', create:'KAMER MAKEN', roomCreated:'KAMER AANGEMAAKT', shareCode:'Geef deze code aan je vrienden om mee te doen.', copyCode:'CODE KOPIËREN', copied:'CODE GEKOPIEERD', myRoomsTitle:'MIJN KAMERS', addRoom:'KAMER TOEVOEGEN', roomCode:'KAMERCODE', join:'DEELNEMEN', loading:'LADEN...', empty:'JE ZIT NOG IN GEEN KAMER.', leave:'VERLATEN', full:'VOL', playersLabel:'SPELERS', invalidName:'Ongeldige kamernaam.', invalidCode:'Ongeldige code.', notFound:'Kamer niet gevonden.', fullError:'Deze kamer is vol.', createdError:'Kamer kon niet worden aangemaakt.' },
    tr: { createRoom:'ODA OLUŞTUR', createRoomTitle:'BİR ODA OLUŞTUR', roomName:'ODA ADI', players:'OYUNCULAR', create:'ODA OLUŞTUR', roomCreated:'ODA OLUŞTURULDU', shareCode:'Arkadaşlarının katılması için bu kodu paylaş.', copyCode:'KODU KOPYALA', copied:'KOD KOPYALANDI', myRoomsTitle:'ODALARIM', addRoom:'ODA EKLE', roomCode:'ODA KODU', join:'KATIL', loading:'YÜKLENİYOR...', empty:'HENÜZ BİR ODAYA KATILMADIN.', leave:'AYRIL', full:'DOLU', playersLabel:'OYUNCULAR', invalidName:'Geçersiz oda adı.', invalidCode:'Geçersiz kod.', notFound:'Oda bulunamadı.', fullError:'Bu oda dolu.', createdError:'Oda oluşturulamadı.' },
    ar: { createRoom:'إنشاء غرفة', createRoomTitle:'إنشاء غرفة', roomName:'اسم الغرفة', players:'اللاعبون', create:'إنشاء الغرفة', roomCreated:'تم إنشاء الغرفة', shareCode:'أرسل هذا الرمز لأصدقائك للانضمام.', copyCode:'نسخ الرمز', copied:'تم نسخ الرمز', myRoomsTitle:'غرفي', addRoom:'إضافة غرفة', roomCode:'رمز الغرفة', join:'انضمام', loading:'جارٍ التحميل...', empty:'لم تنضم إلى أي غرفة بعد.', leave:'مغادرة', full:'ممتلئة', playersLabel:'اللاعبون', invalidName:'اسم الغرفة غير صالح.', invalidCode:'رمز غير صالح.', notFound:'لم يتم العثور على الغرفة.', fullError:'الغرفة ممتلئة بالفعل.', createdError:'تعذر إنشاء الغرفة.' }
  };

  const t = () => texts[document.documentElement.lang] || texts.en;
  const playerData = () => {
    try { return JSON.parse(localStorage.getItem('eixo_player') || 'null'); } catch (_) { return null; }
  };
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));

  for (let i = 1; i <= 8; i++) roomSizeInput.insertAdjacentHTML('beforeend', `<option value="${i}">${i}</option>`);
  roomSizeInput.value = '8';

  function renderLanguage() {
    const x = t();
    document.querySelectorAll('[data-room-i18n]').forEach(el => {
      const key = el.dataset.roomI18n;
      if (x[key]) el.textContent = x[key];
    });
    roomNameInput.placeholder = document.documentElement.lang === 'pt' ? 'EX: NOITE DE EIXO' : 'EX: EIXO NIGHT';
    joinRoomCode.placeholder = 'ABC123';
  }

  function credentials() {
    const p = playerData();
    if (!p?.id || !p?.token) throw new Error('SESSION');
    return { id: p.id, token: p.token };
  }

  async function api(url, options = {}) {
    const res = await fetch(url, { cache:'no-store', ...options });
    let data = {};
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) {
      const error = new Error(data.error || t().createdError);
      error.status = res.status;
      throw error;
    }
    return data;
  }

  function openRooms() {
    roomsModal.classList.remove('hidden');
    roomsAddPanel.classList.add('hidden');
    joinRoomError.textContent = '';
    loadRooms();
  }

  function closeRooms() {
    roomsModal.classList.add('hidden');
    roomsAddPanel.classList.add('hidden');
  }

  async function loadRooms() {
    try {
      const c = credentials();
      const data = await api(`/api/rooms?id=${encodeURIComponent(c.id)}&token=${encodeURIComponent(c.token)}`);
      renderRooms(data.rooms || []);
    } catch (error) {
      if (error.message === 'SESSION') {
        roomsList.innerHTML = `<div class="rooms-empty">${esc(t().empty)}</div>`;
        return;
      }
      roomsList.innerHTML = `<div class="rooms-empty">${esc(error.message)}</div>`;
    }
  }

  function renderRooms(rooms) {
    const x = t();
    if (!rooms.length) {
      roomsList.innerHTML = `<div class="rooms-empty">${esc(x.empty)}</div>`;
      return;
    }
    roomsList.innerHTML = rooms.map(room => {
      const full = room.memberCount >= room.maxPlayers;
      return `<article class="room-card">
        <div class="room-card-main"><div class="room-card-name">${esc(room.name)}</div><div class="room-card-meta">${esc(room.ownerName)} · ${room.memberCount}/${room.maxPlayers} ${esc(x.playersLabel)}</div></div>
        <div class="room-card-code">${esc(room.code)}</div>
        <div class="room-card-actions"><span class="room-status">${full ? esc(x.full) : `${room.memberCount}/${room.maxPlayers}`}</span><button type="button" class="room-leave" data-room-id="${esc(room.id)}">${esc(x.leave)}</button></div>
      </article>`;
    }).join('');
  }

  createRoomButton.addEventListener('click', () => {
    createPanel.classList.toggle('hidden');
    if (!createPanel.classList.contains('hidden')) {
      createPanel.scrollIntoView({ behavior:'smooth', block:'nearest' });
      roomNameInput.focus();
    }
  });

  roomCreateSubmit.addEventListener('click', async () => {
    roomCreateError.textContent = '';
    roomCreateSubmit.disabled = true;
    try {
      const c = credentials();
      const data = await api('/api/rooms', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:c.id, token:c.token, name:roomNameInput.value, maxPlayers:Number(roomSizeInput.value) }) });
      createdRoomCode.textContent = data.room.code;
      roomCreated.classList.remove('hidden');
      roomNameInput.value = '';
    } catch (error) {
      roomCreateError.textContent = error.message === 'SESSION' ? 'SESSION' : (error.message || t().createdError);
    } finally { roomCreateSubmit.disabled = false; }
  });

  copyRoomCode.addEventListener('click', async () => {
    const x = t();
    try { await navigator.clipboard.writeText(createdRoomCode.textContent); copyRoomCode.textContent = x.copied; setTimeout(() => { copyRoomCode.textContent = x.copyCode; }, 1400); }
    catch (_) { copyRoomCode.textContent = createdRoomCode.textContent; }
  });

  document.querySelector('.action.purple')?.addEventListener('click', event => { event.preventDefault(); openRooms(); });
  roomsClose.addEventListener('click', closeRooms);
  roomsModal.addEventListener('click', event => { if (event.target === roomsModal) closeRooms(); });

  addRoomButton.addEventListener('click', () => {
    roomsAddPanel.classList.toggle('hidden');
    joinRoomError.textContent = '';
    if (!roomsAddPanel.classList.contains('hidden')) setTimeout(() => joinRoomCode.focus(), 30);
  });

  joinRoomCode.addEventListener('input', () => { joinRoomCode.value = joinRoomCode.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0,6); });
  joinRoomCode.addEventListener('keydown', event => { if (event.key === 'Enter') joinRoomSubmit.click(); });
  joinRoomSubmit.addEventListener('click', async () => {
    joinRoomError.textContent = '';
    joinRoomSubmit.disabled = true;
    try {
      const c = credentials();
      const data = await api('/api/rooms/join', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:c.id, token:c.token, code:joinRoomCode.value }) });
      joinRoomCode.value = '';
      roomsAddPanel.classList.add('hidden');
      await loadRooms();
      if (data.room?.code) { joinRoomError.textContent = ''; }
    } catch (error) {
      if (error.status === 404) joinRoomError.textContent = t().notFound;
      else if (error.status === 409) joinRoomError.textContent = t().fullError;
      else joinRoomError.textContent = error.message === 'SESSION' ? 'SESSION' : (error.message || t().invalidCode);
    } finally { joinRoomSubmit.disabled = false; }
  });

  roomsList.addEventListener('click', async event => {
    const button = event.target.closest('.room-leave');
    if (!button) return;
    button.disabled = true;
    try {
      const c = credentials();
      await api('/api/rooms/leave', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:c.id, token:c.token, roomId:button.dataset.roomId }) });
      await loadRooms();
    } catch (error) { button.disabled = false; }
  });

  const originalApply = window.applyLanguage;
  window.applyLanguage = function () {
    originalApply();
    renderLanguage();
    if (!roomsModal.classList.contains('hidden')) loadRooms();
  };

  renderLanguage();
  window.eixoOpenRooms = openRooms;
  setInterval(() => { if (!roomsModal.classList.contains('hidden')) loadRooms(); }, 3000);
})();
