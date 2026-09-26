'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('ranking translations settle without an observer loop and react to language changes',()=>{
 let mutations=0,callback,language='pt';
 const rows=Object.fromEntries(['.empty-row','.empty-full','.loading-row'].map(key=>{let text='';return[key,{get textContent(){return text},set textContent(v){text=v;mutations++}}]}));
 const context={window:{eixoT:key=>language+':'+key},document:{documentElement:{},querySelectorAll:key=>[rows[key]]},MutationObserver:class{constructor(fn){callback=fn}observe(){}}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../ranking-i18n-fix.js'),'utf8'),context);
 assert.equal(mutations,3);for(let i=0;i<10;i++)callback();assert.equal(mutations,3,'unchanged copy must not create new child mutations');
 language='en';callback();assert.equal(mutations,6);callback();assert.equal(mutations,6);assert.equal(rows['.empty-row'].textContent,'en:emptyRanking');
});
