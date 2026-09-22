import{readFileSync,writeFileSync,readdirSync,statSync,mkdirSync,renameSync,existsSync}from'node:fs';
const root='build/wechatgame',read=p=>JSON.parse(readFileSync(p,'utf8'));
const walk=p=>readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]);
const obsolete=walk('assets/resources').filter(p=>!p.endsWith('.meta')&&(/\/art\/|\/v2\/|\/audio-v031\//.test(p)||p.endsWith('/audio/music.mp3')||p.endsWith('/v4/heroes.png')));
const uuids=new Set(obsolete.map(p=>read(p+'.meta').uuid));
const excluded=walk(root+'/subpackages/resources/native').filter(p=>uuids.has(p.split('/').pop().split('.')[0]));
const config=read(root+'/project.config.json');const prior=(config.packOptions?.ignore??[]).filter(e=>!excluded.some(p=>p.slice(root.length+1)===e.value));
config.packOptions={...config.packOptions,ignore:[...prior,...excluded.map(p=>({type:'file',value:p.slice(root.length+1)}))]};writeFileSync(root+'/project.config.json',JSON.stringify(config,null,2));
const total=walk(root).reduce((n,p)=>n+statSync(p).size,0),excludedBytes=excluded.reduce((n,p)=>n+statSync(p).size,0);
const report={totalBytes:total,excludedBytes,uploadBytes:total-excludedBytes,limitBytes:20*1024*1024,excludedSource:obsolete,excluded:excluded.map(p=>p.slice(root.length+1)),reason:'Unused historical art and disabled music only; source files preserved, current art unchanged.'};if(report.uploadBytes>=report.limitBytes)throw Error('Package still over WeChat limit');
const backup='.cache/v051-wechat-unused-native-'+Date.now();for(const p of excluded){const to=backup+'/'+p.slice(root.length+1);mkdirSync(to.slice(0,to.lastIndexOf('/')),{recursive:true});if(existsSync(to))throw Error('Existing exclusion backup; rebuild needs a fresh backup directory');renameSync(p,to);}
writeFileSync('evidence/v051/wechat-package.json',JSON.stringify(report,null,2));console.log({uploadBytes:report.uploadBytes,excludedBytes});
