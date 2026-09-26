# v0.8.1 · 手机截图评审修订

本轮依据用户提供的 `YILU_V08_SCREENSHOT_REVIEW.md`，在最新本地工作区继续修改。既有未提交源码和UI保留；修改前备份位于 `.cache/v081-baseline/`。没有重新下载视频、扩关、恢复音乐或新增大图。

## 实际修改

| 评审问题 | 本版处理 | 主要代码 |
|---|---|---|
| 结果页两套主角重叠 | 结果页使用无人物的背景渲染；胜利肖像只有一个独立绘制入口，离页后恢复首页角色。首次胜利、重玩、失败分别检查 | `Game.ts`、`BattleView.background` |
| 整备标题压建筑、地图抢空间 | 标题、人物、武器/同袍、返回按钮共享安全区布局并各有底衬；整备只显示选定主角与同袍、小型营帐，不绘制地图或城门；往返不叠层 | `UiLayout.preparationLayout`、`Game.loadout`、`BattleView.preparation` |
| 副标题仍提兵法 | 改为“选好兵器与同袍，再踏征途”；保留途中补给决定本局火力的说明 | `Game.ts` |
| 重玩仍称陈应加入 | 结果正文只概述战斗目标；本次新增奖励仍根据实际解锁差集单独显示，不改存档发奖规则 | `Game.ts` |
| 特殊角色挤在普通兵中 | 主将与同袍单独前排，横向间隔0.30；普通兵后移0.65，横向间隔0.17、纵向0.30；真实成员位置同时用于渲染、发射和门碰撞 | `runnerFormation` |
| 近身敌人堆叠、关系不清 | 近身敌军追踪可接触的前排，按实际位置形成接触队列；所有活敌及HP保留。真实扣兵记录攻击者、受击成员、双方坐标，并据此绘制短反馈 | `RunnerDirector.moveEnemies/contacts`、`BattleView.runnerBattle` |
| 门受击整面变黄 | 正负面板保持红/蓝绿色；命中使用窄亮边；0与正数使用安全色 | `BattleView.runnerBattle` |
| 箱奖励与耐久难区分 | 奖励名称/数量使用上层独立色牌，耐久在下层明确写“耐久”；保留耐久条，提示同步调整 | 同上 |
| 兵力只有顶部一行 | 队伍附近添加紧凑人数标记和真实事件驱动的短损兵提示，没有新增通栏HUD | 同上 |

这些队形与接触间距是本作显式初值，不是原版已证实公式。射击、奖励、门值累积、装备伤害、敌军HP与接触扣兵数值没有借视觉修复改写；空间改变会影响命中分配和实玩结果，因此不能称“平衡完全不变”。

## 验证范围

- 56项相关回归通过：runner机制、成长/进度、UI安全区、部分既有战斗契约；不是全部历史测试全跑。
- 全项目类型检查与Web、微信双端构建通过。
- 三关模型自动走位检查通过，结果在 `evidence/v081/model-probe.json`。这是模型检查，没有录成手机实玩视频。
- 浏览器定点检查：首次/重复胜利、失败、重玩第二关、整备选兵器与同袍后往返；390×844、360×640及模拟胶囊安全区。角色唯一性和按钮边界有断言。
- 最终第二关通过真实触摸输入重玩：44.02秒，31人结束，14枚链门全部领取。使用已通关测试存档与自动策略，不代表普通玩家盲玩结果；该次没有捕获近身损兵，所以不能拿此录像证明损兵反馈。
- 接触反馈使用单独高HP敌军夹具，记录18→17，保留18名活敌；在真实扣兵时暂停截帧后继续，用于核对坐标、损失和可见反馈。它不是自然流程录像。
- 门颜色截图是对实际 `hitTarget` 调用的隔离场景，分别检查负数、0、正数受击态。
- 不默认十局长测，也没有重录完整三关；本轮15秒第二关片段从本轮同一次重玩录像截取。

## 中间失败及修正

1. 首轮旧碰撞夹具按旧前排位置摆门，已按新实际脚底位置更新，保留边缘命中、多门独立结算、新成员下一步生效等原断言。
2. 自动走位策略原先在负门落后队长1.8时停止避让，新队尾更长；改为以实际队尾判断，避免测试策略过早横移。
3. 第一轮接触夹具超时，定位到敌军追逐后排横向位置但停在前排的问题；修复为可接触前排，并增加明确损兵回归。不是用删活敌、自动清怪或提高伤害绕过问题。
4. 近身分离仅沿接触队列传播，远处聚集目标仍可受到正常爆炸范围伤害；爆炸不重复结算的回归继续保留。

早期失败记录以 `initial-` 文件名保留；最终状态看 `summary.json`、`tests.log`、`review-checks.json` 和 `contact-followup.log`。

## 可复核证据

- `evidence/v081/review-checks.json`：页面断言、实际第二关统计、接触/门夹具，浏览器错误列表。
- `evidence/v081/result-first.png`、`result-repeat.png`、`result-failure.png`、`result-repeat-level2.png`。
- `evidence/v081/loadout-phone.png`、`loadout-short.png`、`loadout-host.png`。
- `evidence/v081/level2-replay.mp4`：本轮最终第二关重玩全过程。
- `evidence/v081/level2-contact-and-chain.mp4`：上述录像截取的15秒链门与接近敌军片段，不表示发生近身扣兵。
- `evidence/v081/contact-fixture.mp4`、`contact-fixture.png`：独立接触夹具。
- `evidence/v081/gate-negative-hit.png`、`gate-zero-hit.png`、`gate-positive-hit.png`：独立门受击状态。
- `evidence/v081/phone-preview.json`：新版官方工具预览回执；共享开发包不含二维码或个人AppID。

## 尚需用户判断

新版手机扫码运行、触控手感和美术品质仍待验收；模拟安全区不能替代真机。敌军接触队列和队伍纵深改变了火力与损耗分布，56项功能测试不代表难度已定稿。重点看前排是否清楚、人数标记是否挡人、奖励字是否足够易读。第三关模型路线错过了赵云箱（剩余耐久2.5），这是该路线结果，不应写成“所有奖励均已自然领取”。

微信预览包20,905,162字节，距离本项目20MiB预算还有66,358字节；没有新增大图。开发依赖沿用旧锁文件（仅版本标识更新），未处理此前sharp相关high级审计项。没有发布、提审或Git推送。

## 运行与接续

本机：`PORT=43194 node tools/serve.mjs`，打开 `/play/?v=081` 或 `/review/v081/`。本机地址不代表云端GPT可访问。

相关检查：

```sh
npx tsx --test tests/runner-v08.test.ts tests/progression.test.ts tests/ui-v06.test.ts tests/combat-v05.test.ts
npm run typecheck
npx tsx tools/v081-probe.ts
YILU_EVIDENCE_DIR=evidence/v081 npm run build:web
```

浏览器脚本使用本机Chrome和43194端口。先执行 `npx tsc -p tsconfig.core.json` 及 `npx tsc tools/v08-policy.ts --target ES2020 --module CommonJS --outDir .cache/v08-logic --skipLibCheck`，再执行 `node tools/browser-v081-review.mjs`。仅需重复隔离接触/门场景时可使用 `--fixtures-only`，复用已存在的页面与第二关证据。

最终第二关录像之后，仅将独立接触夹具中的减员数字改为红底白字短标记，并重新核验/录制该夹具、重建双端；该第二关路线无近身损兵，空间和战斗逻辑未再改变，故不重复录制第二关。

本轮不应继续用旧v08三关录像宣称新队形已完成自然三关验收。旧文档、旧包和旧证据均保留用于回溯。
