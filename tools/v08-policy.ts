import {runnerFormation} from '../assets/scripts/core/runner';
/** Reads simulation/visible targets and emits lateral input only; never modifies combat state. */
export function runnerSteer(j:any):number{
 const r=j.runner,targets=r.targets.filter((t:any)=>!t.resolved&&t.at>j.z-.05&&t.at-j.z<7.4).sort((a:any,b:any)=>a.at-b.at);
 const back=Math.min(...runnerFormation(j.count,j.x,j.z,!!j.companion&&j.count>1).map(m=>m.z))-.1;
 const danger=r.targets.filter((t:any)=>!t.resolved&&t.kind==='mutableGate'&&t.value<0&&t.at-j.z<1.5&&t.at>=back);
 const safe=(x:number)=>!danger.some((t:any)=>runnerFormation(j.count,x,j.z,!!j.companion&&j.count>1).some(m=>Math.abs(m.x-t.x)<t.halfWidth+m.radius+.03&&t.at>=m.z-.1&&t.at<=m.z+1.5));
 const options=[-.82,-.64,-.48,-.3,-.12,0,.12,.3,.48,.64,.82].filter(safe);
 let wanted=j.x;
 const front=targets.find((t:any)=>t.kind!=='mutableGate'||t.value>=0||t.value>=-14&&t.at-j.z>1.5);
 if(front){const row=targets.filter((t:any)=>Math.abs(t.at-front.at)<.1);let selected=front;
  if(row.length>1){selected=row.filter((t:any)=>t.kind!=='mutableGate'||t.value>-15).sort((a:any,b:any)=>{
    const score=(t:any)=>t.reward?.kind==='equipment'&&t.reward.stage>r.stage?100:t.kind==='mutableGate'&&t.value<0?65:t.reward?.count??t.value??0;return score(b)-score(a);
   })[0]??front;}
  wanted=selected.x;
 }else{
  const enemies=r.enemies.filter((e:any)=>!e.dead).sort((a:any,b:any)=>a.at-b.at);
  const e=enemies[0];wanted=e?.x??0;
 }
 // Near attackers can steal a brief volley from a distant reward.
 const pressing=r.enemies.filter((e:any)=>!e.dead&&!e.large&&e.at-j.z<.6).sort((a:any,b:any)=>a.at-b.at)[0];
 if(pressing&&(!front||front.at-j.z>3.8))wanted=pressing.x;
 if(safe(wanted))return Math.max(-.91,Math.min(.91,wanted));
 return options.sort((a,b)=>Math.abs(a-wanted)-Math.abs(b-wanted))[0]??(danger[0]?.x>0?-.91:.91);
}
