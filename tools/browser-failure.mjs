import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const ctx=await chromium.launchPersistentContext('.cache/browser-failure',{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:false,viewport:{width:450,height:800}});
const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
const snap=()=>page.evaluate(()=>globalThis.__YLCG__.snapshot());
async function tap(id){const s=await snap(),b=s.buttons.find(b=>b.id===id);assert.ok(b,`${s.screen}: ${id}`);await page.mouse.click(225+b.x*.625,400-b.y*.625);await page.waitForTimeout(120);}
try{
 await page.goto('http://127.0.0.1:43187');await page.bringToFront();await page.waitForFunction(()=>globalThis.__YLCG__);
 // Clean only this isolated test profile before starting a real failure route.
 await page.evaluate(()=>localStorage.removeItem('yilu-changge-v1'));await page.reload();await page.waitForFunction(()=>globalThis.__YLCG__);
 await tap('chapters');await tap('level0');await tap('start');
 await page.mouse.move(225,500);await page.mouse.down();await page.mouse.move(371,500);
 const start=Date.now();let s;
 while((s=await snap()).screen==='battle') {assert.ok(Date.now()-start<180000,'Failure observation budget exhausted');await page.waitForTimeout(150);}
 await page.mouse.up();assert.equal(s.screen,'result');assert.equal(s.journey.phase,'lost');assert.equal(s.journey.count,0);assert.match(s.journey.cause,/木栅|山石|墨影/);assert.equal(s.save.clues[0],true);assert.equal(s.save.cleared[0],false);
 await page.screenshot({path:'evidence/real-failure-result.png'});
 await tap('next');const restart=await snap();assert.equal(restart.screen,'battle');assert.equal(restart.journey.count,8);assert.equal(restart.journey.usedRows.length,0);assert.equal(restart.save.clues[0],true);
 await tap('pause');await tap('chapters');await page.reload();await page.waitForFunction(()=>globalThis.__YLCG__);await tap('clues');const restored=await snap();assert.equal(restored.save.clues[0],true);assert.equal(restored.save.cleared[0],false);await page.screenshot({path:'evidence/failure-clue-retained.png'});assert.deepEqual(errors,[]);
 const result={passed:true,cause:s.journey.cause,gameSeconds:s.journey.elapsed,zeroFails:true,freeRestartCount:restart.journey.count,clueRetainedAfterFailureRestartAndReload:true,errors};writeFileSync('evidence/browser-failure.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}catch(e){console.error(e);writeFileSync('evidence/browser-failure.json',JSON.stringify({passed:false,error:String(e),errors},null,2));process.exitCode=1;}finally{await ctx.close();}
