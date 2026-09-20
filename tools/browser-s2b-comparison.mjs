import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
const root=`evidence/v02-s2b/${process.argv[2]||'before'}`;mkdirSync(`${root}/recordings`,{recursive:true});
const context=await chromium.launchPersistentContext('.cache/browser-s2b-comparison',{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:false,viewport:{width:390,height:844},hasTouch:true,isMobile:true,recordVideo:{dir:`${root}/recordings`,size:{width:390,height:844}},args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
const page=await context.newPage(),errors=[],external=[],samples=[];let report={passed:false};
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:43187')&&!r.url().startsWith('data:'))external.push(r.url())});
const snap=()=>page.evaluate(()=>globalThis.__YLCG__.snapshot());
const boot=async()=>{await page.goto('http://127.0.0.1:43187');await page.bringToFront();await page.waitForFunction(v=>globalThis.__YLCG__?.snapshot().version===v,process.argv[2]==='after'?'v02-s2b':'v02-s2a',{timeout:30000});};
async function pos(x,y){const b=await page.locator('canvas').boundingBox(),s=Math.min(b.width/720,b.height/1280);return{x:b.x+b.width/2+x*s,y:b.y+b.height/2-y*s,s};}
async function tap(id){const s=await snap(),b=s.buttons.find(b=>b.id===id);assert.ok(b,`${s.screen} missing ${id}`);const p=await pos(b.x,b.y);await page.touchscreen.tap(p.x,p.y);await page.waitForTimeout(100);}
const cdp=await context.newCDPSession(page);let cursor=195,touch=false;
async function target(x){const j=(await snap()).journey;const p=await pos(0,-160);if(!touch){cursor=p.x;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cursor,y:p.y,id:1}]});touch=true;}
 const next=cursor+(x-j.target)*260*p.s;
 if(next<15||next>375){await release();return target(x);}cursor=next;await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cursor,y:p.y,id:1}]});}
async function release(){if(touch)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});touch=false;}
function steer(j){if(j.phase==='boss'){const w=j.bossWarning;return w&&!w.hit&&Math.abs(w.x)<=w.width?(w.x<=0?.78:-.78):0;}const r=j.rows.find(r=>r.at-j.z<=7);let x=0;if(r)x=r.left.kind==='double'?(j.count>=r.right.value?-.5:.5):(r.left.value>=j.count?-.5:.5);const o=j.obstacles.find(o=>o.rowId===undefined&&o.at-j.z<1&&o.at>j.z&&Math.abs(o.x-x)<=o.width);if(o)x=o.x<=0?.8:-.8;return x;}
try {await boot();const captures=[];
for(const width of [360,390]){await page.setViewportSize({width,height:width===360?800:844});await page.evaluate(()=>localStorage.removeItem('yilu-changge-prototype-v2'));await boot();await page.screenshot({path:`${root}/home-${width}.png`});await tap('start');const seen=new Set(),start=Date.now();
while((await snap()).screen==='battle'){const s=await snap(),j=s.journey;await target(steer(j));const key=j.z>.4&&!seen.has('team')?'team':j.z>28.1&&!seen.has('guard')?'guard':j.bossWarning&&!seen.has('boss')?'boss':null;if(key){seen.add(key);await page.screenshot({path:`${root}/${key}-${width}.png`});captures.push({width,key,snapshot:await snap()});}assert.ok(Date.now()-start<180000);await page.waitForTimeout(80);}
await release();assert.equal((await snap()).journey.phase,'won');await page.waitForTimeout(1500);await page.screenshot({path:`${root}/promotion-${width}.png`});captures.push({width,key:'promotion',snapshot:await snap()});}
assert.deepEqual(errors,[]);report={passed:true,captures,errors};
}catch(e){report={passed:false,error:String(e),errors};process.exitCode=1;}finally{writeFileSync(`${root}/comparison.json`,JSON.stringify(report,null,2));await context.close();console.log(JSON.stringify({passed:report.passed,error:report.error,captures:report.captures?.length}));}
