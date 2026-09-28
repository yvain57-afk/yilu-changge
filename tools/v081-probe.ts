import {Journey,STEP} from '../assets/scripts/core/model';
import {LEVELS} from '../assets/scripts/core/levels';
import {runnerSteer} from './v08-policy';
import {writeFileSync} from 'node:fs';
const runs=[];
for(const index of process.argv.includes('--first')?[0]:[0,1,2]){
 const j=new Journey(LEVELS[index],{weapon:index===1?'blade':'spear',companion:index===0?null:index===1?'xing_daorong':'chen_ying'});
 for(let tick=0;tick<60*180&&!j.finished;tick++){if(tick%4===0)j.move(runnerSteer(j));j.advance(STEP);j.drainFeedback();}
 const r=j.runner!,out={level:index+1,phase:j.phase,seconds:j.elapsed,count:j.count,stage:r.stage,cause:j.cause,remaining:r.remaining,stats:r.stats,ledger:r.ledger,alive:r.enemies.filter(e=>!e.dead),unclaimed:r.targets.filter(t=>!t.claimed&&t.reward).map(t=>({id:t.id,hp:t.hp,resolved:t.resolved}))};runs.push(out);console.log(JSON.stringify({...out,ledger:undefined,alive:out.alive.map(e=>({id:e.id,hp:e.hp,x:e.x,at:e.at})),unclaimed:out.unclaimed}));
}
writeFileSync('evidence/v081/model-probe.json',JSON.stringify(runs,null,2));
