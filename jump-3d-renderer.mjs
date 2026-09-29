import * as THREE from './vendor/three/three.module.min.js';
import {GLTFLoader} from './vendor/three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from './vendor/three/addons/utils/SkeletonUtils.js';

const WORLD_W=960,WORLD_H=540,MODEL_HEIGHT=82,RUN_REFERENCE_SPEED=216,PROFILE_YAW=Math.PI/2-.10;
const actors=new Map();
let renderer,scene,camera,canvas,source,clips=[],ready=false,frame=0,lastTime=performance.now()/1000,previewState=null;

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const damp=(current,target,rate,dt)=>current+(target-current)*(1-Math.exp(-rate*Math.max(0,dt)));

function mark(state,detail=''){
  const node=document.getElementById('jump3dCanvas');if(!node)return;
  node.dataset.rendererState=state;if(detail)node.dataset.rendererDetail=String(detail).slice(0,160);else delete node.dataset.rendererDetail;
}

function colour(value,fallback){
  if(value==='rainbow')return new THREE.Color().setHSL((performance.now()/9000)%1,.82,.58);
  try{return new THREE.Color(value||fallback)}catch(_){return new THREE.Color(fallback)}
}

function addLights(target,preview=false){
  target.add(new THREE.HemisphereLight(0xcbe5ff,0x182039,preview?2.55:2.25));
  const key=new THREE.DirectionalLight(0xfff2dc,preview?3.35:3.1);key.position.set(-180,360,500);key.castShadow=true;target.add(key);
  const rim=new THREE.DirectionalLight(0x70cfff,preview?1.95:1.7);rim.position.set(240,120,260);target.add(rim);
}

function mount(){
  const root=document.getElementById('jumpRoot'),base=document.getElementById('jumpCanvas');
  if(!root||!base||canvas)return;
  canvas=document.getElementById('jump3dCanvas');
  if(!canvas){canvas=document.createElement('canvas');canvas.id='jump3dCanvas';canvas.setAttribute('aria-hidden','true');base.after(canvas)}
  mark('mounted');
  renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,premultipliedAlpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setSize(WORLD_W,WORLD_H,false);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000,0);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene=new THREE.Scene();camera=new THREE.OrthographicCamera(0,WORLD_W,WORLD_H,0,.1,2000);camera.position.set(0,0,800);camera.lookAt(0,0,0);
  addLights(scene,false);
}

function prepareModel(model,height=MODEL_HEIGHT){
  const box=new THREE.Box3().setFromObject(model),size=new THREE.Vector3();box.getSize(size);
  const scale=height/Math.max(.001,size.y);model.scale.setScalar(scale);
  const scaled=new THREE.Box3().setFromObject(model);model.userData.groundOffset=-scaled.min.y;model.position.y=model.userData.groundOffset;
  if(canvas&&height===MODEL_HEIGHT){canvas.dataset.sourceBounds=[size.x,size.y,size.z].map(v=>v.toFixed(5)).join(',');canvas.dataset.modelScale=scale.toFixed(4);canvas.dataset.scaledBounds=[scaled.min.y,scaled.max.y].map(v=>v.toFixed(2)).join(',')}
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false}});
  return model;
}

function materialSet(root,style,ghost=false){
  const palette={hair:colour(style.hair,'#17243d'),jacket:colour(style.top,'#f3eee4'),pants:colour(style.pants,'#263c5c'),boots:colour(style.shoes,'#76503c'),accent:colour(style.accent,'#19bfe8')};
  root.traverse(o=>{
    if(!o.isMesh)return;
    if(!o.userData.materialCloned){o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();o.userData.materialCloned=true}
    const mats=Array.isArray(o.material)?o.material:[o.material];
    for(const m of mats){
      const n=(m.name||o.name||'').toLowerCase();
      if(n.includes('hair'))m.color.copy(palette.hair);
      else if(n.includes('jacket')||n.includes('shirt')||n.includes('top'))m.color.copy(palette.jacket);
      else if(n.includes('pant'))m.color.copy(palette.pants);
      else if(n.includes('boot')||n.includes('shoe'))m.color.copy(palette.boots);
      else if(n.includes('accent')||n.includes('orbit')){m.color.copy(palette.accent);if('emissive' in m)m.emissive.copy(palette.accent).multiplyScalar(.35)}
      m.transparent=ghost;m.opacity=ghost?.62:1;m.depthWrite=!ghost;
    }
  });
}

function createActor(root,id,ghost){
  const mixer=new THREE.AnimationMixer(root),actions={};
  for(const clip of clips){const key=(clip.name||'').toLowerCase();actions[key]=mixer.clipAction(clip)}
  return {
    id,root,mixer,actions,cape:root.getObjectByName('Accessory_Cape'),
    leftArm:root.getObjectByName('mixamorig:LeftArm'),
    rightArm:root.getObjectByName('mixamorig:RightArm'),
    leftFore:root.getObjectByName('mixamorig:LeftForeArm'),
    rightFore:root.getObjectByName('mixamorig:RightForeArm'),
    current:null,seen:frame,ghost,lean:0,runScale:1,lastGround:true
  };
}
function makeActor(id,ghost){
  const root=prepareModel(cloneSkeleton(source));root.visible=false;root.renderOrder=ghost?1:2;scene.add(root);
  const actor=createActor(root,id,ghost);actors.set(id,actor);return actor;
}

function pickAction(actions,part){
  const names=Object.keys(actions);
  return names.find(n=>n===part)||names.find(n=>n.includes(part));
}

function runTimeScale(motion){
  const speed=Math.abs(Number(motion.vx)||0);
  if(!speed)return motion.moving?1:0;
  return clamp(speed/RUN_REFERENCE_SPEED,.72,1.38);
}

function jumpPhase(vy){
  const v=Number(vy)||0;
  if(v>=0)return clamp(.10+(1-clamp(v/414,0,1))*.40,.10,.50);
  return clamp(.50+clamp((-v)/564,0,1)*.40,.50,.90);
}
function chooseAction(actor,motion,dt=.016){
  const ground=motion.ground!==false;
  const wanted=ground?(motion.moving?pickAction(actor.actions,'run'):(pickAction(actor.actions,'idle')||pickAction(actor.actions,'run'))):pickAction(actor.actions,'jump');
  if(!wanted)return;
  const action=actor.actions[wanted];
  actor.runScale=damp(actor.runScale,runTimeScale(motion)||1,10,dt);

  if(actor.current!==wanted){
    const previous=actor.current?actor.actions[actor.current]:null;
    action.reset().enabled=true;action.setEffectiveWeight(1);
    if(wanted.includes('jump')){
      action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.setEffectiveTimeScale(1);action.play();action.paused=true;
    }else{
      action.paused=false;action.setLoop(THREE.LoopRepeat,Infinity);action.clampWhenFinished=false;action.setEffectiveTimeScale(wanted.includes('run')?actor.runScale:1);action.play();
    }
    if(previous&&previous!==action){previous.paused=false;previous.crossFadeTo(action,wanted.includes('jump')?0.08:(actor.current?.includes('jump')?0.10:0.16),true)}
    actor.current=wanted;
  }
  if(wanted.includes('run')){action.paused=false;action.setEffectiveTimeScale(actor.runScale)}
  if(wanted.includes('jump')){
    action.paused=true;
    const clip=action.getClip?.();if(clip?.duration)action.time=clip.duration*jumpPhase(motion.vy);
  }
}

function updateActorPose(actor,motion,dt){
  const facing=motion.facing===-1?-1:1,ground=motion.ground!==false,vy=Number(motion.vy)||0;
  // Idle is neutral. Running only gets a very small athletic lean; the previous
  // positive idle tilt was visibly pitching the whole character forwards.
  const targetLean=!ground?clamp(-vy/11000,-.008,.008):(motion.moving?-facing*.012:0);
  actor.lean=damp(actor.lean,targetLean,14,dt);
  // Keep the runner essentially in profile, but open the angle a few degrees so
  // the near arm/forearm does not disappear into the torso silhouette.
  actor.root.rotation.y=facing===1?PROFILE_YAW:-PROFILE_YAW;
  actor.root.rotation.z=actor.lean;
  actor.lastGround=ground;
}

const ELBOW_AXIS=new THREE.Vector3(0,0,1),leftElbowCorrection=new THREE.Quaternion(),rightElbowCorrection=new THREE.Quaternion();
leftElbowCorrection.setFromAxisAngle(ELBOW_AXIS,.16);
rightElbowCorrection.setFromAxisAngle(ELBOW_AXIS,-.16);

function refineRunSilhouette(actor,motion){
  if(motion.ground===false||!motion.moving)return;
  // The authored Run clip already owns shoulder/upper-arm motion. We only add
  // a small symmetric elbow flex so the forearm reads clearly in side view,
  // matching the classic bent running-arm silhouette without touching shoulders.
  actor.leftFore?.quaternion.multiply(leftElbowCorrection);
  actor.rightFore?.quaternion.multiply(rightElbowCorrection);
}
function beginFrame(){mount();frame++;for(const a of actors.values())a.seen=-1}

function actor(data){
  mount();if(!ready||!renderer||!data)return false;
  const id=String(data.motion?.identity||data.name||'local'),a=actors.get(id)||makeActor(id,!!data.ghost);a.seen=frame;a.root.visible=true;
  a.root.position.x=Number(data.x)||0;a.root.position.y=WORLD_H-(Number(data.y)||0)+(a.root.userData.groundOffset||0);a.root.position.z=a.ghost?-10:0;
  const motion=data.motion||{};a._motion=motion;materialSet(a.root,data.style||{},a.ghost);
  if(a.cape){a.cape.visible=String(data.style?.accessory||'none')==='cape';a.cape.rotation.x=.08+Math.min(.42,Math.abs(Number(motion.vy)||0)/700)+Math.sin(performance.now()/170)*.035}
  chooseAction(a,motion,1/60);return true;
}

function endFrame(time){
  mount();if(!ready||!renderer)return;
  const now=Number(time)||performance.now()/1000,dt=Math.min(.05,Math.max(0,now-lastTime));lastTime=now;
  for(const a of actors.values()){
    if(a.seen!==frame){a.root.visible=false;continue}
    updateActorPose(a,a._motion||{},dt);
    // Let the GLB own the run cycle, then apply only the small elbow readability
    // correction. No shoulder animation is overridden.
    a.mixer.update(dt);
    refineRunSilhouette(a,a._motion||{});
  }
  renderer.render(scene,camera);
}

function createPreview(canvasNode){
  if(previewState?.renderer){try{previewState.renderer.dispose()}catch(_){}}
  const w=Math.max(2,Number(canvasNode.width)||720),h=Math.max(2,Number(canvasNode.height)||520),aspect=w/h;
  const r=new THREE.WebGLRenderer({canvas:canvasNode,alpha:true,antialias:true,premultipliedAlpha:true,powerPreference:'high-performance'});
  r.setPixelRatio(Math.min(devicePixelRatio||1,2));r.setSize(w,h,false);r.outputColorSpace=THREE.SRGBColorSpace;r.setClearColor(0x000000,0);
  const s=new THREE.Scene();addLights(s,true);
  const halfH=55,cam=new THREE.OrthographicCamera(-halfH*aspect,halfH*aspect,94,-16,.1,1500);cam.position.set(0,38,600);cam.lookAt(0,38,0);
  const root=prepareModel(cloneSkeleton(source));root.visible=true;root.renderOrder=2;s.add(root);
  const a=createActor(root,'preview',false);a.root.position.x=0;a.root.position.z=0;
  previewState={canvas:canvasNode,renderer:r,scene:s,camera:cam,actor:a,last:performance.now()/1000};
  return previewState;
}

function preview(canvasNode,data={}){
  if(!ready||!canvasNode)return false;
  let p=previewState;
  if(!p||p.canvas!==canvasNode)p=createPreview(canvasNode);
  const now=Number(data.time)||performance.now()/1000,dt=Math.min(.05,Math.max(0,now-p.last));p.last=now;
  const motion={ground:true,moving:true,facing:1,vx:RUN_REFERENCE_SPEED,...(data.motion||{})};
  p.actor.root.position.y=p.actor.root.userData.groundOffset||0;
  materialSet(p.actor.root,data.style||{},false);updateActorPose(p.actor,motion,dt);chooseAction(p.actor,motion,dt);
  if(p.actor.cape){p.actor.cape.visible=String(data.style?.accessory||'none')==='cape';p.actor.cape.rotation.x=.16+Math.sin(performance.now()/170)*.035}
  p.actor.mixer.update(dt);refineRunSilhouette(p.actor,motion);p.renderer.render(p.scene,p.camera);return true;
}

mount();
mark('loading');
const readyPromise=new Promise(resolve=>new GLTFLoader().load('/assets/hero-3d/eixo-hero.glb?v=20260929-v349',gltf=>{
  source=gltf.scene;clips=gltf.animations||[];ready=!!source;mark(ready?'ready':'error',ready?'':'empty model');resolve(ready);
},()=>{},error=>{mark('error',error?.message||'model load failed');console.error('EIXO JUMP 3D model failed to load',error);resolve(false)}));

window.EixoJump3D={ready:readyPromise,isReady:()=>ready,beginFrame,actor,endFrame,preview};
