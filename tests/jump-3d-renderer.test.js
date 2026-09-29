const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('JUMP mounts the continuous 3D renderer and serves its model locally',()=>{
 const html=read('index.html'),game=read('jump.js'),renderer=read('jump-3d-renderer.mjs'),css=read('jump.css'),server=read('server.js');
 assert.match(html,/type="module" src="jump-3d-renderer\.mjs/);
 assert.match(game,/EixoJump3D\?\.beginFrame/);assert.match(game,/EixoJump3D\?\.endFrame/);assert.match(game,/EixoJump3D\?\.actor/);
 assert.match(renderer,/GLTFLoader/);assert.match(renderer,/AnimationMixer/);assert.match(renderer,/crossFadeTo/);
 assert.match(renderer,/Accessory_Cape/);assert.match(renderer,/style\?\.accessory\|\|'none'/);
 assert.match(renderer,/setFromAxisAngle\(ROOT_UP_AXIS,facing===1\?PROFILE_YAW:-PROFILE_YAW\)/,'profile orientation must remain consistent in both directions');
 assert.match(renderer,/setClearColor\(0x000000,0\)/,'the 3D overlay must remain transparent over the 2D world art');
 assert.doesNotMatch(renderer,/proceduralArms|RUN_SWING_AXIS|addRunPlaneBoneRotation/,'authored GLB arm rotations must not be overwritten by a procedural layer');
 assert.match(renderer,/function jumpPhase\(vy\)/,'jump pose must be driven by vertical physics instead of a fixed playback timer');
 assert.match(renderer,/motion\.moving\?\-\.038:\-\.085/,'idle posture must counter the imported forward lean on local X');
 assert.match(renderer,/ROOT_LEAN_AXIS=new THREE\.Vector3\(1,0,0\)/,'posture correction must use the model forward-back axis');
 assert.match(renderer,/function alignBoneToWorldDirection\(bone,child,desired\)/,'arm control must target the visible world-space direction instead of guessing local rig axes');
 assert.match(renderer,/nearUpperDir\.set\(facing\*Math\.sin\(swing\),-Math\.cos\(swing\),0\)/,'near upper arm must stay mostly down while swinging front/back');
 assert.match(renderer,/nearForeDir\.set\(facing\*Math\.cos\(swing\),Math\.sin\(swing\)\*\.55,0\)/,'near forearm must form the readable forward running bend');
 assert.match(renderer,/setFromUnitVectors\(currentArmDir,desired\)/,'screen-space IK must align the actual bone chain');
 assert.match(renderer,/leftShoulder\.quaternion\.slerp/,'shoulder shrug must be damped while the arm chain drives the run');
 assert.match(css,/#jump3dCanvas/);assert.match(server,/'\.glb':'model\/gltf-binary'/);assert.match(server,/PUBLIC_STATIC_EXTS[^;]+\.mjs[^;]+\.glb/);
 assert.ok(fs.statSync(path.join(root,'vendor/three/three.module.min.js')).size>100000);
 assert.ok(fs.statSync(path.join(root,'vendor/three/three.core.min.js')).size>100000,'Three.js core dependency must ship with the module');
 assert.doesNotMatch(game,/EixoJumpExactArt\?\.runner/,'the rejected sprite runner must never return as a fallback');
});

test('the exported 3D rig has normalized transforms for browser-sized rendering',()=>{
 const glb=fs.readFileSync(path.join(root,'assets/hero-3d/eixo-hero.glb'));
 assert.equal(glb.toString('ascii',0,4),'glTF');
 const jsonLength=glb.readUInt32LE(12),json=JSON.parse(glb.toString('utf8',20,20+jsonLength).trim());
 const rig=json.nodes.find(node=>node.name==='EIXO_Rig');
 assert.ok(rig,'missing EIXO_Rig node');
 assert.deepEqual(rig.scale||[1,1,1],[1,1,1],'the FBX centimetre scale must be baked before glTF export');
 const run=(json.animations||[]).find(a=>a.name==='Run');
 assert.ok(run);
 assert.ok((json.animations||[]).some(a=>a.name==='Jump'));
 const animatedRunNodes=new Set((run.channels||[]).filter(ch=>ch.target?.path==='rotation').map(ch=>json.nodes[ch.target.node]?.name));
 for(const bone of ['mixamorig:LeftArm','mixamorig:LeftForeArm','mixamorig:RightArm','mixamorig:RightForeArm'])
  assert.ok(animatedRunNodes.has(bone),'Run clip must animate '+bone);
});
