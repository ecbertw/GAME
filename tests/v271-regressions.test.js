'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const auth=require('../auth-server');

test('new passwords need six characters and an uppercase letter',()=>{
 assert.equal(auth.validPassword('Abc123'),true);
 assert.equal(auth.validPassword('Ábc123'),true);
 assert.equal(auth.validPassword('abc123'),false);
 assert.equal(auth.validPassword('Abc12'),false);
 const html=read('index.html');assert.match(html,/minlength="6"/);assert.match(html,/pattern="\(\?=\.\*\[A-Z\]\)\.\{6,128\}"/);
});

test('pixel claim menu has a translated close control',()=>{
 const js=read('background-claims.js');assert.match(js,/pt:\{close:'FECHAR'/);assert.match(js,/data-claim-close/);assert.match(js,/hideMenu\(\);return/);
});

test('wardrobe preview keeps the full runner inside its canvas',()=>{
 const js=read('jump.js');assert.match(js,/translate\(90,112\);c\.scale\(2\.1,2\.1\)/);
});

test('online peers use velocity-assisted snapshot smoothing',()=>{
 const js=read('jump.js');assert.match(js,/velocityX/);assert.match(js,/snapshotAt/);assert.match(js,/Math\.exp\(-18/);assert.match(js,/motion:local\?/);
 const server=read('jump-server.js');assert.match(server,/sort\(\(a,b\)=>b\.players\.size-a\.players\.size\|\|a\.epoch-b\.epoch\)/);assert.match(server,/run\.motion=/);assert.match(server,/ground:motion\?motion\.ground/);
});
