import {open,E} from './browser.mjs';import fs from 'node:fs';import assert from 'node:assert/strict';
const result=[];
for(const [mount,width,height] of [['chitu',375,667],['dilu',402,874]]){
 const t=await open('mount-cycles-'+mount,width,height,true),rows=[],cycles={lubu:0,machao:0},progress={lubu:0,machao:0},stills=new Set();
 try{await t.goto('new');await t.command('r3-scene',{chapter:19,weapon:'guandao',level:3,companions:['machao','lubu'],slots:{ma:mount},seed:71});await t.command('r3-actor-cycle');await t.p.waitForFunction(()=>__YLCG__.snapshot().screen==='battle'&&__YLCG__.snapshot().diagnostics.counts.visible_hero===1,{},{timeout:10000});const began=Date.now();
 while(Date.now()-began<43000){const s=await t.snap();assert.deepEqual(s.renderErrors,[]);assert.deepEqual(s.missingArt,[]);assert.equal(s.diagnostics.counts.visible_hero,1);rows.push({wallSeconds:(Date.now()-began)/1000,t:s.battle.t,build:s.build,actors:s.diagnostics.actorPoses});
  for(const a of s.diagnostics.actorPoses.filter(a=>a.role==='ally')){const n=progress[a.actorId];if(a.pose==='wind'&&n===0)progress[a.actorId]=1;else if(a.pose==='rel'&&n===1)progress[a.actorId]=2;else if(a.pose==='rec'&&n===2){cycles[a.actorId]++;progress[a.actorId]=0;}const key=a.actorId+'-'+a.pose;if(!stills.has(key)&&['wind','rel','rec'].includes(a.pose)){stills.add(key);await t.capture('cycles-'+mount+'-'+key);}}
  await t.command('r3-move',Math.floor((Date.now()-began)/3500)%2?-.6:.6);await t.p.waitForTimeout(70);
 }
 assert.ok(cycles.lubu>=20&&cycles.machao>=20,JSON.stringify(cycles));assert.deepEqual(t.errors,[]);
 }finally{const video=await t.close();const r={mount,width,height,cycles,rows,video,pageErrors:t.errors,speed:'original',scope:'Actual Cocos priority allies, real wind-release-recovery cycles with left/right input on empty diagnostic field. Legally prior-unlocked gear; not natural encounter, independent gait acceptance or physical performance.'};result.push(r);fs.writeFileSync(E+'/mount-cycles-'+mount+'-record.json',JSON.stringify(r,null,2));}
 console.log(mount,cycles,rows.length);
}
fs.writeFileSync(E+'/mount-cycles-summary.json',JSON.stringify(result.map(({rows,...r})=>r),null,2));
