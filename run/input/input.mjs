const MAP={ArrowLeft:1,KeyA:1,ArrowRight:2,KeyD:2,Space:4,ArrowUp:4,KeyW:4};
export class RunInput{
  constructor(target=window){
    this.target=target;this.keys=new Set();this.virtualMask=0;this.mask=0;this.changed=true;
    this.keydown=e=>{const bit=MAP[e.code];if(!bit||e.target?.closest?.('input,textarea,select,button'))return;e.preventDefault();if(!this.keys.has(e.code)){this.keys.add(e.code);this.rebuild()}};
    this.keyup=e=>{const bit=MAP[e.code];if(!bit)return;e.preventDefault();if(this.keys.delete(e.code))this.rebuild()};
    target.addEventListener('keydown',this.keydown,{passive:false});target.addEventListener('keyup',this.keyup,{passive:false});
  }
  rebuild(){let next=this.virtualMask;for(const code of this.keys)next|=MAP[code]||0;if(next!==this.mask){this.mask=next;this.changed=true}}
  setVirtual(bit,on){if(on)this.virtualMask|=bit;else this.virtualMask&=~bit;this.rebuild()}
  consumeChanged(){const out=this.changed;this.changed=false;return out}
  clear(){this.keys.clear();this.virtualMask=0;this.rebuild()}
  destroy(){this.target.removeEventListener('keydown',this.keydown);this.target.removeEventListener('keyup',this.keyup)}
}