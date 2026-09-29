export class ReplayRecorder{
  constructor(){this.rows=[];this.lastMask=null}
  reset(initialMask=0){this.rows=[{tick:0,mask:initialMask|0}];this.lastMask=initialMask|0}
  sample(tick,mask){mask|=0;if(mask===this.lastMask)return;if(tick===0)this.rows[0]={tick:0,mask};else this.rows.push({tick,mask});this.lastMask=mask}
  data(){return this.rows.map(x=>({tick:x.tick,mask:x.mask}))}
}