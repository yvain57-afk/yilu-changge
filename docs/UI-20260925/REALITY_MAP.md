# UI-20260925 真实工程映射

核对日期：2026-09-25。当前工程 `/Users/yvainair/Code/游戏-左右滑古代史`，Cocos Creator 3.8.8，基线 v09-rc1。源包 SHA256 cc4cb06d8d0f3aa0592e2bd7efe2ba3e2c29f22fcf17f4520f947ca92eb4ae2e。

## 基线保护
已有 staged/unstaged/untracked 均保留，未执行 reset、stash、clean。修改前代码和 Web 分别留在 `.cache/UI-20260925-baseline/source-before.tgz` 与 `web-before.tgz`，差异及状态同目录留存。七态截图用独立43205服务、隔离测试存档捕获，用户存档不用于测试。

## 页面、数据和命令
| 页面 | 当前真实入口/数据 | 本次适配 |
|---|---|---|
| 首页 | Game.show('home')，Book.cleared、Campaign.pending/completed、rankStage | 城寨、独立主将、实际进度解析开始/继续/驻地 |
| 三关地图 | show('chapters')，LEVELS三项、Book.unlock/runnerBest | 三个独立可点节点，点击选中/说明，单独出征 |
| 整备 | show('loadout')，Growth.unlockedWeapons/unlockedCompanions/equipped* | 当前主将+最多一同袍、锁定条件、选择保存、单独出征、返回来源 |
| 战斗 | begin -> Journey.runnerVideoV2，runnerConfig三关 | 真实成员射击、脚位与project不改，门值/箱耐久来自runner |
| 结果 | Journey.finished -> Book.win + Growth.reconcile一次 | 只读结果、真实新解锁、实际人数/用时、保存重试 |
| 驻地 | Campaign.completed.garrison，show('camp') | 静态营地背景、整备/会面/重玩 |
| 过渡/会面 | Campaign.complete/meet，flag脚位拖拽或等价按钮 | 原存档顺序保留，保存失败不越过过渡 |

真实同袍：邢道荣（第一关）、陈应（第二关）、赵云（第三关）。杨龄是敌将，不成为可选同袍。真实主将兵器为长枪、长刀；长刀第一关解锁。没有体力、货币、星级、马匹、双副将和第四关；参考图这些内容不进入代码。原有战斗弩/连弩/火矢升级仍来自途中武器箱。

## 素材审计与职责
包中只有参考和合同，无生产素材。复用当前148帧角色/兵器/场景图集及5个动作音效。新生成无文字城寨、地图、营地、战旗结算背景，以及保持蓝巾蓝披风身份的独立主将插画。当前动作不伪称新绘全套动画；远中近独立层及独立肖像/九宫素材逐项记录在ASSET_STATUS，不因功能通过而视觉通过。

Game/ScreenPresenter/UiLayout及存储成功失败反馈由主代理集成；BattleView战斗与页景外部资源开关由world任务；PresentationAssets/导入压缩和预算由platform任务；七态基线、尺寸/交互/录像验证工具由runner任务。模型runner、配置数值、永久解锁规则不在改动范围。存储persist只补明确成功/失败返回及错误清除，不改key/schema/奖励。
