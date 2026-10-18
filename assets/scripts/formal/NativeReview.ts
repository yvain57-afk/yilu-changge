/** DEBUG-only input from already-visible information. Real movement, damage and rewards remain authoritative. */
import {reachableSafety} from './EncounterDirector';
export function reviewTarget(s:any):number{
 const wall=s.entities.find((e:any)=>e.type==='wall'&&e.z<6&&e.z+e.len>-.4),bounds:any=wall?(wall.side>0?[-.68,-.42]:[.42,.68]):[-.68,.68];
 const warnings=(s.telegraphs||[]).filter((t:any)=>s.t-t.created>=.30&&t.end>s.t),bands=warnings.flatMap((t:any)=>t.bands);
 for(const band of s.threatBands||[])bands.push(band);
 if(bands.length){const proof=reachableSafety(s.x,s.t,s.t+3,bands,3,s.teamHalf||.28,bounds,0);if(proof.safe){const [l,r]=proof.intervals.sort((a,b)=>Math.abs((a[0]+a[1])/2-s.x)-Math.abs((b[0]+b[1])/2-s.x))[0];return (l+r)/2;}return s.target;}
 if(wall)return wall.side>0?-.56:.56;
 if(s.boss)return 0;
 const officer=s.entities.find((e:any)=>e.type==='officer'&&!e.dead&&e.z<30);if(officer)return officer.x;
 const es=s.entities.filter((e:any)=>e.z>1&&e.z<30),crate=es.filter((e:any)=>e.type==='crate'&&!e.open&&(e.kind!=='weapon'||e.gives===s.weapon)).sort((a:any,b:any)=>a.z-b.z)[0],gate=es.filter((e:any)=>e.type==='gate'&&!e.passed&&e.z<10).sort((a:any,b:any)=>a.z-b.z||b.val-a.val)[0];
 if(gate&&(!crate||gate.z<crate.z))return es.filter((e:any)=>e.type==='gate'&&Math.abs(e.z-gate.z)<.1).sort((a:any,b:any)=>b.val-a.val)[0].x*.9;
 const approaching=es.filter((e:any)=>e.type==='enemy'&&!e.dead&&e.z<10).sort((a:any,b:any)=>a.z-b.z)[0];if(approaching&&(!crate||crate.z>12))return Math.max(-.68,Math.min(.68,approaching.x));
 return crate?crate.x:0;
}
