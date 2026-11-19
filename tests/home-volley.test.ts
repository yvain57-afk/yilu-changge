import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import ts from 'typescript';import {createRequire} from 'node:module';
import {volleyArrowCount,volleyTrails,volleyPoint} from '../assets/scripts/formal/VolleyPresentation';
import {armySlots} from '../assets/scripts/formal/presentation';
import {createBattle} from '../assets/scripts/formal/battle';
import {FormalStore} from '../assets/scripts/formal/store';
import {host} from './ui-full-runtime.test';
const lineup=()=>new FormalStore({getItem:()=>null,setItem(){}}).loadout();
test('10 through 300 troops visibly scale each volley, bounded even at 2000',()=>{
 const sizes=[10,30,80,160,300],counts=sizes.map(volleyArrowCount);
 assert.deepEqual(counts,[8,24,42,62,96]);assert.equal(volleyArrowCount(0),0);assert.equal(volleyArrowCount(2000),96);
 for(const n of sizes){const slots=armySlots(n,.6,1).map((s,slotIndex)=>({...s,slotIndex})),groups=volleyTrails(n,slots,8),v=groups.flat();assert.equal(v.length,volleyArrowCount(n));
  for(const a of v){const s=slots[a.slotIndex];assert.equal(a.sx,s.x);assert.equal(a.sz,s.z);assert.ok(a.delay<=.18);}
  assert.equal(new Set(v.map(a=>a.slotIndex)).size,Math.min(slots.length,v.length));
 }
});
test('rank arrows start at soldiers hand height, wait for release and end with their real hit group',()=>{
 const v={sx:.4,sz:-2,slotIndex:1,delay:.1,height:.22},a={tx:-.2,tz:12,dur:.8,t:0};
 assert.equal(volleyPoint(a,v),null);assert.deepEqual(volleyPoint(a,v,.1),{x:.4,z:-2,h:.22});
 const end=volleyPoint(a,v,.79999)!;assert.ok(Math.abs(end.x-a.tx)<.001);assert.ok(Math.abs(end.z-a.tz)<.001);assert.equal(volleyPoint(a,v,.8),null);
 assert.deepEqual(volleyTrails(100,[],8).flat(),[]);
});
test('real battle emits dense volley without creating additional hit groups',()=>{
 for(const arms of ['bow','fire','repeater'])for(const n of [10,30,80,160,300]){
  const b=createBattle({chapter:0,seed:71,lineup:lineup(),viewport:{W:375,H:667,top:20,bottom:0}}),s=b.state;s.course=[];s.courseLen=1e8;s.troops=s.troopShown=n;s.arms=arms;s.volleyT=.001;b.step();
  assert.equal(s.arrows.length,Math.min(8,Math.max(2,Math.ceil(n/5))));assert.equal(s.arrows.flatMap(a=>a.visuals).length,volleyArrowCount(n));
  assert.equal(s.volleyReadout.arrows,volleyArrowCount(n));assert.equal(b.totals.damage,0);
 }
});
test('visual arrow density cannot change current combat, random outcomes or sound events',()=>{
 // Compare the same current combat engine through two genuinely different
 // presentation dependencies. The October 4 source remains historical evidence;
 // gameplay is now intentionally allowed to evolve independently of arrow art.
 const source=fs.readFileSync('assets/scripts/formal/battle.ts','utf8');
 const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
 const mod={exports:{} as any},req=createRequire(path.resolve('assets/scripts/formal/battle.ts'));
 let sparseCalls=0,suppressedArrows=0;
 const presentation={volleyPoint,volleyTrails:(troops:number,slots:any[],groups:number)=>{
  const real=volleyTrails(troops,slots,groups);sparseCalls++;suppressedArrows+=real.flat().length;
  return real.map(()=>[]); // Logical hit groups survive, visible arrow ranks do not.
 }};
 vm.runInThisContext(`(function(require,module,exports){${js}\n})`)((id:string)=>id==='./VolleyPresentation'?presentation:req(id),mod,mod.exports);
 let checkedDamage=0,checkedGateGrowth=0,checkedSounds=0;
 for(const arms of ['bow','fire','repeater'])for(const n of [10,80,300]){
  const args={chapter:2,seed:71,lineup:lineup(),viewport:{W:375,H:667,top:20,bottom:0}};
  const sparse=mod.exports.createBattle(args),dense=createBattle(args);
  for(const b of [sparse,dense]){b.state.arms=arms;b.state.troops=b.state.troopShown=n;}
  let sawDifferentTrails=false;
  for(let i=0;i<1800;i++){
   if(i%90===0)for(const b of [sparse,dense])b.move(i%180===0?-.45:.45);
   sparse.step();dense.step();
   if(dense.state.arrows.some(a=>(a.visuals||[]).length)){
    sawDifferentTrails=true;assert.ok(sparse.state.arrows.every(a=>a.visuals.length===0));
    assert.equal(sparse.state.arrows.length,dense.state.arrows.length,'display density must not add hit groups');
   }
   const audio=dense.drainAudioEvents();checkedSounds+=audio.length;assert.deepEqual(audio,sparse.drainAudioEvents());
   if(i%300===299){
    // Only the declared visual readout is omitted; random enemy walks, hit
    // results, warnings, pickups and all other snapshot fields must stay equal.
    const {armyVolley:_,...denseGame}=dense.snapshot(),{armyVolley:__,...sparseGame}=sparse.snapshot();
    assert.deepEqual(denseGame,sparseGame,`${arms}/${n} at tick ${i+1}`);
   }
  }
  assert.ok(sawDifferentTrails,`${arms}/${n} must exercise visibly different arrow ranks`);
  assert.deepEqual(dense.totals,sparse.totals);assert.deepEqual(dense.ledger,sparse.ledger);
  assert.equal(dense.state.troops,sparse.state.troops);assert.deepEqual(dense.state.stats,sparse.state.stats);
  checkedDamage+=dense.totals.damage;checkedGateGrowth+=dense.totals.gate;
 }
 assert.ok(sparseCalls>0&&suppressedArrows>0,'the replacement presentation must actually run');
 assert.ok(checkedDamage>0&&checkedGateGrowth>0&&checkedSounds>0,'the comparison must exercise real damage, gates and audio');
});
test('home keeps live weapon/progress and each navigation action on small and tall screens',()=>{
 for(const n of Array.from({length:21},(_,i)=>i))for(const [W,H] of [[320,568],[375,667],[402,874]]){
  const h=host(n);Object.defineProperty(h.g,'size',{value:{W,H,top:20,bottom:16,k:1},configurable:true});h.g.show('home');
  for(const hit of h.g.hits){assert.ok(hit.y>=20);assert.ok(hit.y+hit.h<=H-16,hit.id);assert.ok(hit.w>=44&&hit.h>=44);}
  for(const record of h.ui.textRecords){if(record.container){const a=record.bounds,b=record.container;assert.ok(a.y+a.h<=b.y+b.h+1,record.text);}}
  assert.ok(h.ui.textRecords.some(x=>x.text.includes('已克 '+n+'/20')));assert.ok(h.ui.textRecords.some(x=>x.text.includes('永久 Lv.')));
  h.click('start');assert.equal(h.g.screen,'prepare');h.g.show('home');h.click('collection');assert.equal(h.g.screen,'collection');h.g.show('home');h.click('chapters');assert.equal(h.g.screen,'chapters');
 }
});
