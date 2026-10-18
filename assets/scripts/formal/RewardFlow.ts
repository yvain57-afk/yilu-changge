import {CHAPTERS,PEOPLE,TREASURES,WEAPON_DATA,WeaponId,MILESTONES} from './data';
export type RewardItem={kind:'person'|'weapon'|'treasure'|'badge';id:string;relation?:'收'|'访'|'盟';isNew:boolean};
export type RewardPresentation={key:string;chapter:number;kind:'victory'|'milestone'|'migration';title:string;xp:number;items:RewardItem[];milestoneId?:string;backfilled?:number;priorWeaponId?:string};
/** Presentation never grants rewards. The persisted transaction is its only input. */
export const presentationDuration=(r:RewardPresentation)=>r.kind==='migration'?3:r.kind==='milestone'?4.5:r.items.length>1?2.5:r.items[0]?.kind==='treasure'?1.8:r.items[0]?.kind==='weapon'?2:2.5;
export const canSkipPresentation=(age:number)=>age>=.8;
export function rewardLabel(item:RewardItem){return item.kind==='weapon'?WEAPON_DATA[item.id as WeaponId]?.label||item.id:item.kind==='treasure'?TREASURES[item.id]?.name||item.id:item.kind==='person'?PEOPLE[item.id]||item.id:'征程印章';}
export function nextMilestoneHint(completed:number){const next=MILESTONES.find(m=>m.chapter>completed);if(!next)return '九州长歌 · 自由重游';const id=next.primaryNewContent,content=WEAPON_DATA[id as WeaponId]?.label||TREASURES[id]?.name||PEOPLE[id]||'新征程';return `再胜${next.chapter-completed}关 · ${next.title} · ${content}`;}
