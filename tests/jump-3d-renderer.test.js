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
 assert.doesNotMatch(renderer,/alignBoneToWorldDirection|nearUpperDir|nearForeDir|leftShoulder|rightShoulder|leftFore|rightFore/,'the rebuilt GLB must own the complete running arm animation');
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

 const binHeader=20+jsonLength,binOffset=binHeader+8;
 function rotationRows(name){
  const node=json.nodes.findIndex(n=>n.name===name);
  const ch=run.channels.find(c=>c.target?.node===node&&c.target?.path==='rotation');
  assert.ok(ch,'missing rotation channel '+name);
  const acc=json.accessors[run.samplers[ch.sampler].output],view=json.bufferViews[acc.bufferView];
  const start=binOffset+(view.byteOffset||0)+(acc.byteOffset||0),stride=view.byteStride||16,rows=[];
  for(let i=0;i<acc.count;i++)rows.push([0,1,2,3].map(c=>glb.readFloatLE(start+i*stride+c*4)));
  return rows;
 }
 function variation(rows){
  const first=rows[0];let max=0;
  for(const row of rows)max=Math.max(max,Math.hypot(...row.map((v,i)=>v-first[i])));
  return max;
 }
 assert.ok(variation(rotationRows('mixamorig:LeftShoulder'))<1e-5,'Run left shoulder should no longer shrug');
 assert.ok(variation(rotationRows('mixamorig:RightShoulder'))<1e-5,'Run right shoulder should no longer shrug');
 assert.ok(variation(rotationRows('mixamorig:LeftArm'))>.15,'Run left upper-arm swing must be clearly visible');
 assert.ok(variation(rotationRows('mixamorig:RightArm'))>.15,'Run right upper-arm swing must be clearly visible');
});
