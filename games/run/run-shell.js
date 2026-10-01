(()=>{
  'use strict';

  const $=id=>document.getElementById(id);
  const flag=code=>[...String(code||'PT').toUpperCase()].map(c=>String.fromCodePoint(127397+c.charCodeAt())).join('');
  const countryName=code=>{
    const c=String(code||'PT').toUpperCase();
    try{return new Intl.DisplayNames(['pt'],{type:'region'}).of(c)?.toUpperCase()||c}catch(_){return c}
  };
  const readPlayer=()=>{try{return JSON.parse(localStorage.getItem('eixo_player')||'null')}catch(_){return null}};
  const player=readPlayer();
  const country=String(localStorage.getItem(player?.id?'eixo_ui_country_'+player.id:'eixo_country')||player?.country||'PT').toUpperCase();

  if($('runPlayerName'))$('runPlayerName').textContent=player?.visualName||player?.name||'ENTRAR';
  if($('runCountryFlag'))$('runCountryFlag').textContent=flag(country);
  if($('runCountryName'))$('runCountryName').textContent=countryName(country);

  const playerButton=$('runPlayerButton'),playerMenu=$('runPlayerMenu');
  const soundButton=$('runSoundButton'),soundMenu=$('runSoundMenu');
  const closeMenus=except=>{
    if(except!=='player'){playerMenu?.classList.remove('is-open');playerButton?.setAttribute('aria-expanded','false')}
    if(except!=='sound'){soundMenu?.classList.remove('is-open');soundButton?.setAttribute('aria-expanded','false')}
  };
  playerButton?.addEventListener('click',e=>{
    e.stopPropagation();const open=!playerMenu.classList.contains('is-open');closeMenus('player');
    playerMenu.classList.toggle('is-open',open);playerButton.setAttribute('aria-expanded',String(open));
  });
  soundButton?.addEventListener('click',e=>{
    e.stopPropagation();const open=!soundMenu.classList.contains('is-open');closeMenus('sound');
    soundMenu.classList.toggle('is-open',open);soundButton.setAttribute('aria-expanded',String(open));
  });
  document.addEventListener('click',()=>closeMenus());

  const KEY='eixo_audio_settings',defaults={site:.34,game:.55};
  let settings={...defaults};try{settings={...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(_){}
  const site=$('runSiteVolume'),game=$('runGameVolume');
  if(site)site.value=String(settings.site);
  if(game)game.value=String(settings.game);
  const save=(key,value)=>{
    settings[key]=Math.max(0,Math.min(1,Number(value)||0));
    localStorage.setItem(KEY,JSON.stringify(settings));
    if(key==='site')window.EixoAudio?.setSiteVolume?.(settings[key]);
    else window.EixoAudio?.setGameVolume?.(settings[key]);
  };
  site?.addEventListener('input',e=>save('site',e.target.value));
  game?.addEventListener('input',e=>save('game',e.target.value));
})();