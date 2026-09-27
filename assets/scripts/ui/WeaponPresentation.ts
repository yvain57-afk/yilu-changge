import type {Journey} from '../core/model';
import type {Member,Shot} from '../core/runner';
import {CAST,WeaponId} from '../core/weapons';
export type AttackPose='Idle'|'Windup'|'Release'|'Recover';
/** Read-only presentation of actual issued projectiles. No animation callback
 * participates in firing, damage, movement, claiming or survival. */
export class WeaponPresentation {
 private run:Journey|null=null;private runSerial=0;private lastId=0;
 private lastFires=new Map<number,{tick:number;id:number;weapon:WeaponId}>();
 readonly events:{run:number;id:number;owner:number;weapon:WeaponId;tick:number}[]=[];
 observed=0;namedObserved=0;
 clear(){this.run=null;this.lastId=0;this.lastFires.clear();this.events.length=0;this.observed=0;this.namedObserved=0;}
 observe(j:Journey){
  if(this.run!==j){this.clear();this.run=j;this.runSerial++;}
  const r=j.runner!;const ids=new Set(r.members.map(m=>m.id));
  for(const id of this.lastFires.keys())if(!ids.has(id))this.lastFires.delete(id);
  for(const f of r.recentFires){if(f.id<=this.lastId)continue;this.lastId=f.id;this.observed++;if(f.origin.role!=='soldier')this.namedObserved++;
   this.events.push({run:this.runSerial,id:f.id,owner:f.origin.owner,weapon:f.origin.weapon,tick:f.issuedTick});
   if(ids.has(f.origin.owner))this.lastFires.set(f.origin.owner,{tick:f.issuedTick,id:f.id,weapon:f.origin.weapon});
  }
  if(this.events.length>192)this.events.splice(0,this.events.length-192);
 }
 identity(j:Journey,m:Member){return m.role==='hero'?j.weapon:m.role==='companion'&&j.companion?CAST[j.companion].weapon:'bow';}
 prefix(j:Journey,m:Member){return m.role==='hero'?(j.weapon==='blade'?'blade':'spear'):j.companion==='xing_daorong'?'xing':j.companion==='chen_ying'?'chen':'zhao';}
 pose(j:Journey,m:Member):{pose:AttackPose;age:number;eventId:number|null;weapon:WeaponId}{
  const f=this.lastFires.get(m.id),age=f?(j.simulationTick-f.tick)/60:100,next=j.runner!.nextFireAtSeconds(m.id)-j.elapsed;
  const pose:AttackPose=age<.065?'Release':next>0&&next<=.08&&age>=.10?'Windup':age<.20?'Recover':'Idle';
  return{pose,age,eventId:f?.id??null,weapon:this.identity(j,m)};
 }
 wave(s:Shot){return s.origin.weapon==='blade'?'bladeWave':s.origin.weapon==='great_axe'?'axeWave':s.origin.weapon==='throwing_fork'?'forkWave':'spearWave';}
 get diagnostics(){return{run:this.runSerial,observed:this.observed,namedObserved:this.namedObserved,events:this.events,trackedActors:this.lastFires.size,source:'RunnerDirector.recentFires; actual issued projectile IDs',damageDrivenByAnimation:false};}
}
