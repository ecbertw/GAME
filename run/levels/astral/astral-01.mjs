const shard=(id,x,y,group='main')=>({id:'a01-s'+String(id).padStart(2,'0'),x,y,group});

export const ASTRAL01={
 id:'astral-01',
 version:2,
 world:'astral',
 name:'FIRST LIGHT',
 subtitle:'THE SKY REMEMBERS',
 killY:22,
 spawn:{x:1.4,y:7.3},
 startLine:{x:4.0,y:0,w:.2,h:18},
 finish:{x:343.0,y:1.9,w:1.8,h:5.2},

 zones:[
  {id:'awakening',name:'AWAKENING',fromX:0,toX:58},
  {id:'sky-garden',name:'SKY GARDEN',fromX:58,toX:126},
  {id:'ruined-span',name:'RUINED SPAN',fromX:126,toX:195},
  {id:'moonfall',name:'MOONFALL',fromX:195,toX:246},
  {id:'crystal-engine',name:'CRYSTAL ENGINE',fromX:246,toX:296},
  {id:'first-light',name:'FIRST LIGHT TOWER',fromX:296,toX:350}
 ],
 splits:[
  {id:'opening',x:58},
  {id:'route-split',x:73},
  {id:'route-merge',x:126},
  {id:'checkpoint',x:176},
  {id:'speed-section',x:246},
  {id:'final-ascent',x:296}
 ],
 routes:{
  upper:{id:'upper',fromX:73,toX:126,style:'technical-fast',shards:'challenge',hintY:4.6},
  lower:{id:'lower',fromX:73,toX:126,style:'safe-explore',shards:'main',hintY:8.6},
  secret:{id:'secret',fromX:104,toX:121,style:'precision',shards:'secret',secret:'moon-cache',hintY:2.1}
 },

 solids:[
  {id:'isle-00',x:0,y:9.0,w:18,h:4},
  {id:'isle-01',x:21,y:8.4,w:14,h:4.6},
  {id:'isle-02',x:38.5,y:7.8,w:14.5,h:5.2},
  {id:'isle-03',x:57,y:8.8,w:13,h:4.2},
  {id:'isle-04',x:73,y:8.2,w:14,h:4.8},
  {id:'isle-05',x:91,y:7.4,w:13,h:5.6},
  {id:'isle-06',x:108,y:8.6,w:13,h:4.4},
  {id:'isle-07',x:125,y:9.0,w:13,h:4},
  {id:'isle-08',x:142,y:7.8,w:14,h:5.2},
  {id:'isle-09',x:160,y:7.0,w:14,h:6},
  {id:'isle-10',x:178,y:8.5,w:13,h:4.5},
  {id:'isle-11',x:195,y:7.2,w:12,h:5.8},
  {id:'isle-12',x:211,y:8.4,w:13,h:4.6},
  {id:'isle-13',x:228,y:7.0,w:13,h:6},
  {id:'isle-14',x:245,y:8.6,w:13,h:4.4},
  {id:'isle-15',x:262,y:7.4,w:13,h:5.6},
  {id:'isle-16',x:279,y:6.6,w:13,h:6.4},
  {id:'isle-17',x:296,y:8.0,w:13,h:5},
  {id:'isle-18',x:313,y:6.8,w:14,h:6.2},
  {id:'isle-19',x:331,y:6.0,w:18,h:7}
 ],

 oneWayPlatforms:[
  {id:'upper-01',x:71.8,y:5.2,w:4.0,h:.38},
  {id:'upper-02',x:78.2,y:4.0,w:3.1,h:.38},
  {id:'upper-03',x:84.2,y:3.2,w:3.0,h:.38},
  {id:'upper-04',x:91.2,y:3.8,w:3.1,h:.38},
  {id:'upper-05',x:98.0,y:3.0,w:3.0,h:.38},
  {id:'secret-step',x:104.3,y:2.4,w:3.1,h:.38},
  {id:'secret-roof',x:112.2,y:1.8,w:8.4,h:.38},
  {id:'upper-06',x:121.2,y:4.3,w:3.6,h:.38},
  {id:'span-01',x:136.5,y:4.9,w:3.4,h:.38},
  {id:'span-02',x:154.8,y:4.0,w:3.2,h:.38},
  {id:'moon-01',x:191.2,y:4.4,w:3.2,h:.38},
  {id:'moon-02',x:207.1,y:4.2,w:3.2,h:.38},
  {id:'engine-01',x:239.6,y:4.0,w:3.2,h:.38},
  {id:'engine-02',x:258.0,y:4.5,w:3.2,h:.38},
  {id:'tower-01',x:291.2,y:3.7,w:3.3,h:.38},
  {id:'tower-02',x:309.2,y:4.1,w:3.1,h:.38},
  {id:'tower-03',x:326.7,y:3.4,w:3.0,h:.38}
 ],

 movingPlatforms:[
  {id:'upper-move-a',x:88.0,y:4.7,w:3.0,h:.42,axis:'y',amplitude:1.25,period:2.7,phase:.10,oneWay:true},
  {id:'upper-move-b',x:115.0,y:4.8,w:3.0,h:.42,axis:'x',amplitude:1.25,period:3.1,phase:.35,oneWay:true},
  {id:'span-move-a',x:138.7,y:5.0,w:3.1,h:.42,axis:'y',amplitude:1.25,period:2.6,phase:.60,oneWay:true},
  {id:'span-move-b',x:156.5,y:4.6,w:3.1,h:.42,axis:'x',amplitude:1.35,period:2.9,phase:.20,oneWay:true},
  {id:'moon-move-a',x:192.0,y:5.0,w:3.0,h:.42,axis:'y',amplitude:1.15,period:2.5,phase:.75,oneWay:true},
  {id:'engine-move-a',x:226.1,y:4.6,w:3.0,h:.42,axis:'x',amplitude:1.2,period:2.8,phase:.15,oneWay:true},
  {id:'tower-move-a',x:310.2,y:4.2,w:3.0,h:.42,axis:'y',amplitude:1.1,period:2.4,phase:.35,oneWay:true}
 ],

 fallingPlatforms:[
  {id:'fall-01',x:174.7,y:5.1,w:2.9,h:.38,delay:.34},
  {id:'fall-02',x:183.8,y:4.4,w:2.8,h:.38,delay:.30},
  {id:'fall-03',x:200.4,y:4.0,w:2.9,h:.38,delay:.28},
  {id:'fall-04',x:216.3,y:4.8,w:2.8,h:.38,delay:.30}
 ],

 breakableBlocks:[
  {id:'break-secret',x:108.2,y:1.6,w:2.4,h:1.0},
  {id:'break-engine-a',x:253.4,y:5.5,w:2.0,h:1.0},
  {id:'break-engine-b',x:270.4,y:4.4,w:2.0,h:1.0}
 ],

 bouncePads:[
  {id:'bounce-upper',x:67.0,y:8.55,w:1.5,h:.25,power:17.0},
  {id:'bounce-moon',x:203.4,y:6.95,w:1.4,h:.25,power:15.8},
  {id:'bounce-final',x:305.2,y:7.75,w:1.5,h:.25,power:16.6}
 ],

 speedPads:[
  {id:'speed-a',x:248.0,y:8.35,w:2.3,h:.25,dir:1,speed:11.4},
  {id:'speed-b',x:267.0,y:7.15,w:2.0,h:.25,dir:1,speed:11.2}
 ],

 windZones:[
  {id:'wind-engine',x:258,y:1.5,w:31,h:8.0,forceX:2.2,forceY:-1.1}
 ],

 hazards:[
  {id:'h-01',x:30.2,y:7.86,w:1.4,h:.55,type:'crystal'},
  {id:'h-02',x:47.0,y:7.26,w:1.6,h:.55,type:'crystal'},
  {id:'h-03',x:64.0,y:8.26,w:1.3,h:.55,type:'crystal'},
  {id:'h-04',x:81.6,y:7.66,w:1.3,h:.55,type:'crystal'},
  {id:'h-05',x:99.0,y:6.86,w:1.4,h:.55,type:'crystal'},
  {id:'h-06',x:132.5,y:8.46,w:1.4,h:.55,type:'crystal'},
  {id:'h-07',x:151.0,y:7.26,w:1.5,h:.55,type:'crystal'},
  {id:'h-08',x:168.5,y:6.46,w:1.5,h:.55,type:'crystal'},
  {id:'h-09',x:186.2,y:7.96,w:1.3,h:.55,type:'crystal'},
  {id:'h-10',x:201.2,y:6.66,w:1.3,h:.55,type:'crystal'},
  {id:'h-11',x:218.1,y:7.86,w:1.5,h:.55,type:'crystal'},
  {id:'h-12',x:235.2,y:6.46,w:1.5,h:.55,type:'crystal'},
  {id:'h-13',x:255.0,y:8.06,w:1.6,h:.55,type:'crystal'},
  {id:'h-14',x:272.0,y:6.86,w:1.5,h:.55,type:'crystal'},
  {id:'h-15',x:288.3,y:6.06,w:1.5,h:.55,type:'crystal'},
  {id:'h-16',x:302.5,y:7.46,w:1.4,h:.55,type:'crystal'},
  {id:'h-17',x:321.2,y:6.26,w:1.4,h:.55,type:'crystal'},

  {id:'pit-01',x:18,y:11.0,w:3,h:2.0,type:'void'},
  {id:'pit-02',x:35,y:11.0,w:3.5,h:2.0,type:'void'},
  {id:'pit-03',x:53,y:11.0,w:4,h:2.0,type:'void'},
  {id:'pit-04',x:70,y:11.0,w:3,h:2.0,type:'void'},
  {id:'pit-05',x:87,y:11.0,w:4,h:2.0,type:'void'},
  {id:'pit-06',x:104,y:11.0,w:4,h:2.0,type:'void'},
  {id:'pit-07',x:121,y:11.0,w:4,h:2.0,type:'void'},
  {id:'pit-08',x:138,y:11.0,w:4,h:2.0,type:'void'},
  {id:'pit-09',x:156,y:11.0,w:4,h:2.0,type:'void'},
  {id:'pit-10',x:174,y:11.0,w:4,h:2.0,type:'void'},
  {id:'pit-11',x:191,y:11.0,w:4,h:2.0,type:'void'},
  {id:'pit-12',x:207,y:11.0,w:4,h:2.0,type:'void'},
  {id:'pit-13',x:224,y:11.0,w:4,h:2.0,type:'void'},
  {id:'pit-14',x:241,y:11.0,w:4,h:2.0,type:'void'},
  {id:'pit-15',x:258,y:11.0,w:4,h:2.0,type:'void'},
  {id:'pit-16',x:275,y:11.0,w:4,h:2.0,type:'void'},
  {id:'pit-17',x:292,y:11.0,w:4,h:2.0,type:'void'},
  {id:'pit-18',x:309,y:11.0,w:4,h:2.0,type:'void'},
  {id:'pit-19',x:327,y:11.0,w:4,h:2.0,type:'void'}
 ],

 checkpoints:[
  {id:'cp-mid',x:176.0,y:3.5,w:1.0,h:5.0,spawnX:178.5,spawnY:6.8}
 ],

 secrets:[
  {id:'moon-cache',x:110.0,y:.8,w:11.5,h:2.2}
 ],

 decorations:{
  waterfalls:[
    {x:15.5,y:9.2,w:1.8,h:8.8},
    {x:48.0,y:8.0,w:1.5,h:8.0},
    {x:103.0,y:7.6,w:1.7,h:9.0},
    {x:172.2,y:7.1,w:1.5,h:8.4},
    {x:223.0,y:8.5,w:1.9,h:8.5},
    {x:291.0,y:6.7,w:1.6,h:9.0},
    {x:347.0,y:6.1,w:2.0,h:10.0}
  ],
  banners:[
    {x:57.8,y:3.2,h:4.7},
    {x:145.0,y:2.4,h:4.5},
    {x:228.8,y:1.9,h:4.8},
    {x:332.5,y:1.0,h:4.8}
  ],
  crystals:[
    {x:10.5,y:7.8,s:1.0},{x:42.0,y:6.8,s:.8},{x:77.0,y:7.1,s:.9},{x:118.0,y:7.4,s:.9},
    {x:148.0,y:6.8,s:1.1},{x:188.0,y:7.5,s:.8},{x:233.0,y:6.1,s:1.0},{x:283.0,y:5.6,s:1.0},{x:338.0,y:4.9,s:1.2}
  ],
  arches:[
    {x:33,y:4.2,w:8,h:4.2},{x:126,y:4.8,w:9,h:4.0},{x:208,y:4.0,w:8,h:4.1},{x:300,y:4.8,w:8,h:3.7}
  ]
 },

 shards:[
  shard(1,7.0,7.2),shard(2,15.0,7.2),shard(3,24.0,6.7),shard(4,33.0,6.5),shard(5,41.5,6.1),
  shard(6,50.0,5.9),shard(7,60.0,7.0),shard(8,68.0,6.8),shard(9,76.0,6.3),shard(10,84.0,6.2),
  shard(11,94.0,5.5),shard(12,102.0,5.5),shard(13,111.0,6.7),shard(14,119.0,6.7),shard(15,128.0,7.0),
  shard(16,136.0,7.0),shard(17,146.0,5.9),shard(18,154.0,5.8),shard(19,164.0,5.1),shard(20,172.0,5.0),
  shard(21,182.0,6.5),shard(22,201.0,5.2),shard(23,218.0,6.4),shard(24,236.0,5.1),shard(25,337.0,4.0),

  shard(26,74.0,4.3,'challenge'),shard(27,79.5,3.1,'challenge'),shard(28,85.5,2.3,'challenge'),
  shard(29,91.8,2.8,'challenge'),shard(30,98.8,2.0,'challenge'),shard(31,105.2,1.4,'challenge'),
  shard(32,121.8,3.3,'challenge'),shard(33,139.0,3.9,'challenge'),shard(34,157.0,3.0,'challenge'),
  shard(35,192.5,3.4,'challenge'),

  shard(36,249.0,6.8,'alternate'),shard(37,268.0,5.7,'alternate'),shard(38,286.0,4.8,'alternate'),shard(39,305.0,6.0,'alternate'),

  shard(40,112.0,1.0,'secret'),shard(41,115.2,1.0,'secret'),shard(42,118.4,1.0,'secret')
 ]
};