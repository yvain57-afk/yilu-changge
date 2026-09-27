import {readFileSync,writeFileSync} from 'node:fs';
import {Journey,STEP} from '../assets/scripts/core/model';
import {LEVELS} from '../assets/scripts/core/levels';
import {runnerSteer} from './v09-model-policy';
const failed=JSON.parse(readFileSync('evidence/v09/failed-attempt-2.json','utf8')).failedState.journey;
const reports=[];
for(const hold of [2,3,4]){
 // Explicit isolated reconstruction: preserve the actually observed final enemy HP,
 // distance, positions and elapsed clock, revive exactly the last single commander.
 // This is not a resumed natural run; the final-state snapshot has already lost.
 const j=new Journey({...LEVELS[1],runner:{...LEVELS[1].runner!,objects:[],enemyWaves:[],objective:{kind:'clearEnemies',plannedEnemyCount:0}}},{weapon:'blade',companion:'xing_daorong'}),r=j.runner!;
 j.z=failed.z;j.x=j.target=failed.x;j.elapsed=failed.elapsed;j.simulationTick=Math.round(j.elapsed/STEP);j.count=1;r.stage=failed.runner.stage;j.tier=r.stage+1;
 r.enemies=JSON.parse(JSON.stringify(failed.runner.enemies));(r as any).planned=r.enemies.length;r.spawned=r.enemies.length;
 const start=j.elapsed,poses=[];for(let i=0;i<60*40&&!j.finished;i++){if(i%hold===0)j.move(runnerSteer(j));j.advance(STEP);j.drainFeedback();if(i%60===0)poses.push({seconds:j.elapsed-start,x:j.x,target:j.target,count:j.count,hp:r.enemies.find(e=>!e.dead)?.hp??0});}
 reports.push({hold,phase:j.phase,duration:j.elapsed-start,count:j.count,enemyHp:r.enemies.filter(e=>!e.dead).map(e=>e.hp),actualLoss:r.ledger.filter(e=>e.actualLoss).reduce((n,e)=>n+e.actualLoss!,0),poses});
}
writeFileSync('evidence/v09/kite-failure-segment.json',JSON.stringify({kind:'isolated headless reconstruction from failed-attempt-2 terminal snapshot, one commander restored; not natural gameplay',reports},null,2));console.log(reports);
