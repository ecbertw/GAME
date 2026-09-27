'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),R=require('../jump-rig'),service=require('../jump-server');
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
test('both legs complete the same cycle half a stride apart, with constant bone lengths',()=>{
 let min=[Infinity,Infinity],max=[-Infinity,-Infinity];
 for(let frame=0;frame<1000;frame++){
  const p=R.pose({},frame/1000,{speed:1,ground:true},1/60,true);
  for(let i=0;i<2;i++){const l=p.legs[i];min[i]=Math.min(min[i],l.sole.x);max[i]=Math.max(max[i],l.sole.x);assert.ok(Math.abs(distance(l.hip,l.knee)-15)<1e-8);assert.ok(Math.abs(distance(l.knee,l.ankle)-14)<1e-8);assert.ok(l.sole.y<=0);}
  const shifted=R.target(frame/1000+.5,{speed:1}).legs[0].sole;assert.ok(distance(p.legs[1].sole,shifted)<1e-8);
 }for(let i=0;i<2;i++)assert.ok(max[i]-min[i]>33,'both feet must travel');
});
test('support foot cancels world motion instead of sliding along the platform',()=>{
 for(let u=.02;u<.28;u+=.01){const a=R.foot(u),b=R.foot(u+.001);assert.ok(a.contact&&b.contact);assert.ok(Math.abs((b.x-a.x)+112*.001)<1e-8);}
});
test('jump apex has no velocity-triggered pose replacement and both feet stay present',()=>{
 const s={};let before;
 for(let vy=420;vy>=-420;vy-=7){const p=R.pose(s,.25,{ground:false,vy,speed:1},1/60);assert.equal(p.legs.length,2);for(let i=0;i<2;i++){const l=p.legs[i];assert.ok(Number.isFinite(l.ankle.x));assert.ok(Math.abs(distance(l.hip,l.knee)-15)<1e-8);assert.ok(Math.abs(distance(l.knee,l.ankle)-14)<1e-8);if(before)assert.ok(distance(l.sole,before.legs[i].sole)<1);}before=p;}
});
test('wardrobe exposes complete original defaults without sharing mutable server state',()=>{
 const first=service.wardrobeFor({vipLevel:0}),second=service.wardrobeFor({vipLevel:6});assert.deepEqual(first.defaults,service.DEFAULTS);for(const [key,value] of Object.entries(first.defaults))assert.ok(first.parts[key].some(o=>o.value===value&&o.minVip===0));first.defaults.hair='changed';assert.equal(second.defaults.hair,service.DEFAULTS.hair);
});
