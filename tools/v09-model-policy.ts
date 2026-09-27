/** Reproject the actual stable roster, including casualty holes, without filling by count.
 * Snapshots keep absolute member feet. Row depth identifies its clamp width (3/5/7),
 * so translating that row's center reproduces model memberPosition exactly. IDs and
 * bounded visual slots stay attached to the supplied member; neither is re-indexed.
 */
export function runnerFormationAt(j:any,x:number):any[]{
 const r=j.runner;if(typeof r.formationAt==='function')return r.formationAt(x);
 const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
 if(!Array.isArray(r.members))throw Error('v09 steering requires snapshot runner.members');
 return r.members.map((m:any)=>{
  if(m.role!=='soldier')return{...m,x:m.x+clamp(x,-1.01,1.01)-clamp(j.x,-1.01,1.01)};
  const row=Math.max(0,Math.round((j.z-m.z-.65)/.30)),columns=row===0?3:row===1?5:7;
  const halfWidth=(columns-1)*.17/2,left=-1.16+halfWidth,right=1.16-halfWidth;
  return{...m,x:m.x+clamp(x,left,right)-clamp(j.x,left,right)};
 });
}
/** Reads simulation/visible targets and emits lateral input only; never modifies combat state. */
export function runnerSteer(j:any):number{
 const r=j.runner,targets=r.targets.filter((t:any)=>!t.resolved&&t.at>j.z-.05&&t.at-j.z<7.4).sort((a:any,b:any)=>a.at-b.at);
 const formation=(x:number)=>runnerFormationAt(j,x);
 const back=Math.min(...formation(j.x).map((m:any)=>m.z))-.1;
 const danger=r.targets.filter((t:any)=>!t.resolved&&t.kind==='mutableGate'&&t.value<0&&t.at-j.z<1.5&&t.at>=back);
 const safeAt=(x:number)=>!danger.some((t:any)=>formation(x).some((m:any)=>Math.abs(m.x-t.x)<t.halfWidth+m.radius+.03&&t.at>=m.z-.1&&t.at<=m.z+1.5));
 // A safe destination can still cross a red gate with the rear rank. Audit the path.
 const safe=(x:number)=>safeAt(x)&&(!safeAt(j.x)||Array.from({length:9},(_,i)=>j.x+(x-j.x)*(i+1)/9).every(safeAt));
 const options=[-.82,-.64,-.48,-.3,-.12,0,.12,.3,.48,.64,.82].filter(safe);
 let wanted=j.x,aimEnemy:any=null;
 const front=targets.find((t:any)=>t.kind!=='mutableGate'||t.value>=0||t.value>=-14&&t.at-j.z>1.5);
 if(front){const row=targets.filter((t:any)=>Math.abs(t.at-front.at)<.1);let selected=front;
  if(row.length>1){selected=row.filter((t:any)=>t.kind!=='mutableGate'||t.value>-15).sort((a:any,b:any)=>{
    const score=(t:any)=>t.reward?.kind==='equipment'&&t.reward.stage>r.stage?100:t.kind==='mutableGate'&&t.value<0?65:t.reward?.count??t.value??0;return score(b)-score(a);
   })[0]??front;}
  wanted=selected.x;
 }else{
  const enemies=r.enemies.filter((e:any)=>!e.dead).sort((a:any,b:any)=>a.at-b.at);
  const e=enemies[0];wanted=e?.x??0;aimEnemy=e;
 }
 // Near attackers can steal a brief volley from a distant reward.
 const pressing=r.enemies.filter((e:any)=>!e.dead&&!e.large&&e.at-j.z<1.4).sort((a:any,b:any)=>a.at-b.at)[0];
 if(pressing&&(!front||front.at-j.z>2.5)){wanted=pressing.x;aimEnemy=pressing;}
 if(aimEnemy){
  // The commander and companion fire from separate lanes. Aim actual muzzles,
  // otherwise centering on a narrow enemy can leave both special actors missing.
  const clamp=(x:number)=>Math.max(-.91,Math.min(.91,x));
  const laneOffsets=[0,-(aimEnemy.halfWidth??.045)*.75,(aimEnemy.halfWidth??.045)*.75];
  const candidates=[j.x,wanted];for(const m of formation(j.x))for(const offset of laneOffsets)candidates.push(aimEnemy.x+offset-(m.x-j.x)+(m.role==='soldier'?.064:0));
  const valid=candidates.map(clamp).filter(safe);
  const fireWeight=(x:number)=>formation(x).reduce((sum:number,m:any)=>sum+(Math.abs(m.x-(m.role==='soldier'?.064:0)-aimEnemy.x)<=(aimEnemy.halfWidth??.045)&&aimEnemy.at+(aimEnemy.depth??.085)>=m.z+.05?m.weight:0),0);
  const threats=r.enemies.filter((e:any)=>!e.dead&&!e.large&&e.at-j.z<.6);
  const clearance=(x:number)=>Math.min(Infinity,...formation(x).map((m:any)=>Math.min(Infinity,...threats.map((e:any)=>Math.hypot((m.x-e.x)*2.5,m.z-e.at)))));
  const ranked=Array.from(new Set<number>(valid)).map(x=>({x,weight:fireWeight(x),clearance:clearance(x)}));
  const clear=ranked.filter(c=>c.clearance>=.23);
  if(clear.length){clear.sort((a,b)=>b.weight-a.weight||Math.abs(a.x-j.x)-Math.abs(b.x-j.x));wanted=clear[0].x;}
  else if(threats.length){const exits=options.map(x=>({x,clearance:clearance(x)})).sort((a,b)=>b.clearance-a.clearance||Math.abs(a.x-j.x)-Math.abs(b.x-j.x));if(exits.length)wanted=exits[0].x;}
  else if(ranked.length){ranked.sort((a,b)=>b.weight-a.weight||Math.abs(a.x-j.x)-Math.abs(b.x-j.x));wanted=ranked[0].x;}
 }
 wanted=Math.max(-.91,Math.min(.91,wanted));
 if(safe(wanted))return wanted;
 return options.sort((a,b)=>Math.abs(a-wanted)-Math.abs(b-wanted))[0]??(danger[0]?.x>0?-.91:.91);
}
