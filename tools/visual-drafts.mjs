import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import sharp from 'sharp';
mkdirSync('docs/visual',{recursive:true});
const embed=(name,x,y,w,h)=>`<image x="${x}" y="${y}" width="${w}" height="${h}" href="data:image/svg+xml;base64,${readFileSync(`art-source/${name}.svg`).toString('base64')}"/>`;
for(const [i,title,era,line] of [[0,'渡口送简','战国','渡口多留一盏灯，等人回家。'],[1,'关道护粮','西汉','粮到了，远行的人能吃上热饭。'],[2,'长街寻信','唐','名字未必留下，牵挂仍在路上。']]){
 let body=embed(`landscape-${i}`,0,0,720,1280)+`<rect x="36" y="40" width="648" height="230" rx="16" fill="#f3e7cc"/><text x="360" y="100" text-anchor="middle" font-family="PingFang SC,sans-serif" font-size="24" fill="#78856d">一路长歌 · ${era}</text><text x="360" y="184" text-anchor="middle" font-family="PingFang SC,sans-serif" font-size="64" fill="#354e49">${title}</text><text x="360" y="236" text-anchor="middle" font-family="PingFang SC,sans-serif" font-size="23" fill="#78856d">${line}</text>`;
 for(let n=0;n<16;n++)body+=embed('soldier',240+(n%8)*30,966+Math.floor(n/8)*30,34,42);
 body+=embed('traveler',294,780,130,137)+embed('sparrow',411,775,86,66)+(i===1?embed('cart',177,923,91,62):'');
 body+=`<rect x="36" y="1150" width="648" height="85" rx="12" fill="#f3e7cc"/><text x="360" y="1200" text-anchor="middle" font-family="PingFang SC,sans-serif" font-size="22" fill="#354e49">原创简化视觉稿 · 具体服饰器物待考</text>`;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280">${body}</svg>`;writeFileSync(`docs/visual/level-${i+1}.svg`,svg);await sharp(Buffer.from(svg)).png().toFile(`docs/visual/level-${i+1}.png`);
}console.log('3 original visual drafts generated from source illustrations');
