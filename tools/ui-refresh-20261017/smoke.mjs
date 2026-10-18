import {open,E} from './browser.mjs';
import fs from 'node:fs';
const sizes=process.argv[2]?[process.argv[2].split('x').map(Number)]:[[375,667],[402,874]];
const fixtures=['home','collection:people','collection:weapons','collection:treasures','person:zhuge','person:lukang','item:liannu','item:yuxi','prepare:weapons','map','result','reward:0','milestone:9','defeat','pause','settings','error'];
const results=[];
for(const [w,h] of sizes){const t=await open('refresh',w,h);try{for(const f of fixtures){await t.goto(f);await t.p.waitForTimeout(f==='map'?900:160);const s=await t.capture(f.replaceAll(':','-')+'-'+w+'x'+h);const overflow=s.ui.texts.filter(t=>{const b=t.bounds,r=t.container;return r&&(b.x<r.x-.5||b.y<r.y-.5||b.x+b.w>r.x+r.w+.5||b.y+b.h>r.y+r.h+.5)});const row={fixture:f,w,h,screen:s.screen,missing:s.missingArt,errors:s.renderErrors,overflow:overflow.map(t=>t.text),buttons:s.buttons.map(b=>({id:b.id,x:b.x,y:b.y,w:b.w,h:b.h})),scroll:s.ui.maxScroll};results.push(row);console.log(JSON.stringify({...row,buttons:undefined}));}console.log('PAGE_ERRORS',JSON.stringify(t.errors));}finally{await t.close();}}
fs.writeFileSync(E+'/smoke.json',JSON.stringify(results,null,2));
