/* EIXO JUMP worlds — bright procedural pixel art, no external assets. */
(function(root){
'use strict';
const palettes={
 city:{sky:['#82d8ff','#6fc8f5','#59afe4','#478fc8','#376fa9'],top:'#e7fbff',edge:'#78c9df',under:'#3e6485',fragile:'#ffc163'},
 forest:{sky:['#a7e4d2','#8bd5b8','#70c39c','#51aa7d','#3e8c68'],top:'#d6f29c',edge:'#78bd68',under:'#526c45',fragile:'#f7bc62'},
 desert:{sky:['#8fd8ef','#8ed0e8','#f5bf83','#e99b68','#d57958'],top:'#ffe0a0',edge:'#d99958',under:'#9d6650',fragile:'#ffc05e'},
 snow:{sky:['#bfe9ff','#a9d9f3','#8fc7e8','#76afd6','#638fbb'],top:'#ffffff',edge:'#b4e4f3',under:'#5f87a8',fragile:'#ffc86c'}
};
function draw(c,biome,seed,cam=0,time=0){
 const t=palettes[biome]||palettes.forest,W=450,H=195;
 const q=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.ceil(w)),Math.max(1,Math.ceil(h)));};
 const rand=n=>{let x=Math.imul((seed+n*7919)|0,1597334677);return((x^(x>>>16))>>>0)/4294967296;};
 const wrap=(v,m)=>((v%m)+m)%m,offset=cam*.045;
 for(let y=0;y<H;y+=2)q(0,y,W,2,t.sky[Math.min(t.sky.length-1,Math.floor(y/H*t.sky.length))]);
 const cloud=(x,y,s=1,col='#ffffffaa')=>{q(x+8*s,y,26*s,4*s,col);q(x,y+4*s,48*s,5*s,col);q(x+6*s,y+9*s,34*s,3*s,col);q(x+18*s,y-3*s,16*s,4*s,col);};
 const mountain=(x,base,w,h,col,cap)=>{
  const top=base-h;
  for(let yy=0;yy<h;yy+=3){const f=yy/h,half=Math.max(2,Math.min(w/2,(w/2)*f));q(x+w/2-half,top+yy,half*2,3,col);}
  if(cap){for(let yy=0;yy<Math.min(24,h);yy+=3){const f=yy/Math.max(1,Math.min(24,h)),half=Math.max(1,(w*.12)+(w*.13*f));q(x+w/2-half,top+yy,half*2,3,cap);}}
 };
 const pine=(x,base,s,col,snow)=>{
  q(x-2*s,base-23*s,4*s,23*s,'#55707b');
  for(let j=0;j<4;j++){const w=(15+j*7)*s,y=base-(43-j*9)*s;q(x-w/2,y,w,12*s,col);if(snow)q(x-w/2+2*s,y,w-4*s,3*s,snow);}
 };

 if(biome==='city'){
  // Clear rooftop city: bright sky, layered skyline and small urban details.
  cloud(35-wrap(offset*.18,520),27,.9,'#eefaffd9');cloud(248-wrap(offset*.12,610),48,.65,'#e9f7ffd1');
  q(348,23,24,24,'#fff1bf');q(344,28,32,14,'#fff1bf');
  const layers=[
   {base:'#6b8cac',side:'#567896',spacing:46,speed:.55,min:31,max:62},
   {base:'#486f91',side:'#385a79',spacing:42,speed:1.0,min:45,max:82},
   {base:'#2f5577',side:'#244663',spacing:38,speed:1.65,min:52,max:98}
  ];
  layers.forEach((L,layer)=>{
   for(let i=-2;i<15;i++){
    const x=i*L.spacing-wrap(offset*L.speed,L.spacing),w=L.spacing-5,h=L.min+rand(i+layer*73+20)*(L.max-L.min),y=H-h;
    q(x,y,w,h,L.base);q(x+3,y-3,w-6,3,L.base);q(x+w-5,y+3,5,h-3,L.side);
    if((i+layer)%4===0){q(x+8,y-11,2,11,L.side);q(x+6,y-13,6,2,'#f3788f');}
    for(let wy=y+9;wy<H-6;wy+=10)for(let wx=x+6;wx<x+w-6;wx+=8){
     if(rand(i*131+wx+wy+layer)>.35)q(wx,wy,3,4,rand(i+wx+wy)>.25?'#ffd58a':'#9ce8e2');
    }
    if(layer===2&&i%5===1){q(x+6,y+12,12,20,'#75518b');q(x+8,y+15,8,3,'#f7a0d0');q(x+9,y+21,6,2,'#fff2c0');}
   }
  });
  // Rooftops, water tower, vents and a metro line.
  q(0,176,W,19,'#203f5a');q(0,176,W,3,'#80b8c5');
  for(let x=8;x<W;x+=48){q(x,165,18,11,'#355b75');q(x+4,160,10,5,'#426d87');q(x+7,156,4,4,'#9acbd2');}
  q(92,150,22,18,'#7f625c');q(96,145,14,6,'#a87f72');q(101,140,4,6,'#665651');
  q(88,168,4,12,'#5a4f4d');q(112,168,4,12,'#5a4f4d');
  q(0,185,W,3,'#132d43');for(let x=0;x<W;x+=31)q(x,190,19,1,'#5b95a9');
 }else if(biome==='forest'){
  // Lush green forest with distant hills, trunks, ferns and a waterfall.
  cloud(52-wrap(offset*.12,560),25,.8,'#efffe0a8');cloud(270-wrap(offset*.08,620),40,.55,'#efffe09c');
  for(let i=-1;i<7;i++){
   const x=i*82-wrap(offset*.32,82),base=160+rand(i+5)*10;
   mountain(x,base,118,68,'#77b98a','#a8d9a0');
  }
  for(let layer=0;layer<3;layer++){
   const spacing=58,speed=offset*(.55+layer*.72);
   for(let i=-2;i<11;i++){
    const x=i*spacing-wrap(speed,spacing),base=H-9,y=44+rand(i+layer*49+12)*55;
    const trunk=['#557b61','#416a52','#2b5443'][layer],leaf=['#6cad65','#4f9658','#367747'][layer];
    q(x+22,y,8+layer*2,base-y,trunk);q(x+25,y+16,2,base-y-16,'#7aa078');
    q(x+1,y-8,47,17,leaf);q(x+9,y-22,33,17,leaf);q(x+18,y-31,17,11,leaf);
    if(layer===2){q(x+6,y+22,2,42,'#6aa06a');q(x+30,y+18,18,3,leaf);q(x+45,y+20,3,24,leaf);}
   }
  }
  q(367,91,27,80,'#6bbfc6');q(372,91,17,80,'#9be0df');q(377,91,7,80,'#d4f6ef');
  q(0,170,W,25,'#235b42');q(0,181,W,14,'#1b4938');
  for(let i=0;i<20;i++){const x=i*25+Math.floor(rand(i+90)*8),y=176+Math.floor(rand(i+120)*9);q(x,y,19,5,'#34734b');q(x+5,y-3,9,3,'#68a95d');}
  for(const x of [31,81,328]){q(x,162,3,12,'#bc9d74');q(x-5,158,13,5,'#d8736f');q(x-1,157,6,2,'#f2b79c');}
  for(let i=0;i<28;i++){const x=rand(i+61)*W,y=wrap(rand(i+76)*165+time*(2+i%4),178);q(x,y,1+(i%8===0),1+(i%11===0),i%3?'#c8f28d':'#ffe994');}
 }else if(biome==='desert'){
  // Warm canyon scene: blue upper sky, golden light, mesas, arch and dunes.
  cloud(43-wrap(offset*.1,560),31,.8,'#fff3dcaa');cloud(214-wrap(offset*.07,620),51,.55,'#fff3dc8f');
  q(338,27,29,29,'#ffe6a8');q(333,33,39,17,'#ffe6a8');
  const mesa=(x,base,w,h,col,hi)=>{q(x,base-h+12,w,h-12,col);q(x+8,base-h,w-16,13,col);q(x+14,base-h-6,w-28,7,col);q(x+5,base-h+20,w-10,3,hi);q(x+w-10,base-h+14,6,h-17,'#8e5148');};
  for(let layer=0;layer<3;layer++){
   const spacing=98,speed=offset*(.45+layer*.62);
   for(let i=-2;i<8;i++){
    const x=i*spacing-wrap(speed,spacing),base=178+layer*4,h=47+layer*16+rand(i+layer*31+8)*20;
    mesa(x,base,74,h,['#d98b68','#bd6d58','#965344'][layer],['#efa27a','#d68165','#b86655'][layer]);
   }
  }
  // Large rock arch in the distance.
  q(344,113,72,58,'#9a5547');q(357,122,46,49,t.sky[3]);q(344,113,72,10,'#bc7057');q(339,160,13,20,'#75483f');q(410,157,13,23,'#75483f');
  // Dunes and cacti.
  for(let x=0;x<W;x+=4){const y=174+Math.sin((x+offset)/52)*5+Math.sin(x/23)*2;q(x,y,4,H-y,'#805043');q(x,y,4,2,'#e0a473');}
  for(const x of [28,112,421]){q(x,143,5,37,'#2f6559');q(x-8,153,8,5,'#2f6559');q(x-8,146,4,12,'#2f6559');q(x+4,159,10,4,'#2f6559');q(x+10,150,4,13,'#2f6559');q(x+1,144,1,30,'#6d9982');}
  q(244,149,5,30,'#c99472');q(279,149,5,30,'#c99472');q(244,146,40,5,'#e2b189');q(254,154,20,3,'#9c6a59');
 }else{
  // Crisp alpine world: pale sky, layered snowy peaks, pines and a small cabin.
  cloud(26-wrap(offset*.12,540),26,.85,'#f8fdffd9');cloud(256-wrap(offset*.08,610),43,.6,'#f8fdffc7');
  q(351,24,21,21,'#fff6d6');q(348,28,27,13,'#fff6d6');
  for(let i=-2;i<6;i++)mountain(i*100-wrap(offset*.35,100),171,132,82,'#9fc9df','#eefaff');
  for(let i=-2;i<6;i++)mountain(i*112-wrap(offset*.72,112),179,128,66,'#77a8c6','#d9edf5');
  for(let i=-2;i<15;i++)pine(i*36-wrap(offset*1.65,36),180+rand(i+44)*5,.78,'#315e72','#d8eff6');
  q(0,182,W,13,'#d9f1f8');q(0,188,W,7,'#86b5ce');
  // Warm cabin is a focal point, but remains below active platform space.
  q(42,155,32,25,'#8a6657');q(37,151,42,7,'#aa7964');q(45,161,8,7,'#ffd27d');q(61,161,8,7,'#ffd27d');q(55,169,7,11,'#513e3a');q(68,143,4,11,'#70584f');q(69,140,6,4,'#e8f3f5');
  for(let i=0;i<32;i++){const x=wrap(rand(i+100)*W+time*(4+i%4),W),y=wrap(rand(i+130)*H+time*(6+i%3),H);q(x,y,i%6===0?2:1,i%9===0?2:1,'#f6fdff');}
 }
}
function platform(c,biome,x,y,w,index,state={}){
 const t=palettes[biome]||palettes.forest,q=(a,b,d,e,col)=>{c.fillStyle=col;c.fillRect(Math.round(a),Math.round(b),Math.max(1,Math.round(d)),Math.max(1,e));};
 const fragile=!!state.fragile,progress=Math.max(0,Math.min(1,Number(state.progress)||0));
 q(x+2,y+7,w,5,'#10203355');q(x,y,w,9,t.under);q(x,y,w,3,t.edge);q(x,y-3,w,3,t.top);
 for(let j=6;j<w-4;j+=12){q(x+j,y+4,5,2,t.edge);if((j+index)%3===0)q(x+j,y+7,3,2,t.under);}
 if(biome==='forest'){for(let j=5;j<w-3;j+=15){q(x+j,y-5,2,3,'#d4f19c');q(x+j+2,y-4,3,1,'#7fc879');}q(x+8,y+8,2,7,'#507d4d');}
 if(biome==='snow'){q(x+2,y-4,w-4,2,'#ffffff');for(let j=8;j<w-6;j+=21){q(x+j,y+7,3,5,'#89c8de');q(x+j+1,y+12,1,3,'#d9f5fb');}}
 if(biome==='city'){q(x,y+8,w,2,'#294b69');for(let j=7;j<w-4;j+=19)q(x+j,y+3,6,1,'#a7eef4');q(x+3,y-2,3,1,'#fff3b7');}
 if(biome==='desert'){q(x+4,y-2,w-8,1,'#fff0c5');for(let j=13;j<w-4;j+=24)q(x+j,y+2,1,5,'#7f554d');}
 if(fragile){
  const warn=progress>.02?t.fragile:'#dca053';q(x+2,y-1,Math.max(2,w-4),1,warn);
  const cracks=2+Math.floor(progress*5);for(let j=0;j<cracks;j++){const cx=x+8+((index*17+j*23)%Math.max(12,w-16)),cy=y+2+(j%2);q(cx,cy,2,1,warn);q(cx+1,cy+1,1,2,warn);}
  if(progress>.62){for(let j=3;j<w-3;j+=7)q(x+j,y+7,3,1,warn);}
 }
}
root.EixoJumpWorlds={draw,platform,palettes};
})(typeof window==='undefined'?globalThis:window);
