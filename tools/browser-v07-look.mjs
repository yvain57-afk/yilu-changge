import {open,steer,freshSave,root} from './browser-v07-common.mjs';
import {writeFileSync} from 'node:fs';
const t=await open('look');
try{await freshSave(t);await t.p.screenshot({path:root+'/home.png'});await t.tap('start');const seen=new Set;while((await t.snap()).journey.elapsed<32){const s=await t.snap(),j=s.journey;await t.target(steer(j));for(const at of [1.7,4.8,8,11,20,25])if(j.elapsed>=at&&!seen.has(at)){seen.add(at);await t.p.screenshot({path:root+`/look-${at}.png`});console.log(JSON.stringify({at:j.elapsed,count:j.count,tier:j.tier,stats:j.assault.stats}));}if(j.phase==='lost')throw Error(j.cause);await t.p.waitForTimeout(60);}writeFileSync(root+'/look.json',JSON.stringify({errors:t.errors,snapshot:await t.snap()},null,2));}finally{await t.c.close();}
