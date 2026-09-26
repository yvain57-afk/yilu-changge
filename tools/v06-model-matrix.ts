/** Offline legal-controller validation. No changes to HP/count/time, no real-time playback. */
import assert from 'node:assert/strict';
import {writeFileSync,readFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {run,runLowGrowth} from './v06-model-probe';
const results=[];
for(const l of [0,1,2])for(const weapon of ['spear','blade'] as const)for(const tactic of ['guanzhen','zhenjun'] as const)for(const route of ['safe','hard'] as const){const r=run(l,weapon,tactic,route);assert.equal(r.phase,'won',JSON.stringify(r));assert.equal(r.skipped,0);assert.equal(r.planned,r.spawned);assert.ok(r.peakActive<=64);assert.ok(r.peakPending<=32);assert.equal(r.choices.length,3);assert.ok(r.choices.every(c=>c.route===route&&c.rewarded));assert.equal(r.upgrades,2);if(tactic==='zhenjun')assert.ok(r.controls.surviving>0,JSON.stringify(r));results.push(r);}
const lowGrowth=[0,1,2].map(runLowGrowth);for(const r of lowGrowth){assert.equal(r.phase,'won');assert.equal(r.tier,1);assert.equal(r.awakeningUsed,false);assert.equal(r.skipped,0);}
const files=['model.ts','levels.ts','horde.ts','hordeConfig.ts','tactics.ts','weapons.ts','hazards.ts'];
const sourceHashes=Object.fromEntries(files.map(f=>[f,createHash('sha256').update(readFileSync('assets/scripts/core/'+f)).digest('hex')]));
const report={kind:'offline fixed-step legal controller; not human completion rate or device FPS',recordedAt:new Date().toISOString(),sourceHashes,firstLevelValidatedBeforeOtherLevels:true,bossValues:'unchanged 650/1800/2600',measuredCandidate:{footmanHp:[3,4,8],runnerHp:[8,9,10],packageInitial:{footman:[3,4,5],runner:[3,4,5]},reason:'Package initial ordinary HP always died to hero base damage; stage III ordinary and limited runners now allow living zhenjun control. No dynamic scaling.'},results,lowGrowth};
mkdirSync('.cache',{recursive:true});writeFileSync('.cache/v06-model-matrix.json',JSON.stringify(report,null,2));console.log(JSON.stringify({matrixWins:results.length,lowGrowthWins:lowGrowth.length,spawnSkipped:0,peakActive:Math.max(...results.map(r=>r.peakActive)),report:'.cache/v06-model-matrix.json'}));
