import {open} from './browser-v03-common.mjs';import {writeFileSync} from 'node:fs';
const t=await open('v04-smoke',390,844,{version:'v04-rc1'});
try{await t.p.evaluate(()=>{localStorage.removeItem('yilu-changge-campaign-v04')});await t.p.reload();await t.ready();await t.p.screenshot({path:'evidence/v04/home-390.png'});await t.tap('start');await t.p.waitForTimeout(1870);await t.p.screenshot({path:'evidence/v04/melee-390.png'});writeFileSync('evidence/v04/smoke.json',JSON.stringify({snapshot:await t.snap(),errors:t.errors},null,2));}finally{await t.c.close();}
