export class ReplayRecorder{
 constructor(){this.rows=[];this.last=null}
 reset(){this.rows=[];this.last=null}
 push(t,mask){if(mask===this.last)return;this.last=mask;this.rows.push({t,m:mask})}
 compact(){return this.rows.map(x=>({t:x.t,m:x.m}))}
}