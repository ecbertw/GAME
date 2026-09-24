/* JUMP15 premium-art decoder. Packed assets are deliberately tiny JS payloads so deploy remains atomic. */
(function(root){
'use strict';
const state={backgrounds:{},ready:false};
const bytes=b64=>Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
async function inflate(b64){
 const ds=new DecompressionStream('deflate');
 const stream=new Blob([bytes(b64)]).stream().pipeThrough(ds);
 return new Uint8Array(await new Response(stream).arrayBuffer());
}
function imageCanvas(w,h,rgba){
 const cv=document.createElement('canvas');cv.width=w;cv.height=h;
 const c=cv.getContext('2d',{alpha:false});c.imageSmoothingEnabled=false;
 c.putImageData(new ImageData(new Uint8ClampedArray(rgba.buffer,rgba.byteOffset,rgba.byteLength),w,h),0,0);
 return cv;
}
async function decodeBackground(o){
 const idx=await inflate(o.z),rgba=new Uint8ClampedArray(o.w*o.h*4);
 for(let i=0;i<idx.length;i++){
  const p=idx[i]*3,j=i*4;
  rgba[j]=o.p[p]||0;rgba[j+1]=o.p[p+1]||0;rgba[j+2]=o.p[p+2]||0;rgba[j+3]=255;
 }
 return imageCanvas(o.w,o.h,rgba);
}
async function init(){
 const packed=root.EixoJumpArtPacked||{};
 await Promise.all(Object.entries(packed.backgrounds||{}).map(async([name,o])=>{state.backgrounds[name]=await decodeBackground(o)}));
 state.ready=true;
}
const ready=init().catch(e=>{console.warn('JUMP15 premium art fallback:',e);state.ready=false});
root.EixoJumpPremiumArt={
 version:'jump15',
 ready,
 isReady:()=>state.ready,
 background:name=>state.backgrounds[name]||null,
 drawBackground(c,name,W,H,cam=0,time=0){
  const img=state.backgrounds[name];if(!img)return false;
  const aspect=W/H,srcAspect=img.width/img.height;
  let sx=0,sy=0,sw=img.width,sh=img.height;
  if(srcAspect<aspect){sh=img.width/aspect;sy=(img.height-sh)/2}
  else{sw=img.height*aspect;sx=(img.width-sw)/2}
  // Camera creates a very small cinematic drift without stretching the generated art.
  sx=Math.max(0,Math.min(img.width-sw,sx+Math.sin((cam||0)*.0015)*Math.min(2,img.width-sw)));
  c.save();c.imageSmoothingEnabled=false;c.drawImage(img,sx,sy,sw,sh,0,0,W,H);
  const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'rgba(3,8,18,.03)');g.addColorStop(.65,'rgba(3,8,18,.02)');g.addColorStop(1,'rgba(2,7,14,.25)');c.fillStyle=g;c.fillRect(0,0,W,H);
  c.restore();return true;
 }
};
})(window);