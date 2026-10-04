import {armySlots,companionSlots} from './presentation';
import type {Band} from './EncounterDirector';
export interface RiskFootprint {shape:'segment'|'depth-band';bands:Band[];zMin:number;zMax:number;width:number;origin?:{x:number,z:number};originEnd?:{x:number,z:number};target?:{x:number,z:number};wallSides:number[];}
export function formationFeet(troops:number,companions:number,x:number,side=0){return [{x,z:0,role:'hero'},...companionSlots(x,companions,side).map(p=>({...p,role:'companion'})),...armySlots(troops,x,side).map(p=>({...p,role:'soldier'}))];}
/** Same foot-depth/axis tolerances as real collision, plus 2 cm margin for the bounded centre samples. */
export function footAtRisk(p:{x:number,z:number},risk:RiskFootprint,margin=0){
 if(p.z<risk.zMin-margin||p.z>risk.zMax+margin)return false;
 if(risk.shape==='segment'&&risk.origin&&risk.originEnd&&risk.target){
  // Every intermediate release origin lies on origin--originEnd. Its line to
  // the locked target fills this triangle. Clip it to the foot's depth band;
  // unlike checking only the two end rays, this also includes an intermediate
  // source passing the foot before the shortest end ray starts.
  const vertices=[risk.origin,risk.originEnd,risk.target],low=p.z-.36-margin,high=p.z+.36+margin,xs:number[]=[];
  for(let i=0;i<3;i++){
   const a=vertices[i],b=vertices[(i+1)%3];
   if(a.z>=low&&a.z<=high)xs.push(a.x);
   if(a.z===b.z)continue;
   for(const z of [low,high]){const u=(z-a.z)/(b.z-a.z);if(u>=0&&u<=1)xs.push(a.x+(b.x-a.x)*u);}
  }
  return xs.length>0&&p.x>=Math.min(...xs)-risk.width-margin&&p.x<=Math.max(...xs)+risk.width+margin;
 }
 if(risk.shape==='segment'&&risk.origin&&risk.target){const a=risk.origin,b=risk.target,dx=b.x-a.x,dz=b.z-a.z,u=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));return Math.abs(a.x+u*dx-p.x)<=risk.width+margin&&Math.abs(a.z+u*dz-p.z)<=.36+margin;}
 return risk.bands.some(([l,r])=>p.x+margin>l-risk.width&&p.x-margin<r+risk.width);
}
/** Finite 1D proof; no route look-ahead or unbounded path search. Each centre recomputes non-rigid formation clamps. */
export function formationSafety(x:number,now:number,execute:number,speed:number,bounds:Band,troops:number,companions:number,risks:RiskFootprint[],reaction=.30){
 const reach=Math.max(0,execute-now-reaction)*speed,lo=Math.max(bounds[0],x-reach),hi=Math.min(bounds[1],x+reach),intervals:Band[]=[];
 if(hi-lo<.012)return {safe:false,intervals,target:null};
 const step=.01,n=Math.ceil((hi-lo)/step),stride=(hi-lo)/n;let start:number|null=null;
 for(let i=0;i<=n;i++){const centre=lo+i*stride,safe=risks.every(r=>(r.wallSides.length?r.wallSides:[0]).every(side=>formationFeet(troops,companions,centre,side).every(p=>!footAtRisk(p,r,.02))));
  if(safe&&start===null)start=centre;
  if((!safe||i===n)&&start!==null){const end=safe?centre:centre-stride;if(end-start>.012)intervals.push([start+.005,end-.005]);start=null;}
 }
 const target=intervals.length?intervals.reduce((best,[l,r])=>{const q=Math.max(l,Math.min(r,x));return Math.abs(q-x)<Math.abs(best-x)?q:best;},Infinity):null;return {safe:intervals.length>0,intervals,target};
}
