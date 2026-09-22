import { clamp } from './core/model';
export const VISUAL = { width:720, height:1280, roadHalf:260, teamY:-270, heroW:58, heroH:108, soldierW:42, soldierH:70, horizon:7 };
export function project(x:number,d:number){const s=clamp(1-d*.065,.5,1.04);return {x:x*VISUAL.roadHalf*s,y:VISUAL.teamY+d*104,s};}
export const FORMATION_COLUMNS=8;
/** Includes hero at index zero. Clamp followers only; anchor always equals rule center. */
export function formation(count:number,x:number,companion=false){return Array.from({length:Math.min(48,Math.max(0,count))},(_,i)=>{if(i===0)return{x:x*260,y:VISUAL.teamY,hero:true,companion:false};if(i===1&&companion)return{x:clamp(x*260-65,-300,300),y:VISUAL.teamY-35,hero:false,companion:true};const row=Math.floor((i-1)/FORMATION_COLUMNS),col=(i-1)%FORMATION_COLUMNS,cols=Math.min(FORMATION_COLUMNS,count-1-row*FORMATION_COLUMNS);const half=(cols-1)*24,center=clamp(x*260+(row%2?12:-12),-310+half,310-half);return{x:center+(col-(cols-1)/2)*48,y:VISUAL.teamY-58-row*31,hero:false,companion:false};});}
