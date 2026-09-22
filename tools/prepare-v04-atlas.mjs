import {writeFileSync} from 'node:fs';import sharp from 'sharp';
// Original RGBA data remains untouched. Only runtime UV/anchor metadata.
const frames={},centers=[181,566,940,1370],tops=[32,360,686],bottoms=[311,635,960];
for(let row=0;row<3;row++)for(let col=0;col<4;col++)frames[`spearHero${row}Pose${col}`]={sheet:'v04/spear-hero',rect:[col*384,tops[row],384,bottoms[row]-tops[row]],pivot:[centers[col],bottoms[row]+72]};
frames.spear={sheet:'v04/spear',rect:[554,15,145,1230],pivot:[626,850]};
frames.zhaoyun={sheet:'v04/zhaoyun',rect:[0,0,1254,1254],pivot:[627,1244]};
const report={generator:'built-in image_gen; original RGBA retained',frames,assets:[]};
for(const name of ['spear-hero','spear','zhaoyun']){const p=`assets/resources/v04/${name}.png`,m=await sharp(p).metadata(),stats=await sharp(p).stats();if(!m.hasAlpha||stats.channels[3].min!==0)throw Error('missing transparent alpha '+name);report.assets.push({name,width:m.width,height:m.height,alpha:stats.channels[3]});}
writeFileSync('assets/scripts/ArtAtlasV04.ts','// Original generated textures, shared UVs and anchors.\nexport const V04_FRAMES='+JSON.stringify(frames,null,2)+' as const;\n');
writeFileSync('art-source/v04/manifest.json',JSON.stringify(report,null,2));
