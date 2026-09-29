export class RunAudio{
 constructor(){this.ctx=null}
 ensure(){if(!this.ctx)this.ctx=new(window.AudioContext||window.webkitAudioContext)();return this.ctx}
 tone(freq,dur=.07,type='sine',gain=.035){try{const c=this.ensure(),o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(gain,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+dur);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+dur)}catch(_){}}
 event(e){if(e.type==='jump')this.tone(420,.06,'triangle');if(e.type==='shard')this.tone(760,.05,'sine',.025);if(e.type==='checkpoint')this.tone(520,.14,'sine',.04);if(e.type==='secret')this.tone(610,.24,'triangle',.04);if(e.type==='death')this.tone(130,.14,'sawtooth',.035);if(e.type==='finish')this.tone(880,.20,'triangle',.045)}
}