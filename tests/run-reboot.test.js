'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');

test('RUN is a standalone Phaser hardcore platformer',()=>{
  const main=read('games/run/src/main.js');
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  assert.match(main,/HardcoreRunScene/);
  assert.match(scene,/const LEVELS = \[/);
  assert.match(scene,/HARDCORE PLATFORMER/);
  assert.match(scene,/wallLeft/);
  assert.match(scene,/killPlayer/);
  assert.match(scene,/addSaw/);
  assert.match(scene,/addLaser/);
  assert.doesNotMatch(scene,/Astral|runner-manifest|approved-runner|jump-(?:physics|motion|worlds|exact-renderer)|EixoJump|WebSocket/);
});

test('RUN contains twelve levels with a timer that resets only after a clear',()=>{
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  const names=[...scene.matchAll(/name:'([^']+)'/g)].map(m=>m[1]);
  assert.equal(names.length,12);
  assert.match(scene,/this\.levelStartedAt=this\.time\.now/);
  assert.match(scene,/this\.time\.now-this\.levelStartedAt/);
  assert.match(scene,/loadLevel\(this\.levelIndex\+1,\{resetClock:true\}\)/);
  assert.match(scene,/loadLevel\(this\.levelIndex\)/);
  assert.doesNotMatch(scene,/runStartedAt/);
  assert.match(scene,/deathText/);
  assert.match(scene,/DEATHS  0/);
});

test('RUN ranking prioritizes highest level and then fastest level time',()=>{
  const service=read('run-server.js');
  assert.match(service,/best_level INTEGER NOT NULL DEFAULT 0/);
  assert.match(service,/current_level INTEGER NOT NULL DEFAULT 1/);
  assert.match(service,/best_level DESC,rb\.best_time_ms ASC/);
  assert.match(service,/level>Number\(old\.best_level/);
  assert.match(service,/level===Number\(old\.best_level/);
  assert.doesNotMatch(service,/deaths-b\.deaths|serverElapsed/);
});

test('RUN public route and ranking APIs are wired into server',()=>{
  const server=read('server.js');
  assert.match(server,/require\('\.\/run-server'\)/);
  assert.match(server,/url\.pathname==='\/run'/);
  assert.match(server,/\/api\/run\/start/);
  assert.match(server,/\/api\/run\/level/);
  assert.match(server,/\/api\/run\/rankings/);
  assert.match(server,/runService\.initDb/);
});

test('RUN no longer depends on the old visual asset stack',()=>{
  const index=read('games/run/index.html');
  const css=read('games/run/run.css');
  const main=read('games/run/src/main.js');
  assert.match(index,/12 LEVELS/);
  assert.match(css,/#08090d/);
  assert.doesNotMatch(index,/MOVEMENT LAB|PRIVATE BUILD|ASTRAL/);
  assert.doesNotMatch(main,/MovementLabScene|FirstLightScene/);
});


test('RUN level geometry stays inside the real jump envelope',()=>{
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  const cfg=read('games/run/src/run-config.js');
  const block=scene.match(/const LEVELS = (\[[\s\S]*?\n\]);\n\nconst C/);
  assert.ok(block,'LEVELS block not found');
  const levels=Function('return '+block[1])();
  const number=name=>{
    const m=cfg.match(new RegExp(name+'\\s*:\\s*(\\d+)'));
    assert.ok(m,'missing '+name);
    return Number(m[1]);
  };
  const gravity=number('gravityY');
  const speed=number('runSpeed');
  const jump=number('jumpSpeed');
  const margin=.80;

  const surfaces=level=>{
    const out=[];
    for(const [a,b,top] of level.floors||[])out.push({kind:'floor',left:a,right:b,top});
    for(const [x,y,w,h] of level.platforms||[])out.push({kind:'platform',left:x-w/2,right:x+w/2,top:y-h/2});
    return out;
  };
  const canReach=(a,b)=>{
    if(b.right<a.left-1)return false;
    const gap=Math.max(0,b.left-a.right);
    const rise=a.top-b.top;
    const disc=jump*jump-2*gravity*rise;
    if(disc<0)return false;
    const flight=(jump+Math.sqrt(disc))/gravity;
    return gap<=speed*flight*margin;
  };

  for(const level of levels){
    const nodes=surfaces(level);
    const starts=[];
    nodes.forEach((s,i)=>{if(s.left<=level.spawn[0]&&s.right>=level.spawn[0])starts.push(i)});
    assert.ok(starts.length,level.name+' has no spawn support');
    const seen=new Set(starts),queue=[...starts];
    while(queue.length){
      const i=queue.shift();
      nodes.forEach((s,j)=>{
        if(j!==i&&!seen.has(j)&&canReach(nodes[i],s)){seen.add(j);queue.push(j)}
      });
    }
    const goals=[];
    nodes.forEach((s,i)=>{
      if(s.left-30<=level.goal[0]&&s.right+30>=level.goal[0]&&Math.abs(s.top-level.goal[1])<=40)goals.push(i);
    });
    assert.ok(goals.some(i=>seen.has(i)),level.name+' has no reachable route to EXIT');
    nodes.forEach((s,i)=>{
      if(s.kind==='platform')assert.ok(seen.has(i),level.name+' contains an unreachable visible platform');
    });
  }

  const first=levels[0];
  const p0={left:first.platforms[0][0]-first.platforms[0][2]/2,right:first.platforms[0][0]+first.platforms[0][2]/2,top:first.platforms[0][1]-first.platforms[0][3]/2};
  const p1={left:first.platforms[1][0]-first.platforms[1][2]/2,right:first.platforms[1][0]+first.platforms[1][2]/2,top:first.platforms[1][1]-first.platforms[1][3]/2};
  assert.ok(canReach(p0,p1),'FIRST BLOOD elevated platform chain must be jumpable');
  assert.ok(speed*(2*jump/gravity)>290,'same-height jump range unexpectedly low');
  assert.ok((jump*jump)/(2*gravity)>120,'jump height unexpectedly low');
});


test('RUN keeps the death HUD but never paints a red death square',()=>{
  const scene=read('games/run/src/scenes/HardcoreRunScene.js');
  assert.match(scene,/DEATHS  0/);
  assert.match(scene,/this\.deaths\+=1/);
  assert.match(scene,/this\.player\.setVisible\(false\)/);
  assert.doesNotMatch(scene,/this\.player\.setFillStyle\(C\.hazard/);
  assert.match(scene,/L'\+String\(p\.level\|\|0\)/);
  assert.match(scene,/RANKING = HIGHEST LEVEL · FASTEST TIME/);
  assert.match(scene,/\/api\/run\/level/);
});
