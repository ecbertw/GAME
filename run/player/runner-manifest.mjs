export const RUNNER_MANIFEST=Object.freeze({
  version:1,image:'/assets/run/runner/runner-sheet.svg',frameWidth:128,frameHeight:160,frames:16,
  render:Object.freeze({offsetX:-.46,offsetY:-.32,width:1.68,height:1.92}),fixedOutfit:true,
  states:Object.freeze({
    idle:{frames:[0,1],ticksPerFrame:90},start:{frames:[2],ticksPerFrame:1,loop:false},
    run:{frames:[3,4,5,6],ticksPerFrame:8},fast:{frames:[3,4,5,6],ticksPerFrame:6},
    skid:{frames:[7],ticksPerFrame:1,loop:false},jumpStart:{frames:[8],ticksPerFrame:1,loop:false},
    rise:{frames:[9],ticksPerFrame:1,loop:false},apex:{frames:[10],ticksPerFrame:1,loop:false},
    fall:{frames:[11],ticksPerFrame:1,loop:false},land:{frames:[12],ticksPerFrame:1,loop:false},
    hardLand:{frames:[13],ticksPerFrame:1,loop:false},death:{frames:[14],ticksPerFrame:1,loop:false},
    victory:{frames:[15],ticksPerFrame:1,loop:false}
  })
});