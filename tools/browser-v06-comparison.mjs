import{open,steer,freshSave,fixtureGame,root,startCapture,stopCapture}from'./browser-v06-common.mjs';
import assert from'node:assert/strict';import{writeFileSync,readFileSync}from'node:fs';
const t=await open('comparison'),report={passed:false,scope:'isolated loadout and boss fixtures; real-time actual Journey and legal touch controls',clips:[]};
try{
 await freshSave(t);await t.tap('settings');await t.tap('sfx');await t.tap('sfx');await t.tap('return');await fixtureGame(t);
 for(const [weapon,tactic]of(process.argv.includes('--boss-only')?[]:[['spear','guanzhen'],['blade','zhenjun']])){
  await t.p.evaluate(({weapon,tactic})=>{const g=globalThis.__fixtureGame;g.platform.growth.data.equippedWeapon=weapon;g.platform.tactics.data.equipped=tactic;g.begin(0);const a=g.layout;g.logicalText('fixture-label','搭配对照 · 隔离整备',a.L,a.T+180,a.R-a.L,24,12,'#19363D');},{weapon,tactic});
  await startCapture(t);let shot=false;while((await t.snap()).journey.elapsed<26){const j=(await t.snap()).journey;assert.equal(j.phase,'run');await t.target(steer(j,'hard'));if(j.elapsed>15&&!shot){shot=true;await t.p.screenshot({path:`${root}/compare-${weapon}-${tactic}.png`});}await t.p.waitForTimeout(65);}
  await t.release();const s=await t.snap(),audio=await stopCapture(t,`${root}/compare-${weapon}-${tactic}.webm`);report.clips.push({weapon,tactic,stage:s.journey.stageInfo,combat:s.combatStats,audio});assert.ok(audio.audibleSamples>0);
 }
 if(!process.argv.includes('--loadouts-only')){
 const natural=JSON.parse(readFileSync(root+'/delivery.json'));assert.equal(natural.passed,true);report.naturalCoverage=natural.runs.map(r=>({level:r.level,attacks:r.bossAttacks}));
 for(const level of natural.runs.filter(r=>r.bossAttacks.length<2).map(r=>r.level-1)){
  await t.p.evaluate(level=>{const g=globalThis.__fixtureGame;g.platform.book.data.cleared['trial-01']=true;g.platform.book.data.cleared['trial-02']=true;g.begin(level);const j=g.journey;j.phase='boss';j.z=j.level.duration;j.count=1;j.tier=1;j.obstacles=[];j.arrows=[];j.waves=[];g.show('battle');g.tutorialUntil=-10;j.elapsed=10;g.messageTime=0;const a=g.layout;g.logicalText('fixture-label','招式对照 · 隔离场景',a.L,a.T+180,a.R-a.L,24,12,'#19363D');},level);
  await startCapture(t);const seen=new Set(),warned=new Set();while((await t.snap()).journey.elapsed<23){const j=(await t.snap()).journey;assert.equal(j.phase,'boss');await t.target(steer(j));const d=j.bossDirector;if(d.phase==='telegraph'&&!warned.has(d.attackId)){warned.add(d.attackId);await t.p.screenshot({path:`${root}/boss-${d.attackId}-warning.png`});}if(d.phase==='active'&&!seen.has(d.attackId)){seen.add(d.attackId);await t.p.waitForTimeout(70);await t.p.screenshot({path:`${root}/boss-${d.attackId}-active.png`});}await t.p.waitForTimeout(45);}
  await t.release();assert.equal(seen.size,2,`boss ${level+1} two moves`);const audio=await stopCapture(t,`${root}/boss-isolated-${level+1}.webm`);report.clips.push({boss:level+1,attacks:[...seen],count:(await t.snap()).journey.count,audio});
 }
 }
 assert.deepEqual(t.errors,[]);report.passed=true;
}catch(e){report.error=String(e);console.error(e);process.exitCode=1;}finally{report.errors=t.errors;writeFileSync(root+(process.argv.includes('--boss-only')?'/boss-comparison.json':'/comparison.json'),JSON.stringify(report,null,2));await t.c.close();console.log(JSON.stringify(report));}
