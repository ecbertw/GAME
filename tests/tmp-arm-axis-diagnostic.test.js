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
const qmul=(a,b)=>[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];
const qaxis=(axis,ang)=>{const s=Math.sin(ang/2);return[axis[0]*s,axis[1]*s,axis[2]*s,Math.cos(ang/2)]};
const qrot=(q,v)=>{const p=[...v,0],qi=[-q[0],-q[1],-q[2],q[3]],r=qmul(qmul(q,p),qi);return r.slice(0,3)};
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const round=v=>v.map(x=>+x.toFixed(5));
const profile=v=>[v[2],v[1],-v[0]]; // +90deg Y profile: screen x≈model z, screen y=model y

test('temporary arm-axis diagnostic',()=>{
 const {glb,json,binOffset}=readGlb(),nodes=json.nodes||[],run=(json.animations||[]).find(a=>a.name==='Run');
 const parent=new Map();nodes.forEach((n,i)=>(n.children||[]).forEach(c=>parent.set(c,i)));
 const tracks=new Map();
 for(const ch of run.channels||[]){const sm=run.samplers[ch.sampler];tracks.set(ch.target.node+':'+ch.target.path,{values:accessorValues(glb,json,binOffset,sm.output)})}
 const frame=10;
 const ids={LA:nodes.findIndex(n=>n.name==='mixamorig:LeftArm'),LF:nodes.findIndex(n=>n.name==='mixamorig:LeftForeArm'),LH:nodes.findIndex(n=>n.name==='mixamorig:LeftHand'),RA:nodes.findIndex(n=>n.name==='mixamorig:RightArm'),RF:nodes.findIndex(n=>n.name==='mixamorig:RightForeArm'),RH:nodes.findIndex(n=>n.name==='mixamorig:RightHand')};
 const baseRot=i=>(tracks.get(i+':rotation')?.values[frame]||nodes[i].rotation||[0,0,0,1]);
 const baseTr=i=>(tracks.get(i+':translation')?.values[frame]||nodes[i].translation||[0,0,0]);
 function worlds(overrides={}){
  const memo=new Map();
  function calc(i){
   if(memo.has(i))return memo.get(i);
   let q=overrides[i]||baseRot(i),pos=baseTr(i);
   if(parent.has(i)){const p=calc(parent.get(i));pos=add(p.pos,qrot(p.q,pos));q=qmul(p.q,q)}
   const out={q,pos};memo.set(i,out);return out;
  }
  return calc;
 }
 const axes={X:[1,0,0],Y:[0,1,0],Z:[0,0,1]},angle=.45,report={};
 for(const side of ['L','R']){
  const arm=ids[side+'A'],fore=ids[side+'F'],hand=ids[side+'H'];
  const W0=worlds(),p0=profile(W0(hand).pos);
  report[side]={baseHand:round(p0),arm:{},fore:{}};
  for(const [axisName,axis] of Object.entries(axes)){
    const qa=qmul(baseRot(arm),qaxis(axis,angle)),Wa=worlds({[arm]:qa}),pa=profile(Wa(hand).pos);
    const qf=qmul(baseRot(fore),qaxis(axis,side==='L'?angle:-angle)),Wf=worlds({[fore]:qf}),pf=profile(Wf(hand).pos);
    report[side].arm[axisName]=round(sub(pa,p0));
    report[side].fore[axisName]=round(sub(pf,p0));
  }
 }
 console.log('EIXO_ARM_AXIS_EFFECT '+JSON.stringify(report));
});