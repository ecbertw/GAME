export const ASTRAL01={
 id:'astral-01',version:1,world:'astral',name:'FIRST LIGHT',killY:24,
 spawn:{x:1.2,y:7.3},startLine:{x:3.2,y:0,w:.2,h:20},finish:{x:268.2,y:3.3,w:1.4,h:6},
 splits:[{id:'opening',x:54},{id:'celestial-steps',x:112},{id:'route-merge',x:173},{id:'final-ascent',x:236}],
 routes:{
  upper:{id:'upper',fromX:60,toX:112,style:'technical-fast',shards:'low',hintY:4.8},
  lower:{id:'lower',fromX:60,toX:112,style:'safe-explore',shards:'high',secret:'moon-cache',hintY:8.2}
 },
 solids:[
  {x:0,y:9,w:24,h:3},{x:28,y:8,w:26,h:4},{x:58,y:9,w:25,h:3},{x:87,y:7.5,w:25,h:4.5},
  {x:116,y:9,w:26,h:3},{x:146,y:7,w:27,h:5},{x:177,y:9,w:27,h:3},{x:208,y:7.8,w:28,h:4.2},{x:240,y:9,w:32,h:3},
  {x:68,y:5.4,w:4,h:.7},{x:75,y:3.9,w:5,h:.7},{x:129,y:5.3,w:4.5,h:.7},{x:157,y:3.8,w:5.2,h:.7},
  {x:187,y:5.2,w:4.5,h:.7},{x:220,y:4.2,w:5.4,h:.7}
 ],
 oneWayPlatforms:[
  {x:21,y:6.4,w:3.2,h:.35},{x:48,y:5.4,w:3.4,h:.35},{x:81,y:6.0,w:3.2,h:.35},
  {x:108,y:5.3,w:3.1,h:.35},{x:139,y:5.0,w:3.3,h:.35},{x:170,y:6.0,w:3.1,h:.35},
  {x:201,y:4.9,w:3.5,h:.35},{x:233,y:5.2,w:3.5,h:.35}
 ],
 movingPlatforms:[
  {id:'mp-1',x:24.8,y:5.3,w:3.1,h:.42,axis:'y',amplitude:1.5,period:2.8,oneWay:true},
  {id:'mp-2',x:54.8,y:5.0,w:3.1,h:.42,axis:'y',amplitude:1.2,period:3.1,phase:.4,oneWay:true},
  {id:'mp-3',x:83.7,y:4.5,w:3.2,h:.42,axis:'x',amplitude:1.5,period:3.4,phase:.4,oneWay:true},
  {id:'mp-4',x:112.7,y:5.1,w:3.0,h:.42,axis:'y',amplitude:1.2,period:2.5,phase:.8,oneWay:true},
  {id:'mp-5',x:142.7,y:4.5,w:3.0,h:.42,axis:'x',amplitude:1.3,period:2.9,phase:.1,oneWay:true},
  {id:'mp-6',x:173.8,y:5.2,w:3.0,h:.42,axis:'y',amplitude:1.4,period:3.2,phase:.7,oneWay:true},
  {id:'mp-7',x:204.8,y:5.0,w:3.0,h:.42,axis:'x',amplitude:1.2,period:2.7,phase:.3,oneWay:true},
  {id:'mp-8',x:236.8,y:5.1,w:3.0,h:.42,axis:'y',amplitude:1.25,period:3.0,phase:.55,oneWay:true}
 ],
 hazards:[
  {x:24,y:11.2,w:4,h:1.8},{x:54,y:11.2,w:4,h:1.8},{x:83,y:11.2,w:4,h:1.8},{x:112,y:11.2,w:4,h:1.8},
  {x:142,y:11.2,w:4,h:1.8},{x:173,y:11.2,w:4,h:1.8},{x:204,y:11.2,w:4,h:1.8},{x:236,y:11.2,w:4,h:1.8}
 ],
 checkpoints:[{id:'cp-mid',x:144.5,y:4.2,w:.8,h:3,spawnX:147.0,spawnY:5.4}],
 secrets:[{id:'moon-cache',x:72.5,y:2.55,w:9.0,h:2.2}],
 shards:Array.from({length:42},(_,i)=>{
   const special=i>=39,x=special?74+(i-39)*2.2:5+i*6.55,upper=!special&&(i%7===0||i%11===0);
   const group=i<25?'main':i<35?'challenge':i<39?'alternate':'secret';return{id:'a01-s'+String(i+1).padStart(2,'0'),group,x,y:special?3.1:(upper?4.4:7.15)};
 })
};