import { BOSS_TARGET, Feedback, Obstacle } from './core/model';
import { project } from './VisualConfig';
export const lossLabel=(o:Pick<Obstacle,'kind'|'loss'|'rowId'>)=>o.rowId!==undefined?`未清除：损失${o.loss}`:o.kind==='rock'?`山石 · 碰撞 −${o.loss}`:`碰撞 −${o.loss}`;
export const bossFootprint=(depth:number=BOSS_TARGET.depth)=>BOSS_TARGET.halfWidth*520*project(0,depth).s;
export const gaitKeys=[-13,-7,9,13,7,-9] as const;
export function keyPose(keys:readonly number[],phase:number){const n=((phase%1)+1)%1*keys.length,i=Math.floor(n);return keys[i]+(keys[(i+1)%keys.length]-keys[i])*(n-i);}
/** Bounded presentation queue, only consumes immutable simulation facts. */
export class Effects {
 items:{event:Feedback;born:number;life:number}[]=[];lastShot=-10;peak=0;
 accept(events:readonly Feedback[],time:number){for(const e of events){if(e.kind==='shot'){this.lastShot=e.simulationTick!==undefined?e.simulationTick/60:time;continue;}if(['hit','break','hurt','gather'].indexOf(e.kind)>=0)this.items.push({event:e,born:time,life:e.kind==='break'?.48:e.kind==='gather'?.55:.28});}this.items=this.items.slice(-64);this.peak=Math.max(this.peak,this.items.length);}
 advance(time:number){this.items=this.items.filter(e=>time-e.born<e.life);}
 clear(){this.items=[];this.lastShot=-10;}
}
