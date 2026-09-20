/** Fixed-step combat. x is lateral; z is travel seconds. Decoration never participates. */
export type Phase = 'run' | 'boss' | 'won' | 'lost';
export type Gate = { kind: 'add' | 'double'; value: number };
export type Row = { id: number; at: number; left: Gate; right: Gate };
export type Attack = { kind: 'aimed' | 'fixed'; x?: number; telegraphSeconds: number; halfWidth: number; loss: number; impactSeconds: number; recoverySeconds: number };
export type Obstacle = { id: number; at: number; x: number; width: number; kind: 'wood' | 'rock' | 'fighter' | 'crossbowman'; hp: number; loss: number; rowId?: number; side?: 'left' | 'right'; dead?: boolean; resolved?: boolean; attack?: Attack & {startAt:number}; attackStarted?: boolean };
export type Level = { id: string; title: string; scene: string; rankBefore: string; rankAfter: string; duration: number; start: number; bossHP: number; bossName: string; bossDelay: number; bossAttacks: Attack[]; rows: Row[]; obstacles: Obstacle[]; opening: string; ending: string };
export type Arrow = { x: number; z: number; damage: number; readonly id?: number };
export type Warning = { id: number; source: number | 'boss'; x: number; width: number; loss: number; remaining: number; duration: number; flight: number; impact: number; stage: 'charge' | 'flight' | 'impact'; hit: boolean };
export type Feedback = Readonly<{ kind: 'shot' | 'gather' | 'hit' | 'break' | 'hurt' | 'warn'; x: number; amount: number; targetId?: number | 'boss' | 'team'; worldZ?: number; simulationTick?: number; projectileId?: number; sourceId?: number | 'boss' | 'team'; volley?: Readonly<{count:number; aimZ:number; height:number}> }>;
/** Shared collision contract; renderers read this, never approximate it. */
export const BOSS_TARGET = Object.freeze({ halfWidth: .42, depth: 4 });
export const STEP = 1 / 60;
export const HORIZON = 7;
export const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
export class Journey {
 phase: Phase = 'run'; count: number; x = 0; target = 0; z = 0; elapsed = 0; paused = false;
 bossHP: number; bossClock = 0; bossIndex = 0; bossReady: number;
 arrows: Arrow[] = []; warnings: Warning[] = []; feedback: Feedback[] = []; usedRows = new Set<number>();
 obstacles: Obstacle[]; cause = ''; fireClock = 0; accumulator = 0; private warningId = 0; private projectileId = 0; simulationTick = 0;
 constructor(public level: Level) { this.count = level.start; this.bossHP = level.bossHP; this.bossReady = level.bossDelay; this.obstacles = level.obstacles.map(o => ({ ...o, attack:o.attack ? {...o.attack} : undefined })); }
 get finished() { return this.phase === 'won' || this.phase === 'lost'; }
 get visibleCount() { return Math.min(48, this.count); }
 get damage() { return this.count * 0.2; }
 get bossWarning() { return this.warnings.find(w=>w.source==='boss') || null; }
 move(x: number) { if (Number.isFinite(x)) this.target = clamp(x, -0.91, 0.91); }
 cancelMove() { this.target = this.x; }
 pause() { this.paused = true; this.accumulator = 0; this.cancelMove(); }
 resume() { this.paused = false; this.accumulator = 0; }
 dispose() { this.arrows.length=0; this.warnings.length=0; this.feedback.length=0; this.cancelMove(); }
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
  if (!this.count) { this.phase = 'lost'; this.arrows.length=0; this.warnings.length=0; }
 }
 private warn(source:number|'boss',a:Attack) {
  // Last .2s of the telegraph is the released arrow/spear. After release, killing
  // the archer no longer cancels it; strike still occurs at the advertised time.
  const flight=Math.min(.2,a.telegraphSeconds/2);
  this.warnings.push({id:++this.warningId,source,x:a.kind==='aimed'?this.x:a.x??0,width:a.halfWidth,loss:a.loss,remaining:a.telegraphSeconds,duration:a.telegraphSeconds,flight,impact:a.impactSeconds,stage:'charge',hit:false});
  this.emit({kind:'warn',x:this.warnings[this.warnings.length-1].x,amount:a.loss,sourceId:source,worldZ:source==='boss'?this.z+BOSS_TARGET.depth:this.obstacles.find(o=>o.id===source)?.at});
 }
 private projectiles(previousZ:number) {
  this.fireClock -= STEP;
  if (this.fireClock <= 0) { this.fireClock += .25; const a={id:++this.projectileId,x:this.x,z:this.z+.35,damage:this.damage};this.arrows.push(a);// Read-only presentation snapshot; never feeds targeting, collision or damage.
   const target=this.phase==='run'?this.obstacles.filter(o=>!o.dead&&!o.resolved&&o.at>=a.z&&o.at-this.z<=HORIZON&&(o.side?(o.side==='left'?a.x<0:a.x>=0):Math.abs(a.x-o.x)<=o.width)).sort((u,v)=>u.at-v.at||u.id-v.id)[0]:undefined;
   const boss=this.phase==='boss'&&Math.abs(a.x)<=BOSS_TARGET.halfWidth;
   this.emit({kind:'shot',x:a.x,amount:a.damage,worldZ:a.z,sourceId:'team',projectileId:a.id,volley:Object.freeze({count:this.count,aimZ:target?.at??(this.z+(boss?BOSS_TARGET.depth:HORIZON)),height:boss?85:target?.kind==='wood'?30:target?.kind==='rock'?35:target?48:45})}); }
  for (const a of this.arrows) {
   const prev=a.z; a.z += STEP*9;
   // Sort actual intersections: array order is never a targeting rule.
   const hits=this.obstacles.filter(o=>!o.dead&&!o.resolved&&o.at>previousZ&&o.at-this.z<=HORIZON&&prev<o.at&&a.z>=o.at&&(o.side ? (o.side==='left'?a.x<0:a.x>=0) : Math.abs(a.x-o.x)<=o.width)).sort((u,v)=>u.at-v.at||u.id-v.id);
   const o=hits[0];
   if (o && this.phase==='run') {
    a.z=Infinity;
    if(o.kind!=='rock') { o.hp=Math.max(0,o.hp-a.damage);this.emit({kind:'hit',x:a.x,amount:0,targetId:o.id,worldZ:o.at,projectileId:a.id,sourceId:'team'});if(o.hp===0){o.dead=true;this.emit({kind:'break',x:o.x,amount:0,targetId:o.id,worldZ:o.at,projectileId:a.id,sourceId:'team'});} }
   } else if(this.phase==='boss' && prev<this.z+BOSS_TARGET.depth && a.z>=this.z+BOSS_TARGET.depth && Math.abs(a.x)<=BOSS_TARGET.halfWidth) {
    this.bossHP=Math.max(0,this.bossHP-a.damage);a.z=Infinity;this.emit({kind:'hit',x:a.x,amount:0,targetId:'boss',worldZ:this.z+BOSS_TARGET.depth,projectileId:a.id,sourceId:'team'});
   }
  }
  this.arrows=this.arrows.filter(a=>a.z<this.z+HORIZON);
 }
 private tick() {
  this.simulationTick++; this.elapsed += STEP; this.x += clamp(this.target-this.x,-STEP*2.7,STEP*2.7);
  const previous=this.z;
  if(this.phase==='run') this.z=Math.min(this.level.duration,this.z+STEP);
  // Within a step: player arrows -> kills/cancel -> contact/row -> hostile impact.
  this.projectiles(previous);
  if(this.phase==='boss' && this.bossHP<=0){this.phase='won';this.arrows.length=0;this.warnings.length=0;return;}
  if(this.phase==='run') {
   for(const row of this.level.rows) if(previous<row.at&&this.z>=row.at){this.choose(row);if(this.finished)return;}
   for(const o of this.obstacles) {
    if(o.dead||o.resolved||o.rowId!==undefined)continue;
    if(o.attack&&!o.attackStarted&&this.z>=o.attack.startAt&&o.at-this.z<=HORIZON&&o.at>this.z){o.attackStarted=true;this.warn(o.id,o.attack);}
    if(previous<o.at&&this.z>=o.at){o.resolved=true;if(Math.abs(this.x-o.x)<=o.width)this.hurt(o.loss,o.kind==='rock'?'撞上山石':o.kind==='wood'?'木障未清除':'撞上敌兵');}
    if(this.finished)return;
   }
   if(this.z>=this.level.duration){this.phase='boss';this.arrows.length=0;this.warnings.length=0;this.bossClock=0;}
  } else if(this.phase==='boss') {
   this.bossClock+=STEP;
   if(!this.bossWarning&&this.bossClock+1e-9>=this.bossReady){const a=this.level.bossAttacks[this.bossIndex%this.level.bossAttacks.length];this.warn('boss',a);this.bossReady=a.recoverySeconds;this.bossIndex++;this.bossClock=0;}
  }
  for(const w of this.warnings) {
   const source=w.source==='boss'?undefined:this.obstacles.find(o=>o.id===w.source);
   if(w.stage==='charge'&&source&&(source.dead||source.resolved)){w.remaining=-Infinity;continue;}
   w.remaining-=STEP;
   if(w.remaining<=w.flight&&w.stage==='charge')w.stage='flight';
   if(w.remaining<=1e-9&&!w.hit){w.hit=true;w.stage='impact';if(Math.abs(this.x-w.x)<=w.width)this.hurt(w.loss,w.source==='boss'?`被${this.level.bossName==='投矛头目'?'投矛':'弩箭'}击中`:'被弩箭击中');if(this.finished)return;}
   if(w.source==='boss')this.bossClock=0;
  }
  this.warnings=this.warnings.filter(w=>w.remaining>-w.impact);
 }
 private emit(e:Feedback) { this.feedback.push(Object.freeze({...e,simulationTick:this.simulationTick})); }
 drainFeedback() { const events = this.feedback; this.feedback = []; return events; }
}
