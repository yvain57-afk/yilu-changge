/** Freeze only after final builds. --check is read-only; creation never overwrites a prior receipt. */
import {createHash} from 'node:crypto';
import {existsSync,lstatSync,readdirSync,readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,relative,dirname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const TASK='BATTLE-FIX2-20260925', VERSION='0.9.3-battlefix2', RUNTIME='battle-fix2-20260925';
const args=process.argv.slice(2), arg=k=>{const i=args.indexOf(k);return i<0?undefined:args[i+1];};
const root=resolve(arg('--root')||resolve(dirname(fileURLToPath(import.meta.url)),'..'));
const output=resolve(root,arg('--output')||`evidence/${TASK}/BUILD_ID.json`);
const check=args.includes('--check');
const hash=b=>createHash('sha256').update(b).digest('hex');
const omit=new Set(['project.private.config.json','.DS_Store']);
const posix=p=>p.split(sep).join('/');
function walk(p){
 const s=lstatSync(p);if(s.isSymbolicLink())throw Error(`Fingerprint refuses symlink: ${relative(root,p)}`);
 if(s.isDirectory())return readdirSync(p).sort().filter(n=>!['node_modules','.git','.cache','__pycache__'].includes(n)).flatMap(n=>walk(resolve(p,n)));
 return s.isFile()&&!omit.has(p.split(sep).at(-1))?[p]:[];
}
function canonical(v){if(Array.isArray(v))return v.map(canonical);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])]));return v;}
function bytes(p){
 const b=readFileSync(p);
 if(p.endsWith('/build/wechatgame/project.config.json')){const x=JSON.parse(b);x.appid='';return Buffer.from(JSON.stringify(canonical(x)));}
 return b;
}
const roots={gameSource:['assets/scripts','assets/scenes','settings','package.json','package-lock.json','tsconfig.json','tsconfig.core.json'],art:['assets/resources','art-source','music-source'],web:['build/web-mobile'],wechat:['build/wechatgame']};
function group(paths){
 const files=paths.flatMap(p=>{const full=resolve(root,p);if(!existsSync(full))throw Error(`Missing fingerprint input: ${p}`);return walk(full);}).sort().map(p=>{const b=bytes(p);return{path:posix(relative(root,p)),bytes:b.length,sha256:hash(b)};});
 return{fileCount:files.length,sha256:hash(files.map(f=>`${f.path}:${f.sha256}`).join('\n')),files};
}
if(args.includes('--help')){console.log('node tools/battle-fix2-fingerprint.mjs [--root PROJECT] [--output evidence/BATTLE-FIX2-20260925/BUILD_ID.json] [--check]\nCreate after final source/build freeze; --check only compares. AppID normalized blank; private config excluded.');process.exit(0);}
if(JSON.parse(readFileSync(resolve(root,'package.json'))).version!==VERSION)throw Error('Package version is not FIX2');
const groups=Object.fromEntries(Object.entries(roots).map(([k,v])=>[k,group(v)]));
for(const name of ['gameSource','web','wechat'])if(!groups[name].files.some(f=>/\.(?:ts|js)$/.test(f.path)&&readFileSync(resolve(root,f.path),'utf8').includes(RUNTIME)))throw Error(`${name} does not contain the FIX2 runtime identifier`);
const sourceAndBuildSha256=hash(Object.entries(groups).map(([k,v])=>`${k}:${v.sha256}`).join('\n'));
if(check){
 const saved=JSON.parse(readFileSync(output));
 if(saved.runtime!==RUNTIME||saved.version!==VERSION||saved.sourceAndBuildSha256!==sourceAndBuildSha256||JSON.stringify(saved.groups)!==JSON.stringify(groups))throw Error('BUILD_ID differs from actual source/assets/build files');
 console.log(JSON.stringify({passed:true,mode:'read-only-check',runtime:RUNTIME,sourceAndBuildSha256}));
}else{
 if(existsSync(output))throw Error('BUILD_ID already exists; preserve it. Use --check or an explicit new --output after a reviewed rebuild.');
 mkdirSync(dirname(output),{recursive:true});
 writeFileSync(output,JSON.stringify({schema:1,task:TASK,version:VERSION,runtime:RUNTIME,generatedAt:new Date().toISOString(),sourceAndBuildSha256,normalization:'Only build/wechatgame/project.config.json appid normalized to blank and keys sorted; private config excluded. All other file bytes exact. This is a local snapshot, not a Git commit or device verification.',groups},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({written:output,runtime:RUNTIME,sourceAndBuildSha256,groups:Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,{fileCount:v.fileCount,sha256:v.sha256}]))}));
}
