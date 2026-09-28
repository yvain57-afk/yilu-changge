import {Storage} from '../core/save';
import {CHAPTERS,PEOPLE,TREASURES,WEAPON_DATA,WeaponId,Slot,TUNING} from './data';
export const FORMAL_KEY='yilu-changge-formal-v2';
export interface FormalSave {schemaVersion:2;cleared:string[];best:Record<string,number>;claimed:string[];weapons:string[];weaponLevels:Record<string,number>;captures:string[];visits:string[];allies:string[];treasures:string[];companions:string[];support:string|null;slots:Record<Slot,string|null>;xp:number;seen:string[];[key:string]:unknown}
const fresh=():FormalSave=>({schemaVersion:2,cleared:[],best:{},claimed:[],weapons:['spear'],weaponLevels:{spear:1},captures:[],visits:[],allies:[],treasures:[],companions:[],support:null,slots:{dian:null,qi:null,ma:null},xp:0,seen:[]});
const uniq=(v:unknown):string[]=>Array.isArray(v)?Array.from(new Set(v.filter((x):x is string=>typeof x==='string'))):[];
export class FormalStore {
 data:FormalSave=fresh();notice='';private blocked=false;
 constructor(private storage:Storage){
  try{const raw=storage.getItem(FORMAL_KEY);if(raw!==null){const p=JSON.parse(raw);if(p.schemaVersion!==2||!Array.isArray(p.cleared)||!p.slots)throw Error('invalid formal save');this.data={...fresh(),...p};for(const k of ['cleared','claimed','weapons','captures','visits','allies','treasures','companions','seen'] as const)this.data[k]=uniq(p[k]);this.data.slots={...fresh().slots,...p.slots};this.data.best={...p.best};this.data.weaponLevels={...p.weaponLevels};if(!Number.isFinite(this.data.xp)||this.data.xp<0)throw Error('invalid XP');}
   else {const legacy:Record<string,string>={};for(const key of ['yilu-changge-v1','yilu-changge-prototype-v2','yilu-changge-growth-v05','yilu-changge-campaign-v04','yilu-changge-tactics-v06']){const value=storage.getItem(key);if(value!==null)legacy[key]=value;}
    if(Object.keys(legacy).length){if(!storage.getItem(FORMAL_KEY+'-legacy-backup'))storage.setItem(FORMAL_KEY+'-legacy-backup',JSON.stringify(legacy));this.data.legacy=legacy;/* Old records retain their identities and scores. No cross-mode reward fabrication. */}
   }
  }catch{this.blocked=true;this.notice='记录读取失败：原记录保留，请重试读取。';}
 }
 get completed(){let n=0;while(n<10&&this.data.cleared.includes(CHAPTERS[n].id))n++;return n;}
 unlocked(i:number){return Number.isInteger(i)&&i>=0&&i<10&&i<=this.completed;}
 get companionLimit(){return this.completed>=3?2:1;}
 slotOpen(slot:Slot){return this.completed>=({dian:1,qi:2,ma:3}[slot]);}
 loadout(){const d=this.data;return {tactic:d.mainTactic==='zhenjun'?'zhenjun':'guanzhen',companions:d.companions.filter(x=>d.captures.includes(x)&&PEOPLE[x]).slice(0,this.companionLimit),support:this.completed>=2&&d.visits.includes(d.support||'')?d.support:null,allies:d.allies.filter(x=>PEOPLE[x]),treasures:Object.fromEntries((['dian','qi','ma'] as Slot[]).map(k=>[k,this.slotOpen(k)&&d.treasures.includes(d.slots[k]||'')&&TREASURES[d.slots[k]!]?.slot===k?d.slots[k]:null])),weapons:d.weapons.filter(x=>WEAPON_DATA[x as WeaponId]),treasurePool:d.treasures.filter(x=>TREASURES[x]),weaponLevels:{...d.weaponLevels}};}
 save(){if(this.blocked)return false;try{this.storage.setItem(FORMAL_KEY,JSON.stringify(this.data));this.notice='';return true;}catch{this.notice='保存失败，成长仍保留在本次会话；请重试保存。';return false;}}
 retry(){if(this.blocked){const next=new FormalStore(this.storage);if(next.blocked){this.notice=next.notice;return false;}this.data=next.data;this.blocked=false;}return this.save();}
 equipTactic(){this.data.mainTactic=this.data.mainTactic==='zhenjun'?'guanzhen':'zhenjun';return this.save();}
 equipCompanion(id:string){if(!this.data.captures.includes(id))return false;const a=this.data.companions;if(a.includes(id))this.data.companions=a.filter(x=>x!==id);else this.data.companions=[...a.slice(-(this.companionLimit-1)||a.length),id].slice(-this.companionLimit);return this.save();}
 equipSupport(id:string){if(this.completed<2||!this.data.visits.includes(id))return false;this.data.support=this.data.support===id?null:id;return this.save();}
 equipTreasure(id:string){const t=TREASURES[id];if(!t||!this.slotOpen(t.slot)||!this.data.treasures.includes(id))return false;this.data.slots[t.slot]=this.data.slots[t.slot]===id?null:id;return this.save();}
 upgrade(id:string){if(!this.data.weapons.includes(id))return false;const n=this.data.weaponLevels[id]||1,cost=TUNING.upgradeCost(n);if(n>=TUNING.weaponMaxLevel||this.data.xp<cost)return false;this.data.xp-=cost;this.data.weaponLevels[id]=n+1;return this.save();}
 settle(run:{id:string;chapter:number;won:boolean;troops:number;treasures:string[]}){
  if(this.blocked||this.data.claimed.includes('run:'+run.id))return false;
  const c=CHAPTERS[run.chapter];if(!c||!this.unlocked(run.chapter)||!Number.isFinite(run.troops)||run.troops<0||(run.won&&run.troops<1))return false;
  this.data.claimed.push('run:'+run.id);if(!run.won)return this.save();
  const first=!this.data.cleared.includes(c.id);
  this.data.best[c.id]=Math.max(this.data.best[c.id]||0,Math.floor(run.troops));this.data.xp+=first?TUNING.clearXP:TUNING.replayXP;
  if(first){this.data.cleared.push(c.id);this.data.captures=uniq([...this.data.captures,...c.capture]);this.data.visits=uniq([...this.data.visits,...c.visit]);this.data.allies=uniq([...this.data.allies,...c.allies]);this.data.seen=uniq([...this.data.seen,c.boss,...c.enemy,...c.capture,...c.visit,...c.allies]);if(c.weapon){this.data.weapons=uniq([...this.data.weapons,c.weapon]);this.data.weaponLevels[c.weapon]??=1;}if(c.treasure)this.data.treasures=uniq([...this.data.treasures,c.treasure]);}
  this.data.treasures=uniq([...this.data.treasures,...run.treasures.filter(x=>TREASURES[x]&&this.data.treasures.includes(x))]);
  return this.save();
 }
}
