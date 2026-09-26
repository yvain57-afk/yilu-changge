import {WEAPON_LENGTH} from './combatGeometry';
import {HAND_SOCKETS} from './artSockets';

/** All geometry uses a single plane: X = normalized player X * 2.5, Z = world depth. */
export type HazardPoint={x:number;z:number};
export type HazardShape=({kind:'capsule';a:HazardPoint;b:HazardPoint;radius:number}|{kind:'roundedPolygon';vertices:HazardPoint[];radius:number}|{kind:'sector';origin:HazardPoint;near:number;far:number;fromAngle:number;toAngle:number})&{id:number;groupId:number};
export type BossAttackId='axe_sweep'|'earth_split'|'single_fork'|'split_forks'|'spear_thrust'|'spear_wave';
export type BossHazardPhase='observe'|'telegraph'|'active'|'recovery';
type AttackSpec={id:BossAttackId;label:string;telegraph:number;active:number;recovery:number;loss:number;radius:number;speed:number;distance:number;front:number};
const attack=(id:BossAttackId,label:string,active:number,recovery:number,loss:number,radius=0,speed=0,distance=0,front=0):AttackSpec=>({id,label,telegraph:78,active,recovery,loss,radius,speed,distance,front});
export const BOSS_HAZARD_ATTACKS:Readonly<Record<BossAttackId,AttackSpec>>={
 axe_sweep:attack('axe_sweep','横扫',18,96,6),earth_split:attack('earth_split','裂地',Math.ceil(4.6/5.2*60),90,6,.16,5.2,4.6,.3),
 single_fork:attack('single_fork','飞叉',Math.ceil(4.8/5.8*60),90,8,.11,5.8,4.8,.22),split_forks:attack('split_forks','双叉',Math.ceil(4.8/5.8*60)+8,102,8,.11,5.8,4.8,.22),
 // The package's 72-tick thrust conflicts with the explicit >=1.3-second promise: use 78.
 spear_thrust:attack('spear_thrust','突刺',18,96,10,.09),spear_wave:attack('spear_wave','枪芒',Math.ceil(5/6.2*60),96,10,.12,6.2,5,.35)
};
const ORDERS:Record<string,BossAttackId[]>={xing_daorong:['axe_sweep','earth_split'],chen_ying:['single_fork','split_forks'],yang_ling:['spear_thrust','spear_wave']};
const clamp=(v:number,l:number,h:number)=>Math.max(l,Math.min(h,v));
const at=(p:HazardPoint,angle:number,d:number):HazardPoint=>({x:p.x+Math.sin(angle)*d,z:p.z-Math.cos(angle)*d});
const angleTo=(a:HazardPoint,b:HazardPoint)=>Math.atan2(b.x-a.x,a.z-b.z);
export const hazardRenderPoint=(p:HazardPoint)=>({x:p.x/2.5,z:p.z});
export type BossDirector={bossId:string;phase:BossHazardPhase;phaseTick:number;tick:number;attackIndex:number;attackId:BossAttackId;groupId:number;hitGroupId:number;aimX:number;teamZ:number;bossX:number;bossDepth:number;progress:number;pose:string;label:string;warningShapes:HazardShape[];activeShapes:HazardShape[];origin:HazardPoint;releaseHand:HazardPoint;directions:number[];weapon:{grip:HazardPoint;tip:HazardPoint}|null;weaponLift:number;loss:number};
export function createBossDirector(bossId:string):BossDirector{
 if(!ORDERS[bossId])throw new Error(`Unknown boss hazard identity: ${bossId}`);
 return{bossId,phase:'observe',phaseTick:0,tick:0,attackIndex:0,attackId:ORDERS[bossId][0],groupId:0,hitGroupId:-1,aimX:0,teamZ:0,bossX:0,bossDepth:4,progress:0,pose:'approach',label:'',warningShapes:[],activeShapes:[],origin:{x:0,z:0},releaseHand:{x:0,z:0},directions:[],weapon:null,weaponLift:0,loss:0};
}
function capsule(d:BossDirector,id:number,a:HazardPoint,b:HazardPoint,radius:number):HazardShape{return{kind:'capsule',id,groupId:d.groupId,a,b,radius};}
function shaftSweep(d:BossDirector,from:HazardPoint,to:HazardPoint,angle:number,length:number,radius:number):HazardShape{
 const points=[from,at(from,angle,length),to,at(to,angle,length)].sort((a,b)=>a.x-b.x||a.z-b.z),cross=(o:HazardPoint,a:HazardPoint,b:HazardPoint)=>(a.x-o.x)*(b.z-o.z)-(a.z-o.z)*(b.x-o.x);
 const lower:HazardPoint[]=[],upper:HazardPoint[]=[];for(const p of points){while(lower.length>1&&cross(lower[lower.length-2],lower[lower.length-1],p)<=1e-12)lower.pop();lower.push(p);}for(const p of points.slice().reverse()){while(upper.length>1&&cross(upper[upper.length-2],upper[upper.length-1],p)<=1e-12)upper.pop();upper.push(p);}lower.pop();upper.pop();const vertices=lower.concat(upper);
 if(vertices.length<3)return capsule(d,0,points[0],points[points.length-1],radius);
 return{kind:'roundedPolygon',id:0,groupId:d.groupId,vertices,radius};
}
function start(d:BossDirector,input:{playerX:number;teamZ:number;bossX?:number}){
 d.attackId=ORDERS[d.bossId][d.attackIndex++%2];const spec=BOSS_HAZARD_ATTACKS[d.attackId];d.phase='telegraph';d.phaseTick=0;d.groupId++;d.aimX=input.playerX;d.teamZ=input.teamZ;d.bossX=input.bossX??0;d.bossDepth=.75;d.loss=spec.loss;d.label=spec.label;d.progress=0;
 // Active atlas grip is represented in the planar ground projection, plus a separate
 // fixed visual height. Projectile release and rigid weapons use this same hand origin.
 const row=d.bossId==='xing_daorong'?0:d.bossId==='chen_ying'?1:2,socket=HAND_SOCKETS[`boss${row}Pose2` as keyof typeof HAND_SOCKETS];
 d.weaponLift=socket[1];d.releaseHand={x:d.bossX*2.5+socket[0]/104,z:d.teamZ+(d.attackId==='spear_wave'?1.65:.75)};d.origin={...d.releaseHand};
 const centers=d.attackId==='split_forks'?[clamp(d.aimX,-.55,.55)-.3,clamp(d.aimX,-.55,.55)+.3]:[d.aimX];
 d.directions=centers.map(x=>angleTo(d.origin,{x:x*2.5,z:d.teamZ}));
 if(d.attackId==='spear_wave')d.origin=at(d.releaseHand,d.directions[0],WEAPON_LENGTH.spear/104);
 const a=d.directions[0];
 d.warningShapes=d.attackId==='spear_thrust'?[shaftSweep(d,d.releaseHand,{x:d.releaseHand.x,z:d.releaseHand.z-.37},a,WEAPON_LENGTH.spear/104,spec.radius)]:d.attackId==='axe_sweep'?[{kind:'sector',id:0,groupId:d.groupId,origin:d.origin,near:.12,far:WEAPON_LENGTH.great_axe/104,fromAngle:a-Math.PI/4,toAngle:a+Math.PI/4}]:d.directions.map((dir,i)=>capsule(d,i,d.origin,at(d.origin,dir,d.attackId==='spear_thrust'?WEAPON_LENGTH.spear/104+.37:spec.distance),spec.radius));
}
/** One fixed 60 Hz tick. canAttack=false waits for surviving run mobs/arrows to drain. */
export function tickBossDirector(d:BossDirector,input:{playerX:number;teamZ:number;bossX?:number;canAttack?:boolean}){
 d.tick++;d.phaseTick++;d.activeShapes=[];d.weapon=null;
 if(d.phase==='observe'){d.bossDepth=4-3.25*Math.min(1,d.phaseTick/60);d.pose='approach';if(d.phaseTick>=120&&input.canAttack!==false)start(d,input);else return;}
 const spec=BOSS_HAZARD_ATTACKS[d.attackId];
 if(d.phase==='telegraph'){
  d.progress=clamp(d.phaseTick/spec.telegraph,0,1);d.bossDepth=d.attackId==='spear_wave'?.75+.9*d.progress:.75;d.pose=d.attackId==='axe_sweep'?'raise_axe':d.attackId==='earth_split'?'lift_axe':d.attackId.indexOf('fork')>=0?'aim_fork':'lower_spear';
  const row=d.bossId==='xing_daorong'?0:d.bossId==='chen_ying'?1:2,socket=HAND_SOCKETS[`boss${row}Pose1` as keyof typeof HAND_SOCKETS],grip={x:d.bossX*2.5+socket[0]/104,z:d.teamZ+d.bossDepth};
  d.weaponLift=socket[1];const length=(row===2?WEAPON_LENGTH.spear:row===0?WEAPON_LENGTH.great_axe:WEAPON_LENGTH.throwing_fork)/104;
  const angle=row===2?Math.PI+(d.directions[0]-Math.PI)*d.progress:row===0?Math.PI-d.progress*Math.PI/3:d.directions[0];d.weapon={grip,tip:at(grip,angle,length)};
  if(d.phaseTick<spec.telegraph)return;d.phase='active';d.phaseTick=0;
 }
 if(d.phase==='active'){
  const t=d.phaseTick,p=clamp((t+1)/spec.active,0,1);d.progress=p;d.pose=d.attackId;d.bossDepth=d.attackId==='spear_wave'?1.65:.75;const row=d.bossId==='xing_daorong'?0:d.bossId==='chen_ying'?1:2;d.weaponLift=HAND_SOCKETS[`boss${row}Pose2` as keyof typeof HAND_SOCKETS][1];
  if(d.attackId==='spear_wave')d.weapon={grip:{...d.releaseHand},tip:{...d.origin}};else if(d.attackId==='earth_split')d.weapon={grip:{...d.releaseHand},tip:at(d.releaseHand,d.directions[0],WEAPON_LENGTH.great_axe/104)};else d.weapon=null;
  if(d.attackId==='axe_sweep'){
   const from=d.directions[0]-Math.PI/4+Math.PI/2*t/spec.active,to=d.directions[0]-Math.PI/4+Math.PI/2*(t+1)/spec.active;
   d.activeShapes=[{kind:'sector',id:0,groupId:d.groupId,origin:d.origin,near:.12,far:WEAPON_LENGTH.great_axe/104,fromAngle:from,toAngle:to}];d.weapon={grip:{...d.origin},tip:at(d.origin,to,WEAPON_LENGTH.great_axe/104)};
  }else if(d.attackId==='spear_thrust'){
   const dir=d.directions[0],advance=.37*p,previous=.37*clamp(t/spec.active,0,1),grip={x:d.origin.x,z:d.origin.z-advance},tip=at(grip,dir,WEAPON_LENGTH.spear/104),prevGrip={x:d.origin.x,z:d.origin.z-previous};
   d.bossDepth=.75-advance;d.weapon={grip,tip};
   d.activeShapes=[shaftSweep(d,prevGrip,grip,dir,WEAPON_LENGTH.spear/104,spec.radius)];
  }else{
   d.directions.forEach((dir,i)=>{const age=t-(d.attackId==='split_forks'?i*8:0);if(age<0)return;const dist=(age+1)*spec.speed/60;if(dist>spec.distance+spec.speed/60)return;
    const prior=Math.max(0,age*spec.speed/60-spec.front);d.activeShapes.push(capsule(d,i,at(d.origin,dir,prior),at(d.origin,dir,Math.min(dist,spec.distance)),spec.radius));});
  }
  if(t>=spec.active){d.phase='recovery';d.phaseTick=0;d.progress=0;d.activeShapes=[];d.warningShapes=[];d.pose='recover';}
  return;
 }
 if(d.phase==='recovery'){
  d.progress=clamp(d.phaseTick/spec.recovery,0,1);d.pose='recover';d.bossDepth=d.attackId==='spear_thrust'?.38+.37*clamp(d.phaseTick/15,0,1):d.attackId==='spear_wave'?1.65-.9*clamp(d.phaseTick/15,0,1):.75;
  // The primary group stays closed until all entities have expired AND recovery is complete.
  if(d.phaseTick>=spec.recovery&&input.canAttack!==false)start(d,input);
 }
}
function segmentDistance(p:HazardPoint,a:HazardPoint,b:HazardPoint){const dx=b.x-a.x,dz=b.z-a.z,t=clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t);}
/** Collision reads the exact same capsule/annular wedge the renderer outlines. */
export function hazardHit(s:HazardShape,p:HazardPoint,radius=0){
 if(s.kind==='capsule')return segmentDistance(p,s.a,s.b)<=s.radius+radius+1e-9;
 if(s.kind==='roundedPolygon'){let inside=true;for(let i=0;i<s.vertices.length;i++){const a=s.vertices[i],b=s.vertices[(i+1)%s.vertices.length];if((b.x-a.x)*(p.z-a.z)-(b.z-a.z)*(p.x-a.x)<-1e-9)inside=false;if(segmentDistance(p,a,b)<=s.radius+radius+1e-9)return true;}return inside;}
 const dx=p.x-s.origin.x,dz=p.z-s.origin.z,dist=Math.hypot(dx,dz);let a=Math.atan2(dx,-dz);const middle=(s.fromAngle+s.toAngle)/2;while(a-middle>Math.PI)a-=Math.PI*2;while(a-middle<-Math.PI)a+=Math.PI*2;
 if(a>=s.fromAngle&&a<=s.toAngle)return dist>=s.near-radius&&dist<=s.far+radius;
 return Math.min(segmentDistance(p,at(s.origin,s.fromAngle,s.near),at(s.origin,s.fromAngle,s.far)),segmentDistance(p,at(s.origin,s.toAngle,s.near),at(s.origin,s.toAngle,s.far)))<=radius;
}
export function hitBossHazard(d:BossDirector,playerX:number,teamZ:number,radius=0){if(d.hitGroupId===d.groupId)return 0;if(d.activeShapes.some(s=>hazardHit(s,{x:playerX*2.5,z:teamZ},radius))){d.hitGroupId=d.groupId;return d.loss;}return 0;}
/** Finite outline for graphics only; collision remains analytic. */
export function hazardOutline(s:HazardShape,steps=20):HazardPoint[]{
 const out:HazardPoint[]=[];
 if(s.kind==='roundedPolygon'){const v=s.vertices;for(let i=0;i<v.length;i++){const p=v[i],prev=v[(i+v.length-1)%v.length],next=v[(i+1)%v.length],a=Math.atan2(-(p.x-prev.x),p.z-prev.z);let b=Math.atan2(-(next.x-p.x),next.z-p.z);while(b<a)b+=Math.PI*2;for(let j=0;j<=6;j++){const q=a+(b-a)*j/6;out.push({x:p.x+Math.cos(q)*s.radius,z:p.z+Math.sin(q)*s.radius});}}return out;}
 if(s.kind==='sector'){for(let i=0;i<=steps;i++)out.push(at(s.origin,s.fromAngle+(s.toAngle-s.fromAngle)*i/steps,s.far));for(let i=steps;i>=0;i--)out.push(at(s.origin,s.fromAngle+(s.toAngle-s.fromAngle)*i/steps,s.near));return out;}
 const theta=Math.atan2(s.b.z-s.a.z,s.b.x-s.a.x);for(let i=0;i<=steps;i++){const a=theta-Math.PI/2+Math.PI*i/steps;out.push({x:s.b.x+Math.cos(a)*s.radius,z:s.b.z+Math.sin(a)*s.radius});}for(let i=0;i<=steps;i++){const a=theta+Math.PI/2+Math.PI*i/steps;out.push({x:s.a.x+Math.cos(a)*s.radius,z:s.a.z+Math.sin(a)*s.radius});}return out;
}
