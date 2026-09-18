import {readFileSync,writeFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const parts=[
 '# 一路长歌 · GPT 单文件评审包\n\n当前是被用户否定界面、剧情和文案的工程基线。以下汇集评审说明、当前故事和实际关卡文案，方便一次读取；源码与截图仍以仓库对应文件为准。\n',
 read('docs/GPT_REVIEW.md'),
 '\n---\n# 当前人物与三关故事（原稿，待重写）\n',read('docs/STORY.md'),
 '\n---\n# 实际关卡配置及对白\n\n以下直接来自 assets/scripts/core/levels.ts，未另行美化原文。\n\n```typescript\n'+read('assets/scripts/core/levels.ts')+'\n```\n',
 '\n---\n# 当前关键界面文案\n\n以下摘自 assets/scripts/Game.ts，保留原措辞供评审。完整动态文案以源文件为准。\n\n|位置|当前原文|\n|---|---|\n|首页副题|三页无名者的归途|\n|首页标语|拾起残页，把牵挂送到。|\n|首页主按钮|展开书卷|\n|选关标题|择一页，赴一程|\n|开场主按钮|跳过对白 · 出发|\n|操作说明|空白处左右拖动，箭沿你的位置飞出|\n|行路提醒|提前选路，箭沿队伍中心飞出|\n|守关提醒|对准墨影射箭，落墨前横移|\n|暂停标题|歇一歇，路还在|\n|暂停重开|免费重走这一页|\n|失败标题|纸散了，心意还在|\n|失败说明|只因纸兵归零折返 · 没有倒计时惩罚|\n|胜利标题|此页，已送达|\n|翻页标题|翻页，跨过时光|\n|翻页主按钮|不读也能继续 · 下一页|\n|线索入口|读这一页的线索|\n|最后一页主按钮|合上三页 · 回到书卷|\n',
 '\n---\n# 阅读限制\n\n本包不是“GPT已评审”的结果。若你无法读取仓库图片，请明确这一限制。技术证据在 docs/VERIFICATION.md；用户明确否定当前视觉、故事和文案，不得据技术通过推翻这一反馈。需要动态手感结论时先提出可验证的试玩问题，不假称已经亲自玩过。\n'
];
writeFileSync('docs/REVIEW_PACKET.md',parts.join('\n'));
console.log('Generated docs/REVIEW_PACKET.md from current review brief, story, level text and UI excerpts.');
