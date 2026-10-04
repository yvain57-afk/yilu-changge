import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';import path from 'node:path';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const root=path.resolve('.'),dir=path.join(root,'assets/scripts/formal'),base=path.join(root,'evidence/R3-COMBAT-PATCH-20261002/baseline/source/assets/scripts/formal/battle.ts');
function loader(){const mods=new Map();function load(file){if(mods.has(file))return mods.get(file);const exports={};mods.set(file,exports);const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;vm.runInNewContext(js,{exports,require:n=>load(path.resolve(file===base?dir:path.dirname(file),n+'.ts')),console,Set,Map,Date,Math});return exports;}return load;}
const A=loader(),B=loader(),old=A(base).createBattle,now=B(path.join(dir,'battle.ts')).createBattle,{FormalStore}=B(path.join(dir,'store.ts')),{WEAPON_DATA}=B(path.join(dir,'data.ts'));
const lineup=new FormalStore({getItem:()=>null,setItem:()=>{}}).loadout(),rows=[];
for(const weapon of Object.keys(WEAPON_DATA)){
 const opts={chapter:15,seed:71,runId:'r3-empty-'+weapon,lineup:{...lineup,weapons:Object.keys(WEAPON_DATA),startWeaponId:weapon,companions:['machao','lubu'],support:null},renderer:null};
 const a=old(opts),b=now(opts);for(const x of [a,b]){x.state.course=[];x.state.ents=[];x.state.courseLen=1e9;}
 const ae=[],be=[];for(let n=0;n<1200;n++){a.step();b.step();ae.push(...a.drainAudioEvents());be.push(...b.drainAudioEvents());}
 assert.equal(JSON.stringify(be),JSON.stringify(ae),weapon+' empty-field release events');
 const friendly=x=>x.filter(e=>e.phase==='release').reduce((r,e)=>{r[e.sourceActorId]=(r[e.sourceActorId]||0)+1;return r;},{});
 rows.push({weapon,seconds:20,release_counts:friendly(be),status:'passed'});
}
const baseline=JSON.parse(fs.readFileSync('evidence/R3-COMBAT-PATCH-20261002/baseline/source-manifest.json'));for(const f of baseline.audio_files)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(f.path)).digest('hex'),f.sha256,'audio bytes changed '+f.path);
const report={scope:'Empty battlefield only: protects friendly automatic attack frequency/multisegment audio event identity. Enemy outcomes are authorized to change and are not required to equal baseline.',rows,audio_resource_count:baseline.audio_files.length,audio_bytes_unchanged:true};
fs.writeFileSync('evidence/R3-COMBAT-PATCH-20261002/friendly-invariants.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
