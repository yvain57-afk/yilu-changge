import { clamp } from './core/model';
export const VISUAL = { width:720, height:1280, roadHalf:260, teamY:-270, heroW:58, heroH:94, soldierW:42, soldierH:56, horizon:7 };
export function project(x:number,d:number){const s=clamp(1-d*.065,.5,1.04);return {x:x*VISUAL.roadHalf*s,y:VISUAL.teamY+d*104,s};}
/** Includes hero at index zero. Clamp followers only; anchor always equals rule center. */
export function formation(count:number,x:number){return Array.from({length:Math.min(48,Math.max(0,count))},(_,i)=>{if(i===0)return{x:x*260,y:VISUAL.teamY,hero:true};const row=Math.floor((i-1)/6),col=(i-1)%6,cols=Math.min(6,count-1-row*6);const half=(cols-1)*24,center=clamp(x*260+(row%2?6:-6),-310+half,310-half);return{x:center+(col-(cols-1)/2)*48,y:VISUAL.teamY-45-row*24,hero:false};});}
