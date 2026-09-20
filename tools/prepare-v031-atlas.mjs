import {readFileSync,writeFileSync} from 'node:fs';
// Source PNG is untouched. Runtime UVs split at the hem so the six gait keys
// continue while upper bodies independently draw/release/recover every .25s.
const centers=[158,399,646,914,1168,1412],top=[32,275,519,754],bottom=[261,505,747,983],seam=[210,452,696,932],width=[152,152,152,152],frames={};
for(let row=0;row<4;row++)for(let col=0;col<6;col++){
 const x=centers[col]-width[row]/2,y=top[row],w=width[row],b=bottom[row],cut=seam[row];
 // Lower crop excludes the next row's left bow at the one touching-cell edge.
 frames[`archer${row}Upper${col}`]={sheet:'v031/archers',rect:[x,y,w,cut-y],pivot:[centers[col],b]};
 frames[`archer${row}Leg${col}`]={sheet:'v031/archers',rect:[centers[col]-46,cut,92,b-cut],pivot:[centers[col],b]};
}
writeFileSync('assets/scripts/ArtAtlasV031.ts','// UVs into original RGBA animation sheet. No raster editing.\nexport const V031_FRAMES = '+JSON.stringify(frames,null,2)+' as const;\n');
