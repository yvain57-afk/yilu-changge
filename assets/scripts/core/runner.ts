import type {Journey, Feedback} from './model';
import type {CastId, CompanionId, WeaponId} from './weapons';
import {CAST} from './weapons';
import {RUNNER_RULES,RUNNER_NUMERIC_LIMIT} from './runnerConfig';

export type Reward={kind:'troops'|'equipment'|'chain'|'fieldCompanion';count?:number;stage?:number;id?:CompanionId;spacing?:number;value?:number};
export type RunnerObject={id:string;kind:'mutableGate'|'rewardCrate'|'chainCrate'|'token';at:number;x:number;halfWidth:number;value?:number;damagePerPoint?:number;growthStrategy?:'window'|'capped';maxPositive?:number;hp?:number;reward?:Reward};
export type RunnerWave={id:string;spawnAt:number;count:number;formation:string;centerX:number;spawnAhead:number;hpEach:number;approachSpeed:number;enemyKind:string;existingCastId?:CastId};
export type Divider={id:string;fromProgress:number;toProgress:number;halfWidth:number;aheadMin:number;aheadMax:number;openAtPlayer:boolean;blocksProjectiles:boolean};
export type RunnerLevel={id:string;title:string;scene:string;sourceAnchors:string[];startCount:number;startEquipment:string;routeEnd:number;objective:{kind:string;plannedEnemyCount?:number;bossId?:CastId;bossHp?:number};objects:RunnerObject[];enemyWaves:RunnerWave[];dividers?:Divider[];largeEnemy?:{spawnAt:number;enterAhead:number;minimumCombatAhead:number;hp:number;countInOrdinaryCounter:boolean;finishOnlyAtRouteEnd:boolean;attackProfile:string};exitTransitionRole:string};
export type Equipment={id:string;stage:number;intervalSeconds:number;damagePerUnit:number;speed:number;range:number;directPiercingTargets:number;splashRadius:number;visual:string;splashAffects?:string[];splashDoesNotAffect?:string[]};
export type RunnerRules={equipment:Equipment[];[key:string]:unknown};
export type Target=RunnerObject&{numericId:number;value:number;hp:number;maxHp:number;progress:number;resolved:boolean;claimed:boolean;triggered:boolean;lastHit:number;resolvedTick:number;pacing:TargetPacing};
export type TargetPacing={availableAimTime:number;firstAvailableAt:number|null;firstHitAt:number|null;cappedAt:number|null;hitsAfterCap:number;spentAimingAfterCap:number;durabilityAtPass:number|null;passedAt:number|null;claimedReward:Reward|{kind:'gate';count:number}|null;lossCause:string|null;lastAimedTick:number;firstHittableAt:number|null;hittableAimTime:number;aimedSeconds:number;blockedAimSeconds:number;totalHitDamage:number;gateHitCount:number;valueChangeCount:number;damageAfterCap:number;invalidPlateauSeconds:number;claimedAt:number|null;actualClaimCount:number|null;resolvedAt:number|null;valueSamples:{tick:number;time:number;value:number;progress:number;damage:number}[]};
export type Member={id:number;slot?:number;x:number;z:number;radius:number;weight:number;role:'hero'|'companion'|'soldier'};
export type Shot={id:number;x:number;z:number;previousZ:number;origin:Readonly<{x:number;z:number;stage:number;damage:number;owner:number;tick:number;direction:number;role:Member['role'];weapon:WeaponId;actorId:'hero'|CompanionId|'soldier'}>;damage:number;stage:number;speed:number;range:number;splash:number;spent:boolean};
export type Enemy={id:string;numericId:number;slot:number;x:number;at:number;previousX:number;previousZ:number;hp:number;maxHp:number;speed:number;halfWidth:number;depth:number;castId?:CastId;large:boolean;dead:boolean;lastHit:number;attackClock:number;contacting:boolean};
type Impact={t:number;key:string;target?:Target;enemy?:Enemy;barrier?:string};
type Event=Impact&{shot?:Shot;alternatives?:Impact[];contact?:boolean;member?:Member};
const DT=1/60,clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));

/** Feet and muzzle positions are also the rendering source of truth. No hidden full-squad box. */
type RosterSlot={id:number;slot:number;formationSlot:number;role:Member['role']};
function memberPosition(slot:number,x:number,z:number){
 // A growing prefix of fixed rows: adding a soldier never shifts existing feet or muzzles.
 let row=0,offset=slot,columns=3;while(offset>=columns){offset-=columns;row++;columns=row===1?5:7;}
 const spacing=.17,center=clamp(x,-1.16+(columns-1)*spacing/2,1.16-(columns-1)*spacing/2);
 return{x:center+(offset-(columns-1)/2)*spacing,z:z-.65-row*.30};
}
function placeRoster(roster:RosterSlot[],count:number,x:number,z:number):Member[]{
 const special=roster.filter(m=>m.role!=='soldier').length,soldiers=roster.filter(m=>m.role==='soldier'),mass=count-special;
 return roster.map(m=>{const index=soldiers.indexOf(m),p=m.role==='soldier'?memberPosition(m.formationSlot,x,z):{x:clamp(x,-1.01,1.01)+(special===2?(m.role==='hero'?-.15:.15):0),z};
  return{id:m.id,slot:m.slot,...p,radius:.025,role:m.role,weight:m.role==='soldier'?Math.floor(mass/soldiers.length)+(index<mass%soldiers.length?1:0):1};
 });
}
export function runnerFormation(count:number,x:number,z:number,companion=false):Member[]{
 const visible=Math.min(48,Math.max(0,count)),special=companion&&visible>1?2:1;
 return placeRoster(Array.from({length:visible},(_,i)=>({id:i,slot:i,formationSlot:i-special,role:i===0?'hero':i===1&&special===2?'companion':'soldier'})),count,x,z);
}
export function muzzle(m:Member){return{x:m.x-(m.role==='soldier'?.064:0),z:m.z+.05,height:m.role==='soldier'?45:72};}

/** Exact point swept against a rectangle; optional radius uses sides + rounded corners. */
export function sweptRect(x0:number,z0:number,x1:number,z1:number,left:number,right:number,back:number,front:number,r=0):number|null{
 const slab=(l:number,h:number,b:number,f:number)=>{let lo=0,hi=1;for(const [p,d,a,c] of [[x0,x1-x0,l,h],[z0,z1-z0,b,f]]){if(Math.abs(d)<1e-12){if(p<a||p>c)return null;}else{const u=(a-p)/d,v=(c-p)/d;lo=Math.max(lo,Math.min(u,v));hi=Math.min(hi,Math.max(u,v));if(lo>hi)return null;}}return lo;};
 const hits=[slab(left-r,right+r,back,front),slab(left,right,back-r,front+r)].filter((v):v is number=>v!==null);
 if(r){const dx=x1-x0,dz=z1-z0,a=dx*dx+dz*dz;for(const cx of [left,right])for(const cz of [back,front]){const ox=x0-cx,oz=z0-cz,c=ox*ox+oz*oz-r*r;if(c<=0)hits.push(0);else if(a>1e-15){const b=2*(ox*dx+oz*dz),disc=b*b-4*a*c;if(disc>=0){const t=(-b-Math.sqrt(disc))/(2*a);if(t>=0&&t<=1)hits.push(t);}}}}
 return hits.length?Math.min(...hits):null;
}

export function gateGrowthStrategy(t:RunnerObject):'window'|'capped'{return t.growthStrategy??(t.maxPositive!==undefined?'capped':'window');}
export class RunnerDirector{
 targets:Target[];enemies:Enemy[]=[];shots:Shot[]=[];pendingShots:Shot[]=[];stage=0;kills=0;spawned=0;largeSpawned=false;
 readonly planned:number;readonly profile='runnerVideoV2';private nextId=10000;private nextShot=0;private nextToken=0;private waveIndex=0;private pendingEnemies:{wave:RunnerWave;index:number}[]=[];
 private roster:RosterSlot[]=[];private nextMemberId=0;private approachSlots=new Map<string,string>();
 private fireAt=new Map<number,number>();private graceUntil=0;private pendingChains:Target[]=[];
 private fireFacts:Readonly<{id:number;origin:Shot['origin'];issuedTick:number}>[]=[];
 get recentFires():ReadonlyArray<Readonly<{id:number;origin:Shot['origin'];issuedTick:number}>>{return this.fireFacts;}
 nextFireAtSeconds(memberId:number){return this.fireAt.get(memberId)??this.host.elapsed;}
 stats={issuedShots:0,tickIssuedShots:0,numericGuards:0,shots:0,damageBudget:0,hits:0,gateHits:0,converted:0,gatesTaken:0,crates:0,chainGenerated:0,chainTaken:0,missed:0,equipment:0,fieldCompanions:0,blocked:0,deferredShots:0,deferredChains:0,peakShots:0,peakEnemies:0,peakTokens:0};
 ledger:{tick:number;type:string;sourceId:string;value:number;countBefore:number;countAfter:number;detail?:string;sourceEnemyId?:string;sourceTargetId?:string;memberId?:number;point?:{x:number;z:number};actualLoss?:number;removedMemberIds?:number[];removedMembers?:Member[];reason?:string}[]=[];
 lastDamage:typeof this.ledger[number]|null=null;
 lastContact:{tick:number;enemyId:string;memberId:number;x:number;z:number;enemyX:number;enemyZ:number;loss:number;removedMemberIds?:number[]}|null=null;message='';messageUntil=0;explosions:{id:number;x:number;z:number;radius:number;tick:number}[]=[];
 constructor(readonly host:Journey,readonly config:RunnerLevel){
  this.targets=config.objects.map(t=>this.makeTarget(t));this.planned=config.enemyWaves.reduce((n,w)=>n+w.count,0);
  if(config.objective.plannedEnemyCount!==undefined&&config.objective.plannedEnemyCount!==this.planned)throw Error('Planned enemy count mismatch');
  host.count=config.startCount;host.tier=1;host.bossHP=config.largeEnemy?.hp??0;
 }
 private makeTarget(t:RunnerObject):Target{return{...t,reward:t.reward?{...t.reward}:undefined,numericId:this.nextId++,value:t.value??0,hp:t.hp??0,maxHp:t.hp??0,progress:0,resolved:false,claimed:false,triggered:false,lastHit:-100,resolvedTick:-100,pacing:{availableAimTime:0,firstAvailableAt:null,firstHitAt:null,cappedAt:null,hitsAfterCap:0,spentAimingAfterCap:0,durabilityAtPass:null,passedAt:null,claimedReward:null,lossCause:null,lastAimedTick:-1,firstHittableAt:null,hittableAimTime:0,aimedSeconds:0,blockedAimSeconds:0,totalHitDamage:0,gateHitCount:0,valueChangeCount:0,damageAfterCap:0,invalidPlateauSeconds:0,claimedAt:null,actualClaimCount:null,resolvedAt:null,valueSamples:[]}};}
 private syncRoster(){
  const visible=Math.min(48,Math.max(0,this.host.count)),wantCompanion=this.host.companionActive&&visible>1;
  while(this.roster.length>visible){const removed=this.roster.pop()!;this.fireAt.delete(removed.id);}
  if(!visible)return;
  const companion=this.roster.find(m=>m.role==='companion');
  if(companion&&!wantCompanion){companion.role='soldier';companion.formationSlot=this.freeFormationSlot();}
  while(this.roster.length<visible){const slots=new Set(this.roster.map(m=>m.slot));let slot=0;while(slots.has(slot))slot++;
   this.roster.push({id:this.nextMemberId++,slot,formationSlot:this.freeFormationSlot(),role:!this.roster.length?'hero':this.roster.length===1&&wantCompanion?'companion':'soldier'});
  }
  if(wantCompanion&&!this.roster.some(m=>m.role==='companion')){const recruit=this.roster.find(m=>m.role==='soldier')!;recruit.role='companion';recruit.formationSlot=-1;}
 }
 private freeFormationSlot(){const occupied=new Set(this.roster.filter(m=>m.role==='soldier').map(m=>m.formationSlot));let slot=0;while(occupied.has(slot))slot++;return slot;}
 get members(){this.syncRoster();return placeRoster(this.roster,this.host.count,this.host.x,this.host.z);}
 /** Candidate steering and tests use the live roster, including holes left by casualties. */
 formationAt(x:number,z=this.host.z){this.syncRoster();return placeRoster(this.roster,this.host.count,x,z);}
 get remaining(){return this.planned-this.kills;}
 get large(){return this.enemies.find(e=>e.large&&!e.dead);}
 get distanceLeft(){return Math.max(0,this.config.routeEnd-this.host.z);}
 get info(){return {kills:this.kills,remaining:this.remaining,planned:this.planned,spawned:this.spawned,active:this.enemies.filter(e=>!e.dead&&!e.large).length,pending:this.pendingEnemies.length,stage:this.stage};}
 get barriers(){const z=this.host.z;return(this.config.dividers??[]).map(d=>{const edge=clamp(Math.min(z-d.fromProgress,d.toProgress-z),0,1);return{id:d.id,left:-d.halfWidth,right:d.halfWidth,back:z+d.aheadMax-(d.aheadMax-d.aheadMin)*edge,front:z+d.aheadMax,visible:edge>0};}).filter(b=>b.visible);}
 private emit(e:Feedback){this.host.feedback.push(Object.freeze({...e,simulationTick:this.host.simulationTick}));}
 private record(type:string,sourceId:string,value:number,before=this.host.count,detail?:string){const e={tick:this.host.simulationTick,type,sourceId,value,countBefore:before,countAfter:this.host.count,detail};this.ledger.push(e);if(this.ledger.length>512)this.ledger.shift();return e;}
 private numericGuard(sourceId:string,value:number,reason:string):never{this.stats.numericGuards++;this.record('numericGuard',sourceId,value,this.host.count,reason);this.message='数值保护：'+reason;this.messageUntil=this.host.elapsed+10;throw new RangeError('Runner numeric guard: '+reason);}
 private add(n:number,t:Target,type='reinforcement'){const j=this.host;if(j.finished||j.count===0)return;const before=j.count,next=j.count+n;if(!Number.isSafeInteger(next)||next<0||next>RUNNER_NUMERIC_LIMIT)this.numericGuard(t.id,next,'squad reward outside proven legal bound');j.count=next;this.record(type,t.id,j.count-before,before);if(j.count>before)this.emit({kind:'gather',x:t.x,worldZ:t.at,amount:j.count-before,targetId:'team'});}
 private lose(n:number,id:string,type:string,victim?:Member,point?:{x:number;z:number}){
  const j=this.host;if(j.finished)return;const before=j.count,members=this.members,actualLoss=Math.min(before,n),contact=point??(victim?{x:victim.x,z:victim.z}:{x:j.x,z:j.z});
  const removeCount=members.length-Math.min(48,before-actualLoss),removedMemberIds:number[]=[];
  // Resolve casualties here, once. Prefer nearby ordinary troops, then the companion;
  // the surviving commander remains the controllable anchor while any troop budget remains.
  const casualties=[...members].sort((a,b)=>Number(a.role==='hero')-Number(b.role==='hero')||Number(a.role==='companion')-Number(b.role==='companion')||Math.hypot(a.x-contact.x,a.z-contact.z)-Math.hypot(b.x-contact.x,b.z-contact.z)||a.id-b.id).slice(0,removeCount);
  for(const m of casualties){removedMemberIds.push(m.id);this.roster=this.roster.filter(v=>v.id!==m.id);this.fireAt.delete(m.id);}
  j.count=before-actualLoss;this.lastDamage=this.record(type,id,-actualLoss,before);
  const enemy=this.enemies.find(e=>e.id===id||String(e.numericId)===id),name=enemy?.castId?CAST[enemy.castId].name:'敌兵';
  Object.assign(this.lastDamage,{[type==='negativeGate'?'sourceTargetId':'sourceEnemyId']:enemy?.id??id,memberId:victim?.id,point:contact,actualLoss,removedMemberIds,removedMembers:casualties,reason:type});
  j.cause=type==='negativeGate'?`队形碰到减员门（${-n}），损失 ${actualLoss} 人`:`被${name}${type==='enemyProjectile'?'的飞矛':'近身攻击'}击中，损失 ${actualLoss} 人`;
  this.emit({kind:'hurt',x:contact.x,worldZ:contact.z,amount:actualLoss,targetId:'team'});if(j.count===0){j.phase='lost';this.shots=[];this.pendingShots=[];}
 }

 hitTarget(t:Target,damage:number){
  const j=this.host;if(t.resolved||damage<=0||j.finished||t.kind==='token')return;if(!Number.isFinite(damage)||damage>RUNNER_NUMERIC_LIMIT*4)this.numericGuard(t.id,damage,'invalid target damage');t.pacing.totalHitDamage+=damage;t.lastHit=j.simulationTick;if(t.pacing.firstHitAt===null)t.pacing.firstHitAt=j.elapsed;
  if(t.kind==='mutableGate'){
   const before=t.value,capped=gateGrowthStrategy(t)==='capped',cap=t.maxPositive??64,threshold=t.damagePerPoint??2;
   if(!Number.isFinite(threshold)||threshold<=0)this.numericGuard(t.id,threshold,'invalid gate damage threshold');
   if(capped&&before>=cap){t.pacing.hitsAfterCap++;t.pacing.damageAfterCap+=damage;}
   const accumulated=t.progress+damage,points=Math.floor((accumulated+1e-9)/threshold),next=capped?Math.min(cap,before+points):before+points;
   if(!Number.isSafeInteger(next)||Math.abs(next)>RUNNER_NUMERIC_LIMIT)this.numericGuard(t.id,next,'gate value outside proven legal bound');
   t.value=next;t.progress=capped&&next>=cap?0:Math.max(0,accumulated-points*threshold);this.stats.gateHits++;t.pacing.gateHitCount++;
   if(capped&&next>=cap&&t.pacing.cappedAt===null)t.pacing.cappedAt=j.elapsed;
   if(before!==next){this.record('gateValue',t.id,next,j.count,`${before}→${next}`);t.pacing.valueChangeCount++;const sample={tick:j.simulationTick,time:j.elapsed,value:next,progress:t.progress,damage:t.pacing.totalHitDamage},samples=t.pacing.valueSamples;if(samples.length&&samples[samples.length-1].tick===j.simulationTick)samples[samples.length-1]=sample;else{samples.push(sample);if(samples.length>720)samples.splice(1,1);}}
   if(before<0&&t.value>=0){this.stats.converted++;this.message=t.value===0?'门值归零':'红门已打正';this.messageUntil=j.elapsed+1;}else if(before===0&&t.value>0){this.message='增援门开始增长';this.messageUntil=j.elapsed+1;}
  }else{
   const actual=Math.min(t.hp,damage);t.hp-=actual;
   if(t.hp<=1e-8){t.hp=0;t.resolved=t.claimed=true;t.resolvedTick=j.simulationTick;t.pacing.resolvedAt=t.pacing.claimedAt=j.elapsed;this.stats.crates++;this.record('crateBroken',t.id,t.maxHp,j.count,t.reward?.kind);this.emit({kind:'break',x:t.x,worldZ:t.at,amount:0,targetId:t.numericId});
    const r=t.reward!;t.pacing.claimedReward={...r};
    if(r.kind==='troops')this.add(r.count!,t);
    if(r.kind==='equipment'&&r.stage!>this.stage){this.stage=r.stage!;j.tier=this.stage+1;this.stats.equipment++;this.record('equipment',t.id,this.stage);this.emit({kind:'upgrade',x:t.x,worldZ:t.at,amount:j.tier,targetId:t.numericId});}
    if(r.kind==='chain')this.pendingChains.push(t);
    if(r.kind==='fieldCompanion'){const previous=j.companion;this.add(1,t,'fieldCompanion');j.companion=r.id!;this.stats.fieldCompanions++;this.message=previous===r.id?'赵云仍在阵中 · 同袍 +1':previous?'赵云接替出战 · 原同袍留队':'赵云加入队伍';this.messageUntil=j.elapsed+2.5;}
   }
  }
  this.emit({kind:'hit',x:t.x,worldZ:t.at,amount:damage,targetId:t.numericId});
 }
 private chains(){
  for(const t of [...this.pendingChains]){const n=t.reward!.count!;if(n>12)throw Error('Chain generator exceeds configured limit');const active=this.targets.filter(v=>v.kind==='token'&&!v.resolved).length;
   if(active+n>24){if(this.host.simulationTick%60===0)this.stats.deferredChains++;this.message='连营援军正在列队';this.messageUntil=this.host.elapsed+1;continue;}
   let start=Math.max(t.at,this.host.z+1.4),spacing=t.reward!.spacing??.5;let attempts=0;
   // Reserve an unobstructed corridor, never silently drop promised tokens.
   while(this.targets.some(o=>!o.resolved&&o.kind!=='token'&&Math.abs(o.x-t.x)<o.halfWidth+t.halfWidth&&o.at>=start-.25&&o.at<=start+(n-1)*spacing+.25)){
    const obstacles=this.targets.filter(o=>!o.resolved&&o.kind!=='token'&&Math.abs(o.x-t.x)<o.halfWidth+t.halfWidth&&o.at>=start-.25&&o.at<=start+(n-1)*spacing+.25);start=Math.max(...obstacles.map(o=>o.at))+.6;if(++attempts>this.targets.length)throw Error('Cannot reserve chain corridor');
   }
   for(let i=0;i<n;i++)this.targets.push(this.makeTarget({id:`${t.id}:token:${this.nextToken++}`,kind:'token',at:start+i*spacing,x:t.x,halfWidth:t.halfWidth,value:1}));
   this.stats.chainGenerated+=n;this.record('chainSpawn',t.id,n,this.host.count,`firstZ=${start}`);this.pendingChains.splice(this.pendingChains.indexOf(t),1);
  }
 }
 private spawn(){const j=this.host;
  const waves=this.config.enemyWaves;while(this.waveIndex<waves.length&&waves[this.waveIndex].spawnAt<=j.z+1e-8){const wave=waves[this.waveIndex++];for(let index=0;index<wave.count;index++)this.pendingEnemies.push({wave,index});}
  const used=new Set(this.enemies.filter(e=>!e.dead).map(e=>e.slot));
  while(this.pendingEnemies.length&&this.enemies.filter(e=>!e.dead&&!e.large).length<64){const{wave:w,index:i}=this.pendingEnemies.shift()!;let slot=0;while(used.has(slot))slot++;used.add(slot);
   const cols=w.formation==='column'?2:w.formation==='twoColumns'?4:w.formation==='cluster'?5:7,row=Math.floor(i/cols),col=i%cols;
   let x=w.centerX;if(w.formation==='twoColumns')x+=(col<2?-.42:.42)+(col%2-.5)*.1;else if(w.formation!=='single')x+=(col-(Math.min(cols,w.count)-1)/2)*(w.formation==='wide'?.22:.13);
   const at=Math.max(w.spawnAt+w.spawnAhead+row*.23,j.z+6.5);this.enemies.push({id:`${w.id}:${i}`,numericId:this.nextId++,slot,x:clamp(x,-.98,.98),at,previousX:x,previousZ:at,hp:w.hpEach,maxHp:w.hpEach,speed:w.approachSpeed,halfWidth:w.existingCastId?.14:.045,depth:.085,castId:w.existingCastId,large:false,dead:false,lastHit:-100,attackClock:.8,contacting:false});this.spawned++;
  }
  const b=this.config.largeEnemy;if(b&&!this.largeSpawned&&j.z>=b.spawnAt){this.largeSpawned=true;const at=j.z+b.enterAhead;this.enemies.push({id:'large:yang_ling',numericId:this.nextId++,slot:64,x:0,at,previousX:0,previousZ:at,hp:b.hp,maxHp:b.hp,speed:.2,halfWidth:.27,depth:.2,castId:this.config.objective.bossId,large:true,dead:false,lastHit:-100,attackClock:2.2,contacting:false});this.record('largeEntry','large:yang_ling',b.hp);}
 }
 private moveEnemies(){
  const j=this.host,feet=this.members;if(!feet.length)return;
  // Exposed feet produce a bounded perimeter, not two infinitely long contact queues.
  const exposed=feet.filter(m=>!feet.some(o=>o.id!==m.id&&o.z>m.z+.04&&Math.abs(o.x-m.x)<.12));
  const flanks=feet.filter(m=>m.role==='soldier'&&!feet.some(o=>o.z>=m.z-.05&&Math.abs(o.x)>Math.abs(m.x)+.05));
  const candidates=[...exposed,...flanks.filter(m=>exposed.indexOf(m)===-1)].slice(0,16);
  const slots=candidates.reduce((out,m)=>out.concat([-1,1].map(side=>({key:`${m.id}:${side}`,x:clamp(m.x+side*.022,-1.16,1.16),z:m.z+.082}))),[] as {key:string;x:number;z:number}[]).slice(0,24);
  const alive=this.enemies.filter(e=>!e.dead&&!e.large),used=new Map<string,number>();
  for(const e of alive){const key=this.approachSlots.get(e.id);if(slots.some(s=>s.key===key))used.set(key!,1+(used.get(key!)??0));else this.approachSlots.delete(e.id);}
  const liveIds=new Set(alive.map(e=>e.id));for(const id of this.approachSlots.keys())if(!liveIds.has(id))this.approachSlots.delete(id);
  for(const e of this.enemies){e.previousX=e.x;e.previousZ=e.at;}
  for(const e of this.enemies){if(e.dead)continue;
   if(e.large){e.at=Math.max(j.z+(this.config.largeEnemy?.minimumCombatAhead??4.5),e.at-e.speed*DT);continue;}
   let dx=0,dz=-e.speed*DT;
   if(e.at-j.z<1.7){
    let slot=slots.find(s=>s.key===this.approachSlots.get(e.id));
    if(!slot){slot=[...slots].sort((a,b)=>(used.get(a.key)??0)-(used.get(b.key)??0)||Math.hypot((a.x-e.x)*2.5,a.z-e.at)-Math.hypot((b.x-e.x)*2.5,b.z-e.at)||a.key.localeCompare(b.key))[0];this.approachSlots.set(e.id,slot.key);used.set(slot.key,1+(used.get(slot.key)??0));}
    dx=clamp(slot.x-e.x,-.45*DT,.45*DT);dz=clamp(slot.z-e.at,-(1+e.speed)*DT,(1.2+e.speed)*DT);
    // Soft local separation changes velocity only. It cannot teleport an enemy or
    // create an impenetrable line: the forward-most attacker keeps its contact path.
    for(const other of alive){if(other===e||other.previousZ>e.previousZ+.03)continue;const sepX=e.previousX-other.previousX,sepZ=e.previousZ-other.previousZ;
     if(Math.abs(sepX)<.09&&Math.abs(sepZ)<.16){const sign=Math.abs(sepX)>.002?Math.sign(sepX):(e.slot%2?1:-1);dx+=sign*.12*DT;}
    }
   }
   e.x=clamp(e.x+clamp(dx,-.45*DT,.45*DT),-1.16,1.16);e.at+=clamp(dz,-(1+e.speed)*DT,(1.2+e.speed)*DT);
  }
 }
 private fire(){const j=this.host,spec=RUNNER_RULES.equipment[this.stage];for(const m of this.members){if((this.fireAt.get(m.id)??0)>j.elapsed+1e-9)continue;
  const companion=m.role==='companion'&&j.companion==='zhao_yun_guest',factor=companion?1.5:1;this.fireAt.set(m.id,j.elapsed+spec.intervalSeconds*factor);
  const p=muzzle(m),actorId=m.role==='hero'?'hero':m.role==='companion'?j.companion!:'soldier',weapon:WeaponId=m.role==='hero'?j.weapon:m.role==='companion'?CAST[j.companion!].weapon:'bow',damage=spec.damagePerUnit*m.weight*factor,origin=Object.freeze({x:p.x,z:p.z,stage:this.stage,damage,owner:m.id,tick:j.simulationTick,direction:0,role:m.role,weapon,actorId});
  const shot:Shot={id:++this.nextShot,x:p.x,z:p.z,previousZ:p.z,origin,damage,stage:this.stage,speed:spec.speed,range:spec.range,splash:Math.max(spec.splashRadius,companion?.08:0),spent:false};
  this.pendingShots.push(shot);this.stats.shots++;this.stats.damageBudget+=damage;
 }
 while(this.pendingShots.length&&this.shots.length<512){const s=this.pendingShots.shift()!;this.shots.push(s);this.fireFacts.push(Object.freeze({id:s.id,origin:s.origin,issuedTick:j.simulationTick}));this.stats.issuedShots++;this.stats.tickIssuedShots++;this.emit({kind:'shot',x:s.x,worldZ:s.z,amount:s.damage,projectileId:s.id,sourceId:s.origin.role==='hero'?'hero':'team'});}
 if(this.pendingShots.length)this.stats.deferredShots++;
 }
 private intersections(s:Shot):Impact[]{const hits:Impact[]=[];
  for(const t of this.targets){if(t.resolved||t.kind==='token')continue;const q=sweptRect(s.x,s.previousZ,s.x,s.z,t.x-t.halfWidth,t.x+t.halfWidth,t.at-.06,t.at+.06);if(q!==null)hits.push({t:q,key:t.id,target:t});}
  for(const e of this.enemies){if(e.dead)continue;const q=sweptRect(s.x-e.previousX,s.previousZ-e.previousZ,s.x-e.x,s.z-e.at,-e.halfWidth,e.halfWidth,-e.depth,e.depth);if(q!==null)hits.push({t:q,key:e.id,enemy:e});}
  for(const b of this.barriers){const q=sweptRect(s.x,s.previousZ,s.x,s.z,b.left,b.right,b.back,b.front);if(q!==null)hits.push({t:q,key:b.id,barrier:b.id});}
  return hits.sort((a,b)=>a.t-b.t||a.key.localeCompare(b.key));
 }
 private enemyHit(e:Enemy,damage:number,s:Shot){if(e.dead)return;const actual=Math.min(e.hp,damage);e.hp-=actual;e.lastHit=this.host.simulationTick;this.host.damageTotals.archer+=actual;
  this.emit({kind:'hit',x:e.x,worldZ:e.at,amount:actual,targetId:e.numericId,projectileId:s.id});
  if(e.hp<=1e-8){e.hp=0;e.dead=true;if(!e.large)this.kills++;this.record(e.large?'largeDefeated':'enemyDefeated',e.id,1);this.emit({kind:'break',x:e.x,worldZ:e.at,amount:0,targetId:e.numericId});}
 }
 private collide(feetBefore:Member[],feetAfter:Member[]){const j=this.host,events:Event[]=[];
  for(const s of this.shots){s.previousZ=s.z;s.z+=s.speed*DT;const list=this.intersections(s);if(list.length)events.push({...list[0],shot:s,alternatives:list.slice(1)});}
  for(const t of this.targets){if(t.resolved||!(t.kind==='mutableGate'||t.kind==='token'))continue;
   // Keep each original foot's event. A preceding loss can remove the earliest
   // toucher while another surviving foot still legitimately crosses this gate.
   for(let i=0;i<feetBefore.length;i++){const a=feetBefore[i],b=feetAfter[i];const q=sweptRect(a.x,a.z,b.x,b.z,t.x-t.halfWidth,t.x+t.halfWidth,t.at-.035,t.at+.035,a.radius);
    if(q!==null)events.push({t:q,key:t.id,target:t,contact:true,member:{...b,x:a.x+(b.x-a.x)*q,z:a.z+(b.z-a.z)*q}});
   }
  }
  while(events.length&&!j.finished){events.sort((a,b)=>a.t-b.t||a.key.localeCompare(b.key)||Number(!a.shot)-Number(!b.shot));const e=events.shift()!;
   if(e.contact){const t=e.target!;if(t.resolved||!this.roster.some(m=>m.id===e.member!.id))continue;t.resolved=t.triggered=true;t.resolvedTick=j.simulationTick;t.pacing.resolvedAt=t.pacing.claimedAt=j.elapsed;const beforeClaim=j.count;this.stats.gatesTaken++;if(t.kind==='token')this.stats.chainTaken++;this.record('gateContact',t.id,t.value);
    t.claimed=t.value>=0;t.pacing.claimedReward={kind:'gate',count:t.value};if(t.value<0){t.pacing.lossCause='negativeGate';this.lose(-t.value,t.id,'negativeGate',e.member);}else this.add(t.value,t,'gateGain');t.pacing.actualClaimCount=j.count-beforeClaim;continue;}
   const s=e.shot!;if(s.spent)continue;
   if(e.target?.resolved||e.enemy?.dead){const next=e.alternatives!.shift();if(next)events.push({...next,shot:s,alternatives:e.alternatives});continue;}
   s.spent=true;this.stats.hits++;const iz=s.previousZ+(s.z-s.previousZ)*e.t;
   if(e.target)this.hitTarget(e.target,s.damage);
   if(e.barrier)this.stats.blocked++;
   if(e.enemy){this.enemyHit(e.enemy,s.damage,s);if(s.splash>0){this.explosions.push({id:s.id,x:s.x,z:iz,radius:s.splash,tick:j.simulationTick});for(const other of this.enemies)if(other!==e.enemy&&!other.dead&&Math.hypot((other.x-s.x)*2.5,other.at-iz)<=s.splash)this.enemyHit(other,s.damage,s);}}
  }
  this.shots=this.shots.filter(s=>!s.spent&&s.z-s.origin.z<s.range);this.explosions=this.explosions.filter(e=>j.simulationTick-e.tick<16).slice(-32);
 }
 private contacts(before:Member[]){const j=this.host;const feet=this.members.filter(m=>before.some(a=>a.id===m.id));
  for(const e of this.enemies){if(e.dead)continue;if(e.large){e.attackClock-=DT;if(e.attackClock<=0){e.attackClock=2.2;const aim=j.x;j.warnings.push({id:e.numericId*1000+j.simulationTick,source:e.numericId,weaponId:'spear',profile:'runner-arrow',x:aim,width:.075,loss:1,remaining:1.1,duration:1.1,flight:.4,impact:.15,stage:'charge',hit:false,originX:e.x,originZ:e.at});this.emit({kind:'warn',x:aim,amount:1,worldZ:e.at,weaponId:'spear'});}continue;}
   const victim=feet.find(m=>{const a=before.find(v=>v.id===m.id)!;return sweptRect((a.x-e.previousX)*2.5,a.z-e.previousZ,(m.x-e.x)*2.5,m.z-e.at,0,0,0,0,m.radius+e.depth+.015)!==null;});e.contacting=!!victim;if(e.contacting){e.attackClock-=DT;if(e.attackClock<=0&&j.elapsed>=this.graceUntil){e.attackClock=.8;this.graceUntil=j.elapsed+.2;this.lose(1,e.id,'enemyContact',victim);this.lastContact={tick:j.simulationTick,enemyId:e.id,memberId:victim!.id,x:victim!.x,z:victim!.z,enemyX:e.x,enemyZ:e.at,loss:this.lastDamage?.actualLoss??0,removedMemberIds:this.lastDamage?.removedMemberIds};if(j.finished)return;}}else e.attackClock=Math.max(.2,e.attackClock);
  }
  for(const w of j.warnings){w.remaining-=DT;if(w.remaining<=w.flight&&w.stage==='charge')w.stage='flight';if(w.stage==='flight'&&!w.hit){const q=clamp(1-w.remaining/w.flight,0,1);w.projectileX=(w.originX??0)*(1-q)+w.x*q;w.previousZ=w.projectileZ??w.originZ;w.projectileZ=(w.originZ??j.z+4.5)*(1-q)+(j.z-.4)*q;
    const victim=feet.find(m=>sweptRect(w.projectileX!,w.previousZ!,w.projectileX!,w.projectileZ!,m.x-w.width,m.x+w.width,m.z-.03,m.z+.03,m.radius)!==null);if(victim){w.hit=true;w.stage='impact';this.lose(1,String(w.source),'enemyProjectile',victim);if(j.finished)return;}}
  }j.warnings=j.warnings.filter(w=>w.remaining>-.15);
 }
 private samplePacing(){const j=this.host,feet=this.members,spec=RUNNER_RULES.equipment[this.stage],barriers=this.barriers;
  const blocks=(x:number,z:number,end:number,left:number,right:number,back:number,front:number)=>x>=left&&x<=right&&front>=z&&back<=end;
  for(const t of this.targets){const p=t.pacing;
   if(p.passedAt===null&&j.z>=t.at){p.passedAt=j.elapsed;p.durabilityAtPass=t.hp;}
   if(t.resolved||t.kind==='token')continue;
   const reachable=feet.filter(m=>{const z=muzzle(m).z;return t.at>=z&&t.at-z<=spec.range;});
   if(reachable.length){p.availableAimTime+=DT;if(p.firstAvailableAt===null)p.firstAvailableAt=j.elapsed;}
   const aimed=reachable.filter(m=>Math.abs(muzzle(m).x-t.x)<=t.halfWidth);if(aimed.length)p.aimedSeconds+=DT;
   const clear=aimed.some(m=>{const o=muzzle(m),end=t.at-.06;return !this.targets.some(other=>other!==t&&!other.resolved&&other.kind!=='token'&&other.at<t.at&&blocks(o.x,o.z,end,other.x-other.halfWidth,other.x+other.halfWidth,other.at-.06,other.at+.06))&&!this.enemies.some(e=>!e.dead&&blocks(o.x,o.z,end,e.x-e.halfWidth,e.x+e.halfWidth,e.at-e.depth,e.at+e.depth))&&!barriers.some(b=>blocks(o.x,o.z,end,b.left,b.right,b.back,b.front));});
   if(clear){p.hittableAimTime+=DT;if(p.firstHittableAt===null)p.firstHittableAt=j.elapsed;if(gateGrowthStrategy(t)==='capped'&&t.value>=(t.maxPositive??64))p.invalidPlateauSeconds+=DT;}else if(aimed.length)p.blockedAimSeconds+=DT;
   if(p.cappedAt!==null&&reachable.some(m=>Math.abs(muzzle(m).x-t.x)<=t.halfWidth)){p.spentAimingAfterCap+=DT;p.lastAimedTick=j.simulationTick;}
  }
 }
 pacingReport(){return this.targets.filter(t=>t.kind!=='token').map(t=>({id:t.id,kind:t.kind,value:t.value,growthStrategy:gateGrowthStrategy(t),initialValue:this.config.objects.find(o=>o.id===t.id)?.value,maxPositive:t.maxPositive,progress:t.progress,damagePerPoint:t.damagePerPoint,hp:t.hp,maxHp:t.maxHp,resolved:t.resolved,claimed:t.claimed,...t.pacing}));}
 tick(){const j=this.host;if(j.finished)return;j.simulationTick++;this.stats.tickIssuedShots=0;this.fireFacts=this.fireFacts.filter(f=>j.simulationTick-f.issuedTick<24);j.elapsed+=DT;
  const before=this.members;j.x+=clamp(j.target-j.x,-DT*2.7,DT*2.7);j.z=Math.min(this.config.routeEnd,j.z+DT);const after=this.members;
  this.samplePacing();this.spawn();this.moveEnemies();this.fire();this.collide(before,after);if(j.finished)return;this.chains();this.contacts(before);if(j.finished)return;
  const back=Math.min(...this.members.map(m=>m.z))-.15;
  for(const t of this.targets)if(!t.resolved&&t.at<back){t.resolved=true;t.resolvedTick=j.simulationTick;t.pacing.resolvedAt=j.elapsed;t.pacing.lossCause=t.kind==='mutableGate'||t.kind==='token'?'not-contacted':'unopened';this.stats.missed++;this.record('missed',t.id,t.hp||t.value);}
  this.enemies=this.enemies.filter(e=>!e.dead||j.simulationTick-e.lastHit<18);
  j.bossHP=this.large?.hp??(this.largeSpawned?0:j.bossHP);j.bossDepth=this.large?this.large.at-j.z:4.5;
  this.stats.peakShots=Math.max(this.stats.peakShots,this.shots.length);this.stats.peakEnemies=Math.max(this.stats.peakEnemies,this.enemies.filter(e=>!e.dead&&!e.large).length);this.stats.peakTokens=Math.max(this.stats.peakTokens,this.targets.filter(t=>t.kind==='token'&&!t.resolved).length);
  if(j.z>=this.config.routeEnd&&(this.config.objective.kind==='clearEnemies'?this.remaining===0:this.largeSpawned&&!this.large)){j.phase='won';this.shots=[];this.pendingShots=[];j.warnings=[];}
 }
 snapshot(){return {profile:this.profile,stage:this.stage,remaining:this.remaining,distanceLeft:this.distanceLeft,planned:this.planned,spawned:this.spawned,pending:this.pendingEnemies.length,members:this.members,recentFires:this.recentFires,targets:this.targets.filter(t=>!t.resolved),enemies:this.enemies.filter(e=>!e.dead),shots:this.shots,barriers:this.barriers,stats:this.stats,ledger:this.ledger,lastDamage:this.lastDamage,lastContact:this.lastContact,pacing:this.pacingReport(),large:this.large??null,message:this.host.elapsed<this.messageUntil?this.message:''};}
 dispose(){this.fireFacts=[];this.shots=[];this.pendingShots=[];this.enemies=[];this.targets=[];this.pendingEnemies=[];this.pendingChains=[];this.explosions=[];this.fireAt.clear();this.roster=[];this.approachSlots.clear();}
}
