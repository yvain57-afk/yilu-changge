import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Journey,STEP} from '../assets/scripts/core/model';
import {LEVELS} from '../assets/scripts/core/levels';
import {Enemy,RunnerObject,muzzle} from '../assets/scripts/core/runner';
import {runnerSteer} from '../tools/v09-model-policy';
const fixture=(count=8,objects:RunnerObject[]=[])=>new Journey({...LEVELS[0],runner:{...LEVELS[0].runner!,routeEnd:100,startCount:count,objects,enemyWaves:[],objective:{kind:'clearEnemies',plannedEnemyCount:0}}});
const tick=(j:Journey,n=1)=>{for(let i=0;i<n&&!j.finished;i++){j.advance(STEP);j.drainFeedback();}};
const foe=(id:string,x:number,z:number,slot:number):Enemy=>({id,numericId:200+slot,slot,x,at:z,previousX:x,previousZ:z,hp:100000,maxHp:100000,speed:.35,halfWidth:.045,depth:.085,large:false,dead:false,lastHit:-100,attackClock:0,contacting:false});
const gate:RunnerObject={id:'loss',kind:'mutableGate',at:-.64,x:-.17,halfWidth:.03,value:-1,damagePerPoint:10000,maxPositive:8};

test('v09 count growth preserves existing soldier feet, identity, frozen arrows and fire clocks',()=>{
 const j=fixture(8),r=j.runner!;tick(j);const before=r.members,origins=r.shots.map(s=>s.origin),clock=new Map((r as any).fireAt);
 j.count=24;const added=r.members;for(const m of before){const same=added.find(n=>n.id===m.id)!;assert.equal(same.x,m.x);assert.equal(same.z,m.z);assert.equal(same.slot,m.slot);}
 tick(j);for(const [id,time] of clock)assert.equal((r as any).fireAt.get(id),time);
 assert.equal(r.stats.shots,24);for(const origin of origins)assert.ok(r.shots.some(s=>s.origin===origin));
});

test('v09 contact removes the exact model-selected slots; survivors and future recruits keep identities',()=>{
 const j=fixture(8,[gate]),r=j.runner!,before=r.members;tick(j);const damage=r.lastDamage!;
 assert.equal(j.count,7);assert.equal(damage.sourceTargetId,'loss');assert.equal(damage.actualLoss,1);assert.equal(damage.removedMemberIds!.length,1);
 assert.deepEqual(damage.removedMembers!.map(m=>m.id),damage.removedMemberIds);
 for(const m of before.filter(m=>damage.removedMemberIds!.indexOf(m.id)<0)){const after=r.members.find(a=>a.id===m.id)!;assert.equal(after.slot,m.slot);assert.equal(after.x,m.x);assert.ok(Math.abs(after.z-m.z-STEP)<1e-8);}
 const deadId=damage.removedMemberIds![0];j.count=8;assert.ok(r.members.every(m=>m.id!==deadId));assert.equal(new Set(r.members.map(m=>m.slot)).size,8);assert.ok(r.members.every(m=>m.slot!>=0&&m.slot!<48));
});

test('v09 256-to-255 loss reduces weighted budget without inventing a visible casualty',()=>{
 const j=fixture(256,[gate]),r=j.runner!;tick(j);assert.equal(j.count,255);assert.equal(r.members.length,48);assert.equal(r.members.reduce((sum,m)=>sum+m.weight,0),255);assert.deepEqual(r.lastDamage!.removedMemberIds,[]);
});

test('v09 bounded approach cannot teleport; exposed attackers still inflict source-linked losses',()=>{
 const j=fixture(24),r=j.runner!;j.companion='chen_ying';r.enemies=Array.from({length:16},(_,i)=>foe('approach:'+i,(i%8-3.5)*.15,.30+Math.floor(i/8)*.23,i));
 for(let n=0;n<180&&!j.finished;n++){const prior=new Map(r.enemies.map(e=>[e.id,{x:e.x,z:e.at}]));tick(j);for(const e of r.enemies){const p=prior.get(e.id)!;assert.ok(Math.abs(e.x-p.x)<=.45*STEP+1e-8);assert.ok(Math.abs(e.at-p.z)<=1.55*STEP+1e-8);}}
 assert.ok(j.count<24);assert.ok(r.lastContact);assert.equal(r.lastDamage!.sourceEnemyId,r.lastContact!.enemyId);assert.equal(r.kills,0);assert.equal(r.enemies.length,16);
 assert.ok(new Set(r.enemies.map(e=>e.x.toFixed(2))).size>3);assert.ok(new Set(r.enemies.map(e=>e.at.toFixed(2))).size>2);
});

test('v09 actual swept enemy/member contact catches a crossing even with separated endpoints',()=>{
 const j=fixture(1),r=j.runner!;j.x=-.045;j.target=.9;const e=foe('cross',0,STEP,0);e.depth=.001;e.speed=0;r.enemies=[e];
 // Low radius isolates the lateral sweep; call contact stage with actual old/new feet.
 const before=[{...r.members[0],x:-.04,z:0,radius:.001}];j.x=.04;j.z=0;e.x=e.previousX=0;e.at=e.previousZ=0;
 (r as any).contacts(before);assert.equal(j.count,0);assert.equal(r.lastDamage!.sourceEnemyId,'cross');
});

test('v09 pacing is driven by real hit, cap, pass and claim events; unopened reward stays absent',()=>{
 const objects:RunnerObject[]=[{id:'cap',kind:'mutableGate',at:2,x:0,halfWidth:.3,value:0,damagePerPoint:1,maxPositive:2},{id:'miss',kind:'rewardCrate',at:2,x:.9,halfWidth:.1,hp:100,reward:{kind:'troops',count:6}}];
 const j=fixture(1,objects),r=j.runner!;tick(j,145);const cap=r.targets[0].pacing,miss=r.targets[1].pacing;
 assert.ok(cap.firstHitAt!==null&&cap.cappedAt!==null);assert.ok(cap.cappedAt!>=cap.firstHitAt!);assert.ok(cap.hitsAfterCap>0);assert.ok(cap.spentAimingAfterCap>0);assert.ok(cap.availableAimTime>0);assert.deepEqual(cap.claimedReward,{kind:'gate',count:2});
 assert.equal(miss.firstHitAt,null);assert.equal(miss.durabilityAtPass,100);assert.equal(miss.claimedReward,null);
});

test('v09 leader-only count has exactly one muzzle after companion casualty, and slots remain bounded after churn',()=>{
 const j=fixture(2),r=j.runner!;j.companion='chen_ying';let ids=r.members.map(m=>m.id);
 for(let n=0;n<60;n++){(r as any).lose(1,'fixture','enemyContact',r.members[1]);assert.equal(r.members.length,1);assert.equal(r.members[0].role,'hero');j.count=2;const next=r.members.find(m=>m.role==='companion')!;assert.ok(ids.indexOf(next.id)<0);ids.push(next.id);assert.ok(next.slot!<48);assert.ok(Number.isFinite(muzzle(next).x));}
});


test('v09 same-step removed foot cannot claim a later gate, while surviving touchers still can',()=>{
 const loss:RunnerObject={...gate,id:'a-loss',at:-.64};
 const gain:RunnerObject={...gate,id:'b-gain',at:-.62,value:3};
 const j=fixture(8,[loss,gain]);tick(j);assert.equal(j.count,7);assert.equal(j.runner!.targets[1].triggered,false);assert.ok(j.runner!.lastDamage!.removedMemberIds!.indexOf(1)>=0);
 const surviving=fixture(8,[loss,{...gain,x:0,halfWidth:.3}]);tick(surviving);assert.equal(surviving.count,10);assert.equal(surviving.runner!.targets[1].triggered,true);assert.equal(surviving.runner!.ledger.filter(e=>e.sourceId==='b-gain'&&e.type==='gateGain').length,1);
 const fatal=fixture(8,[{...loss,value:-99},gain]);tick(fatal);assert.equal(fatal.phase,'lost');assert.equal(fatal.count,0);assert.equal(fatal.runner!.targets[1].triggered,false);
});

test('v09 steering checks the clamped input, not an unreachable safe enemy position',()=>{
 const j=fixture(2,[{...gate,id:'right-risk',at:.5,x:.6,halfWidth:.2,value:-99}]);j.companion='chen_ying';j.x=j.target=.91;
 j.runner!.enemies=[foe('far-right',1.06,.4,0)];
 const data={x:j.x,z:j.z,count:j.count,runner:JSON.parse(JSON.stringify(j.runner!.snapshot()))};
 for(const input of [j,data]){const x=runnerSteer(input);assert.ok(Math.abs(x)<=.91);assert.notEqual(x,.91);assert.ok(j.runner!.formationAt(x).every(m=>Math.abs(m.x-.6)>.2+m.radius+.03));}
});
