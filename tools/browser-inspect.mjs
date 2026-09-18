import {chromium} from 'playwright';
const context=await chromium.launchPersistentContext('.cache/browser-inspect',{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:false,viewport:{width:450,height:800},args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']});const page=await context.newPage();await page.setViewportSize({width:450,height:800});
page.on('pageerror',e=>console.log('PAGE_ERROR',e.message));page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE_ERROR',m.text())});
await page.goto('http://127.0.0.1:43187');try{await page.waitForFunction(()=>globalThis.__YLCG__,null,{timeout:25000});}catch(e){await page.screenshot({path:'evidence/browser-load-failure.png'});await context.close();throw e}
console.log(JSON.stringify(await page.evaluate(()=>globalThis.__YLCG__.snapshot())));
await page.screenshot({path:'evidence/01-home.png'});await context.close();
