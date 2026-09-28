import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const c=JSON.parse(readFileSync(new URL('config/horde_v06.json',root),'utf8'));
const b=JSON.parse(readFileSync(new URL('config/boss_v06.json',root),'utf8'));
const unique=new Set();let packets=0,routeVariants=0;
const ids=c.scope.playableLevelIds;assert.equal(c.scope.bgm,false);assert.equal(c.levels.length,3);
assert.deepEqual(c.growth.killThresholds,[30,80]);assert.ok(c.limits.hostilesSoft<=c.limits.hostilesHard);
const id=x=>{assert.ok(!unique.has(x),`duplicate id ${x}`);unique.add(x);};
const sums=[];
for(const lv of c.levels){
 id(lv.id);assert.ok(ids.includes(lv.id));assert.ok(b.bosses.some(v=>v.id===lv.bossId));assert.equal(lv.forks.length,3);
 let previousEnd=0;
 for(const fork of lv.forks){
  id(fork.id);assert.ok(fork.previewAt>=previousEnd);assert.equal(fork.commitAt-fork.previewAt,2);assert.ok(fork.endAt-fork.commitAt>=8&&fork.endAt-fork.commitAt<=12);
  assert.ok(fork.insideGateAt-fork.commitAt>=2);assert.ok(fork.insideGateAt<fork.endAt);assert.ok(fork.endAt<=lv.runDuration);
  assert.notEqual(fork.safeSide,fork.hardSide);
  assert.ok(['left','right'].includes(fork.safeSide));assert.ok(['left','right'].includes(fork.hardSide));
  for(const gate of Object.values(fork.internalGate)){assert.ok(['add','double'].includes(gate.kind));assert.ok(Number.isInteger(gate.value)&&gate.value>0);if(gate.kind==='double')assert.equal(gate.value,2);}
  for(const [mode,r] of Object.entries(fork.routes)){
   routeVariants++;assert.equal(r.side,mode==='safe'?fork.safeSide:fork.hardSide);assert.ok(r.exitReinforcements>0);assert.equal(r.waves.length,3);
   for(const p of r.waves){
    id(p.id);packets++;assert.ok(p.count>0&&p.count<=30);assert.ok(p.offset>=0&&fork.commitAt+p.offset<fork.endAt);
    assert.ok(fork.commitAt+p.offset<=lv.runDuration-c.fork.stopSpawnsBeforeBossSeconds,`late spawn ${p.id}`);
    assert.ok(p.replacements.reduce((s,v)=>s+v.count,0)<=p.count);assert.ok(c.enemyProfiles[p.kind]);
    for(const v of p.replacements)assert.ok(c.enemyProfiles[v.kind]);
   }
  }
  const total=r=>r.waves.reduce((s,w)=>s+w.count,0);
  assert.ok(total(fork.routes.hard)>total(fork.routes.safe));assert.ok(fork.routes.hard.exitReinforcements>fork.routes.safe.exitReinforcements);
  previousEnd=fork.endAt;
 }
 for(const p of lv.commonWaves){id(p.id);assert.ok(p.at<=lv.runDuration-c.fork.stopSpawnsBeforeBossSeconds);}
 // Count upper bounds only; NOT achieved kills or simulated gameplay results.
 const base=lv.warmup.count+lv.commonWaves.reduce((s,p)=>s+p.count,0);
 const sum=mode=>base+lv.forks.reduce((s,f)=>s+f.routes[mode].waves.reduce((t,p)=>t+p.count,0),0);
 assert.ok(sum('safe')>=80);
 sums.push({level:lv.id,allSafePlannedEnemies:sum('safe'),allHardPlannedEnemies:sum('hard'),observedKills:null});
}
for(const boss of b.bosses){assert.equal(boss.attacks.length,2);assert.equal(boss.order.length,2);for(const attack of boss.attacks){id(attack.id);assert.ok(boss.order.includes(attack.id));assert.ok(attack.telegraphTicks>=66);assert.ok(attack.recoveryTicks>0);assert.ok(attack.loss>0);assert.ok(attack.geometry.kind);}}
const out={status:'pass',scope:'package_config_only_not_cocos_or_phone',levels:3,forks:9,routeVariants,configuredBranchPackets:packets,checks:['stable ids','references','route windows','preview and gate separation','spawn cutoff','enemy composition','reward ordering','growth thresholds','boss move counts'],plannedCountUpperBounds:sums,gameplayValidated:false};
writeFileSync(new URL('evidence/package-check.json',root),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out,null,2));
