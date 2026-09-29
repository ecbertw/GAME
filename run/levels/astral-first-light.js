(function(root,factory){
  const value=factory();
  if(typeof module==='object'&&module.exports)module.exports=value;
  if(root){root.EixoRunLevels=root.EixoRunLevels||{};root.EixoRunLevels.firstLight=value}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const shard=(n,x,y,group='main')=>({id:'first-light-shard-'+String(n).padStart(2,'0'),x,y,group});
const solids=[
 {id:'awakening-0',x:0,y:9.0,w:18,h:4},{id:'awakening-1',x:21.1,y:8.4,w:14.4,h:4.6},{id:'awakening-2',x:39.0,y:7.7,w:14.8,h:5.3},
 {id:'garden-0',x:57.1,y:8.6,w:13.5,h:4.4},{id:'garden-1',x:74.0,y:8.0,w:13.7,h:5.0},{id:'garden-2',x:91.5,y:7.2,w:13.2,h:5.8},{id:'garden-3',x:107.4,y:8.4,w:14.1,h:4.6},
 {id:'span-0',x:125.0,y:8.8,w:13.0,h:4.2},{id:'span-1',x:142.0,y:7.5,w:13.8,h:5.5},{id:'span-2',x:159.7,y:6.9,w:13.8,h:6.1},{id:'span-3',x:177.5,y:8.2,w:13.2,h:4.8},
 {id:'moonfall-0',x:194.6,y:7.1,w:12.1,h:5.9},{id:'moonfall-1',x:210.7,y:8.1,w:13.1,h:4.9},{id:'moonfall-2',x:227.2,y:7.0,w:14.1,h:6.0},
 {id:'engine-0',x:245.2,y:8.4,w:12.8,h:4.6},{id:'engine-1',x:261.8,y:7.2,w:13.2,h:5.8},{id:'engine-2',x:278.9,y:6.4,w:13.0,h:6.6},
 {id:'tower-0',x:295.8,y:7.8,w:13.1,h:5.2},{id:'tower-1',x:312.8,y:6.6,w:14.0,h:6.4},{id:'tower-2',x:330.8,y:5.8,w:19.0,h:7.2}
];
const oneWay=[
 {id:'upper-0',x:69.4,y:5.3,w:4.1,h:.34},{id:'upper-1',x:76.0,y:4.1,w:3.2,h:.34},{id:'upper-2',x:82.0,y:3.1,w:3.0,h:.34},
 {id:'upper-3',x:88.7,y:3.7,w:3.1,h:.34},{id:'upper-4',x:95.5,y:2.8,w:3.0,h:.34},{id:'secret-step',x:101.7,y:2.2,w:3.1,h:.34},
 {id:'secret-ledge',x:108.5,y:1.6,w:9.4,h:.34},{id:'upper-exit',x:120.0,y:4.0,w:4.0,h:.34},
 {id:'span-ledge-a',x:136.7,y:4.8,w:3.3,h:.34},{id:'span-ledge-b',x:154.2,y:3.9,w:3.2,h:.34},
 {id:'moon-ledge-a',x:190.4,y:4.2,w:3.1,h:.34},{id:'moon-ledge-b',x:206.5,y:4.0,w:3.1,h:.34},
 {id:'engine-ledge',x:239.2,y:3.9,w:3.2,h:.34},{id:'tower-ledge-a',x:289.4,y:3.5,w:3.2,h:.34},
 {id:'tower-ledge-b',x:306.5,y:3.9,w:3.0,h:.34},{id:'tower-ledge-c',x:324.0,y:3.2,w:3.0,h:.34}
];
const hazards=[
 {id:'crystal-1',x:29.8,y:7.88,w:1.5,h:.52,type:'crystal'},{id:'crystal-2',x:47.1,y:7.18,w:1.45,h:.52,type:'crystal'},
 {id:'crystal-3',x:63.3,y:8.08,w:1.4,h:.52,type:'crystal'},{id:'crystal-4',x:81.0,y:7.48,w:1.45,h:.52,type:'crystal'},
 {id:'crystal-5',x:98.1,y:6.68,w:1.45,h:.52,type:'crystal'},{id:'crystal-6',x:131.0,y:8.28,w:1.4,h:.52,type:'crystal'},
 {id:'crystal-7',x:149.4,y:6.98,w:1.45,h:.52,type:'crystal'},{id:'crystal-8',x:166.9,y:6.38,w:1.45,h:.52,type:'crystal'},
 {id:'crystal-9',x:183.8,y:7.68,w:1.45,h:.52,type:'crystal'},{id:'crystal-10',x:200.2,y:6.58,w:1.4,h:.52,type:'crystal'},
 {id:'crystal-11',x:216.0,y:7.58,w:1.45,h:.52,type:'crystal'},{id:'crystal-12',x:234.4,y:6.48,w:1.45,h:.52,type:'crystal'},
 {id:'crystal-13',x:252.0,y:7.88,w:1.55,h:.52,type:'crystal'},{id:'crystal-14',x:269.0,y:6.68,w:1.45,h:.52,type:'crystal'},
 {id:'crystal-15',x:285.5,y:5.88,w:1.45,h:.52,type:'crystal'},{id:'crystal-16',x:302.0,y:7.28,w:1.45,h:.52,type:'crystal'},
 {id:'crystal-17',x:319.0,y:6.08,w:1.45,h:.52,type:'crystal'}
];
const shards=[
 shard(1,6.8,7.1),shard(2,14.8,7.1),shard(3,24.1,6.6),shard(4,32.8,6.3),shard(5,41.4,5.9),
 shard(6,50.2,5.8),shard(7,60.0,6.9),shard(8,68.0,6.6),shard(9,76.2,6.1),shard(10,84.2,6.0),
 shard(11,94.2,5.3),shard(12,102.2,5.2),shard(13,111.0,6.4),shard(14,119.0,6.4),shard(15,128.0,6.8),
 shard(16,136.0,6.7),shard(17,146.0,5.6),shard(18,154.0,5.5),shard(19,164.0,4.9),shard(20,172.0,4.8),
 shard(21,182.0,6.2),shard(22,200.0,4.9),shard(23,217.5,6.1),shard(24,235.0,4.9),shard(25,340.0,3.8),
 shard(26,72.0,4.1,'challenge'),shard(27,78.0,3.0,'challenge'),shard(28,84.0,2.2,'challenge'),
 shard(29,90.5,2.7,'challenge'),shard(30,97.0,1.9,'challenge'),shard(31,103.5,1.4,'challenge'),
 shard(32,120.8,3.1,'challenge'),shard(33,138.0,3.6,'challenge'),shard(34,156.0,2.8,'challenge'),shard(35,192.0,3.2,'challenge'),
 shard(36,248.0,6.6,'alternate'),shard(37,266.0,5.5,'alternate'),shard(38,284.0,4.6,'alternate'),shard(39,304.0,5.8,'alternate'),
 shard(40,109.0,.9,'secret'),shard(41,112.2,.9,'secret'),shard(42,115.4,.9,'secret')
];
return{
 id:'astral-01',version:10,world:'astral',name:'FIRST LIGHT',subtitle:'THE SKY REMEMBERS',
 spawn:{x:1.4,y:7.3},startLine:{x:4.0},finish:{x:343.0,y:1.6,w:2.0,h:5.8},killY:22,
 zones:[
  {id:'awakening',name:'AWAKENING',fromX:0,toX:57},{id:'sky-garden',name:'SKY GARDEN',fromX:57,toX:125},
  {id:'ruined-span',name:'RUINED SPAN',fromX:125,toX:194},{id:'moonfall',name:'MOONFALL',fromX:194,toX:245},
  {id:'crystal-engine',name:'CRYSTAL ENGINE',fromX:245,toX:295},{id:'first-light-tower',name:'FIRST LIGHT TOWER',fromX:295,toX:351}
 ],
 routes:{upper:{fromX:69,toX:124,label:'FAST / TECHNICAL'},lower:{fromX:69,toX:124,label:'SAFE / SHARDS'},secret:{fromX:101,toX:118,label:'MOON CACHE'}},
 solids,oneWay,hazards,shards,
 moving:[
  {id:'move-upper',x:87.0,y:4.7,w:3.0,h:.36,axis:'y',amplitude:1.15,period:2.8,phase:.1},
  {id:'move-span-a',x:138.0,y:4.9,w:3.0,h:.36,axis:'y',amplitude:1.2,period:2.7,phase:.55},
  {id:'move-span-b',x:155.6,y:4.5,w:3.0,h:.36,axis:'x',amplitude:1.25,period:3.0,phase:.2},
  {id:'move-moon',x:191.8,y:4.9,w:3.0,h:.36,axis:'y',amplitude:1.1,period:2.5,phase:.7},
  {id:'move-engine',x:226.0,y:4.5,w:3.0,h:.36,axis:'x',amplitude:1.15,period:2.9,phase:.15},
  {id:'move-tower',x:309.6,y:4.1,w:3.0,h:.36,axis:'y',amplitude:1.05,period:2.45,phase:.35}
 ],
 falling:[
  {id:'fall-1',x:174.8,y:5.0,w:2.8,h:.34,delay:.34},{id:'fall-2',x:183.6,y:4.3,w:2.8,h:.34,delay:.3},
  {id:'fall-3',x:200.1,y:3.9,w:2.8,h:.34,delay:.28},{id:'fall-4',x:216.0,y:4.7,w:2.8,h:.34,delay:.3}
 ],
 breakables:[{id:'secret-break',x:105.8,y:1.45,w:2.2,h:1.0},{id:'engine-break-a',x:253.2,y:5.35,w:2.0,h:1.0},{id:'engine-break-b',x:270.1,y:4.25,w:2.0,h:1.0}],
 bouncePads:[{id:'bounce-upper',x:66.4,y:8.35,w:1.5,h:.22,power:16.8},{id:'bounce-moon',x:203.0,y:6.85,w:1.4,h:.22,power:15.6},{id:'bounce-final',x:304.8,y:7.55,w:1.5,h:.22,power:16.4}],
 speedPads:[{id:'speed-1',x:247.7,y:8.15,w:2.2,h:.22,dir:1,speed:11.1},{id:'speed-2',x:265.0,y:6.95,w:2.0,h:.22,dir:1,speed:10.9}],
 windZones:[{id:'engine-wind',x:257.5,y:1.2,w:31.0,h:8.2,forceX:2.0,forceY:-1.0}],
 checkpoints:[{id:'midpoint',x:176.0,y:3.2,w:1.0,h:5.3,spawnX:178.2,spawnY:6.55}],
 secrets:[{id:'moon-cache',x:108.2,y:.55,w:9.8,h:2.2}]
};
});