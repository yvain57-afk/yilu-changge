import {Journey,STEP,Level} from '../assets/scripts/core/model';
import {LEVELS} from '../assets/scripts/core/levels';
import {writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
export function steer(g:Journey,route='best'){
 if(g.phase==='boss'){const w=g.bossWarning;return w&&!w.hit&&Math.abs(w.x)<=w.width?(w.x<=0?.78:-.78):0;}
 const r=g.level.rows.find(r=>!g.usedRows.has(r.id)&&r.at-g.z<=7);let x=0;
 if(r){const guard=g.obstacles.find(o=>o.rowId===r.id&&!o.dead);const best=r.left.kind==='double'?(g.count>=r.right.value?'left':'right'):(r.left.value>=g.count?'left':'right');const side=route==='safe'&&guard?(guard.side==='left'?'right':'left'):best;x=side==='left'?-.5:.5;if(route==='late'&&guard&&r.at-g.z>1.2)x=guard.side==='left'?.5:-.5;}
 const o=g.obstacles.find(o=>!o.dead&&!o.resolved&&o.rowId===undefined&&o.at-g.z<1&&o.at>g.z&&Math.abs(o.x-x)<=o.width);if(o)x=o.x<=0?.8:-.8;
 const w=g.warnings.find(w=>!w.hit&&Math.abs(x-w.x)<=w.width);if(w)x=w.x<=0?.8:-.8;return x;
}
export function simulate(level:Level,route:string){const g=new Journey(level),gates:any[]=[],losses:any[]=[];let bossEntry=0;for(let n=0;n<60*600&&!g.finished;n++){const before=g.count,used=g.usedRows.size;g.move(steer(g,route));g.advance(STEP);const events=g.drainFeedback(),hurt=events.filter(e=>e.kind==='hurt');losses.push(...hurt.map(e=>({time:g.elapsed,loss:e.amount,cause:g.cause})));if(g.usedRows.size>used)gates.push({row:Array.from(g.usedRows).at(-1),before,loss:hurt.reduce((a,e)=>a+e.amount,0),after:g.count,x:g.x});if(g.phase==='boss'&&!bossEntry)bossEntry=g.count;}return{level:level.id,route,gates,losses,bossEntry,bossSeconds:g.elapsed-level.duration,total:g.elapsed,count:g.count,outcome:g.phase,cause:g.cause};}
if(process.argv[1]?.endsWith('balance-v03.ts')){
const oldSource=execFileSync('git',['show','5478427:assets/scripts/core/levels.ts'],{encoding:'utf8'});const oldLevels=JSON.parse(oldSource.slice(oldSource.indexOf('= [')+2).replace(/;\s*$/,'')) as Level[];
const baseline=oldLevels.flatMap(l=>['best','safe','late'].map(r=>simulate(l,r)));const candidate=JSON.parse(JSON.stringify(LEVELS)) as Level[];candidate[1].obstacles.find(o=>o.id===101)!.loss=5;
const variants=candidate.flatMap(l=>['best','safe','late'].map(r=>simulate(l,r)));
writeFileSync('evidence/v03/balance-baseline-and-candidate.json',JSON.stringify({baselineCommit:'5478427c7ae02037c93f8b8fb75203e3b19a6b14',strategy:'7s early alignment; safe avoids guarded side; late aligns until last1.2s; all dodge ordinary warnings',baseline,candidateA:variants},null,2));console.log(JSON.stringify({baseline:baseline.map(({level,route,bossEntry,bossSeconds,total})=>({level,route,bossEntry,bossSeconds,total})),candidateA:variants.map(({level,route,bossEntry,bossSeconds,total})=>({level,route,bossEntry,bossSeconds,total}))},null,2));

}
