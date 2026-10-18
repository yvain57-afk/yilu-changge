import {open,E} from './browser.mjs';import fs from 'node:fs';import assert from 'node:assert/strict';
const t=await open('regression',402,874,true),states=[],tierShots=[],start=Date.now();let lastTier=0,phases=new Set(),directions=[],dense=false;
try{
 await t.goto('regression');let s=await t.snap();assert.equal(s.battle.weapon,'liannu');assert.equal(s.battle.tier,1);await t.capture('R02-start-liannu');
 // Natural c11 course. Input only reacts to actually visible targets/telegraphs.
 while(Date.now()-start<210000){s=await t.snap();states.push({wall_seconds:(Date.now()-start)/1000,state:s});if(s.screen!=='battle')break;
  assert.equal(s.frameState.submissions.filter(x=>x.role==='hero_body').length,1,'single player');assert.deepEqual(s.missingArt,[]);assert.deepEqual(s.renderErrors,[]);
  if(s.battle.tier!==lastTier){lastTier=s.battle.tier;await t.capture('R02-tier-'+lastTier);tierShots.push({tier:lastTier,t:s.battle.t,weapon:s.battle.weapon});}
  if(s.battle.entities.filter(x=>['gate','crate'].includes(x.type)).length>=4&&!dense){dense=true;await t.capture('R02-dense');}
  if(s.battle.boss){const phase=s.battle.boss.phase;if(!phases.has(phase)){phases.add(phase);await t.capture('R02-boss-'+phase);}}
  await t.command('review-target');await t.p.waitForTimeout(85);
 }
 await t.capture('R02-end');
 // Direction and fault recovery are separate labelled fixtures, retained in the same original-speed file.
 await t.goto('regression');await t.swipe(-110,0);directions.push((await t.snap()).battle.target);await t.swipe(110,0);await t.swipe(100,0);directions.push((await t.snap()).battle.target);assert.ok(directions[0]<0&&directions[1]>0);await t.capture('R02-direction');
 const save=JSON.stringify((await t.snap()).save),faults=[];
 for(const stage of ['world','hero','waves','hud']){await t.command('fault',stage);await t.p.waitForFunction(()=>__YLCG__.snapshot().screen==='render-error');const a=await t.capture('R04-'+stage+'-paused');assert.equal(a.nativeNodes,0);assert.equal(a.frameState.submissions.length,0);const tick=a.battle.t;await t.p.waitForTimeout(250);assert.equal((await t.snap()).battle.t,tick);assert.equal(JSON.stringify(a.save),save);await t.tap('retry-render');await t.p.waitForFunction(()=>__YLCG__.snapshot().screen==='battle');const b=await t.capture('R04-'+stage+'-recovered');assert.equal(b.frameState.submissions.filter(x=>x.role==='hero_body').length,1);faults.push({stage,before_tick:tick,recovered_tick:b.battle.t,aborted_frames:b.frameState.abortedFrames});}
 fs.writeFileSync(E+'/targeted-regression.json',JSON.stringify({natural_states:states,tierShots,directions,dense,boss_phases:[...phases],faults,scope:'Actual Cocos WebGL runtime, isolated memory save; natural c11 route plus separately labelled fault/movement fixtures; not native iPhone validation',pageErrors:t.errors},null,2));
 const covered=tierShots.some(x=>x.tier===2&&x.weapon==='liannu')&&tierShots.some(x=>x.tier===3&&x.weapon==='liannu');console.log({covered,dense,phases:[...phases],directions,faults});if(!covered)process.exitCode=2;
}finally{const video=await t.close();fs.writeFileSync(E+'/regression-video.json',JSON.stringify({video,speed:'original browser wall time',audio:'no audio in Playwright capture',scope:'browser actual Cocos system input; not physical'},null,2));console.log(video);}
