import {HAND_SOCKETS} from './artSockets';
import {AttackInstance,CompanionId,WeaponId,WEAPONS,TIER_WIDTHS} from './weapons';
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
export type Point={x:number;z:number};
export type ScreenPoint={x:number;y:number};
export const projectCombat=(x:number,depth:number)=>{const s=clamp(1-depth*.065,.5,1.04);return{x:x*260*s,y:-270+depth*104,s};};
export function attackProgress(a:AttackInstance){const w=WEAPONS[a.weaponId];return a.phase==='windup'?clamp(a.tick/w.windup,0,1):a.phase==='active'?clamp((a.tick-w.windup)/Math.max(1,w.active-1),0,1):clamp((a.tick-w.windup-w.active)/(a.cycle-w.windup-w.active),0,1);}
export function actorAnchor(x:number,z:number,a:AttackInstance|null,source:'hero'|CompanionId='hero'):Point{
 if(source==='hero')return{x,z};
 const maxStep=source==='xing_daorong'?.4:source==='zhao_yun_guest'?.25:0,p=a?attackProgress(a):0;
 const step=!a?0:a.phase==='windup'?p*maxStep:a.phase==='active'?maxStep:maxStep*(1-clamp(p*2,0,1));
 return{x:clamp(x-.25,-300/260,300/260),z:z-35/104+step};
}
export function frameBlend(a:AttackInstance|null){if(!a)return{from:0,to:0,mix:0};const q=attackProgress(a);if(a.phase==='windup')return{from:0,to:1,mix:clamp(q*2,0,1)};if(a.phase==='active')return{from:1,to:2,mix:clamp(q*3,0,1)};return q<.5?{from:2,to:3,mix:clamp(q*3,0,1)}:{from:3,to:0,mix:clamp((q-.5)*2,0,1)};}
export function poseGeometry(x:number,z:number,a:AttackInstance|null,weapon:WeaponId,source:'hero'|CompanionId='hero',rank=0){
 const anchor=actorAnchor(x,z,a,source),p=projectCombat(anchor.x,anchor.z-z),blend=frameBlend(a),comp=source!=='hero';
 const row=comp?['xing_daorong','chen_ying','zhao_yun_guest'].indexOf(source):Math.min(rank,2),prefix=comp?'companion':weapon==='blade'?'bladeHero':'spearHero';
 const get=(key:number)=>{if(prefix==='spearHero'){const v=[[74,238],[70,234],[105,286],[-70,253]][key];return[v[0]*108/350,v[1]*108/350];}return HAND_SOCKETS[`${prefix}${row}Pose${key}` as keyof typeof HAND_SOCKETS];};
 const h0=get(blend.from),h1=get(blend.to),grip={x:p.x+(h0[0]+(h1[0]-h0[0])*blend.mix)*p.s,y:p.y+(h0[1]+(h1[1]-h0[1])*blend.mix)*p.s};
 const rigid=rigidWeapon(grip,weapon,playerWeaponAngle(a,weapon),p.s);
 return{anchor,body:p,blend,prefix,row,...rigid};
}
export function nearGeometry(x:number,z:number,a:AttackInstance,rank=0){const pose=poseGeometry(x,z,a,a.weaponId,a.sourceId,rank),anchor=pose.anchor,w=WEAPONS[a.weaponId],width=w.halfWidth*TIER_WIDTHS[a.tier-1];
 // The fixed weapon's actual edge bounds the reach; configured near range is a ceiling.
 const visualDepth=(pose.tip.y+270-48)/(104-48*.065),reach=Math.max(0,Math.min(w.near,z+visualDepth-anchor.z));
 return{...pose,weapon:a.weaponId,shape:(a.weaponId==='blade'||a.weaponId==='great_axe'?'arc':'thrust') as 'arc'|'thrust',from:anchor.z,to:anchor.z+reach,halfWidth:width};}

/** The same forward body movement is consumed by collision and rendered feet. */
export function bossContactDepth(ticks:number,clock:number,index:number,warning:{profile?:string;stage:string;duration:number;remaining:number;flight:number;impact:number}|null){
 const base=4-3.1*Math.min(1,ticks/60);if(ticks<60)return base;
 if(warning?.profile==='step_thrust'){const q=warning.stage==='charge'?clamp((warning.duration-warning.remaining)/(warning.duration-warning.flight),0,1):warning.stage==='flight'?1:clamp(1+warning.remaining/warning.impact,0,1);return base-.55*q;}
 if(!warning&&index>0){const inOut=Math.min(clamp(clock/.1,0,1),clamp((.95-clock)/.15,0,1));return base-.15*inOut;}return base;
}
// Measured per-pose hand sockets are supplied by the atlas. Length does not use target distance.
export const WEAPON_LENGTH:Record<WeaponId,number>={spear:90,blade:85,great_axe:85,throwing_fork:85,bow:65,sword:70,halberd:100};
export function rigidWeapon(grip:ScreenPoint,weapon:WeaponId,angle:number,scale=1){const length=WEAPON_LENGTH[weapon]*scale,r=angle*Math.PI/180;return{grip,tip:{x:grip.x+Math.cos(r)*length,y:grip.y+Math.sin(r)*length},length,angle};}
export function playerWeaponAngle(a:AttackInstance|null,weapon:WeaponId){if(!a)return 78;const p=attackProgress(a),sweep=weapon==='blade'||weapon==='great_axe';if(a.phase==='windup')return sweep?72+70*p:78+20*p;if(a.phase==='active')return sweep?142-110*p:112-22*p;return sweep?32+46*p:90-12*p;}
/** Finite samples of the moving rigid edge against the visible target body. */
export function contactSurface(g:ReturnType<typeof nearGeometry>,previous:ReturnType<typeof nearGeometry>,target:{x:number;z:number;halfWidth:number;height:number},referenceZ:number){
 const p=projectCombat(target.x,target.z-referenceZ),loX=p.x-target.halfWidth*260*p.s,hiX=p.x+target.halfWidth*260*p.s,loY=p.y+14*p.s,hiY=p.y+target.height*p.s;
 for(let sample=0;sample<=4;sample++){const t=sample/4,grip={x:previous.grip.x+(g.grip.x-previous.grip.x)*t,y:previous.grip.y+(g.grip.y-previous.grip.y)*t},tip={x:previous.tip.x+(g.tip.x-previous.tip.x)*t,y:previous.tip.y+(g.tip.y-previous.tip.y)*t};
  const start=g.shape==='arc'?.45:0;
  for(let e=0;e<=8;e++){const q=start+(1-start)*e/8,x=grip.x+(tip.x-grip.x)*q,y=grip.y+(tip.y-grip.y)*q;if(x>=loX-3&&x<=hiX+3&&y>=loY&&y<=hiY)return{x:x/(260*p.s),height:(y-p.y)/p.s,screen:{x,y}};}
 }return null;
}
