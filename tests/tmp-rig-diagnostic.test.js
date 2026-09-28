'use strict';
const test=require('node:test'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');

function readGlb(){
 const glb=fs.readFileSync(path.join(root,'assets/hero-3d/eixo-hero.glb'));
 const jsonLength=glb.readUInt32LE(12),json=JSON.parse(glb.toString('utf8',20,20+jsonLength).trim());
 const binHeader=20+jsonLength,binLength=glb.readUInt32LE(binHeader),binOffset=binHeader+8;
 return {glb,json,binOffset,binLength};
}
function accessorValues(glb,json,binOffset,index){
 const a=json.accessors[index],v=json.bufferViews[a.bufferView];
 const comps={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type];
 const bytes={5126:4,5125:4,5123:2,5122:2,5121:1,5120:1}[a.componentType];
 const stride=v.byteStride||comps*bytes,start=binOffset+(v.byteOffset||0)+(a.byteOffset||0),rows=[];
 for(let i=0;i<a.count;i++){
   const off=start+i*stride,row=[];
   for(let c=0;c<comps;c++){
     const p=off+c*bytes;
     if(a.componentType===5126)row.push(glb.readFloatLE(p));
     else if(a.componentType===5125)row.push(glb.readUInt32LE(p));
     else if(a.componentType===5123)row.push(glb.readUInt16LE(p));
     else if(a.componentType===5122)row.push(glb.readInt16LE(p));
     else if(a.componentType===5121)row.push(glb.readUInt8(p));
     else row.push(glb.readInt8(p));
   }
   rows.push(row);
 }
 return rows;
}
function range(rows){
 if(!rows.length)return null;const n=rows[0].length,min=Array(n).fill(Infinity),max=Array(n).fill(-Infinity);
 for(const row of rows)for(let i=0;i<n;i++){min[i]=Math.min(min[i],row[i]);max[i]=Math.max(max[i],row[i])}
 return {min:min.map(x=>+x.toFixed(5)),max:max.map(x=>+x.toFixed(5))};
}

test('temporary rig diagnostic',()=>{
 const {glb,json,binOffset}=readGlb(),nodes=json.nodes||[],animations=json.animations||[];
 const parent=new Map();nodes.forEach((n,i)=>(n.children||[]).forEach(c=>parent.set(c,i)));
 const names=['mixamorig:LeftShoulder','mixamorig:LeftArm','mixamorig:LeftForeArm','mixamorig:RightShoulder','mixamorig:RightArm','mixamorig:RightForeArm'];
 const nodeReport=names.map(name=>{const i=nodes.findIndex(n=>n.name===name),n=nodes[i];return {i,name,parent:parent.has(i)?nodes[parent.get(i)]?.name:null,rotation:n?.rotation||null,translation:n?.translation||null}});
 console.log('EIXO_RIG_NODES '+JSON.stringify(nodeReport));
 const run=animations.find(a=>a.name==='Run');
 const report=[];
 (run?.channels||[]).forEach(ch=>{
   const nodeName=nodes[ch.target?.node]?.name;
   if(!names.includes(nodeName)||ch.target?.path!=='rotation')return;
   const sampler=run.samplers[ch.sampler],times=accessorValues(glb,json,binOffset,sampler.input).map(x=>x[0]),values=accessorValues(glb,json,binOffset,sampler.output);
   const picks=[0,Math.floor(values.length*.25),Math.floor(values.length*.5),Math.floor(values.length*.75),values.length-1].map(i=>({t:+times[i].toFixed(3),q:values[i].map(x=>+x.toFixed(5))}));
   report.push({node:nodeName,count:values.length,range:range(values),samples:picks});
 });
 console.log('EIXO_RUN_ROTATIONS '+JSON.stringify(report));
});
