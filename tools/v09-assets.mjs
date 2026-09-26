/** Deterministic build-only atlas cleanup. Source art and atlas coordinates never change. */
import {readFileSync,writeFileSync,readdirSync,statSync,mkdirSync,existsSync,copyFileSync,unlinkSync} from 'node:fs';
import {resolve,relative,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {battleRuntimeAssets,battleRuntimeFrames,battleLegacyAliases} from './battle-rework-assets.mjs';
import {presentationRuntimeAssets} from './ui20260925-assets.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex'), read=p=>JSON.parse(readFileSync(p,'utf8'));
const walk=p=>readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${p}/${e.name}`):[`${p}/${e.name}`]);
const atlasFiles=['ArtAtlas','ArtAtlasV03','ArtAtlasV031','ArtAtlasV04','ArtAtlasV05','ArtAtlasV051'].map(n=>`assets/scripts/${n}.ts`);
function atlas(p){const s=readFileSync(p,'utf8'),end=s.indexOf(' as const;');return JSON.parse(s.slice(s.indexOf('{'),end).trim());}
const all=Object.assign({},...atlasFiles.map(atlas));
const legacyFrames=Object.fromEntries(Object.entries(all).filter(([,f])=>f.sheet!=='v4/heroes'));
const aliases=battleLegacyAliases(),battleFrames=battleRuntimeFrames();
for(const [old,key] of Object.entries(aliases)){if(!battleFrames[key])throw Error('Missing replacement '+key);legacyFrames[old]=battleFrames[key];}
const frames={...legacyFrames,...Object.fromEntries(Object.entries(battleFrames).map(([key,value])=>['battle:'+key,value]))};
const sheets=[...new Set(Object.values(legacyFrames).map(f=>f.sheet.includes('/')?f.sheet:`v3/${f.sheet}`))].filter(s=>!s.startsWith('battle20260925/')).sort();
const sfx=['gather','hit','break','hurt','warn'];
const used=new Set([...sheets.map(s=>`assets/resources/${s}.png`),...sfx.map(s=>`assets/resources/audio/${s}.mp3`)]);
const battleAssets=battleRuntimeAssets();for(const p of battleAssets)used.add(p);
const fix2ManifestPath='art-source/battle-fix2-20260925/runtime-manifest.json';
const fix2Assets=existsSync(fix2ManifestPath)?read(fix2ManifestPath).assets.map(a=>a.runtimePath):[];for(const p of fix2Assets)used.add(p);
const presentationAssets=presentationRuntimeAssets();for(const p of presentationAssets)used.add(p);
const sourceFiles=walk('assets/resources').filter(p=>!p.endsWith('.meta'));
const scripts=walk('assets/scripts').filter(p=>p.endsWith('.ts'));
const serialized=walk('assets').filter(p=>/\.(scene|prefab|mtl|anim)$/.test(p));
const serializedText=serialized.map(p=>({path:p,text:readFileSync(p,'utf8')}));
const serializedReferences=[];
for(const p of sourceFiles){const uuid=read(p+'.meta').uuid;for(const file of serializedText)if(file.text.includes(uuid)){used.add(p);serializedReferences.push({source:p,serialized:file.path});}}
for(const p of scripts)if(/assetManager\.(loadAny|loadBundle|loadRemote)|resources\.preloadDir/.test(readFileSync(p,'utf8')))throw Error(`Unreviewed indirect resource loader: ${p}`);
// Fail closed if the resource-loading contract gains an unreviewed caller.
const resourceCallers=scripts.filter(p=>/resources\.(load|loadDir)\s*\(/.test(readFileSync(p,'utf8')));
for(const p of resourceCallers)if(!['assets/scripts/ui/BattleFix2Assets.ts','assets/scripts/BattleAssets.ts','assets/scripts/ArtSprites.ts','assets/scripts/Platform.ts','assets/scripts/HeroRig.ts','assets/scripts/ui/PresentationAssets.ts'].includes(p))throw Error(`Review new resource loader before pruning: ${p}`);
for(const p of scripts.filter(p=>p!=='assets/scripts/HeroRig.ts'))if(/HeroRig\.(load|ready)|new HeroRig\s*\(/.test(readFileSync(p,'utf8')))throw Error('Legacy HeroRig is active; update asset budget contract');
const mode=process.argv[2]||'--inventory',platform=mode==='--inventory'?null:mode;
if(platform&&!['web-mobile','wechatgame'].includes(platform))throw Error('Expected --inventory, web-mobile or wechatgame');
const evidence=process.env.YILU_EVIDENCE_DIR||'evidence/v09';mkdirSync(evidence,{recursive:true});
const inventory=[];
for(const p of sourceFiles){const bytes=readFileSync(p),meta=read(p+'.meta');if(used.has(p)&&p.endsWith('.png')){for(const value of Object.values(meta.subMetas||{}))if(value.userData?.mipfilter&&value.userData.mipfilter!=='none')throw Error(`Mipmap guard requires separate validation: ${p}`);}inventory.push({source:p,uuid:meta.uuid,bytes:bytes.length,sha256:hash(bytes),loaded:used.has(p),reason:used.has(p)?(battleAssets.includes(p)?'BattleAssets production manifest whitelist':presentationAssets.includes(p)?'Independent PresentationAssets manifest whitelist':p.endsWith('.png')?'Merged ART_FRAMES loaded by ArtSprites':'Platform SFX whitelist'):(p.includes('/v04/spear.png')?'Frame spear overridden by ArtAtlasV05 before ART_FRAMES load':p.includes('/v2/')?'HeroRig has no runtime load/constructor call; Pose is a type only':p.includes('music')?'BGM disabled: no load request':'Absent from merged runtime sheets and SFX whitelist')});}
const duplicateContent=Object.values(Object.groupBy(inventory,a=>a.sha256)).filter(g=>g.length>1).map(g=>g.map(a=>a.source));
async function optimize(p,sheet){
 const original=readFileSync(p),decoded=await sharp(original).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {width,height,channels}=decoded.info,raw=Buffer.from(decoded.data),keep=new Uint8Array(width*height);
 const entries=Object.entries(frames).filter(([,f])=>(f.sheet.includes('/')?f.sheet:`v3/${f.sheet}`)===sheet);
 if(!entries.length)keep.fill(1); // Serialized texture references keep the entire sheet.
 for(const [name,f] of entries){const [x,y,w,h]=f.rect;if(x<0||y<0||x+w>width||y+h>height)throw Error(`Invalid frame ${name}`);for(let yy=Math.max(0,y-4);yy<Math.min(height,y+h+4);yy++)keep.fill(1,yy*width+Math.max(0,x-4),yy*width+Math.min(width,x+w+4));}
 let clearedPixels=0;for(let i=0;i<keep.length;i++)if(!keep[i]){for(let c=0;c<channels;c++)raw[i*channels+c]=0;clearedPixels++;}
 const candidate=await sharp(raw,{raw:{width,height,channels}}).png({compressionLevel:9,adaptiveFiltering:true,palette:false}).toBuffer();
 const output=candidate.length<original.length?candidate:original,checked=await sharp(output).ensureAlpha().raw().toBuffer();
 // Exact pixels (including RGB beneath transparent alpha) inside every frame + bilinear padding.
 const proof=createHash('sha256');for(let i=0;i<keep.length;i++)if(keep[i]){const offset=i*channels;for(let c=0;c<channels;c++)if(checked[offset+c]!==decoded.data[offset+c])throw Error(`Pixel mismatch ${sheet} at ${i}`);proof.update(checked.subarray(offset,offset+channels));}
 return {output,record:{sheet,width,height,frames:entries.map(([name,f])=>({name,rect:f.rect,pivot:f.pivot})),beforeBytes:original.length,afterBytes:output.length,savedBytes:original.length-output.length,clearedUnusedPixels:clearedPixels,guardPixels:4,frameAndGuardPixelsEqual:true,preservedPixelsSha256:proof.digest('hex'),beforeSha256:hash(original),afterSha256:hash(output)}};
}
let operations=[],removed=[],beforeBytes=null,afterBytes=null;
if(platform){
 const root=`build/${platform}`,bundle=platform==='wechatgame'?`${root}/subpackages/resources`:`${root}/assets/resources`;
 if(!existsSync(`${bundle}/config.json`))throw Error(`Build resources missing ${bundle}`);
 const files=walk(`${bundle}/native`),backup=`.cache/v09-build-assets/${platform}/${Date.now()}`;
 beforeBytes=walk(root).reduce((n,p)=>n+statSync(p).size,0);
 for(const item of inventory){const natives=files.filter(p=>p.split('/').pop().split('.')[0]===item.uuid);
  if(item.loaded&&natives.length!==1)throw Error(`Expected exactly one native resource: ${item.source}`);
  for(const p of natives){if(!item.loaded){const dest=`${backup}/${relative(root,p)}`;mkdirSync(dirname(dest),{recursive:true});copyFileSync(p,dest);removed.push({source:item.source,path:relative(root,p),bytes:statSync(p).size,sha256:hash(readFileSync(p)),reason:item.reason});unlinkSync(p);}else if(p.endsWith('.png')){const {output,record}=await optimize(p,item.source.slice('assets/resources/'.length,-4));operations.push({...record,path:relative(root,p)});if(record.savedBytes>0){const dest=`${backup}/${relative(root,p)}`;mkdirSync(dirname(dest),{recursive:true});copyFileSync(p,dest);writeFileSync(p,output);}}}
 }
 afterBytes=walk(root).reduce((n,p)=>n+statSync(p).size,0);
}else for(const sheet of sheets){const {record}=await optimize(`assets/resources/${sheet}.png`,sheet);operations.push(record);}
const report={generatedAt:new Date().toISOString(),mode:platform?'compiled-output':'source-inventory-estimate',platform,sourceArtPreserved:true,atlasCoordinatesUnchanged:true,quality:'Exact RGBA preserved in every runtime frame plus 4px filtering guard; only unreachable atlas pixels become transparent. Same dimensions. No palette, scaling, or lossy codec.',contract:{atlasFiles:atlasFiles.map(p=>({path:p,sha256:hash(readFileSync(p))})),resourceCallers,presentationAssets,battleAssets,fix2Assets,serializedFiles:serialized,serializedReferences,sfx,musicRequested:false,loaderFrames: Object.keys(frames).length},inventory,duplicateContent,operations,removed,beforeBytes,afterBytes,savedBytes:platform?beforeBytes-afterBytes:operations.reduce((n,o)=>n+o.savedBytes,0),budget:{limitBytes:20*1024*1024,thresholdSource:'Existing local project preview/package workflow threshold; not a claim about universal/current WeChat platform allowance. Parent must attach current official preview receipt.',targetMarginBytes:1048576,targetMarginFraction:.05,localFileMarginBytes:platform==='wechatgame'?20*1024*1024-afterBytes:null,officialUploadBytes:null,officialMarginBytes:null},verification:{allFrameAndGuardPixelsEqual:true,sourceHashesCaptured:true,officialPreview:'pending',device:'not-tested'}};
const reportPath=`${evidence}/ASSET_BUDGET${platform?'-'+platform:''}.json`;
const previous=existsSync(reportPath)?read(reportPath):null;
if(platform&&previous&&report.savedBytes===0&&previous.afterBytes===report.afterBytes&&JSON.stringify(previous.contract.atlasFiles)===JSON.stringify(report.contract.atlasFiles)){
 previous.reverifiedAt=report.generatedAt;previous.verification.idempotentRepeat=true;
 writeFileSync(reportPath,JSON.stringify(previous,null,2)+'\n');
}else writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({mode:report.mode,platform,sheets:sheets.length,sourceFiles:sourceFiles.length,unused:inventory.filter(a=>!a.loaded).length,savedBytes:report.savedBytes,beforeBytes,afterBytes,localMarginBytes:report.budget.localFileMarginBytes}));
