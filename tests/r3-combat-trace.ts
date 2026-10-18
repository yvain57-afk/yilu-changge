import {createBattle} from '../assets/scripts/formal/battle';import {FormalStore} from '../assets/scripts/formal/store';import {combatReviewTarget} from '../assets/scripts/formal/CombatReviewPolicy';import {writeFileSync} from 'node:fs';
const store=new FormalStore({getItem:()=>null,setItem:()=>{}}),rows=[];
for(const kind of ['light','guard','shield','archer','cavalry','banner','mechanism'])for(const policy of ['stationary','normal'] as const){
 const b=createBattle({chapter:15,lineup:store.loadout(),seed:71,diagnostic:true,noFriendlyFire:true}),s=b.state;s.companions=[];s.support.id=null;s.course=[{d:62,type:'squad',x:s.heroX+.23,n:1,enemyKind:kind}];s.ci=0;
 for(let i=0;i<900&&!s.ended;i++){if(i%6===0){const x=combatReviewTarget(b.snapshot(),policy);if(x!==null)b.move(x);}b.step();}
 rows.push({kind,policy,scope:'single enemy through normal finite route at d62 with DEBUG-only no-friendly-fire; not full chapter difficulty',damage:s.damageHistory,lifecycle:b.snapshot().enemyLifecycle,waveAccounting:b.snapshot().waveAccounting,x:s.heroX,troops:s.troops});
}
writeFileSync('evidence/R3-COMBAT-PATCH-20261002/combat/seven-kind-route-trace.json',JSON.stringify(rows,null,2));console.log(rows.map(r=>({kind:r.kind,policy:r.policy,loss:r.damage.reduce((n,e)=>n+e.actual,0),release:r.lifecycle.flatMap(q=>q.events).filter(e=>e.stage==='release').length})));
