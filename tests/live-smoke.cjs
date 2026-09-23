const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const fake={id:'00000000-0000-4000-8000-000000000099',name:'SMOKE',visualName:'SMOKE',country:'PT',vipLevel:0,letterStyles:[],nameColor:'#ffffff',nameEffect:'none',tagGlobalColor:'#e53935',tagCountryColor:'#ff7a2f',avatar:'default',role:'player'};
 await page.addInitScript(p=>{localStorage.setItem('eixo_player',JSON.stringify({...p,token:'session'}));localStorage.setItem('eixo_country','PT');},fake);
 await page.route('**/api/auth/me',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({player:fake})}));
 await page.route('**/api/rankings**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({players:[],total:0,page:1,pages:1})}));
 await page.route('**/api/jump/rankings**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({players:[],total:0,page:1,pages:1})}));
 await page.route('**/api/jump/player-rank**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({worldRank:null,countryRank:null})}));
 const errors=[];const consoleErrors=[];const failed=[];
 page.on('pageerror',e=>errors.push(e.stack||e.message));
 page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
 page.on('requestfailed',r=>failed.push({url:r.url(),failure:r.failure()?.errorText}));
 const response=await page.goto('https://eixo.at/',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForTimeout(1800);
 console.log('HTTP',response?.status(),'TITLE',await page.title());
 console.log('VISIBLE_MODALS',await page.locator('.modal-backdrop').evaluateAll(els=>els.filter(e=>getComputedStyle(e).display!=='none').map(e=>({id:e.id,class:e.className}))));
 console.log('PAGEERRORS',JSON.stringify(errors));
 console.log('CONSOLEERRORS',JSON.stringify(consoleErrors));
 for(const sel of ['#playerButton','#countryButton','[data-game="jump"]','#createRoomButton','.action.blue']){
   const l=page.locator(sel).first();try{await l.click({timeout:5000});console.log('CLICK_OK',sel);}catch(e){console.log('CLICK_FAIL',sel,e.message);}
   if(sel==='#playerButton')await page.keyboard.press('Escape').catch(()=>{});
 }
 try{
   await page.locator('[data-game="jump"]').first().click({timeout:5000});
   await page.waitForTimeout(1000);
   console.log('JUMP_VISIBLE',await page.locator('#jumpRoot').isVisible());
   console.log('JUMP_MODAL',await page.locator('#jumpPanel').count());
   for(const sel of ['#jumpSoloButton','#jumpJoinButton','#jumpDuoButton','#jumpTrioButton','#jumpCustomizeButton']){
     const l=page.locator(sel);try{await l.click({timeout:5000});console.log('JUMP_CLICK_OK',sel);if(await page.locator('#jumpPanel').count())await page.locator('#jumpPanelClose').click({timeout:2000}).catch(()=>{});}catch(e){console.log('JUMP_CLICK_FAIL',sel,e.message);}
   }
 }catch(e){console.log('JUMP_FLOW_FAIL',e.message);}
 console.log('FINAL_PAGEERRORS',JSON.stringify(errors));
 console.log('FINAL_FAILED',JSON.stringify(failed));
 await page.screenshot({path:'live-auth.png',fullPage:true});
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});