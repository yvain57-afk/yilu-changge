// @ts-nocheck
import {resolveActorPresentation,actorPoseDiagnostic} from './ActorPresentation';
import {R3_ACTOR_META} from './R3Art';
import {volleyTrails,volleyPoint} from './VolleyPresentation';
import {hitReadout,enemyHitPose,enemyFallPose,casualtySlotPose} from './CombatFeedback';
/** Port of approved preview state and projection to the real Cocos scene.
 * Native renderer is injected; no DOM, Canvas, demo lineup, autopilot or debug progression.
 * Source provenance: docs/BATTLE-PREVIEW-20260926/preview.js. */
import {WEAPON_DATA,PEOPLE,TREASURES,CHAPTERS,TUNING,routeFor,requiredOfficers,BOSS_PATTERNS,PACING,marchSpeed,COMPANION_STYLE,difficultyFor,ACTOR_WEAPONS} from './data';
import {combatTuningFor} from './CombatTuning';
import {ENEMY_PROFILES,volleyBonus,reductionProduct,enemyArmor} from './EnemyProfiles';
import {EncounterDirector,reachableSafety} from './EncounterDirector';
import {formationFeet,formationSafety,footAtRisk} from './CombatFootprint';
import {MANIFEST} from './manifest';
import {crateLabelPlan} from './CombatLabels';
import {resolveBattleWeaponPresentation,drawWeaponPresentation,presentationBounds} from './WeaponPresentation';
import {armyFormation,armySlots,fitProjectedFormation,companionSlots,nearestLabelRect} from './presentation';
export function createBattle(options){
const director=new EncounterDirector();const difficulty=difficultyFor(options.chapter);
const M=MANIFEST;const IMG=Object.fromEntries(Object.keys(M.sheets).map(k=>[k,k]));function tinted(k,color){return {sheet:M.frames[k].s,frame:k,tint:color};}let ctx=options.renderer;let renderFailure=null;let activeSource='hero';let projectileId=0;let visualEventId=0;const ledger=[];const totals={damage:0,gate:0,troops:0};
function record(kind,source,target,amount,detail={}){if(totals[kind]!==undefined)totals[kind]+=amount;ledger.push({tick:Math.round((S?.t||0)*60),kind,source,target,amount,...detail});if(ledger.length>1200)ledger.shift();}
// Sound events are a bounded side channel. Their IDs never consume gameplay randomness.
let soundId=0;const soundQueue=[];const runId=options.runId||'battle-'+options.chapter;
function sound(phase,w={},target=null,heavy=false){
 const actor=w.source||'enemy',source=actor==='hero'?'hero':actor==='troop'?'army':actor.startsWith('companion')||actor.startsWith('support')?'companion':'enemy';
 const kind=typeof target==='object'&&target?target.type:target===S.boss?.person?'boss':target?'unknown':'none';
 const material=phase!=='impact'?'none':['gate','crate','wall'].includes(kind)?'wood':['officer','boss'].includes(kind)||target?.elite?'metal':kind==='enemy'||kind==='team'?'soft':'generic';
 soundQueue.push({eventId:runId+':sfx:'+ ++soundId,runId,tick:Math.round(S.t*60),attackId:w.attackId||actor+':'+phase+':'+Math.round(S.t*60),projectileId:w.projectileId??null,source,sourceActorId:actor,weaponId:w.weaponId??null,arms:w.arms??null,phase,targetKind:kind,material,heavy,fallback:material==='generic'?'unclassified target: dry generic contact':undefined});
 if(soundQueue.length>256)soundQueue.shift();
}
function actorWeapon(actor,k=''){if(actor==='hero')return S.weapon;const id=actor.split(':')[1];if(ACTOR_WEAPONS[id])return ACTOR_WEAPONS[id];return Object.keys(WEAPON_DATA).find(k=>WEAPON_DATA[k].owner===id)||COMPANION_STYLE[id]?.family||(/shemao/.test(k)?'liannu':/guandao/.test(k)?'guandao':'spear');}
function bossWeapon(){const id=CHAPTERS[options.chapter].boss;const w=Object.values(WEAPON_DATA).find(w=>w.owner===id);return w?.label||'兵阵';}
function shootableGate(e){const z=e.d-S.dist;return !S.encounterStop&&!e.fixed&&!e.passed&&z>0&&z<=Math.min(TUNING.gateHitWindow,marchSpeed(options.chapter)*4.5);}
function gateHit(e,source,w){if(!shootableGate(e))return;const identity=(w.attackId||source)+':'+(w.subAttackId??w.projectileId);e.hitAttacks=e.hitAttacks||new Set();if(e.hitAttacks.has(identity))return;e.hitAttacks.add(identity);const before=e.val;e.initial??=e.val;e.growthCap??=CHAPTERS[options.chapter].gateGrowthCap;e.val=Math.min(e.initial+e.growthCap,e.val+TUNING.gateHitStep);if(e.val===before)return;e.flip=.15;record('gate',source,e.id,e.val-before,{attackId:w.attackId,subAttackId:w.subAttackId??w.projectileId,cap:e.initial+e.growthCap});sound('impact',w,e);}
function extraSupport(dt){if(S.ended||!S.support.id||S.support.id==='hua')return;const sp=S.support;sp.cd=Math.max(0,sp.cd-dt);if(sp.cd>0)return;sp.cd=12;sp.uses++;sp.flash=1;const id=sp.id;activeSource='support:'+id;if(id==='lusu'){const restored=restoreLoss(3,'lusu',S.t-12);toast('鲁肃 · 救回 '+restored,'good');}else if(id==='huangyueying'){if(S.weapon==='jiguannu')S.nextMechanismBreak=true;else wave({k:'g_wave_spear',x:S.heroX,z:.5,speed:60,range:40,hw:.12,pierce:2,dmg:3,h:.3});}else if(['diao','xun','sunjian'].includes(id)){addTroops(2,'support');toast(PEOPLE[id]+' · 鼓舞 +2','good');}else{const p=({guo:['spear','料敌穿阵','#A9CEE7'],zhou:['guandao','风火策应','#EFAB6D'],zhuge:['shemao','连弩策应','#B6DFB6'],pang:['huaji','连环策应','#D8BE91'],sima:['guandao','破阵策应','#CAB9E3']})[id]||['spear','策应','#E6CD93'];wave({k:'g_wave_'+p[0],x:S.heroX,z:.5,speed:40,range:40,hw:.5,pierce:6,dmg:4,h:.4,wide:id==='zhuge'?.8:2,color:p[2],snake:id==='zhuge'?.5:0});toast(PEOPLE[id]+' · '+p[1],'gold');}const res=resonance(S.weapon);if(res.state==='on'&&res.who===id&&!S.resUsed[id]){S.resUsed[id]=true;S.resFlash=1.2;wave({k:'f2_bladeWave',x:S.heroX,z:.5,speed:50,range:45,hw:.6,pierce:99,dmg:9,h:.5,wide:2.2});record('resonance',id,'team',1);}record('support',id,'team',1);}
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
let visible={soldiers:0,companions:0,hero:0,enemies:0};
let ACTOR_POSES:any[]=[];
function countVisible(kind,r,alpha=1){if(options.diagnostic&&r&&alpha>.01&&r.x+r.w>0&&r.x<L.W&&r.y+r.h>L.hudBottom&&r.y<L.H)visible[kind]++;}

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
  if(has('c20_hero_'+w+'_run')){const pre='c20_hero_'+w+'_';return {run:[pre+'run',pre+'run',pre+'run',pre+'run'],wind:pre+'wind',rel:pre+'rel',rec:pre+'rec',show:pre+'rec'};}
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
  seed = options.seed||7;director.clear();
  const L0 = options.lineup;
  S = {state, t: 0, dist: 0, speed: state === 'general' ? 0 : marchSpeed(options.chapter), heroX: -.45, targetX: -.45, heroV: 0,
    weapon:L0.weapons.includes(L0.startWeaponId)&&WEAPONS[L0.startWeaponId]?L0.startWeaponId:'spear',tier:1,
    atkT: 0, atkN: 0, troops: BASE_TROOPS, troopShown: BASE_TROOPS, deltas: [], ents: [], waves: [], arrows: [], fx: [], casualties: [], toasts: [], toast: null,
    shake: 0, redFlash: 0, hitStop: 0, courseLen: 0, nextSpawn: 0, boss: null, stage: '第'+(options.chapter+1)+'关 · '+CHAPTERS[options.chapter].place, progress: 0,
    companions: L0.companions.map((id, i) => ({id, dx: (i?-1:1)*(L0.treasures.ma?.48:.34), t: i ? .9 : .3, pose: 0, fired: true})),
    support: {id: L0.support, cd: 0, pending: null, uses: 0},
    slots: {dian: {id: L0.treasures.dian, st: L0.treasures.dian?'worn':'empty', n: 0, flash: 0}, qi: {id: L0.treasures.qi, st: L0.treasures.qi?'worn':'empty', n: 0, flash: 0, used: false}, ma: {id: L0.treasures.ma, st: L0.treasures.ma ? 'worn' : 'empty', n: 0, flash: 0}},
    runGot: [], storage: [], defeatedOfficerIds: [], defeatedBossId: null,losses:[],hostileShots:[],enemyLifecycle:{},waveAccounting:{},pendingSquads:[],pendingBossGuards:[],nextThreatAttempt:{},resolvedEnemyAttacks:new Set(),sourceProtection:{},damageSources:{},damageHistory:[],avoidances:0,progressEligible:[],
    arms: 'bow', volleyT: 1.0, volleyPose: 0, burstLeft: 0, burstT: 0,
    resUsed: {}, resFlash: 0, chipFlash: 0, pipFlash: -1, pipT: 0, show: 0, seal: null,
    timing:{march:0,officer:0,boss:0,intentionalHitStop:0},stats: {bossStrikes: 0, dodged: 0, hitTaken: 0, volleys: 0, arrowsHit: 0, taiping: 0, supportSaved: 0, crates: {}},
    scen: [], wall: null, bumped: 0, ended: false, ctrl: 'manual', log: []};
  // 传国玉玺：开局兵力 +20%，每局 1 次（开局即结算，槽显示“已用”）
  if (S.slots.qi.id === 'yuxi') {
    const add = Math.round(BASE_TROOPS * .2);
    S.troops += add; S.troopShown = S.troops; S.slots.qi.used = true; S.slots.qi.n = 1; S.slots.qi.flash = 1.2;
    logEv('treasure', '传国玉玺 开局 +' + add);
    toast('传国玉玺 · 开局兵力 +' + add, 'gold');
  }
  if(S.slots.qi.id==='jiuzhouyin'){S.troops+=8;S.troopShown=S.troops;}
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
function buildCourse(){S.course=routeFor(options.chapter,options.lineup.weapons,options.lineup.treasurePool,S.weapon);if(options.lineup.replayOrder==='elite')S.course=S.course.map(e=>e.type==='squad'?{...e,enemyKind:e.enemyKind==='light'?'guard':e.enemyKind,elite:true}:e);if(options.lineup.replayOrder==='few-supplies')S.course=S.course.map(e=>e.type==='crate'&&e.kind==='grain'?{...e,n:Math.max(1,Math.floor((e.n||6)*.5))}:e);if(options.lineup.replayOrder==='double-officers'){S.course.push({type:'officer',person:CHAPTERS[options.chapter].boss,d:CHAPTERS[options.chapter].length*.74,x:.45});S.course.sort((a,b)=>a.d-b.d);}S.courseLen=CHAPTERS[options.chapter].length;S.ci=0;S.lap=0;}
const SPAWN_Z=()=>Math.max(60,L.zP0*.82);
function enemyEvent(e,stage,detail={}){const row=S.enemyLifecycle[e.id]||(S.enemyLifecycle[e.id]={enemyId:e.id,waveId:e.waveId||'reinforcement',enemyKind:e.enemyKind||'light',events:[]});row.events.push({stage,t:S.t,z:e.d-S.dist,...detail});}
function spawnCourse(){
 while(S.ci<S.course.length&&S.course[S.ci].d<=S.dist+SPAWN_Z()){
  const index=S.ci++,e=S.course[index];
  if(e.type==='squad'){const waveId=e.waveId||CHAPTERS[options.chapter].id+':wave:'+index;const headIDs=Array.from({length:e.n},()=>EID++);S.waveAccounting[waveId]={waveId,planned:e.n,spawned:0,deferredFrames:0,originalD:e.d,headIDs};for(const id of headIDs)enemyEvent({id,waveId,enemyKind:e.enemyKind|| (e.elite?'guard':'light'),d:e.d},'planned');S.pendingSquads.push({...e,waveId,headIDs,remaining:e.n,offset:0});}
  else spawn(e,e.d);
 }
 // Reserve route events independently of the sprite budget. Partial waves retain IDs and remaining count.
 for(const e of S.pendingSquads){const live=S.ents.filter(q=>q.type==='enemy'&&!q.dead).length,space=Math.max(0,difficulty.visibleEnemyCap-live);if(!space){S.waveAccounting[e.waveId].deferredFrames++;S.waveAccounting[e.waveId].deferredReason='active-enemy-budget';break;}
  const n=Math.min(space,e.remaining),d=Math.max(e.d,S.dist+Math.min(36,SPAWN_Z()));spawn({...e,n},d);e.remaining-=n;e.offset+=n;S.waveAccounting[e.waveId].spawned+=n;if(e.remaining)break;
 }
 S.pendingSquads=S.pendingSquads.filter(e=>e.remaining>0);
}
let EID = 1;
function spawn(e, d) {
  if(e.type==='cameo'){S.ents.push({id:EID++,type:'cameo',person:e.person,x:e.x,d});}
  else if(e.type==='officer'){const hp=PACING.officerHP[options.chapter];S.ents.push({id:EID++,type:'officer',person:e.person,x:e.x,d,hp,max:hp,walk:0,dead:0,phase:'approach',pt:0,band:[-.3,.3]});}
  else if (e.type === 'squad') {
    const cols=e.formation==='pair'?2:e.formation==='line'?4:e.formation==='guard'?2:3;
    for(let i=0;i<e.n;i++){const index=i+(e.offset||0),row=Math.floor(index/cols),col=index%cols,stagger=e.formation==='stagger'?(row%2?.1:-.1):0,dx=e.formation==='guard'?(col? .28:-.28):(col-(cols-1)/2)*.23;
     const entity={id:e.headIDs?.[index]??EID++,waveId:e.waveId,type:'enemy',x:Math.max(-.86,Math.min(.86,(e.x||0)+dx+stagger)),d:d+row*(e.formation==='line'?1.4:1.05)+(e.formation==='stagger'?col*.35:0),hp:ENEMY_PROFILES[e.enemyKind|| (e.elite?'guard':'light')].hp*difficulty.ordinaryHPMultiplier,enemyKind:e.enemyKind||(e.elite?'guard':'light'),elite:(e.enemyKind|| (e.elite?'guard':'light'))!=='light',phase:'approach',pt:0,attackN:0,formation:e.formation||'triple',walk:rnd(),dead:0};S.ents.push(entity);if(!e.headIDs)enemyEvent(entity,'planned');enemyEvent(entity,'spawned');
    }
  } else if (e.type === 'crate') {
    const hp = {grain: 6, weapon: 10, arms: 8, treasure: 14}[e.kind];
    const gives = e.gives === 'same' || (S.lap > 0 && e.kind === 'weapon') ? S.weapon : e.gives; // 第二圈起兵器匣只升阶，不回退兵器
    S.ents.push({id: EID++, type: 'crate', kind: e.kind, gives,n:e.n,choiceId:e.choiceId,choiceRole:e.choiceRole,rewardXP:e.rewardXP, x: e.x, d, hp, max: hp, open: 0, hitT: 0});
  } else if (e.type === 'gates') {
    e.vals.forEach((v, i) => S.ents.push({id: EID++, type: 'gate', x: i ? .5 : -.5, d, val: v,initial:v,growthCap:e.growthCap??CHAPTERS[options.chapter].gateGrowthCap, fixed:!!e.fixed&&v===1,passed: false, flip: 0, miss: 0}));
  } else if (e.type === 'wall') {
    S.ents.push({id: EID++, type: 'wall', x: 0, d, len: e.len, side: e.side || 1});
  }
}
function spawnBossGuard(x,d,waveId){const e={id:EID++,waveId,type:'enemy',enemyKind:'guard',phase:'approach',pt:0,elite:true,x,d,hp:2,walk:rnd(),dead:0};const wave=S.waveAccounting[waveId]||(S.waveAccounting[waveId]={waveId,planned:0,spawned:0,deferredFrames:0,headIDs:[],originalD:d});wave.planned++;wave.headIDs.push(e.id);enemyEvent(e,'planned');S.pendingBossGuards.push(e);flushBossGuards();}
function flushBossGuards(){while(S.pendingBossGuards.length){const e=S.pendingBossGuards[0],w=S.waveAccounting[e.waveId];if(S.ents.filter(q=>q.type==='enemy'&&!q.dead).length>=difficulty.visibleEnemyCap){w.deferredFrames++;w.deferredReason='active-enemy-budget';break;}S.pendingBossGuards.shift();e.d=Math.max(e.d,S.dist+12);S.ents.push(e);w.spawned++;enemyEvent(e,'spawned');}}
function setupGeneral() {
  S.progress=1;S.speed=0;S.state='general';S.progressEligible.push(4);director.active=director.active.filter(t=>t.released);for(const e of S.ents)if(e.phase==='warn'&&!e.telegraph?.released){e.phase='idle';e.pt=0;e.telegraph=null;}
  S.boss = {name: PEOPLE[CHAPTERS[options.chapter].boss], person:CHAPTERS[options.chapter].boss,weapon: bossWeapon(),z:17,hp:CHAPTERS[options.chapter].bossHP,max:CHAPTERS[options.chapter].bossHP,trail:CHAPTERS[options.chapter].bossHP, phase: 'idle', pt: 0, band: [-1, 0], hit: 0, cycleN: 0, down: 0, flags: 4, flagFx: []};
  S.minT = 1.5;
  for(const side of [-1,1])for(let i=0;i<3;i++)spawnBossGuard(side*(.57+(i%2)*.22),S.dist+14+Math.floor(i/2)*2.4,'boss:'+S.boss.person+':opening');
}

// ───────────────────────── 主循环 ─────────────────────────
const DT = 1 / 60;
let speedScale = 1, paused = false, showZones = false, companionsOn = true;
function terminalThreatAudit(reason){if(S.terminalThreatAudited)return;S.terminalThreatAudited=true;for(const e of S.ents)if(e.type==='enemy'&&!e.dead)enemyEvent(e,'despawnReason',{reason});for(const e of S.pendingSquads){S.waveAccounting[e.waveId].cancelled=e.remaining;S.waveAccounting[e.waveId].cancelReason=reason;for(const id of e.headIDs.slice(e.offset))enemyEvent({id,waveId:e.waveId,enemyKind:e.enemyKind,d:e.d},'despawnReason',{reason});}for(const e of S.pendingBossGuards){const w=S.waveAccounting[e.waveId];w.cancelled=(w.cancelled||0)+1;w.cancelReason=reason;enemyEvent(e,'despawnReason',{reason});}S.pendingBossGuards=[];S.pendingSquads=[];S.hostileShots=[];director.clear();}
function step(dt) {
  if(S.ended){
    terminalThreatAudit(S.troops>0?'battle-victory':'battle-defeat');
    // Presentation continues after the authoritative outcome; no further combat or rewards.
    S.feedbackElapsed=(S.feedbackElapsed||0)+dt;
    S.casualties=S.casualties.filter(c=>feedbackNow()-c.at<1.05);
    for(const e of S.ents)if(e.dead)e.dead+=dt;
    S.fx=S.fx.filter(f=>(f.t+=dt)<f.life);
    if(S.boss?.phase==='yield'){S.boss.pt+=dt;for(const f of S.boss.flagFx)f.t+=dt;}
    if(S.seal)S.seal.t+=dt;
    return;
  }
  S.hitStop=0; // No global simulation pause. Heavy impacts hold only the attacker pose.
  S.t += dt;
  
  // 横移：追随拖动目标，但受最大横移速度限制（赤兔 ×1.25，本局生效）
  const vmax = moveSpeed();
  const want = (S.targetX - S.heroX) * 14;
  const v = Math.max(-vmax, Math.min(vmax, want));
  S.heroV = v; S.heroX += v * dt;
  // 墙段夹持：固定墙（低木栅）只挡人马，占据半幅路面，经过期间只能走另一半；刀气与箭矢照常越过
  const w = S.ents.find(e => e.type === 'wall' && e.d - S.dist < .4 && e.d + e.len - S.dist > -.4);
  S.inWall = !!w;
  if (w) {
    const lim = -w.side*.42;
    if (w.side > 0 && S.heroX > lim) { S.heroX = lim; S.bumped = .2; }
    if (w.side < 0 && S.heroX < lim) { S.heroX = lim; S.bumped = .2; }
  }
  S.heroX = Math.max(-.68, Math.min(.68, S.heroX));
  S.bumped = Math.max(0, S.bumped - dt);
  const encounter=S.ents.find(e=>e.type==='officer'&&!e.dead&&e.d-S.dist<=12);
  if(encounter&&!S.encounterStop){S.resumeSpeed=S.speed;S.encounterStop=true;}
  if(S.encounterStop){S.speed=0;if(!encounter){S.speed=S.resumeSpeed;S.encounterStop=false;}}
  S.timing[S.boss?'boss':S.encounterStop?'officer':'march']+=dt;
  S.dist += S.speed * dt;director.prune(S.t);
  for(const q of [.25,.5,.75])if(S.dist/S.courseLen>=q&&!S.progressEligible.includes(q))S.progressEligible.push(Math.round(q*4));
  if(S.state!=='general'){S.progress=Math.min(1,S.dist/S.courseLen);if(S.dist>=S.courseLen+5&&requiredOfficers(options.chapter).every(id=>S.defeatedOfficerIds.includes(id)))setupGeneral();}
  spawnCourse();flushBossGuards();
  scenery(dt);
  if (!S.ended&&!(options.diagnostic&&options.noFriendlyFire)) { activeSource="hero";heroAttack(dt); activeSource="companion";if(companionsOn)companionsAttack(dt);activeSource="troop";troopVolley(dt); }
  // 部曲归零：本局失败，停止攻防，3 秒后重开当前状态（预览行为）
  if (S.troops <= 0 && !S.ended) { S.ended = true; S.routed = 0; S.waves = []; toast('部曲溃散 · 本局失败', 'bad'); logEv('run','战败，等待结算'); }
  
  if (S.boss && S.routed === undefined) bossStep(dt);
  updateEnts(dt);
  hostileStep(dt);
  if(S.troops<=0){S.ended=true;S.routed=0;S.waves=[];S.arrows=[];terminalThreatAudit('battle-defeat');return;}
  updateWaves(dt);
  updateArrows(dt);
  if(!S.ended)supportStep(dt);extraSupport(dt);
  S.fx = S.fx.filter(f => (f.t += dt) < f.life);
  S.casualties = S.casualties.filter(c => S.t-c.at<1.05);
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
const SCEN=({'群雄':['tower','tent','rocks','granary','tent','rocks'],'魏':['tower','granary','tent','tower'],'吴':['granary','tent','granary','palisade'],'蜀':['rocks','rocks','tower','rocks']}[CHAPTERS[options.chapter].faction]);
function scenery() {
  S.scenNext = S.scenNext || 0;
  const ahead = S.dist + SPAWN_Z() + 10;
  while (S.scenNext < ahead) {
    const d = S.scenNext;
    for (const side of [-1, 1]) {
      if (rnd() < .64) S.scen.push({k: SCEN[Math.floor(rnd() * SCEN.length)], x: side * (1.75 + rnd() * .8), d: d + rnd() * 4, flip: side > 0});
      if(Math.floor(d/9)%3!==1)S.scen.push({k:'palisade',x:side*1.42,d:d+2,flip:false,fence:true});
      if(Math.floor(d/9)%3===1)S.scen.push({k:'rocks',x:side*1.63,d:d+4,flip:side>0,small:true});
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
  const prev = S.atkT; S.atkT += dt;if(S.weapon==='jiguannu'&&prev===0)sound('load',{source:'hero',weaponId:S.weapon,attackId:'hero:'+S.atkN});
  const rel0 = W.wind;
  const crossed = t => prev < t && S.atkT >= t;
  const x = S.heroX;
  const special=['duanji','tiesuodao','goulianqiang','dundao','yanlinggong','jiguannu'].includes(S.weapon);
  if(special){
   // New families have fewer tier projectiles; a declared follow-through multiplier closes the gap.
   const followThrough=[1,1.35,1.75][T-1];
   const send=(o)=>wave({k:'g_wave_'+family,x,z:.5,speed:60,range:42,hw:.12,pierce:2,dmg:3*D,h:.38,subAttackId:0,...o,dmg:o.dmg*followThrough});
   if(S.weapon==='duanji'){if(crossed(rel0))send({dmg:2.7*D,range:25});if(crossed(rel0+.12))send({dmg:1.62*D,range:25,subAttackId:1});}
   if(S.weapon==='tiesuodao'&&crossed(rel0))send({dmg:4.6*D,range:24,hw:.45+.06*T,pierce:8,wide:1.6+.15*T,speed:34});
   if(S.weapon==='goulianqiang'&&crossed(rel0))send({dmg:3.6*D,pierce:2+T,breaker:true,hw:.09});
   if(S.weapon==='dundao'&&crossed(rel0))send({dmg:3.2*D,hw:.23,wide:1,range:24,pierce:2+T});
   if(S.weapon==='yanlinggong'&&crossed(rel0))send({dmg:6.4*D,pierce:1,hw:.08,speed:84,range:58});
   if(S.weapon==='jiguannu'&&crossed(rel0)){const burst=S.atkN%3===2;send({dmg:(burst?7:5)*D,pierce:burst?3+T:1,hw:burst?.28:.09,wide:burst?1.1:undefined,breaker:burst&&S.nextMechanismBreak,armorMark:burst&&S.nextMechanismBreak});if(burst)S.nextMechanismBreak=false;}
   if(S.atkT>=W.cycle){S.atkT-=W.cycle;S.atkN++;if(S.weapon==='jiguannu')sound('load',{source:'hero',weaponId:S.weapon,attackId:'hero:'+S.atkN});}return;
  }
  // 阶级差异（调试初值）：长枪 3 阶双枪气；偃月刀宽度 1.4/1.9/2.4；蛇矛 1/2/3 刺；画戟 直刺 → +侧扇 → +二段侧扇
  if (family === 'spear' && crossed(rel0)) {
    const xs = T >= 3 ? [x - .07, x + .07] : [x];
    for (const xx of xs) wave({k: 'f2_spearWave', x: xx, z: .5, speed: 62, range: 40 + 6 * T, hw: .12, pierce: T >= 2 ? 2 : 1, dmg: 3 * D, h: .40, color: W.color});
    fx('f2_muzzleFlash', x, .55, .22, .14);
  }
  if (family === 'guandao' && crossed(rel0)) {
    const wide = [1.4, 1.9, 2.4][T - 1];
    wave({k: 'f2_bladeWave', x, z: .6, speed: 36, range: 22, hw: wide * .23, pierce: 99, dmg: 7 * D, h: .46, wide, color: W.color, grow: .5});
    // A missed swing must not shake or stop the world.
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
const COMP = {...Object.fromEntries(Object.entries(COMPANION_STYLE).map(([id,p])=>[id,{k:'g_wave_'+p.family,speed:50,range:30,hw:.1,dmg:2,h:.28,wide:p.wide,color:p.color,snake:p.snake}])),lubu:{k:'g_wave_huaji',speed:48,range:36,hw:.2,dmg:3,h:.4,pierce:2},dian:{k:'g_wave_huaji',speed:40,range:28,hw:.19,dmg:2,h:.34,pierce:2},zhao: {k: 'f2_spearWave', speed: 50, range: 30, hw: .09, dmg: 2, h: .26}, zhang: {k: 'f2_spearWave', speed: 60, range: 34, hw: .10, dmg: 2, h: .28, snake: 1}};
function companionsAttack(dt) {
  for(const p of S.pendingCompanion||[])if(!p.done&&S.t>=p.at){activeSource=p.actor;wave(p.o);p.done=true;}S.pendingCompanion=(S.pendingCompanion||[]).filter(p=>!p.done);
  for (const c of S.companions) {
    c.t += dt;
    if (c.t > (c.id==='weiyan'?2.4:1.5)) { c.t = 0; c.pose = .35; c.fired = false; }
    c.pose = Math.max(0, c.pose - dt);
    if (!c.fired && c.pose <= .20) {
      c.fired = true;c.attackN=(c.attackN||0)+1;activeSource='companion:'+c.id;
      const P = COMP[c.id]||{k:"f2_spearWave",speed:50,range:30,hw:.1,dmg:2,h:.28}, x = S.heroX + c.dx;
      const res = resonance(S.weapon); const boosted = res.state === 'on' && res.who === c.id;
      if(['taishici','ganning','zhanghe','xiahouyuan','weiyan','zhangren','dengai'].includes(c.id)){
       const mult=boosted?1.3:1,base={k:'g_wave_'+(WEAPONS[ACTOR_WEAPONS[c.id]]?.family||'spear'),x:wallSafeX(x*.8),z:.3,speed:58,range:38,hw:.12,pierce:2,dmg:2.4*mult,h:.35};
       if(c.id==='taishici'){wave({...base,dmg:2.4*mult,range:26});S.pendingCompanion=S.pendingCompanion||[];S.pendingCompanion.push({at:S.t+.12,actor:activeSource,o:{...base,dmg:1.44*mult,subAttackId:1}});}
       if(c.id==='ganning')wave({...base,dmg:1.8*mult,hw:.46,wide:1.7,pierce:8,range:26});
       if(c.id==='zhanghe'){const target=S.ents.filter(e=>e.enemyKind==='shield'&&!e.dead&&(e.x<0)===(x<0)&&e.d-S.dist<32&&e.d>S.dist).sort((a,b)=>a.d-b.d)[0];wave({...base,vx:target?(target.x-base.x)/((target.d-S.dist-base.z)/base.speed):0,breaker:true,armorMark:true});}
       if(c.id==='xiahouyuan'){const target=S.ents.filter(e=>['archer','banner'].includes(e.enemyKind)&&!e.dead&&(e.x<0)===(x<0)&&e.d-S.dist<35&&e.d>S.dist).sort((a,b)=>a.d-b.d)[0];const wall=S.ents.find(e=>e.type==='wall'&&e.d<S.dist+(target?target.d-S.dist:30)&&e.d+e.len>S.dist&&e.side*base.x>0);if(!wall)wave({...base,vx:target?(target.x-base.x)/((target.d-S.dist-base.z)/74):0,dmg:3.8*mult,pierce:1,speed:74,arrow:true});}
       if(c.id==='weiyan')wave({...base,dmg:4*mult,hw:.23,pierce:3,breaker:true,heavy:true});
       if(c.id==='zhangren'){const threat=director.active.find(t=>t.execute>S.t&&t.bands.some(([l,r])=>S.heroX>l-.28&&S.heroX<r+.28));if(threat&&S.t>=(c.counterReady||0)){c.counterReady=S.t+4;wave({...base,dmg:3*mult,hw:.10,pierce:3});}}
       if(c.id==='dengai')wave({...base,x:S.heroX,dmg:2.5*mult,pierce:4,hw:.09});
       continue;
      }
      // 本主共鸣：本局首次出手放一次专属大招（宽蛇行），之后出手伤害 ×1.5
      if(['lubu','dian'].includes(c.id)){const special=boosted&&!S.resUsed[c.id];if(special){S.resUsed[c.id]=true;S.resFlash=1.2;logEv('resonance',PEOPLE[c.id]+' 共鸣技');}const mult=boosted?1.5:1;for(const side of [-1,1])wave({k:P.k,x:x+side*.12,z:.3,speed:P.speed,range:P.range,hw:special?.30:P.hw,pierce:special?4:P.pierce,dmg:P.dmg*mult,h:P.h,wide:c.id==='lubu'?1.5:1.1,color:c.id==='lubu'?'#F2A57A':'#D9B997'});continue;}
      if (boosted && !S.resUsed[c.id]) {
        S.resUsed[c.id] = true; S.resFlash = 1.2;
        wave({k:P.k,x,z:.3,speed:40,range:30,hw:.5,pierce:99,dmg:6,h:.5,wide:(P.wide||1)*1.8,color:P.color||'#F0D38A',grow:.3});
        for (const sn of [1, -1]) wave({k:P.k, x: x + sn * .06, z: .3, speed: 70, range: 50, hw: .12, pierce: 5, dmg: 3, h: .36, snake: sn});
        logEv('resonance', PEOPLE[c.id] + ' 共鸣技');
      } else wave({k: P.k, x, z: .2, speed: P.speed, range: P.range, hw: P.hw, pierce: 1, wide:P.wide||1,color:P.color,dmg: P.dmg * (boosted ? 1.5 : 1), h: P.h * (boosted ? 1.2 : 1), alpha: .85, snake: P.snake ? (S.atkN % 2 ? 1 : -1) * .6 : 0});
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
      const tg = S.ents.filter(e => (((e.type === 'enemy'||e.type==='officer') && !e.dead) || (e.type === 'crate' && !e.open&&!S.encounterStop&&e.d-S.dist<=marchSpeed(options.chapter)*4.5)) && e.d - S.dist > -.2 && e.d - S.dist < 30).sort((a, b) => a.d - b.d);
      const bossT = S.boss && S.boss.phase !== 'spent' && S.boss.phase !== 'yield' ? {x: 0, z: S.boss.z} : null;
      const burstStart=S.arrows.length;
      for (let i = 0; i < n; i++) {
        const e = tg[i % Math.max(1, tg.length)];
        const tx = e ? e.x + (rnd() - .5) * .08 : bossT ? (rnd() - .5) * .3 : S.heroX + (rnd() - .5) * .6;
        const sx = S.heroX + ((i % 4) - 1.5) * .17, sz = -1.5 - Math.floor(i / 4) * .6;
        // 提前量：目标以相对速度 v 逼近，按飞行时间 dur = .5 + (tz − sz)·.012 反解落点
        const v = e ? S.speed + (e.type==='enemy'&&e.phase==='approach'?enemySelfSpeed(e):0) : 0, z0 = e ? e.d - S.dist : 0;
        const tz = e ? (z0 - .5 * v + .012 * v * sz) / (1 + .012 * v) : bossT ? bossT.z : 14 + rnd() * 6;
        const dur = .5 + (tz - sz) * .012;
        S.arrows.push({projectileId:++projectileId,source:'troop',attackId:'volley:'+S.stats.volleys,x: sx, z: sz, sx, sz, tx, tz, t: 0, dur, arms: S.arms, dmg: A.dmg*volleyBonus(S.troops), splash: A.splash, target: e ? e.id : bossT ? 'boss' : null});if(i===0)sound('release',S.arrows[S.arrows.length-1]);
      }
      const groups=S.arrows.slice(burstStart),slots=friendlyArrowSlots().filter(s=>friendlyLossPose(s.slotIndex).alpha>.1);
      const trails=volleyTrails(S.troops,slots,groups.length);
      groups.forEach((a,i)=>a.visuals=trails[i]);
      S.volleyReadout={troops:S.troops,arrows:trails.reduce((n,v)=>n+v.length,0),ranks:new Set(slots.map(s=>s.row)).size,groups:groups.length,arms:S.arms};
    }
  }
}
function updateArrows(dt) {
  for (const a of S.arrows) {
    a.t += dt; const k = Math.min(1, a.t / a.dur);
    a.x = a.sx + (a.tx - a.sx) * k; a.z = a.sz + (a.tz - a.sz) * k; a.hgt = Math.sin(k * Math.PI) * (.6 + (a.tz - a.sz) * .02);
    if (k >= 1 && !a.done) {
      a.done = true;
      const hitList = S.ents.filter(e => (((e.type === 'enemy'||e.type==='officer') && !e.dead) || (e.type === 'crate' && !e.open&&!S.encounterStop)) && Math.abs(e.d - S.dist - a.z) < .9 && Math.abs(e.x - a.x) < .12 + a.splash);
      for (const e of hitList) { hitEnt(e, a.dmg, a); S.stats.arrowsHit++; }
      if (a.target === 'boss' && S.boss && !['spent', 'yield'].includes(S.boss.phase)) bossDamage(a.dmg * .5, a.x, a);
      if (a.arms !== 'bow') fx('burst', a.x, a.z, .2 + a.splash, .3);
    }
  }
  S.arrows = S.arrows.filter(a => !a.done || a.t < a.dur + .05);
}
function wave(o) {if(activeSource.startsWith('companion:')){const ci=S.companions.findIndex(c=>'companion:'+c.id===activeSource),wall=S.ents.find(e=>e.type==='wall'&&e.d-S.dist<.4&&e.d+e.len-S.dist>-.4);o.visualOrigin=companionSlots(S.heroX,S.companions.length,wall?.side||0)[ci];}if(activeSource==='hero'){if(S.nextEliteBonus){o.eliteBonus=true;S.nextEliteBonus=false;}if(S.nextPierce&&o.pierce>1){o.pierce++;S.nextPierce=false;}o.k=has('c20_wave_'+S.weapon)?'c20_wave_'+S.weapon:'g_wave_'+WEAPONS[S.weapon].family;if(options.lineup.tactic==='zhenjun'){o.control=true;o.pierce=1;}}S.waves.push({projectileId:++projectileId,subAttackId:Math.round(S.t*60),attackId:activeSource+':'+(activeSource.startsWith('companion:')?S.companions.find(c=>activeSource==='companion:'+c.id)?.attackN:activeSource.startsWith('support:')?S.support.uses:S.atkN),source:activeSource,weaponId:actorWeapon(activeSource,o.k),...o, z0: o.z, prevZ: o.z, t: 0, hits: new Set(), x0: o.x, alpha: o.alpha || 1});sound('release',S.waves[S.waves.length-1]); }
function fx(k, x, z, h, life, extra = {}) { S.fx.push({k, x, z, h, life, t: 0,eventId:runId+':visual:'+ ++visualEventId, ...extra}); }
function updateWaves(dt) {
  for (const w of S.waves) {
    if(w.spent)continue;
    w.prevZ=w.z;const prevX=w.x;w.z+=w.speed*dt;w.x+=(w.vx||0)*dt;w.t+=dt;
    if(w.snake)w.x=w.x0+w.snake*SNAKE.amp*Math.sin((w.z-w.z0)*SNAKE.k);
    if(w.boss)continue;
    // One swept segment and one shared hit budget, including the general.
    const end=Math.min(w.z,w.z0+w.range),dz=end-w.prevZ;if(dz<0)continue;
    const targets=S.ents.filter(e=>((e.type==='enemy'||e.type==='officer')&&!e.dead)||(e.type==='crate'&&!e.open&&!S.encounterStop&&e.d-S.dist<=marchSpeed(options.chapter)*4.5)||(e.type==='gate'&&shootableGate(e))).map(e=>({id:e.id,e,z:e.d-S.dist,x:e.x,half:e.type==='crate'?.2:.1}));
    if(S.boss&&!['spent','yield'].includes(S.boss.phase))targets.push({id:'boss',z:S.boss.z,x:0,half:.35});
    const hits=targets.filter(q=>!w.hits.has(q.id)).map(q=>{
      const entry=q.z-.3,exit=q.z+.3,t=Math.max(0,(entry-w.prevZ)/(dz||1));
      const x=prevX+(w.x-prevX)*t;
      return {...q,t,xAt:x,valid:exit>=w.prevZ&&entry<=end&&Math.abs(q.x-x)<w.hw+q.half};
    }).filter(q=>q.valid).sort((a,b)=>a.t-b.t||String(a.id).localeCompare(String(b.id)));
    for(const q of hits){
      if(w.spent||w.hits.size>=w.pierce)break;
      w.hits.add(q.id);if(q.id==='boss')bossDamage(w.dmg,q.xAt,w);else if(q.e.type==='gate')gateHit(q.e,w.source,w);else hitEnt(q.e,w.dmg,w);
      if(w.hits.size>=w.pierce)w.spent=true;
    }
  }
  S.waves=S.waves.filter(w=>!w.spent&&(w.boss||w.z-w.z0<w.range));
}
function impact(w,target,actual,x,z){
  if(!(actual>0))return;
  const source=w?.source||'troop';
  sound('impact',w,S.ents.find(e=>e.id===target)||target,source==='hero'&&actual>=2&&S.t>=(S.nextHeavyHold||0));
  record('damage',source,target,actual,{projectileId:w?.projectileId??null,attackId:w?.attackId??null,x,z,sourceActorId:source,targetId:target,heavy:source==='hero'&&actual>=2,recovery:target===S.boss?.person?S.boss.phase==='rec':S.ents.find(e=>e.id===target)?.phase==='rec',weapon:source==='hero'?S.weapon:null});
  if(source==='hero'&&actual>=2&&S.t>=(S.nextHeavyHold||0)){
    S.poseHoldUntil=S.t+.04;S.poseHoldAtk=S.atkT;S.nextHeavyHold=S.t+.6;
    S.shake=Math.max(S.shake,.22);
  }
}
function bossDamage(dmg, x, w) {
  const b = S.boss; const mul = b.phase === 'rec' ? 2 : 1;
  const actual=Math.min(b.hp,dmg*mul*BOSS_DMG);b.hp-=actual;
  const phases=CHAPTERS[options.chapter].bossPhases||1,phase=Math.min(phases-1,Math.floor((1-b.hp/b.max)*phases));if(b.hp>0&&phase>(b.campaignPhase||0)){b.campaignPhase=phase;b.phase='reposition';b.pt=-.4;director.active=director.active.filter(t=>t.released);for(const e of S.ents){if(e.phase==='warn'&&!e.telegraph?.released){e.phase='idle';e.pt=0;e.telegraph=null;}}record('boss-phase',b.person,'team',phase+1);toast('敌将换阵 · 第'+(phase+1)+'阶段','gold');}if(actual<=0)return;impact(w,b.person,actual,x,b.z);b.hit=.08;
  if (mul > 1 && dmg >= 2) b.bigHit = .22; // 收势中挨重击：切受创帧
  fx('f2_hitFlash', x * .5, b.z - .2, .28 * mul, .16);
  if(mul>1){const source=w?.source||'troop',group=S.fx.find(f=>f.k==='crit'&&f.source===source&&f.t<.25);if(group)group.v+=actual;else S.fx.push({k:'crit',source,x:x*.4,z:b.z,life:.55,t:0,v:actual});}
  // 靠旗：每失 25% 血断一面，断旗从背后飘落
  const flags = Math.ceil(b.hp / b.max * 4);
  while (b.flags > flags) { b.flags--; b.flagFx.push({i: b.flags, t: 0}); logEv('boss', '靠旗断 余 ' + b.flags); }
}
// 开箱：状态在开箱这一刻改变，表现（飞入、闪光、亮兵、提示）随后播放
function hitEnt(e, dmg, w) {
  const hpBefore=e.hp;
  const breaker=['goulianqiang','huaji','shemao'].includes(w?.weaponId)||w?.breaker;const armor=enemyArmor(e.enemyKind,e.phase==='rec',breaker,S.t<(e.armorUntil||0));const follow=w?.source==='hero'&&S.slots.dian.id==='fengshitu'&&w.pierce>1&&w.hits?.size>1?1.15:1;const pact=w?.source==='hero'&&e.elite&&w.eliteBonus?1.1:1;const actual=Math.min(Math.max(0,e.hp),dmg*(e.type==='officer'?(e.phase==='rec'?1:.45):armor)*follow*pact*(w?.source==='companion:weiyan'&&e.elite&&e.phase==='rec'?1.2:1));e.hp-=actual;if(actual<=0)return;e.hitT=.20;impact(w,e.id,actual,e.x,e.d-S.dist);
  if(e.type==='enemy'||e.type==='officer')e.feedback=hitReadout(e.feedback,S.t,hpBefore,e.hp,e.max||ENEMY_PROFILES[e.enemyKind||'light'].hp*difficulty.ordinaryHPMultiplier,armor,e.x<(w?.x??S.heroX)?-1:1);
  if(w?.armorMark)e.armorUntil=S.t+2;
  if(w?.source==='hero'&&e.elite&&actual>=2&&S.slots.qi.id==='pozhengu'&&S.t>=(S.drumReady||0)){e.armorUntil=S.t+2;S.drumReady=S.t+8;record('treasure','pozhengu',e.id,1);}
  if(e.hp<=0){director.cancel('enemy:'+e.id);director.cancel('officer:'+e.id);if(e.type==='enemy')enemyEvent(e,'death',{source:w?.source,attackId:w?.attackId});};
  if(e.type==='enemy'&&e.hp>0&&w?.control){e.slow=.65;e.d+=1;record('control','zhenjun',e.id,.65);}
  const z = e.d - S.dist;
  fx('f2_hitFlash', e.x, z, e.type === 'crate' ? .3 : .22, .16);
  if ((e.type === 'enemy'||e.type==='officer') && e.hp <= 0 && !e.dead) { e.dead = .01; e.fallDir = e.x < S.heroX ? -1 : 1;
    if(e.type==='enemy'){const group=S.fx.find(f=>f.k==='defeat-count'&&S.t-f.at<.20&&Math.abs(f.x-e.x)<.65&&Math.abs(f.d-e.d)<4);if(group){group.n++;group.t=0;group.at=S.t;}else fx('defeat-count',e.x,z,.2,.60,{n:1,d:e.d,at:S.t});record('enemy-defeated',w?.source||'troop',e.id,1,{enemyKind:e.enemyKind,waveId:e.waveId});}
    if(e.type==='officer'){S.defeatedOfficerIds.push(e.person);e.phase='defeated';record('officer-defeated',w?.source||'troop',e.person,1);logEv('officer',PEOPLE[e.person]+' 交锋败北');toast(PEOPLE[e.person]+' · 交锋败北，胜后归队','gold');} }
  if (e.type === 'crate' && e.hp <= 0 && !e.open) { e.open = .01; openCrate(e); }
}
function openCrate(e) {
  S.stats.crates[e.kind] = (S.stats.crates[e.kind] || 0) + 1;
  const z = e.d - S.dist;
  if (e.kind === 'grain') { if(e.choiceId&&S.claimedChoices?.includes(e.choiceId))return;S.claimedChoices=S.claimedChoices||[];if(e.choiceId)S.claimedChoices.push(e.choiceId);const n=Math.round((e.n||6)*(S.slots.qi.id==='muniu'?1.5:1))+(S.slots.dian.id==='jinfanling'?2:0);S.routeXP=(S.routeXP||0)+(e.rewardXP||0);addTroops(n);toast('粮车 · 援兵 +'+n,'good');logEv('crate','粮车 +'+n);return; }
  if(e.kind==='weapon'){if(e.gives===S.weapon)return gainWeapon(e.gives,e.x,z);e.pendingWeapon=true;return;}
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
  fx('fly', x, z, .3, .6, {icon: resolveBattleWeaponPresentation(k).icon, to: 'chip'});
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
function teamFeet(wallSide=null){const wall=S.ents.find(e=>e.type==='wall'&&e.d-S.dist<.4&&e.d+e.len-S.dist>-.4),side=wallSide??wall?.side??0;return [{x:S.heroX,z:0,role:'hero'},...companionSlots(S.heroX,S.companions.length,side).map(q=>({...q,role:'companion'})),...armySlots(S.troops,S.heroX,side).map(q=>({...q,role:'soldier'}))];}
function sweptContact(ax,az,bx,bz,feet,width=.10){const dx=bx-ax,dz=bz-az;return feet.find(q=>{const u=Math.max(0,Math.min(1,((q.x-ax)*dx+(q.z-az)*dz)/(dx*dx+dz*dz||1)));return Math.abs(ax+u*dx-q.x)<=width&&Math.abs(az+u*dz-q.z)<=.36;});}
function resolveEnemyHit(shot,foot){const key=shot.attackId+':'+(shot.subAttackId||0);if(S.resolvedEnemyAttacks.has(key))return;S.resolvedEnemyAttacks.add(key);const e=S.ents.find(e=>e.id===shot.sourceEnemyId),actual=applyLoss(shot.damage,key,shot.kind,{attackId:shot.attackId,subAttackId:shot.subAttackId||0,enemyId:shot.sourceEnemyId,waveId:shot.waveId,hitRole:foot?.role,impactX:shot.x,impactZ:shot.z});if(e)enemyEvent(e,'impact',{attackId:shot.attackId,actual,hitRole:foot?.role});if(actual>0){S.redFlash=Math.max(S.redFlash,.18);if(foot?.role==='hero')S.heroHitUntil=S.t+.09;S.soldierHitUntil=S.t+.16;}return actual;}
function hostileStep(dt){
 for(const shot of S.hostileShots){if(shot.done)continue;const oldX=shot.x,oldZ=shot.z;shot.t=(shot.t||0)+dt;const u=Math.min(1,shot.t/shot.duration);shot.x=shot.origin.x+(shot.lockedTarget.x-shot.origin.x)*u;shot.z=shot.origin.z+(shot.lockedTarget.z-shot.origin.z)*u;
  if(shot.entity){if(shot.entity.dead){shot.done=true;continue;}shot.entity.x=shot.x;shot.entity.d=S.dist+shot.z;}
  const foot=sweptContact(oldX,oldZ,shot.x,shot.z,teamFeet(),shot.kind==='cavalry'?.16:.09);
  if(foot&&!shot.hitDone){shot.hitDone=true;resolveEnemyHit(shot,foot);}
  if(u>=1){shot.done=true;if(!shot.hitDone){trueDodge(shot.telegraph);const e=S.ents.find(e=>e.id===shot.sourceEnemyId);if(e)enemyEvent(e,'impact',{attackId:shot.attackId,actual:0,reason:'miss'});}if(shot.entity&&!shot.entity.dead){shot.entity.phase='exit';shot.entity.pt=0;}}
 }
 S.hostileShots=S.hostileShots.filter(s=>!s.done);
}
function drawHostileShots(){for(const shot of S.hostileShots){if(!['archer','mechanism'].includes(shot.kind))continue;const raw=proj(shot.x,shot.z),u=L.ppu*raw.s,p={...raw,y:raw.y-(shot.visualMuzzleHeight||0)*u*Math.max(0,1-(shot.t||0)/.15)};ctx.save();ctx.strokeStyle=shot.kind==='mechanism'?'#E79749':'#EEBD77';ctx.lineWidth=Math.max(2,(shot.kind==='mechanism'?5:3)*p.s);ctx.beginPath();ctx.moveTo(p.x,p.y-.2*u);ctx.lineTo(p.x,p.y+.1*u);ctx.stroke();ctx.fillStyle='#FFF0CB';ctx.beginPath();ctx.moveTo(p.x,p.y+.14*u);ctx.lineTo(p.x-4*p.s,p.y+.06*u);ctx.lineTo(p.x+4*p.s,p.y+.06*u);ctx.fill();ctx.restore();}}

function moveSpeed(){return MOVE.vmax*(S.slots.ma.id==='chitu'?1.25:S.slots.ma.id==='jingfan'?1.15:1);}
function teamEnvelope(horizon=0){const current=teamFeet(),futureWalls=S.ents.filter(e=>e.type==='wall'&&e.d-S.dist<Math.max(0,S.speed)*horizon+.4&&e.d+e.len-S.dist>-.4),future=futureWalls.flatMap(e=>teamFeet(e.side)),feet=[...current,...future],bodyRadius=.11,halfWidth=Math.max(.18,...feet.map(q=>Math.abs(q.x-S.heroX)+bodyRadius));return {halfWidth,bodyRadius,current,future,horizon};}
function teamHalf(){return teamEnvelope().halfWidth;}
function movementBounds(horizon=2){const wall=S.ents.find(e=>e.type==='wall'&&e.d-S.dist<Math.max(0,S.speed)*horizon+.4&&e.d+e.len-S.dist>-.4);return wall?(wall.side>0?[-.68,-.42]:[.42,.68]):[-.68,.68];}
function scheduleAttack(source,kind,bands,warning,impactDelay=0,bossStyle=''){
 if(S.t<(S.nextThreatAttempt[source]||0)){director.lastDeferredReason='retry-window';return null;}
 const effectiveWarning=Math.max(difficulty.minimumTelegraph,warning)+(kind==='mechanism'&&S.slots.dian.id==='xingjunyaolue'?.2:0),envelope=teamEnvelope(effectiveWarning+impactDelay+.3),walls=S.ents.filter(e=>e.type==='wall'&&e.d-S.dist<Math.max(0,S.speed)*envelope.horizon+.4&&e.d+e.len-S.dist>-.4),currentWall=S.ents.find(e=>e.type==='wall'&&e.d-S.dist<.4&&e.d+e.len-S.dist>-.4),wallSides=Array.from(new Set([currentWall?.side||0,...walls.map(e=>e.side)])),entity=S.ents.find(e=>'enemy:'+e.id===source),z=entity?entity.d-S.dist:S.boss?.z||0,segment=['archer','cavalry'].includes(kind)||(kind==='boss'&&['arrows','fan'].includes(bossStyle)),reach=['light','banner'].includes(kind)?.8:1.15;
 const projectile=segment||kind==='mechanism',targetZ=kind==='cavalry'?-5.2:-.3;
 // A foot soldier keeps moving throughout the warning. Prove safety for its swept
 // approach as well as the predicted contact, including a march stopping at an officer.
 const predictedZ=entity?z-(Math.max(0,S.speed)+enemySelfSpeed(entity))*effectiveWarning:z;
 const risk={shape:projectile?'segment':'depth-band',bands:bands.map(b=>[...b]),zMin:projectile?targetZ-.36:kind==='boss'?-.4:kind==='officer'?-.85:Math.min(z,predictedZ)-reach,zMax:projectile?z+.36:kind==='boss'?z+9:kind==='officer'?.85:z+reach,width:projectile?(kind==='cavalry'?.16:.09):kind==='boss'||kind==='officer'?0:.11,origin:projectile?{x:entity?.x||0,z:kind==='boss'?z-.6:z}:undefined,target:projectile?{x:(bands[0][0]+bands[0][1])/2,z:targetZ}:undefined,wallSides};
 if(entity&&['archer','mechanism'].includes(kind))risk.originEnd={x:entity.x,z:z-Math.max(0,S.speed)*effectiveWarning};
 const t=director.schedule({impactDelay,duration:Math.max(.15,impactDelay+.18),id:source+':'+Math.round(S.t*60),source,kind,now:S.t,warning:effectiveWarning,bands,x:S.heroX,speed:moveSpeed(),halfWidth:.11,bounds:movementBounds(envelope.horizon),maxThreats:difficulty.simultaneousThreats,safety:(deadline,relevant)=>formationSafety(S.heroX,S.t,deadline,moveSpeed(),movementBounds(envelope.horizon),S.troops,S.companions.length,[risk,...relevant.map(t=>t.riskFootprint||{shape:'depth-band',bands:t.bands,zMin:-.85,zMax:5,width:.11,wallSides})])});
 if(!t)S.nextThreatAttempt[source]=S.t+.12;
 if(t){t.riskFootprint=risk;t.aimX=S.heroX;t.footprint={halfWidth:envelope.halfWidth,bodyRadius:envelope.bodyRadius,centre:S.heroX,current:envelope.current,future:envelope.future};t.wasThreatened=teamFeet().some(p=>footAtRisk(p,risk));}return t;
}
function restoreLoss(count,source,since=0){let left=count;for(const l of S.losses){if(l.t<since)continue;const take=Math.min(left,l.remaining);l.remaining-=take;left-=take;if(left<=0)break;}const restored=count-left;if(restored>0)addTroops(restored,source);return restored;}
function applyLoss(raw,source,kind,attribution={}){
 if(S.ended||S.t-(S.sourceProtection[source]??-Infinity)<.25)return 0;
 S.sourceProtection[source]=S.t;const scaled=Math.max(0,raw*(kind==='light'?1:difficulty.incomingDamageMultiplier)),factors=[];const protections=[];
 if(kind==='cavalry'&&S.slots.qi.id==='tiebifu'){factors.push(.75);protections.push('tiebifu');}
 if(['mechanism','archer','arrows'].includes(kind)&&S.slots.ma.id==='jueying'){factors.push(.8);protections.push('jueying');}
 if(kind==='boss'&&S.slots.qi.id==='jiuzhouyin'&&!S.jiuzhouUsed){factors.push(.8);protections.push('jiuzhouyin');S.jiuzhouUsed=true;}
 if(kind!=='gate'&&S.weapon==='dundao'&&S.t>=(S.shieldReady||0)){factors.push(options.lineup.allies.includes('caoren')?.65:.80);protections.push('dundao');S.shieldReady=S.t+8;sound('block',{source:'hero',weaponId:'dundao',attackId:source},{type:'enemy',elite:true});}
 let prevented=0;
 if(['guard','officer','boss'].includes(kind)&&S.slots.qi.id==='huxinjing'&&S.t>=(S.mirrorReady||0)){prevented+=Math.min(3,scaled);S.mirrorReady=S.t+12;protections.push('huxinjing');}
 if(scaled>=4&&options.lineup.allies.includes('lukang')&&!S.lukangUsed){prevented+=Math.min(3,scaled);S.lukangUsed=true;protections.push('lukang');}
 const product=reductionProduct(factors),final=Math.max(0,Math.round(scaled*product-prevented));
 const oldTroops=S.troops,actual=-addTroops(-final,kind);S.damageSources[kind]=(S.damageSources[kind]||0)+actual;const detail={t:S.t,source,kind,raw,scaled,factors,protections,prevented,final,actual,...attribution};S.damageHistory.push(detail);if(S.damageHistory.length>200)S.damageHistory.shift();record('loss',source,'team',actual,detail);
 if(actual>0)showFriendlyLoss(actual,source,oldTroops,attribution);
 return actual;
}
function showFriendlyLoss(actual,source,oldTroops,attribution){
 const wall=S.ents.find(e=>e.type==='wall'&&e.d-S.dist<.4&&e.d+e.len-S.dist>-.4),slots=armySlots(oldTroops,S.heroX,wall?.side||0).map((s,slot)=>({...s,slot}));
 const ix=Number.isFinite(attribution.impactX)?attribution.impactX:S.heroX,iz=Number.isFinite(attribution.impactZ)?attribution.impactZ:-1.35;
 slots.sort((a,b)=>Math.abs(a.x-ix)*3+Math.abs(a.z-iz)-Math.abs(b.x-ix)*3-Math.abs(b.z-iz));
 // A visible body represents a rank at large troop counts. Every real loss still
 // has an impact, but at most three bodies fall in one event to keep aim readable.
 const n=Math.min(slots.length,3,Math.max(1,Math.ceil(actual/Math.max(1,oldTroops/Math.max(1,slots.length)))));
 const chosen=slots.filter(s=>!S.casualties.some(c=>c.slot===s.slot&&S.t-c.at<.5)).slice(0,n);
 for(const s of chosen)S.casualties.push({id:source+':'+s.slot,slot:s.slot,x:s.x,d:S.dist+s.z,at:S.t,direction:s.x<ix?-1:1,loss:actual});
 if(S.casualties.length>18)S.casualties.splice(0,S.casualties.length-18);
}
function feedbackNow(){return S.t+(S.feedbackElapsed||0);}
function friendlyLossPose(slot){return casualtySlotPose(S.casualties,slot,feedbackNow());}
function trueDodge(t){if(!t?.wasThreatened||t.dodgeCounted)return;t.dodgeCounted=true;S.stats.dodged++;S.avoidances++;record('dodge',t.source,'team',1);if(Math.abs(S.heroX-(t.aimX??S.heroX))>.12&&S.t>=(S.dodgeToastReady||0)){toast('躲开了！','good');S.dodgeToastReady=S.t+3;}
 if(S.slots.ma.id==='jingfan'&&S.t>=(S.jingfanReady||0)){restoreLoss(1,'jingfan',t.created-12);S.jingfanReady=S.t+10;}
 if(S.slots.dian.id==='yingbianbingshu'&&S.t>=(S.yingbianReady||0)){S.nextPierce=true;S.yingbianReady=S.t+8;}
 if(options.lineup.allies.includes('zhonghui')&&S.t>=(S.zhonghuiReady||0)){S.nextEliteBonus=true;S.zhonghuiReady=S.t+8;}
}
function readableEnemy(e,z){const p=proj(e.x,z),height=(e.enemyKind==='cavalry'?.60:.42)*L.ppu*p.s;return z>-.5&&z<=36&&height>=12&&p.y>L.hudBottom+height*.25&&p.x>=8&&p.x<L.W-8;}
function enemySelfSpeed(e){const p=ENEMY_PROFILES[e.enemyKind||'light'];return (e.enemyKind==='light'?combatTuningFor(options.chapter).lightSpeed:p.speed)*(e.slow>0?.5:1);}
function threatStep(e,dt){
 const kind=e.enemyKind||'light',p=ENEMY_PROFILES[kind];e.enemyKind=kind;e.hitT=Math.max(0,(e.hitT||0)-dt);e.slow=Math.max(0,(e.slow||0)-dt);
 if(e.dead){e.dead+=dt;director.cancel('enemy:'+e.id);return;}
 e.pt=(e.pt||0)+dt;e.phase=e.phase||'approach';
 const melee=['light','guard','shield','banner'].includes(kind),selfSpeed=enemySelfSpeed(e),warning=difficulty.minimumTelegraph+(kind==='cavalry'?.35:0);
 // World distance belongs to the enemy. An attack budget never gives it the
 // camera's march speed. Foot soldiers advance; bows/engines plant to fire.
 const moving=melee||e.phase==='approach'||e.phase==='exit';
 if(moving&&!(e.charge&&!e.charge.done))e.d-=dt*(e.phase==='exit'?Math.max(2,selfSpeed):selfSpeed);
 e.moving=moving&&!(e.charge&&!e.charge.done);if(e.moving||e.charge&&!e.charge.done)e.walk=(e.walk||0)+dt*(kind==='cavalry'&&e.phase==='strike'?7:3.8);
 let z=e.d-S.dist;
 if(!e.visibleAt&&readableEnemy(e,z)){e.visibleAt=S.t;enemyEvent(e,'visible');}
 const reach=kind==='light'||kind==='banner'?.8:1.15,front=teamFeet().filter(q=>Math.abs(q.x-e.x)<p.width+.11).reduce((v,q)=>Math.max(v,q.z),0),contactZ=front+reach*.35;
 const closing=Math.max(0,S.speed)+(melee?selfSpeed:0),acquireZ=melee?contactZ+closing*(warning+.30):kind==='archer'?32:22;
 if(e.phase==='approach'&&e.visibleAt&&z>-.2&&z<=acquireZ){e.phase='idle';e.pt=0;enemyEvent(e,'acquired');}
 if(e.phase==='idle'){
  const releaseZ=z-closing*warning;
  // When the warning no longer fits ahead of the team, let this enemy pass.
  // No snap forward and no invisible catch-up attack for a deferred wave.
  const window=melee?releaseZ>=-3.7&&releaseZ<=contactZ+.2&&teamFeet().some(q=>Math.abs(q.x-e.x)<p.width+.11&&Math.abs(q.z-releaseZ)<=reach):releaseZ>4;
  if((e.attackN?e.pt>=p.cooldown:e.pt>=.30)&&e.visibleAt&&window){
   const targetX=melee||kind==='cavalry'||kind==='mechanism'?e.x:S.heroX,width=p.width,bands=[[Math.max(-1,targetX-width),Math.min(1,targetX+width)]],targetZ=kind==='cavalry'?-5.2:-.3,flight=!melee?Math.max(.02,(releaseZ-targetZ)/(kind==='cavalry'?36:60)):0;
   const t=scheduleAttack('enemy:'+e.id,kind,bands,warning,flight);
   if(t){e.telegraph=t;e.phase='warn';e.pt=0;e.band=t.bands[0];e.lockedTarget={x:targetX,z:targetZ};enemyEvent(e,'warn',{attackId:t.id,execute:t.execute,end:t.end});sound('warn',{source:'enemy:'+e.id});record('telegraph',kind,e.id,t.execute-t.created,{execute:t.execute,bands:t.bands});}
   else if(e.lastDeferred!==Math.floor(S.t)){e.lastDeferred=Math.floor(S.t);enemyEvent(e,'delayed',{reason:director.lastDeferredReason});}
  }else if(z<(melee?-3.7:4)){e.phase='exit';e.pt=0;enemyEvent(e,'disengage',{reason:'attack-window-passed'});}
 }else if(e.phase==='warn'&&S.t>=e.telegraph.execute){
  e.phase='strike';e.pt=0;e.attackN=(e.attackN||0)+1;const t=e.telegraph,banner=S.ents.some(q=>q.enemyKind==='banner'&&!q.dead&&Math.abs(q.d-e.d)<12)?1.15:1,damage=p.damage*banner,attackId=t.id;
  enemyEvent(e,'release',{attackId,origin:{x:e.x,z},lockedTarget:e.lockedTarget});sound('release',{source:'enemy:'+e.id,attackId});
  if(!melee){
   const origin={x:e.x,z},lockedTarget={...e.lockedTarget},duration=Math.max(.02,(z-lockedTarget.z)/(kind==='cavalry'?36:60)),shot={source:attackId,sourceEnemyId:e.id,waveId:e.waveId,attackId,subAttackId:0,kind,visualMuzzleHeight:kind==='archer'?.30:0,x:e.x,z,origin,lockedTarget,releaseAt:S.t,impactAt:S.t+duration,duration,t:0,speed:kind==='cavalry'?36:60,damage,telegraph:t,entity:kind==='cavalry'?e:null,done:false};S.hostileShots.push(shot);e.charge=shot;t.end=Math.max(t.end,shot.impactAt+.1);t.released=true;
  }else{
   const foot=teamFeet().find(q=>Math.abs(q.x-e.x)<p.width+.11&&Math.abs(q.z-z)<=reach);
   if(foot)resolveEnemyHit({attackId,sourceEnemyId:e.id,waveId:e.waveId,kind,damage,x:e.x,z},foot);
   else {trueDodge(t);enemyEvent(e,'impact',{attackId,actual:0,reason:'out-of-reach-or-empty-band'});}t.released=true;
  }
 }else if(e.phase==='strike'&&e.pt>.25&&(!e.charge||e.charge.done)){e.phase='rec';e.pt=0;}
 else if(e.phase==='rec'&&e.pt>=.85){e.phase=melee||z<8?'exit':'idle';e.pt=0;}
}

function footXs(){const n=Math.min(12,Math.round(S.troops/3)),xs=[S.heroX,...S.companions.map(c=>S.heroX+c.dx*.62)];for(let i=0;i<n;i++)xs.push(S.heroX+((i%4)-1.5)*.17+(Math.floor(i/4)%2)*.08);return xs.map(x=>wallSafeX(x));}
function wallSafeX(x){const wall=S.ents.find(e=>e.type==='wall'&&e.d-S.dist<.4&&e.d+e.len-S.dist>-.4);return Math.max(-.95,Math.min(.95,wall?(wall.side>0?Math.min(x,-.10):Math.max(x,.10)):x));}
function addTroops(n, src) {
  const before=S.troops;S.troops=Math.max(0,Math.min(999999,S.troops+n));
  const actual=S.troops-before,loss=Math.max(0,-actual);record('troops',src||'event','team',actual);
  if(loss>0){S.losses.push({t:S.t,remaining:loss});}
  if(loss>0)sound('hurt',{source:'enemy',attackId:'loss:'+src+':'+Math.round(S.t*60)},{type:'team'});
  const last=S.deltas[S.deltas.length-1];
  if(actual){if(last&&last.t<.3&&Math.sign(last.v)===Math.sign(actual)&&!src){last.v+=actual;last.t=0;}else S.deltas.push({v:actual,t:0,src});}
  if(S.troops===0&&S.slots.qi.id==='qixing'&&!S.slots.qi.used){S.troops=5;S.slots.qi.used=true;record('revive','qixing','team',5);S.deltas.push({v:5,t:0,src:'qixing'});toast('七星灯 · 留住 5 人','gold');}
  if(loss>0&&S.support.id==='hua'&&S.support.cd<=0&&S.troops>0){
    if(!S.support.pending)S.support.pending={loss,t:SUPPORT.delay};else S.support.pending.loss+=loss;
  }
  if(S.troops<=0)S.support.pending=null;
  return actual;
}
function supportStep(dt) {
  if(S.ended||S.troops<=0){S.support.pending=null;return;}
  const sp = S.support;if(sp.id!=='hua'){sp.flash=Math.max(0,(sp.flash||0)-dt);return;} sp.cd = Math.max(0, sp.cd - dt);
  if (sp.pending) {
    sp.pending.t -= dt;
    if (sp.pending.t <= 0) {
      const back = Math.max(1, Math.round(sp.pending.loss * (SUPPORT.share+(S.slots.dian.id==="qingnang"?.1:0))));
      sp.pending = null; sp.cd = SUPPORT.cd; sp.uses++; S.stats.supportSaved += back; sp.flash = 1;
      restoreLoss(back,'hua'); toast('华佗 · 救回伤兵 +' + back, 'good'); logEv('support', '华佗 +' + back);
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
    if(e.type==='officer')officerStep(e,dt);
    if (e.type === 'enemy') threatStep(e,dt);
    if(e.type==='crate'&&e.pendingWeapon&&z<=0){if(Math.abs(S.heroX-e.x)<.32)gainWeapon(e.gives,e.x,z);e.pendingWeapon=false;}
    if (e.type === 'crate') { e.hitT = Math.max(0, e.hitT - dt); if (e.open) e.open += dt; }
    if (e.type === 'gate' && !e.passed && z <= 0) {
      e.passed = true;
      const inside = Math.abs(S.heroX - e.x) < .46;
      if (inside) {
        e.claim=.01;let v=e.val,extra=0;if(v<0&&S.slots.dian.id==="mengde"&&S.t>= (S.bookReady||0)){v=Math.ceil(v/2);S.bookReady=S.t+20;S.slots.dian.flash=.8;record("treasure","mengde",e.id,v);}
        // 太平要术（典籍）：通过援兵门时额外 +10%（至少 +1），调试初值
        if (v > 0 && S.slots.dian.id === 'taiping') { extra = Math.max(1, Math.round(v * .1)); S.stats.taiping += extra; S.slots.dian.flash = .8; S.slots.dian.n++; }
        const gateDelta=addTroops(v, 'gate');if(gateDelta<0){S.damageSources.gate=(S.damageSources.gate||0)-gateDelta;S.damageHistory.push({t:S.t,source:'gate:'+e.id,kind:'gate',raw:-v,actual:-gateDelta});} if (extra) addTroops(extra, 'taiping');
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
    if(e.type==='officer')return !e.dead||e.dead<1.4;
    if (e.type === 'wall') return e.d + e.len - S.dist > -6;
    if(e.type==='enemy'){if(e.dead>1){enemyEvent(e,'despawnReason',{reason:'death-animation-complete'});return false;}if(z<=(e.enemyKind==='cavalry'?-5.3:-4)){enemyEvent(e,'despawnReason',{reason:'passed-rear-boundary'});director.cancel('enemy:'+e.id);return false;}return true;}
    if (e.type === 'crate' && e.open > 1.2&&!e.pendingWeapon) return false;
    if (e.type === 'gate' && (e.claim > .6 || e.miss > .5)) return false;
    return z > -4;
  });
}

// Named route officers hold a fighting position; they never use soldier contact/cleanup.
function officerStep(e,dt){
  e.walk+=dt*2.6;e.hitT=Math.max(0,(e.hitT||0)-dt);
  if(e.dead){e.dead+=dt;return;}
  const z=e.d-S.dist;
  if(e.phase==='approach'){
    if(z>16||S.inWall)return;
    if(z>12){e.d-=dt*2.2;return;}
    e.d=S.dist+12;e.phase='idle';e.pt=0;logEv('officer',PEOPLE[e.person]+' 拦阵');
  }
  e.d=S.dist+12;e.pt+=dt;
  if(e.phase==='idle'&&e.pt>.6){const t=scheduleAttack('officer:'+e.id,'officer',[[Math.max(-1,S.heroX-.22),Math.min(1,S.heroX+.22)]],difficulty.minimumTelegraph);if(!t)return;e.telegraph=t;e.phase='warn';e.pt=0;e.band=t.bands[0];logEv('officer',PEOPLE[e.person]+' 预警');sound('warn',{source:'enemy:'+e.person});}
  else if(e.phase==='warn'&&(e.telegraph?S.t>=e.telegraph.execute:e.pt>=difficulty.minimumTelegraph)){e.phase='strike';e.pt=0;sound('release',{source:'enemy:'+e.person,weaponId:actorWeapon('enemy:'+e.person)});const hit=teamFeet().some(q=>Math.abs(q.z)<=.85&&q.x>e.band[0]&&q.x<e.band[1]);if(hit){const actual=applyLoss(4,e.telegraph?.id||'officer:'+e.id+':'+Math.round(S.t),'officer');logEv('officer',PEOPLE[e.person]+(actual>0?' 出招 -'+actual:' 出招 · 防护挡住'));if(actual>0)S.redFlash=.35;}else {trueDodge(e.telegraph);logEv('officer',PEOPLE[e.person]+' 出招闪过');}fx('f2_bladeWave',e.x,2,.6,.3);}
  else if(e.phase==='strike'&&e.pt>.25){e.phase='rec';e.pt=0;logEv('officer',PEOPLE[e.person]+' 收势');}
  else if(e.phase==='rec'&&e.pt>1.2){e.phase='idle';e.pt=0;}
}

// ───────────────────────── 敌将 ─────────────────────────
// 对峙 → 预警 → 出招 → 收势 循环；血尽 → 力竭（spent）→ 收服（yield）。收服后战斗结束，不再重置。
const BOSS_DMG = .30; // Explicit project tuning; actual damage still decides defeat.
const BOSS_T = {idle: 2.0, warn: 1.4, strike: .5, rec: 2.2, spent: 1.4};
function bossStep(dt) {
  const b=S.boss,base=BOSS_PATTERNS[b.person];if(!base)throw new Error('Missing explicit boss pattern: '+b.person);const selectedStyle=base.sequence[b.person==='lukang'?(b.campaignPhase||0)%base.sequence.length:(b.cycleN+(b.campaignPhase||0))%base.sequence.length],pattern=['warn','strike'].includes(b.phase)&&b.attackPattern?b.attackPattern:{...base,style:selectedStyle};const style=pattern.style;b.pattern=pattern.name;b.pt+=dt; b.hit = Math.max(0, b.hit - dt); b.bigHit = Math.max(0, (b.bigHit || 0) - dt);
  b.trail += (b.hp - b.trail) * Math.min(1, dt * (b.trail > b.hp + .5 && b.trailWait <= 0 ? 3 : 0));
  b.trailWait = (b.trailWait || 0) - dt; if (b.hit > .1) b.trailWait = .4;
  for (const f of b.flagFx) f.t += dt; b.flagFx = b.flagFx.filter(f => f.t < 1.4);
  const next = p => { b.phase = p; b.pt = 0; };
  if (b.hp <= 0 && !['spent', 'yield'].includes(b.phase)) {
    next('spent');director.cancel('boss:'+b.person);
    toast(b.name+' 力竭','gold'); logEv('boss', '力竭');
  }
  if (b.phase === 'idle' && b.pt > BOSS_T.idle) {
    const side=S.heroX<-.15?-1:S.heroX>.15?1:0;
    const width=['thrust','overhead','charge','arrows'].includes(style)?.14:['short','double'].includes(style)?.20:.25;const locked=Math.max(-.72,Math.min(.72,S.heroX));const bands=style==='sides'||style==='formation'?[[-1,-.58],[.58,1]]:style==='fire'||style==='mechanism'||style==='trap'?(b.cycleN%2?[[-.2,.2]]:[[-1,-.58],[.58,1]]):style==='sequential'?[[b.cycleN%2? .10:-.60,b.cycleN%2?.60:-.10]]:[[Math.max(-1,locked-width),Math.min(1,locked+width)]];
    const telegraph=scheduleAttack('boss:'+b.person,'boss',bands,pattern.warn,(b.z+(pattern.style==='double'?9:0))/pattern.speed+.15,style);
    if(!telegraph)return;
    b.attackPattern={...pattern};b.telegraph=telegraph;b.bands=telegraph.bands;b.band=b.bands[0];next('warn');sound('warn',{source:'enemy:'+b.person});b.cycleN++;S.stats.bossStrikes++;logEv('boss','预警 '+side);
  } else if (b.phase === 'warn' && (b.telegraph?S.t>=b.telegraph.execute:b.pt>pattern.warn)) {
    next('strike');if(b.telegraph)b.telegraph.released=true;sound('release',{source:'enemy:'+b.person,weaponId:actorWeapon('enemy:'+b.person)});
    if(['arrows','fan'].includes(style)){const attackId=b.telegraph.id;for(const [i,band] of (b.bands||[b.band]).entries()){const origin={x:0,z:b.z-.6},lockedTarget={x:(band[0]+band[1])/2,z:-.3},duration=(origin.z-lockedTarget.z)/54;S.hostileShots.push({source:attackId,sourceEnemyId:'boss:'+b.person,waveId:'boss',attackId,subAttackId:i,kind:'archer',x:origin.x,z:origin.z,origin,lockedTarget,releaseAt:S.t,impactAt:S.t+duration,duration,t:0,speed:54,damage:pattern.damage,telegraph:b.telegraph,done:false});}b.telegraph.released=true;}else for(const band of b.bands||[b.band])for(let n=0;n<(['double','short'].includes(pattern.style)?2:1);n++)S.waves.push({boss:true,attackId:b.telegraph?.id||'boss:'+b.person+':'+b.cycleN,telegraph:b.telegraph,subAttackId:n,band:[...band],damage:pattern.damage,k:pattern.style==='sides'?'g_wave_shemao':pattern.style==='fire'?'g_wave_guandao':'g_wave_huaji',x:(band[0]+band[1])/2,z:b.z-.6+n*9,z0:b.z,prevZ:b.z,speed:-pattern.speed,t:0,hits:new Set(),x0:0,alpha:1,hw:(band[1]-band[0])/2,h:.5,wide:(band[1]-band[0])*1.4,range:99,dmg:0,pierce:0});
    // Telegraph alone does not generate an impact shake.
  } else if (b.phase === 'strike' && b.pt > BOSS_T.strike) next('rec');
  else if (b.phase === 'rec' && b.pt > (base.recovery||BOSS_T.rec)) next('reposition');
  else if(b.phase==='reposition'&&b.pt>1.1)next('idle');
  else if (b.phase === 'spent' && b.pt > BOSS_T.spent) {
    next('yield');S.defeatedBossId=b.person;S.ended=true;terminalThreatAudit('battle-victory'); S.seal={t:0,life:2.2,who:b.person,ch:CHAPTERS[options.chapter].allies.includes(b.person)?'盟':CHAPTERS[options.chapter].visit.includes(b.person)?'访':CHAPTERS[options.chapter].capture.includes(b.person)?'降':'胜'};
    b.flagFx.push({i: -1, t: 0, white: true});
    const relation=({降:'已收服',访:'寻访达成',盟:'结盟达成',胜:'已击败'})[S.seal.ch];toast(b.name+' · '+relation,'gold');logEv('boss',relation);
  }
  // 敌将刀气（向主将）；判定在刀气到达主将深度的一帧
  for (const w of S.waves) if (w.boss) {
    if (!w.hitDone) {
      const band=w.band||b.band,feet=teamFeet().filter(q=>q.z>=-.4&&q.z<=Math.max(w.prevZ??w.z,w.z)+.36&&q.z>=Math.min(w.prevZ??w.z,w.z)-.36);let inBand=feet.some(q=>q.x>band[0]&&q.x<band[1]);if(!inBand&&w.z>-.4)continue;
      w.hitDone = true; w.spent = true;if(inBand&&S.slots.ma.id==="dilu"&&S.t>=(S.mountReady||0)){const edge=Math.min(Math.abs(S.heroX-band[0]),Math.abs(S.heroX-band[1]));if(edge<=.15){S.heroX=S.targetX=Math.max(-.82,Math.min(.82,Math.abs(S.heroX-band[0])<Math.abs(S.heroX-band[1])?band[0]-.16:band[1]+.16));inBand=S.heroX>band[0]-.05&&S.heroX<band[1]+.05;if(!inBand){S.mountReady=S.t+15;record("treasure","dilu","team",1);}}}
      if (inBand) { const actual=applyLoss(w.damage||10,w.attackId+':'+(w.subAttackId||0),'boss',{attackId:w.attackId,subAttackId:w.subAttackId||0,bossId:b.person});if(actual>0){S.stats.hitTaken++;S.redFlash=.8;S.shake=1;toast('中招 · 兵力 -'+actual,'bad');logEv('boss','中招 -'+actual);} }
      else {trueDodge(w.telegraph);logEv('boss','闪开');}
    }
  }
  // 吕布亲兵（精兵，2 血）；收服时转身退走
  S.minT -= dt;
  if (S.minT <= 0 && b.phase==='rec'&&S.ents.filter(e=>e.type==='enemy'&&!e.dead).length<2) { S.minT = 6.4; const x = rnd() < .5 ? -.5 : .5; for(let i=0;i<2;i++)spawnBossGuard(x+(i-1)*.18,S.dist+b.z-1.5-i*.5,'boss:'+b.person+':recovery:'+b.cycleN); }
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

// Warnings belong to the road plane, below every actor. Their shape matches the
// attack: a narrow projectile line, a cavalry corridor, or a local melee contact.
function drawEnemyWarnings(){
 for(const e of S.ents){if(e.type!=='enemy'||e.dead||!e.telegraph||!['warn','strike'].includes(e.phase))continue;
  const t=e.telegraph,z=e.d-S.dist;if(z< -4||z>36)continue;const kind=e.enemyKind,warn=e.phase==='warn',color=warn?'#E6B34F':'#EE6F46';ctx.save();ctx.strokeStyle=color;ctx.fillStyle=warn?'rgba(229,166,65,.15)':'rgba(218,77,44,.23)';ctx.lineWidth=1.5;
  if(['archer','mechanism'].includes(kind)){
   const q=e.lockedTarget,a=proj(e.x,z),b=proj(q.x,q.z);ctx.globalAlpha=warn?.7:.35;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
   ctx.beginPath();ctx.ellipse(b.x,b.y,.10*L.ppu*b.s,.025*L.ppu*b.s,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  }else if(kind==='cavalry'){
   const x=e.lockedTarget.x,end=e.lockedTarget.z,width=.16,a=proj(x-width,end),b=proj(x+width,end),c=proj(x+width,z),d=proj(x-width,z);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();ctx.fill();ctx.stroke();
   for(let at=end+1;at<z;at+=3){const a=proj(x-.10,at+.6),b=proj(x,at),c=proj(x+.10,at+.6);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.stroke();}
  }else{
   const at=warn?z-(Math.max(0,S.speed)+enemySelfSpeed(e))*Math.max(0,t.execute-S.t):z,p=proj(e.x,Math.max(-3.7,at)),unit=L.ppu*p.s;
   ctx.beginPath();ctx.ellipse(p.x,p.y,(ENEMY_PROFILES[kind].width+.11)*unit,.045*unit,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  }
  ctx.restore();
 }
}
function drawEnemyIntents(){
 const shown=new Set(),blocked=[...LABELS_DRAWN.map(r=>({x:r.x,y:r.y,w:r.w,h:r.h})),{x:0,y:L.heroY-72,w:L.W,h:L.H-L.heroY+72}],bounds={x:52,y:L.hudBottom+12,w:L.W-60,h:Math.max(24,L.heroY-L.hudBottom-98)};
 for(const e of S.ents.filter(e=>e.type==='enemy'&&!e.dead&&e.phase==='warn').sort((a,b)=>a.telegraph.execute-b.telegraph.execute)){
  const kind=e.enemyKind;if(shown.has(kind)||shown.size>=3||e.d-S.dist<0)continue;
  const label=({archer:'弓箭瞄准',cavalry:'骑兵冲锋',mechanism:'弩炮瞄准',shield:'盾兵挥砍',guard:'守军出刀',light:'敌兵出刀',banner:'旗兵出刀'})[kind],p=proj(e.x,e.d-S.dist),w=label.length*12+12,h=22;
  const wanted={x:p.x-w/2,y:p.y-(kind==='cavalry'?.62:.46)*L.ppu*p.s-h,w,h},r=nearestLabelRect(wanted,blocked,bounds);
  // Never relocate a label far from its attacker or cover an existing pickup.
  if(Math.abs(r.x-wanted.x)>60||Math.abs(r.y-wanted.y)>42||blocked.some(b=>r.x<b.x+b.w+4&&r.x+r.w>b.x-4&&r.y<b.y+b.h+4&&r.y+r.h>b.y-4))continue;
  shown.add(kind);blocked.push(r);ctx.fillStyle='rgba(42,31,22,.87)';ctx.fillRect(r.x,r.y,w,h);text(label,r.x+w/2,r.y+h/2,12,{align:'center',color:'#FFE0A1'});LABELS_DRAWN.push({...r,kind:'enemy-intent',entityId:e.id,content:label});
 }
}

let LABELS = [];
function drawWorld() {
  const list = [];
  // Keep all threats and nearby bodies visible; defer only distant bodies, never their simulation.
  // The budget includes named officers and the commander. An impossible near-field overflow
  // remains visible and measurable rather than hiding an imminent collision to fake a pass.
  const live=S.ents.filter(e=>['enemy','officer'].includes(e.type)&&!e.dead&&e.d-S.dist>-5&&e.d-S.dist<L.zP0+20);
  const essential=live.filter(e=>e.type==='officer'||e.d-S.dist<=12||e.phase==='warn'||e.phase==='strike');
  const bodyIds=new Set(essential.map(e=>e.id)),bossSlots=S.boss?.hp>0?1:0;
  const distant=live.filter(e=>!bodyIds.has(e.id)).sort((a,b)=>a.d-b.d||a.id-b.id);
  for(const e of distant.slice(0,Math.max(0,64-bossSlots-bodyIds.size)))bodyIds.add(e.id);
  S.bodyBudget={limit:64,essential:essential.length+bossSlots,deferred:distant.filter(e=>!bodyIds.has(e.id)).length};
  for (const s of S.scen) list.push({z: s.d - S.dist, draw: () => drawScen(s)});
  for (const e of S.ents) {
    if(e.type==='enemy'&&!e.dead&&!bodyIds.has(e.id))continue;
    if (e.type === 'wall') { drawWallDecal(e); list.push(...wallPieces(e)); continue; }
    list.push({z: e.d - S.dist, draw: () => drawEnt(e)});
  }
  if (S.boss) { drawBossDecal(); list.push({z: S.boss.z, draw: drawBoss}); }
  queueCasualtyBodies(list);
  queueFriendlyBodies(list);
  list.sort((a, b) => b.z - a.z);
  for (const it of list) if (it.z > -5 && it.z < L.zP0 + 20) it.draw();
}
function drawScen(s) {
  const z = s.d - S.dist; const p = proj(s.x, z); if (p.y < L.P0 - 30) return;
  const h = (s.small?.18:s.fence ? .36 : s.k === 'tower' ? 1.25 : s.k === 'rocks' ? .45 : s.k === 'granary' ? .8 : .72) * L.ppu * p.s;
  const k = s.fence ? use('场景·木栅', 'g_juma', 'palisade') : use('场景·' + s.k, 'g_' + s.k, s.k);
  const fog = Math.max(0, Math.min(1, (p.y - L.P0) / (L.Z1[1] - L.P0)));
  ctx.save(); ctx.globalAlpha = .35 + .65 * fog;shadow(p.x,p.y,h*(s.fence?1.1:1.35));drawFrame(k, p.x, p.y, h, {flip: s.flip}); ctx.restore();
}

// —— 辕门 ——
const GATE_COL = {plus: {band: 'g_bannerBlue', fb: 'gateBlue', num: '#FFF6DA', stroke: '#173a66', sub: '援兵'},
  minus: {band: 'g_bannerRed', fb: 'gateRed', num: '#FFE9E2', stroke: '#5b120b', sub: '伏兵'},
  zero: {band: 'g_bannerPaper', fb: 'gateNeutral', num: '#2A2016', stroke: 'rgba(243,234,214,.9)', sub: '空营'}};
function drawEnt(e) {
  const z = e.d - S.dist;
  if (e.type === 'gate') return drawGate(e, z);
  if (e.type === 'crate') return drawCrate(e, z);
  if(e.type==='officer')return drawOfficer(e,z);
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
  ctx.save(); ctx.globalAlpha = fade*(z<3.5?.22:1);
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
    const slot=e.x<0?0:1;const peers=LABELS.filter(q=>q.kind==='gate'&&!q.e.passed&&(q.e.x<0?0:1)===slot&&q.z<l.z);y-=Math.min(3,peers.length)*34;
    x=Math.max(68,Math.min(L.W-40,x));panel(x-28,y-17,56,34,{fill:l.val<0?'rgba(88,25,22,.94)':'rgba(20,47,75,.94)'});
    e.lx = x; e.ly = y; e.lu = l.u; e.lw = l.rect.w;
  } else if (e.claim) {
    const k = Math.min(1, e.claim / .35), q = k * k;
    x = e.lx + ((S.troopX ?? x) - e.lx) * q; y = e.ly + ((S.troopY ?? y) - e.ly) * q; sc = 1 - .45 * q; a = k < .8 ? 1 : 1 - (k - .8) / .2;
    if (e.claim > .35) return;
  } else if (e.miss) { x = e.lx; y = e.ly - e.miss * 20; a = Math.max(0, 1 - e.miss / .3); if (a <= 0) return; }
  if (a < .5 && !e.passed) GATE_STAT.unsettledHidden++;
  ctx.save(); ctx.globalAlpha = a;
  const sz = Math.max(NUM.gateMin, Math.round(size * sc));
  const bw=Math.max(56,measure(str,sz)+8),bottom=sub&&!e.claim?size*.5+10+TYPE.caption*.65:Math.max(17,sz*.65);
  LABELS_DRAWN.push({kind:'gate',x:x-bw/2,y:y-Math.max(17,sz*.65),w:bw,h:Math.max(17,sz*.65)+bottom});
  text(str, x, y, sz, {kind: 'gate', family: NUMF, weight: 800, align: 'center', color: l.C.num, stroke: l.C.stroke, strokeW: 4, layer: 'L6', claim: !!e.claim || !!e.miss});
  if (sub && !e.claim) text(l.C.sub, x, y + size * .5 + 10, TYPE.caption, {kind: 'ui', align: 'center', color: l.C.num, stroke: l.C.stroke, strokeW: 3, layer: 'L6'});
  ctx.restore();
}

// —— 门箱 ——（造型区分：粮车 / 兵器匣 / 军械箱 / 宝匣；名牌写明开出什么）
const CRATE = {grain: ['g_grainCart', 'boxTroops', '粮车', .46], weapon: ['g_weaponCase', 'boxEquipment', '兵器匣', .36], arms: ['g_arrowCrate', 'boxChain', '军械箱', .44], treasure: ['g_treasureBox', 'boxCompanion', '宝匣', .34]};
function crateContent(e) {
  if (e.kind === 'weapon') return {icon: (has('c20_icon_'+e.gives)?'c20_icon_':'g_icon_') + e.gives, str: e.gives === S.weapon ? '升阶' : WEAPONS[e.gives].label};
  if (e.kind === 'treasure') return {icon: TREASURE[e.gives].icon, str: TREASURE[e.gives].name};
  if (e.kind === 'arms') { const nx = ARMS_NEXT[S.arms]; return {icon: null, str: nx ? '换' + ARMS[nx].label : '援兵'}; }
  return {icon:null,str:(e.choiceRole==='challenge'?'挑战 · ':'')+'援兵 +'+(Math.round((e.n||6)*(S.slots.qi.id==='muniu'?1.5:1))+(S.slots.dian.id==='jinfanling'?2:0))};
}
function drawCrate(e, z) {
  const [gk, fk, name, hh] = CRATE[e.kind];
  const p = proj(e.x, z); if (p.y < L.P0 - 10) return;
  const u = L.ppu * p.s;
  if(e.pendingWeapon){const icon=pick('c20_icon_'+e.gives,'g_icon_'+e.gives);drawFrame(icon,p.x,p.y-.18*u,.36*u,{center:true});LABELS.push({kind:'crate',zone:zoneOf(p.y),x:p.x,y:p.y-.4*u,e,name:'同路拾取',u});return;}
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
function drawCrateLabel(l){
 if(l.zone===1)return;
 const c=crateContent(l.e),z=l.e.d-S.dist,plan=crateLabelPlan(l.name,c.str,z,measure),{w,h}=plan;
 const wanted={x:Math.max(8,Math.min(L.W-w-8,l.x-w/2)),y:l.y-h-3,w,h};
 // Never put a pickup plaque over the main actor or the near impact cue.
 const hp=proj(S.heroX,0),pose=heroPhase()[0],presentation=resolveBattleWeaponPresentation(S.weapon,pose,S.slots.ma.id,Math.floor(S.dist*.9*1.7)%4),bounds=presentationBounds(presentation,(S.slots.ma.id?.60:BODY.hero)*L.ppu,L.ppu),actual=S.heroRect||{x:hp.x+bounds.x,y:hp.y+bounds.y,w:bounds.w,h:bounds.h},left=Math.min(actual.x,hp.x+bounds.x)-6,top=Math.min(actual.y,hp.y+bounds.y)-12,actor={x:left,y:top,w:Math.max(actual.x+actual.w,hp.x+bounds.x+bounds.w)-left+6,h:Math.max(actual.y+actual.h,hp.y+bounds.y+bounds.h)-top+8};
 const impact=director.active.filter(t=>t.execute-S.t<2.0).flatMap(t=>t.bands.map(band=>{const a=proj(band[0],0),b=proj(band[1],0);return{x:a.x,y:a.y-10,w:b.x-a.x,h:20};}));
 const blockers=[...LABELS_DRAWN,actor,...impact];
 const {x,y}=nearestLabelRect(wanted,blockers,{x:8,y:L.P0+6,w:L.W-16,h:L.H-L.bottom-22-L.P0});
 if(Math.abs(x-wanted.x)+Math.abs(y-wanted.y)>3){const ax=Math.max(x+5,Math.min(x+w-5,l.x)),ay=l.y>y+h?y+h:l.y<y?y:y+h/2,steps=Math.ceil(Math.hypot(l.x-ax,l.y-ay)/3);ctx.save();ctx.strokeStyle='rgba(237,217,172,.65)';ctx.lineWidth=1;ctx.beginPath();for(let i=1;i<=steps;i++){const t0=(i-1)/steps,t1=i/steps,m=(t0+t1)/2,mx=ax+(l.x-ax)*m,my=ay+(l.y-ay)*m;if(blockers.some(r=>mx>=r.x-3&&mx<=r.x+r.w+3&&my>=r.y-3&&my<=r.y+r.h+3))continue;ctx.moveTo(ax+(l.x-ax)*t0,ay+(l.y-ay)*t0);ctx.lineTo(ax+(l.x-ax)*t1,ay+(l.y-ay)*t1);}ctx.stroke();ctx.restore();}
 panel(x,y,w,h,{r:4,fill:'rgba(17,32,46,.91)',stroke:l.e.kind==='treasure'?'#D7BB7F':'#827B65'});
 if(plan.detailed){text(l.name,x+w/2,y+11,11,{align:'center',color:'#BFC5C4',layer:'L6'});plan.lines.forEach((line,i)=>text(line,x+w/2,y+28+i*17,12,{align:'center',color:'#F4E2B6',layer:'L6'}));}
 else text(l.name,x+w/2,y+11,12,{align:'center',color:'#F4E2B6',layer:'L6'});
 const barW=w-16;ctx.fillStyle='#485058';ctx.fillRect(x+8,y+h-6,barW,3);ctx.fillStyle='#DABC79';ctx.fillRect(x+8,y+h-6,barW*Math.max(0,l.e.hp/l.e.max),3);
 LABELS_DRAWN.push({kind:'crate',x,y,w,h,detailLevel:plan.detailed?'contents':'category',entityId:l.e.id,content:c.str});
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
  // Only foreground wood fades; collision, timing and hazard labels are unchanged.
  for(const piece of out){const draw=piece.draw;piece.draw=()=>{ctx.save();if(piece.z<2&&piece.z>-3)ctx.globalAlpha*=.38;try{draw();}finally{ctx.restore();}};}
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
function queueCasualtyBodies(list){
 for(const c of S.casualties){const z=c.d-S.dist;list.push({z,draw:()=>{
  const p=proj(c.x,z),u=L.ppu*p.s,age=feedbackNow()-c.at,dedicated=has('bf_friendly_archer_fallen')&&has('bf_friendly_archer_hit'),fall=enemyFallPose(age,c.direction,dedicated),key=pick(...(dedicated?['bf_friendly_archer_'+(fall.fallen?'fallen':'hit')]:[]),'g_archerDraw','blueHurt','g_archerWalk0');
  shadow(p.x,p.y,.20*u);
  ctx.save();ctx.translate(p.x,p.y);ctx.scale(1,fall.floorScale);
  drawFrame(key,fall.offsetX*u,0,BODY.soldier*u,{refH:M.frames[key].bh||129,rot:fall.rotation,alpha:fall.alpha,tint:age<.09?'#FFD0BF':undefined,role:'soldier_casualty',actorId:c.id});ctx.restore();
 }});}
}
function drawEnemyHealth(e,p,height){
 const hit=enemyHitPose(e.feedback,S.t);if(e.dead||!hit.visible||height<14||p.y-height-7<L.hudBottom+4||p.y>L.Z4[0])return;
 const width=Math.max(16,Math.min(28,height*.56)),x=p.x-width/2,y=p.y-height-6;
 ctx.save();ctx.globalAlpha=Math.min(1,Math.max(0,(1.05-(S.t-e.feedback.at))/.20));
 ctx.fillStyle='#251C19';ctx.fillRect(x-1,y-1,width+2,5);
 ctx.fillStyle='#F2C26C';ctx.fillRect(x,y,width*hit.trail,3);
 ctx.fillStyle=hit.armor?'#97B1BC':'#D94F3B';ctx.fillRect(x,y,width*hit.health,3);ctx.restore();
}
function drawEnemyFall(e,z){
 const p=proj(e.x,z),u=L.ppu*p.s,kind=e.enemyKind||'light',pre=kind==='light'?'g_red':'g_elite';
 const fallen=pick('bf_enemy_'+kind+'_fallen',...(kind==='light'||kind==='guard'?[pre+'Fallen']:[]));
 const hit=pick('bf_enemy_'+kind+'_hit',...(kind==='light'?[pre+'Hit','r3_enemy_light_rec']:[]),'c20_enemy_'+kind+'_rec','g_eliteHit');
 const fall=enemyFallPose(e.dead,e.fallDir,!!fallen),key=fall.fallen?fallen:hit,H=(kind==='cavalry'?.60:kind==='light'?BODY.soldier:.42)*u;
 if(!key)return;
 shadow(p.x,p.y,(fall.fallen?.29:.21)*u);
 ctx.save();ctx.translate(p.x,p.y);ctx.scale(1,fall.floorScale);
 drawFrame(key,fall.offsetX*u,0,H,{refH:M.frames[key].bh||134,rot:fall.rotation,flip:!!fallen&&!key.startsWith('bf_')&&e.fallDir>0,alpha:fall.alpha,role:'enemy_defeated_body',actorId:e.id});ctx.restore();
 if(options.diagnostic)ACTOR_POSES.push({actorId:e.id,role:'enemy_defeated',enemyKind:kind,pose:fall.fallen?'fallen':'falling',frameKey:key,worldDepth:z,deathAge:e.dead,hp:e.hp,bodyScale:fall.floorScale,rotation:fall.rotation,quality:key.startsWith('bf_')?'dedicated_role_death_frame':fallen?'existing_fallen_sprite':'owned_sprite_rigid_fall_no_dedicated_asset',footAnchor:{x:p.x,y:p.y}});
}
function drawOfficer(e,z){
  const p=proj(e.x,z),u=L.ppu*p.s;if(p.y<L.P0-10)return;
  if(e.phase==='warn'||e.phase==='strike'){
    const a=proj(e.band[0],0),b=proj(e.band[1],0),c=proj(e.band[1],12),d=proj(e.band[0],12);
    ctx.fillStyle=e.phase==='warn'?'rgba(180,55,35,.22)':'rgba(220,85,40,.38)';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();ctx.fill();
  }
  const pre='g_front_'+e.person,pose=e.dead||e.hitT>0?'Hurt':e.phase==='warn'?'Wind':e.phase==='strike'?'Strike':e.phase==='rec'||e.phase==='idle'?'Rec':'Run0';
  const c20='c20_front_'+e.person+'_',newPose=e.phase==='warn'?'wind':e.phase==='strike'?'rel':e.phase==='rec'||e.dead?'rec':'run';const k=pick(...(newPose==='run'?['r27_char_'+e.person+'_run'+(Math.floor(e.walk||S.t*3)%2)]:[]),c20+newPose,pre+pose,pre+'Run0','g_lubuIdle');
  countVisible('enemies',drawFrame(k,p.x,p.y+(e.phase==='strike'?5:0),.56*u,{refH:M.frames[k].bh,rot:e.phase==='warn'?-.06:e.phase==='strike'?.08:0,alpha:e.dead?Math.max(0,1-e.dead/1.4):1}),e.dead?0:1);
  if(zoneOf(p.y)>1){const label=PEOPLE[e.person]+' · '+({approach:'拦阵',idle:'对峙',warn:'蓄势',strike:'出招',rec:'收势',defeated:'败北'}[e.phase]);text(label,p.x,p.y-.65*u,12,{align:'center',color:e.phase==='rec'?'#A9ECC4':'#FFE2B6',stroke:'#312313'});ctx.fillStyle='#3F2928';ctx.fillRect(p.x-24,p.y-.59*u,48,4);ctx.fillStyle='#D39961';ctx.fillRect(p.x-24,p.y-.59*u,48*Math.max(0,e.hp/e.max),4);}
}
function drawEnemy(e,z){
 if(e.dead)return drawEnemyFall(e,z);
 if(e.enemyKind==='light'&&has('r3_enemy_light_run')){
  const p=proj(e.x,z),u=L.ppu*p.s,hit=enemyHitPose(e.feedback,S.t),pose=e.phase==='warn'?'wind':e.phase==='strike'?'rel':e.phase==='rec'||!e.moving?'rec':'run';
  const phase=pose==='run'?'run'+(Math.floor((e.walk||0)*2)%4):pose==='rec'?'run0':pose;
  const key=pick(...(e.hitT>.05?['bf_enemy_light_hit']:[]),'bf_enemy_light_'+phase,'r3_enemy_light_'+pose),metadata=R3_ACTOR_META[key]||{bodyHeight:M.frames[key].bh,bodyBox:[.1,.03,.8,.94],feetAnchor:[.5,1],pelvisAnchor:[.5,.64],canonicalScale:1,metadataBasis:'fixed_sprite_cell'};
  shadow(p.x,p.y,.18*u);
  countVisible('enemies',drawFrame(key,p.x+hit.x*u,p.y+hit.y*u,BODY.soldier*u,{refH:metadata.bodyHeight,rot:hit.rotation,role:'enemy_body',actorId:e.id,tint:e.hitT>.12?'#FFE0C9':undefined}));
  drawEnemyHealth(e,p,BODY.soldier*u);
  if(options.diagnostic)ACTOR_POSES.push({...actorPoseDiagnostic({actorId:e.id,role:'enemy',pose,frameKey:key,sourceFrameKey:key,refH:metadata.bodyHeight,metadata,quality:'new_role_scoped_source'},p.x,p.y,z,BODY.soldier*u,p.s),enemyKind:e.enemyKind,attackId:e.attackId});
  return;
 }
 if(e.enemyKind&&e.enemyKind!=='light'){
  const p=proj(e.x,z),u=L.ppu*p.s,profile=ENEMY_PROFILES[e.enemyKind],hit=enemyHitPose(e.feedback,S.t);
  const pose=e.phase==='warn'?'wind':e.phase==='strike'?'rel':e.phase==='rec'||!e.moving?'rec':'run',phase=pose==='run'?'run'+(Math.floor((e.walk||0)*2)%4):pose==='rec'?'run0':pose;
  const key=pick(...(e.hitT>.05?['bf_enemy_'+e.enemyKind+'_hit']:[]),'bf_enemy_'+e.enemyKind+'_'+phase,'c20_enemy_'+e.enemyKind+'_'+pose,'g_eliteWalk0'),H=(e.enemyKind==='cavalry'?.60:.42)*u;
  shadow(p.x,p.y,(e.enemyKind==='cavalry'?.24:.17)*u);
  countVisible('enemies',drawFrame(key,p.x+hit.x*u,p.y+hit.y*u,H,{refH:M.frames[key]?.bh,role:'enemy_body',actorId:e.id,rot:hit.rotation+(e.phase==='strike'&&e.enemyKind==='cavalry'?-.04:0),tint:e.hitT>.12?'#FFE0C9':undefined}));
  drawEnemyHealth(e,p,H);
  if(options.diagnostic)ACTOR_POSES.push({actorId:e.id,role:'enemy',enemyKind:e.enemyKind,pose:e.hitT>.05?'hit':pose,frameKey:key,worldDepth:z,health:e.hp,maxHealth:e.feedback?.max,healthBar:hit.visible,feedbackRotation:hit.rotation,quality:key.startsWith('bf_')?'dedicated_role_action_frame':'legacy_owned_pose',footAnchor:{x:p.x,y:p.y}});
  if(e.enemyKind==='banner'&&!e.dead){ctx.strokeStyle='rgba(224,182,75,.65)';ctx.beginPath();ctx.ellipse(p.x,p.y,.35*u,.08*u,0,0,7);ctx.stroke();}
  return;
 }
if(e.person&&has('g_front_'+e.person+'Run0')){const p=proj(e.x,z),key='g_front_'+e.person+(e.dead||e.hitT>0?'Hurt':Math.floor(e.walk)%2?'Run1':'Run0');countVisible('enemies',drawFrame(key,p.x,p.y,.46*L.ppu*p.s,{refH:M.frames[key].bh,alpha:e.dead?Math.max(0,1-e.dead):1}),e.dead?0:1);if(zoneOf(p.y)>1)text(PEOPLE[e.person]||e.person,p.x,p.y-.5*L.ppu*p.s,12,{align:'center',color:'#FFCCC0',stroke:'#3c1814'});return;}
  const p = proj(e.x, z); if (p.y < L.P0 - 10) return;
  const u = L.ppu * p.s, pre = e.elite ? 'g_elite' : 'g_red', cn = e.elite ? '阵前护卫' : '敌兵';
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
  const hit=enemyHitPose(e.feedback,S.t),r = drawFrame(k, p.x+hit.x*u, p.y+hit.y*u, H, {refH: f && f.bh ? f.bh : 134, flip,rot:hit.rotation});if(!e.dead)countVisible('enemies',r,alpha);
  drawEnemyHealth(e,p,H);
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
let drawnArmyArrows=0;
function friendlyArrowSlots(){
 const wall=S.ents.find(e=>e.type==='wall'&&e.d-S.dist<.4&&e.d+e.len-S.dist>-.4);
 const slots=armySlots(S.troopShown,S.heroX,wall?.side||0).map((slot,slotIndex)=>({...slot,slotIndex}));
 const frames=['g_archerWalk0','g_archerWalk1','g_archerDraw','g_archerRel'].map(k=>M.frames[k]).filter(Boolean);
 const left=Math.max(...frames.map(f=>BODY.soldier*f.r[2]/(f.bh||129)*f.a[0]));
 const right=Math.max(...frames.map(f=>BODY.soldier*f.r[2]/(f.bh||129)*(1-f.a[0])));
 return fitProjectedFormation(slots,L||layout(options.viewport||SIZES['390×844']),left,right);
}
function drawArrows() {
  drawnArmyArrows=0;
  for (const a of S.arrows) {
    if(a.done)continue;
    const trails=a.visuals||[{sx:a.sx,sz:a.sz,slotIndex:0,delay:0,height:.22}];
    for(const v of trails){
     const p0=volleyPoint(a,v),p1=volleyPoint(a,v,Math.min(a.dur-.0001,a.t+.018));if(!p0||!p1)continue;
     const p=proj(p0.x,p0.z),q=proj(p1.x,p1.z),A={x:p.x,y:p.y-p0.h*L.ppu*p.s},B={x:q.x,y:q.y-p1.h*L.ppu*q.s};
     if(A.y<L.P0||A.y>L.H||A.x<-10||A.x>L.W+10)continue;
     drawnArmyArrows++;
     const ang=Math.atan2(B.y-A.y,B.x-A.x),len=Math.max(6,13*p.s);
     ctx.save();ctx.translate(A.x,A.y);ctx.rotate(ang);ctx.globalAlpha=.93;
     if(a.arms!=='bow'){ctx.strokeStyle=a.arms==='fire'?'rgba(255,173,62,.55)':'rgba(205,224,234,.32)';ctx.lineWidth=Math.max(1,2*p.s);ctx.beginPath();ctx.moveTo(-len*1.3,0);ctx.lineTo(len*.3,0);ctx.stroke();}
     ctx.strokeStyle='#342414';ctx.lineWidth=Math.max(1,1.6*p.s);ctx.beginPath();ctx.moveTo(-len*.5,0);ctx.lineTo(len*.5,0);ctx.stroke();
     ctx.fillStyle=a.arms==='fire'?'#FFC471':'#ECF0E9';ctx.beginPath();ctx.moveTo(len*.5+2*p.s+1,0);ctx.lineTo(len*.5,-1.3*p.s-.5);ctx.lineTo(len*.5,1.3*p.s+.5);ctx.fill();
     ctx.strokeStyle='#E6CD93';ctx.lineWidth=Math.max(1,1.3*p.s);ctx.beginPath();ctx.moveTo(-len*.55,-2*p.s);ctx.lineTo(-len*.3,0);ctx.lineTo(-len*.55,2*p.s);ctx.stroke();ctx.restore();
    }
  }
}
function queueFriendlyBodies(list) {
  const hx = S.heroX;
  // Strides follow travelled distance; an encounter stop is no longer running in place.
  const moving=S.speed>.05||Math.abs(S.heroV)>.08;
  const cyc=S.dist*.9+(S.speed<=.05&&moving?S.t*1.6:0);
  // 部曲（身后，背向镜头的弓手）：齐射时 张弓 → 放箭
  const wall=S.ents.find(e=>e.type==='wall'&&e.d-S.dist<.4&&e.d+e.len-S.dist>-.4),slots=friendlyArrowSlots();
  slots.sort((a, b) => b.z - a.z);
  const aw = [use('己方弓手·行进1', 'g_archerWalk0', 'blueWalk0'), use('己方弓手·行进2', 'g_archerWalk1', 'blueWalk1')];
  const aDraw = use('己方弓手·张弓', 'g_archerDraw', 'blueWalk0'), aRel = use('己方弓手·放箭', 'g_archerRel', 'blueWalk1');
  const poseBySlot=new Map();
  for(const a of S.arrows)for(const v of a.visuals||[]){const age=a.t-v.delay;if(age>=-.10&&age<.16)poseBySlot.set(v.slotIndex,age<0?'draw':'release');}
  for (const s of slots) {
   list.push({z:s.z,draw:()=>{
    const p = proj(s.x,s.z),feedback=friendlyLossPose(s.slotIndex);p.y+=feedback.rejoin*L.ppu*p.s;
    if(feedback.alpha>.05){ctx.save();ctx.globalAlpha*=feedback.alpha;shadow(p.x, p.y, .18 * L.ppu * p.s);ctx.restore();}
    const pose=poseBySlot.get(s.slotIndex),k=pose==='release'?aRel:pose==='draw'||S.volleyT<.16?aDraw:aw[Math.floor(cyc*1.6+s.x*9)&1];
    const f = M.frames[k];
    countVisible('soldiers',drawFrame(k, p.x, p.y, BODY.soldier * L.ppu * p.s*(s.row>2?.92:1), {refH:f&&f.bh?f.bh:129,alpha:(s.row>2?.83:1)*feedback.alpha,tint:feedback.hit?'#FFBCA9':undefined,role:'soldier_body',actorId:'soldier:'+s.slotIndex}), (s.row>2?.83:1)*feedback.alpha);
   }});
  }
  // 随军二将：跑动两帧 / 蓄势 / 出手；与当前兵器共鸣时脚下金环
  const res = resonance(S.weapon);
  const companionPositions=companionSlots(hx,S.companions.length,wall?.side||0);
  for (const [ci,c] of S.companions.entries()) {
    const nm=PEOPLE[c.id];
    const cp=companionPositions[ci],worldDepth=companionViewZ(cp.z),p=proj(cp.x,worldDepth);
   list.push({z:worldDepth,draw:()=>{
    const pose=companionsOn&&c.pose>.20?'wind':companionsOn&&c.pose>.10?'rel':companionsOn&&c.pose>0?'rec':'run';
    const actor=resolveActorPresentation('ally',c.id,pose,Math.floor(cyc*1.4+c.dx*5)%4),k=actor.frameKey;
    USED.set('随军·'+nm+'·'+pose,{key:k,gen:true,want:k});
    shadow(p.x, p.y, .24 * L.ppu * p.s);
    if (res.state === 'on' && res.who === c.id) { ctx.save(); ctx.strokeStyle = `rgba(159,224,184,${.55 + .35 * S.resFlash})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p.x, p.y, .17 * L.ppu * p.s, .05 * L.ppu * p.s, 0, 0, 7); ctx.stroke(); ctx.restore(); }
    const f = M.frames[k];
    countVisible('companions',drawFrame(k,p.x,p.y,BODY.companion*L.ppu*p.s,{refH:actor.refH,role:'companion_body',actorId:c.id}));
    if(options.diagnostic)ACTOR_POSES.push(actorPoseDiagnostic(actor,p.x,p.y,worldDepth,BODY.companion*L.ppu*p.s,p.s));
   }});
  }
  list.push({z:0,draw:()=>{
  // 主将：四帧跑步（按行进距离推进）/ 蓄势 / 出招 / 收势 / 亮兵（取得兵器时）
  const savedAtk=S.atkT;if(S.t<S.poseHoldUntil)S.atkT=S.poseHoldAtk;const [ph, pr] = heroPhase();S.atkT=savedAtk;
  const p = proj(hx, 0),mounted=S.slots.ma.id;
  const visualDefeat=S.ended&&S.troops<=0,visualHurt=!visualDefeat&&S.heroHitUntil>S.t;
  const visualPose=visualDefeat?'defeat':visualHurt?'hurt':ph==='run'&&!moving?'ready':ph;
  const presentation=resolveBattleWeaponPresentation(S.weapon,visualPose,mounted,Math.floor(cyc*1.7)%4);
  const runBob = moving ? Math.sin(cyc*1.7*Math.PI/2)*(mounted?.75:1.0) : 0;
  const lunge = ph === 'rel' ? -(mounted?3:5)*Math.sin(pr*Math.PI) : ph === 'wind' ? 1.5*pr : ph === 'show' ? -2*Math.sin(pr*Math.PI) : 0;
  shadow(p.x,p.y,(mounted?.21:.18)*L.ppu);
  // 骑乘图像使用逐姿态手部锚点；扬尘跟随真实横移。
  const mount = S.slots.ma.id;
  if (mount && moving) for (let i = 0; i < 3; i++) { const q = proj(hx-Math.sign(S.heroV)*(.06+i*.04),-.07-i*.06); ctx.save(); ctx.fillStyle = `rgba(190,160,110,${.28 - i * .07})`; ctx.beginPath(); ctx.ellipse(q.x, q.y - 3, (3+i*2)*q.s,(1.5+i*.5)*q.s, 0, 0, 7); ctx.fill(); ctx.restore(); }
  ctx.save(); ctx.strokeStyle = mount ? 'rgba(242,165,122,.8)' : 'rgba(230,205,147,.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(p.x, p.y, .2 * L.ppu, .055 * L.ppu, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  const bump=(S.bumped>0?Math.sin(S.bumped*60)*2:0)+(visualHurt?1.8:0);
  const H=(mounted?.60:BODY.hero)*L.ppu;
  options.renderProbe?.('hero');
  ctx.save();const lean=Math.max(-.055,Math.min(.055,-S.heroV*.018));ctx.translate(p.x,p.y);ctx.rotate(lean);ctx.translate(-p.x,-p.y);
  const r=drawWeaponPresentation(drawFrame,presentation,p.x+bump,p.y-runBob+lunge,H,L.ppu,{tint:visualHurt?'#FFD4BE':ph==='show'?'#FFF3C8':undefined,alpha:visualDefeat?.85:1});ctx.restore();countVisible('hero',r);S.heroRect=r;
  if(options.diagnostic){const metadata=presentation.battleMetadata||R3_ACTOR_META[presentation.bodyFrameKey]||{canonicalScale:1,bodyHeight:presentation.refH,bodyBox:[.28,.16,.44,.8],feetAnchor:[.5,1],pelvisAnchor:[.5,.64],metadataBasis:'legacy_anatomical_reference_pending'};ACTOR_POSES.push({...actorPoseDiagnostic({actorId:'player',role:mounted?'hero_mounted':'hero',pose:visualPose,frameKey:presentation.bodyFrameKey,sourceFrameKey:presentation.bodyFrameKey,refH:presentation.refH,metadata,quality:metadata.qualityStatus||'legacy'},p.x+bump,p.y-runBob+lunge,0,H,1),weaponId:S.weapon,mountId:mounted,logicalAttackPose:ph,feedbackMode:visualHurt?'actual_hit_controlled_recoil':visualDefeat?'final_defeat':null,attackTick:S.atkT,actualDamageReceived:S.damageHistory.filter(a=>a.actual>0&&S.t-a.t<.15).reduce((n,a)=>n+a.actual,0),battleOutcome:S.ended?(S.troops>0?'victory':'defeated'):null});}
  // 部曲兵力牌 → L6：固定在主将躯干上方
  const bounds=presentationBounds(presentation,H,L.ppu);
  LABELS.push({kind:'troop',x:p.x,y:p.y-H*.38,actor:{x:p.x+bounds.x-6,y:p.y+bounds.y-6,w:bounds.w+12,h:bounds.h+12}});
  }});
}
function drawTroopLabel(l) {
  const str = String(Math.round(S.troopShown));
  ctx.save(); ctx.font = `800 ${NUM.troop}px ${NUMF}`; const mount = S.slots.ma.id;
  const w = Math.max(36, ctx.measureText(str).width + 18) + (mount ? 16 : 0);
  const A=ARMS[S.arms],aw=measure(A.label,TYPE.caption)+12,total=w+aw+4;
  const side=S.heroX<=0?1:-1,wanted={x:side>0?l.actor.x+l.actor.w+8:l.actor.x-total-8,y:l.y-16,w:total,h:33};
  const blockers=[l.actor,...LABELS_DRAWN.filter(q=>q.kind!=='troop')];
  const placed=nearestLabelRect(wanted,blockers,{x:8,y:L.hudBottom+8,w:L.W-16,h:L.Z4[0]-L.hudBottom-16});
  const x=placed.x+aw+4+w/2,y=placed.y+16;
  S.troopX=x;S.troopY=y;
  roundRect(x - w / 2, y - 15, w, 30, 5); ctx.fillStyle = 'rgba(21,36,58,.86)'; ctx.fill(); ctx.strokeStyle = '#E6CD93'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#2F66A3'; ctx.fillRect(x - w / 2 + 3, y - 12, 4, 24);
  ctx.restore();
  if (mount) { const ic = use('坐骑徽记·' + TREASURE[mount].name, TREASURE[mount].icon); if (ic) drawFrame(ic, x - w / 2 + 17, y, 18, {center: true}); }
  text(str, x + 3 + (mount ? 8 : 0), y + 1, NUM.troop, {kind: 'troop', family: NUMF, weight: 800, align: 'center', color: '#F5EFE2', layer: 'L6'});
  // 部曲武装签（弓 / 火箭 / 连弩）：兵力牌左侧，换装时闪金
  const ax = x - w / 2 - 4 - aw;
  ctx.save(); roundRect(ax, y - 10, aw, 20, 4); ctx.fillStyle = S.armsFlash > 0 ? `rgba(138,102,48,${.6 + .3 * Math.sin(S.armsFlash * 20)})` : 'rgba(21,36,58,.8)'; ctx.fill(); ctx.strokeStyle = 'rgba(201,164,92,.6)'; ctx.stroke(); ctx.restore();
  text(A.label, ax + aw / 2, y, TYPE.caption, {kind: 'ui', align: 'center', color: S.arms === 'bow' ? '#DCCBA6' : '#FFC98A', layer: 'L6'});
  S.armsTag = {x: ax + aw / 2, y};
  LABELS_DRAWN.push({kind:'troop',x:ax,y:y-16,w:x+w/2-ax,h:33});
  let j = 0;
  for (const d of S.deltas) {
    if (d.t < 0) continue;
    const a = 1 - Math.max(0, d.t - .5) / .4;
    ctx.save(); ctx.globalAlpha = a;
    const col = d.src === 'taiping' ? '#FFE6A6' : d.src === 'hua' ? '#9FE0B8' : d.v > 0 ? '#9FD7FF' : '#FF9A8A';
    text((d.v > 0 ? '+' : '−') + Math.abs(d.v), Math.min(L.W-52,x+w/2+6), y-24-d.t*26-j*22, NUM.delta, {kind:'delta',family:NUMF,weight:800,color:col,stroke:'rgba(14,24,38,.9)',strokeW:3,layer:'L6'});
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
  if (b.phase === 'warn' || b.phase === 'strike') for(const band of b.bands||[b.band]){
    const [l,r]=band; const zA = b.z - .6, zB = -1.2;
    const A = proj(l, zA), B = proj(r, zA), C = proj(r, zB), D = proj(l, zB);
    const pulse = b.phase === 'warn' ? .22 + .18 * Math.sin(b.pt * 16) : .5;
    ctx.save(); ctx.fillStyle = `rgba(178,58,43,${pulse})`; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(C.x, C.y); ctx.lineTo(D.x, D.y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,190,170,.8)'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]); ctx.stroke();
    if (b.phase === 'warn') { const k = Math.min(1, b.pt / (BOSS_PATTERNS[b.person]?.warn||BOSS_T.warn)); const zc = zA + (zB - zA) * k; const E = proj(l, zc), F = proj(r, zc); ctx.setLineDash([]); ctx.strokeStyle = '#FFD7C8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(E.x, E.y); ctx.lineTo(F.x, F.y); ctx.stroke(); }
    ctx.restore();
  }
  if (b.phase === 'rec') { // 破绽
    ctx.save(); ctx.strokeStyle = `rgba(230,205,147,${.5 + .4 * Math.sin(b.pt * 10)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(p.x, p.y - h * .6, w * .42, w * .15, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
}
const FLAG_DX = [-.13, -.05, .05, .13];
function drawBoss() {
  const b = S.boss; const p = proj(0, b.z); const u = L.ppu * p.s; const top = p.y - .13 * u * .6;
  const pose=b.hp<=0?b.phase==='yield'?'yield':'defeated':b.bigHit>0&&(b.phase==='idle'||b.phase==='rec')?'hurt':b.phase==='warn'?'wind':b.phase==='strike'?'rel':b.phase==='rec'?'rec':'ready';
  const actor=resolveActorPresentation('boss',b.person,pose,Math.floor(S.t*2)%4),k=actor.frameKey;
  const K={idle:resolveActorPresentation('boss',b.person,'ready').frameKey},hitK=pose==='hurt'?k:null;
  USED.set('敌将·'+PEOPLE[b.person]+'·'+pose,{key:k,gen:true,want:k});
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
  const r=drawFrame(k,p.x+shake,top,H,{refH:actor.refH,role:'boss_body',actorId:b.person});if(b.hp>0)countVisible('enemies',r);
  if(options.diagnostic)ACTOR_POSES.push(actorPoseDiagnostic(actor,p.x+shake,top,b.z,H,p.s));
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
    // Ease the displayed muzzle back onto the unchanged combat trajectory over 160ms.
    const blend=w.visualOrigin?Math.max(0,1-w.t/.16):0,dx=blend*(w.visualOrigin?.x-w.x0||0),dz=blend*(companionViewZ(w.visualOrigin?.z)-w.z0||0);
    const p = proj(w.x+dx,w.z+dz); if (p.y < L.P0) continue;
    const u = L.ppu * p.s; const age = w.t;
    const life = w.boss ? 1 : 1 - (w.z - w.z0) / w.range;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, life * 2.2) * w.alpha;
    // Visual identity follows this projectile's launch weapon, never the current loadout.
    if(['liannu','jiguannu','yanlinggong'].includes(w.weaponId)&&!w.boss){
      ctx.translate(p.x,p.y-.18*u);const len=Math.max(8,.20*u);ctx.strokeStyle='#E3F4EF';ctx.lineWidth=Math.max(1,1.8*p.s);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-len);ctx.stroke();ctx.fillStyle='#91D8E8';ctx.beginPath();ctx.moveTo(0,-len-3);ctx.lineTo(-3,-len+3);ctx.lineTo(3,-len+3);ctx.fill();ctx.globalAlpha*=.35;ctx.fillRect(-1,0,2,len*.45);ctx.restore();continue;
    }
    const f = M.frames[w.k]; if (!f) { ctx.restore(); continue; }
    let rot = 0;
    if (w.snake) { drawSnakeTrail({...w,x0:w.x0+dx,z0:w.z0+dz,z:w.z+dz}); const snakeDx = w.snake * SNAKE.amp * SNAKE.k * Math.cos((w.z - w.z0) * SNAKE.k); rot = Math.atan2(snakeDx * L.ppu * p.s, 1 * u * .3) * .8; }
    const hh = w.h * u * (w.grow ? 1 + age * w.grow * 3 : 1);
    if (w.wide) {
      const ww = w.wide * u * (w.grow ? 1 + age * w.grow * 3 : 1); const sc = Math.min(ww / f.r[2], hh*1.5/f.r[3]),drawW=f.r[2]*sc;
      ctx.translate(p.x, p.y - .18 * u); if (w.boss) ctx.scale(1, -1);
      const img = w.boss ? tinted(w.k, '#ff5a3c') : IMG[f.s];
      const [sx, sy] = w.boss ? [0, 0] : f.r;
      ctx.drawImage(img, sx, sy, f.r[2], f.r[3], -drawW / 2, -f.r[3] * sc * .6, drawW, f.r[3] * sc * .75);
    } else {
      ctx.translate(p.x, p.y - .2 * u); ctx.rotate(rot);
      const sc = hh / f.r[3];
      ctx.drawImage(IMG[f.s], ...f.r, -f.r[2] * sc / 2, -hh, f.r[2] * sc, hh);
    }
    ctx.restore();
  }
  for (const f of S.fx) {
    const k = f.t / f.life;
    if(f.k==='defeat-count'){
      // A grouped kill cue counts only hp-to-zero transitions, never ordinary hits.
      if(f.n>=2&&S.fx.filter(q=>q.k==='defeat-count'&&q.n>=2).slice(-3).includes(f)){
        const p=proj(f.x,f.d-S.dist),u=L.ppu*p.s;
        if(p.y>L.hudBottom+.45*u&&p.y<L.Z4[0]){ctx.save();ctx.globalAlpha=1-k;text('击破 '+f.n,p.x,p.y-.40*u-k*12,12,{align:'center',color:'#F9D790',stroke:'#463422',strokeW:2});ctx.restore();}
      }
      continue;
    }
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
  const icon = resolveBattleWeaponPresentation(S.weapon).icon;
  ctx.save(); roundRect(chipX + 3, y1 + 3, 26, 26, 4); ctx.fillStyle = 'rgba(14,24,38,.9)'; ctx.fill(); ctx.restore();
  if (icon) drawFrame(icon,chipX+16,y1+16,24/Math.max(1,M.frames[icon].r[2]/M.frames[icon].r[3]),{center:true,role:'hud_weapon',actorId:S.weapon});
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
    const [str, col] = res.state === 'on' ? ['共鸣·' + nm, S.resFlash > 0 ? '#E8FFF0' : '#9FE0B8'] : res.state === 'pact' ? ['盟约·' + nm, '#E6CD93'] : [nm + '未随军', '#C5C3BC'];
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
    const tag = {idle: '对峙', warn: '预警', strike: '出招', rec: '收势', reposition:'换阵', spent: '力竭', yield: CHAPTERS[options.chapter].allies.includes(b.person)?'结盟':CHAPTERS[options.chapter].visit.includes(b.person)?'寻访':CHAPTERS[options.chapter].capture.includes(b.person)?'收服':'胜利'}[b.phase]||'交锋';
    text(tag, W - 24, y2 + 13, TYPE.caption, {align: 'right', color: b.phase === 'warn' || b.phase === 'strike' ? '#FF9A8A' : b.phase === 'rec' || b.phase === 'spent' ? '#E6CD93' : b.phase === 'yield' ? '#9FE0B8' : '#C4BEB0'});
    hudRect('敌将牌', 12, y2, W - 24, 40);
  }
  // 宝物槽（典籍 / 器物 / 坐骑）+ 支援位：左侧竖列，压在路边草地
  // 已佩戴 = 金框；本局试用 = 虚线框 + 角标「试」；一次性已用 = 压暗 + 角标「用」；空 = 单字槽名
  let sy=L.P0+4;S.slotPos={};
  for(const key of ['dian','qi','ma']){
   const sl=S.slots[key],T=sl.id?TREASURE[sl.id]:null,trial=sl.st==='trial',used=key==='qi'&&sl.used;
   panel(8,sy,38,42,{r:5,fill:sl.flash>0?'rgba(138,102,48,.94)':'rgba(21,36,58,.91)',stroke:trial?'#9FD7FF':T&&!used?'#E6CD93':'#69737A'});
   if(sl.id&&!T)throw Error('render_resource:mapping_missing:treasure:'+sl.id);if(T){const tf=M.frames[T.icon];if(!tf)throw Error('render_resource:mapping_missing:'+T.icon);drawFrame(T.icon,27,sy+16,25/Math.max(1,tf.r[2]/tf.r[3]),{center:true,alpha:used?.5:1,role:'hud_treasure',actorId:sl.id});}else text(SLOT_CN[key],27,sy+16,13,{align:'center',color:'#ADB5B6',layer:'L7'});
   text(T?T.name.slice(0,4):({dian:'典籍',qi:'器物',ma:'坐骑'})[key],27,sy+34,9,{align:'center',color:T?'#E6CD93':'#A5ADB1',layer:'L7'});
   if(trial||used){ctx.fillStyle=trial?'#2F66A3':'#4C545B';ctx.fillRect(35,sy-2,14,14);text(trial?'试':'用',42,sy+5,9,{align:'center',color:'#fff',layer:'L7'});}
   hudRect('宝物槽·'+SLOT_CN[key],8,sy,38,42);S.slotPos[key]={x:27,y:sy+16};sy+=48;
  }
  const sp=S.support,cdk=Math.min(1,Math.max(0,sp.cd/(sp.id==='hua'?SUPPORT.cd:12)));
  panel(8,sy,38,42,{r:5,fill:sp.flash>0?'rgba(63,140,100,.94)':'rgba(21,36,58,.91)',stroke:sp.id?'#E6CD93':'#69737A'});
  const supportPortrait=(has('c20_portrait_'+sp.id)?'c20_portrait_':'g_portrait_')+sp.id;if(sp.id){const pf=M.frames[supportPortrait];if(!pf)throw Error('render_resource:mapping_missing:'+supportPortrait);drawFrame(supportPortrait,27,sy+16,25/Math.max(1,pf.r[2]/pf.r[3]),{center:true,role:'hud_support',actorId:sp.id});}else text('支',27,sy+16,13,{align:'center',color:'#ADB5B6',layer:'L7'});
  text(sp.id?PEOPLE[sp.id]:'未编入',27,sy+34,9,{align:'center',color:sp.id?'#E6CD93':'#A5ADB1',layer:'L7'});
  if(cdk>0){ctx.save();ctx.strokeStyle='#9FE0B8';ctx.lineWidth=2;ctx.beginPath();ctx.arc(27,sy+16,12,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-cdk));ctx.stroke();ctx.restore();text(String(Math.ceil(sp.cd)),43,sy+5,9,{align:'center',color:'#FFF1BE',stroke:'#142334',layer:'L7'});}
  hudRect('支援·'+(PEOPLE[sp.id]||'未编入'),8,sy,38,42);

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
    if (f.icon) {const fr=M.frames[f.icon];if(!fr)throw Error('render_resource:mapping_missing:'+f.icon);drawFrame(f.icon,x,y,(26-k*6)/Math.max(1,fr.r[2]/fr.r[3]),{center:true,role:'pickup_fly',actorId:f.eventId});}
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
  const sub=(({降:'收服',访:'寻访',盟:'结盟',胜:'击败'})[sl.ch]||'神兵归主')+' · '+PEOPLE[sl.who];
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
  const w=114,h=60,x=L.W-8-(w+8)*inK,y=L.Z2[0]+10;
  panel(x,y,w,h,{r:5,fill:'rgba(122,36,25,.94)',stroke:'#DABC79'});
  text(b.name+' · '+(b.phase==='warn'?'蓄势':'出招'),x+10,y+14,12,{color:'#FFF0D5',layer:'L8'});
  const side=b.band[0]<-.5?'左路':b.band[1]>.5?'右路':'中路';
  text((b.pattern||'横扫')+' · '+side,x+10,y+34,10,{color:'#FFD0BB',layer:'L8'});
  ctx.fillStyle='#512B28';ctx.fillRect(x+10,y+49,w-20,4);ctx.fillStyle='#F0B18B';ctx.fillRect(x+10,y+49,(w-20)*Math.min(1,t/BOSS_T.warn),4);
  NOTICE={x,y,w,h};
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
const actorFrameKeys=new Map();
function actorKeys(prefix){if(!actorFrameKeys.has(prefix))actorFrameKeys.set(prefix,Object.keys(M.frames).filter(k=>k.startsWith(prefix)&&!k.endsWith('_fingers')));return actorFrameKeys.get(prefix);}
function companionViewZ(z){const mount=S.slots.ma.id;if(!mount||!Number.isFinite(z))return z;const v=resolveBattleWeaponPresentation(S.weapon,'run',mount),b=presentationBounds(v,.60*L.ppu,L.ppu);return Math.max(z,L.zAt(L.heroY+b.y-10));}
function actorCameraX(){
  // Pan the whole battlefield together: sprite margins never change collision X,
  // and warning bands/projectiles stay aligned with the same world coordinates.
  let left=Infinity,right=-Infinity;
  const include=(keys,x,z,h,ref)=>{const s=L.c/(L.c+z),px=L.W/2+x*L.ppu*s;for(const k of keys){const f=M.frames[k];if(!f)continue;const scale=h*s/(ref?ref(k):f.bh||f.r[3]),w=f.r[2]*scale;left=Math.min(left,px-f.a[0]*w);right=Math.max(right,px+(1-f.a[0])*w);}};
  const mount=S.slots.ma.id;
  for(const ph of ['run','wind','rel','rec','show'])for(let i=0;i<4;i++){const v=resolveBattleWeaponPresentation(S.weapon,ph,mount,i),b=presentationBounds(v,(mount?.60:BODY.hero)*L.ppu,L.ppu),x=L.W/2+S.heroX*L.ppu;left=Math.min(left,x+b.x);right=Math.max(right,x+b.x+b.w);}
  const wall=S.ents.find(e=>e.type==='wall'&&e.d-S.dist<.4&&e.d+e.len-S.dist>-.4),slots=companionSlots(S.heroX,S.companions.length,wall?.side||0);
  S.companions.forEach((c,i)=>{const actors=['run','wind','rel','rec'].flatMap(p=>[0,1,2,3].map(g=>resolveActorPresentation('ally',c.id,p,g)));include(actors.map(a=>a.frameKey),slots[i].x,companionViewZ(slots[i].z),BODY.companion*L.ppu,k=>actors.find(a=>a.frameKey===k).refH);});
  const lo=10-left,hi=L.W-10-right,shift=lo<=hi?Math.max(lo,Math.min(hi,0)):(lo+hi)/2;
  return L.W/2+(Number.isFinite(shift)?shift:0);
}
function render() {
  if(options.diagnostic){visible={soldiers:0,companions:0,hero:0,enemies:0};ACTOR_POSES=[];}
  TXT = []; LABELS = []; LABELS_DRAWN = []; GATE_STAT = {unsettledHidden: 0, docked: 0}; SEALR = null;
  ctx.save();
  if (S.shake > 0) ctx.translate((rnd() - .5) * 4 * S.shake, (rnd() - .5) * 4 * S.shake);
  L.cx=actorCameraX();options.renderProbe?.('world');drawBackdrop(); drawGround(); drawEnemyWarnings(); drawWorld();options.renderProbe?.('waves'); drawWaves(); drawArrows();drawHostileShots();
  // L6 世界标签（高于特效）
  for (const l of [...LABELS].sort((a,b)=>(a.kind==='crate'?1:0)-(b.kind==='crate'?1:0))) {
    if (l.kind === 'gate') drawGateLabel(l);
    else if (l.kind === 'crate') drawCrateLabel(l);
    else if (l.kind === 'troop') drawTroopLabel(l);
    else if (l.kind === 'boss') drawBossLabel(l);
  }
  drawEnemyIntents();
  for (const [i,f] of S.fx.filter(f=>f.k==='crit').slice(-3).entries()) { const p = proj(f.x, f.z); ctx.save(); ctx.globalAlpha = 1 - f.t / f.life; text('−' + Number(f.v.toFixed(1)), p.x + 48, p.y - 60 * p.s * 2 - f.t * 30-i*22, NUM.delta, {kind: 'delta', family: NUMF, weight: 800, color: '#FFE6A6', stroke: 'rgba(60,20,10,.9)', strokeW: 3, layer: 'L6'}); ctx.restore(); }
  ctx.restore();
  if (S.redFlash > 0) { const g = ctx.createRadialGradient(L.W / 2, L.H / 2, L.W * .3, L.W / 2, L.H / 2, L.H * .7); g.addColorStop(0, 'rgba(178,58,43,0)'); g.addColorStop(1, `rgba(178,58,43,${S.redFlash * .55})`); ctx.fillStyle = g; ctx.fillRect(0, 0, L.W, L.H); }
  options.renderProbe?.('hud');drawHUD(); drawOverlayFx(); drawNotice(); drawToast();
  if (showZones) drawZones();
}


function renderFrame(sz){
 if(!ctx)return true;
 L=layout(sz);L.capsule=sz.capsule||{x:L.W-8,y:0,w:0,h:0};const simSeed=seed;
 try{ctx.begin(L);render();ctx.end();return true;}
 catch(error){ctx.abortFrame?.();paused=true;soundQueue.length=0;renderFailure={message:String(error),stack:error?.stack||'',tick:Math.round(S.t*60),runId};throw error;}
 finally{seed=simSeed;}
}
L=layout(options.viewport||{W:390,H:844,top:0,bottom:0});newWorld('normal');
return {get state(){return S;},get ledger(){return ledger;},get totals(){return {...totals};},
 move(x){if(renderFailure)return;if(Number.isFinite(x))S.targetX=Math.max(-.68,Math.min(.68,x));},cancel(){S.targetX=S.heroX;},
 step(dt=DT){if(paused)return;step(Math.min(DT,Math.max(0,dt)));},pause(value){paused=!!value;if(paused)soundQueue.length=0;},drainAudioEvents(){return soundQueue.splice(0);},clearAudioEvents(){soundQueue.length=0;},
 render(sz){if(renderFailure)return false;return renderFrame(sz);},
 retryRender(sz){renderFailure=null;try{return renderFrame(sz);}catch{return false;}},
 snapshot(){return {armyVolley:{last:S.volleyReadout||null,drawn:drawnArmyArrows,active:S.arrows.filter(a=>!a.done).reduce((n,a)=>n+(a.visuals||[]).filter(v=>!!volleyPoint(a,v)).length,0)},movementBounds:movementBounds(2),pendingBossGuards:S.pendingBossGuards.map(e=>({id:e.id,waveId:e.waveId})),teamFeet:teamFeet(),teamEnvelope:teamEnvelope(),teamEnvelopeFuture:teamEnvelope(2),enemyLifecycle:Object.values(S.enemyLifecycle),waveAccounting:Object.values(S.waveAccounting),pendingSquads:S.pendingSquads.map(e=>({waveId:e.waveId,remaining:e.remaining})),hostileShots:S.hostileShots.map(s=>({...s,entity:undefined})),chapter:options.chapter,formation:armyFormation(S.troopShown),t:S.t,dist:S.dist,teamHalf:teamHalf(),progressEligible:[...S.progressEligible],damageSources:{...S.damageSources},damageHistory:[...S.damageHistory],director:{accepted:director.accepted,deferred:director.deferred,minimumBudget:director.minimumBudget},telegraphs:director.active.map(t=>({...t})),phase:S.ended?(S.troops>0?'won':'lost'):S.boss?'boss':'run',x:S.heroX,target:S.targetX,troops:S.troops,weapon:S.weapon,tier:S.tier,arms:S.arms,companions:S.companions.map(c=>c.id),support:{...S.support},slots:S.slots,boss:S.boss?{...S.boss}:null,entities:S.ents.map(e=>({...e,charge:e.charge?{attackId:e.charge.attackId,subAttackId:e.charge.subAttackId,x:e.charge.x,z:e.charge.z,done:e.charge.done,releaseAt:e.charge.releaseAt,impactAt:e.charge.impactAt}:undefined,z:e.d-S.dist})),routeXP:S.routeXP||0,timing:{...S.timing},stats:S.stats,totals:{...totals},paused,threatBands:S.waves.filter(w=>w.boss&&!w.hitDone&&!w.spent).map(w=>w.band||S.boss?.band),runGot:[...S.runGot],defeatedOfficerIds:[...S.defeatedOfficerIds],defeatedBossId:S.defeatedBossId,log:[...S.log]};},
 get diagnostics(){return {actorPoses:ACTOR_POSES,renderFailure,logicalHero:1,bodyBudget:S.bodyBudget,counts:options.diagnostic?{logical_troops:S.troops,visible_friendly:visible.hero+visible.companions+visible.soldiers,visible_soldiers:visible.soldiers,visible_companions:visible.companions,visible_hero:visible.hero,display_limit:armyFormation(S.troopShown).count,active_enemies:S.ents.filter(e=>['enemy','officer'].includes(e.type)&&!e.dead).length+(S.boss?.hp>0?1:0),visible_enemies:visible.enemies,active_projectiles:S.waves.filter(w=>!w.spent).length+S.arrows.filter(a=>!a.done).length,count_scope:'body sprite rectangles submitted inside gameplay viewport, excludes zero alpha/dead enemies; occlusion not measured'}:null,texts:TXT,hud:HUDR,labels:LABELS_DRAWN,gate:GATE_STAT,used:Array.from(USED.entries())};}};
}
