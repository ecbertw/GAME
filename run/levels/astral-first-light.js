(function(root,factory){
  const level=factory();
  if(typeof module==='object'&&module.exports)module.exports=level;
  if(root)root.EixoRunFirstLight=level;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
return {
  id:'astral-01',
  version:1,
  name:'FIRST LIGHT',
  subtitle:'MOVEMENT LAB',
  spawn:{x:1.5,y:5.5},
  killY:18,
  solids:[
    {id:'start',x:0,y:7,w:15,h:4},
    {id:'island-a',x:17.2,y:6.7,w:7.5,h:4.3},
    {id:'island-b',x:27.0,y:6.0,w:7.0,h:5.0},
    {id:'island-c',x:36.4,y:7.2,w:8.0,h:3.8},
    {id:'island-d',x:47.2,y:6.2,w:8.5,h:4.8},
    {id:'finish-floor',x:58.5,y:7.0,w:17,h:4}
  ],
  oneWay:[
    {id:'upper-a',x:19.2,y:3.9,w:3.4,h:.28},
    {id:'upper-b',x:24.0,y:3.0,w:3.0,h:.28},
    {id:'upper-c',x:29.0,y:2.6,w:3.0,h:.28}
  ],
  hazards:[
    {id:'spike-a',x:31.4,y:5.45,w:1.1,h:.55},
    {id:'spike-b',x:50.8,y:5.65,w:1.2,h:.55}
  ],
  finish:{x:70.5,y:3.2,w:1.5,h:3.8},
  lab:{startX:1.5,endX:72}
};
});
