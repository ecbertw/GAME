const LEFT=new Set(['ArrowLeft','KeyA']),RIGHT=new Set(['ArrowRight','KeyD']),JUMP=new Set(['Space','KeyW','ArrowUp']);
export class RunInput{
 constructor(target=window){this.target=target;this.down=new Set();this.enabled=true;this.onDown=e=>this.key(e,true);this.onUp=e=>this.key(e,false);target.addEventListener('keydown',this.onDown,{passive:false});target.addEventListener('keyup',this.onUp,{passive:false});}
 key(e,on){if(!this.enabled)return;if(LEFT.has(e.code)||RIGHT.has(e.code)||JUMP.has(e.code)){e.preventDefault();on?this.down.add(e.code):this.down.delete(e.code);}}
 snapshot(){return{left:[...LEFT].some(k=>this.down.has(k)),right:[...RIGHT].some(k=>this.down.has(k)),jump:[...JUMP].some(k=>this.down.has(k))};}
 clear(){this.down.clear();}
 destroy(){this.target.removeEventListener('keydown',this.onDown);this.target.removeEventListener('keyup',this.onUp);}
}
