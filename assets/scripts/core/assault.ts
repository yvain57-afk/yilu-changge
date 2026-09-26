/** Shootable route objects. They are not enemies and never grant kill credit. */
export type SupplyKind = 'troops' | 'weapon' | 'chain';
export type AssaultTarget = {
 id:number; kind:'gate'|'supply'; at:number; x:number; width:number;
 value:number; cap:number; hp:number; maxHp:number; reward:SupplyKind; amount:number;
 resolved:boolean; hits:number; lastHit:number; chain:boolean;
};
export type AssaultPlan = Omit<AssaultTarget,'resolved'|'hits'|'lastHit'>[];
export type AssaultReward = {kind:SupplyKind|'gate';amount:number;target:AssaultTarget};
export const ROUTE_RADIUS=.07;
export class AssaultDirector {
 targets:AssaultTarget[];
 stats={gateHits:0,converted:0,gatesTaken:0,missed:0,suppliesBroken:0,troops:0,weapons:0,chainTaken:0};
 private nextId=-20000;
 constructor(plan:AssaultPlan){this.targets=plan.map(t=>({...t,resolved:false,hits:0,lastHit:-100}));}
 nearest(x:number,from:number,to:number,width=0){
  return this.targets.filter(t=>!t.resolved&&t.at>=from-1e-8&&t.at<=to+1e-8&&Math.abs(x-t.x)<=t.width+width).sort((a,b)=>a.at-b.at||a.id-b.id)[0];
 }
 hit(t:AssaultTarget,power:number,tick:number,z:number):AssaultReward|null{
  if(t.resolved||power<=0)return null;t.hits++;t.lastHit=tick;
  if(t.kind==='gate'){
   if(!t.chain){const before=t.value;t.value=Math.min(t.cap,t.value+Math.max(1,Math.floor(power/3)));this.stats.gateHits++;if(before<0&&t.value>=0)this.stats.converted++;}
   return null;
  }
  t.hp=Math.max(0,t.hp-power);if(t.hp>0)return null;
  t.resolved=true;this.stats.suppliesBroken++;
  if(t.reward==='chain'){
   // Rewards always start ahead of the player, even when the box is broken late.
   const start=Math.max(z+.6,t.at);
   for(let i=0;i<t.amount;i++)this.targets.push({id:this.nextId--,kind:'gate',at:start+i*.32,x:t.x,width:t.width,value:1,cap:1,hp:0,maxHp:0,reward:'troops',amount:1,resolved:false,hits:0,lastHit:tick,chain:true});
  }
  return{kind:t.reward,amount:t.amount,target:t};
 }
 pass(from:number,to:number,x:number):AssaultReward[]{
  const rewards:AssaultReward[]=[];
  for(const t of this.targets.filter(t=>!t.resolved&&from<t.at&&to+1e-8>=t.at).sort((a,b)=>a.at-b.at||a.id-b.id)){
   t.resolved=true;
   if(Math.abs(x-t.x)>t.width+ROUTE_RADIUS){this.stats.missed++;continue;}
   if(t.kind==='gate'){this.stats.gatesTaken++;if(t.chain)this.stats.chainTaken++;rewards.push({kind:'gate',amount:t.value,target:t});}
   else this.stats.missed++; // An unopened box grants nothing; it is not an invisible fatal wall.
  }
  return rewards;
 }
}

export function assaultPlan(level:number,commits:number[]):AssaultPlan{
 let id=-10000;
 const plan:AssaultPlan=[];
 const gate=(at:number,x:number,value:number,cap:number)=>plan.push({id:id--,kind:'gate',at,x,width:.25,value,cap,hp:0,maxHp:0,reward:'troops',amount:0,chain:false});
 const supply=(at:number,x:number,hp:number,reward:SupplyKind,amount:number)=>plan.push({id:id--,kind:'supply',at,x,width:.18,value:0,cap:0,hp,maxHp:hp,reward,amount,chain:false});
 // The first reward is readable before the first fork. Every level starts fresh.
 supply(2.9,.46,3+level*2,'troops',8+level*2);
 commits.forEach((at,stage)=>{
  const side=stage%2===0?1:-1;
  gate(at+2.8,-side*.48,3+level,8+level*2);
  gate(at+2.8,side*.48,-6-level*2-stage*2,18+level*4+stage*4);
  supply(at+5.5,-side*.48,9+stage*8+level*5,'troops',14+level*4+stage*5);
  supply(at+5.5,side*.48,7+stage*5+level*4,'weapon',Math.min(3,stage+2));
  supply(at+8.1,side*.48,10+stage*10+level*6,stage===1?'chain':'troops',stage===1?8+level*2:16+stage*6+level*4);
 });
 return plan;
}
