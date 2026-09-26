import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Book,KEY,IDS,defaults,Storage} from '../assets/scripts/core/save';
import {Growth,GROWTH_KEY} from '../assets/scripts/core/growth';
import {Campaign} from '../assets/scripts/core/campaign';
import {CAMPAIGN} from '../assets/scripts/core/campaignData';

function store(){
 const db=new Map<string,string>(),writes:string[]=[];let failing:string|null=null;
 const storage:Storage={getItem:key=>db.get(key)??null,setItem:(key,value)=>{writes.push(key);if(failing===key)throw Error('storage quota fixture');db.set(key,value);}};
 return{db,writes,storage,fail:(key:string|null)=>{failing=key;}};
}

test('UI25 Book failed write keeps prior bytes and current results, recovery clears notice and preserves unknown fields',()=>{
 const s=store(),seed={...defaults(),future:{mode:'kept'},settings:{...defaults().settings,futureSwitch:7},best:{...defaults().best,older:91},runnerVideoV2:{futureVersion:4,best:{'trial-01':17}}};
 s.db.set(KEY,JSON.stringify(seed));const b=new Book(s.storage),old=s.db.get(KEY);
 b.data.cleared['trial-01']=true;b.runnerBest['trial-01']=23;s.fail(KEY);
 assert.equal(b.persist(),false);assert.match(b.notice,/保存/);assert.equal(s.db.get(KEY),old);assert.equal(b.runnerBest['trial-01'],23);assert.equal(b.data.cleared['trial-01'],true);
 s.fail(null);assert.equal(b.persist(),true);assert.equal(b.notice,'');const saved=JSON.parse(s.db.get(KEY)!);
 assert.deepEqual(saved.future,{mode:'kept'});assert.equal(saved.settings.futureSwitch,7);assert.equal(saved.best.older,91);assert.equal(saved.runnerVideoV2.futureVersion,4);assert.equal(new Book(s.storage).runnerBest['trial-01'],23);
});

test('UI25 equipment selections report actual storage failure, retry same selection persists without replaying unlocks',()=>{
 const s=store(),b=new Book(s.storage);b.win(0,18,'runnerVideoV2');b.win(1,19,'runnerVideoV2');const g=new Growth(s.storage,b);g.data.futureChoice={kept:true};assert.equal(g.persist(),true);
 const rewards=[...g.data.claimedRewards],old=s.db.get(GROWTH_KEY);s.fail(GROWTH_KEY);
 assert.equal(g.equipWeapon('blade'),false);assert.equal(g.equipCompanion('chen_ying'),false);assert.match(g.notice,/未保存/);assert.equal(g.data.equippedWeapon,'blade');assert.equal(g.data.equippedCompanion,'chen_ying');assert.equal(s.db.get(GROWTH_KEY),old);
 s.fail(null);assert.equal(g.equipWeapon('blade'),true);assert.equal(g.equipCompanion('chen_ying'),true);assert.equal(g.notice,'');g.reconcile();assert.deepEqual(g.data.claimedRewards,rewards);
 const reloaded=new Growth(s.storage,b);assert.equal(reloaded.data.equippedWeapon,'blade');assert.equal(reloaded.data.equippedCompanion,'chen_ying');assert.deepEqual(reloaded.data.futureChoice,{kept:true});assert.deepEqual(reloaded.data.claimedRewards,rewards);
});

test('UI25 locked choices neither mutate selection nor attempt a write',()=>{
 const s=store(),b=new Book(s.storage),g=new Growth(s.storage,b),before=JSON.stringify(g.data),writes=s.writes.length;
 assert.equal(g.equipWeapon('blade'),false);assert.equal(g.equipCompanion('chen_ying'),false);assert.equal(JSON.stringify(g.data),before);assert.equal(s.writes.length,writes);
});

test('UI25 transition failure returns false and same completed in-memory transition retries storage',()=>{
 const s=store(),b=new Book(s.storage),c=new Campaign(s.storage,b);b.win(0,17,'runnerVideoV2');const g=new Growth(s.storage,b),rewards=[...g.data.claimedRewards],bookBytes=s.db.get(KEY),old=s.db.get(CAMPAIGN.sidecarSaveKey);
 (c.data as any).future={kept:true};(c.data.completed as any).futureCamp=false;s.fail(CAMPAIGN.sidecarSaveKey);
 assert.equal(c.complete('rally'),false);assert.equal(c.data.completed.rally,true);assert.match(c.notice,/未保存/);assert.equal(s.db.get(CAMPAIGN.sidecarSaveKey),old);
 const writes=s.writes.length;assert.equal(c.complete('rally'),false);assert.equal(s.writes.length,writes+1,'already-completed memory must not skip failed persistence');assert.equal(c.complete('camp'),false,'uncleared stage cannot complete');
 s.fail(null);assert.equal(c.complete('rally'),true);assert.equal(c.notice,'');assert.equal(s.db.get(KEY),bookBytes);assert.deepEqual(g.data.claimedRewards,rewards);
 const loaded=new Campaign(s.storage,b);assert.equal(loaded.data.completed.rally,true);assert.deepEqual((loaded.data as any).future,{kept:true});assert.equal((loaded.data.completed as any).futureCamp,false);
});

test('UI25 meeting failure keeps saved seen flag false and retries without granting any reward',()=>{
 const s=store(),b=new Book(s.storage),c=new Campaign(s.storage,b);assert.equal(c.meet(),false);
 IDS.forEach((_,i)=>b.win(i,20,'runnerVideoV2'));for(const id of ['rally','camp','garrison'] as const)assert.equal(c.complete(id),true);
 const g=new Growth(s.storage,b),growth=JSON.stringify(g.data),old=s.db.get(CAMPAIGN.sidecarSaveKey);s.fail(CAMPAIGN.sidecarSaveKey);
 assert.equal(c.meet(),false);assert.equal(c.data.seen.zhaoyunMeeting,true);assert.equal(s.db.get(CAMPAIGN.sidecarSaveKey),old);assert.equal(c.meet(),false);
 s.fail(null);assert.equal(c.meet(),true);assert.equal(c.notice,'');assert.equal(new Campaign(s.storage,b).data.seen.zhaoyunMeeting,true);assert.equal(JSON.stringify(g.data),growth);
});
