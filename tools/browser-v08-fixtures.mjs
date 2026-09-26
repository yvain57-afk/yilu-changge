import {open,freshSave,fixtureGame,root} from './browser-v08-common.mjs';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const t=await open('fixtures'),report={passed:false,scope:'Explicit isolated boundary and density fixtures; NOT natural campaign footage',restarts:[],views:[]};
try{
 await freshSave(t);await t.tap('start');await fixtureGame(t);
 await t.target(-.6);await t.p.waitForFunction(()=>globalThis.__YLCG__.snapshot().journey.x<-.55);await t.target(.6);await t.p.waitForFunction(()=>globalThis.__YLCG__.snapshot().journey.x>.55);await t.cancel();let snap=await t.snap();assert.equal(snap.journey.x,snap.journey.target);
 await t.tap('pause');const paused=(await t.snap()).journey;await t.p.waitForTimeout(250);assert.deepEqual((await t.snap()).journey,paused);await t.tap('continue');report.inputAndPause=true;
 await t.p.evaluate(()=>{const g=globalThis.__fixtureGame,old=g.journey,cfg={...old.level.runner,startCount:256,routeEnd:100,objects:[],enemyWaves:[{id:'density',spawnAt:0,count:64,formation:'wide',centerX:0,spawnAhead:6.5,hpEach:30000,approachSpeed:.35,enemyKind:'grunt'}],objective:{kind:'clearEnemies',plannedEnemyCount:64}};g.journey.dispose();g.finishAge=0;g.journey=new old.constructor({...old.level,runner:cfg});g.journey.runner.stage=1;g.journey.tier=2;g.show('battle');});
 await t.p.waitForFunction(()=>globalThis.__YLCG__.snapshot().journey.elapsed>=22,null,{timeout:35000});const dense=await t.snap();assert.ok(dense.journey.runner.stats.peakShots<=512);assert.equal(dense.journey.runner.stats.deferredShots,0);assert.equal(dense.journey.runner.stats.peakEnemies,64);assert.ok(dense.journey.visible<=48);report.density={seconds:dense.journey.elapsed,stats:dense.journey.runner.stats,nodes:dense.nodes,pool:dense.pool,fps:dense.meanFPS};
 for(let n=0;n<3;n++){
  await t.p.evaluate(()=>{const g=globalThis.__fixtureGame,old=g.journey,cfg={...old.level.runner,startCount:7,routeEnd:100,enemyWaves:[],objective:{kind:'clearEnemies',plannedEnemyCount:0},objects:[{id:'visible-edge-negative',kind:'mutableGate',at:.3,x:.2,halfWidth:.06,value:-99,damagePerPoint:100000,maxPositive:8}]};g.journey.dispose();g.finishAge=0;g.journey=new old.constructor({...old.level,runner:cfg});g.show('battle');});
  await t.p.waitForFunction(()=>globalThis.__YLCG__.snapshot().screen==='result');const failed=await t.snap();assert.equal(failed.journey.count,0);assert.equal(failed.journey.runner.lastDamage.sourceId,'visible-edge-negative');assert.equal(failed.journey.runner.lastDamage.countBefore,7);assert.equal(failed.journey.x,0);if(n===0)await t.p.screenshot({path:root+'/fixture-edge-failure.png'});
  await t.tap('restart');const fresh=await t.snap();assert.equal(fresh.journey.count,1);assert.equal(fresh.journey.runner.stage,0);assert.equal(fresh.journey.runner.stats.crates,0);report.restarts.push({nodes:fresh.nodes,pool:fresh.pool});
 }
 assert.equal(new Set(report.restarts.map(x=>x.pool)).size,1);
 const fixtures=JSON.parse(readFileSync('docs/ui-design/source-brief/design-data/viewport-fixtures.json')).fixtures;
 for(const v of [{id:'short-web',width:360,height:640,safeArea:{left:0,top:0,right:360,bottom:640}},fixtures.find(f=>f.id==='island-and-capsule')]){
  await t.p.setViewportSize({width:v.width,height:Math.round(v.height)});await t.p.waitForTimeout(150);
  await t.p.evaluate(v=>{const g=globalThis.__fixtureGame;g.platform.metricsCache={width:v.width,height:v.height,safe:v.safeArea,capsule:v.capsule??null,source:'synthetic-fixture',capsuleSource:'synthetic-fixture',revision:901};g.journey.pause();g.show('battle');g.update(0);},v);
  const s=await t.snap();for(const b of s.buttons){const p=await t.pos(b.x,b.y);assert.ok(b.h*p.s>=43.5);assert.ok(p.y-b.h*p.s/2>=v.safeArea.top-.6&&p.y+b.h*p.s/2<=v.safeArea.bottom+.6);if(v.capsule){assert.ok(p.x+b.w*p.s/2<v.capsule.left||p.y-b.h*p.s/2>v.capsule.bottom||p.y+b.h*p.s/2<v.capsule.top);}}
  await t.p.screenshot({path:root+'/mobile-'+v.id+'.png'});report.views.push({fixture:v.id,width:v.width,height:v.height,safeArea:v.safeArea,capsule:v.capsule??null,layout:s.ui.layout});
 }
 assert.deepEqual(t.errors,[]);assert.equal((await t.snap()).audio.musicRequested,false);report.errors=t.errors;report.passed=true;
}catch(e){report.error=String(e);console.error(e);process.exitCode=1;}finally{writeFileSync(root+'/fixtures.json',JSON.stringify(report,null,2));await t.c.close();console.log(JSON.stringify({passed:report.passed,error:report.error,density:report.density,restarts:report.restarts}));}
