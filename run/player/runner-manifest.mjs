export const RUNNER={
 version:2,
 image:'/assets/run/runner/eixo-runner-sheet.svg',
 frameWidth:160,frameHeight:190,frames:14,fixedOutfit:true,
 palette:{hair:'#111827',accent:'#ef294f',jacket:'#f7f8fc',pants:'#182238',skin:'#ffd1bd'},
 production:{format:'2d-sprite',rig3d:false,outfitEditable:false,concept:'EIXO RUN final concept 2026-09-29'},
 states:{
  idle:{frames:[0,1],rate:76},
  run:{frames:[2,3,4,5],rate:7},
  fast:{frames:[2,3,4,5],rate:5},
  skid:{frames:[6],rate:1},
  jumpStart:{frames:[7],rate:1},
  jump:{frames:[8],rate:1},
  apex:{frames:[9],rate:1},
  fall:{frames:[10],rate:1},
  land:{frames:[11],rate:1},
  death:{frames:[12],rate:1},
  victory:{frames:[13],rate:1}
 }
};