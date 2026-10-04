import {reachableSafety} from './EncounterDirector';
import {formationSafety} from './CombatFootprint';
/** Validation policy consumes a current scene snapshot only: no route table, hidden queue, or enemy intent before warning. */
export function combatReviewTarget(s:any,policy:'stationary'|'positive'|'normal'='normal'){
 if(policy==='stationary')return null;
 const known=(s.entities||[]).filter((e:any)=>e.z>-3&&e.z<30&&!e.dead);
 const urgentGate=known.filter((e:any)=>e.type==='gate'&&!e.passed&&e.z<4&&e.val>0).sort((a:any,b:any)=>a.z-b.z)[0];
 if(policy==='normal'){
  // A 10+ ambush penalty can outweigh one readable arrow: this is an explicit visible-information tradeoff.
  if(urgentGate)return urgentGate.x;
  const hazards=(s.telegraphs||[]).filter((t:any)=>s.t>=t.created+.30&&t.end>s.t),bands=hazards.flatMap((t:any)=>t.bands);
  if(bands.length){const proof=hazards.every((t:any)=>t.riskFootprint)?formationSafety(s.x,s.t,s.t+1.5,3,s.movementBounds||[-.68,.68],s.troops,s.companions?.length||0,hazards.map((t:any)=>t.riskFootprint),0):reachableSafety(s.x,s.t,s.t+1.5,bands,3,.11,[-.68,.68],0);if(proof.target!==null){const aim=s.boss?0:s.x;return proof.intervals.map(([l,r])=>Math.max(l+.006,Math.min(r-.006,aim))).sort((a,b)=>Math.abs(a-aim)-Math.abs(b-aim))[0];}}
 }
 if(s.boss&&['rec','reposition','idle'].includes(s.boss.phase))return 0;
 const gate=known.filter((e:any)=>e.type==='gate'&&!e.passed&&e.z<10&&e.val>0).sort((a:any,b:any)=>a.z-b.z||b.val-a.val)[0];
 if(gate)return gate.x;
 const crate=known.filter((e:any)=>e.type==='crate'&&!e.open&&e.z<22&&(e.kind!=='weapon'||e.gives===s.weapon)).sort((a:any,b:any)=>a.z-b.z)[0];if(crate)return crate.x;
 const target=known.filter((e:any)=>e.type==='enemy'&&e.visibleAt&&e.z>0).sort((a:any,b:any)=>(a.z<8?-30:0)+(['archer','mechanism','banner'].includes(a.enemyKind)?-15:0)+a.z-((b.z<8?-30:0)+(['archer','mechanism','banner'].includes(b.enemyKind)?-15:0)+b.z))[0];
 return target?target.x:0;
}
