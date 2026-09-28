/* 一路长歌：三国 · 战斗预览（仅战斗）。单位：pt（= CSS px，720 设计宽下 1pt = 2px）。
 * 世界坐标：x ∈ [-1,1] 为道路半宽；z 为主将前方距离（主将 z=0）。 */
'use strict';
(() => {
const M = window.MANIFEST;
const G = window.GEN_MANIFEST;
if (G) { Object.assign(M.sheets, G.sheets); Object.assign(M.frames, G.frames); }
const IMG = {};
const cv = document.getElementById('cv');
const cx2d = cv.getContext('2d');
let ctx = cx2d;

// ───────────────────────── 尺寸与分区 ─────────────────────────
const SIZES = {
  '360×640': {W: 360, H: 640, top: 20, bottom: 0, label: '360×640 小屏'},
  '390×844': {W: 390, H: 844, top: 47, bottom: 34, label: '390×844 基准'},
  '430×932': {W: 430, H: 932, top: 59, bottom: 34, label: '430×932 大屏'},
};
const TYPE = {caption: 12, body: 14, title: 16};           // 唯一字号阶
const NUM = {gateMin: 18, gateMax: 28, troop: 24, delta: 20}; // 数字（BMFont 规格）
const ALLOWED = {crateName: [12], ui: [12, 14, 16], gate: 'range', troop: [24], delta: [20], debug: [12]};
const FONT = '"PingFang SC","Source Han Sans SC","Noto Sans SC",sans-serif';
const SERIF = '"Source Han Serif SC","Songti SC","STSong",serif';
const NUMF = '"Avenir Next Condensed","DIN Condensed","Arial Narrow",sans-serif';
let L = null; // 当前布局

function layout(sz) {
  const {W, H, top, bottom} = sz;
  const T = top + 4;
  const row1 = {x: 0, y: T, w: W, h: 36};
  const row2 = {x: 0, y: T + 42, w: W, h: 40};
  const hudBottom = T + 82;
  const P0 = hudBottom + 8;
  const z4y = H - bottom - 48;
  const ph = z4y - P0;
  const Z1 = [P0, P0 + ph * .22], Z2 = [Z1[1], Z1[1] + ph * .40], Z3 = [Z2[1], z4y], Z4 = [z4y, H];
  const heroY = Z3[0] + (Z3[1] - Z3[0]) * .5;
  const hy = T - 6;                         // 视平线藏在 HUD 之后
  const Z23 = 6;                            // Z2/Z3 分界对应世界距离
  const a = (Z3[0] - hy) / (heroY - hy);
  const c = Z23 * a / (1 - a);
  const ppu = W * .40;                      // 主将所在深度：1 世界单位 = 0.4W
  const zAt = y => c * (heroY - hy) / (y - hy) - c;
  return {W, H, top, bottom, T, row1, row2, hudBottom, P0, Z1, Z2, Z3, Z4, heroY, hy, c, ppu, cx: W / 2,
    zZ12: zAt(Z1[1]), zP0: zAt(P0), zAt, capsule: {x: W - 7 - 87, y: top + 4 + 2, w: 87, h: 32}};
}
function proj(x, z) { const s = L.c / (z + L.c); return {x: L.cx + x * L.ppu * s, y: L.hy + (L.heroY - L.hy) * s, s}; }
function zoneOf(y) { return y < L.Z1[1] ? 1 : y < L.Z2[1] ? 2 : y < L.Z3[1] ? 3 : 4; }

// ───────────────────────── 素材 ─────────────────────────
function loadAll() {
  return Promise.all(Object.entries(M.sheets).map(([k, p]) => new Promise(res => {
    const im = new Image(); im.onload = () => { IMG[k] = im; res(); }; im.onerror = () => res(); im.src = p;
  })));
}
const has = k => !!(k && M.frames[k] && IMG[M.frames[k].s]);
const pick = (...ks) => ks.find(has) || null;
const USED = new Map(); // 逻辑名 → {key, gen}
function use(logical, ...ks) { const k = pick(...ks); USED.set(logical, {key: k, gen: !!(k && k.startsWith('g_')), want: ks[0]}); return k; }

function drawFrame(k, x, y, h, o = {}) {
  const f = M.frames[k]; if (!f) return null; const im = IMG[f.s]; if (!im) return null;
  const [sx, sy, sw, sh] = f.r; const refH = o.refH || sh; const sc = h / refH;
  const w = sw * sc, hh = sh * sc;
  const ax = f.a[0], ay = f.a[1];
  ctx.save();
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  if (o.flip) ctx.scale(-1, 1);
  if (o.sy) ctx.scale(1, o.sy);
  if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  if (o.comp) ctx.globalCompositeOperation = o.comp;
  const src = o.tint ? tinted(k, o.tint) : im;
  const ox = o.tint ? 0 : sx, oy = o.tint ? 0 : sy;
  const cxo = o.center ? w / 2 : ax * w, cyo = o.center ? hh / 2 : hh * (1 - ay);
  ctx.drawImage(src, ox, oy, sw, sh, -cxo, -cyo, w, hh);
  ctx.restore();
  return {x: x - cxo, y: y - cyo, w, h: hh};
}
const TINT = {};
function tinted(k, color) {
  const id = k + color; if (TINT[id]) return TINT[id];
  const f = M.frames[k], im = IMG[f.s], [sx, sy, sw, sh] = f.r;
  const c = document.createElement('canvas'); c.width = sw; c.height = sh;
  const g = c.getContext('2d'); g.drawImage(im, sx, sy, sw, sh, 0, 0, sw, sh);
  g.globalCompositeOperation = 'source-atop'; g.fillStyle = color; g.fillRect(0, 0, sw, sh);
  return TINT[id] = c;
}

// ───────────────────────── 文字（统一入口，供字号自检） ─────────────────────────
let TXT = [];
function text(str, x, y, size, o = {}) {
  const kind = o.kind || 'ui';
  ctx.save();
  ctx.font = `${o.weight || 600} ${size}px ${o.family || FONT}`;
  ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'middle';
  const w = ctx.measureText(str).width;
  if (o.stroke) { ctx.lineJoin = 'round'; ctx.strokeStyle = o.stroke; ctx.lineWidth = o.strokeW || 3; ctx.strokeText(str, x, y); }
  if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowOffsetY = 1; ctx.shadowBlur = 0; }
  ctx.fillStyle = o.color || '#F5EFE2'; ctx.fillText(str, x, y);
  ctx.restore();
  const bx = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
  const r = {str, size, kind, x: bx, y: y - size / 2, w, h: size, layer: o.layer || 'L7'};
  TXT.push(r); return r;
}
function vtext(str, x, y, size, o = {}) { // 竖排
  const rs = []; for (let i = 0; i < str.length; i++) rs.push(text(str[i], x, y + i * (size + 2), size, {...o, align: 'center'}));
  return rs;
}

// ───────────────────────── 随机数 ─────────────────────────
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// ───────────────────────── 兵器 ─────────────────────────
const WEAPONS = {
  spear:   {label: '长枪',  res: null,   tier: 2, cycle: .62, wind: .14, rel: .10, rec: .22, color: '#DDE6F0'},
  guandao: {label: '偃月刀', res: '关羽', tier: 2, cycle: 1.08, wind: .36, rel: .12, rec: .34, color: '#9FE0B8'},
  shemao:  {label: '蛇矛',  res: '张飞', tier: 2, cycle: .56, wind: .10, rel: .20, rec: .16, color: '#F0D38A'},
  huaji:   {label: '画戟',  res: '吕布', tier: 2, cycle: .86, wind: .22, rel: .14, rec: .26, color: '#F2A57A'},
};
const WORDER = ['spear', 'guandao', 'shemao', 'huaji'];
const GEN_BODY = .80; // 生成表整帧含高举兵器，躯干约占 80%
function heroFrames(w) {
  const base = {
    spear:   {run: [use('主将·长枪·跑1', 'heroSpearWalk0'), use('主将·长枪·跑2', 'heroSpearWalk1')], wind: use('主将·长枪·蓄势', 'f2_spearWindup'), rel: use('主将·长枪·出招', 'f2_spearRelease'), rec: use('主将·长枪·收势', 'f2_spearRecover'), refKey: 'heroSpearWalk0', ref: k => k.startsWith('f2_') ? 205 : 158},
    guandao: {run: [use('主将·偃月刀·跑', 'g_guandaoRun', 'heroBladeWalk0')], wind: use('主将·偃月刀·蓄势', 'g_guandaoWind', 'f2_bladeWindup'), rel: use('主将·偃月刀·出招', 'g_guandaoRel', 'f2_bladeRelease'), rec: use('主将·偃月刀·收势', 'g_guandaoRec', 'f2_bladeRecover'), refKey: pick('g_guandaoRun', 'heroBladeWalk0'), ref: k => k.startsWith('g_') ? 308 * GEN_BODY : k.startsWith('f2_') ? 205 : 165},
    shemao:  {run: [use('主将·蛇矛·跑', 'g_shemaoRun', 'heroSpearWalk0')], wind: use('主将·蛇矛·蓄势', 'g_shemaoWind', 'f2_spearWindup'), rel: use('主将·蛇矛·出招', 'g_shemaoRel', 'f2_spearRelease'), rec: use('主将·蛇矛·收势', 'g_shemaoRec', 'f2_spearRecover'), refKey: pick('g_shemaoRun', 'heroSpearWalk0'), ref: k => k.startsWith('g_') ? 310 * GEN_BODY : k.startsWith('f2_') ? 205 : 158},
    huaji:   {run: [use('主将·画戟·跑', 'g_huajiRun', 'heroSpearWalk0')], wind: use('主将·画戟·蓄势', 'g_huajiWind', 'f2_zhaoWindup'), rel: use('主将·画戟·出招', 'g_huajiRel', 'f2_zhaoRelease'), rec: use('主将·画戟·收势', 'g_huajiRec', 'f2_zhaoRecover'), refKey: pick('g_huajiRun', 'heroSpearWalk0'), ref: k => k.startsWith('g_') ? 314 * GEN_BODY : k.startsWith('f2_') ? 205 : 158},
  };
  return base[w];
}

// ───────────────────────── 世界状态 ─────────────────────────
let S = null;
const STATES = {normal: '正常战斗', dense: '密集连续门', general: '敌将交锋'};
const UNIT = {hero: .50, soldier: .37, companion: .44, general: .66, gateH: .98, crate: .40};

function newWorld(state) {
  seed = 7;
  S = {state, t: 0, dist: 0, speed: state === 'general' ? 0 : 11, heroX: -.45, targetX: -.45, weapon: S ? S.weapon : 'spear',
    atkT: 0, atkN: 0, troops: 36, troopShown: 36, deltas: [], ents: [], waves: [], fx: [], toasts: [], toast: null,
    shake: 0, redFlash: 0, hitStop: 0, courseLen: 0, nextSpawn: 0, boss: null, stage: '第三关 · 下邳', progress: .18,
    companions: [{id: 'zhao', dx: .30, t: .3}, {id: 'chen', dx: -.30, t: .9}], scen: [], wall: null, bumped: 0};
  buildCourse();
  if (state === 'general') setupGeneral();
  return S;
}

// 关卡片段（世界距离 d）
function buildCourse() {
  const c = [];
  const add = (d, e) => c.push({d, ...e});
  if (S.state === 'normal') {
    S.courseLen = 170;
    add(18, {type: 'squad', x: -.45, n: 5});
    add(36, {type: 'crate', x: -.5, kind: 'grain'}); add(36, {type: 'crate', x: .5, kind: 'weapon'});
    add(58, {type: 'gates', vals: [12, -8]});
    add(74, {type: 'wall', len: 26, side: 1});
    add(82, {type: 'squad', x: .5, n: 6});
    add(90, {type: 'crate', x: -.52, kind: 'treasure'});
    add(116, {type: 'gates', vals: [6, 0]});
    add(134, {type: 'squad', x: .45, n: 6});
    add(152, {type: 'crate', x: 0, kind: 'arrows'});
  } else if (S.state === 'dense') {
    S.courseLen = 120; S.progress = .52;
    const seq = [[8, -6], [0, 10], [-12, 4], [15, -4], [-3, 0], [6, -10]];
    seq.forEach((v, i) => add(14 + i * 9, {type: 'gates', vals: v}));
    add(72, {type: 'squad', x: 0, n: 7}); add(92, {type: 'crate', x: .5, kind: 'weapon'});
  }
  S.course = c.sort((a, b) => a.d - b.d); S.ci = 0; S.lap = 0;
}
const SPAWN_Z = () => Math.max(60, L.zP0 * .82);
function spawnCourse() {
  if (!S.course || !S.course.length) return;
  const ahead = S.dist + SPAWN_Z();
  while (true) {
    const e = S.course[S.ci]; const d = e.d + S.lap * S.courseLen;
    if (d > ahead) break;
    spawn(e, d);
    S.ci++; if (S.ci >= S.course.length) { S.ci = 0; S.lap++; }
  }
}
let EID = 1;
function spawn(e, d) {
  if (e.type === 'squad') {
    for (let i = 0; i < e.n; i++) S.ents.push({id: EID++, type: 'enemy', x: e.x + (i % 3 - 1) * .2 + (rnd() - .5) * .06, d: d + Math.floor(i / 3) * 1.1, hp: 1, walk: rnd(), dead: 0});
  } else if (e.type === 'crate') {
    const hp = {grain: 6, weapon: 10, arrows: 8, treasure: 14}[e.kind];
    S.ents.push({id: EID++, type: 'crate', kind: e.kind, x: e.x, d, hp, max: hp, open: 0, hitT: 0});
  } else if (e.type === 'gates') {
    e.vals.forEach((v, i) => S.ents.push({id: EID++, type: 'gate', x: i ? .5 : -.5, d, val: v, passed: false, flip: 0}));
  } else if (e.type === 'wall') {
    S.ents.push({id: EID++, type: 'wall', x: 0, d, len: e.len, side: e.side || 1});
  }
}
function setupGeneral() {
  S.stage = '第三关 · 下邳'; S.progress = 1;
  S.boss = {name: '吕布', weapon: '方天画戟', z: 17, hp: 100, trail: 100, phase: 'idle', pt: 0, band: [-1, 0], hit: 0, cycleN: 0, down: 0};
  S.minT = 1.5;
}

// ───────────────────────── 主循环 ─────────────────────────
const DT = 1 / 60;
let speedScale = 1, paused = false, showZones = false, companionsOn = true;
function step(dt) {
  if (S.hitStop > 0) { S.hitStop -= dt; return; }
  S.t += dt;
  // 移动
  S.heroX += (S.targetX - S.heroX) * Math.min(1, dt * 14);
  // 墙段夹持：固定墙占据半幅路面，经过期间只能走另一半
  const w = S.ents.find(e => e.type === 'wall' && e.d - S.dist < .4 && e.d + e.len - S.dist > -.4);
  if (w) {
    const lim = w.side * WALL.inner - w.side * .20;
    if (w.side > 0 && S.heroX > lim) { S.heroX = lim; S.bumped = .2; }
    if (w.side < 0 && S.heroX < lim) { S.heroX = lim; S.bumped = .2; }
  }
  S.heroX = Math.max(-.82, Math.min(.82, S.heroX));
  S.bumped = Math.max(0, S.bumped - dt);
  S.dist += S.speed * dt;
  if (S.state !== 'general') S.progress = Math.min(.96, S.progress + dt * .004);
  spawnCourse();
  scenery(dt);
  heroAttack(dt);
  if (companionsOn) companionsAttack(dt);
  if (S.boss) bossStep(dt);
  updateEnts(dt);
  updateWaves(dt);
  S.fx = S.fx.filter(f => (f.t += dt) < f.life);
  S.deltas = S.deltas.filter(d => (d.t += dt) < .9);
  S.troopShown += (S.troops - S.troopShown) * Math.min(1, dt * 10);
  S.shake = Math.max(0, S.shake - dt * 3); S.redFlash = Math.max(0, S.redFlash - dt * 2.2);
  toastStep(dt);
  if (auto) auto(S.t);
}

// ───────────────────────── 场景（路边） ─────────────────────────
const SCEN = ['tower', 'tent', 'rocks', 'granary', 'tent', 'rocks'];
function scenery() {
  S.scenNext = S.scenNext || 0;
  const ahead = S.dist + SPAWN_Z() + 10;
  while (S.scenNext < ahead) {
    const d = S.scenNext;
    for (const side of [-1, 1]) {
      if (rnd() < .75) S.scen.push({k: SCEN[Math.floor(rnd() * SCEN.length)], x: side * (1.75 + rnd() * .8), d: d + rnd() * 4, flip: side > 0});
      S.scen.push({k: 'palisade', x: side * 1.32, d: d + 2, flip: false, fence: true});
    }
    S.scenNext += S.state === 'general' ? 5 : 9;
  }
  S.scen = S.scen.filter(s => s.d - S.dist > -6);
}

// ───────────────────────── 攻击 ─────────────────────────
function heroPhase() {
  const W = WEAPONS[S.weapon], t = S.atkT;
  if (t < W.wind) return ['wind', t / W.wind];
  if (t < W.wind + W.rel) return ['rel', (t - W.wind) / W.rel];
  if (t < W.wind + W.rel + W.rec) return ['rec', (t - W.wind - W.rel) / W.rec];
  return ['run', 0];
}
function heroAttack(dt) {
  const W = WEAPONS[S.weapon];
  const prev = S.atkT; S.atkT += dt;
  const rel0 = W.wind;
  const crossed = t => prev < t && S.atkT >= t;
  const x = S.heroX;
  if (S.weapon === 'spear' && crossed(rel0)) {
    wave({k: 'f2_spearWave', x, z: .5, speed: 62, range: 46, hw: .12, pierce: 1, dmg: 3, h: .40, color: W.color});
    fx('f2_muzzleFlash', x, .55, .22, .14);
  }
  if (S.weapon === 'guandao' && crossed(rel0)) {
    wave({k: 'f2_bladeWave', x, z: .6, speed: 36, range: 22, hw: .44, pierce: 99, dmg: 7, h: .46, wide: 1.9, color: W.color, grow: .5});
    S.hitStop = .05; S.shake = .35;
    fx('arc', x, .2, .5, .22);
  }
  if (S.weapon === 'shemao' && (crossed(rel0) || crossed(rel0 + .10))) {
    const second = S.atkT >= rel0 + .10;
    wave({k: 'f2_spearWave', x: x + (second ? .05 : -.05), z: .5, speed: 74, range: 52, hw: .10, pierce: 3, dmg: 2, h: .34, snake: second ? -1 : 1, color: W.color});
    fx('f2_muzzleFlash', x, .55, .16, .1);
  }
  if (S.weapon === 'huaji' && crossed(rel0)) {
    wave({k: 'f2_spearWave', x, z: .5, speed: 56, range: 36, hw: .12, pierce: 2, dmg: 4, h: .40, color: W.color});
    fx('f2_muzzleFlash', x, .55, .2, .12);
  }
  if (S.weapon === 'huaji' && crossed(rel0 + .08)) {
    wave({k: 'f2_axeWave', x, z: .7, speed: 28, range: 13, hw: .34, pierce: 99, dmg: 2, h: .40, wide: 1.5, color: W.color});
  }
  if (S.atkT >= W.cycle) { S.atkT -= W.cycle; S.atkN++; }
}
function companionsAttack(dt) {
  for (const c of S.companions) {
    c.t += dt;
    if (c.t > 1.5) {
      c.t = 0; c.pose = .35;
      const x = S.heroX + c.dx;
      if (c.id === 'zhao') wave({k: 'f2_spearWave', x, z: .2, speed: 50, range: 30, hw: .09, pierce: 1, dmg: 2, h: .26, alpha: .8});
      else wave({k: 'f2_forkWave', x, z: .2, speed: 34, range: 24, hw: .1, pierce: 1, dmg: 2, h: .26, alpha: .8});
    }
    c.pose = Math.max(0, (c.pose || 0) - dt);
  }
}
function wave(o) { S.waves.push({...o, z0: o.z, prevZ: o.z, t: 0, hits: new Set(), x0: o.x, alpha: o.alpha || 1}); }
function fx(k, x, z, h, life, extra = {}) { S.fx.push({k, x, z, h, life, t: 0, ...extra}); }
function updateWaves(dt) {
  for (const w of S.waves) {
    w.prevZ = w.z; w.z += w.speed * dt; w.t += dt;
    if (w.snake) w.x = w.x0 + w.snake * SNAKE.amp * Math.sin((w.z - w.z0) * SNAKE.k);
    const targets = S.ents.filter(e => (e.type === 'enemy' && !e.dead) || (e.type === 'crate' && !e.open));
    for (const e of targets) {
      if (w.hits.has(e.id)) continue;
      const ez = e.d - S.dist;
      const ehw = e.type === 'crate' ? .2 : .1;
      if (ez >= w.prevZ - .5 && ez <= w.z + .3 && Math.abs(e.x - w.x) < w.hw + ehw) {
        w.hits.add(e.id); hitEnt(e, w.dmg, w);
        if (w.hits.size >= w.pierce) { w.spent = true; break; }
      }
    }
    if (S.boss && S.boss.phase !== 'down' && !w.hits.has('boss') && w.z >= S.boss.z - .5 && Math.abs(w.x) < w.hw + .35) {
      w.hits.add('boss'); const mul = S.boss.phase === 'rec' ? 2 : 1;
      S.boss.hp = Math.max(0, S.boss.hp - w.dmg * mul); S.boss.hit = .12;
      fx('f2_hitFlash', w.x * .5, S.boss.z - .2, .28 * mul, .16);
      if (mul > 1) S.fx.push({k: 'crit', x: w.x * .4, z: S.boss.z, life: .5, t: 0, v: w.dmg * mul});
      if (w.pierce < 99) w.spent = true;
    }
  }
  S.waves = S.waves.filter(w => !w.spent && w.z - w.z0 < w.range);
}
function hitEnt(e, dmg, w) {
  e.hp -= dmg; e.hitT = .12;
  const z = e.d - S.dist;
  fx('f2_hitFlash', e.x, z, e.type === 'crate' ? .3 : .22, .16);
  if (e.type === 'enemy' && e.hp <= 0) { e.dead = .01; }
  if (e.type === 'crate' && e.hp <= 0) {
    e.open = .01;
    const r = {grain: ['募兵', '粮车 · 援兵 +6', () => addTroops(6)], weapon: ['兵器', '兵器匣 · ' + WEAPONS[S.weapon].label + ' 升至叁阶', () => {}],
      arrows: ['军械', '军械 · 箭雨 8 秒', () => {}], treasure: ['宝物', '宝匣 · 获得「赤兔马」', () => { S.gotHorse = true; }]}[e.kind];
    r[2](); toast(r[1], e.kind === 'treasure' ? 'gold' : 'info');
  }
}
function addTroops(n) {
  S.troops = Math.max(0, S.troops + n);
  const last = S.deltas[S.deltas.length - 1];
  if (last && last.t < .3 && Math.sign(last.v) === Math.sign(n)) { last.v += n; last.t = 0; } else S.deltas.push({v: n, t: 0});
}

// ───────────────────────── 实体更新 ─────────────────────────
function updateEnts(dt) {
  for (const e of S.ents) {
    const z = e.d - S.dist;
    if (e.type === 'enemy') {
      if (!e.dead) { e.d -= dt * 2.2; e.walk += dt * 2.6; if (z < .35 && Math.abs(e.x - S.heroX) < .34) { e.dead = .01; addTroops(-1); S.redFlash = Math.max(S.redFlash, .25); } }
      else e.dead += dt;
    }
    if (e.type === 'crate') { e.hitT = Math.max(0, e.hitT - dt); if (e.open) e.open += dt; }
    if (e.type === 'gate' && !e.passed && z <= 0) {
      e.passed = true;
      const inside = Math.abs(S.heroX - e.x) < .46;
      if (inside) { e.flip = .01; addTroops(e.val); toast(e.val > 0 ? `援兵 +${e.val}` : e.val < 0 ? `伏兵 ${e.val}` : '空营 · 无增减', e.val > 0 ? 'good' : e.val < 0 ? 'bad' : 'info'); if (e.val < 0) S.redFlash = .4; }
    }
    if (e.flip) e.flip += dt;
  }
  S.ents = S.ents.filter(e => {
    const z = e.d - S.dist;
    if (e.type === 'wall') return e.d + e.len - S.dist > -6;
    if (e.type === 'enemy' && e.dead > .5) return false;
    if (e.type === 'crate' && e.open > 1.2) return false;
    return z > -4;
  });
}

// ───────────────────────── 敌将 ─────────────────────────
const BOSS_T = {idle: 1.1, warn: 1.2, strike: .45, rec: 1.5, down: 2.4};
function bossStep(dt) {
  const b = S.boss; b.pt += dt; b.hit = Math.max(0, b.hit - dt);
  b.trail += (b.hp - b.trail) * Math.min(1, dt * (b.trail > b.hp + .5 && b.trailWait <= 0 ? 3 : 0));
  b.trailWait = (b.trailWait || 0) - dt; if (b.hit > .1) b.trailWait = .4;
  if (b.hp <= 0 && b.phase !== 'down') { b.phase = 'down'; b.pt = 0; toast('吕布 力竭 · 可收降', 'gold'); }
  const next = p => { b.phase = p; b.pt = 0; };
  if (b.phase === 'idle' && b.pt > BOSS_T.idle) {
    next('warn');
    const side = S.heroX < -.15 ? -1 : S.heroX > .15 ? 1 : 0;
    b.band = side < 0 ? [-1, -.02] : side > 0 ? [.02, 1] : [-.5, .5];
    b.cycleN++;
  } else if (b.phase === 'warn' && b.pt > BOSS_T.warn) {
    next('strike');
    S.waves.push({boss: true, k: 'f2_bladeWave', x: (b.band[0] + b.band[1]) / 2, z: b.z - .6, z0: b.z, prevZ: b.z, speed: -40, t: 0, hits: new Set(), x0: 0, alpha: 1, hw: (b.band[1] - b.band[0]) / 2, h: .5, wide: (b.band[1] - b.band[0]) * 1.4, range: 99, dmg: 0, pierce: 0});
    S.shake = .5;
  } else if (b.phase === 'strike' && b.pt > BOSS_T.strike) next('rec');
  else if (b.phase === 'rec' && b.pt > BOSS_T.rec) next('idle');
  else if (b.phase === 'down' && b.pt > BOSS_T.down) { b.hp = 100; b.trail = 100; next('idle'); }
  // 敌将刀气（向主将）
  for (const w of S.waves) if (w.boss) {
    w.z += 0; // 位置由 updateWaves 推进（speed 为负）
    if (!w.hitDone && w.z <= .2) {
      w.hitDone = true; w.spent = true;
      const inBand = S.heroX > b.band[0] - .05 && S.heroX < b.band[1] + .05;
      if (inBand) { addTroops(-10); S.redFlash = .8; S.shake = 1; toast('中招 · 兵力 −10', 'bad'); }
      else toast('闪开横扫 · 趁收势反击', 'good');
    }
  }
  // 小兵
  S.minT -= dt;
  if (S.minT <= 0 && b.phase !== 'down') { S.minT = 3.2; const x = rnd() < .5 ? -.5 : .5; for (let i = 0; i < 3; i++) S.ents.push({id: EID++, type: 'enemy', x: x + (i - 1) * .18, d: S.dist + b.z - 1.5 - i * .5, hp: 1, walk: rnd(), dead: 0}); }
}

// ───────────────────────── 提示条（Z4） ─────────────────────────
const TPRI = {bad: 3, gold: 2, good: 1, info: 0};
function toast(str, kind) {
  const t = {str, kind, t: 0};
  if (!S.toast || TPRI[kind] >= TPRI[S.toast.kind] || S.toast.t > .8) S.toast = t; else S.toasts.push(t);
}
function toastStep(dt) {
  if (S.toast) { S.toast.t += dt; if (S.toast.t > 1.6) S.toast = S.toasts.shift() || null; }
}

// ───────────────────────── 渲染 ─────────────────────────
let groundStrip = null;
function makeGrassStrip() {
  const g = IMG.battle20260925_grass; const c = document.createElement('canvas'); c.width = 512 * 8; c.height = 512;
  const x = c.getContext('2d'); for (let i = 0; i < 8; i++) x.drawImage(g, i * 512, 0); groundStrip = c;
}
function drawBackdrop() {
  const W = L.W;
  const sky = ctx.createLinearGradient(0, 0, 0, L.Z1[1]);
  sky.addColorStop(0, '#6f8fae'); sky.addColorStop(1, '#d9dccf');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, L.Z1[1] + 20);
  const im = IMG.battle20260925_distant; if (!im) return;
  const dw = W * 1.25, dh = dw * 450 / 768;
  const bx = (W - dw) / 2 - S.heroX * 8, by = L.P0 + 34 - dh;
  ctx.drawImage(im, 0, 0, 768, 450, bx, by, dw, dh);
}
function drawGround() {
  const road = IMG.battle20260925_road; if (!road) return;
  if (!groundStrip) makeGrassStrip();
  const y0 = Math.floor(L.P0 - 14);
  const TEXK = 220; // 纹理像素 / 世界单位
  for (let y = y0; y < L.H; y++) {
    const z = L.zAt(y + .5); const s = L.c / (z + L.c);
    const wz = z + S.dist;
    const v = ((wz * TEXK * .5) % 512 + 512) % 512;
    const gw = 512 / TEXK * L.ppu * s * 1.6;
    const need = L.W / gw * 512; const sw = Math.min(4096, need);
    const sx = 2048 - (L.cx / gw) * 512;
    ctx.drawImage(groundStrip, Math.max(0, sx), Math.floor(v), sw, 1, 0, y, sw / 512 * gw, 1.3);
    const rv = ((wz * TEXK) % 640 + 640) % 640;
    const rw = 640 / TEXK * L.ppu * s * .98;
    ctx.drawImage(road, 0, Math.floor(rv), 640, 1, L.cx - rw / 2, y, rw, 1.3);
  }
  // 远端雾，衔接远景
  const g = ctx.createLinearGradient(0, y0, 0, L.Z1[1] + 10);
  g.addColorStop(0, 'rgba(226,228,214,.95)'); g.addColorStop(.55, 'rgba(226,228,214,.35)'); g.addColorStop(1, 'rgba(226,228,214,0)');
  ctx.fillStyle = g; ctx.fillRect(0, y0, L.W, L.Z1[1] + 10 - y0);
}
function shadow(x, y, w) {
  ctx.save(); ctx.fillStyle = 'rgba(30,22,10,.28)'; ctx.beginPath(); ctx.ellipse(x, y, w / 2, w * .16, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

let LABELS = [];
function drawWorld() {
  const list = [];
  for (const s of S.scen) list.push({z: s.d - S.dist, draw: () => drawScen(s)});
  for (const e of S.ents) {
    if (e.type === 'wall') { drawWallDecal(e); list.push(...wallPieces(e)); continue; }
    list.push({z: e.d - S.dist, draw: () => drawEnt(e)});
  }
  if (S.boss) { drawBossDecal(); list.push({z: S.boss.z, draw: drawBoss}); }
  list.push({z: 0, draw: drawHeroGroup});
  list.sort((a, b) => b.z - a.z);
  for (const it of list) if (it.z > -5 && it.z < L.zP0 + 20) it.draw();
}
function drawScen(s) {
  const z = s.d - S.dist; const p = proj(s.x, z); if (p.y < L.P0 - 30) return;
  const h = (s.fence ? .42 : s.k === 'tower' ? 1.25 : s.k === 'rocks' ? .45 : s.k === 'granary' ? .8 : .72) * L.ppu * p.s;
  const k = use('场景·' + s.k, s.k);
  const fog = Math.max(0, Math.min(1, (p.y - L.P0) / (L.Z1[1] - L.P0)));
  ctx.save(); ctx.globalAlpha = .35 + .65 * fog; drawFrame(k, p.x, p.y, h, {flip: s.flip}); ctx.restore();
}

// —— 辕门 ——
const GATE_COL = {plus: {band: 'g_bannerBlue', fb: 'gateBlue', num: '#FFF6DA', stroke: '#173a66', sub: '援兵'},
  minus: {band: 'g_bannerRed', fb: 'gateRed', num: '#FFE9E2', stroke: '#5b120b', sub: '伏兵'},
  zero: {band: 'g_bannerPaper', fb: 'gateNeutral', num: '#2A2016', stroke: 'rgba(243,234,214,.9)', sub: '空营'}};
function drawEnt(e) {
  const z = e.d - S.dist;
  if (e.type === 'gate') return drawGate(e, z);
  if (e.type === 'crate') return drawCrate(e, z);
  if (e.type === 'enemy') return drawEnemy(e, z);
}
function drawGate(e, z) {
  const kind = e.val > 0 ? 'plus' : e.val < 0 ? 'minus' : 'zero';
  const C = GATE_COL[kind];
  const pl = proj(e.x - .44, z), pr = proj(e.x + .44, z), pc = proj(e.x, z);
  if (pc.y < L.P0 - 10) return;
  const s = pc.s, u = L.ppu * s;
  const H = UNIT.gateH * u;
  const post = use('辕门·立柱', 'gatePost');
  const beam = use('辕门·横梁', 'g_rail');
  const bannerK = use('辕门·' + C.sub + '旗', C.band, C.fb);
  const fade = Math.min(1, Math.max(.3, (pc.y - L.P0) / 40));
  ctx.save(); ctx.globalAlpha = fade;
  if (e.flip) ctx.globalAlpha *= Math.max(0, 1 - e.flip * 1.6);
  shadow(pl.x, pl.y, .16 * u); shadow(pr.x, pr.y, .16 * u);
  // 旗面（悬于横梁下）
  const bw = .64 * u, bh = .50 * u, by = pc.y - H + .10 * u;
  const bf = M.frames[bannerK];
  let rect = null;
  if (bf) {
    const sc = bw / bf.r[2];
    rect = {x: pc.x - bw / 2, y: by, w: bw, h: bf.r[3] * sc};
    ctx.drawImage(IMG[bf.s], bf.r[0], bf.r[1], bf.r[2], bf.r[3], rect.x, rect.y, rect.w, Math.min(rect.h, bh * 1.25));
    rect.h = Math.min(rect.h, bh * 1.25);
  }
  // 横梁
  if (beam) { const f = M.frames[beam]; const bwid = .98 * u; const bh2 = f.r[3] * bwid / f.r[2]; ctx.drawImage(IMG[f.s], ...f.r, pc.x - bwid / 2, pc.y - H - bh2 * .35, bwid, bh2); }
  else { ctx.fillStyle = '#5a3a1e'; ctx.fillRect(pc.x - .49 * u, pc.y - H, .98 * u, .07 * u); ctx.fillStyle = '#b08040'; ctx.fillRect(pc.x - .49 * u, pc.y - H, .98 * u, .015 * u); }
  drawFrame(post, pl.x, pl.y, H * 1.02); drawFrame(post, pr.x, pr.y, H * 1.02);
  ctx.restore();
  // 数字 → L6（高于特效）
  if (rect && !e.flip) LABELS.push({kind: 'gate', zone: zoneOf(rect.y + rect.h * .42), x: pc.x, y: rect.y + rect.h * .42, u, C, val: e.val, rect, z});
  if (e.flip) LABELS.push({kind: 'gateFlip', x: pc.x, y: pc.y - H * .6, val: e.val, t: e.flip, C});
}
function drawGateLabel(l) {
  if (l.zone === 1) return; // Z1 只看旗色
  const size = Math.round(Math.max(NUM.gateMin, Math.min(NUM.gateMax, l.u * .21)));
  // 接近部曲时让位给部曲人数与结算飘字：按屏幕距离淡出（小屏 Z3 更矮，不能只按 z 判断）
  const room = (S.troopY ?? L.heroY) - 24 - (l.y + size * .5 + (l.rect.w >= 64 ? 22 : 4));
  if (l.z < 1.6 || room < 0) return;
  const fade = Math.min(1, (l.z - 1.6) / 1.4, room / 36); ctx.save(); ctx.globalAlpha = fade;
  const str = l.val > 0 ? '+' + l.val : l.val < 0 ? '−' + (-l.val) : '0';
  text(str, l.x, l.y, size, {kind: 'gate', family: NUMF, weight: 800, align: 'center', color: l.C.num, stroke: l.C.stroke, strokeW: 4, layer: 'L6'});
  if (l.rect.w >= 64) text(l.C.sub, l.x, l.y + size * .5 + 10, TYPE.caption, {kind: 'ui', align: 'center', color: l.C.num, stroke: l.C.stroke, strokeW: 3, layer: 'L6'});
  ctx.restore();
}

// —— 门箱 ——
const CRATE = {grain: ['g_grainCart', 'boxTroops', '募兵', .46], weapon: ['g_weaponCase', 'boxEquipment', '兵器', .36], arrows: ['g_arrowCrate', 'boxChain', '军械', .44], treasure: ['g_treasureBox', 'boxCompanion', '宝物', .34]};
function drawCrate(e, z) {
  const [gk, fk, name, hh] = CRATE[e.kind];
  const p = proj(e.x, z); if (p.y < L.P0 - 10) return;
  const u = L.ppu * p.s;
  const k = e.open ? use('门箱·' + name + '·开', gk + 'Open', fk + 'Open') : use('门箱·' + name, gk, fk);
  shadow(p.x, p.y, .42 * u);
  const jig = e.hitT > 0 ? Math.sin(e.hitT * 90) * 2 : 0;
  ctx.save(); if (e.open) ctx.globalAlpha = Math.max(0, 1 - Math.max(0, e.open - .5) * 1.5);
  const r = drawFrame(k, p.x + jig, p.y, hh * u);
  if (e.hitT > 0 && r) { ctx.globalAlpha = e.hitT * 4; drawFrame(k, p.x + jig, p.y, hh * u, {tint: '#fff', comp: 'lighter'}); }
  ctx.restore();
  if (!e.open && r) LABELS.push({kind: 'crate', zone: zoneOf(r.y - 12), x: p.x, y: r.y - 6, e, name, u});
}
function drawCrateLabel(l) {
  if (l.zone === 1) return;
  const segW = Math.max(6, Math.min(10, l.u * .05)), gap = 2, n = 5, W = n * segW + (n - 1) * gap;
  const x0 = l.x - W / 2, y = l.y - 6;
  const filled = Math.ceil(l.e.hp / l.e.max * 5);
  ctx.save();
  ctx.fillStyle = 'rgba(14,24,38,.75)'; roundRect(x0 - 3, y - 3, W + 6, 11, 3); ctx.fill();
  for (let i = 0; i < n; i++) { ctx.fillStyle = i < filled ? '#E6CD93' : 'rgba(135,132,124,.45)'; ctx.fillRect(x0 + i * (segW + gap), y, segW, 5); }
  ctx.restore();
  LABELS_DRAWN.push({x: x0 - 3, y: y - 3, w: W + 6, h: 11});
  if (l.zone >= 2) text(l.name, l.x, y - 12, TYPE.caption, {kind: 'crateName', align: 'center', color: '#F3EAD6', stroke: 'rgba(14,24,38,.85)', strokeW: 3, layer: 'L6'});
}

// —— 固定墙段 ——
// 占据半幅路面的木栅营垒：正面一排（迎向玩家）、内侧一列（贴着行进线）、背面一排，内部为夯土。
const WALL = {inner: .06, outer: .95, step: 1.6, gap: .13};
function wallPieces(e) {
  const out = [], sd = e.side;
  const z0 = e.d - S.dist, z1 = z0 + e.len;
  const stakes = [use('墙·尖桩A', 'g_stake0', 'f2_wallStart'), use('墙·尖桩B', 'g_stake1', 'f2_wallEnd'), use('墙·尖桩C', 'g_stake2', 'f2_wallStart')];
  const rail = use('墙·横木', 'g_rail', 'f2_wallMiddle');
  const pier = use('墙·石墩端头', 'g_pier0', 'f2_wallStart');
  const xi = sd * WALL.inner, xo = sd * WALL.outer;
  const stakeAt = (x, z, n) => ({z, x, draw: () => {
    const p = proj(x, z); if (p.y < L.P0 - 10 || z < -3) return;
    const u = L.ppu * p.s; shadow(p.x, p.y, .1 * u);
    drawFrame(stakes[n % 3], p.x, p.y, .30 * u);
  }});
  const railSeg = (xa, za, xb, zb) => {
    const f = M.frames[rail]; if (!f) return;
    for (const hgt of [.10, .20]) {
      const pa = proj(xa, za), pb = proj(xb, zb);
      const A = {x: pa.x, y: pa.y - hgt * pa.s * L.ppu}, B = {x: pb.x, y: pb.y - hgt * pb.s * L.ppu};
      const len = Math.hypot(B.x - A.x, B.y - A.y), th = Math.max(2, .05 * L.ppu * Math.max(pa.s, pb.s));
      ctx.save(); ctx.translate(A.x, A.y); ctx.rotate(Math.atan2(B.y - A.y, B.x - A.x));
      if (rail.startsWith('g_')) ctx.drawImage(IMG[f.s], ...f.r, 0, -th / 2, len, th);
      else { ctx.rotate(-Math.PI / 2); ctx.drawImage(IMG[f.s], ...f.r, -th / 2, 0, th, len); }
      ctx.restore();
    }
  };
  // 横排（正面 z0 / 背面 z1）：由外向内画，内侧桩压在上面
  const row = (z, tag) => {
    const n = Math.max(2, Math.round((WALL.outer - WALL.inner) / WALL.gap));
    out.push({z: z + .01, draw: () => { if (z > -3 && proj(0, z).y > L.P0 - 10) railSeg(xo, z, xi, z); }});
    for (let i = 0; i <= n; i++) {
      const x = xo + (xi - xo) * i / n;
      if (i === n) out.push({z, draw: () => { const p = proj(x, z); if (p.y < L.P0 - 10 || z < -3) return; const u = L.ppu * p.s; shadow(p.x, p.y, .28 * u); drawFrame(pier, p.x, p.y, .38 * u); }});
      else out.push(stakeAt(x, z - i * 1e-4, i + tag));
    }
  };
  row(z1, 1);
  // 内侧纵列：沿行进线，玩家贴着它经过
  for (let z = z1 - WALL.step; z > z0 + .2; z -= WALL.step) {
    const zz = z, zn = Math.min(z1, z + WALL.step);
    out.push({z: zz + .005, draw: () => { if (zz > -3 && proj(0, zz).y > L.P0 - 10) railSeg(xi, zz, xi, zn); }});
    out.push(stakeAt(xi, zz, Math.round(Math.abs(zz) * 3)));
  }
  out.push({z: z0 + .006, draw: () => { if (z0 > -3) railSeg(xi, z0, xi, Math.min(z1, z0 + WALL.step)); }});
  row(z0, 0);
  return out;
}
function drawWallDecal(e) {
  const sd = e.side, z0 = Math.max(-2.5, e.d - S.dist), z1 = e.d + e.len - S.dist; if (z1 < -2.5) return;
  const q = [proj(sd * WALL.inner, z0), proj(sd * WALL.outer, z0), proj(sd * WALL.outer, z1), proj(sd * WALL.inner, z1)];
  ctx.save(); ctx.fillStyle = 'rgba(92,64,34,.40)'; ctx.beginPath(); q.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.fill();
  // 墙脚阴影：内侧纵列外沿一道暗线
  const a = proj(sd * WALL.inner - sd * .03, z0), b = proj(sd * WALL.inner - sd * .03, z1);
  ctx.strokeStyle = 'rgba(40,26,12,.30)'; ctx.lineWidth = 6 * (L.c / (Math.max(0, z0) + L.c)); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  ctx.restore();
}

// —— 敌兵 ——
function drawEnemy(e, z) {
  const p = proj(e.x, z); if (p.y < L.P0 - 10) return;
  const u = L.ppu * p.s;
  const k = e.dead ? 'redHurt' : (Math.floor(e.walk * 2) % 2 ? 'redWalk1' : 'redWalk0');
  use('敌兵·跑/受击', 'redWalk0');
  shadow(p.x, p.y, .22 * u);
  ctx.save(); if (e.dead) ctx.globalAlpha = Math.max(0, 1 - e.dead * 2);
  drawFrame(k, p.x, p.y - (e.dead ? e.dead * 20 * p.s : 0), UNIT.soldier * u, {refH: 144});
  ctx.restore();
}

// —— 主将 + 随军 + 部曲 ——
function drawHeroGroup() {
  const hx = S.heroX;
  // 部曲（身后）
  const n = Math.min(12, Math.round(S.troopShown / 3));
  const bob = S.t * 9;
  const slots = [];
  for (let i = 0; i < n; i++) { const row = Math.floor(i / 4), col = i % 4; slots.push({x: hx + (col - 1.5) * .17 + (row % 2) * .08, z: -.7 - row * .45}); }
  slots.sort((a, b) => b.z - a.z);
  for (const s of slots) {
    const p = proj(Math.max(-.95, Math.min(.95, s.x)), s.z);
    shadow(p.x, p.y, .18 * L.ppu * p.s);
    drawFrame(Math.floor(bob + s.x * 9) % 2 ? 'blueWalk1' : 'blueWalk0', p.x, p.y, UNIT.soldier * L.ppu * p.s, {refH: 139});
  }
  use('己方兵·跑', 'blueWalk0');
  // 随军二将
  const cks = {zhao: ['zhaoWalk0', 'zhaoWalk1', 'zhaoAttack'], chen: ['panWalk0', 'panWalk1', 'panAttack']};
  use('随军·赵云', 'zhaoWalk0'); use('随军·陈应', 'panWalk0');
  for (const c of S.companions) {
    const p = proj(Math.max(-.9, Math.min(.9, hx + c.dx)), -.35);
    const k = companionsOn && c.pose > 0 ? cks[c.id][2] : cks[c.id][Math.floor(bob * .9 + c.dx * 5) & 1];
    shadow(p.x, p.y, .24 * L.ppu * p.s);
    drawFrame(k, p.x, p.y, UNIT.companion * L.ppu * p.s, {refH: c.id === 'zhao' ? 164 : 152});
  }
  // 主将
  const F = heroFrames(S.weapon);
  const [ph, pr] = heroPhase();
  const p = proj(hx, 0);
  const H = UNIT.hero * L.ppu;
  let k;
  if (ph === 'run') k = F.run[Math.floor(S.t * 8) % F.run.length];
  else k = F[ph];
  const ref = F.ref ? F.ref(k) : (M.frames[F.refKey] ? M.frames[F.refKey].r[3] : 158) * (F.refKey && F.refKey.startsWith('g_') ? GEN_BODY : 1);
  const runBob = ph === 'run' ? Math.abs(Math.sin(S.t * 12)) * 2.5 : 0;
  const lunge = ph === 'rel' ? -6 * Math.sin(pr * Math.PI) : ph === 'wind' ? 2 * pr : 0;
  shadow(p.x, p.y, .30 * L.ppu);
  // 主将脚下金环（锚点可辨）
  ctx.save(); ctx.strokeStyle = 'rgba(230,205,147,.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(p.x, p.y, .2 * L.ppu, .055 * L.ppu, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  const bump = S.bumped > 0 ? Math.sin(S.bumped * 60) * 2 : 0;
  const r = drawFrame(k, p.x + bump, p.y - runBob + lunge, H, {refH: ref * (ph === 'run' ? 1 : 1)});
  S.heroRect = r;
  // 偃月刀弧光（近身横扫）
  // 部曲旗 → L6
  LABELS.push({kind: 'troop', x: p.x, y: p.y - H - 22}); S.troopY = p.y - H - 22;
}
function drawTroopLabel(l) {
  const x = l.x, y = l.y;
  ctx.save();
  // 小旗
  ctx.fillStyle = '#2F66A3'; ctx.strokeStyle = '#E6CD93'; ctx.lineWidth = 1;
  const str = String(Math.round(S.troopShown));
  ctx.font = `800 ${NUM.troop}px ${NUMF}`; const w = Math.max(36, ctx.measureText(str).width + 18);
  roundRect(x - w / 2, y - 15, w, 30, 5); ctx.fillStyle = 'rgba(21,36,58,.86)'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2F66A3'; ctx.fillRect(x - w / 2 + 3, y - 12, 4, 24);
  ctx.restore();
  text(str, x + 3, y + 1, NUM.troop, {kind: 'troop', family: NUMF, weight: 800, align: 'center', color: '#F5EFE2', layer: 'L6'});
  for (const d of S.deltas) {
    const a = 1 - Math.max(0, d.t - .5) / .4;
    ctx.save(); ctx.globalAlpha = a;
    text((d.v > 0 ? '+' : '−') + Math.abs(d.v), x + w / 2 + 6, y - 4 - d.t * 26, NUM.delta, {kind: 'delta', family: NUMF, weight: 800, color: d.v > 0 ? '#9FD7FF' : '#FF9A8A', stroke: 'rgba(14,24,38,.9)', strokeW: 3, layer: 'L6'});
    ctx.restore();
  }
}

// —— 敌将 ——
function drawBossDecal() {
  const b = S.boss;
  const p = proj(0, b.z);
  const u = L.ppu * p.s;
  // 将台（程序绘制占位：土台＋铜沿）
  ctx.save();
  const w = 1.0 * u, h = .13 * u;
  ctx.fillStyle = '#4a3522'; ctx.beginPath(); ctx.ellipse(p.x, p.y + h * .2, w / 2, w * .2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6d5236'; ctx.fillRect(p.x - w / 2, p.y - h * .6, w, h * .8);
  ctx.fillStyle = '#8b6a45'; ctx.beginPath(); ctx.ellipse(p.x, p.y - h * .6, w / 2, w * .19, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#C9A45C'; ctx.lineWidth = Math.max(1, u * .012); ctx.stroke();
  ctx.fillStyle = 'rgba(122,36,25,.9)'; ctx.beginPath(); ctx.ellipse(p.x, p.y - h * .6, w * .32, w * .11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // 预警地面：目标带
  if (b.phase === 'warn' || b.phase === 'strike') {
    const [l, r] = b.band; const zA = b.z - .6, zB = -1.2;
    const A = proj(l, zA), B = proj(r, zA), C = proj(r, zB), D = proj(l, zB);
    const pulse = b.phase === 'warn' ? .22 + .18 * Math.sin(b.pt * 16) : .5;
    ctx.save(); ctx.fillStyle = `rgba(178,58,43,${pulse})`; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(C.x, C.y); ctx.lineTo(D.x, D.y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,190,170,.8)'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]); ctx.stroke();
    // 充能进度（从敌将推向主将）
    if (b.phase === 'warn') { const k = Math.min(1, b.pt / BOSS_T.warn); const zc = zA + (zB - zA) * k; const E = proj(l, zc), F = proj(r, zc); ctx.setLineDash([]); ctx.strokeStyle = '#FFD7C8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(E.x, E.y); ctx.lineTo(F.x, F.y); ctx.stroke(); }
    ctx.restore();
  }
  if (b.phase === 'rec') { // 破绽
    ctx.save(); ctx.strokeStyle = `rgba(230,205,147,${.5 + .4 * Math.sin(b.pt * 10)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(p.x, p.y - h * .6, w * .42, w * .15, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
}
function drawBoss() {
  const b = S.boss; const p = proj(0, b.z); const u = L.ppu * p.s; const top = p.y - .13 * u * .6;
  const K = {idle: use('吕布·立定', 'g_lubuIdle', 'bossYangWalk0'), warn: use('吕布·蓄势(预警)', 'g_lubuWind', 'bossYangWalk1'), strike: use('吕布·横扫(出招)', 'g_lubuStrike', 'bossYangAttack'), rec: use('吕布·收势(破绽)', 'g_lubuRec', 'bossYangHurt'), down: use('吕布·跪降', 'g_lubuDown', 'bossYangHurt')};
  const k = K[b.phase];
  const ref = M.frames[K.idle] ? M.frames[K.idle].r[3] : 202;
  const flagK = use('将台·帅旗', 'g_warBanner'); const drumK = use('将台·战鼓', 'g_warDrum');
  if (flagK) drawFrame(flagK, p.x - .62 * u, p.y, 1.1 * u);
  if (drumK) drawFrame(drumK, p.x + .6 * u, p.y, .34 * u);
  const shake = b.hit > 0 ? Math.sin(b.hit * 80) * 2 : 0;
  const r = drawFrame(k, p.x + shake, top, UNIT.general * L.ppu * p.s * (1 / .9), {refH: ref});
  if (b.hit > 0 && r) { ctx.save(); ctx.globalAlpha = b.hit * 4; drawFrame(k, p.x + shake, top, UNIT.general * L.ppu * p.s / .9, {refH: ref, tint: '#fff', comp: 'lighter'}); ctx.restore(); }
  if (r) LABELS.push({kind: 'boss', x: p.x, y: r.y - 4, zone: zoneOf(p.y)});
}
function drawBossLabel(l) {
  const b = S.boss;
  if (b.phase === 'rec') text('破绽 ×2', l.x, l.y - 8, TYPE.body, {kind: 'ui', align: 'center', color: '#FFE6A6', stroke: 'rgba(14,24,38,.9)', strokeW: 3, layer: 'L6'});
}

// —— 特效 L5 ——
// 蛇矛：矛尖身后拖一条蛇行光带（程序绘制，长度 7 单位，由尾到头渐亮渐粗）
const SNAKE = {amp: .20, k: .30, len: 7};
function drawSnakeTrail(w) {
  const n = 18, z1 = w.z, z0 = Math.max(w.z0, w.z - SNAKE.len);
  const pts = [];
  for (let i = 0; i <= n; i++) { const z = z0 + (z1 - z0) * i / n; const x = w.x0 + w.snake * SNAKE.amp * Math.sin((z - w.z0) * SNAKE.k); const p = proj(x, z); pts.push({x: p.x, y: p.y - .2 * L.ppu * p.s, s: p.s}); }
  ctx.save(); ctx.lineCap = 'round';
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], k = i / n;
    ctx.strokeStyle = `rgba(240,211,138,${(.08 + .55 * k).toFixed(3)})`; ctx.lineWidth = Math.max(1.5, (2 + 7 * k) * b.s);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  ctx.restore();
}
function drawWaves() {
  for (const w of S.waves) {
    const p = proj(w.x, w.z); if (p.y < L.P0) continue;
    const u = L.ppu * p.s; const age = w.t;
    const life = w.boss ? 1 : 1 - (w.z - w.z0) / w.range;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, life * 2.2) * w.alpha;
    const f = M.frames[w.k]; if (!f) { ctx.restore(); continue; }
    let rot = 0;
    if (w.snake) { drawSnakeTrail(w); const dx = w.snake * SNAKE.amp * SNAKE.k * Math.cos((w.z - w.z0) * SNAKE.k); rot = Math.atan2(dx * L.ppu * p.s, 1 * u * .3) * .8; }
    const hh = w.h * u * (w.grow ? 1 + age * w.grow * 3 : 1);
    if (w.wide) {
      const ww = w.wide * u * (w.grow ? 1 + age * w.grow * 3 : 1); const sc = ww / f.r[2];
      ctx.translate(p.x, p.y - .18 * u); if (w.boss) ctx.scale(1, -1);
      const img = w.boss ? tinted(w.k, '#ff5a3c') : IMG[f.s];
      const [sx, sy] = w.boss ? [0, 0] : f.r;
      ctx.drawImage(img, sx, sy, f.r[2], f.r[3], -ww / 2, -f.r[3] * sc * .6, ww, f.r[3] * sc * .75);
    } else {
      ctx.translate(p.x, p.y - .2 * u); ctx.rotate(rot);
      const sc = hh / f.r[3];
      ctx.drawImage(IMG[f.s], ...f.r, -f.r[2] * sc / 2, -hh, f.r[2] * sc, hh);
    }
    ctx.restore();
  }
  for (const f of S.fx) {
    const k = f.t / f.life;
    if (f.k === 'arc') { // 偃月刀近身弧光
      const p = proj(S.heroX, .35); const u = L.ppu;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = '#CFF5DE'; ctx.lineWidth = 6 * (1 - k) + 2; ctx.beginPath();
      ctx.ellipse(p.x, p.y - .25 * u, .55 * u, .22 * u, 0, Math.PI * (1.05 + k * .2), Math.PI * (1.95 + k * .1)); ctx.stroke(); ctx.restore();
      continue;
    }
    if (f.k === 'crit') continue;
    const p = proj(f.x, f.z); const u = L.ppu * p.s;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - k;
    drawFrame(f.k, p.x, p.y - .22 * u, f.h * u * (1 + k * .4), {center: true}); ctx.restore();
  }
}

// ───────────────────────── HUD（L7） ─────────────────────────
let HUDR = [];
function hudRect(name, x, y, w, h) { HUDR.push({name, x, y, w, h}); }
function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function panel(x, y, w, h, o = {}) {
  ctx.save(); roundRect(x, y, w, h, o.r ?? 6); ctx.fillStyle = o.fill || 'rgba(21,36,58,.82)'; ctx.fill();
  ctx.strokeStyle = o.stroke || 'rgba(201,164,92,.55)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
}
function drawHUD() {
  HUDR = [];
  const {W, row1, row2} = L;
  // 顶部压暗，保证 HUD 在天空上可读
  const g = ctx.createLinearGradient(0, 0, 0, L.hudBottom + 16);
  g.addColorStop(0, 'rgba(14,24,38,.78)'); g.addColorStop(.75, 'rgba(14,24,38,.45)'); g.addColorStop(1, 'rgba(14,24,38,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, L.hudBottom + 16);
  // 状态栏 & 胶囊（平台占位，不属于本游戏 HUD）
  text('9:41', 24, L.top / 2 + 2, TYPE.body, {kind: 'debug', color: '#fff', layer: 'OS'});
  const cp = L.capsule; ctx.save(); roundRect(cp.x, cp.y, cp.w, cp.h, 16); ctx.fillStyle = 'rgba(255,255,255,.72)'; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.stroke();
  ctx.fillStyle = '#111'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(cp.x + 18 + i * 7, cp.y + 16, 2.2, 0, 7); ctx.fill(); }
  ctx.fillRect(cp.x + 43, cp.y + 8, 1, 16); ctx.beginPath(); ctx.arc(cp.x + 65, cp.y + 16, 7, 0, 7); ctx.lineWidth = 2; ctx.strokeStyle = '#111'; ctx.stroke(); ctx.restore();
  // Row1：暂停 + 兵器
  const y1 = row1.y + 2;
  panel(12, y1, 32, 32, {r: 16}); ctx.fillStyle = '#E6CD93'; ctx.fillRect(23, y1 + 10, 3, 12); ctx.fillRect(30, y1 + 10, 3, 12);
  hudRect('暂停', 12, y1, 32, 32);
  const Wp = WEAPONS[S.weapon];
  const chipX = 52, chipW = Math.min(176, cp.x - 8 - chipX);
  panel(chipX, y1, chipW, 32);
  const icon = use('图标·' + Wp.label, 'g_icon_' + S.weapon);
  ctx.save(); roundRect(chipX + 3, y1 + 3, 26, 26, 4); ctx.fillStyle = 'rgba(14,24,38,.9)'; ctx.fill(); ctx.restore();
  if (icon) drawFrame(icon, chipX + 16, y1 + 16, 24, {center: true});
  else { ctx.save(); ctx.strokeStyle = '#DCCBA6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(chipX + 8, y1 + 25); ctx.lineTo(chipX + 24, y1 + 8); ctx.stroke(); ctx.restore(); }
  text(Wp.label, chipX + 36, y1 + 16, TYPE.body, {color: '#F5EFE2'});
  const lw = ctx.measureText ? measure(Wp.label, TYPE.body) : 42;
  // 阶位：三枚菱形
  for (let i = 0; i < 3; i++) { const dx = chipX + 36 + lw + 8 + i * 9, dy = y1 + 16; ctx.save(); ctx.translate(dx, dy); ctx.rotate(Math.PI / 4); ctx.fillStyle = i < Wp.tier ? '#D9B25A' : 'rgba(135,132,124,.5)'; ctx.fillRect(-2.8, -2.8, 5.6, 5.6); ctx.restore(); }
  if (Wp.res) text('共鸣·' + Wp.res, chipX + chipW - 8, y1 + 16, TYPE.caption, {align: 'right', color: '#9FE0B8'});
  hudRect('兵器', chipX, y1, chipW, 32);
  hudRect('平台胶囊', cp.x, cp.y, cp.w, cp.h);
  // Row2：行军条 / 敌将牌（同一槽位同一高度）
  const y2 = row2.y;
  if (!S.boss) {
    panel(12, y2 + 4, W - 24, 32);
    text(S.stage, 22, y2 + 20, TYPE.body, {color: '#E6CD93'});
    const bx0 = 22 + measure(S.stage, TYPE.body) + 12, bx1 = W - 30, by = y2 + 20;
    ctx.save(); ctx.fillStyle = 'rgba(135,132,124,.45)'; roundRect(bx0, by - 3, bx1 - bx0, 6, 3); ctx.fill();
    ctx.fillStyle = '#C9A45C'; roundRect(bx0, by - 3, (bx1 - bx0) * S.progress, 6, 3); ctx.fill();
    for (const t of [.22, .41, .63, .8]) { ctx.fillStyle = t < S.progress ? '#8A6630' : '#DCCBA6'; ctx.fillRect(bx0 + (bx1 - bx0) * t - 1, by - 5, 2, 10); }
    ctx.fillStyle = '#B23A2B'; ctx.beginPath(); ctx.arc(bx1, by, 6, 0, 7); ctx.fill(); ctx.strokeStyle = '#E6CD93'; ctx.lineWidth = 1.5; ctx.stroke();
    const hx = bx0 + (bx1 - bx0) * S.progress; ctx.save(); ctx.translate(hx, by); ctx.rotate(Math.PI / 4); ctx.fillStyle = '#6FA3D8'; ctx.fillRect(-4, -4, 8, 8); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(-4, -4, 8, 8); ctx.restore();
    ctx.restore();
    hudRect('行军条', 12, y2 + 4, W - 24, 32);
  } else {
    const b = S.boss;
    panel(12, y2, W - 24, 40, {fill: 'rgba(40,14,10,.86)', stroke: 'rgba(230,205,147,.7)'});
    ctx.save(); roundRect(18, y2 + 5, 30, 30, 4); ctx.fillStyle = '#7A2419'; ctx.fill(); ctx.restore();
    text('吕', 33, y2 + 20, TYPE.title, {align: 'center', family: SERIF, weight: 900, color: '#F3EAD6'});
    text(b.name, 56, y2 + 12, TYPE.title, {family: SERIF, weight: 900, color: '#F3EAD6'});
    text(b.weapon + ' · 敌将', 56 + measure(b.name, TYPE.title, SERIF) + 8, y2 + 13, TYPE.caption, {color: '#C4BEB0'});
    const hx0 = 56, hx1 = W - 24, hy0 = y2 + 26, segs = 5, gap = 3, sw = (hx1 - hx0 - gap * (segs - 1)) / segs;
    for (let i = 0; i < segs; i++) {
      const x = hx0 + i * (sw + gap);
      const segHp = Math.max(0, Math.min(1, b.hp / 20 - i)), segTr = Math.max(0, Math.min(1, b.trail / 20 - i));
      ctx.fillStyle = 'rgba(14,24,38,.9)'; ctx.fillRect(x, hy0, sw, 7);
      ctx.fillStyle = '#F3EAD6'; ctx.fillRect(x, hy0, sw * segTr, 7);
      ctx.fillStyle = b.phase === 'rec' ? '#E6CD93' : '#B23A2B'; ctx.fillRect(x, hy0, sw * segHp, 7);
    }
    const tag = {idle: '对峙', warn: '预警', strike: '出招', rec: '收势', down: '力竭'}[b.phase];
    text(tag, W - 24, y2 + 13, TYPE.caption, {align: 'right', color: b.phase === 'warn' || b.phase === 'strike' ? '#FF9A8A' : b.phase === 'rec' ? '#E6CD93' : '#C4BEB0'});
    hudRect('敌将牌', 12, y2, W - 24, 40);
  }
  // 宝物槽：左侧竖列，Z1 顶部起，压在路边草地
  const slots = [['典', '孟德新书', true], ['器', '', false], ['骑', '赤兔', S.gotHorse]];
  let sy = L.P0 + 4;
  for (const [g1, nm, on] of slots) {
    panel(8, sy, 28, 28, {r: 6, fill: on ? 'rgba(138,102,48,.88)' : 'rgba(21,36,58,.7)', stroke: on ? '#E6CD93' : 'rgba(201,164,92,.4)'});
    text(g1, 22, sy + 14, TYPE.caption, {align: 'center', color: on ? '#FFF6DA' : '#87847C', layer: 'L7'});
    hudRect('宝物槽·' + g1, 8, sy, 28, 28); sy += 34;
  }
}
const MC = document.createElement('canvas').getContext('2d');
function measure(str, size, fam = FONT) { MC.font = `600 ${size}px ${fam}`; return MC.measureText(str).width; }

// ───────────────────────── 通告（L8） & 提示（Z4） ─────────────────────────
function drawNotice() {
  const b = S.boss; NOTICE = null;
  if (!b || !(b.phase === 'warn' || b.phase === 'strike')) return;
  const t = b.phase === 'warn' ? b.pt : BOSS_T.warn;
  const inK = Math.min(1, t / .2);
  const w = 56, h = 200, x = L.W - w * inK, y = Math.max(L.Z2[0], L.Z2[0] + (L.Z2[1] - L.Z2[0] - h) * .5);
  ctx.save(); roundRect(x, y, w + 8, h, 6); ctx.fillStyle = 'rgba(122,36,25,.94)'; ctx.fill(); ctx.strokeStyle = '#E6CD93'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#E6CD93'; ctx.fillRect(x + 6, y + 8, 2, h - 16); ctx.restore();
  vtext('吕布', x + w / 2 + 3, y + 22, TYPE.title, {family: SERIF, weight: 900, color: '#FFF6DA', layer: 'L8'});
  vtext('横扫', x + w / 2 + 3, y + 70, TYPE.body, {color: '#FFD7C8', layer: 'L8'});
  // 方向箭头：指向目标带
  const side = b.band[0] < -.5 ? '◀ 左路' : b.band[1] > .5 ? '右路 ▶' : '中路';
  text(side.replace(/[◀▶ ]/g, ''), x + w / 2 + 3, y + h - 40, TYPE.caption, {align: 'center', color: '#FFE6A6', layer: 'L8'});
  const k = Math.min(1, t / BOSS_T.warn);
  ctx.save(); ctx.fillStyle = 'rgba(14,24,38,.8)'; ctx.fillRect(x + 12, y + h - 22, w - 16, 6); ctx.fillStyle = '#FF9A8A'; ctx.fillRect(x + 12, y + h - 22, (w - 16) * k, 6); ctx.restore();
  NOTICE = {x, y, w: w + 8, h};
}
let NOTICE = null, TOASTR = null;
function drawToast() {
  TOASTR = null; const t = S.toast; if (!t) return;
  const a = Math.min(1, t.t / .12) * (1 - Math.max(0, t.t - 1.35) / .25);
  const col = {good: '#2F66A3', bad: '#7A2419', gold: '#8A6630', info: '#2C3E4A'}[t.kind];
  const w = Math.min(280, measure(t.str, TYPE.body) + 36), h = 32, x = (L.W - w) / 2, y = L.Z4[0] + 8;
  ctx.save(); ctx.globalAlpha = a; roundRect(x, y, w, h, 16); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = 'rgba(230,205,147,.6)'; ctx.stroke();
  text(t.str, L.W / 2, y + h / 2, TYPE.body, {align: 'center', color: '#F5EFE2', layer: 'L8'}); ctx.restore();
  TOASTR = {x, y, w, h};
}

// ───────────────────────── 分区覆盖（调试） ─────────────────────────
function drawZones() {
  const Z = [['Z1 远景预告', L.Z1, '#6FA3D8'], ['Z2 决策区', L.Z2, '#E6CD93'], ['Z3 己方部曲', L.Z3, '#3E8C7A'], ['Z4 提示', L.Z4, '#B23A2B']];
  ctx.save();
  ctx.fillStyle = 'rgba(178,58,43,.12)'; ctx.fillRect(0, 0, L.W, L.hudBottom);
  for (const [n, [a, b], c] of Z) { ctx.strokeStyle = c; ctx.setLineDash([5, 4]); ctx.lineWidth = 1; ctx.strokeRect(1, a, L.W - 2, b - a); text(n, L.W - 8, a + 9, TYPE.caption, {kind: 'debug', align: 'right', color: c, layer: 'DBG'}); }
  ctx.setLineDash([]); ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(0, L.heroY); ctx.lineTo(L.W, L.heroY); ctx.stroke();
  text('HUD 底 ' + Math.round(L.hudBottom), 8, L.hudBottom - 8, TYPE.caption, {kind: 'debug', color: '#FF9A8A', layer: 'DBG'});
  ctx.restore();
}

// ───────────────────────── 帧 ─────────────────────────
let LABELS_DRAWN = [];
function render() {
  TXT = []; LABELS = []; LABELS_DRAWN = [];
  ctx.save();
  if (S.shake > 0) ctx.translate((rnd() - .5) * 6 * S.shake, (rnd() - .5) * 4 * S.shake);
  drawBackdrop(); drawGround(); drawWorld(); drawWaves();
  // L6 世界标签（高于特效）
  for (const l of LABELS) {
    if (l.kind === 'gate') drawGateLabel(l);
    else if (l.kind === 'crate') drawCrateLabel(l);
    else if (l.kind === 'troop') drawTroopLabel(l);
    else if (l.kind === 'boss') drawBossLabel(l);
  }
  for (const f of S.fx) if (f.k === 'crit') { const p = proj(f.x, f.z); ctx.save(); ctx.globalAlpha = 1 - f.t / f.life; text('−' + f.v, p.x + 30, p.y - 60 * p.s * 2 - f.t * 30, NUM.delta, {kind: 'delta', family: NUMF, weight: 800, color: '#FFE6A6', stroke: 'rgba(60,20,10,.9)', strokeW: 3, layer: 'L6'}); ctx.restore(); }
  ctx.restore();
  if (S.redFlash > 0) { const g = ctx.createRadialGradient(L.W / 2, L.H / 2, L.W * .3, L.W / 2, L.H / 2, L.H * .7); g.addColorStop(0, 'rgba(178,58,43,0)'); g.addColorStop(1, `rgba(178,58,43,${S.redFlash * .55})`); ctx.fillStyle = g; ctx.fillRect(0, 0, L.W, L.H); }
  drawHUD(); drawNotice(); drawToast();
  if (showZones) drawZones();
}

// ───────────────────────── 自检报告 ─────────────────────────
function inter(a, b) { return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h; }
function report() {
  const v = [];
  // 1 HUD 不进入 Z1（宝物槽除外，须位于路面以外）
  for (const r of HUDR) {
    if (r.name.startsWith('宝物槽')) {
      const z = L.zAt(r.y + r.h); const s = L.c / (z + L.c); const roadLeft = L.cx - 1.05 * L.ppu * s;
      if (r.x + r.w > roadLeft) v.push(`${r.name} 压到路面 (右缘 ${r.x + r.w | 0} > 路左 ${roadLeft | 0})`);
      if (r.y < L.hudBottom) v.push(`${r.name} 与 HUD 行交叠`);
    } else if (r.y + r.h > L.hudBottom + .5) v.push(`${r.name} 底 ${r.y + r.h} 越过 HUD 底 ${L.hudBottom}`);
  }
  for (let i = 0; i < HUDR.length; i++) for (let j = i + 1; j < HUDR.length; j++) if (inter(HUDR[i], HUDR[j])) v.push(`HUD 交叠：${HUDR[i].name} × ${HUDR[j].name}`);
  // 2 通告不压 HUD，位于 Z2–Z3
  if (NOTICE) { for (const r of HUDR) if (inter(NOTICE, r)) v.push('预警竖幅压到 ' + r.name); if (NOTICE.y < L.Z2[0] - .5 || NOTICE.y + NOTICE.h > L.Z3[1]) v.push('预警竖幅越出 Z2–Z3'); }
  // 3 提示条在 Z4 且在底部安全区之上
  if (TOASTR && (TOASTR.y < L.Z4[0] || TOASTR.y + TOASTR.h > L.H - L.bottom)) v.push('提示条越出 Z4 安全范围');
  // 4 字号
  const sizes = {};
  for (const t of TXT) {
    if (t.layer === 'OS' || t.layer === 'DBG') continue;
    (sizes[t.kind] = sizes[t.kind] || new Set()).add(t.size);
    const ok = t.kind === 'gate' ? (t.size >= NUM.gateMin && t.size <= NUM.gateMax) : (ALLOWED[t.kind] || []).includes(t.size);
    if (!ok) v.push(`字号越阶：「${t.str}」${t.size}（${t.kind}）`);
    if (t.layer === 'L6' && t.kind === 'gate' && zoneOf(t.y + t.h / 2) === 1) v.push(`门数字出现在 Z1：「${t.str}」`);
  }
  // 5 世界标签互相遮挡
  const wl = TXT.filter(t => t.layer === 'L6' && (t.kind === 'gate'));
  let ov = 0; for (let i = 0; i < wl.length; i++) for (let j = i + 1; j < wl.length; j++) if (inter(wl[i], wl[j])) ov++;
  if (ov) v.push(`门数字互相遮挡 ${ov} 处`);
  const cn = TXT.filter(t => t.kind === 'crateName');
  for (const a of [...cn, ...LABELS_DRAWN]) for (const b of wl) if (inter(a, b)) v.push(`箱子标签与门数字「${b.str}」重叠`);
  const tr = TXT.filter(t => t.kind === 'troop');
  for (const a of tr) for (const b of wl) if (inter(a, b)) v.push(`部曲人数与门数字「${b.str}」重叠`);
  // 6 主将锚点位于 Z3
  if (!(L.heroY > L.Z3[0] && L.heroY < L.Z3[1])) v.push('主将锚点不在 Z3');
  const r = {size: `${L.W}×${L.H}`, hudBottom: L.hudBottom, zones: {Z1: L.Z1.map(Math.round), Z2: L.Z2.map(Math.round), Z3: L.Z3.map(Math.round), Z4: L.Z4.map(Math.round)}, heroY: Math.round(L.heroY),
    zAtZ1Z2: +L.zZ12.toFixed(1), fontSizes: Object.fromEntries(Object.entries(sizes).map(([k, s]) => [k, [...s].sort((a, b) => a - b)])), violations: v};
  return r;
}
window.__layoutReport = report;

// ───────────────────────── 自动演示（录屏用） ─────────────────────────
let auto = null;
function setAuto(fn) { auto = fn; }

// ───────────────────────── UI 绑定 ─────────────────────────
let sizeKey = '390×844', dpr = Math.min(2, window.devicePixelRatio || 1) || 1;
function applySize() {
  L = layout(SIZES[sizeKey]);
  dpr = window.__forceDpr || Math.max(2, window.devicePixelRatio || 1);
  cv.width = L.W * dpr; cv.height = L.H * dpr; cv.style.width = L.W + 'px'; cv.style.height = L.H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function buttons(id, entries, cur, on) {
  const el = document.getElementById(id); el.innerHTML = '';
  for (const [k, lab] of entries) { const b = document.createElement('button'); b.textContent = lab; b.dataset.k = k; if (k === cur()) b.className = 'on'; b.onclick = () => { on(k); buttons(id, entries, cur, on); }; el.appendChild(b); }
}
function setState(k) { newWorld(k); if (k === 'general') S.heroX = S.targetX = -.4; }
function setWeapon(k) { S.weapon = k; S.atkT = 0; S.waves = S.waves.filter(w => w.boss); }
function jumpWall() { if (S.state !== 'normal') setState('normal'); const target = 74 - 26; while (S.dist < target) step(DT); }
function refreshUI() {
  buttons('states', Object.entries(STATES), () => S.state, k => { setState(k); refreshUI(); });
  buttons('weapons', WORDER.map(k => [k, WEAPONS[k].label]), () => S.weapon, k => { setWeapon(k); refreshUI(); });
  buttons('sizes', Object.keys(SIZES).map(k => [k, SIZES[k].label]), () => sizeKey, k => { sizeKey = k; applySize(); refreshUI(); });
  buttons('speeds', [['1', '1×'], ['.5', '0.5×'], ['.25', '0.25× 慢放']], () => String(speedScale), k => { speedScale = +k; refreshUI(); });
}
function assetList() {
  const el = document.getElementById('assetList'); el.innerHTML = '';
  const rows = [...USED.entries()].sort((a, b) => (a[1].gen === b[1].gen ? 0 : a[1].gen ? 1 : -1));
  for (const [name, u] of rows) {
    const li = document.createElement('li');
    const newWanted = u.want && u.want.startsWith('g_');
    if (!u.key) { li.className = 'miss'; li.textContent = `${name}：缺，程序占位`; }
    else if (newWanted && !u.gen) { li.className = 'miss'; li.textContent = `${name}：新图未到，暂用旧图 ${u.key}`; }
    else if (u.gen) { li.className = 'ok'; li.textContent = `${name}：新生成`; }
    else li.textContent = `${name}：沿用现有 ${u.key}`;
    el.appendChild(li);
  }
}
window.__assetStatus = () => [...USED.entries()].map(([n, u]) => ({name: n, key: u.key, gen: u.gen, want: u.want}));

// 拖动
let drag = null;
cv.addEventListener('pointerdown', e => { drag = {x0: e.clientX, t0: S.targetX}; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', e => { if (!drag) return; S.targetX = Math.max(-.82, Math.min(.82, drag.t0 + (e.clientX - drag.x0) / (L.ppu * .85))); });
cv.addEventListener('pointerup', () => drag = null);
window.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') S.targetX = Math.max(-.82, S.targetX - .25); if (e.key === 'ArrowRight') S.targetX = Math.min(.82, S.targetX + .25); if (e.key === ' ') { paused = !paused; document.getElementById('pause').checked = paused; } });
document.getElementById('zones').onchange = e => showZones = e.target.checked;
document.getElementById('compan').onchange = e => companionsOn = e.target.checked;
document.getElementById('pause').onchange = e => paused = e.target.checked;
document.getElementById('toWall').onclick = () => { jumpWall(); refreshUI(); };
document.getElementById('restart').onclick = () => { setState(S.state); };

let acc = 0, last = 0, repT = 0, external = false;
function frame(ts) {
  if (!external) {
    const dt = Math.min(.1, (ts - last) / 1000 || 0); last = ts;
    if (!paused) { acc += dt * speedScale; while (acc >= DT) { step(DT); acc -= DT; } }
    render();
    if ((repT += dt) > .5) { repT = 0; const r = report(); document.getElementById('report').textContent = JSON.stringify(r, null, 1); assetList(); }
    requestAnimationFrame(frame);
  }
}

// 录屏/截图接口（确定性步进）
window.__preview = {
  setSize(k) { sizeKey = k; applySize(); },
  setState, setWeapon, jumpWall,
  setX(x) { S.targetX = x; },
  setCompanions(v) { companionsOn = v; },
  setZones(v) { showZones = v; },
  external(v) { external = v; if (!v) requestAnimationFrame(frame); },
  advance(sec) { const n = Math.round(sec / DT); for (let i = 0; i < n; i++) step(DT); render(); },
  render, get S() { return S; }, get L() { return L; }, setAuto,
};

loadAll().then(() => {
  applySize(); newWorld('normal'); refreshUI(); render();
  const q = new URLSearchParams(location.search);
  if (q.get('size') && SIZES[q.get('size')]) { sizeKey = q.get('size'); applySize(); }
  if (q.get('state')) setState(q.get('state'));
  if (q.get('weapon')) setWeapon(q.get('weapon'));
  if (q.get('zones')) { showZones = true; document.getElementById('zones').checked = true; }
  refreshUI();
  window.__ready = true;
  requestAnimationFrame(frame);
});
})();
