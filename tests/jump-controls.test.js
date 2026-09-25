'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function controls(){
 const source=fs.readFileSync(path.join(__dirname,'../jump.js'),'utf8');
 const events={},buttons=['left','right','jump'].map(action=>({dataset:{jumpKey:action},events:{},addEventListener(name,fn){this.events[name]=fn},setPointerCapture(){}}));
 const context={keys:{left:false,right:false,jump:false},current:'jump',panel:null,sync(){},window:{addEventListener(name,fn){events[name]=fn}},document:{hidden:false,addEventListener(name,fn){events[name]=fn},querySelectorAll(){return buttons}}};
 vm.createContext(context);
 vm.runInContext(source.slice(source.indexOf('const controlSources='),source.indexOf('const flags='))+'\nbindControls();',context);
 const key=(code,type='keydown',target)=>events[type]({code,type,target,preventDefault(){},stopImmediatePropagation(){}});
 const pointer=(action,type,id)=>buttons.find(b=>b.dataset.jumpKey===action).events[type]({pointerId:id,button:0,preventDefault(){}});
 return {context,events,key,pointer};
}
test('all supported keyboard controls press and release their action',()=>{
 for(const [code,action] of Object.entries({KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',KeyW:'jump',Space:'jump',ArrowUp:'jump'})){
  const {context:c,key}=controls();key(code);assert.equal(c.keys[action],true,code);key(code,'keyup');assert.equal(c.keys[action],false,code);
 }
});
test('releasing one keyboard alias preserves the other held key',()=>{
 const {context:c,key}=controls();key('KeyA');key('ArrowLeft');key('KeyA','keyup');assert.equal(c.keys.left,true);key('ArrowLeft','keyup');assert.equal(c.keys.left,false);
});
test('touch and keyboard sources stay independent, including two fingers',()=>{
 const {context:c,key,pointer}=controls();key('Space');pointer('jump','pointerdown',1);pointer('jump','pointerdown',2);key('Space','keyup');pointer('jump','pointerup',1);assert.equal(c.keys.jump,true);pointer('jump','pointercancel',2);assert.equal(c.keys.jump,false);
});
test('keyup releases movement after focus moves into a form or modal',()=>{
 const {context:c,key}=controls();key('KeyD');c.panel={};key('KeyD','keyup',{closest:()=>true});assert.equal(c.keys.right,false);
});
test('blur, hidden document and form focus clear every input source',()=>{
 for(const event of ['blur','visibilitychange','focusin']){
  const {context:c,key,pointer,events}=controls();key('KeyA');pointer('jump','pointerdown',3);c.document.hidden=true;events[event]({target:{closest:()=>true}});assert.equal(c.keys.left,false);assert.equal(c.keys.jump,false);key('ArrowLeft');key('ArrowLeft','keyup');assert.equal(c.keys.left,false);
 }
});
test('lost pointer capture releases only its own source',()=>{
 const {context:c,key,pointer}=controls();key('KeyD');pointer('right','pointerdown',4);pointer('right','lostpointercapture',4);assert.equal(c.keys.right,true);key('KeyD','keyup');assert.equal(c.keys.right,false);
});
