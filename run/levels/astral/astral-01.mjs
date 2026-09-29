export const ASTRAL01={
 id:'astral-01',version:1,world:'astral',name:'FIRST LIGHT',killY:24,
 spawn:{x:1.2,y:7.3},startLine:{x:3.2,y:0,w:.2,h:20},finish:{x:116.2,y:3.3,w:1.4,h:6},
 solids:[
  {x:0,y:9,w:18,h:3},{x:20,y:8,w:10,h:4},{x:32,y:9,w:12,h:3},{x:48,y:7.5,w:11,h:4.5},
  {x:62,y:9,w:12,h:3},{x:77,y:7,w:10,h:5},{x:91,y:9,w:12,h:3},{x:106,y:7.8,w:14,h:4.2},
  {x:35,y:5.4,w:4,h:.7},{x:41,y:3.9,w:4.5,h:.7},{x:67,y:5.3,w:4.2,h:.7},{x:84,y:3.8,w:4.8,h:.7},
  {x:97,y:5.2,w:4.2,h:.7}
 ],
 oneWayPlatforms:[
  {x:15.5,y:6.4,w:3.2,h:.35},{x:27.3,y:5.4,w:3.4,h:.35},{x:44,y:6.0,w:3.2,h:.35},
  {x:58.4,y:5.3,w:3.1,h:.35},{x:73.2,y:5.0,w:3.3,h:.35},{x:87.5,y:6.0,w:3.1,h:.35},{x:102,y:4.2,w:3.5,h:.35}
 ],
 movingPlatforms:[
  {id:'mp-1',x:22,y:5.3,w:3.1,h:.42,axis:'y',amplitude:1.5,period:2.8,oneWay:true},
  {id:'mp-2',x:52,y:4.5,w:3.2,h:.42,axis:'x',amplitude:2.0,period:3.4,phase:.4,oneWay:true},
  {id:'mp-3',x:79,y:4.3,w:3.0,h:.42,axis:'y',amplitude:1.2,period:2.5,phase:.8,oneWay:true}
 ],
 hazards:[
  {x:18,y:11.2,w:2,h:1.8},{x:30,y:11.2,w:2,h:1.8},{x:44,y:11.2,w:4,h:1.8},
  {x:59,y:11.2,w:3,h:1.8},{x:74,y:11.2,w:3,h:1.8},{x:87,y:11.2,w:4,h:1.8},{x:103,y:11.2,w:3,h:1.8}
 ],
 checkpoints:[{id:'cp-mid',x:61.7,y:6.3,w:.8,h:2.7,spawnX:62.5,spawnY:7.2}],
 secrets:[{id:'moon-cache',x:39.5,y:2.6,w:6.2,h:2.0}],
 shards:Array.from({length:42},(_,i)=>{
   const special=i>=39;
   const x=special?40.2+(i-39)*1.6:5+i*2.7;
   const upper=(i%7===0||i%11===0);
   return{id:'a01-s'+String(i+1).padStart(2,'0'),x,y:special?3.25:(upper?4.4:7.15)};
 })
};