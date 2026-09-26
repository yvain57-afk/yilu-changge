import {Book,Storage,IDS} from './save';import {PlayerWeapon,CompanionId} from './weapons';
export const GROWTH_KEY='yilu-changge-growth-v05';
export type GrowthSave={schemaVersion:1;unlockedWeapons:PlayerWeapon[];unlockedCompanions:CompanionId[];equippedWeapon:PlayerWeapon;equippedCompanion:CompanionId|null;claimedRewards:string[];[key:string]:unknown};
const companions:CompanionId[]=['xing_daorong','chen_ying','zhao_yun_guest'];
export class Growth {
 data:GrowthSave={schemaVersion:1,unlockedWeapons:['spear'],unlockedCompanions:[],equippedWeapon:'spear',equippedCompanion:null,claimedRewards:[]};notice='';
 constructor(private storage:Storage,private book:Book){try{const raw=storage.getItem(GROWTH_KEY);if(raw!==null){const p=JSON.parse(raw);if(p.schemaVersion!==1||!Array.isArray(p.unlockedWeapons)||!Array.isArray(p.unlockedCompanions)||!Array.isArray(p.claimedRewards))throw Error('invalid growth');this.data={...p,schemaVersion:1,unlockedWeapons:['spear',...p.unlockedWeapons.filter((v:any)=>v==='blade')],unlockedCompanions:companions.filter(id=>p.unlockedCompanions.indexOf(id)>=0),equippedWeapon:p.equippedWeapon==='blade'?'blade':'spear',equippedCompanion:companions.indexOf(p.equippedCompanion)>=0?p.equippedCompanion:null,claimedRewards:p.claimedRewards.filter((v:any)=>typeof v==='string')};}}catch{this.notice='成长记录已恢复，本次仍可继续。';}
  this.reconcile();
 }
 reconcile(){IDS.forEach((id,i)=>{if(!this.book.data.cleared[id])return;const reward='first_clear:'+id;if(this.data.claimedRewards.indexOf(reward)<0)this.data.claimedRewards.push(reward);const c=companions[i];if(this.data.unlockedCompanions.indexOf(c)<0)this.data.unlockedCompanions.push(c);if(i===0&&this.data.unlockedWeapons.indexOf('blade')<0)this.data.unlockedWeapons.push('blade');});if(!this.data.equippedCompanion&&this.data.unlockedCompanions.indexOf('xing_daorong')>=0)this.data.equippedCompanion='xing_daorong';if(this.data.unlockedWeapons.indexOf(this.data.equippedWeapon)<0)this.data.equippedWeapon='spear';if(this.data.equippedCompanion&&this.data.unlockedCompanions.indexOf(this.data.equippedCompanion)<0)this.data.equippedCompanion=null;this.persist();}
 equipWeapon(id:PlayerWeapon){if(this.data.unlockedWeapons.indexOf(id)<0)return false;this.data.equippedWeapon=id;return this.persist();}
 equipCompanion(id:CompanionId){if(this.data.unlockedCompanions.indexOf(id)<0)return false;this.data.equippedCompanion=id;return this.persist();}
 persist():boolean{try{this.storage.setItem(GROWTH_KEY,JSON.stringify(this.data));this.notice='';return true;}catch{this.notice='选择与成长记录未保存，本次数据仍保留，请重试。';return false;}}
}
