'use strict';
// one-shot trigger: source-animation-v1
const fs=require('fs'),crypto=require('crypto');
const file='assets/hero-3d/eixo-hero.glb';
const buf=fs.readFileSync(file);
const gitSha=crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+buf.length+'\0'),buf])).digest('hex');
if(gitSha!=='82ec815f6c01b6d19bb598050920df1afdf372b9')throw new Error('Unexpected hero GLB source: '+gitSha);

const jsonLen=buf.readUInt32LE(12),json=JSON.parse(buf.toString('utf8',20,20+jsonLen).trim());
const binHeader=20+jsonLen,binOffset=binHeader+8;
const nodes=json.nodes||[],run=(json.animations||[]).find(a=>a.name==='Run');
if(!run)throw new Error('Run animation missing');

const comps={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
function accInfo(index){
 const a=json.accessors[index],v=json.bufferViews[a.bufferView];
 if(a.componentType!==5126)throw new Error('Expected FLOAT accessor '+index);
 return {a,v,start:binOffset+(v.byteOffset||0)+(a.byteOffset||0),stride:v.byteStride||comps[a.type]*4,n:comps[a.type]};
}
function readRows(index){
 const x=accInfo(index),rows=[];
 for(let i=0;i<x.a.count;i++){const row=[];for(let c=0;c<x.n;c++)row.push(buf.readFloatLE(x.start+i*x.stride+c*4));rows.push(row)}
 return rows;
}
function writeRows(index,rows){
 const x=accInfo(index);
 if(rows.length!==x.a.count)throw new Error('Accessor count mismatch '+index);
 rows.forEach((row,i)=>row.forEach((v,c)=>buf.writeFloatLE(v,x.start+i*x.stride+c*4)));
}
const norm=q=>{const l=Math.hypot(...q)||1;return q.map(v=>v/l)};
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const neg=q=>q.map(v=>-v);
const mul=(a,b)=>norm([
 a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],
 a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],
 a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],
 a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]
]);
const inv=q=>[-q[0],-q[1],-q[2],q[3]];
function avgQuat(rows){
 const ref=norm(rows[0]),sum=[0,0,0,0];
 for(let q of rows){q=norm(q);if(dot(q,ref)<0)q=neg(q);for(let i=0;i<4;i++)sum[i]+=q[i]}
 return norm(sum);
}
function powQuat(q,factor){
 q=norm(q);if(q[3]<0)q=neg(q);
 const w=Math.max(-1,Math.min(1,q[3])),half=Math.acos(w),s=Math.sin(half);
 if(Math.abs(s)<1e-7)return [0,0,0,1];
 const axis=[q[0]/s,q[1]/s,q[2]/s],nh=half*factor,ns=Math.sin(nh);
 return norm([axis[0]*ns,axis[1]*ns,axis[2]*ns,Math.cos(nh)]);
}
function axisZ(angle){const h=angle/2;return[0,0,Math.sin(h),Math.cos(h)]}
function channel(name){
 const node=nodes.findIndex(n=>n.name===name);
 const ch=(run.channels||[]).find(c=>c.target?.node===node&&c.target?.path==='rotation');
 if(!ch)throw new Error('Missing Run rotation channel '+name);
 return {node,ch,sampler:run.samplers[ch.sampler]};
}
function patchShoulder(name){
 const c=channel(name),rows=readRows(c.sampler.output),base=avgQuat(rows);
 writeRows(c.sampler.output,rows.map(()=>base));
 console.log(name,'frozen at',base.map(v=>v.toFixed(4)).join(','));
}
function patchArm(name){
 const c=channel(name),rows=readRows(c.sampler.output),base=avgQuat(rows),baseInv=inv(base);
 const out=rows.map(q=>{
   let qq=norm(q);if(dot(qq,base)<0)qq=neg(qq);
   const delta=mul(baseInv,qq);
   return mul(base,powQuat(delta,1.85));
 });
 writeRows(c.sampler.output,out);
 console.log(name,'swing amplified x1.85');
}
function patchFore(name,sign){
 const c=channel(name),rows=readRows(c.sampler.output),base=avgQuat(rows),baseInv=inv(base);
 const out=rows.map(q=>{
   let qq=norm(q);if(dot(qq,base)<0)qq=neg(qq);
   const delta=powQuat(mul(baseInv,qq),0.42);
   return mul(mul(base,delta),axisZ(sign*0.24));
 });
 writeRows(c.sampler.output,out);
 console.log(name,'elbow stabilized + flexed',sign>0?'+Z':'-Z');
}

patchShoulder('mixamorig:LeftShoulder');
patchShoulder('mixamorig:RightShoulder');
patchArm('mixamorig:LeftArm');
patchArm('mixamorig:RightArm');
patchFore('mixamorig:LeftForeArm',1);
patchFore('mixamorig:RightForeArm',-1);

fs.writeFileSync(file,buf);
const after=crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+buf.length+'\0'),buf])).digest('hex');
console.log('Patched GLB git blob',gitSha,'->',after);
if(after===gitSha)throw new Error('GLB did not change');
