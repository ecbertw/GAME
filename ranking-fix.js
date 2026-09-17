/* EIXO ranking refresh layer. Keeps the visible Top 5 synchronized with the API. */
(function () {
  const worldEl = document.getElementById('worldRanking');
  const countryEl = document.getElementById('nationalRanking');
  if (!worldEl || !countryEl) return;

  function render(list, target) {
    if (!list || !list.length) {
      target.innerHTML = '<li class="empty-row">AINDA SEM JOGADORES</li>';
      return;
    }
    target.innerHTML = list.slice(0, 5).map((p, i) => `
      <li>
        <span class="rank-number">${i + 1}</span>
        <span>${escapeHtml(p.name)}</span>
        <span class="rank-score">${Number(p.score || 0)}</span>
      </li>`).join('');
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function registeredCountry() {
    try {
      const saved = JSON.parse(localStorage.getItem('eixo_player') || 'null');
      if (saved?.country) return String(saved.country).toUpperCase();
    } catch (_) {}
    return (localStorage.getItem('eixo_country') || 'PT').toUpperCase();
  }

  async function load() {
    const code = registeredCountry();
    try {
      const [worldRes, countryRes] = await Promise.all([
        fetch('/api/rankings?page=1', { cache:'no-store' }),
        fetch(`/api/rankings?country=${encodeURIComponent(code)}&page=1`, { cache:'no-store' })
      ]);
      if (!worldRes.ok || !countryRes.ok) throw new Error('Ranking indisponível');
      const [world, country] = await Promise.all([worldRes.json(), countryRes.json()]);
      render(world.players, worldEl);
      render(country.players, countryEl);
    } catch (_) {
      // Keep the last successful ranking on transient network failures.
    }
  }

  // game.js already has a ranking loader. Replace it with the same source of truth
  // so a language/country UI change can never move the player's national ranking.
  window.loadTopRankings = load;
  window.eixoRefreshRankings = load;
  load();
  setInterval(load, 2000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
})();
