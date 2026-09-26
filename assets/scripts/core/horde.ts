import type {Obstacle,Row,Gate} from './model';
export type EnemyKind='footman'|'runner'|'crossbowman'|'elite';
export type RouteId='safe'|'hard';
export type Formation='scattered'|'columns'|'wide';
type Wave={id:string;count:number;kind:string;formation:string;spawnDepth?:number;rowSpacing?:number;offset?:number;at?:number;stageSpeedMultiplier?:number;replacements?:{kind:string;count:number}[];[key:string]:unknown};
export type Fork={id:string;stage:number;previewAt:number;commitAt:number;endAt:number;insideGateAt:number;internalGate:{left:Gate;right:Gate};safeSide:'left'|'right';hardSide:'left'|'right';routes:Record<RouteId,{side:string;label:string;hint:string;exitReinforcements:number;waves:Wave[];[key:string]:unknown}>};
export type HordeConfig={id:string;title:string;startArmy:number;runDuration:number;speedMultiplier:number;warmup:{id:string;count:number;hp:number;depthFront:number;rowSpacing:number;formation:string;[key:string]:unknown};commonWaves:Wave[];forks:Fork[];[key:string]:unknown};
export type BranchChoice={forkId:string;route:RouteId;side:'left'|'right';committedTick:number;rewarded:boolean};
type Planned={at:number;stage:number;routeId:string;wave:Wave};
type Pending={queuedTick:number;stage:number;routeId:string;wave:Wave;index:number;kind:EnemyKind;x:number;depth:number};
// Measured v0.6 candidate: later footmen and a few runners survive one hero edge,
// making zhenjun control observable; first two ordinary stages retain one-hit clarity.
const PROFILES={footman:{hp:[3,4,8],speed:.45,width:.055,loss:1},runner:{hp:[8,9,10],speed:.58,width:.05,loss:1},crossbowman:{hp:[18,24,30],speed:.35,width:.07,loss:2},elite:{hp:[20,26,32],speed:.38,width:.08,loss:2}};
export function formation(count:number,kind:string,seed:number,rowSpacing=.28){
 let r=(seed>>>0)||1;const random=()=>{r=(Math.imul(r,1664525)+1013904223)>>>0;return r/4294967296;};const cols=kind==='columns'?3:kind==='wide'?8:5,spacing=kind==='columns'?.48:kind==='wide'?.185:.30;
 return Array.from({length:count},(_,i)=>({x:Math.max(-.82,Math.min(.82,(i%cols-(cols-1)/2)*spacing+(kind==='scattered'?(random()-.5)*.07:0))),depth:Math.floor(i/cols)*rowSpacing+(kind==='scattered'?random()*.06:0)}));
}
/** Swept target query in relative space. Returns first contact parameter, not array order. */
export function sweptTarget(ax0:number,az0:number,ax1:number,az1:number,o:Obstacle,width=0){
 const rx0=ax0-(o.previousX??o.x),rz0=az0-(o.previousZ??o.at),rx1=ax1-o.x,rz1=az1-o.at;
 const slab=(x0:number,z0:number,x1:number,z1:number,halfX:number,halfZ:number)=>{let enter=0,leave=1;for(const [start,end,radius] of [[x0,x1,halfX],[z0,z1,halfZ]]){const delta=end-start;if(Math.abs(delta)<1e-10){if(Math.abs(start)>radius)return null;continue;}const t0=(-radius-start)/delta,t1=(radius-start)/delta;enter=Math.max(enter,Math.min(t0,t1));leave=Math.min(leave,Math.max(t0,t1));if(enter>leave)return null;}return enter;};
 if(!o.enemyKind)return slab(rx0,rz0,rx1,rz1,o.width+width,o.depthRadius??.02);
 // Enemy ellipse Minkowski-summed with the horizontal wave edge: a continuous
 // capsule in normalized body space, including rounded ends (not an AABB hit).
 const radiusX=o.width,depth=o.depthRadius??.08,x0=rx0/radiusX,z0=rz0/depth,x1=rx1/radiusX,z1=rz1/depth,edge=width/radiusX;
 const ts:number[]=[];const middle=slab(x0,z0,x1,z1,edge,1);if(middle!==null)ts.push(middle);
 for(const center of [-edge,edge]){const px=x0-center,dx=x1-x0,dz=z1-z0,A=dx*dx+dz*dz,C=px*px+z0*z0-1;if(C<=0){ts.push(0);continue;}if(A<1e-12)continue;const B=2*(px*dx+z0*dz),disc=B*B-4*A*C;if(disc<0)continue;const t=(-B-Math.sqrt(disc))/(2*A);if(t>=0&&t<=1)ts.push(t);}
 return ts.length?Math.min(...ts):null;
}
let nextRunId=0;
export class HordeDirector {
 readonly runId=++nextRunId;choices:BranchChoice[]=[];rows:Row[]=[];kills=0;planned=0;spawned=0;dead=0;breached=0;spawnSkipped=0;peakActive=0;peakPending=0;stage=1;private identity=1000;private sequence=0;private plan:Planned[]=[];private queue:Pending[]=[];private losses:{tick:number;loss:number}[]=[];private rewardedIds=new Set<string>();
 constructor(public config:HordeConfig,obstacles:Obstacle[]){
  const w=config.warmup,points=formation(w.count,w.formation,7,w.rowSpacing);this.planned=w.count;
  points.forEach((p,i)=>{const o=this.enemy({queuedTick:0,stage:1,routeId:'warmup',wave:{id:w.id,count:w.count,kind:'footman',formation:w.formation},index:i,kind:'footman',x:p.x,depth:p.depth},0,i);o.at=o.previousZ=w.depthFront+p.depth;o.hp=o.maxHp=w.hp;obstacles.push(o);this.spawned++;});
  this.plan=config.commonWaves.map(w=>({at:w.at!,stage:1,routeId:'common',wave:w}));this.planned+=config.commonWaves.reduce((sum,w)=>sum+w.count,0);
 }
 get pending(){return this.queue.length;}
 get future(){return this.plan.length;}
 get currentChoice(){return this.choices[this.choices.length-1]??null;}
 forkAt(z:number){return this.config.forks.find(f=>z>=f.previewAt&&z<=f.endAt)??null;}
 private enemy(p:Pending,z:number,slot:number):Obstacle{
  const spec=PROFILES[p.kind],hp=spec.hp[p.stage-1],at=z+(p.wave.spawnDepth??6.5)+p.depth;
  return{id:++this.identity,generation:++this.sequence,poolSlot:slot,kind:p.kind==='crossbowman'?'crossbowman':'fighter',enemyKind:p.kind,ordinary:p.kind==='footman'||p.kind==='runner',at,previousZ:at,x:p.x,previousX:p.x,width:spec.width,depthRadius:.08,hp,maxHp:hp,loss:spec.loss,speed:spec.speed*this.config.speedMultiplier*(p.wave.stageSpeedMultiplier??[1,1.1,1.2][p.stage-1]),spawnStage:p.stage,routeId:p.routeId,lastControlTick:-999,slowUntil:0,killRecorded:false};
 }
 before(z:number,x:number,tick:number,obstacles:Obstacle[]){
  this.trimCorpses(obstacles,tick);
  for(let i=obstacles.length-1;i>=0;i--)if(obstacles[i].resolved)obstacles.splice(i,1);
  for(const f of this.config.forks){if(z+1e-8<f.commitAt||this.choices.some(c=>c.forkId===f.id))continue;const side=x<0?'left':'right',route=side===f.safeSide?'safe':'hard';this.choices.push({forkId:f.id,route,side,committedTick:tick,rewarded:false});this.stage=f.stage;
   for(const wave of f.routes[route].waves)this.plan.push({at:f.commitAt+wave.offset!,stage:f.stage,routeId:f.id+':'+route,wave});this.planned+=f.routes[route].waves.reduce((n,w)=>n+w.count,0);
   if(!this.config.shootableSupplies)this.rows.push({id:100+f.stage,at:f.insideGateAt,left:f.internalGate.left,right:f.internalGate.right});
  }
  this.plan.sort((a,b)=>a.at-b.at);
  while(this.plan.length&&this.plan[0].at<=z+1e-8){const p=this.plan.shift()!,stage=p.routeId==='common'?this.stage:p.stage,points=formation(p.wave.count,p.wave.formation,++this.sequence,p.wave.rowSpacing),kinds:EnemyKind[]=Array(p.wave.count).fill('footman');let replace=0;for(const r of p.wave.replacements??[])for(let i=0;i<r.count&&replace<kinds.length;i++)kinds[replace++]=r.kind as EnemyKind;
   points.forEach((point,index)=>{if(this.queue.length>=32){this.spawnSkipped++;return;}this.queue.push({queuedTick:tick,stage,routeId:p.routeId,wave:p.wave,index,kind:kinds[index],x:point.x,depth:point.depth});});
  }
  this.peakPending=Math.max(this.peakPending,this.queue.length);let spawnedThisTick=0;
  while(this.queue.length){const p=this.queue[0];if(tick-p.queuedTick>72||z>this.config.runDuration-6+1e-8){this.spawnSkipped++;this.queue.shift();continue;}const active=obstacles.filter(o=>!o.dead&&!o.resolved).length;if(active>=64||spawnedThisTick>=6)break;const used=new Set(obstacles.map(o=>o.poolSlot)),slot=Array.from({length:64},(_,i)=>i).find(i=>!used.has(i));if(slot===undefined)break;this.queue.shift();const o=this.enemy(p,z,slot); // A delayed birth always starts at its legal far depth.
   if((o.at-z)/(1+(o.speed??0))<1.8)o.at=o.previousZ=z+1.8*(1+(o.speed??0));obstacles.push(o);this.spawned++;spawnedThisTick++;
  }
  for(const o of obstacles){o.previousX=o.x;o.previousZ=o.at;if(!o.dead&&!o.resolved&&o.enemyKind)o.at-=(o.speed??0)*(tick<(o.slowUntil??0)?.6:1)/60;}
  this.peakActive=Math.max(this.peakActive,obstacles.filter(o=>!o.dead&&!o.resolved).length);
 }
 trimCorpses(obstacles:Obstacle[],tick:number){const corpses=obstacles.filter(o=>o.dead&&tick-(o.deadTick??tick)<18).slice(-16),keep=new Set(corpses);for(let i=obstacles.length-1;i>=0;i--)if(obstacles[i].dead&&!keep.has(obstacles[i]))obstacles.splice(i,1);}
 recordDeath(o:Obstacle,tick:number){if(!o.enemyKind||o.killRecorded||!o.dead||o.hp>0)return false;o.killRecorded=true;o.deadTick=tick;this.dead++;this.kills++;return true;}
 collisionLoss(tick:number,requested:number){this.losses=this.losses.filter(v=>tick-v.tick<12);const loss=Math.max(0,Math.min(requested,2-this.losses.reduce((n,v)=>n+v.loss,0)));if(loss)this.losses.push({tick,loss});return loss;}
 exits(z:number,alive:boolean){if(!alive)return[];const rewards:{forkId:string;amount:number}[]=[];for(const c of this.choices){const f=this.config.forks.find(f=>f.id===c.forkId)!,id=this.runId+':'+f.id;if(z+1e-8>=f.endAt&&!this.rewardedIds.has(id)){this.rewardedIds.add(id);c.rewarded=true;rewards.push({forkId:f.id,amount:f.routes[c.route].exitReinforcements});}}return rewards;}
 info(z:number,obstacles:Obstacle[],tactic:string){const f=this.forkAt(z),choice=f?this.choices.find(c=>c.forkId===f.id):this.currentChoice;return{fork:f?.id??null,route:choice?.route??null,stage:this.stage,kills:this.kills,tactic,active:obstacles.filter(o=>!o.dead&&!o.resolved).length,pending:this.pending,spawnSkipped:this.spawnSkipped,planned:this.planned,spawned:this.spawned,dead:this.dead,breached:this.breached};}
}
