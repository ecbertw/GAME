'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('JUMP exposes Astral while retaining dormant artwork for retired realms',()=>{
 const worlds=read('jump-worlds.js'),client=read('jump.js');
 const server=require('../jump-server');
 assert.deepEqual(server.BIOMES,['astral']);
 for(const biome of ['forest','city','snow','astral'])assert.ok(fs.existsSync(path.join(root,'assets/game-v300/jump-'+biome+'.webp')));
 assert.match(client,/const ACTIVE_BIOME='astral'/);assert.doesNotMatch(client,/BIOMES\[Math\.floor|FOREST · ONLINE/);
 assert.match(worlds,/astral:\{top:/);
 assert.match(worlds,/version:'sky-gardens-v3'/);assert.match(worlds,/EixoJumpExactArt\?\.background/);
});
test('platform visuals stay separate from deterministic collision geometry',()=>{
 const worlds=read('jump-worlds.js'),renderer=read('jump-exact-renderer.js'),physics=read('jump-physics.js');
 assert.match(worlds,/EixoJumpExactArt\?\.platform/);assert.match(renderer,/End caps retain their shape/);
 assert.match(physics,/function platformX/);assert.doesNotMatch(physics,/drawImage|fillRect/);
});
