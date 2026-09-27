import {hazardHit} from '../assets/scripts/core/hazards';
import {Journey,STEP} from '../assets/scripts/core/model';
import {V06_LEVELS as LEVELS} from '../assets/scripts/core/levels';
import {PlayerWeapon} from '../assets/scripts/core/weapons';
import {TacticId} from '../assets/scripts/core/tactics';
export function steer(j:Journey,route:'safe'|'hard'='safe'){
 if(j.phase==='run'){
  const f=j.horde!.config.forks.find(f=>j.z>=f.previewAt-.35&&j.z<f.commitAt+.02);if(f){j.move(f[route==='safe'?'safeSide':'hardSide']==='left'?-.48:.48);return;}
  const row=j.rows.find(r=>!j.usedRows.has(r.id)&&r.at-j.z<1.05&&r.at>=j.z);if(row){const l=row.left.kind==='double'?j.count*2:j.count+row.left.value,r=row.right.kind==='double'?j.count*2:j.count+row.right.value;j.move(l>r?-.48:.48);return;}
  const enemies=j.obstacles.filter(o=>!o.dead&&!o.resolved&&o.at>j.z+.15&&o.at<j.z+5.5);let best=j.x,score=-Infinity;
  for(const x of [-.64,-.48,-.30,0,.30,.48,.64]){let n=0;for(const o of enemies){if(Math.abs(x-o.x)<(j.weapon==='blade'?.29:.15))n+=1/(.8+Math.abs(o.at-j.z-2.3));}n-=Math.abs(x-j.x)*.12;if(n>score){score=n;best=x;}}
  for(const w of j.warnings)if(!w.hit&&Math.abs(best-w.x)<w.width+.08)best=w.x>0?-.38:.38;j.move(best);
 }else if(j.phase==='boss'){const d=j.bossDirector;if(d&&(d.phase==='active'||(d.phase==='telegraph'&&d.phaseTick>=15))){const safe=[0,-.3,.3,-.5,.5,-.7,.7,-.88,.88].filter(x=>!d.warningShapes.some(s=>hazardHit(s,{x:x*2.5,z:j.z},.07))).sort((a,b)=>Math.abs(a)-Math.abs(b)||Math.abs(a-j.x)-Math.abs(b-j.x));j.move(safe[0]??.9);}else j.move(0);}
}
export function run(levelIndex:number,weapon:PlayerWeapon,tactic:TacticId,route:'safe'|'hard'){
 const j=new Journey(LEVELS[levelIndex],{weapon,tactic,companion:levelIndex?'xing_daorong':null});let bossEntry:any;let upgrades=0;const controls={applied:0,surviving:0,byStage:[0,0,0]};
 for(let i=0;i<60*300&&!j.finished;i++){steer(j,route);j.advance(1/60);for(const o of j.obstacles)if(o.lastControlTick===j.simulationTick){controls.applied++;if(!o.dead&&o.hp>0){controls.surviving++;controls.byStage[(o.spawnStage??1)-1]++;}}if(j.phase==='boss'&&!bossEntry)bossEntry={time:j.elapsed,count:j.count,tier:j.tier,kills:j.horde!.kills,damage:JSON.parse(JSON.stringify(j.damageTotals))};upgrades+=j.drainFeedback().filter(e=>e.kind==='upgrade').length;}
 return {level:levelIndex+1,weapon,tactic,route,phase:j.phase,seconds:+j.elapsed.toFixed(2),count:j.count,tier:j.tier,kills:j.horde!.kills,upgrades,controls,bossEntry,planned:j.horde!.planned,spawned:j.horde!.spawned,skipped:j.horde!.spawnSkipped,breached:j.horde!.breached,peakActive:j.horde!.peakActive,peakPending:j.horde!.peakPending,choices:j.horde!.choices.map(c=>({forkId:c.forkId,route:c.route,rewarded:c.rewarded})),damage:j.damageTotals};
}
export function runLowGrowth(levelIndex:number){const j=new Journey(LEVELS[levelIndex]);let bossEntry:any;for(let i=0;i<60*300&&!j.finished;i++){steer(j,'safe');if(j.phase==='run'&&!j.horde!.config.forks.some(f=>j.z>=f.previewAt-.35&&j.z<f.commitAt+.02)&&!j.rows.some(r=>!j.usedRows.has(r.id)&&r.at-j.z<1.05&&r.at>=j.z))j.move(.9);j.advance(STEP);j.drainFeedback();if(j.phase==='boss'&&!bossEntry)bossEntry={count:j.count,tier:j.tier,kills:j.horde!.kills};}return{level:levelIndex+1,phase:j.phase,seconds:j.elapsed,count:j.count,tier:j.tier,kills:j.horde!.kills,awakeningUsed:j.awakeningUsed,bossEntry,skipped:j.horde!.spawnSkipped};}
if(process.argv[1]?.includes('v06-model-probe')){const result=[];for(const l of process.argv.includes('--all')?[0,1,2]:[0])for(const weapon of ['spear','blade'] as const)for(const tactic of ['guanzhen','zhenjun'] as const)for(const route of ['safe','hard'] as const)result.push(run(l,weapon,tactic,route));console.log(JSON.stringify(process.argv.includes('--low-growth')?[0,1,2].map(runLowGrowth):result,null,2));}
