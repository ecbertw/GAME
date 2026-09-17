/* EIXO language layer: localize the whole UI, country selector labels and intro. */
(function () {
  const fallback = 'en';

  const supported = new Set([
    'pt','en','es','fr','de','it','ja','ko','zh','ru','pl','nl','tr','ar',
    'sv','no','da','fi','el','cs','sk','hu','ro','bg','hr','sr','sl','uk','he',
    'id','ms','th','vi'
  ]);

  const defaults = {
    PT:'pt', BR:'pt',
    ES:'es', AR:'es', CL:'es', CO:'es', PE:'es', MX:'es', UY:'es', PY:'es', BO:'es', EC:'es', CR:'es', PA:'es', DO:'es', GT:'es', HN:'es', SV:'es', NI:'es', CU:'es',
    FR:'fr', BE:'fr', MA:'fr',
    DE:'de', AT:'de', CH:'de', LU:'fr',
    IT:'it',
    GB:'en', US:'en', CA:'en', AU:'en', NZ:'en', IE:'en', SG:'en', IN:'en', PH:'en', ZA:'en', NG:'en', KE:'en',
    JP:'ja', KR:'ko', CN:'zh', TW:'zh', HK:'zh',
    ID:'id', MY:'ms', TH:'th', VN:'vi',
    RU:'ru', UA:'uk', PL:'pl', NL:'nl', SE:'sv', NO:'no', DK:'da', FI:'fi', IS:'is',
    CZ:'cs', SK:'sk', HU:'hu', RO:'ro', BG:'bg', HR:'hr', RS:'sr', SI:'sl', GR:'el', TR:'tr', IL:'he',
    SA:'ar', AE:'ar', QA:'ar', EG:'ar'
  };

  Object.keys(countryNames).forEach(code => {
    if (Object.prototype.hasOwnProperty.call(defaults, code)) languageByCountry[code] = defaults[code];
    else languageByCountry[code] = fallback;
  });

  function effectiveLanguage(code) {
    const wanted = languageByCountry[code] || fallback;
    return (supported.has(wanted) && translations[wanted]) ? wanted : fallback;
  }

  function localizedRegion(code, lang) {
    try {
      const names = new Intl.DisplayNames([lang], { type: 'region' });
      return (names.of(code) || countryNames[code] || code).toUpperCase();
    } catch (_) {
      return (countryNames[code] || code).toUpperCase();
    }
  }

  window.eixoLocalizedCountryName = localizedRegion;

  function selectCountry(code) {
    if (!countryNames[code]) return;
    currentCountryCode = code;
    localStorage.setItem('eixo_country', code);
    countrySelect.value = code;
    countryMenu.classList.remove('open');
    countryButton.setAttribute('aria-expanded', 'false');
    window.applyLanguage();
    if (typeof window.eixoRefreshRankings === 'function') window.eixoRefreshRankings();
    if (typeof window.loadTopRankings === 'function') window.loadTopRankings();
  }

  function fillLocalizedCountryControls() {
    const lang = effectiveLanguage(currentCountryCode || 'PT');
    const label = code => `${country(code).flag} ${localizedRegion(code, lang)}`;

    if (countrySelect) {
      countrySelect.innerHTML = countryCodes.map(code => `<option value="${code}">${label(code)}</option>`).join('');
      if (currentCountryCode) countrySelect.value = currentCountryCode;
    }
    if (countryMenu) {
      countryMenu.innerHTML = countryCodes.map(code => `<button class="country-option" type="button" data-country="${code}">${label(code)}</button>`).join('');
      countryMenu.querySelectorAll('.country-option').forEach(btn => {
        btn.addEventListener('click', () => selectCountry(btn.dataset.country));
      });
    }
  }

  window.fillCountryControls = fillLocalizedCountryControls;
  window.changeCountry = selectCountry;

  const originalApply = window.applyLanguage;
  window.applyLanguage = function () {
    originalApply();
    const lang = effectiveLanguage(currentCountryCode || 'PT');
    const c = country(currentCountryCode || 'PT');
    const name = localizedRegion(c.code, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar' || lang === 'he') ? 'rtl' : 'ltr';
    document.getElementById('countryName').textContent = name;
    document.getElementById('nationalTitle').textContent = `TOP ${name}`;
    document.getElementById('modalCountryTab').textContent = `${c.flag} ${name}`;
    fillLocalizedCountryControls();

    const intro = document.querySelector('.game-intro [data-i18n="aboutText"]');
    if (intro && getLang().aboutText) intro.textContent = getLang().aboutText;
  };

  fillLocalizedCountryControls();
  window.applyLanguage();
})();
