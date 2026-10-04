# 小型分析任务交接样例（尚未执行新的游戏开发）

任务 id：YILU-BRIDGE-READBACK-20260929  
目标：核验只读资料是否对应当前游戏，不修改玩法。  
project_id：yilu-changge  
baseline_snapshot_id：s_20260929T133543_7c20956e（本地已 pin）  
HEAD：79fbea0f8f135e6d9457cde672118b52baacb4b6  
code_fingerprint：cea5390c9f9fb2b13dbb85e689bb6fe39cea29d4cd5509ca1b4d2b20a64804b0  
evidence_fingerprint：3e66f54ac27069687e4d245b0c246625f693ceb39c55da62d0a03ee480ef7853

1. 用 read_source 读取 `f_120e058638fecf2251867a24` 的1–12行；源码哈希应为 `c9f241f1103b933cbd6e09221fc79f7b84d4bcfddaf6a13fbe845a7f8089950f`。这里应看到开发态诊断的导入。
2. 用 read_media 读取 `f_07a1588d9aa0764e94067ae4`，描述人物、兵器和路面，核对来源为模拟器、build_id以及 code_fingerprint。
3. 读取视频 `m_b04813ca4070408022ef812f` 第0和1帧，实际时间戳0.000与7.494秒；明确其版本为unknown，不冒称对应本轮源码。
4. read_runtime 核对一条 interval，分别列逻辑兵力与视口提交的人数，并保持GPU等缺失项为unavailable。

涉及模块：仅工具读取和核验；依赖顺序 overview → 固定快照 → 代码／画面／数据。验收：行号、哈希、图片视觉特征、时间戳均能复核；客户端看不到图片就报阻断。

已确认约束：保留游戏、dirty与存档，不执行数值修改、构建、推送、发布。风险：文件已更新时本基线仍是旧快照，请对比相关差异，不恢复旧源覆盖新工作。回滚：本任务无业务写入。

交给Codex的本地核对已进行：该snapshot存在且属于yilu-changge；game code_fingerprint与构建印记一致。ChatGPT端实际领取／作答和用户主动发送到Codex仍未发生，不能算已完成跨客户端交接。
