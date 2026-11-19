import test from 'node:test';
import assert from 'node:assert/strict';
import {TREASURES} from '../assets/scripts/formal/data';
import {createRunGrowth,grantRunGrowth,runGrowthStats,treasureGrowth,TREASURE_GROWTH} from '../assets/scripts/formal/RunGrowth';

test('a new run copies only valid unique equipped relics and never mutates saved loadout',()=>{
 const worn=['taiping','huxinjing','taiping','missing','__proto__'];
 const saved={treasures:worn,slots:{dian:'taiping',qi:'huxinjing',ma:null},other:{keep:true}},before=JSON.stringify(saved);
 Object.freeze(worn);
 const g=createRunGrowth(worn);
 assert.deepEqual(g.relics,['taiping','huxinjing']);
 grantRunGrowth(g,'treasure','chitu');grantRunGrowth(g,'power');
 assert.equal(JSON.stringify(saved),before);
 assert.deepEqual(runGrowthStats(createRunGrowth([])),{damage:1,speed:1,shield:0,effects:[]});
});

test('an offensive reward changes damage immediately, while haste and guard affect their own stats',()=>{
 const g=createRunGrowth([]);
 grantRunGrowth(g,'power');assert.equal(runGrowthStats(g).damage,1.12);
 grantRunGrowth(g,'haste');assert.equal(runGrowthStats(g).speed,1.06);
 grantRunGrowth(g,'guard');assert.equal(runGrowthStats(g).shield,1);
 assert.equal(runGrowthStats(g).damage,1.12);assert.equal(g.pickups,3);
});

test('different treasure passives coexist even when they have the same equipment slot',()=>{
 const g=createRunGrowth(['taiping']);
 grantRunGrowth(g,'treasure','mengde');grantRunGrowth(g,'treasure','muniu');
 assert.deepEqual(g.relics,['taiping','mengde','muniu']);
 assert.deepEqual(runGrowthStats(g).effects,['thunder','blade','flame']);
 assert.equal(runGrowthStats(g).damage,1.24);
});

test('duplicate relics become damage growth and cannot duplicate the passive or original relic',()=>{
 const g=createRunGrowth(['taiping']),r=grantRunGrowth(g,'treasure','taiping');
 assert.deepEqual(g.relics,['taiping']);assert.equal(g.power,1);
 assert.deepEqual(runGrowthStats(g).effects,['thunder']);
 assert.ok(Math.abs(runGrowthStats(g).damage-1.20)<1e-9);
 assert.match(r.detail,/12%/);assert.equal(r.icon,TREASURES.taiping.icon);
});

test('growth and shield are bounded under repeated pickups, without claiming a capped bonus',()=>{
 const g=createRunGrowth(Object.keys(TREASURES));
 for(let i=0;i<30;i++){grantRunGrowth(g,'power');grantRunGrowth(g,'guard');grantRunGrowth(g,'haste');}
 assert.equal(g.power,8);assert.equal(g.guard,4);assert.equal(g.haste,4);
 assert.deepEqual(runGrowthStats(g),{damage:2.4,speed:1.24,shield:5,effects:['thunder','blade','flame']});
 for(const k of ['power','guard','haste'] as const)assert.match(grantRunGrowth(g,k).detail,/上限/);
 assert.match(grantRunGrowth(g,'treasure','taiping').detail,/上限/);
});

test('defensive relics provide one shield each and do not invent offensive effects',()=>{
 const g=createRunGrowth(['huxinjing','qingnang']);
 assert.equal(runGrowthStats(g).shield,2);assert.deepEqual(runGrowthStats(g).effects,[]);
 grantRunGrowth(g,'guard');assert.equal(runGrowthStats(g).shield,3);
});

test('every released treasure has a named passive and valid original icon',()=>{
 assert.deepEqual(Object.keys(TREASURE_GROWTH).sort(),Object.keys(TREASURES).sort());
 for(const id of Object.keys(TREASURES)){
  const g=createRunGrowth([]),r=grantRunGrowth(g,'treasure',id),p=treasureGrowth(id);
  assert.ok(['thunder','flame','blade','shield'].includes(p.effect));
  assert.ok(p.summary.length>8);assert.match(p.color,/^#[0-9A-F]{6}$/);
  assert.equal(r.icon,TREASURES[id].icon);assert.equal(runGrowthStats(g).damage,1.08);
 }
});

test('invalid treasure grants fail before changing the run or counting a pickup',()=>{
 for(const id of [undefined,'missing','__proto__']){
  const g=createRunGrowth([]),before=JSON.stringify(g);
  assert.throws(()=>grantRunGrowth(g,'treasure',id),/unknown_growth_treasure/);
  assert.equal(JSON.stringify(g),before);
 }
 assert.throws(()=>treasureGrowth('__proto__'),/unknown_growth_treasure/);
});
