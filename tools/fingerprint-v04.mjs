import{readdirSync,readFileSync,writeFileSync}from'node:fs';import{createHash}from'node:crypto';
const walk=p=>readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]);
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const files=[...walk('assets/scripts'),...walk('assets/resources/v04'),'package.json','settings/v2/packages/builder.json'].filter(p=>!p.endsWith('.meta')).sort();
const source=files.map(path=>({path,sha256:hash(path)}));const sourceHash=createHash('sha256').update(JSON.stringify(source)).digest('hex');
const bundle=root=>{const files=walk(root).filter(p=>!p.endsWith('project.config.json')&&!p.endsWith('project.private.config.json')).sort().map(path=>({path,sha256:hash(path)}));return{sha256:createHash('sha256').update(JSON.stringify(files)).digest('hex'),files};};
writeFileSync('evidence/v04/fingerprint.json',JSON.stringify({version:'v04-rc1',sourceHash,source,web:bundle('build/web-mobile'),wechat:bundle('build/wechatgame'),localTestIdentityExcluded:true},null,2));console.log(sourceHash);
