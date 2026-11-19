import test from 'node:test';
import assert from 'node:assert/strict';
import {dragTarget} from '../assets/scripts/formal/DragSteering';
import {constrainMarch} from '../assets/scripts/formal/RouteCollision';
import {CHAPTERS,routeFor,requiredOfficers} from '../assets/scripts/formal/data';
import {FormalStore} from '../assets/scripts/formal/store';
import {createBattle} from '../assets/scripts/formal/battle';

test('fast reverse drag reverses now, with no queued motion into an edge or wall',()=>{
 assert.ok(dragTarget(0,.6,-.05)<0);
 assert.equal(dragTarget(-.68,-.68,-1),-.68);
 assert.ok(dragTarget(-.68,-.68,.05)>-.68);
 assert.equal(dragTarget(0,0,NaN),0);
});
test('both fence entrances stop forward travel and lateral crossing stays blocked until the exit',()=>{
 for(const side of [-1,1]){
  const walls=[{type:'wall',d:10,len:6,side}];
  let p=constrainMarch(walls,9,12,side*.6,side*.6);
  assert.equal(p.dist,9.6);assert.equal(p.x,side*.6);assert.equal(p.blocked,true);
  p=constrainMarch(walls,p.dist,10.2,-side*.5,-side*.5);assert.equal(p.dist,10.2);
  for(let d=10.2;d<16.4;d+=.1){p=constrainMarch(walls,d,d+.1,side*.6,side*.6);assert.ok(p.x*side<=-.42);assert.ok(p.target*side<=-.42);}
  p=constrainMarch(walls,16.5,16.6,side*.6,side*.6);assert.equal(p.x,side*.6);
 }
});
test('all chapters keep entire paired decisions and chest footprints clear of fences',()=>{
 for(let c=0;c<20;c++){
  const r=routeFor(c,['spear'],[]),walls=r.filter(e=>e.type==='wall');
  for(const crate of r.filter(e=>e.type==='crate'))for(const w of walls){
   if(crate.d>=w.d-1.2&&crate.d<=w.d+w.len!+1.2)assert.ok(crate.x!*w.side!<=-.3,`${c}:${crate.kind}`);
  }
  const choices=r.filter(e=>e.type==='crate'&&e.choiceId);
  assert.equal(choices.length,4);
  for(const id of new Set(choices.map(e=>e.choiceId))){const pair=choices.filter(e=>e.choiceId===id);assert.equal(pair[0].d,pair[1].d);assert.equal(pair[0].x,-pair[1].x);}
 }
});
function fixture(){const db=new Map<string,string>(),io={getItem:(k:string)=>db.get(k)??null,setItem:(k:string,v:string)=>{db.set(k,v);}};return {io,store:new FormalStore(io)};}
test('victory banks earned equipment once, equips immediately and survives reload; defeat grants none',()=>{
 const {io,store}=fixture();
 store.settle({id:'loss',chapter:0,won:false,troops:0,treasures:['mengde'],weapons:['qinggang']});
 assert.equal(store.data.weapons.includes('qinggang'),false);assert.equal(store.data.treasures.includes('mengde'),false);
 const win={id:'win',chapter:0,won:true,troops:30,treasures:['mengde','mengde'],weapons:['qinggang','qinggang','invalid'],defeatedBossId:CHAPTERS[0].boss,defeatedOfficerIds:requiredOfficers(0)};
 assert.ok(store.settle(win));assert.ok(store.selectWeapon('qinggang'));assert.ok(store.equipTreasure('mengde'));
 const loaded=new FormalStore(io);assert.equal(loaded.loadout().startWeaponId,'qinggang');assert.equal(loaded.loadout().treasures.dian,'mengde');
 assert.equal(loaded.data.weapons.filter(x=>x==='qinggang').length,1);assert.equal(loaded.settle(win),false);
});
test('a companion owns its signature independently of the hero weapon and uses real boosted attacks',()=>{
 const {store}=fixture();store.data.weapons.push('qinggang');store.data.captures.push('zhao');store.data.companions=['zhao'];
 const b=createBattle({chapter:0,lineup:store.loadout()}),s=b.state;
 Object.assign(s,{course:[],ents:[],speed:0,show:1e5,volleyT:1e5});
 assert.equal(s.weapon,'spear');assert.equal(b.snapshot().companionEquipment[0].weaponId,'qinggang');
 for(let i=0;i<100;i++)b.step();
 assert.ok(s.resUsed.zhao);assert.ok(b.drainAudioEvents().some((e:any)=>e.sourceActorId==='companion:zhao'&&e.weaponId==='qinggang'));
 assert.ok(s.log.some((e:any)=>e.kind==='resonance'));
 const baseline=createBattle({chapter:0,lineup:{...store.loadout(),weapons:['spear']}});
 assert.equal(baseline.snapshot().companionEquipment[0].weaponId,null);
});
test('battle movement uses solid entry collision rather than teleporting through the wood',()=>{
 const {store}=fixture(),b=createBattle({chapter:0,lineup:store.loadout()}),s=b.state;
 Object.assign(s,{course:[],ents:[{type:'wall',id:999,d:10,len:6,side:1}],dist:9.59,speed:5,heroX:.6,targetX:.6,show:1e5,volleyT:1e5});
 b.step();assert.equal(s.dist,9.6);assert.ok(s.heroX>.5);
 b.move(-.6);for(let i=0;i<50;i++)b.step();assert.ok(s.dist>10);assert.ok(s.heroX<-.42);
 b.move(.6);for(let i=0;i<20;i++)b.step();assert.ok(s.heroX<=-.42);
});
