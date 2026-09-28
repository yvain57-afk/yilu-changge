# 正式 Cocos 工程现状审计（只读，2026-09-27）

> 方式：对 `assets/scripts/**`、`tests/`、`tools/build.mjs`、`package.json` 只读检索。未运行 Cocos 构建或测试。本轮 Claude **没有修改任何 Cocos 源码**。

结论：线上实际玩法是 `LEVELS` 中的 `profile:'runnerVideoV2'`，由 `core/runner.ts` 的 `RunnerDirector` 执行（`core/levels.ts:572`、`core/model.ts:193`）。legacy-v051、horde-v06、assault-v07 三套留作回归/诊断。本次预览中的新规则（三类宝物、2 随军 + 1 支援、共鸣、十关、吕布交锋与收降、四兵器波）在 Cocos 中**均未接入**。

| 项 | Cocos 现状 | 证据 |
|---|---|---|
| 主将兵器 | 仅 `spear`、`blade`（长刀）。`RunLoadout.weapon` 开局选择仍存在，与新规则“固定长枪起手”冲突 | `core/weapons.ts:3-4,27`；`Game.ts:57,100,173` |
| 局内阶级 | 线上玩法：standard / repeater / explosive 三档，靠 `rewardCrate{reward.kind:'equipment'}` 升档，每局重置。`TIER_FACTORS=[1,1.2,1.4]` 只在旧 `Journey` 中使用 | `runnerConfig.ts:3`；`runner.ts:124`；`weapons.ts:22-23` |
| 兵器波 | `WeaponWave` 只属于旧玩法；线上所有单位发射单发 `Shot`，士兵为 `bow` | `model.ts:176`；`runner.ts:180-186` |
| 随军 | 1 个槽位（“至多一人”）；角色为 `xing_daorong` / `chen_ying` / `zhao_yun_guest`；`fieldCompanion` 箱可让赵云临时上场 | `Game.ts:99`；`weapons.ts:5-21`；`runner.ts:126,181-183` |
| 共鸣 / 支援 | 未实现 | 检索无结果 |
| 宝物 | 未实现（无槽位，无物品） | 检索无结果 |
| 门 | 已实现 `mutableGate`（可射击改值，碰撞结算，负门减员） | `runner.ts:109-118,209-210`；`runnerConfig.ts:29` 起 |
| 箱 | `rewardCrate`（troops / equipment / chain / fieldCompanion）与 `chainCrate`。无粮车、军械箱、宝匣 | `runner.ts:6-7,119-141`；`BattleAtlas.ts` |
| 固定中墙 | 仅第 2 关 `l2.divider`，`barriers` 挡弹，贴图 `battlefix2/wall-middle` | `runnerConfig.ts:394-405`；`runner.ts:88,192`；`BattleView.ts:300-310` |
| 敌将 | 线上仅第 3 关杨龄（HP 1600），枪矛预警分 charge / flight / impact，无收势、无收降。旧 `hazards.ts` 有 observe / telegraph / active / recovery 四阶段，只用于旧玩法 | `runnerConfig.ts:500-504,764-773`；`runner.ts:151,197,221,250`；`core/hazards.ts:8` |
| 关卡 | 3 关（trial-01 乱军突围、trial-02 夺粮立营、trial-03 白石解围）；“地图”是章节选择页加背景图 | `levels.ts:3`；`save.ts:2`；`Game.ts:66,86` |
| 存档 | 主档键 `yilu-changge-prototype-v2`，无显式 version，未知字段存 `extras`；成长档 `yilu-changge-growth-v05`（`schemaVersion:1`）；首通奖励经 `claimedRewards['first_clear:'+id]` 幂等 | `save.ts:17,22`；`growth.ts:9`；`Game.ts:199` |
| 局外成长 | 只有解锁（长刀、邢道荣、陈应、赵云），没有等级、货币、属性 | `growth.ts` |
| 新素材引用 | Cocos 未引用 `docs/BATTLE-PREVIEW-20260926/assets/gen/*`，仍用 `battle20260925`、`battlefix2`、`ui20260925` | 检索 |
| 测试 / 构建 | `npm test` = `tsx --test tests/*.test.ts`（22 个测试文件）；`build:web` / `build:wechat` → `tools/build.mjs`，调用 CocosCreator 3.8.8 `--build`；微信构建需要真实 appid | `package.json`；`tools/build.mjs` |

Git：以上 Cocos 文件中大量为本轮之前已有的 M / ?? 状态（包括 `core/runner*.ts`、`ui/`、`BattleAtlas.ts` 等），不属于 Claude 本轮改动。
