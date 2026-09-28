import * as THREE from './vendor/three/three.module.min.js';
import {GLTFLoader} from './vendor/three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from './vendor/three/addons/utils/SkeletonUtils.js';

const WORLD_W=960,WORLD_H=540,MODEL_HEIGHT=82;
const actors=new Map();
let renderer,scene,camera,canvas,source,clips=[],ready=false,frame=0,lastTime=performance.now()/1000;
function mark(state,detail=''){
  const node=document.getElementById('jump3dCanvas');if(!node)return;
  node.dataset.rendererState=state;if(detail)node.dataset.rendererDetail=String(detail).slice(0,160);else delete node.dataset.rendererDetail;
}

function colour(value,fallback){
  if(value==='rainbow')return new THREE.Color().setHSL((performance.now()/9000)%1,.82,.58);
  try{return new THREE.Color(value||fallback)}catch(_){return new THREE.Color(fallback)}
}
function mount(){
  const root=document.getElementById('jumpRoot'),base=document.getElementById('jumpCanvas');
  if(!root||!base||canvas)return;
  canvas=document.getElementById('jump3dCanvas');
  if(!canvas){canvas=document.createElement('canvas');canvas.id='jump3dCanvas';canvas.setAttribute('aria-hidden','true');base.after(canvas)}
  mark('mounted');
  renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,premultipliedAlpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setSize(WORLD_W,WORLD_H,false);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene=new THREE.Scene();camera=new THREE.OrthographicCamera(0,WORLD_W,WORLD_H,0,.1,2000);camera.position.set(0,0,800);camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight(0xcbe5ff,0x182039,2.25));
  const key=new THREE.DirectionalLight(0xfff2dc,3.1);key.position.set(-180,360,500);key.castShadow=true;scene.add(key);
  const rim=new THREE.DirectionalLight(0x70cfff,1.7);rim.position.set(240,120,260);scene.add(rim);
}
function prepareModel(model){
  const box=new THREE.Box3().setFromObject(model),size=new THREE.Vector3();box.getSize(size);
  const scale=MODEL_HEIGHT/Math.max(.001,size.y);model.scale.setScalar(scale);
  const scaled=new THREE.Box3().setFromObject(model);model.userData.groundOffset=-scaled.min.y;model.position.y=model.userData.groundOffset;
  if(canvas){canvas.dataset.sourceBounds=[size.x,size.y,size.z].map(v=>v.toFixed(5)).join(',');canvas.dataset.modelScale=scale.toFixed(4);canvas.dataset.scaledBounds=[scaled.min.y,scaled.max.y].map(v=>v.toFixed(2)).join(',')}
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false}});
  return model;
}
function materialSet(root,style){
  const palette={hair:colour(style.hair,'#17243d'),jacket:colour(style.top,'#f3eee4'),pants:colour(style.pants,'#263c5c'),boots:colour(style.shoes,'#76503c'),accent:colour(style.accent,'#19bfe8')};
  root.traverse(o=>{if(!o.isMesh)return;if(!o.userData.materialCloned){o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();o.userData.materialCloned=true}
    const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){const n=(m.name||o.name||'').toLowerCase();if(n.includes('hair'))m.color.copy(palette.hair);else if(n.includes('jacket')||n.includes('shirt')||n.includes('top'))m.color.copy(palette.jacket);else if(n.includes('pant'))m.color.copy(palette.pants);else if(n.includes('boot')||n.includes('shoe'))m.color.copy(palette.boots);else if(n.includes('accent')||n.includes('orbit')){m.color.copy(palette.accent);if('emissive' in m)m.emissive.copy(palette.accent).multiplyScalar(.35)}}});
}
function makeActor(id,ghost){
  const root=prepareModel(cloneSkeleton(source));root.visible=false;root.renderOrder=ghost?1:2;scene.add(root);
  const mixer=new THREE.AnimationMixer(root),actions={};for(const clip of clips){const key=(clip.name||'').toLowerCase();actions[key]=mixer.clipAction(clip)}
  const actor={id,root,mixer,actions,cape:root.getObjectByName('Accessory_Cape'),current:null,seen:frame,ghost};actors.set(id,actor);return actor;
}
function chooseAction(actor,motion){
  const names=Object.keys(actor.actions),pick=part=>names.find(n=>n.includes(part));
  const airborne=motion.ground===false||Math.abs(Number(motion.vy)||0)>12,wanted=airborne?pick('jump'):(motion.moving?pick('run'):(pick('idle')||pick('run')));
  if(!wanted||actor.current===wanted)return;const next=actor.actions[wanted];next.reset().enabled=true;next.setEffectiveWeight(1);next.setLoop(airborne?THREE.LoopOnce:THREE.LoopRepeat,airborne?1:Infinity);next.clampWhenFinished=airborne;
  if(actor.current)actor.actions[actor.current]?.crossFadeTo(next,.16,true);next.play();actor.current=wanted;
}
function beginFrame(){mount();frame++;for(const a of actors.values())a.seen=-1}
function actor(data){
  mount();if(!ready||!renderer||!data)return false;const id=String(data.motion?.identity||data.name||'local'),a=actors.get(id)||makeActor(id,!!data.ghost);a.seen=frame;a.root.visible=true;
  const facing=data.motion?.facing===-1?-1:1;a.root.position.x=Number(data.x)||0;a.root.position.y=WORLD_H-(Number(data.y)||0)+(a.root.userData.groundOffset||0);a.root.position.z=a.ghost?-10:0;
  const sx=Math.abs(a.root.scale.x);a.root.scale.x=sx*facing;materialSet(a.root,data.style||{});
  if(a.cape){a.cape.visible=String(data.style?.accessory||'none')==='cape';a.cape.rotation.x=.08+Math.min(.42,Math.abs(Number(data.motion?.vy)||0)/700)+Math.sin(performance.now()/170)*.035}
  chooseAction(a,data.motion||{});return true;
}
function endFrame(time){
  mount();if(!ready||!renderer)return;const now=Number(time)||performance.now()/1000,dt=Math.min(.05,Math.max(0,now-lastTime));lastTime=now;
  for(const [id,a] of actors){if(a.seen!==frame){a.root.visible=false}else a.mixer.update(dt)}renderer.render(scene,camera);
}
mount();
mark('loading');
const readyPromise=new Promise(resolve=>new GLTFLoader().load('/assets/hero-3d/eixo-hero.glb?v=20260928-v332',gltf=>{source=gltf.scene;clips=gltf.animations||[];ready=!!source;mark(ready?'ready':'error',ready?'':'empty model');resolve(ready)},()=>{},error=>{mark('error',error?.message||'model load failed');console.error('EIXO JUMP 3D model failed to load',error);resolve(false)}));
window.EixoJump3D={ready:readyPromise,isReady:()=>ready,beginFrame,actor,endFrame};
