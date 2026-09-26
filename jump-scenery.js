/* Scene animation modules share the exact background transform. */
(function(root){
'use strict';
function glow(c,x,y,r,color,alpha){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color+Math.round(alpha*255).toString(16).padStart(2,'0'));g.addColorStop(1,color+'00');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2)}
function flame(c,x,y,t,i){
 const pulse=.7+.22*Math.sin(t*5.3+i*2)+.08*Math.sin(t*13+i),sway=Math.sin(t*8+i)*.7;
 glow(c,x,y,23,'#ffaf48',.2+pulse*.18);glow(c,x,y,8,'#ffe6a0',pulse*.6);
 c.fillStyle='#fff3bb';c.beginPath();c.moveTo(x-1.3,y+2);c.quadraticCurveTo(x-2,y-1,x+sway,y-5-pulse*2);c.quadraticCurveTo(x+2,y,x+1,y+2);c.fill();
 for(let j=0;j<3;j++){const p=(t*.65+j/3+i*.17)%1;c.globalAlpha=(1-p)*.65;c.fillStyle='#ffcc75';c.fillRect(x+Math.sin(p*5+j)*p*4,y-p*19,1,1)}c.globalAlpha=1;
}
function flag(c,img,box,W,H,t,i){
 const [nx,ny,nw,nh]=box,x=nx*W,y=ny*H,w=nw*W,h=nh*H,sw=img.naturalWidth,sh=img.naturalHeight;
 // The pole stays fixed; only the original cloth region flexes. The source
 // overscan replaces each band, avoiding a second static banner behind it.
 c.save();c.beginPath();c.rect(x-1,y,w+2,h);c.clip();
 for(let row=0;row<h;row+=2){const f=row/h,wave=Math.sin(t*2.4-f*4+i)*f*1.35;
  c.drawImage(img,nx*sw-4,(ny+row/H)*sh,nw*sw+8,2.2/H*sh,x-4*W/sw+wave,y+row,w+8*W/sw,2.3);
  c.fillStyle='rgba(9,17,34,'+(.025+.025*Math.sin(t*2.4-f*4+i))+')';c.fillRect(x,y+row,w,2.3);
 }c.restore();
}
function waterfall(c,box,W,H,t,i){
 const [nx,ny,nw,nh]=box,x=nx*W,y=ny*H,w=nw*W,h=nh*H;c.save();
 const g=c.createLinearGradient(x,y,x,y+h);g.addColorStop(0,'#dcf6ff38');g.addColorStop(.8,'#dcf6ff20');g.addColorStop(1,'#dcf6ff00');c.fillStyle=g;c.fillRect(x-w/2,y,w,h);
 for(let j=0;j<14;j++){const p=(j/14+t*(.36+i*.03))%1;c.globalAlpha=Math.sin(p*Math.PI)*.33;c.fillStyle='#ecfbff';c.fillRect(x+Math.sin(j*7)*w*.43,y+p*h,.65,Math.min(5,h*(1-p)))}c.restore();
}
function draw(c,img,name,W,H,time){
 const data=root.EixoJumpArtLayout.scenes[name];if(!data)return;
 const t=Number(time)||0;c.save();
 (data.flags||[]).forEach((b,i)=>flag(c,img,b,W,H,t,i));
 c.globalCompositeOperation='screen';(data.lights||[]).forEach(([x,y],i)=>flame(c,x*W,y*H,t,i));
 (data.falls||[]).forEach((b,i)=>waterfall(c,b,W,H,t,i));
 (data.crystals||[]).forEach(([x,y],i)=>{const p=.5+.5*Math.sin(t*2+i*2);glow(c,x*W,y*H,15+p*7,'#6ccaff',.25+p*.28);c.strokeStyle='#b8f4ff';c.lineWidth=.6;c.globalAlpha=.25+p*.6;c.beginPath();c.ellipse(x*W,y*H+2,6,2,t*.4+i,0,Math.PI*2);c.stroke()});c.globalAlpha=1;
 (data.stars||[]).forEach(([x,y],i)=>{const p=.2+.8*Math.pow((1+Math.sin(t*1.8+i*2))/2,3);glow(c,x*W,y*H,8,'#ede1ff',p*.5);c.globalAlpha=p;c.fillStyle='#fff5ff';c.fillRect(x*W-3,y*H-.4,6,.8);c.fillRect(x*W-.4,y*H-3,.8,6)});c.globalAlpha=1;
 if(name==='snow'){c.globalAlpha=.1+.055*Math.sin(t*.6);const g=c.createLinearGradient(W*.56,0,W*.86,H*.26);g.addColorStop(0,'#7beee600');g.addColorStop(.5,'#c5afff');g.addColorStop(1,'#81e9dd00');c.fillStyle=g;c.beginPath();c.moveTo(W*.58,0);for(let i=0;i<=30;i++)c.lineTo(W*(.58+i*.008),H*(.08+.06*Math.sin(i*.11+t*.3))+i*1.5);c.lineTo(W*.83,0);c.fill()}
 c.restore();
}
root.EixoJumpScenery={draw,flame,flag,waterfall};
})(window);
