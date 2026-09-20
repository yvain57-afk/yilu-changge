> 当前为 **v0.3.1**：整队齐射、连续地面与场景、六帧步态、新 BGM。[试玩](http://127.0.0.1:43187/play/) · [本轮结果](http://127.0.0.1:43187/review/v03/#v031)。本次获授权提交 GitHub；[给 GPT 规划下一步](docs/v03/GPT_NEXT_STEP.md)。下方 v0.3 包与证据为历史版本，未部署网页或发布微信游戏。

# 一路长歌 · v0.3 三关试玩候选

从小人物起步，一步步当皇帝。本版可连续完成山道、营寨和城门，拿下第一座城。

- [当前 GPT 评审入口](docs/v03/GPT_REVIEW.md)
- [启动与完整玩法](docs/v03/PLAYTEST.md)
- [三关原速有声录像](evidence/v03/three-levels-with-audio.mp4)
- [对应版本的测试结果](evidence/v03/SUMMARY.json)

Mac 双击项目根目录的 `启动一路长歌.command`，或在项目根目录运行 `npm run serve` 后访问 http://127.0.0.1:43187/play/ 。预构建试玩无需安装 Cocos；仅拿到源码时，先安装 Cocos Creator 3.8.8、运行 `npm ci` 和 `npm run build:web`。

已有 S2-B 首关存档会继续第二关，也可选关重玩。全三关完成后显示「首城已得 · 起步篇完成」，不代表已登基。当前等待用户集中试玩，微信真机与目标手机性能尚未验收。

<details>
<summary>历史版本说明（不作为当前制作停点）</summary>

# 一路长歌 · v0.2 S2-B 首关整体升级

从小人物起步，带队闯关，一步步走向皇位。当前只开放第一关「拉起队伍」。本轮在 S2-A 上完成小屏主角、普通弓手、阵型、敌兵、投矛 Boss、山道场景、界面及战斗/晋升反馈，保留原玩法和存档。

- [第一关试玩](http://127.0.0.1:43187/play/)
- [完整录像、360/390 前后对照与排布矩阵](http://127.0.0.1:43187/review/s2b/)
- [S2-B 当前交付与验证入口](docs/v02/s2b/GPT_REVIEW.md)
- [完整首关录像文件：实际音轨、原速](evidence/v02-s2b/first-level-with-audio.mp4)
- [S2-A 历史评审](docs/v02/s2/GPT_REVIEW.md)

入口仅当前电脑可用，服务未启动时运行 `npm run serve`。左右相对拖动，松手/取消即停止横移；自动射箭，兵力越多火力越强。木障可射毁，山石要绕行，受阻门未清先扣损失再增兵。Boss预告落点锁定后不会追踪；没有超时与付费重开。

## 给 GPT 的远程评审入口

[打开 S2-B 评审包](docs/v02/s2b/GPT_REVIEW.md)。从当前图片、视频和验证报告继续，不把旧 S1/S2-A 当作这轮版本。外部 GPT 不能访问 localhost，需通过仓库读取材料。

## 开发与验证

工程：`/Users/yvainair/Code/游戏-左右滑古代史`。Cocos Creator 3.8.8、TypeScript，复用原场景。`BattleView.ts` 管分层战斗画面，`ArtSprites.ts` 管共用图集与帧动画，`HeroRig.ts` 管换装接旗，`VisualConfig.ts` 管投影与含主角的48人上限。

```sh
npm run typecheck:core
npm test
npm run test:negative
npm run typecheck
npm run build:web
npm run serve
# 服务启动后，浏览器验证按顺序运行；也可用 node tools/verify-s2b.mjs 连续执行完整回归
npm run test:browser
npm run test:edge
npm run test:failure
npm run test:preview
npm run test:audio
npm run test:soak
npm run build:wechat
```

第二、第三关已有设计数据映射与规则验证，页面仍明确标为后续制作。本轮集中试玩第一关，通过后再决定扩关。新存档 `yilu-changge-prototype-v2` 按 `trial-01/02/03` 保存；旧 `yilu-changge-v1` 原样保留，仅迁移设置。

## 状态边界

游戏只在本地运行，尚未公开部署或提交微信发布。用户随后授权将源码与评审材料提交现有公开GitHub仓库，供GPT查看。本轮没有广告、内购、账号、服务器或遥测。微信专用小游戏AppID与真机验收条件仍缺失；游客构建不能上传，不能宣称微信已验收。

旧版本三朝故事、原创素材、课程资料、历史测试与交付包保留；已经退出当前正常入口，不代表新版内容。本轮真实证据集中于 `evidence/v02-s2b`；`evidence/v02` 和 `evidence/v02-s2` 为历史，不能作为本轮通过凭据。

</details>
