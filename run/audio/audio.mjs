let ctx=null;
function C(){if(!ctx)ctx=new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume();return ctx}
function tone(freq,dur=.08,type='sine',gain=.04,slide=0){try{const c=C(),o=c.createOscillator(),g=c.createGain(),t=c.currentTime;o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide),t+dur);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(c.destination);o.start(t);o.stop(t+dur)}catch(_){}}
export const SFX={
 jump:()=>tone(430,.1,'triangle',.045,210),
 bounce:()=>{tone(260,.08,'triangle',.04,310);setTimeout(()=>tone(620,.07,'triangle',.025,120),45)},
 boost:()=>tone(185,.12,'sawtooth',.024,420),
 land:()=>tone(120,.07,'sine',.03,-30),
 hard:()=>tone(82,.14,'square',.035,-25),
 skid:()=>tone(180,.08,'sawtooth',.018,-70),
 shard:()=>{tone(690,.07,'triangle',.035,180);setTimeout(()=>tone(920,.06,'triangle',.025,120),40)},
 checkpoint:()=>{tone(520,.08,'triangle',.03,180);setTimeout(()=>tone(780,.09,'triangle',.03,160),70)},
 death:()=>tone(180,.22,'sawtooth',.035,-120),
 victory:()=>{tone(520,.1,'triangle',.04,180);setTimeout(()=>tone(760,.12,'triangle',.04,220),90);setTimeout(()=>tone(980,.16,'triangle',.035,180),185)},
 secret:()=>{tone(330,.09,'sine',.03,220);setTimeout(()=>tone(660,.14,'sine',.03,220),80)}
};