(()=>{
  'use strict';

  const LAST_TOTAL_KEY='eixo.run.level-total-last.v1';
  const state={
    scene:null,
    patched:false,
    totalStartedAt:null,
    level:null,
    pendingDeathReset:false,
    frozen:null,
    wasRunActive:false
  };

  const $=id=>document.getElementById(id);
  const fmt=ms=>{
    const n=Math.max(0,Math.floor(Number(ms)||0));
    return String(Math.floor(n/60000)).padStart(2,'0')+':'+String(Math.floor((n%60000)/1000)).padStart(2,'0')+'.'+String(n%1000).padStart(3,'0');
  };

  function injectUi(){
    const block=document.querySelector('.run-hud-time-block');
    const attempt=$('run-hud-time');
    const pb=$('run-hud-pb');
    if(block&&attempt&&pb&&!$('run-hud-total-time')){
      const oldLabel=block.querySelector('small');
      if(oldLabel)oldLabel.textContent='TENTATIVA';

      const attemptMetric=document.createElement('div');
      attemptMetric.className='run-hud-metric run-hud-attempt-metric';
      if(oldLabel)attemptMetric.appendChild(oldLabel);
      attemptMetric.appendChild(attempt);

      const totalMetric=document.createElement('div');
      totalMetric.className='run-hud-metric run-hud-total-metric';
      totalMetric.innerHTML='<small>TEMPO TOTAL</small><strong id="run-hud-total-time">00:00.000</strong>';

      const pbMetric=document.createElement('div');
      pbMetric.className='run-hud-metric run-hud-pb-metric';
      const pbLabel=document.createElement('small');
      pbLabel.textContent='RECORDE';
      pbMetric.appendChild(pbLabel);
      pbMetric.appendChild(pb);

      block.replaceChildren(attemptMetric,totalMetric,pbMetric);
    }

    const clearTime=$('run-clear-time');
    const clearPb=$('run-clear-pb');
    if(clearTime&&clearPb&&!$('run-clear-total-time')){
      const attemptLabel=document.createElement('div');
      attemptLabel.className='run-clear-time-label';
      attemptLabel.textContent='TENTATIVA FINAL';
      clearTime.parentNode.insertBefore(attemptLabel,clearTime);

      const summary=document.createElement('div');
      summary.className='run-clear-timing-summary';
      summary.innerHTML='<div><span>TEMPO TOTAL</span><strong id="run-clear-total-time">00:00.000</strong></div><div><span>RECORDE</span><strong id="run-clear-record">--:--.---</strong></div>';
      clearTime.parentNode.insertBefore(summary,clearPb);
    }

    if(!$('run-timing-style')){
      const style=document.createElement('style');
      style.id='run-timing-style';
      style.textContent=`
        .run-game-hud{grid-template-columns:auto minmax(180px,1fr) minmax(480px,1.45fr) 120px!important;gap:20px!important}
        .run-hud-time-block{display:grid!important;grid-template-columns:repeat(3,minmax(125px,1fr))!important;gap:10px!important;align-items:stretch!important;justify-content:stretch!important}
        .run-hud-metric{min-width:0;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:6px;padding:9px 12px;border-left:1px solid rgba(112,137,173,.22)}
        .run-hud-metric:first-child{border-left:0}
        .run-hud-metric small{font:800 8px/1 Inter,Arial,sans-serif!important;letter-spacing:1.25px!important;color:#8093aa!important;white-space:nowrap}
        .run-hud-metric strong,.run-hud-metric #run-hud-pb{margin:0!important;grid-column:auto!important;font:800 19px/1 ui-monospace,SFMono-Regular,Consolas,monospace!important;color:#f2f6ff!important;white-space:nowrap}
        .run-hud-total-metric strong{color:#8ce9dc!important}
        .run-hud-pb-metric #run-hud-pb{color:#d7cdf9!important}
        .run-clear-time-label{margin:8px 0 5px;color:#8093aa;font:800 9px/1 Inter,Arial,sans-serif;letter-spacing:1.5px;text-align:center}
        .run-clear-timing-summary{width:min(460px,80vw);display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px auto 12px}
        .run-clear-timing-summary>div{display:flex;flex-direction:column;gap:6px;padding:12px 16px;border:1px solid #3a4961;border-radius:11px;background:#0e1828cc;text-align:center}
        .run-clear-timing-summary span{color:#8093aa;font:800 8px/1 Inter,Arial,sans-serif;letter-spacing:1.3px}
        .run-clear-timing-summary strong{color:#eef3ff;font:800 18px/1 ui-monospace,SFMono-Regular,Consolas,monospace}
        #run-clear-total-time{color:#8ce9dc}.run-clear-timing-summary #run-clear-record{color:#d7cdf9}
        @media(max-width:980px){.run-game-hud{grid-template-columns:auto minmax(130px,.7fr) minmax(390px,1.5fr) 90px!important;gap:10px!important;padding:0 16px!important}.run-hud-time-block{grid-template-columns:repeat(3,minmax(105px,1fr))!important}.run-hud-metric{padding:8px}.run-hud-metric strong,.run-hud-metric #run-hud-pb{font-size:15px!important}}
      `;
      document.head.appendChild(style);
    }
  }

  function beginLevel(scene){
    state.level=scene.levelIndex+1;
    state.totalStartedAt=scene.time.now;
    state.frozen=null;
    state.pendingDeathReset=false;
    if(Number.isFinite(Number(scene.levelStartedAt)))scene.levelStartedAt=scene.time.now;
    const total=$('run-hud-total-time');
    if(total)total.textContent='00:00.000';
  }

  function currentTotal(scene){
    if(state.frozen&&state.frozen.level===scene.levelIndex+1)return state.frozen.totalMs;
    if(state.totalStartedAt===null)return 0;
    return Math.max(0,Math.round(scene.time.now-state.totalStartedAt));
  }

  function bestFor(scene,level){
    const n=Number(scene.levelTimes&&scene.levelTimes[String(level)]);
    return Number.isFinite(n)?n:null;
  }

  function saveLastTotal(level,totalMs,attemptMs,deaths){
    try{
      const raw=localStorage.getItem(LAST_TOTAL_KEY);
      const all=raw?JSON.parse(raw):{};
      all[String(level)]={totalMs:Math.max(0,Math.round(totalMs)),attemptMs:Math.max(0,Math.round(attemptMs)),deaths:Math.max(0,Math.floor(Number(deaths)||0)),updatedAt:Date.now()};
      localStorage.setItem(LAST_TOTAL_KEY,JSON.stringify(all));
    }catch(_){}
  }

  function renderClear(scene){
    if(!state.frozen)return;
    const total=$('run-clear-total-time');
    const record=$('run-clear-record');
    if(total)total.textContent=fmt(state.frozen.totalMs);
    const best=bestFor(scene,state.frozen.level);
    if(record)record.textContent=best===null?'--:--.---':fmt(best);
  }

  function patchScene(scene){
    if(!scene||scene.__eixoDualTimerPatch)return;
    scene.__eixoDualTimerPatch=true;
    state.scene=scene;

    const rawKill=scene.killPlayer.bind(scene);
    scene.killPlayer=function(manual){
      const before=this.deaths;
      const result=rawKill(manual);
      if(this.deaths>before){
        state.pendingDeathReset=true;
        const attempt=$('run-hud-time');
        if(attempt)attempt.textContent='00:00.000';
      }
      return result;
    };

    const rawLoad=scene.loadLevel.bind(scene);
    scene.loadLevel=function(index,options={}){
      const previousIndex=this.levelIndex;
      const wasActive=this.runActive;
      const result=rawLoad(index,options);

      if(this.runActive){
        if(state.pendingDeathReset){
          // A death/restart begins a fresh ranked attempt, but the total level
          // clock deliberately keeps running.
          this.levelStartedAt=this.time.now;
          state.pendingDeathReset=false;
        }else if(options&&options.resetClock){
          beginLevel(this);
        }else if(wasActive&&previousIndex!==this.levelIndex){
          beginLevel(this);
        }
      }
      return result;
    };

    const rawComplete=scene.completeLevel.bind(scene);
    scene.completeLevel=async function(...args){
      if(this.runActive&&!this.finished&&!this.dead&&!this.levelLocked){
        const level=this.levelIndex+1;
        state.frozen={
          level,
          attemptMs:Math.max(1,Math.round(this.time.now-this.levelStartedAt)),
          totalMs:currentTotal(this)
        };
      }

      const result=await rawComplete(...args);
      if(state.frozen&&this.lastClearResult&&Number.isFinite(Number(this.lastClearResult.timeMs))){
        state.frozen.attemptMs=Math.max(1,Math.round(Number(this.lastClearResult.timeMs)));
      }
      if(state.frozen){
        saveLastTotal(state.frozen.level,state.frozen.totalMs,state.frozen.attemptMs,this.deaths);
        renderClear(this);
      }
      return result;
    };
  }

  function findScene(){
    const game=window.EixoRunGame;
    if(!game)return null;
    try{return game.scene?.getScene?.('HardcoreRun')||null}catch(_){return null}
  }

  function frame(){
    injectUi();
    const scene=findScene();
    if(scene){
      patchScene(scene);

      const active=!!(scene.runActive&&!scene.finished);
      if(active&&!state.wasRunActive){
        beginLevel(scene);
      }
      state.wasRunActive=active;

      const level=scene.levelIndex+1;
      if(active&&state.level!==level&&!scene.awaitingClearChoice&&!scene.dead){
        beginLevel(scene);
      }

      const attemptEl=$('run-hud-time');
      const totalEl=$('run-hud-total-time');
      const pbEl=$('run-hud-pb');

      if(active){
        const attemptMs=scene.dead?0:(state.frozen&&state.frozen.level===level?state.frozen.attemptMs:Math.max(0,Math.round(scene.time.now-(Number(scene.levelStartedAt)||scene.time.now))));
        if(attemptEl)attemptEl.textContent=fmt(attemptMs);
        if(totalEl)totalEl.textContent=fmt(currentTotal(scene));
      }else if(!scene.awaitingClearChoice){
        if(attemptEl)attemptEl.textContent='00:00.000';
        if(totalEl)totalEl.textContent='00:00.000';
      }

      const best=bestFor(scene,level);
      if(pbEl)pbEl.textContent=best===null?'--:--.---':fmt(best);
      if(scene.awaitingClearChoice)renderClear(scene);
    }
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
