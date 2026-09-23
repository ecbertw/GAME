/* Original procedural pixel scenery: integer pixels, layered silhouettes, no assets to load. */
(function(root){
'use strict';
const palettes={
 city:{sky:['#121d3a','#293253','#574362','#ae727c','#e3a58e'],top:'#9ff5ed',edge:'#3b8797',under:'#263c57'},
 forest:{sky:['#102c35','#19424a','#28605e','#488576','#8fb990'],top:'#b4e589',edge:'#4c9864',under:'#584e45'},
 desert:{sky:['#342b53','#79516a','#c78080','#e8ab8e','#f8d7a5'],top:'#ffe0a0',edge:'#c98c62',under:'#8d5555'},
 snow:{sky:['#162c48','#254663','#426787','#7796af','#c5d6dc'],top:'#f0fbff',edge:'#8ac8dc',under:'#496d8e'}
};
function draw(c,biome,seed,cam=0,time=0){
 const t=palettes[biome]||palettes.forest,W=450,H=195;
 const q=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));};
 const rand=n=>{let x=Math.imul((seed+n*7919)|0,1597334677);return((x^(x>>>16))>>>0)/4294967296;};
 const offset=cam*.035;
 for(let y=0;y<H;y+=3)q(0,y,W,3,t.sky[Math.min(4,Math.floor(y/H*5))]);
 function cloud(x,y,col){q(x+8,y,28,3,col);q(x,y+3,52,4,col);q(x+5,y+7,39,2,col);}
 function mountain(x,y,w,col,snow){
  for(let h=0;h<H-y;h+=4){const half=Math.min(w/2,4+h*.72);q(x+w/2-half,y+h,half*2,4,col);if(snow&&h<22)q(x+w/2-half,y+h,half*1.3,4,snow);}
 }
 function pine(x,y,s,col,cap){
  q(x-2*s,y+26*s,4*s,16*s,'#394c5b');
  for(let j=0;j<4;j++){const w=(5+j*5)*s;q(x-w/2,y+j*8*s,w,10*s,col);if(cap)q(x-w/2,y+j*8*s,w,2*s,cap);}
 }
 if(biome==='city'){
  q(336,26,25,25,'#f4c5a2');q(333,31,31,15,'#f4c5a2');
  for(let i=0;i<18;i++)q(rand(i)*450,rand(i+90)*59,1,1,'#b3bdce');
  cloud(52,35,'#72708d');cloud(190,54,'#9a7c92');
  for(let layer=0;layer<3;layer++)for(let i=-1;i<18;i++){
   const width=layer===2?38:30,x=i*(width+5)-(offset*(layer+1))%(width+5),h=22+rand(i+layer*53)*70+layer*7,y=H-h;
   const colors=['#665878','#3b4565','#222f4b'];q(x,y,width,h,colors[layer]);q(x+3,y-4,width-6,4,colors[layer]);
   q(x+width-5,y,5,h,layer===2?'#17263e':'#303e5c');
   if(i%3===0){q(x+8,y-16,2,12,'#3b4565');q(x+7,y-18,4,2,'#ee9c97');}
   for(let wy=y+8;wy<H;wy+=10)for(let wx=5;wx<width-7;wx+=8)if(rand(i*99+wx+wy)>.32)q(x+wx,wy,3,4,layer===2?'#e5ad88':'#a5a5ae');
   if(layer===2&&i%3===1){q(x+5,y+17,7,25,'#f08dac');q(x+7,y+20,3,3,'#ffe3d1');q(x+7,y+28,3,6,'#ffe3d1');}
  }
  q(0,186,450,9,'#14253b');for(let x=0;x<450;x+=28)q(x,189,16,1,'#367283');
 }else if(biome==='forest'){
  q(326,23,27,27,'#d2dba3');q(322,28,35,17,'#d2dba3');
  for(let layer=0;layer<3;layer++)for(let i=-1;i<12;i++){
   const x=i*51-(offset*(layer+1))%51,y=46+rand(i+layer*30)*49,base=['#386967','#255353','#193c43'][layer];
   q(x+20,y,7+layer*2,195-y,base);
   q(x+3,y-8,41,18,base);q(x+10,y-21,28,18,base);q(x+18,y-29,15,10,base);
   if(layer===2){q(x+21,y+20,2,80,'#49716a');q(x+28,y+42,18,4,base);q(x+42,y+24,3,20,base);}
  }
  q(0,172,450,23,'#173d3b');
  for(let i=0;i<18;i++){const x=i*28; q(x,178+rand(i)*10,23,6,'#235a48');q(x+3,176+rand(i)*10,15,3,'#427d57');}
  for(let i=0;i<24;i++){const x=rand(i+61)*450,y=(rand(i+76)*170+time*(2+i%3))%190;q(x,y,1,2,i%3?'#93c97c':'#f6e6a1');}
  q(26,163,3,15,'#b5a37a');q(21,160,13,5,'#cf866f');q(23,159,8,2,'#e4ba94');
 }else if(biome==='desert'){
  q(326,30,32,32,'#ffdfaa');q(322,36,40,20,'#ffdfaa');
  cloud(48,38,'#ca8e91');cloud(166,61,'#edb99a');
  for(let layer=0;layer<3;layer++)for(let i=-1;i<8;i++){
   const x=i*80-(offset*(layer+1))%80,y=87+layer*18+rand(i+layer*20)*23,col=['#ac777c','#965f6c','#75495c'][layer];
   q(x+12,y,54,110,col);q(x+4,y+13,69,96,col);q(x+24,y-12,27,14,col);
   q(x+15,y+8,48,3,layer===0?'#d49787':'#b37a7b');q(x+7,y+29,57,2,'#a36b73');
   q(x+49,y+3,5,50,layer===2?'#5e3d53':'#925f70');
  }
  for(let x=0;x<450;x+=4){const y=178+Math.sin(x/80)*5;q(x,y,4,H-y,'#493b50');q(x,y,4,2,'#b4837b');}
  for(const x of [34,405]){q(x,145,5,38,'#325155');q(x-8,156,8,5,'#325155');q(x-8,149,4,11,'#325155');q(x+4,163,10,4,'#325155');q(x+10,153,4,13,'#325155');q(x+1,148,1,29,'#70836e');}
  q(256,155,19,3,'#d0a185');q(259,158,4,23,'#a27771');q(269,158,4,23,'#a27771');q(256,179,20,3,'#d0a185');
 }else{
  q(342,24,21,21,'#e2edf0');q(338,29,29,11,'#e2edf0');
  // Stepped aurora ribbons and mountain ridgelines remain on the pixel grid.
  for(let x=0;x<450;x+=4){const y=24+Math.sin(x/61)*12;q(x,y,4,5,'#487d88');q(x,y+5,4,3,'#579795');}
  for(let i=-1;i<6;i++)mountain(i*99-offset%99,70+rand(i+5)*27,130,'#62849e','#d4e4e8');
  for(let i=-1;i<6;i++)mountain(i*111-(offset*2)%111,104+rand(i+9)*15,126,'#3e6482','#9cbdcd');
  for(let i=-1;i<14;i++)pine(i*38-(offset*3)%38,143+rand(i)*10,.8,'#26475f','#a9cbd5');
  q(0,186,450,9,'#bed6df');q(0,189,450,6,'#729db6');
  for(let i=0;i<27;i++)q((rand(i+100)*450+time*4)%450,(rand(i+130)*195+time*(5+i%4))%195,1+i%2,1+i%2,'#d6e8ef');
 }
}
function platform(c,biome,x,y,w,index){
 const t=palettes[biome],q=(a,b,d,e,col)=>{c.fillStyle=col;c.fillRect(Math.round(a),Math.round(b),Math.round(d),e);};
 q(x+2,y+6,w,5,'#0c172940');q(x,y,w,8,t.under);q(x,y,w,3,t.edge);q(x,y-3,w,3,t.top);
 for(let j=6;j<w-4;j+=12){q(x+j,y+4,5,2,t.edge);if((j+index)%3===0)q(x+j,y+7,3,3,t.under);}
 if(biome==='forest'){for(let j=5;j<w-3;j+=15){q(x+j,y-5,2,3,'#b4e589');q(x+j+2,y-4,3,1,'#69b576');}q(x+8,y+8,2,8,'#4c9864');q(x+10,y+12,3,2,'#85bb72');}
 if(biome==='snow'){q(x+2,y-4,w-4,2,'#ffffff');for(let j=8;j<w-6;j+=21){q(x+j,y+7,3,5,'#8ac8dc');q(x+j+1,y+12,1,3,'#cdeef5');}}
 if(biome==='city'){q(x,y+7,w,2,'#172a43');for(let j=7;j<w-4;j+=19)q(x+j,y+3,6,1,'#8ac8cf');q(x+3,y-2,3,1,'#f7f0c5');}
 if(biome==='desert'){q(x+4,y-2,w-8,1,'#ffedc2');for(let j=13;j<w-4;j+=24)q(x+j,y+2,1,5,'#784c52');}
}
root.EixoJumpWorlds={draw,platform,palettes};
})(typeof window==='undefined'?globalThis:window);
