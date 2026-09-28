// 截图：三态（5 尺寸）、分区、四兵器相位、行军反馈与敌将败北关键帧 → $WORK/*.png；boards.py 再拼成交付图
import { openPage, SIZES, WORK } from './common.mjs';
import path from 'path'; import fs from 'fs';
const { b, p, errs } = await openPage({ scale: 2 });
const cv = p.locator('#cv'); const rep = {};
const shot = async (name) => { await cv.screenshot({ path: path.join(WORK, name + '.png') }); rep[name] = await p.evaluate(() => __layoutReport().violations); };
const STILL = { normal: { t: 2.0, x: -.35 }, dense: { t: 2.2, x: .4 }, general: { t: 1.75, x: -.4 } };
// 1) 三态 × 5 尺寸（固定兵器：长枪 2 阶，手动操控，固定时刻）
for (const size of SIZES) for (const [st, j] of Object.entries(STILL)) {
  await p.evaluate(({ size, st, j }) => { const P = __preview; P.setSize(size); P.setState(st); P.setWeapon('spear', 2); P.setCtrl('manual'); P.setZones(false); P.setX(j.x); P.advance(j.t); }, { size, st, j });
  await shot(`st-${size.replace('×', 'x')}-${st}`);
}
await p.evaluate(() => { const P = __preview; P.setSize('390×844'); P.setState('normal'); P.setWeapon('spear', 2); P.setZones(true); P.setX(-.35); P.advance(2); });
await shot('st-zones'); await p.evaluate(() => __preview.setZones(false));
// 2) 四兵器相位：蓄力 70% / 出手 30% / 出手末 +.04 / 收势 60%
const PH = { spear: [.14, .10, .22], guandao: [.36, .12, .34], shemao: [.10, .20, .16], huaji: [.22, .14, .26] };
for (const [w, W] of Object.entries(PH)) {
  await p.evaluate(w => { const P = __preview; P.setState('normal'); P.setX(0); P.advance(.6); P.setWeapon(w, 2); P.S.show = 0; P.S.atkT = 0; }, w);
  const marks = [W[0] * .7, W[0] + W[1] * .3, W[0] + W[1] + .04, W[0] + W[1] + W[2] * .6]; let cur = 0;
  for (let i = 0; i < 4; i++) { await p.evaluate(d => __preview.advance(d), marks[i] - cur); cur = marks[i]; await shot(`wp-${w}-${i}`); }
}
// 3) 反馈关键帧：按事件日志触发，事件后延迟 dt 秒截图
async function byEvents(state, ctrl, secs, cues, w = ['spear', 1]) {
  await p.evaluate(({ state, ctrl, w }) => { const P = __preview; P.setSize('390×844'); P.setState(state); P.setWeapon(w[0], w[1]); P.setCtrl(ctrl); }, { state, ctrl, w });
  const pending = cues.map(c => ({ ...c, at: null }));
  for (let i = 0; i < secs * 30 && pending.length; i++) {
    const t = await p.evaluate(() => { __preview.advance(1 / 30); return __preview.S.t; });
    const log = await p.evaluate(() => __preview.log.map(e => [e.t, e.msg]));
    for (const c of [...pending]) {
      if (c.at == null) { const hit = log.find(([, m]) => m.includes(c.ev)); if (hit) c.at = hit[0] + c.dt; }
      if (c.at != null && t >= c.at) { await shot(c.name); pending.splice(pending.indexOf(c), 1); }
    }
  }
  if (pending.length) console.log('未触发:', pending.map(c => c.name));
}
// 新档默认兵器为长枪 1 阶；正常路线用自动选路依次拿到各个箱子
await byEvents('normal', 'auto', 28, [
  { name: 'fb-01-grain', ev: '粮车 +6', dt: .25 },
  { name: 'fb-02-tierup', ev: '长枪 → 2 阶', dt: .3 },
  { name: 'fb-03-arms-fire', ev: '部曲 → 火箭', dt: .9 },
  { name: 'fb-04-treasure-trial', ev: '赤兔马 本局试用', dt: .35 },
  { name: 'fb-05-swap-unmatched', ev: '本主未随军', dt: .3 },
  { name: 'fb-06-swap-resonance', ev: '共鸣 张飞', dt: .35 },
  { name: 'fb-07-tier3', ev: '蛇矛 → 3 阶', dt: .3 },
  { name: 'fb-08-arms-repeater', ev: '部曲 → 连弩', dt: 1.0 },
  { name: 'fb-09-overflow', ev: '满阶 溢出', dt: .3 },
]);
await byEvents('general', 'hit', 6, [
  { name: 'fb-10-boss-hit', ev: '中招 −10', dt: .05 },
  { name: 'fb-11-hua-heal', ev: '华佗 +', dt: .15 },
], ['shemao', 3]);
await byEvents('general', 'dodge', 18, [
  { name: 'fb-12-boss-warn', ev: '预警', dt: .8 },
  { name: 'fb-13-boss-dodge', ev: '闪开', dt: .02 },
  { name: 'fb-14-flag-break', ev: '靠旗断', dt: .15 },
  { name: 'fb-15-boss-spent', ev: '力竭', dt: .6 },
  { name: 'fb-16-boss-yield', ev: '收服', dt: .9 },
], ['shemao', 3]);
fs.writeFileSync(path.join(WORK, 'shots-report.json'), JSON.stringify(rep, null, 1));
const bad = Object.entries(rep).filter(([, v]) => v.length);
console.log('shots', Object.keys(rep).length, 'with violations:', bad, 'page errors:', errs);
await b.close();
