/** Earned battle-local feedback; no random rewards, saved streak or wall-clock timer. */
export const MOMENTUM={threshold:12,duration:6,maxDuration:8,comboWindow:4,damage:1.18,speed:1.12} as const;
export type BattleMomentum={charge:number;until:number;combo:number;bestCombo:number;lastKill:number;kills:number;bursts:number;lastBossCharge:number};
export type MomentumEvent='kill'|'officer'|'pickup'|'boss-hit';
export function createMomentum():BattleMomentum{return {charge:0,until:0,combo:0,bestCombo:0,lastKill:-999,kills:0,bursts:0,lastBossCharge:-999};}
export function momentumView(m:BattleMomentum,now:number){
 const remaining=Math.max(0,m.until-now),active=remaining>0;
 return {active,remaining,charge:m.charge,combo:now-m.lastKill<=MOMENTUM.comboWindow?m.combo:0,bestCombo:m.bestCombo,kills:m.kills,bursts:m.bursts,damage:active?MOMENTUM.damage:1,speed:active?MOMENTUM.speed:1};
}
/** Caller supplies only authoritative death, opened-chest or positive boss-hit events. */
export function earnMomentum(m:BattleMomentum,event:MomentumEvent,now:number):boolean{
 if(!Number.isFinite(now))return false;
 if(event==='kill'||event==='officer'){
  m.combo=now-m.lastKill<=MOMENTUM.comboWindow?m.combo+1:1;m.lastKill=now;
  m.bestCombo=Math.max(m.bestCombo,m.combo);m.kills++;
 }
 if(event==='boss-hit'){
  if(now-m.lastBossCharge<1)return false;
  m.lastBossCharge=now;
 }
 if(now<m.until){
  if(event==='pickup')m.until=Math.min(now+MOMENTUM.maxDuration,m.until+.75);
  return false;
 }
 m.charge=Math.min(MOMENTUM.threshold,m.charge+(event==='officer'?4:event==='pickup'?2:1));
 if(m.charge<MOMENTUM.threshold)return false;
 m.charge=0;m.until=now+MOMENTUM.duration;m.bursts++;return true;
}
