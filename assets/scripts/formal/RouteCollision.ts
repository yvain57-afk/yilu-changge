/** Physical footprints shared by route placement and marching. Walls occupy one half-road. */
export const WALL_BODY_MARGIN=.4;
export const WALL_LANE_LIMIT=.42;
export function wallAt(walls:any[],dist:number){return walls.find(w=>w.type==='wall'&&w.d-dist<WALL_BODY_MARGIN&&w.d+w.len-dist>-WALL_BODY_MARGIN);}
export function constrainMarch(walls:any[],dist:number,nextDist:number,x:number,target:number){
 let blocked=false;
 for(const w of walls){
  if(w.type!=='wall')continue;
  const entry=w.d-WALL_BODY_MARGIN,exit=w.d+w.len+WALL_BODY_MARGIN;
  // Stop in front of solid wood. Do not teleport the hero sideways through the entry fence.
  if(dist<=entry&&nextDist>entry&&x*w.side>-WALL_LANE_LIMIT){nextDist=Math.min(nextDist,entry);blocked=true;}
  if(dist>entry&&dist<exit){
   const bound=-w.side*WALL_LANE_LIMIT;
   x=w.side>0?Math.min(x,bound):Math.max(x,bound);
   target=w.side>0?Math.min(target,bound):Math.max(target,bound);
  }
 }
 return {dist:nextDist,x,target,blocked};
}
/** Paired routes stay paired; guards move with their supply, outside the whole wall footprint. */
export function clearWallSupplies<T extends {type:string;d:number;x?:number;len?:number;side?:number;choiceId?:string}>(route:T[]):T[]{
 const walls=route.filter(e=>e.type==='wall');
 const choices=new Set(route.filter(e=>e.type==='crate'&&e.choiceId).map(e=>e.choiceId!));
 for(const id of choices){
  const crates=route.filter(e=>e.type==='crate'&&e.choiceId===id);
  let d=crates[0].d;
  for(const wall of walls.sort((a,b)=>a.d-b.d))if(d>=wall.d-1.2&&d<=wall.d+wall.len!+1.2)d=wall.d+wall.len!+2;
  const delta=d-crates[0].d;
  for(const e of route)if(e.choiceId===id)e.d+=delta;
 }
 for(const e of route)if(e.type==='crate'&&!e.choiceId){
  const wall=walls.find(w=>e.d>=w.d-1.2&&e.d<=w.d+w.len!+1.2);
  if(wall&&((e.x||0)*wall.side!>-.3))e.x=-wall.side!*.5;
 }
 return route;
}
