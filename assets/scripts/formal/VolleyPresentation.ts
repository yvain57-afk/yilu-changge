/** A volley keeps its existing hit groups. Each group carries a rank of visible arrows;
 * these never add damage, targets, random draws or sound events. */
export type VolleySlot={x:number;z:number;row:number;slotIndex:number};
export type VolleyTrail={sx:number;sz:number;slotIndex:number;delay:number;height:number};
export function volleyArrowCount(troops:number){
 const n=Math.max(0,Math.floor(troops));
 return Math.min(96,Math.ceil(n<=40?n*.8:32+(n-40)*.25));
}
export function volleyTrails(troops:number,slots:VolleySlot[],groups:number):VolleyTrail[][]{
 const result:Array<VolleyTrail[]>=Array.from({length:groups},()=>[]);
 if(!slots.length||!groups)return result;
 const n=volleyArrowCount(troops);
 for(let i=0;i<n;i++){
  const slot=slots[i%slots.length],pass=Math.floor(i/slots.length);
  result[i%groups].push({sx:slot.x,sz:slot.z,slotIndex:slot.slotIndex,
   delay:Math.min(.18,slot.row*.025+pass*.035+(i%3)*.006),height:.22});
 }
 return result;
}
export function volleyPoint(a:{tx:number;tz:number;dur:number;t:number},v:VolleyTrail,time=a.t){
 if(time<v.delay||time>=a.dur)return null;
 const k=Math.min(1,(time-v.delay)/Math.max(.04,a.dur-v.delay));
 return{x:v.sx+(a.tx-v.sx)*k,z:v.sz+(a.tz-v.sz)*k,
  h:v.height*(1-k)+Math.sin(k*Math.PI)*(.65+Math.max(0,a.tz-v.sz)*.025)};
}
