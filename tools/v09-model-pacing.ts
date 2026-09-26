import {writeFileSync,mkdirSync} from 'node:fs';
import {Journey,STEP} from '../assets/scripts/core/model';
import {LEVELS} from '../assets/scripts/core/levels';
import {runnerSteer} from './v09-model-policy';
const changes=[{id:'l1.g0.right',damagePerPoint:3},{id:'l2.g0.right',damagePerPoint:3},{id:'l3.g0.left',damagePerPoint:5}];
const reports=[];
for(const variant of ['A-current','B-positive-opening-window']){
 const runs=LEVELS.map(base=>{const level=JSON.parse(JSON.stringify(base));for(const t of level.runner.objects){const change=changes.find(c=>c.id===t.id);if(change)t.damagePerPoint=variant.startsWith('B')?change.damagePerPoint:change.id==='l3.g0.left'?3:2;}
  const loadout=level.id==='trial-01'?{weapon:'spear' as const,companion:null}:level.id==='trial-02'?{weapon:'blade' as const,companion:'xing_daorong' as const}:{weapon:'spear' as const,companion:'chen_ying' as const};
  const j=new Journey(level,loadout);
  for(let i=0;i<60*100&&!j.finished;i++){if(i%3===0)j.move(runnerSteer(j));j.advance(STEP);j.drainFeedback();}
  return {levelId:level.id,loadout,sampleIntervalTicks:3,sampleIntervalSeconds:3*STEP,phase:j.phase,seconds:j.elapsed,count:j.count,stage:j.runner!.stage,cause:j.cause,stats:j.runner!.stats,pacing:j.runner!.pacingReport(),losses:j.runner!.ledger.filter(e=>e.actualLoss)};
 });reports.push({variant,runs});
}
mkdirSync('evidence/v09',{recursive:true});writeFileSync('evidence/v09/pacing-comparison.json',JSON.stringify({kind:'headless legal-input simulation, not recording or human playtest',candidateCount:2,sampleIntervalTicks:3,sampleIntervalSeconds:3*STEP,loadoutApplied:'constructor options before runner initialization',scope:'Same A/B game parameters, recomputed after contact-event fixes and actual-muzzle input policy. This is not a browser recording or a win-rate estimate.',changes,reports},null,2));
for(const r of reports)console.log(r.variant,r.runs.map(v=>({id:v.levelId,phase:v.phase,count:v.count,seconds:v.seconds,gate:v.pacing.filter(t=>changes.some(c=>c.id===t.id)).map(t=>({id:t.id,firstHitAt:t.firstHitAt,cappedAt:t.cappedAt,spentAimingAfterCap:t.spentAimingAfterCap,hitsAfterCap:t.hitsAfterCap}))})));
