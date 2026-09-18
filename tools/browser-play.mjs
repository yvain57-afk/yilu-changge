import {chromium} from 'playwright';import assert from 'node:assert/strict';import {writeFileSync,appendFileSync} from 'node:fs';
const runs=Number(process.argv[2]||'10');
const context=await chromium.launchPersistentContext('.cache/browser-play',{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:false,viewport:{width:450,height:800},args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
const page=await context.newPage();const errors=[];const externalRequests=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:43187')&&!r.url().startsWith('data:'))externalRequests.push(r.url())});page.on('pageerror',e=>errors.push(e.message));
const snapshot=()=>page.evaluate(()=>globalThis.__YLCG__.snapshot());
const evidence=[];const save=()=>writeFileSync('evidence/browser-runs.json',JSON.stringify({date:new Date().toISOString(),complete:false,runs:evidence,errors,externalRequests},null,2));
const button=async id=>{const s=await snapshot(),b=s.buttons.find(b=>b.id===id);assert.ok(b,`${s.screen} missing button ${id}`);await page.mouse.click(225+b.x*.625,400-b.y*.625);await page.waitForTimeout(160)};
try{
 await page.goto('http://127.0.0.1:43187');await page.bringToFront();await page.waitForFunction(()=>globalThis.__YLCG__,null,{timeout:30000});
 console.log('GPU',await page.evaluate(()=>{const c=document.querySelector('canvas');const g=c?.getContext('webgl2')||c?.getContext('webgl');const e=g?.getExtension('WEBGL_debug_renderer_info');return e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):'unavailable'}));
 await page.evaluate(()=>localStorage.removeItem('yilu-changge-v1'));await page.reload();await page.waitForFunction(()=>globalThis.__YLCG__);
 await page.screenshot({path:'evidence/01-home.png'});await button('chapters');await page.screenshot({path:'evidence/02-chapters.png'});await button('level0');await button('start');
 // Pause/resume via actual button; no state mutation.
 await page.waitForTimeout(700);await button('pause');const before=await snapshot();await page.waitForTimeout(800);assert.equal((await snapshot()).journey.z,before.journey.z);await page.screenshot({path:'evidence/03-paused.png'});await button('continue');
 let cursor=225;
 for(let run=0;run<runs;run++){
  let s=await snapshot();assert.equal(s.screen,'battle');await page.mouse.move(cursor,500);await page.mouse.down();const wall=Date.now(),samples=[];let maxNodes=0,maxPool=0,captured=false;
  while((s=await snapshot()).screen==='battle'){
   const j=s.journey;let x=-.48;
   if(j.phase==='boss')x=j.bossWarning?(j.bossWarning.x<=0?.72:-.72):0;
   else{const r=j.rows.find(r=>r.at-j.z<3.5);if(r)x=r.left.kind==='double'||r.left.value>j.count?-.48:.48;const danger=j.obstacles.find(o=>o.at-j.z<2.8&&o.at-j.z>0&&Math.abs(o.x-x)<o.width);if(danger&&(danger.kind!=='wood'||danger.hp>j.damage*4*(danger.at-j.z-.3)))x=-danger.x;}
   cursor+= (x-j.target)*260*.625;cursor=Math.max(20,Math.min(430,cursor));await page.mouse.move(cursor,500);
   samples.push({elapsed:j.elapsed,fps:s.fps,nodes:s.nodes,pool:s.pool,arrows:j.arrows,visible:j.visible,x:j.x,target:j.target,cursor,bossWarning:j.bossWarning,count:j.count});maxNodes=Math.max(maxNodes,s.nodes);maxPool=Math.max(maxPool,s.pool);
   if(!captured&&j.z>4.5){await page.screenshot({path:`evidence/battle-${run}.png`});captured=true;}
   if(Date.now()-wall>240000)throw Error('Browser run did not settle within observation budget (test timeout, not game rule)');
   await page.waitForTimeout(120);
  }
  await page.mouse.up();writeFileSync(`evidence/browser-trace-${run}.json`,JSON.stringify({final:s,samples},null,2));assert.equal(s.screen,'result');assert.equal(s.journey.phase,'won',s.journey.cause);assert.equal(s.journey.arrows,0);assert.equal(s.nodes,18,'Result nodes must return to stable baseline');assert.ok(maxNodes<160,'Bounded Cocos node count');assert.ok(s.save.cleared[s.level]);
  let low=0;for(const item of samples){low=item.fps<30?low+1:0;assert.ok(low<20,'Sustained below 30 FPS observed');}
  const record={run:run+1,level:s.level,phase:s.journey.phase,count:s.journey.count,gameSeconds:s.journey.elapsed,wallSeconds:(Date.now()-wall)/1000,meanFPS:s.meanFPS,minSampleFPS:Math.min(...samples.slice(10).map(v=>v.fps)),maxNodes,maxPool,resultNodes:s.nodes,samples};evidence.push(record);save();console.log(JSON.stringify({...record,samples:record.samples.length}));
  await page.screenshot({path:`evidence/result-${run}.png`});
  if(run<3){const prev=s.save;await button('clues');assert.equal((await snapshot()).screen,'clues');await page.screenshot({path:`evidence/clue-${run}.png`});await button('return');assert.deepEqual((await snapshot()).save,prev);}
  if(run+1<runs){if(s.level<2){await button('next');assert.equal((await snapshot()).screen,'turn');await button('start-next');await button('start');}else{await button('chapters');await button('level0');await button('start');}cursor=225;}
 }
 assert.equal(errors.length,0,errors.join('\n'));assert.deepEqual(externalRequests,[],'No external runtime network requests');writeFileSync('evidence/browser-runs.json',JSON.stringify({date:new Date().toISOString(),complete:true,runs:evidence,errors,externalRequests},null,2));
}catch(e){console.error(e);await page.screenshot({path:'evidence/browser-run-failure.png'});save();process.exitCode=1;}finally{await context.close()}
