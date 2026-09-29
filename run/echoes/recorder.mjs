export class ReplayRecorder{
  constructor(){this.rows=[];this.last=-1}
  reset(mask=0){this.rows=[{tick:0,mask}];this.last=mask}
  sample(tick,mask){if(mask!==this.last){this.rows.push({tick,mask});this.last=mask}}
  data(){return this.rows.map(x=>({tick:x.tick,mask:x.mask}))}
}
export function maskAt(replay,tick,state={i:0,mask:0}){while(state.i<replay.length&&replay[state.i].tick<=tick){state.mask=replay[state.i].mask;state.i++}return state.mask}