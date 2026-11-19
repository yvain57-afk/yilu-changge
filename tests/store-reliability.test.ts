import test from 'node:test';
import assert from 'node:assert/strict';
import {FormalStore,FORMAL_KEY,RULES_VERSION} from '../assets/scripts/formal/store';
import {CHAPTERS,requiredOfficers} from '../assets/scripts/formal/data';

function memory(){
 const db=new Map<string,string>();
 return {db,getItem:(key:string)=>db.get(key)??null,setItem:(key:string,value:string)=>{db.set(key,value);}};
}
function win(store:FormalStore,chapter=0,id='reliability-'+chapter){
 return store.settle({id,chapter,won:true,troops:50,treasures:[],defeatedBossId:CHAPTERS[chapter].boss,defeatedOfficerIds:requiredOfficers(chapter)});
}

test('malformed nested save data is protected before it can reach menus, upgrades, or settlement',()=>{
 const patches=[
  {weaponLevels:{spear:'3'}},
  {weaponLevels:{spear:0}},
  {weaponLevels:{spear:100}},
  {ruleBests:'old'},
  {ruleBests:{[RULES_VERSION]:'old'}},
  {ruleBests:{[RULES_VERSION]:{c01:null}}},
  {best:{c01:'50'}},
  {pendingRewardPresentation:{key:'reward:old',chapter:0,kind:'victory',title:'首胜',xp:30}},
  {pendingRewardPresentation:{key:'reward:old',chapter:0,kind:'victory',title:'首胜',xp:30,items:[null]}},
  {slots:[]},
  {slots:{dian:{id:'taiping'}}},
  {support:[]},
  {claimed:'run:old'},
  {xp:'100'}
 ];
 for(const patch of patches){
  const io=memory(),base=new FormalStore(io).data,raw=JSON.stringify({...base,...patch});
  io.setItem(FORMAL_KEY,raw);
  const store=new FormalStore(io);
  assert.ok(store.notice,JSON.stringify(patch));
  assert.equal(store.data.pendingRewardPresentation,null);
  assert.equal(store.loadout().weaponLevels.spear,1);
  assert.equal(win(store),false);
  assert.equal(store.save(),false);
  assert.equal(store.retry(),false);
  assert.equal(io.getItem(FORMAL_KEY),raw,'never silently replace a corrupt record');
 }
});

test('missing optional fields use playable defaults while unknown fields survive reload',()=>{
 const io=memory();
 io.setItem(FORMAL_KEY,JSON.stringify({schemaVersion:3,cleared:[],slots:{},future:{nested:['keep']}}));
 const store=new FormalStore(io);
 assert.equal(store.notice,'');
 assert.deepEqual(store.data.weapons,['spear']);
 assert.deepEqual(store.data.weaponLevels,{spear:1});
 assert.equal(store.loadout().startWeaponId,'spear');
 assert.equal(win(store),true);
 const loaded=new FormalStore(io);
 assert.equal(loaded.completed,1);
 assert.equal(loaded.data.xp,30);
 assert.deepEqual(loaded.data.future,{nested:['keep']});
});

test('a repaired record can be retried without keeping the invalid in-memory reward',()=>{
 const io=memory(),valid=new FormalStore(io);
 assert.equal(win(valid),true);
 const raw=io.getItem(FORMAL_KEY)!;
 io.setItem(FORMAL_KEY,JSON.stringify({...valid.data,pendingRewardPresentation:{key:'broken'}}));
 const store=new FormalStore(io);
 assert.ok(store.notice);
 io.setItem(FORMAL_KEY,raw);
 assert.equal(store.retry(),true);
 assert.equal(store.data.xp,30);
 assert.equal(store.completed,1);
 assert.equal(store.data.pendingRewardPresentation?.key,'reward:reliability-0');
});

test('an incomplete previous-record backup prevents any main-record write',()=>{
 const io=memory(),initial=new FormalStore(io);
 assert.equal(initial.save(),true);
 const raw=io.getItem(FORMAL_KEY)!;
 let corruptBackup=true,mainWrites=0;
 const store=new FormalStore({getItem:io.getItem,setItem:(key,value)=>{
  if(key===FORMAL_KEY)mainWrites++;
  io.setItem(key,key===FORMAL_KEY+'-previous'&&corruptBackup?value.slice(0,15):value);
 }});
 assert.equal(win(store),false);
 assert.equal(mainWrites,0);
 assert.equal(io.getItem(FORMAL_KEY),raw);
 assert.equal(store.data.xp,30,'unsaved growth stays available for retry');
 corruptBackup=false;
 assert.equal(store.retry(),true);
 assert.equal(new FormalStore(io).data.xp,30);
});

test('a write that changes the main record then throws restores exact prior bytes and retries once',()=>{
 const io=memory(),initial=new FormalStore(io);
 assert.equal(initial.save(),true);
 const raw=io.getItem(FORMAL_KEY)!;
 let failCommit=true;
 const store=new FormalStore({getItem:io.getItem,setItem:(key,value)=>{
  if(key===FORMAL_KEY&&failCommit){failCommit=false;io.setItem(key,value.slice(0,31));throw Error('interrupted write');}
  io.setItem(key,value);
 }});
 assert.equal(win(store),false);
 assert.equal(io.getItem(FORMAL_KEY),raw);
 assert.equal(io.getItem(FORMAL_KEY+'-previous'),raw);
 assert.equal(new FormalStore(io).completed,0);
 assert.equal(store.data.xp,30);
 assert.equal(win(store),false,'same run cannot grant twice while save is pending');
 assert.equal(store.retry(),true);
 const loaded=new FormalStore(io);
 assert.equal(loaded.completed,1);
 assert.equal(loaded.data.xp,30);
 assert.equal(win(loaded),false);
});

test('main-record readback mismatch restores the previous record without losing the staged reward',()=>{
 const io=memory(),initial=new FormalStore(io);
 assert.equal(initial.save(),true);
 const raw=io.getItem(FORMAL_KEY)!;
 let corruptCommit=true;
 const store=new FormalStore({getItem:io.getItem,setItem:(key,value)=>{
  if(key===FORMAL_KEY&&corruptCommit){corruptCommit=false;io.setItem(key,value.slice(0,31));return;}
  io.setItem(key,value);
 }});
 assert.equal(win(store),false);
 assert.equal(io.getItem(FORMAL_KEY),raw);
 assert.equal(JSON.parse(io.getItem(FORMAL_KEY+'-pending')!).xp,30);
 assert.equal(store.retry(),true);
 assert.equal(new FormalStore(io).data.xp,30);
});
