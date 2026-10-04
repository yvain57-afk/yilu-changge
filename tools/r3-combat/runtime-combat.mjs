import {open,E} from './browser.mjs';import fs from 'node:fs';import assert from 'node:assert/strict';
const mode=process.argv[2]||'natural',t=await open(mode,402,874,true),rows=[],events=[],start=Date.now();let lastPhase='',lastTier=0,shotCount=0,lastLoss=0,nextCheckpoint=15;
const scene={chapter:15,weapon:'guandao',level:3,companions:['machao','lubu'],support:'hua',slots:{dian:'taiping',qi:'yuxi',ma:mode==='natural-mounted'?'chitu':null},seed:71,noFriendlyFire:mode==='enemy-route'};
const compact=s=>({wall_seconds:(Date.now()-start)/1000,screen:s.screen,build:s.build,simulation_seconds:s.battle?.t,phase:s.battle?.phase,weapon:s.battle?.weapon,tier:s.battle?.tier,troops:s.battle?.troops,damageSources:s.battle?.damageSources,threats:s.battle?.telegraphs,shots:s.battle?.hostileShots,actors:s.diagnostics?.actorPoses,counts:s.diagnostics?.counts,fps:s.fps,renderErrors:s.renderErrors,missingArt:s.missingArt});
try{
 await t.goto('new');assert.equal(await t.command('r3-scene',scene),true);
 if(mode==='actors')await t.command('r3-actor-cycle');
 await t.p.waitForTimeout(250);
 const begin=Date.now(),limit=mode==='actors'?42000:mode==='enemy-route'?40000:230000;
 while(Date.now()-begin<limit){const s=await t.p.evaluate(()=>{const a=__YLCG__.snapshot(),b=a.battle;return{screen:a.screen,build:a.build,battle:b?{t:b.t,phase:b.phase,weapon:b.weapon,tier:b.tier,troops:b.troops,damageSources:b.damageSources,telegraphs:b.telegraphs,hostileShots:b.hostileShots,boss:b.boss?{phase:b.boss.phase}:null}:null,frameState:{submissions:a.frameState?.submissions.filter(x=>x.role==='hero_body')||[]},diagnostics:{actorPoses:a.diagnostics?.actorPoses,counts:a.diagnostics?.counts},fps:a.fps,renderErrors:a.renderErrors,missingArt:a.missingArt};});rows.push(compact(s));if(s.screen!=='battle')break;
  assert.equal(s.frameState.submissions.filter(x=>x.role==='hero_body').length,1);assert.deepEqual(s.renderErrors,[]);assert.deepEqual(s.missingArt,[]);
  assert.ok(s.battle.telegraphs.every(t=>t.riskFootprint.wallSides.every(side=>[-1,0,1].includes(side))),'real compiled wall-side data');
  const ph=s.battle.boss?.phase||'march';if(ph!==lastPhase){lastPhase=ph;events.push({kind:'phase',...compact(s)});await t.capture(mode+'-phase-'+ph);}
  if(mode.startsWith('natural')&&s.battle.t>=nextCheckpoint){await t.capture(mode+'-checkpoint-'+nextCheckpoint);nextCheckpoint+=15;}
  if(s.battle.tier!==lastTier){lastTier=s.battle.tier;await t.capture(mode+'-tier-'+lastTier);}
  const loss=Object.values(s.battle.damageSources||{}).reduce((a,b)=>a+Number(b),0);if(loss>lastLoss){lastLoss=loss;events.push({kind:'actual-loss',...compact(s)});if(shotCount++<8)await t.capture(mode+'-loss-'+shotCount);}
  if(mode==='actors')await t.command('r3-move',Math.floor((Date.now()-begin)/3500)%2?-.6:.6);
  else await t.command('r3-policy','normal');
  await t.p.waitForTimeout(80);
 }
 const final=await t.capture(mode+'-final');fs.writeFileSync(E+'/'+mode+'-final-state.json',JSON.stringify(final,null,2));
 assert.deepEqual(t.errors,[]);
}finally{const video=await t.close();fs.writeFileSync(E+'/'+mode+'-record.json',JSON.stringify({scene,mode,scope:mode==='actors'?'actual Cocos live automatic attack loop on explicitly empty diagnostic field; not natural encounter or clear':'actual Cocos natural chapter16 route from isolated legitimate prior-unlocked equipment; no invulnerability or route foresight',speed:'original browser wall time',audio:'Playwright video has no audio; not listening evidence',rows,events,pageErrors:t.errors,video},null,2));console.log(mode,video,rows.length);}
