import {createBattle} from '../assets/scripts/formal/battle';import {FormalStore} from '../assets/scripts/formal/store';import {CHAPTERS} from '../assets/scripts/formal/data';import {writeFileSync} from 'node:fs';
const mem=new Map<string,string>(),store=new FormalStore({getItem:k=>mem.get(k)||null,setItem:(k,v)=>{mem.set(k,v);}}),runs=[];
export function steer(s:any){const b=s.boss;if(b){if(b.phase==='warn'||b.phase==='strike'){const [l,r]=b.band;return r<.5?.7:l>-.5?-.7:.76;}return 0;}
 const wall=s.entities.find((e:any)=>e.type==='wall'&&e.z<3&&e.z+e.len>-.4);if(wall)return wall.side>0?-.48:.48;
 const es=s.entities.filter((e:any)=>e.z>1&&e.z<30);const crate=es.filter((e:any)=>e.type==='crate'&&!e.open).sort((a:any,b:any)=>a.z-b.z)[0];const gate=es.filter((e:any)=>e.type==='gate'&&!e.passed&&e.z<10).sort((a:any,b:any)=>a.z-b.z||b.val-a.val)[0];if(gate&&(!crate||gate.z<crate.z)){return es.filter((e:any)=>e.type==='gate'&&Math.abs(e.z-gate.z)<.1).sort((a:any,b:any)=>b.val-a.val)[0].x*.9;}return crate?crate.x:0;
}
for(let i=0;i<10;i++){
 const b=createBattle({chapter:i,lineup:store.loadout()});for(let tick=0;tick<60*180&&!b.state.ended;tick++){if(tick%6===0)b.move(steer(b.snapshot()));b.step();}
 const s=b.snapshot();runs.push({chapter:i+1,phase:s.phase,t:s.t,troops:s.troops,weapon:s.weapon,tier:s.tier,arms:s.arms,stats:s.stats,totals:s.totals});console.log(runs.at(-1));if(s.phase!=='won')break;
 store.settle({id:'check-'+i,chapter:i,won:true,troops:s.troops,treasures:s.runGot});if(store.data.captures.length)store.equipCompanion(store.data.captures.at(-1)!);if(store.data.visits.includes('hua'))store.equipSupport(store.data.support==='hua'?'hua':'hua');if(!store.data.support&&store.data.visits.includes('hua'))store.equipSupport('hua');for(const id of store.data.treasures)if(!Object.values(store.data.slots).includes(id))store.equipTreasure(id);
}
writeFileSync('evidence/FORMAL-20260927/model-ten-levels.json',JSON.stringify({scope:'Fixed-step production model, scripted steering; not Cocos or device evidence',runs,save:store.data},null,2));if(runs.length!==10||runs.some(r=>r.phase!=='won'))process.exitCode=1;
