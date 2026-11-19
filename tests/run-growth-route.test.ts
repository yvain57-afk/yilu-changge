import test from 'node:test';
import assert from 'node:assert/strict';
import {CHAPTERS,WEAPON_DATA,TREASURES,PACING,routeFor,marchSpeed,difficultyFor,requiredOfficers} from '../assets/scripts/formal/data';
import {ENEMY_PROFILES,volleyBonus} from '../assets/scripts/formal/EnemyProfiles';
import {resolveActorPresentation} from '../assets/scripts/formal/ActorPresentation';
const growthKinds=['power','guard','haste','weapon','arms','treasure','general'];

test('all twenty routes put useful growth before the first regular pressure and never leave an eight second growth gap',()=>{
 for(let c=0;c<CHAPTERS.length;c++){
  const r=routeFor(c,['spear'],[]),speed=marchSpeed(c),times=[...new Set(r.filter(e=>e.type==='crate'&&growthKinds.includes(e.kind!)).map(e=>e.d/speed))].sort((a,b)=>a-b);
  assert.ok(Math.abs(times[0]-6)<1e-8,CHAPTERS[c].id);
  assert.ok(r.filter(e=>e.waveId?.includes(':normal:')).every(e=>e.d/speed>=11));
  for(let i=1;i<times.length;i++)assert.ok(times[i]-times[i-1]<=8.001,`${CHAPTERS[c].id}: ${times[i-1]} -> ${times[i]}`);
  assert.ok(PACING.marchSeconds[c]-times.at(-1)!<=4,CHAPTERS[c].id);
  for(const kind of ['power','guard','haste','general'])assert.ok(r.some(e=>e.kind===kind),CHAPTERS[c].id+':'+kind);
  assert.equal(r.filter(e=>e.kind==='arms').length,2);
  assert.equal(r.filter(e=>e.kind==='treasure').length,2);
 }
});

test('first three chapters keep fresh basic arrows above the light soldier one hit threshold',()=>{
 for(let c=0;c<3;c++)for(const troops of [20,30,40])assert.ok(ENEMY_PROFILES.light.hp*difficultyFor(c).ordinaryHPMultiplier<=volleyBonus(troops));
 assert.ok(difficultyFor(3).ordinaryHPMultiplier>=difficultyFor(2).ordinaryHPMultiplier);
});

test('ordinary wave headcounts ramp monotonically within every route and are independent of the selected loadout',()=>{
 for(let c=0;c<CHAPTERS.length;c++){
  const a=routeFor(c,['spear'],[]),b=routeFor(c,Object.keys(WEAPON_DATA),Object.keys(TREASURES),'huaji');
  assert.deepEqual(a.filter(e=>e.type==='squad'),b.filter(e=>e.type==='squad'));
  const counts=new Map<string,number>();
  for(const e of a.filter(e=>e.waveId?.includes(':normal:'))){const key=e.waveId!.split(':').slice(0,3).join(':');counts.set(key,(counts.get(key)||0)+e.n!);}
  const n=[...counts.values()];assert.ok(n.length>3);
  for(let i=1;i<n.length;i++)assert.ok(n[i]>=n[i-1],`${CHAPTERS[c].id} wave ${i}: ${n[i-1]} -> ${n[i]}`);
  assert.ok(n.at(-1)!>n[0],CHAPTERS[c].id);
 }
});

test('two upgrade chests target the held weapon and the third preserves all owned weapon replay coverage',()=>{
 const found=new Set<string>();
 for(let c=0;c<CHAPTERS.length;c++){
  const r=routeFor(c,Object.keys(WEAPON_DATA),[],'spear'),weapons=r.filter(e=>e.kind==='weapon'),upgrades=weapons.filter(e=>e.upgrade);
  assert.equal(weapons.length,3);assert.equal(upgrades.length,2);assert.ok(upgrades.every(e=>e.gives==='spear'));assert.ok(weapons.slice(0,2).every(e=>e.upgrade));
  weapons.forEach(e=>found.add(e.gives!));
 }
 assert.deepEqual([...found].sort(),Object.keys(WEAPON_DATA).sort());
});

test('temporary route rewards are explicit, valid and never enlist the current opposing officer',()=>{
 for(let c=0;c<CHAPTERS.length;c++){
  const r=routeFor(c,['spear'],[]),general=r.find(e=>e.kind==='general')!,hostiles=[CHAPTERS[c].boss,...requiredOfficers(c)];
  assert.equal(general.trial,true);assert.ok(!hostiles.includes(general.gives!),CHAPTERS[c].id+':'+general.gives);
  for(const pose of ['run','wind','rel','rec'] as const)assert.doesNotThrow(()=>resolveActorPresentation('ally',general.gives!,pose),general.gives+':'+pose);
  for(const e of r.filter(e=>e.type==='crate')){
   if(e.kind==='weapon'){assert.ok(WEAPON_DATA[e.gives as keyof typeof WEAPON_DATA]);if(e.gives!=='spear')assert.equal(e.trial,true);}
   if(e.kind==='treasure'){assert.ok(TREASURES[e.gives!]);assert.equal(e.trial,true);}
  }
 }
});


test('growth chests during a wall occupy its traversable side',()=>{
 for(let c=0;c<20;c++){
  const r=routeFor(c,['spear'],[]);
  for(const e of r.filter(e=>e.type==='crate'&&!e.choiceId)){
   const wall=r.find(w=>w.type==='wall'&&e.d>=w.d&&e.d<=w.d+w.len!);
   if(wall)assert.ok(e.x!*wall.side!<0,CHAPTERS[c].id+':'+e.kind);
  }
 }
});

import {createBattle} from '../assets/scripts/formal/battle';
import {FormalStore} from '../assets/scripts/formal/store';

test('fresh first three chapters demonstrate a real owner pair and earned weapons persist on victory and trial generals remain temporary',()=>{
 const memory=new Map<string,string>(),store=new FormalStore({getItem:k=>memory.get(k)??null,setItem:(k,v)=>{memory.set(k,v);}});
 for(let chapter=0;chapter<3;chapter++){
  const lineup=store.loadout(),r=routeFor(chapter,lineup.weapons,lineup.treasurePool,lineup.startWeaponId),general=r.find(e=>e.kind==='general')!,weapon=r.find(e=>e.kind==='weapon'&&!e.upgrade)!;
  assert.equal(WEAPON_DATA[weapon.gives as keyof typeof WEAPON_DATA].owner,general.gives,CHAPTERS[chapter].id);
  const b=createBattle({chapter,lineup,seed:7919}),s=b.state;
  Object.assign(s,{course:[],speed:0,show:1e5,volleyT:1e5,ents:[]});
  for(const [i,drop] of [general,weapon].entries()){
   s.ents=[{...drop,id:100+i,d:s.dist+2,x:0,hp:1,max:1,open:0}];
   s.waves=[{source:'fixture',x:0,x0:0,z:1,z0:1,speed:100,range:10,t:0,hits:new Set(),pierce:1,dmg:2,hw:.2}];b.step();
  }
  assert.equal(s.weapon,weapon.gives);assert.ok(s.companions.some(c=>c.id===general.gives));
  assert.ok(s.growthNotices.some(n=>n.detail.includes('神兵共鸣')),'the actual paired pickup announces resonance');
  const borrowed=weapon.trial?weapon.gives:null;
  assert.equal(store.settle({id:'owner-pair-'+chapter,chapter,won:true,troops:40,treasures:s.runGot,weapons:s.runWeapons,defeatedBossId:CHAPTERS[chapter].boss,defeatedOfficerIds:requiredOfficers(chapter)}),true);
  if(borrowed&&borrowed!==CHAPTERS[chapter].weapon)assert.ok(store.data.weapons.includes(borrowed!),'picked-up weapon must enter victory rewards');
  if(!CHAPTERS.slice(0,chapter+1).some(c=>c.capture.includes(general.gives!)))assert.ok(!store.data.captures.includes(general.gives!),'trial ally must not enter permanent rewards');
  store.acknowledgePresentation();
 }
});

test('all-owned replay retains complete weapon coverage for every selected start weapon',()=>{
 const all=Object.keys(WEAPON_DATA);
 for(const selected of all){
  const found=new Set<string>();
  for(let c=0;c<20;c++)routeFor(c,all,[],selected).filter(e=>e.kind==='weapon').forEach(e=>found.add(e.gives!));
  assert.deepEqual([...found].sort(),[...all].sort(),selected);
 }
});
