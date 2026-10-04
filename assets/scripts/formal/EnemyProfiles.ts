/** Fixed campaign threat identities; never scaled by the player's equipment. */
export type EnemyKind='light'|'guard'|'shield'|'archer'|'cavalry'|'banner'|'mechanism';
export const ENEMY_PROFILES:Record<EnemyKind,{label:string,hp:number,damage:number,speed:number,width:number,cooldown:number}>= {
 light:{label:'轻兵',hp:1,damage:1,speed:2.2,width:.10,cooldown:4},
 guard:{label:'近卫',hp:3,damage:2,speed:1.8,width:.23,cooldown:3.2},
 shield:{label:'盾兵',hp:7,damage:2,speed:1.2,width:.22,cooldown:3.6},
 archer:{label:'弓手',hp:2,damage:2,speed:.8,width:.19,cooldown:3.8},
 cavalry:{label:'骑兵',hp:5,damage:4,speed:1.1,width:.25,cooldown:4.8},
 banner:{label:'旗手',hp:4,damage:1,speed:1.0,width:.12,cooldown:5},
 mechanism:{label:'机关',hp:12,damage:5,speed:0,width:.27,cooldown:4.2},
};
export function volleyBonus(troops:number){return Math.min(1.30,1+.10*Math.log(Math.max(40,troops)/40));}
export function reductionProduct(factors:number[]){return Math.max(.5,factors.reduce((a,b)=>a*Math.max(0,Math.min(1,b)),1));}
export function enemyArmor(kind:EnemyKind,exposed:boolean,breaker:boolean,armorWeakened:boolean){
 const base=kind==='shield'&&!exposed?(breaker?.70:.45):1;
 return 1-(1-base)*(armorWeakened?.80:1);
}
