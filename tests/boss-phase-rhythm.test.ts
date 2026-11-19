import test from 'node:test';
import assert from 'node:assert/strict';
import {createBattle} from '../assets/scripts/formal/battle';
import {FormalStore} from '../assets/scripts/formal/store';
import {CHAPTERS,requiredOfficers,difficultyFor} from '../assets/scripts/formal/data';
import {configureLegalLoadout} from '../tools/r3-combat/legal-loadout';
import {combatReviewTarget} from '../assets/scripts/formal/CombatReviewPolicy';

function reference(chapter:number){
 const store=new FormalStore({getItem:()=>null,setItem:()=>{}});
 for(let c=0;c<chapter;c++){store.settle({id:'mechanism-'+c,chapter:c,won:true,troops:40,treasures:[],defeatedBossId:CHAPTERS[c].boss,defeatedOfficerIds:requiredOfficers(c)});store.acknowledgePresentation();}
 configureLegalLoadout(store);
 const b=createBattle({chapter,lineup:store.loadout(),seed:7919}),attacks=new Map<string,any>();
 for(let i=0;i<60*240&&!b.state.ended;i++){
  if(i%6===0){const target=combatReviewTarget(b.snapshot(),'normal');if(target!==null)b.move(target);}
  b.step();b.drainAudioEvents();const boss=b.state.boss,t=boss?.telegraph;if(!t)continue;
  if(!attacks.has(t.id))attacks.set(t.id,{style:boss.attackPattern.style,phase:(boss.campaignPhase||0)+1,created:t.created,execute:t.execute,releasedAt:null});
  if(t.released&&!attacks.get(t.id).releasedAt)attacks.get(t.id).releasedAt=b.state.t;
 }
 assert.equal(b.snapshot().phase,'won');return [...attacks.values()];
}

test('chapter two changes from sweep to thrust across its health phase without repeating the sequence',()=>{
 const attacks=reference(1),released=attacks.filter(a=>a.releasedAt!==null);
 assert.deepEqual(released.slice(0,2).map(a=>a.style),['sweep','thrust']);
 for(const a of released){assert.ok(a.execute-a.created>=1.6-1e-8);assert.ok(a.releasedAt>=a.execute);}
});

test('final chapter demonstrates each phase in the earned reference loadout with full readable warnings',()=>{
 const attacks=reference(19),released=attacks.filter(a=>a.releasedAt!==null);
 for(const [i,style] of ['formation','double','sequential'].entries())assert.ok(released.some(a=>a.phase===i+1&&a.style===style),style);
 for(const a of released){assert.ok(a.execute-a.created>=difficultyFor(19).minimumTelegraph-1e-8);assert.ok(a.releasedAt>=a.execute);}
});

function isolated(){
 const store=new FormalStore({getItem:()=>null,setItem:()=>{}}),b=createBattle({chapter:19,lineup:{...store.loadout(),companions:['lubu','zhao','zhang']}}),s=b.state;
 Object.assign(s,{course:[],courseLen:999999,dist:0,speed:0,show:1e5,volleyT:1e5,heroX:0,targetX:0,ents:[]});
 s.companions.forEach(c=>c.t=-1e5);
 s.boss={person:'lukang',name:'陆抗',hp:70,max:100,trail:70,phase:'idle',pt:0,band:[-.5,.5],z:2,hit:0,flags:4,flagFx:[],cycleN:1};
 return {b,s};
}
function shot(s:any,id:number,dmg:number){s.waves.push({projectileId:id,attackId:'phase-test-'+id,source:'fixture',x:0,x0:0,z:1,z0:1,speed:100,range:10,t:0,hits:new Set(),pierce:1,dmg,hw:.2});}

test('phase-opening first attack has priority over uncommitted enemies and retains its complete warning',()=>{
 const {b,s}=isolated();s.ents=[{id:9,type:'enemy',enemyKind:'archer',hp:100,x:.55,d:12,walk:0,dead:0,phase:'idle',pt:9}];
 shot(s,1,50);b.step();assert.equal(s.boss.phaseOpening,true);assert.equal(s.boss.campaignPhase,1);
 for(let i=0;i<20;i++){b.step();assert.notEqual(s.ents[0].phase,'warn');}
 for(let i=0;i<60&&s.boss.phase!=='warn';i++)b.step();
 assert.equal(s.boss.phase,'warn');assert.equal(s.boss.attackPattern.style,'double');assert.equal(s.boss.phaseOpening,false);
 assert.ok(s.boss.telegraph.execute-s.boss.telegraph.created>=1.15-1e-8);
 assert.ok(s.boss.band[0]<0&&s.boss.band[1]>0,'opening cut still threatens the current hero');
});

test('pending phase introduction never absorbs damage or locks boss HP',()=>{
 const {b,s}=isolated();shot(s,1,50);b.step();assert.equal(s.boss.phaseOpening,true);assert.equal(s.boss.hp,55);
 shot(s,2,1000);b.step();assert.equal(s.boss.hp,0);b.step();assert.equal(s.boss.phase,'spent');
});
