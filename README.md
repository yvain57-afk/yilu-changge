# 一路长歌 · v0.2 第一关草模

从小人物起步，带队闯关，一步步走向皇位。本轮按 `YILU_FIRST_THREE_V02.zip` 完成 S0/S1；当前只开放「拉起队伍」，8人起步、三排招兵门、清障与投矛Boss，胜利晋升头领。画面明确为临时人物，A/B角色尚未选定。

- [第一关试玩](http://127.0.0.1:43187/)
- [A/B角色对比、手机排布与录屏](http://127.0.0.1:43187/review/)
- [本轮范围与迁移](docs/v02/DECISIONS.md)
- [本轮验证报告](docs/v02/VERIFICATION.md)
- [开发包原文](docs/v02/package/CODEX_FIRST_THREE_BRIEF.md)

入口仅当前电脑可用，服务未启动时运行 `npm run serve`。左右相对拖动，松手/取消即停止横移；自动射箭，兵力越多火力越强。木障可射毁，山石要绕行，受阻门未清先扣损失再增兵。Boss预告落点锁定后不会追踪；没有超时与付费重开。

## 给 GPT 的远程评审入口

[打开当前 v0.2 评审包](docs/v02/GPT_REVIEW.md)：汇集开发范围、A/B角色、手机排布、真实截图/录屏、验证证据及下一步问题。外部GPT不能访问上面的localhost，请使用此仓库入口。

## 开发与验证

工程：`/Users/yvainair/Code/游戏-左右滑古代史`。Cocos Creator 3.8.8、TypeScript，复用原场景。新增 `BattleView.ts` 管临时战斗画面，`VisualConfig.ts` 管投影与含主角的48人上限。

```sh
npm run typecheck:core
npm test
npm run test:negative
npm run typecheck
npm run build:web
npm run serve
# 服务启动后，浏览器验证按顺序运行
npm run test:browser
npm run test:edge
npm run test:failure
npm run build:wechat
```

第二、第三关已有设计数据映射与规则验证，页面仍明确标为后续制作。先选定角色、完成正式首关样板并亲玩确认后再扩关。新存档 `yilu-changge-prototype-v2` 按 `trial-01/02/03` 保存；旧 `yilu-changge-v1` 原样保留，仅迁移设置。

## 状态边界

游戏只在本地运行，尚未公开部署或提交微信发布。用户随后授权将源码与评审材料提交现有公开GitHub仓库，供GPT查看。本轮没有广告、内购、账号、服务器或遥测。微信专用小游戏AppID与真机验收条件仍缺失；游客构建不能上传，不能宣称微信已验收。

旧版本三朝故事、原创素材、课程资料、历史测试与交付包保留；已经退出当前正常入口，不代表新版内容。v0.2真实证据集中于 `evidence/v02`，旧报告不能作为本轮通过凭据。
