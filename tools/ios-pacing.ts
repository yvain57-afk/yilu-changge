/** Offline deterministic balancing probe. These seconds are simulation time, not device evidence. */
import {FormalStore} from '../assets/scripts/formal/store';
import {createBattle} from '../assets/scripts/formal/battle';
import {CHAPTERS} from '../assets/scripts/formal/data';
import {steer} from './ios-steer';
import {writeFileSync} from 'node:fs';
const memory=new Map<string,string>(),store=new FormalStore({getItem:k=>memory.get(k)??null,setItem:(k,v)=>{memory.set(k,v);}});
const results=[];
for(let chapter=0;chapter<10;chapter++){
 store.data.companions=store.data.captures.slice(-2);if(store.data.visits.includes('hua'))store.data.support='hua';
 for(const [slot,ids] of Object.entries({dian:['taiping'],qi:['yuxi'],ma:['chitu']}))for(const id of ids)if(store.data.treasures.includes(id))store.data.slots[slot]=id;
 const b=createBattle({chapter,lineup:store.loadout()});let march=0,officer=0,boss=0;
 const growth=[];let crates=0;
 for(let tick=0;tick<240*60&&!b.state.ended;tick++){
  if(tick%6===0)b.move(steer(b.snapshot()));
  if(b.state.boss)boss+=1/60;else if(b.state.encounterStop)officer+=1/60;else march+=1/60;
  b.step();
  const n=Object.values(b.state.stats.crates).reduce((a:number,v:number)=>a+v,0);if(n>crates){growth.push({t:b.state.t,weapon:b.state.weapon,tier:b.state.tier,arms:b.state.arms});crates=n;}
 }
 const s=b.snapshot(),won=s.phase==='won';results.push({chapter:chapter+1,won,simulationSeconds:+s.t.toFixed(2),march:+march.toFixed(2),officer:+officer.toFixed(2),boss:+boss.toFixed(2),troops:s.troops,cycles:s.boss?.cycleN,growth,weapon:s.weapon,tier:s.tier,arms:s.arms,loadout:store.loadout()});
 if(!won)break;
 store.settle({id:'model-'+chapter,chapter,won,troops:s.troops,treasures:s.runGot,defeatedOfficerIds:s.defeatedOfficerIds,defeatedBossId:s.defeatedBossId});
}
writeFileSync(process.argv[2]||'evidence/IOS-PLAYABLE-FIX-20260928/model-pacing.json',JSON.stringify({scope:'model-only, automatic legal lateral controls, not native/device elapsed evidence',results},null,2));
console.log(results.map(({chapter,won,simulationSeconds,march,officer,boss,cycles,troops})=>({chapter,won,simulationSeconds,march,officer,boss,cycles,troops})));
