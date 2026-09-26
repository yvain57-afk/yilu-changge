import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,readdirSync,statSync} from 'node:fs';
const evidence=process.env.YILU_EVIDENCE_DIR||'evidence/v09';mkdirSync(evidence,{recursive:true});
// The same deterministic build hook is safe to rerun: excluded files are absent and encoded pixels identical.
const result=spawnSync(process.execPath,['tools/v09-assets.mjs','wechatgame'],{stdio:'inherit',env:{...process.env,YILU_EVIDENCE_DIR:evidence}});
if(result.status!==0)process.exit(result.status||1);
const walk=p=>readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]);
const root='build/wechatgame',report=JSON.parse(readFileSync(`${evidence}/ASSET_BUDGET-wechatgame.json`,'utf8'));
const bytes=walk(root).reduce((n,p)=>n+statSync(p).size,0),limit=report.budget.limitBytes;
const summary={totalBytes:bytes,uploadBytes:bytes,limitBytes:limit,marginBytes:limit-bytes,targetMarginBytes:report.budget.targetMarginBytes,meetsLocalMargin:limit-bytes>=report.budget.targetMarginBytes,thresholdSource:report.budget.thresholdSource,officialUploadBytes:null,reason:'Build-only removal from verified runtime whitelist and exact used-frame RGBA preservation; original source art and private local config unchanged.'};
writeFileSync(`${evidence}/wechat-package.json`,JSON.stringify(summary,null,2)+'\n');
console.log(summary);
if(!summary.meetsLocalMargin)throw Error('Local package needs at least 1 MiB headroom; inspect ASSET_BUDGET before official preview.');
