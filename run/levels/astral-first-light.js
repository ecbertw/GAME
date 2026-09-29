(function(root,factory){
 const level=factory();
 if(typeof module==='object'&&module.exports)module.exports=level;
 if(root)root.EixoRunFirstLight=level;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const r=(id,x,y,w,h)=>({id,x,y,w,h});
const shards=[];
function line(prefix,x,y,count,dx,dy=0){for(let i=0;i<count;i++)shards.push({id:prefix+i,x:x+i*dx,y:y+i*dy});}
line('a',6,7.0,7,1.25,-.05);line('b',20.8,5.0,5,1.15,-.18);line('c',37.3,6.05,5,1.15,.12);
line('d',53.3,4.0,5,1.22,-.15);line('e',70.2,6.0,5,1.12,0);line('f',89.0,4.2,5,1.1,-.12);
line('g',112.4,6.2,4,1.18,.10);line('h',133.0,3.7,3,1.16,-.12);line('i',153.8,5.7,3,1.05,0);shards[39]={id:'secret0',x:93.7,y:10.55};shards[40]={id:'secret1',x:95.0,y:10.30};shards[41]={id:'secret2',x:96.2,y:10.05};
return{
 id:'astral-01',version:1,name:'ASTRAL 01 — FIRST LIGHT',world:'astral',spawn:{x:2.2,y:7.0},killY:23,
 startX:4.2,finish:r('finish',173.6,4.0,1.7,4.5),
 solids:[
  r('s0',0,8.5,16,5),r('s1',18,8.0,12,5),r('s2',32.5,7.2,12.5,5),r('s3',48,8.4,10,5),
  r('s4',61.2,7.7,14,5),r('s5',80,8.2,12.5,5),r('s6',97,7.0,12,5),r('s7',113,8.5,13,5),
  r('s8',130,7.3,11,5),r('s9',146,8.0,13,5),r('s10',163,8.5,18,5)
 ],
 oneWay:[
  r('u0',19.4,5.7,4.2,.28),r('u1',24.8,4.6,4.0,.28),r('u2',34.7,4.9,3.8,.28),r('u3',40.2,4.0,3.6,.28),
  r('u4',51.6,5.4,4.2,.28),r('u5',57.2,4.2,3.8,.28),r('u6',84.0,5.3,4.0,.28),r('u7',89.3,4.1,3.8,.28),
  r('u8',116.0,5.6,4.0,.28),r('u9',121.2,4.5,3.6,.28),r('u10',132.0,4.6,4.2,.28),r('u11',138.0,3.4,3.8,.28),
  r('u12',151.5,5.1,3.5,.28),r('u13',156.2,4.0,3.6,.28),r('secret-floor',93.0,11.55,4.4,.28),r('secret-step',95.8,9.65,2.0,.28),r('secret-exit',96.3,8.25,1.5,.28)
 ],
 movingPlatforms:[
  {id:'m0',x:14.7,y:6.4,w:3.2,h:.28,dy:1.3,period:2.8,phase:0},
  {id:'m1',x:75.6,y:5.4,w:3.3,h:.28,dy:1.5,period:3.2,phase:1.1},
  {id:'m2',x:108.7,y:5.0,w:3.2,h:.28,dx:1.8,period:3.4,phase:.4},
  {id:'m3',x:141.2,y:5.2,w:3.0,h:.28,dy:1.6,period:2.6,phase:2.0}
 ],
 breakables:[r('b0',66.0,5.5,1.2,1.2),r('b1',67.2,5.5,1.2,1.2),r('b2',101.8,4.9,1.2,1.2),r('b3',103.0,4.9,1.2,1.2)],
 hazards:[
  r('hz0',27.0,7.35,1.5,.65),r('hz1',42.2,6.55,1.5,.65),r('hz2',55.3,7.75,1.4,.65),
  r('hz3',87.0,7.55,1.55,.65),r('hz4',105.2,6.35,1.5,.65),r('hz5',123.4,7.85,1.6,.65),
  r('hz6',154.8,7.35,1.6,.65),r('hz7',167.0,7.85,1.6,.65)
 ],
 checkpoints:[{id:'cp1',x:92.7,y:3.9,w:1.1,h:4.2,spawnX:94.2,spawnY:5.4}],
 secrets:[{id:'secret-grotto',x:93.1,y:9.35,w:3.9,h:2.1}],
 shards,shardTotal:shards.length,
 visual:{moonX:78,moonY:-8,moonRadius:16,accent:'#ef284d',cyan:'#53e9ff',violet:'#8d75e8'}
};
});