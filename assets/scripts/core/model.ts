import {actorAnchor,nearGeometry,bossContactDepth,contactSurface} from './combatGeometry';
import {WEAPONS,CAST,HERO_BASE_DAMAGE,TIER_FACTORS,TIER_WIDTHS,AttackInstance,WeaponWave,RunLoadout,CompanionId,CastId,WeaponId,PlayerWeapon,companionFor} from './weapons';
/** Fixed-step combat. x is lateral; z is travel seconds. Decoration never participates. */
export type Phase = 'run' | 'boss' | 'won' | 'lost';
export type Gate = { kind: 'add' | 'double'; value: number };
export type Row = { id: number; at: number; left: Gate; right: Gate };
export type Attack = { weaponId?:WeaponId; profile?:string; kind: 'aimed' | 'fixed'; x?: number; telegraphSeconds: number; halfWidth: number; loss: number; impactSeconds: number; recoverySeconds: number };
export type Obstacle = { id: number; at: number; x: number; width: number; kind: 'wood' | 'rock' | 'fighter' | 'crossbowman'; hp: number; loss: number; rowId?: number; side?: 'left' | 'right'; dead?: boolean; resolved?: boolean; attack?: Attack & {startAt:number}; attackStarted?: boolean };
export type Level = { bossId?:CastId; eliteIds?:number[]; id: string; title: string; scene: string; rankBefore: string; rankAfter: string; duration: number; start: number; bossHP: number; bossName: string; bossDelay: number; bossAttacks: Attack[]; rows: Row[]; obstacles: Obstacle[]; opening: string; ending: string };
export type Arrow = { x: number; z: number; damage: number; readonly id?: number };
export type Warning = { weaponId?:WeaponId; profile?:string; originX?:number; originZ?:number; projectileX?:number; projectileZ?:number; previousZ?:number; id: number; source: number | 'boss'; x: number; width: number; loss: number; remaining: number; duration: number; flight: number; impact: number; stage: 'charge' | 'flight' | 'impact'; hit: boolean };
export type Feedback = Readonly<{ kind: 'shot' | 'gather' | 'hit' | 'break' | 'hurt' | 'warn' | 'meleeStart' | 'meleeActive' | 'meleeHit' | 'meleeEnd' | 'waveHit' | 'upgrade' | 'awaken'; x: number; amount: number; targetId?: number | 'boss' | 'team'; worldZ?: number; hitHeight?:number; simulationTick?: number; projectileId?: number; sourceId?: number | 'boss' | 'team' | 'hero' | CompanionId; weaponId?:WeaponId; attackId?: number; volley?: Readonly<{count:number; totalCount?:number; archerCount?:number; companion?:boolean; tick?:number; x?:number; worldZ?:number; aimZ:number; height:number}> }>;
/** Shared collision contract; renderers read this, never approximate it. */
export const BOSS_TARGET = Object.freeze({ halfWidth: .42, depth: 4 });
export const MELEE = Object.freeze({windup:10, active:5, recovery:21, cycle:36, prepare:1.25, reach:1.10, halfWidth:.14, damage:5});
export type Melee = AttackInstance;
export const STEP = 1 / 60;
export const HORIZON = 7;
export const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
export class Journey {
 phase: Phase = 'run'; count: number; x = 0; target = 0; z = 0; elapsed = 0; paused = false;
 appearance=0;weapon:PlayerWeapon;companion:CompanionId|null;companionAttack:AttackInstance|null=null;waves:WeaponWave[]=[];tier=1;upgradeRewards=new Set<number>();awakeningUsed=false;awakeningRemaining=0;wavePeak={hero:0,companion:0};
 bossDepth=4; bossPrevDepth=4; bossTicks=0; melee:Melee|null=null; private attackId=0; damageTotals={hero:{melee:0,wave:0},archer:0,companions:{} as Record<string,{melee:number;wave:number}>};
 bossHP: number; bossClock = 0; bossIndex = 0; bossReady: number;
 arrows: Arrow[] = []; warnings: Warning[] = []; feedback: Feedback[] = []; usedRows = new Set<number>();
 obstacles: Obstacle[]; cause = ''; fireClock = 0; accumulator = 0; private warningId = 0; private projectileId = 0; simulationTick = 0;
 constructor(public level: Level,loadout:RunLoadout={}) {this.appearance=loadout.appearance??0;this.weapon=loadout.weapon??'spear';this.companion=companionFor(level.bossId,loadout.companion); this.count = level.start; this.bossHP = level.bossHP; this.bossReady = level.bossDelay; this.obstacles = level.obstacles.map(o => ({ ...o, attack:o.attack ? {...o.attack} : undefined })); }
 get heroGeometry(){return this.melee?nearGeometry(this.x,this.z,{...this.melee,tick:this.melee.poseTick??0},this.appearance):null;}
 get companionGeometry(){return this.companionAttack?nearGeometry(this.x,this.z,{...this.companionAttack,tick:this.companionAttack.poseTick??0},this.appearance):null;}
 get finished() { return this.phase === 'won' || this.phase === 'lost'; }
 get visibleCount() { return Math.min(48, this.count); }
 get companionActive(){return !!this.companion&&this.count>=2;}
 get archerCount() { return Math.max(0,this.count-1-(this.companionActive?1:0)); }
 get damage() { return this.archerCount * 0.2; }
 get bossWarning() { return this.warnings.find(w=>w.source==='boss') || null; }
 move(x: number) { if (Number.isFinite(x)) this.target = clamp(x, -0.91, 0.91); }
 cancelMove() { this.target = this.x; }
 pause() { this.paused = true; this.accumulator = 0; this.cancelMove(); }
 resume() { this.paused = false; this.accumulator = 0; }
 dispose() { this.clearCombat();this.awakeningUsed=false;this.upgradeRewards.clear();this.tier=1;this.melee=null; this.arrows.length=0; this.warnings.length=0; this.feedback.length=0; this.cancelMove(); }
 advance(dt: number) {
  if (this.paused || this.finished || !Number.isFinite(dt)) return;
  this.accumulator += clamp(dt, 0, 0.25);
  while (this.accumulator + 1e-9 >= STEP) { this.accumulator -= STEP; this.tick(); if (this.finished) { this.accumulator = 0; break; } }
 }
 choose(row: Row) {
  if (this.usedRows.has(row.id)) return;
  if (this.finished) return;
  this.usedRows.add(row.id);
  const side = this.x < 0 ? 'left' : 'right';
  const guard = this.obstacles.find(o=>o.rowId===row.id && o.side===side && !o.dead && !o.resolved);
  if (guard) this.hurt(guard.loss,'木障未清除');
  for (const o of this.obstacles) if(o.rowId===row.id) o.resolved=true;
  if (this.finished) return;
  const gate = row[side], before = this.count;
  this.count = clamp(gate.kind === 'add' ? this.count + gate.value : this.count * 2, 0, 256);
  this.emit({kind:'gather', x:this.x, amount:this.count-before,targetId:'team',worldZ:this.z,sourceId:row.id});
 }
 hurt(loss: number, cause: string) {
  if (this.finished) return;
  const actual = Math.min(this.count,Math.max(0,loss));
  this.count -= actual; this.emit({kind:'hurt', x:this.x, amount:actual,targetId:'team',worldZ:this.z});
  this.cause = `${cause}，损失${actual}人${this.count===0?'，队伍归零':''}`;
  if (!this.count) { this.phase = 'lost'; this.clearCombat(); }
 }
 private warn(source:number|'boss',a:Attack) {
  // Last .2s of the telegraph is the released arrow/spear. After release, killing
  // the archer no longer cancels it; strike still occurs at the advertised time.
  const flight=Math.min(a.weaponId==='great_axe'?.32:a.weaponId==='throwing_fork'?.28:.2,a.telegraphSeconds/2);
  this.warnings.push({weaponId:a.weaponId??'bow',profile:a.profile??'arrow',id:++this.warningId,source,x:a.kind==='aimed'?this.x:a.x??0,width:a.halfWidth,loss:a.loss,remaining:a.telegraphSeconds,duration:a.telegraphSeconds,flight,impact:a.impactSeconds,stage:'charge',hit:false});
  this.emit({kind:'warn',x:this.warnings[this.warnings.length-1].x,amount:a.loss,sourceId:source,worldZ:source==='boss'?this.z+this.bossDepth:this.obstacles.find(o=>o.id===source)?.at});
 }
 private projectiles(previousZ:number) {
  this.fireClock -= STEP;
  if (this.fireClock <= 0) { this.fireClock += .25; if(this.archerCount>0){ const a={id:++this.projectileId,x:this.x,z:this.z+.35,damage:this.damage};this.arrows.push(a);// Read-only presentation snapshot; never feeds targeting, collision or damage.
   const target=this.phase==='run'?this.obstacles.filter(o=>!o.dead&&!o.resolved&&o.at>=a.z&&o.at-this.z<=HORIZON&&(o.side?(o.side==='left'?a.x<0:a.x>=0):Math.abs(a.x-o.x)<=o.width)).sort((u,v)=>u.at-v.at||u.id-v.id)[0]:undefined;
   const boss=this.phase==='boss'&&Math.abs(a.x)<=BOSS_TARGET.halfWidth;
   this.emit({kind:'shot',x:a.x,amount:a.damage,worldZ:a.z,sourceId:'team',projectileId:a.id,volley:Object.freeze({count:this.count,totalCount:this.count,archerCount:this.archerCount,companion:this.companionActive,tick:this.simulationTick,x:this.x,worldZ:a.z,aimZ:target?.at??(this.z+(boss?this.bossDepth:HORIZON)),height:boss?85:target?.kind==='wood'?30:target?.kind==='rock'?35:target?48:45})}); }}
  for (const a of this.arrows) {
   const prev=a.z; a.z += STEP*9;
   // Sort actual intersections: array order is never a targeting rule.
   const hits=this.obstacles.filter(o=>!o.dead&&!o.resolved&&o.at>previousZ&&o.at-this.z<=HORIZON&&prev<o.at&&a.z>=o.at&&(o.side ? (o.side==='left'?a.x<0:a.x>=0) : Math.abs(a.x-o.x)<=o.width)).sort((u,v)=>u.at-v.at||u.id-v.id);
   const o=hits[0];
   if (o && this.phase==='run') {
    a.z=Infinity;
    if(o.kind!=='rock') { const actual=Math.min(o.hp,a.damage);o.hp-=actual;this.damageTotals.archer+=actual;this.emit({kind:'hit',x:a.x,amount:actual,targetId:o.id,worldZ:o.at,projectileId:a.id,sourceId:'team'});if(o.hp===0){o.dead=true;this.rewardKill(o.id);this.emit({kind:'break',x:o.x,amount:0,targetId:o.id,worldZ:o.at,projectileId:a.id,sourceId:'team'});} }
   } else if(this.phase==='boss' && prev<=this.z+this.bossPrevDepth && a.z>=this.z+this.bossDepth && Math.abs(a.x)<=BOSS_TARGET.halfWidth) {
    const actual=Math.min(this.bossHP,a.damage);this.bossHP-=actual;this.damageTotals.archer+=actual;a.z=Infinity;this.emit({kind:'hit',x:a.x,amount:actual,targetId:'boss',worldZ:this.z+this.bossDepth,projectileId:a.id,sourceId:'team'});
   }
  }
  this.arrows=this.arrows.filter(a=>a.z<this.z+HORIZON);
 }
 private clearCombat(){this.melee=null;this.companionAttack=null;this.waves=[];this.arrows=[];this.warnings=[];this.awakeningRemaining=0;}
 private rewardKill(id:number){if(this.level.eliteIds?.indexOf(id)===-1||!this.level.eliteIds||this.upgradeRewards.has(id))return;this.upgradeRewards.add(id);this.tier=Math.min(3,1+this.upgradeRewards.size);this.emit({kind:'upgrade',x:this.obstacles.find(o=>o.id===id)?.x??this.x,amount:this.tier,targetId:id,worldZ:this.obstacles.find(o=>o.id===id)?.at??this.z,sourceId:'hero'});}
 private bossHit(){if(this.tier===3&&!this.awakeningUsed){this.awakeningUsed=true;this.awakeningRemaining=6;this.emit({kind:'awaken',x:this.x,amount:6,worldZ:this.z,sourceId:'hero'});}}
 private candidates(x:number,width:number,from:number,to:number){
  if(this.phase==='boss')return this.bossHP>0&&this.z+this.bossDepth>=from&&this.z+this.bossDepth<=to&&Math.abs(x)<=BOSS_TARGET.halfWidth+width?[{id:'boss' as const,z:this.z+this.bossDepth,kind:'boss'}]:[];
  return this.obstacles.filter(o=>!o.dead&&!o.resolved&&o.at>=from&&o.at<=to&&(o.side?(o.side==='left'?x-width<0:x+width>=0):Math.abs(x-o.x)<=o.width+width)).sort((a,b)=>a.at-b.at||a.id-b.id).map(o=>({id:o.id,z:o.at,kind:o.kind}));
 }
 private newAttack(source:'hero'|CompanionId):AttackInstance{
  const weapon=source==='hero'?this.weapon:CAST[source].weapon,cycle=source==='hero'?WEAPONS[weapon].cycle:CAST[source].companionCycle;
  // Ally sustained DPS = 20% of the same-tier hero, adjusted for its own cadence.
  const factor=source==='hero'?1:.2*cycle/WEAPONS[this.weapon].cycle;
  return{id:++this.attackId,sourceId:source,weaponId:weapon,tier:this.tier,damage:HERO_BASE_DAMAGE*TIER_FACTORS[this.tier-1]*factor*(source==='hero'&&this.awakeningRemaining>0?1.25:1),direction:this.x,startedTick:this.simulationTick,tick:0,phase:'windup',spent:false,hitTargetIds:[],budget:this.tier===3?2:1,released:false,cycle};
 }
 /** A single ledger is shared by near contact and the traveling weapon wave. */
 private attackHit(a:AttackInstance,target:{id:number|'boss';z:number;kind:string;contact?:{x:number;height:number}|null},near:boolean){
  if(target.kind==='rock'){a.spent=true;a.budget=0;return true;}
  if(a.hitTargetIds.indexOf(target.id)>=0)return false;
  if(a.budget<=0)return true;
  const o=target.id==='boss'?null:this.obstacles.find(o=>o.id===target.id)!;
  const before=o?o.hp:this.bossHP,damage=Math.min(before,a.damage);a.hitTargetIds.push(target.id);a.budget--;
  if(o){o.hp=Math.max(0,o.hp-damage);if(o.hp===0){o.dead=true;this.rewardKill(o.id);}}else{this.bossHP=Math.max(0,this.bossHP-damage);if(a.sourceId==='hero')this.bossHit();}
  const bucket=a.sourceId==='hero'?this.damageTotals.hero:(this.damageTotals.companions[a.sourceId]??(this.damageTotals.companions[a.sourceId]={melee:0,wave:0}));bucket[near?'melee':'wave']+=damage;
  this.emit({kind:near?'meleeHit':'waveHit',x:target.contact?.x??(near?actorAnchor(this.x,this.z,a,a.sourceId).x:a.direction),amount:damage,targetId:target.id,worldZ:target.z,hitHeight:target.contact?.height,sourceId:a.sourceId,weaponId:a.weaponId,attackId:a.id});
  if(o?.dead)this.emit({kind:'break',x:o.x,amount:0,targetId:o.id,worldZ:o.at,sourceId:a.sourceId,weaponId:a.weaponId,attackId:a.id});
  const stop=a.budget===0||(o?.kind==='wood'&&!o.dead);if(stop){a.spent=true;a.budget=0;}return stop;
 }
 private attackStep(a:AttackInstance){
  a.poseTick=a.tick;
  const spec=WEAPONS[a.weaponId],width=spec.halfWidth*TIER_WIDTHS[a.tier-1];
  if(a.tick===0)this.emit({kind:'meleeStart',x:this.x,amount:0,worldZ:this.z,sourceId:a.sourceId,weaponId:a.weaponId,attackId:a.id});
  if(a.tick===spec.windup){a.phase='active';this.emit({kind:'meleeActive',x:this.x,amount:0,worldZ:this.z,sourceId:a.sourceId,weaponId:a.weaponId,attackId:a.id});}
  if(a.tick===spec.windup+spec.active)a.phase='recovery';
  if(a.phase==='active'){
   const geo=nearGeometry(this.x,this.z,a,this.appearance),sx=geo.anchor.x,sz=geo.anchor.z;
   const previous=nearGeometry(this.x,this.z,{...a,tick:Math.max(spec.windup,a.tick-1)},this.appearance);
   const near=this.candidates(sx,geo.halfWidth,geo.from,geo.to).filter(t=>a.hitTargetIds.indexOf(t.id)<0).map(t=>{const o=t.id==='boss'?null:this.obstacles.find(o=>o.id===t.id)!;return{...t,contact:contactSurface(geo,previous,{x:o?.x??0,z:t.z,halfWidth:o?(o.side?.length?.5:o.width):BOSS_TARGET.halfWidth,height:t.kind==='boss'?220:t.kind==='wood'?100:t.kind==='rock'?85:98},this.z)};}).find(t=>t.contact||t.kind==='rock');
   if(near&&!a.spent)this.attackHit(a,near,true);
   if(!a.released&&a.tick>=spec.windup+Math.floor(spec.active/2)){a.released=true;if(!a.spent){const z=this.z+(geo.tip.y+270-48)/(104-48*.065),scale=Math.max(.5,Math.min(1.04,1-(z-this.z)*.065)),x=geo.tip.x/(260*scale);this.waves.push({id:a.id,attack:a,x,originX:x,z,previousZ:sz,originZ:z,life:0,halfWidth:spec.waveWidth*TIER_WIDTHS[a.tier-1],speed:spec.speed,range:spec.range,stopped:false});}}
  }
  a.tick++;if(a.tick>=a.cycle){this.emit({kind:'meleeEnd',x:this.x,amount:0,worldZ:this.z,sourceId:a.sourceId,weaponId:a.weaponId,attackId:a.id});return null;}return a;
 }
 private strike(){
  if(this.count<1||this.finished)return;
  if(!this.melee)this.melee=this.newAttack('hero');this.melee=this.attackStep(this.melee);
  if(this.companionActive){if(!this.companionAttack)this.companionAttack=this.newAttack(this.companion!);this.companionAttack=this.attackStep(this.companionAttack);}else this.companionAttack=null;
 }
 private weaponWaves(){
  for(const w of this.waves){if(w.stopped||w.attack.spent){w.stopped=true;continue;}w.previousZ=w.life===0?w.previousZ:w.z;w.z+=w.speed*STEP;w.life+=STEP;w.x=w.originX+(w.attack.direction-w.originX)*Math.min(1,(w.z-w.originZ)/1.2);
   let targets=this.candidates(w.x,w.halfWidth,w.previousZ,w.z);
   if(this.phase==='boss'&&this.bossHP>0&&w.previousZ<=this.z+this.bossPrevDepth&&w.z>=this.z+this.bossDepth&&Math.abs(w.x)<=BOSS_TARGET.halfWidth+w.halfWidth)targets=[{id:'boss',z:this.z+this.bossDepth,kind:'boss'}];
   for(const t of targets){if(this.attackHit(w.attack,t,false)){w.stopped=true;w.z=t.z;break;}}
   if(w.z-w.originZ>=w.range)w.stopped=true;
  }
  this.waves=this.waves.filter(w=>!w.stopped);
  this.wavePeak.hero=Math.max(this.wavePeak.hero,this.waves.filter(w=>w.attack.sourceId==='hero').length);this.wavePeak.companion=Math.max(this.wavePeak.companion,this.waves.filter(w=>w.attack.sourceId!=='hero').length);
 }
 private tick() {
  this.simulationTick++; this.elapsed += STEP; this.x += clamp(this.target-this.x,-STEP*2.7,STEP*2.7);
  const previous=this.z;
  if(this.phase==='run') this.z=Math.min(this.level.duration,this.z+STEP);
  if(this.awakeningRemaining>0)this.awakeningRemaining=Math.max(0,this.awakeningRemaining-STEP);
  if(this.phase==='boss'){this.bossPrevDepth=this.bossDepth;this.bossTicks++;this.bossDepth=bossContactDepth(this.bossTicks,this.bossClock,this.bossIndex,this.bossWarning);}
  // Movement, moving boss, arrows, melee, terminal, contacts, hostile impacts.
  this.projectiles(previous);
  this.strike();
  this.weaponWaves();
  if(this.phase==='boss' && this.bossHP<=0){this.phase='won';this.clearCombat();return;}
  if(this.phase==='run') {
   for(const row of this.level.rows) if(previous<row.at&&this.z>=row.at){this.choose(row);if(this.finished)return;}
   for(const o of this.obstacles) {
    if(o.dead||o.resolved||o.rowId!==undefined)continue;
    if(o.attack&&!o.attackStarted&&this.z>=o.attack.startAt&&o.at-this.z<=HORIZON&&o.at>this.z){o.attackStarted=true;this.warn(o.id,o.attack);}
    if(previous<o.at&&this.z>=o.at){o.resolved=true;if(Math.abs(this.x-o.x)<=o.width)this.hurt(o.loss,o.kind==='rock'?'撞上山石':o.kind==='wood'?'木障未清除':'撞上敌兵');}
    if(this.finished)return;
   }
   if(this.z>=this.level.duration){this.phase='boss';this.melee=null;this.companionAttack=null;this.waves=[];this.arrows.length=0;this.warnings.length=0;this.bossClock=0;this.bossTicks=0;this.bossDepth=this.bossPrevDepth=4;}
  } else if(this.phase==='boss') {
   this.bossClock+=STEP;
   if(!this.bossWarning&&this.bossClock+1e-9>=this.bossReady){const a=this.level.bossAttacks[this.bossIndex%this.level.bossAttacks.length];this.warn('boss',a);this.bossReady=a.recoverySeconds;this.bossIndex++;this.bossClock=0;}
  }
  for(const w of this.warnings) {
   const source=w.source==='boss'?undefined:this.obstacles.find(o=>o.id===w.source);
   if(w.stage==='charge'&&source&&(source.dead||source.resolved)){w.remaining=-Infinity;continue;}
   w.remaining-=STEP;
   if(w.remaining<=w.flight&&w.stage==='charge'){
    w.stage='flight';w.originX=w.source==='boss'?0:source?.x??0;w.originZ=w.source==='boss'?this.z+this.bossDepth:source?.at??this.z+1;
    w.projectileX=w.originX;w.projectileZ=w.originZ;w.previousZ=w.originZ;
   }
   if(w.stage==='flight'&&!w.hit){
    // Actual attack front advances through world space; damage occurs only when
    // the swept shape reaches the team's cross-section, never on a red timer.
    w.previousZ=w.projectileZ??this.z+1;const q=clamp(1-w.remaining/w.flight,0,1);
    w.projectileX=(w.originX??0)*(1-q)+w.x*q;w.projectileZ=(w.originZ??this.z+1)*(1-q)+this.z*q;
    if(w.projectileZ<=this.z+1e-8){w.hit=true;w.stage='impact';if(Math.abs(this.x-w.projectileX)<=w.width)this.hurt(w.loss,`被${WEAPONS[w.weaponId??'bow'].label}击中`);if(this.finished)return;}
   }
   if(w.source==='boss')this.bossClock=0;
  }
  this.warnings=this.warnings.filter(w=>w.remaining>-w.impact);
 }
 private emit(e:Feedback) { this.feedback.push(Object.freeze({...e,simulationTick:this.simulationTick})); }
 drainFeedback() { const events = this.feedback; this.feedback = []; return events; }
}
