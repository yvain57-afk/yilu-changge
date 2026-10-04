import {open,E} from './browser.mjs';import fs from 'node:fs';
const t=await open('first-three'),rows=[];
try{for(const [id,fixture] of [['prepare','prepare:weapons'],['map','map'],['reward','milestone:9']]){
 await t.goto(fixture);const s=await t.capture('initial-'+id);const overflow=s.ui.texts.filter(v=>v.container&&(v.bounds.x<v.container.x-.5||v.bounds.y<v.container.y-.5||v.bounds.x+v.bounds.w>v.container.x+v.container.w+.5||v.bounds.y+v.bounds.h>v.container.y+v.container.h+.5));
 console.log(id,s.screen,s.ui.viewport,s.ui.items.map(v=>v.id),s.ui.layers,'text overflow',overflow.map(v=>v.text));rows.push({id,state:s,overflow});
 if(s.ui.maxScroll){await t.command('scroll',8);await t.capture('initial-'+id+'-8px');}
}console.log('page errors',t.errors);}finally{fs.writeFileSync(E+'/first-three.json',JSON.stringify({rows,pageErrors:t.errors},null,2));await t.close();}
