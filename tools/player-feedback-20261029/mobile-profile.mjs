// Reproducible test-package profile: source art and all gameplay data are untouched.
import fs from 'node:fs';import path from 'node:path';import sharp from 'sharp';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
const root=process.env.YILU_WECHAT_BUILD||'build/wechat-feedback-20261029',e=process.env.YILU_WECHAT_EVIDENCE||'.cache/iphone-quick/player-feedback-20261029';const read=p=>JSON.parse(fs.readFileSync(p));const hash=b=>createHash('sha256').update(b).digest('hex');const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(p+'/'+x.name):[p+'/'+x.name]);
const m=read(e+'/art-manifest.json'),unusedSheets=['formal_enemies','formal_heroes','formal_companions','formal_owners','formal_runs','formal_fronts','formal_bossactions'];
for(const key of unusedSheets)if(Object.values(m.frames).some(f=>f.s===key))throw Error('Referenced sheet '+key);
const sheetByPath=new Map(Object.entries(m.sheets).map(([k,p])=>[p,k]));
const keep=new Set([...Object.entries(m.sheets).filter(([k])=>!unusedSheets.includes(k)).map(([,p])=>p),'formal20260927/gate-digits',...['home-bg','map-bg','camp-bg','result-bg','hero-home','hero-blade','brand-title','gold-button'].map(x=>'ui20260925/'+x)]);
const originals=new Map();for(const p of walk('assets/resources').filter(p=>!p.endsWith('.meta'))){if(fs.existsSync(p+'.meta'))originals.set(read(p+'.meta').uuid,{p,base:p.slice('assets/resources/'.length).replace(/\.[^.]+$/,'')});}
const profile={sizes:{},unusedSheets},ops=[];const scale=Number(process.argv[2]||'.5625');
for(const p of walk(root+'/subpackages/resources/native')){const src=originals.get(path.basename(p).split('.')[0]);if(!src)continue;
 const required=keep.has(src.base)||/^audio\/(shanhe|weapons)\//.test(src.base)||/^audio\/(gather|hit|break|hurt|warn)$/.test(src.base);
 if(!required){fs.unlinkSync(p);ops.push({source:src.p,removed:true});continue;}
 if(p.endsWith('.png')){const key=sheetByPath.get(src.base),original=await sharp(src.p).metadata();const rescale=key&&!/map|ground|digits|distant|ui_|shadow|finger/.test(key);let encoder=sharp(src.p);let width=original.width,height=original.height;
 if(rescale){profile.sizes[key]=[width,height];width=Math.round(width*scale);height=Math.round(height*scale);encoder=encoder.resize(width,height);}
 // Single encoding from source. Never recompress a previous lossy candidate.
 const candidate=await encoder.webp({quality:rescale?82:92,alphaQuality:100,effort:5}).toBuffer();let output=candidate;
 if(!rescale&&fs.statSync(src.p).size<candidate.length)output=fs.readFileSync(src.p);
 fs.writeFileSync(p,output);ops.push({source:src.p,path:p,key,original:[original.width,original.height],dimensions:[width,height],rescaled:!!rescale,bytes:output.length,sha256:hash(output)});
 }else if(/\.(wav|mp3)$/.test(p)){const out=p.replace(/\.wav$/,'.mp3');execFileSync(process.env.YILU_WECHAT_FFMPEG||'/Users/yvainair/.local/bin/ffmpeg',['-v','error','-y','-i',src.p,'-codec:a','libmp3lame','-b:a','128k',out]);if(out!==p)fs.unlinkSync(p);ops.push({source:src.p,path:out,bytes:fs.statSync(out).size});}
}
for(const p of walk(root+'/subpackages/resources/import').filter(p=>p.endsWith('.json'))){const s=fs.readFileSync(p,'utf8');if(s.includes('".wav"'))fs.writeFileSync(p,s.replaceAll('".wav"','".mp3"'));}
const bootstrap=root+'/texture-profile.js';fs.writeFileSync(bootstrap,'globalThis.__YILU_TEXTURE_PROFILE__='+JSON.stringify(profile)+';\n');const game=root+'/game.js';let code=fs.readFileSync(game,'utf8');if(!code.includes("require('./texture-profile.js')"))fs.writeFileSync(game,"require('./texture-profile.js');\n"+code);
const config=read(root+'/project.config.json');config.projectname='一将成军-开发测试版';config.appid=read(e+'/account-boundary.json').appid;fs.writeFileSync(root+'/project.config.json',JSON.stringify(config,null,2));
const files=walk(root),after=files.reduce((n,p)=>n+fs.statSync(p).size,0),main=files.filter(p=>!p.includes('/subpackages/')).reduce((n,p)=>n+fs.statSync(p).size,0);
fs.writeFileSync(e+'/mobile-profile.json',JSON.stringify({scale,profile,ops,after,main,priorTestAccountBudget:20*1048576,mainBudget:4*1048576,priorLimitEvidence:'.cache/iphone-quick/wechat-20261023/preview.log:80051 test-account limit 20MB; not the formal-account limit',files:files.map(p=>({path:p,bytes:fs.statSync(p).size,sha256:hash(fs.readFileSync(p))}))},null,2));console.log({totalMiB:after/1048576,mainMiB:main/1048576,scaled:Object.keys(profile.sizes).length,removedSheets:unusedSheets.length});
