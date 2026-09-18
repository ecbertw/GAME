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

  function playerCountryCode() {
    try {
      const saved = JSON.parse(localStorage.getItem('eixo_player') || 'null');
      if (saved?.country && countryNames[saved.country]) return saved.country;
    } catch (_) {}
    return currentCountryCode || 'PT';
  }

  window.eixoLocalizedCountryName = localizedRegion;
  window.eixoPlayerCountryCode = playerCountryCode;

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

  function countryFlagUrl(code) {
    return `https://flagcdn.com/24x18/${String(code).toLowerCase()}.png`;
  }

  function orderedCountryCodes(lang) {
    return [...countryCodes].sort((a,b) => {
      if (a === 'PT' && b !== 'PT') return -1;
      if (b === 'PT' && a !== 'PT') return 1;
      return localizedRegion(a, lang).localeCompare(localizedRegion(b, lang), lang);
    });
  }

  function renderCountryLabel(code, lang, compact=false) {
    const c = country(code);
    return `<img class="country-flag-img" src="${countryFlagUrl(code)}" alt="" aria-hidden="true"><span>${localizedRegion(code, lang)}</span>`;
  }

  function ensureOnboardingCountryPicker() {
    if (!countrySelect || document.getElementById('onboardingCountryPicker')) return;
    const wrapper = document.createElement('div');
    wrapper.id = 'onboardingCountryPicker';
    wrapper.className = 'country-picker-custom';
    countrySelect.parentNode.insertBefore(wrapper, countrySelect);
    wrapper.appendChild(countrySelect);
    countrySelect.classList.add('native-country-select');

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'country-picker-button';
    button.id = 'onboardingCountryButton';
    button.setAttribute('aria-haspopup','listbox');
    button.setAttribute('aria-expanded','false');

    const menu = document.createElement('div');
    menu.className = 'country-picker-menu';
    menu.id = 'onboardingCountryMenu';
    menu.setAttribute('role','listbox');

    wrapper.appendChild(button);
    wrapper.appendChild(menu);

    button.addEventListener('click', e => {
      e.stopPropagation();
      const open = menu.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
    });
    menu.addEventListener('click', e => {
      const option = e.target.closest('[data-country]');
      if (!option) return;
      countrySelect.value = option.dataset.country;
      modalCountry = option.dataset.country;
      updateOnboardingCountryButton();
      menu.classList.remove('open');
      button.setAttribute('aria-expanded','false');
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('#onboardingCountryPicker')) {
        menu.classList.remove('open');
        button.setAttribute('aria-expanded','false');
      }
    });
  }

  function updateOnboardingCountryButton() {
    const button = document.getElementById('onboardingCountryButton');
    if (!button || !countrySelect) return;
    const code = countrySelect.value || 'PT';
    const lang = effectiveLanguage(currentCountryCode || 'PT');
    const c = country(code);
    button.innerHTML = `<img class="country-flag-img" src="${countryFlagUrl(code)}" alt="" aria-hidden="true"><span>${localizedRegion(c.code, lang)}</span><span class="country-picker-chevron">▼</span>`;
  }

  function fillLocalizedCountryControls() {
    const lang = effectiveLanguage(currentCountryCode || 'PT');
    const ordered = orderedCountryCodes(lang);
    const label = code => renderCountryLabel(code, lang);

    if (countrySelect) {
      countrySelect.innerHTML = ordered.map(code => `<option value="${code}">${localizedRegion(code, lang)}</option>`).join('');
      countrySelect.value = currentCountryCode || 'PT';
      ensureOnboardingCountryPicker();
      updateOnboardingCountryButton();
      const menu = document.getElementById('onboardingCountryMenu');
      if (menu) {
        menu.innerHTML = ordered.map(code => `<button class="country-picker-option" type="button" data-country="${code}">${renderCountryLabel(code, lang)}</button>`).join('');
      }
    }
    if (countryMenu) {
      countryMenu.innerHTML = ordered.map(code => `<button class="country-option" type="button" data-country="${code}">${label(code)}</button>`).join('');
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
    const rankingCode = playerCountryCode();
    const c = country(currentCountryCode || 'PT');
    const rankingCountry = country(rankingCode);
    const name = localizedRegion(c.code, lang);
    const rankingName = localizedRegion(rankingCode, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar' || lang === 'he') ? 'rtl' : 'ltr';
    document.getElementById('countryName').textContent = name;
    document.getElementById('nationalFlag').textContent = rankingCountry.flag;
    document.getElementById('nationalTitle').textContent = `TOP ${rankingName}`;
    document.getElementById('modalCountryTab').textContent = `${rankingCountry.flag} ${rankingName}`;
    fillLocalizedCountryControls();

    const intro = document.querySelector('.game-intro [data-i18n="aboutText"]');
    if (intro && getLang().aboutText) intro.textContent = getLang().aboutText;
  };

  fillLocalizedCountryControls();
  window.applyLanguage();
})();
