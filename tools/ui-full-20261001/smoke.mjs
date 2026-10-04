import {chromium} from 'playwright';import fs from 'node:fs';
const dir='evidence/YILU-REGRESSION-FIRST-UI-FULL-20261001/ui-continuation/first-pixels';fs.mkdirSync(dir,{recursive:true});
const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const c=await b.newContext({viewport:{width:375,height:667},deviceScaleFactor:2,isMobile:true,hasTouch:true});const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
for(const fixture of ['home','prepare:weapons','collection:people','item:liannu','reward:1','result','defeat','pause','settings','map']){
 await p.goto('http://127.0.0.1:43214/?yilu-review=UI:'+fixture);await p.waitForFunction(()=>globalThis.__YLCG__&&globalThis.__YLCG__.snapshot().screen!=='loading',{timeout:60000});await p.waitForTimeout(700);
 const s=await p.evaluate(()=>__YLCG__.snapshot());const name=fixture.replace(':','-');await p.screenshot({path:dir+'/'+name+'.png'});fs.writeFileSync(dir+'/'+name+'.json',JSON.stringify(s,null,2));console.log(fixture,s.screen,s.missingArt,s.renderErrors,s.buttons.length);
}console.log('errors',errors);await b.close();
