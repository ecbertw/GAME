/*
 * EIXO country -> default interface language.
 * The country list itself remains the complete practical country list in game.js.
 * For multilingual countries we choose one widely used/default language for the
 * first version; the architecture can later expose a separate language selector.
 */
(function () {
  const groups = {
    pt: ['PT','BR','AO','MZ','CV','GW','ST','TL'],
    es: ['ES','MX','AR','BO','CL','CO','CR','CU','DO','EC','SV','GQ','GT','HN','NI','PA','PY','PE','UY','VE'],
    fr: ['FR','BJ','BF','BI','CM','CF','TD','CG','CD','CI','DJ','GA','GN','HT','MG','ML','NE','RW','SN','TG','KM','SC','LU','MC'],
    de: ['DE','AT','CH','LI'],
    it: ['IT','SM','VA'],
    en: ['GB','US','CA','AU','NZ','IE','JM','TT','BB','BS','BZ','GY','AG','DM','GD','KN','LC','VC','FJ','PG','SB','VU','WS','TO','TV','KI','MH','NR','PW','FM','SG','MT','PH','IN','PK','BD','GH','NG','KE','UG','ZM','ZW','BW','NA','ZA','MW','LR','SL','GM','SS','SD'],
    nl: ['NL','BE','SR'],
    da: ['DK'],
    sv: ['SE'],
    no: ['NO'],
    fi: ['FI'],
    is: ['IS'],
    el: ['GR','CY'],
    pl: ['PL'],
    cs: ['CZ'],
    sk: ['SK'],
    hu: ['HU'],
    ro: ['RO','MD'],
    bg: ['BG'],
    hr: ['HR','BA'],
    sr: ['RS','ME'],
    sl: ['SI'],
    mk: ['MK'],
    sq: ['AL'],
    et: ['EE'],
    lv: ['LV'],
    lt: ['LT'],
    uk: ['UA'],
    ru: ['RU','BY','KZ','KG'],
    tr: ['TR','AZ','CY'],
    ka: ['GE'],
    hy: ['AM'],
    he: ['IL'],
    ar: ['SA','AE','QA','KW','BH','OM','YE','JO','LB','IQ','SY','EG','LY','TN','DZ','MA','MR','SO','DJ','KM','PS'],
    fa: ['IR','AF','TJ'],
    ur: ['PK'],
    hi: ['IN'],
    bn: ['BD'],
    zh: ['CN'],
    ja: ['JP'],
    ko: ['KR','KP'],
    th: ['TH'],
    vi: ['VN'],
    id: ['ID'],
    ms: ['MY','BN'],
    fil: ['PH'],
    km: ['KH'],
    lo: ['LA'],
    my: ['MM'],
    mn: ['MN'],
    ne: ['NP'],
    si: ['LK'],
    sw: ['TZ'],
    am: ['ET'],
    he_IL: ['IL']
  };

  Object.entries(groups).forEach(([language, countries]) => {
    countries.forEach(code => {
      if (typeof languageByCountry !== 'undefined') languageByCountry[code] = language === 'he_IL' ? 'he' : language;
    });
  });

  // Languages not yet translated in the UI use English until their full UI
  // translation is added. This is intentionally explicit rather than guessing.
  const supported = new Set(Object.keys(translations || {}));
  Object.keys(languageByCountry).forEach(code => {
    if (!supported.has(languageByCountry[code])) languageByCountry[code] = 'en';
  });

  if (typeof applyLanguage === 'function') applyLanguage();
})();
