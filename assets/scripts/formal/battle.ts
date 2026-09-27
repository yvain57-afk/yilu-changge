// @ts-nocheck
/** Port of approved preview state and projection to the real Cocos scene.
 * Native renderer is injected; no DOM, Canvas, demo lineup, autopilot or debug progression.
 * Source provenance: docs/BATTLE-PREVIEW-20260926/preview.js. */
import {WEAPON_DATA,PEOPLE,TREASURES,CHAPTERS,TUNING,routeFor} from './data';
import {MANIFEST} from './manifest';
export function createBattle(options){
const M=MANIFEST;const IMG=Object.fromEntries(Object.keys(M.sheets).map(k=>[k,k]));function tinted(k,color){return {sheet:M.frames[k].s,frame:k,tint:color};}let ctx=options.renderer;let activeSource='hero';const ledger=[];const totals={damage:0,gate:0,troops:0};
function record(kind,source,target,amount){if(totals[kind]!==undefined)totals[kind]+=amount;ledger.push({tick:Math.round((S?.t||0)*60),kind,source,target,amount});if(ledger.length>1200)ledger.shift();}
function bossWeapon(){const id=CHAPTERS[options.chapter].boss;const w=Object.values(WEAPON_DATA).find(w=>w.owner===id);return w?.label||'兵阵';}
function gateHit(e,source){if(e.fixed||e.passed||e.d-S.dist<=0||e.d-S.dist>TUNING.gateHitWindow)return;e.val=Math.min(TUNING.gateSafetyLimit,e.val+TUNING.gateHitStep);e.flip=.15;record('gate',source,e.id,1);}
function extraSupport(dt){if(S.ended||!S.support.id||S.support.id==='hua')return;const sp=S.support;sp.cd=Math.max(0,sp.cd-dt);if(sp.cd>0)return;sp.cd=12;sp.uses++;sp.flash=1;const id=sp.id;activeSource='support';if(['diao','xun','sunjian'].includes(id)){addTroops(2,'support');toast(PEOPLE[id]+' · 鼓舞 +2','good');}else{wave({k:'f2_bladeWave',x:S.heroX,z:.5,speed:40,range:40,hw:.5,pierce:6,dmg:4,h:.4,wide:2});toast(PEOPLE[id]+' · 策应','gold');}const res=resonance(S.weapon);if(res.state==='on'&&res.who===id&&!S.resUsed[id]){S.resUsed[id]=true;S.resFlash=1.2;wave({k:'f2_bladeWave',x:S.heroX,z:.5,speed:50,range:45,hw:.6,pierce:99,dmg:9,h:.5,wide:2.2});record('resonance',id,'team',1);}record('support',id,'team',1);}
// ───────────────────────── 尺寸与分区 ─────────────────────────
const SIZES = {
  '360×640': {W: 360, H: 640, top: 20, bottom: 0, label: '360×640 小屏'},
  '390×844': {W: 390, H: 844, top: 47, bottom: 34, label: '390×844 基准'},
  '430×932': {W: 430, H: 932, top: 59, bottom: 34, label: '430×932 大屏'},
  '360×780': {W: 360, H: 780, top: 24, bottom: 16, label: '360×780 窄长屏'},
  '375×667': {W: 375, H: 667, top: 20, bottom: 0, label: '375×667 矮屏'},
};
const TYPE = {caption: 12, body: 14, title: 16};           // 唯一字号阶
const NUM = {gateMin: 18, gateMax: 28, troop: 24, delta: 20}; // 数字（BMFont 规格）
const ALLOWED = {crateName: [12], ui: [12, 14, 16], gate: 'range', troop: [24], delta: [20], debug: [12], seal: [48]};
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

const has = k => !!(k && M.frames[k]);
const pick = (...ks) => ks.find(has) || null;
const USED = new Map(); // 逻辑名 → {key, gen}
function use(logical, ...ks) { const k = pick(...ks); USED.set(logical, {key: k, gen: !!(k && k.startsWith('g_')), want: ks[0]}); return k; }

function drawFrame(k,x,y,h,o={}){return ctx.frame(k,x,y,h,o);}
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
  const r = {str, size, kind, x: bx, y: y - size / 2, w, h: size, layer: o.layer || 'L7', claim: !!o.claim};
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
// 预览实现：兵器本体参数为 1 阶基准，局内阶级由 S.tier 决定（1–3，满阶 3）。数值均为调试初值。
const WEAPONS=WEAPON_DATA;
const TIER_MAX = 3;
const TIER_DMG = [1, 1.35, 1.75];         // 调试初值（Cocos 旧 TIER_FACTORS 为 1/1.2/1.4，接入时以数值表为准）
const TIER_CN = ['', '壹', '贰', '叁'];
// 人物（仅本预览用到的）

const WORDER = ['spear', 'guandao', 'shemao', 'huaji'];
const GEN_BODY = .80; // 生成表整帧含高举兵器，躯干约占 80%
function heroFrames(w) {
  if(has('g_hero_'+w+'_run')){const pre='g_hero_'+w+'_';return {run:[pre+'run0',pre+'run1',pre+'run2',pre+'run3'],wind:pre+'wind',rel:pre+'rel',rec:pre+'rec',show:pre+'rec'};}
  w=WEAPONS[w].family;
  const R = (n, ...fb) => [0, 1, 2, 3].map(i => use(`主将·${n}·跑${i + 1}`, `g_run_${w}${i}`, ...fb));
  const base = {
    spear:   {run: R('长枪', 'heroSpearWalk0'), wind: use('主将·长枪·蓄势', 'g_spearWind', 'f2_spearWindup'), rel: use('主将·长枪·出招', 'g_spearRel', 'f2_spearRelease'), rec: use('主将·长枪·收势', 'g_spearRec', 'f2_spearRecover')},
    guandao: {run: R('偃月刀', 'g_guandaoRun'), wind: use('主将·偃月刀·蓄势', 'g_guandaoWind', 'f2_bladeWindup'), rel: use('主将·偃月刀·出招', 'g_guandaoRel', 'f2_bladeRelease'), rec: use('主将·偃月刀·收势', 'g_guandaoRec', 'f2_bladeRecover')},
    shemao:  {run: R('蛇矛', 'g_shemaoRun'), wind: use('主将·蛇矛·蓄势', 'g_shemaoWind', 'f2_spearWindup'), rel: use('主将·蛇矛·出招', 'g_shemaoRel', 'f2_spearRelease'), rec: use('主将·蛇矛·收势', 'g_shemaoRec', 'f2_spearRecover')},
    huaji:   {run: R('画戟', 'g_huajiRun'), wind: use('主将·画戟·蓄势', 'g_huajiWind', 'f2_zhaoWindup'), rel: use('主将·画戟·出招', 'g_huajiRel', 'f2_zhaoRelease'), rec: use('主将·画戟·收势', 'g_huajiRec', 'f2_zhaoRecover')},
  }[w];
  base.show = use('主将·' + WEAPONS[w].label + '·亮兵', 'g_brandish_' + w, base.rec);
  // 参考身高：同一兵器所有帧共用一个参考高，躯干大小不随帧变化。
  // 生成帧：有 rh（切片时按行记录的站姿高）用 rh，否则用该兵器旧跑步帧高；×GEN_BODY 去掉高举兵器的余量。
  base.ref = k => {
    const f = k && M.frames[k]; if (!f) return 158;
    if (k.startsWith('g_')) { const run = M.frames['g_' + w + 'Run']; return (f.rh || (run ? run.r[3] : f.r[3])) * GEN_BODY; }
    return k.startsWith('f2_') ? 205 : 158;
  };
  return base;
}
// ───────────────────────── 世界状态 ─────────────────────────
let S = null;
const STATES = {normal: '正常战斗', dense: '密集连续门', general: '敌将交锋'};
const UNIT = {hero: .50, soldier: .37, companion: .44, general: .66, gateH: .98, crate: .40};
const WALL_AT = 80;

// 演示阵容（预览夹具，跨进度；不是新存档默认值）：随军 2 人 + 支援 1 人，宝物 3 类槽。
const TREASURE=TREASURES;
const SLOT_CN = {dian: '典', qi: '器', ma: '骑'};
const ARMS = {bow: {label: '弓', dmg: 1, burst: 1, splash: 0}, fire: {label: '火箭', dmg: 1.5, burst: 1, splash: .16}, repeater: {label: '连弩', dmg: 1.5, burst: 3, splash: .16}};
const ARMS_NEXT = {bow: 'fire', fire: 'repeater', repeater: null};
const BASE_TROOPS = 30;
const MOVE = {vmax: 3.0, chitu: 1.25};    // 横移最大速度（世界单位/秒），赤兔 ×1.25；调试初值
const SUPPORT = {cd: 12, delay: 1.0, share: .30}; // 华佗：减员 1 秒后救回 30%，冷却 12 秒；调试初值

function newWorld(state) {
  seed = 7;
  const L0 = options.lineup;
  S = {state, t: 0, dist: 0, speed: state === 'general' ? 0 : 11, heroX: -.45, targetX: -.45, heroV: 0,
    weapon:'spear',tier:1,
    atkT: 0, atkN: 0, troops: BASE_TROOPS, troopShown: BASE_TROOPS, deltas: [], ents: [], waves: [], arrows: [], fx: [], toasts: [], toast: null,
    shake: 0, redFlash: 0, hitStop: 0, courseLen: 0, nextSpawn: 0, boss: null, stage: '第'+(options.chapter+1)+'关 · '+CHAPTERS[options.chapter].place, progress: 0,
    companions: L0.companions.map((id, i) => ({id, dx: i ? -.30 : .30, t: i ? .9 : .3, pose: 0, fired: true})),
    support: {id: L0.support, cd: 0, pending: null, uses: 0},
    slots: {dian: {id: L0.treasures.dian, st: L0.treasures.dian?'worn':'empty', n: 0, flash: 0}, qi: {id: L0.treasures.qi, st: L0.treasures.qi?'worn':'empty', n: 0, flash: 0, used: false}, ma: {id: L0.treasures.ma, st: L0.treasures.ma ? 'worn' : 'empty', n: 0, flash: 0}},
    runGot: [], storage: [],
    arms: 'bow', volleyT: 1.0, volleyPose: 0, burstLeft: 0, burstT: 0,
    resUsed: {}, resFlash: 0, chipFlash: 0, pipFlash: -1, pipT: 0, show: 0, seal: null,
    stats: {bossStrikes: 0, dodged: 0, hitTaken: 0, volleys: 0, arrowsHit: 0, taiping: 0, supportSaved: 0, crates: {}},
    scen: [], wall: null, bumped: 0, ended: false, ctrl: 'manual', log: []};
  // 传国玉玺：开局兵力 +20%，每局 1 次（开局即结算，槽显示“已用”）
  if (S.slots.qi.id === 'yuxi') {
    const add = Math.round(BASE_TROOPS * .2);
    S.troops += add; S.troopShown = S.troops; S.slots.qi.used = true; S.slots.qi.n = 1; S.slots.qi.flash = 1.2;
    logEv('treasure', '传国玉玺 开局 +' + add);
    toast('传国玉玺 · 开局兵力 +' + add, 'gold');
  }
  buildCourse();
  if (state === 'general') setupGeneral();
  return S;
}
function logEv(kind, msg) { S.log.push({t: +S.t.toFixed(2), kind, msg}); if (S.log.length > 60) S.log.shift(); }
// 共鸣：兵器本主在随军或支援位，或兵器属于已结盟的盟主（盟约共鸣，不需上阵）
function resonance(w) {
  const o = WEAPONS[w].owner; if (!o) return {state: 'none'};
  const deployed = S.companions.some(c => c.id === o) || S.support.id === o;
  if (deployed) return {state: 'on', who: o};
  if (options.lineup.allies.includes(o)) return {state: 'pact', who: o};
  return {state: 'off', who: o};
}

// 关卡片段（世界距离 d）
function buildCourse(){S.course=routeFor(options.chapter,options.lineup.weapons,options.lineup.treasurePool);S.courseLen=CHAPTERS[options.chapter].length;S.ci=0;S.lap=0;}
const SPAWN_Z=()=>Math.max(60,L.zP0*.82);
function spawnCourse(){while(S.ci<S.course.length&&S.course[S.ci].d<=S.dist+SPAWN_Z()){const e=S.course[S.ci++];spawn(e,e.d);}}
let EID = 1;
function spawn(e, d) {
  if(e.type==='cameo'){S.ents.push({id:EID++,type:'cameo',person:e.person,x:e.x,d});}
  else if(e.type==='officer'){S.ents.push({id:EID++,type:'enemy',elite:true,person:e.person,x:e.x,d,hp:12+options.chapter*2,walk:0,dead:0});}
  else if (e.type === 'squad') {
    for (let i = 0; i < e.n; i++) S.ents.push({id: EID++, type: 'enemy', x: e.x + (i % 3 - 1) * .2 + (rnd() - .5) * .06, d: d + Math.floor(i / 3) * 1.1, hp: 1, walk: rnd(), dead: 0});
  } else if (e.type === 'crate') {
    const hp = {grain: 6, weapon: 10, arms: 8, treasure: 14}[e.kind];
    const gives = e.gives === 'same' || (S.lap > 0 && e.kind === 'weapon') ? S.weapon : e.gives; // 第二圈起兵器匣只升阶，不回退兵器
    S.ents.push({id: EID++, type: 'crate', kind: e.kind, gives, x: e.x, d, hp, max: hp, open: 0, hitT: 0});
  } else if (e.type === 'gates') {
    e.vals.forEach((v, i) => S.ents.push({id: EID++, type: 'gate', x: i ? .5 : -.5, d, val: v, fixed:!!e.fixed&&v===1,passed: false, flip: 0, miss: 0}));
  } else if (e.type === 'wall') {
    S.ents.push({id: EID++, type: 'wall', x: 0, d, len: e.len, side: e.side || 1});
  }
}
function setupGeneral() {
  S.progress=1;S.speed=0;S.state='general';
  S.boss = {name: PEOPLE[CHAPTERS[options.chapter].boss], person:CHAPTERS[options.chapter].boss,weapon: bossWeapon(),z:17,hp:CHAPTERS[options.chapter].bossHP,max:CHAPTERS[options.chapter].bossHP,trail:CHAPTERS[options.chapter].bossHP, phase: 'idle', pt: 0, band: [-1, 0], hit: 0, cycleN: 0, down: 0, flags: 4, flagFx: []};
  S.minT = 1.5;
}

// ───────────────────────── 主循环 ─────────────────────────
const DT = 1 / 60;
let speedScale = 1, paused = false, showZones = false, companionsOn = true;
function step(dt) {
  if(S.ended)return;
  if (S.hitStop > 0) { S.hitStop -= dt; return; }
  S.t += dt;
  
  // 横移：追随拖动目标，但受最大横移速度限制（赤兔 ×1.25，本局生效）
  const vmax = MOVE.vmax * (S.slots.ma.id === 'chitu' ? MOVE.chitu : 1);
  const want = (S.targetX - S.heroX) * 14;
  const v = Math.max(-vmax, Math.min(vmax, want));
  S.heroV = v; S.heroX += v * dt;
  // 墙段夹持：固定墙（低木栅）只挡人马，占据半幅路面，经过期间只能走另一半；刀气与箭矢照常越过
  const w = S.ents.find(e => e.type === 'wall' && e.d - S.dist < .4 && e.d + e.len - S.dist > -.4);
  S.inWall = !!w;
  if (w) {
    const lim = w.side * WALL.inner - w.side * .20;
    if (w.side > 0 && S.heroX > lim) { S.heroX = lim; S.bumped = .2; }
    if (w.side < 0 && S.heroX < lim) { S.heroX = lim; S.bumped = .2; }
  }
  S.heroX = Math.max(-.82, Math.min(.82, S.heroX));
  S.bumped = Math.max(0, S.bumped - dt);
  S.dist += S.speed * dt;
  if(S.state!=='general'){S.progress=Math.min(1,S.dist/S.courseLen);if(S.dist>=S.courseLen+5)setupGeneral();}
  spawnCourse();
  scenery(dt);
  if (!S.ended) { activeSource="hero";heroAttack(dt); activeSource="companion";if(companionsOn)companionsAttack(dt);activeSource="troop";troopVolley(dt); }
  // 部曲归零：本局失败，停止攻防，3 秒后重开当前状态（预览行为）
  if (S.troops <= 0 && !S.ended) { S.ended = true; S.routed = 0; S.waves = []; toast('部曲溃散 · 本局失败', 'bad'); logEv('run','战败，等待结算'); }
  
  if (S.boss && S.routed === undefined) bossStep(dt);
  updateEnts(dt);
  if(S.troops<=0){S.ended=true;S.routed=0;S.waves=[];S.arrows=[];return;}
  updateWaves(dt);
  updateArrows(dt);
  if(!S.ended)supportStep(dt);extraSupport(dt);
  S.fx = S.fx.filter(f => (f.t += dt) < f.life);
  S.deltas = S.deltas.filter(d => (d.t += dt) < .9);
  S.troopShown += (S.troops - S.troopShown) * Math.min(1, dt * 10);
  S.shake = Math.max(0, S.shake - dt * 3); S.redFlash = Math.max(0, S.redFlash - dt * 2.2);
  S.chipFlash = Math.max(0, S.chipFlash - dt); S.resFlash = Math.max(0, S.resFlash - dt); S.show = Math.max(0, S.show - dt);
  S.volleyPose = Math.max(0, S.volleyPose - dt); S.armsFlash = Math.max(0, (S.armsFlash || 0) - dt); S.pipT = Math.max(0, S.pipT - dt);
  for (const k in S.slots) S.slots[k].flash = Math.max(0, S.slots[k].flash - dt);
  if (S.seal) { S.seal.t += dt; if (S.seal.t > S.seal.life) S.seal = null; }
  toastStep(dt);
  
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
  if (S.show > 0) return ['show', 1 - S.show / .55];   // 取得兵器：亮兵 .55 秒，期间不出手
  if (t < W.wind) return ['wind', t / W.wind];
  if (t < W.wind + W.rel) return ['rel', (t - W.wind) / W.rel];
  if (t < W.wind + W.rel + W.rec) return ['rec', (t - W.wind - W.rel) / W.rec];
  return ['run', 0];
}
function heroAttack(dt) {
  if (S.show > 0) return;
  const W=WEAPONS[S.weapon],family=W.family,T=S.tier,D=TIER_DMG[T-1]*(1+((options.lineup.weaponLevels[S.weapon]||1)-1)*TUNING.weaponLevelDamage)*(resonance(S.weapon).state==='pact'?1.5:1);
  const prev = S.atkT; S.atkT += dt;
  const rel0 = W.wind;
  const crossed = t => prev < t && S.atkT >= t;
  const x = S.heroX;
  // 阶级差异（调试初值）：长枪 3 阶双枪气；偃月刀宽度 1.4/1.9/2.4；蛇矛 1/2/3 刺；画戟 直刺 → +侧扇 → +二段侧扇
  if (family === 'spear' && crossed(rel0)) {
    const xs = T >= 3 ? [x - .07, x + .07] : [x];
    for (const xx of xs) wave({k: 'f2_spearWave', x: xx, z: .5, speed: 62, range: 40 + 6 * T, hw: .12, pierce: T >= 2 ? 2 : 1, dmg: 3 * D, h: .40, color: W.color});
    fx('f2_muzzleFlash', x, .55, .22, .14);
  }
  if (family === 'guandao' && crossed(rel0)) {
    const wide = [1.4, 1.9, 2.4][T - 1];
    wave({k: 'f2_bladeWave', x, z: .6, speed: 36, range: 22, hw: wide * .23, pierce: 99, dmg: 7 * D, h: .46, wide, color: W.color, grow: .5});
    S.hitStop = .05; S.shake = .35;
    fx('arc', x, .2, .5, .22);
  }
  if (family === 'shemao') for (let i = 0; i < T; i++) if (crossed(rel0 + i * .10)) {
    const off = [-.05, .05, 0][i], sn = [1, -1, 1][i];
    wave({k: 'f2_spearWave', x: x + off, z: .5, speed: 74, range: 52, hw: .10, pierce: 3, dmg: 2 * D, h: .34, snake: sn, color: W.color});
    fx('f2_muzzleFlash', x, .55, .16, .1);
  }
  if (family === 'huaji' && crossed(rel0)) {
    wave({k: 'f2_spearWave', x, z: .5, speed: 56, range: 36, hw: .12, pierce: 2, dmg: 4 * D, h: .40, color: W.color});
    fx('f2_muzzleFlash', x, .55, .2, .12);
  }
  if (family === 'huaji' && T >= 2 && crossed(rel0 + .08)) wave({k: 'f2_axeWave', x, z: .7, speed: 28, range: 13, hw: .34, pierce: 99, dmg: 2 * D, h: .40, wide: 1.5, color: W.color});
  if (family === 'huaji' && T >= 3 && crossed(rel0 + .16)) wave({k: 'f2_axeWave', x, z: .9, speed: 30, range: 15, hw: .40, pierce: 99, dmg: 2 * D, h: .44, wide: 1.8, color: W.color, flipX: true});
  if (S.atkT >= W.cycle) { S.atkT -= W.cycle; S.atkN++; }
}
// 随军：每 1.5 秒一次，蓄 .15 → 出手（此刻发出攻击）→ 收 .2
const COMP = {zhao: {k: 'f2_spearWave', speed: 50, range: 30, hw: .09, dmg: 2, h: .26}, zhang: {k: 'f2_spearWave', speed: 60, range: 34, hw: .10, dmg: 2, h: .28, snake: 1}};
function companionsAttack(dt) {
  for (const c of S.companions) {
    c.t += dt;
    if (c.t > 1.5) { c.t = 0; c.pose = .35; c.fired = false; }
    c.pose = Math.max(0, c.pose - dt);
    if (!c.fired && c.pose <= .20) {
      c.fired = true;
      const P = COMP[c.id]||{k:"f2_spearWave",speed:50,range:30,hw:.1,dmg:2,h:.28}, x = S.heroX + c.dx;
      const res = resonance(S.weapon); const boosted = res.state === 'on' && res.who === c.id;
      // 本主共鸣：本局首次出手放一次专属大招（宽蛇行），之后出手伤害 ×1.5
      if (boosted && !S.resUsed[c.id]) {
        S.resUsed[c.id] = true; S.resFlash = 1.2;
        wave({k: 'f2_bladeWave', x, z: .3, speed: 40, range: 30, hw: .5, pierce: 99, dmg: 6, h: .5, wide: 2.2, color: '#F0D38A', grow: .3});
        for (const sn of [1, -1]) wave({k: 'f2_spearWave', x: x + sn * .06, z: .3, speed: 70, range: 50, hw: .12, pierce: 5, dmg: 3, h: .36, snake: sn});
        S.shake = .5; logEv('resonance', PEOPLE[c.id] + ' 共鸣技');
      } else wave({k: P.k, x, z: .2, speed: P.speed, range: P.range, hw: P.hw, pierce: 1, dmg: P.dmg * (boosted ? 1.5 : 1), h: P.h * (boosted ? 1.2 : 1), alpha: .85, snake: P.snake ? (S.atkN % 2 ? 1 : -1) * .6 : 0});
    }
  }
}
// 部曲齐射：士兵真的放箭（箭矢是实体，命中才生效）；军械箱改变的是部曲的武装，与主将兵器无关
function troopVolley(dt) {
  S.volleyT -= dt;
  const A = ARMS[S.arms];
  if (S.volleyT <= 0) { S.volleyT = 1.6; S.burstLeft = A.burst; S.burstT = 0; S.volleyPose = .5; S.stats.volleys++; }
  if (S.burstLeft > 0) {
    S.burstT -= dt;
    if (S.burstT <= 0) {
      S.burstLeft--; S.burstT = .12;
      const n = Math.min(8, Math.max(2, Math.ceil(S.troops / 5)));
      const tg = S.ents.filter(e => ((e.type === 'enemy' && !e.dead) || (e.type === 'crate' && !e.open)) && e.d - S.dist > 9 && e.d - S.dist < 30).sort((a, b) => a.d - b.d);
      const bossT = S.boss && S.boss.phase !== 'spent' && S.boss.phase !== 'yield' ? {x: 0, z: S.boss.z} : null;
      for (let i = 0; i < n; i++) {
        const e = tg[i % Math.max(1, tg.length)];
        const tx = e ? e.x + (rnd() - .5) * .08 : bossT ? (rnd() - .5) * .3 : S.heroX + (rnd() - .5) * .6;
        const sx = S.heroX + ((i % 4) - 1.5) * .17, sz = -.7 - Math.floor(i / 4) * .45;
        // 提前量：目标以相对速度 v 逼近，按飞行时间 dur = .5 + (tz − sz)·.012 反解落点
        const v = e ? S.speed + (e.type === 'enemy' ? 2.2 : 0) : 0, z0 = e ? e.d - S.dist : 0;
        const tz = e ? (z0 - .5 * v + .012 * v * sz) / (1 + .012 * v) : bossT ? bossT.z : 14 + rnd() * 6;
        const dur = .5 + (tz - sz) * .012;
        S.arrows.push({x: sx, z: sz, sx, sz, tx, tz, t: 0, dur, arms: S.arms, dmg: A.dmg, splash: A.splash, target: e ? e.id : bossT ? 'boss' : null});
      }
    }
  }
}
function updateArrows(dt) {
  for (const a of S.arrows) {
    a.t += dt; const k = Math.min(1, a.t / a.dur);
    a.x = a.sx + (a.tx - a.sx) * k; a.z = a.sz + (a.tz - a.sz) * k; a.hgt = Math.sin(k * Math.PI) * (.6 + (a.tz - a.sz) * .02);
    if (k >= 1 && !a.done) {
      a.done = true;
      const hitList = S.ents.filter(e => ((e.type === 'enemy' && !e.dead) || (e.type === 'crate' && !e.open)) && Math.abs(e.d - S.dist - a.z) < .9 && Math.abs(e.x - a.x) < .12 + a.splash);
      for (const e of hitList) { hitEnt(e, a.dmg, null); S.stats.arrowsHit++; }
      if (a.target === 'boss' && S.boss && !['spent', 'yield'].includes(S.boss.phase)) bossDamage(a.dmg * .5, a.x);
      if (a.arms !== 'bow') fx('burst', a.x, a.z, .2 + a.splash, .3);
    }
  }
  S.arrows = S.arrows.filter(a => !a.done || a.t < a.dur + .05);
}
function wave(o) {if(activeSource==='hero'){o.k='g_wave_'+WEAPONS[S.weapon].family;if(options.lineup.tactic==='zhenjun'){o.control=true;o.pierce=1;}}S.waves.push({source:activeSource,...o, z0: o.z, prevZ: o.z, t: 0, hits: new Set(), x0: o.x, alpha: o.alpha || 1}); }
function fx(k, x, z, h, life, extra = {}) { S.fx.push({k, x, z, h, life, t: 0, ...extra}); }
function updateWaves(dt) {
  for (const w of S.waves) {
    w.prevZ = w.z; w.z += w.speed * dt; w.t += dt;
    if (w.snake) w.x = w.x0 + w.snake * SNAKE.amp * Math.sin((w.z - w.z0) * SNAKE.k);
    if (w.boss) continue;
    const targets=S.ents.filter(e=>(e.type==='enemy'&&!e.dead)||(e.type==='crate'&&!e.open)||(e.type==='gate'&&!e.passed&&e.d-S.dist>0&&e.d-S.dist<=TUNING.gateHitWindow)).sort((a,b)=>a.d-b.d);
    for (const e of targets) {
      if (w.hits.has(e.id)) continue;
      const ez = e.d - S.dist;
      const ehw = e.type === 'crate' ? .2 : .1;
      if (ez >= w.prevZ - .5 && ez <= w.z + .3 && Math.abs(e.x - w.x) < w.hw + ehw) {
        w.hits.add(e.id);if(e.type==="gate")gateHit(e,w.source);else hitEnt(e,w.dmg,w);
        if (w.hits.size >= w.pierce) { w.spent = true; break; }
      }
    }
    if (S.boss && !['spent', 'yield'].includes(S.boss.phase) && !w.hits.has('boss') && w.z >= S.boss.z - .5 && Math.abs(w.x) < w.hw + .35) {
      w.hits.add('boss'); bossDamage(w.dmg, w.x);
      if (w.pierce < 99) w.spent = true;
    }
  }
  S.waves = S.waves.filter(w => !w.spent && (w.boss || w.z - w.z0 < w.range));
}
function bossDamage(dmg, x) {
  const b = S.boss; const mul = b.phase === 'rec' ? 2 : 1;
  const actual=Math.min(b.hp,dmg*mul*BOSS_DMG);b.hp-=actual;record("damage","boss-hit",b.person,actual);b.hit=.12;
  if (mul > 1 && dmg >= 2) b.bigHit = .22; // 收势中挨重击：切受创帧
  fx('f2_hitFlash', x * .5, b.z - .2, .28 * mul, .16);
  if (mul > 1) S.fx.push({k: 'crit', x: x * .4, z: b.z, life: .5, t: 0, v: Math.round(dmg * mul)});
  // 靠旗：每失 25% 血断一面，断旗从背后飘落
  const flags = Math.ceil(b.hp / b.max * 4);
  while (b.flags > flags) { b.flags--; b.flagFx.push({i: b.flags, t: 0}); logEv('boss', '靠旗断 余 ' + b.flags); }
}
// 开箱：状态在开箱这一刻改变，表现（飞入、闪光、亮兵、提示）随后播放
function hitEnt(e, dmg, w) {
  const actual=Math.min(Math.max(0,e.hp),dmg);e.hp-=actual;e.hitT=.12;record("damage",w?.source||"troop",e.id,actual);
  if(e.type==='enemy'&&e.hp>0&&w?.control){e.slow=.65;e.d+=1;record('control','zhenjun',e.id,.65);}
  const z = e.d - S.dist;
  fx('f2_hitFlash', e.x, z, e.type === 'crate' ? .3 : .22, .16);
  if (e.type === 'enemy' && e.hp <= 0 && !e.dead) { e.dead = .01; e.fallDir = e.x < S.heroX ? -1 : 1; }
  if (e.type === 'crate' && e.hp <= 0 && !e.open) { e.open = .01; openCrate(e); }
}
function openCrate(e) {
  S.stats.crates[e.kind] = (S.stats.crates[e.kind] || 0) + 1;
  const z = e.d - S.dist;
  if (e.kind === 'grain') { const n=S.slots.qi.id==='muniu'?9:6;addTroops(n);toast('粮车 · 援兵 +'+n,'good');logEv('crate','粮车 +'+n);return; }
  if (e.kind === 'weapon') return gainWeapon(e.gives, e.x, z);
  if (e.kind === 'arms') {
    const nx = ARMS_NEXT[S.arms];
    if (nx) { S.arms = nx; S.volleyT = Math.min(S.volleyT, .4); S.armsFlash = 1.2; toast('军械箱 · 部曲换装「' + ARMS[nx].label + '」', 'info'); logEv('arms', '部曲 → ' + ARMS[nx].label); }
    else { addTroops(4); toast('军械已满 · 化为援兵 +4', 'good'); logEv('arms', '已满 溢出 +4'); }
    fx('fly', e.x, z, .3, .5, {icon: null, to: 'arms'});
    return;
  }
  if (e.kind === 'treasure') {
    const T = TREASURE[e.gives], sl = S.slots[T.slot];
    fx('fly', e.x, z, .3, .6, {icon: T.icon, to: 'slot:' + T.slot});
    if (!S.runGot.includes(e.gives)) S.runGot.push(e.gives);
    if (sl.id === e.gives) { addTroops(4); toast(T.name + ' 本局已有 · 化为援兵 +4', 'good'); logEv('treasure', T.name + ' 重复 溢出'); }
    else if (sl.st === 'empty') { sl.id = e.gives; sl.st = 'trial'; sl.flash = 1.2; toast('宝匣 · ' + T.name + ' 本局试用', 'gold'); logEv('treasure', T.name + ' 本局试用'); }
    else { S.storage.push(e.gives); sl.flash = .8; toast('宝匣 · ' + T.name + ' · 结算入库', 'gold'); logEv('treasure', T.name + ' 入库（槽已佩戴）'); }
  }
}
function gainWeapon(k, x, z) {
  const W = WEAPONS[k];
  fx('fly', x, z, .3, .6, {icon: 'g_icon_' + k, to: 'chip'});
  S.show = .55; fx('ring', S.heroX, 0, .5, .6);
  if (k === S.weapon) {
    if (S.tier >= TIER_MAX) { addTroops(4); toast(W.label + ' 已满叁阶 · 化为援兵 +4', 'good'); logEv('weapon', W.label + ' 满阶 溢出 +4'); S.chipFlash = .5; return; }
    S.tier++; S.pipFlash = S.tier - 1; S.pipT = .8; S.chipFlash = .8;
    toast('兵器匣 · ' + W.label + ' 升至' + TIER_CN[S.tier] + '阶', 'gold'); logEv('weapon', W.label + ' → ' + S.tier + ' 阶');
  } else {
    const from = WEAPONS[S.weapon].label;
    S.weapon = k; S.atkT = 0; S.chipFlash = .8; S.pipFlash = -1;
    const r = resonance(k);
    if (r.state === 'on') {
      S.seal = {t: 0, life: .9, who: r.who}; S.resFlash = 1.2; /* Once per owner per run; swapping never resets the special. */
      toast('神兵归主 · ' + W.label + ' × ' + PEOPLE[r.who], 'gold'); logEv('weapon', from + ' → ' + W.label + '（共鸣 ' + PEOPLE[r.who] + '）');
    } else {
      toast('兵器匣 · 换用' + W.label + (r.state === 'off' ? ' · 本主' + PEOPLE[r.who] + '未随军' : ''), 'info');
      logEv('weapon', from + ' → ' + W.label + (r.state === 'off' ? '（本主未随军）' : ''));
    }
  }
}
function footXs(){const n=Math.min(12,Math.round(S.troops/3)),xs=[S.heroX,...S.companions.map(c=>S.heroX+c.dx)];for(let i=0;i<n;i++)xs.push(S.heroX+((i%4)-1.5)*.17+(Math.floor(i/4)%2)*.08);return xs.map(x=>wallSafeX(x));}
function wallSafeX(x){const wall=S.ents.find(e=>e.type==='wall'&&e.d-S.dist<.4&&e.d+e.len-S.dist>-.4);return Math.max(-.95,Math.min(.95,wall?(wall.side>0?Math.min(x,-.10):Math.max(x,.10)):x));}
function addTroops(n, src) {
  const before=S.troops;S.troops=Math.max(0,Math.min(999999,S.troops+n));record("troops",src||"event","team",S.troops-before);if(S.troops===0&&S.slots.qi.id==="qixing"&&!S.slots.qi.used){S.troops=5;S.slots.qi.used=true;record("revive","qixing","team",5);toast("七星灯 · 留住 5 人","gold");}
  const last = S.deltas[S.deltas.length - 1];
  if (last && last.t < .3 && Math.sign(last.v) === Math.sign(n) && !src) { last.v += n; last.t = 0; } else S.deltas.push({v: n, t: 0, src});
  // 华佗（支援位）：减员事件触发，冷却中不触发
  if (n < 0 && S.support.id === 'hua' && S.support.cd <= 0 && !S.support.pending) S.support.pending = {loss: -n, t: SUPPORT.delay};
  else if (n < 0 && S.support.pending) S.support.pending.loss += -n;
}
function supportStep(dt) {
  const sp = S.support; sp.cd = Math.max(0, sp.cd - dt);
  if (sp.pending) {
    sp.pending.t -= dt;
    if (sp.pending.t <= 0) {
      const back = Math.max(1, Math.round(sp.pending.loss * (SUPPORT.share+(S.slots.dian.id==="qingnang"?.1:0))));
      sp.pending = null; sp.cd = SUPPORT.cd; sp.uses++; S.stats.supportSaved += back; sp.flash = 1;
      addTroops(back, 'hua'); toast('华佗 · 救回伤兵 +' + back, 'good'); logEv('support', '华佗 +' + back);
    }
  }
  sp.flash = Math.max(0, (sp.flash || 0) - dt);
}

// ───────────────────────── 实体更新 ─────────────────────────
// 门：数字不会在未结算前消失；结算那一刻数字飞向兵力牌（claim），未入门的一侧淡出（miss）。连续 +1 门各自独立结算。
function updateEnts(dt) {
  for (const e of S.ents) {
    const z = e.d - S.dist;
    if(e.type==='cameo'&&!e.announced&&z<28){e.announced=true;const name=PEOPLE[e.person]||({xing:'邢道荣',chen:'陈应',yang:'杨龄'}[e.person]);toast(name+(e.person==='lubu'?'率亲兵观阵 · 此役不交手':' · 荆州旧将观阵'),'info');logEv('cameo',name+'观阵');}
    if (e.type === 'enemy') {
      if (!e.dead) {
        e.slow=Math.max(0,(e.slow||0)-dt);e.d -= dt * (e.elite && S.boss && S.boss.phase === 'yield' ? -3 : e.slow>0?1.1:2.2); e.walk += dt * 2.6; e.hitT = Math.max(0, (e.hitT || 0) - dt);
        if (z < .35 && z > -.4 && footXs().some(x=>Math.abs(e.x-x)<.10) && !(S.boss && S.boss.phase === 'yield')) { e.dead = .01; e.fallDir = e.x < S.heroX ? -1 : 1; addTroops(-1); S.redFlash = Math.max(S.redFlash, .25); logEv('contact', '敌兵接触 −1'); }
      } else e.dead += dt;
    }
    if (e.type === 'crate') { e.hitT = Math.max(0, e.hitT - dt); if (e.open) e.open += dt; }
    if (e.type === 'gate' && !e.passed && z <= 0) {
      e.passed = true;
      const inside = Math.abs(S.heroX - e.x) < .46;
      if (inside) {
        e.claim=.01;let v=e.val,extra=0;if(v<0&&S.slots.dian.id==="mengde"&&S.t>= (S.bookReady||0)){v=Math.ceil(v/2);S.bookReady=S.t+20;S.slots.dian.flash=.8;record("treasure","mengde",e.id,v);}
        // 太平要术（典籍）：通过援兵门时额外 +10%（至少 +1），调试初值
        if (v > 0 && S.slots.dian.id === 'taiping') { extra = Math.max(1, Math.round(v * .1)); S.stats.taiping += extra; S.slots.dian.flash = .8; S.slots.dian.n++; }
        addTroops(v, 'gate'); if (extra) addTroops(extra, 'taiping');
        S.stats.gates = (S.stats.gates || 0) + 1;
        toast(v > 0 ? `援兵 +${v}` + (extra ? ` · 太平要术 +${extra}` : '') : v < 0 ? `伏兵 ${v}` : '空营 · 无增减', v > 0 ? 'good' : v < 0 ? 'bad' : 'info');
        logEv('gate', (v > 0 ? '援兵门 +' : v < 0 ? '伏兵门 ' : '空营门 ') + v + (extra ? ' 太平 +' + extra : ''));
        if (v < 0) S.redFlash = .4;
      } else e.miss = .01;
    }
    if (e.claim) e.claim += dt;
    if (e.miss) e.miss += dt;
  }
  S.ents = S.ents.filter(e => {
    const z = e.d - S.dist;
    if (e.type === 'wall') return e.d + e.len - S.dist > -6;
    if (e.type === 'enemy' && e.dead > 1.0) return false;
    if (e.type === 'enemy' && e.elite && z > 40) return false;
    if (e.type === 'crate' && e.open > 1.2) return false;
    if (e.type === 'gate' && (e.claim > .6 || e.miss > .5)) return false;
    return z > -4;
  });
}

// ───────────────────────── 敌将 ─────────────────────────
// 对峙 → 预警 → 出招 → 收势 循环；血尽 → 力竭（spent）→ 收服（yield）。收服后战斗结束，不再重置。
const BOSS_DMG = .30; // 敌将承伤系数（调试初值）：约三轮攻防后力竭
const BOSS_T = {idle: 1.1, warn: 1.2, strike: .45, rec: 1.5, spent: 1.4};
function bossStep(dt) {
  const b = S.boss; b.pt += dt; b.hit = Math.max(0, b.hit - dt); b.bigHit = Math.max(0, (b.bigHit || 0) - dt);
  b.trail += (b.hp - b.trail) * Math.min(1, dt * (b.trail > b.hp + .5 && b.trailWait <= 0 ? 3 : 0));
  b.trailWait = (b.trailWait || 0) - dt; if (b.hit > .1) b.trailWait = .4;
  for (const f of b.flagFx) f.t += dt; b.flagFx = b.flagFx.filter(f => f.t < 1.4);
  const next = p => { b.phase = p; b.pt = 0; };
  if (b.hp <= 0 && !['spent', 'yield'].includes(b.phase)) {
    next('spent'); S.waves = S.waves.filter(w => !w.boss);
    toast(b.name+' 力竭','gold'); logEv('boss', '力竭');
  }
  if (b.phase === 'idle' && b.pt > BOSS_T.idle) {
    next('warn');
    const side = S.heroX < -.15 ? -1 : S.heroX > .15 ? 1 : 0;
    b.band = side < 0 ? [-1, -.02] : side > 0 ? [.02, 1] : [-.5, .5];
    b.cycleN++; S.stats.bossStrikes++;
    logEv('boss', '预警 ' + (side < 0 ? '左' : side > 0 ? '右' : '中'));
  } else if (b.phase === 'warn' && b.pt > BOSS_T.warn) {
    next('strike');
    S.waves.push({boss: true, k: 'f2_bladeWave', x: (b.band[0] + b.band[1]) / 2, z: b.z - .6, z0: b.z, prevZ: b.z, speed: -40, t: 0, hits: new Set(), x0: 0, alpha: 1, hw: (b.band[1] - b.band[0]) / 2, h: .5, wide: (b.band[1] - b.band[0]) * 1.4, range: 99, dmg: 0, pierce: 0});
    S.shake = .5;
  } else if (b.phase === 'strike' && b.pt > BOSS_T.strike) next('rec');
  else if (b.phase === 'rec' && b.pt > BOSS_T.rec) next('idle');
  else if (b.phase === 'spent' && b.pt > BOSS_T.spent) {
    next('yield'); S.ended = true; S.seal={t:0,life:2.2,who:b.person,ch:CHAPTERS[options.chapter].allies.includes(b.person)?'盟':CHAPTERS[options.chapter].visit.includes(b.person)?'访':CHAPTERS[options.chapter].capture.includes(b.person)?'降':'胜'};
    b.flagFx.push({i: -1, t: 0, white: true});
    toast(b.name+' · '+(CHAPTERS[options.chapter].capture.includes(b.person)?'已收服':'胜利'),'gold'); logEv('boss', '收服');
  }
  // 敌将刀气（向主将）；判定在刀气到达主将深度的一帧
  for (const w of S.waves) if (w.boss) {
    if (!w.hitDone && w.z <= .2) {
      w.hitDone = true; w.spent = true;
      let inBand=S.heroX>b.band[0]-.05&&S.heroX<b.band[1]+.05;if(inBand&&S.slots.ma.id==="dilu"&&S.t>=(S.mountReady||0)){const edge=Math.min(Math.abs(S.heroX-b.band[0]),Math.abs(S.heroX-b.band[1]));if(edge<=.15){S.heroX=S.targetX=Math.max(-.82,Math.min(.82,Math.abs(S.heroX-b.band[0])<Math.abs(S.heroX-b.band[1])?b.band[0]-.16:b.band[1]+.16));inBand=S.heroX>b.band[0]-.05&&S.heroX<b.band[1]+.05;if(!inBand){S.mountReady=S.t+15;record("treasure","dilu","team",1);}}}
      if (inBand) { S.stats.hitTaken++; addTroops(-10); S.redFlash = .8; S.shake = 1; toast('中招 · 兵力 −10', 'bad'); logEv('boss', '中招 −10'); }
      else { S.stats.dodged++; toast('闪开横扫 · 趁收势反击', 'good'); logEv('boss', '闪开'); }
    }
  }
  // 吕布亲兵（精兵，2 血）；收服时转身退走
  S.minT -= dt;
  if (S.minT <= 0 && !['spent', 'yield'].includes(b.phase)) { S.minT = 3.2; const x = rnd() < .5 ? -.5 : .5; for (let i = 0; i < 3; i++) S.ents.push({id: EID++, type: 'enemy', elite: true, x: x + (i - 1) * .18, d: S.dist + b.z - 1.5 - i * .5, hp: 2, walk: rnd(), dead: 0}); }
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
function drawBackdrop(){ctx.backdrop(L,S);}
function drawGround(){ctx.ground(L,S);}
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
  const h = (s.fence ? .36 : s.k === 'tower' ? 1.25 : s.k === 'rocks' ? .45 : s.k === 'granary' ? .8 : .72) * L.ppu * p.s;
  const k = s.fence ? use('场景·木栅', 'g_juma', 'palisade') : use('场景·' + s.k, 'g_' + s.k, s.k);
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
  if(e.type==='cameo'){const p=proj(e.x,z),names={xing:'邢道荣',chen:'陈应',yang:'杨龄'},keys={xing:'bossXingWalk0',chen:'bossChenWalk0',yang:'bossYangWalk0'},key=e.person==='lubu'?'g_lubuIdle':keys[e.person];drawFrame(key,p.x,p.y,.5*L.ppu*p.s,{refH:M.frames[key].bh||M.frames[key].r[3]});if(zoneOf(p.y)>1)text((PEOPLE[e.person]||names[e.person])+' · 观阵',p.x,p.y-.58*L.ppu*p.s,11,{align:'center',color:'#F1D49C'});}
}
function drawGate(e, z) {
  const kind = e.val > 0 ? 'plus' : e.val < 0 ? 'minus' : 'zero';
  const C = GATE_COL[kind];
  const pl = proj(e.x - .44, z), pr = proj(e.x + .44, z), pc = proj(e.x, z);
  if (pc.y < L.P0 - 10) return;
  const s = pc.s, u = L.ppu * s;
  const H = UNIT.gateH * u;
  const post = use('辕门·立柱', 'g_gatePost0', 'gatePost');
  const beam = use('辕门·横梁', 'g_beam', 'g_rail');
  const bannerK = use('辕门·' + C.sub + '旗', C.band, C.fb);
  const fade = Math.min(1, Math.max(.3, (pc.y - L.P0) / 40));
  ctx.save(); ctx.globalAlpha = fade;
  if (e.claim) ctx.globalAlpha *= Math.max(0, 1 - e.claim * 2.2);
  if (e.miss) ctx.globalAlpha *= Math.max(0, 1 - e.miss * 2);
  shadow(pl.x, pl.y, .16 * u); shadow(pr.x, pr.y, .16 * u);
  // 旗面（悬于横梁下）
  const bw = .64 * u, bh = .50 * u, by = pc.y - H + .10 * u;
  const bf = M.frames[bannerK];
  let rect = null;
  if (bf) {
    const sc = bw / bf.r[2];
    rect = {x: pc.x - bw / 2, y: by, w: bw, h: Math.min(bf.r[3] * sc, bh * 1.25)};
    ctx.drawImage(IMG[bf.s], bf.r[0], bf.r[1], bf.r[2], bf.r[3], rect.x, rect.y, rect.w, rect.h);
  }
  if (beam) { const f = M.frames[beam]; const bwid = .98 * u; const bh2 = f.r[3] * bwid / f.r[2]; ctx.drawImage(IMG[f.s], ...f.r, pc.x - bwid / 2, pc.y - H - bh2 * .35, bwid, bh2); }
  drawFrame(post, pl.x, pl.y, H * 1.02); drawFrame(post, pr.x, pr.y, H * 1.02);
  ctx.restore();
  // 数字 → L6（高于特效）
  if (rect) LABELS.push({kind: 'gate', zone: zoneOf(rect.y + rect.h * .42), x: pc.x, y: rect.y + rect.h * .42, u, C, val: e.val, rect, z, e});
}
// 门数字：未结算前一直可读——逼近部曲时停靠在兵力牌上方（不隐藏）；
// 结算时，入选一侧的数字飞进兵力牌（与 +N 飘字同一时刻），未入选一侧原地淡出。
let GATE_STAT = {unsettledHidden: 0, docked: 0};
function drawGateLabel(l) {
  const e = l.e;
  if (!e.passed && l.zone === 1) return; // Z1 只看旗色
  if (e.lu == null) { e.lx = l.x; e.ly = l.y; e.lu = l.u; e.lw = l.rect.w; } // 未经渲染即结算（快进）时的兜底
  const size = Math.round(Math.max(NUM.gateMin, Math.min(NUM.gateMax, (e.passed ? e.lu : l.u) * .21)));
  const sub = (e.passed ? e.lw : l.rect.w) >= 64;
  const str = l.val > 0 ? '+' + l.val : l.val < 0 ? '−' + (-l.val) : '0';
  let x = l.x, y = l.y, a = 1, sc = 1;
  if (!e.passed) {
    const dockY = (S.troopY ?? L.heroY) - 15 - 8 - size / 2 - (sub ? 18 : 0);
    if (y > dockY) { y = dockY; GATE_STAT.docked++; }
    e.lx = x; e.ly = y; e.lu = l.u; e.lw = l.rect.w;
  } else if (e.claim) {
    const k = Math.min(1, e.claim / .35), q = k * k;
    x = e.lx + ((S.troopX ?? x) - e.lx) * q; y = e.ly + ((S.troopY ?? y) - e.ly) * q; sc = 1 - .45 * q; a = k < .8 ? 1 : 1 - (k - .8) / .2;
    if (e.claim > .35) return;
  } else if (e.miss) { x = e.lx; y = e.ly - e.miss * 20; a = Math.max(0, 1 - e.miss / .3); if (a <= 0) return; }
  if (a < .5 && !e.passed) GATE_STAT.unsettledHidden++;
  ctx.save(); ctx.globalAlpha = a;
  const sz = Math.max(NUM.gateMin, Math.round(size * sc));
  text(str, x, y, sz, {kind: 'gate', family: NUMF, weight: 800, align: 'center', color: l.C.num, stroke: l.C.stroke, strokeW: 4, layer: 'L6', claim: !!e.claim || !!e.miss});
  if (sub && !e.claim) text(l.C.sub, x, y + size * .5 + 10, TYPE.caption, {kind: 'ui', align: 'center', color: l.C.num, stroke: l.C.stroke, strokeW: 3, layer: 'L6'});
  ctx.restore();
}

// —— 门箱 ——（造型区分：粮车 / 兵器匣 / 军械箱 / 宝匣；名牌写明开出什么）
const CRATE = {grain: ['g_grainCart', 'boxTroops', '粮车', .46], weapon: ['g_weaponCase', 'boxEquipment', '兵器匣', .36], arms: ['g_arrowCrate', 'boxChain', '军械箱', .44], treasure: ['g_treasureBox', 'boxCompanion', '宝匣', .34]};
function crateContent(e) {
  if (e.kind === 'weapon') return {icon: 'g_icon_' + e.gives, str: e.gives === S.weapon ? '升阶' : WEAPONS[e.gives].label};
  if (e.kind === 'treasure') return {icon: TREASURE[e.gives].icon, str: TREASURE[e.gives].name};
  if (e.kind === 'arms') { const nx = ARMS_NEXT[S.arms]; return {icon: null, str: nx ? '换' + ARMS[nx].label : '援兵'}; }
  return {icon: null, str: '援兵 +6'};
}
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
  if (e.open && e.open < .5 && r) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - e.open * 2; const g = ctx.createRadialGradient(p.x, r.y + r.h * .4, 2, p.x, r.y + r.h * .4, r.w * .8); g.addColorStop(0, 'rgba(255,230,166,.9)'); g.addColorStop(1, 'rgba(255,230,166,0)'); ctx.fillStyle = g; ctx.fillRect(p.x - r.w, r.y - r.h * .4, r.w * 2, r.h * 1.6); ctx.restore(); }
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
  if (l.zone >= 2) {
    const c = crateContent(l.e), str = l.name + '·' + c.str, tw = measure(str, TYPE.caption) + (c.icon ? 16 : 0);
    const tx = l.x - tw / 2 + (c.icon ? 16 : 0);
    if (c.icon && has(c.icon)) { ctx.save(); roundRect(l.x - tw / 2 - 2, y - 20, 16, 16, 3); ctx.fillStyle = 'rgba(14,24,38,.85)'; ctx.fill(); ctx.restore(); drawFrame(c.icon, l.x - tw / 2 + 6, y - 12, 13, {center: true}); }
    text(str, tx, y - 12, TYPE.caption, {kind: 'crateName', color: l.e.kind === 'treasure' ? '#FFE6A6' : '#F3EAD6', stroke: 'rgba(14,24,38,.85)', strokeW: 3, layer: 'L6'});
  }
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

// —— 敌兵 ——（新帧：行进两帧 / 受击 / 倒地；吕布亲兵为精兵服色）
const BODY = {hero: .52, soldier: .34, elite: .37, companion: .42, general: .61}; // 躯干高（世界单位），按帧 bh 缩放
function drawEnemy(e,z){if(e.person&&has('g_front_'+e.person+'Run0')){const p=proj(e.x,z),key='g_front_'+e.person+(e.dead||e.hitT>0?'Hurt':Math.floor(e.walk)%2?'Run1':'Run0');drawFrame(key,p.x,p.y,.46*L.ppu*p.s,{refH:M.frames[key].bh,alpha:e.dead?Math.max(0,1-e.dead):1});if(zoneOf(p.y)>1)text(PEOPLE[e.person]||e.person,p.x,p.y-.5*L.ppu*p.s,12,{align:'center',color:'#FFCCC0',stroke:'#3c1814'});return;}
  const p = proj(e.x, z); if (p.y < L.P0 - 10) return;
  const u = L.ppu * p.s, pre = e.elite ? 'g_elite' : 'g_red', cn = e.elite ? '吕布亲兵' : '敌兵';
  const walk = [use(cn + '·行进1', pre + 'Walk0', 'redWalk0'), use(cn + '·行进2', pre + 'Walk1', 'redWalk1')];
  const hitK = use(cn + '·受击', pre + 'Hit', 'redHurt'), fallK = use(cn + '·倒地', pre + 'Fallen', 'redHurt');
  let k = walk[Math.floor(e.walk * 2) % 2], alpha = 1, flip = false;
  if (e.dead) { k = e.dead < .18 ? hitK : fallK; flip = e.fallDir > 0; alpha = Math.max(0, 1 - Math.max(0, e.dead - .55) / .45); }
  else if (e.hitT > 0) k = hitK;
  if (e.elite && S.boss && S.boss.phase === 'yield' && !e.dead) { alpha = Math.max(0, 1 - (S.boss.pt || 0) / 1.6); }
  const f = M.frames[k];
  shadow(p.x, p.y, (e.dead && e.dead >= .18 ? .36 : .22) * u);
  ctx.save(); ctx.globalAlpha = alpha;
  const H = (e.elite ? BODY.elite : BODY.soldier) * u;
  const r = drawFrame(k, p.x, p.y, H, {refH: f && f.bh ? f.bh : 134, flip});
  if (e.hitT > 0 && !e.dead && r) { ctx.globalAlpha = e.hitT * 5; drawFrame(k, p.x, p.y, H, {refH: f && f.bh ? f.bh : 134, tint: '#fff', comp: 'lighter'}); }
  ctx.restore();
}

// —— 主将 + 随军 + 部曲 ——
const OLD_RUN_BODY = {guandao: 260, shemao: 253, huaji: 268}; // 旧生成帧（无 bh）按同兵器旧跑步帧躯干高缩放
function heroRef(k) {
  const f = M.frames[k]; if (!f) return 147;
  if (f.bh) return f.bh;
  if (k.startsWith('g_')) return OLD_RUN_BODY[S.weapon] || f.r[3] * .85;
  return k.startsWith('f2_') ? 190 : 147;
}
function drawArrows() {
  for (const a of S.arrows) {
    if (a.done) continue;
    const k = Math.min(1, a.t / a.dur), k2 = Math.min(1, k + .04);
    const x2 = a.sx + (a.tx - a.sx) * k2, z2 = a.sz + (a.tz - a.sz) * k2, h2 = Math.sin(k2 * Math.PI) * (.6 + (a.tz - a.sz) * .02);
    const p = proj(a.x, a.z), q = proj(x2, z2);
    const A = {x: p.x, y: p.y - a.hgt * L.ppu * p.s}, B = {x: q.x, y: q.y - h2 * L.ppu * q.s};
    if (A.y < L.P0) continue;
    const ang = Math.atan2(B.y - A.y, B.x - A.x), len = Math.max(6, 16 * p.s);
    ctx.save(); ctx.translate(A.x, A.y); ctx.rotate(ang);
    if (a.arms !== 'bow') { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,150,60,.55)'; ctx.beginPath(); ctx.ellipse(len * .5, 0, len * .55, 3 * p.s + 1.5, 0, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
    ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = Math.max(1, 1.6 * p.s); ctx.beginPath(); ctx.moveTo(-len * .5, 0); ctx.lineTo(len * .5, 0); ctx.stroke();
    ctx.fillStyle = a.arms === 'bow' ? '#DDE6F0' : '#FFB25A'; ctx.beginPath(); ctx.moveTo(len * .5 + 4 * p.s + 2, 0); ctx.lineTo(len * .5, -2.2 * p.s - 1); ctx.lineTo(len * .5, 2.2 * p.s + 1); ctx.fill();
    ctx.fillStyle = '#E6CD93'; ctx.fillRect(-len * .5, -1.5, 3, 3);
    ctx.restore();
  }
}
function drawHeroGroup() {
  const hx = S.heroX;
  const cyc = S.speed > 0 ? S.dist * .9 : S.t * 7;
  // 部曲（身后，背向镜头的弓手）：齐射时 张弓 → 放箭
  const n = Math.min(12, Math.round(S.troopShown / 3));
  const slots = [];
  for (let i = 0; i < n; i++) { const row = Math.floor(i / 4), col = i % 4; slots.push({x: hx + (col - 1.5) * .17 + (row % 2) * .08, z: -.7 - row * .45}); }
  slots.sort((a, b) => b.z - a.z);
  const aw = [use('己方弓手·行进1', 'g_archerWalk0', 'blueWalk0'), use('己方弓手·行进2', 'g_archerWalk1', 'blueWalk1')];
  const aDraw = use('己方弓手·张弓', 'g_archerDraw', 'blueWalk0'), aRel = use('己方弓手·放箭', 'g_archerRel', 'blueWalk1');
  for (const s of slots) {
    const p = proj(wallSafeX(s.x),s.z);
    shadow(p.x, p.y, .18 * L.ppu * p.s);
    const k = S.volleyPose > .28 ? aDraw : S.volleyPose > 0 ? aRel : aw[Math.floor(cyc * 1.6 + s.x * 9) & 1];
    const f = M.frames[k];
    drawFrame(k, p.x, p.y, BODY.soldier * L.ppu * p.s, {refH: f && f.bh ? f.bh : 129});
  }
  // 随军二将：跑动两帧 / 蓄势 / 出手；与当前兵器共鸣时脚下金环
  const res = resonance(S.weapon);
  for (const c of S.companions) {
    const nm = PEOPLE[c.id], pre = 'g_' + c.id;
    const run = [use('随军·' + nm + '·跑1', pre + 'Run0', 'zhaoWalk0'), use('随军·' + nm + '·跑2', pre + 'Run1', 'zhaoWalk1')];
    const wind = use('随军·' + nm + '·蓄势', pre + 'Wind',pre+'Run1',pre+'Run0','zhaoAttack'), thr = use('随军·' + nm + '·出手', pre + 'Thrust', 'zhaoAttack');
    const p = proj(wallSafeX(hx+c.dx),-.35);
    const k=companionsOn&&c.pose>.20?wind:companionsOn&&c.pose>0?thr:run[Math.floor(cyc*1.4+c.dx*5)&1];
    shadow(p.x, p.y, .24 * L.ppu * p.s);
    if (res.state === 'on' && res.who === c.id) { ctx.save(); ctx.strokeStyle = `rgba(159,224,184,${.55 + .35 * S.resFlash})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p.x, p.y, .17 * L.ppu * p.s, .05 * L.ppu * p.s, 0, 0, 7); ctx.stroke(); ctx.restore(); }
    const f = M.frames[k];
    drawFrame(k, p.x, p.y, BODY.companion * L.ppu * p.s, {refH: f && f.bh ? f.bh : 152});
  }
  // 主将：四帧跑步（按行进距离推进）/ 蓄势 / 出招 / 收势 / 亮兵（取得兵器时）
  const F = heroFrames(S.weapon);
  const [ph, pr] = heroPhase();
  const p = proj(hx, 0);
  let k = ph === 'run' ? F.run[Math.floor(cyc * 1.7) % 4] || F.run[0] : F[ph];
  let ref=heroRef(k);const mounted=S.slots.ma.id;if(mounted){k='g_ride_'+mounted+'_'+(ph==='run'?'run'+(Math.floor(cyc*1.7)%2):ph==='wind'?'wind':ph==='rel'?'rel':'run0');ref=M.frames[k]?.bh||ref;}
  const runBob = ph === 'run' ? Math.abs(Math.sin(cyc * 1.7 * Math.PI / 2)) * 1.5 : 0;
  const lunge = ph === 'rel' ? -6 * Math.sin(pr * Math.PI) : ph === 'wind' ? 2 * pr : ph === 'show' ? -3 * Math.sin(pr * Math.PI) : 0;
  shadow(p.x, p.y, .30 * L.ppu);
  // 坐骑（赤兔 / 的卢）：只做徽记与尘土，不做骑乘形象（预览实现）
  const mount = S.slots.ma.id;
  if (mount && Math.abs(S.heroV) > .4) for (let i = 0; i < 3; i++) { const q = proj(hx - Math.sign(S.heroV) * (.12 + i * .08), -.05 - i * .04); ctx.save(); ctx.fillStyle = `rgba(190,160,110,${.28 - i * .07})`; ctx.beginPath(); ctx.ellipse(q.x, q.y - 3, (7 + i * 4) * q.s * 1.5, (3 + i) * q.s * 1.5, 0, 0, 7); ctx.fill(); ctx.restore(); }
  ctx.save(); ctx.strokeStyle = mount ? 'rgba(242,165,122,.8)' : 'rgba(230,205,147,.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(p.x, p.y, .2 * L.ppu, .055 * L.ppu, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  const bump = S.bumped > 0 ? Math.sin(S.bumped * 60) * 2 : 0;
  const H=(mounted?.90:BODY.hero)*L.ppu;
  const r = drawFrame(k, p.x + bump, p.y - runBob + lunge, H, {refH: ref});
  if (ph === 'show' && r) { ctx.save(); ctx.globalAlpha = .5 * (1 - pr); drawFrame(k, p.x + bump, p.y + lunge, H, {refH: ref, tint: '#FFE6A6', comp: 'lighter'}); ctx.restore(); }
  if(mounted){const ik='g_icon_'+S.weapon,handX=p.x+(ph==='run'?.13:.16)*L.ppu,handY=p.y-(ph==='run'?.59:.79)*L.ppu;drawFrame(ik,handX,handY,(['spear','guandao','shemao','huaji'].includes(S.weapon)?.56:.34)*L.ppu,{center:true,rot:ph==='rel'?.55:ph==='wind'?-.2:.9});}S.heroRect = r;
  // 部曲兵力牌 → L6：固定在主将躯干上方
  const ty = p.y - H - 26; LABELS.push({kind: 'troop', x: p.x, y: ty}); S.troopY = ty; S.troopX = p.x;
}
function drawTroopLabel(l) {
  const x = l.x, y = l.y;
  const str = String(Math.round(S.troopShown));
  ctx.save(); ctx.font = `800 ${NUM.troop}px ${NUMF}`; const mount = S.slots.ma.id;
  const w = Math.max(36, ctx.measureText(str).width + 18) + (mount ? 16 : 0);
  roundRect(x - w / 2, y - 15, w, 30, 5); ctx.fillStyle = 'rgba(21,36,58,.86)'; ctx.fill(); ctx.strokeStyle = '#E6CD93'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#2F66A3'; ctx.fillRect(x - w / 2 + 3, y - 12, 4, 24);
  ctx.restore();
  if (mount) { const ic = use('坐骑徽记·' + TREASURE[mount].name, TREASURE[mount].icon); if (ic) drawFrame(ic, x - w / 2 + 17, y, 18, {center: true}); }
  text(str, x + 3 + (mount ? 8 : 0), y + 1, NUM.troop, {kind: 'troop', family: NUMF, weight: 800, align: 'center', color: '#F5EFE2', layer: 'L6'});
  // 部曲武装签（弓 / 火箭 / 连弩）：兵力牌左侧，换装时闪金
  const A = ARMS[S.arms], aw = measure(A.label, TYPE.caption) + 12, ax = x - w / 2 - 4 - aw;
  ctx.save(); roundRect(ax, y - 10, aw, 20, 4); ctx.fillStyle = S.armsFlash > 0 ? `rgba(138,102,48,${.6 + .3 * Math.sin(S.armsFlash * 20)})` : 'rgba(21,36,58,.8)'; ctx.fill(); ctx.strokeStyle = 'rgba(201,164,92,.6)'; ctx.stroke(); ctx.restore();
  text(A.label, ax + aw / 2, y, TYPE.caption, {kind: 'ui', align: 'center', color: S.arms === 'bow' ? '#DCCBA6' : '#FFC98A', layer: 'L6'});
  S.armsTag = {x: ax + aw / 2, y};
  let j = 0;
  for (const d of S.deltas) {
    if (d.t < 0) continue;
    const a = 1 - Math.max(0, d.t - .5) / .4;
    ctx.save(); ctx.globalAlpha = a;
    const col = d.src === 'taiping' ? '#FFE6A6' : d.src === 'hua' ? '#9FE0B8' : d.v > 0 ? '#9FD7FF' : '#FF9A8A';
    text((d.v > 0 ? '+' : '−') + Math.abs(d.v), x + w / 2 + 6, y - 4 - d.t * 26 - j * 22, NUM.delta, {kind: 'delta', family: NUMF, weight: 800, color: col, stroke: 'rgba(14,24,38,.9)', strokeW: 3, layer: 'L6'});
    ctx.restore(); j++;
  }
}

// —— 敌将 ——
function drawBossDecal() {
  const b = S.boss;
  const p = proj(0, b.z);
  const u = L.ppu * p.s;
  const w=1.4*u,h=.13*u;drawFrame('g_platform',p.x,p.y+.24*u,.85*u);
  // 预警地面：目标带
  if (b.phase === 'warn' || b.phase === 'strike') {
    const [l, r] = b.band; const zA = b.z - .6, zB = -1.2;
    const A = proj(l, zA), B = proj(r, zA), C = proj(r, zB), D = proj(l, zB);
    const pulse = b.phase === 'warn' ? .22 + .18 * Math.sin(b.pt * 16) : .5;
    ctx.save(); ctx.fillStyle = `rgba(178,58,43,${pulse})`; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(C.x, C.y); ctx.lineTo(D.x, D.y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,190,170,.8)'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]); ctx.stroke();
    if (b.phase === 'warn') { const k = Math.min(1, b.pt / BOSS_T.warn); const zc = zA + (zB - zA) * k; const E = proj(l, zc), F = proj(r, zc); ctx.setLineDash([]); ctx.strokeStyle = '#FFD7C8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(E.x, E.y); ctx.lineTo(F.x, F.y); ctx.stroke(); }
    ctx.restore();
  }
  if (b.phase === 'rec') { // 破绽
    ctx.save(); ctx.strokeStyle = `rgba(230,205,147,${.5 + .4 * Math.sin(b.pt * 10)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(p.x, p.y - h * .6, w * .42, w * .15, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
}
const FLAG_DX = [-.13, -.05, .05, .13];
function drawBoss() {
  const b = S.boss; const p = proj(0, b.z); const u = L.ppu * p.s; const top = p.y - .13 * u * .6;
  const K = {idle: use('吕布·立定', 'g_lubuIdle', 'bossYangWalk0'), warn: use('吕布·蓄势(预警)', 'g_lubuWind', 'bossYangWalk1'), strike: use('吕布·横扫(出招)', 'g_lubuStrike', 'bossYangAttack'), rec: use('吕布·收势(破绽)', 'g_lubuRec', 'bossYangHurt'),
    spent: use('吕布·力竭', 'g_lubuSpent', 'g_lubuDown'), yield: use('吕布·收服(献戟)', 'g_lubuYield', 'g_lubuDown')};
  const hitK = use('吕布·重击受创', 'g_lubuHit', 'g_lubuRec');
  if(b.person!=='lubu'){for(const phase of Object.keys(K))K[phase]='g_boss_'+b.person+'_'+(['spent','yield'].includes(phase)?'spent':phase==='strike'?'strike':phase==='warn'?'wind':phase==='rec'?'rec':'idle');}
  let k = K[b.phase];
  if(b.bigHit>0&&(b.phase==='idle'||b.phase==='rec'))k=b.person==='lubu'?hitK:'g_boss_'+b.person+'_hit';
  const f = M.frames[k];
  const flagK = use('将台·帅旗', 'g_warBanner'); const drumK = use('将台·战鼓', 'g_warDrum');
  const whiteK = use('吕布·白旗(收服)', 'g_flagWhite'), intactK = use('吕布·靠旗', 'g_flagIntact'), tornK = use('吕布·断旗', 'g_flagTorn');
  // 帅旗：收服时倒下淡出，改插白旗
  if (flagK) {
    if (b.phase !== 'yield') drawFrame(flagK, p.x - .62 * u, p.y, 1.1 * u);
    else { const k2 = Math.min(1, b.pt / .6); ctx.save(); ctx.globalAlpha = 1 - k2; drawFrame(flagK, p.x - .62 * u, p.y, 1.1 * u, {rot: -k2 * 1.2}); ctx.restore(); }
  }
  if(b.phase==='yield'&&CHAPTERS[options.chapter].capture.includes(b.person)&&whiteK) { const k2 = Math.min(1, b.pt / .5); drawFrame(whiteK, p.x - .62 * u, p.y, .9 * u * k2, {refH: M.frames[whiteK].r[3]}); }
  if (drumK) drawFrame(drumK, p.x + .6 * u, p.y, .34 * u);
  const shake = b.hit > 0 ? Math.sin(b.hit * 80) * 2 : 0;
  const H = f && f.bh ? BODY.general * u : UNIT.general * u / .9;
  const refH = f && f.bh ? f.bh : (M.frames[K.idle] ? M.frames[K.idle].r[3] : 202);
  // 背后靠旗：四面，余血每 25% 一面；站立类姿态才画在背后
  const upright = ['idle', 'warn', 'rec', 'strike'].includes(b.phase) && k !== hitK;
  if (upright && intactK) for (let i = 0; i < b.flags; i++) drawFrame(intactK, p.x + FLAG_DX[i] * u + shake, top - .50 * u, .26 * u, {rot: FLAG_DX[i] * 1.6});
  const r = drawFrame(k, p.x + shake, top, H, {refH});
  if (b.hit > 0 && r) { ctx.save(); ctx.globalAlpha = b.hit * 4; drawFrame(k, p.x + shake, top, H, {refH, tint: '#fff', comp: 'lighter'}); ctx.restore(); }
  // 断旗飘落
  if (tornK) for (const ff of b.flagFx) { if (ff.white || ff.i < 0) continue; const k2 = ff.t / 1.4; ctx.save(); ctx.globalAlpha = 1 - k2 * .8; drawFrame(tornK, p.x + FLAG_DX[ff.i] * u + k2 * .3 * u * Math.sign(FLAG_DX[ff.i]), top - .50 * u + k2 * .55 * u, .26 * u, {rot: FLAG_DX[ff.i] * 1.6 + k2 * 2.2 * Math.sign(FLAG_DX[ff.i])}); ctx.restore(); }
  if (r) LABELS.push({kind: 'boss', x: p.x, y: r.y - 4, zone: zoneOf(p.y)});
}
function drawBossLabel(l) {
  const b = S.boss;
  if (b.phase === 'rec') text('破绽 ×2', l.x, l.y - 8, TYPE.body, {kind: 'ui', align: 'center', color: '#FFE6A6', stroke: 'rgba(14,24,38,.9)', strokeW: 3, layer: 'L6'});
  if (b.phase === 'spent') text('力竭', l.x, l.y - 8, TYPE.body, {kind: 'ui', align: 'center', color: '#E6CD93', stroke: 'rgba(14,24,38,.9)', strokeW: 3, layer: 'L6'});
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
    ctx.save();ctx.globalAlpha=.10+.35*k;drawFrame('g_snakeTrail',b.x,b.y,Math.max(5,(5+7*k)*b.s),{center:true,rot:Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2});ctx.restore();ctx.strokeStyle = `rgba(240,211,138,${(.08 + .35 * k).toFixed(3)})`; ctx.lineWidth = Math.max(1.5, (2 + 7 * k) * b.s);
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
    if (f.k === 'crit' || f.k === 'fly') continue;
    if (f.k === 'ring') { // 取得兵器：主将脚下金环扩散
      const p = proj(S.heroX, 0), u = L.ppu;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#FFE6A6'; ctx.lineWidth = 3 * (1 - k) + 1;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, (.2 + k * .45) * u, (.06 + k * .13) * u, 0, 0, 7); ctx.stroke();
      ctx.globalAlpha = (1 - k) * .5; ctx.fillStyle = '#FFE6A6'; ctx.fillRect(p.x - 2, p.y - BODY.hero * u * 1.3 * (1 - k * .3), 4, BODY.hero * u * 1.3 * (1 - k * .3)); ctx.restore(); continue;
    }
    if (f.k === 'burst') { // 火箭落点
      const p = proj(f.x, f.z), u = L.ppu * p.s;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - k;
      const gr = ctx.createRadialGradient(p.x, p.y - 4, 1, p.x, p.y - 4, f.h * u * (.6 + k)); gr.addColorStop(0, 'rgba(255,200,110,.95)'); gr.addColorStop(.5, 'rgba(255,120,40,.5)'); gr.addColorStop(1, 'rgba(255,90,30,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(p.x, p.y - 4, f.h * u * (.6 + k), f.h * u * (.3 + k * .5), 0, 0, 7); ctx.fill(); ctx.restore(); continue;
    }
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
  const cp=L.capsule;
  // Row1：暂停 + 兵器签（图标 · 名 · 阶位 · 共鸣）
  const y1 = row1.y + 2;
  panel(12, y1, 32, 32, {r: 16}); ctx.fillStyle = '#E6CD93'; ctx.fillRect(23, y1 + 10, 3, 12); ctx.fillRect(30, y1 + 10, 3, 12);
  hudRect('暂停', 12, y1, 32, 32);
  const Wp = WEAPONS[S.weapon];
  const chipX = 52, chipW = Math.max(128,Math.min(300,cp.x-8-chipX));
  panel(chipX, y1, chipW, 32, S.chipFlash > 0 ? {fill: `rgba(138,102,48,${.55 + .35 * S.chipFlash})`, stroke: '#FFE6A6'} : {});
  S.chipPos = {x: chipX + 16, y: y1 + 16};
  const icon = use('图标·' + Wp.label, 'g_icon_' + S.weapon);
  ctx.save(); roundRect(chipX + 3, y1 + 3, 26, 26, 4); ctx.fillStyle = 'rgba(14,24,38,.9)'; ctx.fill(); ctx.restore();
  if (icon) drawFrame(icon, chipX + 16, y1 + 16, 24, {center: true});
  text(Wp.label, chipX + 36, y1 + 12, TYPE.body, {color: '#F5EFE2'});
  const lw = measure(Wp.label, TYPE.body);
  // 阶位：三枚菱形；刚升阶的那枚放大闪金
  for (let i = 0; i < TIER_MAX; i++) {
    const dx = chipX + 36 + lw + 9 + i * 10, dy = y1 + 16, on = i < S.tier, pop = i === S.pipFlash && S.pipT > 0 ? 1 + S.pipT * 1.2 : 1;
    ctx.save(); ctx.translate(dx, dy); ctx.rotate(Math.PI / 4); ctx.scale(pop, pop);
    ctx.fillStyle = on ? (pop > 1 ? '#FFE6A6' : '#D9B25A') : 'rgba(135,132,124,.5)'; ctx.fillRect(-2.8, -2.8, 5.6, 5.6); ctx.restore();
  }
  // 共鸣：本主随军=绿「共鸣·X」；盟主不上阵=金「盟约·X」；本主未随军=灰「X未随军」；长枪不显示
  const res = resonance(S.weapon);
  if (res.state !== 'none') {
    const nm = PEOPLE[res.who];
    const [str, col] = res.state === 'on' ? ['共鸣·' + nm, S.resFlash > 0 ? '#E8FFF0' : '#9FE0B8'] : res.state === 'pact' ? ['盟约·' + nm, '#E6CD93'] : [nm + '未随军', '#87847C'];
    text(str, chipX + chipW - 8, y1 + 29, TYPE.caption, {align: 'right', color: col});
  }
  hudRect('兵器', chipX, y1, chipW, 32);
  
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
    const b = S.boss, done = b.phase === 'yield';
    panel(12, y2, W - 24, 40, {fill: done ? 'rgba(21,36,58,.9)' : 'rgba(40,14,10,.86)', stroke: 'rgba(230,205,147,.7)'});
    ctx.save(); roundRect(18, y2 + 5, 30, 30, 4); ctx.fillStyle = done ? '#2F66A3' : '#7A2419'; ctx.fill(); ctx.restore();
    text(b.name[0], 33, y2 + 20, TYPE.title, {align: 'center', family: SERIF, weight: 900, color: '#F3EAD6'});
    text(b.name, 56, y2 + 12, TYPE.title, {family: SERIF, weight: 900, color: '#F3EAD6'});
    text(done ? '交锋结束' : b.weapon + ' · 敌将', 56 + measure(b.name, TYPE.title, SERIF) + 8, y2 + 13, TYPE.caption, {color: done ? '#9FE0B8' : '#C4BEB0'});
    const hx0 = 56, hx1 = W - 24, hy0 = y2 + 26, segs = 5, gap = 3, sw = (hx1 - hx0 - gap * (segs - 1)) / segs;
    for (let i = 0; i < segs; i++) {
      const x = hx0 + i * (sw + gap);
      const segHp = Math.max(0, Math.min(1, b.hp / b.max * 5 - i)), segTr = Math.max(0, Math.min(1, b.trail / b.max * 5 - i));
      ctx.fillStyle = 'rgba(14,24,38,.9)'; ctx.fillRect(x, hy0, sw, 7);
      ctx.fillStyle = '#F3EAD6'; ctx.fillRect(x, hy0, sw * segTr, 7);
      ctx.fillStyle = b.phase === 'rec' ? '#E6CD93' : '#B23A2B'; ctx.fillRect(x, hy0, sw * segHp, 7);
    }
    const tag = {idle: '对峙', warn: '预警', strike: '出招', rec: '收势', spent: '力竭', yield: CHAPTERS[options.chapter].allies.includes(b.person)?'结盟':CHAPTERS[options.chapter].visit.includes(b.person)?'寻访':CHAPTERS[options.chapter].capture.includes(b.person)?'收服':'胜利'}[b.phase];
    text(tag, W - 24, y2 + 13, TYPE.caption, {align: 'right', color: b.phase === 'warn' || b.phase === 'strike' ? '#FF9A8A' : b.phase === 'rec' || b.phase === 'spent' ? '#E6CD93' : b.phase === 'yield' ? '#9FE0B8' : '#C4BEB0'});
    hudRect('敌将牌', 12, y2, W - 24, 40);
  }
  // 宝物槽（典籍 / 器物 / 坐骑）+ 支援位：左侧竖列，压在路边草地
  // 已佩戴 = 金框；本局试用 = 虚线框 + 角标「试」；一次性已用 = 压暗 + 角标「用」；空 = 单字槽名
  let sy = L.P0 + 4; S.slotPos = {};
  for (const key of ['dian', 'qi', 'ma']) {
    const sl = S.slots[key], T = sl.id ? TREASURE[sl.id] : null, fl = sl.flash > 0 ? sl.flash : 0;
    const worn = sl.st === 'worn', trial = sl.st === 'trial', used = key === 'qi' && sl.used;
    panel(8, sy, 28, 28, {r: 6, fill: fl ? `rgba(200,160,80,${.5 + .4 * Math.sin(fl * 18)})` : T ? (used ? 'rgba(40,40,40,.75)' : 'rgba(138,102,48,.88)') : 'rgba(21,36,58,.7)', stroke: T ? (trial ? '#9FD7FF' : '#E6CD93') : 'rgba(201,164,92,.4)'});
    if (trial) { ctx.save(); ctx.setLineDash([3, 2]); ctx.strokeStyle = '#9FD7FF'; ctx.lineWidth = 1.5; roundRect(9.5, sy + 1.5, 25, 25, 5); ctx.stroke(); ctx.restore(); }
    if (T && has(T.icon)) { ctx.save(); if (used) ctx.globalAlpha = .45; drawFrame(T.icon, 22, sy + 14, 24, {center: true}); ctx.restore(); }
    else if (T) text(T.ch, 22, sy + 14, TYPE.caption, {align: 'center', color: '#FFF6DA', layer: 'L7'});
    else text(SLOT_CN[key], 22, sy + 14, TYPE.caption, {align: 'center', color: '#87847C', layer: 'L7'});
    if (trial || used) { ctx.save(); ctx.beginPath(); ctx.arc(34, sy + 2, 7, 0, 7); ctx.fillStyle = trial ? '#2F66A3' : '#4a4a4a'; ctx.fill(); ctx.restore(); text(trial ? '试' : '用', 34, sy + 2, TYPE.caption, {align: 'center', color: '#fff', layer: 'L7'}); }
    hudRect('宝物槽·' + SLOT_CN[key], 8, sy, 28, 28); S.slotPos[key] = {x: 22, y: sy + 14}; sy += 34;
  }
  // 支援位（华佗）：冷却环
  const sp = S.support, cdk = sp.cd / SUPPORT.cd;
  sy += 4;
  panel(8, sy, 28, 28, {r: 14, fill: sp.flash > 0 ? 'rgba(63,140,100,.9)' : 'rgba(21,36,58,.8)', stroke: cdk > 0 ? 'rgba(135,132,124,.6)' : '#9FE0B8'});
  text(sp.id?'援':'锁', 22, sy + 14, TYPE.caption, {align: 'center', color: cdk > 0 ? '#87847C' : '#9FE0B8', layer: 'L7'});
  if (cdk > 0) { ctx.save(); ctx.strokeStyle = '#9FE0B8'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(22, sy + 14, 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - cdk)); ctx.stroke(); ctx.restore(); }
  hudRect('支援·' + PEOPLE[sp.id], 8, sy, 28, 28);
}

function measure(str, size, fam = FONT) { return ctx.measure(str,size); }

// ───────────────────────── 取得反馈（L7.5：飞入 HUD / 印章） ─────────────────────────
function flyTarget(to) {
  if (to === 'chip') return S.chipPos;
  if (to === 'arms') return S.armsTag;
  if (to && to.startsWith('slot:')) return S.slotPos && S.slotPos[to.slice(5)];
  return null;
}
function drawOverlayFx() {
  for (const f of S.fx) {
    if (f.k !== 'fly') continue;
    const tg = flyTarget(f.to); if (!tg) continue;
    const p0 = proj(f.x, Math.max(0, f.z)), sx = p0.x, sy = p0.y - .3 * L.ppu * p0.s;
    const k = f.t / f.life, q = 1 - (1 - k) * (1 - k);
    const x = sx + (tg.x - sx) * q, y = sy + (tg.y - sy) * q - Math.sin(k * Math.PI) * 40;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .7 * (1 - k * .5);
    const gr = ctx.createRadialGradient(x, y, 1, x, y, 20); gr.addColorStop(0, 'rgba(255,230,166,.9)'); gr.addColorStop(1, 'rgba(255,230,166,0)'); ctx.fillStyle = gr; ctx.fillRect(x - 20, y - 20, 40, 40); ctx.restore();
    if (f.icon && has(f.icon)) drawFrame(f.icon, x, y, 26 - k * 6, {center: true});
    else { ctx.save(); ctx.translate(x, y); ctx.rotate(-.6); ctx.fillStyle = '#FFB25A'; ctx.fillRect(-9, -1.5, 18, 3); ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(7, -4); ctx.lineTo(7, 4); ctx.fill(); ctx.restore(); }
  }
  // 印章：神兵归主（归）/ 收服（降）。48pt，位于 Z2 中部，不压 HUD
  const sl = S.seal; if (!sl) return;
  const k = sl.t / sl.life, a = Math.min(1, sl.t / .12) * (k > .8 ? 1 - (k - .8) / .2 : 1), pop = sl.t < .15 ? 1.6 - sl.t / .15 * .6 : 1;
  const cx = L.W / 2, cy = L.Z2[0] + (L.Z2[1] - L.Z2[0]) * .42, sz = 64 * pop;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(cx, cy); ctx.rotate(-.08);
  roundRect(-sz / 2, -sz / 2, sz, sz, 6); ctx.fillStyle = 'rgba(160,36,24,.92)'; ctx.fill(); ctx.strokeStyle = '#FFE6A6'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.globalAlpha = a; text(sl.ch || '归', cx, cy + 1, 48, {kind: 'seal', family: SERIF, weight: 900, align: 'center', color: '#FFF6DA', layer: 'L8'}); ctx.restore();
  const sub = sl.ch === '降' ? '收服 ' + PEOPLE[sl.who] : '神兵归主 · ' + PEOPLE[sl.who];
  const sw = measure(sub, TYPE.body) + 20;
  ctx.save(); ctx.globalAlpha = a; roundRect(cx - sw / 2, cy + 40, sw, 24, 12); ctx.fillStyle = 'rgba(14,24,38,.85)'; ctx.fill(); ctx.restore();
  ctx.save(); ctx.globalAlpha = a; text(sub, cx, cy + 52, TYPE.body, {align: 'center', color: '#FFE6A6', layer: 'L8'}); ctx.restore();
  SEALR = {x: cx - 48, y: cy - 48, w: 96, h: 112};
}
let SEALR = null;

// ───────────────────────── 通告（L8） & 提示（Z4） ─────────────────────────
function drawNotice() {
  const b = S.boss; NOTICE = null;
  if (!b || !(b.phase === 'warn' || b.phase === 'strike')) return;
  const t = b.phase === 'warn' ? b.pt : BOSS_T.warn;
  const inK = Math.min(1, t / .2);
  const w = 56, h = 200, x = L.W - w * inK, y = Math.max(L.Z2[0], L.Z2[0] + (L.Z2[1] - L.Z2[0] - h) * .5);
  ctx.save(); roundRect(x, y, w + 8, h, 6); ctx.fillStyle = 'rgba(122,36,25,.94)'; ctx.fill(); ctx.strokeStyle = '#E6CD93'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#E6CD93'; ctx.fillRect(x + 6, y + 8, 2, h - 16); ctx.restore();
  vtext(S.boss.name, x + w / 2 + 3, y + 22, TYPE.title, {family: SERIF, weight: 900, color: '#FFF6DA', layer: 'L8'});
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
  TXT = []; LABELS = []; LABELS_DRAWN = []; GATE_STAT = {unsettledHidden: 0, docked: 0}; SEALR = null;
  ctx.save();
  if (S.shake > 0) ctx.translate((rnd() - .5) * 6 * S.shake, (rnd() - .5) * 4 * S.shake);
  drawBackdrop(); drawGround(); drawWorld(); drawWaves(); drawArrows();
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
  drawHUD(); drawOverlayFx(); drawNotice(); drawToast();
  if (showZones) drawZones();
}


L=layout({W:390,H:844,top:0,bottom:0});newWorld('normal');
return {get state(){return S;},get ledger(){return ledger;},get totals(){return {...totals};},
 move(x){if(Number.isFinite(x))S.targetX=Math.max(-.82,Math.min(.82,x));},cancel(){S.targetX=S.heroX;},
 step(dt=DT){if(paused||S.ended)return;step(Math.min(DT,Math.max(0,dt)));},pause(value){paused=!!value;},
 render(sz){if(!ctx)return;L=layout(sz);L.capsule=sz.capsule||{x:L.W-8,y:0,w:0,h:0};const simSeed=seed;ctx.begin(L);render();ctx.end();seed=simSeed;},
 snapshot(){return {chapter:options.chapter,t:S.t,dist:S.dist,phase:S.ended?(S.troops>0?'won':'lost'):S.boss?'boss':'run',x:S.heroX,target:S.targetX,troops:S.troops,weapon:S.weapon,tier:S.tier,arms:S.arms,companions:S.companions.map(c=>c.id),support:{...S.support},slots:S.slots,boss:S.boss?{...S.boss}:null,entities:S.ents.map(e=>({...e,z:e.d-S.dist})),stats:S.stats,totals:{...totals},paused,runGot:[...S.runGot],log:[...S.log]};},
 get diagnostics(){return {texts:TXT,hud:HUDR,gate:GATE_STAT,used:Array.from(USED.entries())};}};
}
