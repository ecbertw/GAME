const MAP={ArrowLeft:1,KeyA:1,ArrowRight:2,KeyD:2,Space:4,ArrowUp:4,KeyW:4};
export class RunInput{
  constructor(target=window){this.target=target;this.down=new Set();this.mask=0;this.changed=false;
    this.onDown=e=>{if(!MAP[e.code]||e.repeat||e.target?.closest?.('input,textarea,select,button'))return;e.preventDefault();this.down.add(e.code);this.rebuild()};
    this.onUp=e=>{if(!MAP[e.code])return;e.preventDefault();this.down.delete(e.code);this.rebuild()};
    target.addEventListener('keydown',this.onDown,{passive:false});target.addEventListener('keyup',this.onUp,{passive:false});
  }
  rebuild(){let m=0;for(const code of this.down)m|=MAP[code]||0;if(m!==this.mask){this.mask=m;this.changed=true}}
  clear(){this.down.clear();this.rebuild()}
  destroy(){this.target.removeEventListener('keydown',this.onDown);this.target.removeEventListener('keyup',this.onUp)}
}
