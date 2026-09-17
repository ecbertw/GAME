/* EIXO: practical country set + interface language defaults. */
(function () {
  // These are the countries most useful for an international online game/site.
  // We deliberately avoid an enormous 195-country selector while still covering
  // the major gaming, internet and Portuguese-speaking markets.
  const commonCountries = [
    'PT','ES','FR','DE','IT','GB','US','CA','AU','NZ','IE','BR',
    'AR','CL','CO','PE','MX','UY','PY','BO','EC','CR','PA','DO','GT','HN','SV','NI','CU',
    'JP','KR','CN','TW','HK','SG','IN','ID','MY','TH','VN','PH',
    'RU','UA','PL','NL','BE','AT','CH','SE','NO','DK','FI','IS','CZ','SK','HU','RO','BG','HR','RS','SI','GR','TR',
    'IL','SA','AE','QA','EG','MA','ZA','NG','KE'
  ];

  countryCodes.length = 0;
  commonCountries.forEach(code => { if (countryNames[code]) countryCodes.push(code); });
  countryCodes.sort((a,b) => countryNames[a].localeCompare(countryNames[b], 'pt'));

  const languageGroups = {
    pt: ['PT','BR'],
    es: ['ES','AR','CL','CO','PE','MX','UY','PY','BO','EC','CR','PA','DO','GT','HN','SV','NI','CU'],
    fr: ['FR','BE','MA'],
    de: ['DE','AT','CH'],
    it: ['IT'],
    en: ['GB','US','CA','AU','NZ','IE','SG','IN','PH','ZA','NG','KE'],
    ja: ['JP'],
    ko: ['KR'],
    zh: ['CN','TW','HK'],
    id: ['ID'],
    ms: ['MY'],
    th: ['TH'],
    vi: ['VN'],
    ru: ['RU'],
    uk: ['UA'],
    pl: ['PL'],
    nl: ['NL'],
    sv: ['SE'],
    no: ['NO'],
    da: ['DK'],
    fi: ['FI'],
    is: ['IS'],
    cs: ['CZ'],
    sk: ['SK'],
    hu: ['HU'],
    ro: ['RO'],
    bg: ['BG'],
    hr: ['HR'],
    sr: ['RS'],
    sl: ['SI'],
    el: ['GR'],
    tr: ['TR'],
    he: ['IL'],
    ar: ['SA','AE','QA','EG']
  };

  Object.entries(languageGroups).forEach(([language, codes]) => {
    codes.forEach(code => { languageByCountry[code] = language; });
  });

  const extraTranslations = {
    ja:{play:'プレイ',ranking:'ランキング',rooms:'ルーム',about:'概要',myRooms:'マイルーム',instruction:'ドットが中央に来たらクリック',worldTop:'世界ランキング',fullRanking:'ランキングを見る',aboutText:' — シンプルな反射神経ゲーム。中央を狙ってスコアを伸ばそう。',welcome:'EIXOへようこそ',countryIntro:'まず国を選んでください。',country:'国',continue:'続ける ▶',nameTitle:'名前を選ぶ',nameText:'この名前はあなたのプレイヤーに登録され、他の人は使用できません。',nameLabel:'プレイヤー名',create:'プレイヤーを作成 ▶',nameInvalid:'名前は3〜16文字の英数字のみ使用できます。',nameTaken:'その名前はすでに使用されています.'},
    ko:{play:'플레이',ranking:'랭킹',rooms:'방',about:'소개',myRooms:'내 방',instruction:'점이 중앙에 있을 때 클릭하세요',worldTop:'세계 랭킹',fullRanking:'전체 랭킹 보기',aboutText:' — 간단한 반사신경 게임입니다. 중앙을 맞히고 점수를 올리세요.',welcome:'EIXO에 오신 것을 환영합니다',countryIntro:'먼저 국가를 선택하세요.',country:'국가',continue:'계속 ▶',nameTitle:'이름 선택',nameText:'이 이름은 플레이어에게 등록되며 다른 사람이 사용할 수 없습니다.',nameLabel:'플레이어 이름',create:'플레이어 만들기 ▶',nameInvalid:'3~16자의 영문 또는 숫자만 사용할 수 있습니다.',nameTaken:'이미 사용 중인 이름입니다.'},
    zh:{play:'开始游戏',ranking:'排行榜',rooms:'房间',about:'关于',myRooms:'我的房间',instruction:'当小点移动到中心时点击',worldTop:'世界排名',fullRanking:'查看完整排名',aboutText:' — 简单的反应力游戏。击中中心，获得更高分数。',welcome:'欢迎来到 EIXO',countryIntro:'请选择你的国家。',country:'国家',continue:'继续 ▶',nameTitle:'选择你的名字',nameText:'这个名字将永久关联你的玩家，其他人不能使用。',nameLabel:'玩家名称',create:'创建玩家 ▶',nameInvalid:'只能使用3–16个英文字母或数字。',nameTaken:'这个名字已经被使用。'},
    ru:{play:'ИГРАТЬ',ranking:'РЕЙТИНГ',rooms:'КОМНАТЫ',about:'ОБ ИГРЕ',myRooms:'МОИ КОМНАТЫ',instruction:'НАЖМИТЕ, КОГДА ТОЧКА БУДЕТ В ЦЕНТРЕ',worldTop:'МИРОВОЙ РЕЙТИНГ',fullRanking:'ПОЛНЫЙ РЕЙТИНГ',aboutText:' — простая игра на реакцию. Попадите в центр и набирайте очки.',welcome:'ДОБРО ПОЖАЛОВАТЬ В EIXO',countryIntro:'Сначала выберите страну.',country:'СТРАНА',continue:'ПРОДОЛЖИТЬ ▶',nameTitle:'ВЫБЕРИТЕ ИМЯ',nameText:'Это имя будет навсегда связано с игроком и не может быть занято другим.',nameLabel:'ИМЯ ИГРОКА',create:'СОЗДАТЬ ИГРОКА ▶',nameInvalid:'Используйте 3–16 букв или цифр, без пробелов и символов.',nameTaken:'Это имя уже используется.'},
    pl:{play:'GRAJ',ranking:'RANKING',rooms:'POKOJE',about:'O GRZE',myRooms:'MOJE POKOJE',instruction:'KLIKNIJ, GDY PUNKT ZNAJDZIE SIĘ W ŚRODKU',worldTop:'RANKING ŚWIATOWY',fullRanking:'PEŁNY RANKING',aboutText:' — prosta gra refleksowa. Traf w środek i zdobywaj punkty.',welcome:'WITAJ W EIXO',countryIntro:'Najpierw wybierz swój kraj.',country:'KRAJ',continue:'DALEJ ▶',nameTitle:'WYBIERZ NAZWĘ',nameText:'Ta nazwa zostanie przypisana do gracza i nie może być użyta przez nikogo innego.',nameLabel:'NAZWA GRACZA',create:'UTWÓRZ GRACZA ▶',nameInvalid:'Użyj 3–16 liter lub cyfr, bez spacji i symboli.',nameTaken:'Ta nazwa jest już zajęta.'},
    nl:{play:'SPELEN',ranking:'RANGLIJST',rooms:'KAMERS',about:'OVER',myRooms:'MIJN KAMERS',instruction:'KLIK WANNEER DE PUNT IN HET MIDDEN STAAT',worldTop:'WERELDRANGLIJST',fullRanking:'VOLLEDIGE RANGLIJST',aboutText:' — een eenvoudig reactiespel. Raak het midden en scoor punten.',welcome:'WELKOM BIJ EIXO',countryIntro:'Kies eerst je land.',country:'LAND',continue:'DOORGAAN ▶',nameTitle:'KIES JE NAAM',nameText:'Deze naam wordt aan je speler gekoppeld en kan niet door iemand anders worden gebruikt.',nameLabel:'SPELERSNAAM',create:'SPELER MAKEN ▶',nameInvalid:'Gebruik 3–16 letters of cijfers, zonder spaties of symbolen.',nameTaken:'Deze naam is al in gebruik.'},
    tr:{play:'OYNA',ranking:'SIRALAMA',rooms:'ODALAR',about:'HAKKINDA',myRooms:'ODALARIM',instruction:'NOKTA MERKEZE GELDİĞİNDE TIKLA',worldTop:'DÜNYA SIRALAMASI',fullRanking:'TAM SIRALAMAYI GÖR',aboutText:' — basit bir refleks oyunu. Merkeze isabet et ve puan kazan.',welcome:'EIXO’YA HOŞ GELDİN',countryIntro:'Önce ülkeni seç.',country:'ÜLKE',continue:'DEVAM ▶',nameTitle:'ADINI SEÇ',nameText:'Bu isim oyuncuna bağlanır ve başka biri tarafından kullanılamaz.',nameLabel:'OYUNCU ADI',create:'OYUNCU OLUŞTUR ▶',nameInvalid:'3–16 harf veya rakam kullan. Boşluk ve sembol kullanma.',nameTaken:'Bu isim zaten kullanılıyor.'},
    ar:{play:'لعب',ranking:'الترتيب',rooms:'الغرف',about:'حول',myRooms:'غرفي',instruction:'اضغط عندما تكون النقطة في المنتصف',worldTop:'الترتيب العالمي',fullRanking:'عرض الترتيب الكامل',aboutText:' — لعبة رد فعل بسيطة. أصب في المنتصف واجمع النقاط.',welcome:'مرحباً بك في EIXO',countryIntro:'اختر بلدك أولاً.',country:'البلد',continue:'متابعة ▶',nameTitle:'اختر اسمك',nameText:'سيتم ربط هذا الاسم باللاعب ولن يتمكن أي شخص آخر من استخدامه.',nameLabel:'اسم اللاعب',create:'إنشاء لاعب ▶',nameInvalid:'استخدم 3–16 حرفاً أو رقماً فقط، بدون مسافات أو رموز.',nameTaken:'هذا الاسم مستخدم بالفعل.'},
    sv:{play:'SPELA',ranking:'RANKING',rooms:'RUM',about:'OM',myRooms:'MINA RUM',instruction:'KLICKA NÄR PUNKTEN ÄR I MITTEN',worldTop:'VÄRLDSRANKING',fullRanking:'VISA HELA RANKINGEN',aboutText:' — ett enkelt reflexspel. Träffa mitten och få poäng.',welcome:'VÄLKOMMEN TILL EIXO',countryIntro:'Välj först ditt land.',country:'LAND',continue:'FORTSÄTT ▶',nameTitle:'VÄLJ DITT NAMN',nameText:'Namnet kopplas till din spelare och kan inte användas av någon annan.',nameLabel:'SPELARNAMN',create:'SKAPA SPELARE ▶',nameInvalid:'Använd 3–16 bokstäver eller siffror, utan mellanslag eller symboler.',nameTaken:'Namnet används redan.'},
    no:{play:'SPILL',ranking:'RANGERING',rooms:'ROM',about:'OM',myRooms:'MINE ROM',instruction:'KLIKK NÅR PUNKTET ER I MIDTEN',worldTop:'VERDENSRANGERING',fullRanking:'SE HELE RANGERINGEN',aboutText:' — et enkelt reaksjonsspill. Treff midten og få poeng.',welcome:'VELKOMMEN TIL EIXO',countryIntro:'Velg landet ditt først.',country:'LAND',continue:'FORTSETT ▶',nameTitle:'VELG NAVN',nameText:'Navnet knyttes til spilleren din og kan ikke brukes av andre.',nameLabel:'SPILLERNAVN',create:'OPPRETT SPILLER ▶',nameInvalid:'Bruk 3–16 bokstaver eller tall, uten mellomrom eller symboler.',nameTaken:'Navnet er allerede i bruk.'},
    da:{play:'SPIL',ranking:'RANGLISTE',rooms:'RUM',about:'OM',myRooms:'MINE RUM',instruction:'KLIK NÅR PRIKKEN ER I MIDTEN',worldTop:'VERDENSRANGLISTE',fullRanking:'SE HELE RANGLISTEN',aboutText:' — et enkelt reaktionsspil. Ram midten og få point.',welcome:'VELKOMMEN TIL EIXO',countryIntro:'Vælg først dit land.',country:'LAND',continue:'FORTSÆT ▶',nameTitle:'VÆLG DIT NAVN',nameText:'Navnet bliver knyttet til din spiller og kan ikke bruges af andre.',nameLabel:'SPILLERNAVN',create:'OPRET SPILLER ▶',nameInvalid:'Brug 3–16 bogstaver eller tal, uden mellemrum eller symboler.',nameTaken:'Navnet er allerede i brug.'},
    fi:{play:'PELAA',ranking:'RANKING',rooms:'HUONEET',about:'TIETOA',myRooms:'OMAT HUONEET',instruction:'NAPSAUTA KUN PISTE ON KESKELLÄ',worldTop:'MAAILMANLISTA',fullRanking:'NÄYTÄ KOKO LISTA',aboutText:' — yksinkertainen reaktiopeli. Osu keskelle ja kerää pisteitä.',welcome:'TERVETULOA EIXOON',countryIntro:'Valitse ensin maasi.',country:'MAA',continue:'JATKA ▶',nameTitle:'VALITSE NIMESI',nameText:'Nimi liitetään pelaajaasi eikä kukaan muu voi käyttää sitä.',nameLabel:'PELAAJAN NIMI',create:'LUO PELAAJA ▶',nameInvalid:'Käytä 3–16 kirjainta tai numeroa ilman välilyöntejä tai symboleja.',nameTaken:'Nimi on jo käytössä.'},
    el:{play:'ΠΑΙΞΕ',ranking:'ΚΑΤΑΤΑΞΗ',rooms:'ΔΩΜΑΤΙΑ',about:'ΣΧΕΤΙΚΑ',myRooms:'ΤΑ ΔΩΜΑΤΙΑ ΜΟΥ',instruction:'ΠΑΤΗΣΕ ΟΤΑΝ Η ΤΕΛΕΙΑ ΕΙΝΑΙ ΣΤΟ ΚΕΝΤΡΟ',worldTop:'ΠΑΓΚΟΣΜΙΑ ΚΑΤΑΤΑΞΗ',fullRanking:'ΠΛΗΡΗΣ ΚΑΤΑΤΑΞΗ',aboutText:' — ένα απλό παιχνίδι αντανακλαστικών. Πέτυχε το κέντρο και κέρδισε πόντους.',welcome:'ΚΑΛΩΣ ΗΡΘΕΣ ΣΤΟ EIXO',countryIntro:'Επίλεξε πρώτα τη χώρα σου.',country:'ΧΩΡΑ',continue:'ΣΥΝΕΧΕΙΑ ▶',nameTitle:'ΔΙΑΛΕΞΕ ΟΝΟΜΑ',nameText:'Το όνομα συνδέεται με τον παίκτη σου και δεν μπορεί να χρησιμοποιηθεί από άλλον.',nameLabel:'ΟΝΟΜΑ ΠΑΙΚΤΗ',create:'ΔΗΜΙΟΥΡΓΙΑ ▶',nameInvalid:'Χρησιμοποίησε 3–16 γράμματα ή αριθμούς, χωρίς κενά ή σύμβολα.',nameTaken:'Το όνομα χρησιμοποιείται ήδη.'},
    cs:{play:'HRÁT',ranking:'ŽEBŘÍČEK',rooms:'MÍSTNOSTI',about:'O HŘE',myRooms:'MOJE MÍSTNOSTI',instruction:'KLIKNĚTE, KDYŽ JE BOD UPROSTŘED',worldTop:'SVĚTOVÝ ŽEBŘÍČEK',fullRanking:'ZOBRAZIT CELÝ ŽEBŘÍČEK',aboutText:' — jednoduchá reflexní hra. Zasáhni střed a získávej body.',welcome:'VÍTEJ V EIXO',countryIntro:'Nejprve vyber svou zemi.',country:'ZEMĚ',continue:'POKRAČOVAT ▶',nameTitle:'VYBER JMÉNO',nameText:'Toto jméno bude spojeno s hráčem a nikdo jiný ho nebude moci použít.',nameLabel:'JMÉNO HRÁČE',create:'VYTVOŘIT HRÁČE ▶',nameInvalid:'Použij 3–16 písmen nebo číslic bez mezer a symbolů.',nameTaken:'Toto jméno je již používáno.'},
    id:{play:'MAIN',ranking:'PERINGKAT',rooms:'RUANGAN',about:'TENTANG',myRooms:'RUANGAN SAYA',instruction:'KLIK SAAT TITIK BERADA DI TENGAH',worldTop:'PERINGKAT DUNIA',fullRanking:'LIHAT PERINGKAT LENGKAP',aboutText:' — permainan refleks sederhana. Tepat di tengah dan raih poin.',welcome:'SELAMAT DATANG DI EIXO',countryIntro:'Pilih negara kamu terlebih dahulu.',country:'NEGARA',continue:'LANJUT ▶',nameTitle:'PILIH NAMA',nameText:'Nama ini akan terikat pada pemainmu dan tidak dapat digunakan orang lain.',nameLabel:'NAMA PEMAIN',create:'BUAT PEMAIN ▶',nameInvalid:'Gunakan 3–16 huruf atau angka, tanpa spasi atau simbol.',nameTaken:'Nama tersebut sudah digunakan.'},
    th:{play:'เล่น',ranking:'อันดับ',rooms:'ห้อง',about:'เกี่ยวกับ',myRooms:'ห้องของฉัน',instruction:'กดเมื่อจุดอยู่ตรงกลาง',worldTop:'อันดับโลก',fullRanking:'ดูอันดับทั้งหมด',aboutText:' — เกมฝึกปฏิกิริยาที่เรียบง่าย เล็งตรงกลางเพื่อทำคะแนน.',welcome:'ยินดีต้อนรับสู่ EIXO',countryIntro:'เลือกประเทศของคุณก่อน',country:'ประเทศ',continue:'ดำเนินการต่อ ▶',nameTitle:'เลือกชื่อของคุณ',nameText:'ชื่อนี้จะผูกกับผู้เล่นของคุณและผู้อื่นจะใช้ไม่ได้',nameLabel:'ชื่อผู้เล่น',create:'สร้างผู้เล่น ▶',nameInvalid:'ใช้ตัวอักษรภาษาอังกฤษหรือตัวเลข 3–16 ตัว ห้ามเว้นวรรคหรือสัญลักษณ์',nameTaken:'ชื่อนี้ถูกใช้แล้ว'},
    vi:{play:'CHƠI',ranking:'XẾP HẠNG',rooms:'PHÒNG',about:'GIỚI THIỆU',myRooms:'PHÒNG CỦA TÔI',instruction:'BẤM KHI CHẤM NẰM Ở GIỮA',worldTop:'XẾP HẠNG THẾ GIỚI',fullRanking:'XEM XẾP HẠNG ĐẦY ĐỦ',aboutText:' — trò chơi phản xạ đơn giản. Đánh trúng tâm và ghi điểm.',welcome:'CHÀO MỪNG ĐẾN EIXO',countryIntro:'Trước tiên hãy chọn quốc gia.',country:'QUỐC GIA',continue:'TIẾP TỤC ▶',nameTitle:'CHỌN TÊN',nameText:'Tên này sẽ được gắn với người chơi và không ai khác có thể sử dụng.',nameLabel:'TÊN NGƯỜI CHƠI',create:'TẠO NGƯỜI CHƠI ▶',nameInvalid:'Dùng 3–16 chữ cái hoặc số, không có khoảng trắng hay ký hiệu.',nameTaken:'Tên này đã được sử dụng.'},
    he:{play:'שחק',ranking:'דירוג',rooms:'חדרים',about:'אודות',myRooms:'החדרים שלי',instruction:'לחץ כשהנקודה במרכז',worldTop:'דירוג עולמי',fullRanking:'הצג דירוג מלא',aboutText:' — משחק תגובה פשוט. פגע במרכז וצבור נקודות.',welcome:'ברוכים הבאים ל-EIXO',countryIntro:'בחרו תחילה את המדינה שלכם.',country:'מדינה',continue:'המשך ▶',nameTitle:'בחרו שם',nameText:'השם ישויך לשחקן שלכם ולא יוכל לשמש שחקן אחר.',nameLabel:'שם שחקן',create:'צור שחקן ▶',nameInvalid:'יש להשתמש ב-3–16 אותיות או מספרים, ללא רווחים או סמלים.',nameTaken:'השם כבר בשימוש.'}
  };

  Object.assign(translations, extraTranslations);
  Object.entries(languageGroups).forEach(([language, codes]) => codes.forEach(code => { languageByCountry[code] = language; }));

  // Reset the interface after the additional translations have loaded.
  if (typeof applyLanguage === 'function') applyLanguage();
})();
