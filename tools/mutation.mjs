import {readFileSync,writeFileSync,mkdirSync,cpSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const target='.cache/negative-gate';mkdirSync(target,{recursive:true});
cpSync('assets/scripts/core',`${target}/core`,{recursive:true});
const original=readFileSync('assets/scripts/core/model.ts','utf8');
const marker='if (this.usedRows.has(row.id)) return;';
if(!original.includes(marker))throw Error('Mutation anchor missing');
writeFileSync(`${target}/core/model.ts`,original.replace(marker,'/* Deliberate fixture fault: removed once-only guard. */'));
const realTests=readFileSync('tests/rules.test.ts','utf8');
writeFileSync(`${target}/rules.test.ts`,realTests.slice(0,realTests.indexOf('const empty=')).replaceAll('../assets/scripts/core/','./core/') + realTests.slice(realTests.indexOf("test('R02 同排"),realTests.indexOf("test('R02 穿门")));
const run=spawnSync(process.execPath,['node_modules/tsx/dist/cli.mjs','--test',`${target}/rules.test.ts`],{encoding:'utf8'});
const evidence=process.env.YILU_EVIDENCE_DIR||'evidence/v02-s2b';mkdirSync(evidence,{recursive:true});writeFileSync(`${evidence}/negative-gate.txt`,run.stdout+run.stderr);
if(run.status===0||!run.stdout.includes('256 !== 20'))throw Error('Acceptance did not detect deliberate duplicate gate fault: '+run.stdout);
// Remove only our intentionally broken temporary fixture; original is never mutated.
rmSync(target,{recursive:true});
if(readFileSync('assets/scripts/core/model.ts','utf8')!==original)throw Error('Production source changed');
console.log('Deliberate duplicate-gate fixture: FAIL detected (256 !== 20). Fixture removed; production source unchanged.');
