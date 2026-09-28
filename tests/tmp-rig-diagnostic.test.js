'use strict';
const test=require('node:test'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');

function readGlbJson(){
 const glb=fs.readFileSync(path.join(root,'assets/hero-3d/eixo-hero.glb'));
 const jsonLength=glb.readUInt32LE(12);
 return JSON.parse(glb.toString('utf8',20,20+jsonLength).trim());
}

test('temporary rig diagnostic',()=>{
 const json=readGlbJson(),nodes=json.nodes||[],animations=json.animations||[];
 const parent=new Map();
 nodes.forEach((n,i)=>(n.children||[]).forEach(c=>parent.set(c,i)));
 const interesting=/arm|shoulder|clav|collar|hand|wrist|elbow|spine|chest/i;
 const report=nodes.map((n,i)=>({
   i,name:n.name||'',parent:parent.has(i)?nodes[parent.get(i)]?.name||parent.get(i):null,
   children:(n.children||[]).map(c=>nodes[c]?.name||c),
   rotation:n.rotation||null,translation:n.translation||null
 })).filter(x=>interesting.test(x.name));
 console.log('EIXO_RIG_NODES '+JSON.stringify(report));
 const animReport=animations.map((a,ai)=>({
   animation:a.name||String(ai),
   channels:(a.channels||[]).map(ch=>({
      node:nodes[ch.target?.node]?.name||ch.target?.node,
      path:ch.target?.path
   })).filter(x=>interesting.test(String(x.node)))
 }));
 console.log('EIXO_RIG_ANIM '+JSON.stringify(animReport));
});
