'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('JUMP V3 exposes four connected modern pixel realms',()=>{
 const worlds=read('jump-worlds.js'),server=read('jump-server.js');
 for(const biome of ['forest','city','snow','astral']){assert.match(worlds,new RegExp(biome+':\\{top:'));assert.match(server,new RegExp("'"+biome+"'"));}
 assert.match(worlds,/version:'sky-gardens-v3'/);assert.match(worlds,/EixoJumpExactArt\?\.background/);
});
test('platform visuals stay separate from deterministic collision geometry',()=>{
 const worlds=read('jump-worlds.js'),renderer=read('jump-exact-renderer.js'),physics=read('jump-physics.js');
 assert.match(worlds,/EixoJumpExactArt\?\.platform/);assert.match(renderer,/End caps retain their shape/);
 assert.match(physics,/function platformX/);assert.doesNotMatch(physics,/drawImage|fillRect/);
});
