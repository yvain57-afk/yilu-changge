# ChatGPT → Codex 任务书与复核

```text
任务 id：
目标：
project_id：yilu-changge
baseline_snapshot_id：
HEAD：
code_fingerprint：
evidence_fingerprint：
问题与证据：file_id / 相对路径 / 行号 / 哈希；截图 evidence_id；视频 id + 时间戳；run_id。
明确改动与涉及模块：
依赖顺序与验收方法：
已确认约束／不做事项：
风险与回滚（保护已有 dirty，不回滚整树）：
```

用户主动把该文件/文本交给当前 Codex；界面支持时可“添加到 Codex”。MCP 不自动写任务、不执行命令、不自动读全部聊天。Codex 比较基线与当前内容，仅核对受影响文件。版本前进则比较差异，不恢复旧基线覆盖新工作。

执行结果使用 done / partial / blocked，列真实验证命令、退出状态、画面和新快照。通过本地 capture-check 记录新检查，finalize 记录已发生事实、不重测。ChatGPT 新对话读取完成快照，逐项复核原任务，不发起无关优化。

接通验收提示词：

> 使用《一路长歌》项目只读助手，先报告活动平台、snapshot_id、两类指纹和资料版本关系；读取 FormalGame.ts 指定行并返回来源哈希。再实际调用 read_media 查看 channel-check.png，不读取答案文档，只说看到哪些形状、颜色和位置。随后读取 native-short-scene.png，描述武器、人物、道路、HUD；读取已导入短视频的第0和第1帧，报告时间戳与画面差异。若只有文字或图片无法读取，明确说明失败。最后只提出一项不改变玩法的资料核验任务，包含上述基线和验收要求。
