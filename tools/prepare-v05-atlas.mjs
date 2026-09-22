import sharp from 'sharp';import{writeFileSync}from'node:fs';
const frames={},report={generator:'built-in image_gen',assets:[],frames};
const {data,info}=await sharp('assets/resources/v05/cast.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
for(let row=0;row<4;row++)for(let col=0;col<4;col++){
 let x0=info.width,y0=info.height,x1=0,y1=0;const l=Math.round(col*info.width/4),r=Math.round((col+1)*info.width/4),t=Math.round(row*info.height/4),b=Math.round((row+1)*info.height/4);
 for(let y=t;y<b;y++)for(let x=l;x<r;x++)if(data[(y*info.width+x)*4+3]>64){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 if(x1-x0<50||x0<=l||x1>=r-1||y0<=t||y1>=b-1)throw Error('Sprite must fit padded cell '+row+':'+col);
 frames[`cast${row}Pose${col}`]={sheet:'v05/cast',rect:[x0-2,y0-2,x1-x0+5,y1-y0+5],pivot:[(x0+x1)/2,y1]};
}
frames.great_axe={sheet:'v05/weapons',rect:[120,12,370,996],pivot:[387,580]};
frames.throwing_fork={sheet:'v05/weapons',rect:[631,75,340,839],pivot:[801,735]};
frames.blade={sheet:'v05/weapons',rect:[1196,8,198,997],pivot:[1263,791]};
const sockets={spear:{grip:[626,850],tip:[626,27]},blade:{grip:[1263,791],tip:[1360,24]},great_axe:{grip:[387,580],tip:[243,94]},throwing_fork:{grip:[801,735],tip:[801,96]}};
for(const name of ['cast','weapons']){const p=`assets/resources/v05/${name}.png`,meta=await sharp(p).metadata(),stats=await sharp(p).stats();if(!meta.hasAlpha||stats.channels[3].min!==0)throw Error('missing alpha');report.assets.push({name,width:meta.width,height:meta.height,alpha:stats.channels[3]});}
writeFileSync('assets/scripts/ArtAtlasV05.ts','// Original RGBA atlas; UV crops only, with measured transparent bounds.\nexport const V05_FRAMES='+JSON.stringify(frames,null,2)+' as const;\nexport const V05_SOCKETS='+JSON.stringify(sockets)+' as const;\n');
writeFileSync('art-source/v05/manifest.json',JSON.stringify({...report,sockets},null,2));
