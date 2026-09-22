/* EIXO unified colour labels — keeps original option values for the API.
   Native select options cannot contain rich HTML, so tint their text and the
   selected value; RGB/rainbow get readable labels and a highlighted border. */
(function(){
  'use strict';
  const named={
    '#46535f':'gray','#ffffff':'white','#2f9bd1':'blue','#39b86a':'green',
    '#e83e45':'red','#f1c438':'yellow','#00e5ff':'cyan','#7c4dff':'purple',
    '#ff4fd8':'magenta','#d9ff00':'lime','#f5f7ff':'white',
    '#ff4d4d':'red','#ff7a2f':'orange','#ffd43b':'yellow','#7bdc5a':'lime',
    '#39d98a':'green','#00d4ff':'cyan','#3b82f6':'blue','#6f5cff':'indigo',
    '#b66cff':'purple','#ff6b9d':'pink','#a8e063':'lightGreen',
    '#00f0ff':'turquoise','#f97316':'orange','#facc15':'yellow',
    '#94a3b8':'gray','#e2e8f0':'lightGray','#22c55e':'green',
    '#ef4444':'red','#e53935':'red','#27b35d':'green',
    '#2d7ff9':'blue','#a855f7':'purple','#c77dff':'purple',
    '#7cff6b':'lime','#ff3b5c':'pink','#ff6b6b':'red',
    '#00bfa6':'turquoise','#ff9f1c':'orange','#c084fc':'purple',
    '#ef7b2d':'orange','#e7e7df':'white','#172b3b':'gray',
    '#ff3b30':'red','#ffcc00':'yellow','#34c759':'green',
    '#0a84ff':'blue','#bf5af2':'purple','#ff2d55':'pink',
    '#596671':'gray','#ff5360':'red','#ffffff':'white'
  };
  const dict={
    pt:['BRANCO','VERMELHO','LARANJA','AMARELO','VERDE','VERDE-LIMA','CIANO','AZUL','ÍNDIGO','ROXO','ROSA','CINZENTO','VERDE-CLARO','CINZENTO-CLARO','TURQUESA','MAGENTA','ARCO-ÍRIS','BRILHO','COR PERSONALIZADA'],
    en:['WHITE','RED','ORANGE','YELLOW','GREEN','LIME','CYAN','BLUE','INDIGO','PURPLE','PINK','GRAY','LIGHT GREEN','LIGHT GRAY','TURQUOISE','MAGENTA','RAINBOW','GLOW','CUSTOM COLOR'],
    es:['BLANCO','ROJO','NARANJA','AMARILLO','VERDE','VERDE LIMA','CIAN','AZUL','ÍNDIGO','MORADO','ROSA','GRIS','VERDE CLARO','GRIS CLARO','TURQUESA','MAGENTA','ARCOÍRIS','BRILLO','COLOR PERSONALIZADO'],
    fr:['BLANC','ROUGE','ORANGE','JAUNE','VERT','VERT CITRON','CYAN','BLEU','INDIGO','VIOLET','ROSE','GRIS','VERT CLAIR','GRIS CLAIR','TURQUOISE','MAGENTA','ARC-EN-CIEL','LUEUR','COULEUR PERSONNALISÉE'],
    de:['WEISS','ROT','ORANGE','GELB','GRÜN','LIMETTE','CYAN','BLAU','INDIGO','LILA','ROSA','GRAU','HELLGRÜN','HELLGRAU','TÜRKIS','MAGENTA','REGENBOGEN','LEUCHTEN','EIGENE FARBE'],
    it:['BIANCO','ROSSO','ARANCIONE','GIALLO','VERDE','VERDE LIME','CIANO','BLU','INDACO','VIOLA','ROSA','GRIGIO','VERDE CHIARO','GRIGIO CHIARO','TURCHESE','MAGENTA','ARCOBALENO','BAGLIORE','COLORE PERSONALIZZATO'],
    ja:['白','赤','オレンジ','黄','緑','ライム','シアン','青','インディゴ','紫','ピンク','グレー','薄緑','薄いグレー','ターコイズ','マゼンタ','虹色','発光','カスタムカラー'],
    ko:['흰색','빨강','주황','노랑','초록','라임','시안','파랑','남색','보라','분홍','회색','연두','연회색','청록','마젠타','무지개','빛남','사용자 지정 색상'],
    zh:['白色','红色','橙色','黄色','绿色','青柠色','青色','蓝色','靛蓝色','紫色','粉色','灰色','浅绿色','浅灰色','绿松石色','洋红色','彩虹色','发光','自定义颜色'],
    ru:['БЕЛЫЙ','КРАСНЫЙ','ОРАНЖЕВЫЙ','ЖЁЛТЫЙ','ЗЕЛЁНЫЙ','ЛАЙМ','ГОЛУБОЙ','СИНИЙ','ИНДИГО','ФИОЛЕТОВЫЙ','РОЗОВЫЙ','СЕРЫЙ','СВЕТЛО-ЗЕЛЁНЫЙ','СВЕТЛО-СЕРЫЙ','БИРЮЗОВЫЙ','ПУРПУРНЫЙ','РАДУГА','СВЕЧЕНИЕ','СВОЙ ЦВЕТ'],
    pl:['BIAŁY','CZERWONY','POMARAŃCZOWY','ŻÓŁTY','ZIELONY','LIMONKOWY','CYJAN','NIEBIESKI','INDYGO','FIOLETOWY','RÓŻOWY','SZARY','JASNOZIELONY','JASNOSZARY','TURKUSOWY','MAGENTA','TĘCZA','BLASK','WŁASNY KOLOR'],
    nl:['WIT','ROOD','ORANJE','GEEL','GROEN','LIMOEN','CYAAN','BLAUW','INDIGO','PAARS','ROZE','GRIJS','LICHTGROEN','LICHTGRIJS','TURKOOIS','MAGENTA','REGENBOOG','GLOED','EIGEN KLEUR'],
    tr:['BEYAZ','KIRMIZI','TURUNCU','SARI','YEŞİL','LİMON YEŞİLİ','CAMGÖBEĞİ','MAVİ','ÇİVİT','MOR','PEMBE','GRİ','AÇIK YEŞİL','AÇIK GRİ','TURKUAZ','MACENTA','GÖKKUŞAĞI','PARILTI','ÖZEL RENK'],
    ar:['أبيض','أحمر','برتقالي','أصفر','أخضر','ليموني','سماوي','أزرق','نيلي','بنفسجي','وردي','رمادي','أخضر فاتح','رمادي فاتح','فيروزي','أرجواني','قوس قزح','توهج','لون مخصص'],
    sv:['VIT','RÖD','ORANGE','GUL','GRÖN','LIME','CYAN','BLÅ','INDIGO','LILA','ROSA','GRÅ','LJUSGRÖN','LJUSGRÅ','TURKOS','MAGENTA','REGNBÅGE','GLÖD','EGEN FÄRG'],
    no:['HVIT','RØD','ORANSJE','GUL','GRØNN','LIME','CYAN','BLÅ','INDIGO','LILLA','ROSA','GRÅ','LYSEGRØNN','LYSEGRÅ','TURKIS','MAGENTA','REGNBUE','GLØD','EGEN FARGE'],
    da:['HVID','RØD','ORANGE','GUL','GRØN','LIME','CYAN','BLÅ','INDIGO','LILLA','LYSERØD','GRÅ','LYSEGRØN','LYSEGRÅ','TURKIS','MAGENTA','REGNBUE','GLØD','EGEN FARVE'],
    fi:['VALKOINEN','PUNAINEN','ORANSSI','KELTAINEN','VIHREÄ','LIMETTI','SYAANI','SININEN','INDIGO','VIOLETTI','VAALEANPUNAINEN','HARMAA','VAALEANVIHREÄ','VAALEANHARMAA','TURKOOSI','MAGENTA','SATEENKAARI','HEHKU','OMA VÄRI'],
    is:['HVÍTUR','RAUÐUR','APPELSÍNUGULUR','GULUR','GRÆNN','LÍMÓNUGRÆNN','BLÁGRÆNN','BLÁR','INDÍGÓ','FJÓLUBLÁR','BLEIKUR','GRÁR','LJÓSGRÆNN','LJÓSGRÁR','TÚRKÍS','MAGENTA','REGNBOGI','BJARMI','SÉRLITUR'],
    el:['ΛΕΥΚΟ','ΚΟΚΚΙΝΟ','ΠΟΡΤΟΚΑΛΙ','ΚΙΤΡΙΝΟ','ΠΡΑΣΙΝΟ','ΛΑΪΜ','ΚΥΑΝΟ','ΜΠΛΕ','ΙΝΤΙΓΚΟ','ΜΩΒ','ΡΟΖ','ΓΚΡΙ','ΑΝΟΙΧΤΟ ΠΡΑΣΙΝΟ','ΑΝΟΙΧΤΟ ΓΚΡΙ','ΤΥΡΚΟΥΑΖ','ΜΑΤΖΕΝΤΑ','ΟΥΡΑΝΙΟ ΤΟΞΟ','ΛΑΜΨΗ','ΠΡΟΣΑΡΜΟΣΜΕΝΟ ΧΡΩΜΑ'],
    cs:['BÍLÁ','ČERVENÁ','ORANŽOVÁ','ŽLUTÁ','ZELENÁ','LIMETKOVÁ','AZUROVÁ','MODRÁ','INDIGO','FIALOVÁ','RŮŽOVÁ','ŠEDÁ','SVĚTLE ZELENÁ','SVĚTLE ŠEDÁ','TYRKYSOVÁ','PURPUROVÁ','DUHA','ZÁŘE','VLASTNÍ BARVA'],
    sk:['BIELA','ČERVENÁ','ORANŽOVÁ','ŽLTÁ','ZELENÁ','LIMETKOVÁ','AZÚROVÁ','MODRÁ','INDIGO','FIALOVÁ','RUŽOVÁ','SIVÁ','SVETLOZELENÁ','SVETLOSIVÁ','TYRKYSOVÁ','PURPUROVÁ','DÚHA','ŽIARA','VLASTNÁ FARBA'],
    hu:['FEHÉR','PIROS','NARANCS','SÁRGA','ZÖLD','LIME','CIÁN','KÉK','INDIGÓ','LILA','RÓZSASZÍN','SZÜRKE','VILÁGOSZÖLD','VILÁGOSSZÜRKE','TÜRKIZ','MAGENTA','SZIVÁRVÁNY','RAGYOGÁS','EGYÉNI SZÍN'],
    ro:['ALB','ROȘU','PORTOCALIU','GALBEN','VERDE','LIME','CIAN','ALBASTRU','INDIGO','MOV','ROZ','GRI','VERDE DESCHIS','GRI DESCHIS','TURCOAZ','MAGENTA','CURCUBEU','STRĂLUCIRE','CULOARE PERSONALIZATĂ'],
    bg:['БЯЛО','ЧЕРВЕНО','ОРАНЖЕВО','ЖЪЛТО','ЗЕЛЕНО','ЛАЙМ','ЦИАН','СИНЬО','ИНДИГО','ЛИЛАВО','РОЗОВО','СИВО','СВЕТЛОЗЕЛЕНО','СВЕТЛОСИВО','ТЮРКОАЗ','МАГЕНТА','ДЪГА','СИЯНИЕ','СОБСТВЕН ЦВЯТ'],
    hr:['BIJELA','CRVENA','NARANČASTA','ŽUTA','ZELENA','LIMETA','CIJAN','PLAVA','INDIGO','LJUBIČASTA','RUŽIČASTA','SIVA','SVIJETLOZELENA','SVIJETLOSIVA','TIRKIZNA','MAGENTA','DUGA','SJAJ','VLASTITA BOJA'],
    sr:['БЕЛА','ЦРВЕНА','НАРАНЏАСТА','ЖУТА','ЗЕЛЕНА','ЛИМЕТА','ЦИЈАН','ПЛАВА','ИНДИГО','ЉУБИЧАСТА','РОЗЕ','СИВА','СВЕТЛОЗЕЛЕНА','СВЕТЛОСИВА','ТИРКИЗНА','МАГЕНТА','ДУГА','СЈАЈ','СОПСТВЕНА БОЈА'],
    sl:['BELA','RDEČA','ORANŽNA','RUMENA','ZELENA','LIMETA','CIAN','MODRA','INDIGO','VIJOLIČNA','ROŽNATA','SIVA','SVETLO ZELENA','SVETLO SIVA','TURKIZNA','MAGENTA','MAVRICA','SIJAJ','LASTNA BARVA'],
    uk:['БІЛИЙ','ЧЕРВОНИЙ','ПОМАРАНЧЕВИЙ','ЖОВТИЙ','ЗЕЛЕНИЙ','ЛАЙМ','БЛАКИТНИЙ','СИНІЙ','ІНДИГО','ФІОЛЕТОВИЙ','РОЖЕВИЙ','СІРИЙ','СВІТЛО-ЗЕЛЕНИЙ','СВІТЛО-СІРИЙ','БІРЮЗОВИЙ','ПУРПУРОВИЙ','ВЕСЕЛКА','СЯЙВО','ВЛАСНИЙ КОЛІР'],
    he:['לבן','אדום','כתום','צהוב','ירוק','ליים','תכלת','כחול','אינדיגו','סגול','ורוד','אפור','ירוק בהיר','אפור בהיר','טורקיז','מגנטה','קשת','זוהר','צבע מותאם'],
    id:['PUTIH','MERAH','ORANYE','KUNING','HIJAU','LIMAU','SIAN','BIRU','NILA','UNGU','MERAH MUDA','ABU-ABU','HIJAU MUDA','ABU-ABU MUDA','TOSKA','MAGENTA','PELANGI','CAHAYA','WARNA KHUSUS'],
    ms:['PUTIH','MERAH','JINGGA','KUNING','HIJAU','LIMAU','SIAN','BIRU','NILA','UNGU','MERAH JAMBU','KELABU','HIJAU MUDA','KELABU MUDA','TURKUOIS','MAGENTA','PELANGI','CAHAYA','WARNA TERSUAI'],
    th:['ขาว','แดง','ส้ม','เหลือง','เขียว','มะนาว','ฟ้า','น้ำเงิน','คราม','ม่วง','ชมพู','เทา','เขียวอ่อน','เทาอ่อน','เทอร์ควอยซ์','ม่วงแดง','สายรุ้ง','เรืองแสง','สีที่กำหนดเอง'],
    vi:['TRẮNG','ĐỎ','CAM','VÀNG','XANH LÁ','XANH CHANH','XANH LƠ','XANH DƯƠNG','CHÀM','TÍM','HỒNG','XÁM','XANH LÁ NHẠT','XÁM NHẠT','NGỌC LAM','HỒNG TÍM','CẦU VỒNG','PHÁT SÁNG','MÀU TÙY CHỈNH']
  };
  const keys=['white','red','orange','yellow','green','lime','cyan','blue','indigo','purple','pink','gray','lightGreen','lightGray','turquoise','magenta','rainbow','glow','custom'];
  const t=()=>{const lang=String(document.documentElement.lang||'en').split('-')[0];return dict[lang]||dict.en};
  const label=key=>t()[Math.max(0,keys.indexOf(key))]||t()[18];
  const hex=/^#[0-9a-f]{6}$/i;
  function isColor(v){return hex.test(v)||['rainbow','rgb','glow'].includes(v)}
  function decorate(){
    for(const select of document.querySelectorAll('select')){
      const options=Array.from(select.options);
      if(!options.some(o=>isColor(String(o.value).toLowerCase())))continue;
      for(const option of options){
        const value=String(option.value||'').toLowerCase();
        if(!isColor(value))continue;
        const key=value==='rainbow'||value==='rgb'?'rainbow':value==='glow'?'glow':named[value]||'custom';
        const title=(value==='rgb'?'RGB / ':value==='rainbow'?'🌈 ':'')+label(key);
        if(option.textContent!==title)option.textContent=title;
        const textColor=hex.test(value)?value:'#e2e8f0';
        option.style.setProperty('color',textColor);
        option.style.setProperty('background-color','#0b1117');
      }
      const selected=String(select.value||'').toLowerCase();
      const color=hex.test(selected)?selected:selected==='rainbow'||selected==='rgb'?'#f5c542':'#00e5ff';
      // Override legacy VIP code that painted the whole select background.
      select.style.setProperty('background','#080d12','important');
      select.style.setProperty('color',color,'important');
      select.style.setProperty('border-color',color,'important');
    }
  }
  let pending=false;
  function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;decorate()});}
  document.addEventListener('change',e=>{if(e.target?.matches?.('select'))decorate()});
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  decorate();
})();