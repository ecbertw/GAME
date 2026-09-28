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
 assert.ok((json.animations||[]).some(a=>a.name==='Run'));
 assert.ok((json.animations||[]).some(a=>a.name==='Jump'));
});
