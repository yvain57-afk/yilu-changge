/** Read-only presentation of resolved combat events. No health, aim or clocks are changed here. */
export type HitReadout = {at:number; hpBefore:number; hpAfter:number; max:number; actual:number; armor:number; direction:number};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
export function hitReadout(previous:HitReadout|undefined,now:number,before:number,after:number,max:number,armor:number,direction:number):HitReadout {
 return {at:now,hpBefore:previous&&now-previous.at<.22?Math.max(previous.hpBefore,before):before,hpAfter:after,max:Math.max(max,before,1),actual:Math.max(0,before-after),armor,direction:direction<0?-1:1};
}
export function enemyHitPose(hit:HitReadout|undefined,now:number){
 if(!hit)return {x:0,y:0,rotation:0,visible:false,health:1,trail:1,armor:false};
 const age=Math.max(0,now-hit.at),kick=Math.sin(clamp(age/.22)*Math.PI),drain=clamp((age-.12)/.32);
 return {x:hit.direction*.045*kick,y:-.022*kick,rotation:hit.direction*.12*kick,visible:age<1.05,
  health:clamp(hit.hpAfter/hit.max),trail:clamp((hit.hpBefore+(hit.hpAfter-hit.hpBefore)*drain)/hit.max),armor:hit.armor<.98};
}
/** New fallen sprites already depict a body on the ground. Legacy roles use a short rigid fall. */
export function enemyFallPose(age:number,direction:number,hasFallen:boolean){
 const q=clamp((age-.04)/.26),ease=1-(1-q)*(1-q),alpha=age>=1?0:1-clamp((age-.67)/.33);
 return {fallen:hasFallen&&age>=.13,rotation:hasFallen?direction*.18*(1-ease):direction*1.36*ease,
  floorScale:hasFallen?1:1-.44*ease,offsetX:direction*.045*ease,alpha};
}
export type Casualty = {id:string; slot:number; x:number; d:number; at:number; direction:number; loss:number};
export function casualtySlotPose(casualties:Casualty[],slot:number,now:number){
 const latest=casualties.filter(c=>c.slot===slot&&now-c.at<.95).sort((a,b)=>b.at-a.at)[0];
 if(!latest)return {alpha:1,rejoin:0,hit:false};
 const age=Math.max(0,now-latest.at),join=clamp((age-.50)/.45);
 // A representative rank loses its body immediately, then a remaining soldier closes
 // the gap from behind. Logical troop count and damage occupancy are unchanged.
 return {alpha:join,rejoin:(1-join)*.18,hit:age<.12};
}
