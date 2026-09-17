(() => {
  const playerButton = document.getElementById('playerButton');
  const playerMenu = document.getElementById('playerMenu');
  const playerName = document.getElementById('playerName');
  if (!playerButton || !playerMenu || !playerName) return;

  const labels = {
    pt: { contact: 'CONTACTAR', bugs: 'REPORTAR BUGS', customize: 'PERSONALIZAR NOME' },
    en: { contact: 'CONTACT', bugs: 'REPORT BUGS', customize: 'CUSTOMIZE NAME' },
    es: { contact: 'CONTACTAR', bugs: 'REPORTAR BUGS', customize: 'PERSONALIZAR NOMBRE' },
    fr: { contact: 'CONTACTER', bugs: 'SIGNALER UN BUG', customize: 'PERSONNALISER LE NOM' },
    de: { contact: 'KONTAKT', bugs: 'BUG MELDEN', customize: 'NAMEN ANPASSEN' },
    it: { contact: 'CONTATTI', bugs: 'SEGNALA BUG', customize: 'PERSONALIZZA NOME' },
    ja: { contact: 'お問い合わせ', bugs: 'バグを報告', customize: '名前を変更' },
    ko: { contact: '문의하기', bugs: '버그 신고', customize: '이름 변경' },
    zh: { contact: '联系', bugs: '报告错误', customize: '自定义名称' },
    ru: { contact: 'КОНТАКТ', bugs: 'СООБЩИТЬ ОБ ОШИБКЕ', customize: 'ИЗМЕНИТЬ ИМЯ' },
    pl: { contact: 'KONTAKT', bugs: 'ZGŁOŚ BŁĄD', customize: 'ZMIENIAJ NAZWĘ' },
    nl: { contact: 'CONTACT', bugs: 'BUG MELDEN', customize: 'NAAM AANPASSEN' },
    tr: { contact: 'İLETİŞİM', bugs: 'HATA BİLDİR', customize: 'ADI ÖZELLEŞTİR' },
    ar: { contact: 'تواصل', bugs: 'الإبلاغ عن خطأ', customize: 'تخصيص الاسم' }
  };

  function getLabels() {
    const lang = document.documentElement.lang || 'en';
    return labels[lang] || labels.en;
  }

  function render() {
    let player = null;
    try { player = JSON.parse(localStorage.getItem('eixo_player') || 'null'); } catch (_) {}
    playerName.textContent = player?.name || 'JOGADOR';
    const t = getLabels();
    playerMenu.innerHTML = `
      <button type="button" class="player-option" data-action="contact">${t.contact}</button>
      <button type="button" class="player-option" data-action="bugs">${t.bugs}</button>
      <button type="button" class="player-option" data-action="customize">${t.customize}</button>
    `;
  }

  playerButton.addEventListener('click', (event) => {
    event.stopPropagation();
    const open = playerMenu.classList.toggle('open');
    playerButton.setAttribute('aria-expanded', String(open));
  });

  playerMenu.addEventListener('click', (event) => {
    const button = event.target.closest('.player-option');
    if (!button) return;
    playerMenu.classList.remove('open');
    playerButton.setAttribute('aria-expanded', 'false');
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.player-area')) {
      playerMenu.classList.remove('open');
      playerButton.setAttribute('aria-expanded', 'false');
    }
  });

  render();
  window.addEventListener('storage', render);
})();
