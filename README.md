# 一路长歌 · v0.2 S2-A 主角候选

从小人物起步，带队闯关，一步步走向皇位。当前只开放第一关「拉起队伍」。本轮按 `YILU_S2_NEXT_STEP.zip` 完成 S2-A：一名待确认的透明分层主角、动作小样与可读性修复，首关玩法数值不变；其他人物和场景仍为草模。

- [主角 Cocos 动作与手机排布](http://127.0.0.1:43187/?preview=character)
- [本轮评审页、原图及带音轨录像](http://127.0.0.1:43187/review/s2/)
- [第一关试玩](http://127.0.0.1:43187/)
- [S2-A 当前评审说明](docs/v02/s2/GPT_REVIEW.md)
- [S2-A 验证报告](docs/v02/s2/VERIFICATION.md)
- [S1 历史基线](docs/v02/GPT_REVIEW.md)

入口仅当前电脑可用，服务未启动时运行 `npm run serve`。左右相对拖动，松手/取消即停止横移；自动射箭，兵力越多火力越强。木障可射毁，山石要绕行，受阻门未清先扣损失再增兵。Boss预告落点锁定后不会追踪；没有超时与付费重开。

## 给 GPT 的远程评审入口

[打开本地 S2-A 评审包](docs/v02/s2/GPT_REVIEW.md)。外部 GPT 不能访问 localhost；本轮尚未推送；上一轮已推送的 S1 基线为 `184f974`。

## 开发与验证

工程：`/Users/yvainair/Code/游戏-左右滑古代史`。Cocos Creator 3.8.8、TypeScript，复用原场景。`BattleView.ts` 管分层战斗画面，`HeroRig.ts` 管候选动作，`VisualConfig.ts` 管投影与含主角的48人上限。

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
npm run test:preview
npm run test:audio
npm run test:soak
npm run build:wechat
```

第二、第三关已有设计数据映射与规则验证，页面仍明确标为后续制作。先确认本轮角色小样，完成正式首关样板并亲玩确认后再扩关。新存档 `yilu-changge-prototype-v2` 按 `trial-01/02/03` 保存；旧 `yilu-changge-v1` 原样保留，仅迁移设置。

## 状态边界

游戏只在本地运行，尚未公开部署或提交微信发布。用户随后授权将源码与评审材料提交现有公开GitHub仓库，供GPT查看。本轮没有广告、内购、账号、服务器或遥测。微信专用小游戏AppID与真机验收条件仍缺失；游客构建不能上传，不能宣称微信已验收。

旧版本三朝故事、原创素材、课程资料、历史测试与交付包保留；已经退出当前正常入口，不代表新版内容。v0.2真实证据集中于 `evidence/v02`，旧报告不能作为本轮通过凭据。
