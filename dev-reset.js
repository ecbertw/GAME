/* Development reset: bump this version whenever the code is updated. */
(function () {
  const VERSION = '2026-09-17-ui-language-ranking-2';
  const KEY = 'eixo_dev_version';
  if (localStorage.getItem(KEY) === VERSION) return;
  localStorage.removeItem('eixo_player');
  localStorage.removeItem('eixo_country');
  localStorage.setItem(KEY, VERSION);
})();
