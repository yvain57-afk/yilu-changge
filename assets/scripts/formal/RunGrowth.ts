import {TREASURES} from './data';

/** Battle-local only: create this from the equipped IDs; never attach it to a save. */
export type RunGrowth={power:number;guard:number;haste:number;relics:string[];pickups:number};
export type GrowthKind='power'|'guard'|'haste'|'treasure';
export type GrowthEffect='thunder'|'flame'|'blade'|'shield';
export type GrowthReward={title:string;detail:string;icon:string|null;color:string};

export const RUN_GROWTH_COPY={
 weapon:'同兵器匣升至Ⅱ、Ⅲ阶；满阶后仍增加本局威力。换兵器保留阶位。',
 treasure:'宝匣击破即刻强化：每件不同宝物增加8%威力并开启被动；重复宝物转为威力强化。额外宝物不挤掉已佩戴的槽位。',
 general:'援将箱开出本局助阵武将；已获得的专属兵器自动配给本主，随军伤害增加50%；主将持同兵器时另获25%共鸣。',
 persistence:'沿途强化只在本局生效。沿途兵器、宝物胜利后入库，可在整备装备；援将为本局助阵，永久武将按关卡解锁。失败不改已有收藏。',
};

const EFFECTS:Record<GrowthEffect,{summary:string;color:string}>={
 thunder:{summary:'雷链：每3次主将出招，命中时连锁至多3名近敌',color:'#9CDBF5'},
 flame:{summary:'烈焰：每3次主将出招，命中时追加一次范围溅射',color:'#F4AF64'},
 blade:{summary:'扇刃：每3次主将出招，追加一轮扇形刃气',color:'#B5E8CF'},
 shield:{summary:'护盾：每10秒补充1点护盾，抵消1名战损',color:'#DCCB94'},
};
const PICKUP_EFFECTS:Record<GrowthEffect,string>={
 thunder:'每3次出招雷链，连锁3敌',
 flame:'每3次出招烈焰，近敌溅射',
 blade:'每3次出招，追加双侧扇刃',
 shield:'护盾+1，每10秒补充',
};

/** Added run passive. A relic's original equipped-slot effect remains in data.ts. */
export const TREASURE_GROWTH:Record<string,GrowthEffect>={
 taiping:'thunder',mengde:'blade',qingnang:'shield',yuxi:'thunder',
 qixing:'shield',muniu:'flame',chitu:'flame',dilu:'shield',
 huxinjing:'shield',jinfanling:'blade',fengshitu:'blade',tiebifu:'shield',
 jingfan:'blade',pozhengu:'flame',xingjunyaolue:'shield',jueying:'shield',
 yingbianbingshu:'thunder',jiuzhouyin:'thunder',
};

const validRelics=(ids:string[])=>Array.from(new Set(ids.filter(id=>Object.prototype.hasOwnProperty.call(TREASURES,id))));
const level=(n:number,max:number)=>Math.max(0,Math.min(max,Number.isFinite(n)?Math.floor(n):0));

export function treasureGrowth(id:string):{effect:GrowthEffect;summary:string;color:string}{
 if(!Object.prototype.hasOwnProperty.call(TREASURE_GROWTH,id))throw new Error('unknown_growth_treasure:'+id);
 const effect=TREASURE_GROWTH[id];
 if(!effect)throw new Error('unknown_growth_treasure:'+id);
 return {effect,...EFFECTS[effect]};
}

export function createRunGrowth(wornIds:string[]):RunGrowth{
 return {power:0,guard:0,haste:0,relics:validRelics(wornIds),pickups:0};
}

export function runGrowthStats(g:RunGrowth):{damage:number;speed:number;shield:number;effects:string[]}{
 const relics=validRelics(g.relics),effects=relics.map(id=>TREASURE_GROWTH[id]);
 return {
  damage:Math.min(2.4,1+.12*level(g.power,8)+.08*relics.length),
  speed:1+.06*level(g.haste,4),
  shield:Math.min(5,level(g.guard,4)+effects.filter(e=>e==='shield').length),
  effects:Array.from(new Set(effects.filter(e=>e&&e!=='shield'))),
 };
}

function grant(g:RunGrowth,kind:GrowthKind,id?:string,count=true):GrowthReward{
 if(kind==='treasure'&&(!id||!Object.prototype.hasOwnProperty.call(TREASURES,id)))throw new Error('unknown_growth_treasure:'+id);
 const before=runGrowthStats(g);
 if(count)g.pickups++;
 if(kind==='treasure'){
  const t=TREASURES[id!],ability=treasureGrowth(id!);
  if(g.relics.includes(id!)){
   g.power=Math.min(8,level(g.power,8)+1);
   const gain=Math.round((runGrowthStats(g).damage-before.damage)*100);
   return {title:t.name+' · 淬炼',detail:gain?'威力 +'+gain+'% · 本局生效':'威力已达本局上限',icon:t.icon,color:ability.color};
  }
  g.relics.push(id!);
  const gain=Math.round((runGrowthStats(g).damage-before.damage)*100);
  return {title:t.name+' · 觉醒',detail:(gain?'威力+'+gain+'% · ':'')+PICKUP_EFFECTS[ability.effect],icon:t.icon,color:ability.color};
 }
 const limits={power:8,guard:4,haste:4},old=level(g[kind],limits[kind]);
 g[kind]=Math.min(limits[kind],old+1);
 const after=runGrowthStats(g),capped=g[kind]===old;
 if(kind==='power'){
  const gain=Math.round((after.damage-before.damage)*100);
  return {title:'破军强化',detail:gain?'主将与部曲威力 +'+gain+'%':'威力已达本局上限',icon:null,color:'#F4AF64'};
 }
 if(kind==='guard')return {title:'铁壁强化',detail:capped||after.shield===before.shield?'护盾已达本局上限':'护盾容量 +1 · 每10秒补充',icon:null,color:EFFECTS.shield.color};
 return {title:'疾风强化',detail:capped?'攻速已达本局上限':'攻击速度 +6%',icon:null,color:'#B5E8CF'};
}

/** Saturated drops convert into a stat that still changes actual combat power. */
export function grantRunGrowth(g:RunGrowth,kind:GrowthKind,id?:string):GrowthReward{
 const reward=grant(g,kind,id);
 if(!reward.detail.includes('上限'))return reward;
 const stats=runGrowthStats(g);
 const fallback:GrowthKind|undefined=g.haste<4?'haste':g.guard<4&&stats.shield<5?'guard':g.power<8&&stats.damage<2.4?'power':undefined;
 if(!fallback)return reward;
 const converted=grant(g,fallback,undefined,false);
 return {...converted,title:reward.title+' → '+converted.title,icon:reward.icon||converted.icon};
}
