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
});
