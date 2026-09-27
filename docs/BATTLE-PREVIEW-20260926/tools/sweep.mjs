// 版面扫描：5 尺寸 × 3 状态 × 4 兵器，每组 250 步（每步 0.1 秒），主将按正弦左右拖动；统计每帧自检违例
import { openPage, SIZES, STATES, WEAPONS } from './common.mjs';
const { b, p, errs } = await openPage({ scale: 1 });
const res = await p.evaluate(({ SIZES, STATES, WEAPONS }) => {
  const P = __preview, out = {}; let frames = 0;
  for (const size of SIZES) for (const st of STATES) for (const w of WEAPONS) {
    P.setSize(size); P.setState(st); P.setWeapon(w, 2); P.setCtrl('manual');
    for (let i = 0; i < 250; i++) {
      P.setX(Math.sin(i * .07) * .75); P.advance(.1); frames++;
      for (const v of __layoutReport().violations) { const k = `${size} ${st} ${v.replace(/「.*?」/, '「·」')}`; out[k] = (out[k] || 0) + 1; }
    }
  }
  return { frames, combos: SIZES.length * STATES.length * WEAPONS.length, violations: out };
}, { SIZES, STATES, WEAPONS });
console.log(JSON.stringify(res, null, 1)); console.log('page errors:', errs);
await b.close();
if (errs.length || Object.keys(res.violations).length) process.exit(1);
