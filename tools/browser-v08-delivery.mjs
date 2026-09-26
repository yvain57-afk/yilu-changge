import {open,steer,freshSave,root,startCapture,stopCapture} from './browser-v08-common.mjs';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const t=await open('delivery'),runs=[],timeline=[],report={passed:false,scope:'One real-time continuous three-level run driven only by touch input; no injected troops, HP, equipment or time'},start=Date.now();
const mark=(type,level,extra={})=>timeline.push({type,level,seconds:(Date.now()-start)/1000,...extra});
try{
 await freshSave(t);await t.tap('settings');await t.tap('sfx');await t.tap('sfx');await t.tap('return');report.capture=await startCapture(t);mark('recording-start',0);await t.tap('start');let paused=false;
 for(let i=0;i<3;i++){
  let s=await t.snap();assert.equal(s.level,i);assert.equal(s.journey.count,[1,1,3][i]);assert.equal(s.journey.runner.stage,0);mark('battle-start',i+1);let next=8,shotTags=new Set(),lastConverted=0,lastEquipment=0,lastChain=0,largeSeen=false;const samples=[];
  while((await t.snap()).screen==='battle'){
   s=await t.snap();const j=s.journey,r=j.runner;await t.target(steer(j));
   if(r.stats.converted>lastConverted){lastConverted=r.stats.converted;mark('gate-converted',i+1,{at:j.elapsed});if(i===0&&!shotTags.has('gate')){shotTags.add('gate');await t.p.screenshot({path:root+'/01-gate-converted.png'});}}
   if(r.stage>lastEquipment){lastEquipment=r.stage;mark('equipment',i+1,{stage:r.stage,at:j.elapsed});if(i===0&&!shotTags.has('equipment')){shotTags.add('equipment');await t.p.screenshot({path:root+'/02-equipment.png'});}}
   if(r.stats.chainGenerated>lastChain){lastChain=r.stats.chainGenerated;mark('chain-generated',i+1,{count:lastChain,at:j.elapsed});}
   if(i===1&&r.stats.chainTaken>=2&&!shotTags.has('chain')){shotTags.add('chain');mark('chain-passing',i+1,{at:j.elapsed});await t.p.screenshot({path:root+'/03-chain.png'});}
   if(i===2&&j.z>=21&&!shotTags.has('columns')){shotTags.add('columns');mark('multi-column',3,{at:j.elapsed});await t.p.screenshot({path:root+'/04-multi-column.png'});}
   if(i===2&&j.z>=37&&!shotTags.has('risk')){shotTags.add('risk');mark('wide-squad-negative',3,{at:j.elapsed});await t.p.screenshot({path:root+'/05-wide-squad-risk.png'});}
   if(r.large&&!largeSeen){largeSeen=true;mark('large-enemy',3,{at:j.elapsed});}
   if(r.large&&j.z>=40&&!shotTags.has('boss')){shotTags.add('boss');mark('large-combat',3,{at:j.elapsed});await t.p.screenshot({path:root+'/06-large-enemy.png'});}
   if(!paused&&i===0&&j.elapsed>11){await t.release();await t.tap('pause');const before=(await t.snap()).journey;await t.p.waitForTimeout(300);assert.deepEqual((await t.snap()).journey,before);assert.equal((await t.snap()).audio.playingEffects.length,0);await t.tap('continue');paused=true;}
   if(j.elapsed>=next){next+=8;samples.push({elapsed:j.elapsed,count:j.count,stage:r.stage,remaining:r.remaining,distance:r.distanceLeft,stats:r.stats,fps:s.fps,nodes:s.nodes,pool:s.pool});console.log(`level ${i+1}: ${j.elapsed.toFixed(1)}s / ${j.count} troops / ${r.remaining} remaining`);}
   assert.equal(j.awakeningUsed,false);assert.equal(j.melee,null);assert.equal(j.waves.length,0);assert.ok(r.stats.peakShots<=512&&r.stats.peakEnemies<=64);assert.ok(Date.now()-start<360000,'run bounded to six minutes');await t.p.waitForTimeout(55);
  }
  await t.release();const end=await t.snap(),j=end.journey,r=j.runner;assert.equal(j.phase,'won',j.cause);assert.ok(end.save.cleared['trial-0'+(i+1)]);assert.ok(end.runnerBest['trial-0'+(i+1)]>=j.count);assert.equal(end.save.best['trial-0'+(i+1)],0);assert.equal(end.audio.musicRequested,false);assert.equal(r.pending,0);assert.ok(r.stats.crates>=2);if(i<2)assert.equal(r.remaining,0);else{assert.equal(j.bossHP,0);assert.equal(r.distanceLeft,0);}
  mark('victory',i+1);runs.push({level:i+1,seconds:j.elapsed,count:j.count,stage:r.stage,remaining:r.remaining,bossHP:j.bossHP,distanceLeft:r.distanceLeft,stats:r.stats,ledger:r.ledger,lastDamage:r.lastDamage,meanFPS:end.meanFPS,samples});await t.p.waitForTimeout(300);await t.tap('transition');await t.p.waitForTimeout(250);
  if(i<2){await t.tap(i===0?'weapon-blade':'weapon-spear');await t.tap(i===0?'companion-xing_daorong':'companion-chen_ying');}
  mark('transition',i+1);const a=await t.pos(-215,-105),b=await t.pos(0,-170);await t.cd.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a.x,y:a.y,id:7}]});for(let q=1;q<=10;q++){await t.cd.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:a.x+(b.x-a.x)*q/10,y:a.y+(b.y-a.y)*q/10,id:7}]});await t.p.waitForTimeout(40);}await t.cd.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal((await t.snap()).transition.done,true);await t.p.waitForTimeout(1400);
 }
 assert.equal((await t.snap()).screen,'meeting');await t.p.waitForTimeout(1500);await t.tap('return-camp');await t.p.waitForTimeout(600);mark('ending',3);report.sound=await stopCapture(t,root+'/three-levels-live-audio.webm');assert.ok(report.sound.audibleSamples>10);
 const saved=await t.snap();await t.p.reload();await t.ready();const restored=await t.snap();for(const k of ['save','runnerBest','campaign','growth','tactics'])assert.deepEqual(restored[k],saved[k]);assert.deepEqual(t.errors,[]);Object.assign(report,{passed:true,pauseChecked:paused,savedAndRestored:true});
}catch(e){report.error=String(e);console.error(e);process.exitCode=1;try{if(!report.sound)report.sound=await stopCapture(t,root+'/incomplete-natural-run.webm');}catch{}}
finally{Object.assign(report,{runs,timeline,errors:t.errors});writeFileSync(root+'/delivery.json',JSON.stringify(report,null,2));await t.c.close();console.log(JSON.stringify({passed:report.passed,error:report.error,runs:runs.map(r=>({level:r.level,seconds:r.seconds,count:r.count}))}));}
