import fs from 'node:fs';import {createHash} from 'node:crypto';
const modelFiles=['assets/scripts/formal/battle.ts','assets/scripts/formal/data.ts','assets/scripts/formal/EnemyProfiles.ts','assets/scripts/formal/EncounterDirector.ts','assets/scripts/formal/NativeReview.ts'];const modelSourceHashes=Object.fromEntries(modelFiles.map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
import {createBattle} from '../assets/scripts/formal/battle';
import {CHAPTERS,WEAPON_DATA,TREASURES,requiredOfficers} from '../assets/scripts/formal/data';
import {FormalStore} from '../assets/scripts/formal/store';
import {reviewTarget} from '../assets/scripts/formal/NativeReview';
export function referenceStore(chapter:number,variant=0){
 const m=new Map<string,string>(),store=new FormalStore({getItem:k=>m.get(k)||null,setItem:(k,v)=>{m.set(k,v);}});
 for(let i=0;i<chapter;i++)store.settle({id:'prior-'+i,chapter:i,won:true,troops:40,treasures:[],defeatedBossId:CHAPTERS[i].boss,defeatedOfficerIds:requiredOfficers(i)});
 const preferred=variant===1?['goulianqiang','shemao','spear']:variant===2?['guandao','huaji','spear']:['spear'];
 const w=preferred.find(k=>store.data.weapons.includes(k as any))!;store.data.selectedWeaponId=w as any;
 // Spend only earned first-clear and milestone XP; never deploy this chapter's rewards.
 for(let level=1;level<4&&store.data.xp>=level*60;level++){store.data.xp-=level*60;store.data.weaponLevels[w]=level+1;}
 store.data.companions=store.data.captures.slice(-2);store.data.support=store.data.visits.includes('hua')?'hua':store.data.visits[0]||null;
 for(const slot of ['dian','qi','ma'])store.data.slots[slot]=store.data.treasures.filter(k=>TREASURES[k].slot===slot).slice(-1)[0]||null;
 return store;
}
const behavior=(process.env.C20_MATRIX_MODES?process.env.C20_MATRIX_MODES.split(','):['left','center','right','gates','basic','advanced']);
const rows:any[]=[];const maxChapter=Number(process.env.C20_MATRIX_CHAPTERS||20),seedCount=Number(process.env.C20_MATRIX_SEEDS||8);
for(let chapter=0;chapter<maxChapter;chapter++)for(const mode of behavior)for(let seed=1;seed<=seedCount;seed++){
 const store=referenceStore(chapter,mode==='advanced'?(seed-1)%3:0),b=createBattle({chapter,lineup:store.loadout(),seed:seed*7919});let bossTroops=null,last=0,moves=0;
 for(let frame=0;frame<60*260&&!b.state.ended;frame++){
  if(frame%6===0){const s=b.snapshot();let target=mode==='left'?-.55:mode==='right'?.55:mode==='center'?0:mode==='gates'?((s.entities.filter(e=>e.type==='gate'&&!e.passed&&e.z>0&&e.z<18).sort((a,b)=>a.z-b.z||b.val-a.val)[0]?.x)||0):reviewTarget(s);if(Math.abs(target-last)>.15)moves++;last=target;b.move(target);}
  b.step();b.drainAudioEvents();if(b.state.boss&&bossTroops===null)bossTroops=b.state.troops;
 }
 const s=b.snapshot();rows.push({chapter:chapter+1,mode,seed,won:s.phase==='won',timeout:!b.state.ended,seconds:+s.t.toFixed(2),bossTroops,endTroops:s.troops,weapon:store.loadout().startWeaponId,weaponLevel:store.loadout().weaponLevels[store.loadout().startWeaponId],xpRemaining:store.data.xp,moves,effectiveHits:b.ledger.filter(x=>x.kind==='damage').length,damageSources:s.damageSources,timing:s.timing,challengeChoices:b.state.claimedChoices||[],routeXP:s.routeXP,director:s.director});
}
const summary=Array.from({length:maxChapter},(_,i)=>({chapter:i+1,behaviors:Object.fromEntries(behavior.map(mode=>{const r=rows.filter(r=>r.chapter===i+1&&r.mode===mode);return[mode,{wins:r.filter(x=>x.won).length,total:r.length,minSeconds:Math.min(...r.map(x=>x.seconds)),maxSeconds:Math.max(...r.map(x=>x.seconds)),minBoss:Math.min(...r.map(x=>x.timing.boss)),maxBoss:Math.max(...r.map(x=>x.timing.boss))}]}))}));
const output=process.env.C20_MATRIX_OUTPUT||'evidence/YILU-CAMPAIGN20-20260930/difficulty-matrix.json';fs.writeFileSync(output,JSON.stringify({modelSourceHashes,produced_at:new Date().toISOString(),capture_type:'real-combat-logic',reactionSeconds:.3,scope:'six deterministic legal-input scripts; sample rates are not human win rates; fixed stage equipment and earned XP only',rows,summary},null,2));console.log(JSON.stringify(summary,null,2));
