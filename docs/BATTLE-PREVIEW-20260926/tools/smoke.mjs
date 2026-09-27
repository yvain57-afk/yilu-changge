// 冒烟：三态各跑一段（正常 26 秒自动选路 / 密集 10 秒 / 敌将 30 秒自动躲开 + 20 秒自动中招），输出违例、状态与事件日志
import { openPage, STATES } from './common.mjs';
const { b, p, errs } = await openPage({ scale: 1 });
const out = {};
for (const [st, ctrl, secs] of [['normal', 'auto', 26], ['dense', 'auto', 10], ['general', 'dodge', 30], ['general', 'hit', 20]]) {
  out[st + '/' + ctrl] = await p.evaluate(({ st, ctrl, secs }) => {
    __preview.setState(st); __preview.setCtrl(ctrl); const viol = new Set(); const troops = [];
    for (let i = 0; i < secs * 30; i++) { __preview.advance(1 / 30); __layoutReport().violations.forEach(v => viol.add(v)); if (i % 30 === 0) troops.push(__preview.S.troops); }
    return { violations: [...viol], troopsPerSec: troops.join(','), stats: __preview.statsText().split('\n'), log: __preview.log.map(e => e.t.toFixed(1) + 's ' + e.msg) };
  }, { st, ctrl, secs });
}
console.log(JSON.stringify(out, null, 1)); console.log('page errors:', errs);
await b.close();
if (errs.length || Object.values(out).some(r => r.violations.length)) process.exit(1);
