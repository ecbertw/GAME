const K={ArrowLeft:1,KeyA:1,ArrowRight:2,KeyD:2,Space:4,ArrowUp:4,KeyW:4};
export class RunInput{
  constructor(target=window){this.target=target;this.down=new Set();this.mask=0;this.changed=false;
    this.keydown=e=>{if(!K[e.code]||e.target?.closest?.('input,textarea,select,button'))return;e.preventDefault();if(!this.down.has(e.code)){this.down.add(e.code);this.rebuild()}};
    this.keyup=e=>{if(!K[e.code])return;e.preventDefault();this.down.delete(e.code);this.rebuild()};
    target.addEventListener('keydown',this.keydown,{passive:false});target.addEventListener('keyup',this.keyup,{passive:false});
  }
  rebuild(){let m=0;for(const k of this.down)m|=K[k]||0;if(m!==this.mask){this.mask=m;this.changed=true}}
  consumeChanged(){const v=this.changed;this.changed=false;return v}
  destroy(){this.target.removeEventListener('keydown',this.keydown);this.target.removeEventListener('keyup',this.keyup)}
}