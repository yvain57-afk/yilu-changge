import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
const root='evidence/v02';mkdirSync(`${root}/recordings`,{recursive:true});
const context=await chromium.launchPersistentContext('.cache/browser-v02',{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:false,viewport:{width:390,height:844},hasTouch:true,isMobile:true,recordVideo:{dir:`${root}/recordings`,size:{width:390,height:844}},args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
const page=await context.newPage(),errors=[],external=[],samples=[];let report={passed:false};
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:43187')&&!r.url().startsWith('data:'))external.push(r.url())});
const snap=()=>page.evaluate(()=>globalThis.__YLCG__.snapshot());
const boot=async()=>{await page.goto('http://127.0.0.1:43187');await page.bringToFront();await page.waitForFunction(()=>globalThis.__YLCG__?.snapshot().version==='v02-s1',null,{timeout:30000});};
async function pos(x,y){const b=await page.locator('canvas').boundingBox(),s=Math.min(b.width/720,b.height/1280);return{x:b.x+b.width/2+x*s,y:b.y+b.height/2-y*s,s};}
async function tap(id){const s=await snap(),b=s.buttons.find(b=>b.id===id);assert.ok(b,`${s.screen} missing ${id}`);const p=await pos(b.x,b.y);await page.touchscreen.tap(p.x,p.y);await page.waitForTimeout(100);}
const cdp=await context.newCDPSession(page);let cursor=195,touch=false;
async function target(x){const j=(await snap()).journey;const p=await pos(0,-160);if(!touch){cursor=p.x;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cursor,y:p.y,id:1}]});touch=true;}
 const next=cursor+(x-j.target)*260*p.s;
 if(next<15||next>375){await release();return target(x);}cursor=next;await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cursor,y:p.y,id:1}]});}
async function release(){if(touch)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});touch=false;}
function steer(j){if(j.phase==='boss'){const w=j.bossWarning;return w&&!w.hit&&Math.abs(w.x)<=w.width?(w.x<=0?.78:-.78):0;}const r=j.rows.find(r=>r.at-j.z<=7);let x=0;if(r)x=r.left.kind==='double'?(j.count>=r.right.value?-.5:.5):(r.left.value>=j.count?-.5:.5);const o=j.obstacles.find(o=>o.rowId===undefined&&o.at-j.z<1&&o.at>j.z&&Math.abs(o.x-x)<=o.width);if(o)x=o.x<=0?.8:-.8;return x;}
try{
 await boot();await page.evaluate(()=>{localStorage.removeItem('yilu-changge-prototype-v2');localStorage.removeItem('yilu-changge-v1')});await page.reload();await page.waitForFunction(()=>globalThis.__YLCG__);await page.screenshot({path:`${root}/home-390.png`});
 await page.waitForTimeout(1200);const recordingStart=Date.now();await tap('start');assert.equal((await snap()).journey.count,8);let sawFirst=false,sawGuard=false,sawBoss=false;
 while((await snap()).screen==='battle'){
  const s=await snap(),j=s.journey;await target(steer(j));samples.push({elapsed:j.elapsed,count:j.count,x:j.x,z:j.z,phase:j.phase,fps:s.fps,nodes:s.nodes,pool:s.pool,warning:j.bossWarning});
  if(!sawFirst&&j.z>=6.1){assert.equal(j.count,20);sawFirst=true;await page.screenshot({path:`${root}/first-gain-390.png`});}
  if(!sawGuard&&j.z>28){sawGuard=true;await page.screenshot({path:`${root}/guard-390.png`});}
  if(!sawBoss&&j.bossWarning){sawBoss=true;await page.screenshot({path:`${root}/boss-390.png`});}
  assert.ok(Date.now()-recordingStart<150000,'Observation budget');await page.waitForTimeout(80);
 }
 await release();const final=await snap();assert.equal(final.journey.phase,'won',final.journey.cause);assert.ok(final.save.cleared['trial-01']);assert.equal(final.rank,'头领');assert.equal(final.journey.arrows,0);assert.equal(final.journey.warnings.length,0);assert.ok(sawFirst&&sawGuard&&sawBoss);await page.screenshot({path:`${root}/victory-390.png`});
 report={...report,recordingStart,firstVictory:final,samples};writeFileSync(`${root}/browser-first.json`,JSON.stringify(report,null,2));
 await page.waitForTimeout(2500);await tap('restart');await page.waitForTimeout(300);assert.equal((await snap()).journey.count,8);await tap('pause');const frozen=await snap();await page.waitForTimeout(600);assert.equal((await snap()).journey.z,frozen.journey.z);await tap('continue');await page.waitForTimeout(250);assert.ok((await snap()).journey.z>frozen.journey.z);
 await target(.8);await page.waitForTimeout(350);await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});touch=false;const cancelled=await snap();await page.waitForTimeout(350);assert.equal((await snap()).journey.x,cancelled.journey.x);
 await tap('pause');await tap('chapters');assert.equal((await snap()).journey.arrows,0);assert.equal((await snap()).journey.warnings.length,0);await tap('home');await page.reload();await page.waitForFunction(()=>globalThis.__YLCG__);assert.equal((await snap()).rank,'头领');
 await page.setViewportSize({width:360,height:800});await page.screenshot({path:`${root}/home-360.png`});await tap('start');await page.waitForTimeout(300);await page.screenshot({path:`${root}/battle-360.png`});await tap('pause');await tap('chapters');await tap('home');
 // Real storage fault injection, without replacing model or Book.
 await page.evaluate(()=>localStorage.setItem('yilu-changge-prototype-v2','{oops'));await page.reload();await page.waitForFunction(()=>globalThis.__YLCG__);assert.match((await snap()).notice,/默认/);await tap('start');assert.equal((await snap()).journey.count,8);await tap('pause');await tap('chapters');await tap('home');
 await page.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('test quota','QuotaExceededError')};});await page.reload();await page.waitForFunction(()=>globalThis.__YLCG__);await tap('settings');await tap('music');assert.match((await snap()).notice,/仍可游玩/);await tap('return');await tap('start');await page.waitForTimeout(300);assert.ok((await snap()).journey.z>0);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);report={...report,passed:true,checks:['first-level-real-touch-win','save-before-result','free-restart','pause-explicit-resume','touch-cancel','leave-clears-projectiles','reload-preserves-rank','390x844','360x800','corrupt-save','storage-write-failure'],errors,external};
}catch(e){report={...report,error:String(e),errors,external,samples};console.error(e);await page.screenshot({path:`${root}/browser-failure.png`});process.exitCode=1;}finally{writeFileSync(`${root}/browser-first.json`,JSON.stringify(report,null,2));const video=page.video();const videoPath=video?await video.path():null;await context.close();if(videoPath)copyFileSync(videoPath,`${root}/session.webm`);console.log(JSON.stringify({...report,samples:report.samples?.length,firstVictory:report.firstVictory?.journey}));}
