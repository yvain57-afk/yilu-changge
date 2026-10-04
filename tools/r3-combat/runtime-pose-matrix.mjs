import {open,E} from './browser.mjs';import fs from 'node:fs';import assert from 'node:assert/strict';
const weapons=['spear','guandao','shemao','huaji','guding','yitian','qinggang','shuanggu','shuangji','liannu','duanji','tiesuodao','goulianqiang','dundao','yanlinggong','jiguannu'];
const t=await open('pose-matrix',402,874),rows=[];
try{await t.goto('new');await t.command('r3-scene',{chapter:19,weapon:'guandao',level:3,companions:['machao','lubu'],seed:71});await t.command('r3-actor-cycle');
 for(const weapon of weapons)for(const mount of [null,'chitu','dilu','jingfan','jueying'])for(const pose of ['run','wind','rel','rec']){
  await t.command('presentation',{weapon,mount,pose,tier:2,x:0,gait:1});await t.p.waitForTimeout(24);const s=await t.p.evaluate(()=>{const s=__YLCG__.snapshot();return{build:s.build,actors:s.diagnostics.actorPoses,submissions:s.frameState.submissions,renderErrors:s.renderErrors,missingArt:s.missingArt};});assert.deepEqual(s.renderErrors,[]);assert.deepEqual(s.missingArt,[]);assert.equal(s.submissions.filter(x=>x.role==='hero_body').length,1);rows.push({weapon,mount,pose,...s});
  if(pose==='rec')await t.capture('pose-'+weapon+'-'+(mount||'foot'));
 }
 assert.equal(rows.length,320);assert.deepEqual(t.errors,[]);
}finally{fs.writeFileSync(E+'/pose-matrix.json',JSON.stringify({scope:'Actual Cocos rendered diagnostic fixed poses, all16 weapons×five mount states×four attack/run poses; does not prove independent motion or original-speed cycles.',rows,pageErrors:t.errors},null,2));await t.close();}
