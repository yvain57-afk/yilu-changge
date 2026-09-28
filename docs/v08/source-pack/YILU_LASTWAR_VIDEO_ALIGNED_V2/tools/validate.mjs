import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const load = file => JSON.parse(readFileSync(new URL(`../config/${file}`, import.meta.url),'utf8'));
const runner=load('runner.json'), data=load('levels.json');
assert.equal(runner.profileId,data.profileId);
assert.equal(data.levels.length,3);
const allIds=new Set();let objectCount=0,waveCount=0;
for(const level of data.levels){
 assert.ok(level.startCount>0&&level.startCount<=runner.simulation.maxSquadCount);
 const addId=id=>{assert.ok(!allIds.has(id),`duplicate id ${id}`);allIds.add(id);};addId(level.id);
 for(const o of level.objects){
  addId(o.id);objectCount++;assert.ok(o.at>0&&o.at<=level.routeEnd);
  assert.ok(Math.abs(o.x)+o.halfWidth<=1,`${o.id}: off-road geometry`);
  if(o.kind==='mutableGate'){assert.ok(Number.isInteger(o.value));assert.ok(o.damagePerPoint>0);}
  else {assert.ok(o.hp>0);assert.ok(o.reward);const r=o.reward;
   if(r.kind==='troops')assert.ok(Number.isInteger(r.count)&&r.count>0);
   else if(r.kind==='equipment')assert.ok([1,2].includes(r.stage));
   else if(r.kind==='fieldCompanion')assert.equal(r.id,'zhao_yun_guest');
   else if(r.kind==='chain')assert.ok(r.count>0&&r.count<=runner.chain.maximumPerGenerator&&r.value===1);
   else throw Error(`Unknown reward ${r.kind}`);
  }
 }
 let total=0;for(const w of level.enemyWaves){addId(w.id);waveCount++;total+=w.count;assert.ok(w.spawnAt>=0&&w.spawnAt<level.routeEnd);assert.ok(w.count>0&&w.hpEach>0&&w.spawnAhead<=runner.simulation.horizonWorldUnits);}
 if(level.objective.kind==='clearEnemies')assert.equal(total,level.objective.plannedEnemyCount,`${level.id}: enemy count mismatch`);
 if(level.largeEnemy)assert.equal(level.largeEnemy.hp,level.objective.bossHp);
}
assert.deepEqual(runner.gates.operations,['signedAdd']);
assert.equal(runner.growth.killXp,false);assert.equal(runner.audio.bgmEnabled,false);
console.log(JSON.stringify({status:'pass',scope:'PACK CONFIG ONLY; NO COCOS EXECUTION',levels:data.levels.length,objects:objectCount,enemyWaves:waveCount,uniqueIds:allIds.size},null,2));
