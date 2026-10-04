/** DEBUG/offline reference loadout uses only already-earned inventory and available XP.
 * No rewards, damage, progress or time are injected here. */
import {TREASURES} from './data';
export function configureCampaignReference(store:any,variant=0){
 const d=store.data,preferred=variant===1?['goulianqiang','shemao','spear']:variant===2?['guandao','huaji','spear']:['spear'];
 const weapon=preferred.find(k=>d.weapons.includes(k))||'spear';
 store.selectWeapon(weapon);
 while((d.weaponLevels[weapon]||1)<4){const level=d.weaponLevels[weapon]||1;if(d.xp<level*60||!store.upgrade(weapon))break;}
 d.companions=d.captures.slice(-2);d.support=d.visits.includes('hua')?'hua':d.visits[0]||null;
 for(const slot of ['dian','qi','ma'])d.slots[slot]=d.treasures.filter((k:string)=>TREASURES[k].slot===slot).slice(-1)[0]||null;
 store.save();return store.loadout();
}
