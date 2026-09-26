import {open as baseOpen} from './browser-v03-common.mjs';
import {createRequire} from 'node:module';
const {hazardHit}=createRequire(import.meta.url)('../.cache/logic/hazards.js');
export {startCapture,stopCapture,freshSave,fixtureGame} from './browser-v06-common.mjs';
export const root='evidence/v07';
export const open=(name,width=390,height=844)=>baseOpen('v07-'+name,width,height,{version:'v07-rc1',audio:true,baseURL:'http://127.0.0.1:43189/'});
export function steer(j,route='best'){
 if(j.phase==='boss'){
  const d=j.bossDirector;
  if(d&&(d.phase==='active'||d.phase==='telegraph'&&d.phaseTick>=15))return [0,-.3,.3,-.5,.5,-.7,.7,-.88,.88].filter(x=>!d.warningShapes.some(s=>hazardHit(s,{x:x*2.5,z:j.z},.07))).sort((a,b)=>Math.abs(a)-Math.abs(b)||Math.abs(a-j.x)-Math.abs(b-j.x))[0]??.9;
  return 0;
 }
 const targets=j.assault.targets.filter(t=>!t.resolved&&t.at>j.z&&t.at-j.z<6).sort((a,b)=>a.at-b.at);
 if(targets.length){const first=targets[0],row=targets.filter(t=>Math.abs(t.at-first.at)<.12);
  if(first.kind==='gate'){
   if(first.chain)return first.x;
   if(route==='late'&&first.at-j.z>2.3)return 0;
   const safe=row.filter(t=>t.value>=0).sort((a,b)=>b.value-a.value);
   if(route==='safe'||first.at-j.z<.85)return (safe[0]??row.sort((a,b)=>b.value-a.value)[0]).x;
   return row.sort((a,b)=>b.cap-a.cap)[0].x;
  }
  const score=t=>t.reward==='weapon'?(j.tier<t.amount?100:0):t.reward==='chain'?50:t.amount;
  return row.sort((a,b)=>score(b)-score(a))[0].x;
 }
 let x=j.x,score=-Infinity;for(const candidate of [-.65,-.48,-.3,0,.3,.48,.65]){let s=0;for(const o of j.obstacles)if(o.at>j.z&&o.at-j.z<5&&Math.abs(candidate-o.x)<(j.weapon==='blade'?.29:.15))s+=1/(.8+Math.abs(o.at-j.z-2.3));s-=Math.abs(candidate-j.x)*.12;if(s>score){score=s;x=candidate;}}
 for(const w of j.warnings)if(!w.hit&&Math.abs(x-w.x)<w.width+.08)x=w.x>0?-.38:.38;return x;
}
