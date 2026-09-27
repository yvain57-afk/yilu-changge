// 预览工具公共设置：路径全部按本目录推算，端口与浏览器可用环境变量覆盖。
// PORT（默认 8777）、CHROME（默认 macOS Chrome）、WORK（中间帧目录，默认系统临时目录）
import path from 'path'; import os from 'os'; import fs from 'fs'; import { fileURLToPath } from 'url';
export const TOOLS = path.dirname(fileURLToPath(import.meta.url));
export const PREVIEW = path.resolve(TOOLS, '..');                 // docs/BATTLE-PREVIEW-20260926
export const ROOT = path.resolve(PREVIEW, '../..');               // 项目根
export const DELIVER = path.join(PREVIEW, 'deliver');
export const PORT = +(process.env.PORT || 8777);
export const URL0 = `http://localhost:${PORT}/index.html`;
export const WORK = process.env.WORK || path.join(os.tmpdir(), 'yilu-battle-preview-work');
fs.mkdirSync(WORK, { recursive: true });
export const SIZES = ['360×640', '390×844', '430×932', '360×780', '375×667'];
export const STATES = ['normal', 'dense', 'general'];
export const WEAPONS = ['spear', 'guandao', 'shemao', 'huaji'];
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export async function openPage({ scale = 2, size = '390×844' } = {}) {
  const { chromium } = await import(path.join(ROOT, 'node_modules/playwright/index.mjs'));
  const b = await chromium.launch(fs.existsSync(CHROME) ? { executablePath: CHROME } : {});
  const p = await b.newPage({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: scale });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e))); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.on('response', r => r.status() >= 400 && errs.push(r.status() + ' ' + r.url()));
  await p.goto(URL0); await p.waitForFunction(() => window.__ready, null, { timeout: 20000 });
  await p.evaluate(s => { __preview.external(true); __preview.setSize(s); }, size);
  return { b, p, errs };
}
