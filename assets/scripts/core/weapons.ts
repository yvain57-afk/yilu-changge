/** Shared rule/presentation shapes. Distances are world seconds along the road. */
export type PlayerWeapon='spear'|'blade';
export type WeaponId=PlayerWeapon|'great_axe'|'throwing_fork'|'bow'|'sword'|'halberd';
export type CompanionId='xing_daorong'|'chen_ying'|'zhao_yun_guest';
export type CastId=CompanionId|'yang_ling';
export type WeaponSpec={label:string;shape:'lance'|'crescent'|'axe'|'fork'|'arrow';near:number;halfWidth:number;waveWidth:number;speed:number;range:number;socketDepth:number;windup:number;active:number;cycle:number};
export const WEAPONS:Record<WeaponId,WeaponSpec>={
 spear:{label:'长枪',shape:'lance',near:1.1,halfWidth:.14,waveWidth:.10,speed:8,range:4.8,socketDepth:.95,windup:10,active:5,cycle:36},
 blade:{label:'长刀',shape:'crescent',near:.85,halfWidth:.26,waveWidth:.24,speed:6,range:3.7,socketDepth:.65,windup:10,active:5,cycle:36},
 great_axe:{label:'大斧',shape:'axe',near:.85,halfWidth:.26,waveWidth:.26,speed:4.5,range:2.4,socketDepth:.65,windup:22,active:8,cycle:72},
 throwing_fork:{label:'飞叉',shape:'fork',near:.8,halfWidth:.12,waveWidth:.12,speed:7,range:4.6,socketDepth:.55,windup:14,active:5,cycle:60},
 bow:{label:'弩箭',shape:'arrow',near:0,halfWidth:.1,waveWidth:.1,speed:9,range:7,socketDepth:.35,windup:0,active:1,cycle:15},
 sword:{label:'长剑',shape:'lance',near:.7,halfWidth:.12,waveWidth:.08,speed:9,range:3,socketDepth:.5,windup:8,active:5,cycle:30},
 halberd:{label:'长戟',shape:'axe',near:1,halfWidth:.22,waveWidth:.2,speed:5,range:3,socketDepth:.8,windup:20,active:6,cycle:54}
};
export const CAST:Record<CastId,{name:string;weapon:WeaponId;region:string;relation:string;sourceRef:string;companionCycle:number}>={
 xing_daorong:{name:'邢道荣',weapon:'great_axe',region:'零陵外围·山道',relation:'随军',sourceRef:'S52',companionCycle:72},
 chen_ying:{name:'陈应',weapon:'throwing_fork',region:'桂阳一线·粮营',relation:'随军',sourceRef:'S52',companionCycle:60},
 yang_ling:{name:'杨龄',weapon:'spear',region:'长沙方向·白石',relation:'敌将',sourceRef:'S53',companionCycle:36},
 zhao_yun_guest:{name:'赵云',weapon:'spear',region:'白石',relation:'同行助阵',sourceRef:'S41',companionCycle:30}
};
export const HERO_BASE_DAMAGE=5;
export const TIER_FACTORS=[1,1.2,1.4] as const;
export const TIER_WIDTHS=[1,1.1,1.15] as const;
export const POOL_LIMITS=Object.freeze({hero:12,companion:12,enemy:12,decorative:48});
export type AttackInstance={id:number;sourceId:'hero'|CompanionId;weaponId:WeaponId;tier:number;damage:number;direction:number;startedTick:number;tick:number;poseTick?:number;phase:'windup'|'active'|'recovery';spent:boolean;hitTargetIds:(number|'boss')[];budget:number;released:boolean;cycle:number};
export type WeaponWave={id:number;attack:AttackInstance;x:number;originX:number;z:number;previousZ:number;originZ:number;life:number;halfWidth:number;speed:number;range:number;stopped:boolean};
export type RunLoadout={appearance?:number;weapon?:PlayerWeapon;companion?:CompanionId|null};
export function companionFor(boss:CastId|undefined,choice:CompanionId|null|undefined){return choice&&choice!==boss?choice:null;}
