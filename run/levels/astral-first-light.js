(function(root,factory){
 const level=factory();
 if(typeof module==='object'&&module.exports)module.exports=level;
 if(root)root.EixoRunFirstLight=level;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const R=(id,x,y,w,h)=>({id,x,y,w,h});
const shards=[];
const add=(prefix,points)=>points.forEach((p,i)=>shards.push({id:prefix+i,x:p[0],y:p[1]}));
add('main-a',[[5.8,6.65],[7.2,6.50],[8.6,6.36],[10.0,6.24],[11.4,6.13],[12.8,6.05]]);
add('main-b',[[22.0,5.35],[23.2,5.10],[24.4,4.88],[25.6,4.70],[26.8,4.56]]);
add('main-c',[[38.0,5.92],[39.2,5.80],[40.4,5.68],[41.6,5.58],[42.8,5.50]]);
add('main-d',[[54.3,4.72],[55.8,4.43],[57.3,4.18],[58.8,4.00]]);
add('main-e',[[71.4,5.95],[72.6,5.95],[73.8,5.95],[75.0,5.95],[76.2,5.95]]);
add('upper-a',[[89.0,4.22],[90.5,4.00],[92.0,3.82],[93.5,3.70]]);
add('main-f',[[112.7,6.25],[113.9,6.35],[115.1,6.45],[116.3,6.55]]);
add('upper-b',[[133.0,3.86],[134.2,3.70],[135.4,3.58]]);
add('finish-a',[[154.1,5.85],[155.2,5.75],[156.3,5.68]]);
add('secret',[[96.0,10.58],[97.2,10.35],[98.4,10.12]]);
return{
 id:'astral-01',version:2,name:'ASTRAL 01 — FIRST LIGHT',world:'astral',spawn:{x:2.1,y:6.95},killY:23,
 startX:4.0,finish:R('finish',174.2,3.7,1.8,4.7),
 solids:[
  R('island-00',0,8.35,16.5,5.2),R('island-01',18.4,7.92,12.3,5.1),R('island-02',33.0,7.16,12.7,5.3),
  R('island-03',48.2,8.28,10.4,5.2),R('island-04',61.2,7.62,15.2,5.1),R('island-05',80.2,8.12,12.7,5.3),
  R('island-06',97.2,6.92,12.5,5.5),R('island-07',113.0,8.45,13.2,5.3),R('island-08',130.0,7.22,11.5,5.3),
  R('island-09',146.0,7.92,13.5,5.2),R('island-10',163.0,8.34,18.8,5.3)
 ],
 oneWay:[
  R('route-upper-0',19.8,5.72,4.1,.26),R('route-upper-1',25.0,4.70,3.8,.26),R('route-upper-2',35.0,4.94,3.7,.26),R('route-upper-3',40.2,4.10,3.6,.26),
  R('route-upper-4',51.7,5.48,4.2,.26),R('route-upper-5',57.2,4.30,3.8,.26),R('route-upper-6',84.0,5.42,4.0,.26),R('route-upper-7',89.2,4.18,3.8,.26),
  R('route-upper-8',116.0,5.68,4.0,.26),R('route-upper-9',121.3,4.56,3.7,.26),R('route-upper-10',132.0,4.72,4.3,.26),R('route-upper-11',138.0,3.52,3.8,.26),
  R('route-upper-12',151.6,5.18,3.6,.26),R('route-upper-13',156.4,4.10,3.6,.26),
  R('secret-floor',95.0,11.62,4.6,.26),R('secret-step',98.0,9.72,2.0,.26),R('secret-exit',98.6,8.32,1.5,.26)
 ],
 movingPlatforms:[
  {id:'moving-0',x:15.1,y:6.50,w:3.15,h:.26,dy:1.20,period:2.8,phase:0},
  {id:'moving-1',x:76.6,y:5.48,w:3.25,h:.26,dy:1.42,period:3.15,phase:1.1},
  {id:'moving-2',x:109.3,y:5.05,w:3.15,h:.26,dx:1.75,period:3.35,phase:.45},
  {id:'moving-3',x:141.5,y:5.28,w:3.10,h:.26,dy:1.48,period:2.65,phase:2.0},
  {id:'secret-lift',x:98.2,y:10.30,w:1.55,h:.26,dy:1.72,period:3.0,phase:0}
 ],
 breakables:[R('break-0',66.0,5.50,1.2,1.2),R('break-1',67.2,5.50,1.2,1.2),R('break-2',102.1,4.82,1.2,1.2),R('break-3',103.3,4.82,1.2,1.2)],
 hazards:[
  R('hazard-0',27.1,7.27,1.55,.65),R('hazard-1',42.3,6.51,1.55,.65),R('hazard-2',55.4,7.63,1.45,.65),
  R('hazard-3',87.1,7.47,1.55,.65),R('hazard-4',105.4,6.27,1.55,.65),R('hazard-5',123.4,7.80,1.65,.65),
  R('hazard-6',154.8,7.27,1.65,.65),R('hazard-7',167.1,7.69,1.65,.65)
 ],
 checkpoints:[{id:'checkpoint-first-light',x:92.8,y:3.82,w:1.15,h:4.3,spawnX:94.2,spawnY:5.3}],
 secrets:[{id:'secret-grotto',x:95.0,y:9.35,w:4.2,h:2.35}],
 shards,shardTotal:shards.length,
 visual:{
   palette:{skyTop:'#2c79e8',skyMid:'#73b7ff',skyHaze:'#f2b9ea',moon:'#fff8ef',stone:'#e5edf8',stoneShadow:'#50618d',grass:'#50a462',cyan:'#5cf0ff',violet:'#8c79e9',pink:'#ef98d8',accent:'#ef294f'},
   moonX:.72,moonY:.20,moonRadius:.165,waterfalls:[18.9,36.6,65.3,99.8,131.8,163.8]
 }
};
});