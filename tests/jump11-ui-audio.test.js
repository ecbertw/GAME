'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');

test('JUMP exposes distinct biome music and jump landing loss effects',()=>{
 const audio=fs.readFileSync(path.join(root,'audio-fix.js'),'utf8');
 for(const name of ['city','forest','snow'])assert.match(audio,new RegExp(name+':\\{interval:'),name+' needs its own music theme');
 for(const fn of ['jumpJump','jumpLand','jumpLose','jumpBiome','jumpStop'])assert.match(audio,new RegExp('function '+fn+'\\('));
 assert.match(audio,/window\.EixoAudio=\{[^}]*jumpJump[^}]*jumpLand[^}]*jumpLose[^}]*jumpBiome[^}]*jumpStop/s);
});

test('JUMP worlds use the four modular sky realm identities',()=>{
 const worlds=fs.readFileSync(path.join(root,'jump-worlds.js'),'utf8');
 assert.match(worlds,/EixoJumpExactArt\?\.background/);
 for(const name of ['city','forest','snow','astral'])assert.match(worlds,new RegExp(name+':\\{top:'));
 assert.match(worlds,/version:'sky-gardens-v3'/);
});
test('JUMP customizer is wide, clips no horizontal content and retired team CSS is gone',()=>{
 const css=fs.readFileSync(path.join(root,'jump.css'),'utf8');
 assert.match(css,/width:min\(760px,calc\(100vw - 28px\)\)/);
 assert.match(css,/overflow-x:hidden/);
 assert.doesNotMatch(css,/jump-team|jumpTeam|jumpDuo|jumpTrio/);
 const colors=fs.readFileSync(path.join(root,'color-options.js'),'utf8');
 assert.match(colors,/jumpOutfit=select\.matches/);
 assert.match(colors,/jumpOutfit\?'#f4f5f6':color/);
});
