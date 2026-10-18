// Explicit files only: a missing argument must not accidentally start the full suite.
import {spawnSync} from 'node:child_process';
import {realpathSync, statSync} from 'node:fs';
import {delimiter, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = [...new Set(process.argv.slice(2))];
const usage = '用法：npm run test:targeted -- tests/某项.test.ts [tests/另一项.test.ts]';
if (files.length === 1 && files[0] === '--help') {
  console.log(usage);
  process.exit(0);
}
if (!files.length) {
  console.error(usage + '\n未指定文件，不运行全量测试。');
  process.exit(1);
}
for (const file of files) {
  try {
    if (!/^tests\/[\w.-]+\.test\.ts$/.test(file)) throw Error('invalid path');
    const path = realpathSync(resolve(root, file));
    if (!path.startsWith(resolve(root, 'tests') + sep) || !statSync(path).isFile()) throw Error('invalid file');
  } catch {
    console.error('测试文件无效：' + file + '\n' + usage);
    process.exit(1);
  }
}
console.log('定向检查：' + files.join(', '));
const result = spawnSync(process.execPath, [resolve(root, 'tools/run-local.mjs'),
  'tsx', '--test', '--test-concurrency=1', ...files], {
  cwd: root, stdio: 'inherit',
  env: {...process.env, PATH: resolve(root, 'node_modules/.bin') + delimiter + (process.env.PATH || '')},
});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
