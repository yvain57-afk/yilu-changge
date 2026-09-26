# 《一路长歌：三国》UI 设计 agent 交接包

这是一份 **UI重新设计任务包**，不是已经完成的新UI，也不是Cocos补丁。

优先级：手机安全区 → 首页与战斗HUD → 同风格共用组件 → Codex接入。
用户要求：UI要真正重设计、刘海/灵动岛不能挡住信息、微信胶囊不能盖住操作；保留现有角色与玩法，继续节省迭代时间和Token。

## 最短使用方法

把本包完整交给专门的设计 agent，发送 `00_START_DESIGN_AGENT.md` 的内容。
先读该提示和 `01_UI_DESIGN_BRIEF.md`，实际打开 references 中两张原始截图。
需要处理安全区时读 `02_SAFE_AREA_AND_HANDOFF.md`；无需阅读项目过去数十份策划或运行全部测试。

本批一次交付：首页、战斗HUD（行路/Boss/觉醒状态）、一页共用组件、短屏适配与可供Codex还原的规格。
用户说的是先给设计 agent 优化 UI；本包没有授权 agent 改动战斗模型、发布、付费或操作用户账号。

## 文件

- `00_START_DESIGN_AGENT.md`：可直接发送的提示词。
- `01_UI_DESIGN_BRIEF.md`：视觉方向、真实内容、界面层级、交付与验收。
- `02_SAFE_AREA_AND_HANDOFF.md`：安全区、坐标、触摸与Cocos接入约束；技术附录。
- `03_SOURCE_NOTES.md`：来源、版本和未核实边界。
- `design-data/visual-seeds.json`：建议设计参数，不是已批准的最终样式。
- `design-data/viewport-fixtures.json`：合成适配测试条件，不是任何机型的真实API返回值。
- `references/*original.png`：用户截图原件，各941×2048。
- `references/*annotated.png`：在截图上加的问题标注，不是新设计。
- `source-context/`：同提交小范围源码摘录，用于离线核对；不是完整源码备份，无须整仓扫描。

当前阅读基线：`7ee7685e4bcb4fb7aa67284e7b56692826b86675`，版本 `v0.5.1-rc1`。
本包未修改远端仓库，也没有执行游戏/微信构建。实际用户手机的API指标需要后续由Codex采集。
