import {Journey,STEP} from '../assets/scripts/core/model';
import {LEVELS} from '../assets/scripts/core/levels';
import {runnerSteer} from './v09-model-policy';
import {writeFileSync} from 'node:fs';
const levels=(process.argv.find(a=>a.startsWith('--levels='))?.split('=')[1]??'2').split(',').map(Number);
const holds=(process.argv.find(a=>a.startsWith('--holds='))?.split('=')[1]??'3,5').split(',').map(Number);
const reports=[];
for(const level of levels)for(const hold of holds){
 const loadout=level===1?{weapon:'spear' as const,companion:null}:level===2?{weapon:'blade' as const,companion:'xing_daorong' as const}:{weapon:'spear' as const,companion:'chen_ying' as const};
 const j=new Journey(LEVELS[level-1],loadout),samples=[];
 for(let i=0;i<60*90&&!j.finished;i++){if(i%hold===0)j.move(runnerSteer(j));j.advance(STEP);j.drainFeedback();if(i%(8*60)===0)samples.push({at:j.elapsed,count:j.count,remaining:j.runner!.remaining});}
 reports.push({level,loadout,hold,phase:j.phase,seconds:j.elapsed,count:j.count,cause:j.cause,stats:j.runner!.stats,samples,ledger:j.runner!.ledger,pacing:j.runner!.pacingReport(),enemies:j.runner!.enemies.filter(e=>!e.dead),members:j.runner!.members});
}
writeFileSync(`evidence/v09/input-hold-levels-${levels.join('-')}-ticks-${holds.join('-')}.json`,JSON.stringify(reports,null,2));
console.log(reports.map(({ledger,pacing,enemies,members,...rest})=>rest));
