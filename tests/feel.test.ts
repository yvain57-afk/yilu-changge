import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Journey,STEP} from '../assets/scripts/core/model';
import {V07_LEVELS as LEVELS} from '../assets/scripts/core/levels';
import {Volleys,VOLLEY_CAPACITY,bowMouth} from '../assets/scripts/Volley';
import {formation,project} from '../assets/scripts/VisualConfig';
import {worldStrip,gaitFrame} from '../assets/scripts/WorldScenery';

for(const count of [1,8,24,48,256])test(`volley ${count}: own bow mouths, frozen launch, v04 archer-only damage`,()=>{
 const j=new Journey({...LEVELS[0],start:count,rows:[],obstacles:[]}),v=new Volleys();j.advance(STEP);const events=j.drainFeedback();v.accept(events);
 if(count===1){assert.equal(events.filter(e=>e.kind==='shot').length,0);assert.equal(j.arrows.length,0);assert.equal(v.groups.length,0);return;}
 const shot=events.find(e=>e.kind==='shot')!,a=j.arrows[0],n=Math.min(count,48)-1,points=v.points({...a,z:shot.worldZ!},j.z);
 assert.equal(shot.amount,(count-1)*.2);assert.equal(points.length,n);assert.equal(j.arrows.length,1);assert.ok(Object.isFrozen(shot.volley));
 formation(count,shot.x).filter(u=>!u.hero).forEach((u,i)=>{const m=bowMouth(u.hero);assert.ok(Math.abs(points[i].x-u.x-m.x)<1e-6);assert.ok(Math.abs(points[i].y-u.y-m.y)<1e-6);});
 const frozen=JSON.stringify(v.groups);j.move(.9);for(let i=0;i<5;i++)j.advance(STEP);assert.equal(JSON.stringify(v.groups),frozen);
 const g=v.groups[0],end=v.points({...a,z:g.aimZ},j.z);assert.ok(end.every(p=>Math.abs(p.x-project(a.x,g.aimZ-j.z).x)<1e-8));
});
test('rock consumes the whole visual volley; no repeated damage or surviving cosmetic arrows',()=>{
 const j=new Journey({...LEVELS[0],start:48,rows:[],obstacles:[{id:99,at:.7,x:0,width:.5,hp:1,kind:'rock',loss:1}]}),v=new Volleys();
 for(let i=0;i<4;i++){j.advance(STEP);v.accept(j.drainFeedback());v.retain(j.arrows);}
 assert.equal(j.obstacles[0].hp,1);assert.equal(j.arrows.length,0);assert.equal(v.groups.length,0);
});
test('bounded high density volley fixture, camera travel and boss stop',()=>{
 const j=new Journey({...LEVELS[0],start:256,duration:100,rows:[],obstacles:[]}),v=new Volleys();let peak=0;
 for(let i=0;i<60*20;i++){j.advance(STEP);v.accept(j.drainFeedback());v.retain(j.arrows);const n=v.groups.reduce((n,g)=>n+g.origins.length,0);peak=Math.max(peak,n);assert.ok(n<=VOLLEY_CAPACITY);}
 assert.ok(peak>=144);v.clear();assert.equal(v.groups.length,0);
});
test('world strip recycles only offscreen and retained objects keep identity and continuous projection',()=>{
 for(const spacing of [1.25,2.4])for(let step=1;step<60*18;step++){
  const z=step/60,prev=worldStrip(z-1/60,spacing,spacing===1.25?24:12),curr=worldStrip(z,spacing,spacing===1.25?24:12);
  for(const a of prev){const b=curr.find(b=>b.id===a.id);if(b){assert.equal(b.worldZ,a.worldZ);assert.equal(b.slot,a.slot);assert.ok(Math.abs(b.y-a.y+104/60)<1e-8);}else assert.ok(a.y+400 < -780,'whole object below tallest supported viewport');}
  for(const b of curr)if(!prev.some(a=>a.id===b.id))assert.ok(b.y>780,'replacement beyond top');
 }
 assert.deepEqual(worldStrip(54),worldStrip(54));assert.deepEqual(worldStrip(0),worldStrip(0));
});
test('six distinct gait keys with phase offset between soldiers',()=>{
 assert.equal(new Set(Array.from({length:6},(_,i)=>gaitFrame((i+.1)*.66/6))).size,6);
 assert.notEqual(gaitFrame(.1,0),gaitFrame(.1,2));
});
