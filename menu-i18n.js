/* EIXO legacy menu translation shim.
   Never rebuilds #playerMenu; it only translates existing actions. */
(function(){
  const labels={
    pt:{settings:'DEFINIÇÕES',customize:'PERSONALIZAR NOME',bugs:'REPORTAR BUGS',suggestions:'SUGESTÕES',contact:'CONTACTOS',logout:'SAIR DA CONTA'},
    en:{settings:'SETTINGS',customize:'CUSTOMIZE NAME',bugs:'REPORT BUGS',suggestions:'SUGGESTIONS',contact:'CONTACT',logout:'LOG OUT'},
    es:{settings:'AJUSTES',customize:'PERSONALIZAR NOMBRE',bugs:'REPORTAR BUGS',suggestions:'SUGERENCIAS',contact:'CONTACTAR',logout:'CERRAR SESIÓN'},
    fr:{settings:'PARAMÈTRES',customize:'PERSONNALISER LE NOM',bugs:'SIGNALER UN BUG',suggestions:'SUGGESTIONS',contact:'CONTACT',logout:'DÉCONNEXION'},
    de:{settings:'EINSTELLUNGEN',customize:'NAMEN ANPASSEN',bugs:'BUG MELDEN',suggestions:'VORSCHLÄGE',contact:'KONTAKT',logout:'ABMELDEN'},
    it:{settings:'IMPOSTAZIONI',customize:'PERSONALIZZA NOME',bugs:'SEGNALA BUG',suggestions:'SUGGERIMENTI',contact:'CONTATTI',logout:'ESCI'}
  };
  function apply(){
    const lang=String(document.documentElement.lang||'en').split('-')[0];
    const t=labels[lang]||labels.en;
    document.querySelectorAll('#playerMenu .player-option[data-action]').forEach(button=>{
      const text=t[button.dataset.action];
      if(text&&button.textContent!==text)button.textContent=text;
    });
  }
  apply();
  new MutationObserver(apply).observe(document.body,{childList:true,subtree:true});
})();
