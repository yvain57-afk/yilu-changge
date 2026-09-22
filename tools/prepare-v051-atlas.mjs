import sharp from 'sharp';import{writeFileSync}from'node:fs';import{createHash}from'node:crypto';import{readFileSync}from'node:fs';
const frames={},hands={},manifest={generator:'built-in image_gen',assets:[],handMeasurement:'pixel coordinates inspected from original full-resolution atlases',frames,hands};
const points={
 'blade-hero':[[[270,294],[629,232],[1067,243],[1380,215]],[[270,627],[629,565],[1067,580],[1380,546]],[[270,961],[629,900],[1067,916],[1380,879]]],
 allies:[[[137,280],[495,126],[920,201],[1036,304]],[[248,539],[465,572],[903,537],[1022,620]],[[262,1067],[397,1030],[947,973],[1031,1063]]]
};
for(const name of ['blade-hero','allies']){
 const path=`assets/resources/v051/${name}.png`,{data,info}=await sharp(path).ensureAlpha().raw().toBuffer({resolveWithObject:true}),stats=await sharp(path).stats();if(stats.channels[3].min!==0)throw Error('No transparency');
 for(let row=0;row<3;row++)for(let col=0;col<4;col++){
 const cuts=name==='blade-hero'?[0,362,724,1120,info.width]:[0,316,633,980,info.width],l=cuts[col],r=cuts[col+1],ycuts=name==='blade-hero'?[0,365,705,info.height]:[0,422,844,info.height],t=ycuts[row],b=ycuts[row+1];let x0=r,y0=b,x1=l,y1=t;
 for(let y=t;y<b;y++)for(let x=l;x<r;x++)if(data[(y*info.width+x)*4+3]>64){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 if(x1-x0<50||x0<=l||x1>=r-1||y0<=t||y1>=b-1)throw Error(JSON.stringify({name,row,col,l,r,t,b,x0,x1,y0,y1}));
 const id=`${name==='allies'?'companion':'bladeHero'}${row}Pose${col}`,pivot=[name==='allies'?(x0+x1)/2:(col+.5)*info.width/4,y1+(name==='allies'?0:75)],rect=[x0-2,y0-2,x1-x0+5,y1-y0+5],hand=points[name][row][col];
 if(hand[0]<x0||hand[0]>x1||hand[1]<y0||hand[1]>y1)throw Error('Hand outside visible body '+id);
 frames[id]={sheet:'v051/'+name,rect,pivot};const scale=name==='allies'?88/rect[3]:108/350;hands[id]=[(hand[0]-pivot[0])*scale,(pivot[1]-hand[1])*scale];
 }
 manifest.assets.push({path,width:info.width,height:info.height,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')});
}
writeFileSync('assets/scripts/ArtAtlasV051.ts','// Original sprites. Transparent UV crops and measured feet/waist pivots.\nexport const V051_FRAMES='+JSON.stringify(frames,null,2)+' as const;\n');
const old=JSON.parse(readFileSync('assets/scripts/ArtAtlasV05.ts','utf8').split('export const V05_FRAMES=')[1].split(' as const;')[0]);
const bossPoints=[[[158,238],[441,128],[801,239]],[[158,543],[439,423],[801,537]],[[157,827],[440,721],[802,824]]];
for(let row=0;row<3;row++)for(let key=0;key<3;key++){const f=old[`cast${row}Pose${key}`],h=bossPoints[row][key];hands[`boss${row}Pose${key}`]=[(h[0]-f.pivot[0])*220/f.rect[3],(f.pivot[1]-h[1])*220/f.rect[3]];}
writeFileSync('assets/scripts/core/artSockets.ts','// Measured grip offsets at hero height 108 / companion height 88.\nexport const HAND_SOCKETS='+JSON.stringify(hands,null,2)+' as const;\n');
writeFileSync('art-source/v051/manifest.json',JSON.stringify(manifest,null,2));
