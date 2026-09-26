import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const c=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const p=await c.newPage({viewport:{width:1000,height:950}}),errors=[];p.on('pageerror',e=>errors.push(String(e)));
try{
 await p.goto('http://127.0.0.1:43194/review/v081/');
 const links=await p.locator('a,img,video').evaluateAll(ns=>ns.map(n=>n.href||n.src));
 for(const link of links){const r=await p.request.get(link);assert.ok(r.ok(),link);}
 await p.locator('video').first().evaluate(v=>v.play());await p.waitForTimeout(500);assert.ok(await p.locator('video').first().evaluate(v=>v.currentTime>0));
 await p.screenshot({path:'evidence/v081/review-page.png'});
 await p.goto('http://127.0.0.1:43194/play/?v=081');const f=await (await p.locator('iframe').elementHandle()).contentFrame();
 await f.waitForFunction(()=>globalThis.__YLCG__?.snapshot().version==='v081-rc1'&&globalThis.__YLCG__.snapshot().resourcesReady);
 const s=await f.evaluate(()=>__YLCG__.snapshot());assert.equal(s.screen,'home');assert.equal(s.audio.musicRequested,false);assert.deepEqual(errors,[]);
 writeFileSync('evidence/v081/final-entry.json',JSON.stringify({passed:true,version:s.version,resourcesReady:s.resourcesReady,reviewLinks:links.length,videoPlayback:true,errors},null,2));
 console.log('Review links, video playback and playable iframe verified');
}finally{await c.close();}
