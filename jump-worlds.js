/* EIXO JUMP worlds — detailed procedural pixel-art scenes inspired by the four reference moods. */
(function(root){
'use strict';
const palettes={
 city:{top:'#8de7ef',edge:'#4c9eb8',under:'#294761',fragile:'#ffc56b'},
 forest:{top:'#b8e68b',edge:'#62955d',under:'#405949',fragile:'#ffc56b'},
 desert:{top:'#ffd68a',edge:'#c77a50',under:'#784656',fragile:'#ffc56b'},
 snow:{top:'#f2fbff',edge:'#8fc7dc',under:'#496983',fragile:'#ffc56b'}
};
function draw(c,biome,seed,cam=0,time=0){
 const W=450,H=195,q=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.ceil(w)),Math.max(1,Math.ceil(h)));};
 const rnd=n=>{let x=Math.imul((seed+n*7919)|0,1597334677);return((x^(x>>>16))>>>0)/4294967296;};
 const wrap=(v,m)=>((v%m)+m)%m,par=cam*.035;
 const band=cols=>{for(let y=0;y<H;y+=2)q(0,y,W,2,cols[Math.min(cols.length-1,Math.floor(y/H*cols.length))]);};
 const cloud=(x,y,s,col)=>{q(x+9*s,y,26*s,4*s,col);q(x,y+4*s,48*s,5*s,col);q(x+6*s,y+9*s,34*s,3*s,col);q(x+18*s,y-3*s,17*s,4*s,col);};
 const moon=(x,y,r,col,shade)=>{q(x-r,y-r,r*2,r*2,col);q(x-r-3,y-r+4,r*2+6,r*2-8,col);if(shade){q(x-2,y-r+3,r+4,3,shade);q(x-r+3,y+3,r-1,3,shade);}};
 const mountain=(x,base,w,h,col,snow)=>{
  for(let yy=0;yy<h;yy+=3){const f=yy/h,half=Math.max(2,w*.5*f);q(x+w/2-half,base-h+yy,half*2,3,col);}
  if(snow){for(let yy=0;yy<Math.min(30,h);yy+=3){const f=yy/Math.min(30,h),half=Math.max(1,w*(.07+.16*f));q(x+w/2-half,base-h+yy,half*2,3,snow);}}
 };
 const pine=(x,base,s,col,snow)=>{q(x-2*s,base-25*s,4*s,25*s,'#243d47');for(let j=0;j<4;j++){const w=(16+j*7)*s,y=base-(46-j*9)*s;q(x-w/2,y,w,12*s,col);if(snow)q(x-w/2+2*s,y,w-4*s,3*s,snow);}};
 const star=(x,y,col='#fff')=>{q(x,y,1,1,col);if(rnd(x+y)>.86){q(x-1,y,3,1,col);q(x,y-1,1,3,col);}};
 const waterLine=(y,col)=>{for(let x=0;x<W;x+=9){const len=3+Math.floor(rnd(x+y)*9);q(x,y+Math.floor(rnd(x*2+y)*3),len,1,col);}};

 if(biome==='city'){
  band(['#12284a','#18345d','#284b77','#425f8a','#765f88','#bb7088','#ef9d91']);
  for(let i=0;i<35;i++)star(Math.floor(rnd(i+30)*W),8+Math.floor(rnd(i+70)*74),rnd(i+5)>.7?'#bcecff':'#fff3de');
  moon(366,24,10,'#ffe9c9','#d6c3ba');
  cloud(34-wrap(par*.25,560),31,.8,'#8393b26e');cloud(226-wrap(par*.15,620),47,.6,'#9099b46b');
  // distant skyline
  for(let layer=0;layer<3;layer++){
   const spacing=[30,36,43][layer],speed=par*(.42+layer*.55),base=160+layer*8;
   for(let i=-2;i<17;i++){
    const x=i*spacing-wrap(speed,spacing),w=spacing-5,h=32+Math.floor(rnd(i+layer*67+11)*(32+layer*22)),y=base-h;
    const body=['#526b8a','#334f72','#1b3656'][layer],side=['#435a79','#294361','#142c49'][layer];
    q(x,y,w,h,body);q(x+w-5,y+4,5,h-4,side);
    if(i%5===0){q(x+Math.floor(w*.55),y-10,2,10,side);q(x+Math.floor(w*.55)-1,y-12,4,2,i%2?'#ff6ab1':'#67eaff');}
    for(let wy=y+7;wy<base-4;wy+=8)for(let wx=x+5;wx<x+w-5;wx+=7)if(rnd(i*191+wx+wy+layer)>.39)q(wx,wy,2,3,rnd(wx+wy)>.23?'#ffd38a':'#65dbe3');
    if(layer===2&&i%4===1){q(x+5,y+12,8,18,'#633c78');q(x+6,y+14,6,3,'#ff5ac7');q(x+7,y+20,4,2,'#8df5ff');}
   }
  }
  // landmark towers and bridges
  q(286,45,26,117,'#253f62');q(294,30,10,132,'#2d4b72');q(297,18,4,13,'#567ba3');q(298,15,2,4,'#ff657d');
  for(let y=42;y<150;y+=10){q(299,y,2,5,'#6ce9f1');q(305,y+3,2,4,'#ff79c7');}
  q(0,149,W,2,'#506785');q(188,141,132,4,'#2d4967');for(let x=190;x<320;x+=18)q(x,145,3,21,'#263e58');
  // reflective canal and near rooftops
  q(0,164,W,31,'#10283d');waterLine(171,'#466985');waterLine(181,'#255070');waterLine(188,'#1a405e');
  for(let x=20;x<W;x+=67){q(x,154,48,28,'#102235');q(x+5,149,38,6,'#1a3045');q(x+10,159,6,5,'#ffb972');q(x+30,160,5,4,'#5ee4e8');}
  q(wrap(time*19,W+60)-60,151,60,3,'#59c6dc');for(let x=0;x<60;x+=10)q(wrap(time*19,W+60)-57+x,150,5,2,'#aaf5ff');
 }else if(biome==='forest'){
  band(['#162a4d','#1b3859','#28516b','#397079','#55928b','#6aa394']);
  for(let i=0;i<24;i++)star(Math.floor(rnd(i+300)*W),8+Math.floor(rnd(i+330)*70),i%5?'#f4f0d8':'#ffe987');
  moon(315,34,16,'#f4e8c5','#c9c8bd');
  // misty stone needles
  for(let i=-1;i<8;i++)mountain(i*68-wrap(par*.22,68),149,90,58+Math.floor(rnd(i+10)*34),'#375d68',null);
  // ruin arch
  q(294,70,9,74,'#526c67');q(343,70,9,74,'#526c67');q(303,67,40,9,'#637b72');q(310,58,26,10,'#637b72');q(315,52,16,7,'#5c756d');
  q(307,75,38,4,'#2f5051');q(312,80,28,3,'#263f45');q(303,65,4,18,'#41705e');q(343,63,4,22,'#41705e');
  // waterfall behind ruins
  q(319,102,18,58,'#75bcc2');q(323,101,10,60,'#a1d5d0');q(327,102,3,60,'#d1ece2');q(312,157,34,6,'#5ba3a7');
  // massive foreground trees
  const tree=(x,flip=1)=>{q(x,0,32,195,'#172b2d');q(x+flip*12,0,18,132,'#203c35');for(let y=10;y<170;y+=18){q(x+(flip>0?22:-28),y,36,9,'#1c3830');q(x+(flip>0?38:-38),y+7,28,8,'#22483a');}for(let y=28;y<170;y+=23){q(x+(flip>0?10:-7),y,4,26,'#41654d');}};
  tree(0,1);tree(418,-1);
  // mid canopy
  for(let layer=0;layer<2;layer++){for(let i=-2;i<12;i++){const x=i*48-wrap(par*(.55+layer*.4),48),base=178,h=50+Math.floor(rnd(i+layer*41)*42);q(x+20,base-h,7,h,'#264538');q(x,base-h-9,47,14,layer?'#244838':'#35634a');q(x+7,base-h-20,34,13,layer?'#2b563f':'#427657');}}
  // forest floor / lake / glowing fireflies
  q(0,166,W,29,'#163d37');q(70,169,310,22,'#285f62');waterLine(174,'#5b9190');waterLine(184,'#3f7a78');
  for(let i=0;i<26;i++){const x=rnd(i+480)*W,y=60+rnd(i+520)*115;q(x,y,i%7===0?2:1,i%7===0?2:1,i%3?'#f8dc74':'#9be98e');}
  for(const x of [62,108,386]){q(x,170,3,11,'#9c866c');q(x-5,166,13,5,'#8eaad0');q(x-1,165,6,2,'#d8e3ef');}
 }else if(biome==='desert'){
  band(['#6e4e84','#8c5b89','#bc6c79','#e08168','#f39b68','#ffc36f','#ffd889']);
  cloud(32-wrap(par*.12,560),29,.72,'#ffd19c8c');cloud(233-wrap(par*.08,620),50,.55,'#ffd7ad78');
  q(96,50,28,3,'#ffd27e');q(102,47,16,9,'#ffe19b');q(105,44,10,15,'#ffe7ac');
  // mesa helper
  const mesa=(x,base,w,h,col,hi)=>{q(x,base-h+12,w,h-12,col);q(x+8,base-h,w-16,13,col);q(x+14,base-h-6,w-28,7,col);q(x+5,base-h+21,w-10,3,hi);for(let y=base-h+32;y<base;y+=15)q(x+Math.floor(rnd(x+y)*w*.65),y,8+Math.floor(rnd(y)*16),2,'#7e4650');};
  for(let layer=0;layer<3;layer++){for(let i=-2;i<8;i++){const spacing=96,x=i*spacing-wrap(par*(.32+layer*.42),spacing),base=167+layer*8,h=42+layer*14+Math.floor(rnd(i+layer*29+8)*20);mesa(x,base,72,h,['#c5796b','#a75d5a','#784652'][layer],['#e69a74','#c77764','#94555b'][layer]);}}
  // giant natural arch
  q(287,72,101,85,'#8e4e52');q(307,89,61,68,'#d07a64');q(320,100,37,57,'#b5675c');q(330,110,18,47,'#b67c69');
  q(305,100,65,57,'#c87561');q(318,108,42,49,'#e1976d');q(327,115,24,42,'#eaa579');
  // carve a sky hole by painting matching sky tones
  q(319,98,43,43,'#d77b6c');q(325,92,31,7,'#c9736c');q(326,105,29,42,'#de856d');
  // temple facade
  q(378,71,56,93,'#7a4350');q(384,63,44,10,'#a15a58');q(389,57,34,7,'#a75f59');for(let x=386;x<430;x+=9){q(x,82,5,63,'#9c5a57');q(x+1,84,3,59,'#c37461');}q(383,146,48,7,'#5b3847');
  // dunes, oasis, foreground cliffs
  for(let x=0;x<W;x+=4){const y=166+Math.sin((x+par)/49)*6+Math.sin(x/17)*2;q(x,y,4,H-y,'#c9825d');q(x,y,4,2,'#f0ac70');}
  q(190,174,72,11,'#3c7d75');waterLine(177,'#72aaa0');for(let x=184;x<270;x+=10)q(x,168,2,9,'#3e6c52');
  q(0,157,55,38,'#5b3447');q(399,153,51,42,'#583346');for(let y=160;y<195;y+=9){q(0,y,44,3,'#74404b');q(410,y,40,3,'#71404b');}
 }else{
  band(['#071d45','#0b2b5b','#124271','#1d5681','#326c91','#557e9b']);
  for(let i=0;i<55;i++)star(Math.floor(rnd(i+600)*W),4+Math.floor(rnd(i+650)*88),i%8?'#d8f5ff':'#ffffff');
  moon(372,31,14,'#edf6ff','#bbcde2');
  // aurora ribbons
  for(let x=-20;x<W+20;x+=4){const y=16+Math.sin((x+time*4)/33)*8+Math.sin(x/71)*5;q(x,y,4,5,'#42c9b77a');q(x,y+5,4,4,'#59e2ce68');q(x,y+9,4,3,'#6b6fc46e');}
  // layered alpine range
  for(let i=-2;i<6;i++)mountain(i*105-wrap(par*.25,105),161,142,78,'#365b84','#bcd9ef');
  for(let i=-2;i<6;i++)mountain(i*116-wrap(par*.55,116),174,136,66,'#294c73','#91b8d7');
  for(let i=-2;i<15;i++)pine(i*36-wrap(par*1.1,36),181+Math.floor(rnd(i+44)*5),.83,'#173d58','#b9dceb');
  // lake reflections
  q(0,163,W,32,'#173d61');waterLine(168,'#4d7290');waterLine(178,'#315b7b');waterLine(188,'#244866');
  q(338,156,34,25,'#594d51');q(333,151,44,7,'#7a6260');q(342,162,8,7,'#ffd17d');q(359,162,8,7,'#ffd17d');q(353,169,7,12,'#2f2e38');
  // foreground icy cliffs
  q(0,158,47,37,'#142d48');q(403,154,47,41,'#142b46');for(let x=0;x<42;x+=7)q(x,157+Math.floor(rnd(x)*8),5,21,'#bde8f3');for(let x=408;x<449;x+=7)q(x,155+Math.floor(rnd(x+1)*8),5,23,'#bde8f3');
  for(let i=0;i<28;i++){const x=wrap(rnd(i+720)*W+time*(3+i%4),W),y=wrap(rnd(i+760)*H+time*(5+i%3),H);q(x,y,i%7===0?2:1,i%11===0?2:1,'#ecfbff');}
 }
 // Gameplay contrast wash: rich backgrounds remain visible but never swallow platforms/avatars.
 q(0,0,W,H,'#06101a12');
}
function platform(c,biome,x,y,w,index,state={}){
 const t=palettes[biome]||palettes.forest,q=(a,b,d,e,col)=>{c.fillStyle=col;c.fillRect(Math.round(a),Math.round(b),Math.max(1,Math.round(d)),Math.max(1,e));};
 const fragile=!!state.fragile,progress=Math.max(0,Math.min(1,Number(state.progress)||0));
 q(x+2,y+7,w,5,'#07101c88');q(x,y,w,9,t.under);q(x,y,w,3,t.edge);q(x,y-3,w,3,t.top);
 for(let j=6;j<w-4;j+=12){q(x+j,y+4,5,2,t.edge);if((j+index)%3===0)q(x+j,y+7,3,2,t.under);}
 if(biome==='city'){for(let j=7;j<w-5;j+=18){q(x+j,y+3,6,1,'#a8f4ff');q(x+j+2,y+6,2,1,'#ff76c6');}}
 if(biome==='forest'){for(let j=5;j<w-3;j+=15){q(x+j,y-5,2,3,'#c7ec8e');q(x+j+2,y-4,3,1,'#6ebb69');}q(x+8,y+8,2,6,'#5f7f51');}
 if(biome==='desert'){q(x+4,y-2,w-8,1,'#ffe6aa');for(let j=13;j<w-4;j+=24){q(x+j,y+2,1,5,'#6f4050');q(x+j+1,y+6,4,1,'#a15d56');}}
 if(biome==='snow'){q(x+2,y-4,w-4,2,'#ffffff');for(let j=8;j<w-6;j+=21){q(x+j,y+7,3,5,'#82c3dd');q(x+j+1,y+12,1,3,'#d9f5fb');}}
 if(fragile){const warn=progress>.02?t.fragile:'#dca053';q(x+2,y-1,Math.max(2,w-4),1,warn);const cracks=2+Math.floor(progress*5);for(let j=0;j<cracks;j++){const cx=x+8+((index*17+j*23)%Math.max(12,w-16)),cy=y+2+(j%2);q(cx,cy,2,1,warn);q(cx+1,cy+1,1,2,warn);}if(progress>.62)for(let j=3;j<w-3;j+=7)q(x+j,y+7,3,1,warn);}
}
root.EixoJumpWorlds={draw,platform,palettes,version:'jump11'};
})(typeof window==='undefined'?globalThis:window);
