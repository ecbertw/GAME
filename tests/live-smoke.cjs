const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];const consoleErrors=[];const failed=[];
 page.on('pageerror',e=>errors.push(e.stack||e.message));
 page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
 page.on('requestfailed',r=>failed.push({url:r.url(),failure:r.failure()?.errorText}));
 const response=await page.goto('https://eixo.at/',{waitUntil:'domcontentloaded',timeout:45000});
 console.log('HTTP',response?.status());
 console.log('TITLE',await page.title());
 console.log('BODY',await page.locator('body').evaluate(el=>({pointer:getComputedStyle(el).pointerEvents,overflow:getComputedStyle(el).overflow,html:el.innerText.slice(0,500)})));
 console.log('MODALS',await page.locator('.modal-backdrop').evaluateAll(els=>els.map(e=>({id:e.id,class:e.className,display:getComputedStyle(e).display,pointer:getComputedStyle(e).pointerEvents,rect:e.getBoundingClientRect().toJSON()}))));
 console.log('TOP ELEMENT',await page.evaluate(()=>{const e=document.elementFromPoint(innerWidth/2,innerHeight/2);return e?{tag:e.tagName,id:e.id,class:e.className}:null}));
 for(const sel of ['#playerButton','#countryButton','[data-game="jump"]','#createRoomButton','.action.blue']){
   const l=page.locator(sel).first();console.log('LOC',sel,'count',await l.count());if(await l.count()){console.log('VISIBLE',sel,await l.isVisible().catch(()=>false),'BOX',await l.boundingBox().catch(()=>null));}
 }
 console.log('PAGEERRORS',JSON.stringify(errors));
 console.log('CONSOLEERRORS',JSON.stringify(consoleErrors));
 console.log('FAILED',JSON.stringify(failed));
 try{
  await page.locator('#playerButton').click({timeout:5000});
  console.log('PLAYER_CLICK_OK');
 }catch(e){console.log('PLAYER_CLICK_FAIL',e.message);}
 try{
  const jump=page.locator('[data-game="jump"]').first();
  await jump.click({timeout:5000});
  console.log('JUMP_CLICK_OK',await page.locator('#jumpRoot').isVisible().catch(()=>false));
 }catch(e){console.log('JUMP_CLICK_FAIL',e.message);}
 await page.screenshot({path:'live.png',fullPage:true});
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});