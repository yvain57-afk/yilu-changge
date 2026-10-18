import {open,E} from './browser.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';
const t=await open('cavalry-hit-avoid',402,874,true),rows=[];
try {await t.goto('new');for(const policy of ['stationary','normal']){
 await t.command('r3-scene',{chapter:15,weapon:'guandao',level:3,companions:[],seed:71,noFriendlyFire:true});
 await t.p.evaluate(async()=>{const cc=await System.import('cc'),g=cc.director.getScene().getChildByName('Canvas').components.find(x=>x.constructor.name==='FormalGame'),s=g.battle.state;s.course=[{d:62,type:'squad',x:.23,n:1,enemyKind:'cavalry'}];s.ci=0;s.ents=[];s.courseLen=1e9;s.heroX=s.targetX=0;});
 const began=Date.now();let state;
 while(Date.now()-began<30000){if(policy==='normal')await t.command('r3-policy','normal');state=await t.snap();if(state.battle.enemyLifecycle.some(e=>e.events.some(q=>q.stage==='impact')))break;await t.p.waitForTimeout(80);}
 const final=await t.capture('cavalry-'+policy);const loss=final.battle.damageHistory.reduce((n,e)=>n+e.actual,0);assert.ok(final.battle.enemyLifecycle.some(e=>e.events.some(q=>q.stage==='release')));assert.ok(final.battle.enemyLifecycle.some(e=>e.events.some(q=>q.stage==='impact')));if(policy==='stationary')assert.ok(loss>0,'normal route cavalry must be capable of physically hitting');else assert.equal(loss,0,'visible warning permits avoidance');assert.deepEqual(final.renderErrors,[]);assert.deepEqual(final.missingArt,[]);rows.push({policy,authoredRouteX:.23,loss,build:final.build,battle:final.battle});console.log(policy,loss,final.battle.t);
 }}finally{const video=await t.close();fs.writeFileSync(E+'/cavalry-hit-avoid-record.json',JSON.stringify({rows,video,pageErrors:t.errors,speed:'original',scope:'Actual Cocos normal-prefetch d62 single cavalry route, authored lane .23 before deterministic spawn spreading; stationary vs current-visible delayed normal input. Friendly attacks explicitly stopped; no forced damage, not full natural chapter.'},null,2));}
