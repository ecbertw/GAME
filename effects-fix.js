/* EIXO: reliable per-letter effects in every ranking, including full ranking. */
(function(){
 const palette=['#ff3b30','#ff9500','#ffd60a','#34c759','#0a84ff','#bf5af2'];
 const labels={
  pt:{none:'Nenhum',bounce:'Salta',glow:'Brilha',shake:'Treme',pulse:'Pulsa',jelly:'Gelatina',twist:'Torção',flicker:'Cintila',stretch:'Estica'},
  en:{none:'None',bounce:'Bounce',glow:'Glow',shake:'Shake',pulse:'Pulse',jelly:'Jelly',twist:'Twist',flicker:'Flicker',stretch:'Stretch'},
  es:{none:'Ninguno',bounce:'Salta',glow:'Brilla',shake:'Tiembla',pulse:'Pulsa',jelly:'Gelatina',twist:'Giro',flicker:'Parpadeo',stretch:'Estira'},
  fr:{none:'Aucun',bounce:'Saute',glow:'Brille',shake:'Tremble',pulse:'Pulse',jelly:'Gelée',twist:'Torsion',flicker:'Scintille',stretch:'Étire'},
  de:{none:'Keiner',bounce:'Springt',glow:'Leuchtet',shake:'Wackelt',pulse:'Pulsiert',jelly:'Gelee',twist:'Drehung',flicker:'Flackern',stretch:'Dehnen'},
  it:{none:'Nessuno',bounce:'Salta',glow:'Brilla',shake:'Trema',pulse:'Impulso',jelly:'Gelatina',twist:'Torsione',flicker:'Sfarfallio',stretch:'Allunga'},
  ja:{none:'なし',bounce:'ジャンプ',glow:'発光',shake:'シェイク',pulse:'パルス',jelly:'ゼリー',twist:'ツイスト',flicker:'ちらつき',stretch:'ストレッチ'},
  ko:{none:'없음',bounce:'점프',glow:'빛남',shake:'흔들림',pulse:'펄스',jelly:'젤리',twist:'회전',flicker:'깜빡임',stretch:'늘이기'},
  zh:{none:'无',bounce:'弹跳',glow:'发光',shake:'抖动',pulse:'脉冲',jelly:'果冻',twist:'扭转',flicker:'闪烁',stretch:'拉伸'},
  ru:{none:'Нет',bounce:'Прыжок',glow:'Свечение',shake:'Тряска',pulse:'Пульсация',jelly:'Желе',twist:'Вращение',flicker:'Мерцание',stretch:'Растяжка'},
  pl:{none:'Brak',bounce:'Podskok',glow:'Blask',shake:'Drżenie',pulse:'Puls',jelly:'Galaretka',twist:'Skręt',flicker:'Migotanie',stretch:'Rozciąganie'},
  nl:{none:'Geen',bounce:'Stuiter',glow:'Gloed',shake:'Schud',pulse:'Puls',jelly:'Jelly',twist:'Draai',flicker:'Flikkering',stretch:'Uitrekken'},
  tr:{none:'Yok',bounce:'Zıpla',glow:'Parla',shake:'Salla',pulse:'Darbe',jelly:'Jöle',twist:'Dönüş',flicker:'Titreşim',stretch:'Uzat'},
  ar:{none:'بدون',bounce:'قفز',glow:'توهج',shake:'اهتزاز',pulse:'نبض',jelly:'هلام',twist:'التواء',flicker:'وميض',stretch:'تمدد'},
  sv:{none:'Ingen',bounce:'Studsar',glow:'Glöd',shake:'Skakar',pulse:'Puls',jelly:'Gelé',twist:'Vridning',flicker:'Flimmer',stretch:'Sträcker'},
  no:{none:'Ingen',bounce:'Sprett',glow:'Glød',shake:'Rister',pulse:'Puls',jelly:'Gelé',twist:'Vri',flicker:'Flimrer',stretch:'Strekker'},
  da:{none:'Ingen',bounce:'Hop',glow:'Glød',shake:'Ryster',pulse:'Puls',jelly:'Gelé',twist:'Drejning',flicker:'Flimmer',stretch:'Strækker'},
  fi:{none:'Ei mitään',bounce:'Hyppää',glow:'Hehku',shake:'Tärisee',pulse:'Syke',jelly:'Hyytelö',twist:'Kierto',flicker:'Välke',stretch:'Venytys'},
  el:{none:'Κανένα',bounce:'Άλμα',glow:'Λάμψη',shake:'Τρέμουλο',pulse:'Παλμός',jelly:'Ζελέ',twist:'Στροφή',flicker:'Τρεμόπαιγμα',stretch:'Τέντωμα'},
  cs:{none:'Žádný',bounce:'Skok',glow:'Záře',shake:'Třes',pulse:'Pulz',jelly:'Želé',twist:'Otočení',flicker:'Blikání',stretch:'Protažení'},
  id:{none:'Tidak ada',bounce:'Lompat',glow:'Cahaya',shake:'Goyang',pulse:'Denyut',jelly:'Jeli',twist:'Putar',flicker:'Berkedip',stretch:'Meregang'},
  th:{none:'ไม่มี',bounce:'เด้ง',glow:'เรืองแสง',shake:'สั่น',pulse:'พัลส์',jelly:'เยลลี่',twist:'บิด',flicker:'กะพริบ',stretch:'ยืด'},
  vi:{none:'Không',bounce:'Nảy',glow:'Phát sáng',shake:'Rung',pulse:'Xung',jelly:'Thạch',twist:'Xoắn',flicker:'Nhấp nháy',stretch:'Kéo giãn'},
  he:{none:'ללא',bounce:'קפיצה',glow:'זוהר',shake:'רעידה',pulse:'פעימה',jelly:'ג׳לי',twist:'סיבוב',flicker:'הבהוב',stretch:'מתיחה'}
 };
 const valid=['none','bounce','glow','shake','pulse','jelly','twist','flicker','stretch'];
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function nameHtml(text,color,effect){const n=String(text||''),rainbow=String(color||'').toLowerCase()==='rainbow',e=valid.includes(effect)?effect:'none';return [...n].map((ch,i)=>`<span class="name-letter"${rainbow?` style="color:${palette[i%palette.length]}!important"`:''}>${esc(ch)}</span>`).join('');}
 function fixNames(){document.querySelectorAll('.rank-player-name,.name-preview').forEach(el=>{const rainbow=el.classList.contains('name-rainbow');const effect=(el.className.match(/effect-([a-z]+)/)||[])[1]||'none';if(!rainbow&&!valid.includes(effect))return;if(el.dataset.lettersReady==='1')return;const color=rainbow?'rainbow':el.style.color;const text=el.textContent||'';el.innerHTML=nameHtml(text,color,effect);el.dataset.lettersReady='1';});}
 function fixSelect(){const el=document.getElementById('customizeEffect');if(!el)return;const lang=document.documentElement.lang||'en',t=labels[lang]||labels.en;[...el.options].forEach(o=>{if(o.value==='wave')o.value='twist';if(o.value==='float')o.value='flicker';});if(![...el.options].some(o=>o.value==='stretch')){const o=document.createElement('option');o.value='stretch';el.appendChild(o)}[...el.options].forEach(o=>{if(t[o.value])o.textContent=t[o.value]});}
 function apply(){fixSelect();fixNames();}
 apply();new MutationObserver(apply).observe(document.body,{childList:true,subtree:true});
})();
