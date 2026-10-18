/** Reachability works on team-centre intervals, with footprint dilation and 300 ms input budget. */
export type Band=[number,number];
export interface Telegraph{ id:string;source:string;bands:Band[];created:number;execute:number;end:number;kind:string;wasThreatened:boolean;released?:boolean;riskFootprint?:any; }
export function reachableSafety(x:number,now:number,execute:number,bands:Band[],speed:number,halfWidth:number,bounds:Band=[-.82,.82],reaction=.30){
 let free:Band[]=[[bounds[0],bounds[1]]];
 for(const [a,b] of bands){const lo=a-halfWidth,hi=b+halfWidth;free=free.flatMap(([l,r])=>hi<=l||lo>=r?[[l,r] as Band]:[[l,Math.min(r,lo)],[Math.max(l,hi),r]].filter(([u,v])=>v-u>.012) as Band[]);}
 const reach=Math.max(0,execute-now-reaction)*speed;
 const reachable=free.map(([l,r])=>[Math.max(l,x-reach),Math.min(r,x+reach)] as Band).filter(([l,r])=>r-l>.012);
 return {safe:reachable.length>0,intervals:reachable,target:reachable.length?reachable.reduce((best,[l,r])=>{const q=Math.max(l+.006,Math.min(r-.006,x));return Math.abs(q-x)<Math.abs(best-x)?q:best;},Infinity):null};
}
export class EncounterDirector {
 active:Telegraph[]=[]; deferred=0;accepted=0;minimumBudget=Infinity;lastDeferredReason:string|null=null;
 prune(now:number){this.active=this.active.filter(t=>t.end>now);}
 schedule(input:{id:string,source:string,kind:string,now:number,warning:number,bands:Band[],x:number,speed:number,halfWidth:number,bounds:Band,maxThreats:number;impactDelay?:number;duration?:number; safety?:(execute:number,relevant:Telegraph[])=>ReturnType<typeof reachableSafety>}){
  this.prune(input.now);if(this.active.length>=input.maxThreats){this.deferred++;this.lastDeferredReason='active-threat-budget';return null;}
  const execute=input.now+Math.max(.9,input.warning);
  // Check the proposed deadline AND each overlapping committed deadline.
  const relevant=this.active.filter(t=>t.end>=execute||t.execute<=execute);
  const bands=[...input.bands,...relevant.flatMap(t=>t.bands)];
  const deadline=Math.min(execute,...relevant.map(t=>t.execute).filter(t=>t>input.now));
  const proof=input.safety?input.safety(deadline,relevant):reachableSafety(input.x,input.now,deadline,bands,input.speed,input.halfWidth,input.bounds);
  if(!proof.safe){this.deferred++;this.lastDeferredReason='no-reachable-safe-footprint';return null;}
  const t:Telegraph={id:input.id,source:input.source,kind:input.kind,bands:input.bands.map(b=>[...b] as Band),created:input.now,execute,end:execute+Math.max(.15,input.duration??1.0),wasThreatened:input.bands.some(([l,r])=>input.x+input.halfWidth>l&&input.x-input.halfWidth<r)};
  this.active.push(t);this.accepted++;this.minimumBudget=Math.min(this.minimumBudget,t.execute-t.created);return t;
 }
 cancel(source:string){this.active=this.active.filter(t=>t.source!==source||t.released);}
 clear(){this.active=[];}
}
