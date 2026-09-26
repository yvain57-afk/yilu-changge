import {open,steer,freshSave,fixtureGame,root} from './browser-v07-common.mjs';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const report={passed:false,views:[],failureFixture:'A separate one-soldier negative-gate fixture; not a natural campaign run'};
try{
 for(const [width,height] of [[360,640],[390,844]]){
  const t=await open('mobile-'+width,width,height);
  try{
   await freshSave(t);await t.tap('start');await t.target(-.65);await t.p.waitForFunction(()=>globalThis.__YLCG__.snapshot().journey.x<-.6);await t.target(.65);await t.p.waitForFunction(()=>globalThis.__YLCG__.snapshot().journey.x>.6);await t.cancel();
   const cancel=await t.snap();assert.equal(cancel.journey.x,cancel.journey.target);
   await t.tap('pause');const paused=(await t.snap()).journey;await t.p.waitForTimeout(250);assert.deepEqual((await t.snap()).journey,paused);await t.tap('continue');
   while((await t.snap()).journey.elapsed<5){await t.target(steer((await t.snap()).journey));await t.p.waitForTimeout(65);}
   await t.release();await t.p.screenshot({path:`${root}/mobile-${width}x${height}.png`});const snap=await t.snap();
   assert.equal(snap.version,'v07-rc1');assert.ok(snap.journey.assault.stats.suppliesBroken>0);assert.ok(snap.journey.assault.stats.converted>0);
   for(const b of snap.buttons){const p=await t.pos(b.x,b.y);assert.ok(p.x>=0&&p.x<=width&&p.y>=0&&p.y<=height,'button '+b.id+' visible');}
   await fixtureGame(t);const restarts=[];
   for(let n=0;n<3;n++){
    await t.p.evaluate(()=>{const g=globalThis.__fixtureGame,old=g.journey;const level={...old.level,start:1,horde:{...old.level.horde,warmup:{...old.level.horde.warmup,count:0},forks:[],commonWaves:[]},assault:[{id:-999,kind:'gate',at:1,x:-.48,width:.25,value:-50,cap:8,hp:0,maxHp:0,reward:'troops',amount:0,chain:false}]};g.journey.dispose();g.battle.clear();g.finishAge=0;g.journey=new old.constructor(level);g.show('battle');});
    await t.target(-.48);await t.p.waitForFunction(()=>globalThis.__YLCG__.snapshot().screen==='result');await t.release();const failed=await t.snap();assert.equal(failed.journey.phase,'lost');assert.equal(failed.journey.count,0);assert.match(failed.journey.cause,/减员门/);
    if(n===0)await t.p.screenshot({path:`${root}/negative-gate-failure-${width}.png`});
    const retry=failed.buttons.find(b=>b.id==='restart');assert.ok(retry);await t.tap('restart');const next=await t.snap();assert.equal(next.screen,'battle');assert.equal(next.journey.count,8);assert.equal(next.journey.assault.stats.gatesTaken,0);restarts.push({nodes:next.nodes,pool:next.pool});
   }
   assert.deepEqual(t.errors,[]);report.views.push({width,height,dragAndCancel:true,pauseFreezes:true,stats:snap.journey.assault.stats,restarts,errors:t.errors});
  }finally{await t.c.close();}
 }
 report.passed=true;
}catch(e){report.error=String(e);process.exitCode=1;console.error(e);}
writeFileSync(root+'/mobile.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
