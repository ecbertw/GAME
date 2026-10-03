(()=>{
  'use strict';

  function install(){
    const audio=window.EixoRunAudio;
    if(!audio||audio.__physicalJumpGate)return false;
    audio.__physicalJumpGate=true;

    const rawJump=audio.jump.bind(audio);
    let allowJumpUntil=0;

    /* The legacy keydown hook may still call audio.jump(), but it stays silent
       unless RUN physics has just confirmed a real launch. */
    audio.jump=()=>{
      if(performance.now()>allowJumpUntil)return;
      allowJumpUntil=0;
      rawJump();
    };
    audio.confirmJump=()=>{
      allowJumpUntil=performance.now()+80;
      audio.jump();
    };

    /* The ambience/music bus already lives on the old site-volume gain.
       Expose it with the correct RUN-facing name without breaking saved settings. */
    audio.setMusicVolume=v=>audio.setSiteVolume(v);
    return true;
  }

  let lastPlayer=null;
  let lastVy=0;
  let wasActive=false;

  function frame(){
    install();
    const audio=window.EixoRunAudio;
    const game=window.EixoRunGame;
    let scene=null;
    try{scene=game?.scene?.getScene?.('HardcoreRun')||null}catch(_){scene=null}

    const player=scene?.player;
    const body=player?.body;
    const active=!!(scene&&body&&scene.runActive&&!scene.finished&&!scene.dead);

    if(active){
      const vy=Number(body.velocity?.y)||0;
      if(lastPlayer!==player||!wasActive){
        lastPlayer=player;
        lastVy=vy;
      }else{
        /* RUN launches at roughly -570/-610 px/s. This transition catches a
           genuine floor/coyote/wall jump once, never keyboard auto-repeat. */
        if(vy<-300&&lastVy>-240)audio?.confirmJump?.();
        lastVy=vy;
      }
    }else{
      lastPlayer=null;
      lastVy=0;
    }
    wasActive=active;
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
