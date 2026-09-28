import test from 'node:test';
import assert from 'node:assert/strict';
import { createGate, damageGate, gateLabel, gateIsSafe, consumeGate, createCrate, damageCrate, equipmentStage, chainTokens, feetOverlapGate, emitterWeights, chooseNearest, snapshotShot } from '../reference/rules.mjs';

test('negative gate can cross zero into positive through real damage', () => {
 const g = createGate({id:'gate',value:-5,damagePerPoint:2});
 for(let i=0;i<5;i++) damageGate(g,2,`p${i}`);
 assert.equal(g.value,0); assert.equal(gateLabel(g),'+0'); assert.equal(gateIsSafe(g),true);
 damageGate(g,6,'p6'); assert.equal(gateLabel(g),'+3');
});
test('positive gates improve; fractional progress is retained', () => {
 const g=createGate({id:'gate',value:2,damagePerPoint:2}); damageGate(g,1,'a');assert.equal(g.value,2);
 damageGate(g,1,'b');assert.equal(g.value,3);damageGate(g,4,'c');assert.equal(g.value,5);
});
test('duplicate rendering/hit event cannot grow a gate again', () => {
 const g=createGate({id:'gate',value:0});damageGate(g,2,'same');damageGate(g,2,'same');assert.equal(g.value,1);
});
test('gate grants only once on actual caller-established contact', () => {
 const g=createGate({id:'gate',value:3});assert.equal(g.value,3);
 const a=consumeGate(g,2);assert.equal(a.count,5);const b=consumeGate(g,5);assert.equal(b.count,5);assert.equal(b.consumed,false);
});
test('different gates do not share an invented whole-row mutex', () => {
 const a=createGate({id:'row:a',value:2}),b=createGate({id:'row:b',value:3});
 assert.equal(consumeGate(b,consumeGate(a,1).count).count,6);
});
test('lethal negative gate ends run and positive gate cannot resurrect', () => {
 const a=createGate({id:'negative',value:-40}),b=createGate({id:'positive',value:50});
 const r=consumeGate(a,12);assert.equal(r.count,0);assert.equal(r.delta,-12);assert.equal(r.lost,true);
 assert.equal(consumeGate(b,r.count).count,0);
});
test('positive gain respects explicit prototype cap', () => {
 const g=createGate({id:'gate',value:30});const r=consumeGate(g,250);assert.equal(r.count,256);assert.equal(r.delta,6);
});
test('60 durability is not 60 reward soldiers', () => {
 const c=createCrate({id:'barrel',hp:60,reward:{kind:'troops',count:3}});
 assert.equal(damageCrate(c,59,'one').reward,null);const r=damageCrate(c,20,'two');
 assert.equal(r.actualDamage,1);assert.equal(r.reward.count,3);assert.equal(c.hp,0);assert.equal(damageCrate(c,1,'three').reward,null);
});
test('unfinished crate does not grant reward; duplicate hits are not new damage', () => {
 const c=createCrate({id:'barrel',hp:20,reward:{kind:'equipment',stage:1}});
 damageCrate(c,5,'p');damageCrate(c,5,'p');assert.equal(c.hp,15);assert.equal(c.claimed,false);
});
test('equipment rewards use absolute stage, never repeated free increments', () => {
 assert.equal(equipmentStage(0,1),1);assert.equal(equipmentStage(1,1),1);assert.equal(equipmentStage(2,1),2);
});
test('chain has unique nonshootable +1 tokens and only crossed tokens count', () => {
 const tokens=chainTokens('special',8,.5,10);assert.equal(new Set(tokens.map(x=>x.id)).size,8);
 let n=2;for(const g of tokens.slice(0,3)){damageGate(g,100,'p');assert.equal(g.value,1);n=consumeGate(g,n).count;}
 assert.equal(n,5);assert.equal(tokens.filter(x=>x.consumed).length,3);
});
test('real member edge overlap is checked, not only leader center or empty bounding box', () => {
 const rect={left:.3,right:.7,back:0,front:.08};
 assert.equal(feetOverlapGate([{x:0,z:0,radius:.025},{x:.29,z:.04,radius:.025}],rect),true);
 assert.equal(feetOverlapGate([{x:0,z:0,radius:.025},{x:.27,z:.04,radius:.025}],rect),false);
});
test('capped visual soldiers preserve 256-unit fire budget and count special roles once', () => {
 for(const n of [0,1,2,8,48,50,256]) for(const comp of [false,true]){
  const r=emitterWeights(n,48,comp);assert.equal(r.reduce((s,x)=>s+x.weight,0),n);assert.ok(r.length<=48);
  assert.equal(r.filter(x=>x.role==='hero').length,n?1:0);
 }
});
test('first impact takes priority independent of array order; shot snapshot cannot follow player', () => {
 assert.equal(chooseNearest([{id:'rear',t:.8},{id:'crate',t:.3}]).id,'crate');
 const original={x:.5,z:1,damage:2,stage:1,tick:30};const shot=snapshotShot(original);original.x=-.5;
 assert.equal(shot.x,.5);assert.ok(Object.isFrozen(shot));
});
test('invalid data fails explicitly', () => {
 assert.throws(()=>createGate({id:'bad',value:0,damagePerPoint:0}));
 assert.throws(()=>damageGate(createGate({id:'g',value:0}),NaN,'p'));
 assert.throws(()=>chainTokens('s',13,0,1));
});
