// EIXO pixel-art data + renderer.
// The artwork is stored as a logical 72x48 grid. "." is transparent;
// hexadecimal characters address the palette below. This keeps the artwork
// as real grid pixels instead of a rectangular image element.
(() => {
  const ART = {
    width: 72,
    height: 48,
    pixelSize: 4,
    palette: ["#6b747c","#8f9ba4","#b9c5cf","#dbe5ea","#f1f5f7","#d8a77b","#b66b39","#7e4728","#4d3325","#8f6247","#a97f63","#d7b9a0","#e8d2bd","#f3e7d7","#8b6d51","#b9a88d","#6f7d7f","#42504b","#263a32","#17251f","#0f1a17","#35413a","#59604b","#73755b"],
    rows: ["........................................................................","........................................................................",".............................................ffffffff...................","....................99f99fbbbfffffffffffffbbcccccccaacbfff..............","..................9666bbbbaaacccaaccccccccccccccccaaaaaccccbff..........","...............9411666bbbbbbcaaaaaaaaaaaaaaaaaaaaaaaaaccccccccbff.......","............d8521111116bbbbbcccaafaaaaaaaaaaaaaaaa6aaaaaaaaccaaaa69.....",".......8877792111111112bbbbbbb6abfaaaaaaaaaaaaaaa66aaaaaaaaaaaaaa669....","...8523331125211221112266666661fjf966666aa666aaa666aa66aaaaaaaaaaa6a9...","..7771211111111122222322111111fjjj972000000000666666606696f6666aaa6aa9..",".84895212111111223323322111116jjjj975000000000000000006fe9e000666aaaab..","..789785222222223533322111111fjjjjf75200000000000000001f959006666666aa9.","..774779332333345553222111115ghhee877300000000000000000hdd5066660000069.","..73378e533443445533332211115hihhdd87700000000052002009hdd8100000000066.","..333488444444445433332222215ddfdd774320000000195058109h8d8000000000001.","..334787854444444445533232225ddhdd74448d8322115f92f9509fe98000000000000.","..347778ef8444333333333322525ddddd844477e222239h9599709jei8000000000010.","..44788eee7943332222333355925ddddd84448581010139955e519hddd000000001191.","..447789e97773322222223525912ddfdd87447191121259957e2ehdddd110011119995.","..877447874483332222223529929ddedd74447191212259997e55eehheee9ehhhihi9d.","..87774473334433222223322777hddeed87447195e44539e87e87ddded9d9deehhii9d.","..8447744333343333333332598ed8898d75447192h8e53e98ee5ehihhhe89e99hf99d..","..7443443333344443333332ffghdd8fff87547192eee22977de5ehihidd8hhehie98d..","..7443343333333332222222dddhdghghd84455191eee22988he9hihiidddeeehihd8d..","..8475477433323222222322dghdddhfhd844445759ef999h9i9555dii8859hfjid988..","..8787789832333222322221ddidhdhfdddeff5777595999ee9e8955877778eehhee8...","..8889999732233222255f91ddidddhhdddiig4444774778hehe8e7785559ffjjjjjd...","..d88988753222322259jjgeedhiifigdddiie784d577487dehhi9789999999jjjjfe...","..d989879jf79g9595jjkgjggegmihifdddiie4838247384dehhje8deehff7ejghjje...","..ih999jnnljjjfjjfllljejggejliigdddiie3747447374dejlmkhdehkje7ejhgged...","..dfjllnnnnffffffjmmlllkgeggjlkidddiig3844745334ekkmlkhdellkg7ehehggd...","..h99lnnnnj69ff6flnmljgjjgeejjghdddiig7gege87334elkllhkhjmkkg888eeded...","..e9fjkjlmjf6f9fjnmnljhjlhgjjjgeeddikjehihhee74799jmkkffjlkkidd88d87d...","..e9jmlkjjlf6ggjjnmlljhgkljjkhghkhdillllmlkgededejmmmkjlllkigggded88d...","..89jjljghkjjg99lmnnnlmlmmlkjhhkmhgjmlnmmmmiglnjnnnmmjhjmkjkkkedeeeee...","..8hjjnmlglkjggegnmnmnnmnmkjjjkmmmmmnmnnnnmmmnnmmnnnmljjllkkkkjeeedgg...","...kmmmmkiljgjhgjjlmknnnnlkkjjknnnmnnnnnnnmmnnnnmmmmmkjjkmmmklkhegegg...","...knnnmlikkkjjklljkkkmnmmlllmnnnnnnnnnnnnnnnnnnmmnmmkjmmmmmjjjiijjlk...","...ilmmnlihkmmmllkjkllmmmmlklnnnnnnnnnnnnnnnnkmmnmnnmmjkmmnmmkkkllmmk...","...ihjmnlihknmnmkhjlmlmmnmlkkklnnnnnmnmnnnnnmggmmnnnnmjknnnnnnnmkggjj...","...ihjnmkhiimnnmkggljggklklllllmnnnnnnnnnljkjjgjmnnnnnmlmnmnnikkjjkkk...","...ihhlmlhhhnnnnkhggjggkghglkjkmnnnnnnnnnlllkjjjjknnnnnmmnllkkkjjglkl...","....ihjkljhkjkmljjihgejgeeegg8glnnnnnnnnnllmlmlkjmnnnnnmmkllkklklkmmi...","....iijhhlimlmmmljhihg988eege8glmnnnnnnnnmmmmlmlkkmnnnmmlklmmmmmmlni....",".....igihkjjjjmggiiihhheeeeeeeglmnnnmnlnlmmmmmmknmnnnnnnnmmmmmmmmii.....",".....djllmkkljjjkijmjhhgegeehhiikkikiiilkkmlmmlknnnnnnnnmjhlmiii........","......iilkmkkklljkkkiiiiid...................iiiilmmnnlkiii.............","..........iiiiiii......................................................."]
  };

  function mount(container, art = ART) {
    if (!container) return;
    container.innerHTML = '';
    container.classList.add('eixo-pixel-art');
    container.style.setProperty('--pixel-size', art.pixelSize + 'px');
    container.style.width = (art.width * art.pixelSize) + 'px';
    container.style.height = (art.height * art.pixelSize) + 'px';
    container.setAttribute('aria-label', 'Pixel art');
    container.setAttribute('role', 'img');

    const fragment = document.createDocumentFragment();
    for (let y = 0; y < art.height; y++) {
      const row = art.rows[y] || '';
      for (let x = 0; x < art.width; x++) {
        const code = row[x];
        if (!code || code === '.') continue;
        const index = parseInt(code, 16);
        const color = art.palette[index];
        if (!color) continue;
        const pixel = document.createElement('i');
        pixel.className = 'eixo-pixel';
        pixel.style.left = (x * art.pixelSize) + 'px';
        pixel.style.top = (y * art.pixelSize) + 'px';
        pixel.style.backgroundColor = color;
        fragment.appendChild(pixel);
      }
    }
    container.appendChild(fragment);
  }

  window.EixoPixelArt = { mount, ART };
})();
