import {open,out} from './formal-browser.mjs';
import {readFileSync,writeFileSync} from 'node:fs';import assert from 'node:assert/strict';
const data=JSON.parse(readFileSync(out+'/model-ten-levels.json','utf8')).save,results=[];
for(const size of [{width:360,height:640},{width:390,height:844},{width:430,height:932}]){
 const t=await open('pr2-ui-'+size.width+'-'+Date.now(),size);
 try{await t.p.evaluate(d=>localStorage.setItem('yilu-changge-formal-v2',JSON.stringify(d)),data);await t.p.reload();await t.p.waitForFunction(()=>globalThis.__YLCG__?.snapshot().screen==='home');await t.tap('chapters');await t.p.screenshot({path:out+'/map-'+size.width+'.png'});await t.tap('level3');await t.p.screenshot({path:out+'/map-selected-'+size.width+'.png'});await t.tap('map-depart');assert.equal((await t.snap()).chapter,3);await t.tap('back');await t.tap('collection');await t.p.screenshot({path:out+'/people-'+size.width+'.png'});
  for(let i=0;i<10;i++){if((await t.snap()).buttons.some(x=>x.id==='person-lubu'))break;await t.tap('next-page');}await t.tap('person-lubu');await t.p.screenshot({path:out+'/person-lubu-'+size.width+'.png'});const s=await t.snap();assert.equal(s.screen,'person');await t.tap('person-equip');assert.ok((await t.snap()).save.companions.includes('lubu'));await t.p.reload();await t.p.waitForFunction(()=>globalThis.__YLCG__?.snapshot().screen==='home');assert.ok((await t.snap()).save.companions.includes('lubu'));assert.deepEqual(t.errors,[]);results.push({size,passed:true,errors:t.errors});
 }finally{await t.c.close();}
}
writeFileSync(out+'/ui-check.json',JSON.stringify(results,null,2));console.log(results);
