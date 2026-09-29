const same=(a,b)=>a&&a.left===b.left&&a.right===b.right&&a.jump===b.jump;
export class ReplayRecorder{
 constructor(){this.reset();}
 reset(){this.events=[];this.last=null;}
 capture(tick,input){const clean={left:!!input.left,right:!!input.right,jump:!!input.jump};if(!same(this.last,clean)){this.events.push({tick,...clean});this.last=clean;}}
 serialize(totalTicks){if(!this.events.length)this.events.push({tick:0,left:false,right:false,jump:false});return{version:1,totalTicks,events:this.events.slice()};}
}
