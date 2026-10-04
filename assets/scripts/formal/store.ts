import {Storage} from '../core/save';
import {CHAPTERS,PEOPLE,TREASURES,WEAPON_DATA,WeaponId,Slot,TUNING,requiredOfficers,MILESTONES,milestoneFor} from './data';
import {RewardItem,RewardPresentation} from './RewardFlow';
export const RULES_VERSION='campaign20-20260930';
export const FORMAL_KEY='yilu-changge-formal-v2';
export interface FormalSave {schemaVersion:2|3;cleared:string[];best:Record<string,number>;claimed:string[];weapons:string[];weaponLevels:Record<string,number>;captures:string[];visits:string[];allies:string[];treasures:string[];companions:string[];support:string|null;slots:Record<Slot,string|null>;xp:number;seen:string[];selectedWeaponId:string;badges:string[];historicalHonors:string[];pendingRewardPresentation:RewardPresentation|null;[key:string]:unknown}
const fresh=():FormalSave=>({schemaVersion:3,rulesVersion:RULES_VERSION,ruleBests:{},cleared:[],best:{},claimed:[],weapons:['spear'],weaponLevels:{spear:1},captures:[],visits:[],allies:[],treasures:[],companions:[],support:null,slots:{dian:null,qi:null,ma:null},xp:0,seen:[],selectedWeaponId:'spear',badges:[],historicalHonors:[],pendingRewardPresentation:null});
const uniq=(v:unknown):string[]=>Array.isArray(v)?Array.from(new Set(v.filter((x):x is string=>typeof x==='string'))):[];
export class FormalStore {
 data:FormalSave=fresh();notice='';private blocked=false;private migrationPending=false;
 constructor(private storage:Storage){
  try{const raw=storage.getItem(FORMAL_KEY);if(raw!==null){const p=JSON.parse(raw);if(![2,3].includes(p.schemaVersion)||!Array.isArray(p.cleared)||!p.slots||typeof p.slots!=='object')throw Error('invalid formal save');this.data={...fresh(),...p};for(const k of ['cleared','claimed','weapons','captures','visits','allies','treasures','companions','seen','badges','historicalHonors'] as const)this.data[k]=uniq(p[k]);this.data.slots={...fresh().slots,...p.slots};this.data.best={...p.best};this.data.weaponLevels={...p.weaponLevels};if(!Number.isFinite(this.data.xp)||this.data.xp<0)throw Error('invalid XP');
   this.data.selectedWeaponId=this.data.weapons.includes(p.selectedWeaponId)&&WEAPON_DATA[p.selectedWeaponId as WeaponId]?p.selectedWeaponId:'spear';
   if(p.schemaVersion===2){
    const before=JSON.parse(JSON.stringify(this.data)) as FormalSave;
    try{let key=FORMAL_KEY+'-campaign20-original';const existing=storage.getItem(key);if(existing!==null&&existing!==raw){let hash=2166136261;for(let i=0;i<raw.length;i++)hash=Math.imul(hash^raw.charCodeAt(i),16777619);key+='-'+raw.length+'-'+(hash>>>0).toString(16);}const backup=storage.getItem(key);if(backup!==null&&backup!==raw)throw Error('conflicting migration backup');if(backup===null)storage.setItem(key,raw);if(storage.getItem(key)!==raw)throw Error('migration backup readback');this.data.migrationBackupKey=key;
     if(this.completed>=10)this.data.historicalHonors=uniq([...this.data.historicalHonors,'王']);
     this.data.schemaVersion=3;this.data.weaponSelectionIntro=true;let count=0;
     for(const m of MILESTONES)if(this.completed>=m.chapter&&!this.data.claimed.includes('milestone:'+m.id)){this.data.claimed.push('milestone:'+m.id);this.data.badges.push(m.badge);this.data.xp+=m.xpBonus;count++;}
     if(count)this.data.pendingRewardPresentation={key:'migration:campaign20',chapter:Math.max(0,this.completed-1),kind:'migration',title:'征程更新',xp:count*60,items:[],backfilled:count};
     if(!this.save())throw Error('migration persistence failed');
    }catch{this.data=before;this.blocked=true;this.migrationPending=true;this.notice='征程迁移尚未保存，原记录和备份已保留，请重试。';}
   }
  }else{const legacy:Record<string,string>={};for(const key of ['yilu-changge-v1','yilu-changge-prototype-v2','yilu-changge-growth-v05','yilu-changge-campaign-v04','yilu-changge-tactics-v06']){const value=storage.getItem(key);if(value!==null)legacy[key]=value;}
   if(Object.keys(legacy).length){if(!storage.getItem(FORMAL_KEY+'-legacy-backup'))storage.setItem(FORMAL_KEY+'-legacy-backup',JSON.stringify(legacy));this.data.legacy=legacy;}}
  }catch{this.blocked=true;this.notice='记录读取失败：原记录保留，请重试读取。';}
 }
 get completed(){let n=0;while(n<CHAPTERS.length&&this.data.cleared.includes(CHAPTERS[n].id))n++;return n;}
 unlocked(i:number){return Number.isInteger(i)&&i>=0&&i<CHAPTERS.length&&i<=this.completed;}
 get companionLimit(){return this.completed>=3?2:1;}
 slotOpen(slot:Slot){return this.completed>=({dian:1,qi:2,ma:3}[slot]);}
 loadout(){const d=this.data;return {startWeaponId:d.weapons.includes(d.selectedWeaponId)&&WEAPON_DATA[d.selectedWeaponId as WeaponId]?d.selectedWeaponId:'spear',tactic:d.mainTactic==='zhenjun'?'zhenjun':'guanzhen',companions:d.companions.filter(x=>d.captures.includes(x)&&PEOPLE[x]).slice(0,this.companionLimit),support:this.completed>=2&&d.visits.includes(d.support||'')?d.support:null,allies:d.allies.filter(x=>PEOPLE[x]),treasures:Object.fromEntries((['dian','qi','ma'] as Slot[]).map(k=>[k,this.slotOpen(k)&&d.treasures.includes(d.slots[k]||'')&&TREASURES[d.slots[k]!]?.slot===k?d.slots[k]:null])),weapons:d.weapons.filter(x=>WEAPON_DATA[x as WeaponId]),treasurePool:d.treasures.filter(x=>TREASURES[x]),weaponLevels:{...d.weaponLevels},replayOrder:this.completed===CHAPTERS.length?d.replayOrder:null};}
 save(){if(this.blocked)return false;let old:string|null=null;let wrote=false;try{
  old=this.storage.getItem(FORMAL_KEY);const raw=JSON.stringify({...this.data,rulesVersion:RULES_VERSION});
  if(old!==null)this.storage.setItem(FORMAL_KEY+'-previous',old);
  this.storage.setItem(FORMAL_KEY+'-pending',raw);if(this.storage.getItem(FORMAL_KEY+'-pending')!==raw)throw Error('staging readback failed');
  this.storage.setItem(FORMAL_KEY,raw);wrote=true;if(this.storage.getItem(FORMAL_KEY)!==raw)throw Error('committed readback failed');
  this.data.rulesVersion=RULES_VERSION;this.notice='';return true;
 }catch{if(wrote&&old!==null){try{this.storage.setItem(FORMAL_KEY,old);}catch{/* exact prior record remains in -previous */}}
  this.notice='保存失败，成长仍保留在本次会话；请重试保存。';return false;}}
 retry(){if(this.blocked){const next=new FormalStore(this.storage);if(next.blocked){this.notice=next.notice;return false;}this.data=next.data;this.blocked=false;this.migrationPending=false;}return this.save();}
 selectWeapon(id:string){if(!this.data.weapons.includes(id)||!WEAPON_DATA[id as WeaponId])return false;this.data.selectedWeaponId=id;this.data.weaponSelectionIntro=false;return this.save();}
 acknowledgePresentation(){const old=this.data.pendingRewardPresentation;this.data.pendingRewardPresentation=null;if(this.save())return true;this.data.pendingRewardPresentation=old;return false;}
 setReplayOrder(order:string|null){if(this.completed<CHAPTERS.length||order!==null&&!['elite','few-supplies','double-officers'].includes(order))return false;this.data.replayOrder=order;return this.save();}
 equipTactic(){this.data.mainTactic=this.data.mainTactic==='zhenjun'?'guanzhen':'zhenjun';return this.save();}
 equipCompanion(id:string){if(!this.data.captures.includes(id))return false;const a=this.data.companions;if(a.includes(id))this.data.companions=a.filter(x=>x!==id);else this.data.companions=[...a.slice(-(this.companionLimit-1)||a.length),id].slice(-this.companionLimit);return this.save();}
 equipSupport(id:string){if(this.completed<2||!this.data.visits.includes(id))return false;this.data.support=this.data.support===id?null:id;return this.save();}
 equipTreasure(id:string){const t=TREASURES[id];if(!t||!this.slotOpen(t.slot)||!this.data.treasures.includes(id))return false;this.data.slots[t.slot]=this.data.slots[t.slot]===id?null:id;return this.save();}
 upgrade(id:string){if(!this.data.weapons.includes(id))return false;const n=this.data.weaponLevels[id]||1,cost=TUNING.upgradeCost(n);if(n>=TUNING.weaponMaxLevel||this.data.xp<cost)return false;this.data.xp-=cost;this.data.weaponLevels[id]=n+1;return this.save();}
 settle(run:{id:string;chapter:number;won:boolean;troops:number;treasures:string[];defeatedOfficerIds?:string[];defeatedBossId?:string|null;practiceSegments?:number[];effectiveHits?:number;routeXP?:number}){
  if(this.blocked||this.data.claimed.includes('run:'+run.id))return false;
  const c=CHAPTERS[run.chapter];if(!c||!this.unlocked(run.chapter)||!Number.isFinite(run.troops)||run.troops<0||(run.won&&run.troops<1))return false;
  if(run.won&&(run.defeatedBossId!==c.boss||!requiredOfficers(run.chapter).every(id=>run.defeatedOfficerIds?.includes(id))))return false;
  const ruleBests=(this.data.ruleBests||{}) as Record<string,Record<string,number>>;this.data.ruleBests=ruleBests;
  this.data.claimed.push('run:'+run.id);
  if(!run.won){let xp=0;if((run.effectiveHits||0)>0)for(const segment of new Set(run.practiceSegments||[]))if([1,2,3,4].includes(segment)){const key=`practice:${RULES_VERSION}:${c.id}:${segment}`;if(!this.data.claimed.includes(key)){this.data.claimed.push(key);xp+=2;}}this.data.xp+=xp;this.data.lastPracticeXP=xp;return this.save();}
  ruleBests[RULES_VERSION]??={};ruleBests[RULES_VERSION][c.id]=Math.max(ruleBests[RULES_VERSION][c.id]||0,Math.floor(run.troops));
  const first=!this.data.cleared.includes(c.id),items:RewardItem[]=[];let xp=(first?c.firstClearXP??TUNING.clearXP:TUNING.replayXP)+Math.max(0,Math.min(4,Math.floor(run.routeXP||0)));
  this.data.best[c.id]=Math.max(this.data.best[c.id]||0,Math.floor(run.troops));
  const grant=(kind:'person'|'weapon'|'treasure',id:string,array:string[],relation?:'收'|'访'|'盟')=>{const isNew=!array.includes(id);if(isNew)array.push(id);items.push({kind,id,relation,isNew});};
  if(first){this.data.cleared.push(c.id);for(const id of c.capture)grant('person',id,this.data.captures,'收');for(const id of c.visit)grant('person',id,this.data.visits,'访');for(const id of c.allies)grant('person',id,this.data.allies,'盟');this.data.seen=uniq([...this.data.seen,c.boss,...c.enemy,...c.capture,...c.visit,...c.allies]);if(c.weapon){grant('weapon',c.weapon,this.data.weapons);this.data.weaponLevels[c.weapon]??=1;}if(c.treasure)grant('treasure',c.treasure,this.data.treasures);}
  for(const id of uniq(run.treasures).filter(x=>TREASURES[x]))if(!this.data.treasures.includes(id))grant('treasure',id,this.data.treasures);
  const milestone=milestoneFor(run.chapter),newMilestone=milestone&&!this.data.claimed.includes('milestone:'+milestone.id);
  if(newMilestone){this.data.claimed.push('milestone:'+milestone.id);this.data.badges=uniq([...this.data.badges,milestone.badge]);xp+=milestone.xpBonus;items.push({kind:'badge',id:milestone.badge,isNew:true});}
  this.data.xp+=xp;this.data.lastRewardXP=xp;
  if(first||newMilestone||items.length)this.data.pendingRewardPresentation={key:'reward:'+run.id,chapter:run.chapter,kind:newMilestone?'milestone':'victory',title:newMilestone?milestone.title:c.title+' · 首胜',xp,items,milestoneId:newMilestone?milestone.id:undefined,priorWeaponId:this.data.selectedWeaponId};
  return this.save();
 }
}
