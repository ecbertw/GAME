/* JUMP 15 visual pack decoder. Generated art stays compressed in tiny JS payloads. */
(function(){
'use strict';
const packed=window.EixoJumpArtPacked||{backgrounds:{},runner:{}};
const art={backgrounds:{},runner:null,ready:null,error:null};
function bytes64(s){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
async function inflate(s){
 const raw=bytes64(s);
 if(!window.DecompressionStream)throw new Error('DecompressionStream unavailable');
 const stream=new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate'));
 return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function decodeBackground(key,src){
 const idx=await inflate(src.z),canvas=document.createElement('canvas');canvas.width=src.w;canvas.height=src.h;
 const c=canvas.getContext('2d'),img=c.createImageData(src.w,src.h),p=src.p;
 for(let i=0,j=0;i<idx.length&&j<img.data.length;i++,j+=4){const k=idx[i]*3;img.data[j]=p[k]||0;img.data[j+1]=p[k+1]||0;img.data[j+2]=p[k+2]||0;img.data[j+3]=255}
 c.putImageData(img,0,0);art.backgrounds[key]=canvas;return canvas;
}
async function decodeRunner(src){
 const [rgba,mask]=await Promise.all([inflate(src.rgba),inflate(src.mask)]);
 if(rgba.length!==src.w*src.h*4||mask.length!==src.w*src.h)throw new Error('Invalid runner atlas');
 art.runner={w:src.w,h:src.h,cellW:src.w/3,cellH:src.h/2,rgba,mask,cache:new Map()};return art.runner;
}
art.ready=(async()=>{
 try{
  const jobs=Object.entries(packed.backgrounds||{}).map(([k,v])=>decodeBackground(k,v));
  if(packed.runnerAtlas)jobs.push(decodeRunner(packed.runnerAtlas));
  await Promise.all(jobs);document.documentElement.classList.add('jump-art-ready');return art;
 }catch(e){art.error=e;console.warn('JUMP art fallback:',e);return art}
})();
art.background=key=>art.backgrounds[key]||null;
window.EixoJumpArt=art;
})();