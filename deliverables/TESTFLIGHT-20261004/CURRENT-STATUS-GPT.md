# 一路长歌：三国｜当前完整状态与 GPT 协商入口

2026-10-04。本文区分游戏实现、构建、平台分发和实体手机状态。早期报告里的 HEAD、dirty、未上传等字样只描述当时；最新状态以本文和安装诊断为准。

## 版本身份

- 项目 `yilu-changge`，当前主路线 iOS Native / Cocos Creator 3.8.8，Web 辅助；微信路线延后，并未永久取消。
- 游戏版本 **0.12.8 / 2026100403**；代码指纹 `0f9797bb89081d2980e7d59794eef69108bc18c22bc169daf69f97a6512a221c`。
- 正式源集成提交 `e0e88e931de2d58283aa22937ad1a47a6b2b23c3`；本轮只有状态与诊断同步，不修改游戏实现或资源。
- GitHub `https://github.com/yvain57-afk/yilu-changge`，分支 `codex/ios-polish-round2-20260929`，草稿 PR #4 `https://github.com/yvain57-afk/yilu-changge/pull/4`；未合并 main，未提交 App Store 生产审核。

## 当前游戏与可核查交付

| 内容 | 已接入与证据 | 验收边界 |
|---|---|---|
| 二十关、十种兵器、兵器出征选择、里程碑/奖励/山河地图 | `assets/scripts/formal/`、`assets/resources/`；`deliverables/YILU-CAMPAIGN20-20260930/` | 老存档与现有规则保留；既有模拟器/模型记录不能代替最新版真机全关游玩 |
| 13 类实际非战斗页面与布局优化 | `FullMenu.ts`、`MenuLayout.ts`、相关 UI 组件；`deliverables/YILU_UI_POLISH_R2/` | 实际接入；资产拒收、动作缺口与小屏待验按对应报告保留，不称视觉全验收 |
| 敌军交战、受击减员、后背骑乘 | `deliverables/COMBAT-FLOW-20261003/`、`deliverables/BATTLE-FEEL-20261004/`（以仓库实际目录为准）及 `AI_HANDOFF.md` | 不以素材图代替运行证据；既有动作素材缺口未自动消失 |
| 最新首页构图、随兵力增加箭雨 | `deliverables/HOME-VOLLEY-20261004/REPORT.md` 与其中实际 PNG/MP4/状态 JSON | 该轮媒体对应 0.12.7 指纹，后续 0.12.8 为音乐接入；不能将旧媒体改标成最新指纹 |
| 同主题菜单/战斗原创音乐 | `deliverables/MUSIC-SHANHE-20261004/REPORT.md`、menu.mp3、battle.mp3、设置运行证据 | 38 项相关测试通过，但原生进程实际录音全静音；音频文件试听与无声设置录像均不算原生音乐发声通过 |
| 原兵器音效 | `deliverables/YILU-WEAPON-SFX-20260930/` 与实际 audio 资源 | 保留已认可音效；新音乐发声问题不能被旧音效验收覆盖 |

当前本地辅助试玩 `http://127.0.0.1:43220/`；此地址不能在 GPT 云端直接打开。MCP 固定快照或仓库文件可用于远程核查。

## 构建和检查

- Release Archive 成功、严格 codesign 检查通过；包内指纹和两首 PCM 哈希匹配。见 `archive-verification.json`。
- 最新全库记录 **452 通过 / 1 失败 / 0 跳过**，类型检查通过；本次只同步文档，不冒称重新执行全套游戏验证。
- 失败为 `tests/ios-playable.test.ts` 模型时长下限：第2关87.8s <90s，第11关108.75s <110s。模型通关检查通过，本轮没有为了通过检查改数值或删除测试。
- CocosGame dSYM 上传缺失；后续 dsymutil 虽匹配 UUID 但提示无 debug symbols，仍未解决。
- 真机最新音乐听验、性能、触控、后台恢复、最新版本完整流程尚未通过；高兵力与第11关稳定60 FPS 未达到已知验收目标。
- 最新动作缺口具体为：三种远程兵器各有一张独立行进身体帧、三张攻击姿态，四相独立步态和专用受击源图尚未齐；特殊兵种完整行走循环、各兵器完整独立身体攻击链仍有继承缺口。四马近战步态、受击/倒地新增帧已接入，不抵销上述缺口。

## TestFlight 与手机的实际状态

- ASC App ID `6818429253`，bundle `com.yvainair.yiluchangge`，team `325CW4AZ5L`。
- Apple 于 2026-10-04 18:53:55 北京时间确认上传成功，处理完成。内部组“开发自测”新构建正在测试，邀请已接受，用户实际看见 0.12.8。
- **安装失败**。19:53 用户配合重试，Console 捕获 `Downloading Install Data` 后 `Error Downloading Install Data`，code=-1、serverCode=200；下载与安装进度均 null，尚未取得安装数据。具体服务端原因未暴露。
- 实体 iPhone 16 Pro / iOS27，符合包内 iOS16+/arm64/Metal要求；实际回读仍 **0.12.5 /2026100304**。本轮没有卸载、覆盖安装或清档。
- 免费 App 协议有效。外部“朋友体验”0测试员/0构建，Beta 审核两次通用请求处理错误，不能写成等待审核。
- `BETA_CONTRACT_MISSING` 仅为类似案例线索，本账号尚未捕获该错误码。不能把网上案例当成已确认根因。
- Apple 技术支持草稿已准备但未发送；本地备份后同版本安装也尚未执行，相关授权仍未收到。授权 Git/GPT 同步不自动等于授权 Apple 工单或本地覆盖安装。

优先阅读 `INSTALL-DIAGNOSIS.md`、`upload-receipt.json`、`REPORT.md`、`APPLE-SUPPORT-DRAFT.md`。

## Git 同步边界

正式源、运行所需资源、近期交付截图/短片/报告已纳入现有提交。此次补充当前状态和故障诊断；历史 `evidence/v03/build-web-mobile-result.json` 仅既有构建时间戳变化，不作为当前验证结果。

历史录屏、重复导出、制作中间稿、私有存档、签名、账号截图与凭证继续本地保留。没有 reset/stash/clean 或删除。这是公开仓库的交付边界，不是丢弃 dirty 成果；未上传历史原始文件不能声称已在 GitHub。

## 请 GPT 一起判断

1. 核查当前身份、源代码与版本/媒体对应关系，指出报告不一致和遗漏。
2. 根据真实日志，给出 TestFlight 失败位置、仍需抓取的最小证据；区分已证实与假设，禁止无依据换 bundle、重打包、删测试员、清档或改全局设置。
3. 原生音乐实际发声失败如何从现有 `MusicDirector.ts`、`Platform.ts`、`AppDelegate.mm` 和诊断记录继续定位；不要把播放器时间推进视为有声。
4. 给出下一轮少量、按依赖排序的实施事项：先恢复可安装/可听体验，再以当前已认可游戏为基础补性能和动作/视觉缺口，不整体重做。
5. 明确哪些项需要用户授权/设备或 Apple 介入；仅提出评审结论，不替本地执行者宣布安装或验收成功。
