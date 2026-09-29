export class EchoPlayback{
 constructor(physics,level,replay,type='pb'){this.physics=physics;this.level=level;this.replay=replay;this.type=type;this.state=physics.create(level);this.input={left:false,right:false,jump:false};this.i=0;this.done=!replay;}
 reset(){this.state=this.physics.create(this.level);this.input={left:false,right:false,jump:false};this.i=0;this.done=!this.replay;}
 advanceTo(targetTick){if(this.done)return this.state;const events=this.replay.events||[];while(this.state.tick<targetTick&&!this.state.finished&&this.state.tick<(this.replay.totalTicks||0)){while(this.i<events.length&&events[this.i].tick===this.state.tick){const e=events[this.i++];this.input={left:!!e.left,right:!!e.right,jump:!!e.jump};}this.physics.step(this.level,this.state,this.input);}if(this.state.finished||this.state.tick>=Number(this.replay.totalTicks||0))this.done=true;return this.state;}
}
