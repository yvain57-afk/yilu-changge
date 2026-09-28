import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {Journey,STEP} from '../assets/scripts/core/model';
import {LEVELS} from '../assets/scripts/core/levels';
import {RUNNER_LEVELS,RUNNER_CAPACITY_PROOF,RUNNER_NUMERIC_LIMIT} from '../assets/scripts/core/runnerConfig';
import {Journey as BaselineJourney} from '../.cache/fix2-cap-audit-baseline/assets/scripts/core/model';
import {LEVELS as BASE_LEVELS} from '../.cache/fix2-cap-audit-baseline/assets/scripts/core/levels';
import {RUNNER_LEVELS as BASE_CONFIG} from '../.cache/fix2-cap-audit-baseline/assets/scripts/core/runnerConfig';
const output='docs/BATTLE-FIX2-20260925';
const cases=[
 {gate:'l1.g1',count:1,stage:0,path:'hold'},
 {gate:'l1.g1',count:8,stage:1,path:'hold'},
 {gate:'l2.g1',count:8,stage:1,path:'hold'},
 {gate:'l2.g1',count:8,stage:1,path:'late'},
 {gate:'l3.g1',count:8,stage:1,path:'hold'},
 {gate:'l3.g1',count:48,stage:2,path:'hold'},
];
function run(c:typeof cases[number],variant:'A'|'B'){
 const baseline=variant==='A',levels=baseline?BASE_LEVELS:LEVELS,configs=baseline?BASE_CONFIG:RUNNER_LEVELS,index=configs.findIndex(l=>l.objects.some(t=>t.id===c.gate)),original=configs[index],source=original.objects.find(t=>t.id===c.gate)!;
 // A bounded, labelled single-gate fixture isolates the rule change. Nothing
 // injects hit damage: all observed damage comes from real fired projectiles.
 const cfg={...original,startCount:c.count,objects:[{...source}],enemyWaves:[],objective:{kind:'clearEnemies',plannedEnemyCount:0}};
 const Ctor:any=baseline?BaselineJourney:Journey,j:any=new Ctor({...levels[index],runner:cfg});j.z=Math.max(0,source.at-8);j.x=j.target=c.path==='late'?-source.x:source.x;j.weapon='blade';j.companion='xing_daorong';const r=j.runner;r.stage=c.stage;j.tier=c.stage+1;
 const t=r.targets[0],startZ=j.z,cap=source.maxPositive!,samples:any[]=[{tick:0,time:0,value:t.value,progress:t.progress,damage:0}];
 let damage=0,hitCount=0,firstHit:number|null=null,firstHittable:number|null=null,firstInRange:number|null=null,passAt:number|null=null,aimed=0,invalid=0,damageAfterCap=0,lastValue=t.value;
 const hit=r.hitTarget.bind(r);r.hitTarget=(target:any,amount:number)=>{if(target.id===c.gate&&!target.resolved){damage+=amount;hitCount++;if(firstHit===null)firstHit=j.elapsed;if(baseline&&target.value>=cap)damageAfterCap+=amount;}return hit(target,amount);};
 for(let n=0;n<12*60&&!j.finished;n++){
  const targetX=c.path==='late'&&j.z<source.at-2.5?-source.x:source.x;j.move(targetX);
  const members=r.members,reachable=members.filter((m:any)=>{const z=m.z+.05;return source.at>=z&&source.at-z<=8;}),aligned=reachable.some((m:any)=>Math.abs(m.x-(m.role==='soldier'?.064:0)-source.x)<=source.halfWidth);
  if(reachable.length&&firstInRange===null)firstInRange=j.elapsed;
  if(!t.resolved&&aligned){aimed+=STEP;if(firstHittable===null)firstHittable=j.elapsed;if(baseline&&t.value>=cap)invalid+=STEP;}
  j.advance(STEP);j.drainFeedback();if(j.z>=source.at&&passAt===null)passAt=j.elapsed;
  if(t.value!==lastValue){samples.push({tick:j.simulationTick,time:j.elapsed,value:t.value,progress:t.progress,damage});lastValue=t.value;}
  if(t.resolved&&j.simulationTick-t.resolvedTick>2)break;
 }
 const claims=r.ledger.filter((e:any)=>e.sourceId===c.gate&&['gateGain','negativeGate'].includes(e.type));
 return{runId:`${variant}-${c.gate}-${c.count}-${c.stage}-${c.path}`,variant,mode:'isolated-real-projectile-fixture',gateId:c.gate,scope:'One existing gate at its original at/x/width/threshold; no enemies or other targets, same fixed input in A and B. Does not establish full-level balance or visual readability.',firstReadableAt:null,readabilityStatus:'browser-owned; not inferred from simulation',weapon:'blade',companion:'xing_daorong',stage:c.stage,initialSquadCount:c.count,startZ,inputPolicy:c.path==='late'?'hold opposite; switch when leader is 2.5 world units before gate':'hold target lane for entire encounter',damagePerPoint:source.damagePerPoint,forwardSpeed:1,initialValue:source.value,oldMaxPositive:cap,growthStrategy:baseline?'capped':'window',logicalSquadCapacity:baseline?256:RUNNER_NUMERIC_LIMIT,firstInRangeAt:firstInRange,firstHittableAt:firstHittable,firstHitAt:firstHit,leaderPassAt:passAt,contactAt:t.triggered?t.resolvedTick/60:null,aimedSeconds:aimed,actualHitDamage:damage,hitCount,valuesOverTime:samples,finalValue:t.value,remainder:t.progress,claimedCount:claims.reduce((sum:number,e:any)=>sum+e.value,0),claimTransactions:claims,finalSquadCount:j.count,invalidPlateauSeconds:invalid,damageAfterCap,missReason:t.triggered?null:t.resolved?'not-contacted':j.finished?'squad-defeated-before-contact':'fixture-window-ended',guardEvents:r.ledger.filter((e:any)=>e.type==='numericGuard'),modelPacing:t.pacing};
}
const comparisons=cases.map(c=>({case:c,A:run(c,'A'),B:run(c,'B')}));
for(const c of comparisons){assert.equal(c.A.damagePerPoint,c.B.damagePerPoint);assert.equal(c.A.forwardSpeed,c.B.forwardSpeed);assert.equal(c.B.invalidPlateauSeconds,0);assert.equal(c.B.guardEvents.length,0);}
assert.deepEqual(RUNNER_LEVELS.map(l=>({...l,objects:l.objects.map(({growthStrategy,...t})=>t)})),BASE_CONFIG,'No hidden threshold/position/enemy/reward edits allowed');
const configBaselineLines=fs.readFileSync('.cache/fix2-cap-audit-baseline/assets/scripts/core/runnerConfig.ts','utf8').split('\n');
const configCurrentLines=fs.readFileSync('assets/scripts/core/runnerConfig.ts','utf8').split('\n');
const sourceLine=(path:string,needle:string)=>({path,line:fs.readFileSync(path,'utf8').split('\n').findIndex(l=>l.includes(needle))+1});
const oldCaps=BASE_CONFIG.flatMap((l,level)=>l.objects.filter(t=>t.kind==='mutableGate').map(t=>({level:l.id,id:t.id,initialValue:t.value,damagePerPoint:t.damagePerPoint,maxPositive:t.maxPositive,source:`assets/scripts/core/runnerConfig.ts`,baselineLine:configBaselineLines.findIndex(l=>l.includes('\"id\": \"'+t.id+'\"'))+1,currentLine:configCurrentLines.findIndex(l=>l.includes('\"id\": \"'+t.id+'\"'))+1,newStrategy:'window'})));
const changes=oldCaps.map(g=>({id:g.id,field:'growthStrategy',old:'implicit capped',new:'window',retainedLegacyMaxPositive:g.maxPositive}));
const beforeSource=fs.readFileSync('.cache/fix2-cap-audit-baseline/assets/scripts/core/runner.ts');
const report={taskId:'BATTLE-FIX2-20260925',status:'model-targeted-comparison-complete; browser readability pending',sourceAudit:{localSourceFilesAndLines:[sourceLine('assets/scripts/core/runner.ts','hitTarget(t:'),sourceLine('assets/scripts/core/runner.ts','private add('),sourceLine('assets/scripts/core/runner.ts','private samplePacing('),sourceLine('assets/scripts/core/runner.ts','gateGrowthStrategy('),sourceLine('assets/scripts/core/runnerConfig.ts','export const RUNNER_NUMERIC_LIMIT')],currentSourceSha256:Object.fromEntries(['assets/scripts/core/runner.ts','assets/scripts/core/runnerConfig.ts'].map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')])),parameterSha256:crypto.createHash('sha256').update(JSON.stringify(RUNNER_LEVELS)).digest('hex'),baselineRunnerSha256:crypto.createHash('sha256').update(beforeSource).digest('hex'),oldGameplayCapByGate:oldCaps,oldRationaleFound:false,oldRationaleEvidence:['v2 prototype default maxPositive64/cap256; no derivation for low caps 4/8/12 found','CAP_AUDIT.md'],numericSafetyGuard:RUNNER_NUMERIC_LIMIT,capacityProof:RUNNER_CAPACITY_PROOF,legacyLogicalSquadCapacity:256,logicalSquadCapacity:RUNNER_NUMERIC_LIMIT,visibleActorBudget:48,saveInFlightRestore:'not implemented in source; no gate migration or historical compensation'},newPolicy:{mode:'window',normalPositiveGameplayCap:false,parameterChanges:changes,damageThresholdChanges:[],speedChanges:[],enemyChanges:[],rewardChanges:[],capacityChange:'remove legacy 256 reward truncation; preserve 48 weighted agents; explicit numeric guard'},comparisons,outcomes:{normalCapRemoved:comparisons.some(c=>c.B.finalValue>c.B.oldMaxPositive),zeroWindowCapPlateau:comparisons.every(c=>c.B.invalidPlateauSeconds===0),guardReachabilityChecked:true,shortWindowSolved:null,fullLevelBalance:'requires natural browser runs; isolated fixtures cannot establish this',observedRemainingProblems:comparisons.filter(c=>c.B.finalValue<0).map(c=>`${c.B.runId}: negative gate remains negative at contact; damage/aim window still matters`)}};
fs.mkdirSync(output,{recursive:true});fs.writeFileSync(output+'/CAP_AND_PACING_REPORT.json',JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(output+'/PARAMETER_DIFF.json',JSON.stringify({taskId:report.taskId,gates:changes,squad:{oldGameCapacity:256,newGameplayCapacity:'none',numericGuard:RUNNER_NUMERIC_LIMIT,visibleBudget:48},damagePerPoint:'unchanged',forwardSpeed:'unchanged',targetCoordinates:'unchanged',enemyHealth:'unchanged',weapons:'no new weapon identities',save:'parent integrates runnerBest guard separately'},null,2)+'\n');
console.log(JSON.stringify(comparisons.map(c=>({gate:c.case.gate,count:c.case.count,stage:c.case.stage,path:c.case.path,A:{value:c.A.finalValue,claim:c.A.claimedCount,plateau:c.A.invalidPlateauSeconds},B:{value:c.B.finalValue,claim:c.B.claimedCount,plateau:c.B.invalidPlateauSeconds}})),null,2));
