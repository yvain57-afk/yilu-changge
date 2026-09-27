// 动态预览：脚本驱动（setX 正弦拖动 / 自动选路 autopilot），固定 30 fps 逐帧推进并截取 #phoneWrap，
// ffmpeg 合成 deliver/battle-preview.mp4，同时写 deliver/battle-preview.json（分段、状态、操控方式、事件日志）。
// 环境变量：FFMPEG（默认 ~/.local/bin/ffmpeg，再退回 PATH 中的 ffmpeg）
import { openPage, WORK, DELIVER } from './common.mjs';
import path from 'path'; import fs from 'fs'; import os from 'os'; import { execFileSync } from 'child_process';
const FPS = 30, SIZE = '390×844';
const VF = path.join(WORK, 'vf'); fs.rmSync(VF, { recursive: true, force: true }); fs.mkdirSync(VF, { recursive: true });
const { b, p, errs } = await openPage({ scale: 2, size: SIZE });
await p.evaluate(() => { document.getElementById('caption').style.cssText = 'font-size:15px;line-height:22px;height:22px;color:#E6CD93;width:390px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis'; });
let n = 0; const segs = [];
// cap：字幕；setup：段前设置；perFrame(t)：每帧操控；opt.until：提前结束条件（表达式），opt.tail：满足后再录几秒；opt.liveCap：字幕后接最新事件
async function seg(key, cap, secs, setup, perFrame, opt = {}) {
  const s0 = n;
  const meta = await p.evaluate(({ setup }) => { new Function(setup)(); const S = __preview.S; return { state: S.state, weapon: S.weapon, tier: S.tier, ctrl: S.ctrl }; }, { setup });
  let endAt = null;
  for (let i = 0; i < secs * FPS && (endAt == null || i < endAt); i++) {
    const r = await p.evaluate(({ f, t, cap, live, until }) => {
      new Function('t', f)(t); __preview.advance(1 / 30);
      const L = __preview.log, last = L.length ? L[L.length - 1].msg : '';
      document.getElementById('caption').textContent = live && last ? cap + '　' + last : cap;
      return until ? !!new Function('return (' + until + ')')() : false;
    }, { f: perFrame, t: i / FPS, cap, live: !!opt.liveCap, until: opt.until || '' });
    if (r && endAt == null) endAt = i + Math.round((opt.tail || 0) * FPS);
    await p.locator('#phoneWrap').screenshot({ path: path.join(VF, String(n++).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 90 });
  }
  const log = await p.evaluate(() => __preview.log.map(e => ({ t: +e.t.toFixed(2), kind: e.kind, msg: e.msg })));
  segs.push({ key, caption: cap, bareCourse: /P\.bare\(\)/.test(setup), start: +(s0 / FPS).toFixed(2), duration: +((n - s0) / FPS).toFixed(2), ...meta,
    control: meta.ctrl === 'manual' ? '脚本 setX（模拟左右拖动）' : meta.ctrl === 'auto' ? '自动选路 autopilot' : `敌将判定核对：自动${meta.ctrl === 'dodge' ? '躲开' : '中招'}`,
    events: log });
}
const names = { spear: '长枪 · 快、窄、远', guandao: '偃月刀 · 蓄力长、横扫宽、近', shemao: '蛇矛 · 双刺蛇行、穿透', huaji: '画戟 · 直刺＋侧扇两段' };
for (const w of ['spear', 'guandao', 'shemao', 'huaji'])
  await seg('weapon-' + w, '兵器对比 2 阶　' + names[w], 4, `const P=__preview; P.setState('normal'); P.setWeapon('${w}', 2); P.setCtrl('manual'); P.bare(); P.setX(-.3);`, `__preview.setX(Math.sin(t*1.1)*.45 - .1)`);
await seg('wall', '固定墙段　接近 → 贴墙被挡 → 离开', 6, `const P=__preview; P.setState('normal'); P.setWeapon('spear', 2); P.setCtrl('manual'); P.bare(); P.jumpWall(); P.setX(-.5);`,
  `__preview.setX(t < 1.5 ? -.5 : .6*Math.sin((t-1.5)*1.6) + .15)`);
await seg('dense', '密集连续门　数字停靠兵力牌后结算', 6.5, `const P=__preview; P.setState('dense'); P.setWeapon('huaji', 2); P.setCtrl('auto');`, ``);
await seg('march', '正常行军 长枪 1 阶起', 26, `const P=__preview; P.setState('normal'); P.setWeapon('spear', 1); P.setCtrl('auto');`, ``, { liveCap: true });
await seg('boss-hit', '敌将交锋 · 自动中招', 4.5, `const P=__preview; P.setState('general'); P.setWeapon('shemao', 3); P.setCtrl('hit');`, ``, { liveCap: true });
await seg('boss-dodge', '敌将交锋 · 自动躲开', 24, `const P=__preview; P.setState('general'); P.setWeapon('shemao', 3); P.setCtrl('dodge');`, ``,
  { liveCap: true, until: '__preview.S.ended', tail: 2.6 });
await b.close();
if (errs.length) { console.error('page errors', errs); process.exit(1); }
const cand = [process.env.FFMPEG, path.join(os.homedir(), '.local/bin/ffmpeg'), 'ffmpeg'].filter(Boolean);
const ff = cand.find(c => c === 'ffmpeg' || fs.existsSync(c));
const out = path.join(DELIVER, 'battle-preview.mp4');
execFileSync(ff, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(VF, '%05d.jpg'),
  '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p', '-c:v', 'libx264', '-crf', '27', '-preset', 'slow', '-tune', 'animation', '-movflags', '+faststart', out]);
const side = { file: 'battle-preview.mp4', generatedBy: 'tools/video.mjs', size: SIZE, deviceScale: 2, fps: FPS, frames: n, duration: +(n / FPS).toFixed(2),
  note: '浏览器 Canvas 预览逐帧录制，非 Cocos、非真机；触控、声音、背景、发热未验证。', segments: segs };
fs.writeFileSync(path.join(DELIVER, 'battle-preview.json'), JSON.stringify(side, null, 1));
console.log('frames', n, 'duration', side.duration, '→', out);
