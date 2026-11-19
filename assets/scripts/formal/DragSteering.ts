/** Reversing a finger drag must reverse the hero immediately, not consume queued travel. */
export function dragTarget(hero:number,target:number,delta:number){
 if(![hero,target,delta].every(Number.isFinite))return target;
 const origin=delta*(target-hero)<0?hero:target;
 return Math.max(-.68,Math.min(.68,origin+delta));
}
