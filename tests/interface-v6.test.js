'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('chat uses the same compact medal DOM and VIP tiers as the rankings',()=>{
 const s=read('chat.js'),a=s.indexOf('  const tag=(type,n,country,p)=>{'),b=s.indexOf('  const chatI18n=',a);
 assert.ok(a>=0&&b>a,'chat renderer should be available');
 const make=new Function('const esc=v=>String(v);const safeColor=v=>/^#[0-9a-f]{6}$/i.test(String(v||""))?String(v):"";'+s.slice(a,b)+';return {tag,vip};');
 const {tag,vip}=make();
 const world=tag('global',1,'PT',{tagGlobalColor:'#e53935'});
 const nation=tag('national',2,'PT',{tagCountryColor:'#ff7a2f'});
 assert.match(world,/rank-tag medal-rank world-1/);
 assert.match(nation,/rank-tag medal-rank country-2/);
 assert.match(world,/rank-medal-number/);
 assert.match(nation,/title="PT #2"/);
 assert.doesNotMatch(world,/>GLOBAL<\/span>/);
 for(let level=1;level<=6;level++)assert.match(vip(level),new RegExp('vip-medal vip-rank-'+level));
 assert.equal(vip(0),'');
});

test('passport name child is enlarged, community badge is simplified',()=>{
 const s=read('redesign.js'),css=read('interface-v6.css');
 assert.match(s,/<small>EIXO<\/small>/);
 assert.doesNotMatch(s,/EIXO \/ COMMUNITY/);
 assert.match(css,/#rxProfileName>\.rank-player-name/);
 assert.match(css,/#rxProfileName>\.rank-player-name \.name-letter/);
});

test('VIP customization copy and JUMP note use the new presentation',()=>{
 const css=read('interface-v6.css'),jump=read('jump.js');
 assert.match(css,/#vipCustomizeModal \.vip-customize-modal>p/);
 assert.match(css,/#vipCustomizeModal \.vip-tag-lock/);
 assert.match(css,/text-align:left!important/);
 assert.match(jump,/Cabelo e Roupa editáveis/);
 assert.doesNotMatch(jump,/JUMP RUNNER · ROSTO E PELE FIXOS · CABELO E ROUPA EDITÁVEIS/);
});

test('custom EIXO arrow replaces forced crosshair with correct input/action states',()=>{
 const html=read('index.html'),css=read('interface-v6.css'),legacy=read('ui-fix.css');
 assert.match(html,/interface-v6\.css\?v=20260927-v314/);
 assert.doesNotMatch(legacy,/html,body,body \*\{cursor:crosshair!important\}/);
 assert.match(css,/eixo-cursor\.svg/);
 assert.match(css,/eixo-cursor-action\.svg/);
 assert.match(css,/cursor:text!important/);
 assert.match(css,/cursor:not-allowed!important/);
 for(const file of ['eixo-cursor.svg','eixo-cursor-action.svg'])assert.match(read(file),/<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
});
