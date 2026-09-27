import {mkdirSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),baseline=resolve(root,'.cache/fix2-cap-audit-baseline');
mkdirSync(baseline,{recursive:true});
// This archive contains only the audited FIX1 core, never a replacement checkout.
execFileSync('tar',['-xzf',resolve(root,'tools/fix2-cap-audit-baseline.tgz'),'-C',baseline],{stdio:'inherit'});
const run=spawnSync(process.execPath,[resolve(root,'tools/run-local.mjs'),'tsx','tools/fix2-cap-audit.ts'],{cwd:root,stdio:'inherit'});
process.exit(run.status??1);
