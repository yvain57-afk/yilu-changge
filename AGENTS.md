# 一路长歌：三国｜项目指令

通用执行规则由 `/Users/yvainair/.codex/AGENTS.md` 与 `/Users/yvainair/Code/AGENTS.md` 维护，本文件只写项目约束与事实来源。

## 当前接管入口

- **先读 `AI_HANDOFF.md`**（项目根）：当前持有者、状态、真实路径、成果状态表、文件账本与 Codex 待办。
- 未提交成果以 `handoff-manifest.json`（相对路径、字节数、SHA-256）核对，HEAD 相同不代表成果一致。

## 事实来源

- 玩法规则唯一有效版本：`docs/BATTLE-PREVIEW-20260926/统一玩法规则-20260927.md`（含被替代的旧 C10 条款，§9）。
- 战斗界面规格：`docs/BATTLE-PREVIEW-20260926/战斗规格.md`（v3，以 `preview.js` 常量为准）。
- 用户已认可的视觉基线：`docs/BATTLE-PREVIEW-20260926/baseline-20260927-approved/`（只作对照，不修改）。
- Cocos 现状：`docs/BATTLE-PREVIEW-20260926/handoff/cocos-audit-20260927.md`。

## 项目约束

- 保留已认可的视觉方向、战场构图、四兵器表现与敌将交锋，不重新设计。
- 工作树含大量此前已有的未提交 / 未跟踪工作；不得 reset、clean、stash 或覆盖。提交、合并、发布按用户明确授权执行。
- 预览中的 `DEMO_LINEUP`、`autopilot`、调试按钮只用于演示，不作为正式数据或功能。
- 源素材在 `art-source/`，切片由 `art-source/battle-preview-20260926/slice.py` 生成到 `docs/BATTLE-PREVIEW-20260926/assets/gen/`；不要把必要资源只留在临时目录。

## 项目只读 MCP 开发交接

接到用户主动交来的 ChatGPT 任务书，先核对 `project_id=yilu-changge`、`baseline_snapshot_id`、HEAD 和 `code_fingerprint`；只比较本任务相关的新差异，不回滚现有 dirty 或无目的重新研究全仓。按已授权范围实现并记录实际检查／证据，最后用 `./tools/project-reader/yilu-bridge finalize --task 任务编号 --result 项目内结果文档.md` 更新快照。入口见 `docs/ai-bridge/RUNBOOK.md`。这属于 Codex 项目操作约定，不表示 ChatGPT 可自动执行本地 Skill、命令或写任务。
