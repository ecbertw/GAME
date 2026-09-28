'use strict';
const test=require('node:test'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');

function readGlb(){
 const glb=fs.readFileSync(path.join(root,'assets/hero-3d/eixo-hero.glb'));
 const jsonLength=glb.readUInt32LE(12),json=JSON.parse(glb.toString('utf8',20,20+jsonLength).trim());
 const binHeader=20+jsonLength,binOffset=binHeader+8;
 return {glb,json,binOffset};
}
function accessorValues(glb,json,binOffset,index){
 const a=json.accessors[index],v=json.bufferViews[a.bufferView],comps={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type],bytes={5126:4,5125:4,5123:2,5122:2,5121:1,5120:1}[a.componentType];
 const stride=v.byteStride||comps*bytes,start=binOffset+(v.byteOffset||0)+(a.byteOffset||0),rows=[];
 for(let i=0;i<a.count;i++){const off=start+i*stride,row=[];for(let c=0;c<comps;c++){const p=off+c*bytes;row.push(a.componentType===5126?glb.readFloatLE(p):0)}rows.push(row)}
 return rows;
}
function qmul(a,b){return[
 a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],
 a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],
 a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],
 a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]
]}
function qrot(q,v){const p=[v[0],v[1],v[2],0],qi=[-q[0],-q[1],-q[2],q[3]],r=qmul(qmul(q,p),qi);return r.slice(0,3)}
function add(a,b){return[a[0]+b[0],a[1]+b[1],a[2]+b[2]]}
function round(v){return v.map(x=>+x.toFixed(5))}
function y90(v){return [v[2],v[1],-v[0]]}

test('temporary rig diagnostic',()=>{
 const {glb,json,binOffset}=readGlb(),nodes=json.nodes||[],run=(json.animations||[]).find(a=>a.name==='Run');
 const parent=new Map();nodes.forEach((n,i)=>(n.children||[]).forEach(c=>parent.set(c,i)));
 const tracks=new Map();
 for(const ch of run.channels||[]){
   const sampler=run.samplers[ch.sampler],times=accessorValues(glb,json,binOffset,sampler.input).map(x=>x[0]),values=accessorValues(glb,json,binOffset,sampler.output);
   tracks.set(ch.target.node+':'+ch.target.path,{times,values});
 }
 function sampleTrack(node,path,frame,def){const t=tracks.get(node+':'+path);return t?t.values[Math.min(frame,t.values.length-1)]:def}
 function world(frame){
   const memo=new Map();
   function calc(i){
     if(memo.has(i))return memo.get(i);
     const n=nodes[i],q=sampleTrack(i,'rotation',frame,n.rotation||[0,0,0,1]),tr=sampleTrack(i,'translation',frame,n.translation||[0,0,0]);
     let out={q,pos:tr};
     if(parent.has(i)){const p=calc(parent.get(i));out={q:qmul(p.q,q),pos:add(p.pos,qrot(p.q,tr))}}
     memo.set(i,out);return out;
   }
   return calc;
 }
 const ids={LS:nodes.findIndex(n=>n.name==='mixamorig:LeftShoulder'),LA:nodes.findIndex(n=>n.name==='mixamorig:LeftArm'),LF:nodes.findIndex(n=>n.name==='mixamorig:LeftForeArm'),LH:nodes.findIndex(n=>n.name==='mixamorig:LeftHand'),RS:nodes.findIndex(n=>n.name==='mixamorig:RightShoulder'),RA:nodes.findIndex(n=>n.name==='mixamorig:RightArm'),RF:nodes.findIndex(n=>n.name==='mixamorig:RightForeArm'),RH:nodes.findIndex(n=>n.name==='mixamorig:RightHand')};
 const count=tracks.get(ids.LA+':rotation').values.length,frames=[0,Math.floor(count*.25),Math.floor(count*.5),Math.floor(count*.75),count-1];
 const report=frames.map(frame=>{const W=world(frame),one={frame};for(const [k,i] of Object.entries(ids)){one[k]=round(y90(W(i).pos))}return one});
 console.log('EIXO_RUN_WORLD_POS '+JSON.stringify(report));
});
