/** Pure deterministic simulation. Coordinates: x [-1,1], forward measured in seconds. */
export type Phase = 'run' | 'boss' | 'won' | 'lost';
export type Gate = { kind: 'add' | 'double'; value: number };
export type Row = { id: number; at: number; left: Gate; right: Gate };
export type Obstacle = { id: number; at: number; x: number; width: number; kind: 'wood' | 'rock' | 'ink'; hp: number; loss: number; dead?: boolean; resolved?: boolean; warn?: number };
export type Level = { id: number; title: string; era: string; duration: number; start: number; bossHP: number; bossLoss: number; rows: Row[]; obstacles: Obstacle[]; intro: string[]; ending: string; clue: string; source: string; url: string };
export type Arrow = { x: number; z: number; damage: number };
export type Feedback = { kind: 'gather' | 'hit' | 'break' | 'hurt' | 'warn' | 'clue'; x: number; amount: number };
export const STEP = 1 / 60;
export const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
export class Journey {
  phase: Phase = 'run'; count: number; x = 0; target = 0; z = 0; elapsed = 0; paused = false;
  bossHP: number; bossClock = 0; bossWarning: { x: number; remaining: number } | null = null;
  arrows: Arrow[] = []; feedback: Feedback[] = []; usedRows = new Set<number>();
  obstacles: Obstacle[]; cause = ''; gainedClue = false; fireClock = 0; accumulator = 0;
  constructor(public level: Level) { this.count = level.start; this.bossHP = level.bossHP; this.obstacles = level.obstacles.map(o => ({ ...o })); }
  get finished() { return this.phase === 'won' || this.phase === 'lost'; }
  get visibleCount() { return Math.min(48, this.count); }
  get damage() { return this.count * 0.2; }
  move(x: number) { if (Number.isFinite(x)) this.target = clamp(x, -0.91, 0.91); }
  pause() { this.paused = true; this.accumulator = 0; }
  resume() { this.paused = false; this.accumulator = 0; }
  advance(dt: number) {
    if (this.paused || this.phase === 'won' || this.phase === 'lost') return;
    this.accumulator += clamp(dt, 0, 0.25);
    while (this.accumulator + 1e-9 >= STEP) { this.accumulator -= STEP; this.tick(); if (this.finished) { this.accumulator = 0; break; } }
  }
  choose(row: Row) {
    if (this.usedRows.has(row.id)) return;
    this.usedRows.add(row.id);
    const gate = this.x < 0 ? row.left : row.right;
    const before = this.count;
    this.count = clamp(gate.kind === 'add' ? this.count + gate.value : this.count * 2, 0, 256);
    this.feedback.push({kind:'gather', x:this.x, amount:this.count-before});
  }
  hurt(loss: number, cause: string) {
    this.count = Math.max(0, this.count - loss); this.feedback.push({kind:'hurt', x:this.x, amount:loss});
    if (!this.count) { this.phase = 'lost'; this.cause = cause; this.arrows.length = 0; }
  }
  private tick() {
    this.elapsed += STEP;
    this.x += clamp(this.target - this.x, -STEP * 2.7, STEP * 2.7);
    if (this.phase === 'run') {
      const previous = this.z; this.z = Math.min(this.level.duration, this.z + STEP);
      for (const row of this.level.rows) if (previous < row.at && this.z >= row.at) this.choose(row);
      if (!this.gainedClue && this.z >= this.level.duration * .52) { this.gainedClue = true; this.feedback.push({kind:'clue', x:0, amount:0}); }
      for (const o of this.obstacles) {
        if (o.dead || o.resolved) continue;
        if (o.kind === 'ink' && o.at - this.z < 2 && o.warn === undefined) { o.warn = 1.25; this.feedback.push({kind:'warn',x:o.x,amount:o.loss}); }
        if (o.warn !== undefined) {
          o.warn -= STEP;
          if (o.warn <= 0) { o.resolved = true; if (Math.abs(this.x-o.x) < o.width) this.hurt(o.loss,'未避开墨影预告'); }
        } else if (previous < o.at && this.z >= o.at) { o.resolved = true; if (Math.abs(this.x - o.x) < o.width) this.hurt(o.loss, o.kind === 'wood' ? '木栅未清除，撞击折损' : '撞上不可射毁的山石'); }
        if (this.count === 0) return;
      }
      if (this.z >= this.level.duration) { this.phase = 'boss'; this.arrows.length = 0; }
    }
    if (this.phase === 'boss') {
      this.bossClock += STEP;
      if (!this.bossWarning && this.bossClock >= 2.8) { this.bossWarning = {x:this.x, remaining:1.25}; this.bossClock = 0; this.feedback.push({kind:'warn',x:this.x,amount:this.level.bossLoss}); }
      if (this.bossWarning) {
        this.bossWarning.remaining -= STEP;
        if (this.bossWarning.remaining <= 0) { if (Math.abs(this.x - this.bossWarning.x) < .28) this.hurt(this.level.bossLoss, '未避开守关墨影的落墨'); this.bossWarning = null; }
      }
    }
    if (this.count === 0) return;
    this.fireClock -= STEP;
    if (this.fireClock <= 0) { this.fireClock += .25; this.arrows.push({x:this.x,z:this.z + .35,damage:this.damage}); }
    for (const a of this.arrows) {
      const prev = a.z; a.z += STEP * 9;
      if (this.phase === 'boss' && prev < this.z+4 && a.z >= this.z+4 && Math.abs(a.x) < .42) {
        this.bossHP = Math.max(0, this.bossHP - a.damage); a.z = Infinity; this.feedback.push({kind:'hit',x:0,amount:0});
      } else for (const o of this.obstacles) {
        if (o.dead || o.resolved || o.kind === 'ink' || o.at <= this.z) continue;
        if (prev < o.at && a.z >= o.at && Math.abs(a.x - o.x) < o.width) {
          a.z = Infinity;
          if (o.kind === 'wood') { o.hp -= a.damage; this.feedback.push({kind:'hit',x:o.x,amount:0}); if (o.hp <= 0) {o.dead = true; this.feedback.push({kind:'break',x:o.x,amount:0});} }
          break;
        }
      }
    }
    this.arrows = this.arrows.filter(a => a.z < this.z + 7);
    if (this.phase === 'boss' && this.bossHP <= 0) { this.phase = 'won'; this.arrows.length = 0; }
  }
  drainFeedback() { const events = this.feedback; this.feedback = []; return events; }
}
