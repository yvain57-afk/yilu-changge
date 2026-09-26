import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {Journey,STEP} from '../assets/scripts/core/model';
import {LEVELS} from '../assets/scripts/core/levels';
import {RUNNER_LEVELS,RUNNER_CAPACITY_PROOF,RUNNER_NUMERIC_LIMIT,RUNNER_RULES,RUNNER_GATE_WINDOW_BOUND_SECONDS} from '../assets/scripts/core/runnerConfig';
import {runnerSteer} from './v09-model-policy';
const sha=(p:string)=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const sourcePaths=['assets/scripts/core/runner.ts','assets/scripts/core/runnerConfig.ts','tools/v09-model-policy.ts'];
const runs=LEVELS.map((level,index)=>{
 const j=new Journey(level);j.weapon=index===0?'spear':'blade';j.companion=index===0?null:index===1?'xing_daorong':'chen_ying';let peakCount=j.count,minCount=j.count;
 for(let n=0;n<180*60&&!j.finished;n++){j.move(runnerSteer(j));j.advance(STEP);j.drainFeedback();peakCount=Math.max(peakCount,j.count);minCount=Math.min(minCount,j.count);}
 const r=j.runner!;return{level:level.id,scope:'One pure-model deterministic preflight using existing runnerSteer legal move inputs; no state injection, no route search, not natural/browser/player evidence',weapon:j.weapon,companion:j.companion,phase:j.phase,elapsed:j.elapsed,count:j.count,peakCount,minCount,remaining:r.remaining,cause:j.cause,stats:r.stats,pacing:r.pacingReport(),rewardLedger:r.ledger.filter(e=>['gateContact','gateGain','negativeGate','reinforcement','enemyContact','enemyProjectile','numericGuard'].includes(e.type))};
});
const report={taskId:'BATTLE-FIX2-20260925',sourceSha256:Object.fromEntries(sourcePaths.map(p=>[p,sha(p)])),parameterSha256:crypto.createHash('sha256').update(JSON.stringify({levels:RUNNER_LEVELS,rules:RUNNER_RULES})).digest('hex'),guard:RUNNER_NUMERIC_LIMIT,windowBound:RUNNER_GATE_WINDOW_BOUND_SECONDS,proof:RUNNER_CAPACITY_PROOF,runs};
fs.writeFileSync('docs/BATTLE-FIX2-20260925/CAP_MODEL_PREFLIGHT.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(runs.map(r=>({level:r.level,phase:r.phase,elapsed:r.elapsed,count:r.count,peakCount:r.peakCount,remaining:r.remaining,peakShots:r.stats.peakShots,guardEvents:r.stats.numericGuards})),null,2));
assert.ok(runs.every(r=>r.phase==='won'),'preflight cannot certify playable completion');assert.ok(runs.every(r=>r.stats.numericGuards===0&&r.stats.peakShots<=512));
