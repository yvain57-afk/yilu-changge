import {open} from './browser-v03-common.mjs';
import {freshSave,fixtureGame,startCapture,stopCapture} from './browser-v06-common.mjs';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const {runnerSteer}=createRequire(import.meta.url)('../.cache/v08-logic/tools/v08-policy.js');
const root='evidence/v081',t=await open('v081-review',390,844,{version:'v081-rc1',audio:true,baseURL:'http://127.0.0.1:43194/'});
const fixturesOnly=process.argv.includes('--fixtures-only');
const report=fixturesOnly?JSON.parse(readFileSync(root+'/review-checks.json','utf8')):{passed:false,scope:'Controlled page fixtures plus one legal-touch level-2 replay; no ten-run or full campaign recording',pages:[],timeline:[]};
const shot=async name=>{await t.p.screenshot({path:`${root}/${name}.png`});return t.snap();};
const resultCheck=async(name,won,first)=>{
 const s=await shot(name);assert.equal(s.screen,'result');assert.equal(s.firstVictory,first);
 assert.equal(s.presentation.bounds.filter(b=>b.id.startsWith('home-')).length,0);
 assert.equal(s.presentation.bounds.length,0,'result background contains no actor or destination');
 assert.equal(s.portrait?.bounds.filter(b=>b.id==='victory-hero-legs').length??0,won?1:0);
 const ending=s.texts.find(x=>x.id==='ending').text;
 if(won){assert.doesNotMatch(ending,/加入|随军|招募/);if(!first)assert.equal(s.texts.filter(x=>x.id==='new-unlocks').length,0);}
 report.pages.push({name,first,won,ending,worldActors:s.presentation.bounds,portrait:s.portrait?.bounds??[],newUnlocks:s.texts.find(x=>x.id==='new-unlocks')?.text});
};
try{
 report.passed=false;
 if(!fixturesOnly){
 await freshSave(t);await fixtureGame(t);
 // Result page fixtures exercise Game's actual finish/save/unlock path, not natural victories.
 await t.tap('start');await t.p.evaluate(()=>{const g=globalThis.__fixtureGame;g.journey.count=7;g.journey.phase='won';});
 await t.p.waitForFunction(()=>__YLCG__.snapshot().screen==='result');await resultCheck('result-first',true,true);
 await t.tap('restart');await t.p.evaluate(()=>{const g=globalThis.__fixtureGame;g.journey.count=5;g.journey.phase='won';});
 await t.p.waitForFunction(()=>__YLCG__.snapshot().screen==='result');await resultCheck('result-repeat',true,false);
 await t.tap('restart');await t.p.evaluate(()=>{const g=globalThis.__fixtureGame;g.journey.count=0;g.journey.cause='队形碰到减员门（-5），损失 5 人';g.journey.phase='lost';});
 await t.p.waitForFunction(()=>__YLCG__.snapshot().screen==='result');await resultCheck('result-failure',false,false);
 await t.p.evaluate(()=>{const g=globalThis.__fixtureGame;for(let i=0;i<3;i++)g.platform.book.win(i,7,'runnerVideoV2');g.platform.growth.reconcile();g.show('home');});
 for(const viewport of [{id:'phone',width:390,height:844},{id:'short',width:360,height:640},{id:'host',width:390,height:844,host:true}]){
  await t.p.setViewportSize({width:viewport.width,height:viewport.height});await t.p.waitForTimeout(200);
  await t.p.evaluate(v=>{const g=globalThis.__fixtureGame;if(v.host)g.platform.metricsCache={width:390,height:844,safe:{left:0,top:59,right:390,bottom:810},capsule:{left:293,top:67,right:380,bottom:99},source:'synthetic-fixture',safeSource:'synthetic-fixture',capsuleSource:'synthetic-fixture',revision:901};g.show('home');},viewport);
  await t.tap('loadout');await t.tap('weapon-blade');await t.tap('companion-zhao_yun_guest');
  await t.p.waitForTimeout(120);let s=await shot('loadout-'+viewport.id);
  assert.doesNotMatch(s.texts.find(x=>x.id==='context').text,/兵法/);assert.equal(s.presentation.bounds.length,0);
  assert.equal(s.portrait.bounds.filter(b=>b.id==='preparation-hero-legs').length,1);
  for(const b of s.buttons){const p=await t.pos(b.x,b.y);assert.ok(p.y-b.h*p.s/2>=s.ui.layout.T-.5);assert.ok(p.y+b.h*p.s/2<=s.ui.layout.B+.5);}
  const before=JSON.stringify(s.portrait.bounds.map(x=>x.id).sort());await t.tap('home');s=await t.snap();assert.equal(s.presentation.bounds.filter(b=>b.id==='home-legs').length,1);
  await t.tap('loadout');await t.p.waitForTimeout(120);s=await t.snap();assert.equal(JSON.stringify(s.portrait.bounds.map(x=>x.id).sort()),before);report.pages.push({name:'loadout-'+viewport.id,layout:s.ui.layout,buttons:s.buttons,texts:s.texts,portrait:s.portrait.bounds});
 }
 // Reset synthetic metrics and use an already-cleared save to replay the real second level.
 await t.p.setViewportSize({width:390,height:844});await t.p.reload();await t.ready();await fixtureGame(t);
 await t.tap('loadout');await t.tap('companion-xing_daorong');await t.tap('home');await t.tap('chapters');
 report.capture=await startCapture(t);const begun=Date.now();await t.tap('level1');let chain=false,contact=false,next=10;
 while((await t.snap()).screen==='battle'){
  const s=await t.snap(),j=s.journey,r=j.runner;await t.target(runnerSteer(j));
  if(!chain&&r.stats.chainTaken>=2){chain=true;await shot('battle-chain');report.timeline.push({kind:'chain',seconds:(Date.now()-begun)/1000,elapsed:j.elapsed});}
  if(!contact&&r.lastContact){contact=true;await shot('battle-contact');report.timeline.push({kind:'contact',seconds:(Date.now()-begun)/1000,elapsed:j.elapsed,event:r.lastContact});}
  if(j.elapsed>=next){next+=10;console.log(`level2 ${j.elapsed.toFixed(1)}s / ${j.count}`);}
  assert.ok(Date.now()-begun<100000);await t.p.waitForTimeout(50);
 }
 await t.release();const end=await t.snap();assert.equal(end.journey.phase,'won',end.journey.cause);await resultCheck('result-repeat-level2',true,false);
 await t.p.waitForTimeout(600);report.sound=await stopCapture(t,root+'/level2-replay.webm');report.replay={seconds:end.journey.elapsed,count:end.journey.count,stats:end.journey.runner.stats,ledger:end.journey.runner.ledger,contactSeen:contact,chainSeen:chain};
 assert.ok(chain);
 }else{await fixtureGame(t);await t.p.evaluate(()=>{const g=globalThis.__fixtureGame;g.platform.book.win(0,7,'runnerVideoV2');g.begin(1);});report.pages=report.pages.filter(p=>p.name!=='gate-hit');}
 // Controlled contact slice deliberately retains high-HP enemies; event positions are compared to visible feet.
 await t.p.evaluate(()=>{const g=globalThis.__fixtureGame,old=g.journey,cfg={...old.level.runner,startCount:18,routeEnd:100,objects:[],enemyWaves:[{id:'contact-review',spawnAt:0,count:18,formation:'wide',centerX:0,spawnAhead:6.5,hpEach:10000,approachSpeed:1}],objective:{kind:'clearEnemies',plannedEnemyCount:18},dividers:[]};g.journey=new old.constructor({...old.level,runner:cfg},{companion:'zhao_yun_guest'});old.dispose();g.finishAge=0;g.notices.clear();g.message='';g.battle.clear();g.show('battle');});
 await startCapture(t);await t.p.waitForFunction(()=>{const g=globalThis.__fixtureGame;if(g.journey.runner.lastContact){g.journey.pause();return true;}return false;},null,{timeout:15000});const contactSnap=await shot('contact-fixture');report.contactRender=await t.p.evaluate(()=>{const g=globalThis.__fixtureGame,n=g.battle.labels.get('runner-team-loss');return{tick:g.journey.simulationTick,damage:g.journey.runner.lastDamage,active:n?.activeInHierarchy,pos:n?.position,label:n?.getComponent('cc.Label')?.string,layer:g.battle.diagnostics.depthOrder};});
 assert.equal(report.contactRender.active,true);assert.equal(report.contactRender.label,'−1');assert.equal(report.contactRender.tick,contactSnap.journey.runner.lastDamage.tick);assert.equal(contactSnap.journey.runner.lastDamage.type,'enemyContact');assert.ok(contactSnap.journey.runner.enemies.every(e=>e.hp>0));
 await t.p.evaluate(()=>globalThis.__fixtureGame.journey.resume());await t.p.waitForTimeout(1000);report.contactFixtureSound=await stopCapture(t,root+'/contact-fixture.webm');report.contactFixture={injected:true,pausedOnDamageForScreenshot:true,event:contactSnap.journey.runner.lastContact,loss:contactSnap.journey.runner.lastDamage,alive:contactSnap.journey.runner.enemies.length};
 await t.p.evaluate(()=>{const g=globalThis.__fixtureGame;g.journey.pause();g.show('battle');});
 // Gate frames taken on actual hitTarget updates. Body retains signed color during hit flash.
 for(const value of [-2,0,4]){
  await t.p.evaluate(value=>{const g=globalThis.__fixtureGame,old=g.journey,cfg={...old.level.runner,startCount:1,routeEnd:100,objects:[{id:'sign-review',kind:'mutableGate',at:2,x:0,halfWidth:.3,value:value-1,damagePerPoint:1,maxPositive:8}],enemyWaves:[],objective:{kind:'clearEnemies',plannedEnemyCount:0},dividers:[]};g.journey=new old.constructor({...old.level,runner:cfg});old.dispose();g.journey.pause();g.journey.runner.hitTarget(g.journey.runner.targets[0],1);g.notices.clear();g.message='';g.battle.clear();g.show('battle');g.battle.render(g.journey,0);},value);
  const s=await shot(value<0?'gate-negative-hit':value===0?'gate-zero-hit':'gate-positive-hit');assert.equal(s.journey.runner.targets[0].value,value);report.pages.push({name:'gate-hit',value});
 }
 assert.equal((await t.snap()).audio.musicRequested,false);assert.deepEqual(t.errors,[]);report.passed=true;
}catch(e){report.error=String(e);console.error(e);process.exitCode=1;}
finally{report.errors=t.errors;writeFileSync(root+'/review-checks.json',JSON.stringify(report,null,2));await t.c.close();console.log(JSON.stringify({passed:report.passed,error:report.error,replay:report.replay&&{count:report.replay.count,seconds:report.replay.seconds},pages:report.pages.length}));}
