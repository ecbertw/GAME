/* EIXO JUMP worlds — original procedural pixel art, drawn entirely on the canvas. */
(function(root){
'use strict';
const palettes={
 city:{sky:['#0a1024','#172141','#34345a','#70475f','#d17a72','#f2b082'],top:'#83f0e7',edge:'#337f91',under:'#22334f',fragile:'#ffb35c'},
 forest:{sky:['#071f29','#123642','#1f5960','#3c7b72','#87ad86','#bfd39c'],top:'#9bdc76',edge:'#3d8b58',under:'#3d4b3d',fragile:'#f4bd67'},
 desert:{sky:['#201b3a','#4a3150','#86485a','#c96c63','#ec9d77','#ffd19c'],top:'#f2cf79',edge:'#b8784e',under:'#75464c',fragile:'#ffb557'},
 snow:{sky:['#08162d','#14304b','#245875','#477f91','#86aeb6','#c9dfe0'],top:'#e9fbff',edge:'#80bdd2',under:'#3d6381',fragile:'#ffc97b'}
};
function draw(c,biome,seed,cam=0,time=0){
 const t=palettes[biome]||palettes.forest,W=450,H=195;
 const q=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.ceil(w)),Math.max(1,Math.ceil(h)));};
 const rand=n=>{let x=Math.imul((seed+n*7919)|0,1597334677);return((x^(x>>>16))>>>0)/4294967296;};
 const wrap=(v,m)=>((v%m)+m)%m,offset=cam*.04;
 for(let y=0;y<H;y+=2)q(0,y,W,2,t.sky[Math.min(t.sky.length-1,Math.floor(y/H*t.sky.length))]);
 const star=(x,y,b=1)=>{q(x,y,b,b,'#f5f0dc');if(b>1){q(x-2,y+1,1,1,'#dce8ee');q(x+b+1,y+1,1,1,'#dce8ee')}};
 for(let i=0;i<28;i++)if(rand(i+700)>.18)star(Math.floor(rand(i+710)*W),8+Math.floor(rand(i+720)*66),rand(i+730)>.86?2:1);
 const cloud=(x,y,col)=>{q(x+7,y,29,3,col);q(x,y+3,52,5,col);q(x+5,y+8,41,2,col);q(x+18,y-2,17,3,col);};
 const mountain=(x,y,w,col,cap)=>{
  for(let h=0;h<H-y;h+=3){const half=Math.min(w/2,4+h*.72);q(x+w/2-half,y+h,half*2,3,col);if(cap&&h<21)q(x+w/2-half,y+h,half*1.25,3,cap);}
 };
 const pine=(x,y,s,col,cap)=>{
  q(x-2*s,y+24*s,4*s,19*s,'#30485a');
  for(let j=0;j<4;j++){const ww=(8+j*6)*s;q(x-ww/2,y+j*7*s,ww,9*s,col);if(cap)q(x-ww/2+1,y+j*7*s,ww-2,2*s,cap);}
 };

 if(biome==='city'){
  // Neon dusk skyline: moon, antennae, signs, windows and a lower transit line.
  q(345,22,26,26,'#ffd7ad');q(341,27,34,16,'#ffd7ad');q(349,17,18,5,'#ffe4c2');
  cloud(39,35,'#4d4868');cloud(188,48,'#66516c');
  for(let layer=0;layer<3;layer++){
   const spacing=layer===2?42:34,speed=(layer+1)*offset;
   for(let i=-2;i<15;i++){
    const x=i*spacing-wrap(speed,spacing),w=spacing-5,h=32+rand(i+layer*57+20)*66+layer*9,y=H-h;
    const base=['#494661','#313c5a','#172b48'][layer],side=['#383b56','#25344f','#11243d'][layer];
    q(x,y,w,h,base);q(x+4,y-4,w-8,4,base);q(x+w-5,y+3,5,h-3,side);
    if(i%3===0){q(x+w*.48,y-15,2,15,side);q(x+w*.48-2,y-17,6,2,i%2?'#ff7f8f':'#7ef1e3');}
    if(layer===2&&i%4===1){q(x+6,y+13,12,18,'#6d2e58');q(x+7,y+14,10,4,'#f06eab');q(x+9,y+20,6,2,'#ffd4e8');q(x+9,y+25,6,2,'#ffd4e8');}
    for(let wy=y+8;wy<H-5;wy+=9)for(let wx=x+5;wx<x+w-7;wx+=7){
      if(rand(i*151+wy+wx+layer)>.36)q(wx,wy,3,4,rand(i+wx+wy)>.2?'#f0b67f':'#7bd5d3');
    }
   }
  }
  q(0,178,W,17,'#0d1a2d');q(0,179,W,2,'#274f64');
  for(let x=-20;x<W+20;x+=30){q(x,184,19,2,'#437f88');q(x+3,190,14,1,'#1e5364');}
  // Pixel elevated rail and tiny moving light.
  q(0,165,W,3,'#23364c');for(let x=10;x<W;x+=52)q(x,168,3,15,'#182b40');
  q(wrap(time*18,W)-28,160,28,5,'#466d80');q(wrap(time*18,W)-24,161,5,2,'#baf8ee');
 }else if(biome==='forest'){
  // Deep enchanted forest with layered canopy, vines, water and fireflies.
  q(333,20,24,24,'#d7e4aa');q(329,25,32,14,'#d7e4aa');
  for(let layer=0;layer<3;layer++){
   const spacing=55,speed=offset*(.65+layer*.7);
   for(let i=-2;i<11;i++){
    const x=i*spacing-wrap(speed,spacing),y=42+rand(i+layer*45+10)*51;
    const trunk=['#315d5c','#244e4f','#15383e'][layer],leaf=['#477d69','#326651','#214d40'][layer];
    q(x+22,y,8+layer*2,H-y,trunk);q(x+25,y+13,3,H-y-13,'#446f64');
    q(x+1,y-10,47,17,leaf);q(x+8,y-23,34,18,leaf);q(x+17,y-32,18,12,leaf);
    if(layer===2){q(x+29,y+16,18,3,leaf);q(x+43,y+19,3,25,leaf);q(x+6,y+22,2,37,'#55866b');}
   }
  }
  // Distant waterfall / stream catches the eye without fighting platforms.
  q(372,91,24,81,'#6ea3a0');q(376,91,16,81,'#8fc0b6');q(380,91,5,81,'#c0ded0');
  q(0,171,W,24,'#123b35');q(0,181,W,14,'#17302f');
  for(let i=0;i<22;i++){const x=i*23+Math.floor(rand(i+90)*9),y=176+Math.floor(rand(i+120)*10);q(x,y,17,4,'#285a44');q(x+4,y-2,8,2,'#477b56');}
  for(let i=0;i<30;i++){const x=rand(i+61)*W,y=wrap(rand(i+76)*165+time*(3+i%4),180);q(x,y,1+(i%5===0?1:0),1+(i%7===0?1:0),i%3?'#b4e27f':'#ffe69b');}
  // Mushrooms and a tiny shrine silhouette.
  for(const x of [31,77,332]){q(x,163,3,12,'#b4a079');q(x-5,160,13,5,'#d97c72');q(x-2,159,7,2,'#efb89a');}
  q(203,151,25,20,'#27483f');q(207,145,17,6,'#365f50');q(214,156,4,15,'#9bc077');
 }else if(biome==='desert'){
  // Monument valley silhouettes, arch, ruins and layered dunes.
  q(330,25,30,30,'#ffe0aa');q(325,31,40,18,'#ffe0aa');cloud(52,42,'#9b6170');cloud(185,58,'#c77b78');
  for(let layer=0;layer<3;layer++){
   const spacing=91,speed=offset*(.7+layer*.75);
   for(let i=-2;i<8;i++){
    const x=i*spacing-wrap(speed,spacing),y=78+layer*18+rand(i+layer*35+5)*22,col=['#b26f70','#92575f','#6d4152'][layer];
    q(x+10,y,61,H-y,col);q(x+1,y+15,79,H-y-15,col);q(x+25,y-15,30,17,col);
    q(x+13,y+9,54,3,layer===0?'#dc917c':'#a86668');q(x+4,y+34,62,2,'#84505b');
    q(x+57,y+3,6,54,layer===2?'#503348':'#754557');
   }
  }
  // Rock arch on the far right.
  q(353,112,65,58,'#704353');q(365,120,41,51,t.sky[4]);q(353,112,65,11,'#8f5860');q(347,160,12,20,'#5b3b4b');q(412,158,12,22,'#5b3b4b');
  for(let x=0;x<W;x+=4){const yy=174+Math.sin((x+offset)/47)*6+Math.sin(x/19)*2;q(x,yy,4,H-yy,'#3a3042');q(x,yy,4,2,'#c18a71');}
  for(const x of [29,110,421]){q(x,143,5,37,'#294c4a');q(x-8,153,8,5,'#294c4a');q(x-8,146,4,12,'#294c4a');q(x+4,159,10,4,'#294c4a');q(x+10,150,4,13,'#294c4a');q(x+1,144,1,30,'#648070');}
  // Ruined gate.
  q(245,148,5,31,'#b88470');q(278,148,5,31,'#b88470');q(245,146,38,5,'#d1a083');q(253,153,22,3,'#8c5f5d');
 }else{
  // Cold blue night with aurora, deep mountains, village lights and snow.
  q(350,20,22,22,'#dbe8eb');q(346,25,30,12,'#dbe8eb');
  for(let x=0;x<W;x+=4){
   const y=20+Math.sin((x+time*4)/56)*10;
   q(x,y,4,5,'#3f7c84');q(x,y+5,4,3,'#5c9a91');if(x%12===0)q(x,y+8,4,2,'#77aaa0');
  }
  for(let i=-2;i<6;i++)mountain(i*103-wrap(offset*.55,103),64+rand(i+5)*25,138,'#5d7f98','#d3e5e9');
  for(let i=-2;i<6;i++)mountain(i*116-wrap(offset,116),101+rand(i+9)*16,132,'#355b78','#96b7c7');
  for(let i=-2;i<15;i++)pine(i*36-wrap(offset*2.1,36),139+rand(i+44)*13,.82,'#1d4056','#a9cad3');
  q(0,182,W,13,'#b8d2dc');q(0,187,W,8,'#668da7');
  // Small warm cabin creates a focal point.
  q(38,154,31,25,'#5c4d4b');q(34,151,39,6,'#8a6258');q(41,160,8,7,'#ffc77b');q(56,160,8,7,'#ffc77b');q(51,168,7,11,'#342f35');q(63,143,4,11,'#51454a');q(64,141,5,3,'#d2dfe2');
  for(let i=0;i<38;i++){const x=wrap(rand(i+100)*W+time*(5+i%5),W),y=wrap(rand(i+130)*H+time*(8+i%4),H);q(x,y,i%3===0?2:1,i%4===0?2:1,'#dbeaf0');}
 }
 // Subtle dark pixel vignette at the floor improves avatar/platform contrast.
 q(0,H-1,W,1,'#09121f55');
}
function platform(c,biome,x,y,w,index,state={}){
 const t=palettes[biome]||palettes.forest,q=(a,b,d,e,col)=>{c.fillStyle=col;c.fillRect(Math.round(a),Math.round(b),Math.max(1,Math.round(d)),Math.max(1,e));};
 const fragile=!!state.fragile,progress=Math.max(0,Math.min(1,Number(state.progress)||0));
 q(x+2,y+7,w,5,'#08111f55');q(x,y,w,9,t.under);q(x,y,w,3,t.edge);q(x,y-3,w,3,t.top);
 for(let j=6;j<w-4;j+=12){q(x+j,y+4,5,2,t.edge);if((j+index)%3===0)q(x+j,y+7,3,2,t.under);}
 if(biome==='forest'){for(let j=5;j<w-3;j+=15){q(x+j,y-5,2,3,'#b4e589');q(x+j+2,y-4,3,1,'#69b576');}q(x+8,y+8,2,7,'#4c9864');}
 if(biome==='snow'){q(x+2,y-4,w-4,2,'#ffffff');for(let j=8;j<w-6;j+=21){q(x+j,y+7,3,5,'#8ac8dc');q(x+j+1,y+12,1,3,'#cdeef5');}}
 if(biome==='city'){q(x,y+8,w,2,'#13263e');for(let j=7;j<w-4;j+=19)q(x+j,y+3,6,1,'#89d7d2');q(x+3,y-2,3,1,'#fff1ba');}
 if(biome==='desert'){q(x+4,y-2,w-8,1,'#ffedc2');for(let j=13;j<w-4;j+=24)q(x+j,y+2,1,5,'#6f4650');}
 if(fragile){
  // Fragile platforms keep the biome material; amber appears only as a warning.
  const warn=progress>.02?t.fragile:'#d99b55';
  q(x+2,y-1,Math.max(2,w-4),1,warn);
  const cracks=2+Math.floor(progress*5);
  for(let j=0;j<cracks;j++){
   const cx=x+8+((index*17+j*23)%Math.max(12,w-16)),cy=y+2+(j%2);
   q(cx,cy,2,1,warn);q(cx+1,cy+1,1,2,warn);
  }
  if(progress>.62){for(let j=3;j<w-3;j+=7)q(x+j,y+7,3,1,warn);}
 }
}
root.EixoJumpWorlds={draw,platform,palettes};
})(typeof window==='undefined'?globalThis:window);
