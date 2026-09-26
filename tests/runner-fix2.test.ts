import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Journey,STEP} from '../assets/scripts/core/model';
import {LEVELS} from '../assets/scripts/core/levels';
import {RunnerObject,gateGrowthStrategy,runnerFormation} from '../assets/scripts/core/runner';
import {RUNNER_LEVELS,RUNNER_RULES,RUNNER_GATE_WINDOW_BOUND_SECONDS,RUNNER_NUMERIC_LIMIT,RUNNER_CAPACITY_PROOF} from '../assets/scripts/core/runnerConfig';
const gate=(cap=4,extra:Partial<RunnerObject>={}):RunnerObject=>({id:'g',kind:'mutableGate',growthStrategy:'window',at:3,x:0,halfWidth:.4,value:-2,damagePerPoint:2,maxPositive:cap,...extra});
const fixture=(objects:RunnerObject[]=[],count=1)=>new Journey({...LEVELS[0],duration:100,start:count,runner:{...LEVELS[0].runner!,routeEnd:100,startCount:count,objects,enemyWaves:[],objective:{kind:'clearEnemies',plannedEnemyCount:0}}});
const tick=(j:Journey,n=1)=>{for(let i=0;i<n&&!j.finished;i++){j.advance(STEP);j.drainFeedback();}};

test('FIX2 window surpasses each old 4/8/12 cap with damage remainder and no premature troops',()=>{
 for(const cap of [4,8,12]){const j=fixture([gate(cap)]),r=j.runner!,g=r.targets[0];r.hitTarget(g,2*(cap+4)+.75);assert.equal(g.value,cap+2);assert.equal(g.progress,.75);r.hitTarget(g,1.25);assert.equal(g.value,cap+3);assert.equal(g.progress,0);assert.equal(j.count,1);assert.equal(g.pacing.cappedAt,null);assert.equal(g.pacing.hitsAfterCap,0);}
});
test('FIX2 signed thresholds cross -1, zero and positive using real fractional damage',()=>{
 const j=fixture([gate(4,{value:-1,damagePerPoint:3})]),r=j.runner!,g=r.targets[0];r.hitTarget(g,2.5);assert.equal(g.value,-1);r.hitTarget(g,.5);assert.equal(g.value,0);r.hitTarget(g,3.25);assert.equal(g.value,1);assert.equal(g.progress,.25);assert.equal(g.pacing.totalHitDamage,6.25);assert.equal(r.stats.converted,1);
});
test('FIX2 explicit window ignores old/null/default cap; legacy capped configuration remains compatible',()=>{
 for(const cap of [undefined,0,null,4]){const j=fixture([gate(cap as any,{maxPositive:cap as any})]),g=j.runner!.targets[0];j.runner!.hitTarget(g,400);assert.equal(g.value,198);}
 const j=fixture([gate(4,{growthStrategy:undefined})]),g=j.runner!.targets[0];assert.equal(gateGrowthStrategy(g),'capped');j.runner!.hitTarget(g,40.5);assert.equal(g.value,4);assert.equal(g.progress,0);j.runner!.hitTarget(g,5);assert.equal(g.pacing.hitsAfterCap,1);assert.equal(g.pacing.damageAfterCap,5);
 assert.equal(gateGrowthStrategy(gate(4,{growthStrategy:undefined,maxPositive:undefined})),'window');
});
test('FIX2 contact claims once past 256; missed token does not receive compensation',()=>{
 const j=fixture([gate(4,{at:.01,value:1000,damagePerPoint:1e9})],48),r=j.runner!;tick(j);assert.equal(j.count,1048);assert.equal(r.members.length,48);assert.equal(r.members.reduce((n,m)=>n+m.weight,0),1048);tick(j,30);assert.equal(r.ledger.filter(e=>e.type==='gateGain').length,1);assert.equal(r.targets[0].pacing.actualClaimCount,1000);
 const miss=fixture([{id:'token',kind:'token',at:.1,x:.9,halfWidth:.025,value:1}],1);tick(miss,120);assert.equal(miss.count,1);assert.equal(miss.runner!.targets[0].claimed,false);assert.equal(miss.runner!.targets[0].pacing.lossCause,'not-contacted');
});
test('FIX2 high logical budget conserves weighted damage and occupied feet at 48 visible actors',()=>{
 const j=fixture([],1000000);j.companion='chen_ying';const r=j.runner!;r.stage=2;tick(j);assert.equal(r.members.length,48);assert.equal(r.members.reduce((n,m)=>n+m.weight,0),1000000);assert.equal(r.stats.damageBudget,2500000);assert.equal(r.stats.issuedShots,48);assert.equal(r.recentFires.length,48);assert.ok(r.members.every(m=>Math.abs(m.x)<=1.16&&m.radius===.025));
 for(const count of [257,1000000,RUNNER_NUMERIC_LIMIT])assert.equal(runnerFormation(count,0,0,true).reduce((n,m)=>n+m.weight,0),count);
});
test('FIX2 numeric guard lies above recomputed legal path bounds and reports invalid values without silent clipping',()=>{
 assert.equal(RUNNER_NUMERIC_LIMIT,4398046511104);assert.ok(RUNNER_CAPACITY_PROOF.every(p=>p.countBound<RUNNER_NUMERIC_LIMIT/2));assert.equal(RUNNER_LEVELS.flatMap(l=>l.objects).filter(t=>t.kind==='mutableGate'&&t.growthStrategy==='window').length,15);
 const j=fixture([gate()]),r=j.runner!,g=r.targets[0];assert.throws(()=>r.hitTarget(g,Infinity),/numeric guard/);assert.equal(g.value,-2);assert.equal(r.stats.numericGuards,1);assert.equal(r.ledger.at(-1)?.type,'numericGuard');
});
test('FIX2 every issued fire retains frozen real weapon identity, including same-tick consumed shots',()=>{
 const j=fixture([gate(4,{at:.18,value:0,damagePerPoint:1000})],2);j.weapon='blade';j.companion='chen_ying';const r=j.runner!;tick(j);assert.equal(r.stats.issuedShots,2);assert.equal(r.recentFires.length,2);assert.ok(r.shots.length<2);const hero=r.recentFires.find(f=>f.origin.actorId==='hero')!,comp=r.recentFires.find(f=>f.origin.actorId==='chen_ying')!;assert.equal(hero.origin.weapon,'blade');assert.equal(comp.origin.weapon,'throwing_fork');assert.ok(Object.isFrozen(hero.origin));assert.ok(Object.isFrozen(hero));
 const at=r.nextFireAtSeconds(hero.origin.owner);assert.ok(at>j.elapsed);j.weapon='spear';j.companion='xing_daorong';assert.equal(hero.origin.weapon,'blade');assert.equal(comp.origin.actorId,'chen_ying');j.pause();tick(j,60);assert.equal(r.nextFireAtSeconds(hero.origin.owner),at);assert.equal(r.stats.issuedShots,2);j.resume();tick(j,25);assert.ok(r.recentFires.every(f=>j.simulationTick-f.issuedTick<24));assert.ok(r.recentFires.some(f=>f.origin.weapon==='spear'));assert.ok(r.recentFires.some(f=>f.origin.weapon==='great_axe'));r.dispose();assert.equal(r.recentFires.length,0);
});
test('FIX2 pacing separates aligned-but-blocked aim from currently clear straight shot window',()=>{
 const j=fixture([gate(4,{at:4}),{id:'block',kind:'rewardCrate',at:2,x:0,halfWidth:.4,hp:1e6,reward:{kind:'troops',count:1}}]),r=j.runner!;tick(j,30);const p=r.targets[0].pacing;assert.ok(p.aimedSeconds>0);assert.ok(p.blockedAimSeconds>0);assert.equal(p.firstHittableAt,null);assert.equal(p.firstHitAt,null);r.targets[1].resolved=true;tick(j);assert.notEqual(p.firstHittableAt,null);assert.ok(p.hittableAimTime>0);
});

// Bind the proof's finite-window premise to current geometry and config, not
// only a copied numeric guard. A future route/formation change must re-audit.
test('FIX2 legal-bound premises track real formation and all actual gate positions',()=>{
 const tail=-Math.min(...runnerFormation(48,0,0,false).map(m=>m.z));assert.equal(tail,2.75);
 const physicalWindow=Math.max(...RUNNER_RULES.equipment.map(e=>e.range))+tail+.15+Math.max(...RUNNER_RULES.equipment.map(e=>e.speed))*STEP+.05;
 assert.ok(physicalWindow<RUNNER_GATE_WINDOW_BOUND_SECONDS);
 for(const level of RUNNER_LEVELS){const proof=RUNNER_CAPACITY_PROOF.find(p=>p.level===level.id)!;assert.ok(proof.countBound<RUNNER_NUMERIC_LIMIT/2);for(const g of level.objects.filter(t=>t.kind==='mutableGate')){assert.ok(g.at+tail+.15<level.routeEnd);assert.ok(g.damagePerPoint!>0);assert.equal(g.growthStrategy,'window');}}
});
